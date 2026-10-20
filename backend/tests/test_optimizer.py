import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.geospatial.loaders import get_candidate_corridors, get_green_patches, get_heat_grid_cells
from app.optimization.optimizer import run_corridor_optimization

client = TestClient(app)


def test_budget_never_exceeded_multiple_levels():
    """Verifies the budget invariant sum(costs) <= budget across diverse budget levels."""
    candidates = get_candidate_corridors()
    patches = get_green_patches()
    grid = get_heat_grid_cells()

    test_budgets = [
        10000000.0,   # 1 Crore
        30000000.0,   # 3 Crore
        50000000.0,   # 5 Crore
        80000000.0,   # 8 Crore
        150000000.0,  # 15 Crore
        250000000.0   # 25 Crore (exceeds total network cost)
    ]

    for budget in test_budgets:
        for profile in ["connectivity_first", "heat_priority_first"]:
            res = run_corridor_optimization(candidates, patches, grid, budget, profile)
            meta = res["metadata"]
            total_spent = meta["total_spent_inr"]
            rem_budget = meta["budget_remaining_inr"]

            assert total_spent <= budget, f"Profile {profile} at budget {budget} exceeded budget: spent {total_spent}"
            assert abs(total_spent + rem_budget - budget) < 0.01
            assert meta["budget_utilization_pct"] <= 100.0


def test_deterministic_reproducibility():
    """Identical inputs must yield 100% identical outputs and selection order."""
    candidates = get_candidate_corridors()
    patches = get_green_patches()
    grid = get_heat_grid_cells()

    run1 = run_corridor_optimization(candidates, patches, grid, 50000000.0, "connectivity_first")
    run2 = run_corridor_optimization(candidates, patches, grid, 50000000.0, "connectivity_first")

    cids1 = [c["candidate_id"] for c in run1["selected_candidates"]]
    cids2 = [c["candidate_id"] for c in run2["selected_candidates"]]
    assert cids1 == cids2
    assert run1["metadata"]["total_spent_inr"] == run2["metadata"]["total_spent_inr"]
    assert run1["objective"]["optimized_value"] == run2["objective"]["optimized_value"]


def test_zero_and_insufficient_budget():
    """Zero budget or budget lower than cheapest candidate must select zero routes."""
    candidates = get_candidate_corridors()
    patches = get_green_patches()
    grid = get_heat_grid_cells()

    # Zero budget
    res_zero = run_corridor_optimization(candidates, patches, grid, 0.0, "connectivity_first")
    assert res_zero["metadata"]["selected_count"] == 0
    assert res_zero["metadata"]["total_spent_inr"] == 0.0
    assert res_zero["metadata"]["budget_remaining_inr"] == 0.0
    assert len(res_zero["selected_candidates"]) == 0
    assert len(res_zero["excluded_candidates"]) == len(candidates)

    # Insufficient budget (e.g. ₹10,000 where minimum corridor is ₹51.58 Lakhs)
    res_low = run_corridor_optimization(candidates, patches, grid, 10000.0, "connectivity_first")
    assert res_low["metadata"]["selected_count"] == 0
    assert res_low["metadata"]["total_spent_inr"] == 0.0
    assert res_low["metadata"]["budget_remaining_inr"] == 10000.0


def test_negative_budget_raises_error():
    """Negative budget must raise a clear ValueError."""
    candidates = get_candidate_corridors()
    patches = get_green_patches()
    grid = get_heat_grid_cells()

    with pytest.raises(ValueError, match="Budget must be non-negative"):
        run_corridor_optimization(candidates, patches, grid, -500000.0, "connectivity_first")


def test_no_double_counting_heat_buffers():
    """Verifies that unary_union prevents double-counting overlapping candidate buffers."""
    candidates = get_candidate_corridors()
    grid = get_heat_grid_cells()

    from app.optimization.heat_coverage import HeatCoverageEngine
    engine = HeatCoverageEngine(candidates, grid)

    # Single corridor
    heat1, phys1_ha, _ = engine.compute_coverage(["cand_001"])
    # Two identical corridors evaluated together (simulating complete overlap)
    heat_double, phys_double_ha, _ = engine.compute_coverage(["cand_001", "cand_001"])

    assert phys1_ha == phys_double_ha
    assert heat1 == heat_double


def test_scenario_divergence_under_same_budget():
    """Connectivity-First and Heat-Priority-First should reflect genuine trade-offs."""
    candidates = get_candidate_corridors()
    patches = get_green_patches()
    grid = get_heat_grid_cells()

    budget = 50000000.0  # ₹5 Crore
    plan_conn = run_corridor_optimization(candidates, patches, grid, budget, "connectivity_first")
    plan_heat = run_corridor_optimization(candidates, patches, grid, budget, "heat_priority_first")

    conn_cids = [c["candidate_id"] for c in plan_conn["selected_candidates"]]
    heat_cids = [c["candidate_id"] for c in plan_heat["selected_candidates"]]

    # Both must respect budget
    assert plan_conn["metadata"]["total_spent_inr"] <= budget
    assert plan_heat["metadata"]["total_spent_inr"] <= budget

    # Connectivity-first must achieve equal or higher IIC
    assert plan_conn["secondary_metrics"]["connectivity_index_iic"] >= plan_heat["secondary_metrics"]["connectivity_index_iic"]

    # Heat-priority-first must achieve equal or higher heat mitigation coverage
    assert plan_heat["objective"]["optimized_value"] >= plan_conn["secondary_metrics"]["heat_mitigation_coverage_ha"]


def test_api_optimize_endpoint_connectivity():
    """Tests POST /api/v1/plan/optimize with connectivity_first profile."""
    payload = {
        "budget_inr": 50000000.0,
        "profile": "connectivity_first"
    }
    resp = client.post("/api/v1/plan/optimize", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert "metadata" in data
    assert "objective" in data
    assert "selected_candidates" in data
    assert "selected_corridors_geojson" in data
    assert "excluded_candidates" in data

    meta = data["metadata"]
    assert meta["profile"] == "connectivity_first"
    assert meta["total_spent_inr"] <= 50000000.0
    assert meta["selected_count"] > 0
    assert "Connectivity Index" in data["objective"]["name"]
    assert data["objective"]["optimized_value"] >= data["objective"]["baseline_value"]


def test_api_optimize_endpoint_heat_priority():
    """Tests POST /api/v1/plan/optimize with heat_priority_first profile."""
    payload = {
        "budget_inr": 40000000.0,
        "profile": "heat_priority_first"
    }
    resp = client.post("/api/v1/plan/optimize", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    meta = data["metadata"]
    assert meta["profile"] == "heat_priority_first"
    assert meta["total_spent_inr"] <= 40000000.0
    assert "Heat-Priority" in data["objective"]["name"]
    assert "proxy grid" in data["objective"]["limitations"].lower()



def test_api_optimize_invalid_inputs():
    """Tests input validation: negative budget and unsupported profile."""
    # Negative budget
    resp_neg = client.post("/api/v1/plan/optimize", json={"budget_inr": -100.0, "profile": "connectivity_first"})
    assert resp_neg.status_code == 422

    # Unreasonable budget (exceeds 50 Cr)
    resp_huge = client.post("/api/v1/plan/optimize", json={"budget_inr": 1000000000.0, "profile": "connectivity_first"})
    assert resp_huge.status_code == 422

    # Invalid profile
    resp_prof = client.post("/api/v1/plan/optimize", json={"budget_inr": 50000000.0, "profile": "unknown_profile"})
    assert resp_prof.status_code == 400
    assert "Invalid profile" in resp_prof.json()["detail"]


def test_api_compare_scenarios_endpoint():
    """Tests POST /api/v1/plan/compare endpoint."""
    payload = {"budget_inr": 50000000.0}
    resp = client.post("/api/v1/plan/compare", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert data["budget_inr"] == 50000000.0
    assert "connectivity_plan" in data
    assert "heat_priority_plan" in data
    assert "overlap_candidate_ids" in data
    assert "summary_narrative" in data
    assert len(data["summary_narrative"]) > 20
