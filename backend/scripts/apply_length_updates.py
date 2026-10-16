import json
import math
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "network.json"

def haversine(c1, c2):
    R = 6371.0
    lat1, lon1 = math.radians(c1[0]), math.radians(c1[1])
    lat2, lon2 = math.radians(c2[0]), math.radians(c2[1])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))

with open(DATA_PATH, "r", encoding="utf-8") as f:
    net = json.load(f)

approx_ids = {"E06", "E07", "E08", "E09", "E12"}
updated = []

for e in net["edges"]:
    eid = e["id"]
    coords = e.get("coordinates", [])
    geom_len = sum(haversine(coords[i], coords[i + 1]) for i in range(len(coords) - 1)) if len(coords) > 1 else 0.0
    old_len = e["length_km"]
    diff_pct = abs(geom_len - old_len) / old_len * 100.0 if old_len > 0 else 0.0

    if eid in approx_ids or e.get("geometry_source", "").startswith("approximated"):
        print(f"Skipping approx edge {eid}: keeping {old_len} km")
        continue

    if diff_pct > 10.0:
        new_len = round(geom_len, 2)
        e["length_km"] = new_len
        updated.append((eid, old_len, new_len, diff_pct))
        print(f"Updated OSM edge {eid}: {old_len} -> {new_len} km (diff: {diff_pct:.1f}%)")
    else:
        print(f"Keeping OSM edge {eid}: {old_len} km (diff: {diff_pct:.1f}% <= 10%)")

with open(DATA_PATH, "w", encoding="utf-8") as f:
    json.dump(net, f, indent=2)

print("\nSaved updated network.json successfully.")
print(f"Total updated edges: {len(updated)}")
