import json
from pathlib import Path
from math import radians, sin, cos, sqrt, atan2

def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # km
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    return R * 2 * atan2(sqrt(a), sqrt(1 - a))

def line_length(coords):
    """Calculate length of a LineString in km"""
    total = 0
    for i in range(len(coords) - 1):
        lon1, lat1 = coords[i]
        lon2, lat2 = coords[i + 1]
        total += haversine(lat1, lon1, lat2, lon2)
    return total

# Load data
with open("data/osm_roads_raw.geojson", encoding="utf-8") as f:
    osm = json.load(f)

with open("data/network.json", encoding="utf-8") as f:
    network = json.load(f)

print("=== Current Edges ===")
for e in network["edges"]:
    print(f"{e['id']}: {e.get('from')} → {e.get('to')} | length: {e.get('length_km')} km | susc: {e.get('susceptibility')}")

print("\n=== OSM Road Lengths (top 10 longest) ===")
segments = []
for feat in osm["features"]:
    coords = feat["geometry"]["coordinates"]
    length = line_length(coords)
    ref = feat["properties"].get("ref", "N/A")
    segments.append((length, ref, coords[0], coords[-1]))

segments.sort(reverse=True)
for length, ref, start, end in segments[:10]:
    print(f"{ref}: {length:.2f} km | start: {start} → end: {end}")