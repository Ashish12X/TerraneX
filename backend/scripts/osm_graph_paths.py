import json
from pathlib import Path
from collections import defaultdict
import networkx as nx

def main():
    base = Path(r"c:\Study\Hekathon\Innotech 2026\Terranex\backend\data")
    with open(base / "osm_roads_raw.geojson", encoding="utf-8") as f:
        geo = json.load(f)
    with open(base / "network.json", encoding="utf-8") as f:
        net = json.load(f)

    # Let's build a NetworkX spatial graph from OSM LineStrings
    G = nx.Graph()
    for f in geo["features"]:
        coords = f["geometry"]["coordinates"] # [lon, lat]
        for i in range(len(coords) - 1):
            p1 = (round(coords[i][1], 5), round(coords[i][0], 5))
            p2 = (round(coords[i+1][1], 5), round(coords[i+1][0], 5))
            # Euclidean distance or haversine
            dist = ((p1[0]-p2[0])**2 + (p1[1]-p2[1])**2)**0.5
            G.add_edge(p1, p2, weight=dist)

    print("OSM Graph Nodes:", G.number_of_nodes(), "Edges:", G.number_of_edges())

    # Map each network node to closest node in G
    closest = {}
    for n in net["nodes"]:
        n_pt = (n["lat"], n["lon"])
        best_node = None
        best_d = 999
        for g_pt in G.nodes():
            d = ((g_pt[0]-n_pt[0])**2 + (g_pt[1]-n_pt[1])**2)**0.5
            if d < best_d:
                best_d = d
                best_node = g_pt
        closest[n["id"]] = (best_node, best_d)
        print(f"{n['id']} ({n['name']}): closest in G is {best_node} (dist ~ {best_d*111:.2f} km)")

    # Check which edge pairs can find a path in G
    for e in net["edges"]:
        u, v = e["from"], e["to"]
        p_u = closest[u][0]
        p_v = closest[v][0]
        if nx.has_path(G, p_u, p_v):
            path = nx.shortest_path(G, p_u, p_v, weight="weight")
            print(f"Edge {e['id']} ({u}->{v}): FOUND OSM PATH with {len(path)} points!")
        else:
            print(f"Edge {e['id']} ({u}->{v}): NO OSM path between {u} and {v}")

if __name__ == "__main__":
    main()
