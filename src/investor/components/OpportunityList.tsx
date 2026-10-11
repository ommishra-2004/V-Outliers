import { Opportunity } from "../types";
import { ArrowUpRight, Search, Sun } from "lucide-react";

interface Props {
  opportunities: Opportunity[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function OpportunityList({ opportunities, selectedId, onSelect }: Props) {
  if (!opportunities.length) return <div className="opportunity-empty"><Search size={24} /><h3>No matching locations</h3><p>Try another city or broaden your filters.</p></div>;
  return <div className="opportunity-list">{opportunities.map((opp, idx) => (
    <button type="button" key={opp.id} onClick={() => onSelect(opp.id)} aria-pressed={selectedId === opp.id} className={`opportunity-card ${selectedId === opp.id ? 'is-selected' : ''}`}>
      <div className="opportunity-topline"><span>{String(idx + 1).padStart(2, '0')} <span> / {opp.state}</span></span><span className={`opportunity-score ${opp.opportunityBand}`}>{opp.opportunityScore}<small> / 100</small></span></div>
      <h3>{opp.name}<ArrowUpRight size={17} /></h3>
      <p className="opportunity-city">{opp.districtOrCity}</p>
      <div className="opportunity-metrics"><div><span>{opp.totalRegistrations ? 'Registered EVs' : 'EV demand index'}</span><strong>{opp.totalRegistrations ? opp.totalRegistrations.toLocaleString('en-IN') : opp.evDemandIndex}</strong></div><div><span>{opp.evPerCharger ? 'EVs / charger' : 'Charging gap index'}</span><strong>{opp.evPerCharger || opp.chargingGapIndex}</strong></div></div>
      <div className="opportunity-footer"><span><Sun size={13} />{opp.solarUnitsPerKwMonth ? `${opp.solarUnitsPerKwMonth} kWh/kW/mo` : `${opp.solarPotentialIndex} solar index`}</span><span>{opp.estimatedBudgetBand}</span></div>
    </button>
  ))}</div>;
}
