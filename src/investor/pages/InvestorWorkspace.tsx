import { useState, useEffect } from "react";
import { ArrowLeft, Filter, Sparkles, Database } from "lucide-react";
import { opportunityService, FilterState } from "../services/opportunityService";
import { Opportunity } from "../types";

import MapComponent from "../components/MapComponent";
import FilterPanel from "../components/FilterPanel";
import LocationDetails from "../components/LocationDetails";
import OpportunityList from "../components/OpportunityList";

interface InvestorWorkspaceProps {
  onBack?: () => void;
}

export default function InvestorWorkspace({ onBack }: InvestorWorkspaceProps) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [inspectedLocation, setInspectedLocation] = useState<Opportunity | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    state: "All India",
    budget: "Any budget",
    objective: "Balanced opportunity",
    opportunityLevel: "All",
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    opportunityService.getOpportunities(filters).then(data => {
      setOpportunities(data);
      // Clean initial state: do NOT auto-select anything so whole India is visible
    });
  }, [filters]);

  // Global Escape key listener: deselect and return to whole India view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedLocationId(null);
        setInspectedLocation(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleReset = () => {
    setSelectedLocationId(null);
    setInspectedLocation(null);
    setFilters({
      state: "All India",
      budget: "Any budget",
      objective: "Balanced opportunity",
      opportunityLevel: "All",
    });
  };

  // Only active when a location is explicitly selected
  const selectedLocation = selectedLocationId
    ? (opportunities.find(o => o.id === selectedLocationId) || 
       (inspectedLocation && inspectedLocation.id === selectedLocationId ? inspectedLocation : null))
    : null;

  const isInspected = Boolean(
    inspectedLocation && 
    selectedLocation?.id === inspectedLocation.id && 
    !opportunities.some(o => o.id === inspectedLocation.id)
  );

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans overflow-hidden">
      {/* Header */}
      <header className="border-b border-gray-800 px-4 py-2.5 flex items-center justify-between shrink-0 bg-black/90 backdrop-blur z-30">
        <div className="flex items-center gap-3.5">
          <button 
            type="button"
            onClick={onBack} 
            className="text-gray-400 hover:text-white transition-colors p-1 cursor-pointer"
            title="Back to Landing Page"
            aria-label="Back to Landing Page"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-brand-accent font-extrabold flex items-center gap-1.5">
              <span> Investor's Workspace</span>
              
            </div>
            <h1 className="text-base font-bold leading-none text-white">EV ChargePoint </h1>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Side: Filter Controls & Ranked Hotspots List */}
        <aside className={`w-84 border-r border-gray-800 bg-black flex flex-col shrink-0 absolute md:relative z-20 h-full transition-transform ${isFilterOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="p-3 border-b border-gray-800 flex justify-between items-center bg-gray-950/90">
            <h2 className="font-bold text-xs uppercase tracking-widest text-gray-300">Hotspot Discovery</h2>
            <button className="md:hidden text-gray-400" onClick={() => setIsFilterOpen(false)}>✕</button>
          </div>
          
          <FilterPanel 
            filters={filters} 
            onChange={setFilters} 
            resultCount={opportunities.length}
            onReset={handleReset}
          />
          
          <div className="flex-1 overflow-y-auto">
            <OpportunityList 
              opportunities={opportunities} 
              selectedId={selectedLocationId}
              onSelect={setSelectedLocationId}
            />
          </div>
        </aside>

        {/* Center Map Area */}
        <main className="flex-1 relative bg-[#090d16]">
          <MapComponent 
            opportunities={opportunities} 
            selectedId={selectedLocationId}
            onSelect={(id) => {
              setSelectedLocationId(id);
              if (inspectedLocation && inspectedLocation.id !== id) {
                setInspectedLocation(null);
              }
            }}
            selectedState={filters.state}
            inspectedLocation={inspectedLocation}
            onInspectLocation={(rto) => {
              setInspectedLocation(rto);
              setSelectedLocationId(rto.id);
            }}
          />
          
          {/* Mobile Filter Toggle */}
          <button 
            className="md:hidden absolute top-4 left-4 z-[400] bg-black border border-gray-700 p-2.5 rounded-lg shadow-lg text-white"
            onClick={() => setIsFilterOpen(true)}
          >
            <Filter size={18} />
          </button>
        </main>

        {/* Right Side: Selected Zone Intelligence & Auto Station Sizing */}
        {selectedLocation && (
          <aside className="w-full md:w-[420px] border-l border-gray-800 bg-black flex flex-col shrink-0 absolute md:relative z-30 h-full right-0 shadow-2xl">
            <LocationDetails 
              location={selectedLocation} 
              onClose={() => {
                setSelectedLocationId(null);
                setInspectedLocation(null);
              }}
              objective={filters.objective}
              budgetBand={filters.budget}
              isInspected={isInspected}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
