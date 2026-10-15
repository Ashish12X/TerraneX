"""
Fix E12 Geometry:
Route from Phata [30.6080, 79.0270] directly to Triyuginarayan [30.6560, 79.0980]
staying completely west and away from Sonprayag [30.6310, 79.0780].

Rules:
- geometry_source must remain 'approximated'
- length_km and susceptibility must NOT be changed
- start/end must match nodes exactly
- ratio in mountain road range (1.2 - 1.8)
- min distance to Sonprayag >= 1.2 km
"""
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

def generate_e12_coords():
    p_phata = [30.6080, 79.0270]
    p_triyugi = [30.6560, 79.0980]
    
    # 18 intermediate waypoints bowing north-west to stay safely clear of Sonprayag
    num_wps = 18
    base_wps = []
    for i in range(num_wps + 1):
        t = i / num_wps
        # Bow NW away from Sonprayag (Sonprayag is south-east of this ridge)
        bow = 0.0075 * math.sin(t * math.pi)
        base_lat = p_phata[0] + t * (p_triyugi[0] - p_phata[0]) + bow * 0.7
        base_lon = p_phata[1] + t * (p_triyugi[1] - p_phata[1]) - bow * 0.9
        
        # Mountain switchback oscillation
        sw_sign = 1 if i % 2 == 1 else -1
        sw_amp = 0.0028 * math.sin(t * math.pi)
        base_wps.append([
            round(base_lat + sw_sign * sw_amp * 0.7, 5),
            round(base_lon - sw_sign * sw_amp * 0.7, 5)
        ])

    base_wps[0] = p_phata
    base_wps[-1] = p_triyugi
    return interpolate_spline(base_wps, points_per_seg=6)

def main():
    base_dir = Path(__file__).resolve().parent.parent
    net_path = base_dir / "data" / "network.json"
    
    with open(net_path, "r", encoding="utf-8") as f:
        net = json.load(f)

    sonprayag = [30.6310, 79.0780]
    new_coords = generate_e12_coords()
    
    # Check metrics
    p_phata = [30.6080, 79.0270]
    p_triyugi = [30.6560, 79.0980]
    straight = haversine_m(p_phata, p_triyugi)
    geom_len = sum(haversine_m(new_coords[i], new_coords[i+1]) for i in range(len(new_coords)-1))
    ratio = geom_len / straight
    gaps = [haversine_m(new_coords[i], new_coords[i+1]) for i in range(len(new_coords)-1)]
    max_gap = max(gaps)
    min_dist_sonprayag = min(haversine_m(c, sonprayag) for c in new_coords)
    
    print(f"E12 New Geometry Metrics:")
    print(f"  Straight distance: {straight/1000:.2f} km")
    print(f"  Geometry length:   {geom_len/1000:.2f} km")
    print(f"  Ratio:             {ratio:.2f} (Target 1.2 - 1.8)")
    print(f"  Max gap:           {max_gap:.1f} m (Target <= 500 m)")
    print(f"  Min dist to Sonprayag: {min_dist_sonprayag:.1f} m (Target >= 1200 m)")
    print(f"  Start:             {new_coords[0]} (Error: {haversine_m(new_coords[0], p_phata):.1f} m)")
    print(f"  End:               {new_coords[-1]} (Error: {haversine_m(new_coords[-1], p_triyugi):.1f} m)")
    print(f"  Point count:       {len(new_coords)}")

    # Update network.json
    for e in net["edges"]:
        if e["id"] == "E12":
            old_len = e["length_km"]
            old_susc = e["susceptibility"]
            
            # Apply new coordinates
            e["coordinates"] = new_coords
            e["geometry_source"] = "approximated"
            e["geometry_note"] = "Approximated direct ridge path between Phata and Triyuginarayan, avoiding Sonprayag corridor."
            
            # Strict rule check: length_km and susceptibility must remain untouched
            assert e["length_km"] == old_len, f"length_km changed! {old_len} -> {e['length_km']}"
            assert e["susceptibility"] == old_susc, f"susceptibility changed! {old_susc} -> {e['susceptibility']}"
            print(f"  Preserved length_km: {e['length_km']} km")
            print(f"  Preserved susceptibility: {e['susceptibility']}")
            print(f"  Preserved geometry_source: {e['geometry_source']}")

    with open(net_path, "w", encoding="utf-8") as f:
        json.dump(net, f, indent=2, ensure_ascii=False)
        
    print(f"Successfully updated E12 in {net_path}")

if __name__ == "__main__":
    main()
