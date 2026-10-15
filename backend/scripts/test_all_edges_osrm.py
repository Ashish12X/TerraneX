import json
import time
from urllib.request import Request, urlopen
from pathlib import Path

def get_osrm_route(c1, c2, profile="driving"):
    # c is [lat, lon]
    # url takes lon,lat
    url = f"https://router.project-osrm.org/route/v1/{profile}/{c1[1]},{c1[0]};{c2[1]},{c2[0]}?overview=full&geometries=geojson"
    req = Request(url, headers={"User-Agent": "TerranexHackathon/1.0"})
    try:
        with urlopen(req, timeout=12) as r:
            data = json.load(r)
            if "routes" in data and len(data["routes"]) > 0:
                coords = data["routes"][0]["geometry"]["coordinates"] # [lon, lat]
                # convert to [lat, lon]
                lat_lons = [[round(c[1], 5), round(c[0], 5)] for c in coords]
                dist_km = round(data["routes"][0]["distance"] / 1000.0, 1)
                return lat_lons, dist_km
    except Exception as e:
        print(f"Error {profile} {c1} -> {c2}: {e}")
    return None, None

def test_all():
    base = Path(r"c:\Study\Hekathon\Innotech 2026\Terranex\backend\data")
    with open(base / "network.json", encoding="utf-8") as f:
        net = json.load(f)
    nodes = {n["id"]: n for n in net["nodes"]}

    for e in net["edges"]:
        u, v = nodes[e["from"]], nodes[e["to"]]
        p1 = [u["lat"], u["lon"]]
        p2 = [v["lat"], v["lon"]]
        
        # Try driving first
        pts, d_km = get_osrm_route(p1, p2, profile="driving")
        if not pts:
            # Try walking (e.g. for Kedarnath trek)
            pts, d_km = get_osrm_route(p1, p2, profile="foot")
        
        if pts:
            print(f"Edge {e['id']} ({u['name']} -> {v['name']}): SUCCESS! {len(pts)} pts, {d_km} km (current placeholder was {e['length_km']} km)")
        else:
            print(f"Edge {e['id']} ({u['name']} -> {v['name']}): FAILED OSRM")
        time.sleep(0.5)

if __name__ == "__main__":
    test_all()
