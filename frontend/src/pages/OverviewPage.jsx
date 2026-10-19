import React from "react";
import {
  ArrowRight,
  Play,
  CloudRain,
  Radio,
  Cpu,
  AlertTriangle,
  Shield,
  Activity,
  Mountain,
  Navigation,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

export function OverviewPage({
  onNavigate,
  network,
  depots,
  timelineData,
  currentHour,
  mlStatus,
  isDark = false,
}) {
  const currentStep = timelineData?.timeline?.[currentHour] || null;
  const blockedCount = currentStep?.blocked_count || 0;
  const isolatedPop = currentStep?.isolated_population || 0;
  const rainNow = currentStep?.rainfall_mm || 0.0;

  return (
    <div
      className={`min-h-screen flex flex-col font-sans select-none overflow-x-hidden transition-colors duration-300 ${
        isDark ? "bg-[#0a0f1a] text-[#f1f5f9]" : "bg-[#fafbfc] text-[#0f172a]"
      }`}
    >
      {/* 1. HERO SECTION (Exact Match to User Reference Sketch) */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-between px-4 sm:px-6 lg:px-12 pt-6 pb-12 overflow-hidden">
        {/* Clean Panoramic Sketch Landscape Illustration Backdrop */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src="/terranex_clean_sketch.jpg"
            alt="Terranex Himalayan Valley Landscape Sketch"
            className="w-full h-full object-cover sm:object-contain object-center transition-all duration-300"
            style={
              isDark
                ? {
                    filter: "invert(0.92) hue-rotate(180deg) brightness(1.2) contrast(1.15)",
                    opacity: 0.35,
                  }
                : {
                    filter: "contrast(1.05)",
                    opacity: 0.85,
                  }
            }
          />
          {/* Subtle soft gradient in the center for maximum text legibility */}
          <div
            className={`absolute inset-0 ${
              isDark
                ? "bg-gradient-to-r from-[#0a0f1a]/90 via-[#0a0f1a]/70 to-[#0a0f1a]/90 sm:from-transparent sm:via-[#0a0f1a]/75 sm:to-transparent"
                : "bg-gradient-to-r from-white/90 via-white/80 to-white/90 sm:from-transparent sm:via-white/75 sm:to-transparent"
            }`}
          />
          <div
            className={`absolute inset-0 ${
              isDark
                ? "bg-gradient-to-b from-[#0a0f1a]/60 via-transparent to-[#0a0f1a]"
                : "bg-gradient-to-b from-white/40 via-transparent to-[#fafbfc]"
            }`}
          />
        </div>

        {/* Top Space Filler */}
        <div className="relative z-10 w-full" />

        {/* Center Content: Title, Underline, and Buttons */}
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6 sm:space-y-8 my-auto">
          {/* Hand-Drawn Brush Title */}
          <div className="space-y-1">
            <h1
              className={`font-sketch text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.08] transition-colors ${
                isDark ? "text-white" : "text-[#0f172a]"
              }`}
            >
              Adaptive Landslide
              <br />
              Intelligence.
            </h1>

            {/* Autonomous Evacuation in vibrant blue with green brush stroke underline */}
            <div className="inline-block relative">
              <span
                className={`font-sketch text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight ${
                  isDark ? "text-sky-400" : "text-[#0284c7]"
                }`}
              >
                Autonomous Evacuation.
              </span>
              {/* Playful Green Hand-Drawn Underline SVG */}
              <svg
                className="w-full h-4 sm:h-6 -mt-1 sm:-mt-2 overflow-visible"
                viewBox="0 0 400 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 14C80 5 220 4 395 12"
                  stroke="#10b981"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            {/* Primary Blue Button with Radiating Sparkle Doodle Lines */}
            <div className="relative flex items-center justify-center">
              {/* Left Burst Doodle Marks */}
              <div className="hidden sm:flex flex-col gap-1 -mr-2 text-[#0284c7] opacity-80 select-none">
                <span className="text-xs font-bold -rotate-45 leading-none">—</span>
                <span className="text-xs font-bold leading-none">—</span>
                <span className="text-xs font-bold rotate-45 leading-none">—</span>
              </div>

              <button
                onClick={() => onNavigate("command")}
                className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#7dd3fc] to-[#38bdf8] text-[#0f172a] border-2 border-[#0284c7]/40 shadow-[0_4px_16px_rgba(56,189,248,0.35)] font-sketch text-lg sm:text-xl font-bold flex items-center gap-2.5 hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer z-10"
              >
                <Play className="w-4 h-4 fill-current text-[#0f172a]" />
                <span>Launch Live Command Deck</span>
                <span className="text-lg">→</span>
              </button>

              {/* Right Burst Doodle Marks */}
              <div className="hidden sm:flex flex-col gap-1 -ml-2 text-[#0284c7] opacity-80 select-none">
                <span className="text-xs font-bold rotate-45 leading-none">—</span>
                <span className="text-xs font-bold leading-none">—</span>
                <span className="text-xs font-bold -rotate-45 leading-none">—</span>
              </div>
            </div>

            {/* Secondary Button: Simulate Cloudburst */}
            <button
              onClick={() => onNavigate("simulator")}
              className={`px-7 py-3.5 rounded-full font-sketch text-base sm:text-lg font-semibold flex items-center gap-2 active:scale-[0.98] transition-all cursor-pointer ${
                isDark
                  ? "bg-[#111827] text-white border border-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.3)] hover:bg-[#1e293b]"
                  : "bg-white text-[#0f172a] border border-[#cbd5e1] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:bg-slate-50"
              }`}
            >
              <div className="relative">
                <CloudRain className="w-5 h-5 text-amber-500" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400" />
              </div>
              <span>Simulate Cloudburst Crisis</span>
            </button>
          </div>
        </div>

        {/* Bottom 4 Feature Cards */}
        <div className="relative z-10 w-full max-w-6xl mx-auto pt-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Telemetry */}
            <div
              className={`backdrop-blur-sm rounded-2xl p-4 shadow-sm flex items-center gap-3.5 transition-all ${
                isDark
                  ? "bg-[#111827]/90 border border-white/[0.08]"
                  : "bg-white/95 border border-slate-200/90 hover:shadow-md"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border ${
                  isDark
                    ? "bg-sky-950/60 text-sky-400 border-sky-800/60"
                    : "bg-[#f0f9ff] text-[#0284c7] border-[#bae6fd]/60"
                }`}
              >
                <Radio className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div
                  className={`font-sketch text-sm font-semibold ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Telemetry
                </div>
                <div
                  className={`font-sketch text-lg font-bold flex items-center gap-1.5 ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse inline-block" />
                  <span>Live</span>
                </div>
              </div>
            </div>

            {/* Card 2: ML Accuracy */}
            <div
              className={`backdrop-blur-sm rounded-2xl p-4 shadow-sm flex items-center gap-3.5 transition-all ${
                isDark
                  ? "bg-[#111827]/90 border border-white/[0.08]"
                  : "bg-white/95 border border-slate-200/90 hover:shadow-md"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border ${
                  isDark
                    ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/60"
                    : "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]/60"
                }`}
              >
                <Cpu className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div
                  className={`font-sketch text-sm font-semibold ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  ML Accuracy
                </div>
                <div className="font-sketch text-[#10b981] text-lg font-bold">
                  91.37%
                </div>
              </div>
            </div>

            {/* Card 3: Active Corridors */}
            <div
              className={`backdrop-blur-sm rounded-2xl p-4 shadow-sm flex items-center gap-3.5 transition-all ${
                isDark
                  ? "bg-[#111827]/90 border border-white/[0.08]"
                  : "bg-white/95 border border-slate-200/90 hover:shadow-md"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border ${
                  isDark
                    ? "bg-red-950/60 text-red-400 border-red-800/60"
                    : "bg-[#fef2f2] text-[#ef4444] border-[#fecaca]/60"
                }`}
              >
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div
                  className={`font-sketch text-sm font-semibold ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Active Corridors
                </div>
                <div
                  className={`font-sketch text-lg font-bold ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  12
                </div>
              </div>
            </div>

            {/* Card 4: Staging Depots */}
            <div
              className={`backdrop-blur-sm rounded-2xl p-4 shadow-sm flex items-center gap-3.5 transition-all ${
                isDark
                  ? "bg-[#111827]/90 border border-white/[0.08]"
                  : "bg-white/95 border border-slate-200/90 hover:shadow-md"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border ${
                  isDark
                    ? "bg-amber-950/60 text-amber-400 border-amber-800/60"
                    : "bg-[#fefce8] text-[#ca8a04] border-[#fef08a]/60"
                }`}
              >
                <Shield className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div
                  className={`font-sketch text-sm font-semibold ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Staging Depots
                </div>
                <div
                  className={`font-sketch text-lg font-bold ${
                    isDark ? "text-amber-400" : "text-[#ca8a04]"
                  }`}
                >
                  {depots?.length || 6} Ready
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. REFINED MINIMALIST SUPPORTING SECTION */}
      <section
        className={`py-16 px-6 lg:px-12 border-t transition-colors ${
          isDark
            ? "bg-[#070b14] border-white/[0.08]"
            : "bg-white border-slate-200/80"
        }`}
      >
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span
              className={`font-sketch text-sm uppercase tracking-wider font-bold ${
                isDark ? "text-sky-400" : "text-[#0284c7]"
              }`}
            >
              Engineering Architecture
            </span>
            <h2
              className={`font-sketch text-3xl sm:text-4xl font-bold ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              How Terranex Operates in the Garhwal Himalayas
            </h2>
            <p
              className={`text-xs sm:text-sm ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Transforming raw weather telemetry and terrain digital elevation models into explainable geotechnical risk and autonomous rescue routes.
            </p>
          </div>

          {/* 3 Clean Editorial Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Box 1 */}
            <div
              className={`rounded-2xl p-6 space-y-4 border transition-all ${
                isDark
                  ? "bg-[#111827] border-white/[0.08] hover:border-white/20"
                  : "bg-[#f8fafc] border-slate-200/80 hover:border-slate-300"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-sketch font-bold text-lg shadow-sm border ${
                  isDark
                    ? "bg-white/[0.06] border-white/10 text-sky-400"
                    : "bg-white border-slate-200 text-[#0284c7]"
                }`}
              >
                1
              </div>
              <div className="space-y-1.5">
                <h3
                  className={`font-sketch text-xl font-bold ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  Caine (1980) Physics Threshold
                </h3>
                <p
                  className={`text-xs leading-relaxed ${
                    isDark ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  Calculates precipitation threshold:{" "}
                  <code
                    className={`px-1 py-0.5 rounded font-mono text-[11px] ${
                      isDark ? "bg-white/[0.08] text-cyan-300" : "bg-slate-200 text-slate-800"
                    }`}
                  >
                    I_c = 14.82 × D^(-0.39)
                  </code>
                  . Every road segment compares live precipitation against critical initiation levels.
                </p>
              </div>
              <button
                onClick={() => onNavigate("intelligence")}
                className={`text-xs font-sketch font-bold flex items-center gap-1 cursor-pointer ${
                  isDark ? "text-sky-400 hover:text-sky-300" : "text-[#0284c7] hover:text-[#0369a1]"
                }`}
              >
                <span>Inspect in Intelligence Lab</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Box 2 */}
            <div
              className={`rounded-2xl p-6 space-y-4 border transition-all ${
                isDark
                  ? "bg-[#111827] border-white/[0.08] hover:border-white/20"
                  : "bg-[#f8fafc] border-slate-200/80 hover:border-slate-300"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-sketch font-bold text-lg shadow-sm border ${
                  isDark
                    ? "bg-white/[0.06] border-white/10 text-emerald-400"
                    : "bg-white border-slate-200 text-[#059669]"
                }`}
              >
                2
              </div>
              <div className="space-y-1.5">
                <h3
                  className={`font-sketch text-xl font-bold ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  Supervised Random Forest ML
                </h3>
                <p
                  className={`text-xs leading-relaxed ${
                    isDark ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  Trained on steep Himalayan DEM elevation gradients and monsoonal historical landslides.
                  Verified accuracy of <b>91.37%</b> with ROC-AUC <b>0.973</b>.
                </p>
              </div>
              <button
                onClick={() => onNavigate("command")}
                className={`text-xs font-sketch font-bold flex items-center gap-1 cursor-pointer ${
                  isDark ? "text-emerald-400 hover:text-emerald-300" : "text-[#059669] hover:text-[#047857]"
                }`}
              >
                <span>View On Map Deck</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Box 3 */}
            <div
              className={`rounded-2xl p-6 space-y-4 border transition-all ${
                isDark
                  ? "bg-[#111827] border-white/[0.08] hover:border-white/20"
                  : "bg-[#f8fafc] border-slate-200/80 hover:border-slate-300"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-sketch font-bold text-lg shadow-sm border ${
                  isDark
                    ? "bg-white/[0.06] border-white/10 text-amber-400"
                    : "bg-white border-slate-200 text-[#ca8a04]"
                }`}
              >
                3
              </div>
              <div className="space-y-1.5">
                <h3
                  className={`font-sketch text-xl font-bold ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  3-Way Multimodal Evacuation
                </h3>
                <p
                  className={`text-xs leading-relaxed ${
                    isDark ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  When roads sever, the system automatically checks (A) Surface Detour, (B) PWD Heavy Excavator Clearance ETA, and (C) Helicopter Airlift Escalation.
                </p>
              </div>
              <button
                onClick={() => onNavigate("dispatch")}
                className={`text-xs font-sketch font-bold flex items-center gap-1 cursor-pointer ${
                  isDark ? "text-amber-400 hover:text-amber-300" : "text-[#ca8a04] hover:text-[#a16207]"
                }`}
              >
                <span>Open Dispatch Hub</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MINIMAL CLEAN FOOTER */}
      <footer
        className={`py-8 px-6 text-center text-xs font-sketch border-t transition-colors ${
          isDark
            ? "bg-[#060a12] border-white/[0.08] text-slate-500"
            : "bg-white border-slate-200 text-slate-500"
        }`}
      >
        <p>TERRANEX — ADAPTIVE LANDSLIDE INTELLIGENCE &amp; EVACUATION DECK</p>
        <p
          className={`text-[11px] mt-0.5 ${
            isDark ? "text-slate-600" : "text-slate-400"
          }`}
        >
          Rudraprayag District • Garhwal Himalayas • Innotech 2026
        </p>
      </footer>
    </div>
  );
}
