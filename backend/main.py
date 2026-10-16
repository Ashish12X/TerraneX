from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from services.cascade import run_cascade_simulation, prioritize_resources
from services.routing import get_safe_route, get_network_state
from services.live import (
    get_live_rainfall,
    get_live_villages_rainfall,
    get_live_edge_rainfalls,
    get_hourly_forecast_series,
)
from models.risk_model import (
    evaluate_segment_risk,
    load_network_data,
    compute_isolated_settlements,
    DEFAULT_BLOCK_THRESHOLD,
    get_caine_critical_intensity,
)
from services.dispatch import generate_dispatch_plan

app = FastAPI(
    title="Terranex API",
    description="Adaptive Landslide Intelligence & Emergency Response System",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {
        "message": "Terranex API is running",
        "project": "Terranex",
        "study_area": "Rudraprayag, Uttarakhand",
        "status": "Backend + Cascade Simulation Ready"
    }

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/simulate/cascade")
def cascade(
    rainfall_mm: float = 80.0,
    per_village: bool = False,
    basis: str = "past_24h"
):
    """
    Run landslide cascade simulation for Rudraprayag
    """
    edge_rainfalls = get_live_edge_rainfalls(basis=basis) if per_village else None
    result = run_cascade_simulation(rainfall_mm=rainfall_mm, edge_rainfalls=edge_rainfalls)
    return result

@app.get("/prioritize/resources")
def resources(
    rainfall_mm: float = 80.0,
    per_village: bool = False,
    basis: str = "past_24h"
):
    """
    Limited emergency resources ko prioritize karta hai
    """
    edge_rainfalls = get_live_edge_rainfalls(basis=basis) if per_village else None
    result = prioritize_resources(rainfall_mm=rainfall_mm, edge_rainfalls=edge_rainfalls)
    return result

@app.get("/route/safe")
def safe_route(
    source: str,
    rainfall_mm: float = 80.0,
    target: str | None = None,
    per_village: bool = False,
    basis: str = "past_24h"
):
    """Source se hospital tak safe route (blocked roads avoid karke)"""
    try:
        edge_rainfalls = get_live_edge_rainfalls(basis=basis) if per_village else None
        return get_safe_route(source, rainfall_mm, target, edge_rainfalls=edge_rainfalls)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/live/rainfall")
def live_rainfall():
    """Rudraprayag ki live baarish (Open-Meteo single-point)"""
    try:
        return get_live_rainfall()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

@app.get("/live/villages")
def live_villages():
    """Har village ka live rainfall telemetry (Open-Meteo multi-location)"""
    try:
        return get_live_villages_rainfall()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

@app.get("/live/cascade")
def live_cascade(
    basis: str = "past_24h",
    per_village: bool = False
):
    """Live rainfall ko seedha cascade simulation mein daalta hai"""
    try:
        live = get_live_rainfall()
        edge_rainfalls = get_live_edge_rainfalls(basis=basis) if per_village else None
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    if basis == "next_24h":
        rainfall = live["next_24h_mm"]
    elif basis == "effective_72h":
        rainfall = live["effective_72h_mm"]
    else:
        rainfall = live["past_24h_mm"]

    return {
        "mode": "live",
        "basis": basis,
        "per_village": per_village,
        "live_data": live,
        "cascade": run_cascade_simulation(rainfall_mm=rainfall, edge_rainfalls=edge_rainfalls),
        "resources": prioritize_resources(rainfall_mm=rainfall, edge_rainfalls=edge_rainfalls),
    }

@app.get("/network")
def network(
    rainfall_mm: float = 80.0,
    per_village: bool = False,
    basis: str = "past_24h"
):
    """Map data: nodes, roads, blocked status"""
    edge_rainfalls = get_live_edge_rainfalls(basis=basis) if per_village else None
    return get_network_state(rainfall_mm=rainfall_mm, edge_rainfalls=edge_rainfalls)


@app.get("/risk/timeline")
def risk_timeline(
    hours: int = 24,
    threshold: float = DEFAULT_BLOCK_THRESHOLD
):
    """
    Hour-by-hour landslide risk timeline (T+0 to T+hours).
    Evaluates top risky segments and cut-off settlements for each hour.
    """
    forecast_data = get_hourly_forecast_series(hours=hours)
    ante_72h = forecast_data.get("antecedent_72h_mm", 0.0)
    series = forecast_data.get("series", [])

    net_info = load_network_data()
    edges = net_info["data"].get("edges", [])

    timeline = []
    for step in series:
        h_step = step["hour_step"]
        h_time = step["time"]
        rf_mm = step["rainfall_mm"]

        evaluated = []
        blocked_ids = set()
        for e in edges:
            res = evaluate_segment_risk(
                segment=e,
                hourly_rainfall_mm=rf_mm,
                antecedent_72h_mm=ante_72h,
                threshold=threshold,
                duration_hours=1.0
            )
            evaluated.append(res)
            if res["blocked"]:
                blocked_ids.add(res["segment_id"])

        evaluated.sort(key=lambda x: x["probability"], reverse=True)
        top_risky = evaluated[:5]

        isolated = compute_isolated_settlements(net_info["data"], blocked_ids)
        pop_isolated = sum(v.get("population", 0) for v in isolated)

        timeline.append({
            "hour": h_step,
            "time": h_time,
            "rainfall_mm": rf_mm,
            "blocked_count": len(blocked_ids),
            "blocked_segments": list(blocked_ids),
            "isolated_settlements_count": len(isolated),
            "isolated_population": pop_isolated,
            "isolated_settlements": [v["name"] for v in isolated],
            "edge_risks": {
                r["segment_id"]: {
                    "probability": r["probability"],
                    "blocked": r["blocked"],
                    "dominant_cause": r["reasons"]["dominant_cause"]
                }
                for r in evaluated
            },
            "top_risky_segments": [
                {
                    "segment_id": r["segment_id"],
                    "name": r["name"],
                    "probability": r["probability"],
                    "blocked": r["blocked"],
                    "dominant_cause": r["reasons"]["dominant_cause"],
                    "explanation": r["reasons"]["explanation"]
                }
                for r in top_risky
            ]
        })

    return {
        "status": "ok",
        "network_source": net_info["source_file"],
        "total_segments_evaluated": len(edges),
        "threshold": threshold,
        "caine_threshold_mm_hr": get_caine_critical_intensity(1.0),
        "antecedent_72h_mm": ante_72h,
        "timeline": timeline
    }


@app.get("/risk/segment/{segment_id}")
def risk_segment(
    segment_id: str,
    rainfall_mm: float = 0.0,
    prior1: float = 0.0,
    prior2: float = 0.0,
    threshold: float = DEFAULT_BLOCK_THRESHOLD
):
    """
    Detailed explainability breakdown for a specific road segment.
    """
    net_info = load_network_data()
    edges = net_info["data"].get("edges", [])

    target_seg = None
    for e in edges:
        if str(e.get("id")).lower() == segment_id.lower():
            target_seg = e
            break

    if not target_seg:
        raise HTTPException(
            status_code=404,
            detail=f"Segment '{segment_id}' not found in {net_info['source_file']}"
        )

    ante_72h = 0.5 * prior1 + 0.25 * prior2
    res = evaluate_segment_risk(
        segment=target_seg,
        hourly_rainfall_mm=rainfall_mm,
        antecedent_72h_mm=ante_72h,
        threshold=threshold,
        duration_hours=1.0
    )
    res["network_source"] = net_info["source_file"]
    return res


@app.get("/risk/simulation")
def risk_simulation(
    rainfall_mm: float = 80.0,
    prior1: float = 0.0,
    prior2: float = 0.0,
    threshold: float = DEFAULT_BLOCK_THRESHOLD
):
    """
    Explainable simulation evaluation across all road segments.
    """
    net_info = load_network_data()
    edges = net_info["data"].get("edges", [])
    ante_72h = 0.5 * prior1 + 0.25 * prior2

    evaluated = []
    blocked_ids = set()
    for e in edges:
        res = evaluate_segment_risk(
            segment=e,
            hourly_rainfall_mm=rainfall_mm,
            antecedent_72h_mm=ante_72h,
            threshold=threshold,
            duration_hours=1.0
        )
        evaluated.append(res)
        if res["blocked"]:
            blocked_ids.add(res["segment_id"])

    isolated = compute_isolated_settlements(net_info["data"], blocked_ids)
    pop_isolated = sum(v.get("population", 0) for v in isolated)

    return {
        "network_source": net_info["source_file"],
        "rainfall_mm": rainfall_mm,
        "prior1": prior1,
        "prior2": prior2,
        "antecedent_72h_mm": round(ante_72h, 2),
        "threshold": threshold,
        "total_segments": len(edges),
        "blocked_segments_count": len(blocked_ids),
        "blocked_segments": list(blocked_ids),
        "isolated_settlements_count": len(isolated),
        "isolated_population": pop_isolated,
        "isolated_settlements": isolated,
        "segments": evaluated
    }


@app.get("/depots")
def get_depots():
    """
    Returns active emergency resource depots (hospitals, SDRF, PWD/BRO, DEOC).
    """
    from services.dispatch import load_depots_data
    try:
        return load_depots_data()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load depots: {str(e)}")


@app.get("/dispatch/plan")
def dispatch_plan(
    rainfall_mm: float = 85.0,
    prior1: float = 0.0,
    prior2: float = 0.0,
    threshold: float = DEFAULT_BLOCK_THRESHOLD,
    mode: str = "simulation",
    hour: int = 0
):
    """
    Dynamic emergency dispatch plan:
    - Depot resource matching (ambulances, rescue teams, excavators, med units)
    - Cut-off settlement needs calculation based on population
    - 3-Way mitigation evaluation:
        (a) Alternate route
        (b) Excavator road clearance ETA
        (c) Aerial / Foot transit
    - Critical patient evacuation pathways
    """
    try:
        plan = generate_dispatch_plan(
            rainfall_mm=rainfall_mm,
            prior1=prior1,
            prior2=prior2,
            threshold=threshold,
            mode=mode,
            hour=hour
        )
        return plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dispatch planning failed: {str(e)}")