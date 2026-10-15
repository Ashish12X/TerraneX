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

def chain_e06():
    base = Path(r"c:\Study\Hekathon\Innotech 2026\Terranex\backend\data")
    geo = json.load(open(base / "osm_roads_raw.geojson", encoding="utf-8"))
    
    ways = {}
    for f in geo["features"]:
        wid = f["properties"].get("@id")
        coords = [[c[1], c[0]] for c in f["geometry"]["coordinates"]] # [lat, lon]
        ways[wid] = coords

    # The 7 ways connecting Phata to Sonprayag/Rampur in order:
    way_order = [
        "way/686083251", # Phata south to north
        "way/686083252",
        "way/226839276",
        "way/820224956",
        "way/1164068085",
        "way/1164068086",
        "way/226839740", # up to Rampur / Sonprayag junction
    ]

    p_phata = [30.6080, 79.0270]
    p_sonprayag = [30.6310, 79.0780]

    chained = []
    current_pt = p_phata

    for wid in way_order:
        w_coords = ways[wid]
        # Check direction: start closer to current_pt or end closer?
        d_start = haversine_m(w_coords[0], current_pt)
        d_end = haversine_m(w_coords[-1], current_pt)
        if d_end < d_start:
            w_coords = list(reversed(w_coords))
        
        # Gap from current_pt
        gap = haversine_m(current_pt, w_coords[0])
        print(f"Adding {wid}: {len(w_coords)} pts, gap from prev: {gap:.1f} m")
        
        if not chained:
            chained.extend(w_coords)
        else:
            chained.extend(w_coords)
        current_pt = chained[-1]

    # Now from current_pt (which is at ~30.6526, 79.0257 near Sitapur) to Sonprayag node
    # Sonprayag is at 30.6310, 79.0780
    gap_sonprayag = haversine_m(current_pt, p_sonprayag)
    print(f"End of OSM ways to Sonprayag node gap: {gap_sonprayag:.1f} m")

    total_len = sum(haversine_m(chained[i], chained[i+1]) for i in range(len(chained)-1)) / 1000.0
    print(f"Chained length of OSM ways: {total_len:.2f} km")

if __name__ == "__main__":
    chain_e06()
