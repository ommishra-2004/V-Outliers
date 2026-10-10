import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSolarStore } from '../../store/solarStore';
import { detectRooftop, searchLocation, calculatePolygonAreaSqft } from '../../services/api';
import { LocationSearchResult } from '../../types/solar';
import {
  Search,
  Crosshair,
  MapPin,
  Check,
  Move,
  PenTool,
  RotateCcw,
  Sliders,
  X,
  Sparkles,
  Layers,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Sun,
  Eye,
  EyeOff,
  Undo2,
  Building2,
  LayoutGrid,
  Zap,
  ShieldCheck,
  Compass
} from 'lucide-react';

// Fix Leaflet default marker icons in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface RooftopMapProps {
  onAreaConfirmed?: (areaSqft: number) => void;
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

const QUICK_SEARCH_PILLS = [
  { label: 'Indiranagar, BLR', query: 'Indiranagar, Bengaluru' },
  { label: 'Bandra West, MUM', query: 'Bandra West, Mumbai' },
  { label: 'Hauz Khas, DEL', query: 'Hauz Khas, New Delhi' },
  { label: 'Jubilee Hills, HYD', query: 'Jubilee Hills, Hyderabad' },
  { label: 'Koramangala, BLR', query: 'Koramangala, Bengaluru' },
  { label: 'Anna Nagar, CHN', query: 'Anna Nagar, Chennai' },
];

const PRESETS = [
  { key: '30x40', label: '30×40 ft (1,200 sq ft)', sqft: 1200, ratio: 1.33 },
  { key: '40x60', label: '40×60 ft (2,400 sq ft)', sqft: 2400, ratio: 1.5 },
  { key: 'villa', label: 'Villa (4,800 sq ft)', sqft: 4800, ratio: 1.33 },
  { key: 'commercial', label: 'Commercial (6,000 sq ft)', sqft: 6000, ratio: 2.0 },
];

export default function RooftopMap({ onAreaConfirmed }: RooftopMapProps) {
  const {
    siteInput,
    updateSiteInput,
    setDetectedRooftop,
    detectedGrossArea,
    detectedUsableArea,
    detectionSource,
  } = useSolarStore();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const nearbyLayersRef = useRef<L.Polygon[]>([]);
  const vertexMarkersRef = useRef<L.Marker[]>([]);
  const midpointMarkersRef = useRef<L.Marker[]>([]);
  const centerMarkerRef = useRef<L.Marker | null>(null);
  const drawGuideLineRef = useRef<L.Polyline | null>(null);
  const drawPointsRef = useRef<[number, number][]>([]);

  // State
  const [mode, setMode] = useState<'select' | 'draw' | 'move'>('select');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [scalePercent, setScalePercent] = useState(100);
  const [drawPointCount, setDrawPointCount] = useState(0);
  const [statusText, setStatusText] = useState('Selected roof centered and isolated');
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Candidate outlines management
  const [showCandidates, setShowCandidates] = useState(false);
  const candidatePolygonsRef = useRef<[number, number][][]>([]);
  const previousPolygonRef = useRef<[number, number][] | null>(null);

  // References to raw geometry
  const currentPolygonCoords = useRef<[number, number][]>([]);
  const basePolygonCoords = useRef<[number, number][]>([]);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Whole polygon swift drag tracking
  const isDraggingPolyRef = useRef(false);
  const dragStartLatLngRef = useRef<L.LatLng | null>(null);
  const dragStartCoordsRef = useRef<[number, number][]>([]);

  const currentLat = siteInput.latitude || 12.9784;
  const currentLon = siteInput.longitude || 77.6408;

  /* ─────────────────────────────────────────────────────────────
     Geometry Calculations & Transformations
  ───────────────────────────────────────────────────────────── */

  const getCentroid = (coords: [number, number][]): [number, number] => {
    if (!coords.length) return [currentLat, currentLon];
    const lat = coords.reduce((acc, c) => acc + c[0], 0) / coords.length;
    const lon = coords.reduce((acc, c) => acc + c[1], 0) / coords.length;
    return [lat, lon];
  };

  const transformPolygon = useCallback((coords: [number, number][], deg: number, scalePct: number): [number, number][] => {
    if (!coords.length) return coords;
    const [cLat, cLon] = getCentroid(coords);
    const rad = (deg * Math.PI) / 180.0;
    const scale = scalePct / 100.0;
    const latScale = Math.cos((cLat * Math.PI) / 180.0);

    return coords.map(([lat, lon]) => {
      const scaledX = (lon - cLon) * scale * latScale;
      const scaledY = (lat - cLat) * scale;
      const rotX = scaledX * Math.cos(rad) - scaledY * Math.sin(rad);
      const rotY = scaledX * Math.sin(rad) + scaledY * Math.cos(rad);
      return [cLat + rotY, cLon + rotX / latScale];
    });
  }, []);

  /* ─────────────────────────────────────────────────────────────
     Render Active Selected Polygon
  ───────────────────────────────────────────────────────────── */

  const renderActivePolygon = useCallback((coords: [number, number][]) => {
    const map = mapRef.current;
    if (!map || coords.length < 3) return;

    currentPolygonCoords.current = coords;

    // Clear old layers
    if (polygonLayerRef.current) map.removeLayer(polygonLayerRef.current);
    vertexMarkersRef.current.forEach((m) => map.removeLayer(m));
    vertexMarkersRef.current = [];
    midpointMarkersRef.current.forEach((m) => map.removeLayer(m));
    midpointMarkersRef.current = [];
    if (centerMarkerRef.current) map.removeLayer(centerMarkerRef.current);

    // 1. Draw glowing polygon with WHOLE-POLYGON SWIFT DRAG
    const poly = L.polygon(coords.map(([lat, lon]) => L.latLng(lat, lon)), {
      color: '#10b981',
      weight: 3,
      fillColor: '#10b981',
      fillOpacity: 0.32,
      className: 'rooftop-polygon-cursor-grab',
    }).addTo(map);
    polygonLayerRef.current = poly;

    // SWIFT DRAG: Drag anywhere inside the polygon body to move the entire roof!
    poly.on('mousedown', (e: L.LeafletMouseEvent) => {
      L.DomEvent.stopPropagation(e);
      isDraggingPolyRef.current = true;
      dragStartLatLngRef.current = e.latlng;
      dragStartCoordsRef.current = [...currentPolygonCoords.current];
      map.dragging.disable();
      poly.setStyle({ fillOpacity: 0.5, color: '#34d399' });
    });

    // 2. Central Move Anchor
    const [cLat, cLon] = getCentroid(coords);
    const centerIcon = L.divIcon({
      className: '',
      html: `
        <div class="group relative flex items-center justify-center cursor-grab active:cursor-grabbing">
          <div class="w-8 h-8 rounded-full bg-emerald-500/30 backdrop-blur-md border border-emerald-400 flex items-center justify-center shadow-lg transition-transform group-hover:scale-120">
            <span class="text-xs font-black text-white">✥</span>
          </div>
          <div class="absolute -bottom-6 px-1.5 py-0.5 rounded bg-slate-900/90 text-[10px] text-emerald-400 font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-emerald-500/30">
            Drag to move
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const centerMarker = L.marker([cLat, cLon], { icon: centerIcon, draggable: true, zIndexOffset: 2000 }).addTo(map);
    centerMarker.on('drag', (e) => {
      const newPos = (e.target as L.Marker).getLatLng();
      const dLat = newPos.lat - cLat;
      const dLon = newPos.lng - cLon;
      const moved = currentPolygonCoords.current.map(([pLat, pLon]) => [pLat + dLat, pLon + dLon] as [number, number]);
      basePolygonCoords.current = moved;
      renderActivePolygon(moved);
      syncStoreArea(moved, 'USER_MOVED');
    });
    centerMarkerRef.current = centerMarker;

    // 3. Draggable Corner Handles
    coords.forEach(([vLat, vLon], idx) => {
      const cornerIcon = L.divIcon({
        className: '',
        html: `
          <div class="group relative flex items-center justify-center cursor-move">
            <div class="w-4 h-4 rounded-full bg-white border-2 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)] transition-transform group-hover:scale-130"></div>
          </div>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const cornerMarker = L.marker([vLat, vLon], { icon: cornerIcon, draggable: true, zIndexOffset: 3000 }).addTo(map);

      cornerMarker.on('drag', () => {
        const updated = vertexMarkersRef.current.map((m) => {
          const ll = m.getLatLng();
          return [ll.lat, ll.lng] as [number, number];
        });
        poly.setLatLngs(updated.map(([l, g]) => L.latLng(l, g)));
        currentPolygonCoords.current = updated;
        basePolygonCoords.current = updated;
        syncStoreArea(updated, 'USER_RESHAPED');
      });

      // Double-click to delete vertex
      cornerMarker.on('dblclick', () => {
        if (currentPolygonCoords.current.length > 3) {
          const filtered = currentPolygonCoords.current.filter((_, i) => i !== idx);
          basePolygonCoords.current = filtered;
          renderActivePolygon(filtered);
          syncStoreArea(filtered, 'USER_DELETED_CORNER');
          setStatusText(`Corner removed. ${filtered.length} corners remaining.`);
        }
      });

      vertexMarkersRef.current.push(cornerMarker);
    });

    // 4. Midpoint '+' Handles
    const n = coords.length;
    for (let i = 0; i < n; i++) {
      const p1 = coords[i];
      const p2 = coords[(i + 1) % n];
      const mLat = (p1[0] + p2[0]) / 2.0;
      const mLon = (p1[1] + p2[1]) / 2.0;
      const insertIndex = i + 1;

      const midIcon = L.divIcon({
        className: '',
        html: `
          <div class="group relative flex items-center justify-center cursor-pointer">
            <div class="w-3.5 h-3.5 rounded-full bg-slate-950/85 border border-emerald-400 text-emerald-400 flex items-center justify-center shadow-md transition-all group-hover:scale-130 group-hover:bg-emerald-500 group-hover:text-slate-950 font-black text-[9px]">
              +
            </div>
          </div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const midMarker = L.marker([mLat, mLon], { icon: midIcon, draggable: true, zIndexOffset: 2500 }).addTo(map);

      midMarker.on('dragend', (e) => {
        const newPos = (e.target as L.Marker).getLatLng();
        const next = [...currentPolygonCoords.current];
        next.splice(insertIndex, 0, [newPos.lat, newPos.lng]);
        basePolygonCoords.current = next;
        renderActivePolygon(next);
        syncStoreArea(next, 'USER_ADDED_CORNER');
        setStatusText(`Corner added! Reshaped to ${next.length} corners.`);
      });

      midMarker.on('click', () => {
        const next = [...currentPolygonCoords.current];
        next.splice(insertIndex, 0, [mLat, mLon]);
        basePolygonCoords.current = next;
        renderActivePolygon(next);
        syncStoreArea(next, 'USER_ADDED_CORNER');
        setStatusText(`Corner added! Drag to match roof boundary.`);
      });

      midpointMarkersRef.current.push(midMarker);
    }
  }, []);

  const syncStoreArea = (coords: [number, number][], sourceName: string) => {
    const area = calculatePolygonAreaSqft(coords);
    const usable = Math.round(area * 0.75);
    setDetectedRooftop({
      polygon: coords,
      grossArea: area,
      usableArea: usable,
      source: sourceName,
    });
    updateSiteInput({ roofAreaSqft: area });
  };

  /* ─────────────────────────────────────────────────────────────
     Clear & Render Candidate Ghost Outlines
  ───────────────────────────────────────────────────────────── */

  const clearCandidateOutlines = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    nearbyLayersRef.current.forEach((l) => map.removeLayer(l));
    nearbyLayersRef.current = [];
  }, []);

  const showCandidateOutlinesOnMap = useCallback(() => {
    const map = mapRef.current;
    const candidates = candidatePolygonsRef.current;
    if (!map || !candidates.length) return;

    clearCandidateOutlines();

    candidates.forEach((polyCoords) => {
      if (polyCoords.length < 3) return;
      const ghost = L.polygon(polyCoords.map(([lat, lon]) => L.latLng(lat, lon)), {
        color: '#60a5fa',
        weight: 1.5,
        fillColor: '#3b82f6',
        fillOpacity: 0.15,
        dashArray: '4, 4',
      }).addTo(map);

      ghost.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        const [cLat, cLon] = getCentroid(polyCoords);

        previousPolygonRef.current = [...currentPolygonCoords.current];
        basePolygonCoords.current = polyCoords;
        currentPolygonCoords.current = polyCoords;
        setRotationDeg(0);
        setScalePercent(100);

        map.flyTo([cLat, cLon], 19, { duration: 0.8 });

        renderActivePolygon(polyCoords);
        clearCandidateOutlines();
        setShowCandidates(false);

        syncStoreArea(polyCoords, 'CANDIDATE_SELECTED');
        updateSiteInput({ latitude: cLat, longitude: cLon });
        setStatusText(`Rooftop selected (${polyCoords.length} corners). Other roofs hidden.`);
      });

      ghost.on('mouseover', () => {
        ghost.setStyle({ color: '#10b981', fillOpacity: 0.4, weight: 2.5 });
      });
      ghost.on('mouseout', () => {
        ghost.setStyle({ color: '#60a5fa', fillOpacity: 0.15, weight: 1.5 });
      });

      nearbyLayersRef.current.push(ghost);
    });

    setShowCandidates(true);
    setStatusText(`Showing ${candidates.length} nearby candidate roofs. Click any to select it.`);
  }, [clearCandidateOutlines, renderActivePolygon, updateSiteInput]);

  const toggleCandidateOutlines = () => {
    if (showCandidates) {
      clearCandidateOutlines();
      setShowCandidates(false);
      setStatusText('Candidate outlines hidden.');
    } else {
      showCandidateOutlinesOnMap();
    }
  };

  const handleUndoSelection = () => {
    if (previousPolygonRef.current && previousPolygonRef.current.length >= 3) {
      const prev = previousPolygonRef.current;
      const [cLat, cLon] = getCentroid(prev);
      basePolygonCoords.current = prev;
      currentPolygonCoords.current = prev;
      mapRef.current?.flyTo([cLat, cLon], 19, { duration: 0.8 });
      renderActivePolygon(prev);
      syncStoreArea(prev, 'UNDO_RESTORED');
      setStatusText('Reverted to previous rooftop.');
    } else {
      showCandidateOutlinesOnMap();
    }
  };

  /* ─────────────────────────────────────────────────────────────
     Rooftop Detection Engine Call
  ───────────────────────────────────────────────────────────── */

  const handlePinLocation = useCallback(async (lat: number, lon: number, skipFly = false) => {
    const map = mapRef.current;
    if (!map) return;

    if (!skipFly) map.flyTo([lat, lon], 19, { duration: 1.0 });

    setIsDetecting(true);
    setStatusText('Identifying building footprint on satellite map…');

    try {
      const response = await detectRooftop(lat, lon, siteInput.propertyType || 'Residential');

      updateSiteInput({
        latitude: lat,
        longitude: lon,
        city: response.city,
        state: response.state,
        address: response.formatted_address,
        roofAreaSqft: response.gross_area_sqft,
      });

      setDetectedRooftop({
        polygon: response.polygon,
        grossArea: response.gross_area_sqft,
        usableArea: response.usable_area_sqft,
        source: response.source,
      });

      basePolygonCoords.current = response.polygon;
      setRotationDeg(0);
      setScalePercent(100);

      if (response.nearby_polygons && response.nearby_polygons.length) {
        candidatePolygonsRef.current = response.nearby_polygons as [number, number][][];
      }

      clearCandidateOutlines();
      setShowCandidates(false);

      const [cLat, cLon] = getCentroid(response.polygon);
      map.flyTo([cLat, cLon], 19, { duration: 0.8 });

      renderActivePolygon(response.polygon);

      setStatusText(
        response.source === 'OSM_VECTOR_FOOTPRINT'
          ? `✓ Building selected & centered. Other roofs hidden for clarity.`
          : `⚡ AI estimated boundary centered on site. Drag or reshape as needed.`
      );
    } catch {
      setStatusText('Could not auto-detect building. Tap "Trace Custom Roof" or drag to place.');
    } finally {
      setIsDetecting(false);
    }
  }, [siteInput.propertyType, updateSiteInput, setDetectedRooftop, renderActivePolygon, clearCandidateOutlines]);

  /* ─────────────────────────────────────────────────────────────
     Nudge & Swift Move Helpers
  ───────────────────────────────────────────────────────────── */

  const nudgePolygon = (dMetersLat: number, dMetersLon: number) => {
    const coords = currentPolygonCoords.current;
    if (!coords.length) return;
    const [cLat] = getCentroid(coords);
    const dLat = dMetersLat / 111132.0;
    const dLon = dMetersLon / (111132.0 * Math.cos((cLat * Math.PI) / 180.0));

    const moved = coords.map(([lat, lon]) => [lat + dLat, lon + dLon] as [number, number]);
    basePolygonCoords.current = moved;
    renderActivePolygon(moved);
    syncStoreArea(moved, 'USER_NUDGED');
  };

  /* ─────────────────────────────────────────────────────────────
     Freehand "Trace / Draw Roof" Mode
  ───────────────────────────────────────────────────────────── */

  const startDrawMode = () => {
    setMode('draw');
    drawPointsRef.current = [];
    setDrawPointCount(0);
    clearCandidateOutlines();
    setShowCandidates(false);
    setStatusText('Click each corner of your roof on the satellite map. Click "Done" when finished.');
  };

  const handleMapClickDuringDraw = (lat: number, lon: number) => {
    const map = mapRef.current;
    if (!map) return;

    const points = [...drawPointsRef.current, [lat, lon] as [number, number]];
    drawPointsRef.current = points;
    setDrawPointCount(points.length);

    if (drawGuideLineRef.current) {
      drawGuideLineRef.current.setLatLngs(points.map(([l, g]) => L.latLng(l, g)));
    } else {
      drawGuideLineRef.current = L.polyline(points.map(([l, g]) => L.latLng(l, g)), {
        color: '#10b981',
        weight: 3,
        dashArray: '5, 5',
      }).addTo(map);
    }
  };

  const finishDrawingRoof = () => {
    const map = mapRef.current;
    const points = drawPointsRef.current;
    if (points.length < 3) {
      alert('Please click at least 3 points to complete a roof polygon.');
      return;
    }

    if (drawGuideLineRef.current && map) {
      map.removeLayer(drawGuideLineRef.current);
      drawGuideLineRef.current = null;
    }

    basePolygonCoords.current = points;
    currentPolygonCoords.current = points;
    setMode('select');

    const [cLat, cLon] = getCentroid(points);
    map?.panTo([cLat, cLon]);

    renderActivePolygon(points);
    syncStoreArea(points, 'USER_CUSTOM_TRACED');
    setStatusText(`Custom roof saved (${points.length} corners). Centered and isolated.`);
  };

  const cancelDrawingRoof = () => {
    const map = mapRef.current;
    if (drawGuideLineRef.current && map) {
      map.removeLayer(drawGuideLineRef.current);
      drawGuideLineRef.current = null;
    }
    drawPointsRef.current = [];
    setDrawPointCount(0);
    setMode('select');
    if (basePolygonCoords.current.length >= 3) {
      renderActivePolygon(basePolygonCoords.current);
    }
    setStatusText('Drawing cancelled.');
  };

  /* ─────────────────────────────────────────────────────────────
     Rotate & Scale Adjustments
  ───────────────────────────────────────────────────────────── */

  const handleRotationChange = (deg: number) => {
    setRotationDeg(deg);
    if (!basePolygonCoords.current.length) return;
    const transformed = transformPolygon(basePolygonCoords.current, deg, scalePercent);
    renderActivePolygon(transformed);
    syncStoreArea(transformed, 'TRANSFORMED');
  };

  const handleScaleChange = (scalePct: number) => {
    setScalePercent(scalePct);
    if (!basePolygonCoords.current.length) return;
    const transformed = transformPolygon(basePolygonCoords.current, rotationDeg, scalePct);
    renderActivePolygon(transformed);
    syncStoreArea(transformed, 'TRANSFORMED');
  };

  const applyPresetShape = (preset: typeof PRESETS[0]) => {
    setActivePreset(preset.key);
    const [cLat, cLon] = getCentroid(currentPolygonCoords.current);
    const areaM2 = preset.sqft / 10.7639;
    const widthM = Math.sqrt(areaM2 / preset.ratio);
    const lengthM = widthM * preset.ratio;
    const dLat = (lengthM / 2.0) / 111132.0;
    const dLon = (widthM / 2.0) / (111132.0 * Math.cos((cLat * Math.PI) / 180.0));

    const newPoly: [number, number][] = [
      [cLat + dLat, cLon - dLon],
      [cLat + dLat, cLon + dLon],
      [cLat - dLat, cLon + dLon],
      [cLat - dLat, cLon - dLon],
    ];

    basePolygonCoords.current = newPoly;
    setRotationDeg(0);
    setScalePercent(100);
    renderActivePolygon(newPoly);
    syncStoreArea(newPoly, `PRESET_${preset.key.toUpperCase()}`);
    setStatusText(`Applied ${preset.label} preset.`);
  };

  const resetToOriginal = () => {
    handlePinLocation(currentLat, currentLon, true);
  };

  /* ─────────────────────────────────────────────────────────────
     Map Initialization
  ───────────────────────────────────────────────────────────── */

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [currentLat, currentLon],
      zoom: 19,
      maxZoom: 21,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles © Esri',
      maxNativeZoom: 19,
      maxZoom: 21,
    }).addTo(map);

    L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      maxNativeZoom: 19,
      maxZoom: 21,
      opacity: 0.65,
    }).addTo(map);

    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      if (isDraggingPolyRef.current && dragStartLatLngRef.current && dragStartCoordsRef.current.length) {
        const dLat = e.latlng.lat - dragStartLatLngRef.current.lat;
        const dLon = e.latlng.lng - dragStartLatLngRef.current.lng;
        const moved = dragStartCoordsRef.current.map(([lat, lon]) => [lat + dLat, lon + dLon] as [number, number]);

        if (polygonLayerRef.current) {
          polygonLayerRef.current.setLatLngs(moved.map(([lat, lon]) => L.latLng(lat, lon)));
        }
      }
    });

    map.on('mouseup', (e: L.LeafletMouseEvent) => {
      if (isDraggingPolyRef.current && dragStartLatLngRef.current && dragStartCoordsRef.current.length) {
        isDraggingPolyRef.current = false;
        map.dragging.enable();
        const dLat = e.latlng.lat - dragStartLatLngRef.current.lat;
        const dLon = e.latlng.lng - dragStartLatLngRef.current.lng;
        const moved = dragStartCoordsRef.current.map(([lat, lon]) => [lat + dLat, lon + dLon] as [number, number]);
        basePolygonCoords.current = moved;
        renderActivePolygon(moved);
        syncStoreArea(moved, 'USER_MOVED_SWIFT');
        setStatusText('Repositioned roof onto house!');
      }
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      if (mode === 'draw') {
        handleMapClickDuringDraw(e.latlng.lat, e.latlng.lng);
      } else {
        handlePinLocation(e.latlng.lat, e.latlng.lng, true);
      }
    });

    mapRef.current = map;
    handlePinLocation(currentLat, currentLon, true);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line

  /* ─────────────────────────────────────────────────────────────
     Search & Autocomplete
  ───────────────────────────────────────────────────────────── */

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setSelectedResultIndex(-1);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (val.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    debounceTimer.current = setTimeout(async () => {
      const results = await searchLocation(val);
      setSearchResults(results);
      setIsSearching(false);
    }, 280);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!searchResults.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedResultIndex((prev) => (prev + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedResultIndex((prev) => (prev <= 0 ? searchResults.length - 1 : prev - 1));
    } else if (e.key === 'Enter' && selectedResultIndex >= 0) {
      e.preventDefault();
      selectSearchResult(searchResults[selectedResultIndex]);
    } else if (e.key === 'Escape') {
      setSearchFocused(false);
    }
  };

  const selectSearchResult = (item: LocationSearchResult) => {
    setSearchQuery(item.display_name.split(',').slice(0, 2).join(','));
    setSearchResults([]);
    setSearchFocused(false);
    handlePinLocation(item.latitude, item.longitude);
  };

  const handleGPS = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => handlePinLocation(coords.latitude, coords.longitude),
      () => setStatusText('GPS access denied. Type address in search.')
    );
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(Math.round(n));

  const estKw = (detectedUsableArea / 100.0).toFixed(1);
  const estPanels = Math.ceil(parseFloat(estKw) * 2.5);
  const estAnnualUnits = Math.round(parseFloat(estKw) * 120 * 12);
  const cornerCount = currentPolygonCoords.current.length || 4;
  const candidateCount = candidatePolygonsRef.current.length;

  return (
    <div className="flex flex-col gap-4">
      {/* ─────────────────────────────────────────────────────────────
          1. SLEEK COMMAND-STYLE SEARCH BAR & TRENDING SITES
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2.5">
        <div className="relative w-full">
          {/* Frosted Glass Floating Command Bar */}
          <div className="relative flex items-center w-full bg-slate-900/90 backdrop-blur-xl border border-white/10 hover:border-emerald-500/40 focus-within:border-emerald-400 focus-within:shadow-[0_0_24px_rgba(16,185,129,0.2)] rounded-2xl transition-all p-1.5 shadow-xl group">
            {/* Glowing Search Badge */}
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 ml-1 transition-transform group-focus-within:scale-105">
              {isSearching ? (
                <div className="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
              ) : (
                <Search className="w-4 h-4 text-emerald-400" />
              )}
            </div>

            {/* Input */}
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInput}
              onKeyDown={handleKeyDown}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 220)}
              placeholder="Search address, neighborhood, colony, or 6-digit pincode in India..."
              className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 px-3.5 py-2.5 text-sm sm:text-base font-medium text-white placeholder-slate-400/80"
            />

            {/* Clear Button */}
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                className="p-2 text-slate-400 hover:text-white rounded-xl transition-colors mr-1"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* GPS Locate Pill */}
            <button
              onClick={handleGPS}
              className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-black flex items-center gap-2 transition-all shrink-0 mr-1 shadow-md hover:scale-[1.02] active:scale-[0.98]"
              title="Locate via GPS"
            >
              <Crosshair className="w-4 h-4" />
              <span className="hidden sm:inline">Use GPS</span>
            </button>
          </div>

          {/* Autocomplete Dropdown */}
          {searchFocused && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-[#09110d]/98 backdrop-blur-2xl border border-emerald-500/30 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-[9999] overflow-hidden divide-y divide-white/5 max-h-72 overflow-y-auto">
              {searchResults.map((item, idx) => {
                const parts = item.display_name.split(',');
                const isSelected = idx === selectedResultIndex;
                return (
                  <button
                    key={idx}
                    onMouseDown={() => selectSearchResult(item)}
                    className={`w-full text-left p-3.5 sm:p-4 flex items-start gap-3 transition-colors ${
                      isSelected ? 'bg-emerald-500/20 text-white' : 'hover:bg-emerald-500/10'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{parts.slice(0, 2).join(',')}</p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{parts.slice(2, 5).join(',')}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-emerald-400" /> Trending:
          </span>
          {QUICK_SEARCH_PILLS.map((pill, i) => (
            <button
              key={i}
              onClick={() => {
                setSearchQuery(pill.query);
                searchLocation(pill.query).then((res) => {
                  if (res.length) selectSearchResult(res[0]);
                });
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm bg-slate-900/90 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/40 text-slate-200 hover:text-emerald-300 shrink-0 transition-all font-bold shadow-md hover:scale-[1.03] active:scale-[0.98]"
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. BALANCED RESPONSIVE TWO-COLUMN SPLIT (Any Device Adaptive)
          Full-screen fluid layout that aligns perfectly on mobile, tablet & desktop!
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 lg:gap-4 xl:gap-5 items-start w-full">
        {/* ── LEFT COLUMN (7 COLS): SATELLITE MAP + LOCATION CONFIG ── */}
        <div className="lg:col-span-7 flex flex-col gap-3 min-w-0 w-full">
          {/* Viewport-Adaptive Satellite Map Canvas */}
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-slate-950 h-[300px] sm:h-[360px] md:h-[400px] lg:h-[calc(100vh-330px)] min-h-[320px] max-h-[520px] xl:max-h-[580px] 2xl:max-h-[660px] w-full">
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Custom Roof Tracing Overlay Banner */}
            {mode === 'draw' && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/95 backdrop-blur-md border border-amber-400/50 px-3.5 py-1.5 rounded-2xl shadow-2xl flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="text-xs font-bold text-white">
                  Tracing Roof: Click points along edges ({drawPointCount} pts)
                </span>
                <button
                  onClick={finishDrawingRoof}
                  className="px-3.5 py-1 bg-emerald-500 text-slate-950 rounded-xl text-xs font-black hover:bg-emerald-400 shadow-md transition-all hover:scale-105 active:scale-95"
                >
                  Done
                </button>
                <button
                  onClick={cancelDrawingRoof}
                  className="p-1 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Candidate Outlines Banner */}
            {showCandidates && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-blue-950/95 backdrop-blur-md border border-blue-400/50 px-3.5 py-1.5 rounded-2xl shadow-2xl flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-xs font-semibold text-blue-200">
                  Click any dashed blue building to select it
                </span>
                <button
                  onClick={clearCandidateOutlines}
                  className="px-2.5 py-1 bg-slate-800 text-slate-200 rounded-lg text-xs font-bold hover:text-white border border-white/10"
                >
                  Hide
                </button>
              </div>
            )}

            {/* Loading Indicator */}
            {isDetecting && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center z-[1500] gap-3">
                <div className="w-10 h-10 rounded-full border-3 border-emerald-400 border-t-transparent animate-spin" />
                <p className="text-xs sm:text-sm font-bold text-emerald-400">Scanning Satellite Rooftop Footprints…</p>
              </div>
            )}

            {/* Floating Status & Candidate Toggle (Top-Left) */}
            <div className="absolute top-3 left-3 z-[1000] pointer-events-auto flex items-center gap-2">
              <div className="bg-slate-900/90 backdrop-blur-md border border-white/15 rounded-xl px-3 py-1.5 text-xs text-slate-200 shadow-xl flex items-center gap-2 max-w-[260px] truncate font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{statusText}</span>
              </div>

              {/* Browse Candidate Roofs Button */}
              {candidateCount > 0 && (
                <button
                  onClick={toggleCandidateOutlines}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xl transition-all border ${
                    showCandidates
                      ? 'bg-blue-500/25 text-blue-300 border-blue-400/50 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                      : 'bg-slate-900/90 text-slate-200 border-white/15 hover:text-white hover:bg-slate-800'
                  } hover:scale-[1.02] active:scale-[0.98]`}
                  title={showCandidates ? 'Hide candidate outlines' : 'Show nearby candidate roofs to choose from'}
                >
                  {showCandidates ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-blue-400" />}
                  <span>{showCandidates ? 'Hide' : `Roofs (${candidateCount})`}</span>
                </button>
              )}

              {/* Undo Selection button */}
              {previousPolygonRef.current && (
                <button
                  onClick={handleUndoSelection}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900/90 text-slate-200 border border-white/15 hover:text-white hover:bg-slate-800 hover:border-amber-400/40 flex items-center gap-1.5 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                  title="Undo and revert to previous rooftop"
                >
                  <Undo2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Undo</span>
                </button>
              )}
            </div>

            {/* Swift Drag Hint (Bottom-Center) */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
              <div className="bg-slate-900/90 backdrop-blur-md border border-emerald-500/40 rounded-full px-3.5 py-1 text-xs text-emerald-300 shadow-2xl flex items-center gap-1.5 font-medium">
                <Move className="w-3.5 h-3.5 text-emerald-400" />
                <span>Drag inside roof or <strong>✥</strong> to slide onto house</span>
              </div>
            </div>
          </div>

          {/* ── SELECTED LOCATION DETAILS CARD (Compact & Screen-Fit) ── */}
          <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-3.5 sm:p-4 shadow-2xl space-y-2.5">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                Site &amp; Property Config
              </span>
              <span className="text-[11px] text-slate-400 font-mono bg-slate-950/80 px-2 py-0.5 rounded-lg border border-white/5 font-semibold">
                {currentLat.toFixed(4)}° N, {currentLon.toFixed(4)}° E
              </span>
            </div>

            {/* 3-Column Inputs with refined styling */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* City / Locality */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  City / Locality
                </label>
                <input
                  type="text"
                  value={siteInput.city || ''}
                  onChange={(e) => updateSiteInput({ city: e.target.value, address: e.target.value })}
                  placeholder="e.g. Bengaluru"
                  className="w-full bg-slate-950/90 border border-white/15 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-white focus:outline-none focus:ring-1.5 focus:ring-emerald-500 placeholder-slate-500 transition-all shadow-inner"
                />
              </div>

              {/* State (DISCOM Subsidy) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  State (DISCOM Subsidy)
                </label>
                <div className="relative">
                  <select
                    value={siteInput.state || 'Karnataka'}
                    onChange={(e) => updateSiteInput({ state: e.target.value })}
                    className="w-full bg-slate-950/90 border border-white/15 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-white appearance-none focus:outline-none focus:ring-1.5 focus:ring-emerald-500 pr-8 transition-all shadow-inner"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s} className="bg-slate-900 text-white font-medium">
                        {s}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Property Classification Pills */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Property Classification
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { type: 'Residential' as const, label: 'Home', icon: Sun },
                    { type: 'Commercial' as const, label: 'Shop', icon: Building2 },
                    { type: 'Plot' as const, label: 'Plot', icon: LayoutGrid },
                  ].map(({ type, label, icon: Icon }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => updateSiteInput({ propertyType: type })}
                      className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                        siteInput.propertyType === type
                          ? 'bg-emerald-500/25 border-emerald-500 text-emerald-300 shadow-emerald-500/20'
                          : 'bg-slate-950/70 border-white/10 text-slate-400 hover:bg-slate-800 hover:text-white'
                      } hover:scale-[1.02] active:scale-[0.98]`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Address Banner */}
            <div className="bg-slate-950/80 border border-white/10 rounded-xl p-2.5 flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 shrink-0">
                  Geo-Tagged Address:
                </span>
                <p className="text-xs font-semibold text-white truncate">
                  {siteInput.address || siteInput.city || 'Coordinates selected on satellite map'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (5 COLS): LIVE METRICS & EDITING STUDIO (Zero Horizontal/Vertical Clipping) ── */}
        <div className="lg:col-span-5 flex flex-col gap-3 min-w-0">
          {/* 1. Live Solar Metrics Card */}
          <div className="bg-gradient-to-br from-slate-900 via-[#07130d] to-slate-950 border border-emerald-500/30 rounded-3xl p-3.5 sm:p-4 shadow-2xl relative space-y-3 min-w-0">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs font-black text-white uppercase tracking-wider truncate">
                  Live Solar Estimation
                </span>
              </div>
              <span className="shrink-0 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                {cornerCount} Corners
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
              <div className="bg-slate-950/60 rounded-xl p-2.5 border border-white/5 min-w-0">
                <span className="text-[11px] text-slate-400 font-medium block mb-0.5">Rooftop Area</span>
                <p className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
                  {fmt(detectedGrossArea)} <span className="text-[11px] font-normal text-slate-400">sq ft</span>
                </p>
              </div>

              <div className="bg-slate-950/60 rounded-xl p-2.5 border border-white/5 min-w-0">
                <span className="text-[11px] text-slate-400 font-medium block mb-0.5">Shadow-Free</span>
                <p className="text-lg sm:text-xl font-black text-emerald-400 tracking-tight truncate">
                  ~{fmt(detectedUsableArea)} <span className="text-[11px] font-normal text-slate-400">sq ft</span>
                </p>
              </div>

              <div className="bg-slate-950/60 rounded-xl p-2.5 border border-white/5 min-w-0">
                <span className="text-[11px] text-slate-400 font-medium block mb-0.5">Est. Solar Capacity</span>
                <p className="text-lg sm:text-xl font-black text-amber-400 truncate">{estKw} kW</p>
                <span className="text-[10px] text-slate-500 truncate block">~{estPanels} panels (400W)</span>
              </div>

              <div className="bg-slate-950/60 rounded-xl p-2.5 border border-white/5 min-w-0">
                <span className="text-[11px] text-slate-400 font-medium block mb-0.5">Annual Output</span>
                <p className="text-lg sm:text-xl font-black text-lime-400 truncate">{fmt(estAnnualUnits)}</p>
                <span className="text-[10px] text-slate-500 truncate block">kWh units / year</span>
              </div>
            </div>
          </div>

          {/* 2. Polygon Editing & Swift Move Studio */}
          <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-3.5 sm:p-4 shadow-2xl space-y-3 min-w-0">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <Sliders className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-black text-white uppercase tracking-wider truncate">
                  Reshape &amp; Position Roof
                </span>
              </div>
              <button
                onClick={resetToOriginal}
                className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-300 hover:text-white bg-slate-950/80 hover:bg-slate-800 border border-white/10 hover:border-emerald-500/40 flex items-center gap-1 transition-all"
                title="Reset to detected shape"
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                <span>Reset</span>
              </button>
            </div>

            {/* Tactile Directional Nudge Control (Redesigned Aesthetic Buttons) */}
            <div className="bg-slate-950/70 rounded-2xl p-2.5 border border-white/5 space-y-2">
              <span className="text-xs font-bold text-slate-300 block">Nudge Roof Position (3m)</span>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: 'North', icon: ArrowUp, dx: 3, dy: 0 },
                  { label: 'South', icon: ArrowDown, dx: -3, dy: 0 },
                  { label: 'West', icon: ArrowLeft, dx: 0, dy: -3 },
                  { label: 'East', icon: ArrowRight, dx: 0, dy: 3 },
                ].map(({ label, icon: Icon, dx, dy }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => nudgePolygon(dx, dy)}
                    className="py-2.5 px-1 sm:px-2 rounded-xl bg-slate-900/90 hover:bg-emerald-500/20 text-slate-200 hover:text-emerald-300 border border-white/10 hover:border-emerald-500/50 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 group cursor-pointer"
                  >
                    <Icon className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] sm:text-xs">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Rotation & Scale Sliders */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-950/60 rounded-xl p-2 border border-white/5 min-w-0">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 text-[11px] font-semibold">Rotation</span>
                  <span className="text-emerald-400 font-black text-xs">{rotationDeg}°</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={2}
                  value={rotationDeg}
                  onChange={(e) => handleRotationChange(Number(e.target.value))}
                  className="w-full h-2 appearance-none bg-slate-800 rounded-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="bg-slate-950/60 rounded-xl p-2 border border-white/5 min-w-0">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 text-[11px] font-semibold">Scale</span>
                  <span className="text-emerald-400 font-black text-xs">{scalePercent}%</span>
                </div>
                <input
                  type="range"
                  min={40}
                  max={220}
                  step={5}
                  value={scalePercent}
                  onChange={(e) => handleScaleChange(Number(e.target.value))}
                  className="w-full h-2 appearance-none bg-slate-800 rounded-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Trace Roof & Browse Candidates Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={mode === 'draw' ? finishDrawingRoof : startDrawMode}
                className={`flex-1 py-3 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-all border shadow-sm active:scale-95 cursor-pointer ${
                  mode === 'draw'
                    ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.4)] animate-pulse'
                    : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30 hover:border-amber-400/60'
                }`}
              >
                <PenTool className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{mode === 'draw' ? `Done (${drawPointCount} pts)` : 'Trace Roof'}</span>
              </button>

              <button
                onClick={toggleCandidateOutlines}
                className={`flex-1 py-3 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-all border shadow-sm active:scale-95 cursor-pointer ${
                  showCandidates
                    ? 'bg-blue-500/25 text-blue-300 border-blue-400 shadow-[0_0_16px_rgba(59,130,246,0.3)]'
                    : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border-blue-500/30 hover:border-blue-400/60'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate">{showCandidates ? 'Hide Roofs' : `Roofs (${candidateCount})`}</span>
              </button>
            </div>

            {/* Quick Plot Presets */}
            <div className="grid grid-cols-2 gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => applyPresetShape(p)}
                  className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold border transition-all text-left shadow-sm active:scale-95 truncate cursor-pointer ${
                    activePreset === p.key
                      ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-sm'
                      : 'bg-slate-950/70 border-white/10 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-white/20'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Confirm CTA Button - Premium Gradient & Inner Glow */}
            {onAreaConfirmed && (
              <button
                onClick={() => onAreaConfirmed(detectedGrossArea)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm sm:text-base tracking-wide shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/50 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-5 h-5 stroke-[3]" />
                <span>Confirm {fmt(detectedGrossArea)} sq ft &amp; Continue →</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
