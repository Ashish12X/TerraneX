import React from "react";
import {
  Activity,
  Compass,
  Cpu,
  Truck,
  SlidersHorizontal,
  Layers,
  Radio,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

export function Navbar({ activePage, setActivePage, mode, setMode, systemStatus }) {
  const navItems = [
    { id: "overview", label: "Overview", icon: Compass, badge: null },
    { id: "command", label: "Command Deck", icon: Layers, badge: "Live Radar" },
    { id: "intelligence", label: "Intelligence Lab", icon: Cpu, badge: "91.4% ML" },
    { id: "dispatch", label: "Dispatch & Triage", icon: Truck, badge: null },
    { id: "simulator", label: "Crisis Simulator", icon: SlidersHorizontal, badge: null },
  ];

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-white/[0.08] bg-slate-950/85 backdrop-blur-xl px-4 lg:px-6 flex items-center justify-between transition-colors">
      {/* Brand Identity */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setActivePage("overview")}
          className="flex items-center gap-3 text-left group focus:outline-none"
        >
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-red-500/20 via-slate-900 to-cyan-500/10 border border-white/10 group-hover:border-white/20 transition-all shadow-inner">
            <span className="text-red-400 font-black text-sm tracking-tighter">TX</span>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-slate-950 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold tracking-wider text-white">TERRANEX</span>
              <span className="text-[10px] uppercase font-mono tracking-widest px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-300 border border-white/[0.08]">
                v0.2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium tracking-tight hidden sm:block">
              Rudraprayag Landslide Intelligence Deck
            </p>
          </div>
        </button>

        {/* Status Chip */}
        <div className="hidden xl:flex items-center gap-2 pl-4 border-l border-white/10 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px]">
            <Radio className="w-3 h-3 animate-spin" />
            LIVE TELEMETRY
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Rudraprayag District • NH-107
          </span>
        </div>
      </div>

      {/* Primary Navigation Links */}
      <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-white/[0.06]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all flex items-center gap-2 ${
                isActive
                  ? "bg-white/[0.09] text-white shadow-sm border border-white/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
              <span>{item.label}</span>
              {item.badge && (
                <span
                  className={`text-[9px] font-mono px-1 py-0.2 rounded border ${
                    isActive
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Right Controls: Mode Toggle & Action */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Operational Mode Toggle */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-white/[0.08]">
          <button
            onClick={() => setMode("live")}
            className={`px-2.5 sm:px-3 py-1 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              mode === "live"
                ? "bg-emerald-600/90 text-white shadow-sm shadow-emerald-950 font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Real-time Open-Meteo weather telemetry and 24h early warning"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
            <span className="hidden sm:inline">Live Mode</span>
            <span className="sm:hidden">Live</span>
          </button>
          <button
            onClick={() => setMode("simulation")}
            className={`px-2.5 sm:px-3 py-1 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              mode === "simulation"
                ? "bg-amber-600/90 text-white shadow-sm shadow-amber-950 font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Interactive cloudburst & geotechnical stress simulator"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />
            <span className="hidden sm:inline">Simulation</span>
            <span className="sm:hidden">Sim</span>
          </button>
        </div>

        {/* Mobile Page Select Menu */}
        <div className="md:hidden">
          <select
            value={activePage}
            onChange={(e) => setActivePage(e.target.value)}
            className="bg-slate-900 text-xs text-white border border-white/10 rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="overview">Overview</option>
            <option value="command">Command Deck</option>
            <option value="intelligence">Intelligence Lab</option>
            <option value="dispatch">Dispatch & Triage</option>
            <option value="simulator">Crisis Simulator</option>
          </select>
        </div>
      </div>
    </header>
  );
}
