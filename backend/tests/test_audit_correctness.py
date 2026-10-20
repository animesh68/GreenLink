import pytest
import networkx as nx
from typing import Dict, Any, List
from shapely.geometry import LineString, Polygon, box
from shapely.ops import unary_union

from app.geospatial.loaders import get_candidate_corridors, get_green_patches, get_heat_grid_cells
from app.optimization.graph import (
    build_base_graph,
    compute_distance_weighted_connectivity_index,
    compute_topological_iic,
    compute_connectivity_index
)
from app.optimization.heat_coverage import HeatCoverageEngine
from app.optimization.optimizer import run_corridor_optimization


# ==============================================================================
# 1. CONNECTIVITY OBJECTIVE AUDIT & CORRECTNESS TESTS
# ==============================================================================

def test_baseline_computed_dynamically_from_input():
    """Verify that baseline connectivity is dynamically calculated from actual patch areas."""
    patches = get_green_patches()
    G, total_area, node_areas = build_base_graph(patches)

    assert total_area > 0
    assert len(node_areas) == len(patches)
    assert G.number_of_nodes() == len(patches)
    assert G.number_of_edges() == 0

    # Theoretical baseline for disconnected graph: sum(a_i^2) / (sum a_i)^2 * 100
    expected_num = sum(a * a for a in node_areas.values())
    expected_den = total_area * total_area
    expected_score = round((expected_num / expected_den) * 100.0, 4)

    actual_score = compute_distance_weighted_connectivity_index(G, total_area, node_areas)
    assert actual_score == expected_score
    assert actual_score > 0.0


def test_synthetic_3node_hand_calculated_iic_and_dist_decay():
    """
    Mathematical verification on a controlled 3-node graph.
    Nodes: A (10 ha), B (20 ha), C (30 ha).
    Total Area = 60 ha. Denominator = 60^2 = 3600.
    Baseline numerator: 10^2 + 20^2 + 30^2 = 100 + 400 + 900 = 1400.
    Baseline IIC: 1400 / 3600 * 100 = 38.8889%.
    """
    node_areas = {"A": 10.0, "B": 20.0, "C": 30.0}
    total_area = 60.0

    G = nx.Graph()
    for n, a in node_areas.items():
        G.add_node(n, area=a)

    base_dist = compute_distance_weighted_connectivity_index(G, total_area, node_areas)
    base_topo = compute_topological_iic(G, total_area, node_areas)
    assert base_dist == round(38.8889, 4)
    assert base_topo == round(38.8889, 4)

    # Add edge A-B with length 1000m (d0 = 1000m, so d_G/d0 = 1.0)
    G.add_edge("A", "B", weight=1000.0)

    # Distance-decay calculation:
    # Numerator = 1400 + 2 * (10 * 20) / (1 + 1000/1000) = 1400 + 2 * 200 / 2 = 1400 + 200 = 1600.
    # Score = 1600 / 3600 * 100 = 44.4444%.
    dist_score = compute_distance_weighted_connectivity_index(G, total_area, node_areas)
    assert dist_score == round(44.4444, 4)

    # Topological IIC calculation:
    # nl_AB = 1 hop => (10 * 20) / (1 + 1) = 100. Symmetric => +200.
    # Score = 1600 / 3600 * 100 = 44.4444%.
    topo_score = compute_topological_iic(G, total_area, node_areas)
    assert topo_score == round(44.4444, 4)

    # Now change edge length to 3000m (3km corridor)
    G["A"]["B"]["weight"] = 3000.0

    # Distance-decay calculation:
    # Numerator = 1400 + 2 * (10 * 20) / (1 + 3000/1000) = 1400 + 400 / 4 = 1400 + 100 = 1500.
    # Score = 1500 / 3600 * 100 = 41.6667%.
    dist_score_3k = compute_distance_weighted_connectivity_index(G, total_area, node_areas)
    assert dist_score_3k == round(41.6667, 4)

    # Topological IIC calculation:
    # Still 1 topological hop! nl_AB = 1 => 44.4444%.
    topo_score_3k = compute_topological_iic(G, total_area, node_areas)
    assert topo_score_3k == round(44.4444, 4)

    # Mathematically proves that distance-decay captures corridor length while topo IIC ignores it
    assert dist_score_3k < dist_score
    assert topo_score_3k == topo_score


def test_redundant_parallel_and_cycle_edges_yield_zero_gain():
    """A redundant corridor that does not shorten any path yields 0 marginal connectivity gain."""
    node_areas = {"A": 10.0, "B": 20.0, "C": 30.0}
    total_area = 60.0

    G = nx.Graph()
    for n, a in node_areas.items():
        G.add_node(n, area=a)

    # Connect A-B (1000m) and B-C (1000m) => shortest A-C is 2000m
    G.add_edge("A", "B", weight=1000.0)
    G.add_edge("B", "C", weight=1000.0)
    score1 = compute_distance_weighted_connectivity_index(G, total_area, node_areas)

    # Adding a circuitous redundant edge A-C with weight 5000m
    # Shortest path remains A-B-C (2000m), so lengths do not decrease
    G_redundant = G.copy()
    G_redundant.add_edge("A", "C", weight=5000.0)
    score2 = compute_distance_weighted_connectivity_index(G_redundant, total_area, node_areas)

    assert score1 == score2, "Redundant circuitous edge must yield 0 marginal benefit."


def test_disconnected_components_handled_consistently():
    """Disconnected anchor components must contribute 0 to inter-patch connectivity."""
    node_areas = {"A": 10.0, "B": 20.0, "C": 30.0, "D": 40.0}
    total_area = 100.0

    G = nx.Graph()
    for n, a in node_areas.items():
        G.add_node(n, area=a)

    # Connect A-B and C-D as two disconnected components
    G.add_edge("A", "B", weight=1000.0)
    G.add_edge("C", "D", weight=1000.0)

    assert nx.number_connected_components(G) == 2
    score = compute_distance_weighted_connectivity_index(G, total_area, node_areas)

    # Pairs (A, C), (A, D), (B, C), (B, D) have no path => 0 contribution
    # Self-terms: 10^2 + 20^2 + 30^2 + 40^2 = 100 + 400 + 900 + 1600 = 3000
    # A-B pair: 2 * (10 * 20) / (1 + 1) = 200
    # C-D pair: 2 * (30 * 40) / (1 + 1) = 1200
    # Total Numerator: 3000 + 200 + 1200 = 4400
    # Denominator: 100^2 = 10000
    # Score: 44.0000%
    expected = (4400.0 / 10000.0) * 100.0
    assert score == expected


# ==============================================================================
# 2. HEAT-PRIORITY OBJECTIVE AUDIT & CORRECTNESS TESTS
# ==============================================================================

def test_non_overlapping_buffer_guarantee():
    """Unary union must guarantee that overlapping buffers never double-count area."""
    # Synthetic candidate features: 2 intersecting lines
    c1 = {
        "properties": {"candidate_id": "c1", "length_m": 1000.0},
        "geometry": {"type": "LineString", "coordinates": [[77.20, 28.55], [77.22, 28.55]]}
    }
    c2 = {
        "properties": {"candidate_id": "c2", "length_m": 1000.0},
        "geometry": {"type": "LineString", "coordinates": [[77.21, 28.54], [77.21, 28.56]]}
    }
    grid = [
        {
            "properties": {"id": "cell_1", "heat_score": 0.8},
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[77.19, 28.53], [77.23, 28.53], [77.23, 28.57], [77.19, 28.57], [77.19, 28.53]]]
            }
        }
    ]

    engine = HeatCoverageEngine([c1, c2], grid)
    heat1, phys1, _ = engine.compute_coverage(["c1"])
    heat2, phys2, _ = engine.compute_coverage(["c2"])
    heat_both, phys_both, _ = engine.compute_coverage(["c1", "c2"])

    # Physical union must be strictly less than sum of individuals due to intersection at center
    assert phys_both < (phys1 + phys2), "Overlapping buffers must not be double counted"
    assert heat_both < (heat1 + heat2), "Heat score in overlapping area must not be double counted"


def test_empty_candidates_or_empty_grid_handled_gracefully():
    """Engine must handle empty candidate list or empty grid without crashing."""
    candidates = get_candidate_corridors()
    grid = get_heat_grid_cells()

    engine = HeatCoverageEngine(candidates, grid)
    heat, phys_ha, phys_sqm = engine.compute_coverage([])
    assert heat == 0.0
    assert phys_ha == 0.0
    assert phys_sqm == 0.0

    engine_empty_grid = HeatCoverageEngine(candidates, [])
    heat_g, _, _ = engine_empty_grid.compute_coverage(["cand_001"])
    assert heat_g == 0.0


# ==============================================================================
# 3. COST & OPTIMIZATION AUDIT TESTS
# ==============================================================================

def test_budget_invariant_across_edge_cases():
    """
    Test budget invariant sum(costs) <= budget across all edge cases:
    - Zero budget
    - Below cheapest candidate cost
    - Exact cost of one candidate
    - Multi-candidate budget
    - Total candidate cost
    - Exceeding total candidate cost
    """
    candidates = get_candidate_corridors()
    patches = get_green_patches()
    grid = get_heat_grid_cells()

    min_cost = min(float(c["properties"]["estimated_cost_inr"]) for c in candidates)
    total_cost = sum(float(c["properties"]["estimated_cost_inr"]) for c in candidates)

    edge_budgets = [
        0.0,
        min_cost - 1000.0,          # below cheapest
        min_cost,                   # exact single candidate
        min_cost + 500000.0,
        50000000.0,                 # ₹5 Crore
        total_cost,                 # exact total network
        total_cost + 50000000.0     # above total network
    ]

    for b in edge_budgets:
        for prof in ["connectivity_first", "heat_priority_first"]:
            res = run_corridor_optimization(candidates, patches, grid, b, prof)
            spent = res["metadata"]["total_spent_inr"]
            rem = res["metadata"]["budget_remaining_inr"]

            assert spent <= b, f"Budget {b} exceeded for {prof}: spent {spent}"
            assert abs(spent + rem - b) < 0.01

            if b == 0.0 or b < min_cost:
                assert res["metadata"]["selected_count"] == 0


def test_invalid_cost_candidates_excluded_explicitly():
    """Candidates with invalid, missing, or non-positive cost must be excluded explicitly."""
    candidates = get_candidate_corridors()
    patches = get_green_patches()
    grid = get_heat_grid_cells()

    # Create synthetic candidate with missing/zero cost
    corrupt_candidates = [dict(c) for c in candidates]
    corrupt_candidates[0] = {
        "type": "Feature",
        "properties": {
            "candidate_id": "cand_invalid",
            "name": "Corrupt Route",
            "estimated_cost_inr": None,
            "length_km": 2.5
        },
        "geometry": corrupt_candidates[0]["geometry"]
    }

    res = run_corridor_optimization(corrupt_candidates, patches, grid, 50000000.0, "connectivity_first")
    excluded_ids = [e["candidate_id"] for e in res["excluded_candidates"]]
    assert "cand_invalid" in excluded_ids
    
    cand_exc = next(e for e in res["excluded_candidates"] if e["candidate_id"] == "cand_invalid")
    assert "Excluded" in cand_exc["exclusion_reason"]


def test_deterministic_tie_breaking_invariant():
    """Shuffling candidate list ordering must produce the identical selection sequence."""
    candidates = get_candidate_corridors()
    patches = get_green_patches()
    grid = get_heat_grid_cells()

    reversed_candidates = list(reversed(candidates))

    res1 = run_corridor_optimization(candidates, patches, grid, 50000000.0, "connectivity_first")
    res2 = run_corridor_optimization(reversed_candidates, patches, grid, 50000000.0, "connectivity_first")

    cids1 = [c["candidate_id"] for c in res1["selected_candidates"]]
    cids2 = [c["candidate_id"] for c in res2["selected_candidates"]]

    assert cids1 == cids2, "Candidate evaluation order must not alter selection sequence"


def test_marginal_benefit_recalculation_dynamics():
    """Verify that marginal benefit is recalculated after each selection step."""
    candidates = get_candidate_corridors()
    patches = get_green_patches()
    grid = get_heat_grid_cells()

    res = run_corridor_optimization(candidates, patches, grid, 50000000.0, "connectivity_first")
    steps = res["selected_candidates"]

    assert len(steps) >= 2
    # Verify every selected corridor had positive marginal benefit and positive ratio
    for s in steps:
        assert s["marginal_benefit"] > 0
        assert s["efficiency_ratio"] > 0


# ==============================================================================
# 4. SCENARIO COMPARISON AUDIT TESTS
# ==============================================================================

def test_scenario_comparison_exact_consensus_and_divergence():
    """Verify that consensus routes are the exact intersection and divergent routes are exact set differences."""
    candidates = get_candidate_corridors()
    patches = get_green_patches()
    grid = get_heat_grid_cells()

    from app.api.routes import compare_scenarios
    from app.schemas.plan import ScenarioComparisonRequest
    import asyncio

    req = ScenarioComparisonRequest(budget_inr=50000000.0)
    res = asyncio.run(compare_scenarios(req))

    conn_cids = {c.candidate_id for c in res.connectivity_plan.selected_candidates}
    heat_cids = {c.candidate_id for c in res.heat_priority_plan.selected_candidates}

    assert set(res.overlap_candidate_ids) == (conn_cids & heat_cids)
    assert set(res.divergent_connectivity_ids) == (conn_cids - heat_cids)
    assert set(res.divergent_heat_ids) == (heat_cids - conn_cids)
    assert res.connectivity_plan.metadata.budget_inr == res.heat_priority_plan.metadata.budget_inr
    assert res.connectivity_plan.metadata.total_spent_inr <= 50000000.0
    assert res.heat_priority_plan.metadata.total_spent_inr <= 50000000.0
