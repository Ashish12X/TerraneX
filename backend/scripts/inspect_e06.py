import json
from pathlib import Path
import math

def haversine_m(c1, c2):
    R = 6371000
    p1, p2 = math.radians(c1[0]), math.radians(c2[0])
    dp = p2 - p1
    dl = math.radians(c2[1] - c1[1])
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))

def inspect_e06():
    base = Path(r"c:\Study\Hekathon\Innotech 2026\Terranex\backend\data")
    net = json.load(open(base / "network.json", encoding="utf-8"))
    e06 = next(e for e in net["edges"] if e["id"] == "E06")
    coords = e06["coordinates"]
    print(f"E06 total points: {len(coords)}")
    for i in range(len(coords) - 1):
        d = haversine_m(coords[i], coords[i+1])
        if d > 1000:
            print(f"Large jump at index {i} -> {i+1}: {d:.1f} m between {coords[i]} and {coords[i+1]}")
    
    # Check bounding box and progress
    print("Start:", coords[0])
    print("End:", coords[-1])
    min_lat = min(c[0] for c in coords)
    max_lat = max(c[0] for c in coords)
    min_lon = min(c[1] for c in coords)
    max_lon = max(c[1] for c in coords)
    print(f"Lat range: [{min_lat:.4f}, {max_lat:.4f}], Lon range: [{min_lon:.4f}, {max_lon:.4f}]")

if __name__ == "__main__":
    inspect_e06()
