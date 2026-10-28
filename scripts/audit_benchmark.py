import sys
import os
import json

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.geospatial.loaders import get_candidate_corridors, get_green_patches, get_heat_grid_cells
from app.optimization.optimizer import run_corridor_optimization

def run_benchmarks():
    candidates = get_candidate_corridors()
    patches = get_green_patches()
    grid = get_heat_grid_cells()

    total_network_cost = sum(float(c["properties"]["estimated_cost_inr"]) for c in candidates)

    budgets = [
        ("₹1 Crore", 10000000.0),
        ("₹3 Crore", 30000000.0),
        ("₹5 Crore", 50000000.0),
        ("₹10 Crore", 100000000.0),
        (f"Max (₹{total_network_cost/1e7:.2f} Cr)", total_network_cost)
    ]

    profiles = ["connectivity_first", "heat_priority_first"]

    results = []

    for b_label, budget in budgets:
        for profile in profiles:
            res = run_corridor_optimization(candidates, patches, grid, budget, profile)
            meta = res["metadata"]
            obj = res["objective"]
            sec = res["secondary_metrics"]
            selected_cids = [c["candidate_id"] for c in res["selected_candidates"]]
            excluded_reasons = {e["candidate_id"]: e["exclusion_reason"] for e in res["excluded_candidates"][:3]}

            results.append({
                "budget_label": b_label,
                "budget_inr": budget,
                "profile": profile,
                "selected_count": meta["selected_count"],
                "selected_cids": selected_cids,
                "total_spent_inr": meta["total_spent_inr"],
                "total_spent_cr": round(meta["total_spent_inr"] / 1e7, 2),
                "remaining_budget_inr": meta["budget_remaining_inr"],
                "remaining_cr": round(meta["budget_remaining_inr"] / 1e7, 2),
                "objective_name": obj["name"],
                "baseline_value": obj["baseline_value"],
                "optimized_value": obj["optimized_value"],
                "gain_absolute": obj["gain_absolute"],
                "secondary_iic": sec["connectivity_index_iic"],
                "secondary_heat_ha": sec.get("heat_priority_coverage_ha", sec.get("heat_mitigation_coverage_ha", 0.0)),
                "sample_exclusions": excluded_reasons
            })

    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    run_benchmarks()
