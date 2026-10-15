"""
Generate geometry diagnosis report for all edges in network.json.
Output: backend/scripts/geometry_report.md
"""
import json, math, os

def haversine(a, b):
    """a, b are [lat, lon]"""
    R = 6371000
    la1, lo1 = math.radians(a[0]), math.radians(a[1])
    la2, lo2 = math.radians(b[0]), math.radians(b[1])
    dlat = la2 - la1
    dlon = lo2 - lo1
    h = math.sin(dlat/2)**2 + math.cos(la1)*math.cos(la2)*math.sin(dlon/2)**2
    return R * 2 * math.asin(math.sqrt(h))

BASE = os.path.join(os.path.dirname(__file__), '..', '..')
net = json.load(open(os.path.join(BASE, 'backend', 'data', 'network.json')))
nodes = {n['id']: n for n in net['nodes']}
edges = {e['id']: e for e in net['edges']}

EDGE_IDS = ['E01','E02','E03','E04','E05','E06','E07','E08','E09','E10','E11','E12']

rows = []
for eid in EDGE_IDS:
    e = edges[eid]
    coords = e['coordinates']
    fn = nodes[e['from']]
    tn = nodes[e['to']]
    fn_pt = [fn['lat'], fn['lon']]
    tn_pt = [tn['lat'], tn['lon']]

    straight = haversine(fn_pt, tn_pt)
    geom_len = sum(haversine(coords[i], coords[i+1]) for i in range(len(coords)-1))
    ratio = geom_len / straight if straight > 0 else 0

    gaps = [haversine(coords[i], coords[i+1]) for i in range(len(coords)-1)]
    max_gap = max(gaps) if gaps else 0

    start_err = haversine(coords[0], fn_pt)
    end_err = haversine(coords[-1], tn_pt)

    # Backtrack detection along dominant axis
    dom_lat = tn_pt[0] - fn_pt[0]
    dom_lon = tn_pt[1] - fn_pt[1]
    bt_count = 0
    for i in range(len(coords)-1):
        dlat = coords[i+1][0] - coords[i][0]
        dlon = coords[i+1][1] - coords[i][1]
        if abs(dom_lat) >= abs(dom_lon):
            if dlat * dom_lat < -0.0001:
                bt_count += 1
        else:
            if dlon * dom_lon < -0.0001:
                bt_count += 1

    reasons = []
    if ratio < 1.2: reasons.append(f'ratio {ratio:.2f} < 1.2')
    if ratio > 1.8: reasons.append(f'ratio {ratio:.2f} > 1.8')
    if max_gap > 500: reasons.append(f'gap {max_gap:.0f}m > 500m')
    if start_err > 200: reasons.append(f'start_err {start_err:.0f}m')
    if end_err > 200: reasons.append(f'end_err {end_err:.0f}m')

    rows.append({
        'id': eid,
        'from_to': f"{e['from']}>{e['to']}",
        'straight_km': straight/1000,
        'geom_km': geom_len/1000,
        'ratio': ratio,
        'max_gap': max_gap,
        'start_err': start_err,
        'end_err': end_err,
        'bt': bt_count,
        'reasons': reasons,
        'flagged': len(reasons) > 0,
    })

# Build markdown
lines = [
    '# Terranex Edge Geometry Diagnosis',
    '',
    '> Coordinates format: [lat, lon]. Haversine used for all distances.',
    '> Normal mountain road ratio: **1.2 – 1.8**.',
    '> Flagged if: ratio outside 1.2-1.8, max consecutive gap > 500 m, or start/end error > 200 m.',
    '',
    '## Full Table',
    '',
    '| Edge | From>To | Straight km | Geom km | Ratio | MaxGap m | StartErr m | EndErr m | Backtrack | Status |',
    '|------|---------|-------------|---------|-------|----------|-----------|----------|-----------|--------|',
]
for r in rows:
    status = 'FLAG: ' + '; '.join(r['reasons']) if r['flagged'] else 'OK'
    lines.append(
        f"| {r['id']} | {r['from_to']} | {r['straight_km']:.2f} | {r['geom_km']:.2f} | {r['ratio']:.2f} | {r['max_gap']:.0f} | {r['start_err']:.0f} | {r['end_err']:.0f} | {r['bt']} | {status} |"
    )

lines += [
    '',
    '## Flagged Edges Summary',
    '',
]
for r in rows:
    if r['flagged']:
        lines.append(f"- **{r['id']}** ({r['from_to']}): {'; '.join(r['reasons'])}, backtrack_segs={r['bt']}")

lines += [
    '',
    '## Notes on Severe Cases',
    '',
    '- **E04**: ratio 7.75 — straight 2.16 km, geom 16.74 km. Coordinates likely from a wrong road segment.',
    '- **E06**: ratio 3.76, max gap 1203m — duplicated or wrongly ordered OSM segments.',
    '- **E07**: ratio 3.41 — significantly inflated for a short road.',
    '- **E02**: 16 backtrack segments — severe zigzag, coordinates may be doubled.',
    '',
    '## Edges Passing All Checks',
    '',
]
for r in rows:
    if not r['flagged']:
        lines.append(f"- **{r['id']}** ({r['from_to']}): ratio={r['ratio']:.2f}, max_gap={r['max_gap']:.0f}m")

out_path = os.path.join(os.path.dirname(__file__), 'geometry_report.md')
with open(out_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))
print(f'Saved: {out_path}')
for r in rows:
    if r['flagged']:
        print(f"  FLAG {r['id']}: {'; '.join(r['reasons'])}")
