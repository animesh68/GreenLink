import json
import urllib.request

BASE_URL = "http://127.0.0.1:8000/api/v1"

def query(endpoint, method="GET", payload=None):
    url = f"{BASE_URL}{endpoint}"
    data = json.dumps(payload).encode("utf-8") if payload else None
    headers = {"Content-Type": "application/json"} if payload else {}
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

print("=== 1. API Health Check ===")
health = query("/health")
print("Health:", health)

print("\n=== 2. Study Area Metadata ===")
study = query("/study-area")
print("Study Area:", study["study_area_name"], f"({study['area_approx_km2']} km2)")
print("Green patches:", study["data_summary"]["green_patches_count"], f"({study['data_summary']['total_green_area_hectares']} ha)")

print("\n=== 3. Candidate Corridors Summary ===")
cand_summary = query("/candidate-corridors/summary")
print("Total candidates:", cand_summary["total_candidates"])
print("Total length:", f"{cand_summary['total_length_km']:.2f} km")
print(f"Total cost: Rs {cand_summary['total_provisional_cost_inr']:,.0f} (Rs {cand_summary['total_provisional_cost_inr']/1e7:.2f} Cr)")

print("\n=== 4. Optimization API Verification ===")
budgets = [1.0, 3.0, 5.0, 10.0]
profiles = ["connectivity_first", "heat_priority_first"]

for b_cr in budgets:
    b_inr = b_cr * 1e7
    for p in profiles:
        req_body = {"budget_inr": b_inr, "profile": p}
        # Run twice to verify deterministic outputs
        res1 = query("/plan/optimize", method="POST", payload=req_body)
        res2 = query("/plan/optimize", method="POST", payload=req_body)
        
        cids1 = [c["candidate_id"] for c in res1["selected_candidates"]]
        cids2 = [c["candidate_id"] for c in res2["selected_candidates"]]
        assert cids1 == cids2, f"Nondeterministic corridor selection for {b_cr} Cr {p}!"
        assert res1["metadata"]["total_spent_inr"] == res2["metadata"]["total_spent_inr"], "Nondeterministic spent cost!"
        
        m = res1["metadata"]
        obj = res1["objective"]
        sec = res1["secondary_metrics"]
        
        # Invariant check: spent <= budget
        assert m["total_spent_inr"] <= b_inr, f"BUDGET EXCEEDED! {m['total_spent_inr']} > {b_inr}"
        
        print(f"Budget Rs {b_cr:4.1f} Cr | {p:20s} | Selected: {cids1} | Spent: Rs {m['total_spent_inr']/1e7:.4f} Cr | Rem: Rs {m['budget_remaining_inr']/1e7:.4f} Cr | Util: {m['budget_utilization_pct']:5.1f}% | Obj: {obj['baseline_value']} -> {obj['optimized_value']} (+{obj['gain_absolute']}) | Comp: {sec['connected_components_baseline']}->{sec['connected_components_optimized']}")

print("\n=== 5. Scenario Comparison API Verification at Rs 5.00 Cr ===")
compare_res = query("/plan/compare", method="POST", payload={"budget_inr": 50000000.0})
print("Consensus Corridors:", compare_res["overlap_candidate_ids"])
print("Divergent Connectivity:", compare_res["divergent_connectivity_ids"])
print("Divergent Heat Priority:", compare_res["divergent_heat_ids"])
narrative_safe = compare_res["summary_narrative"].encode("ascii", "replace").decode("ascii")
print("Narrative:", narrative_safe)
print("\n>>> ALL CHECKS, DETERMINISM, AND INVARIANTS PASSED! <<<")
