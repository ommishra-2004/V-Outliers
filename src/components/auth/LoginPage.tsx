import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sun, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Zap
} from 'lucide-react';
import { useSolarStore } from '../../store/solarStore';
import { loginUser, signupUser, forgotPasswordRequest } from '../../services/api';

interface LoginPageProps {
  onSuccess: (role: 'individual' | 'investor') => void;
  onBackToHome: () => void;
}

export default function LoginPage({ onSuccess, onBackToHome }: LoginPageProps) {
  const { setUser } = useSolarStore();

  const [role, setRole] = useState<'individual' | 'investor'>('individual');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);

  const validate = () => {
    setError(null);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setError('Please enter your email address.');
      return false;
    }
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (!password) {
      setError('Please enter your password.');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'signin') {
        const user = await loginUser(email, password);
        setUser(user);
        onSuccess(role);
      } else {
        const user = await signupUser(email, password, name || undefined);
        setUser(user);
        onSuccess(role);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoFill = () => {
    if (role === 'individual') {
      setEmail('rahul.verma@example.com');
      setPassword('SuryaPunk2026!');
    } else {
      setEmail('investor.arjun@greengrid.in');
      setPassword('InvestorEV2026!');
    }
    setError(null);
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    try {
      const msg = await forgotPasswordRequest(forgotEmail);
      setForgotSuccess(msg);
    } catch {
      setForgotSuccess(`Password reset instructions have been sent to ${forgotEmail}.`);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between relative overflow-hidden font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* ── Global Style Override for Browser Autofill Bug ── */}
      <style dangerouslySetInnerHTML={{__html: `
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active{
            -webkit-box-shadow: 0 0 0 30px #0f172a inset !important;
            -webkit-text-fill-color: white !important;
            transition: background-color 5000s ease-in-out 0s;
        }
      `}} />

      {/* ── Creative Ambient Background ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] bg-emerald-500/20 rounded-full mix-blend-screen filter blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-teal-600/20 rounded-full mix-blend-screen filter blur-[130px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.8) 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      {/* ── Top Navigation ── */}
      <header className="relative z-20 px-8 py-8 flex items-center justify-between">
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors cursor-pointer group bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/5"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-emerald-400" />
          <span>Return Home</span>
        </button>

        <div className="flex items-center gap-2 text-white font-bold text-2xl tracking-tight select-none">
          <Sun className="text-emerald-400 w-7 h-7" />
          <span>Surya<span className="text-emerald-400 font-light">Punk</span></span>
        </div>
      </header>

      {/* ── Central Glass Login Card ── */}
      <main className="relative z-10 flex-grow flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[440px]"
        >
          <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 sm:p-10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] relative overflow-hidden group/card">
            
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent opacity-50" />
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-[60px] pointer-events-none transition-opacity group-hover/card:opacity-100 opacity-50" />

            {/* Header */}
            <div className="flex flex-col items-center text-center mb-6 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center mb-4 shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-500/10" />
                <Zap className="w-8 h-8 text-emerald-400 relative z-10" />
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
                {mode === 'signin' ? 'Welcome back' : 'Join SuryaPunk'}
              </h1>
              <p className="text-sm text-slate-400 font-medium">
                {role === 'individual'
                  ? (mode === 'signin' ? 'Sign in to access your solar sizing dashboard.' : 'Start your journey to solar independence.')
                  : (mode === 'signin' ? 'Sign in to access EV charging & microgrid opportunities.' : 'Start investing in EV charging stations.')
                }
              </p>
            </div>

            {/* Account Type Selector: Individual vs Investor */}
            <div className="mb-6 p-1 bg-black/30 border border-white/10 rounded-2xl grid grid-cols-2 gap-1 relative z-10">
              <button
                type="button"
                onClick={() => {
                  setRole('individual');
                  setError(null);
                }}
                className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  role === 'individual'
                    ? 'bg-gradient-to-r from-emerald-500/25 to-lime-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Sun className={`w-4 h-4 ${role === 'individual' ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>Individual</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole('investor');
                  setError(null);
                }}
                className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  role === 'investor'
                    ? 'bg-gradient-to-r from-emerald-500/25 to-lime-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Zap className={`w-4 h-4 ${role === 'investor' ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>Investor</span>
              </button>
            </div>

            {/* Error Notification */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="overflow-hidden relative z-10"
                >
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              
              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 ml-1 uppercase tracking-wider">Full Name</label>
                  <div className="flex items-center w-full bg-black/20 border border-white/5 rounded-2xl focus-within:border-emerald-500/50 focus-within:bg-black/40 focus-within:ring-1 focus-within:ring-emerald-500/50 transition-all">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Rahul Sharma"
                      className="w-full bg-transparent px-5 py-4 text-sm text-white placeholder:text-slate-600 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Flexbox Email Input (Overlap Proof) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 ml-1 uppercase tracking-wider">Email Address</label>
                <div className="flex items-center w-full bg-black/20 border border-white/5 rounded-2xl focus-within:border-emerald-500/50 focus-within:bg-black/40 focus-within:ring-1 focus-within:ring-emerald-500/50 transition-all group">
                  <div className="pl-5 pr-3 flex items-center justify-center text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="name@domain.com"
                    autoComplete="email"
                    className="w-full bg-transparent py-4 pr-5 text-sm text-white placeholder:text-slate-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Flexbox Password Input (Overlap Proof) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1 pr-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(email);
                        setForgotSuccess(null);
                        setForgotModalOpen(true);
                      }}
                      className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer select-none"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                <div className="flex items-center w-full bg-black/20 border border-white/5 rounded-2xl focus-within:border-emerald-500/50 focus-within:bg-black/40 focus-within:ring-1 focus-within:ring-emerald-500/50 transition-all group">
                  <div className="pl-5 pr-3 flex items-center justify-center text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full bg-transparent py-4 text-sm text-white placeholder:text-slate-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="pr-5 pl-3 flex items-center justify-center text-slate-500 hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Primary Action Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm tracking-wide shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>
                        {mode === 'signin' 
                          ? (role === 'individual' ? 'Sign In as Individual' : 'Sign In as Investor')
                          : (role === 'individual' ? 'Create Individual Account' : 'Create Investor Account')
                        }
                      </span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>

            </form>

            {/* Bottom Actions */}
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col items-center gap-4 relative z-10">
              
              {mode === 'signin' ? (
                <p className="text-sm text-slate-400">
                  New to SuryaPunk?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError(null);
                    }}
                    className="font-bold text-white hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    Create an account
                  </button>
                </p>
              ) : (
                <p className="text-sm text-slate-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setError(null);
                    }}
                    className="font-bold text-white hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    Sign in here
                  </button>
                </p>
              )}

              <button
                type="button"
                onClick={handleDemoFill}
                className="mt-2 text-xs text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer py-2 px-4 rounded-full backdrop-blur-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Fill Demo ({role === 'individual' ? 'Individual Solar' : 'Investor EV'})</span>
              </button>

            </div>

          </div>
        </motion.div>
      </main>

      {/* ── Forgot Password Modal ── */}
      <AnimatePresence>
        {forgotModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-lg">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-slate-900 border border-white/10 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl space-y-6 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />

              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-emerald-400" />
                  <span>Reset Password</span>
                </h3>
                <button
                  onClick={() => setForgotModalOpen(false)}
                  className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {forgotSuccess ? (
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm space-y-4">
                  <div className="flex items-center gap-2 font-bold text-emerald-400">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>Instructions Sent</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-sm">
                    {forgotSuccess}
                  </p>
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="w-full py-3.5 bg-emerald-500 text-slate-950 font-bold rounded-xl text-sm hover:bg-emerald-400 transition-colors cursor-pointer mt-2"
                  >
                    Return to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-5 text-left">
                  <p className="text-sm text-slate-400">
                    Enter your email to receive a password reset secure link.
                  </p>
                  <div className="flex items-center w-full bg-black/20 border border-white/10 rounded-2xl focus-within:border-emerald-500/50 focus-within:bg-black/40 focus-within:ring-1 focus-within:ring-emerald-500/50 transition-all group">
                    <div className="pl-5 pr-3 flex items-center justify-center text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="w-full bg-transparent py-4 pr-5 text-sm text-white placeholder:text-slate-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotModalOpen(false)}
                      className="w-1/2 py-3.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-semibold hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-1/2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-sm font-bold shadow-md hover:from-emerald-400 hover:to-teal-300 transition-all cursor-pointer"
                    >
                      {forgotLoading ? 'Sending...' : 'Send Link'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Footer ── */}
      <footer className="relative z-20 px-4 py-8 text-center text-sm font-medium text-slate-500">
        <span>© 2026 SuryaPunk India • Clean Energy Platform</span>
      </footer>

    </div>
  );
}