"""
Terranex - Explainable Time-Based Landslide Risk Model
Combines:
1. Slope / Terrain Susceptibility
2. Hourly Rainfall Intensity vs Published Global Empirical Threshold (Caine 1980)
3. 72-Hour Antecedent Soil Saturation (decay-weighted)

[SCIENTIFIC CITATION & UNVERIFIED DISCLAIMER]
Intensity-Duration Threshold:
Caine, N. (1980). "The rainfall intensity - duration control of shallow landslides
and debris flows." Geografiska Annaler: Series A, Physical Geography, 62(1-2), 23-27.
Threshold formula: I_c = 14.82 * (D ** -0.39) mm/hr.
DISCLAIMER: Caine (1980) is an unverified global baseline for the Garhwal Himalayas.
Local Himalayan slopes typically require localized calibration with regional debris-flow
inventories (GSI/ISRO) once field data becomes available.
"""

import json
from pathlib import Path
from typing import Dict, List, Any, Optional

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
NETWORK_V2_FILE = DATA_DIR / "network_v2.json"
NETWORK_V1_FILE = DATA_DIR / "network.json"

DEFAULT_BLOCK_THRESHOLD = 0.50
CAINE_COEFF = 14.82
CAINE_EXP = -0.39


# ---------------------------------------------------------
# Backward Compatibility for existing endpoints (Routing, Cascade)
# ---------------------------------------------------------
BLOCK_THRESHOLD = DEFAULT_BLOCK_THRESHOLD

def rain_factor(rainfall_mm: float) -> float:
    """Legacy rainfall multiplier (0-1.5). Preserved for legacy routing."""
    return min(max(rainfall_mm, 0) / 100.0, 1.5)

def get_edge_risk(susceptibility: float, rainfall_mm: float) -> float:
    """Legacy edge risk (0-1). Preserved for routing."""
    return round(min(susceptibility * rain_factor(rainfall_mm), 1.0), 3)

def is_blocked(risk: float, threshold: float = DEFAULT_BLOCK_THRESHOLD) -> bool:
    return risk >= threshold


# ---------------------------------------------------------
# Explainable Time-Based Risk Model (v2)
# ---------------------------------------------------------
def get_caine_critical_intensity(duration_hours: float = 1.0) -> float:
    """
    Computes critical rainfall intensity (mm/hr) using Caine (1980).
    I_c = 14.82 * D^(-0.39)
    """
    d = max(0.25, float(duration_hours))
    return round(CAINE_COEFF * (d ** CAINE_EXP), 2)


def evaluate_segment_risk(
    segment: Dict[str, Any],
    hourly_rainfall_mm: float = 0.0,
    antecedent_72h_mm: float = 0.0,
    threshold: float = DEFAULT_BLOCK_THRESHOLD,
    duration_hours: float = 1.0
) -> Dict[str, Any]:
    """
    Evaluates blockage probability and returns transparent contribution breakdown.
    
    Weights allocation:
    - 40% Slope Gradient Factor
    - 40% Rainfall Intensity vs Caine 1980 Critical Threshold
    - 20% Antecedent Soil Saturation (72h prior)
    """
    # 1. Slope Component (0.0 to 1.0)
    # Check max_gradient_pct or mean_gradient_pct or fallback to susceptibility
    grad = segment.get("mean_gradient_pct") or segment.get("max_gradient_pct")
    if grad is not None:
        slope_pct = float(grad)
        # 50% gradient (26.5 deg) is high steepness baseline in Uttarakhand Himalayas
        slope_factor = min(1.0, max(0.05, slope_pct / 50.0))
    else:
        slope_factor = float(segment.get("susceptibility", 0.35))
        slope_pct = round(slope_factor * 50.0, 1)

    slope_contrib = 0.40 * slope_factor

    # 2. Rainfall Intensity vs Caine (1980) Threshold
    crit_intensity = get_caine_critical_intensity(duration_hours)
    intensity_ratio = hourly_rainfall_mm / crit_intensity if crit_intensity > 0 else 0.0
    rain_factor_val = min(1.0, max(0.0, intensity_ratio))
    rain_contrib = 0.40 * rain_factor_val

    # 3. Antecedent 72h Wet Saturation Component
    # 50 mm antecedent saturation threshold
    ante_factor = min(1.0, max(0.0, antecedent_72h_mm / 50.0))
    ante_contrib = 0.20 * ante_factor

    # Total Probability (0.0 to 1.0)
    total_prob = min(1.0, max(0.0, slope_contrib + rain_contrib + ante_contrib))
    total_prob = round(total_prob, 3)

    # Dominant Cause Identification
    contribs = [
        ("Slope Steepness", slope_contrib),
        ("Rainfall Intensity", rain_contrib),
        ("Antecedent Soil Saturation", ante_contrib)
    ]
    contribs.sort(key=lambda x: x[1], reverse=True)
    dominant_cause = contribs[0][0]

    if total_prob >= threshold:
        if intensity_ratio >= 1.0 and slope_factor >= 0.6:
            cause_detail = f"High slope ({slope_pct}%) combined with cloudburst exceeding Caine threshold ({hourly_rainfall_mm:.1f} mm/hr >= {crit_intensity:.1f} mm/hr)"
        elif intensity_ratio >= 1.0:
            cause_detail = f"Rainfall rate ({hourly_rainfall_mm:.1f} mm/hr) surpassed critical threshold ({crit_intensity:.1f} mm/hr)"
        elif ante_factor >= 0.6 and slope_factor >= 0.5:
            cause_detail = f"Steep slope ({slope_pct}%) saturated by prior wet days ({antecedent_72h_mm:.1f} mm antecedent load)"
        else:
            cause_detail = f"Cumulative terrain and precipitation factors reached critical probability {total_prob:.3f}"
    else:
        cause_detail = "Operating within safe operational capacity"

    return {
        "segment_id": segment.get("id"),
        "name": segment.get("name", "Unnamed Corridor"),
        "road_class": segment.get("road_class", "unknown"),
        "road_type": segment.get("road_type", "motorable"),
        "length_km": segment.get("length_km", 0.5),
        "from": segment.get("from"),
        "to": segment.get("to"),
        "probability": total_prob,
        "blocked": total_prob >= threshold,
        "threshold_used": threshold,
        "reasons": {
            "slope_gradient_pct": slope_pct,
            "slope_contribution": round(slope_contrib, 3),
            "hourly_rainfall_mm": round(hourly_rainfall_mm, 2),
            "caine_threshold_mm_hr": crit_intensity,
            "intensity_ratio": round(intensity_ratio, 3),
            "rainfall_contribution": round(rain_contrib, 3),
            "antecedent_72h_mm": round(antecedent_72h_mm, 2),
            "antecedent_contribution": round(ante_contrib, 3),
            "dominant_cause": dominant_cause,
            "explanation": cause_detail
        }
    }


def load_network_data() -> Dict[str, Any]:
    """Loads network_v2 if available, otherwise network.json (v1)."""
    target = NETWORK_V2_FILE if NETWORK_V2_FILE.exists() else NETWORK_V1_FILE
    with open(target, "r", encoding="utf-8") as f:
        data = json.load(f)
    return {
        "source_file": target.name,
        "is_v2": target.name == "network_v2.json",
        "data": data
    }


def compute_isolated_settlements(
    network_data: Dict[str, Any],
    blocked_edge_ids: set
) -> List[Dict[str, Any]]:
    """
    Calculates which settlements lose all paths to hospitals given blocked edges.
    """
    import networkx as nx
    
    G = nx.Graph()
    edges = network_data.get("edges", [])
    nodes = network_data.get("nodes", [])

    for e in edges:
        if e["id"] not in blocked_edge_ids:
            G.add_edge(e["from"], e["to"])

    hospital_node_ids = set()
    settlement_nodes = []

    for n in nodes:
        ntype = n.get("type")
        if ntype == "hospital":
            # For v2, hospital might be attached via connected_junction
            h_id = n.get("connected_junction") or n["id"]
            hospital_node_ids.add(h_id)
        elif ntype == "village":
            s_id = n.get("connected_junction") or n["id"]
            settlement_nodes.append((n, s_id))

    isolated = []
    for s_meta, s_graph_node in settlement_nodes:
        if s_graph_node not in G:
            isolated.append({
                "id": s_meta.get("id"),
                "name": s_meta.get("name"),
                "population": s_meta.get("population", 0),
                "reason": "Disconnected road junction"
            })
            continue

        # Check reachability to any hospital
        reachable = False
        for h_id in hospital_node_ids:
            if h_id in G and nx.has_path(G, s_graph_node, h_id):
                reachable = True
                break
        
        if not reachable:
            isolated.append({
                "id": s_meta.get("id"),
                "name": s_meta.get("name"),
                "population": s_meta.get("population", 0),
                "reason": "All evacuation routes to hospitals severed by blocked road segments"
            })

    return isolated