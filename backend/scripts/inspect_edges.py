"""
Check key edge metadata and coordinate counts.
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(__file__))
d = json.load(open(os.path.join(os.path.dirname(__file__), '..', 'data', 'network.json')))
nodes = {n['id']: n for n in d['nodes']}
edges = {e['id']: e for e in d['edges']}

for eid in ['E04','E06','E07','E08']:
    e = edges[eid]
    fn = nodes[e['from']]
    tn = nodes[e['to']]
    src = e.get('geometry_source','?')
    print(f"{eid}: {e['from']} {fn['name']} -> {e['to']} {tn['name']}")
    print(f"  length_km={e['length_km']}  pts={len(e['coordinates'])}  geom_src={src}")
    print(f"  first coord: {e['coordinates'][0]}")
    print(f"  last  coord: {e['coordinates'][-1]}")
    print(f"  node from:   lat={fn['lat']} lon={fn['lon']}")
    print(f"  node to:     lat={tn['lat']} lon={tn['lon']}")
    print()
