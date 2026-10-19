import React, { useState, useEffect } from "react";
import {
  Cpu,
  Activity,
  Mountain,
  CloudRain,
  ShieldCheck,
  Zap,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Info,
} from "lucide-react";
import { api } from "../services/api";

export function IntelligenceLabPage({ network, onNavigate }) {
  const [selectedEdgeId, setSelectedEdgeId] = useState("E06");
  const [edgeData, setEdgeData] = useState(null);
  const [durationHours, setDurationHours] = useState(1.0);
  const [rainfallMm, setRainfallMm] = useState(65);
  const [prior1, setPrior1] = useState(15);
  const [prior2, setPrior2] = useState(10);
  const [loading, setLoading] = useState(false);

  // ML Test Bench state
  const [customSlope, setCustomSlope] = useState(55);
  const [customRain, setCustomRain] = useState(70);
  const [customAntecedent, setCustomAntecedent] = useState(20);
  const [mlInferenceResult, setMlInferenceResult] = useState(null);

  // Fetch segment risk data
  useEffect(() => {
    if (!selectedEdgeId) return;
    setLoading(true);
    api
      .getSegmentRisk(selectedEdgeId, {
        rainfall: rainfallMm,
        prior1: prior1,
        prior2: prior2,
        threshold: 0.5,
      })
      .then((data) => {
        setEdgeData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Segment risk load error:", err);
        setLoading(false);
      });
  }, [selectedEdgeId, rainfallMm, prior1, prior2]);

  // Run direct ML inference
  const handleRunMLInference = async () => {
    try {
      const caineThreshold = 14.82 * Math.pow(durationHours, -0.39);
      const caineRatio = customRain / caineThreshold;
      const res = await api.predictML({
        mean_gradient_pct: customSlope,
        max_gradient_pct: Math.min(100, customSlope + 10),
        hourly_rainfall_mm: customRain,
        caine_threshold_mm_hr: caineThreshold.toFixed(2),
        caine_ratio: caineRatio.toFixed(3),
        antecedent_72h_mm: customAntecedent,
        elevation_m: 1800,
        geotechnical_susc: 0.55,
      });
      setMlInferenceResult(res);
    } catch (err) {
      console.warn("ML predict error:", err);
    }
  };

  // Run initial test inference
  useEffect(() => {
    handleRunMLInference();
  }, [customSlope, customRain, customAntecedent, durationHours]);

  // Caine Threshold for slider duration
  const calculatedCaineThreshold = (14.82 * Math.pow(durationHours, -0.39)).toFixed(2);

  // Feature Importance data
  const featureImportances = [
    { name: "Hourly Rainfall Intensity", weight: 23.49, code: "hourly_rainfall_mm", color: "bg-cyan-500" },
    { name: "Caine Intensity Ratio (Rain/Ic)", weight: 19.78, code: "caine_ratio", color: "bg-cyan-400" },
    { name: "Mean Terrain Gradient (%)", weight: 18.86, code: "mean_gradient_pct", color: "bg-amber-500" },
    { name: "Peak Terrain Gradient (%)", weight: 17.84, code: "max_gradient_pct", color: "bg-amber-400" },
    { name: "Geotechnical Susceptibility", weight: 9.29, code: "geotechnical_susc", color: "bg-purple-500" },
    { name: "72-Hour Decayed Soil Moisture", weight: 7.32, code: "antecedent_72h_mm", color: "bg-emerald-500" },
    { name: "Mean Elevation ASL (m)", weight: 2.42, code: "elevation_m", color: "bg-slate-400" },
    { name: "Caine Threshold Baseline", weight: 1.00, code: "caine_threshold_mm_hr", color: "bg-slate-500" },
  ];

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 p-6 lg:p-10 space-y-10 max-w-7xl mx-auto">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.08] pb-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-xs">
            <Cpu className="w-3.5 h-3.5" />
            <span>GEOTECHNICAL INTELLIGENCE LAB • XAI BENCH</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Physics-Informed Machine Learning.
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl">
            Bridging empirical mass-wasting geotechnical physics with ensemble Random Forest classifiers.
            Zero black-box predictions; transparent attribution down to soil moisture and slope degrees.
          </p>
        </div>

        {/* Model Metrics Card */}
        <div className="glass-panel p-4 rounded-xl border-white/10 shrink-0 space-y-2 text-right">
          <div className="text-[10px] uppercase font-mono text-slate-400">Random Forest Ensemble</div>
          <div className="text-2xl font-extrabold text-cyan-300 font-mono">91.37% Accuracy</div>
          <div className="flex items-center justify-end gap-3 text-xs font-mono text-slate-400">
            <span>ROC-AUC: <b className="text-white">0.973</b></span>
            <span>•</span>
            <span>Precision: <b className="text-emerald-400">93.2%</b></span>
          </div>
        </div>
      </div>

      {/* 2. CORRIDOR SELECTION STRIP */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Select Road Corridor for Geotechnical Inspection
          </span>
          <span className="text-xs font-mono text-cyan-400">
            12 Himalayan Corridors Monitored
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {network?.edges?.map((edge) => {
            const isSelected = selectedEdgeId === edge.id;
            return (
              <button
                key={edge.id}
                onClick={() => setSelectedEdgeId(edge.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "bg-cyan-500/15 border-cyan-500/50 shadow-md shadow-cyan-950/50"
                    : "glass-panel-subtle hover:border-white/20"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className={`font-mono text-xs font-bold ${isSelected ? "text-cyan-300" : "text-white"}`}>
                    {edge.id}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{edge.length_km}km</span>
                </div>
                <div className="text-xs font-semibold text-slate-200 mt-1 truncate">
                  {edge.name || `${edge.from} → ${edge.to}`}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Slope: {edge.mean_gradient_pct || edge.max_gradient_pct}%
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. LIVE CORRIDOR EXPLAINABILITY CARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Caine 1980 Equation & Active Parameters */}
        <div className="glass-panel p-6 rounded-2xl space-y-6 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">Active Corridor</span>
              <h3 className="text-xl font-bold text-white">
                {edgeData?.name || selectedEdgeId}
              </h3>
              <p className="text-xs text-slate-400">
                Road Class: {edgeData?.road_class || "Highway"} • Length: {edgeData?.length_km || 0} km
              </p>
            </div>

            {edgeData && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] font-mono text-slate-400">Failure Probability</div>
                  <div className="text-2xl font-black font-mono" style={{ color: edgeData.blocked ? "#ef4444" : "#10b981" }}>
                    {(edgeData.probability * 100).toFixed(1)}%
                  </div>
                </div>
                <div
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold font-mono ${
                    edgeData.blocked
                      ? "bg-red-500/20 text-red-300 border-red-500/40"
                      : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  }`}
                >
                  {edgeData.blocked ? "BLOCKED / SEVERED" : "OPERATIONAL"}
                </div>
              </div>
            )}
          </div>

          {/* Transparent Narrative Explanation */}
          {edgeData?.reasons && (
            <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-300">Geotechnical Root Cause Assessment</span>
                <span className="font-mono text-cyan-400 text-[11px]">
                  Dominant Trigger: <b>{edgeData.reasons.dominant_cause}</b>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                {edgeData.reasons.explanation}
              </p>
            </div>
          )}

          {/* Three Physics Drivers */}
          {edgeData?.reasons && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Driver 1: Terrain Slope */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Mountain className="w-3.5 h-3.5 text-amber-400" />
                    Slope Gradient
                  </span>
                  <span className="text-[10px] font-mono text-amber-300">40% Weight</span>
                </div>
                <div className="text-2xl font-bold text-white font-mono">
                  {edgeData.reasons.slope_gradient_pct}%
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Contrib: +{(edgeData.reasons.slope_contribution * 100).toFixed(1)}% risk
                </div>
              </div>

              {/* Driver 2: Caine Threshold Ratio */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    Caine Ratio
                  </span>
                  <span className="text-[10px] font-mono text-cyan-300">40% Weight</span>
                </div>
                <div className="text-2xl font-bold text-white font-mono">
                  {edgeData.reasons.intensity_ratio}x
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Rain: {edgeData.reasons.hourly_rainfall_mm} mm/hr vs {edgeData.reasons.caine_threshold_mm_hr} Ic
                </div>
              </div>

              {/* Driver 3: Soil Moisture */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <CloudRain className="w-3.5 h-3.5 text-emerald-400" />
                    Antecedent R72
                  </span>
                  <span className="text-[10px] font-mono text-emerald-300">20% Weight</span>
                </div>
                <div className="text-2xl font-bold text-white font-mono">
                  {edgeData.reasons.antecedent_72h_mm} mm
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Contrib: +{(edgeData.reasons.antecedent_contribution * 100).toFixed(1)}% risk
                </div>
              </div>
            </div>
          )}

          {/* Interactive Simulation Controls on Selected Segment */}
          <div className="space-y-4 pt-4 border-t border-white/[0.08]">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Interactive Calibration Controls for {selectedEdgeId}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-slate-400">Hourly Rainfall</span>
                  <b className="text-white">{rainfallMm} mm/hr</b>
                </div>
                <input
                  type="range"
                  min="0"
                  max="140"
                  step="5"
                  value={rainfallMm}
                  onChange={(e) => setRainfallMm(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-slate-400">Prior 24-48h Saturation</span>
                  <b className="text-white">{prior1} mm</b>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  step="5"
                  value={prior1}
                  onChange={(e) => setPrior1(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-slate-400">Prior 48-72h Saturation</span>
                  <b className="text-white">{prior2} mm</b>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  step="5"
                  value={prior2}
                  onChange={(e) => setPrior2(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Caine Equation Solver & Theory */}
        <div className="glass-panel p-6 rounded-2xl space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
              <Zap className="w-4 h-4" />
              <span>Caine (1980) Critical Solver</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-white/10 font-mono text-center space-y-2">
              <div className="text-slate-400 text-xs">Empirical Himalayan Rainfall Threshold:</div>
              <div className="text-lg font-bold text-cyan-300">
                I_c = 14.82 × D^(-0.39)
              </div>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-white/10">
                Duration D: <b className="text-white">{durationHours}h</b> → Critical Threshold:{" "}
                <b className="text-cyan-400">{calculatedCaineThreshold} mm/hr</b>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Cloudburst Duration (D)</span>
                <span className="text-white">{durationHours} Hours</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="6.0"
                step="0.5"
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.5h Flash Flood</span>
                <span>1.0h Standard</span>
                <span>6.0h Prolonged Monsoon</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              When intense monsoonal storms concentrate high rainfall within short durations (&lt;2h),
              soil pore water pressure instantly overcomes internal shear strength on slopes &gt;45%,
              initiating translational debris avalanches.
            </p>
          </div>

          <div className="pt-4 border-t border-white/[0.08]">
            <button
              onClick={() => onNavigate("command")}
              className="w-full py-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>View On Live Command Deck</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. FEATURE IMPORTANCE BAR CHART (Supervised ML Model Diagnostics) */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div>
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
              Supervised Machine Learning
            </span>
            <h3 className="text-xl font-bold text-white">
              Random Forest Feature Importances
            </h3>
            <p className="text-xs text-slate-400">
              Weights computed across 100 decision trees calibrated on Himalayan landslide inventories.
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>F1-Score: 93.15%</span>
          </div>
        </div>

        <div className="space-y-4">
          {featureImportances.map((item) => (
            <div key={item.code} className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300 font-semibold">{item.name}</span>
                <span className="text-white font-bold">{item.weight}%</span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-white/5">
                <div
                  className={`h-full rounded-full ${item.color} transition-all duration-700`}
                  style={{ width: `${item.weight * 3.5}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
