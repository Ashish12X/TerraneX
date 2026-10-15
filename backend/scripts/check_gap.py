import json
from pathlib import Path
import networkx as nx

def main():
    base = Path(r"c:\Study\Hekathon\Innotech 2026\Terranex\backend\data")
    with open(base / "osm_roads_raw.geojson", encoding="utf-8") as f:
        geo = json.load(f)

    G = nx.Graph()
    for f in geo["features"]:
        coords = f["geometry"]["coordinates"] # [lon, lat]
        for i in range(len(coords) - 1):
            p1 = (round(coords[i][1], 5), round(coords[i][0], 5))
            p2 = (round(coords[i+1][1], 5), round(coords[i+1][0], 5))
            dist = ((p1[0]-p2[0])**2 + (p1[1]-p2[1])**2)**0.5
            G.add_edge(p1, p2, weight=dist)

    comps = list(nx.connected_components(G))
    print(f"Components: {len(comps)}")
    c1, c2 = comps[0], comps[1]
    # Find min distance between c1 and c2
    min_d = 999
    p_min1, p_min2 = None, None
    for p1 in c1:
        for p2 in c2:
            d = ((p1[0]-p2[0])**2 + (p1[1]-p2[1])**2)**0.5
            if d < min_d:
                min_d = d
                p_min1, p_min2 = p1, p2

    print(f"Min gap between Comp 1 and Comp 2: {min_d*111000:.1f} meters! between {p_min1} and {p_min2}")

if __name__ == "__main__":
    main()
