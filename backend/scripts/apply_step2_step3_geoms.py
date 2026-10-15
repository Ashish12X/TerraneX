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

def build_e06_clean():
    base = Path(r"c:\Study\Hekathon\Innotech 2026\Terranex\backend\data")
    geo = json.load(open(base / "osm_roads_raw.geojson", encoding="utf-8"))
    ways = {f["properties"].get("@id"): [[c[1], c[0]] for c in f["geometry"]["coordinates"]] for f in geo["features"]}
    way_order = [
        "way/686083251", "way/686083252", "way/226839276",
        "way/820224956", "way/1164068085", "way/1164068086", "way/226839740"
    ]
    p_phata = [30.6080, 79.0270]
    p_sonprayag = [30.6310, 79.0780]
    chained = [p_phata]
    curr = p_phata
    for wid in way_order:
        w = ways[wid]
        if haversine_m(w[-1], curr) < haversine_m(w[0], curr):
            w = list(reversed(w))
        for pt in w:
            if haversine_m(pt, chained[-1]) > 15:
                chained.append(pt)
        curr = chained[-1]
    approach_waypoints = [
        chained[-1],
        [30.6480, 79.0450],
        [30.6420, 79.0600],
        [30.6360, 79.0700],
        p_sonprayag
    ]
    approach = interpolate_spline(approach_waypoints, points_per_seg=6)
    for pt in approach[1:]:
        if haversine_m(pt, chained[-1]) > 15:
            chained.append(pt)
    chained[-1] = p_sonprayag
    return chained

def main():
    base = Path(r"c:\Study\Hekathon\Innotech 2026\Terranex\backend\data")
    net = json.load(open(base / "network.json", encoding="utf-8"))
    backup = json.load(open(base / "network_backup.json", encoding="utf-8"))
    backup_lens = {e["id"]: e["length_km"] for e in backup["edges"]}

    p_sonprayag = [30.6310, 79.0780]
    p_triyugi = [30.6560, 79.0980]
    p_gaurikund = [30.6525, 79.0725]
    p_rambara = [30.6850, 79.0750]
    p_kedarnath = [30.7352, 79.0669]

    e06_coords = build_e06_clean()
    e07_coords = build_switchback_path(p_sonprayag, p_triyugi, num_turns=17, width_m=340)
    sec1 = build_switchback_path(p_sonprayag, p_gaurikund, num_turns=8, width_m=240)
    sec2 = build_switchback_path(p_gaurikund, p_rambara, num_turns=18, width_m=290)
    e08_coords = sec1[:-1] + sec2
    e09_coords = build_switchback_path(p_rambara, p_kedarnath, num_turns=10, width_m=220)

    for e in net["edges"]:
        # Ensure length_km remains PURANI backup length as commanded in Step 4
        e["length_km"] = backup_lens.get(e["id"], e["length_km"])
        if e["id"] == "E06":
            e["coordinates"] = e06_coords
        elif e["id"] == "E07":
            e["coordinates"] = e07_coords
        elif e["id"] == "E08":
            e["coordinates"] = e08_coords
        elif e["id"] == "E09":
            e["coordinates"] = e09_coords

    with open(base / "network.json", "w", encoding="utf-8") as f:
        json.dump(net, f, indent=2, ensure_ascii=False)
    print("Updated E06, E07, E08, E09 clean geometries in network.json (length_km kept purani)!")

if __name__ == "__main__":
    main()
