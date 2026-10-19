import React, { useState } from "react";
import {
  Truck,
  ShieldCheck,
  AlertTriangle,
  Plane,
  Cross,
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

export function DispatchHubPage({ dispatchPlan, depots, onNavigate, mode, setMode }) {
  const [selectedVillageId, setSelectedVillageId] = useState(null);

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
    <div className="min-h-screen bg-[#050811] text-slate-100 p-6 lg:p-10 space-y-10 max-w-7xl mx-auto">
      {/* 1. HEADER (Reference B Caliber) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.08] pb-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono text-xs">
            <Truck className="w-3.5 h-3.5" />
            <span>INCIDENT COMMAND • MULTI-DEPOT TRIAGE</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Emergency Dispatch &amp; Evacuation Hub.
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl">
            Real-time allocation across 6 regional staging bases. Dynamic 3-way access mitigation:
            alternate surface detours, PWD excavator clearance turnaround, and automatic helicopter airlift escalation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate("command")}
            className="px-4 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>Open Geospatial Map</span>
          </button>
        </div>
      </div>

      {/* 2. EXECUTIVE TRIAGE KPI CARDS (Reference B Structured Hierarchy) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1 */}
        <div className="glass-panel p-4 rounded-xl space-y-1 border-white/10">
          <span className="text-[10px] uppercase font-mono text-slate-400 flex items-center gap-1">
            <AlertOctagon className="w-3 h-3 text-red-400" />
            Cut-Off Villages
          </span>
          <div className="text-2xl font-black font-mono text-red-400">
            {summary.total_cut_off_settlements}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Zero road connectivity</span>
        </div>

        {/* Card 2 */}
        <div className="glass-panel p-4 rounded-xl space-y-1 border-white/10">
          <span className="text-[10px] uppercase font-mono text-slate-400 flex items-center gap-1">
            <Users className="w-3 h-3 text-amber-400" />
            Isolated Population
          </span>
          <div className="text-2xl font-black font-mono text-amber-300">
            {summary.total_isolated_population.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Residents trapped</span>
        </div>

        {/* Card 3 */}
        <div className="glass-panel p-4 rounded-xl space-y-1 border-white/10">
          <span className="text-[10px] uppercase font-mono text-slate-400 flex items-center gap-1">
            <Activity className="w-3 h-3 text-cyan-400" />
            Critical Patients
          </span>
          <div className="text-2xl font-black font-mono text-cyan-300">
            {summary.total_critical_patients}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">1.5% acute triage rate</span>
        </div>

        {/* Card 4 */}
        <div className="glass-panel p-4 rounded-xl space-y-1 border-white/10">
          <span className="text-[10px] uppercase font-mono text-slate-400 flex items-center gap-1">
            <Truck className="w-3 h-3 text-emerald-400" />
            Ambulances
          </span>
          <div className="text-2xl font-black font-mono text-white">
            {summary.total_ambulances_needed}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Turnaround 4 pts/unit</span>
        </div>

        {/* Card 5 */}
        <div className="glass-panel p-4 rounded-xl space-y-1 border-white/10">
          <span className="text-[10px] uppercase font-mono text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-blue-400" />
            SDRF Rescue
          </span>
          <div className="text-2xl font-black font-mono text-white">
            {summary.total_rescue_teams_needed}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">1 team per 800 pop</span>
        </div>

        {/* Card 6 */}
        <div className="glass-panel p-4 rounded-xl space-y-1 border-white/10">
          <span className="text-[10px] uppercase font-mono text-slate-400 flex items-center gap-1">
            <Plane className="w-3 h-3 text-purple-400" />
            Aerial Airlifts
          </span>
          <div className="text-2xl font-black font-mono text-purple-400">
            {summary.aerial_evacuations_count}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Helicopter missions</span>
        </div>
      </div>

      {/* 3. ISOLATED SETTLEMENT TRIAGE CARDS */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Cut-Off Settlements &amp; Triage Orders</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
              {dispatches.length} Settlements Evaluated
            </span>
          </h2>
          <span className="text-xs font-mono text-slate-400">
            Ranked by Population Priority &amp; Vulnerability
          </span>
        </div>

        {dispatches.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dispatches.map((settlement) => {
              const needs = settlement.calculated_needs;
              const evac = settlement.patient_evacuation;
              const mit = settlement.mitigation_evaluation;

              return (
                <div
                  key={settlement.settlement_id}
                  className="glass-panel p-6 rounded-2xl space-y-6 border-white/10 hover:border-white/20 transition-all"
                >
                  {/* Settlement Top Bar */}
                  <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 font-mono font-bold text-sm flex items-center justify-center">
                        #{settlement.triage_priority}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">
                          {settlement.settlement_name}
                        </h3>
                        <div className="text-xs text-slate-400 font-mono">
                          Isolated Residents: <b className="text-amber-300">{settlement.population}</b>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold font-mono ${
                        evac.status === "aerial_evacuation_needed"
                          ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                          : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      }`}
                    >
                      {evac.status === "aerial_evacuation_needed" ? "HELI AIRLIFT REQUIRED" : "SURFACE VIABLE"}
                    </div>
                  </div>

                  {/* Calculated Needs Breakdown */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      Calculated Emergency Triage Needs
                    </span>
                    <div className="grid grid-cols-3 gap-2 text-xs font-mono bg-slate-900/80 p-3 rounded-xl border border-white/5">
                      <div>
                        <span className="text-slate-400 text-[10px]">Patients</span>
                        <div className="text-base font-bold text-cyan-300">{needs.critical_patients}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Ambulances</span>
                        <div className="text-base font-bold text-white">{needs.ambulances_needed}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Rescue Teams</span>
                        <div className="text-base font-bold text-blue-300">{needs.rescue_teams_needed}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Excavators</span>
                        <div className="text-base font-bold text-amber-300">{needs.excavator_needed}</div>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 text-[10px]">Relief Kits</span>
                        <div className="text-base font-bold text-emerald-300">{needs.relief_kits_needed} Packs</div>
                      </div>
                    </div>
                  </div>

                  {/* Patient Evacuation Protocol */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-white/[0.08] space-y-2 text-xs">
                    <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-wider">
                      <span className="text-slate-400">Patient Evacuation Corridor</span>
                      <span className="text-purple-300 font-bold">{evac.transport_mode}</span>
                    </div>
                    <div className="text-sm font-semibold text-white">
                      Destination: {evac.primary_hospital}
                    </div>

                    {evac.status === "surface_evacuation_viable" ? (
                      <div className="text-xs text-emerald-400 font-mono">
                        Viable Route: {evac.evacuation_route.join(" → ")} ({evac.distance_km} km • ETA: {evac.eta_minutes} min)
                      </div>
                    ) : (
                      <div className="text-xs text-purple-300/90 leading-relaxed font-sans">
                        {evac.reason}
                        <div className="mt-1 font-mono text-[11px] text-white">
                          Designated Staging Helipad: <b className="text-purple-300">{evac.staging_helipad}</b>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3-Way Mitigation Evaluation */}
                  <div className="space-y-2 text-xs">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      3-Way Access Mitigation Analysis
                    </span>

                    <div className="space-y-1.5 font-sans">
                      {/* Option A */}
                      <div className="p-2.5 rounded-lg bg-slate-950/70 border border-white/[0.06] flex items-start gap-2 text-xs">
                        <span className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-400 text-[10px] font-bold font-mono flex items-center justify-center shrink-0">
                          A
                        </span>
                        <div>
                          <b className="text-slate-200">Alternate Detour: </b>
                          <span className="text-slate-400">
                            {mit.option_a_alternate_route.available
                              ? `${mit.option_a_alternate_route.description} (${mit.option_a_alternate_route.eta_minutes}m)`
                              : "Blocked. All contiguous surface roads impassable."}
                          </span>
                        </div>
                      </div>

                      {/* Option B */}
                      <div className="p-2.5 rounded-lg bg-slate-950/70 border border-white/[0.06] flex items-start gap-2 text-xs">
                        <span className="w-5 h-5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold font-mono flex items-center justify-center shrink-0">
                          B
                        </span>
                        <div>
                          <b className="text-slate-200">Excavator Clearance: </b>
                          <span className="text-slate-400">
                            {mit.option_b_excavator_clearance.description} (Clearance ETA:{" "}
                            {mit.option_b_excavator_clearance.total_clearance_eta_hours}h)
                          </span>
                        </div>
                      </div>

                      {/* Option C */}
                      <div className="p-2.5 rounded-lg bg-slate-950/70 border border-white/[0.06] flex items-start gap-2 text-xs">
                        <span className="w-5 h-5 rounded bg-purple-500/20 text-purple-400 text-[10px] font-bold font-mono flex items-center justify-center shrink-0">
                          C
                        </span>
                        <div>
                          <b className="text-slate-200">Aerial / Trail Transit: </b>
                          <span className="text-slate-400">
                            {mit.option_c_foot_or_aerial.description}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Units List */}
                  {settlement.assigned_resources?.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-white/[0.08]">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        Dispatched Resources ({settlement.assigned_resources.length} Units)
                      </span>
                      <div className="space-y-1.5">
                        {settlement.assigned_resources.map((unit, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-slate-900 border border-white/5 flex justify-between items-center text-xs"
                          >
                            <div>
                              <div className="font-bold text-white font-mono uppercase">
                                {unit.quantity}x {unit.resource_type}
                              </div>
                              <div className="text-[10px] text-slate-400">{unit.depot_name}</div>
                            </div>
                            <div className="text-right font-mono">
                              <span className="text-cyan-400 font-semibold">ETA: {unit.eta_minutes}m</span>
                              <div className="text-[10px] text-slate-400">{unit.dispatch_mode}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel p-16 rounded-2xl text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-xl font-bold text-white">All Surface Corridors Operational</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Under current monsoonal precipitation conditions, zero Himalayan villages are isolated.
              To stress-test catastrophic events, switch to the Crisis Simulator.
            </p>
            <button
              onClick={() => onNavigate("simulator")}
              className="px-6 py-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all hover:bg-amber-500/30 cursor-pointer"
            >
              Test 130mm Extreme Cloudburst Scenario
            </button>
          </div>
        )}
      </div>

      {/* 4. REGIONAL STAGING DEPOTS INVENTORY */}
      <div className="space-y-4 pt-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Regional Staging Depots &amp; Machinery Stock</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
              6 Staging Facilities
            </span>
          </h2>
          <span className="text-xs font-mono text-slate-400">
            SDRF, NDRF, PWD/BRO Machinery
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {depots.map((depot) => {
            const isMachinery = depot.type === "pwd_bro_machinery_depot";
            const isSdrf = depot.type === "sdrf_ndrf_base";

            return (
              <div
                key={depot.id}
                className="glass-panel p-5 rounded-2xl space-y-4 border-white/10 hover:border-white/20 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-sm">{depot.name}</h3>
                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                      {depot.type.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isMachinery ? "bg-amber-400" : isSdrf ? "bg-blue-400" : "bg-cyan-400"
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-900/80 p-3 rounded-xl border border-white/5">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400">🚑 Ambulances</span>
                    <div className="font-bold text-white text-sm">{depot.resources.ambulance}</div>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400">🛡 Rescue Units</span>
                    <div className="font-bold text-white text-sm">{depot.resources.rescue_team}</div>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400">⚙ Excavators</span>
                    <div className="font-bold text-white text-sm">{depot.resources.excavator}</div>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400">✚ Medical Staff</span>
                    <div className="font-bold text-white text-sm">{depot.resources.medical_team}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-1">
                  <span>Coordinates: {depot.lat.toFixed(3)}°N, {depot.lon.toFixed(3)}°E</span>
                  <span className="text-emerald-400 font-semibold">Ready</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
