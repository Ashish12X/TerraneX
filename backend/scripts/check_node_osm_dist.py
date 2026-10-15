import json
import math
from pathlib import Path
from collections import defaultdict

def haversine(c1, c2):
    R = 6371
    p1, p2 = math.radians(c1[0]), math.radians(c2[0])
    dp = p2 - p1
    dl = math.radians(c2[1] - c1[1])
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))

def main():
    base = Path(r"c:\Study\Hekathon\Innotech 2026\Terranex\backend\data")
    with open(base / "network.json", encoding="utf-8") as f:
        net = json.load(f)
    with open(base / "osm_roads_raw.geojson", encoding="utf-8") as f:
        geo = json.load(f)

    nodes = net["nodes"]

    # For each node, find the closest point in OSM features
    for n in nodes:
        best_d = 9999
        best_pt = None
        best_way = None
        for f in geo["features"]:
            for pt in f["geometry"]["coordinates"]:
                d = haversine([n["lat"], n["lon"]], [pt[1], pt[0]])
                if d < best_d:
                    best_d = d
                    best_pt = pt
                    best_way = f["properties"].get("@id")
        print(f"Node {n['id']} ({n['name']}): closest OSM point is {best_d:.2f} km away in {best_way}")

if __name__ == "__main__":
    main()
