"""
Add trek path annotation to E09 (Rambara->Kedarnath).
- road_type: "trek" (foot path, not motorable)
- geometry_note: explains the approximated geometry
- Does NOT change: id, from, to, length_km, susceptibility, susceptibility_source
"""
import json, os

net_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'network.json')
d = json.load(open(net_path, encoding='utf-8'))

for e in d['edges']:
    if e['id'] == 'E09':
        # Mark as trek path
        e['road_type'] = 'trek'
        e['road_type_note'] = (
            'Rambara to Kedarnath is a foot trek (~16 km by trail), '
            'not a motorable road. Vehicles cannot use this route. '
            'Emergency access is by helicopter or on foot only.'
        )
        e['geometry_note'] = (
            'Geometry approximated along the Mandakini gorge corridor. '
            'Actual trek path has more switchbacks than shown. '
            'susceptibility=0.88 is a manual expert override based on known '
            'landslide history in this corridor (see susceptibility_source field).'
        )
        print("E09 updated:")
        for k, v in e.items():
            if k != 'coordinates':
                print(f"  {k}: {v}")

with open(net_path, 'w', encoding='utf-8') as f:
    json.dump(d, f, indent=2, ensure_ascii=False)
print(f"\nSaved: {net_path}")
