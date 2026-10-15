import json
from pathlib import Path

DATA_DIR = Path(r"c:\Study\Hekathon\Innotech 2026\Terranex\backend\data")
NETWORK_FILE = DATA_DIR / "network.json"
BACKUP_FILE = DATA_DIR / "network_backup.json"

def apply_fixes():
    with open(NETWORK_FILE, encoding="utf-8") as f:
        net = json.load(f)
    with open(BACKUP_FILE, encoding="utf-8") as f:
        backup = json.load(f)

    backup_lens = {e["id"]: e["length_km"] for e in backup["edges"]}

    # Geometry sources:
    # E07, E08, E09, E12 are approximated waypoints/splines
    # E01, E02, E03, E04, E05, E06, E10, E11 are from OSM/OSRM
    approx_edges = {"E07", "E08", "E09", "E12"}

    # 1. Restore length_km to original backup lengths as requested in Point 4
    for e in net["edges"]:
        eid = e["id"]
        if eid in backup_lens:
            e["length_km"] = backup_lens[eid]
        
        # 2. Add geometry_source
        if eid in approx_edges:
            e["geometry_source"] = "approximated"
        else:
            e["geometry_source"] = "osm"

    # 3. Calculate susceptibility strictly on mean_gradient_pct (Point 5)
    # Hospital connectors (< 2 km): E10, E11
    MIN_LEN_KM = 2.0
    rankable = [e for e in net["edges"] if e["length_km"] >= MIN_LEN_KM and e["id"] != "E09"]
    order = sorted(rankable, key=lambda x: x["mean_gradient_pct"])
    
    SUSC_MIN, SUSC_MAX = 0.25, 0.90
    n = len(order)
    for rank, e in enumerate(order):
        e["susceptibility"] = round(SUSC_MIN + (SUSC_MAX - SUSC_MIN) * rank / (n - 1), 2)
        e["susceptibility_source"] = "dem_terrain_ranking"

    # Point 2: E09 Manual Expert Override
    for e in net["edges"]:
        if e["id"] == "E09":
            e["susceptibility"] = 0.88
            e["susceptibility_source"] = "manual_expert_override"
            e["manual_override_reason"] = "known landslide-prone corridor"
        elif e["length_km"] < MIN_LEN_KM:
            e["susceptibility"] = 0.10
            e["susceptibility_source"] = "short_edge_default"
            e["note"] = "short edge: terrain ranking skipped"

    with open(NETWORK_FILE, "w", encoding="utf-8") as f:
        json.dump(net, f, indent=2, ensure_ascii=False)
    print("Applied fixes to network.json successfully!")

if __name__ == "__main__":
    apply_fixes()
