import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_user_corridors_requires_at_least_two_endpoints():
    # Only 1 patch
    response = client.post(
        "/api/v1/plan/user-corridors",
        json={"selected_patch_ids": ["patch_001"]}
    )
    assert response.status_code == 400
    assert "At least 2" in response.json()["detail"]

    # 0 patches
    response_empty = client.post(
        "/api/v1/plan/user-corridors",
        json={"selected_patch_ids": []}
    )
    assert response_empty.status_code == 400


def test_user_corridors_with_two_patches():
    # patch_001 (Sanjay Van) and patch_002 (Hauz Khas)
    response = client.post(
        "/api/v1/plan/user-corridors",
        json={"selected_patch_ids": ["patch_001", "patch_002"]}
    )
    assert response.status_code == 200
    data = response.json()

    assert data["selected_patch_ids"] == ["patch_001", "patch_002"]
    assert len(data["selected_endpoints"]) == 2
    assert data["total_candidate_routes"] == 1
    assert data["total_candidate_length_km"] > 0
    assert data["total_candidate_cost_inr"] > 0

    features = data["candidate_corridors_geojson"]["features"]
    assert len(features) == 1
    feat = features[0]
    assert feat["geometry"]["type"] == "LineString"
    assert len(feat["geometry"]["coordinates"]) >= 2
    assert feat["properties"]["source_anchor_id"] in ["patch_001", "patch_002"]
    assert feat["properties"]["target_anchor_id"] in ["patch_001", "patch_002"]


def test_user_corridors_with_three_patches():
    # patch_001, patch_002, patch_003
    response = client.post(
        "/api/v1/plan/user-corridors",
        json={"selected_patch_ids": ["patch_001", "patch_002", "patch_003"]}
    )
    assert response.status_code == 200
    data = response.json()

    assert len(data["selected_endpoints"]) == 3
    # 3 endpoints -> 3 pairwise corridors
    assert data["total_candidate_routes"] == 3
    assert len(data["candidate_corridors_geojson"]["features"]) == 3


def test_user_corridors_with_budget_and_optimization():
    # Provide budget to optimize the generated corridors
    response = client.post(
        "/api/v1/plan/user-corridors",
        json={
            "selected_patch_ids": ["patch_001", "patch_002", "patch_003"],
            "budget_inr": 20000000.0,
            "profile": "connectivity_first"
        }
    )
    assert response.status_code == 200
    data = response.json()

    assert data["optimization_plan"] is not None
    plan = data["optimization_plan"]
    meta = plan["metadata"]
    assert meta["total_spent_inr"] <= 20000000.0
    assert meta["budget_inr"] == 20000000.0
    assert meta["budget_utilization_pct"] <= 100.0
    assert meta["profile"] == "connectivity_first"


def test_user_corridors_with_custom_point():
    response = client.post(
        "/api/v1/plan/user-corridors",
        json={
            "selected_patch_ids": ["patch_001"],
            "custom_points": [
                {
                    "id": "custom_pt_01",
                    "name": "IIT Delhi Main Gate",
                    "coordinates": [77.1925, 28.5450]
                }
            ]
        }
    )
    assert response.status_code == 200
    data = response.json()

    assert data["total_candidate_routes"] == 1
    features = data["candidate_corridors_geojson"]["features"]
    assert len(features) == 1
    feat = features[0]
    assert feat["geometry"]["type"] == "LineString"
    assert feat["properties"]["target_anchor_id"] == "custom_pt_01" or feat["properties"]["source_anchor_id"] == "custom_pt_01"
