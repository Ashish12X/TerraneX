import React, { useState, useEffect } from "react";
import {
  CloudRain,
  Mountain,
  Zap,
  Wind,
  ArrowRight,
  RotateCcw,
  SlidersHorizontal,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Compass,
} from "lucide-react";
import { api } from "../services/api";

// ── Sketch Slider ─────────────────────────────────────────────────────────────
function SketchSlider({ label, value, min, max, step = 1, onChange, unit = "", colorClass = "bg-sky-400", rangeClass = "range-blue" }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg">
          {value}{unit}
        </span>
      </div>
      <div className="relative">
        <div className="h-[5px] bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${colorClass}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`absolute inset-0 opacity-0 w-full cursor-pointer ${rangeClass}`}
          style={{ height: "5px", top: 0 }}
        />
        {/* Visible thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-sky-400 shadow-sm pointer-events-none transition-all"
          style={{ left: `calc(${pct}% - 8px)` }}
        />
      </div>
    </div>
  );
}

// ── Scenario Preset Card ──────────────────────────────────────────────────────
function ScenarioCard({ icon: Icon, label, desc, colorClass, borderClass, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-150 group
        ${borderClass} ${colorClass}
        ${active ? "ring-2 ring-offset-1 ring-slate-400 shadow-md" : "hover:shadow-sm hover:scale-[1.01]"}`}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-white/70 rounded-xl border border-white/60">
          <Icon className="w-5 h-5 text-slate-700" strokeWidth={1.6} />
        </div>
        <div>
          <div className="font-sketch text-base font-bold text-slate-800 leading-tight">{label}</div>
          <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</div>
        </div>
      </div>
    </button>
  );
}

// ── Risk Badge ────────────────────────────────────────────────────────────────
function RiskBadge({ risk }) {
  if (risk == null) return <span className="sk-pill bg-slate-100 text-slate-400 border-slate-200">—</span>;
  const pct = (risk * 100).toFixed(0);
  if (risk >= 0.7) return <span className="sk-pill bg-red-100 text-red-700 border-red-300">{pct}% CRITICAL</span>;
  if (risk >= 0.4) return <span className="sk-pill bg-amber-100 text-amber-700 border-amber-300">{pct}% ELEVATED</span>;
  return <span className="sk-pill bg-green-100 text-green-700 border-green-300">{pct}% SAFE</span>;
}

// ── Main Component ────────────────────────────────────────────────────────────
export function SimulationStudioPage({
  simRain, setSimRain,
  simPrior1, setSimPrior1,
  simPrior2, setSimPrior2,
  simThreshold, setSimThreshold,
  onNavigate,
}) {
  const [simulationData, setSimulationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activePreset, setActivePreset] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.getSimulationRisk({ rainfall: simRain, prior1: simPrior1, prior2: simPrior2, threshold: simThreshold })
      .then((data) => { setSimulationData(data); setLoading(false); })
      .catch((err) => { console.error("Simulation error:", err); setLoading(false); });
  }, [simRain, simPrior1, simPrior2, simThreshold]);

  const applyPreset = (id, rain, p1, p2, th) => {
    setActivePreset(id);
    setSimRain(rain); setSimPrior1(p1); setSimPrior2(p2); setSimThreshold(th);
  };

  const criticalCount = simulationData?.segments
    ? simulationData.segments.filter((s) => s.risk >= 0.7).length : 0;
  const elevatedCount = simulationData?.segments
    ? simulationData.segments.filter((s) => s.risk >= 0.4 && s.risk < 0.7).length : 0;
  const safeCount = simulationData?.segments
    ? simulationData.segments.filter((s) => s.risk < 0.4).length : 0;
  const criticalSegs = simulationData?.segments
    ? simulationData.segments.filter((s) => s.risk >= 0.7).slice(0, 5) : [];
  const overallRisk = simulationData?.overall_risk;

  return (
    <div className="sk-page min-h-screen p-5 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── HEADER ────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="sk-section-label">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Crisis Simulator · Scenario Modelling
            </div>
            <h1 className="font-sketch text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
              Simulation Studio
            </h1>
            <p className="text-sm text-slate-500 mt-2 max-w-xl">
              Adjust environmental parameters to preview cascading network failure
              across all 9 Rudraprayag road corridors.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setSimRain(80); setSimPrior1(20); setSimPrior2(15); setSimThreshold(0.5); setActivePreset(null); }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
            <button
              onClick={() => onNavigate("command")}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-700 transition-all"
            >
              <Compass className="w-3.5 h-3.5" />
              View Live Map
            </button>
          </div>
        </div>

        {/* ── 2-COL GRID ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-5">

          {/* LEFT COLUMN */}
          <div className="space-y-5">

            {/* Scenario Presets */}
            <div className="sk-card p-5 space-y-4">
              <div className="sk-section-label">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Scenario Presets
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ScenarioCard
                  icon={CloudRain}
                  label="Monsoon Surge"
                  desc="Heavy sustained rainfall across all sectors"
                  colorClass="sk-card-green"
                  borderClass=""
                  active={activePreset === "monsoon"}
                  onClick={() => applyPreset("monsoon", 140, 30, 20, 0.5)}
                />
                <ScenarioCard
                  icon={Mountain}
                  label="Landslide Chain"
                  desc="Sequential debris flows on steep corridors"
                  colorClass="sk-card-amber"
                  borderClass=""
                  active={activePreset === "landslide"}
                  onClick={() => applyPreset("landslide", 100, 45, 35, 0.35)}
                />
                <ScenarioCard
                  icon={Zap}
                  label="Flash Flood"
                  desc="Rapid onset flood — Kedarnath upstream"
                  colorClass="sk-card-red"
                  borderClass=""
                  active={activePreset === "flood"}
                  onClick={() => applyPreset("flood", 180, 10, 10, 0.4)}
                />
                <ScenarioCard
                  icon={Wind}
                  label="Dry Season Dry Run"
                  desc="Minimal rainfall, clear road network"
                  colorClass="sk-card-purple"
                  borderClass=""
                  active={activePreset === "dry"}
                  onClick={() => applyPreset("dry", 20, 5, 3, 0.6)}
                />
              </div>
            </div>

            {/* Parameter Sliders */}
            <div className="sk-card p-5 space-y-5">
              <div className="sk-section-label">
                <SlidersHorizontal className="w-3.5 h-3.5 text-sky-500" />
                Environmental Parameters
              </div>
              <SketchSlider
                label="Rainfall Intensity"
                value={simRain}
                min={0} max={200} step={5}
                unit=" mm"
                onChange={setSimRain}
                colorClass="bg-sky-400"
                rangeClass="range-blue"
              />
              <SketchSlider
                label="Prior Antecedent (7-day)"
                value={simPrior1}
                min={0} max={60} step={1}
                unit=" mm"
                onChange={setSimPrior1}
                colorClass="bg-green-400"
                rangeClass="range-green"
              />
              <SketchSlider
                label="Prior Antecedent (30-day)"
                value={simPrior2}
                min={0} max={80} step={1}
                unit=" mm"
                onChange={setSimPrior2}
                colorClass="bg-amber-400"
                rangeClass="range-amber"
              />
              <SketchSlider
                label="Risk Threshold"
                value={Math.round(simThreshold * 100)}
                min={20} max={80} step={5}
                unit="%"
                onChange={(v) => setSimThreshold(v / 100)}
                colorClass="bg-purple-400"
                rangeClass="range-purple"
              />
            </div>

            {/* Failure Corridors table */}
            <div className="sk-card p-5">
              <div className="sk-section-label mb-3">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                Critical Failure Corridors
              </div>
              {loading ? (
                <div className="py-8 text-center font-sketch text-slate-400 animate-pulse">
                  Simulating…
                </div>
              ) : criticalSegs.length === 0 ? (
                <div className="py-8 text-center font-sketch text-slate-400">
                  No critical segments at current parameters
                </div>
              ) : (
                <div className="space-y-2">
                  {criticalSegs.map((seg, i) => (
                    <div
                      key={seg.edge_id || i}
                      className="flex items-center justify-between py-2.5 px-4 bg-red-50 border border-red-100 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-lg">
                          {seg.edge_id}
                        </span>
                        <span className="text-sm text-slate-700 font-medium">
                          {seg.from} → {seg.to}
                        </span>
                      </div>
                      <RiskBadge risk={seg.risk} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN — Network Impact */}
          <div className="space-y-5">

            {/* Overall Risk Gauge */}
            <div className="sk-card p-5 text-center space-y-3">
              <div className="sk-section-label justify-center">
                <Activity className="w-3.5 h-3.5 text-sky-500" />
                Network-Wide Risk Index
              </div>
              {loading ? (
                <div className="h-24 flex items-center justify-center font-sketch text-slate-400 animate-pulse">
                  Computing…
                </div>
              ) : (
                <div className="relative inline-flex flex-col items-center gap-1">
                  <div className={`text-6xl font-sketch font-bold ${
                    overallRisk >= 0.7 ? "text-red-500"
                    : overallRisk >= 0.4 ? "text-amber-500"
                    : "text-green-500"
                  }`}>
                    {overallRisk != null ? `${(overallRisk * 100).toFixed(0)}%` : "—"}
                  </div>
                  <div className="text-xs font-medium text-slate-500 font-mono">
                    {overallRisk >= 0.7 ? "CRITICAL NETWORK STATE"
                      : overallRisk >= 0.4 ? "ELEVATED RISK STATE"
                      : "OPERATIONAL NETWORK"}
                  </div>
                </div>
              )}
              {/* Gauge bar */}
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    overallRisk >= 0.7 ? "bg-red-400"
                    : overallRisk >= 0.4 ? "bg-amber-400"
                    : "bg-green-400"
                  }`}
                  style={{ width: `${(overallRisk ?? 0) * 100}%` }}
                />
              </div>
            </div>

            {/* Segment Breakdown */}
            <div className="sk-card p-5 space-y-3">
              <div className="sk-section-label">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                Segment Breakdown
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2.5 px-4 bg-red-50 border border-red-100 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <span className="text-sm font-medium text-slate-700">Critical (≥70%)</span>
                  </div>
                  <span className="font-mono font-bold text-red-600 text-lg">{loading ? "…" : criticalCount}</span>
                </div>
                <div className="flex items-center justify-between py-2.5 px-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="text-sm font-medium text-slate-700">Elevated (40–70%)</span>
                  </div>
                  <span className="font-mono font-bold text-amber-600 text-lg">{loading ? "…" : elevatedCount}</span>
                </div>
                <div className="flex items-center justify-between py-2.5 px-4 bg-green-50 border border-green-100 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    <span className="text-sm font-medium text-slate-700">Safe (&lt;40%)</span>
                  </div>
                  <span className="font-mono font-bold text-green-600 text-lg">{loading ? "…" : safeCount}</span>
                </div>
              </div>
            </div>

            {/* All segments list */}
            {simulationData?.segments && (
              <div className="sk-card p-5 space-y-3">
                <div className="sk-section-label">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                  All Segments
                </div>
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {simulationData.segments.map((seg, i) => (
                    <div key={i} className="flex items-center justify-between py-2 px-3 hover:bg-slate-50 rounded-xl transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-400">{seg.edge_id}</span>
                        <span className="text-xs text-slate-700">{seg.from} → {seg.to}</span>
                      </div>
                      <RiskBadge risk={seg.risk} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <button
              onClick={() => onNavigate("command")}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-700 text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Compass className="w-4 h-4" />
              View on Live Command Deck
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
