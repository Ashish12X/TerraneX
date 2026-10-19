import React from "react";
import {
  Layers,
  Radio,
  Settings,
  Truck,
  Sun,
  Moon,
  Compass,
} from "lucide-react";

export function Navbar({ activePage, setActivePage, mode, setMode, isDark, setIsDark, systemStatus }) {
  const navItems = [
    { id: "overview",     label: "Live Telemetry",   icon: null,    isTelemetry: true },
    { id: "command",      label: "Command Deck",     icon: Layers   },
    { id: "simulator",    label: "Radar",            icon: Radio    },
    { id: "intelligence", label: "Lab",              icon: Settings },
    { id: "dispatch",     label: "Dispatch & Triage",icon: Truck    },
  ];

  /* ── Adaptive colour tokens based on dark mode ── */
  const navBg    = isDark ? "bg-[#111827]/95 border-white/[0.08]" : "bg-white/95 border-slate-300";
  const textBase = isDark ? "text-slate-100" : "text-[#0f172a]";
  const textMut  = isDark ? "text-slate-400" : "text-slate-600";
  const textHov  = isDark ? "hover:text-white" : "hover:text-[#0f172a]";
  const badgeBg  = isDark ? "bg-[#0f172a] text-white" : "bg-[#0f172a] text-white";
  const pillText = isDark ? "text-sky-300 bg-sky-950 border-sky-800" : "text-[#0284c7] bg-[#f0f9ff] border-[#bae6fd]";
  const toggleBg = isDark ? "border-white/10 text-slate-300 hover:bg-white/10" : "border-slate-200 text-slate-700 hover:bg-slate-100";
  const selectBg = isDark ? "bg-slate-800 text-slate-200 border-slate-700" : "bg-slate-100 text-slate-800 border-slate-300";

  return (
    <header className="sticky top-2 z-50 px-4 sm:px-6 w-full max-w-7xl mx-auto">
      <div className={`${navBg} backdrop-blur-md rounded-2xl border shadow-[0_4px_20px_rgba(0,0,0,0.08)] px-4 py-2.5 flex items-center justify-between transition-all duration-300`}>

        {/* Brand Left Lockup */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActivePage("overview")}
            className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer"
          >
            {/* TX Badge */}
            <div className={`w-8 h-8 rounded-lg ${badgeBg} flex items-center justify-center font-extrabold text-xs tracking-tight shadow-sm`}>
              TX
            </div>
            {/* Title */}
            <span className={`font-extrabold text-sm tracking-wider ${textBase} font-sans`}>
              TERRANEX
            </span>
            {/* Version Pill */}
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-semibold border ${pillText}`}>
              v0.2.0
            </span>
          </button>
        </div>

        {/* Center Nav Items */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`relative py-1 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isActive
                    ? `${textBase} font-bold`
                    : `${textMut} ${textHov}`
                }`}
              >
                {item.isTelemetry && (
                  <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse inline-block mr-0.5" />
                )}
                {Icon && <Icon className={`w-3.5 h-3.5 ${textMut}`} />}
                <span>{item.label}</span>

                {/* Active underline */}
                {isActive && (
                  <span className="absolute -bottom-1 left-0 right-0 h-[2.5px] bg-[#10b981] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-2.5">

          {/* Mode Pill Toggle */}
          <button
            onClick={() => setMode(mode === "live" ? "simulation" : "live")}
            className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
              mode === "live"
                ? isDark
                  ? "bg-emerald-950/60 text-emerald-300 border-emerald-700/50 hover:bg-emerald-950"
                  : "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0] shadow-sm hover:bg-[#d1fae5]"
                : isDark
                  ? "bg-amber-950/60 text-amber-300 border-amber-700/50 hover:bg-amber-950"
                  : "bg-[#fffbeb] text-[#b45309] border-[#fde68a] hover:bg-[#fef3c7]"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                mode === "live" ? "bg-[#10b981] animate-ping" : "bg-[#f59e0b]"
              }`}
            />
            <span>{mode === "live" ? "Live Mode" : "Simulation"}</span>
          </button>

          {/* Dark / Light Theme Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-200 cursor-pointer ${toggleBg}`}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark
              ? <Sun  className="w-4 h-4 text-amber-300" />
              : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Mobile Select Menu */}
          <div className="lg:hidden">
            <select
              value={activePage}
              onChange={(e) => setActivePage(e.target.value)}
              className={`text-xs border rounded-lg px-2 py-1 focus:outline-none ${selectBg}`}
            >
              <option value="overview">Live Telemetry</option>
              <option value="command">Command Deck</option>
              <option value="simulator">Radar</option>
              <option value="intelligence">Lab</option>
              <option value="dispatch">Dispatch & Triage</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
