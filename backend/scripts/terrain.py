import json
import math
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
NETWORK_FILE = DATA_DIR / "network.json"
OUT_FILE = DATA_DIR / "network_terrain.json"

SAMPLES = 10          # har road par points
SUSC_MIN, SUSC_MAX = 0.25, 0.90


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


def build():
    with open(NETWORK_FILE, encoding="utf-8") as f:
        data = json.load(f)
    nodes = {n["id"]: n for n in data["nodes"]}

    # Har edge ke liye SAMPLES points (real road coordinates along curve if available)
    all_pts, spans = [], []
    for e in data["edges"]:
        if "coordinates" in e and len(e["coordinates"]) >= SAMPLES:
            coords = e["coordinates"]
            pts = [coords[int(i * (len(coords) - 1) / (SAMPLES - 1))] for i in range(SAMPLES)]
        else:
            a, b = nodes[e["from"]], nodes[e["to"]]
            pts = [(a["lat"] + (b["lat"] - a["lat"]) * t / (SAMPLES - 1),
                    a["lon"] + (b["lon"] - a["lon"]) * t / (SAMPLES - 1))
                   for t in range(SAMPLES)]
        spans.append((len(all_pts), len(all_pts) + SAMPLES))
        all_pts.extend(pts)

    elev = fetch_elevations(all_pts)

    for e, (s, t) in zip(data["edges"], spans):
        pts, el = all_pts[s:t], elev[s:t]
        grads = []
        for i in range(len(pts) - 1):
            d = haversine_m(pts[i], pts[i + 1])
            if d > 0:
                grads.append(abs(el[i + 1] - el[i]) / d * 100)
        e["max_gradient_pct"] = round(max(grads), 1)
        e["mean_gradient_pct"] = round(sum(grads) / len(grads), 1)
        e["susceptibility_old"] = e["susceptibility"]

    # 2 km se chhoti roads (hospital connectors): DEM resolution (~90 m) se
    # gradient reliable nahi, to unki susceptibility waisi hi rehti hai (0.10).
    MIN_LEN_KM = 2.0
    rankable = [e for e in data["edges"] if e["length_km"] >= MIN_LEN_KM and e["id"] != "E09"]

    # Point 5: Gradient Noise handling
    # ~90m DEM resolution mein max gradient localized slope noise ho sakta hai.
    # Isliye ranking STRICTLY mean_gradient_pct par based hai; max gradient sirf display ke liye hai.
    order = sorted(rankable, key=lambda x: x["mean_gradient_pct"])
    n = len(order)
    for rank, e in enumerate(order):
        e["susceptibility"] = round(SUSC_MIN + (SUSC_MAX - SUSC_MIN) * rank / (n - 1), 2)
        e["susceptibility_source"] = "dem_terrain_ranking"

    # Point 2: E09 Manual Expert Override (Rambara - Kedarnath trek path)
    # E09 ki susceptibility DEM mean gradient se nahi balki known landslide history ke basis par
    # manual expert override se 0.88 set ki gayi hai.
    # NOTE: E09 is a FOOT TREK (not a motorable road). Rambara to Kedarnath can only
    # be accessed on foot or by helicopter. Susceptibility 0.88 = known landslide-prone
    # corridor (source: manual expert knowledge; NOT glacial moraine or any specific
    # geological survey unless a cited source is added).
    for e in data["edges"]:
        if e["id"] == "E09":
            e["susceptibility"] = 0.88
            e["susceptibility_source"] = "manual_expert_override"
            e["manual_override_reason"] = "known landslide-prone corridor"
            e.setdefault("road_type", "trek")
        elif e["length_km"] < MIN_LEN_KM:
            e["note"] = "short edge: terrain ranking skipped"
            e["susceptibility"] = 0.10
            e["susceptibility_source"] = "short_edge_default"

        # Mark gradient approximation status
        if e["id"] in {"E07", "E08", "E09", "E12"}:
            e["geometry_source"] = "approximated"
            e["gradient_type"] = "approximate"
        else:
            e.setdefault("gradient_type", "dem_survey")

    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    with open(NETWORK_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    for e in data["edges"]:
        src = e.get("susceptibility_source", "dem")
        print(e["id"], f"mean={e['mean_gradient_pct']}%", f"max={e['max_gradient_pct']}%",
              f"susc={e['susceptibility']} ({src})")


if __name__ == "__main__":
    build()
