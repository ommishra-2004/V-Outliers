import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSolarStore } from '../../store/solarStore';
import { chatWithAssistant } from '../../services/api';
import { MessageSquare, X, Send, Sparkles, User, MapPin, RefreshCw } from 'lucide-react';

const QUICK_PROMPTS = [
  "How much subsidy for 3 kW?",
  "What top-up subsidy in my state?",
  "SBI Surya Ghar loan details?",
  "How many units does 1 panel produce?",
  "Documents needed for DISCOM approval?",
  "Explain Net Metering in simple terms"
];

// Clean formatting component for structured assistant replies
function FormattedMessage({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let tableRows: string[][] = [];
  let inTable = false;

  const renderInline = (text: string) => {
    const parts: React.ReactNode[] = [];
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let lastIdx = 0;
    let match;

    const formatBold = (sub: string, subKey: string) => {
      const boldParts = sub.split(/(\*\*[^*]+\*\*)/g);
      return boldParts.map((bp, bIdx) => {
        if (bp.startsWith('**') && bp.endsWith('**')) {
          return (
            <strong key={`${subKey}-b-${bIdx}`} className="font-semibold text-emerald-300">
              {bp.slice(2, -2)}
            </strong>
          );
        }
        return bp;
      });
    };

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push(...formatBold(text.slice(lastIdx, match.index), `lpre-${match.index}`));
      }
      parts.push(
        <a
          key={`link-${match.index}`}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-400 underline font-medium hover:text-emerald-300 transition-colors"
        >
          {match[1]}
        </a>
      );
      lastIdx = linkRegex.lastIndex;
    }

    if (lastIdx < text.length) {
      parts.push(...formatBold(text.slice(lastIdx), `tail-${lastIdx}`));
    }

    return parts;
  };

  const flushTable = (key: string) => {
    if (tableRows.length > 0) {
      const header = tableRows[0];
      const body = tableRows.slice(1).filter(r => !r.every(c => c.includes('---') || c.includes(':--')));
      elements.push(
        <div key={key} className="overflow-x-auto my-2 border border-white/10 rounded-lg text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/90 border-b border-white/10 text-emerald-300 font-semibold">
                {header.map((col, idx) => (
                  <th key={idx} className="p-2 border-r border-white/5 last:border-none">{renderInline(col.trim())}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, rIdx) => (
                <tr key={rIdx} className="border-b border-white/5 last:border-none odd:bg-white/[0.02]">
                  {row.map((col, cIdx) => (
                    <td key={cIdx} className="p-2 border-r border-white/5 last:border-none text-slate-300">{renderInline(col.trim())}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }
  };

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      inTable = true;
      const cols = trimmed.slice(1, -1).split('|');
      tableRows.push(cols);
      return;
    } else if (inTable) {
      flushTable(`table-${lineIdx}`);
    }

    if (!trimmed) {
      elements.push(<div key={`sp-${lineIdx}`} className="h-1.5" />);
      return;
    }

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={`h3-${lineIdx}`} className="font-bold text-emerald-400 text-sm mt-3 mb-1.5 flex items-center gap-1.5">
          {renderInline(trimmed.slice(4))}
        </h4>
      );
      return;
    }

    if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      elements.push(
        <h3 key={`h2-${lineIdx}`} className="font-bold text-white text-base mt-3 mb-1.5">
          {renderInline(trimmed.replace(/^#+\s*/, ''))}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <div key={`li-${lineIdx}`} className="flex items-start gap-2 ml-1 text-xs sm:text-sm text-slate-300 my-1 leading-relaxed">
          <span className="text-emerald-400 mt-1 shrink-0 text-xs">●</span>
          <span>{renderInline(trimmed.slice(2))}</span>
        </div>
      );
      return;
    }

    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <div key={`num-${lineIdx}`} className="flex items-start gap-2 ml-1 text-xs sm:text-sm text-slate-300 my-1 leading-relaxed">
          <span className="font-bold text-emerald-400 shrink-0 text-xs mt-0.5">{numMatch[1]}.</span>
          <span>{renderInline(numMatch[2])}</span>
        </div>
      );
      return;
    }

    elements.push(
      <p key={`p-${lineIdx}`} className="text-xs sm:text-sm text-slate-200 my-1 leading-relaxed">
        {renderInline(trimmed)}
      </p>
    );
  });

  if (inTable) {
    flushTable(`table-end`);
  }

  return <div className="space-y-0.5">{elements}</div>;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const { chatMessages, addChatMessage, siteInput } = useSolarStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isTyping, isOpen]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg = { role: 'user' as const, content: text };
    addChatMessage(userMsg);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await chatWithAssistant([...chatMessages, userMsg], siteInput.state);
      addChatMessage({
        role: 'assistant',
        content: response.reply,
        sources: response.sources
      });
    } catch {
      addChatMessage({
        role: 'assistant',
        content: "I am having temporary trouble reaching the knowledge service. However, under **PM Surya Ghar**, you can claim up to **₹78,000** for a 3 kW system, and SBI offers 5.75% solar loans!",
        sources: ["PM Surya Ghar National Portal"]
      });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 text-slate-900 shadow-xl hover:shadow-[0_0_25px_rgba(16,185,129,0.55)] transition-all z-40 transform hover:scale-105 active:scale-95 ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
        aria-label="Open Solar AI Assistant"
      >
        <div className="relative">
          <MessageSquare className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full animate-ping" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full" />
        </div>
      </button>

      {/* Slide-over Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[440px] bg-slate-950 border-l border-white/15 shadow-2xl z-[100000] flex flex-col font-sans"
          >
            {/* Header */}
            <div className="px-4 py-3.5 border-b border-white/10 bg-slate-900/95 backdrop-blur-md flex justify-between items-center shrink-0">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-lime-400 flex items-center justify-center shrink-0 shadow-sm text-slate-950">
                  <Sparkles className="w-4 h-4 fill-current" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-400 font-bold text-sm truncate">SuryaPunk AI Advisor</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="truncate">Active Context: {siteInput.state || "All India (MNRE)"}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-300 hover:text-white rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-white/15 transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 flex items-center justify-center shrink-0"
                title="Close chat"
                aria-label="Close chat"
              >
                <X className="w-5 h-5 text-emerald-400" />
              </button>
            </div>

            {/* Quick Prompts Bar */}
            <div className="px-3 py-2.5 overflow-x-auto whitespace-nowrap border-b border-white/5 bg-slate-900/50 flex gap-2 no-scrollbar shrink-0">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="inline-block px-3 py-1.5 text-xs bg-slate-800/80 text-slate-300 rounded-full border border-white/10 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/40 transition-all shrink-0 cursor-pointer active:scale-95"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {/* Welcoming Card when chat is pristine */}
              {chatMessages.length === 0 && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-900/90 border border-emerald-500/20 text-slate-200 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
                    <span>Namaste! I am your SuryaPunk AI Solar Advisor.</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    I am trained on the latest 2024–2025 <strong>PM Surya Ghar Muft Bijli Yojana</strong> guidelines, state DISCOM policies, and technical sizing:
                  </p>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-800/70 border border-white/5">
                      <span className="text-base leading-none mt-0.5">💰</span>
                      <div>
                        <strong className="text-emerald-300">Up to ₹78,000 Central CFA</strong>
                        <p className="text-[11px] text-slate-400">Plus state top-ups (UP: ₹30k extra, Delhi: ₹3/unit GBI)</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-800/70 border border-white/5">
                      <span className="text-base leading-none mt-0.5">🏦</span>
                      <div>
                        <strong className="text-emerald-300">SBI Surya Ghar Loan</strong>
                        <p className="text-[11px] text-slate-400">Collateral-free up to ₹2 Lakh, ~5.75% rate, 10-yr tenure</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-800/70 border border-white/5">
                      <span className="text-base leading-none mt-0.5">⚡</span>
                      <div>
                        <strong className="text-emerald-300">Technical Sizing & Yield</strong>
                        <p className="text-[11px] text-slate-400">1 panel makes ~1.8 units/day; 1 kW needs ~100 sq ft</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1 italic">
                    💡 Click any chip above or type any question below to begin!
                  </p>
                </div>
              )}

              {/* Chat Messages */}
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-[90%] sm:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      msg.role === 'user' ? 'bg-slate-700 ml-2.5 text-slate-200' : 'bg-emerald-500/20 mr-2.5 text-emerald-400'
                    }`}>
                      {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                    </div>
                    
                    <div className={`p-3.5 rounded-2xl text-sm ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-none shadow-md font-medium' 
                        : 'bg-slate-900 border border-white/10 text-slate-200 rounded-tl-none shadow-lg'
                    }`}>
                      {msg.role === 'user' ? (
                        <p className="text-xs sm:text-sm whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div>
                          <FormattedMessage content={msg.content} />
                          {msg.sources && msg.sources.length > 0 && (
                            <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap gap-1.5 items-center">
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Sources:</span>
                              {msg.sources.map((src, sIdx) => (
                                <span key={sIdx} className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                  {src}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex flex-row max-w-[85%] items-center">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/20 mr-2.5 flex items-center justify-center flex-shrink-0 text-emerald-400">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-900 border border-white/10 rounded-tl-none flex items-center space-x-1.5">
                      <span className="text-xs text-slate-400 mr-1.5">Analyzing solar guidelines</span>
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3.5 border-t border-white/10 bg-slate-900/90 backdrop-blur-md shrink-0">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(inputText); }}
                className="flex items-center space-x-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask about subsidies, loans, panel units..."
                  className="flex-grow bg-slate-800/90 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isTyping}
                  className="p-2.5 bg-gradient-to-r from-emerald-500 to-lime-500 text-slate-950 font-bold rounded-xl hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md shrink-0"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
