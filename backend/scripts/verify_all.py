import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from services.cascade import run_cascade_simulation
from services.routing import get_network_state

def verify():
    print("=== 1. PRESET CASACADE REAL OUTPUTS ===")
    for mm in [20, 55, 85, 130]:
        r = run_cascade_simulation(mm)
        iso = [v['name'] for v in r['isolation_details'] if v['isolated']]
        print(f"Rainfall {mm:3d} mm | Blocked roads: {r['blocked_roads']} | Isolated ({len(iso)}): {iso} | Pop: {r['population_isolated']}")

    print("\n=== 2. E09 & METADATA IN NETWORK.JSON ===")
    net = json.load(open('data/network.json', encoding='utf-8'))
    for e in net['edges']:
        if e['id'] == 'E09':
            print(f"E09: susc={e['susceptibility']}, source={e.get('susceptibility_source')}, reason={e.get('manual_override_reason')}")
        if e['geometry_source'] == 'approximated':
            print(f"Approximated path: {e['id']} ({e['from']}->{e['to']}), mean_slope={e.get('mean_gradient_pct')}%, max_slope={e.get('max_gradient_pct')}%")

if __name__ == "__main__":
    verify()
