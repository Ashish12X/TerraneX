import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from services.cascade import run_cascade_simulation
from services.routing import get_safe_route

def run_checks(tag="CURRENT"):
    print(f"=== {tag} CHECK ===")
    for rf in [20, 55, 85, 130]:
        sim = run_cascade_simulation(rainfall_mm=rf)
        isolated_names = [v["name"] for v in sim["isolation_details"] if v["isolated"]]
        print(f"Rainfall: {rf} mm | Blocked roads: {sim['blocked_roads']} | Isolated villages: {sim['isolated_villages']} | Pop isolated: {sim['population_isolated']}")
        print(f"  Isolated villages: {isolated_names}")
    
    route = get_safe_route("V03", 50.0, "H01")
    print(f"\nRoute V03 -> H01 @ 50mm:")
    print(f"  Route found: {route['route_found']}")
    print(f"  Distance (km): {route['safe_route']['distance_km']}")
    print(f"  Nodes: {' -> '.join(route['safe_route']['nodes'])}")
    print(f"  Names: {' -> '.join(route['safe_route']['names'])}")
    print(f"  Rerouted: {route['rerouted']}")
    print(f"  Normal route dist (km): {route['normal_route']['distance_km']}")

if __name__ == "__main__":
    run_checks("BEFORE UPDATE")
