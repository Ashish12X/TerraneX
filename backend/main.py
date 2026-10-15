from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from services.cascade import run_cascade_simulation, prioritize_resources
from services.routing import get_safe_route
from services.live import get_live_rainfall
from services.routing import get_safe_route, get_network_state

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
    rainfall_mm: float = Query(80.0, description="Rainfall in mm")
):
    """
    Run landslide cascade simulation for Rudraprayag
    """
    result = run_cascade_simulation(rainfall_mm=rainfall_mm)
    return result

@app.get("/prioritize/resources")
def resources(
    rainfall_mm: float = Query(80.0, description="Rainfall in mm")
):
    """
    Limited emergency resources ko prioritize karta hai
    """
    result = prioritize_resources(rainfall_mm=rainfall_mm)
    return result

@app.get("/route/safe")
def safe_route(
    source: str = Query(..., description="Village ID, e.g. V07"),
    rainfall_mm: float = Query(80.0, description="Rainfall in mm"),
    target: str | None = Query(None, description="Optional hospital ID, e.g. H01"),
):
    """Source se hospital tak safe route (blocked roads avoid karke)"""
    try:
        return get_safe_route(source, rainfall_mm, target)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/live/rainfall")
def live_rainfall():
    """Rudraprayag ki live baarish (Open-Meteo)"""
    try:
        return get_live_rainfall()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))


@app.get("/live/cascade")
def live_cascade(
    basis: str = Query("past_24h", description="past_24h ya next_24h (forecast)")
):
    """Live rainfall ko seedha cascade simulation mein daalta hai"""
    try:
        live = get_live_rainfall()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    rainfall = live["next_24h_mm"] if basis == "next_24h" else live["past_24h_mm"]
    return {
        "mode": "live",
        "basis": basis,
        "live_data": live,
        "cascade": run_cascade_simulation(rainfall_mm=rainfall),
        "resources": prioritize_resources(rainfall_mm=rainfall),
    }

@app.get("/network")
def network(rainfall_mm: float = Query(80.0, description="Rainfall in mm")):
    """Map data: nodes, roads, blocked status"""
    return get_network_state(rainfall_mm)