import { useState } from "react";
import { X, FileText, Calculator, HelpCircle, AlertTriangle, Database, Zap, MapPin, Sun } from "lucide-react";
import { Opportunity } from "../types";
import { opportunityService } from "../services/opportunityService";
import { generateOpportunityReport } from "../services/reportService";
import ExplainabilityChart from "./ExplainabilityChart";
import InvestmentCalculator from "./InvestmentCalculator";

interface Props {
  location: Opportunity;
  onClose: () => void;
  objective?: string;
  budgetBand?: string;
  isInspected?: boolean;
}

export default function LocationDetails({ 
  location, 
  onClose, 
  objective = "Balanced opportunity",
  budgetBand = "Any budget",
  isInspected = false
}: Props) {
  const [activeTab, setActiveTab] = useState<'why' | 'invest'>('why');
  const [isExporting, setIsExporting] = useState(false);

  const config = opportunityService.getFeasibleStationConfiguration(location, budgetBand, "purchase");

  const handleExportPdf = () => {
    setIsExporting(true);
    try {
      generateOpportunityReport(location, config, objective);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF report.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#070b0e]">
      {/* Header */}
      <div className="p-5 border-b border-white/10 flex justify-between items-start shrink-0 bg-[#090e13]/90 backdrop-blur-xl">
        <div>
          <div className="text-xs text-slate-400 mb-1.5 flex items-center gap-1.5">
            <MapPin size={12} className="text-emerald-400" />
            <span>{location.state} • {location.districtOrCity}</span>
          </div>
          <h2 className="text-lg font-bold leading-tight mb-2.5 text-white tracking-tight">{location.name}</h2>
          <div className="flex gap-2 items-center flex-wrap">
            <span className={`px-2.5 py-1 rounded-lg text-xs uppercase font-extrabold tracking-wider border ${
              location.opportunityBand === 'high' 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]' 
                : location.opportunityBand === 'medium'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'bg-slate-800 text-slate-300 border-white/10'
            }`}>
              {location.opportunityBand} Tier
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs border border-white/10 text-slate-200 font-mono font-bold bg-slate-900/80">
              Score: {location.opportunityScore}/100
            </span>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          title="Close details"
        >
          <X size={16} />
        </button>
      </div>

      {/* Real Data Highlights Pill Bar */}
      <div className="px-5 py-3 bg-slate-950/80 border-b border-white/10 flex items-center justify-between text-xs text-slate-300 flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <Zap size={13} className="text-emerald-400" />
          <span><strong>{location.totalRegistrations.toLocaleString()}</strong> EVs Fleet</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>Ratio: <strong>{location.evPerCharger}</strong> EVs/charger</span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-300">
          <Sun size={12} className="text-amber-400" />
          <span><strong>{location.solarUnitsPerKwMonth}</strong> kWh/kW/mo</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 shrink-0 bg-slate-950/40">
        <button 
          className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'why' 
              ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/10' 
              : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
          }`}
          onClick={() => setActiveTab('why')}
        >
          <HelpCircle size={15} />
          Why here?
        </button>
        <button 
          className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'invest' 
              ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/10' 
              : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
          }`}
          onClick={() => setActiveTab('invest')}
        >
          <Calculator size={15} />
          Investment Setup
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {activeTab === 'why' ? (
          <>
            {isInspected && (
              <div className="bg-cyan-950/30 border border-cyan-800/40 p-4 rounded-xl text-xs text-cyan-200 space-y-1.5 shadow-sm">
                <div className="font-bold flex items-center gap-1.5 text-cyan-300 text-xs">
                  <span>🎯 Clicked Map Jurisdiction Insights</span>
                </div>
                <div className="text-[11px] text-slate-300 leading-relaxed">
                  Inspected via direct map coordinate selection. Ground data from the VAHAN National Portal verifies <strong>{location.totalRegistrations.toLocaleString()} registered EVs</strong>, <strong>{location.stationCount} existing public charging stations</strong>, and an EV-to-charger ratio of <strong>{location.evPerCharger} EVs/charger</strong> in this transport jurisdiction.
                </div>
              </div>
            )}

            {/* Real-time Dynamic Evidence Summary */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-white/10 text-xs leading-relaxed text-slate-300 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                  Investment Viability Summary
                </span>
                <span className="text-[10px] bg-slate-950 border border-white/10 text-slate-300 px-2 py-0.5 rounded font-mono">
                  Score: {location.opportunityScore}/100
                </span>
              </div>
              <p className="text-slate-200 leading-relaxed text-xs">
                {opportunityService.generateRealtimeWhyHere(location)}
              </p>
            </div>

            {/* Score Breakdown Chart */}
            <div>
              <h3 className="font-bold mb-3 flex items-center justify-between text-xs uppercase tracking-wider text-slate-300">
                <span>Score Breakdown Matrix</span>
              </h3>
              <ExplainabilityChart factors={location.factors} />
            </div>
          </>
        ) : (
          <InvestmentCalculator location={location} budgetBand={budgetBand} />
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-white/10 shrink-0 bg-[#090e13]/90">
        <button 
          onClick={handleExportPdf}
          disabled={isExporting}
          className="w-full bg-gradient-to-r from-emerald-500 to-lime-500 text-slate-950 font-black py-3 px-5 rounded-xl hover:opacity-95 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer"
        >
          <FileText size={16} />
          {isExporting ? "Compiling PDF Dossier..." : "Export Full Report (PDF)"}
        </button>
      </div>
    </div>
  );
}
