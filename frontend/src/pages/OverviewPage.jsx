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
}) {
  const currentStep = timelineData?.timeline?.[currentHour] || null;
  const blockedCount = currentStep?.blocked_count || 0;
  const isolatedPop = currentStep?.isolated_population || 0;
  const rainNow = currentStep?.rainfall_mm || 0.0;

  return (
    <div className="min-h-screen bg-[#fafbfc] text-[#0f172a] flex flex-col font-sans select-none overflow-x-hidden">
      {/* 1. HERO SECTION (Exact Match to User Reference Sketch) */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-between px-4 sm:px-6 lg:px-12 pt-6 pb-12 overflow-hidden">
        {/* Clean Panoramic Sketch Landscape Illustration Backdrop */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src="/terranex_clean_sketch.jpg"
            alt="Terranex Himalayan Valley Landscape Sketch"
            className="w-full h-full object-cover sm:object-contain object-center opacity-85 filter contrast-[1.05]"
          />
          {/* Subtle soft white radial gradient in the center for maximum text legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/80 to-white/90 sm:from-transparent sm:via-white/75 sm:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-[#fafbfc]" />
        </div>

        {/* Top Space Filler */}
        <div className="relative z-10 w-full" />

        {/* Center Content: Title, Underline, and Buttons */}
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6 sm:space-y-8 my-auto">
          {/* Hand-Drawn Brush Title */}
          <div className="space-y-1">
            <h1 className="font-sketch text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#0f172a] leading-[1.08]">
              Adaptive Landslide
              <br />
              Intelligence.
            </h1>

            {/* Autonomous Evacuation in vibrant blue with green brush stroke underline */}
            <div className="inline-block relative">
              <span className="font-sketch text-4xl sm:text-6xl md:text-7xl font-bold text-[#0284c7] tracking-tight">
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

            {/* Secondary White Button: Simulate Cloudburst */}
            <button
              onClick={() => onNavigate("simulator")}
              className="px-7 py-3.5 rounded-full bg-white text-[#0f172a] border border-[#cbd5e1] shadow-[0_2px_8px_rgba(0,0,0,0.04)] font-sketch text-base sm:text-lg font-semibold flex items-center gap-2 hover:bg-slate-50 hover:border-slate-400 active:scale-[0.98] transition-all cursor-pointer"
            >
              <div className="relative">
                <CloudRain className="w-5 h-5 text-amber-500" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400" />
              </div>
              <span>Simulate Cloudburst Crisis</span>
            </button>
          </div>
        </div>

        {/* Bottom 4 Feature Cards (Exact Reference Match) */}
        <div className="relative z-10 w-full max-w-6xl mx-auto pt-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Telemetry */}
            <div className="bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-2xl p-4 shadow-sm flex items-center gap-3.5 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-[#f0f9ff] text-[#0284c7] flex items-center justify-center shrink-0 border border-[#bae6fd]/60">
                <Radio className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div className="font-sketch text-slate-500 text-sm font-semibold">Telemetry</div>
                <div className="font-sketch text-slate-900 text-lg font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse inline-block" />
                  <span>Live</span>
                </div>
              </div>
            </div>

            {/* Card 2: ML Accuracy */}
            <div className="bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-2xl p-4 shadow-sm flex items-center gap-3.5 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-[#ecfdf5] text-[#059669] flex items-center justify-center shrink-0 border border-[#a7f3d0]/60">
                <Cpu className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div className="font-sketch text-slate-500 text-sm font-semibold">ML Accuracy</div>
                <div className="font-sketch text-[#059669] text-lg font-bold">
                  91.37%
                </div>
              </div>
            </div>

            {/* Card 3: Active Corridors */}
            <div className="bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-2xl p-4 shadow-sm flex items-center gap-3.5 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-[#fef2f2] text-[#ef4444] flex items-center justify-center shrink-0 border border-[#fecaca]/60">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div className="font-sketch text-slate-500 text-sm font-semibold">Active Corridors</div>
                <div className="font-sketch text-slate-900 text-lg font-bold">
                  12
                </div>
              </div>
            </div>

            {/* Card 4: Staging Depots */}
            <div className="bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-2xl p-4 shadow-sm flex items-center gap-3.5 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-[#fefce8] text-[#ca8a04] flex items-center justify-center shrink-0 border border-[#fef08a]/60">
                <Shield className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div className="font-sketch text-slate-500 text-sm font-semibold">Staging Depots</div>
                <div className="font-sketch text-[#ca8a04] text-lg font-bold">
                  {depots?.length || 6} Ready
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. REFINED MINIMALIST SUPPORTING SECTION (Matching Sketch Editorial Style) */}
      <section className="py-16 px-6 lg:px-12 bg-white border-t border-slate-200/80">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="font-sketch text-sm uppercase tracking-wider text-[#0284c7] font-bold">
              Engineering Architecture
            </span>
            <h2 className="font-sketch text-3xl sm:text-4xl font-bold text-slate-900">
              How Terranex Operates in the Garhwal Himalayas
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Transforming raw weather telemetry and terrain digital elevation models into explainable geotechnical risk and autonomous rescue routes.
            </p>
          </div>

          {/* 3 Clean Editorial Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Box 1 */}
            <div className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-6 space-y-4 hover:border-slate-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#0284c7] font-sketch font-bold text-lg shadow-sm">
                1
              </div>
              <div className="space-y-1.5">
                <h3 className="font-sketch text-xl font-bold text-slate-900">
                  Caine (1980) Physics Threshold
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Calculates precipitation threshold: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[11px] text-slate-800">I_c = 14.82 × D^(-0.39)</code>.
                  Every road segment compares live precipitation against critical initiation levels.
                </p>
              </div>
              <button
                onClick={() => onNavigate("intelligence")}
                className="text-xs font-sketch font-bold text-[#0284c7] hover:text-[#0369a1] flex items-center gap-1 cursor-pointer"
              >
                <span>Inspect in Intelligence Lab</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Box 2 */}
            <div className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-6 space-y-4 hover:border-slate-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#059669] font-sketch font-bold text-lg shadow-sm">
                2
              </div>
              <div className="space-y-1.5">
                <h3 className="font-sketch text-xl font-bold text-slate-900">
                  Supervised Random Forest ML
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Trained on steep Himalayan DEM elevation gradients and monsoonal historical landslides.
                  Verified accuracy of <b>91.37%</b> with ROC-AUC <b>0.973</b>.
                </p>
              </div>
              <button
                onClick={() => onNavigate("command")}
                className="text-xs font-sketch font-bold text-[#059669] hover:text-[#047857] flex items-center gap-1 cursor-pointer"
              >
                <span>View On Map Deck</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Box 3 */}
            <div className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-6 space-y-4 hover:border-slate-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#ca8a04] font-sketch font-bold text-lg shadow-sm">
                3
              </div>
              <div className="space-y-1.5">
                <h3 className="font-sketch text-xl font-bold text-slate-900">
                  3-Way Multimodal Evacuation
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  When roads sever, the system automatically checks (A) Surface Detour, (B) PWD Heavy Excavator Clearance ETA, and (C) Helicopter Airlift Escalation.
                </p>
              </div>
              <button
                onClick={() => onNavigate("dispatch")}
                className="text-xs font-sketch font-bold text-[#ca8a04] hover:text-[#a16207] flex items-center gap-1 cursor-pointer"
              >
                <span>Open Dispatch Hub</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MINIMAL CLEAN FOOTER */}
      <footer className="py-8 px-6 text-center text-xs text-slate-500 font-sketch border-t border-slate-200">
        <p>TERRANEX — ADAPTIVE LANDSLIDE INTELLIGENCE &amp; EVACUATION DECK</p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Rudraprayag District • Garhwal Himalayas • Innotech 2026
        </p>
      </footer>
    </div>
  );
}
