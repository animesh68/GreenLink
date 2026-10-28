import json
import os
from typing import Dict, Any, List, Optional
from app.core.config import settings

_CACHE: Dict[str, Any] = {}


def load_geojson(filename: str) -> Dict[str, Any]:
    """Loads and caches GeoJSON file in memory."""
    if filename in _CACHE:
        return _CACHE[filename]

    filepath = os.path.join(settings.DATA_PROCESSED_DIR, filename)
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Dataset not found at {filepath}. Run preprocessing scripts first.")

    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    _CACHE[filename] = data
    return data


def load_precomputed_json(filename: str) -> Dict[str, Any]:
    """Loads and caches precomputed dataset from data/precomputed/."""
    cache_key = f"precomputed_{filename}"
    if cache_key in _CACHE:
        return _CACHE[cache_key]

    filepath = os.path.join(settings.DATA_PRECOMPUTED_DIR, filename)
    if not os.path.exists(filepath):
        raise FileNotFoundError(
            f"Precomputed dataset not found at {filepath}. Run scripts/build_precomputed_data.py first."
        )

    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    _CACHE[cache_key] = data
    return data


def get_precomputed_green_spaces() -> Dict[str, Any]:
    """Returns the precomputed green space details dictionary."""
    data = load_precomputed_json("green_space_details.json")
    return data.get("green_spaces", {})


def get_precomputed_green_space_by_id(green_space_id: str) -> Optional[Dict[str, Any]]:
    """Returns precomputed detail for a specific green space ID (backend ID or reference ID)."""
    spaces = get_precomputed_green_spaces()
    gid = green_space_id.lower()
    if gid in spaces:
        return spaces[gid]

    from app.reference_data import GREEN_SPACE_REF_TO_BACKEND
    backend_id = GREEN_SPACE_REF_TO_BACKEND.get(green_space_id.upper())
    if backend_id and backend_id in spaces:
        return spaces[backend_id]

    return spaces.get(green_space_id)


def get_precomputed_corridors() -> Dict[str, Any]:
    """Returns the precomputed corridor details dictionary."""
    data = load_precomputed_json("corridor_details.json")
    return data.get("corridors", {})


def get_precomputed_corridor_by_id(corridor_id: str) -> Optional[Dict[str, Any]]:
    """Returns precomputed detail for a specific candidate corridor ID (backend ID or reference ID)."""
    corridors = get_precomputed_corridors()
    cid = corridor_id.lower()
    if cid in corridors:
        return corridors[cid]

    from app.reference_data import CORRIDOR_REF_TO_BACKEND
    backend_id = CORRIDOR_REF_TO_BACKEND.get(corridor_id.upper())
    if backend_id and backend_id in corridors:
        return corridors[backend_id]

    return corridors.get(corridor_id)


def get_precomputed_corridor_green_links() -> Dict[str, Any]:
    """Returns precomputed corridor-green links dictionary."""
    data = load_precomputed_json("corridor_green_links.json")
    return data.get("links", {})


def get_precomputed_corridor_green_links_by_id(corridor_id: str) -> Optional[Dict[str, Any]]:
    """Returns green space connections for a specific corridor ID (case-insensitive)."""
    links = get_precomputed_corridor_green_links()
    cid = corridor_id.lower()
    return links.get(cid) or links.get(corridor_id)


def get_green_spaces_geojson() -> Dict[str, Any]:
    """Returns the validated green spaces GeoJSON FeatureCollection enriched with precomputed reference metadata."""
    cache_key = "enriched_green_patches_geojson"
    if cache_key in _CACHE:
        return _CACHE[cache_key]

    raw_data = load_geojson("green_patches.geojson")
    try:
        pre_spaces = get_precomputed_green_spaces()
    except Exception:
        pre_spaces = {}

    import copy
    enriched = copy.deepcopy(raw_data)
    for feat in enriched.get("features", []):
        props = feat.get("properties", {})
        gid = props.get("id")
        if gid and gid in pre_spaces:
            detail = pre_spaces[gid]
            props["reference_id"] = detail.get("reference_id")
            props["reference_metadata"] = detail.get("reference_metadata")
            props["gis_measurements"] = detail.get("gis_measurements")
            props["reference_vs_gis_comparison"] = detail.get("reference_vs_gis_comparison")

    _CACHE[cache_key] = enriched
    return enriched


def get_green_patches() -> List[Dict[str, Any]]:
    """Returns the list of green patch features."""
    data = get_green_spaces_geojson()
    return data.get("features", [])


def get_study_boundary_geojson() -> Dict[str, Any]:
    """Returns the study boundary GeoJSON FeatureCollection."""
    return load_geojson("study_boundary.geojson")


def get_candidate_corridors_geojson() -> Dict[str, Any]:
    """Returns the validated candidate corridors GeoJSON FeatureCollection enriched with precomputed reference metadata."""
    cache_key = "enriched_candidate_corridors_geojson"
    if cache_key in _CACHE:
        return _CACHE[cache_key]

    raw_data = load_geojson("candidate_corridors.geojson")
    try:
        pre_corrs = get_precomputed_corridors()
    except Exception:
        pre_corrs = {}

    import copy
    enriched = copy.deepcopy(raw_data)
    for feat in enriched.get("features", []):
        props = feat.get("properties", {})
        cid = props.get("candidate_id")
        if cid and cid in pre_corrs:
            detail = pre_corrs[cid]
            props["reference_id"] = detail.get("reference_id")
            props["reference_metadata"] = detail.get("reference_metadata")
            props["gis_measurements"] = detail.get("gis_measurements")
            props["reference_vs_gis_comparison"] = detail.get("reference_vs_gis_comparison")

    _CACHE[cache_key] = enriched
    return enriched


def get_candidate_corridors() -> List[Dict[str, Any]]:
    """Returns the list of candidate corridor features."""
    data = get_candidate_corridors_geojson()
    return data.get("features", [])


def get_candidate_corridors_summary() -> Dict[str, Any]:
    """Returns summary metadata and length/cost statistics for candidate corridors."""
    geojson = get_candidate_corridors_geojson()
    features = geojson.get("features", [])
    
    if not features:
        return {
            "total_candidates": 0,
            "total_length_km": 0.0,
            "length_stats_m": {"min": 0.0, "median": 0.0, "max": 0.0},
            "status": "empty"
        }

    lengths = [f["properties"]["length_m"] for f in features]
    lengths.sort()
    min_len = min(lengths)
    max_len = max(lengths)
    med_len = lengths[len(lengths) // 2]
    total_km = sum(lengths) / 1000.0

    costs = [f["properties"].get("estimated_cost_inr", 0.0) for f in features]
    total_cost_inr = sum(costs)

    return {
        "total_candidates": len(features),
        "total_length_km": round(total_km, 2),
        "length_stats_m": {
            "min": round(min_len, 1),
            "median": round(med_len, 1),
            "max": round(max_len, 1)
        },
        "total_provisional_cost_inr": round(total_cost_inr, 2),
        "generation_method": geojson.get("metadata", {}).get("generation_method", "NetworkX Dijkstra"),
        "routing_network": "OpenStreetMap Real Walkable/Urban Streets",
        "status": "active"
    }


def get_study_area_metadata() -> Dict[str, Any]:
    """Returns study-area extent, coordinate reference systems, and metadata."""
    boundary = get_study_boundary_geojson()
    green_spaces = get_green_spaces_geojson()
    features = green_spaces.get("features", [])
    total_area_ha = sum(f.get("properties", {}).get("area_hectares", 0.0) for f in features)

    return {
        "study_area_name": "South-Central Delhi Study Area",
        "bounding_box": {
            "southwest": {
                "longitude": settings.BBOX_WEST,
                "latitude": settings.BBOX_SOUTH
            },
            "northeast": {
                "longitude": settings.BBOX_EAST,
                "latitude": settings.BBOX_NORTH
            }
        },
        "crs": {
            "storage_and_display": settings.CRS_STORAGE,
            "metric_computations": settings.CRS_METRIC
        },
        "area_approx_km2": 131.8,
        "is_official_administrative_boundary": False,
        "notes": (
            "Geometric study bounding box enclosing primary South-Central Delhi ecological anchors "
            "(Central Ridge, Lodhi Garden, Sunder Nursery, Hauz Khas / Deer Park) and surrounding urban fabric. "
            "Not an official municipal administrative boundary."
        ),
        "data_summary": {
            "green_patches_count": len(features),
            "total_green_area_hectares": round(total_area_ha, 2),
            "primary_source": "OpenStreetMap (ODbL, (c) OpenStreetMap contributors)",
            "retrieval_status": "Validated & cached locally"
        },
        "boundary_geojson": boundary
    }


def get_heat_priority_grid_geojson() -> Dict[str, Any]:
    """Returns the heat priority grid GeoJSON FeatureCollection."""
    return load_geojson("heat_priority_grid.geojson")


def get_heat_grid_cells() -> List[Dict[str, Any]]:
    """Returns the list of heat priority grid features."""
    data = get_heat_priority_grid_geojson()
    return data.get("features", [])

