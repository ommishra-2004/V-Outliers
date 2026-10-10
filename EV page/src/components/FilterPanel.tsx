import { FilterState, opportunityService } from "../services/opportunityService";
import { MapPin, Target, Wallet, Award, RotateCcw } from "lucide-react";

interface Props {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  resultCount: number;
  onReset?: () => void;
}

export default function FilterPanel({ filters, onChange, resultCount, onReset }: Props) {
  const availableStates = opportunityService.getAvailableStates();

  const updateFilter = (key: keyof FilterState, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onChange({
      state: "All India",
      budget: "Any budget",
      objective: "Balanced opportunity",
      opportunityLevel: "All",
    });
    if (onReset) {
      onReset();
    }
  };

  return (
    <div className="p-4 border-b border-gray-800 bg-gray-950/70">
      <div className="flex justify-between items-center mb-3.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-white">Investment Filter</span>
          
        </div>
        <button 
          onClick={resetFilters} 
          className="text-[11px] text-gray-400 hover:text-brand-accent flex items-center gap-1 transition-colors"
        >
          <RotateCcw size={11} />
          Reset
        </button>
      </div>

      <div className="space-y-3.5">
        {/* 1. Geographic Location */}
        <div>
          <label className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-gray-400 mb-1 font-semibold">
            <MapPin size={12} className="text-brand-accent" />
            Location (State/Region)
          </label>
          <select 
            className="w-full bg-black border border-gray-800 rounded p-2 text-xs focus:border-brand-accent focus:ring-1 focus:ring-brand-accent outline-none text-white font-medium cursor-pointer"
            value={filters.state || "All India"}
            onChange={(e) => updateFilter("state", e.target.value)}
          >
            {availableStates.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        {/* 2. Investment Objective */}
        <div>
          <label className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-gray-400 mb-1 font-semibold">
            <Target size={12} className="text-blue-400" />
            Investment Objective
          </label>
          <select 
            className="w-full bg-black border border-gray-800 rounded p-2 text-xs focus:border-brand-accent focus:ring-1 focus:ring-brand-accent outline-none text-white font-medium cursor-pointer"
            value={filters.objective}
            onChange={(e) => updateFilter("objective", e.target.value)}
          >
            <option value="Balanced opportunity">Balanced Strategy (Precalculated Score)</option>
            <option value="Maximize projected ROI">Maximize ROI (Volume & High Solar)</option>
            <option value="Shorter payback">Shorter Payback (Severe Charging Gap)</option>
          </select>
        </div>

        {/* 3. Budget Band */}
        <div>
          <label className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-gray-400 mb-1 font-semibold">
            <Wallet size={12} className="text-emerald-400" />
            Budget Band (CAPEX Tier)
          </label>
          <select 
            className="w-full bg-black border border-gray-800 rounded p-2 text-xs focus:border-brand-accent focus:ring-1 focus:ring-brand-accent outline-none text-white font-medium cursor-pointer"
            value={filters.budget}
            onChange={(e) => updateFilter("budget", e.target.value)}
          >
            <option value="Any budget">Any Budget (All Tiers)</option>
            <option value="₹25L – ₹50L">₹25L – ₹50L (Compact Quick-Charge)</option>
            <option value="₹50L – ₹1.2Cr">₹50L – ₹1.2Cr (Standard Commercial Hub)</option>
            <option value="> ₹1.2Cr">&gt; ₹1.2Cr (Flagship Transit Plaza)</option>
          </select>
        </div>

        {/* 4. Opportunity Tier */}
        <div>
          <label className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-gray-400 mb-1 font-semibold">
            <Award size={12} className="text-amber-400" />
            Opportunity Tier
          </label>
          <div className="grid grid-cols-4 gap-1.5 text-xs font-semibold">
            {(["All", "High", "Medium", "Low"] as const).map(tier => {
              const active = (filters.opportunityLevel || "All").toLowerCase() === tier.toLowerCase();
              return (
                <button
                  key={tier}
                  onClick={() => updateFilter("opportunityLevel", tier)}
                  className={`py-1.5 rounded border text-center transition-all ${
                    active
                      ? "bg-brand-accent text-black border-brand-accent font-bold shadow-[0_0_8px_rgba(212,255,0,0.3)]"
                      : "bg-black border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
                  }`}
                >
                  {tier}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
