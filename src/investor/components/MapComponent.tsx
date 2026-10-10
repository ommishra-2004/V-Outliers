import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Opportunity } from "../types";
import { findNearestRto } from "../data/allRtos";

// High-visibility EV power station hotspot marker icons
const createAttractiveIcon = (band: "high" | "medium" | "low", isSelected: boolean) => {
  let mainColor = "#a78bfa"; // Violet-slate for low/emerging
  let glowColor = "rgba(167, 139, 250, 0.4)";
  const width = isSelected ? 30 : 23;
  const height = isSelected ? 38 : 29;

  if (band === "high") {
    mainColor = "#3687a9"; // Electric Sky Blue
    glowColor = "rgba(52, 171, 222, 0.5)";
  } else if (band === "medium") {
    mainColor = "#00f5d4"; // Electric Cyan / Neon Mint
    glowColor = "rgba(0, 245, 212, 0.55)"; 
  }

  const html = `
    <div style="
      position: relative;
      width: ${width}px;
      height: ${height}px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      ${isSelected ? "transform: scale(1.15);" : ""}
    ">
      <!-- Ground Energy Halo -->
      ${band === "high" || isSelected ? `
        <div style="
          position: absolute;
          bottom: -2px;
          left: 50%;
          transform: translateX(-50%);
          width: ${Math.round(width * 1.3)}px;
          height: 8px;
          border-radius: 50%;
          background: radial-gradient(ellipse, ${glowColor} 0%, transparent 70%);
          animation: pulse 2s ease-in-out infinite;
          pointer-events: none;
        "></div>
      ` : ""}

      <!-- EV Power Station Vector Icon -->
      <svg width="${width}" height="${height}" viewBox="0 0 28 35" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px ${isSelected ? "8px" : "4px"} ${mainColor});">
        <!-- Station Base Anchor & Pedestal -->
        <path d="M10 29.5 L14 34 L18 29.5 Z" fill="${mainColor}" />
        <rect x="3" y="27" width="18" height="3" rx="1.5" fill="${mainColor}" />
        
        <!-- Station Column Body -->
        <rect x="4.5" y="3.5" width="15" height="24" rx="3.5" fill="#090d16" stroke="${mainColor}" stroke-width="${isSelected ? "2.2" : "1.8"}" />
        
        <!-- Live LED Status Indicator -->
        <circle cx="12" cy="6.5" r="1.3" fill="${mainColor}">
          ${band === "high" || isSelected ? '<animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite"/>' : ""}
        </circle>
        
        <!-- Station Digital Display Screen -->
        <rect x="7" y="10" width="10" height="9" rx="1.5" fill="#020617" stroke="${mainColor}" stroke-width="0.9" stroke-opacity="0.8" />
        
        <!-- Electric Lightning Bolt (Power Glyph) -->
        <path d="M12.5 11 L9.5 14.5 H12 L11 18 L15 14 H12.5 L13.5 11 Z" fill="${mainColor}" />
        
        <!-- Charging Cable Loop -->
        <path d="M19.5 11 C23.5 11 24.5 13.5 24.5 17 V21 C24.5 23.5 22.5 24 20 24" stroke="${mainColor}" stroke-width="1.6" stroke-linecap="round" fill="none" />
        
        <!-- Charging Gun / Nozzle Handle in Holster -->
        <path d="M22 10.5 H25 C25.6 10.5 26 10.9 26 11.5 V14 C26 14.6 25.6 15 25 15 H22" fill="#090d16" stroke="${mainColor}" stroke-width="1.3" />
      </svg>
    </div>
  `;

  return L.divIcon({
    className: "ev-station-opportunity-marker",
    html: html,
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
    popupAnchor: [0, -height + 4],
  });
};

// Sleek radar target icon for on-demand click-inspected regions
const createInspectedIcon = () => {
  const size = 32;
  const color = "#f43f5e"; // Distinct Rose/Crimson radar reticle
  const html = `
    <div style="
      position: relative;
      width: ${size}px;
      height: ${size}px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    ">
      <!-- Pulsing Radar Halo -->
      <div style="
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background-color: rgba(244, 63, 94, 0.25);
        border: 1.5px solid ${color};
        animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></div>
      
      <!-- Core Reticle / Pin -->
      <div style="
        position: relative;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #090d16;
        border: 2px solid ${color};
        box-shadow: 0 0 14px ${color};
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="22" y1="12" x2="18" y2="12"></line>
          <line x1="6" y1="12" x2="2" y2="12"></line>
          <line x1="12" y1="6" x2="12" y2="2"></line>
          <line x1="12" y1="22" x2="12" y2="18"></line>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    className: "inspected-region-marker",
    html: html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

interface Props {
  opportunities: Opportunity[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  selectedState?: string;
  inspectedLocation?: Opportunity | null;
  onInspectLocation?: (rto: Opportunity, distanceKm: number) => void;
}

function MapClickHandler({ 
  onMapClick 
}: { 
  onMapClick: (lat: number, lon: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      // Don't trigger if clicked on an existing marker
      const target = e.originalEvent.target as HTMLElement;
      if (target && target.closest(".leaflet-marker-icon")) return;
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

function MapUpdater({ 
  selectedId, 
  opportunities,
  selectedState,
  inspectedLocation
}: { 
  selectedId: string | null; 
  opportunities: Opportunity[];
  selectedState?: string;
  inspectedLocation?: Opportunity | null;
}) {
  const map = useMap();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // On initial mount, map already starts at whole India center [22.5937, 78.9629], zoom 5
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (!selectedId) return;
    }

    if (selectedId) {
      const opp = opportunities.find(o => o.id === selectedId) || (inspectedLocation?.id === selectedId ? inspectedLocation : null);
      if (opp) {
        const currentZoom = map.getZoom();
        const targetZoom = Math.max(currentZoom, 11);
        map.flyTo([opp.latitude, opp.longitude], targetZoom, { duration: 0.9 });
      }
    } else {
      // Nothing selected / deselected -> return to initial whole India state (or state centroid if state filtered)
      if (selectedState && selectedState !== "All India") {
        const stateOpps = opportunities.filter(o => o.state === selectedState);
        if (stateOpps.length > 0) {
          const avgLat = stateOpps.reduce((acc, o) => acc + o.latitude, 0) / stateOpps.length;
          const avgLon = stateOpps.reduce((acc, o) => acc + o.longitude, 0) / stateOpps.length;
          map.flyTo([avgLat, avgLon], 7, { duration: 1.0 });
        }
      } else {
        // Return to whole India view [22.5937, 78.9629], zoom 5
        map.flyTo([22.5937, 78.9629], 5, { duration: 1.0 });
      }
    }
  }, [selectedId, selectedState]);

  return null;
}

export default function MapComponent({ 
  opportunities, 
  selectedId, 
  onSelect, 
  selectedState,
  inspectedLocation,
  onInspectLocation
}: Props) {
  const handleMapClick = (lat: number, lon: number) => {
    const nearest = findNearestRto(lat, lon);
    if (nearest) {
      if (onInspectLocation) {
        onInspectLocation(nearest.rto, nearest.distanceKm);
      } else {
        onSelect(nearest.rto.id);
      }
    }
  };
  return (
    <div className="h-full w-full relative z-0">
      <MapContainer 
        center={[22.5937, 78.9629]} 
        zoom={5} 
        scrollWheelZoom={true} 
        style={{ height: "100%", width: "100%", background: "#090d16" }}
        zoomControl={false}
      >
        {/* Dark Voyager Basemap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=cb1_4fsm_1_429795fdad01e7f2e63e6b4c"
        />

        {/* Global Click Handler to Inspect Nearest RTO */}
        <MapClickHandler onMapClick={handleMapClick} />
        
        {opportunities.map((opp) => {
          const isSelected = opp.id === selectedId;
          return (
            <Marker 
              key={opp.id} 
              position={[opp.latitude, opp.longitude]}
              icon={createAttractiveIcon(opp.opportunityBand, isSelected)}
              eventHandlers={{
                click: () => onSelect(opp.id),
              }}
            >
              <Popup className="dark-popup">
                <div className="font-sans p-1 text-slate-100">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">
                    {opp.districtOrCity}, {opp.state}
                  </div>
                  <div className="font-bold text-sm text-white mb-2">{opp.name}</div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-800 pt-2 mb-2">
                    <div>
                      <span className="text-slate-400 text-[10px]">Fleet Size:</span>
                      <div className="font-bold text-slate-200">{opp.totalRegistrations.toLocaleString()} EVs</div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px]">Solar Yield:</span>
                      <div className="font-bold text-amber-400">{opp.solarUnitsPerKwMonth} u/kW/mo</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-slate-900/80 p-1.5 rounded text-xs border border-slate-800">
                    <span className="text-slate-400">Opportunity Score:</span>
                    <span className="font-extrabold text-brand-accent font-mono text-sm">{opp.opportunityScore}/100</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* On-Demand Inspected RTO Marker (shown when user clicks anywhere on map) */}
        {inspectedLocation && (
          <Marker
            position={[inspectedLocation.latitude, inspectedLocation.longitude]}
            icon={createInspectedIcon()}
            eventHandlers={{
              click: () => onSelect(inspectedLocation.id)
            }}
          >
            <Popup className="dark-popup">
              <div className="font-sans p-1 text-slate-100">
                <div className="text-[10px] uppercase tracking-wider text-rose-400 font-bold mb-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                  <span>Inspected Regional Jurisdiction</span>
                </div>
                <div className="font-bold text-sm text-white mb-1">{inspectedLocation.name}</div>
                <div className="text-[10px] text-gray-400 mb-2">
                  Jurisdiction: {inspectedLocation.districtOrCity}, {inspectedLocation.state}
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-800 pt-2 mb-2">
                  <div>
                    <span className="text-slate-400 text-[10px]">EV Fleet:</span>
                    <div className="font-bold text-slate-200">{inspectedLocation.totalRegistrations.toLocaleString()} EVs</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Charging Gap:</span>
                    <div className="font-bold text-amber-400">{inspectedLocation.evPerCharger} EVs/chr</div>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-slate-900/80 p-1.5 rounded text-xs border border-slate-800">
                  <span className="text-slate-400">Opportunity Score:</span>
                  <span className="font-extrabold text-[#a78bfa] font-mono text-sm">{inspectedLocation.opportunityScore}/100</span>
                </div>
              </div>
            </Popup>
          </Marker>
        )}
        
        <MapUpdater 
          selectedId={selectedId} 
          opportunities={opportunities} 
          selectedState={selectedState} 
          inspectedLocation={inspectedLocation}
        />
      </MapContainer>
      
      {/* High-Tech Opportunity Map Legend */}
      <div className="absolute bottom-5 left-5 z-[400] bg-black/90 backdrop-blur-md border border-gray-800/80 p-3 rounded-lg text-xs shadow-2xl max-w-xs">
        <h4 className="font-bold text-gray-300 mb-2 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3687a9] animate-pulse"></span>
          Opportunity Hotspot Tiers
        </h4>
        <div className="flex items-center gap-2.5 mb-2">
          <svg width="14" height="18" viewBox="0 0 28 35" fill="none" className="shrink-0" style={{ filter: "drop-shadow(0 0 4px #3687a9)" }}>
            <path d="M10 29.5 L14 34 L18 29.5 Z" fill="#3687a9" />
            <rect x="3" y="27" width="18" height="3" rx="1.5" fill="#3687a9" />
            <rect x="4.5" y="3.5" width="15" height="24" rx="3.5" fill="#090d16" stroke="#3687a9" strokeWidth="1.8" />
            <circle cx="12" cy="6.5" r="1.3" fill="#3687a9" />
            <rect x="7" y="10" width="10" height="9" rx="1.5" fill="#020617" stroke="#3687a9" strokeWidth="0.9" />
            <path d="M12.5 11 L9.5 14.5 H12 L11 18 L15 14 H12.5 L13.5 11 Z" fill="#3687a9" />
            <path d="M19.5 11 C23.5 11 24.5 13.5 24.5 17 V21 C24.5 23.5 22.5 24 20 24" stroke="#3687a9" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M22 10.5 H25 C25.6 10.5 26 10.9 26 11.5 V14 C26 14.6 25.6 15 25 15 H22" fill="#090d16" stroke="#3687a9" strokeWidth="1.3" />
          </svg>
          <span className="font-semibold text-white">Tier 1: High Conviction (Score ≥ 65)</span>
        </div>
        <div className="flex items-center gap-2.5 mb-2">
          <svg width="14" height="18" viewBox="0 0 28 35" fill="none" className="shrink-0" style={{ filter: "drop-shadow(0 0 4px #00f5d4)" }}>
            <path d="M10 29.5 L14 34 L18 29.5 Z" fill="#00f5d4" />
            <rect x="3" y="27" width="18" height="3" rx="1.5" fill="#00f5d4" />
            <rect x="4.5" y="3.5" width="15" height="24" rx="3.5" fill="#090d16" stroke="#00f5d4" strokeWidth="1.8" />
            <circle cx="12" cy="6.5" r="1.3" fill="#00f5d4" />
            <rect x="7" y="10" width="10" height="9" rx="1.5" fill="#020617" stroke="#00f5d4" strokeWidth="0.9" />
            <path d="M12.5 11 L9.5 14.5 H12 L11 18 L15 14 H12.5 L13.5 11 Z" fill="#00f5d4" />
            <path d="M19.5 11 C23.5 11 24.5 13.5 24.5 17 V21 C24.5 23.5 22.5 24 20 24" stroke="#00f5d4" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M22 10.5 H25 C25.6 10.5 26 10.9 26 11.5 V14 C26 14.6 25.6 15 25 15 H22" fill="#090d16" stroke="#00f5d4" strokeWidth="1.3" />
          </svg>
          <span className="text-gray-300">Tier 2: Medium Growth (Score 58–64)</span>
        </div>
        <div className="flex items-center gap-2.5 mb-2">
          <svg width="14" height="18" viewBox="0 0 28 35" fill="none" className="shrink-0" style={{ filter: "drop-shadow(0 0 4px #a78bfa)" }}>
            <path d="M10 29.5 L14 34 L18 29.5 Z" fill="#a78bfa" />
            <rect x="3" y="27" width="18" height="3" rx="1.5" fill="#a78bfa" />
            <rect x="4.5" y="3.5" width="15" height="24" rx="3.5" fill="#090d16" stroke="#a78bfa" strokeWidth="1.8" />
            <circle cx="12" cy="6.5" r="1.3" fill="#a78bfa" />
            <rect x="7" y="10" width="10" height="9" rx="1.5" fill="#020617" stroke="#a78bfa" strokeWidth="0.9" />
            <path d="M12.5 11 L9.5 14.5 H12 L11 18 L15 14 H12.5 L13.5 11 Z" fill="#a78bfa" />
            <path d="M19.5 11 C23.5 11 24.5 13.5 24.5 17 V21 C24.5 23.5 22.5 24 20 24" stroke="#a78bfa" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M22 10.5 H25 C25.6 10.5 26 10.9 26 11.5 V14 C26 14.6 25.6 15 25 15 H22" fill="#090d16" stroke="#a78bfa" strokeWidth="1.3" />
          </svg>
          <span className="text-gray-400">Tier 3: Emerging / Low (Score &lt; 58)</span>
        </div>
        <div className="pt-2 border-t border-gray-800 text-[10px] text-rose-300/90 flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0"></span>
          <span>Click anywhere on map to inspect nearest RTO insights</span>
        </div>
      </div>
    </div>
  );
}
