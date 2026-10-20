import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["application"] == settings.PROJECT_NAME
    assert data["docs_url"] == "/docs"
    assert "/api/v1/health" in data["health_check"]


def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["application"] == "GreenLink Delhi"
    assert data["version"] == "0.1.0"


def test_study_area_endpoint():
    response = client.get("/api/v1/study-area")
    assert response.status_code == 200
    data = response.json()
    
    assert data["study_area_name"] == "South-Central Delhi Study Area"
    assert data["is_official_administrative_boundary"] is False
    
    bbox = data["bounding_box"]
    assert bbox["southwest"]["longitude"] == 77.160
    assert bbox["southwest"]["latitude"] == 28.530
    assert bbox["northeast"]["longitude"] == 77.270
    assert bbox["northeast"]["latitude"] == 28.640
    
    assert data["crs"]["storage_and_display"] == "EPSG:4326"
    assert data["crs"]["metric_computations"] == "EPSG:32643"
    
    boundary = data["boundary_geojson"]
    assert boundary["type"] == "FeatureCollection"
    assert len(boundary["features"]) >= 1
    assert boundary["features"][0]["geometry"]["type"] == "Polygon"


def test_green_spaces_endpoint():
    response = client.get("/api/v1/green-spaces")
    assert response.status_code == 200
    data = response.json()
    
    assert data["type"] == "FeatureCollection"
    features = data.get("features", [])
    assert len(features) >= 10, f"Expected at least 10 green spaces, got {len(features)}"
    
    for f in features:
        assert f["type"] == "Feature"
        props = f["properties"]
        assert "id" in props
        assert "name" in props
        assert "area_hectares" in props
        assert props["area_hectares"] > 0
        
        geom = f["geometry"]
        assert geom["type"] in ["Polygon", "MultiPolygon"]
        coords = geom["coordinates"]
        assert len(coords) > 0


def test_candidate_corridors_endpoint():
    response = client.get("/api/v1/candidate-corridors")
    assert response.status_code == 200
    data = response.json()

    assert data["type"] == "FeatureCollection"
    features = data.get("features", [])
    assert len(features) >= 10, f"Expected at least 10 candidate corridors, got {len(features)}"

    for f in features:
        assert f["type"] == "Feature"
        props = f["properties"]
        assert "candidate_id" in props
        assert "source_anchor_id" in props
        assert "target_anchor_id" in props
        assert "source_name" in props
        assert "target_name" in props
        assert "length_m" in props
        assert props["length_m"] > 0
        assert "length_km" in props
        assert props["length_km"] > 0
        assert "estimated_cost_inr" in props
        assert props["estimated_cost_inr"] > 0
        assert props["route_method"] == "NetworkX Dijkstra Shortest Path"
        assert props["network_source"] == "OpenStreetMap Real Road Network"

        geom = f["geometry"]
        assert geom["type"] == "LineString"
        coords = geom["coordinates"]
        assert len(coords) >= 2, f"LineString should have at least 2 points, got {len(coords)}"
        
        # Verify all coordinates are within the study extent tolerance
        for lon, lat in coords:
            assert 77.15 <= lon <= 77.28, f"Longitude {lon} out of study extent"
            assert 28.52 <= lat <= 28.65, f"Latitude {lat} out of study extent"


def test_candidate_summary_endpoint():
    response = client.get("/api/v1/candidate-corridors/summary")
    assert response.status_code == 200
    data = response.json()

    assert data["total_candidates"] >= 10
    assert data["total_length_km"] > 0
    assert data["status"] == "active"
    
    stats = data["length_stats_m"]
    assert stats["min"] <= stats["median"] <= stats["max"]
    assert stats["min"] > 0
    assert data["total_provisional_cost_inr"] > 0


def test_heat_priority_grid_endpoint():
    response = client.get("/api/v1/heat-priority-grid")
    assert response.status_code == 200
    data = response.json()

    assert data["type"] == "FeatureCollection"
    features = data.get("features", [])
    assert len(features) == 143, f"Expected 143 grid cells, got {len(features)}"

    for f in features:
        assert f["type"] == "Feature"
        props = f["properties"]
        assert "id" in props
        assert "heat_score" in props
        assert 0.1 <= props["heat_score"] <= 1.0
        assert f["geometry"]["type"] == "Polygon"


def test_cors_headers():
    response = client.options(
        "/api/v1/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET"
        }
    )
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
