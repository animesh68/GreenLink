import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

from app.main import app
from app.geospatial.loaders import (
    get_precomputed_green_spaces,
    get_precomputed_corridors,
    get_precomputed_corridor_green_links,
    _CACHE
)
from app.reference_data import (
    CORRIDOR_REFERENCE,
    GREEN_SPACE_REFERENCE,
    CORRIDOR_REF_TO_BACKEND,
    GREEN_SPACE_REF_TO_BACKEND,
    CORRIDOR_BACKEND_TO_REF,
    GREEN_SPACE_BACKEND_TO_REF,
    get_corridor_reference,
    get_green_space_reference
)

client = TestClient(app)


# ===========================================================================
# CACHE AND LOADING TESTS
# ===========================================================================

def test_precomputed_cache_loaded_in_memory():
    """Verify precomputed data is cached and accessible in memory without disk re-parsing."""
    greens = get_precomputed_green_spaces()
    corrs = get_precomputed_corridors()
    links = get_precomputed_corridor_green_links()

    assert len(greens) == 12
    assert len(corrs) == 14
    assert len(links) == 14
    assert "precomputed_green_space_details.json" in _CACHE
    assert "precomputed_corridor_details.json" in _CACHE
    assert "precomputed_corridor_green_links.json" in _CACHE


# ===========================================================================
# REFERENCE DATA COMPLETENESS TESTS
# ===========================================================================

def test_all_14_corridor_reference_records_exist():
    """Verify reference data module has all 14 corridor entries."""
    assert len(CORRIDOR_REFERENCE) == 14
    for i in range(1, 15):
        ref_id = f"CAND_{i:03d}"
        assert ref_id in CORRIDOR_REFERENCE, f"Missing corridor reference: {ref_id}"
        entry = CORRIDOR_REFERENCE[ref_id]
        assert "name" in entry
        assert "primary_connecting_roads" in entry
        assert "route_length_km" in entry
        assert "road_width_m" in entry
        assert entry.get("source_label") == "user_supplied_reference"
        assert entry.get("verification_status") == "approximate_unverified"


def test_all_12_green_space_reference_records_exist():
    """Verify reference data module has all 12 green space entries."""
    assert len(GREEN_SPACE_REFERENCE) == 12
    for i in range(1, 13):
        ref_id = f"PATCH_{i:03d}"
        assert ref_id in GREEN_SPACE_REFERENCE, f"Missing green space reference: {ref_id}"
        entry = GREEN_SPACE_REFERENCE[ref_id]
        assert "name" in entry
        assert "area_ha" in entry
        assert "area_acres" in entry
        assert "area_km2" in entry
        assert "perimeter_km" in entry
        assert isinstance(entry["perimeter_km"], dict)
        assert "min" in entry["perimeter_km"]
        assert "max" in entry["perimeter_km"]
        assert entry.get("source_label") == "user_supplied_reference"
        assert entry.get("verification_status") == "approximate_unverified"


# ===========================================================================
# REFERENCE ID MAPPING TESTS
# ===========================================================================

def test_corridor_ref_to_backend_mappings():
    """Verify explicit mapping between reference IDs and backend IDs."""
    assert len(CORRIDOR_REF_TO_BACKEND) == 14
    assert CORRIDOR_REF_TO_BACKEND["CAND_002"] == "cand_002"
    assert CORRIDOR_REF_TO_BACKEND["CAND_003"] == "cand_001"
    assert CORRIDOR_REF_TO_BACKEND["CAND_004"] == "cand_004"
    assert CORRIDOR_REF_TO_BACKEND["CAND_005"] == "cand_005"
    assert CORRIDOR_REF_TO_BACKEND["CAND_006"] == "cand_006"
    assert CORRIDOR_REF_TO_BACKEND["CAND_007"] == "cand_012"
    assert CORRIDOR_REF_TO_BACKEND["CAND_008"] == "cand_011"
    assert CORRIDOR_REF_TO_BACKEND["CAND_009"] == "cand_009"
    assert CORRIDOR_REF_TO_BACKEND["CAND_010"] == "cand_008"
    assert CORRIDOR_REF_TO_BACKEND["CAND_011"] == "cand_013"
    assert CORRIDOR_REF_TO_BACKEND["CAND_012"] == "cand_014"
    assert CORRIDOR_REF_TO_BACKEND["CAND_001"] is None
    assert CORRIDOR_REF_TO_BACKEND["CAND_013"] is None
    assert CORRIDOR_REF_TO_BACKEND["CAND_014"] is None
    for ref_id, b_id in CORRIDOR_REF_TO_BACKEND.items():
        if b_id:
            assert CORRIDOR_BACKEND_TO_REF[b_id] == ref_id


def test_green_space_ref_to_backend_mappings():
    """Verify explicit mapping between green space reference IDs and backend IDs."""
    assert len(GREEN_SPACE_REF_TO_BACKEND) == 12
    assert GREEN_SPACE_REF_TO_BACKEND["PATCH_001"] == "patch_001"  # Central Ridge
    assert GREEN_SPACE_REF_TO_BACKEND["PATCH_002"] == "patch_002"  # Nehru Park
    assert GREEN_SPACE_REF_TO_BACKEND["PATCH_003"] == "patch_003"  # Lodhi Garden
    assert GREEN_SPACE_REF_TO_BACKEND["PATCH_004"] == "patch_005"  # Delhi Golf Club
    assert GREEN_SPACE_REF_TO_BACKEND["PATCH_005"] == "patch_011"  # India Gate
    assert GREEN_SPACE_REF_TO_BACKEND["PATCH_006"] == "patch_006"  # National Zoological Park
    assert GREEN_SPACE_REF_TO_BACKEND["PATCH_007"] == "patch_004"  # Sunder Nursery
    assert GREEN_SPACE_REF_TO_BACKEND["PATCH_008"] == "patch_007"  # Hauz Khas
    assert GREEN_SPACE_REF_TO_BACKEND["PATCH_009"] == "patch_009"  # Siri Fort
    assert GREEN_SPACE_REF_TO_BACKEND["PATCH_010"] == "patch_012"  # Jahanpanah
    assert GREEN_SPACE_REF_TO_BACKEND["PATCH_011"] == "patch_010"  # Sanjay Van
    assert GREEN_SPACE_REF_TO_BACKEND["PATCH_012"] is None          # Aravalli (unmatched)
    for ref_id, b_id in GREEN_SPACE_REF_TO_BACKEND.items():
        if b_id:
            assert GREEN_SPACE_BACKEND_TO_REF[b_id] == ref_id


def test_get_corridor_reference_by_backend_id():
    """Verify accessor function returns reference data by backend ID."""
    ref = get_corridor_reference("cand_001")
    assert ref["name"] == "Central Ridge Reserve Forest — Nehru Park (Chanakyapuri) Corridor"
    assert ref["route_length_km"]["driving"] == 6.4
    assert ref["route_length_km"]["direct"] == 2.2

    empty = get_corridor_reference("cand_999")
    assert empty == {}


def test_get_green_space_reference_by_backend_id():
    """Verify accessor function returns reference data by backend ID."""
    ref = get_green_space_reference("patch_001")
    assert ref["name"] == "Central Ridge Reserve Forest"
    assert ref["area_ha"] == 673.32

    empty = get_green_space_reference("patch_999")
    assert empty == {}


# ===========================================================================
# EXACT REFERENCE VALUE PRESERVATION TESTS
# ===========================================================================

def test_corridor_reference_values_preserved_exactly():
    """Verify user-supplied reference values are stored exactly as provided."""
    # CAND_001
    c1 = CORRIDOR_REFERENCE["CAND_001"]
    assert c1["route_length_km"]["driving"] == 8.6
    assert c1["route_length_km"]["direct"] == 4.5
    assert "Sri Aurobindo Marg" in c1["road_width_m"]
    assert c1["road_width_m"]["Sri Aurobindo Marg"] == "30-45"

    # CAND_005 — range-based route length
    c5 = CORRIDOR_REFERENCE["CAND_005"]
    assert c5["route_length_km"]["min"] == 1.8
    assert c5["route_length_km"]["max"] == 2.2

    # CAND_006 — Mathura Road
    c6 = CORRIDOR_REFERENCE["CAND_006"]
    assert c6["road_width_m"]["Mathura Road"] == "45-60"

    # CAND_014 — Mehrauli Archaeological Park
    c14 = CORRIDOR_REFERENCE["CAND_014"]
    assert c14["route_length_km"]["min"] == 1.2
    assert c14["route_length_km"]["max"] == 1.8


def test_green_space_reference_values_preserved_exactly():
    """Verify user-supplied green space reference values are stored exactly."""
    # PATCH_001 — Central Ridge
    p1 = GREEN_SPACE_REFERENCE["PATCH_001"]
    assert p1["area_ha"] == 673.32
    assert p1["area_acres"] == 1664
    assert p1["area_km2"] == 6.73
    assert p1["perimeter_km"]["min"] == 14.5
    assert p1["perimeter_km"]["max"] == 16.0

    # PATCH_010 — Jahanpanah City Forest
    p10 = GREEN_SPACE_REFERENCE["PATCH_010"]
    assert p10["area_ha"] == 176.04
    assert p10["area_acres"] == 435
    assert p10["area_km2"] == 1.76

    # PATCH_012 — Aravalli Biodiversity Park
    p12 = GREEN_SPACE_REFERENCE["PATCH_012"]
    assert p12["area_ha"] == 280.00
    assert p12["area_acres"] == 692


# ===========================================================================
# GREEN SPACE API ENDPOINT TESTS
# ===========================================================================

def test_get_all_12_green_space_details():
    """Verify each of the 12 green spaces can be retrieved with both reference and GIS data."""
    for i in range(1, 13):
        pid = f"patch_{i:03d}"
        resp = client.get(f"/api/v1/green-spaces/{pid}")
        assert resp.status_code == 200, f"Failed to retrieve {pid}"
        data = resp.json()

        assert data["id"] == pid
        assert "name" in data
        assert "reference_id" in data
        expected_ref_id = GREEN_SPACE_BACKEND_TO_REF.get(pid)
        assert data["reference_id"] == expected_ref_id

        # GIS measurements present for all 12 patches
        assert "gis_measurements" in data
        m = data["gis_measurements"]
        assert m["stored_area_hectares"] > 0
        assert m["derived_area_hectares"] > 0
        assert m["stored_perimeter_meters"] > 0
        assert m["derived_perimeter_meters"] > 0
        assert m["measurement_crs"] == "EPSG:32643"
        assert m["discrepancy_analysis"]["consistent"] is True

        if expected_ref_id:
            # Reference metadata present for matched features
            assert "reference_metadata" in data
            ref = data["reference_metadata"]
            assert ref.get("source_label") == "user_supplied_reference"
            assert ref.get("verification_status") == "approximate_unverified"
            assert "area_ha" in ref
            assert "area_acres" in ref
            assert "perimeter_km" in ref

            # Reference-vs-GIS comparison present
            assert "reference_vs_gis_comparison" in data
            comp = data["reference_vs_gis_comparison"]
            assert comp is not None
            assert "reference_area_ha" in comp
            assert "gis_derived_area_ha" in comp
            assert "area_difference_pct" in comp
        else:
            # Unmatched features (e.g. patch_008 Rose Garden)
            assert data["reference_metadata"] is None
            assert data["reference_vs_gis_comparison"] is None

        assert "geometry_metadata" in data
        assert data["geometry_metadata"]["is_valid"] is True
        assert data["geometry_metadata"]["storage_crs"] == "EPSG:4326"
        assert data["geometry_metadata"]["projected_metric_crs"] == "EPSG:32643"

        assert "source_provenance" in data
        assert "geometry" in data
        assert data["geometry"]["type"] in ["Polygon", "MultiPolygon"]
        assert "connected_candidate_corridors" in data


# ===========================================================================
# CORRIDOR API ENDPOINT TESTS
# ===========================================================================

def test_get_all_14_corridor_details():
    """Verify each of the 14 candidate corridors can be retrieved with both reference and GIS data."""
    for i in range(1, 15):
        cid = f"cand_{i:03d}"
        resp = client.get(f"/api/v1/corridors/{cid}")
        assert resp.status_code == 200, f"Failed to retrieve {cid}"
        data = resp.json()

        assert data["candidate_id"] == cid
        assert "name" in data
        assert "reference_id" in data
        expected_ref_id = CORRIDOR_BACKEND_TO_REF.get(cid)
        assert data["reference_id"] == expected_ref_id

        # GIS measurements present
        assert "gis_measurements" in data
        m = data["gis_measurements"]
        assert m["stored_length_m"] > 0
        assert m["derived_length_m"] > 0

        if expected_ref_id:
            # Reference metadata present
            assert "reference_metadata" in data
            ref = data["reference_metadata"]
            assert ref.get("source_label") == "user_supplied_reference"
            assert "route_length_km" in ref
            assert "primary_connecting_roads" in ref
            assert "road_width_m" in ref
        else:
            assert data["reference_metadata"] is None

        # GIS measurements present
        assert "gis_measurements" in data
        m = data["gis_measurements"]
        assert m["stored_length_m"] > 0
        assert m["derived_length_m"] > 0
        assert m["length_consistent"] is True
        assert m["corridor_buffer_width_m"] == 50.0
        assert m["buffer_physical_area_ha"] > 0
        assert m["measurement_crs"] == "EPSG:32643"

        # Reference-vs-GIS comparison present for matched corridors
        assert "reference_vs_gis_comparison" in data
        comp = data["reference_vs_gis_comparison"]
        if expected_ref_id:
            assert comp is not None
            assert "gis_derived_length_km" in comp
            assert "difference_rel_pct" in comp
        else:
            assert comp is None

        assert "endpoints" in data
        ep = data["endpoints"]
        assert ep["source_anchor_id"].startswith("patch_")
        assert ep["target_anchor_id"].startswith("patch_")

        assert "heat_proxy_coverage" in data
        h = data["heat_proxy_coverage"]
        assert h["intersected_grid_cells_count"] > 0
        assert h["standalone_weighted_heat_coverage_ha"] > 0

        assert "cost_model" in data
        assert data["cost_model"]["estimated_cost_inr"] > 0

        assert "geometry" in data
        assert data["geometry"]["type"] == "LineString"

        # Verify alias route /api/v1/candidate-corridors/{cid}
        alias_resp = client.get(f"/api/v1/candidate-corridors/{cid}")
        assert alias_resp.status_code == 200
        assert alias_resp.json()["candidate_id"] == cid


# ===========================================================================
# CORRIDOR GREEN SPACE CONNECTION TESTS
# ===========================================================================

def test_get_corridor_connected_green_spaces():
    """Verify corridor-to-green-space topological connection endpoint."""
    resp = client.get("/api/v1/corridors/cand_001/connected-green-spaces")
    assert resp.status_code == 200
    data = resp.json()

    assert data["candidate_id"] == "cand_001"
    assert data["source_anchor"]["id"] == "patch_001"
    assert data["target_anchor"]["id"] == "patch_002"
    assert len(data["endpoint_anchors"]) == 2

    # Check cand_004 which intersects intermediate patch_005 (Delhi Golf Club)
    resp4 = client.get("/api/v1/corridors/cand_004/connected-green-spaces")
    assert resp4.status_code == 200
    data4 = resp4.json()
    assert len(data4["endpoint_anchors"]) == 2
    assert len(data4["all_intersecting_anchors"]) == 3
    assert any(a["green_space_id"] == "patch_005" for a in data4["traversed_intermediate_anchors"])

    # Test alias route
    alias_resp = client.get("/api/v1/candidate-corridors/cand_001/connected-green-spaces")
    assert alias_resp.status_code == 200
    assert alias_resp.json()["candidate_id"] == "cand_001"


# ===========================================================================
# 404 AND ERROR HANDLING TESTS
# ===========================================================================

def test_unknown_ids_return_404():
    """Verify clear 404 responses for non-existent IDs."""
    resp_g = client.get("/api/v1/green-spaces/patch_999")
    assert resp_g.status_code == 404
    assert "not found" in resp_g.json()["detail"].lower()

    resp_c = client.get("/api/v1/corridors/cand_999")
    assert resp_c.status_code == 404
    assert "not found" in resp_c.json()["detail"].lower()

    resp_l = client.get("/api/v1/corridors/cand_999/connected-green-spaces")
    assert resp_l.status_code == 404
    assert "not found" in resp_l.json()["detail"].lower()


# ===========================================================================
# NO GEOMETRY RECALCULATION TESTS
# ===========================================================================

def test_ordinary_detail_requests_do_not_recalculate_geometry():
    """
    Verify that ordinary feature-detail requests serve precomputed data
    and do NOT invoke shapely projection or transform functions.
    """
    with patch("shapely.transform") as mock_transform, \
         patch("shapely.ops.unary_union") as mock_union, \
         patch("pyproj.Transformer.from_crs") as mock_pyproj:

        resp_g = client.get("/api/v1/green-spaces/patch_001")
        assert resp_g.status_code == 200
        assert resp_g.json()["id"] == "patch_001"

        resp_c = client.get("/api/v1/corridors/cand_001")
        assert resp_c.status_code == 200
        assert resp_c.json()["candidate_id"] == "cand_001"

        resp_l = client.get("/api/v1/corridors/cand_001/connected-green-spaces")
        assert resp_l.status_code == 200
        assert resp_l.json()["candidate_id"] == "cand_001"

        mock_transform.assert_not_called()
        mock_union.assert_not_called()
        mock_pyproj.assert_not_called()


# ===========================================================================
# PREPROCESSING REPRODUCIBILITY TESTS
# ===========================================================================

def test_preprocessing_script_reproducibility():
    """Verify that running preprocessing produces identical, stable results."""
    import sys
    import os
    scripts_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "scripts"))
    if scripts_dir not in sys.path:
        sys.path.insert(0, scripts_dir)

    from build_precomputed_data import build_precomputed_data
    # Re-run build function
    build_precomputed_data()

    # Clear cache and re-test retrieval of patch_001 and cand_001
    _CACHE.clear()
    g = get_precomputed_green_spaces()
    assert len(g) == 12
    assert g["patch_001"]["gis_measurements"]["derived_area_hectares"] == 580.6673
    assert g["patch_001"]["gis_measurements"]["derived_perimeter_meters"] == 10714.78
    assert g["patch_001"]["reference_id"] == "PATCH_001"
    assert g["patch_001"]["reference_metadata"]["area_ha"] == 673.32

    c = get_precomputed_corridors()
    assert len(c) == 14
    assert c["cand_001"]["gis_measurements"]["derived_length_m"] == 3663.08
    assert c["cand_001"]["reference_id"] == "CAND_003"
    assert c["cand_001"]["reference_metadata"]["name"] == "Central Ridge Reserve Forest — Nehru Park (Chanakyapuri) Corridor"
    assert c["cand_001"]["reference_metadata"]["route_length_km"]["driving"] == 6.4


# ===========================================================================
# API RESPONSE DUAL-DATA CATEGORY TESTS
# ===========================================================================

def test_api_responses_contain_both_reference_and_gis():
    """Verify API responses contain clearly labeled reference metadata and GIS measurements."""
    # Green space
    resp_g = client.get("/api/v1/green-spaces/patch_003")
    assert resp_g.status_code == 200
    g = resp_g.json()
    assert g["reference_metadata"]["name"] == "Lodhi Garden"
    assert g["reference_metadata"]["area_ha"] == 36.42
    assert g["reference_metadata"]["source_label"] == "user_supplied_reference"
    assert g["gis_measurements"]["derived_area_hectares"] > 0
    assert g["reference_vs_gis_comparison"] is not None

    # Corridor
    resp_c = client.get("/api/v1/corridors/cand_002")
    assert resp_c.status_code == 200
    c = resp_c.json()
    assert c["reference_metadata"]["route_length_km"]["driving"] == 7.4
    assert c["reference_metadata"]["source_label"] == "user_supplied_reference"
    assert c["gis_measurements"]["derived_length_km"] > 0
    assert c["reference_vs_gis_comparison"] is not None


def test_discrepancy_reporting():
    """Verify that reference-vs-GIS comparison reports discrepancies correctly."""
    # Patch 001 — Central Ridge: reference 673.32 ha vs GIS ~580.67 ha
    resp = client.get("/api/v1/green-spaces/patch_001")
    data = resp.json()
    comp = data["reference_vs_gis_comparison"]
    assert comp["reference_area_ha"] == 673.32
    assert comp["gis_derived_area_ha"] > 0
    assert comp["area_difference_pct"] > 0  # Should show a significant difference
    assert "verification_status" in comp

    # Corridor 001 — reference 8.6 km driving vs GIS ~3.66 km
    resp_c = client.get("/api/v1/corridors/cand_001")
    c = resp_c.json()
    comp_c = c["reference_vs_gis_comparison"]
    assert comp_c["difference_rel_pct"] > 0  # Should show significant difference
    assert "potential_explanation" in comp_c
    assert "recommended_action" in comp_c


# ===========================================================================
# POPUP DATA BINDING AND SPECIFICATION TESTS (SECTION 8)
# ===========================================================================

def test_patch_001_primary_reference_and_gis_separation():
    """
    Verify:
      1. patch_001 primary reference area is exactly 673.32 ha.
      2. patch_001 reference perimeter range is 14.5 to 16.0 km.
      3. Equivalent units: 1,664 acres and 6.73 km².
      4. GIS values (580.67 ha, 10714.8 m) remain strictly separate under gis_measurements.
      5. Labels denote unverified reference status.
    """
    resp = client.get("/api/v1/green-spaces/patch_001")
    assert resp.status_code == 200
    data = resp.json()

    # Primary reference metadata
    ref = data["reference_metadata"]
    assert ref["name"] == "Central Ridge Reserve Forest"
    assert ref["area_ha"] == 673.32
    assert ref["area_acres"] == 1664
    assert ref["area_km2"] == 6.73
    assert ref["perimeter_km"]["min"] == 14.5
    assert ref["perimeter_km"]["max"] == 16.0
    assert ref["source_label"] == "user_supplied_reference"
    assert ref["verification_status"] == "approximate_unverified"

    # Separate GIS measurements
    gis = data["gis_measurements"]
    assert abs(gis["stored_area_hectares"] - 580.67) < 0.01
    assert abs(gis["derived_area_hectares"] - 580.67) < 0.01
    assert abs(gis["stored_perimeter_meters"] - 10714.8) < 1.0
    assert abs(gis["derived_perimeter_meters"] - 10714.78) < 1.0


def test_case_insensitive_green_space_and_corridor_retrieval():
    """Verify endpoint retrieves records using either uppercase or lowercase IDs."""
    # Green space: patch_001 vs PATCH_001
    r_lower = client.get("/api/v1/green-spaces/patch_001")
    r_upper = client.get("/api/v1/green-spaces/PATCH_001")
    assert r_lower.status_code == 200
    assert r_upper.status_code == 200
    assert r_lower.json()["id"] == r_upper.json()["id"]

    # Corridor: cand_001 vs CAND_001
    c_lower = client.get("/api/v1/corridors/cand_001")
    c_upper = client.get("/api/v1/corridors/CAND_001")
    assert c_lower.status_code == 200
    assert c_upper.status_code == 200
    assert c_lower.json()["candidate_id"] == c_upper.json()["candidate_id"]


def test_all_12_green_spaces_have_correct_reference_metadata():
    """Verify all 12 green spaces resolve to their exact reference metadata."""
    for i in range(1, 13):
        pid = f"patch_{i:03d}"
        expected_ref_id = GREEN_SPACE_BACKEND_TO_REF.get(pid)
        resp = client.get(f"/api/v1/green-spaces/{pid}")
        assert resp.status_code == 200, f"Failed for {pid}"
        data = resp.json()
        assert data["reference_id"] == expected_ref_id
        if expected_ref_id:
            ref = data["reference_metadata"]
            assert ref["area_ha"] > 0
            assert ref["source_label"] == "user_supplied_reference"
            assert ref["verification_status"] == "approximate_unverified"
            assert "perimeter_km" in ref
            assert "min" in ref["perimeter_km"]
            assert "max" in ref["perimeter_km"]
        else:
            assert data["reference_metadata"] is None
        assert "gis_measurements" in data


def test_all_14_corridors_preserve_reference_and_gis_distinction():
    """Verify all 14 corridors contain reference route lengths and distinct GIS measurements."""
    for i in range(1, 15):
        cid = f"cand_{i:03d}"
        expected_ref_id = CORRIDOR_BACKEND_TO_REF.get(cid)
        resp = client.get(f"/api/v1/corridors/{cid}")
        assert resp.status_code == 200, f"Failed for {cid}"
        data = resp.json()
        assert data["reference_id"] == expected_ref_id
        if expected_ref_id:
            ref = data["reference_metadata"]
            assert ref["source_label"] == "user_supplied_reference"
            assert "route_length_km" in ref
        else:
            assert data["reference_metadata"] is None
        assert "gis_measurements" in data
        assert data["gis_measurements"]["derived_length_km"] > 0


def test_enriched_geojson_contains_reference_metadata():
    """Verify /green-spaces and /candidate-corridors GeoJSON features carry reference metadata."""
    resp_g = client.get("/api/v1/green-spaces")
    assert resp_g.status_code == 200
    g_data = resp_g.json()
    assert len(g_data["features"]) == 12
    feat0 = g_data["features"][0]
    assert "reference_metadata" in feat0["properties"]
    assert feat0["properties"]["reference_metadata"]["area_ha"] == 673.32
    assert feat0["properties"]["reference_id"] == "PATCH_001"

    resp_c = client.get("/api/v1/candidate-corridors")
    assert resp_c.status_code == 200
    c_data = resp_c.json()
    assert len(c_data["features"]) == 14
    c_feat0 = c_data["features"][0]
    assert "reference_metadata" in c_feat0["properties"]
    assert c_feat0["properties"]["reference_id"] == "CAND_003"

