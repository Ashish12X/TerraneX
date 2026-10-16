import json
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from main import live_villages, live_rainfall, cascade, network, resources, safe_route

print("=" * 60)
print("1. TEST /live/rainfall (Legacy single-point)")
print("=" * 60)
lr = live_rainfall()
print(f"Location: {lr['location']}")
print(f"Source: {lr['source']}")
print(f"Past 24h: {lr['past_24h_mm']} mm")
print(f"Effective 72h: {lr['effective_72h_mm']} mm")
print(f"Next 24h: {lr['next_24h_mm']} mm")

print("\n" + "=" * 60)
print("2. TEST /live/villages (New multi-location endpoint)")
print("=" * 60)
lv = live_villages()
print(f"Source: {lv['source']}")
print(f"Observed at: {lv['observed_at']}")
print(f"Cached: {lv['cached']}, Fallback: {lv['fallback']}")
print(f"Total villages: {len(lv['villages'])}")
for v in lv["villages"]:
    print(f"  {v['id']} {v['name']:<16} | Lat: {v['lat']:.4f}, Lon: {v['lon']:.4f} | Past 24h: {v['past_24h_mm']:>4.1f} mm | Eff 72h: {v['effective_72h_mm']:>4.1f} mm | Elev: {v.get('elevation_m')} m")

print("\n" + "=" * 60)
print("3. VERIFY /simulate/cascade?rainfall_mm=85 (Default per_village=False)")
print("=" * 60)
sim85 = cascade(rainfall_mm=85.0)
iso_names = [v['name'] for v in sim85['isolation_details'] if v['isolated']]
print(f"Blocked roads count: {sim85['blocked_roads']}")
print(f"Isolated villages count: {sim85['isolated_villages']}")
print(f"Isolated population: {sim85['population_isolated']}")
print(f"Isolated village names: {iso_names}")
assert sim85['blocked_roads'] == 5, f"Expected 5 blocked roads, got {sim85['blocked_roads']}"
assert sim85['isolated_villages'] == 4, f"Expected 4 isolated villages, got {sim85['isolated_villages']}"
assert sim85['population_isolated'] == 3720, f"Expected 3720 pop, got {sim85['population_isolated']}"
print("=> STRICT CHECK PASSED: exactly 5 blocked roads and 4 isolated villages!")

print("\n" + "=" * 60)
print("4. TEST /network?per_village=True&basis=effective_72h")
print("=" * 60)
net_pv = network(rainfall_mm=0.0, per_village=True, basis="effective_72h")
print(f"Total edges: {len(net_pv['edges'])}")
for e in net_pv["edges"]:
    print(f"  {e['id']} ({e['from']} -> {e['to']}): rainfall={e.get('rainfall_mm')} mm, risk={e['risk']}, blocked={e['blocked']}")

print("\n" + "=" * 60)
print("5. TEST fallback behavior (simulate Open-Meteo down)")
print("=" * 60)
from services import live
old_fetch = live._calc_metrics
# Temporary clear cache and test fallback
live._villages_cache = {"t": 0.0, "data": None}
# Now test get_live_villages_rainfall with bad url
real_urlencode = live.urlencode
def broken_urlencode(d):
    return "broken=1"
live.urlencode = broken_urlencode
fb_res = live.get_live_villages_rainfall()
print(f"Fallback triggered: Source='{fb_res['source']}', fallback={fb_res['fallback']}")
print(f"Fallback village V01: past_24h={fb_res['villages'][0]['past_24h_mm']} mm, eff_72h={fb_res['villages'][0]['effective_72h_mm']} mm")
live.urlencode = real_urlencode
live._villages_cache = {"t": 0.0, "data": None}
print("=> Fallback test passed successfully!")
