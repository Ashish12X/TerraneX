import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from main import cascade, safe_route

print("=== FASTAPI /simulate/cascade ENDPOINT OUTPUTS ===")
for rf in [20, 55, 85, 130]:
    data = cascade(rainfall_mm=float(rf))
    isolated_villages = [v["name"] for v in data["isolation_details"] if v["isolated"]]
    print(f"Rainfall: {rf} mm")
    print(f"  blocked_roads: {data['blocked_roads']}")
    print(f"  isolated_villages: {data['isolated_villages']}")
    print(f"  population_isolated: {data['population_isolated']}")
    print(f"  names: {isolated_villages}")

print("\n=== FASTAPI /route/safe?source=V03&target=H01&rainfall_mm=50 ENDPOINT OUTPUT ===")
data_route = safe_route(source="V03", rainfall_mm=50.0, target="H01")
print(f"source: {data_route['source']}")
print(f"target: {data_route['target']}")
print(f"route_found: {data_route['route_found']}")
print(f"safe_route distance_km: {data_route['safe_route']['distance_km']}")
print(f"safe_route nodes: {' -> '.join(data_route['safe_route']['nodes'])}")
print(f"safe_route names: {' -> '.join(data_route['safe_route']['names'])}")
print(f"normal_route distance_km: {data_route['normal_route']['distance_km']}")
print(f"rerouted: {data_route['rerouted']}")
