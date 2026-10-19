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

export function Navbar({ activePage, setActivePage, mode, setMode, isDark, setIsDark }) {
  const navItems = [
    { id: "overview", label: "Live Telemetry", icon: null, isTelemetry: true },
    { id: "command", label: "Command Deck", icon: Layers },
    { id: "simulator", label: "Radar", icon: Radio },
    { id: "intelligence", label: "Lab", icon: Settings },
    { id: "dispatch", label: "Dispatch & Triage", icon: Truck },
  ];

  return (
    <header className="sticky top-2 z-50 px-4 sm:px-6 w-full max-w-7xl mx-auto">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-300 shadow-[0_4px_20px_rgba(0,0,0,0.06)] px-4 py-2.5 flex items-center justify-between transition-all">
        {/* Brand Left Lockup */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActivePage("overview")}
            className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer"
          >
            {/* TX Badge */}
            <div className="w-8 h-8 rounded-lg bg-[#0f172a] text-white flex items-center justify-center font-extrabold text-xs tracking-tight shadow-sm">
              TX
            </div>
            {/* Title */}
            <span className="font-extrabold text-sm tracking-wider text-[#0f172a] font-sans">
              TERRANEX
            </span>
            {/* Version Pill */}
            <span className="text-[11px] font-mono text-[#0284c7] bg-[#f0f9ff] border border-[#bae6fd] px-2 py-0.5 rounded-full font-semibold">
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
                    ? "text-[#0f172a] font-bold"
                    : "text-slate-600 hover:text-[#0f172a]"
                }`}
              >
                {item.isTelemetry && (
                  <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse inline-block mr-0.5" />
                )}
                {Icon && <Icon className="w-3.5 h-3.5 text-slate-500" />}
                <span>{item.label}</span>

                {/* Hand-drawn Green Underline for Active Item */}
                {isActive && (
                  <span className="absolute -bottom-1 left-0 right-0 h-[2.5px] bg-[#10b981] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Side: Live Mode Pill & Theme Button */}
        <div className="flex items-center gap-3">
          {/* Mode Pill Toggle */}
          <button
            onClick={() => setMode(mode === "live" ? "simulation" : "live")}
            className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
              mode === "live"
                ? "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0] shadow-sm hover:bg-[#d1fae5]"
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

          {/* Theme / Sun Button */}
          <button
            onClick={() => setIsDark && setIsDark(!isDark)}
            className="w-8 h-8 rounded-full border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer"
            title="Toggle View Mode"
          >
            <Sun className="w-4 h-4 text-slate-700" />
          </button>

          {/* Mobile Select Menu */}
          <div className="lg:hidden">
            <select
              value={activePage}
              onChange={(e) => setActivePage(e.target.value)}
              className="bg-slate-100 text-xs text-slate-800 border border-slate-300 rounded-lg px-2 py-1 focus:outline-none"
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
