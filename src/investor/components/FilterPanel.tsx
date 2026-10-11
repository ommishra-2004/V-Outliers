import { useState } from "react";
import { FilterState, opportunityService } from "../services/opportunityService";
import {
  MapPin,
  RotateCcw,
  ChevronDown,
  SlidersHorizontal,
  Search,
  X
} from "lucide-react";

interface Props {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  resultCount: number;
  onReset?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export default function FilterPanel({
  filters,
  onChange,
  resultCount,
  onReset,
  searchQuery = "",
  onSearchChange
}: Props) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
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
    if (onSearchChange) onSearchChange("");
    if (onReset) onReset();
  };

  const isAdvancedFiltered = filters.budget !== "Any budget" || filters.objective !== "Balanced opportunity";
  const isAnyFiltered = filters.state !== "All India" ||
                       filters.opportunityLevel !== "All" ||
                       isAdvancedFiltered ||
                       searchQuery.trim().length > 0;

  return (
    <div className="investor-filters">
      {onSearchChange && <div className="investor-search"><Search size={17} /><input aria-label="Search locations" placeholder="Search a city or district" value={searchQuery} onChange={e => onSearchChange(e.target.value)} />{searchQuery && <button aria-label="Clear search" onClick={() => onSearchChange('')}><X size={15} /></button>}</div>}
      <div className="investor-filter-row"><div className="investor-select"><MapPin size={15} /><select aria-label="State" value={filters.state || 'All India'} onChange={e => updateFilter('state', e.target.value)}>{availableStates.map(state => <option key={state}>{state}</option>)}</select><ChevronDown size={14} /></div><button className={`investor-refine ${isAdvancedOpen || isAdvancedFiltered ? 'is-active' : ''}`} aria-expanded={isAdvancedOpen} onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}><SlidersHorizontal size={15} /> Filters{isAdvancedFiltered && <span className="filter-dot" />}</button></div>
      {isAdvancedOpen && <div className="investor-advanced"><label>Investment strategy<select value={filters.objective} onChange={e => updateFilter('objective', e.target.value)}><option>Balanced opportunity</option><option>Maximize projected ROI</option><option>Shorter payback</option></select></label><label>Budget (CAPEX)<select value={filters.budget} onChange={e => updateFilter('budget', e.target.value)}><option>Any budget</option><option>₹25L – ₹50L</option><option>₹50L – ₹1.2Cr</option><option>&gt; ₹1.2Cr</option></select></label></div>}
      <div className="investor-tier-tabs" aria-label="Opportunity level">{['All', 'High', 'Medium'].map(tier => <button key={tier} aria-pressed={filters.opportunityLevel.toLowerCase() === tier.toLowerCase()} onClick={() => updateFilter('opportunityLevel', tier)}>{tier === 'All' ? 'All opportunities' : `${tier} potential`}</button>)}</div>
      <div className="investor-result-count"><span>{resultCount} locations to explore</span>{isAnyFiltered && <button onClick={resetFilters}><RotateCcw size={12} /> Reset</button>}</div>
    </div>
  );
}
