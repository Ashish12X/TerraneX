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

def interpolate_spline(waypoints, points_per_seg=8):
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

def build_e06_clean():
    # E06: Phata (30.6080, 79.0270) to Sonprayag (30.6310, 79.0780)
    # Extract real OSM ways along NH107 without the southern Kund detour
    base = Path(r"c:\Study\Hekathon\Innotech 2026\Terranex\backend\data")
    geo = json.load(open(base / "osm_roads_raw.geojson", encoding="utf-8"))
    ways = {f["properties"].get("@id"): [[c[1], c[0]] for c in f["geometry"]["coordinates"]] for f in geo["features"]}
    
    # NH107 ways moving northbound from Phata towards Rampur/Sonprayag
    way_order = [
        "way/686083251",
        "way/686083252",
        "way/226839276",
        "way/820224956",
        "way/1164068085",
        "way/1164068086",
        "way/226839740",
    ]
    
    p_phata = [30.6080, 79.0270]
    p_sonprayag = [30.6310, 79.0780]
    
    chained = [p_phata]
    curr = p_phata
    for wid in way_order:
        w = ways[wid]
        if haversine_m(w[-1], curr) < haversine_m(w[0], curr):
            w = list(reversed(w))
        # Add points, avoiding duplicate adjacent points
        for pt in w:
            if haversine_m(pt, chained[-1]) > 15:
                chained.append(pt)
        curr = chained[-1]
    
    # From the northern road end (near Sitapur/Rampur), connect to Sonprayag node via Mandakini approach
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

def build_e07_clean():
    # E07: Sonprayag (30.6310, 79.0780) to Triyuginarayan (30.6560, 79.0980)
    # Real mountain road climbing ~400m elevation with switchbacks (~11-12 km)
    waypoints = [
        [30.6310, 79.0780], # Sonprayag
        [30.6340, 79.0820],
        [30.6320, 79.0860], # hairpin 1
        [30.6370, 79.0880],
        [30.6350, 79.0920], # hairpin 2
        [30.6410, 79.0900],
        [30.6440, 79.0950], # hairpin 3
        [30.6420, 79.0990],
        [30.6480, 79.0960], # hairpin 4
        [30.6510, 79.1010],
        [30.6540, 79.0970], # hairpin 5
        [30.6560, 79.0980], # Triyuginarayan Temple
    ]
    return interpolate_spline(waypoints, points_per_seg=8)

def build_e08_clean():
    # E08: Sonprayag (30.6310, 79.0780) to Rambara (30.6850, 79.0750)
    # Sonprayag -> Gaurikund (~5km) -> Jungle Chatti (~4km) -> Bheembali (~3km) -> Rambara (~3km)
    # Total trek distance ~14-15 km along Mandakini gorge with switchbacks
    waypoints = [
        [30.6310, 79.0780], # Sonprayag (1850m)
        [30.6360, 79.0750], # Songanga bridge
        [30.6410, 79.0730],
        [30.6460, 79.0710], # Rampur bypass
        [30.6525, 79.0725], # Gaurikund (2040m)
        [30.6560, 79.0760], # Trek trailhead & bridge
        [30.6590, 79.0730], # gorge turn 1
        [30.6620, 79.0770], # gorge turn 2
        [30.6650, 79.0740], # cliff cut
        [30.6680, 79.0760], # Jungle Chatti (2300m)
        [30.6710, 79.0790], # waterfall ascent
        [30.6740, 79.0750], # switchback
        [30.6780, 79.0770], # Bheembali camp (2550m)
        [30.6810, 79.0800], # high gorge slope
        [30.6830, 79.0760], # bridge approach
        [30.6850, 79.0750], # Rambara (2700m)
    ]
    return interpolate_spline(waypoints, points_per_seg=8)

def build_e09_clean():
    # E09: Rambara (30.6850, 79.0750) to Kedarnath (30.7352, 79.0669)
    # Rambara -> Chhoti Lincholi -> Badi Lincholi -> Base Camp -> Kedarnath (~7 km)
    waypoints = [
        [30.6850, 79.0750], # Rambara
        [30.6910, 79.0780], # Lincholi ascent
        [30.6970, 79.0760], # Chhoti Lincholi
        [30.7040, 79.0790], # ridge bend
        [30.7100, 79.0770], # Badi Lincholi
        [30.7180, 79.0740], # high valley
        [30.7250, 79.0700], # Base Camp
        [30.7300, 79.0680], # temple path
        [30.7352, 79.0669], # Kedarnath Temple
    ]
    return interpolate_spline(waypoints, points_per_seg=8)

if __name__ == "__main__":
    e06 = build_e06_clean()
    e07 = build_e07_clean()
    e08 = build_e08_clean()
    e09 = build_e09_clean()
    print(f"Clean E06: {len(e06)} pts, {total_len_km(e06):.2f} km")
    print(f"Clean E07: {len(e07)} pts, {total_len_km(e07):.2f} km")
    print(f"Clean E08: {len(e08)} pts, {total_len_km(e08):.2f} km")
    print(f"Clean E09: {len(e09)} pts, {total_len_km(e09):.2f} km")
