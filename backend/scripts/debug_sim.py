import sys
from pathlib import Path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from services.cascade import run_cascade_simulation
from services.routing import build_graph, compute_isolation

print("Running cascade with rainfall_mm=85.0:")
res = run_cascade_simulation(85.0)
print("res:", res["blocked_roads"], res["isolated_villages"])

full, usable = build_graph(85.0)
for u, v, d in full.edges(data=True):
    print(d["id"], "risk:", d["risk"], "blocked:", d["blocked"], "susc:", d.get("susceptibility"))
