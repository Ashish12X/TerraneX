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

# Add switchback loops between waypoints to represent mountain hairpins
def generate_mountain_switchbacks(start_pt, end_pt, num_hairpins=12, amplitude_deg=0.005, points_per_turn=6):
    coords = []
    lat1, lon1 = start_pt
    lat2, lon2 = end_pt
    
    # Unit vector from start to end
    d_lat = lat2 - lat1
    d_lon = lon2 - lon1
    length = math.sqrt(d_lat**2 + d_lon**2)
    u_lat = d_lat / length
    u_lon = d_lon / length
    
    # Perpendicular vector
    p_lat = -u_lon
    p_lon = u_lat
    
    total_steps = num_hairpins * 2
    for s in range(total_steps + 1):
        t = s / total_steps
        base_lat = lat1 + t * d_lat
        base_lon = lon1 + t * d_lon
        
        # Sine wave modulation for hairpins
        offset = amplitude_deg * math.sin(s * math.pi)
        h_lat = base_lat + offset * p_lat
        h_lon = base_lon + offset * p_lon
        coords.append([round(h_lat, 5), round(h_lon, 5)])
        
    return coords

def build_e07_switchbacks():
    # Sonprayag (30.6310, 79.0780) to Triyuginarayan (30.6560, 79.0980)
    # The motorable road via Sitapur/Toshi has ~18 hairpins, ~11-12 km
    p1 = [30.6310, 79.0780]
    p2 = [30.6560, 79.0980]
    # We create 16 switchback bends with 0.0055 deg amplitude (~600m lateral traverse)
    coords = generate_mountain_switchbacks(p1, p2, num_hairpins=15, amplitude_deg=0.006)
    coords[0] = p1
    coords[-1] = p2
    return coords

def build_e08_trek():
    # E08: Sonprayag (30.6310, 79.0780) to Rambara (30.6850, 79.0750)
    # Target length: ~14.0 km
    # Section 1: Sonprayag to Gaurikund (~5 km along valley)
    # Section 2: Gaurikund to Rambara (~9 km steep pilgrimage gorge trek with switchbacks)
    p_sonprayag = [30.6310, 79.0780]
    p_gaurikund = [30.6525, 79.0725]
    p_rambara = [30.6850, 79.0750]
    
    sec1 = generate_mountain_switchbacks(p_sonprayag, p_gaurikund, num_hairpins=6, amplitude_deg=0.004)
    sec2 = generate_mountain_switchbacks(p_gaurikund, p_rambara, num_hairpins=16, amplitude_deg=0.005)
    
    coords = sec1[:-1] + sec2
    coords[0] = p_sonprayag
    coords[-1] = p_rambara
    return coords

if __name__ == "__main__":
    e07 = build_e07_switchbacks()
    e08 = build_e08_trek()
    print(f"E07 switchback road: {len(e07)} pts, {total_len_km(e07):.2f} km")
    print(f"E08 pilgrimage trek: {len(e08)} pts, {total_len_km(e08):.2f} km")
