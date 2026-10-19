import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Marker,
  Tooltip,
  Popup,
  useMap,
} from "leaflet";
import {
  MapContainer as ReactMapContainer,
  TileLayer as ReactTileLayer,
  Polyline as ReactPolyline,
  CircleMarker as ReactCircleMarker,
  Marker as ReactMarker,
  Tooltip as ReactTooltip,
  Popup as ReactPopup,
  useMap as useReactMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  Play,
  Pause,
  SlidersHorizontal,
  Activity,
  AlertTriangle,
  Radio,
  Truck,
  ShieldCheck,
  Plane,
  X,
  Compass,
  Layers,
  ChevronRight,
  Maximize2,
  ZoomIn,
} from "lucide-react";

const RUDRAPRAYAG_CENTER = [30.55, 79.05];
const RUDRAPRAYAG_ZOOM = 10;

// Custom Leaflet DivIcons for Medical Bases and Depots
const createHospitalIcon = () =>
  L.divIcon({
    className: "custom-hospital-icon",
    html: `
      <div style="background:#ef4444; width:26px; height:26px; border-radius:8px; border:2px solid #ffffff; display:flex; align-items:center; justify-content:center; box-shadow:0 0 16px rgba(239,68,68,0.9);">
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
      <div style="background:${bg}; width:24px; height:24px; border-radius:50%; border:2px solid #ffffff; display:flex; align-items:center; justify-content:center; box-shadow:0 0 14px ${bg};">
        <span style="color:#ffffff; font-size:12px; font-weight:bold;">${symbol}</span>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Map Pan/Camera Controller
function CameraController({ targetPosition, targetZoom }) {
  const map = useReactMap();

  useEffect(() => {
    if (!map || !targetPosition) return;
    try {
      map.flyTo(targetPosition, targetZoom || map.getZoom(), { duration: 1.0 });
    } catch {
      // Ignored
    }
  }, [targetPosition, targetZoom, map]);

  return null;
}

// Risk Gradient Helper (0.0 to 1.0)
function getProbabilityColor(prob, isBlocked) {
  if (isBlocked || prob >= 0.6) return "#ef4444"; // Crimson Red (Critical Hazard / Blocked)
  if (prob >= 0.45) return "#f97316"; // Orange (Severe Hazard)
  if (prob >= 0.25) return "#f59e0b"; // Amber (Elevated Risk)
  return "#10b981"; // Emerald Green (Operational)
}

function getProbabilityLabel(prob, isBlocked) {
  if (isBlocked || prob >= 0.6)
    return { label: "CRITICAL HAZARD / BLOCKED", badgeClass: "bg-red-500/20 text-red-300 border-red-500/40" };
  if (prob >= 0.45)
    return { label: "SEVERE RISK WARNING", badgeClass: "bg-orange-500/20 text-orange-300 border-orange-500/40" };
  if (prob >= 0.25)
    return { label: "ELEVATED RISK", badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40" };
  return { label: "SAFE / OPERATIONAL", badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" };
}

export function CommandDeckPage({
  network,
  depots,
  mode,
  timelineData,
  currentHour,
  setCurrentHour,
  isPlaying,
  setIsPlaying,
  simRain,
  setSimRain,
  simPrior1,
  setSimPrior1,
  simPrior2,
  setSimPrior2,
  simThreshold,
  setSimThreshold,
  dispatchPlan,
  simulationRisk,
  selectedSegmentId,
  setSelectedSegmentId,
  selectedSegmentData,
  onNavigate,
}) {
  const [camera, setCamera] = useState({ pos: RUDRAPRAYAG_CENTER, zoom: RUDRAPRAYAG_ZOOM });
  const [drawerOpen, setDrawerOpen] = useState(true);

  // Derive Current Edge Probabilities
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
      : `${simRain} mm/hr (Sim load)`;

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-[#050811] overflow-hidden flex flex-col font-sans select-none">
      {/* 1. FLOATING TOP HUD STATUS RIBBON (Apple / Linear Minimal Caliber) */}
      <div className="absolute top-4 left-4 right-4 z-20 pointer-events-none flex items-center justify-between gap-3">
        {/* Left Stats Cluster */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-950/80 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl shadow-2xl">
          <div className="px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/5 flex flex-col">
            <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400">
              {mode === "live" ? "Forecast Precip" : "Simulated Precip"}
            </span>
            <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              {activeRainfallDisplay}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/5 flex flex-col">
            <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400">Severed Roads</span>
            <span className="text-xs font-bold text-red-400 font-mono flex items-center gap-1.5">
              {activeBlockedCount} Corridors
              {activeBlockedCount > 0 && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-red-950 border border-red-800 text-red-300 font-mono">
                  ALERT
                </span>
              )}
            </span>
          </div>

          <div className="hidden sm:flex px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/5 flex-col">
            <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400">Isolated Population</span>
            <span className="text-xs font-bold text-amber-300 font-mono">
              {activeIsolatedPop.toLocaleString()}{" "}
              <span className="text-[10px] text-slate-400 font-normal">in {activeCutoffCount} villages</span>
            </span>
          </div>

          <div className="hidden md:flex px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/5 flex-col">
            <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400">Staging Depots</span>
            <span className="text-xs font-bold text-cyan-300 font-mono">
              {depots.length} Bases <span className="text-[10px] text-slate-400 font-normal">Active</span>
            </span>
          </div>
        </div>

        {/* Right Camera Presets */}
        <div className="pointer-events-auto hidden lg:flex items-center gap-1 bg-slate-950/80 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl shadow-2xl text-xs font-mono">
          <button
            onClick={() => setCamera({ pos: RUDRAPRAYAG_CENTER, zoom: RUDRAPRAYAG_ZOOM })}
            className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            District
          </button>
          <button
            onClick={() => setCamera({ pos: [30.68, 79.06], zoom: 12 })}
            className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            Kedarnath Route
          </button>
          <button
            onClick={() => setCamera({ pos: [30.34, 78.98], zoom: 12 })}
            className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            Tilwara Corridor
          </button>
        </div>
      </div>

      {/* 2. FULL-BLEED LEAFLET MAP CONTAINER */}
      <div className="relative flex-1 w-full h-full">
        <ReactMapContainer
          center={RUDRAPRAYAG_CENTER}
          zoom={RUDRAPRAYAG_ZOOM}
          scrollWheelZoom={true}
          className="w-full h-full z-0 bg-[#070a14]"
        >
          <ReactTileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; World Dark Gray Base'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
            maxZoom={16}
          />

          <CameraController targetPosition={camera.pos} targetZoom={camera.zoom} />

          {/* A. ROAD SEGMENTS (Probability Gradient Polyline) */}
          {network?.edges?.map((edge) => {
            const state = getEdgeState(edge.id);
            const color = getProbabilityColor(state.probability, state.blocked);
            const isSelected = selectedSegmentId === edge.id;
            const isTrek = edge.road_type === "trek" || edge.road_class === "path";

            return (
              <ReactPolyline
                key={edge.id}
                positions={edge.coordinates || []}
                pathOptions={{
                  color: isSelected ? "#06b6d4" : color,
                  weight: isSelected ? 6.5 : state.blocked ? 5.5 : isTrek ? 3.5 : 4.2,
                  dashArray: isTrek ? "4, 6" : isSelected ? "8, 4" : undefined,
                  opacity: isSelected ? 1.0 : state.blocked ? 0.95 : 0.85,
                }}
                eventHandlers={{
                  click: () => {
                    setSelectedSegmentId(edge.id);
                    setDrawerOpen(true);
                  },
                }}
              >
                <ReactTooltip sticky className="custom-tooltip">
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
                </ReactTooltip>
              </ReactPolyline>
            );
          })}

          {/* B. VILLAGES MARKERS */}
          {network?.nodes
            ?.filter((n) => n.type === "village")
            .map((v) => (
              <ReactCircleMarker
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
                    onNavigate("dispatch");
                  },
                }}
              >
                <ReactTooltip direction="top" offset={[0, -6]}>
                  <span className="font-semibold text-xs">{v.name}</span>
                  <span className="text-[10px] text-slate-400 ml-1">({v.population || 500} pop)</span>
                </ReactTooltip>
              </ReactCircleMarker>
            ))}

          {/* C. BASE HOSPITALS MARKERS */}
          {network?.nodes
            ?.filter((n) => n.type === "hospital")
            .map((h) => (
              <ReactMarker key={h.id} position={[h.lat, h.lon]} icon={createHospitalIcon()}>
                <ReactTooltip direction="top" offset={[0, -14]}>
                  <span className="font-bold text-xs text-red-400">{h.name}</span>
                  <div className="text-[10px] text-slate-300">Base Medical Facility</div>
                </ReactTooltip>
              </ReactMarker>
            ))}

          {/* D. EMERGENCY RESOURCE DEPOTS MARKERS */}
          {depots.map((d) => (
            <ReactMarker key={d.id} position={[d.lat, d.lon]} icon={createDepotIcon(d.type)}>
              <ReactPopup className="custom-popup">
                <div className="text-xs p-1">
                  <div className="font-bold text-slate-900">{d.name}</div>
                  <div className="text-[10px] text-slate-600 mb-1">{d.type.replace(/_/g, " ").toUpperCase()}</div>
                  <div className="grid grid-cols-2 gap-1 text-[10px] bg-slate-100 p-1.5 rounded font-mono">
                    <div>🚑 Amb: {d.resources.ambulance}</div>
                    <div>🛡 Rescue: {d.resources.rescue_team}</div>
                    <div>⚙ Excv: {d.resources.excavator}</div>
                    <div>✚ Med: {d.resources.medical_team}</div>
                  </div>
                </div>
              </ReactPopup>
            </ReactMarker>
          ))}
        </ReactMapContainer>

        {/* FLOATING MAP LEGEND (Bottom Left) */}
        <div className="absolute bottom-24 left-4 z-10 glass-panel p-3 rounded-xl text-[11px] space-y-1.5 shadow-2xl max-w-xs pointer-events-auto">
          <div className="font-semibold text-slate-300 text-[10px] uppercase tracking-wider flex justify-between items-center">
            <span>Landslide Hazard Scale</span>
            <span className="text-[9px] text-slate-400 font-mono">P(Blockage)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-slate-300">&lt; 25% Operational (Low risk)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-slate-300">25–45% Elevated Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 rounded-full bg-orange-500" />
            <span className="text-slate-300">45–60% Hazard Warning</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 rounded-full bg-red-500" />
            <span className="text-red-400 font-semibold">&gt; 60% Critical Hazard / Severed</span>
          </div>
          <div className="border-t border-white/[0.08] pt-1.5 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-red-600 inline-block text-[9px] text-center text-white leading-none">
                +
              </span>
              Hospital
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              SDRF Base
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              PWD Heavy
            </span>
          </div>
        </div>

        {/* FLOATING CONTEXTUAL INSPECTION DRAWER (Right Slide-over) */}
        {drawerOpen && selectedSegmentData && (
          <div className="absolute top-4 right-4 bottom-24 w-80 sm:w-96 z-20 glass-panel rounded-2xl shadow-2xl p-5 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="space-y-4">
              <div className="flex justify-between items-start border-b border-white/[0.08] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {selectedSegmentId}
                    </span>
                    <h3 className="font-bold text-white text-sm">{selectedSegmentData.name}</h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                    {selectedSegmentData.length_km} km • {selectedSegmentData.road_class}
                  </span>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Probability Gauge */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-400">Failure Probability</span>
                  <span
                    className="text-2xl font-black font-mono"
                    style={{
                      color: getProbabilityColor(
                        selectedSegmentData.probability,
                        selectedSegmentData.blocked
                      ),
                    }}
                  >
                    {(selectedSegmentData.probability * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-white/5">
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
                <div
                  className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border inline-block ${
                    getProbabilityLabel(selectedSegmentData.probability, selectedSegmentData.blocked).badgeClass
                  }`}
                >
                  {getProbabilityLabel(selectedSegmentData.probability, selectedSegmentData.blocked).label}
                </div>
              </div>

              {/* Narrative Explanation */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 space-y-1.5">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                  Diagnostic Reason
                </span>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {selectedSegmentData.reasons.explanation}
                </p>
              </div>

              {/* Three Drivers */}
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Slope Steepness</span>
                  <span className="text-white font-bold">{selectedSegmentData.reasons.slope_gradient_pct}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Caine Critical Ratio</span>
                  <span className="text-cyan-300 font-bold">{selectedSegmentData.reasons.intensity_ratio}x</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">72h Antecedent Saturation</span>
                  <span className="text-emerald-300 font-bold">{selectedSegmentData.reasons.antecedent_72h_mm} mm</span>
                </div>
              </div>

              {/* ML Model Score */}
              {selectedSegmentData.reasons?.ml_probability !== undefined && (
                <div className="p-3 rounded-xl bg-gradient-to-r from-purple-950/40 to-slate-900 border border-purple-800/40 space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-purple-300">
                    <span>Random Forest ML (91.4% Acc)</span>
                    <b className="text-white">{(selectedSegmentData.reasons.ml_probability * 100).toFixed(1)}% ML Risk</b>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Classification: <b>{selectedSegmentData.reasons.ml_hazard_class}</b>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/[0.08] flex gap-2">
              <button
                onClick={() => onNavigate("intelligence")}
                className="flex-1 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-xs font-bold text-slate-200 border border-white/10 transition-all cursor-pointer"
              >
                Inspect in Lab
              </button>
              <button
                onClick={() => onNavigate("dispatch")}
                className="flex-1 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-slate-950 transition-all cursor-pointer"
              >
                View Triage
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. FLOATING BOTTOM 24-HOUR TIMELINE SCRUBBER DECK */}
      <div className="h-20 bg-slate-950/90 backdrop-blur-xl border-t border-white/[0.08] px-4 sm:px-6 flex items-center justify-between gap-4 z-20 shrink-0">
        {mode === "live" ? (
          <div className="flex-1 max-w-4xl mx-auto flex items-center gap-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                isPlaying
                  ? "bg-red-500/20 text-red-300 border-red-500/40"
                  : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/20"
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              <span className="hidden sm:inline">{isPlaying ? "Pause" : "Play"}</span>
            </button>

            <div className="flex-1 space-y-1">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-cyan-400 font-bold">
                  T+{currentHour}h: {currentHourStep?.time ? currentHourStep.time.slice(11, 16) : "Current"}
                </span>
                <span className="text-slate-400">
                  Precip: <b className="text-white">{currentHourStep?.rainfall_mm || 0} mm/hr</b> • Blocked:{" "}
                  <b className="text-red-400">{currentHourStep?.blocked_count || 0}</b> • Cut-off:{" "}
                  <b className="text-amber-400">{currentHourStep?.isolated_population || 0}</b>
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="23"
                step="1"
                value={currentHour}
                onChange={(e) => {
                  setCurrentHour(Number(e.target.value));
                  setIsPlaying(false);
                }}
                className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-900 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>T+0h (Now)</span>
                <span>T+6h</span>
                <span>T+12h</span>
                <span>T+18h</span>
                <span>T+23h (+24 Hours)</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Simulation Active:</span>
              </span>
              <span className="font-mono text-xs text-white">
                {simRain} mm Rain • {simPrior1} mm P1 • {simPrior2} mm P2
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate("simulator")}
                className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 transition-all cursor-pointer"
              >
                Adjust Simulation Sliders
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
