import json
import urllib.request
import urllib.error
import sys

BASE_URL = "http://127.0.0.1:8000/api/v1"

def req(path, method="GET", body=None):
    url = f"{BASE_URL}{path}"
    data = json.dumps(body).encode("utf-8") if body is not None else None
    headers = {"Content-Type": "application/json"} if body is not None else {}
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(r, timeout=10) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))

print("==================================================================")
print("  GreenLink Delhi 2.0 - Exhaustive End-to-End Integration Verification")
print("==================================================================")

# 1. Health check
status, health = req("/health")
assert status == 200
assert health["status"] == "ok"
print(f"[PASS] 1. Health check: status={health['status']}, version={health['version']}")

# 2. Study Area Metadata
status, study = req("/study-area")
assert status == 200
assert study["study_area_name"] == "South-Central Delhi Study Area"
assert study["bounding_box"]["southwest"]["longitude"] == 77.16
print(f"[PASS] 2. Study Area: {study['study_area_name']} ({study['area_approx_km2']} km2)")

# 3. Green Spaces GeoJSON
status, greens = req("/green-spaces")
assert status == 200
assert greens["type"] == "FeatureCollection"
features = greens["features"]
assert len(features) == 12, f"Expected 12 green patches, got {len(features)}"
patch_ids = [f["properties"]["id"] for f in features]
print(f"[PASS] 3. Green spaces GeoJSON: {len(features)} patches loaded ({', '.join(patch_ids[:4])}...)")

# 4. Detail endpoint for each green space
for pid in patch_ids:
    status, detail = req(f"/green-spaces/{pid}")
    assert status == 200
    assert detail["id"] == pid
    assert "reference_metadata" in detail or "gis_measurements" in detail
print(f"[PASS] 4. Green space detail endpoint: verified all 12 patches individually")

# 5. Candidate corridors GeoJSON
status, corridors = req("/candidate-corridors")
assert status == 200
assert corridors["type"] == "FeatureCollection"
cand_feats = corridors["features"]
assert len(cand_feats) == 14, f"Expected 14 corridors, got {len(cand_feats)}"
cand_ids = [c["properties"]["candidate_id"] for c in cand_feats]
print(f"[PASS] 5. Candidate corridors GeoJSON: {len(cand_feats)} corridors ({', '.join(cand_ids[:4])}...)")

# 6. Candidate summary
status, summary = req("/candidate-corridors/summary")
assert status == 200
assert summary["total_candidates"] == 14
assert summary["total_length_km"] > 0
print(f"[PASS] 6. Candidate summary: {summary['total_candidates']} routes, {summary['total_length_km']:.2f} km total")

# 7. Corridor details and connected green spaces
for cid in cand_ids:
    status, cdetail = req(f"/corridors/{cid}")
    assert status == 200
    assert cdetail["candidate_id"] == cid
    status, clinks = req(f"/corridors/{cid}/connected-green-spaces")
    assert status == 200
    assert clinks["candidate_id"] == cid
print(f"[PASS] 7. Corridor details & topological green-space links: verified all 14 corridors")

# 8. Heat priority grid
status, heat = req("/heat-priority-grid")
assert status == 200
assert len(heat["features"]) == 143
print(f"[PASS] 8. Heat priority grid: {len(heat['features'])} cells verified")

# 9. Optimization API (Greedy marginal-benefit solver)
for profile in ["connectivity_first", "heat_priority_first"]:
    status, opt = req("/plan/optimize", method="POST", body={"budget_inr": 30000000.0, "profile": profile})
    assert status == 200
    assert opt["metadata"]["profile"] == profile
    assert opt["metadata"]["total_spent_inr"] <= 30000000.0
    print(f"[PASS] 9. Plan optimize ({profile}): selected {opt['metadata']['selected_count']} corridors, spent Rs {opt['metadata']['total_spent_inr']/1e7:.2f} Cr")

# 10. Scenario comparison API
status, comp = req("/plan/compare", method="POST", body={"budget_inr": 50000000.0})
assert status == 200
assert "overlap_candidate_ids" in comp
assert "summary_narrative" in comp
print(f"[PASS] 10. Scenario comparison: consensus corridors={comp['overlap_candidate_ids']}")

# 11. User-directed corridor routing & optimization
status, user_plan = req("/plan/user-corridors", method="POST", body={
    "selected_patch_ids": ["patch_001", "patch_002", "patch_003"],
    "budget_inr": 20000000.0,
    "profile": "connectivity_first"
})
assert status == 200
assert user_plan["total_candidate_routes"] > 0
print(f"[PASS] 11. User-directed routing: generated {user_plan['total_candidate_routes']} street-network routes connecting patches")

print("\n==================================================================")
print("  >>> ALL 11 INTEGRATION VERIFICATION CHECKS PASSED PERFECTLY! <<<")
print("==================================================================")
