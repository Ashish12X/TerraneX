"""
Terranex - District-wide Network Builder (v2)
Builds network_v2.json from OpenStreetMap GeoJSON (backend/data/osm_district.geojson).
Includes ~500m road segmentation, junction graph, settlement/hospital snapping,
and batched Open-Meteo elevation/slope profiling with local caching.
"""

import json
import math
import os
import sys
import time
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlencode

import networkx as nx
from shapely.geometry import shape, Point, LineString, MultiLineString

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
DATA_DIR = BACKEND_DIR / "data"

INPUT_GEOJSON = DATA_DIR / "osm_district.geojson"
OUTPUT_NETWORK_V2 = DATA_DIR / "network_v2.json"
ELEVATION_CACHE_FILE = DATA_DIR / "elevation_cache.json"

SEGMENT_TARGET_KM = 0.50  # ~500m
MAX_SNAP_DISTANCE_KM = 1.0  # Max distance to connect a village to nearest road

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = (math.sin(dphi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2)
    return 2.0 * R * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

def linestring_length_km(coords):
    total = 0.0
    for i in range(len(coords) - 1):
        total += haversine_km(coords[i][1], coords[i][0], coords[i+1][1], coords[i+1][0])
    return total

def split_linestring(coords, target_km=0.5):
    """Splits a list of [lon, lat] coordinates into segments of roughly target_km."""
    if len(coords) < 2:
        return []
    
    total_len = linestring_length_km(coords)
    if total_len <= target_km * 1.4:
        return [coords]
    
    num_pieces = max(1, round(total_len / target_km))
    step_km = total_len / num_pieces
    
    segments = []
    current_piece = [coords[0]]
    current_len = 0.0
    
    for i in range(len(coords) - 1):
        p1 = coords[i]
        p2 = coords[i+1]
        seg_len = haversine_km(p1[1], p1[0], p2[1], p2[0])
        
        if current_len + seg_len < step_km:
            current_piece.append(p2)
            current_len += seg_len
        else:
            # Interpolate break points
            remaining_needed = step_km - current_len
            ratio = remaining_needed / seg_len if seg_len > 0 else 0
            interp_lon = p1[0] + ratio * (p2[0] - p1[0])
            interp_lat = p1[1] + ratio * (p2[1] - p1[1])
            split_pt = [round(interp_lon, 6), round(interp_lat, 6)]
            
            current_piece.append(split_pt)
            segments.append(current_piece)
            
            # Start next piece
            current_piece = [split_pt, p2]
            current_len = haversine_km(split_pt[1], split_pt[0], p2[1], p2[0])
            
    if len(current_piece) >= 2:
        segments.append(current_piece)
        
    return segments

def load_elevation_cache():
    if ELEVATION_CACHE_FILE.exists():
        try:
            with open(ELEVATION_CACHE_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_elevation_cache(cache):
    with open(ELEVATION_CACHE_FILE, "w") as f:
        json.dump(cache, f)

def fetch_elevations_batch(points, cache):
    """
    points: list of (lat, lon)
    Returns: dict of {(lat, lon): elevation}
    Batches up to 90 points per Open-Meteo call, respects rate limit.
    """
    to_fetch = []
    for lat, lon in points:
        key = f"{round(lat, 4)},{round(lon, 4)}"
        if key not in cache:
            to_fetch.append((round(lat, 4), round(lon, 4)))
    
    # Remove duplicates
    to_fetch = list(dict.fromkeys(to_fetch))
    
    if to_fetch:
        print(f"Fetching {len(to_fetch)} new elevation points in batches from Open-Meteo...")
        batch_size = 80
        for i in range(0, len(to_fetch), batch_size):
            chunk = to_fetch[i:i+batch_size]
            lats_str = ",".join(str(p[0]) for p in chunk)
            lons_str = ",".join(str(p[1]) for p in chunk)
            url = f"https://api.open-meteo.com/v1/elevation?latitude={lats_str}&longitude={lons_str}"
            req = Request(url, headers={"User-Agent": "Terranex-DistrictBuilder/2.0"})
            try:
                with urlopen(req, timeout=25) as resp:
                    data = json.load(resp)
                    elevs = data.get("elevation", [])
                    for pt, el in zip(chunk, elevs):
                        cache[f"{pt[0]},{pt[1]}"] = el
                time.sleep(0.3)  # Respect rate limit
            except Exception as e:
                print(f"Warning: Elevation batch {i//batch_size} failed: {e}")
                time.sleep(1.0)
        save_elevation_cache(cache)
        
    results = {}
    for lat, lon in points:
        key = f"{round(lat, 4)},{round(lon, 4)}"
        results[(lat, lon)] = cache.get(key, 1500.0)
    return results

def main():
    print("=" * 70)
    print("TERRANEX: DISTRICT ROAD NETWORK BUILDER (v2)")
    print("=" * 70)
    
    if not INPUT_GEOJSON.exists():
        print(f"ERROR: Input file not found: {INPUT_GEOJSON}")
        print("\nPlease run the Overpass Turbo query and save the GeoJSON export to:")
        print(f"  {INPUT_GEOJSON}")
        sys.exit(1)
        
    print(f"Reading {INPUT_GEOJSON}...")
    with open(INPUT_GEOJSON, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    features = data.get("features", [])
    print(f"Total features loaded from GeoJSON: {len(features)}")
    
    raw_roads = []
    settlements = []
    hospitals = []
    
    for f in features:
        props = f.get("properties", {})
        geom = f.get("geometry", {})
        gtype = geom.get("type", "")
        
        # Healthcare facilities
        if "amenity" in props and props["amenity"] in ["hospital", "clinic", "doctors"]:
            h_name = props.get("name") or f"Facility {props.get('id', 'unknown')}"
            coord = None
            if gtype == "Point":
                coord = geom["coordinates"]
            elif gtype in ["Polygon", "MultiPolygon"]:
                poly = shape(geom)
                coord = [poly.centroid.x, poly.centroid.y]
            if coord:
                hospitals.append({
                    "id": f"H_OSM_{props.get('id', len(hospitals)+1)}",
                    "name": h_name,
                    "type": "hospital",
                    "amenity": props.get("amenity"),
                    "lat": coord[1],
                    "lon": coord[0]
                })
                
        # Settlements
        elif "place" in props and props["place"] in ["village", "hamlet", "town"]:
            s_name = props.get("name") or f"Settlement {props.get('id', 'unknown')}"
            coord = None
            if gtype == "Point":
                coord = geom["coordinates"]
            elif gtype in ["Polygon", "MultiPolygon"]:
                poly = shape(geom)
                coord = [poly.centroid.x, poly.centroid.y]
            if coord:
                settlements.append({
                    "id": f"V_OSM_{props.get('id', len(settlements)+1)}",
                    "name": s_name,
                    "type": "village",
                    "place_type": props.get("place"),
                    "lat": coord[1],
                    "lon": coord[0]
                })
                
        # Roads and paths
        elif "highway" in props:
            hw = props["highway"]
            if hw in ["primary", "secondary", "tertiary", "unclassified", "residential", "track", "path"]:
                coords = []
                if gtype == "LineString":
                    coords = [geom["coordinates"]]
                elif gtype == "MultiLineString":
                    coords = geom["coordinates"]
                for line in coords:
                    if len(line) >= 2:
                        raw_roads.append({
                            "osm_id": props.get("id"),
                            "name": props.get("name", "Unnamed Road"),
                            "road_class": hw,
                            "surface": props.get("surface", "unknown"),
                            "coordinates": line
                        })
                        
    print(f"Extracted from OSM:")
    print(f"  - Road ways: {len(raw_roads)}")
    print(f"  - Settlements (villages/hamlets/towns): {len(settlements)}")
    print(f"  - Healthcare facilities: {len(hospitals)}")
    
    # 2. Segment roads into ~500m pieces
    print(f"\nSegmenting roads into ~{SEGMENT_TARGET_KM*1000:.0f}m chunks...")
    segmented_edges = []
    edge_counter = 1
    
    for r in raw_roads:
        sub_segs = split_linestring(r["coordinates"], target_km=SEGMENT_TARGET_KM)
        for seg in sub_segs:
            length = linestring_length_km(seg)
            if length > 0.005:  # Skip degenerate segments (<5m)
                is_trek = r["road_class"] in ["path", "track"]
                segmented_edges.append({
                    "id": f"E_SEG_{edge_counter:04d}",
                    "name": r["name"],
                    "road_class": r["road_class"],
                    "road_type": "trek" if is_trek else "motorable",
                    "length_km": round(length, 3),
                    "coordinates": [[round(pt[1], 6), round(pt[0], 6)] for pt in seg],  # [lat, lon] for Leaflet
                    "start_pt": (round(seg[0][1], 5), round(seg[0][0], 5)),
                    "end_pt": (round(seg[-1][1], 5), round(seg[-1][0], 5))
                })
                edge_counter += 1
                
    print(f"Generated {len(segmented_edges)} road segments (target ~500m each).")
    
    # 3. Build NetworkX graph & junctions
    print("\nBuilding NetworkX graph...")
    G = nx.Graph()
    coord_to_node = {}
    node_counter = 1
    
    for edge in segmented_edges:
        u_pt = edge["start_pt"]
        v_pt = edge["end_pt"]
        
        if u_pt not in coord_to_node:
            coord_to_node[u_pt] = f"J_{node_counter:04d}"
            G.add_node(coord_to_node[u_pt], lat=u_pt[0], lon=u_pt[1], type="junction")
            node_counter += 1
            
        if v_pt not in coord_to_node:
            coord_to_node[v_pt] = f"J_{node_counter:04d}"
            G.add_node(coord_to_node[v_pt], lat=v_pt[0], lon=v_pt[1], type="junction")
            node_counter += 1
            
        u = coord_to_node[u_pt]
        v = coord_to_node[v_pt]
        edge["from"] = u
        edge["to"] = v
        G.add_edge(u, v, id=edge["id"], length_km=edge["length_km"], road_class=edge["road_class"])
        
    print(f"Junction graph constructed: {G.number_of_nodes()} junction nodes, {G.number_of_edges()} edges.")
    
    # 4. Snap settlements and hospitals to nearest road nodes
    print("\nSnapping settlements and hospitals to nearest network junctions...")
    road_points = list(coord_to_node.keys())
    
    unmapped_settlements = []
    connected_settlements = []
    
    for s in settlements:
        s_lat, s_lon = s["lat"], s["lon"]
        min_dist = float("inf")
        nearest_pt = None
        for r_lat, r_lon in road_points:
            d = haversine_km(s_lat, s_lon, r_lat, r_lon)
            if d < min_dist:
                min_dist = d
                nearest_pt = (r_lat, r_lon)
                
        s["dist_to_road_km"] = round(min_dist, 3)
        if min_dist <= MAX_SNAP_DISTANCE_KM and nearest_pt:
            s["connected_node"] = coord_to_node[nearest_pt]
            connected_settlements.append(s)
        else:
            s["connected_node"] = None
            unmapped_settlements.append(s)
            
    print(f"Settlements mapped to road network: {len(connected_settlements)} / {len(settlements)}")
    print(f"Unmapped settlements (> {MAX_SNAP_DISTANCE_KM}km from any road): {len(unmapped_settlements)}")
    
    # Hospitals
    connected_hospitals = []
    for h in hospitals:
        h_lat, h_lon = h["lat"], h["lon"]
        min_dist = float("inf")
        nearest_pt = None
        for r_lat, r_lon in road_points:
            d = haversine_km(h_lat, h_lon, r_lat, r_lon)
            if d < min_dist:
                min_dist = d
                nearest_pt = (r_lat, r_lon)
        h["dist_to_road_km"] = round(min_dist, 3)
        h["connected_node"] = coord_to_node[nearest_pt] if nearest_pt else None
        connected_hospitals.append(h)
        
    print(f"Hospitals mapped: {len(connected_hospitals)} / {len(hospitals)}")
    
    # Connected components
    components = list(nx.connected_components(G))
    comp_sizes = sorted([len(c) for c in components], reverse=True)
    print(f"\nConnected Components Analysis:")
    print(f"  Total connected components: {len(components)}")
    if comp_sizes:
        print(f"  Largest component size: {comp_sizes[0]} nodes ({comp_sizes[0]*100/len(G):.1f}% of network)")
        print(f"  Top 5 component sizes: {comp_sizes[:5]}")
        
    # 5. Offline Elevation & Slope Profile
    print("\nCalculating elevation and slope profiles for segments...")
    elev_cache = load_elevation_cache()
    
    # Sample start, mid, end for each segment
    sample_pts = []
    for e in segmented_edges:
        coords = e["coordinates"]
        mid_idx = len(coords) // 2
        sample_pts.append((coords[0][0], coords[0][1]))
        sample_pts.append((coords[mid_idx][0], coords[mid_idx][1]))
        sample_pts.append((coords[-1][0], coords[-1][1]))
        
    elev_map = fetch_elevations_batch(sample_pts, elev_cache)
    
    for e in segmented_edges:
        coords = e["coordinates"]
        mid_idx = len(coords) // 2
        e1 = elev_map.get((coords[0][0], coords[0][1]), 1500.0)
        e_mid = elev_map.get((coords[mid_idx][0], coords[mid_idx][1]), 1500.0)
        e2 = elev_map.get((coords[-1][0], coords[-1][1]), 1500.0)
        
        elev_diff_1 = abs(e_mid - e1)
        elev_diff_2 = abs(e2 - e_mid)
        elev_diff_total = abs(e2 - e1)
        
        # Max gradient percentage (rise / run * 100)
        dist_m = max(10.0, e["length_km"] * 1000.0)
        mean_grad = round((elev_diff_total / dist_m) * 100.0, 1)
        max_grad = round(max((elev_diff_1 / (dist_m/2)) * 100.0, (elev_diff_2 / (dist_m/2)) * 100.0, mean_grad), 1)
        
        e["start_elevation_m"] = round(e1, 1)
        e["end_elevation_m"] = round(e2, 1)
        e["mean_gradient_pct"] = mean_grad
        e["max_gradient_pct"] = max_grad
        
        # Terrain susceptibility heuristic (based on slope & road class)
        base_susc = min(0.85, 0.15 + (mean_grad / 50.0) * 0.5)
        if e["road_type"] == "trek":
            base_susc = min(0.95, base_susc + 0.15)
        e["susceptibility"] = round(base_susc, 2)
        
        # Clean internal helper keys
        del e["start_pt"]
        del e["end_pt"]

    # 6. Assemble network_v2.json
    all_nodes = []
    for n_id, data in G.nodes(data=True):
        all_nodes.append({
            "id": n_id,
            "type": data["type"],
            "lat": data["lat"],
            "lon": data["lon"]
        })
        
    for s in settlements:
        all_nodes.append({
            "id": s["id"],
            "name": s["name"],
            "type": "village",
            "place_type": s["place_type"],
            "lat": s["lat"],
            "lon": s["lon"],
            "connected_junction": s.get("connected_node"),
            "dist_to_road_km": s.get("dist_to_road_km")
        })
        
    for h in hospitals:
        all_nodes.append({
            "id": h["id"],
            "name": h["name"],
            "type": "hospital",
            "amenity": h["amenity"],
            "lat": h["lat"],
            "lon": h["lon"],
            "connected_junction": h.get("connected_node"),
            "dist_to_road_km": h.get("dist_to_road_km")
        })
        
    network_v2 = {
        "metadata": {
            "version": "2.0-district",
            "district": "Rudraprayag, Uttarakhand",
            "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "segment_target_km": SEGMENT_TARGET_KM,
            "stats": {
                "total_edges": len(segmented_edges),
                "total_junction_nodes": G.number_of_nodes(),
                "total_settlements": len(settlements),
                "mapped_settlements": len(connected_settlements),
                "unmapped_settlements": len(unmapped_settlements),
                "total_hospitals": len(hospitals),
                "connected_components": len(components),
                "largest_component_nodes": comp_sizes[0] if comp_sizes else 0
            }
        },
        "nodes": all_nodes,
        "edges": segmented_edges
    }
    
    with open(OUTPUT_NETWORK_V2, "w", encoding="utf-8") as f:
        json.dump(network_v2, f, indent=2)
        
    print(f"\nSUCCESS: Saved district network v2 to {OUTPUT_NETWORK_V2}")
    print(f"Summary:")
    print(f"  - Segments (~500m): {len(segmented_edges)}")
    print(f"  - Junction nodes: {G.number_of_nodes()}")
    print(f"  - Settlements: {len(settlements)} ({len(unmapped_settlements)} unmapped)")
    print(f"  - Healthcare facilities: {len(hospitals)}")

if __name__ == "__main__":
    main()
