import { useState, useEffect } from "react";
import { ArrowLeft, Filter, Sun, X, ArrowUpRight } from "lucide-react";
import { opportunityService, FilterState } from "../services/opportunityService";
import { Opportunity } from "../types";
import "../investor.css";

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
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    opportunityService.getOpportunities(filters).then(data => {
      setOpportunities(data);
      // Clean initial state: do NOT auto-select anything so whole India is visible
    });
  }, [filters]);

  // Real-time instant search filter across name, district and state
  const displayedOpportunities = opportunities.filter(opp => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      opp.name.toLowerCase().includes(q) ||
      opp.districtOrCity.toLowerCase().includes(q) ||
      opp.state.toLowerCase().includes(q)
    );
  });

  // Global Escape key listener: deselect and return to whole India view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFilterOpen(false);
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
    <div className="investor-workspace">
      <header className="investor-header">
        <div className="investor-brand"><Sun size={25} /><span>Surya<span>Ease</span></span><span className="investor-brand-divider" /><span className="investor-eyebrow">Investor workspace</span></div>
        <button type="button" onClick={onBack} className="investor-home"><ArrowLeft size={15} /><span>Back to home</span></button>
      </header>
      <section className="investor-intro">
        <div><p className="investor-eyebrow">EV CHARGING · OPPORTUNITY EXPLORER</p><h1>Find where the future charges.</h1><p>Explore high-potential locations for your next clean energy investment.</p></div>
        <div className="investor-summary"><span>Discovery coverage</span><strong>{opportunities.length}<small> investment zones</small></strong><span className="investor-source"><span /> VAHAN registry data <ArrowUpRight size={13} /></span></div>
      </section>

      {/* Main Layout Area */}
      <div className="investor-layout">
        {/* Left Side: Filter Controls & Ranked Hotspots List */}
        <aside className={`investor-sidebar ${isFilterOpen ? 'is-open' : ''}`}>
          <div className="investor-panel-heading"><div><p className="investor-eyebrow">DISCOVER</p><h2>Investment opportunities</h2></div><button className="investor-mobile-close" aria-label="Close opportunities" onClick={() => setIsFilterOpen(false)}><X size={20} /></button></div>
          <FilterPanel
            filters={filters}
            onChange={setFilters}
            resultCount={displayedOpportunities.length}
            onReset={handleReset}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          <div className="investor-results">
            <OpportunityList
              opportunities={displayedOpportunities}
              selectedId={selectedLocationId}
              onSelect={(id) => { setSelectedLocationId(id); setIsFilterOpen(false); }}
            />
          </div>
        </aside>

        {/* Center Map Area */}
        <main className="investor-map">
          <MapComponent
            opportunities={displayedOpportunities}
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
            className="investor-mobile-toggle"
            aria-label="Show opportunities and filters"
            onClick={() => setIsFilterOpen(true)}
          >
            <Filter size={16} /> Explore locations
          </button>
        </main>

        {/* Right Side: Selected Zone Intelligence & Auto Station Sizing */}
        {selectedLocation && (
          <aside className="investor-details">
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
