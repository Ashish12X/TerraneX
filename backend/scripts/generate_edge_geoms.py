import json
import time
import math
from pathlib import Path
from urllib.request import Request, urlopen

DATA_DIR = Path(r"c:\Study\Hekathon\Innotech 2026\Terranex\backend\data")

def haversine_m(c1, c2):
    R = 6371000
    p1, p2 = math.radians(c1[0]), math.radians(c2[0])
    dp = p2 - p1
    dl = math.radians(c2[1] - c1[1])
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))

def total_dist_km(coords):
    d = 0.0
    for i in range(len(coords) - 1):
        d += haversine_m(coords[i], coords[i+1])
    return round(d / 1000.0, 1)

def get_osrm_route(c1, c2):
    url = f"https://router.project-osrm.org/route/v1/driving/{c1[1]},{c1[0]};{c2[1]},{c2[0]}?overview=full&geometries=geojson"
    req = Request(url, headers={"User-Agent": "TerranexHackathon/1.0"})
    try:
        with urlopen(req, timeout=12) as r:
            data = json.load(r)
            if "routes" in data and len(data["routes"]) > 0:
                coords = data["routes"][0]["geometry"]["coordinates"] # [lon, lat]
                return [[round(c[1], 5), round(c[0], 5)] for c in coords]
    except Exception as e:
        print(f"OSRM error {c1} -> {c2}: {e}")
    return None

def interpolate_spline(waypoints, points_per_seg=10):
    coords = []
    for i in range(len(waypoints) - 1):
        p0 = waypoints[max(0, i - 1)]
        p1 = waypoints[i]
        p2 = waypoints[i + 1]
        p3 = waypoints[min(len(waypoints) - 1, i + 2)]
        for t_idx in range(points_per_seg):
            t = t_idx / points_per_seg
            t2 = t * t
            t3 = t2 * t
            lat = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t +
                         (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
                         (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3)
            lon = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t +
                         (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
                         (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
            coords.append([round(lat, 5), round(lon, 5)])
    coords.append([round(waypoints[-1][0], 5), round(waypoints[-1][1], 5)])
    return coords

def main():
    with open(DATA_DIR / "network.json", encoding="utf-8") as f:
        net = json.load(f)
    nodes = {n["id"]: n for n in net["nodes"]}

    # Specific mountain waypoints for trails not in driving OSRM:
    # E07: Sonprayag to Triyuginarayan (ascent up mountain ridge)
    e07_waypoints = [
        [30.6310, 79.0780], # Sonprayag
        [30.6350, 79.0830],
        [30.6410, 79.0890],
        [30.6480, 79.0940],
        [30.6560, 79.0980], # Triyuginarayan
    ]
    # E08: Sonprayag to Rambara (lower Kedarnath pilgrimage gorge)
    e08_waypoints = [
        [30.6310, 79.0780], # Sonprayag
        [30.6420, 79.0750],
        [30.6525, 79.0725], # Gaurikund
        [30.6620, 79.0740],
        [30.6680, 79.0760], # Jungle Chatti
        [30.6780, 79.0770], # Bhimbali
        [30.6850, 79.0750], # Rambara
    ]
    # E09: Rambara to Kedarnath (upper Kedarnath valley glacier trail)
    e09_waypoints = [
        [30.6850, 79.0750], # Rambara
        [30.6970, 79.0760], # Chhoti Lincholi
        [30.7100, 79.0770], # Badi Lincholi
        [30.7250, 79.0700], # Base Camp
        [30.7310, 79.0680],
        [30.7352, 79.0669], # Kedarnath Temple
    ]
    # E12: Phata to Triyuginarayan
    e12_waypoints = [
        [30.6080, 79.0270], # Phata
        [30.6150, 79.0390],
        [30.6230, 79.0550],
        [30.6310, 79.0780], # Sonprayag junction
        [30.6420, 79.0900],
        [30.6560, 79.0980], # Triyuginarayan
    ]

    edge_geoms = {}

    for e in net["edges"]:
        eid = e["id"]
        u, v = nodes[e["from"]], nodes[e["to"]]
        p1 = [u["lat"], u["lon"]]
        p2 = [v["lat"], v["lon"]]

        if eid == "E07":
            edge_geoms[eid] = interpolate_spline(e07_waypoints, points_per_seg=8)
        elif eid == "E08":
            edge_geoms[eid] = interpolate_spline(e08_waypoints, points_per_seg=10)
        elif eid == "E09":
            edge_geoms[eid] = interpolate_spline(e09_waypoints, points_per_seg=10)
        elif eid == "E12":
            edge_geoms[eid] = interpolate_spline(e12_waypoints, points_per_seg=8)
        else:
            # Try OSRM
            print(f"Fetching OSRM for {eid} ({u['name']} -> {v['name']})...")
            coords = get_osrm_route(p1, p2)
            if coords and len(coords) > 2:
                # Downsample if too large (> 120 pts) for fast frontend rendering
                if len(coords) > 100:
                    step = max(1, len(coords) // 80)
                    downsampled = [coords[0]] + coords[1:-1:step] + [coords[-1]]
                    coords = downsampled
                edge_geoms[eid] = coords
            else:
                # Fallback to 2-point direct or simple spline
                edge_geoms[eid] = [p1, p2]
            time.sleep(0.4)

        print(f"Edge {eid}: {len(edge_geoms[eid])} coordinates, dist={total_dist_km(edge_geoms[eid])} km")

    # Save to a temporary json to inspect
    with open(DATA_DIR / "edge_geometries.json", "w", encoding="utf-8") as f:
        json.dump(edge_geoms, f, indent=2)
    print("Done! Saved edge_geometries.json")

if __name__ == "__main__":
    main()
