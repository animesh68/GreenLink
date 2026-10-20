"""
GreenLink Delhi: Algorithmic Street-Aligned Candidate Corridor Generator
Snaps verified green-space anchors to the real OpenStreetMap road network graph
and executes NetworkX Dijkstra shortest-path routing to produce planning candidates.
"""

import os
import sys
import json
import math
from typing import Dict, Any, List, Tuple, Set
import networkx as nx
from shapely.geometry import Point, LineString, Polygon, mapping, shape
from shapely.ops import transform
from shapely.validation import make_valid
import pyproj

wgs84_to_utm = pyproj.Transformer.from_crs("EPSG:4326", "EPSG:32643", always_xy=True).transform
utm_to_wgs84 = pyproj.Transformer.from_crs("EPSG:32643", "EPSG:4326", always_xy=True).transform

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "processed")

# Maximum Euclidean separation between anchor pairs to consider (meters)
MAX_ANCHOR_SEPARATION_METERS = 3200.0  # 3.2 km
MAX_SNAPPING_DISTANCE_METERS = 600.0   # 600 m
MAX_CIRCUITOUSNESS_RATIO = 2.2         # Reject routes winding > 2.2x straight line

# Provisional, configurable unit rates (INR per linear meter)
# Documented assumption: provisional planning benchmark, not municipal contract rates
CONFIGURABLE_COST_RATES = {
    "primary": 6000.0,
    "primary_link": 5000.0,
    "secondary": 4500.0,
    "secondary_link": 4000.0,
    "tertiary": 3500.0,
    "tertiary_link": 3000.0,
    "residential": 2500.0,
    "living_street": 2500.0,
    "pedestrian": 2000.0,
    "cycleway": 2000.0,
    "unclassified": 2500.0,
    "default": 3000.0,
    "base_mobilization_inr": 150000.0  # Base survey and site mobilization per corridor
}


def load_green_anchors() -> List[Dict[str, Any]]:
    path = os.path.join(DATA_DIR, "green_patches.geojson")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get("features", [])


def load_street_network() -> nx.Graph:
    path = os.path.join(DATA_DIR, "street_network.json")
    print(f"[*] Loading processed street network from {path}...")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    G = nx.Graph()
    for nid_str, attrs in data["nodes"].items():
        nid = int(nid_str)
        G.add_node(nid, lon=attrs["lon"], lat=attrs["lat"], x=attrs["x"], y=attrs["y"])

    for edge in data["edges"]:
        u = int(edge["u"])
        v = int(edge["v"])
        G.add_edge(
            u, v,
            weight=edge["weight"],
            highway=edge.get("highway", "unclassified"),
            name=edge.get("name", "Unnamed Street"),
            way_id=edge.get("way_id", 0)
        )

    print(f"[OK] Reconstructed NetworkX graph: {G.number_of_nodes():,} nodes, {G.number_of_edges():,} edges.")
    return G


def snap_anchors_to_network(
    anchors: List[Dict[str, Any]],
    G: nx.Graph
) -> Dict[str, Dict[str, Any]]:
    """
    Computes representative point for each anchor and snaps to the nearest street network node.
    """
    print("[*] Snapping green-space anchors to nearest street network nodes...")
    snapped_anchors: Dict[str, Dict[str, Any]] = {}

    # Extract node list for spatial lookup
    node_items = list(G.nodes(data=True))

    for anchor in anchors:
        aid = anchor["properties"]["id"]
        aname = anchor["properties"]["name"]
        poly = shape(anchor["geometry"])
        
        # Representative point inside the polygon
        rep_pt_wgs84 = poly.representative_point()
        rep_pt_utm = transform(wgs84_to_utm, rep_pt_wgs84)
        ax, ay = rep_pt_utm.x, rep_pt_utm.y

        # Also check polygon exterior boundary coordinates for closest road access
        best_node = None
        min_dist = float("inf")

        # Fast bounding box pre-filter for nodes (within 800m)
        cand_nodes = [
            (nid, d["x"], d["y"])
            for nid, d in node_items
            if abs(d["x"] - ax) <= 800 and abs(d["y"] - ay) <= 800
        ]

        for nid, nx_utm, ny_utm in cand_nodes:
            d = math.hypot(nx_utm - ax, ny_utm - ay)
            if d < min_dist:
                min_dist = d
                best_node = nid

        if best_node is not None and min_dist <= MAX_SNAPPING_DISTANCE_METERS:
            node_data = G.nodes[best_node]
            snapped_anchors[aid] = {
                "anchor_id": aid,
                "anchor_name": aname,
                "area_hectares": anchor["properties"]["area_hectares"],
                "osm_type": anchor["properties"].get("osm_type", "park"),
                "rep_point_wgs84": [round(rep_pt_wgs84.x, 6), round(rep_pt_wgs84.y, 6)],
                "rep_point_utm": [round(ax, 2), round(ay, 2)],
                "snapped_node_id": best_node,
                "snapped_point_wgs84": [round(node_data["lon"], 6), round(node_data["lat"], 6)],
                "snapping_distance_m": round(min_dist, 1),
                "status": "snapped"
            }
            print(f"  [OK] {aname} -> Node {best_node} (snap dist: {min_dist:.1f}m)")
        else:
            print(f"  [!] {aname} could not be snapped within {MAX_SNAPPING_DISTANCE_METERS}m (closest: {min_dist:.1f}m)")

    return snapped_anchors


def compute_corridor_cost(length_m: float, road_type_breakdown: Dict[str, float]) -> float:
    """Computes transparent provisional cost using road typology rates."""
    variable_cost = 0.0
    for hwy, dist in road_type_breakdown.items():
        rate = CONFIGURABLE_COST_RATES.get(hwy, CONFIGURABLE_COST_RATES["default"])
        variable_cost += dist * rate

    total_cost = variable_cost + CONFIGURABLE_COST_RATES["base_mobilization_inr"]
    return round(total_cost, -3)  # round to nearest thousand


def generate_candidate_corridors(
    snapped_anchors: Dict[str, Dict[str, Any]],
    G: nx.Graph
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Evaluates anchor pairs and generates shortest-path routes along the OSM road network.
    """
    print("[*] Generating candidate corridors between anchor pairs...")
    candidates: List[Dict[str, Any]] = []
    stats = {
        "pairs_considered": 0,
        "pairs_within_distance": 0,
        "successful_routes": 0,
        "failed_disconnected": 0,
        "failed_circuitous": 0,
        "duplicate_pairs_skipped": 0
    }

    anchor_ids = sorted(list(snapped_anchors.keys()))
    cand_idx = 1

    for i in range(len(anchor_ids)):
        for j in range(i + 1, len(anchor_ids)):
            u_id = anchor_ids[i]
            v_id = anchor_ids[j]
            stats["pairs_considered"] += 1

            anc_u = snapped_anchors[u_id]
            anc_v = snapped_anchors[v_id]

            # Euclidean distance between representative points
            ux, uy = anc_u["rep_point_utm"]
            vx, vy = anc_v["rep_point_utm"]
            euclid_dist = math.hypot(vx - ux, vy - uy)

            if euclid_dist > MAX_ANCHOR_SEPARATION_METERS:
                continue

            stats["pairs_within_distance"] += 1
            node_u = anc_u["snapped_node_id"]
            node_v = anc_v["snapped_node_id"]

            if node_u == node_v:
                continue

            # Shortest-path routing on street network
            try:
                path_nodes = nx.shortest_path(G, source=node_u, target=node_v, weight="weight")
                net_length = nx.shortest_path_length(G, source=node_u, target=node_v, weight="weight")
            except (nx.NetworkXNoPath, nx.NodeNotFound):
                stats["failed_disconnected"] += 1
                continue

            circuit_ratio = net_length / max(1.0, euclid_dist)
            if circuit_ratio > MAX_CIRCUITOUSNESS_RATIO:
                stats["failed_circuitous"] += 1
                continue

            # Extract path geometry and road classification breakdown
            coords: List[List[float]] = []
            road_types: Dict[str, float] = {}
            primary_road_names: List[str] = []

            for p_idx in range(len(path_nodes)):
                cur_node = path_nodes[p_idx]
                nd = G.nodes[cur_node]
                coords.append([round(nd["lon"], 6), round(nd["lat"], 6)])

                if p_idx < len(path_nodes) - 1:
                    nxt_node = path_nodes[p_idx + 1]
                    edge_data = G[cur_node][nxt_node]
                    edge_wt = edge_data.get("weight", 0.0)
                    hwy = edge_data.get("highway", "unclassified")
                    rname = edge_data.get("name", "")

                    road_types[hwy] = road_types.get(hwy, 0.0) + edge_wt
                    if rname and rname != "Unnamed Street" and rname not in primary_road_names:
                        primary_road_names.append(rname)

            if len(coords) < 2:
                continue

            geom = LineString(coords)
            if not geom.is_valid:
                geom = make_valid(geom)

            length_m = round(net_length, 1)
            length_km = round(net_length / 1000.0, 2)
            cost_inr = compute_corridor_cost(length_m, road_types)

            # Dominant street typology
            dominant_hwy = max(road_types.items(), key=lambda x: x[1])[0] if road_types else "secondary"
            top_roads_str = ", ".join(primary_road_names[:3]) if primary_road_names else "Urban Municipal Corridors"

            cand_id = f"cand_{cand_idx:03d}"
            feature = {
                "type": "Feature",
                "id": cand_id,
                "properties": {
                    "candidate_id": cand_id,
                    "name": f"{anc_u['anchor_name']} — {anc_v['anchor_name']} Corridor",
                    "source_anchor_id": u_id,
                    "source_name": anc_u["anchor_name"],
                    "target_anchor_id": v_id,
                    "target_name": anc_v["anchor_name"],
                    "length_m": length_m,
                    "length_km": length_km,
                    "euclidean_distance_m": round(euclid_dist, 1),
                    "circuitousness_ratio": round(circuit_ratio, 2),
                    "dominant_typology": dominant_hwy,
                    "road_types_breakdown_m": {k: round(v, 1) for k, v in road_types.items()},
                    "primary_streets": top_roads_str,
                    "estimated_cost_inr": cost_inr,
                    "cost_status": "provisional_estimate",
                    "route_method": "NetworkX Dijkstra Shortest Path",
                    "network_source": "OpenStreetMap Real Road Network",
                    "status": "candidate",
                    "planning_notes": "Street-aligned candidate route for green infrastructure; physical and legal feasibility subject to field verification."
                },
                "geometry": mapping(geom)
            }
            candidates.append(feature)
            cand_idx += 1
            stats["successful_routes"] += 1

    return candidates, stats


def main():
    anchors = load_green_anchors()
    print(f"[OK] Loaded {len(anchors)} green-space anchors.")

    G = load_street_network()
    snapped = snap_anchors_to_network(anchors, G)
    print(f"[OK] Snapped {len(snapped)}/{len(anchors)} anchors to road network.")

    candidates, stats = generate_candidate_corridors(snapped, G)
    print(f"[OK] Generated {len(candidates)} street-aligned candidate corridors.")
    print(f"     Pairs considered: {stats['pairs_considered']}")
    print(f"     Pairs within separation limit: {stats['pairs_within_distance']}")
    print(f"     Successful routes: {stats['successful_routes']}")
    print(f"     Excluded (disconnected components): {stats['failed_disconnected']}")
    print(f"     Excluded (circuitous > 2.2x): {stats['failed_circuitous']}")

    if candidates:
        lengths = [c["properties"]["length_m"] for c in candidates]
        lengths.sort()
        min_len = min(lengths)
        max_len = max(lengths)
        med_len = lengths[len(lengths) // 2]
        tot_len_km = sum(lengths) / 1000.0

        print(f"[INFO] Route Lengths: Min = {min_len:.1f}m ({min_len/1000:.2f}km), "
              f"Median = {med_len:.1f}m ({med_len/1000:.2f}km), "
              f"Max = {max_len:.1f}m ({max_len/1000:.2f}km)")
        print(f"[INFO] Total Candidate Network Length: {tot_len_km:.2f} km")

    # Export GeoJSON FeatureCollection
    output_geojson = {
        "type": "FeatureCollection",
        "metadata": {
            "title": "GreenLink Delhi Street-Aligned Candidate Corridors",
            "study_area": "South-Central Delhi",
            "count": len(candidates),
            "generation_method": "NetworkX Dijkstra shortest-path along OSM walkable/urban roads",
            "crs": "EPSG:4326",
            "metric_crs": "EPSG:32643",
            "cost_model": "Provisional typology-based benchmarks (primary/secondary/residential)",
            "limitations": "Planning candidates only; physical, environmental, and legal feasibility requires ground survey."
        },
        "features": candidates
    }

    out_path = os.path.join(DATA_DIR, "candidate_corridors.geojson")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output_geojson, f, indent=2)
    print(f"[OK] Successfully exported {len(candidates)} candidate corridors to {out_path} ({os.path.getsize(out_path):,} bytes)")


if __name__ == "__main__":
    main()
