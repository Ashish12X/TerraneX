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

def total_len_km(coords):
    return sum(haversine_m(coords[i], coords[i+1]) for i in range(len(coords)-1)) / 1000.0

def interpolate_spline(waypoints, points_per_seg=6):
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

def build_switchback_path(p1, p2, num_turns=10, width_m=250):
    d_lat = p2[0] - p1[0]
    d_lon = p2[1] - p1[1]
    p_norm = math.sqrt(d_lat**2 + d_lon**2)
    perp_lat = (-d_lon / p_norm) * (width_m / 111000.0)
    perp_lon = (d_lat / p_norm) * (width_m / 96000.0)
    
    waypoints = [p1]
    for i in range(1, num_turns):
        t = i / num_turns
        base_lat = p1[0] + t * d_lat
        base_lon = p1[1] + t * d_lon
        sign = 1 if i % 2 == 1 else -1
        waypoints.append([base_lat + sign * perp_lat, base_lon + sign * perp_lon])
    waypoints.append(p2)
    return interpolate_spline(waypoints, points_per_seg=6)

def test_tuning():
    p_sonprayag = [30.6310, 79.0780]
    p_triyugi = [30.6560, 79.0980]
    p_gaurikund = [30.6525, 79.0725]
    p_rambara = [30.6850, 79.0750]
    p_kedarnath = [30.7352, 79.0669]
    
    # E07: Sonprayag to Triyuginarayan (target ~10.5 - 11.5 km)
    e07 = build_switchback_path(p_sonprayag, p_triyugi, num_turns=14, width_m=320)
    
    # E08: Sonprayag to Rambara (target ~14.0 km)
    # Sonprayag -> Gaurikund (~4.5 km) + Gaurikund -> Rambara (~9.5 km)
    sec1 = build_switchback_path(p_sonprayag, p_gaurikund, num_turns=7, width_m=220)
    sec2 = build_switchback_path(p_gaurikund, p_rambara, num_turns=16, width_m=250)
    e08 = sec1[:-1] + sec2
    
    # E09: Rambara to Kedarnath (target ~6.8 - 7.0 km)
    e09 = build_switchback_path(p_rambara, p_kedarnath, num_turns=8, width_m=200)
    
    print(f"E07 length: {total_len_km(e07):.2f} km")
    print(f"E08 length: {total_len_km(e08):.2f} km")
    print(f"E09 length: {total_len_km(e09):.2f} km")

if __name__ == "__main__":
    test_tuning()
