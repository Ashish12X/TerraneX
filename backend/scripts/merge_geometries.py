import json
from pathlib import Path
import math

DATA_DIR = Path(r"c:\Study\Hekathon\Innotech 2026\Terranex\backend\data")
NETWORK_FILE = DATA_DIR / "network.json"
GEOM_FILE = DATA_DIR / "edge_geometries.json"

def haversine_m(c1, c2):
    R = 6371000
    p1, p2 = math.radians(c1[0]), math.radians(c2[0])
    dp = p2 - p1
    dl = math.radians(c2[1] - c1[1])
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))

def merge():
    with open(NETWORK_FILE, encoding="utf-8") as f:
        net = json.load(f)
    with open(GEOM_FILE, encoding="utf-8") as f:
        geoms = json.load(f)

    nodes = {n["id"]: n for n in net["nodes"]}

    for e in net["edges"]:
        eid = e["id"]
        coords = geoms.get(eid)
        if coords:
            # Ensure the start and end of coords match the node locations
            u, v = nodes[e["from"]], nodes[e["to"]]
            p_from = [u["lat"], u["lon"]]
            p_to = [v["lat"], v["lon"]]
            
            # Check orientation
            d_start_from = haversine_m(coords[0], p_from)
            d_start_to = haversine_m(coords[0], p_to)
            if d_start_to < d_start_from:
                coords = list(reversed(coords))
            
            # Snap exact endpoints to nodes
            coords[0] = p_from
            coords[-1] = p_to
            e["coordinates"] = coords
            
            # compute real length from coords
            d = 0.0
            for i in range(len(coords) - 1):
                d += haversine_m(coords[i], coords[i+1])
            if d > 200:
                e["length_km"] = round(d / 1000.0, 1)

    with open(NETWORK_FILE, "w", encoding="utf-8") as f:
        json.dump(net, f, indent=2, ensure_ascii=False)
    print("Successfully merged realistic coordinates into network.json!")

if __name__ == "__main__":
    merge()
