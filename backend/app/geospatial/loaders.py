import json
import os
from typing import Dict, Any, List
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


def get_green_spaces_geojson() -> Dict[str, Any]:
    """Returns the validated green spaces GeoJSON FeatureCollection."""
    return load_geojson("green_patches.geojson")


def get_green_patches() -> List[Dict[str, Any]]:
    """Returns the list of green patch features."""
    data = get_green_spaces_geojson()
    return data.get("features", [])


def get_study_boundary_geojson() -> Dict[str, Any]:
    """Returns the study boundary GeoJSON FeatureCollection."""
    return load_geojson("study_boundary.geojson")


def get_candidate_corridors_geojson() -> Dict[str, Any]:
    """Returns the validated candidate corridors GeoJSON FeatureCollection."""
    return load_geojson("candidate_corridors.geojson")


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

