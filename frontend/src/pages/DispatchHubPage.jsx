import React, { useState } from "react";
import {
  Truck,
  ShieldCheck,
  AlertTriangle,
  Plane,
  Clock,
  ArrowRight,
  Package,
  Wrench,
  Users,
  Compass,
  CheckCircle2,
  AlertOctagon,
  Activity,
} from "lucide-react";

// Hero illustration
const DISPATCH_SKETCH = "C:/Users/Smart-tech/.gemini/antigravity-ide/brain/307ccffe-2b56-4bd6-960b-74a92e6f6c94/sketch_dispatch_banner_1792444401176.jpg";

// ── Small helpers ─────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, colorClass = "bg-slate-50 border-slate-200 text-slate-700" }) {
  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-0.5 ${colorClass}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 opacity-60" />
        <span className="text-[10px] font-mono uppercase tracking-wide opacity-70">{label}</span>
      </div>
      <div className="text-2xl font-sketch font-bold">{value}</div>
      {sub && <div className="text-[10px] opacity-55 font-mono">{sub}</div>}
    </div>
  );
}

function OptionBadge({ letter, colorClass, title, body }) {
  return (
    <div className={`flex gap-3 p-3 rounded-xl border ${colorClass}`}>
      <div className="w-6 h-6 shrink-0 rounded-lg flex items-center justify-center text-[10px] font-mono font-black bg-white/70 border border-current">
        {letter}
      </div>
      <div>
        <span className="font-semibold text-xs text-slate-800">{title} </span>
        <span className="text-xs text-slate-500">{body}</span>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function DispatchHubPage({ dispatchPlan, depots, onNavigate, mode, setMode }) {
  const [expandedId, setExpandedId] = useState(null);

  const summary = dispatchPlan?.summary || {
    total_cut_off_settlements: 0,
    total_isolated_population: 0,
    total_critical_patients: 0,
    total_ambulances_needed: 0,
    total_rescue_teams_needed: 0,
    total_excavators_needed: 0,
    total_relief_kits_needed: 0,
    aerial_evacuations_count: 0,
  };
  const dispatches = dispatchPlan?.dispatches || [];

  return (
    <div className="sk-page min-h-screen p-5 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── HEADER ──────────────────────────────────────────────── */}
        <div className="sk-card overflow-hidden">
          <div className="flex flex-col md:flex-row gap-4 p-6">
            <div className="flex-1 space-y-3">
              <div className="sk-section-label">
                <Truck className="w-3.5 h-3.5 text-purple-500" />
                Dispatch Hub · Multi-Depot Emergency Coordination
              </div>
              <h1 className="font-sketch text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
                Emergency Dispatch
              </h1>
              <p className="text-sm text-slate-500 max-w-xl">
                Real-time allocation across 6 regional staging bases.
                3-way access mitigation: alternate detours, PWD excavator clearance,
                and automatic helicopter airlift escalation.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => onNavigate("command")}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-700 transition-all"
                >
                  <Compass className="w-3.5 h-3.5" /> Open Live Map
                </button>
                <button
                  onClick={() => onNavigate("simulator")}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                >
                  <Activity className="w-3.5 h-3.5" /> Run Scenario
                </button>
              </div>
            </div>
            <div className="hidden md:block w-64 shrink-0">
              <img
                src={DISPATCH_SKETCH}
                alt="Dispatch sketch"
                className="w-full h-40 object-contain object-center opacity-80 mix-blend-multiply"
              />
            </div>
          </div>
        </div>

        {/* ── KPI STRIP ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard icon={AlertOctagon} label="Cut-Off Villages" value={summary.total_cut_off_settlements}
            sub="Zero road access"
            colorClass="bg-red-50 border-red-200 text-red-700" />
          <KpiCard icon={Users} label="Isolated Pop." value={summary.total_isolated_population.toLocaleString()}
            sub="Residents trapped"
            colorClass="bg-amber-50 border-amber-200 text-amber-700" />
          <KpiCard icon={Activity} label="Critical Patients" value={summary.total_critical_patients}
            sub="1.5% acute rate"
            colorClass="bg-sky-50 border-sky-200 text-sky-700" />
          <KpiCard icon={Truck} label="Ambulances" value={summary.total_ambulances_needed}
            sub="4 pts / unit"
            colorClass="bg-green-50 border-green-200 text-green-700" />
          <KpiCard icon={ShieldCheck} label="SDRF Rescue" value={summary.total_rescue_teams_needed}
            sub="1 team / 800 pop"
            colorClass="bg-slate-50 border-slate-200 text-slate-700" />
          <KpiCard icon={Plane} label="Airlifts" value={summary.aerial_evacuations_count}
            sub="Heli missions"
            colorClass="bg-purple-50 border-purple-200 text-purple-700" />
        </div>

        {/* ── SETTLEMENT TRIAGE CARDS ─────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-sketch text-xl font-bold text-slate-900 flex items-center gap-2">
              Cut-Off Settlements
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                {dispatches.length} evaluated
              </span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">Ranked by population priority</span>
          </div>

          {dispatches.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {dispatches.map((settlement) => {
                const needs = settlement.calculated_needs;
                const evac = settlement.patient_evacuation;
                const mit = settlement.mitigation_evaluation;
                const isAerial = evac.status === "aerial_evacuation_needed";
                const isExpanded = expandedId === settlement.settlement_id;

                return (
                  <div key={settlement.settlement_id} className="sk-card p-5 space-y-4">
                    {/* Top bar */}
                    <div
                      className="flex items-start justify-between cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : settlement.settlement_id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 font-mono font-black text-slate-700 text-sm flex items-center justify-center">
                          #{settlement.triage_priority}
                        </div>
                        <div>
                          <div className="font-sketch text-base font-bold text-slate-900">
                            {settlement.settlement_name}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">
                            {settlement.population.toLocaleString()} isolated residents
                          </div>
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border
                        ${isAerial
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-green-50 text-green-700 border-green-200"}`}>
                        {isAerial ? "HELI AIRLIFT" : "SURFACE VIABLE"}
                      </span>
                    </div>

                    {/* Needs grid */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {[
                        { label: "Patients", value: needs.critical_patients, color: "text-sky-600" },
                        { label: "Ambulances", value: needs.ambulances_needed, color: "text-slate-800" },
                        { label: "Rescue", value: needs.rescue_teams_needed, color: "text-blue-600" },
                        { label: "Excavators", value: needs.excavator_needed, color: "text-amber-600" },
                        { label: "Relief Kits", value: needs.relief_kits_needed, color: "text-green-600" },
                      ].map((item) => (
                        <div key={item.label} className="bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                          <div className="text-[9px] text-slate-400 font-mono uppercase">{item.label}</div>
                          <div className={`font-mono font-black text-sm mt-0.5 ${item.color}`}>{item.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="space-y-3 pt-2 border-t border-slate-100">
                        {/* Evacuation */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="font-mono text-[10px] text-slate-400 uppercase">Evacuation Protocol</span>
                            <span className="font-bold text-slate-700">{evac.transport_mode}</span>
                          </div>
                          <div className="font-semibold text-slate-800 mb-1">→ {evac.primary_hospital}</div>
                          {isAerial ? (
                            <div className="text-slate-500 leading-relaxed">
                              {evac.reason}
                              <div className="mt-1 font-mono text-[10px] text-purple-600">Helipad: {evac.staging_helipad}</div>
                            </div>
                          ) : (
                            <div className="font-mono text-green-600">
                              {evac.evacuation_route?.join(" → ")} · {evac.distance_km}km · {evac.eta_minutes}min
                            </div>
                          )}
                        </div>

                        {/* 3-Way mitigation */}
                        <div className="space-y-2">
                          <div className="sk-section-label text-[10px]">3-Way Access Mitigation</div>
                          <OptionBadge letter="A"
                            colorClass="bg-sky-50 border-sky-200 text-sky-700"
                            title="Alternate Detour:"
                            body={mit.option_a_alternate_route.available
                              ? `${mit.option_a_alternate_route.description} (${mit.option_a_alternate_route.eta_minutes}m)`
                              : "Blocked — all surface roads impassable."} />
                          <OptionBadge letter="B"
                            colorClass="bg-amber-50 border-amber-200 text-amber-700"
                            title="Excavator Clearance:"
                            body={`${mit.option_b_excavator_clearance.description} (ETA: ${mit.option_b_excavator_clearance.total_clearance_eta_hours}h)`} />
                          <OptionBadge letter="C"
                            colorClass="bg-purple-50 border-purple-200 text-purple-700"
                            title="Aerial/Trail Transit:"
                            body={mit.option_c_foot_or_aerial.description} />
                        </div>

                        {/* Assigned resources */}
                        {settlement.assigned_resources?.length > 0 && (
                          <div className="space-y-1.5 pt-2 border-t border-slate-100">
                            <div className="sk-section-label text-[10px]">
                              Dispatched Resources ({settlement.assigned_resources.length} units)
                            </div>
                            {settlement.assigned_resources.map((unit, idx) => (
                              <div key={idx}
                                className="flex justify-between items-center px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                                <div>
                                  <span className="font-bold text-slate-800 font-mono">{unit.quantity}× {unit.resource_type}</span>
                                  <div className="text-[10px] text-slate-400">{unit.depot_name}</div>
                                </div>
                                <div className="text-right font-mono">
                                  <div className="text-green-600 font-semibold">ETA {unit.eta_minutes}m</div>
                                  <div className="text-[10px] text-slate-400">{unit.dispatch_mode}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Expand toggle */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : settlement.settlement_id)}
                      className="w-full text-center text-xs text-slate-400 hover:text-slate-600 font-mono py-1 transition-colors"
                    >
                      {isExpanded ? "▲ Collapse" : "▼ Show full triage detail"}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="sk-card p-16 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" strokeWidth={1.4} />
              <h3 className="font-sketch text-2xl font-bold text-slate-900">All Corridors Operational</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Zero Himalayan villages are isolated under current conditions.
                Switch to the Crisis Simulator to stress-test extreme scenarios.
              </p>
              <button
                onClick={() => onNavigate("simulator")}
                className="px-5 py-2.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-all"
              >
                Test 130mm Extreme Cloudburst Scenario →
              </button>
            </div>
          )}
        </div>

        {/* ── DEPOT INVENTORY ─────────────────────────────────────── */}
        <div className="space-y-4">
          <h2 className="font-sketch text-xl font-bold text-slate-900 flex items-center gap-2">
            Regional Staging Depots
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">6 facilities</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {depots.map((depot) => {
              const isMachinery = depot.type === "pwd_bro_machinery_depot";
              const isSdrf = depot.type === "sdrf_ndrf_base";
              const dotClass = isMachinery ? "bg-amber-400" : isSdrf ? "bg-blue-400" : "bg-green-400";
              const tagClass = isMachinery
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : isSdrf
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-sky-50 text-sky-700 border-sky-200";

              return (
                <div key={depot.id} className="sk-card p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-sketch font-bold text-slate-900 text-base">{depot.name}</div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border inline-block mt-1 ${tagClass}`}>
                        {depot.type.replace(/_/g, " ").toUpperCase()}
                      </span>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${dotClass}`} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { emoji: "🚑", label: "Ambulances", value: depot.resources.ambulance },
                      { emoji: "🛡", label: "Rescue", value: depot.resources.rescue_team },
                      { emoji: "⚙️", label: "Excavators", value: depot.resources.excavator },
                      { emoji: "✚", label: "Medical", value: depot.resources.medical_team },
                    ].map((item) => (
                      <div key={item.label} className="bg-slate-50 rounded-xl border border-slate-100 px-3 py-2">
                        <div className="text-[10px] text-slate-400 font-mono">{item.emoji} {item.label}</div>
                        <div className="font-mono font-black text-slate-800 text-base mt-0.5">{item.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>{depot.lat.toFixed(3)}°N, {depot.lon.toFixed(3)}°E</span>
                    <span className="text-green-500 font-semibold">● READY</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
