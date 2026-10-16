import json
import math
import shutil
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "network.json"
BACKUP_PATH = BASE_DIR / "data" / "network_before_lengths.json"

# Ensure clean backup from original network.json
shutil.copy2(DATA_PATH, BACKUP_PATH)
print(f"Verified backup at {BACKUP_PATH}")

def haversine(c1, c2):
    R = 6371.0
    lat1, lon1 = math.radians(c1[0]), math.radians(c1[1])
    lat2, lon2 = math.radians(c2[0]), math.radians(c2[1])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))

with open(DATA_PATH, encoding="utf-8") as f:
    net = json.load(f)

nodes = {n["id"]: n["name"] for n in net["nodes"]}

approx_ids = {"E06", "E07", "E08", "E09", "E12"}
osm_ids = {"E01", "E02", "E03", "E04", "E05", "E10", "E11"}

rows = []
for e in net["edges"]:
    coords = e.get("coordinates", [])
    geom_len = sum(haversine(coords[i], coords[i + 1]) for i in range(len(coords) - 1)) if len(coords) > 1 else 0.0
    old_len = float(e["length_km"])
    ratio = geom_len / old_len if old_len > 0 else 0.0
    diff_pct = abs(geom_len - old_len) / old_len * 100.0 if old_len > 0 else 0.0
    
    eid = e["id"]
    is_approx = eid in approx_ids or e.get("geometry_source", "").startswith("approximated")
    
    if is_approx:
        action = "unverified"
        new_len = old_len
    else:
        if diff_pct > 10.0:
            action = f"Update to {round(geom_len, 2)}"
            new_len = round(geom_len, 2)
        else:
            action = "Keep (<=10%)"
            new_len = old_len
            
    rows.append({
        "id": eid,
        "from": e["from"],
        "to": e["to"],
        "from_name": nodes.get(e["from"], e["from"]),
        "to_name": nodes.get(e["to"], e["to"]),
        "old_length_km": old_len,
        "geom_length_km": round(geom_len, 2),
        "ratio": round(ratio, 2),
        "diff_pct": round(diff_pct, 1),
        "is_approx": is_approx,
        "action": action,
        "new_length_km": new_len,
        "source": e.get("geometry_source", "osm")
    })

print(f"{'ID':<5} {'Route':<15} {'Old (km)':<10} {'Geom (km)':<11} {'Ratio':<8} {'Diff %':<8} {'Action':<22}")
print("-" * 85)
for r in rows:
    route = f"{r['from']} -> {r['to']}"
    print(f"{r['id']:<5} {route:<15} {r['old_length_km']:<10.2f} {r['geom_length_km']:<11.2f} {r['ratio']:<8.2f} {r['diff_pct']:<8.1f} {r['action']:<22}")
