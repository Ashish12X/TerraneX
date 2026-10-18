import { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Marker,
  Tooltip,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const API = (import.meta.env.VITE_API_URL || "https://terranex-backend.onrender.com").replace(/\/$/, "");
const RUDRAPRAYAG_CENTER = [30.55, 79.05];
const RUDRAPRAYAG_ZOOM = 10;

// Custom Leaflet DivIcons for Nodes
const createHospitalIcon = () =>
  L.divIcon({
    className: "custom-hospital-icon",
    html: `
      <div style="background:#dc2626; width:26px; height:26px; border-radius:6px; border:2px solid #ffffff; display:flex; align-items:center; justify-content:center; box-shadow:0 0 12px rgba(220,38,38,0.8);">
        <span style="color:#ffffff; font-weight:900; font-size:16px; line-height:1;">+</span>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });

const createDepotIcon = (depotType) => {
  const isMachinery = depotType === "pwd_bro_machinery_depot";
  const isSdrf = depotType === "sdrf_ndrf_base";
  const bg = isMachinery ? "#f59e0b" : isSdrf ? "#3b82f6" : "#06b6d4";
  const symbol = isMachinery ? "⚙" : isSdrf ? "🛡" : "✚";

  return L.divIcon({
    className: "custom-depot-icon",
    html: `
      <div style="background:${bg}; width:24px; height:24px; border-radius:50%; border:2px solid #ffffff; display:flex; align-items:center; justify-content:center; box-shadow:0 0 10px ${bg};">
        <span style="color:#ffffff; font-size:12px; font-weight:bold;">${symbol}</span>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Map Pan/Resize Helper
function MapController({ selectedCoord, mobileTab }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const timer = setTimeout(() => {
      try {
        map.invalidateSize();
      } catch {
        // Ignored
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [mobileTab, map]);

  useEffect(() => {
    if (!map || !selectedCoord) return;
    try {
      const z = map.getZoom();
      const targetZoom = typeof z === "number" && !isNaN(z) ? Math.max(z, 11) : 11;
      map.flyTo(selectedCoord, targetZoom, { duration: 0.8 });
    } catch {
      // Ignored
    }
  }, [selectedCoord, map]);

  return null;
}

// Risk Gradient Helper (0.0 to 1.0)
function getProbabilityColor(prob, isBlocked) {
  if (isBlocked || prob >= 0.6) return "#ef4444"; // Crimson Red (Blocked/High Crisis)
  if (prob >= 0.45) return "#f97316"; // Orange (Critical Warning)
  if (prob >= 0.25) return "#eab308"; // Amber (Elevated Risk)
  return "#10b981"; // Emerald Green (Operational)
}

function getProbabilityLabel(prob, isBlocked) {
  if (isBlocked || prob >= 0.6)
    return { label: "CRITICAL HAZARD / BLOCKED", badgeClass: "bg-red-500/20 text-red-400 border-red-500/40" };
  if (prob >= 0.45)
    return { label: "SEVERE RISK WARNING", badgeClass: "bg-orange-500/20 text-orange-400 border-orange-500/40" };
  if (prob >= 0.25)
    return { label: "ELEVATED RISK", badgeClass: "bg-amber-500/20 text-amber-400 border-amber-500/40" };
  return { label: "SAFE / OPERATIONAL", badgeClass: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" };
}

export default function App() {
  // Operational Modes: "live" (Real-time Live) vs "simulation" (Interactive Simulator)
  const [mode, setMode] = useState("live");

  // Real-time 24h Early Warning Timeline State
  const [timelineData, setTimelineData] = useState(null);
  const [currentHour, setCurrentHour] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Simulation Mode Controls
  const [simRain, setSimRain] = useState(85);
  const [simPrior1, setSimPrior1] = useState(10);
  const [simPrior2, setSimPrior2] = useState(5);
  const [simThreshold, setSimThreshold] = useState(0.5);

  // Core Data States
  const [network, setNetwork] = useState(null);
  const [depots, setDepots] = useState([]);
  const [dispatchPlan, setDispatchPlan] = useState(null);
  const [simulationRisk, setSimulationRisk] = useState(null);

  // Inspection & UI Panels
  const [selectedSegmentId, setSelectedSegmentId] = useState("E06");
  const [selectedSegmentData, setSelectedSegmentData] = useState(null);
  const [rightTab, setRightTab] = useState("explain"); // "explain" | "timeline" | "dispatch"
  const [mobileTab, setMobileTab] = useState("map"); // "map" | "panel"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 1. Initial Load: Network Topology & Depots
  useEffect(() => {
    fetch(`${API}/network`)
      .then((r) => r.json())
      .then((d) => setNetwork(d))
      .catch((e) => setError(`Network load error: ${e.message}`));

    fetch(`${API}/depots`)
      .then((r) => r.json())
      .then((d) => setDepots(d.depots || []))
      .catch((e) => console.warn("Depots fetch warning:", e));
  }, []);

  // 2. Fetch 24-Hour Timeline in Live Mode
  useEffect(() => {
    if (mode !== "live") return;
    const fetchTimeline = () => {
      fetch(`${API}/risk/timeline?hours=24&threshold=0.5`)
        .then((r) => r.json())
        .then((d) => {
          setTimelineData(d);
          setError("");
        })
        .catch((e) => setError(`Timeline fetch error: ${e.message}`));
    };
    fetchTimeline();
    const interval = setInterval(fetchTimeline, 10 * 60 * 1000); // 10 min sync
    return () => clearInterval(interval);
  }, [mode]);

  // 3. Play/Pause Timeline Animation
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentHour((prev) => (prev + 1) % 24);
    }, 1400);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // 4. Fetch Dynamic Dispatch Plan (syncs with current hour in Live, or sliders in Simulation)
  useEffect(() => {
    let url = "";
    if (mode === "live") {
      url = `${API}/dispatch/plan?mode=live&hour=${currentHour}&threshold=0.5`;
    } else {
      url = `${API}/dispatch/plan?mode=simulation&rainfall_mm=${simRain}&prior1=${simPrior1}&prior2=${simPrior2}&threshold=${simThreshold}`;
    }

    setLoading(true);
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setDispatchPlan(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(`Dispatch plan error: ${e.message}`);
        setLoading(false);
      });
  }, [mode, currentHour, simRain, simPrior1, simPrior2, simThreshold]);

  // 5. Fetch Simulation Risk Breakdown across all segments
  useEffect(() => {
    if (mode !== "simulation") return;
    fetch(
      `${API}/risk/simulation?rainfall_mm=${simRain}&prior1=${simPrior1}&prior2=${simPrior2}&threshold=${simThreshold}`
    )
      .then((r) => r.json())
      .then((d) => setSimulationRisk(d))
      .catch((e) => console.warn("Simulation risk error:", e));
  }, [mode, simRain, simPrior1, simPrior2, simThreshold]);

  // 6. Fetch Detailed Explainability for Selected Segment
  useEffect(() => {
    if (!selectedSegmentId) return;

    let rainVal = 0.0;
    let p1Val = 0.0;
    let p2Val = 0.0;

    if (mode === "live") {
      if (timelineData?.timeline && timelineData.timeline[currentHour]) {
        rainVal = timelineData.timeline[currentHour].rainfall_mm || 0.0;
      }
      p1Val = 10.0; // live antecedent baseline
      p2Val = 5.0;
    } else {
      rainVal = simRain;
      p1Val = simPrior1;
      p2Val = simPrior2;
    }

    fetch(
      `${API}/risk/segment/${selectedSegmentId}?rainfall_mm=${rainVal}&prior1=${p1Val}&prior2=${p2Val}&threshold=${simThreshold}`
    )
      .then((r) => r.json())
      .then((d) => setSelectedSegmentData(d))
      .catch((e) => console.warn("Segment detail error:", e));
  }, [selectedSegmentId, mode, currentHour, simRain, simPrior1, simPrior2, simThreshold, timelineData]);

  // Derive Current Edge Probabilities for Map Rendering
  const currentHourStep =
    mode === "live" && timelineData?.timeline ? timelineData.timeline[currentHour] : null;

  const getEdgeState = (edgeId) => {
    if (mode === "live") {
      if (currentHourStep?.edge_risks && currentHourStep.edge_risks[edgeId]) {
        return currentHourStep.edge_risks[edgeId];
      }
      return { probability: 0.1, blocked: false, dominant_cause: "Safe" };
    } else {
      if (simulationRisk?.segments) {
        const found = simulationRisk.segments.find((s) => s.segment_id === edgeId);
        if (found) {
          return {
            probability: found.probability,
            blocked: found.blocked,
            dominant_cause: found.reasons?.dominant_cause || "Simulation",
          };
        }
      }
      return { probability: 0.1, blocked: false, dominant_cause: "Safe" };
    }
  };

  // Top Metrics Calculation
  const activeBlockedCount =
    mode === "live"
      ? currentHourStep?.blocked_count || 0
      : dispatchPlan?.scenario?.blocked_roads_count || 0;

  const activeIsolatedPop =
    mode === "live"
      ? currentHourStep?.isolated_population || 0
      : dispatchPlan?.summary?.total_isolated_population || 0;

  const activeCutoffCount =
    mode === "live"
      ? currentHourStep?.isolated_settlements_count || 0
      : dispatchPlan?.summary?.total_cut_off_settlements || 0;

  const activeRainfallDisplay =
    mode === "live"
      ? `${currentHourStep?.rainfall_mm || 0.0} mm/hr (T+${currentHour}h)`
      : `${simRain} mm (Effective load)`;

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* 1. TOP CRISIS COMMAND HEADER */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 text-red-400 font-black">
            TX
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              TERRANEX
              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                Command Deck
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Rudraprayag Landslide Intelligence & Dispatch</p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex items-center">
            <button
              onClick={() => {
                setMode("live");
                setIsPlaying(false);
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                mode === "live"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              Real-time Live
            </button>
            <button
              onClick={() => {
                setMode("simulation");
                setIsPlaying(false);
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                mode === "simulation"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-900/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-300" />
              Simulation Mode
            </button>
          </div>

          {/* Mobile Tab Switcher */}
          <div className="flex md:hidden bg-slate-800 p-0.5 rounded">
            <button
              onClick={() => setMobileTab("map")}
              className={`px-2 py-1 text-[11px] rounded ${mobileTab === "map" ? "bg-slate-700 text-white" : "text-slate-400"}`}
            >
              Map
            </button>
            <button
              onClick={() => setMobileTab("panel")}
              className={`px-2 py-1 text-[11px] rounded ${mobileTab === "panel" ? "bg-slate-700 text-white" : "text-slate-400"}`}
            >
              Data
            </button>
          </div>
        </div>
      </header>

      {/* 2. TOP SITUATIONAL METRIC CARDS */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-2 grid grid-cols-2 md:grid-cols-5 gap-2 shrink-0 z-10 text-xs">
        <div className="bg-slate-950/70 border border-slate-800 rounded p-2 flex flex-col justify-between">
          <span className="text-slate-400 text-[10px] font-medium uppercase tracking-wider">
            {mode === "live" ? "Forecast Rainfall" : "Simulation Rain"}
          </span>
          <span className="text-sm font-bold text-white font-mono">{activeRainfallDisplay}</span>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded p-2 flex flex-col justify-between">
          <span className="text-slate-400 text-[10px] font-medium uppercase tracking-wider">Blocked Roads</span>
          <span className="text-sm font-bold text-red-400 font-mono flex items-center gap-1.5">
            {activeBlockedCount} Corridors
            {activeBlockedCount > 0 && <span className="text-[10px] px-1 py-0.2 bg-red-950/80 text-red-400 rounded border border-red-800/60">SEVERED</span>}
          </span>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded p-2 flex flex-col justify-between">
          <span className="text-slate-400 text-[10px] font-medium uppercase tracking-wider">Isolated Population</span>
          <span className="text-sm font-bold text-amber-400 font-mono">
            {activeIsolatedPop.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">in {activeCutoffCount} villages</span>
          </span>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded p-2 flex flex-col justify-between">
          <span className="text-slate-400 text-[10px] font-medium uppercase tracking-wider">Active Depots</span>
          <span className="text-sm font-bold text-cyan-400 font-mono">
            {depots.length} Operational <span className="text-[10px] text-slate-400 font-normal">Staging Bases</span>
          </span>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded p-2 flex flex-col justify-between col-span-2 md:col-span-1">
          <span className="text-slate-400 text-[10px] font-medium uppercase tracking-wider">Patient Evacuation</span>
          <span className="text-sm font-bold text-purple-400 font-mono">
            {activeCutoffCount > 0 ? "Airlift Standby" : "Surface Road Viable"}
          </span>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE (CENTER MAP + RIGHT CRISIS PANEL) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* CENTER MAP CONTAINER */}
        <div className={`flex-1 flex flex-col relative h-full ${mobileTab === "panel" ? "hidden md:flex" : "flex"}`}>
          <div className="flex-1 w-full h-full relative">
            <MapContainer
              center={RUDRAPRAYAG_CENTER}
              zoom={RUDRAPRAYAG_ZOOM}
              scrollWheelZoom={true}
              className="w-full h-full z-0 bg-slate-950"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, DeLorme, NAVTEQ'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                maxZoom={16}
              />

              <MapController selectedCoord={null} mobileTab={mobileTab} />

              {/* A. ROAD SEGMENTS (Probability Gradient Polyline) */}
              {network?.edges?.map((edge) => {
                const state = getEdgeState(edge.id);
                const color = getProbabilityColor(state.probability, state.blocked);
                const isSelected = selectedSegmentId === edge.id;
                const isTrek = edge.road_type === "trek" || edge.road_class === "path";

                return (
                  <Polyline
                    key={edge.id}
                    positions={edge.coordinates || []}
                    pathOptions={{
                      color: isSelected ? "#06b6d4" : color,
                      weight: isSelected ? 6.5 : state.blocked ? 5.5 : isTrek ? 3.5 : 4.0,
                      dashArray: isTrek ? "4, 6" : isSelected ? "8, 4" : undefined,
                      opacity: isSelected ? 1.0 : state.blocked ? 0.95 : 0.85,
                    }}
                    eventHandlers={{
                      click: () => {
                        setSelectedSegmentId(edge.id);
                        setRightTab("explain");
                        if (window.innerWidth < 768) setMobileTab("panel");
                      },
                    }}
                  >
                    <Tooltip sticky className="custom-tooltip">
                      <div className="text-xs p-1">
                        <div className="font-bold text-slate-100">{edge.name || edge.id}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Slope: {edge.mean_gradient_pct || edge.max_gradient_pct || "N/A"}% • Length: {edge.length_km} km
                        </div>
                        <div className="text-[10px] mt-1 font-semibold" style={{ color }}>
                          Estimated Risk: {(state.probability * 100).toFixed(1)}% ({state.blocked ? "BLOCKED" : "OPERATIONAL"})
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">Click for Caine (1980) explainability</div>
                      </div>
                    </Tooltip>
                  </Polyline>
                );
              })}

              {/* B. VILLAGES MARKERS */}
              {network?.nodes
                ?.filter((n) => n.type === "village")
                .map((v) => (
                  <CircleMarker
                    key={v.id}
                    center={[v.lat, v.lon]}
                    radius={6}
                    pathOptions={{
                      fillColor: "#10b981",
                      fillOpacity: 0.9,
                      color: "#ffffff",
                      weight: 1.5,
                    }}
                    eventHandlers={{
                      click: () => {
                        setRightTab("dispatch");
                      },
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -6]}>
                      <span className="font-semibold text-xs">{v.name}</span>
                      <span className="text-[10px] text-slate-400 ml-1">({v.population || 500} pop)</span>
                    </Tooltip>
                  </CircleMarker>
                ))}

              {/* C. HOSPITALS MARKERS */}
              {network?.nodes
                ?.filter((n) => n.type === "hospital")
                .map((h) => (
                  <Marker key={h.id} position={[h.lat, h.lon]} icon={createHospitalIcon()}>
                    <Tooltip direction="top" offset={[0, -14]}>
                      <span className="font-bold text-xs text-red-400">{h.name}</span>
                      <div className="text-[10px] text-slate-300">Base Medical Facility</div>
                    </Tooltip>
                  </Marker>
                ))}

              {/* D. EMERGENCY DEPOTS MARKERS */}
              {depots.map((d) => (
                <Marker key={d.id} position={[d.lat, d.lon]} icon={createDepotIcon(d.type)}>
                  <Popup className="custom-popup">
                    <div className="text-xs p-1">
                      <div className="font-bold text-slate-900">{d.name}</div>
                      <div className="text-[10px] text-slate-600 mb-1">{d.type.replace(/_/g, " ").toUpperCase()}</div>
                      <div className="grid grid-cols-2 gap-1 text-[10px] bg-slate-100 p-1 rounded font-mono">
                        <div>🚑 Amb: {d.resources.ambulance}</div>
                        <div>🛡 Rescue: {d.resources.rescue_team}</div>
                        <div>⚙ Excv: {d.resources.excavator}</div>
                        <div>✚ Med: {d.resources.medical_team}</div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Map Legend (Floating Overlay) */}
            <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 backdrop-blur-md text-[11px] space-y-1.5 shadow-xl max-w-xs pointer-events-auto">
              <div className="font-semibold text-slate-300 text-[10px] uppercase tracking-wider flex justify-between items-center">
                <span>Landslide Risk Scale</span>
                <span className="text-[9px] text-slate-400">P(Blockage)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-slate-300">&lt; 25% Operational (Low risk)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-1.5 rounded-full bg-amber-500" />
                <span className="text-slate-300">25–45% Elevated Risk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-1.5 rounded-full bg-orange-500" />
                <span className="text-slate-300">45–60% Hazard Warning</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-1.5 rounded-full bg-red-500" />
                <span className="text-red-400 font-semibold">&gt; 60% Critical Hazard / Severed</span>
              </div>
              <div className="border-t border-slate-800/80 pt-1 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-red-600 inline-block text-[9px] text-center text-white leading-none">+</span>
                  Hospital
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                  SDRF Base
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  PWD Equipment
                </span>
              </div>
            </div>
          </div>

          {/* BOTTOM TIMELINE CONTROL (Early Warning T+0 to T+24h) */}
          <div className="bg-slate-900 border-t border-slate-800 p-3 z-10 shrink-0">
            {mode === "live" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={isPlaying ? "destructive" : "default"}
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="h-7 px-2.5 text-xs font-semibold gap-1.5"
                    >
                      {isPlaying ? "⏸ Pause Timeline" : "▶ Play 24h Early Warning"}
                    </Button>
                    <span className="font-mono text-cyan-400 font-semibold">
                      T+{currentHour}h: {currentHourStep?.time || "Now"}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Predicted Rain: <b className="text-white">{currentHourStep?.rainfall_mm || 0} mm/hr</b> • Blocked:{" "}
                    <b className="text-red-400">{currentHourStep?.blocked_count || 0}</b> • Cut-off:{" "}
                    <b className="text-amber-400">{currentHourStep?.isolated_population || 0} pop</b>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-slate-400">T+0h</span>
                  <Slider
                    value={[currentHour]}
                    min={0}
                    max={23}
                    step={1}
                    onValueChange={(v) => {
                      setCurrentHour(v[0]);
                      setIsPlaying(false);
                    }}
                    className="flex-1"
                  />
                  <span className="text-[10px] font-mono text-slate-400">T+23h</span>
                </div>
              </div>
            ) : (
              /* Simulation Mode Sliders & Presets */
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                    ⚙ Interactive Crisis Simulation Sliders
                  </span>
                  <div className="flex gap-1.5 text-[10px]">
                    <button
                      onClick={() => {
                        setSimRain(20);
                        setSimPrior1(0);
                        setSimPrior2(0);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      Baseline (20mm)
                    </button>
                    <button
                      onClick={() => {
                        setSimRain(55);
                        setSimPrior1(10);
                        setSimPrior2(5);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      Pre-alert (55mm)
                    </button>
                    <button
                      onClick={() => {
                        setSimRain(85);
                        setSimPrior1(20);
                        setSimPrior2(10);
                      }}
                      className="px-2 py-0.5 rounded bg-red-950/80 border border-red-800/60 text-red-300 font-medium"
                    >
                      Kedarnath Cut-off (85mm)
                    </button>
                    <button
                      onClick={() => {
                        setSimRain(130);
                        setSimPrior1(40);
                        setSimPrior2(20);
                      }}
                      className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800/60 text-purple-300 font-medium"
                    >
                      Cloudburst (130mm)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Active Rainfall Intensity</span>
                      <b className="font-mono text-white">{simRain} mm</b>
                    </div>
                    <Slider value={[simRain]} min={0} max={150} step={5} onValueChange={(v) => setSimRain(v[0])} />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Prior 24–48h Rain (Weight 0.5)</span>
                      <b className="font-mono text-white">{simPrior1} mm</b>
                    </div>
                    <Slider value={[simPrior1]} min={0} max={80} step={5} onValueChange={(v) => setSimPrior1(v[0])} />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Prior 48–72h Rain (Weight 0.25)</span>
                      <b className="font-mono text-white">{simPrior2} mm</b>
                    </div>
                    <Slider value={[simPrior2]} min={0} max={80} step={5} onValueChange={(v) => setSimPrior2(v[0])} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT CRISIS PANEL (Tabs: Explainability Inspector, Timeline, Dynamic Dispatch) */}
        <div
          className={`w-full md:w-[460px] border-l border-slate-800 bg-slate-900 flex flex-col h-full z-10 ${
            mobileTab === "map" ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Panel Tab Navigation */}
          <div className="p-2 border-b border-slate-800 shrink-0 bg-slate-950/60">
            <Tabs value={rightTab} onValueChange={setRightTab} className="w-full">
              <TabsList className="grid grid-cols-3 w-full bg-slate-900 border border-slate-800">
                <TabsTrigger value="explain" className="text-xs">
                  Explainability
                </TabsTrigger>
                <TabsTrigger value="timeline" className="text-xs">
                  Early Warning
                </TabsTrigger>
                <TabsTrigger value="dispatch" className="text-xs">
                  Dispatch Plan
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* ======================================================== */}
            {/* TAB 1: EXPLAINABILITY INSPECTOR                          */}
            {/* ======================================================== */}
            {rightTab === "explain" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Segment Diagnostic Inspector
                  </h3>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {selectedSegmentId}
                  </Badge>
                </div>

                {selectedSegmentData ? (
                  <div className="space-y-3.5">
                    {/* Header Card */}
                    <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-sm text-white">{selectedSegmentData.name}</h4>
                          <span className="text-[11px] text-slate-400">
                            Road Class: {selectedSegmentData.road_class} • Length: {selectedSegmentData.length_km} km
                          </span>
                        </div>
                        <Badge
                          className={`text-[10px] font-bold border ${
                            getProbabilityLabel(selectedSegmentData.probability, selectedSegmentData.blocked).badgeClass
                          }`}
                        >
                          {getProbabilityLabel(selectedSegmentData.probability, selectedSegmentData.blocked).label}
                        </Badge>
                      </div>

                      {/* Probability Meter */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">Blockage Probability P(Blockage)</span>
                          <b className="font-mono text-white text-sm">
                            {(selectedSegmentData.probability * 100).toFixed(1)}%
                          </b>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, selectedSegmentData.probability * 100)}%`,
                              backgroundColor: getProbabilityColor(
                                selectedSegmentData.probability,
                                selectedSegmentData.blocked
                              ),
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                          <span>0% (Safe)</span>
                          <span>Threshold: 50%</span>
                          <span>100% (Certain Block)</span>
                        </div>
                      </div>
                    </div>

                    {/* Transparent Reasons Breakdown */}
                    <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg space-y-3">
                      <div className="font-semibold text-xs text-slate-200 border-b border-slate-800/80 pb-1.5 flex justify-between">
                        <span>Why will this road block?</span>
                        <span className="text-[10px] font-mono text-cyan-400">
                          Cause: {selectedSegmentData.reasons.dominant_cause}
                        </span>
                      </div>

                      {/* Narrative Explanation Sentence */}
                      <Alert className="bg-slate-900 border-slate-800 py-2">
                        <AlertDescription className="text-xs text-slate-200 leading-relaxed font-sans">
                          {selectedSegmentData.reasons.explanation}
                        </AlertDescription>
                      </Alert>

                      {/* Three Core Scientific Drivers */}
                      <div className="space-y-2 text-xs">
                        {/* 1. Slope */}
                        <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                          <div>
                            <span className="text-slate-300 font-medium">Terrain Slope Gradient</span>
                            <div className="text-[10px] text-slate-400">
                              Normalized steepness (40% model weight)
                            </div>
                          </div>
                          <div className="text-right font-mono">
                            <span className="text-white font-bold">{selectedSegmentData.reasons.slope_gradient_pct}%</span>
                            <div className="text-[10px] text-slate-400">
                              contrib: +{(selectedSegmentData.reasons.slope_contribution * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>

                        {/* 2. Rainfall Intensity vs Caine 1980 */}
                        <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                          <div>
                            <span className="text-slate-300 font-medium">Caine (1980) Critical Intensity</span>
                            <div className="text-[10px] text-slate-400">
                              Threshold: {selectedSegmentData.reasons.caine_threshold_mm_hr} mm/hr (40% weight)
                            </div>
                          </div>
                          <div className="text-right font-mono">
                            <span className="text-white font-bold">{selectedSegmentData.reasons.hourly_rainfall_mm} mm/hr</span>
                            <div className="text-[10px] text-amber-400">
                              ratio: {selectedSegmentData.reasons.intensity_ratio}x
                            </div>
                          </div>
                        </div>

                        {/* 3. Antecedent Saturation */}
                        <div className="flex justify-between items-center py-1">
                          <div>
                            <span className="text-slate-300 font-medium">72h Prior Soil Saturation</span>
                            <div className="text-[10px] text-slate-400">
                              Weighted decay (0.5 R₁ + 0.25 R₂) (20% weight)
                            </div>
                          </div>
                          <div className="text-right font-mono">
                            <span className="text-white font-bold">{selectedSegmentData.reasons.antecedent_72h_mm} mm</span>
                            <div className="text-[10px] text-slate-400">
                              contrib: +{(selectedSegmentData.reasons.antecedent_contribution * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Machine Learning Prediction Card */}
                    {selectedSegmentData.reasons?.ml_probability !== undefined && (
                      <div className="bg-gradient-to-r from-indigo-950/50 via-purple-950/30 to-slate-950/70 border border-indigo-700/50 p-3 rounded-lg space-y-2">
                        <div className="flex items-center justify-between border-b border-indigo-800/40 pb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                            <span className="text-xs font-semibold text-indigo-200">ML Landslide Predictor</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] bg-indigo-900/40 text-indigo-300 border-indigo-600/50">
                            Random Forest (91.4% Acc)
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <div>
                            <div className="text-slate-300 font-medium">Predicted Hazard Level</div>
                            <div className="text-[10px] text-indigo-300 font-mono">
                              {selectedSegmentData.reasons.ml_hazard_class || "Evaluated"}
                            </div>
                          </div>
                          <div className="text-right font-mono">
                            <span className="text-sm font-bold text-indigo-300">
                              {(selectedSegmentData.reasons.ml_probability * 100).toFixed(1)}%
                            </span>
                            <div className="text-[10px] text-slate-400">ML trigger probability</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Scientific Limitation Callout */}
                    <div className="p-2.5 rounded bg-amber-950/20 border border-amber-900/40 text-[10px] text-amber-300/80 leading-relaxed">
                      <b>Scientific Reference &amp; AI Calibration:</b> Empirical threshold from Caine (1980) ($I_c = 14.82 D^{-0.39}$) combined with a supervised Random Forest Classifier trained on Himalayan terrain DEM gradients and precipitation load.
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    Select any road segment on the map to inspect its explainability diagnostics.
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 2: 24-HOUR EARLY WARNING TIMELINE                     */}
            {/* ======================================================== */}
            {rightTab === "timeline" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    24-Hour Crisis Progression
                  </h3>
                  <Badge variant="outline" className="text-[10px] text-cyan-400 font-mono">
                    Open-Meteo Hourly
                  </Badge>
                </div>

                {timelineData?.timeline ? (
                  <div className="space-y-3">
                    {/* Hourly progression list */}
                    <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                      {timelineData.timeline.map((step) => {
                        const isCurrent = currentHour === step.hour;
                        return (
                          <div
                            key={step.hour}
                            onClick={() => {
                              setCurrentHour(step.hour);
                              setIsPlaying(false);
                            }}
                            className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                              isCurrent
                                ? "bg-slate-800/90 border-cyan-500/80 shadow-md shadow-cyan-950/40"
                                : "bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50"
                            }`}
                          >
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-mono font-bold text-white flex items-center gap-1.5">
                                {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                                T+{step.hour}h ({step.time.slice(11, 16)})
                              </span>
                              <span className="font-mono text-cyan-400">{step.rainfall_mm} mm/hr</span>
                            </div>

                            <div className="flex justify-between items-center text-[11px] mt-1.5 pt-1.5 border-t border-slate-800/60">
                              <span className={step.blocked_count > 0 ? "text-red-400 font-semibold" : "text-emerald-400"}>
                                {step.blocked_count} roads at risk
                              </span>
                              <span className={step.isolated_population > 0 ? "text-amber-400 font-semibold" : "text-slate-400"}>
                                {step.isolated_population.toLocaleString()} pop cut-off
                              </span>
                            </div>

                            {/* Top Risky corridor trigger */}
                            {step.top_risky_segments && step.top_risky_segments.length > 0 && (
                              <div className="mt-1 text-[10px] text-slate-400 truncate">
                                Primary threat: <b className="text-slate-200">{step.top_risky_segments[0].name}</b> (
                                {(step.top_risky_segments[0].probability * 100).toFixed(0)}%)
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500 text-xs">Loading 24-hour timeline forecast...</div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 3: DYNAMIC RESOURCE DISPATCH & ACCESS PLAN           */}
            {/* ======================================================== */}
            {rightTab === "dispatch" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Emergency Dispatch &amp; Evacuation Plan
                  </h3>
                  <Badge variant="outline" className="text-[10px] font-mono text-purple-400">
                    {dispatchPlan?.summary?.total_cut_off_settlements || 0} Cut-off
                  </Badge>
                </div>

                {dispatchPlan?.dispatches && dispatchPlan.dispatches.length > 0 ? (
                  <div className="space-y-4">
                    {dispatchPlan.dispatches.map((s) => {
                      const needs = s.calculated_needs;
                      const evac = s.patient_evacuation;
                      const mit = s.mitigation_evaluation;

                      return (
                        <div key={s.settlement_id} className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-3">
                          {/* Village Header & Priority */}
                          <div className="flex justify-between items-start border-b border-slate-800 pb-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-red-600/20 text-red-400 border border-red-500/40 text-[10px] font-bold flex items-center justify-center font-mono">
                                  #{s.triage_priority}
                                </span>
                                <h4 className="font-bold text-sm text-white">{s.settlement_name}</h4>
                              </div>
                              <span className="text-[10px] text-slate-400">
                                Cut-off Population: <b className="text-amber-400 font-mono">{s.population}</b>
                              </span>
                            </div>
                            <Badge
                              className={`text-[9px] ${
                                evac.status === "aerial_evacuation_needed"
                                  ? "bg-purple-950/80 border-purple-800 text-purple-300"
                                  : "bg-emerald-950/80 border-emerald-800 text-emerald-300"
                              }`}
                            >
                              {evac.status === "aerial_evacuation_needed" ? "HELI AIRLIFT REQUIRED" : "SURFACE ROAD VIABLE"}
                            </Badge>
                          </div>

                          {/* 1. Population Needs Breakdown */}
                          <div>
                            <div className="text-[10px] uppercase font-semibold text-slate-400 mb-1">
                              Calculated Disaster Needs (Assumption: Population Triage)
                            </div>
                            <div className="grid grid-cols-3 gap-1 text-[10px] font-mono bg-slate-900 p-2 rounded border border-slate-800/60">
                              <div>
                                🏥 Patients: <b className="text-white">{needs.critical_patients}</b>
                              </div>
                              <div>
                                🚑 Ambulances: <b className="text-white">{needs.ambulances_needed}</b>
                              </div>
                              <div>
                                🛡 Rescue: <b className="text-white">{needs.rescue_teams_needed}</b>
                              </div>
                              <div>
                                ⚙ Excavators: <b className="text-white">{needs.excavator_needed}</b>
                              </div>
                              <div className="col-span-2">
                                📦 Relief Packs: <b className="text-white">{needs.relief_kits_needed}</b>
                              </div>
                            </div>
                          </div>

                          {/* 2. Patient Evacuation Routing */}
                          <div className="p-2 rounded bg-slate-900 border border-slate-800/60 text-xs space-y-1">
                            <div className="text-[10px] uppercase font-semibold text-slate-400 flex justify-between">
                              <span>Patient Evacuation Corridor</span>
                              <span className="text-purple-400 font-mono">{evac.transport_mode}</span>
                            </div>
                            <div className="text-slate-200 font-medium">
                              Destination: {evac.primary_hospital}
                            </div>
                            {evac.status === "surface_evacuation_viable" ? (
                              <div className="text-[10px] text-emerald-400 font-mono">
                                Viable Route: {evac.evacuation_route.join(" → ")} ({evac.distance_km} km • ETA: {evac.eta_minutes}m)
                              </div>
                            ) : (
                              <div className="text-[10px] text-purple-300 leading-tight">
                                {evac.reason} <br />
                                <b>Designated Helipad:</b> {evac.staging_helipad}
                              </div>
                            )}
                          </div>

                          {/* 3. Three Mitigation Options Evaluation */}
                          <div className="space-y-1 text-[11px]">
                            <div className="text-[10px] uppercase font-semibold text-slate-400">
                              3-Way Access Mitigation Analysis
                            </div>

                            {/* Option (a) */}
                            <div className="p-1.5 rounded bg-slate-900 border border-slate-800/40 text-[10px]">
                              <b className="text-cyan-400">Option (a) Alternate Detour:</b>{" "}
                              {mit.option_a_alternate_route.available ? (
                                <span className="text-slate-200">
                                  {mit.option_a_alternate_route.description} ({mit.option_a_alternate_route.eta_minutes}m)
                                </span>
                              ) : (
                                <span className="text-slate-400">
                                  Blocked (All contiguous vehicular roads severed)
                                </span>
                              )}
                            </div>

                            {/* Option (b) */}
                            <div className="p-1.5 rounded bg-slate-900 border border-slate-800/40 text-[10px]">
                              <b className="text-amber-400">Option (b) Excavator Clearance:</b>{" "}
                              <span className="text-slate-200">
                                {mit.option_b_excavator_clearance.description} (Clearance ETA:{" "}
                                {mit.option_b_excavator_clearance.total_clearance_eta_hours}h)
                              </span>
                            </div>

                            {/* Option (c) */}
                            <div className="p-1.5 rounded bg-slate-900 border border-slate-800/40 text-[10px]">
                              <b className="text-purple-400">Option (c) Aerial / Foot Transit:</b>{" "}
                              <span className="text-slate-200">
                                {mit.option_c_foot_or_aerial.description}
                              </span>
                            </div>
                          </div>

                          {/* 4. Assigned Resources Units */}
                          <div>
                            <div className="text-[10px] uppercase font-semibold text-slate-400 mb-1">
                              Assigned Units ({s.assigned_resources.length})
                            </div>
                            <div className="space-y-1">
                              {s.assigned_resources.map((u, i) => (
                                <div
                                  key={i}
                                  className="flex justify-between items-center p-1.5 rounded bg-slate-900 border border-slate-800/60 text-[10px]"
                                >
                                  <div>
                                    <span className="font-bold text-white uppercase font-mono">
                                      {u.quantity}x {u.resource_type}
                                    </span>
                                    <div className="text-slate-400 text-[9px]">{u.depot_name}</div>
                                  </div>
                                  <div className="text-right font-mono">
                                    <span className="text-cyan-400">ETA: {u.eta_minutes}m</span>
                                    <div className="text-[9px] text-slate-400">{u.dispatch_mode}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    {loading ? "Calculating dynamic resource allocation..." : "No cut-off settlements detected in current conditions. All routes operational."}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}