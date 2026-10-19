import React from "react";
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Truck,
  Activity,
  Layers,
  CloudRain,
  Mountain,
  Navigation,
  Wind,
  Radio,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Sparkles,
} from "lucide-react";

export function OverviewPage({
  onNavigate,
  network,
  depots,
  timelineData,
  currentHour,
  mlStatus,
}) {
  const currentStep = timelineData?.timeline?.[currentHour] || null;
  const blockedCount = currentStep?.blocked_count || 0;
  const isolatedPop = currentStep?.isolated_population || 0;
  const rainNow = currentStep?.rainfall_mm || 0.0;

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. CINEMATIC HERO SECTION (Tesla / Apple Editorial Caliber) */}
      <section className="relative min-h-[88vh] flex items-center justify-center overflow-hidden px-6 lg:px-12 border-b border-white/[0.08]">
        {/* Cinematic Backdrop Image with Precision Gradient Mask */}
        <div className="absolute inset-0 z-0">
          <img
            src="/hero_himalaya.jpg"
            alt="Himalayan Valley Corridors"
            className="w-full h-full object-cover object-center scale-105 filter brightness-[0.7] contrast-[1.1] transition-transform duration-1000 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050811] via-[#050811]/60 to-[#050811]/40" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8 pt-12 pb-16">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/10 text-xs font-mono text-cyan-300 shadow-2xl">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>GARHWAL HIMALAYAS • RUDRAPRAYAG DISASTER COMMAND</span>
            <span className="text-white/40">|</span>
            <span className="text-slate-300">NH-107 CORRIDOR</span>
          </div>

          {/* Main Display Heading */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.08] max-w-4xl mx-auto">
            Adaptive Landslide Intelligence.
            <br />
            <span className="bg-gradient-to-r from-cyan-300 via-slate-200 to-amber-200 bg-clip-text text-transparent">
              Autonomous Evacuation.
            </span>
          </h1>

          {/* Concise Subtitle */}
          <p className="text-base sm:text-xl text-slate-300/90 max-w-2xl mx-auto font-normal leading-relaxed">
            Replacing fragmented disaster spreadsheets with an hour-by-hour geotechnical physics model,
            supervised machine learning, and dynamic multimodal rescue dispatch.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => onNavigate("command")}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm tracking-tight transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg shadow-cyan-500/25 group cursor-pointer"
            >
              <span>Launch Live Command Deck</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => onNavigate("simulator")}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/15 font-semibold text-sm tracking-tight transition-all duration-200 backdrop-blur-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <CloudRain className="w-4 h-4 text-amber-400" />
              <span>Simulate Cloudburst Crisis</span>
            </button>
          </div>

          {/* Real-time Status Badges */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
            <div className="glass-panel p-3.5 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Telemetry Status</div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Open-Meteo
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">{rainNow} mm/hr precip</div>
            </div>

            <div className="glass-panel p-3.5 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">ML Calibration</div>
              <div className="text-sm font-bold text-cyan-300 font-mono mt-0.5">91.37% Accuracy</div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">ROC-AUC 0.973</div>
            </div>

            <div className="glass-panel p-3.5 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Active Topology</div>
              <div className="text-sm font-bold text-white font-mono mt-0.5">12 Corridors</div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">11 Himalayan Nodes</div>
            </div>

            <div className="glass-panel p-3.5 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Staging Depots</div>
              <div className="text-sm font-bold text-amber-300 font-mono mt-0.5">{depots?.length || 6} Bases Ready</div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">Ambulance & Machinery</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. GEOTECHNICAL PHYSICS & MACHINE LEARNING SECTION (Tesla Power Earth Style) */}
      <section className="py-24 px-6 lg:px-12 border-b border-white/[0.08] relative">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
                <Cpu className="w-4 h-4" />
                <span>Geotechnical Explainability</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                Zero black-box scoring.
                <br />
                Pure geotechnical physics.
              </h2>
            </div>
            <p className="text-sm sm:text-base text-slate-400 max-w-md">
              Every road risk metric breaks down into constituent geotechnical drivers:
              steepness from DEM slope models, rainfall intensity against empirical Caine thresholds,
              and 72-hour decayed soil moisture.
            </p>
          </div>

          {/* Three Pillar Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1: Caine 1980 */}
            <div className="glass-panel p-8 rounded-2xl space-y-6 hover:border-white/20 transition-all">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Activity className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">Empirical Physics</span>
                <h3 className="text-xl font-bold text-white">Caine (1980) Critical Intensity</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Calculates precipitation threshold: <code className="text-cyan-300">I_c = 14.82 × D^(-0.39) mm/hr</code>.
                  For a 1-hour cloudburst, rainfall exceeding 14.82 mm/hr breaches the critical landslide initiation boundary.
                </p>
              </div>
              <div className="pt-4 border-t border-white/[0.08] flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">Weight In Risk Model</span>
                <span className="text-white font-bold">40% Factor</span>
              </div>
            </div>

            {/* Pillar 2: DEM Slopes */}
            <div className="glass-panel p-8 rounded-2xl space-y-6 hover:border-white/20 transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Mountain className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider">Topographic Gradient</span>
                <h3 className="text-xl font-bold text-white">Digital Elevation Model Slopes</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Extracted from SRTM DEM elevation meshes across the Mandakini gorge.
                  Gradients reaching 45–65% mean steepness represent fragile schist/gneiss colluvium susceptible to mass wasting.
                </p>
              </div>
              <div className="pt-4 border-t border-white/[0.08] flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">Weight In Risk Model</span>
                <span className="text-white font-bold">40% Factor</span>
              </div>
            </div>

            {/* Pillar 3: Antecedent Moisture */}
            <div className="glass-panel p-8 rounded-2xl space-y-6 hover:border-white/20 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CloudRain className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider">Soil Hydrology</span>
                <h3 className="text-xl font-bold text-white">72-Hour Decayed Soil Saturation</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Captures pore-water pressure buildup using exponential decay:
                  <code className="text-emerald-300"> R_72 = 0.5×R_(24-48h) + 0.25×R_(48-72h)</code>.
                  Saturated Himalayan slopes fail at lower rainfall intensities.
                </p>
              </div>
              <div className="pt-4 border-t border-white/[0.08] flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">Weight In Risk Model</span>
                <span className="text-white font-bold">20% Factor</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MULTIMODAL EVACUATION STRATEGY (Editorial Visual Showcase) */}
      <section className="py-24 px-6 lg:px-12 border-b border-white/[0.08] relative">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Visual Image */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl group">
              <img
                src="/airlift_helipad.jpg"
                alt="Himalayan Emergency SAR Helicopter on Mountain Helipad"
                className="w-full h-auto aspect-video object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs font-mono text-slate-200">
                <span className="bg-slate-900/90 px-3 py-1 rounded-md border border-white/10">
                  HIMALAYAN SAR AIRLIFT ESCALATION
                </span>
                <span className="text-purple-300">Automatic Triage Protocol</span>
              </div>
            </div>

            {/* Explanation & 3-Way Access */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-purple-400 uppercase tracking-wider">
                <Navigation className="w-4 h-4" />
                <span>Multimodal Mitigation</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                When Himalayan roads collapse, decisions cannot stall.
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed">
                Traditional disaster response relies on manual radio reports after roads are already buried.
                Terranex automatically triggers a 3-way access evaluation for every isolated village:
              </p>

              <div className="space-y-4 pt-2">
                <div className="glass-panel p-4 rounded-xl flex items-start gap-4">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 font-mono font-bold text-xs">
                    A
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">Alternate Vehicular Detour</h4>
                    <p className="text-xs text-slate-400">
                      Instantly recalculates Dijkstra graph shortest paths over open contiguous roads to base hospitals.
                    </p>
                  </div>
                </div>

                <div className="glass-panel p-4 rounded-xl flex items-start gap-4">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 font-mono font-bold text-xs">
                    B
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">Heavy Machinery Clearance Turnaround</h4>
                    <p className="text-xs text-slate-400">
                      Dispatches excavators from PWD/BRO depots at 15 km/h transit + 3 hours clearing time per blockage site.
                    </p>
                  </div>
                </div>

                <div className="glass-panel p-4 rounded-xl flex items-start gap-4">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 font-mono font-bold text-xs">
                    C
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">Aerial Helicopter Airlift Escalation</h4>
                    <p className="text-xs text-slate-400">
                      If foot trek transit from nearest roadhead exceeds 12 km or 4 hours, Terranex automatically designates helipad pickup.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ACTIVE CORRIDORS & STAGING DEPOTS MATRIX */}
      <section className="py-20 px-6 lg:px-12 bg-slate-950/40">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Topological Registry</span>
              <h3 className="text-2xl font-bold text-white">Monitored Corridors & Staging Bases</h3>
            </div>
            <button
              onClick={() => onNavigate("intelligence")}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <span>Explore AI Model Diagnostics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {network?.edges?.map((edge) => (
              <div
                key={edge.id}
                className="glass-panel p-4 rounded-xl space-y-3 hover:border-cyan-500/40 transition-colors cursor-pointer group"
                onClick={() => onNavigate("command")}
              >
                <div className="flex justify-between items-start">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/[0.05] border border-white/10 text-cyan-300">
                    {edge.id}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">{edge.length_km} km</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors">
                    {edge.name || `${edge.from} → ${edge.to}`}
                  </h4>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 font-mono">
                    <span>Slope: {edge.mean_gradient_pct || edge.max_gradient_pct}%</span>
                    <span>•</span>
                    <span className="capitalize">{edge.road_type || "Road"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="py-12 px-6 lg:px-12 border-t border-white/[0.08] text-center text-xs text-slate-500 font-mono space-y-2">
        <p>TERRANEX — ADAPTIVE LANDSLIDE INTELLIGENCE &amp; EVACUATION DECK</p>
        <p className="text-[11px] text-slate-600">
          Geotechnical Physics Calibrated to Rudraprayag District, Garhwal Himalayas • Innotech 2026
        </p>
      </footer>
    </div>
  );
}
