import copy
import networkx as nx
from typing import Dict, Any, List, Optional

from app.optimization.graph import build_base_graph, compute_connectivity_index
from app.optimization.heat_coverage import HeatCoverageEngine
from app.optimization.explainer import generate_corridor_explanation


def run_corridor_optimization(
    candidates: List[Dict[str, Any]],
    patches: List[Dict[str, Any]],
    grid: List[Dict[str, Any]],
    budget_inr: float,
    profile: str = "connectivity_first"
) -> Dict[str, Any]:
    """
    Executes a deterministic greedy marginal-benefit budget-constrained optimization algorithm.
    Strictly enforces the budget invariant: sum(cost of selected corridors) <= budget_inr.
    
    Profiles supported:
      - 'connectivity_first': Maximizes Integral Index of Connectivity (IIC) gain per INR spent.
      - 'heat_priority_first': Maximizes urban heat island mitigation coverage (ha) per INR spent.
    """
    # 1. Validate budget input
    if budget_inr < 0:
        raise ValueError(f"Budget must be non-negative, got {budget_inr}")

    # 2. Filter valid candidates upfront
    valid_candidates: List[Dict[str, Any]] = []
    excluded_initial: List[Dict[str, Any]] = []

    for cand in candidates:
        props = cand.get("properties", {})
        cid = props.get("candidate_id") or cand.get("id")
        cost = props.get("estimated_cost_inr")

        if cost is None or not isinstance(cost, (int, float)) or cost <= 0:
            excluded_initial.append({
                "candidate_id": cid,
                "name": props.get("name", cid),
                "estimated_cost_inr": 0.0,
                "length_km": float(props.get("length_km", 0.0)),
                "exclusion_reason": "Excluded: Cost estimate unavailable, non-numeric, or non-positive."
            })
        else:
            valid_candidates.append(cand)

    # 3. Initialize baseline graph & heat coverage engine
    G_base, total_area_ha, node_areas = build_base_graph(patches)
    baseline_ci = compute_connectivity_index(G_base, total_area_ha, node_areas)
    baseline_components = nx.number_connected_components(G_base)

    heat_engine = HeatCoverageEngine(valid_candidates, grid)
    baseline_heat, baseline_phys_ha, _ = heat_engine.compute_coverage([])


    # 4. Greedy Selection State
    G_curr = G_base.copy()
    current_ci = baseline_ci
    selected_corridors: List[Dict[str, Any]] = []
    selected_cids: List[str] = []
    selection_details: List[Dict[str, Any]] = []

    remaining_budget = float(budget_inr)
    step = 1

    # Active pool: affordable valid candidates
    active_pool = [
        c for c in valid_candidates
        if float(c["properties"]["estimated_cost_inr"]) <= remaining_budget
    ]

    # 5. Greedy Selection Loop
    while active_pool and remaining_budget > 0:
        best_candidate = None
        best_ratio = -1.0
        best_marginal = 0.0
        best_comp_reduction = False

        # Stable evaluation
        for cand in active_pool:
            props = cand["properties"]
            cid = props["candidate_id"]
            cost = float(props["estimated_cost_inr"])
            u = props["source_anchor_id"]
            v = props["target_anchor_id"]
            dist_m = float(props["length_m"])

            # Compute marginal benefit for chosen profile
            if profile == "connectivity_first":
                G_test = G_curr.copy()
                G_test.add_edge(u, v, weight=dist_m)
                test_ci = compute_connectivity_index(G_test, total_area_ha, node_areas)
                marginal = max(0.0, round(test_ci - current_ci, 4))
                # Ratio: IIC pts gain per Crore INR (1e7)
                ratio = (marginal / (cost / 1e7)) if cost > 0 else 0.0
                comp_reduced = nx.number_connected_components(G_test) < nx.number_connected_components(G_curr)
            else:  # heat_priority_first
                marginal, _ = heat_engine.compute_marginal_heat_benefit(selected_cids, cid)
                # Ratio: heat-weighted ha per Crore INR (1e7)
                ratio = (marginal / (cost / 1e7)) if cost > 0 else 0.0
                comp_reduced = False

            # Deterministic tie-breaking:
            # (ratio, marginal, -cost, -candidate_id for lexicographical ascending)
            is_better = False
            if best_candidate is None:
                if marginal > 0 and ratio > 0:
                    is_better = True
            else:
                if ratio > best_ratio + 1e-7:
                    is_better = True
                elif abs(ratio - best_ratio) <= 1e-7:
                    if marginal > best_marginal + 1e-7:
                        is_better = True
                    elif abs(marginal - best_marginal) <= 1e-7:
                        best_cost = float(best_candidate["properties"]["estimated_cost_inr"])
                        if cost < best_cost:
                            is_better = True
                        elif abs(cost - best_cost) < 1.0:
                            # Lexicographical tie-break
                            if cid < best_candidate["properties"]["candidate_id"]:
                                is_better = True

            if is_better:
                best_ratio = ratio
                best_marginal = marginal
                best_candidate = cand
                best_comp_reduction = comp_reduced

        # If no affordable candidate delivers positive marginal gain, terminate loop
        if best_candidate is None or best_ratio <= 0 or best_marginal <= 0:
            break

        # Commit selected candidate
        b_props = best_candidate["properties"]
        b_cid = b_props["candidate_id"]
        b_cost = float(b_props["estimated_cost_inr"])
        b_u = b_props["source_anchor_id"]
        b_v = b_props["target_anchor_id"]
        b_dist_m = float(b_props["length_m"])

        # Update remaining budget & graph
        remaining_budget = round(remaining_budget - b_cost, 2)
        selected_cids.append(b_cid)
        G_curr.add_edge(b_u, b_v, weight=b_dist_m)
        current_ci = compute_connectivity_index(G_curr, total_area_ha, node_areas)

        # Generate human-readable rationale
        rationale = generate_corridor_explanation(
            step=step,
            candidate_props=b_props,
            profile=profile,
            marginal_benefit=best_marginal,
            efficiency_ratio=best_ratio,
            comp_reduction=best_comp_reduction,
            remaining_budget=remaining_budget
        )

        # Annotated GeoJSON feature
        feat = copy.deepcopy(best_candidate)
        feat["properties"]["selection_step"] = step
        feat["properties"]["marginal_benefit"] = round(best_marginal, 4)
        feat["properties"]["efficiency_ratio"] = round(best_ratio, 2)
        feat["properties"]["selection_rationale"] = rationale
        feat["properties"]["status"] = "selected"

        selected_corridors.append(feat)

        selection_details.append({
            "step": step,
            "candidate_id": b_cid,
            "name": b_props.get("name", b_cid),
            "source_anchor_id": b_u,
            "source_name": b_props.get("source_name", b_u),
            "target_anchor_id": b_v,
            "target_name": b_props.get("target_name", b_v),
            "length_km": float(b_props.get("length_km", 0.0)),
            "estimated_cost_inr": b_cost,
            "marginal_benefit": round(best_marginal, 4),
            "efficiency_ratio": round(best_ratio, 2),
            "objective_type": "IIC gain (pts)" if profile == "connectivity_first" else "Heat mitigation (ha)",
            "selection_rationale": rationale
        })

        step += 1

        # Re-filter active pool for next iteration
        active_pool = [
            c for c in valid_candidates
            if c["properties"]["candidate_id"] not in selected_cids
            and float(c["properties"]["estimated_cost_inr"]) <= remaining_budget
        ]

    # 6. Categorize Excluded Candidates with Explicit Reasons
    excluded_candidates: List[Dict[str, Any]] = list(excluded_initial)
    for cand in valid_candidates:
        cid = cand["properties"]["candidate_id"]
        if cid in selected_cids:
            continue
        props = cand["properties"]
        cost = float(props["estimated_cost_inr"])

        if budget_inr == 0:
            reason = "Excluded: Zero budget allocated."
        elif cost > remaining_budget:
            reason = (
                f"Excluded: Estimated cost (₹{cost/1e5:,.1f}L) exceeds "
                f"remaining budget of ₹{remaining_budget/1e5:,.1f}L."
            )
        else:
            reason = "Excluded: Lower marginal benefit per INR compared to selected routes or redundant connectivity."

        excluded_candidates.append({
            "candidate_id": cid,
            "name": props.get("name", cid),
            "estimated_cost_inr": cost,
            "length_km": float(props.get("length_km", 0.0)),
            "exclusion_reason": reason
        })

    # 7. Compute Final Metrics for Both Objectives
    total_spent = round(budget_inr - remaining_budget, 2)
    final_components = nx.number_connected_components(G_curr)
    final_heat, final_phys_ha, final_phys_sqm = heat_engine.compute_coverage(selected_cids)
    total_selected_len_km = round(sum(float(c["properties"]["length_km"]) for c in selected_corridors), 2)

    ci_gain = round(current_ci - baseline_ci, 4)
    ci_gain_pct = round((ci_gain / baseline_ci) * 100.0, 2) if baseline_ci > 0 else 0.0
    budget_util_pct = round((total_spent / budget_inr) * 100.0, 1) if budget_inr > 0 else 0.0

    # 8. Define Profile Objective Metadata
    if profile == "connectivity_first":
        objective_def = {
            "name": "Distance-Weighted Connectivity Index (IIC_dist)",
            "formula": "IIC_dist = [sum_{comp} sum_{i,j in comp} (a_i * a_j / (1 + d_G(i,j)/1000m))] / (A_tot^2) * 100",
            "units": "index points [0-100]",
            "baseline_value": round(baseline_ci, 2),
            "optimized_value": round(current_ci, 2),
            "gain_absolute": round(ci_gain, 2),
            "gain_percent": ci_gain_pct,
            "description": "Measures overall spatial connectivity between green-space anchors using a distance-decay gravity formulation based on patch sizes and shortest street-corridor paths.",
            "limitations": "Distance-decay connectivity proxy assuming a 1km characteristic scale. Models shortest street paths between anchor centroids; does not capture physical barriers, traffic deterrence, or species-specific mobility traits."
        }
    else:  # heat_priority_first
        heat_gain = round(final_heat - baseline_heat, 2)
        objective_def = {
            "name": "Heat-Priority Proxy Coverage",
            "formula": "PriorityCoverage = sum_k (heat_score_k * Area(Union(Buffers_50m) intersect Cell_k))",
            "units": "weighted proxy hectares",
            "baseline_value": round(baseline_heat, 2),
            "optimized_value": round(final_heat, 2),
            "gain_absolute": heat_gain,
            "gain_percent": None,
            "description": "Calculates the weighted priority-area coverage across the 143-cell empirical heat-priority grid using 50m right-of-way corridor buffers. Unary union operations eliminate double-counting of overlapping corridor footprints.",
            "limitations": "Based on a 143-cell spatial vulnerability proxy grid reflecting proximity to dense concrete transit hubs versus cool vegetative sinks. Does not represent satellite-derived land-surface temperature (LST) observations or calibrated ambient temperature drops."
        }

    secondary_metrics = {
        "connected_components_baseline": baseline_components,
        "connected_components_optimized": final_components,
        "connected_components_reduction": baseline_components - final_components,
        "connectivity_index_iic": round(current_ci, 2),
        "connectivity_index_gain": round(ci_gain, 2),
        "heat_priority_coverage_ha": final_heat,
        "heat_mitigation_coverage_ha": final_heat,  # Backward compatibility
        "corridor_buffer_physical_ha": final_phys_ha,
        "canopy_buffer_physical_ha": final_phys_ha,  # Backward compatibility
        "corridor_buffer_physical_sqm": final_phys_sqm,
        "canopy_buffer_physical_sqm": final_phys_sqm,  # Backward compatibility
        "selected_corridors_count": len(selected_corridors),
        "selected_corridors_length_km": total_selected_len_km
    }

    metadata = {
        "algorithm": "Deterministic Greedy Marginal-Benefit Knapsack Heuristic (Provisional Approximation — Not Globally Optimal)",
        "profile": profile,
        "budget_inr": float(budget_inr),
        "total_spent_inr": total_spent,
        "budget_remaining_inr": remaining_budget,
        "budget_utilization_pct": budget_util_pct,
        "selected_count": len(selected_corridors),
        "excluded_count": len(excluded_candidates),
        "total_network_length_km": total_selected_len_km,
        "cost_model": "Provisional typology-based benchmarks (Primary: ₹6,000/m, Secondary: ₹4,500/m, Tertiary: ₹3,500/m, Residential: ₹2,500/m + ₹1.5L mobilization). Planning estimates, not official government tender prices.",
        "data_provenance": {
            "source_anchors": "OpenStreetMap 12 Green Anchors (1,752.7 ha)",
            "candidate_network": "Dijkstra Shortest Paths on 77,474-node OSM Graph",
            "heat_grid_source": "South-Central Delhi 143-cell Heat Vulnerability Proxy Grid",
            "coordinate_systems": "Storage: EPSG:4326 | Metric Operations: EPSG:32643"
        }
    }

    return {
        "metadata": metadata,
        "objective": objective_def,
        "secondary_metrics": secondary_metrics,
        "selected_candidates": selection_details,
        "selected_corridors_geojson": {
            "type": "FeatureCollection",
            "features": selected_corridors
        },
        "excluded_candidates": excluded_candidates
    }
