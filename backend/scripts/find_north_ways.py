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

def find_phata_sonprayag_ways():
    base = Path(r"c:\Study\Hekathon\Innotech 2026\Terranex\backend\data")
    geo = json.load(open(base / "osm_roads_raw.geojson", encoding="utf-8"))
    
    # Phata: ~30.608, 79.027
    # Sonprayag: ~30.631, 79.078
    # Notice NH107 ways north of Phata (lat >= 30.60)
    print("Ways with lat >= 30.60:")
    for f in geo["features"]:
        coords = f["geometry"]["coordinates"]
        lats = [c[1] for c in coords]
        lons = [c[0] for c in coords]
        if max(lats) >= 30.60:
            wid = f["properties"].get("@id")
            ref = f["properties"].get("ref")
            print(f"{wid}: ref={ref}, pts={len(coords)}, lat=[{min(lats):.4f}, {max(lats):.4f}], lon=[{min(lons):.4f}, {max(lons):.4f}]")

if __name__ == "__main__":
    find_phata_sonprayag_ways()
