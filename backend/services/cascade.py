from typing import List, Dict
from services.routing import compute_isolation


def get_sample_data():
    """Temporary sample data for Rudraprayag (later replace with real data)"""
    villages = [
        {"id": "V01", "name": "Augustmuni", "population": 2100, "type": "village"},
        {"id": "V02", "name": "Ukhimath", "population": 1850, "type": "village"},
        {"id": "V03", "name": "Guptkashi", "population": 2400, "type": "village"},
        {"id": "V04", "name": "Sonprayag", "population": 980, "type": "village"},
        {"id": "V05", "name": "Kedarnath", "population": 1200, "type": "village"},
        {"id": "V06", "name": "Rambara", "population": 650, "type": "village"},
        {"id": "V07", "name": "Phata", "population": 1100, "type": "village"},
        {"id": "V08", "name": "Triyuginarayan", "population": 890, "type": "village"},
    ]
    
    hospitals = [
        {"id": "H01", "name": "District Hospital Rudraprayag", "type": "hospital"},
        {"id": "H02", "name": "CHC Ukhimath", "type": "hospital"},
        {"id": "H03", "name": "PHC Guptkashi", "type": "hospital"},
    ]
    
    return villages, hospitals


def run_cascade_simulation(rainfall_mm: float = 80.0, edge_rainfalls: dict | None = None):
    """
    Graph-based cascade: rainfall -> road risk -> blocked roads ->
    villages jinke paas kisi hospital tak path nahi bacha = isolated.
    """
    villages, _ = get_sample_data()
    isolation, blocked_roads = compute_isolation(rainfall_mm, edge_rainfalls=edge_rainfalls)

    isolation_details = []
    isolated_count = 0
    population_isolated = 0

    for v in villages:
        info = isolation[v["id"]]
        if info["isolated"]:
            isolated_count += 1
            population_isolated += v["population"]

        isolation_details.append({
            "id": v["id"],
            "name": v["name"],
            "population": v["population"],
            "isolated": info["isolated"],
            "reachable_hospitals": info["reachable_hospitals"],
            "isolation_score": info["isolation_score"],
            "route_to_hospital": info["route"],
        })

    isolation_details.sort(key=lambda x: x["isolation_score"], reverse=True)

    return {
        "rainfall_mm": rainfall_mm,
        "blocked_roads": blocked_roads,
        "isolated_villages": isolated_count,
        "population_isolated": population_isolated,
        "isolation_details": isolation_details,
        "message": f"Simulation completed for {rainfall_mm}mm rainfall in Rudraprayag"
    }

def prioritize_resources(rainfall_mm: float = 80.0, edge_rainfalls: dict | None = None):
    """
    Limited resources ko sirf genuinely isolated villages pe assign karta hai.
    Resources: 2 Ambulances, 2 Rescue Teams, 1 Excavator
    """
    simulation = run_cascade_simulation(rainfall_mm, edge_rainfalls=edge_rainfalls)
    villages = simulation["isolation_details"]
    
    # Sirf tabhi assign karo jab village isolated ho
    priority_villages = sorted(
    [v for v in villages if v["isolated"]],
    key=lambda v: v["population"],
    reverse=True,
)
    
    resources = [
        {"id": "AMB-1", "type": "Ambulance"},
        {"id": "AMB-2", "type": "Ambulance"},
        {"id": "TEAM-1", "type": "Rescue Team"},
        {"id": "TEAM-2", "type": "Rescue Team"},
        {"id": "EXC-1", "type": "Excavator"},
    ]
    
    assignments = []
    
    for i, resource in enumerate(resources):
        if i < len(priority_villages):
            village = priority_villages[i]
            assignments.append({
                "resource_id": resource["id"],
                "resource_type": resource["type"],
                "assigned_to": village["name"],
                "village_id": village["id"],
                "population": village["population"],
                "isolation_score": village["isolation_score"],
                "reason": f"Village is isolated. Population: {village['population']}"
            })
        else:
            assignments.append({
                "resource_id": resource["id"],
                "resource_type": resource["type"],
                "assigned_to": None,
                "reason": "No more isolated villages"
            })
    
    return {
        "rainfall_mm": rainfall_mm,
        "total_isolated_villages": simulation["isolated_villages"],
        "population_at_risk": simulation["population_isolated"],
        "resources_available": len(resources),
        "assignments": assignments,
        "message": "Resource prioritization completed"
    }