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

def main():
    base = Path(r"c:\Study\Hekathon\Innotech 2026\Terranex\backend\data")
    net = json.load(open(base / "network.json", encoding="utf-8"))
    backup = json.load(open(base / "network_backup.json", encoding="utf-8"))
    nodes = {n["id"]: n["name"] for n in net["nodes"]}
    backup_lens = {e["id"]: e["length_km"] for e in backup["edges"]}

    print("| Edge | From -> To | Nodes | Purani Length (Original Backup) | Current network.json | Geometry Actual Length | Mismatch? |")
    print("|---|---|---|---|---|---|---|")
    for e in net["edges"]:
        coords = e.get("coordinates", [])
        geom_len = sum(haversine_m(coords[i], coords[i+1]) for i in range(len(coords)-1)) / 1000.0 if len(coords) > 1 else 0.0
        old_len = backup_lens.get(e["id"], e.get("length_km"))
        curr_len = e["length_km"]
        mismatch = "YES" if abs(old_len - geom_len) > 0.5 else "NO"
        from_name = nodes.get(e["from"], e["from"])
        to_name = nodes.get(e["to"], e["to"])
        print(f"| {e['id']} | {e['from']} -> {e['to']} | {from_name} -> {to_name} | {old_len} km | {curr_len} km | {geom_len:.1f} km | {mismatch} |")

if __name__ == "__main__":
    main()
