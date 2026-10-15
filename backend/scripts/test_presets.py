"""Test /simulate/cascade equivalent at 20, 55, 85, 130 mm."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))

from services.cascade import run_cascade_simulation

for mm in [20, 55, 85, 130]:
    r = run_cascade_simulation(mm)
    isolated = [v for v in r['isolation_details'] if v['isolated']]
    print(f"\n--- {mm}mm ---")
    print(f"  blocked_roads: {r['blocked_roads']}")
    print(f"  isolated_villages: {r['isolated_villages']}")
    print(f"  population_isolated: {r['population_isolated']}")
    if isolated:
        print(f"  isolated: {[v['name'] for v in isolated]}")
    else:
        print(f"  isolated: (none)")
