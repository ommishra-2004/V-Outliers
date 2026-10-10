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
    <div className="flex flex-col h-full bg-black">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex justify-between items-start shrink-0">
        <div>
          <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <MapPin size={12} className="text-brand-accent" />
            {location.state} / {location.districtOrCity}
          </div>
          <h2 className="text-lg font-bold leading-tight mb-2 text-white">{location.name}</h2>
          <div className="flex gap-2 items-center flex-wrap">
            
            <span className={`px-2.5 py-1 rounded text-xs uppercase font-extrabold tracking-wider ${
              location.opportunityBand === 'high' 
                ? 'bg-[#3687a9] text-white shadow-[0_0_12px_rgba(54,135,169,0.4)]' 
                : location.opportunityBand === 'medium'
                ? 'bg-[#00f5d4] text-black shadow-[0_0_12px_rgba(0,245,212,0.4)]'
                : 'bg-[#a78bfa]/20 text-[#a78bfa] border border-[#a78bfa]/40'
            }`}>
              {location.opportunityBand} Tier
            </span>
            <span className="px-2 py-1 rounded text-xs border border-gray-700 text-gray-200 font-mono font-semibold bg-gray-900">
              Score: {location.opportunityScore}/100
            </span>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white p-1">
          <X size={20} />
        </button>
      </div>

      {/* Real Data Highlights Pill Bar */}
      <div className="px-4 py-2.5 bg-gray-950 border-b border-gray-800 flex items-center justify-between text-[11px] text-gray-300">
        <div className="flex items-center gap-1.5">
          <Zap size={13} className="text-brand-accent" />
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
      <div className="flex border-b border-gray-800 shrink-0">
        <button 
          className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 ${activeTab === 'why' ? 'text-brand-accent border-b-2 border-brand-accent bg-gray-900/40' : 'text-gray-400 hover:text-gray-200'}`}
          onClick={() => setActiveTab('why')}
        >
          <HelpCircle size={16} />
          Why here?
        </button>
        <button 
          className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 ${activeTab === 'invest' ? 'text-brand-accent border-b-2 border-brand-accent bg-gray-900/40' : 'text-gray-400 hover:text-gray-200'}`}
          onClick={() => setActiveTab('invest')}
        >
          <Calculator size={16} />
          Investment Setup
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {activeTab === 'why' ? (
          <>
            {isInspected && (
              <div className="bg-cyan-950/20 border border-cyan-800/40 p-3 rounded-lg text-xs text-cyan-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-cyan-300 text-[11px]">
                  <span>🎯 Clicked Map Jurisdiction Insights</span>
                </div>
                <div className="text-[11px] text-gray-300 leading-relaxed">
                  Inspected via direct map coordinate selection. Ground data from the VAHAN National Portal verifies <strong>{location.totalRegistrations.toLocaleString()} registered EVs</strong>, <strong>{location.stationCount} existing public charging stations</strong>, and an EV-to-charger ratio of <strong>{location.evPerCharger} EVs/charger</strong> in this transport jurisdiction.
                </div>
              </div>
            )}

            {/* Real-time Dynamic Evidence Summary */}
            <div className="bg-gray-950 p-3.5 rounded-lg border border-gray-800 text-xs leading-relaxed text-gray-300 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-brand-accent font-bold uppercase tracking-wider text-[10px]">
                  Summary
                </span>
                <span className="text-[10px] bg-slate-900 border border-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                  Score: {location.opportunityScore}/100
                </span>
              </div>
              <p className="text-gray-200 leading-relaxed">
                {opportunityService.generateRealtimeWhyHere(location)}
              </p>
            </div>

            {/* Score Breakdown Chart */}
            <div>
              <h3 className="font-semibold mb-2.5 flex items-center justify-between text-xs uppercase tracking-wider text-gray-400">
                <span>Score Breakdown</span>
                
              </h3>
              <ExplainabilityChart factors={location.factors} />
            </div>
          </>
        ) : (
          <InvestmentCalculator location={location} budgetBand={budgetBand} />
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-800 shrink-0">
        <button 
          onClick={handleExportPdf}
          disabled={isExporting}
          className="w-full bg-brand-accent text-black font-extrabold py-2.5 px-4 rounded hover:bg-white transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 shadow-[0_0_15px_rgba(212,255,0,0.3)]"
        >
          <FileText size={16} />
          {isExporting ? "Compiling PDF Dossier..." : "Export Full Report (PDF)"}
        </button>
      </div>
    </div>
  );
}
