import json
import math
from pathlib import Path

# Haversine distance in meters
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

# Smooth Catmull-Rom or Bezier interpolation between waypoints for mountain trails
def interpolate_trail(waypoints, points_per_segment=15):
    coords = []
    for i in range(len(waypoints) - 1):
        p0 = waypoints[max(0, i - 1)]
        p1 = waypoints[i]
        p2 = waypoints[i + 1]
        p3 = waypoints[min(len(waypoints) - 1, i + 2)]
        
        for t_idx in range(points_per_segment):
            t = t_idx / points_per_segment
            t2 = t * t
            t3 = t2 * t
            
            # Catmull-Rom spline formulation
            lat = 0.5 * (
                (2 * p1[0]) +
                (-p0[0] + p2[0]) * t +
                (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
                (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3
            )
            lon = 0.5 * (
                (2 * p1[1]) +
                (-p0[1] + p2[1]) * t +
                (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
                (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3
            )
            coords.append([round(lat, 5), round(lon, 5)])
    coords.append([round(waypoints[-1][0], 5), round(waypoints[-1][1], 5)])
    return coords

def build_all_edges_geometry():
    base = Path(r"c:\Study\Hekathon\Innotech 2026\Terranex\backend\data")
    with open(base / "network.json", encoding="utf-8") as f:
        net = json.load(f)

    # Let's see: for each edge, generate coordinates
    # We will test fetching OSRM for roads that OSRM has, and Catmull-Rom trail for trek
    pass

if __name__ == "__main__":
    print("Testing spline helper")
    wp = [
        [30.6310, 79.0780], # Sonprayag
        [30.6525, 79.0725], # Gaurikund
        [30.6680, 79.0760], # Jungle Chatti
        [30.6780, 79.0770], # Bhimbali
        [30.6850, 79.0750], # Rambara
    ]
    trail = interpolate_trail(wp, points_per_segment=12)
    print(f"Interpolated trail points: {len(trail)}, Total length: {total_dist_km(trail)} km")
