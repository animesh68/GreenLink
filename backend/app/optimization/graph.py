from typing import Dict, Any, List, Tuple
import networkx as nx


def build_base_graph(patches: List[Dict[str, Any]]) -> Tuple[nx.Graph, float, Dict[str, float]]:
    """
    Initializes a NetworkX graph with green patches as disconnected nodes.
    Returns (graph, total_area_ha, node_areas).
    """
    G = nx.Graph()
    node_areas: Dict[str, float] = {}
    total_area_ha = 0.0

    for patch in patches:
        props = patch["properties"]
        pid = props.get("id") or patch.get("id")
        area_ha = float(props.get("area_hectares", 10.0))
        node_areas[pid] = area_ha
        total_area_ha += area_ha
        G.add_node(pid, area=area_ha, name=props.get("name", pid))

    return G, total_area_ha, node_areas


def compute_distance_weighted_connectivity_index(
    G: nx.Graph,
    total_area_ha: float,
    node_areas: Dict[str, float],
    d0_meters: float = 1000.0
) -> float:
    """
    Computes the Distance-Weighted Integral Index of Connectivity (IIC_dist) scaled to [0, 100].
    
    Formula:
        IIC_dist = [ sum_{comp} sum_{i,j in comp} (a_i * a_j / (1 + d_G(i,j) / d0)) ] / (A_tot^2) * 100
        
    Scientific Distinction:
    - Standard IIC (Pascual-Hortal & Saura, 2006) uses topological link count (number of corridor hops nl_ij).
    - In urban pedestrian and wildlife greenway planning, treating a 4.4 km arterial corridor as identical
      to a 1.9 km local corridor (which topological nl_ij = 1 would do) is ecologically unrealistic.
    - This implementation therefore uses a distance-decay connectivity proxy with characteristic scale d0 (default 1,000m / 1km),
      where d_G(i,j) is the Dijkstra shortest path along selected street corridors in meters.
      
    Properties:
    - Dimensionless metric: ha^2 in numerator divided by ha^2 in denominator, scaled to percentage points.
    - Disconnected node pairs contribute 0 because d_G(i,j) = infinity (different connected components).
    - Self-pair (i=j): d_G(i,i) = 0, contributing a_i^2.
    - Baseline score G_0 has 0 corridors (all nodes isolated) => numerator = sum(a_i^2).
    - Comparability: The denominator (A_tot^2) is constant across baseline and all optimized configurations.
    - Redundant cycles that do not decrease the shortest-path distance between any patch pair yield 0 marginal gain.
    """
    if total_area_ha <= 0 or G.number_of_nodes() == 0:
        return 0.0

    numerator = 0.0

    for component in nx.connected_components(G):
        comp_nodes = list(component)
        n = len(comp_nodes)

        if n == 1:
            u = comp_nodes[0]
            a_u = node_areas.get(u, 1.0)
            numerator += (a_u * a_u)
        else:
            subgraph = G.subgraph(comp_nodes)
            lengths = dict(nx.all_pairs_dijkstra_path_length(subgraph, weight="weight"))
            for i in range(n):
                u = comp_nodes[i]
                a_u = node_areas.get(u, 1.0)
                numerator += (a_u * a_u)  # self-pair (i=j, dist=0)

                for j in range(i + 1, n):
                    v = comp_nodes[j]
                    a_v = node_areas.get(v, 1.0)
                    dist_m = lengths[u].get(v, float("inf"))
                    if dist_m < float("inf"):
                        dist_scale = dist_m / d0_meters
                        pair_score = (a_u * a_v) / (1.0 + dist_scale)
                        numerator += 2.0 * pair_score  # symmetric pair (u, v) and (v, u)

    ci = (numerator / (total_area_ha * total_area_ha)) * 100.0
    return round(ci, 4)


def compute_topological_iic(
    G: nx.Graph,
    total_area_ha: float,
    node_areas: Dict[str, float]
) -> float:
    """
    Computes standard topological Integral Index of Connectivity (IIC_topo)
    according to the original formulation of Pascual-Hortal & Saura (2006).
    
    Formula:
        IIC_topo = [ sum_{comp} sum_{i,j in comp} (a_i * a_j / (1 + nl_{ij})) ] / (A_tot^2) * 100
        
    where nl_{ij} is the number of links (hops) in the shortest path between patch i and patch j.
    - For i = j: nl_{ii} = 0, term = a_i^2.
    - If i and j are directly connected: nl_{ij} = 1, term = (a_i * a_j) / 2.
    - If i and j are disconnected: nl_{ij} = infinity, term = 0.
    """
    if total_area_ha <= 0 or G.number_of_nodes() == 0:
        return 0.0

    numerator = 0.0

    for component in nx.connected_components(G):
        comp_nodes = list(component)
        n = len(comp_nodes)

        if n == 1:
            u = comp_nodes[0]
            a_u = node_areas.get(u, 1.0)
            numerator += (a_u * a_u)
        else:
            subgraph = G.subgraph(comp_nodes)
            # Unweighted shortest path length = topological hop count
            hop_lengths = dict(nx.all_pairs_shortest_path_length(subgraph))
            for i in range(n):
                u = comp_nodes[i]
                a_u = node_areas.get(u, 1.0)
                numerator += (a_u * a_u)

                for j in range(i + 1, n):
                    v = comp_nodes[j]
                    a_v = node_areas.get(v, 1.0)
                    hops = hop_lengths[u].get(v, None)
                    if hops is not None:
                        pair_score = (a_u * a_v) / (1.0 + hops)
                        numerator += 2.0 * pair_score

    ci = (numerator / (total_area_ha * total_area_ha)) * 100.0
    return round(ci, 4)


# Backward-compatible alias for existing imports
compute_connectivity_index = compute_distance_weighted_connectivity_index

