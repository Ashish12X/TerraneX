import json
from pathlib import Path

import networkx as nx

from models.risk_model import get_edge_risk, is_blocked

DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "network.json"


def load_network():
    with open(DATA_FILE, encoding="utf-8") as f:
        return json.load(f)


def build_graph(rainfall_mm: float):
    """
    Returns (full_graph, usable_graph).
    full_graph  : saari roads (blocked bhi), risk/blocked attributes ke saath
    usable_graph: sirf unblocked roads
    """
    data = load_network()
    full = nx.Graph()

    for n in data["nodes"]:
        full.add_node(n["id"], name=n["name"], type=n["type"], lat=n.get("lat"), lon=n.get("lon"))

    for e in data["edges"]:
        risk = get_edge_risk(e["susceptibility"], rainfall_mm)
        full.add_edge(
            e["from"], e["to"],
            id=e["id"],
            length_km=e["length_km"],
            risk=risk,
            blocked=is_blocked(risk),
            # risky roads ki cost badhti hai -> router safer road prefer karta hai
            cost=e["length_km"] * (1 + 3 * risk),
            coordinates=e.get("coordinates", []),
        )

    usable = nx.Graph()
    usable.add_nodes_from(full.nodes(data=True))
    usable.add_edges_from(
        (u, v, d) for u, v, d in full.edges(data=True) if not d["blocked"]
    )
    return full, usable


def summarize_path(graph, path):
    edges = [graph[a][b] for a, b in zip(path, path[1:])]
    coords = []
    for a, b in zip(path, path[1:]):
        e = graph[a][b]
        e_coords = e.get("coordinates", [])
        if e_coords:
            u_data = graph.nodes[a]
            p_a = [u_data.get("lat"), u_data.get("lon")]
            if p_a[0] is not None:
                d_start = (e_coords[0][0] - p_a[0])**2 + (e_coords[0][1] - p_a[1])**2
                d_end = (e_coords[-1][0] - p_a[0])**2 + (e_coords[-1][1] - p_a[1])**2
                if d_end < d_start:
                    e_coords = list(reversed(e_coords))
            coords.extend(e_coords)

    return {
        "nodes": path,
        "names": [graph.nodes[n]["name"] for n in path],
        "distance_km": round(sum(e["length_km"] for e in edges), 1),
        "max_edge_risk": max((e["risk"] for e in edges), default=0.0),
        "coordinates": coords,
    }


def nearest_hospital_route(usable, source):
    """Source se sabse sasta (safe) path kisi bhi hospital tak. (path, reachable_count)"""
    hospitals = [n for n, d in usable.nodes(data=True) if d["type"] == "hospital"]
    costs, paths = nx.single_source_dijkstra(usable, source, weight="cost")
    reachable = [h for h in hospitals if h in costs]
    if not reachable:
        return None, 0
    best = min(reachable, key=lambda h: costs[h])
    return paths[best], len(reachable)


def compute_isolation(rainfall_mm: float):
    """Har village ke liye: hospital tak path hai ya nahi."""
    full, usable = build_graph(rainfall_mm)
    results = {}

    for node_id, d in full.nodes(data=True):
        if d["type"] != "village":
            continue
        path, reachable = nearest_hospital_route(usable, node_id)
        if path is None:
            results[node_id] = {"isolated": True, "reachable_hospitals": 0,
                                "isolation_score": 1.0, "route": None}
        else:
            route = summarize_path(usable, path)
            results[node_id] = {"isolated": False, "reachable_hospitals": reachable,
                                "isolation_score": route["max_edge_risk"], "route": route}

    blocked_count = sum(1 for _, _, d in full.edges(data=True) if d["blocked"])
    return results, blocked_count


def get_safe_route(source_id: str, rainfall_mm: float, target_id: str | None = None):
    """Safe route + normal (shortest) route ka comparison."""
    full, usable = build_graph(rainfall_mm)

    if source_id not in full:
        raise ValueError(f"Unknown source: {source_id}")
    if target_id is not None and target_id not in full:
        raise ValueError(f"Unknown target: {target_id}")

    if target_id is None:
        path, _ = nearest_hospital_route(usable, source_id)
        if path is None:
            return {"rainfall_mm": rainfall_mm, "source": source_id, "route_found": False,
                    "message": "Koi hospital reachable nahi hai - village isolated."}
        target_id = path[-1]
    else:
        if not nx.has_path(usable, source_id, target_id):
            return {"rainfall_mm": rainfall_mm, "source": source_id, "target": target_id,
                    "route_found": False,
                    "message": "Blocked roads ki wajah se koi safe route nahi hai."}
        path = nx.dijkstra_path(usable, source_id, target_id, weight="cost")

    # Normal route = sirf distance dekh ke, risk ignore karke
    normal_path = nx.dijkstra_path(full, source_id, target_id, weight="length_km")
    blocked_on_normal = [
        full[a][b]["id"] for a, b in zip(normal_path, normal_path[1:])
        if full[a][b]["blocked"]
    ]

    return {
        "rainfall_mm": rainfall_mm,
        "source": source_id,
        "target": target_id,
        "route_found": True,
        "safe_route": summarize_path(usable, path),
        "normal_route": summarize_path(full, normal_path),
        "normal_route_blocked_edges": blocked_on_normal,
        "rerouted": path != normal_path,
    }

def get_network_state(rainfall_mm: float):
    """Map ke liye: nodes (coordinates + isolated flag) aur roads (risk + blocked)."""
    data = load_network()
    isolation, blocked_count = compute_isolation(rainfall_mm)

    nodes = []
    for n in data["nodes"]:
        item = dict(n)
        if n["type"] == "village":
            item["isolated"] = isolation[n["id"]]["isolated"]
        nodes.append(item)

    edges = []
    for e in data["edges"]:
        risk = get_edge_risk(e["susceptibility"], rainfall_mm)
        edges.append({**e, "risk": risk, "blocked": is_blocked(risk)})

    return {"rainfall_mm": rainfall_mm, "blocked_roads": blocked_count,
            "nodes": nodes, "edges": edges}