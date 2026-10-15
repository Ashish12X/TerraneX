import osmnx as ox
from pathlib import Path

# Smaller bounding box focused on our villages
# (Kedarnath, Sonprayag, Guptkashi, Ukhimath, Augustmuni area)
NORTH = 30.75
SOUTH = 30.45
EAST  = 79.15
WEST  = 78.95

print("Downloading smaller road network from OpenStreetMap...")
print("Area reduced to avoid timeout...")

# Increase timeout
ox.settings.requests_timeout = 300

G = ox.graph_from_bbox(
    bbox=(NORTH, SOUTH, EAST, WEST),
    network_type="drive",
    simplify=True
)

nodes, edges = ox.graph_to_gdfs(G)

print(f"Total edges downloaded: {len(edges)}")

Path("data").mkdir(exist_ok=True)
edges.to_file("data/osm_roads_raw.geojson", driver="GeoJSON")
print("Saved: data/osm_roads_raw.geojson")
print("Done.")