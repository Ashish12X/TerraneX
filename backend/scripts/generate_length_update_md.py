import json
import math
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "network.json"
MD_PATH = BASE_DIR / "scripts" / "length_update.md"

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

lines = []
lines.append("# Network Edge Length Update Report")
lines.append("")
lines.append("## Overview")
lines.append("- **Backup File**: `backend/data/network_before_lengths.json`")
lines.append("- **Policy**:")
lines.append("  1. **Approximated Edges (`E06, E07, E08, E09, E12`)**: Inki geometry natural switchback splines se approximated hai, isliye geometry length par bharosa kam hai. Un par `length_km` change **nahi** kiya gaya hai, sirf report mein `unverified` mark kiya gaya hai.")
lines.append("  2. **OSM-based Edges (`E01–E05, E10, E11`)**: OpenStreetMap highway alignments par calibrated hain. Jahan farak > 10% hai, sirf unki `length_km` geometry length se update ki gayi hai.")
lines.append("")
lines.append("## Edge Length Comparison Table")
lines.append("")
lines.append("| Edge | Nodes | Route Name | Purani length_km | Geometry Length (km) | Ratio (Geom/Old) | Farak (%) | Geometry Source | Status / Action | Nayi length_km |")
lines.append("|---|---|---|---|---|---|---|---|---|---|")

for e in net["edges"]:
    coords = e.get("coordinates", [])
    geom_len = sum(haversine(coords[i], coords[i + 1]) for i in range(len(coords) - 1)) if len(coords) > 1 else 0.0
    old_len = float(e["length_km"])
    ratio = geom_len / old_len if old_len > 0 else 0.0
    diff_pct = abs(geom_len - old_len) / old_len * 100.0 if old_len > 0 else 0.0
    
    eid = e["id"]
    is_approx = eid in approx_ids or e.get("geometry_source", "").startswith("approximated")
    source = e.get("geometry_source", "osm")
    
    if is_approx:
        status = "unverified"
        new_len = old_len
    else:
        if diff_pct > 10.0:
            status = "Updated (>10% diff)"
            new_len = round(geom_len, 2)
        else:
            status = "Keep (<=10% diff)"
            new_len = old_len
            
    from_name = nodes.get(e["from"], e["from"])
    to_name = nodes.get(e["to"], e["to"])
    route_name = f"{from_name} — {to_name}"
    
    lines.append(f"| {eid} | `{e['from']}` → `{e['to']}` | {route_name} | {old_len:.2f} | {geom_len:.2f} | {ratio:.2f} | {diff_pct:.1f}% | `{source}` | **{status}** | **{new_len:.2f}** |")

lines.append("")
lines.append("## Summary of Updates")
lines.append("- **Updated Edges**: `E03` (30.00 → 21.85 km), `E04` (14.00 → 16.74 km), `E05` (20.00 → 22.84 km), `E10` (0.50 → 0.17 km), `E11` (0.50 → 0.41 km)")
lines.append("- **Retained OSM Edges (Diff <= 10%)**: `E01` (18.00 km, 1.1% diff), `E02` (27.00 km, 0.2% diff)")
lines.append("- **Approximated Edges Marked `unverified` (Retained unchanged)**: `E06` (22.00 km), `E07` (12.00 km), `E08` (16.00 km), `E09` (7.00 km), `E12` (25.00 km)")
lines.append("")

with open(MD_PATH, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")

print(f"Generated {MD_PATH}")
