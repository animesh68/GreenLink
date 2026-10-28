import math
import networkx as nx
from typing import Dict, Any, List, Optional, Tuple
from shapely.geometry import Point, LineString, shape

from app.geospatial.loaders import (
    load_geojson,
    get_green_patches,
    get_candidate_corridors
)

_STREET_GRAPH: Optional[nx.Graph] = None

# Configurable provisional unit rates (INR per linear meter)
# Typology benchmarks based on CPWD / municipal greenway planning estimates
COST_RATES: Dict[str, float] = {
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
    "base_mobilization_inr": 150000.0
}


def get_street_network_graph() -> nx.Graph:
    """
    Returns the in-memory cached NetworkX road graph for South-Central Delhi.
    Lazily initialized on first access.
    """
    global _STREET_GRAPH
    if _STREET_GRAPH is not None:
        return _STREET_GRAPH

    data = load_geojson("street_network.json")
    G = nx.Graph()

    for nid_str, attrs in data.get("nodes", {}).items():
        nid = int(nid_str)
        G.add_node(
            nid,
            lon=attrs["lon"],
            lat=attrs["lat"],
            x=attrs.get("x", attrs["lon"]),
            y=attrs.get("y", attrs["lat"])
        )

    for edge in data.get("edges", []):
        u = int(edge["u"])
        v = int(edge["v"])
        G.add_edge(
            u, v,
            weight=float(edge["weight"]),
            highway=edge.get("highway", "unclassified"),
            name=edge.get("name", "Unnamed Street"),
            way_id=edge.get("way_id", 0)
        )

    # Retain the main connected component of the road network
    # so that nearest-node snapping never lands on isolated dead-end fragments
    if G.number_of_nodes() > 0:
        largest_cc = max(nx.connected_components(G), key=len)
        _STREET_GRAPH = G.subgraph(largest_cc).copy()
    else:
        _STREET_GRAPH = G

    return _STREET_GRAPH


def _find_nearest_node(G: nx.Graph, lon: float, lat: float) -> Optional[int]:
    """Finds the nearest street network node to a given coordinate."""
    best_node = None
    min_dist_sq = float("inf")

    # Fast approximate distance search in degree space
    # (suitable for bounding radius in Delhi ~28.58N, 77.21E)
    cos_lat = math.cos(math.radians(lat))
    for nid, attrs in G.nodes(data=True):
        dx = (attrs["lon"] - lon) * cos_lat
        dy = attrs["lat"] - lat
        dist_sq = dx * dx + dy * dy
        if dist_sq < min_dist_sq:
            min_dist_sq = dist_sq
            best_node = nid

    return best_node


def generate_user_directed_corridors(
    selected_patch_ids: List[str],
    custom_points: Optional[List[Dict[str, Any]]] = None
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Finds and generates street-aligned candidate green corridors connecting
    a user-selected set of green patch anchors and optional custom planning points.
    
    Returns:
      (candidate_corridor_features, selected_endpoints_metadata)
    """
    all_patches = get_green_patches()
    patch_map = {p["properties"]["id"]: p for p in all_patches}
    precomputed_candidates = get_candidate_corridors()

    # 1. Collect selected endpoints
    endpoints: List[Dict[str, Any]] = []
    for pid in selected_patch_ids:
        patch = patch_map.get(pid)
        if patch:
            props = patch["properties"]
            poly = shape(patch["geometry"])
            rep_pt = poly.representative_point()
            endpoints.append({
                "id": pid,
                "name": props.get("name", pid),
                "type": "green_patch",
                "area_hectares": props.get("area_hectares", 0.0),
                "coordinates": [rep_pt.x, rep_pt.y]
            })

    if custom_points:
        for pt in custom_points:
            endpoints.append({
                "id": pt["id"],
                "name": pt.get("name", f"Point {pt['id']}"),
                "type": "custom_point",
                "area_hectares": 5.0,  # Provisional proxy area for custom anchor
                "coordinates": pt["coordinates"]
            })

    if len(endpoints) < 2:
        return [], endpoints

    # 2. Build index of existing precomputed candidate corridors
    # Map pair tuple (sorted) -> candidate feature
    existing_pair_map: Dict[Tuple[str, str], Dict[str, Any]] = {}
    for cand in precomputed_candidates:
        props = cand["properties"]
        src = props.get("source_anchor_id")
        tgt = props.get("target_anchor_id")
        if src and tgt:
            pair = tuple(sorted([src, tgt]))
            existing_pair_map[pair] = cand

    generated_candidates: List[Dict[str, Any]] = []
    added_pairs: set = set()
    G = None  # Lazily loaded only if dynamic routing is required

    # 3. For each pair of endpoints, generate or find route
    for i in range(len(endpoints)):
        for j in range(i + 1, len(endpoints)):
            ep1 = endpoints[i]
            ep2 = endpoints[j]
            pair_key = tuple(sorted([ep1["id"], ep2["id"]]))

            if pair_key in added_pairs:
                continue

            # Case A: Matches precomputed candidate corridor
            if pair_key in existing_pair_map:
                cand = existing_pair_map[pair_key]
                generated_candidates.append(cand)
                added_pairs.add(pair_key)
                continue

            # Case B: Dynamically route between endpoints on real street network
            if G is None:
                G = get_street_network_graph()

            c1 = ep1["coordinates"]
            c2 = ep2["coordinates"]

            u_node = _find_nearest_node(G, c1[0], c1[1])
            v_node = _find_nearest_node(G, c2[0], c2[1])

            if u_node is None or v_node is None or u_node == v_node:
                continue

            try:
                path = nx.shortest_path(G, source=u_node, target=v_node, weight="weight")
            except (nx.NetworkXNoPath, nx.NodeNotFound):
                continue

            # Extract coordinates, road types, and street names
            path_coords: List[List[float]] = []
            total_length_m = 0.0
            road_types_m: Dict[str, float] = {}
            street_names: List[str] = []

            for k in range(len(path)):
                curr_node = path[k]
                node_attrs = G.nodes[curr_node]
                path_coords.append([node_attrs["lon"], node_attrs["lat"]])

                if k < len(path) - 1:
                    nxt_node = path[k + 1]
                    edge_attrs = G.get_edge_data(curr_node, nxt_node, {})
                    w = edge_attrs.get("weight", 0.0)
                    total_length_m += w
                    hway = edge_attrs.get("highway", "unclassified")
                    road_types_m[hway] = road_types_m.get(hway, 0.0) + w
                    sname = edge_attrs.get("name")
                    if sname and sname != "Unnamed Street" and sname not in street_names:
                        street_names.append(sname)

            # Determine dominant typology & estimate cost
            dominant_typology = "secondary"
            if road_types_m:
                dominant_typology = max(road_types_m.items(), key=lambda x: x[1])[0]

            rate_per_m = COST_RATES.get(dominant_typology, COST_RATES["default"])
            base_mobilization = COST_RATES["base_mobilization_inr"]
            estimated_cost = round((total_length_m * rate_per_m) + base_mobilization, 2)

            cand_id = f"user_{ep1['id']}_{ep2['id']}"
            name = f"{ep1['name']} — {ep2['name']} Corridor"
            length_km = round(total_length_m / 1000.0, 2)

            feature = {
                "type": "Feature",
                "id": cand_id,
                "properties": {
                    "candidate_id": cand_id,
                    "name": name,
                    "source_anchor_id": ep1["id"],
                    "source_name": ep1["name"],
                    "target_anchor_id": ep2["id"],
                    "target_name": ep2["name"],
                    "length_m": round(total_length_m, 1),
                    "length_km": length_km,
                    "dominant_typology": dominant_typology,
                    "primary_streets": ", ".join(street_names[:4]) if street_names else "Local Road Segments",
                    "estimated_cost_inr": estimated_cost,
                    "cost_status": "provisional_estimate",
                    "route_method": "NetworkX Dijkstra Shortest Path",
                    "network_source": "OpenStreetMap Real Road Network",
                    "status": "user_generated_candidate"
                },
                "geometry": {
                    "type": "LineString",
                    "coordinates": path_coords
                }
            }

            generated_candidates.append(feature)
            added_pairs.add(pair_key)

    return generated_candidates, endpoints
