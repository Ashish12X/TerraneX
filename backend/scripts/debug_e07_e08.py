"""
Analyze E07 and E08 geometry in detail.
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
nodes = {n['id']: n for n in d['nodes']}

for eid in ['E07', 'E08']:
    e = edges[eid]
    coords = e['coordinates']
    fn = nodes[e['from']]
    tn = nodes[e['to']]

    total = sum(haversine(coords[i], coords[i+1]) for i in range(len(coords)-1))
    straight = haversine([fn['lat'],fn['lon']], [tn['lat'],tn['lon']])
    ratio = total / straight

    print(f"=== {eid}: {e['from']} {fn['name']} -> {e['to']} {tn['name']} ===")
    print(f"  pts={len(coords)}, geom={total/1000:.2f}km, straight={straight/1000:.2f}km, ratio={ratio:.2f}")
    print(f"  geom_src: {e.get('geometry_source','?')}")
    print(f"  stored length_km: {e['length_km']}")

    lats = [c[0] for c in coords]
    lons = [c[1] for c in coords]
    print(f"  lat range: {min(lats):.4f} - {max(lats):.4f}  (from={fn['lat']}, to={tn['lat']})")
    print(f"  lon range: {min(lons):.4f} - {max(lons):.4f}  (from={fn['lon']}, to={tn['lon']})")

    # Print key points
    print(f"  Key points:")
    step = max(1, len(coords)//10)
    for i in range(0, len(coords), step):
        gap = haversine(coords[i-1], coords[i]) if i > 0 else 0
        print(f"    [{i}] {coords[i]}  gap={gap:.0f}m")

    # Gaps > 300m
    large_gaps = [(i, haversine(coords[i], coords[i+1])) for i in range(len(coords)-1) if haversine(coords[i], coords[i+1]) > 300]
    print(f"  Large gaps (>300m): {len(large_gaps)}")
    for i,g in large_gaps[:5]:
        print(f"    [{i}]->[{i+1}]: {g:.0f}m  {coords[i]} -> {coords[i+1]}")
    print()
