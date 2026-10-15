"""
Inspect E06 coordinates in detail to find duplicate/wrong segments.
"""
import json, math, os

def haversine(a, b):
    R = 6371000
    la1, lo1 = math.radians(a[0]), math.radians(a[1])
    la2, lo2 = math.radians(b[0]), math.radians(b[1])
    dlat, dlon = la2-la1, lo2-lo1
    h = math.sin(dlat/2)**2 + math.cos(la1)*math.cos(la2)*math.sin(dlon/2)**2
    return R*2*math.asin(math.sqrt(h))

d = json.load(open(os.path.join(os.path.dirname(__file__), '..', 'data', 'network.json')))
edges = {e['id']: e for e in d['edges']}

for eid in ['E06']:
    e = edges[eid]
    coords = e['coordinates']
    print(f"=== {eid}: {len(coords)} points ===")
    # Print every 10th point with index and distance from prev
    prev = coords[0]
    print(f"  idx=0: {coords[0]}")
    for i in range(1, len(coords)):
        d_m = haversine(coords[i-1], coords[i])
        if i < 20 or i > len(coords)-10 or i % 30 == 0 or d_m > 400:
            print(f"  idx={i}: {coords[i]}  gap={d_m:.0f}m")
        prev = coords[i]
    print()
    # Find bounding box
    lats = [c[0] for c in coords]
    lons = [c[1] for c in coords]
    print(f"  lat range: {min(lats):.4f} - {max(lats):.4f}")
    print(f"  lon range: {min(lons):.4f} - {max(lons):.4f}")
    # Cumulative distance
    cum = 0
    for i in range(1, len(coords)):
        cum += haversine(coords[i-1], coords[i])
    print(f"  total geom length: {cum/1000:.2f} km")
