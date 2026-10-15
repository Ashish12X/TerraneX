import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const API = "http://127.0.0.1:8000";
const LIVE_REFRESH_MS = 10 * 60 * 1000;
const RUDRAPRAYAG_CENTER = [30.55, 79.05];
const RUDRAPRAYAG_ZOOM = 10;

// Hackathon Demo Presets (real cascade simulation values)
const DEMO_PRESETS = [
  { label: "Normal (20 mm)", rain: 20, desc: "0 blocked • All 8 villages connected", tag: "Safe" },
  { label: "Pre-alert (55 mm)", rain: 55, desc: "0 blocked • High-slope roads near threshold", tag: "Alert" },
  { label: "Upper Valley Cutoff (85 mm)", rain: 85, desc: "5 roads blocked • Kedarnath, Rambara, Triyuginarayan cut off (2,740 pop)", tag: "Critical" },
  { label: "Cloudburst Crisis (130 mm)", rain: 130, desc: "8 roads blocked • 5 villages cut off (4,820 pop)", tag: "Disaster" },
];

// Map Pan/Reset Helper Component
function MapController({ center, zoom, selectedCoord }) {
  const map = useMap();
  const prevSelected = useRef(null);

  useEffect(() => {
    if (selectedCoord && selectedCoord !== prevSelected.current) {
      prevSelected.current = selectedCoord;
      map.flyTo(selectedCoord, Math.max(map.getZoom(), 11), { duration: 0.8 });
    }
  }, [selectedCoord, map]);

  return null;
}

export default function App() {
  const [mode, setMode] = useState("simulation"); // Default to simulation for judges demo
  const [basis, setBasis] = useState("past_24h");
  const [slider, setSlider] = useState(85); // Default to Kedarnath cut-off scenario
  const [live, setLive] = useState(null);
  const [net, setNet] = useState(null);
  const [res, setRes] = useState(null);
  const [selected, setSelected] = useState("V04"); // Default to Sonprayag to showcase triage
  const [route, setRoute] = useState(null);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  const [legendOpen, setLegendOpen] = useState(true);
  const [mobileTab, setMobileTab] = useState("dashboard"); // "dashboard" | "map" for small screens
  const mapRef = useRef(null);

  // Live mode: fetch rainfall every 10 mins
  useEffect(() => {
    if (mode !== "live") return;
    let stop = false;
    const load = () =>
      fetch(`${API}/live/rainfall`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Live data nahi mila"))))
        .then((d) => {
          if (!stop) {
            setLive(d);
            setError("");
          }
        })
        .catch((e) => !stop && setError(e.message));
    load();
    const id = setInterval(load, LIVE_REFRESH_MS);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [mode]);

  const rainfall = mode === "live" ? (live ? live[`${basis}_mm`] : null) : slider;

  // Rainfall change hone par network + resources fetch karo (debounce ke sath)
  useEffect(() => {
    if (rainfall === null || rainfall === undefined) return;
    let stop = false;
    const t = setTimeout(() => {
      Promise.all([
        fetch(`${API}/network?rainfall_mm=${rainfall}`).then((r) => r.json()),
        fetch(`${API}/prioritize/resources?rainfall_mm=${rainfall}`).then((r) => r.json()),
      ])
        .then(([n, p]) => {
          if (stop) return;
          setNet(n);
          setRes(p);
          setError("");
          setUpdatedAt(new Date());
        })
        .catch(() => !stop && setError("Backend se connect nahi ho paya. Server (FastAPI) running hai?"));
    }, 200);
    return () => {
      stop = true;
      clearTimeout(t);
    };
  }, [rainfall]);

  // Village select hone par safe route find karo
  useEffect(() => {
    if (!selected || rainfall === null || rainfall === undefined) {
      setRoute(null);
      return;
    }
    let stop = false;
    fetch(`${API}/route/safe?source=${selected}&rainfall_mm=${rainfall}`)
      .then((r) => r.json())
      .then((d) => !stop && setRoute(d))
      .catch(() => !stop && setRoute(null));
    return () => {
      stop = true;
    };
  }, [selected, rainfall]);

  const pos = {};
  (net?.nodes || []).forEach((n) => {
    pos[n.id] = [n.lat, n.lon];
  });
  const isolated = (net?.nodes || []).filter((n) => n.isolated);
  const selectedNode = net?.nodes.find((n) => n.id === selected);
  const assigned = new Set(
    (res?.assignments || []).filter((a) => a.village_id).map((a) => a.village_id)
  );

  const selectedCoord = selectedNode ? [selectedNode.lat, selectedNode.lon] : null;

  // Rainfall Risk Level
  const getSeverity = (mm) => {
    if (mm < 35) return { text: "Low Risk", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" };
    if (mm < 70) return { text: "Moderate Alert", color: "bg-amber-500/15 text-amber-600 border-amber-500/30" };
    if (mm < 100) return { text: "Critical Hazard", color: "bg-rose-500/15 text-rose-600 border-rose-500/30" };
    return { text: "Cloudburst Crisis", color: "bg-purple-500/15 text-purple-600 border-purple-500/30" };
  };

  const severity = getSeverity(rainfall || 0);

  const resetMapView = () => {
    if (mapRef.current) {
      mapRef.current.flyTo(RUDRAPRAYAG_CENTER, RUDRAPRAYAG_ZOOM, { duration: 0.6 });
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground antialiased font-sans">
      {/* Top Navigation Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card/80 px-4 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black text-sm tracking-wider shadow-sm">
              TX
            </span>
            <div>
              <span className="font-extrabold tracking-tight text-lg leading-none">Terranex</span>
              <span className="ml-2 hidden text-xs font-medium text-muted-foreground sm:inline-block">
                Rudraprayag Valley Cascade Intelligence
              </span>
            </div>
          </div>
          <Badge variant="outline" className="hidden text-[10px] sm:inline-flex border-primary/20">
            Innotech 2026
          </Badge>
        </div>

        {/* Live / Status Indicator & Mobile Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border bg-muted/60 px-2.5 py-1 text-xs">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                error ? "bg-rose-500" : "bg-emerald-500 animate-pulse"
              }`}
            />
            <span className="text-muted-foreground text-[11px] font-medium hidden sm:inline">
              {error ? "Backend Offline" : "FastAPI Connected"}
            </span>
          </div>

          {/* Mobile view switch tabs (only visible on mobile screens) */}
          <div className="flex md:hidden rounded-lg border bg-muted p-0.5">
            <button
              onClick={() => setMobileTab("dashboard")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                mobileTab === "dashboard" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Control Deck
            </button>
            <button
              onClick={() => setMobileTab("map")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                mobileTab === "map" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Interactive Map
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Left Sidebar (Control & Triage Panel) */}
        <aside
          className={`w-full md:w-[390px] lg:w-[410px] shrink-0 flex-col overflow-y-auto border-r bg-card/60 p-4 backdrop-blur-sm space-y-4 transition-all duration-300 ${
            mobileTab === "dashboard" ? "flex" : "hidden md:flex"
          }`}
        >
          {/* Mode Switcher */}
          <div>
            <Tabs value={mode} onValueChange={setMode}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="simulation">Simulation Lab</TabsTrigger>
                <TabsTrigger value="live">Live Radar (Open-Meteo)</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Mode Controls */}
          {mode === "live" ? (
            <div className="rounded-xl border bg-muted/30 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Live District Telemetry
                </span>
                <span className="text-[11px] text-muted-foreground">Auto-updates 10m</span>
              </div>
              <Tabs value={basis} onValueChange={setBasis}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="past_24h" className="text-xs">Past 24h Rain</TabsTrigger>
                  <TabsTrigger value="next_24h" className="text-xs">24h Forecast</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center justify-between text-xs pt-1 text-muted-foreground">
                <span>Current intensity:</span>
                <b className="text-foreground">{live ? `${live.current_mm_per_hr} mm/hr` : "Fetching..."}</b>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border bg-card p-3.5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold">Rainfall Simulator</span>
                  <Badge variant="outline" className={`text-[10px] font-semibold ${severity.color}`}>
                    {severity.text}
                  </Badge>
                </div>
                <b className="text-lg font-mono text-primary">{slider} <span className="text-xs font-normal text-muted-foreground">mm</span></b>
              </div>

              <Slider
                min={0}
                max={150}
                step={1}
                value={[slider]}
                onValueChange={(v) => setSlider(v[0])}
                className="py-1 cursor-pointer"
              />

              {/* Quick Hackathon Demo Presets */}
              <div className="pt-1">
                <div className="text-[11px] font-medium text-muted-foreground mb-1.5">
                  1-Click Demo Scenarios (Judge Showcase):
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {DEMO_PRESETS.map((p) => (
                    <button
                      key={p.rain}
                      onClick={() => setSlider(p.rain)}
                      className={`flex flex-col items-start rounded-lg border p-2 text-left transition-all hover:bg-muted/80 active:scale-[0.98] ${
                        slider === p.rain
                          ? "border-primary bg-primary/5 ring-1 ring-primary/40 font-semibold"
                          : "border-border/60 bg-background/50"
                      }`}
                    >
                      <div className="flex w-full items-center justify-between text-xs">
                        <span>{p.label}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground line-clamp-1">
                        {p.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="py-2.5">
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          {/* Key Situation Overview Cards */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border bg-card p-3 shadow-xs">
              <div className="text-[11px] font-medium text-muted-foreground">Blocked Roads</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className={`text-2xl font-bold font-mono ${net?.blocked_roads > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                  {net ? net.blocked_roads : "-"}
                </span>
                <span className="text-xs text-muted-foreground">/ {net?.edges ? net.edges.length : 12}</span>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-3 shadow-xs">
              <div className="text-[11px] font-medium text-muted-foreground">Cut-off Villages</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className={`text-2xl font-bold font-mono ${isolated.length > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                  {net ? isolated.length : "-"}
                </span>
                <span className="text-xs text-muted-foreground">/ 8</span>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-3 shadow-xs col-span-2">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-medium text-muted-foreground">Population At Immediate Risk</div>
                {res?.population_at_risk > 0 ? (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                    {isolated.length} Villages Cut Off
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-emerald-600 border-emerald-500/30">
                    All Reachable
                  </Badge>
                )}
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-foreground">
                  {res ? res.population_at_risk.toLocaleString() : "-"}
                </span>
                <span className="text-xs text-muted-foreground">residents in isolated zones</span>
              </div>
              {isolated.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1 border-t pt-2">
                  <span className="text-[10px] text-muted-foreground mr-1">Cut-off:</span>
                  {isolated.map((v) => (
                    <span
                      key={v.id}
                      onClick={() => {
                        setSelected(v.id);
                        if (window.innerWidth < 768) setMobileTab("map");
                      }}
                      className="cursor-pointer text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 border border-rose-500/20 font-medium hover:bg-rose-500/20 transition-all"
                    >
                      {v.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Village Selector Dropdown */}
          <div className="rounded-xl border bg-card p-3 space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>Inspect Village Network</span>
              <span className="text-[10px] text-muted-foreground">Click dot or select below</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(net?.nodes || []).filter(n => n.type === "village").map((v) => {
                const isIso = v.isolated;
                const isSel = selected === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => {
                      setSelected(v.id);
                      if (window.innerWidth < 768) setMobileTab("map");
                    }}
                    className={`rounded-md px-2 py-1 text-xs transition-all ${
                      isSel
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : isIso
                        ? "bg-rose-500/10 text-rose-600 border border-rose-500/30 hover:bg-rose-500/20"
                        : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {v.name} {isIso && "⚠️"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Village Triage & Routing Details */}
          {selectedNode && (
            <Card className="border-primary/40 shadow-xs overflow-hidden">
              <CardHeader className="bg-muted/40 py-2.5 px-3 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                      <span>{selectedNode.name}</span>
                      <span className="text-xs font-normal text-muted-foreground font-mono">
                        ({selectedNode.id})
                      </span>
                    </CardTitle>
                    <span className="text-[11px] text-muted-foreground">
                      Population: {res?.assignments?.find(a => a.village_id === selectedNode.id)?.population || "~1,000"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {selectedNode.isolated ? (
                      <Badge variant="destructive" className="text-xs">
                        Isolated (No Hospital Path)
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-600 hover:bg-emerald-600 text-xs">
                        Connected to Care
                      </Badge>
                    )}
                    <button
                      onClick={() => setSelected(null)}
                      className="ml-1 text-muted-foreground hover:text-foreground text-xs p-1"
                      title="Clear selection"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 text-xs space-y-2">
                {route?.route_found ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Safest Hospital Route:</span>
                      <b className="text-foreground">{route.safe_route.distance_km} km</b>
                    </div>
                    <div className="rounded-lg bg-muted/60 p-2 font-mono text-[11px] text-primary leading-relaxed">
                      {route.safe_route.names.join(" ➔ ")}
                    </div>
                    {route.rerouted && (
                      <div className="rounded border border-amber-500/30 bg-amber-500/10 p-1.5 text-amber-700 text-[11px]">
                        ⚠️ Primary direct road blocked; dynamically rerouted through secondary safe corridors.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-rose-700 space-y-1">
                    <p className="font-semibold text-xs">🚨 Road Access Cut-Off</p>
                    <p className="text-[11px] leading-relaxed">
                      All roads connecting {selectedNode.name} to Rudraprayag, Ukhimath, or Guptkashi hospitals are blocked by high terrain risk. Dispatch aerial evacuation or foot rescue team.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Emergency Resource Dispatch Card */}
          <Card className="shadow-xs">
            <CardHeader className="py-2.5 px-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Dynamic Resource Dispatch (Triage)
                </CardTitle>
                <span className="text-[10px] text-muted-foreground">5 Assets Active</span>
              </div>
            </CardHeader>
            <CardContent className="p-2 space-y-1.5">
              {res && res.assignments && res.assignments.length > 0 ? (
                res.assignments.map((a) => {
                  const isAssigned = !!a.assigned_to;
                  const isSelected = selected === a.village_id;
                  const getIcon = (type) => {
                    if (type.includes("Ambulance")) return "🚑";
                    if (type.includes("Rescue")) return "🧗";
                    if (type.includes("Excavator")) return "🚜";
                    return "📦";
                  };

                  return (
                    <div
                      key={a.resource_id}
                      onClick={() => {
                        if (a.village_id) {
                          setSelected(a.village_id);
                          if (window.innerWidth < 768) setMobileTab("map");
                        }
                      }}
                      className={`flex items-center justify-between rounded-lg border p-2 text-xs transition-all ${
                        isAssigned ? "cursor-pointer hover:bg-muted/70 active:scale-[0.99]" : "opacity-60 bg-muted/20"
                      } ${isSelected ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500" : ""}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{getIcon(a.resource_type)}</span>
                        <div>
                          <div className="font-semibold">{a.resource_id}</div>
                          <div className="text-[10px] text-muted-foreground">{a.resource_type}</div>
                        </div>
                      </div>

                      {isAssigned ? (
                        <div className="text-right">
                          <Badge className="bg-amber-500 hover:bg-amber-500 text-[10px] font-semibold text-slate-900">
                            ➔ {a.assigned_to}
                          </Badge>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            Pop: {a.population}
                          </div>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground border-dashed">
                          Standby / Stand-down
                        </Badge>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">Calculating assignments...</p>
              )}
            </CardContent>
          </Card>

          {updatedAt && (
            <p className="text-[11px] text-muted-foreground text-center pt-1">
              Simulation telemetry synchronized: {updatedAt.toLocaleTimeString()}
            </p>
          )}
        </aside>

        {/* Right Map Canvas */}
        <main
          className={`relative flex-1 h-full w-full ${
            mobileTab === "map" ? "flex" : "hidden md:flex"
          }`}
        >
          <MapContainer
            ref={mapRef}
            center={RUDRAPRAYAG_CENTER}
            zoom={RUDRAPRAYAG_ZOOM}
            className="h-full w-full z-0"
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapController
              center={RUDRAPRAYAG_CENTER}
              zoom={RUDRAPRAYAG_ZOOM}
              selectedCoord={selectedCoord}
            />

            {/* Road Network Polylines (Real Curvy Mountain Road Geometry) */}
            {(net?.edges || []).map((e) => (
              <Polyline
                key={e.id}
                positions={e.coordinates && e.coordinates.length > 0 ? e.coordinates : [pos[e.from], pos[e.to]]}
                pathOptions={{
                  color: e.blocked ? "#e11d48" : "#16a34a",
                  weight: e.blocked ? 4 : 3.5,
                  dashArray: e.blocked ? "6 6" : null,
                  opacity: e.blocked ? 0.9 : 0.75,
                }}
              >
                <Tooltip sticky>
                  <div className="text-xs p-1 space-y-0.5">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="font-mono">{e.id}</span>: {e.from} ➔ {e.to} ({e.length_km} km)
                      {e.geometry_source === "approximated" ? (
                        <span className="text-[9px] font-normal px-1 py-0.2 rounded bg-amber-500/15 text-amber-700 border border-amber-500/30">
                          approximate path
                        </span>
                      ) : (
                        <span className="text-[9px] font-normal px-1 py-0.2 rounded bg-slate-200 text-slate-700">
                          OSM road
                        </span>
                      )}
                    </div>
                    <div>Risk Score: <b>{e.risk}</b> {e.blocked ? "⛔ BLOCKED" : "✅ PASSABLE"}</div>
                    {e.mean_gradient_pct && (
                      <div className="text-[10px] text-muted-foreground">
                        Mean slope: {e.mean_gradient_pct}% {e.geometry_source === "approximated" ? "(approximate)" : ""} (Max: {e.max_gradient_pct}% {e.geometry_source === "approximated" ? "approx." : ""})
                      </div>
                    )}
                    {e.susceptibility_source === "manual_expert_override" && (
                      <div className="text-[10px] text-amber-700">
                        Susceptibility: manual expert override ({e.manual_override_reason || "known landslide-prone corridor"})
                      </div>
                    )}
                  </div>
                </Tooltip>
              </Polyline>
            ))}

            {/* Active Safe Route Highlight (Real Curvy Safe Corridor) */}
            {route?.route_found && (
              <Polyline
                positions={
                  route.safe_route.coordinates && route.safe_route.coordinates.length > 0
                    ? route.safe_route.coordinates
                    : route.safe_route.nodes.map((id) => pos[id])
                }
                pathOptions={{
                  color: "#2563eb",
                  weight: 7,
                  opacity: 0.85,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
            )}

            {/* Assigned Resource Pulsing Amber Rings */}
            {(net?.nodes || [])
              .filter((n) => assigned.has(n.id))
              .map((n) => (
                <CircleMarker
                  key={`ring-${n.id}`}
                  center={[n.lat, n.lon]}
                  radius={17}
                  interactive={false}
                  pathOptions={{
                    color: "#f59e0b",
                    weight: 3.5,
                    fillOpacity: 0.1,
                    fillColor: "#f59e0b",
                    dashArray: "3 3",
                  }}
                />
              ))}

            {/* Nodes: Villages and Hospitals */}
            {(net?.nodes || []).map((n) => {
              const isHospital = n.type === "hospital";
              const isSelected = selected === n.id;
              const isIsolated = n.isolated;

              return (
                <CircleMarker
                  key={n.id}
                  center={[n.lat, n.lon]}
                  radius={isHospital ? 11 : isSelected ? 10 : 8}
                  pathOptions={{
                    color: isSelected ? "#3b82f6" : "#0f172a",
                    weight: isSelected ? 3 : 1.5,
                    fillOpacity: 1,
                    fillColor: isHospital
                      ? "#2563eb"
                      : isIsolated
                      ? "#dc2626"
                      : "#16a34a",
                  }}
                  eventHandlers={{
                    click: () => {
                      if (!isHospital) {
                        setSelected(n.id);
                      }
                    },
                  }}
                >
                  <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
                    <div className="text-xs">
                      <div className="font-bold flex items-center gap-1">
                        {isHospital ? "🏥" : "🏘️"} {n.name}
                        {isIsolated && <span className="text-red-500 font-bold">(ISOLATED)</span>}
                      </div>
                      <div className="text-[10px] text-muted-foreground capitalize">
                        Type: {n.type} {n.id}
                      </div>
                      {!isHospital && (
                        <div className="text-[10px] text-blue-600 font-medium">Click to inspect safe route</div>
                      )}
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            })}
          </MapContainer>

          {/* Quick Floating Action: Reset Center Button */}
          <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={resetMapView}
              className="bg-background/90 backdrop-blur shadow-md hover:bg-background text-xs font-semibold"
            >
              🎯 Center Rudraprayag
            </Button>
          </div>

          {/* Collapsible Floating Legend */}
          <div className="absolute bottom-4 right-4 z-[1000] max-w-xs transition-all">
            {legendOpen ? (
              <div className="rounded-xl border bg-background/95 p-3.5 text-xs shadow-lg backdrop-blur-md space-y-2">
                <div className="flex items-center justify-between border-b pb-1.5 font-semibold text-foreground">
                  <span className="flex items-center gap-1.5">🗺️ Map Legend</span>
                  <button
                    onClick={() => setLegendOpen(false)}
                    className="text-muted-foreground hover:text-foreground text-xs"
                    title="Minimize legend"
                  >
                    Minimize ▾
                  </button>
                </div>
                <div className="space-y-1.5 pt-0.5">
                  <LegendItem color="#16a34a" label="Passable Road (Low Risk)" line />
                  <LegendItem color="#e11d48" label="Blocked Road (Risk ≥ 0.5)" line dashed />
                  <LegendItem color="#2563eb" label="Active Safe Route" line thick />
                  <LegendItem color="#16a34a" label="Village (Hospital Reachable)" />
                  <LegendItem color="#dc2626" label="Village Cut-off (Isolated)" />
                  <LegendItem color="#2563eb" label="Hospital Hub (CHC/PHC/District)" />
                  <LegendItem color="#f59e0b" label="Assigned Resource Zone" ring />
                </div>
              </div>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setLegendOpen(true)}
                className="bg-background/90 backdrop-blur shadow-md hover:bg-background text-xs"
              >
                🗺️ Show Legend
              </Button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function LegendItem({ color, label, line, dashed, thick, ring }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      {line ? (
        <span
          className="inline-block w-5 shrink-0"
          style={{
            borderTop: `${thick ? "4px" : "3px"} ${dashed ? "dashed" : "solid"} ${color}`,
          }}
        />
      ) : (
        <span
          className="inline-block h-3 w-3 shrink-0 rounded-full"
          style={
            ring
              ? { border: `2px dashed ${color}` }
              : { background: color, border: "1.5px solid #0f172a" }
          }
        />
      )}
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}