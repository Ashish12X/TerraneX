import json
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen
import math

DATA_DIR = Path(r"c:\Study\Hekathon\Innotech 2026\Terranex\backend\data")
NETWORK_FILE = DATA_DIR / "network.json"
GEOM_FILE = DATA_DIR / "edge_geometries.json"

SAMPLES = 12

def haversine_m(a, b):
    R = 6371000
    p1, p2 = math.radians(a[0]), math.radians(b[0])
    dp = p2 - p1
    dl = math.radians(b[1] - a[1])
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))

def fetch_elevations(coords, chunk=50):
    out = []
    for i in range(0, len(coords), chunk):
        part = coords[i:i + chunk]
        params = urlencode({
            "latitude": ",".join(f"{c[0]:.5f}" for c in part),
            "longitude": ",".join(f"{c[1]:.5f}" for c in part),
        })
        with urlopen(f"https://api.open-meteo.com/v1/elevation?{params}", timeout=20) as r:
            out.extend(json.load(r)["elevation"])
    return out

def run():
    with open(NETWORK_FILE, encoding="utf-8") as f:
        net = json.load(f)
    with open(GEOM_FILE, encoding="utf-8") as f:
        geoms = json.load(f)

    # Attach coordinates to each edge
    all_pts, spans = [], []
    for e in net["edges"]:
        eid = e["id"]
        coords = geoms.get(eid, [])
        e["coordinates"] = coords
        # compute real length from coords
        d = 0.0
        for i in range(len(coords) - 1):
            d += haversine_m(coords[i], coords[i+1])
        if d > 100:
            e["length_km"] = round(d / 1000.0, 1)

        # Sample SAMPLES points along the real road shape
        pts = [coords[int(i * (len(coords) - 1) / (SAMPLES - 1))] for i in range(SAMPLES)]
        spans.append((len(all_pts), len(all_pts) + SAMPLES))
        all_pts.extend(pts)

    elev = fetch_elevations(all_pts)

    for e, (s, t) in zip(net["edges"], spans):
        pts, el = all_pts[s:t], elev[s:t]
        grads = []
        for i in range(len(pts) - 1):
            d = haversine_m(pts[i], pts[i + 1])
            if d > 0:
                grads.append(abs(el[i + 1] - el[i]) / d * 100)
        e["max_gradient_pct"] = round(max(grads), 1)
        e["mean_gradient_pct"] = round(sum(grads) / len(grads), 1)
        print(f"Edge {e['id']} ({e['from']}->{e['to']}): len={e['length_km']}km, mean_grad={e['mean_gradient_pct']}%, max_grad={e['max_gradient_pct']}%, elevs: {el[0]}m -> {el[-1]}m")

if __name__ == "__main__":
    run()
