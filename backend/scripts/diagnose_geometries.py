import json
import math
from pathlib import Path

def haversine_m(c1, c2):
    R = 6371000
    p1, p2 = math.radians(c1[0]), math.radians(c2[0])
    dp = p2 - p1
    dl = math.radians(c2[1] - c1[1])
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))

def check_backtracking(coords):
    # Check if any segment reverses back on itself or loops back
    # E.g., if a point p_i is closer to a past point p_j (where j < i - 4) than step distance
    # Or angle between consecutive vectors > 160 degrees and distance reversed
    backtracking = False
    reversals = 0
    for i in range(len(coords) - 2):
        d1 = haversine_m(coords[i], coords[i+1])
        d2 = haversine_m(coords[i+1], coords[i+2])
        d_skip = haversine_m(coords[i], coords[i+2])
        # If triangle collapses (i -> i+1 -> i+2, where i+2 goes back to near i)
        if d1 > 20 and d2 > 20 and d_skip < 0.2 * min(d1, d2):
            reversals += 1
    # Also check duplicate points
    duplicates = len(coords) - len(set((c[0], c[1]) for c in coords))
    if reversals > 0 or duplicates > 3:
        backtracking = True
    return backtracking, reversals, duplicates

def main():
    base = Path(r"c:\Study\Hekathon\Innotech 2026\Terranex\backend\data")
    with open(base / "network.json", encoding="utf-8") as f:
        net = json.load(f)
    nodes = {n["id"]: n for n in net["nodes"]}

    print(f"| Edge | From -> To | Straight (km) | Geom Len (km) | Ratio | Max Gap (m) | Backtracking? | Start dist (m) | End dist (m) | Flag |")
    print(f"|---|---|---|---|---|---|---|---|---|---|")

    for e in net["edges"]:
        u, v = nodes[e["from"]], nodes[e["to"]]
        p_u = [u["lat"], u["lon"]]
        p_v = [v["lat"], v["lon"]]
        
        straight_km = haversine_m(p_u, p_v) / 1000.0
        coords = e.get("coordinates", [])
        
        if len(coords) < 2:
            geom_km = straight_km
            max_gap = 0
            ratio = 1.0
            bt_str = "nahi"
            start_m = 0
            end_m = 0
        else:
            geom_km = sum(haversine_m(coords[i], coords[i+1]) for i in range(len(coords)-1)) / 1000.0
            ratio = geom_km / straight_km if straight_km > 0 else 1.0
            gaps = [haversine_m(coords[i], coords[i+1]) for i in range(len(coords)-1)]
            max_gap = max(gaps) if gaps else 0
            bt, revs, dups = check_backtracking(coords)
            bt_str = f"HAAN ({revs} rev, {dups} dup)" if bt else "nahi"
            start_m = haversine_m(coords[0], p_u)
            end_m = haversine_m(coords[-1], p_v)

        flags = []
        if ratio < 1.1 or ratio > 2.0:
            flags.append(f"Ratio={ratio:.2f}")
        if max_gap > 500:
            flags.append(f"Gap={max_gap:.0f}m")
        flag_str = ", ".join(flags) if flags else "OK"

        print(f"| {e['id']} | {u['name']} -> {v['name']} | {straight_km:.2f} | {geom_km:.2f} | {ratio:.2f} | {max_gap:.0f} m | {bt_str} | {start_m:.1f} m | {end_m:.1f} m | {flag_str} |")

if __name__ == "__main__":
    main()
