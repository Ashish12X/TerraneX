import json
import math
from pathlib import Path

def haversine(c1, c2):
    # c is [lat, lon]
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

    nodes = {n["id"]: n for n in net["nodes"]}
    print("--- NODES ---")
    for n in net["nodes"]:
        print(f"{n['id']}: {n['name']} ({n['lat']:.4f}, {n['lon']:.4f})")

    print("\n--- EDGES ---")
    for e in net["edges"]:
        n1, n2 = nodes[e["from"]], nodes[e["to"]]
        dist = haversine([n1["lat"], n1["lon"]], [n2["lat"], n2["lon"]])
        print(f"{e['id']}: {e['from']} ({n1['name']}) -> {e['to']} ({n2['name']}), straight_dist={dist:.1f}km, len_km={e['length_km']}")

    print("\n--- OSM FEATURES ---")
    for f in geo["features"]:
        coords = f["geometry"]["coordinates"] # [lon, lat]
        start = (coords[0][1], coords[0][0])
        end = (coords[-1][1], coords[-1][0])
        ref = f["properties"].get("ref", "None")
        wid = f["properties"].get("@id")
        print(f"{wid}: {ref} ({len(coords)} pts) | start={start[0]:.4f},{start[1]:.4f} end={end[0]:.4f},{end[1]:.4f}")

if __name__ == "__main__":
    main()
