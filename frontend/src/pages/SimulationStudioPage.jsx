import React, { useState, useEffect } from "react";
import {
  SlidersHorizontal,
  CloudRain,
  Mountain,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Compass,
  Layers,
  Activity,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { api } from "../services/api";

export function SimulationStudioPage({
  simRain,
  setSimRain,
  simPrior1,
  setSimPrior1,
  simPrior2,
  setSimPrior2,
  simThreshold,
  setSimThreshold,
  onNavigate,
}) {
  const [simulationData, setSimulationData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch simulation results whenever sliders change
  useEffect(() => {
    setLoading(true);
    api
      .getSimulationRisk({
        rainfall: simRain,
        prior1: simPrior1,
        prior2: simPrior2,
        threshold: simThreshold,
      })
      .then((data) => {
        setSimulationData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Simulation error:", err);
        setLoading(false);
      });
  }, [simRain, simPrior1, simPrior2, simThreshold]);

  // Presets
  const applyPreset = (rain, p1, p2, threshold = 0.5) => {
    setSimRain(rain);
    setSimPrior1(p1);
    setSimPrior2(p2);
    setSimThreshold(threshold);
  };

  const segments = simulationData?.segments || [];
  const blockedSegments = segments.filter((s) => s.blocked);
  const safeSegments = segments.filter((s) => !s.blocked);

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 p-6 lg:p-10 space-y-10 max-w-7xl mx-auto">
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.08] pb-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>CRISIS SANDBOX • HIMALAYAN CLOUDBURST STRESS-TEST</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Precipitation Stress Studio.
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl">
            Simulate catastrophic monsoonal cloudbursts across the Mandakini gorge.
            Stress-test road vulnerability, anticipate high-hazard bottlenecks, and evaluate graph severance before real disasters strike.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate("command")}
            className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>Simulate on Map Deck</span>
          </button>
        </div>
      </div>

      {/* 2. SCENARIO PRESETS BAR */}
      <div className="space-y-3">
        <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
          Disaster Scenario Presets
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => applyPreset(20, 5, 0)}
            className="glass-panel p-4 rounded-xl text-left hover:border-emerald-500/40 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-center text-xs font-mono text-emerald-400 mb-1">
              <span>Scenario A</span>
              <span>20 mm/hr</span>
            </div>
            <h4 className="font-bold text-sm text-white group-hover:text-emerald-300">
              Baseline Monsoonal Shower
            </h4>
            <p className="text-[11px] text-slate-400 mt-1">Normal precipitation. All corridors operational.</p>
          </button>

          <button
            onClick={() => applyPreset(55, 15, 10)}
            className="glass-panel p-4 rounded-xl text-left hover:border-amber-500/40 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-center text-xs font-mono text-amber-400 mb-1">
              <span>Scenario B</span>
              <span>55 mm/hr</span>
            </div>
            <h4 className="font-bold text-sm text-white group-hover:text-amber-300">
              High Hazard Warning
            </h4>
            <p className="text-[11px] text-slate-400 mt-1">Pre-alert stage. Steep slopes near critical threshold.</p>
          </button>

          <button
            onClick={() => applyPreset(85, 25, 15)}
            className="glass-panel p-4 rounded-xl text-left hover:border-red-500/40 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-center text-xs font-mono text-red-400 mb-1">
              <span>Scenario C</span>
              <span>85 mm/hr</span>
            </div>
            <h4 className="font-bold text-sm text-white group-hover:text-red-300">
              Kedarnath Cut-Off Disaster
            </h4>
            <p className="text-[11px] text-slate-400 mt-1">E06 &amp; E07 collapse. High-altitude habitations isolated.</p>
          </button>

          <button
            onClick={() => applyPreset(130, 45, 25)}
            className="glass-panel p-4 rounded-xl text-left hover:border-purple-500/40 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-center text-xs font-mono text-purple-400 mb-1">
              <span>Scenario D</span>
              <span>130 mm/hr</span>
            </div>
            <h4 className="font-bold text-sm text-white group-hover:text-purple-300">
              Catastrophic Cloudburst
            </h4>
            <p className="text-[11px] text-slate-400 mt-1">Severe valley-wide devastation. 100% airlift mobilization.</p>
          </button>
        </div>
      </div>

      {/* 3. SIMULATION PARAMETER CONTROLS & IMPACT METRICS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sliders Panel */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl space-y-6 lg:col-span-2">
          <div className="flex justify-between items-center border-b border-white/[0.08] pb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Custom Stress Variables</h3>
              <p className="text-xs text-slate-400">
                Adjust dynamic precipitation forces to evaluate network collapse limits.
              </p>
            </div>
            <button
              onClick={() => applyPreset(85, 10, 5, 0.5)}
              className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          <div className="space-y-6">
            {/* Slider 1: Active Rainfall */}
            <div className="space-y-2">
              <div className="flex justify-between items-center font-mono text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-2">
                  <CloudRain className="w-4 h-4 text-cyan-400" />
                  Active Rainfall Intensity (R)
                </span>
                <span className="text-lg font-bold text-white">{simRain} mm/hr</span>
              </div>
              <input
                type="range"
                min="0"
                max="150"
                step="5"
                value={simRain}
                onChange={(e) => setSimRain(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-900 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0 mm/hr (Dry)</span>
                <span>50 mm/hr (Heavy)</span>
                <span>150 mm/hr (Severe Cloudburst)</span>
              </div>
            </div>

            {/* Slider 2: Prior 24-48h Saturation */}
            <div className="space-y-2">
              <div className="flex justify-between items-center font-mono text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Prior 24–48h Rain (Weight: 0.50)
                </span>
                <span className="text-lg font-bold text-white">{simPrior1} mm</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="5"
                value={simPrior1}
                onChange={(e) => setSimPrior1(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer h-2 bg-slate-900 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0 mm</span>
                <span>40 mm</span>
                <span>80 mm (Deep Saturation)</span>
              </div>
            </div>

            {/* Slider 3: Prior 48-72h Saturation */}
            <div className="space-y-2">
              <div className="flex justify-between items-center font-mono text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-2">
                  <Mountain className="w-4 h-4 text-amber-400" />
                  Prior 48–72h Rain (Weight: 0.25)
                </span>
                <span className="text-lg font-bold text-white">{simPrior2} mm</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="5"
                value={simPrior2}
                onChange={(e) => setSimPrior2(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-900 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0 mm</span>
                <span>40 mm</span>
                <span>80 mm</span>
              </div>
            </div>

            {/* Slider 4: Failure Cut-off Threshold */}
            <div className="space-y-2">
              <div className="flex justify-between items-center font-mono text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-purple-400" />
                  Failure Probability Cut-off Threshold
                </span>
                <span className="text-lg font-bold text-white font-mono">
                  {(simThreshold * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.3"
                max="0.8"
                step="0.05"
                value={simThreshold}
                onChange={(e) => setSimThreshold(Number(e.target.value))}
                className="w-full accent-purple-400 cursor-pointer h-2 bg-slate-900 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>30% (High Precaution)</span>
                <span>50% (Standard)</span>
                <span>80% (Extreme Failure Limit)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Impact Scorecard */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
              Projected Network Consequences
            </span>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-400">Roads Severed</span>
                <span className="text-3xl font-extrabold font-mono text-red-400">
                  {blockedSegments.length} <span className="text-xs font-normal text-slate-400">/ 12</span>
                </span>
              </div>
              <div className="flex justify-between items-baseline border-t border-white/5 pt-2">
                <span className="text-xs text-slate-400">Operational Corridors</span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  {safeSegments.length} Open
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Critical Failure Corridors
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {blockedSegments.map((seg) => (
                  <div
                    key={seg.segment_id}
                    className="p-2.5 rounded-lg bg-red-950/30 border border-red-900/50 flex justify-between items-center text-xs"
                  >
                    <div>
                      <span className="font-bold text-white font-mono">{seg.segment_id}</span>
                      <div className="text-[10px] text-red-300 font-sans">{seg.name}</div>
                    </div>
                    <div className="text-right font-mono text-red-400 font-bold">
                      {(seg.probability * 100).toFixed(0)}% Risk
                    </div>
                  </div>
                ))}
                {blockedSegments.length === 0 && (
                  <div className="text-center py-6 text-xs text-emerald-400 font-mono">
                    All corridors passable under this load.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.08]">
            <button
              onClick={() => onNavigate("command")}
              className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/25"
            >
              <span>View On Live Command Deck</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
