import json
import math
import shutil
from pathlib import Path

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "network.json"
BACKUP_PATH = Path(__file__).resolve().parent.parent / "data" / "network_before_lengths.json"

shutil.copy2(DATA_PATH, BACKUP_PATH)
print(f"Backup created: {BACKUP_PATH}")

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

print(f"{'ID':<5} {'From':<5} {'To':<5} {'Old (km)':<10} {'Geom (km)':<11} {'Diff %':<8} {'Ratio':<8} {'Source':<22} {'Update?'}")
print("-" * 85)

for e in net["edges"]:
    coords = e.get("coordinates", [])
    geom_len = sum(haversine(coords[i], coords[i + 1]) for i in range(len(coords) - 1))
    old_len = e["length_km"]
    source = e.get("geometry_source", "osm")
    diff_pct = abs(geom_len - old_len) / old_len * 100
    ratio = geom_len / old_len
    
    is_approx = source.startswith("approximated")
    should_update = (not is_approx) and (diff_pct > 10.0)
    
    status = "Update" if should_update else ("Unverified (approx)" if is_approx else "Keep (<=10%)")
    print(f"{e['id']:<5} {e['from']:<5} {e['to']:<5} {old_len:<10.1f} {geom_len:<11.2f} {diff_pct:<8.1f} {ratio:<8.2f} {source:<22} {status}")
