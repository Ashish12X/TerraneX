"""
Terranex - Dynamic Emergency Resource Allocation & Evacuation Engine
Calculates:
1. Cut-off settlements needs based on population (medical, rescue, excavator, supplies).
2. Road network travel-time dispatch matching nearest depots to cut-off locations.
3. Three-way mitigation evaluation for severed settlements:
   (a) Alternate detour route
   (b) Excavator road clearance ETA
   (c) Foot trek / Aerial airlift
4. Patient evacuation routing to nearest reachable hospital or aerial flagging.
"""

import json
import math
from pathlib import Path
from typing import Dict, List, Any, Optional
import networkx as nx

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DEPOTS_FILE = DATA_DIR / "depots.json"
NETWORK_V2_FILE = DATA_DIR / "network_v2.json"
NETWORK_V1_FILE = DATA_DIR / "network.json"

# Operational speeds in rugged Himalayan terrain (Assumptions)
SPEED_MOTORABLE_KMH = 35.0   # Mountain road transit speed
SPEED_TREK_KMH = 4.0          # Steep uphill foot trek speed
SPEED_EXCAVATOR_KMH = 15.0    # Heavy machinery transit speed
EXCAVATOR_CLEAR_MINUTES = 180.0  # 3 hours per landslide debris blockage (documented assumption)


def load_depots_data() -> Dict[str, Any]:
    """Loads configurable depots inventory."""
    if not DEPOTS_FILE.exists():
        raise FileNotFoundError(f"Depots file not found: {DEPOTS_FILE}")
    with open(DEPOTS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def calculate_settlement_needs(village: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes relief and emergency response needs for an isolated settlement.
    
    Documented Assumptions:
    - critical_patients: 1.5% of isolated population (vulnerable elderly, injured, acute sickness).
    - ambulances_needed: ceil(patients / 4) (4 casualties per ambulance turnaround cycle).
    - rescue_teams_needed: ceil(population / 800) (1 SDRF team per 800 isolated residents).
    - medical_teams_needed: ceil(patients / 10) (1 physician unit per 10 active patients).
    - relief_kits: 1 kit (food + drinking water + blanket) per resident.
    """
    pop = int(village.get("population", 0))
    if pop <= 0:
        pop = 500  # Default baseline if unrecorded

    patients = max(1, round(pop * 0.015))
    ambulances = max(1, math.ceil(patients / 4.0))
    rescue_teams = max(1, math.ceil(pop / 800.0))
    med_teams = max(1, math.ceil(patients / 10.0))
    relief_kits = pop

    return {
        "isolated_population": pop,
        "critical_patients": patients,
        "ambulances_needed": ambulances,
        "rescue_teams_needed": rescue_teams,
        "medical_teams_needed": med_teams,
        "excavator_needed": 1,
        "relief_kits_needed": relief_kits,
        "assumptions": {
            "patient_rate": "1.5% of population requires acute care",
            "ambulance_capacity": "4 patients per vehicle turnaround",
            "rescue_team_ratio": "1 multi-person team per 800 residents",
            "clearance_standard": "1 heavy excavator per cut-off access axis"
        }
    }


def build_usable_graph(net_data: Dict[str, Any], blocked_edge_ids: set) -> tuple[nx.Graph, nx.Graph]:
    """
    Returns (G_full, G_usable)
    Edges have weight = travel_time_minutes.
    """
    G_full = nx.Graph()
    G_usable = nx.Graph()

    for n in net_data.get("nodes", []):
        G_full.add_node(n["id"])
        G_usable.add_node(n["id"])

    for e in net_data.get("edges", []):
        u, v = e["from"], e["to"]
        dist = float(e.get("length_km", 1.0))
        is_trek = e.get("road_type") == "trek" or e.get("road_class") in ["path", "track"]
        speed = SPEED_TREK_KMH if is_trek else SPEED_MOTORABLE_KMH
        time_mins = (dist / speed) * 60.0

        edge_attrs = {
            "id": e["id"],
            "name": e.get("name", "Road"),
            "distance_km": dist,
            "road_type": "trek" if is_trek else "motorable",
            "weight": time_mins,
            "blocked": e["id"] in blocked_edge_ids
        }

        G_full.add_edge(u, v, **edge_attrs)
        if e["id"] not in blocked_edge_ids:
            G_usable.add_edge(u, v, **edge_attrs)

    return G_full, G_usable


def evaluate_mitigation_options(
    village_node: str,
    nearest_depot_node: str,
    G_full: nx.Graph,
    G_usable: nx.Graph,
    blocked_edge_ids: set
) -> Dict[str, Any]:
    """
    Evaluates three options when direct motorable access is severed:
    (a) Alternate route
    (b) Excavator clearance ETA
    (c) Aerial / Foot transit
    """
    # Option (a): Alternate route
    alt_route = None
    if (nearest_depot_node in G_usable and village_node in G_usable and 
            nx.has_path(G_usable, nearest_depot_node, village_node)):
        path = nx.shortest_path(G_usable, nearest_depot_node, village_node, weight="weight")
        dist = sum(G_usable[path[i]][path[i+1]]["distance_km"] for i in range(len(path)-1))
        t_mins = sum(G_usable[path[i]][path[i+1]]["weight"] for i in range(len(path)-1))
        alt_route = {
            "available": True,
            "route_nodes": path,
            "distance_km": round(dist, 2),
            "eta_minutes": round(t_mins, 1),
            "description": f"Detour available via {' -> '.join(path[:4])}..."
        }
    else:
        alt_route = {
            "available": False,
            "reason": "All contiguous road paths in network are severed by landslide blockages."
        }

    # Option (b): Excavator clearance ETA
    # Find blocked edges on the shortest full path
    excavator_plan = None
    if (nearest_depot_node in G_full and village_node in G_full and 
            nx.has_path(G_full, nearest_depot_node, village_node)):
        full_path = nx.shortest_path(G_full, nearest_depot_node, village_node, weight="distance_km")
        blocked_on_path = []
        first_blocked_node = None
        for i in range(len(full_path)-1):
            edata = G_full[full_path[i]][full_path[i+1]]
            if edata["id"] in blocked_edge_ids:
                if first_blocked_node is None:
                    first_blocked_node = full_path[i]
                blocked_on_path.append(edata)

        if blocked_on_path:
            # Transit to first blockage
            transit_target = first_blocked_node or nearest_depot_node
            transit_km = nx.shortest_path_length(G_full, nearest_depot_node, transit_target, weight="distance_km")
            transit_mins = (transit_km / SPEED_EXCAVATOR_KMH) * 60.0
            clear_mins = len(blocked_on_path) * EXCAVATOR_CLEAR_MINUTES
            total_eta = transit_mins + clear_mins

            excavator_plan = {
                "blocked_edges_on_axis": [e["id"] for e in blocked_on_path],
                "blocked_count": len(blocked_on_path),
                "transit_to_site_mins": round(transit_mins, 1),
                "debris_clearance_mins": round(clear_mins, 1),
                "total_clearance_eta_hours": round(total_eta / 60.0, 2),
                "description": f"Heavy excavator transit ({transit_mins:.0f}m) + clearing {len(blocked_on_path)} landslide points ({clear_mins:.0f}m, assumption: 3h/site)."
            }
        else:
            excavator_plan = {"blocked_count": 0, "total_clearance_eta_hours": 0.0, "description": "No blockages on path."}
    else:
        excavator_plan = {"blocked_count": 0, "description": "No topographical corridor exists."}

    # Option (c): Aerial / Foot transit
    # Find how close a motorable vehicle can get before foot trek begins
    foot_aerial_plan = None
    # Check reachable nodes from depot in G_usable
    reachable_from_depot = (nx.descendants(G_usable, nearest_depot_node) | {nearest_depot_node}) if nearest_depot_node in G_usable else {nearest_depot_node}

    # Find the reachable node closest to village in G_full
    closest_trailhead = None
    min_trek_dist = float("inf")
    for r_node in reachable_from_depot:
        if r_node in G_full and village_node in G_full and nx.has_path(G_full, r_node, village_node):
            d = nx.shortest_path_length(G_full, r_node, village_node, weight="distance_km")
            if d < min_trek_dist:
                min_trek_dist = d
                closest_trailhead = r_node

    if closest_trailhead and min_trek_dist < float("inf"):
        # Drive time to trailhead
        drive_mins = nx.shortest_path_length(G_usable, nearest_depot_node, closest_trailhead, weight="weight") if closest_trailhead != nearest_depot_node else 0.0
        hike_mins = (min_trek_dist / SPEED_TREK_KMH) * 60.0
        total_trip_mins = drive_mins + hike_mins

        needs_heli = min_trek_dist > 12.0 or hike_mins > 240.0  # >12km or >4 hours hike
        foot_aerial_plan = {
            "mode": "aerial_airlift_required" if needs_heli else "motor_to_trailhead_plus_foot_trek",
            "vehicle_staging_trailhead": closest_trailhead,
            "vehicle_drive_eta_mins": round(drive_mins, 1),
            "foot_trek_distance_km": round(min_trek_dist, 2),
            "foot_hike_eta_mins": round(hike_mins, 1),
            "total_eta_mins": round(total_trip_mins, 1),
            "aerial_urgency": "HIGH - Severe distance/terrain prevents timely foot ingress" if needs_heli else "STANDBY",
            "description": f"Drive to {closest_trailhead} ({drive_mins:.0f}m), then hike {min_trek_dist:.1f} km at 4 km/h ({hike_mins:.0f}m)." if not needs_heli else f"Foot trek exceeds 4 hours ({min_trek_dist:.1f} km). Helicopter airlift from Gauchar/Sahastradhara required."
        }
    else:
        foot_aerial_plan = {
            "mode": "aerial_airlift_required",
            "aerial_urgency": "CRITICAL - Completely cut off from all surface road heads",
            "total_eta_mins": 45.0,
            "description": "Helicopter evacuation required. Zero surface staging points reachable."
        }

    return {
        "option_a_alternate_route": alt_route,
        "option_b_excavator_clearance": excavator_plan,
        "option_c_foot_or_aerial": foot_aerial_plan
    }


def plan_patient_evacuation(
    village_node: str,
    hospitals: List[Dict[str, Any]],
    G_usable: nx.Graph
) -> Dict[str, Any]:
    """
    Finds the fastest reachable hospital from an isolated settlement.
    If none reachable, returns aerial evacuation recommendation.
    """
    reachable_hospitals = []

    for h in hospitals:
        h_node = h.get("connected_junction") or h["id"]
        if h_node in G_usable and village_node in G_usable and nx.has_path(G_usable, village_node, h_node):
            dist = nx.shortest_path_length(G_usable, village_node, h_node, weight="distance_km")
            t_mins = nx.shortest_path_length(G_usable, village_node, h_node, weight="weight")
            path = nx.shortest_path(G_usable, village_node, h_node, weight="weight")
            reachable_hospitals.append({
                "hospital_id": h["id"],
                "hospital_name": h.get("name"),
                "distance_km": round(dist, 2),
                "eta_minutes": round(t_mins, 1),
                "route": path
            })

    reachable_hospitals.sort(key=lambda x: x["eta_minutes"])

    if reachable_hospitals:
        best = reachable_hospitals[0]
        return {
            "status": "surface_evacuation_viable",
            "primary_hospital": best["hospital_name"],
            "hospital_id": best["hospital_id"],
            "distance_km": best["distance_km"],
            "eta_minutes": best["eta_minutes"],
            "evacuation_route": best["route"],
            "transport_mode": "Advanced Life Support Ambulance"
        }
    else:
        return {
            "status": "aerial_evacuation_needed",
            "primary_hospital": "District Hospital Rudraprayag / AIIMS Rishikesh",
            "transport_mode": "Helicopter Air Ambulance (SDRF/Indian Air Force)",
            "reason": "All outbound motorable roads severed by landslides. Road-based transport impossible.",
            "staging_helipad": f"Designated helipad near {village_node} clearing"
        }


def generate_dispatch_plan(
    rainfall_mm: float = 85.0,
    prior1: float = 0.0,
    prior2: float = 0.0,
    threshold: float = 0.50,
    mode: str = "simulation",
    hour: int = 0
) -> Dict[str, Any]:
    """
    Generates dynamic multi-resource dispatch plan for the entire district.
    Supports mode="simulation" (user-controlled) and mode="live" (Open-Meteo hour-by-hour forecast).
    """
    from models.risk_model import evaluate_segment_risk, load_network_data
    from services.live import get_hourly_forecast_series

    depots_raw = load_depots_data()
    net_info = load_network_data()
    net_data = net_info["data"]

    # In live mode, pull forecasted rainfall and antecedent soil moisture
    effective_rain = rainfall_mm
    effective_ante = 0.5 * prior1 + 0.25 * prior2
    forecast_label = f"Simulation ({rainfall_mm} mm)"

    if mode == "live":
        live_fc = get_hourly_forecast_series(hours=max(hour + 1, 24))
        effective_ante = live_fc.get("antecedent_72h_mm", 0.0)
        series = live_fc.get("series", [])
        if 0 <= hour < len(series):
            effective_rain = series[hour]["rainfall_mm"]
            forecast_label = f"Live Forecast @ {series[hour]['time']} (T+{hour}h)"
        else:
            effective_rain = series[0]["rainfall_mm"] if series else 0.0
            forecast_label = "Live Forecast @ T+0h"


    # Copy depot resources to track allocated vs available
    depot_pool = []
    for d in depots_raw.get("depots", []):
        depot_pool.append({
            "id": d["id"],
            "name": d["name"],
            "type": d["type"],
            "nearest_node": d["nearest_node"],
            "lat": d["lat"],
            "lon": d["lon"],
            "initial_resources": dict(d["resources"]),
            "available_resources": dict(d["resources"]),
            "assigned_resources": {k: 0 for k in d["resources"]}
        })

    # 1. Evaluate Risk on all edges
    ante_72h = effective_ante
    blocked_edges = set()
    edge_evaluations = {}

    for e in net_data.get("edges", []):
        res = evaluate_segment_risk(
            segment=e,
            hourly_rainfall_mm=effective_rain,
            antecedent_72h_mm=ante_72h,
            threshold=threshold,
            duration_hours=1.0
        )
        edge_evaluations[e["id"]] = res
        if res["blocked"]:
            blocked_edges.add(e["id"])

    # 2. Build usable vs full graphs
    G_full, G_usable = build_usable_graph(net_data, blocked_edges)

    # 3. Find hospitals and settlements
    hospitals = [n for n in net_data.get("nodes", []) if n.get("type") == "hospital"]
    villages = [n for n in net_data.get("nodes", []) if n.get("type") == "village"]

    # Identify cut-off settlements
    hospital_nodes = {h.get("connected_junction") or h["id"] for h in hospitals}
    cutoff_settlements = []

    for v in villages:
        v_node = v.get("connected_junction") or v["id"]
        # Check if connected to any hospital on G_usable
        connected = False
        if v_node in G_usable:
            for h_node in hospital_nodes:
                if h_node in G_usable and nx.has_path(G_usable, v_node, h_node):
                    connected = True
                    break
        if not connected:
            cutoff_settlements.append(v)

    # Sort cut-off settlements by population descending (triage priority)
    cutoff_settlements.sort(key=lambda x: int(x.get("population", 0)), reverse=True)

    # 4. Generate Plans for each cut-off settlement
    settlement_dispatches = []
    
    for v in cutoff_settlements:
        v_node = v.get("connected_junction") or v["id"]
        v_name = v.get("name", v["id"])
        needs = calculate_settlement_needs(v)

        # Patient Evacuation Plan
        evac_plan = plan_patient_evacuation(v_node, hospitals, G_usable)

        # Mitigation Options
        # Choose nearest major depot (e.g. H01 or V01) as reference
        ref_depot_node = "H01"
        mitigation = evaluate_mitigation_options(v_node, ref_depot_node, G_full, G_usable, blocked_edges)

        # Dynamic Resource Assignment from nearest capable depots
        assigned_units = []

        # (a) Rescue Team Assignment
        for d in depot_pool:
            if d["available_resources"].get("rescue_team", 0) > 0:
                needed = needs["rescue_teams_needed"] - sum(u["quantity"] for u in assigned_units if u["resource_type"] == "rescue_team")
                if needed <= 0:
                    break
                qty = min(needed, d["available_resources"]["rescue_team"])
                d["available_resources"]["rescue_team"] -= qty
                d["assigned_resources"]["rescue_team"] += qty
                assigned_units.append({
                    "resource_type": "rescue_team",
                    "quantity": qty,
                    "depot_id": d["id"],
                    "depot_name": d["name"],
                    "dispatch_mode": mitigation["option_c_foot_or_aerial"]["mode"],
                    "eta_minutes": mitigation["option_c_foot_or_aerial"]["total_eta_mins"],
                    "reason": f"Deployed {qty} SDRF/NDRF rescue unit(s) for search, medical triage, and emergency shelter."
                })

        # (b) Heavy Excavator Assignment (if road clearance needed)
        if mitigation["option_b_excavator_clearance"].get("blocked_count", 0) > 0:
            for d in depot_pool:
                if d["available_resources"].get("excavator", 0) > 0:
                    d["available_resources"]["excavator"] -= 1
                    d["assigned_resources"]["excavator"] += 1
                    assigned_units.append({
                        "resource_type": "excavator",
                        "quantity": 1,
                        "depot_id": d["id"],
                        "depot_name": d["name"],
                        "dispatch_mode": "heavy_machinery_transit",
                        "eta_minutes": round(mitigation["option_b_excavator_clearance"]["transit_to_site_mins"], 1),
                        "clearance_eta_hours": mitigation["option_b_excavator_clearance"]["total_clearance_eta_hours"],
                        "reason": f"Dispatched heavy clearing unit to breach points on access corridor: {mitigation['option_b_excavator_clearance']['blocked_edges_on_axis']}."
                    })
                    break

        # (c) Ambulance Assignment (if surface route open, or staging at trailhead)
        amb_needed = needs["ambulances_needed"]
        for d in depot_pool:
            if d["available_resources"].get("ambulance", 0) > 0:
                needed = amb_needed - sum(u["quantity"] for u in assigned_units if u["resource_type"] == "ambulance")
                if needed <= 0:
                    break
                qty = min(needed, d["available_resources"]["ambulance"])
                d["available_resources"]["ambulance"] -= qty
                d["assigned_resources"]["ambulance"] += qty
                
                is_surface = evac_plan["status"] == "surface_evacuation_viable"
                amb_mode = "direct_evacuation" if is_surface else "staging_at_closest_trailhead"
                amb_eta = evac_plan["eta_minutes"] if is_surface else mitigation["option_c_foot_or_aerial"]["vehicle_drive_eta_mins"]
                
                assigned_units.append({
                    "resource_type": "ambulance",
                    "quantity": qty,
                    "depot_id": d["id"],
                    "depot_name": d["name"],
                    "dispatch_mode": amb_mode,
                    "eta_minutes": amb_eta,
                    "reason": f"Assigned {qty} ambulance(s) for casualty evacuation. Mode: {amb_mode}."
                })

        settlement_dispatches.append({
            "settlement_id": v.get("id"),
            "settlement_name": v_name,
            "population": needs["isolated_population"],
            "triage_priority": len(settlement_dispatches) + 1,
            "calculated_needs": needs,
            "patient_evacuation": evac_plan,
            "mitigation_evaluation": mitigation,
            "assigned_resources": assigned_units
        })

    total_pop_isolated = sum(s["population"] for s in settlement_dispatches)

    return {
        "status": "success",
        "scenario": {
            "mode": mode,
            "hour": hour,
            "forecast_label": forecast_label,
            "effective_rainfall_mm": round(effective_rain, 2),
            "antecedent_72h_mm": round(ante_72h, 2),
            "threshold": threshold,
            "blocked_roads_count": len(blocked_edges),
            "blocked_edge_ids": list(blocked_edges)
        },
        "summary": {
            "total_cut_off_settlements": len(settlement_dispatches),
            "total_isolated_population": total_pop_isolated,
            "total_depots_active": len(depot_pool)
        },
        "depots_status": [
            {
                "id": d["id"],
                "name": d["name"],
                "type": d["type"],
                "available": d["available_resources"],
                "dispatched": d["assigned_resources"]
            }
            for d in depot_pool
        ],
        "dispatches": settlement_dispatches
    }
