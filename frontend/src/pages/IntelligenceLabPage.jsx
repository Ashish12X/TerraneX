import React, { useState, useEffect } from "react";
import {
  Cpu,
  Activity,
  Mountain,
  CloudRain,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  SlidersHorizontal,
  Zap,
  Info,
  BarChart2,
  Brain,
} from "lucide-react";
import { api } from "../services/api";

// Hero image — served from public/
const BRAIN_SKETCH = "/sketch_intelligence.jpg";

// ── Sub-components ────────────────────────────────────────────────────────────
function SketchSlider({ label, value, min, max, step = 1, onChange, unit = "", colorClass = "bg-sky-400" }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg">
          {value}{unit}
        </span>
      </div>
      <div className="relative h-[5px] bg-slate-200 rounded-full">
        <div className={`h-full rounded-full transition-all ${colorClass}`} style={{ width: `${pct}%` }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 opacity-0 w-full cursor-pointer"
          style={{ height: "5px" }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-sky-400 shadow-sm pointer-events-none"
          style={{ left: `calc(${pct}% - 8px)` }}
        />
      </div>
    </div>
  );
}

function RiskBar({ label, value }) {
  const pct = (value * 100).toFixed(0);
  const color = value >= 0.7 ? "bg-red-400" : value >= 0.4 ? "bg-amber-400" : "bg-green-400";
  const textColor = value >= 0.7 ? "text-red-600" : value >= 0.4 ? "text-amber-600" : "text-green-600";
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-600 font-medium">{label}</span>
        <span className={`font-mono text-xs font-bold ${textColor}`}>{pct}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MetricPill({ label, value, sub, colorClass = "bg-slate-100 text-slate-700" }) {
  return (
    <div className={`rounded-2xl p-4 ${colorClass}`}>
      <div className="text-2xl font-sketch font-bold">{value}</div>
      <div className="text-xs font-semibold mt-0.5">{label}</div>
      {sub && <div className="text-[10px] opacity-60 mt-0.5">{sub}</div>}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function IntelligenceLabPage({ network, onNavigate, isDark = false }) {
  const [selectedEdgeId, setSelectedEdgeId] = useState("E06");
  const [edgeData, setEdgeData] = useState(null);
  const [durationHours, setDurationHours] = useState(1.0);
  const [rainfallMm, setRainfallMm] = useState(65);
  const [prior1, setPrior1] = useState(15);
  const [prior2, setPrior2] = useState(10);
  const [loading, setLoading] = useState(false);

  const [customSlope, setCustomSlope] = useState(55);
  const [customRain, setCustomRain] = useState(70);
  const [customAntecedent, setCustomAntecedent] = useState(20);
  const [mlInferenceResult, setMlInferenceResult] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);

  useEffect(() => {
    if (!selectedEdgeId) return;
    setLoading(true);
    api.getSegmentRisk(selectedEdgeId, {
      rainfall: rainfallMm, prior1, prior2, threshold: 0.5,
    }).then((data) => { setEdgeData(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [selectedEdgeId, rainfallMm, prior1, prior2]);

  const handleRunMLInference = async () => {
    try {
      setMlLoading(true);
      const caineThreshold = 14.82 * Math.pow(durationHours, -0.39);
      const caineRatio = customRain / caineThreshold;
      const res = await api.predictML({
        mean_gradient_pct: customSlope,
        antecedent_rain_7d: customAntecedent,
        antecedent_rain_30d: customAntecedent * 2.8,
        caine_ratio: caineRatio,
        peak_intensity_mm_hr: customRain / durationHours,
      });
      setMlInferenceResult(res);
    } catch (e) { console.error(e); }
    finally { setMlLoading(false); }
  };

  const edges = network?.edges || [];
  const edgeRisk = edgeData?.risk;

  // ── Dark-mode class helpers ─────────────────────────────────────────────
  const pg   = isDark ? "min-h-screen p-5 lg:p-8" : "sk-page min-h-screen p-5 lg:p-8";
  const card = isDark
    ? "bg-[#111827] border border-white/[0.07] rounded-2xl"
    : "sk-card";
  const subBg = isDark ? "bg-white/[0.04]" : "bg-slate-50";
  const txtP  = isDark ? "text-slate-100" : "text-slate-900";
  const txtM  = isDark ? "text-slate-400" : "text-slate-500";
  const txtS  = isDark ? "text-slate-300" : "text-slate-700";
  const brd   = isDark ? "border-white/[0.06]" : "border-slate-100";
  const btnPrimary = isDark
    ? "bg-white text-slate-900 hover:bg-slate-100"
    : "bg-slate-900 text-white hover:bg-slate-700";
  const tagBg = isDark ? "bg-[#0c1425] border-white/[0.08]" : "bg-slate-50 border-slate-100";

  return (
    <div className={pg} style={isDark ? { background: '#0a0f1a', color: '#f1f5f9' } : {}}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <div className={`${card} overflow-hidden`}>
          <div className="flex flex-col md:flex-row gap-6 p-6">
            <div className="flex-1 space-y-3">
              <div className="sk-section-label">
                <Cpu className="w-3.5 h-3.5 text-purple-500" />
                <span className={txtM}>Intelligence Lab · Bayesian + ML Engine</span>
              </div>
              <h1 className={`font-sketch text-4xl lg:text-5xl font-bold leading-tight ${txtP}`}>
                Risk Intelligence
              </h1>
              <p className={`text-sm max-w-lg ${txtM}`}>
                Per-segment probabilistic risk using a Bayesian belief network fused with a
                Random Forest landslide classifier. Select a corridor to inspect deep inference.
              </p>
              <button
                onClick={() => onNavigate("command")}
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all mt-1 ${btnPrimary}`}
              >
                View Live Map <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* Sketch illustration */}
            <div className="hidden md:block w-64 shrink-0">
              <img
                src={BRAIN_SKETCH}
                alt="Intelligence sketch"
                className="w-full h-40 object-contain object-center opacity-85 mix-blend-multiply"
              />
            </div>
          </div>
        </div>

        {/* ── 3-COLUMN METRIC STRIP ────────────────────────────────── */}
        {edgeData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricPill
              label="Landslide Risk"
              value={edgeRisk != null ? `${(edgeRisk * 100).toFixed(0)}%` : "—"}
              sub="Bayesian posterior"
              colorClass={
                edgeRisk >= 0.7
                  ? isDark ? "bg-red-950/60 text-red-300 border border-red-800/50" : "bg-red-50 text-red-700 border border-red-100"
                  : edgeRisk >= 0.4
                  ? isDark ? "bg-amber-950/60 text-amber-300 border border-amber-800/50" : "bg-amber-50 text-amber-700 border border-amber-100"
                  : isDark ? "bg-green-950/60 text-green-300 border border-green-800/50" : "bg-green-50 text-green-700 border border-green-100"
              }
            />
            <MetricPill
              label="Slope Grade"
              value={edgeData.slope_pct != null ? `${edgeData.slope_pct}%` : "—"}
              sub="Mean gradient"
              colorClass={isDark ? "bg-sky-950/60 text-sky-300 border border-sky-800/50" : "bg-sky-50 text-sky-700 border border-sky-100"}
            />
            <MetricPill
              label="Rainfall"
              value={`${rainfallMm} mm`}
              sub="Current scenario"
              colorClass={isDark ? "bg-purple-950/60 text-purple-300 border border-purple-800/50" : "bg-purple-50 text-purple-700 border border-purple-100"}
            />
            <MetricPill
              label="Cainé Ratio"
              value={edgeData.caine_ratio != null ? edgeData.caine_ratio.toFixed(2) : "—"}
              sub="vs. threshold"
              colorClass={isDark ? "bg-white/[0.05] text-slate-300 border border-white/[0.08]" : "bg-slate-50 text-slate-700 border border-slate-100"}
            />
          </div>
        )}

        {/* ── MAIN GRID ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-5">

          {/* LEFT — Segment Selector + Sliders */}
          <div className="space-y-5">

            {/* Edge Selector */}
            <div className={`${card} p-5`}>
              <div className="sk-section-label">
                <Mountain className="w-3.5 h-3.5 text-slate-500" />
                <span className={txtM}>Road Corridor</span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {(edges.length > 0 ? edges : ["E01","E02","E03","E04","E05","E06","E07","E08","E09"].map((id) => ({ id }))).map((e) => (
                  <button
                    key={e.id}
                    onClick={() => setSelectedEdgeId(e.id)}
                    className={`py-1.5 rounded-xl text-xs font-mono font-bold transition-all border
                      ${selectedEdgeId === e.id
                        ? isDark ? "bg-white text-slate-900 border-white" : "bg-slate-900 text-white border-slate-900"
                        : isDark ? "bg-white/[0.05] text-slate-300 border-white/[0.08] hover:bg-white/[0.1]" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                  >
                    {e.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Sliders */}
            <div className={`${card} p-5 space-y-4`}>
              <div className="sk-section-label">
                <CloudRain className="w-3.5 h-3.5 text-sky-500" />
                Rainfall Parameters
              </div>
              <SketchSlider label="Rainfall (mm)" value={rainfallMm} min={0} max={200} step={5}
                unit=" mm" onChange={setRainfallMm} colorClass="bg-sky-400" />
              <SketchSlider label="Prior 7-day (mm)" value={prior1} min={0} max={60}
                unit=" mm" onChange={setPrior1} colorClass="bg-green-400" />
              <SketchSlider label="Prior 30-day (mm)" value={prior2} min={0} max={80}
                unit=" mm" onChange={setPrior2} colorClass="bg-amber-400" />
            </div>
          </div>

          {/* RIGHT — Segment details + ML Bench */}
          <div className="space-y-5">

            {/* Segment Risk Detail */}
            <div className={`${card} p-5`}>
              <div className="flex items-center justify-between mb-4">
                <div className="sk-section-label mb-0">
                  <Activity className="w-3.5 h-3.5 text-sky-500" />
                  Segment Risk Analysis — {selectedEdgeId}
                </div>
                {loading && (
                  <span className="text-xs text-slate-400 animate-pulse font-mono">Computing…</span>
                )}
              </div>

              {edgeData ? (
                <div className="space-y-3">
                  <RiskBar label="Landslide Probability" value={edgeData.risk ?? 0} isDark={isDark} />
                  <RiskBar label="Cainé Exceedance" value={Math.min(1, (edgeData.caine_ratio ?? 0) / 3)} isDark={isDark} />
                  {edgeData.bayesian_factors && Object.entries(edgeData.bayesian_factors).map(([k, v]) => (
                    <RiskBar key={k} label={k.replace(/_/g, " ")} value={typeof v === "number" ? v : 0} isDark={isDark} />
                  ))}
                  {/* Feature table */}
                  {edgeData.features && (
                    <div className={`mt-4 pt-4 border-t ${brd}`}>
                      <div className="sk-section-label mb-2">
                        <Info className="w-3.5 h-3.5" />
                        <span className={txtM}>Physical Features</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(edgeData.features).slice(0, 6).map(([k, v]) => (
                          <div key={k} className={`${tagBg} rounded-xl px-3 py-2 border`}>
                            <div className={`text-[10px] font-mono ${txtM}`}>{k}</div>
                            <div className={`text-sm font-bold mt-0.5 ${txtP}`}>
                              {typeof v === "number" ? v.toFixed(2) : String(v)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center font-sketch text-slate-400">
                  {loading ? "Loading segment data…" : "Select a corridor to analyse"}
                </div>
              )}
            </div>

            {/* ML Direct Inference Bench */}
            <div className={`${card} p-5`}>
              <div className="flex items-center justify-between mb-4">
                <div className="sk-section-label mb-0">
                  <Brain className="w-3.5 h-3.5 text-purple-500" />
                  ML Direct Inference Bench
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <SketchSlider label="Slope (%)" value={customSlope} min={5} max={90}
                  onChange={setCustomSlope} colorClass="bg-purple-400" />
                <SketchSlider label="Rainfall (mm)" value={customRain} min={0} max={200} step={5}
                  unit=" mm" onChange={setCustomRain} colorClass="bg-sky-400" />
                <SketchSlider label="Antecedent (7d)" value={customAntecedent} min={0} max={60}
                  unit=" mm" onChange={setCustomAntecedent} colorClass="bg-green-400" />
              </div>
              <button
                onClick={handleRunMLInference}
                disabled={mlLoading}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                {mlLoading ? "Running inference…" : "Run Random Forest Inference"}
              </button>
              {mlInferenceResult && (
                <div className={`mt-4 p-4 rounded-2xl border text-sm font-medium
                  ${mlInferenceResult.prediction === 1
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-green-50 border-green-200 text-green-700"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {mlInferenceResult.prediction === 1
                      ? <AlertTriangle className="w-4 h-4" />
                      : <CheckCircle2 className="w-4 h-4" />}
                    <span className="font-sketch text-base font-bold">
                      {mlInferenceResult.prediction === 1 ? "Landslide Risk Detected" : "Stable — Low Risk"}
                    </span>
                  </div>
                  <div className="font-mono text-xs">
                    Confidence: {mlInferenceResult.probability != null
                      ? `${(mlInferenceResult.probability * 100).toFixed(1)}%` : "—"}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
