import json
from pathlib import Path
from collections import defaultdict

def main():
    base = Path(r"c:\Study\Hekathon\Innotech 2026\Terranex\backend\data")
    with open(base / "osm_roads_raw.geojson", encoding="utf-8") as f:
        geo = json.load(f)

    # Build a graph of endpoints
    # Round coordinates to 5 decimal places to match junctions
    def pt_key(pt):
        return (round(pt[1], 4), round(pt[0], 4))

    graph = defaultdict(list)
    ways = {}
    for f in geo["features"]:
        wid = f["properties"].get("@id")
        coords = f["geometry"]["coordinates"] # [lon, lat]
        ways[wid] = [(c[1], c[0]) for c in coords] # [lat, lon]
        p_start = pt_key(coords[0])
        p_end = pt_key(coords[-1])
        graph[p_start].append((p_end, wid, False))
        graph[p_end].append((p_start, wid, True))

    print(f"Total ways: {len(ways)}, Total junction keys: {len(graph)}")

    # Let's see connected components of ways
    visited = set()
    components = []
    for wid in ways:
        if wid in visited:
            continue
        comp = []
        queue = [wid]
        visited.add(wid)
        while queue:
            curr = queue.pop(0)
            comp.append(curr)
            w_coords = ways[curr]
            k1 = pt_key((w_coords[0][1], w_coords[0][0]))
            k2 = pt_key((w_coords[-1][1], w_coords[-1][0]))
            for k in [k1, k2]:
                for neighbor_pt, next_wid, _ in graph[k]:
                    if next_wid not in visited:
                        visited.add(next_wid)
                        queue.append(next_wid)
        components.append(comp)

    print(f"Connected components: {len(components)}")
    for i, c in enumerate(components):
        print(f"Component {i+1}: {len(c)} ways -> {c[:5]}...")

if __name__ == "__main__":
    main()
