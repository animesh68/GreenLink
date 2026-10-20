from typing import Dict, Any


def generate_corridor_explanation(
    step: int,
    candidate_props: Dict[str, Any],
    profile: str,
    marginal_benefit: float,
    efficiency_ratio: float,
    comp_reduction: bool = False,
    remaining_budget: float = 0.0
) -> str:
    """
    Generates a deterministic, data-grounded rationale for why the optimization algorithm
    selected this corridor at this specific step.
    """
    cid = candidate_props.get("candidate_id", "cand")
    name = candidate_props.get("name", "Corridor")
    source = candidate_props.get("source_name", "Source Patch")
    target = candidate_props.get("target_name", "Target Patch")
    cost_inr = float(candidate_props.get("estimated_cost_inr", 0.0))
    length_km = float(candidate_props.get("length_km", 0.0))
    typology = candidate_props.get("dominant_typology", "secondary street")
    primary_streets = candidate_props.get("primary_streets", "street network")

    cost_lakhs = cost_inr / 100000.0

    if profile == "connectivity_first":
        comp_text = " (merging disconnected components)" if comp_reduction else ""
        rationale = (
            f"Step {step} Selection [{cid}]: Connects green anchors '{source}' and '{target}' along {primary_streets}. "
            f"Yields a marginal distance-weighted connectivity gain of +{marginal_benefit:.3f} IIC_dist pts{comp_text} "
            f"at an efficiency of {efficiency_ratio:.2f} pts/Cr (provisional cost: ₹{cost_lakhs:,.1f} Lakhs for {length_km:.2f} km of {typology} corridor)."
        )
    elif profile == "heat_priority_first":
        rationale = (
            f"Step {step} Selection [{cid}]: Prioritized for targeting high heat-vulnerability grid zones along {primary_streets}. "
            f"Adds +{marginal_benefit:.2f} ha of weighted heat-priority proxy coverage "
            f"at an efficiency of {efficiency_ratio:.2f} ha/Cr (provisional cost: ₹{cost_lakhs:,.1f} Lakhs for {length_km:.2f} km of {typology} corridor)."
        )
    else:
        rationale = (
            f"Step {step} Selection [{cid}]: Multi-criteria selection linking '{source}' and '{target}' "
            f"with marginal benefit {marginal_benefit:.2f} at an efficiency ratio of {efficiency_ratio:.2f} (cost: ₹{cost_lakhs:,.1f} Lakhs)."
        )

    return rationale

