"""Check E09 trek path and add trek note if missing."""
import json, math, os

def haversine(a, b):
    R = 6371000
    la1, lo1 = math.radians(a[0]), math.radians(a[1])
    la2, lo2 = math.radians(b[0]), math.radians(b[1])
    dlat, dlon = la2-la1, lo2-lo1
    h = math.sin(dlat/2)**2 + math.cos(la1)*math.cos(la2)*math.sin(dlon/2)**2
    return R*2*math.asin(math.sqrt(h))

net_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'network.json')
d = json.load(open(net_path, encoding='utf-8'))
nodes = {n['id']: n for n in d['nodes']}

for e in d['edges']:
    if e['id'] == 'E09':
        fn = nodes[e['from']]
        tn = nodes[e['to']]
        coords = e['coordinates']
        straight = haversine([fn['lat'],fn['lon']], [tn['lat'],tn['lon']])
        g = sum(haversine(coords[i], coords[i+1]) for i in range(len(coords)-1))
        ratio = g / straight
        gaps = [haversine(coords[i], coords[i+1]) for i in range(len(coords)-1)]
        max_gap = max(gaps) if gaps else 0
        print("E09: Rambara -> Kedarnath")
        print(f"  from: {fn['name']} {fn['lat']},{fn['lon']}")
        print(f"  to:   {tn['name']} {tn['lat']},{tn['lon']}")
        print(f"  straight={straight/1000:.2f}km, geom={g/1000:.2f}km, ratio={ratio:.2f}")
        print(f"  pts={len(coords)}, max_gap={max_gap:.0f}m")
        print(f"  geometry_source={e.get('geometry_source','?')}")
        print(f"  geometry_note={e.get('geometry_note','(not set)')}")
        print(f"  susceptibility_source={e.get('susceptibility_source','?')}")
