import { Opportunity } from "../types";
import { Battery, Zap, Sun } from "lucide-react";

interface Props {
  opportunities: Opportunity[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function OpportunityList({ opportunities, selectedId, onSelect }: Props) {
  if (opportunities.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 text-xs">
        No opportunities match the current filter selection.
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {opportunities.map((opp, idx) => (
        <div 
          key={opp.id}
          onClick={() => onSelect(opp.id)}
          className={`p-3.5 border-b border-gray-800 cursor-pointer transition-colors ${
            selectedId === opp.id 
              ? 'bg-brand-accent/10 border-l-4 border-l-brand-accent' 
              : 'hover:bg-gray-900 border-l-4 border-l-transparent'
          }`}
        >
          <div className="flex justify-between items-start mb-1.5">
            <div>
              <div className="text-[11px] text-gray-400 flex items-center gap-1.5 mb-0.5">
                <span className="font-mono text-gray-500 font-bold">#{idx + 1}</span>
                <span>•</span>
                <span>{opp.districtOrCity}, {opp.state}</span>
              </div>
              <h4 className="font-semibold text-xs leading-tight text-white">{opp.name}</h4>
            </div>
            <div className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
              opp.opportunityBand === 'high' 
                ? 'bg-[#3687a9] text-white' 
                : opp.opportunityBand === 'medium'
                ? 'bg-[#00f5d4] text-black font-extrabold'
                : 'bg-[#a78bfa]/20 text-[#a78bfa] border border-[#a78bfa]/40'
            }`}>
              {opp.opportunityScore}
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-2.5">
            <div className="flex items-center gap-1 text-gray-300" title="Total EV Registrations">
              <Zap size={11} className="text-brand-accent" />
              <span>{opp.totalRegistrations ? `${(opp.totalRegistrations / 1000).toFixed(1)}k EVs` : `${opp.evDemandIndex}`}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-300" title="Charging Gap (EVs / Charger)">
              <Battery size={11} className="text-amber-400" />
              <span>{opp.evPerCharger ? `${opp.evPerCharger} /chr` : `${opp.chargingGapIndex}`}</span>
            </div>
            <div className="flex items-center gap-1 text-yellow-400" title="State Solar Yield (kWh/kW/month)">
              <Sun size={11} />
              <span>{opp.solarUnitsPerKwMonth ? `${opp.solarUnitsPerKwMonth} u/mo` : `${opp.solarPotentialIndex}`}</span>
            </div>
            <div className="ml-auto text-[10px] text-gray-300 border border-gray-700 px-1.5 py-0.5 rounded bg-gray-900">
              {opp.estimatedBudgetBand}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
