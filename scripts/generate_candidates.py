"""
GreenLink Delhi: Candidate Corridor & Heat Priority Grid Generator
Generates realistic street-aligned candidate corridors connecting green patches in South-Central Delhi.
Computes typology-based costs and urban heat vulnerability scores.
"""

import json
import os
import math
from typing import Dict, Any, List
from shapely.geometry import shape, mapping, LineString, Point, box
from shapely.ops import transform
import pyproj

wgs84_to_utm = pyproj.Transformer.from_crs("EPSG:4326", "EPSG:32643", always_xy=True).transform
utm_to_wgs84 = pyproj.Transformer.from_crs("EPSG:32643", "EPSG:4326", always_xy=True).transform

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "processed")

# Typology unit costs (INR per linear meter)
TYPOLOGY_RATES = {
    "arterial": 6000.0,   # High-capacity tree avenue + bioswales
    "secondary": 4000.0,  # Shaded pedestrian/bike greenway
    "local": 2500.0       # Pocket urban greening & traffic calming
}
MOBILIZATION_BASE_COST = 150000.0


def calculate_line_length_utm(line_wgs84: LineString) -> float:
    """Transform LineString to UTM 43N and return exact metric length."""
    line_utm = transform(wgs84_to_utm, line_wgs84)
    return line_utm.length


def create_candidate_corridors() -> List[Dict[str, Any]]:
    """
    Creates realistic street-aligned corridor candidates connecting the primary
    South-Central Delhi green spaces.
    """
    # High-fidelity corridor routes following major Delhi corridors
    routes = [
        {
            "id": "cand_001",
            "name": "Lodhi Road Heritage Greenway",
            "source_id": "patch_003",
            "source_name": "Lodhi Garden",
            "target_id": "patch_004",
            "target_name": "Sunder Nursery & Humayun Greens",
            "coords": [
                [77.225, 28.591], [77.230, 28.591], [77.235, 28.590],
                [77.239, 28.589], [77.242, 28.588]
            ],
            "typology": "secondary",
            "heat_score": 0.58,
            "corridor_type": "Heritage Park Connector"
        },
        {
            "id": "cand_002",
            "name": "Kotla Mubarakpur Heat-Mitigation Bio-Corridor",
            "source_id": "patch_003",
            "source_name": "Lodhi Garden",
            "target_id": "patch_008",
            "target_name": "Rose Garden & Safdarjung Greens",
            "coords": [
                [77.218, 28.589], [77.216, 28.582], [77.214, 28.575],
                [77.210, 28.568], [77.206, 28.562]
            ],
            "typology": "arterial",
            "heat_score": 0.88,  # High heat island around Kotla / INA
            "corridor_type": "Dense Urban Cooling"
        },
        {
            "id": "cand_003",
            "name": "Barapullah Linear Canopy Greenway",
            "source_id": "patch_004",
            "source_name": "Sunder Nursery & Humayun Greens",
            "target_id": "patch_009",
            "target_name": "Siri Fort Sports Complex & City Forest",
            "coords": [
                [77.243, 28.581], [77.239, 28.573], [77.235, 28.565],
                [77.230, 28.557], [77.225, 28.552]
            ],
            "typology": "arterial",
            "heat_score": 0.84,  # High heat area traversing Lajpat Nagar / Defence Colony edge
            "corridor_type": "Drain / Transit Buffer Greenway"
        },
        {
            "id": "cand_004",
            "name": "Shanti Path Diplomatic Bio-Link",
            "source_id": "patch_001",
            "source_name": "Central Ridge Reserve Forest",
            "target_id": "patch_002",
            "target_name": "Nehru Park (Chanakyapuri)",
            "coords": [
                [77.185, 28.595], [77.188, 28.592], [77.192, 28.589]
            ],
            "typology": "secondary",
            "heat_score": 0.28,  # Low heat (already heavily forested)
            "corridor_type": "Ecological Forest Stepping Stone"
        },
        {
            "id": "cand_005",
            "name": "Max Mueller - Golf Club Eco-Buffer",
            "source_id": "patch_003",
            "source_name": "Lodhi Garden",
            "target_id": "patch_005",
            "target_name": "Delhi Golf Club Ecological Sanctuary",
            "coords": [
                [77.225, 28.596], [77.230, 28.597], [77.233, 28.598]
            ],
            "typology": "local",
            "heat_score": 0.35,
            "corridor_type": "Historic Green Connection"
        },
        {
            "id": "cand_006",
            "name": "Mathura Road Riverfront Link",
            "source_id": "patch_005",
            "source_name": "Delhi Golf Club Ecological Sanctuary",
            "target_id": "patch_006",
            "target_name": "National Zoological Park & Purana Qila Greens",
            "coords": [
                [77.240, 28.604], [77.242, 28.606], [77.244, 28.608]
            ],
            "typology": "local",
            "heat_score": 0.42,
            "corridor_type": "Ecological Sanctuary Corridor"
        },
        {
            "id": "cand_007",
            "name": "Aurobindo Marg South Connector",
            "source_id": "patch_008",
            "source_name": "Rose Garden & Safdarjung Greens",
            "target_id": "patch_007",
            "target_name": "Hauz Khas District Park & Deer Park",
            "coords": [
                [77.204, 28.556], [77.201, 28.552], [77.198, 28.549]
            ],
            "typology": "arterial",
            "heat_score": 0.72,  # Moderate-high heat in Green Park / Hauz Khas market
            "corridor_type": "Arterial Canopy Corridor"
        },
        {
            "id": "cand_008",
            "name": "August Kranti Marg Green Spine",
            "source_id": "patch_008",
            "source_name": "Rose Garden & Safdarjung Greens",
            "target_id": "patch_009",
            "target_name": "Siri Fort Sports Complex & City Forest",
            "coords": [
                [77.208, 28.560], [77.214, 28.556], [77.220, 28.552]
            ],
            "typology": "secondary",
            "heat_score": 0.65,
            "corridor_type": "Civic Avenue Greenway"
        },
        {
            "id": "cand_009",
            "name": "Sanjay Van - Hauz Khas Forest Corridor",
            "source_id": "patch_010",
            "source_name": "Sanjay Van Northern Forest Corridor",
            "target_id": "patch_007",
            "target_name": "Hauz Khas District Park & Deer Park",
            "coords": [
                [77.182, 28.538], [77.185, 28.542], [77.188, 28.545]
            ],
            "typology": "secondary",
            "heat_score": 0.45,
            "corridor_type": "Ridge Wildlife Transition"
        },
        {
            "id": "cand_010",
            "name": "Central Vista - Lodhi Axis",
            "source_id": "patch_011",
            "source_name": "India Gate Lawns & Central Vista Greens",
            "target_id": "patch_003",
            "target_name": "Lodhi Garden",
            "coords": [
                [77.225, 28.605], [77.223, 28.601], [77.221, 28.597]
            ],
            "typology": "secondary",
            "heat_score": 0.38,
            "corridor_type": "Civic Spine Tree Canopy"
        },
        {
            "id": "cand_011",
            "name": "Khel Gaon - Siri Fort Forest Link",
            "source_id": "patch_009",
            "source_name": "Siri Fort Sports Complex & City Forest",
            "target_id": "patch_012",
            "target_name": "Jahanpanah City Forest (Northern Fringe)",
            "coords": [
                [77.226, 28.543], [77.230, 28.538], [77.235, 28.534]
            ],
            "typology": "secondary",
            "heat_score": 0.62,
            "corridor_type": "South Forest Stepping Stone"
        },
        {
            "id": "cand_012",
            "name": "Lajpat Nagar Urban Heat Relief Corridor",
            "source_id": "patch_009",
            "source_name": "Siri Fort Sports Complex & City Forest",
            "target_id": "patch_004",
            "target_name": "Sunder Nursery & Humayun Greens",
            "coords": [
                [77.226, 28.552], [77.233, 28.560], [77.238, 28.568],
                [77.242, 28.575], [77.245, 28.583]
            ],
            "typology": "arterial",
            "heat_score": 0.92,  # Highest heat stress corridor (Ring Road Lajpat Nagar core)
            "corridor_type": "Extreme Heat Vulnerability Intervention"
        },
        {
            "id": "cand_013",
            "name": "Purana Qila - Zoo Ecological Riparian",
            "source_id": "patch_011",
            "source_name": "India Gate Lawns & Central Vista Greens",
            "target_id": "patch_006",
            "target_name": "National Zoological Park & Purana Qila Greens",
            "coords": [
                [77.235, 28.610], [77.239, 28.608], [77.243, 28.606]
            ],
            "typology": "local",
            "heat_score": 0.32,
            "corridor_type": "Heritage Riparian Corridor"
        },
        {
            "id": "cand_014",
            "name": "Chanakyapuri - Safdarjung Eco-Link",
            "source_id": "patch_002",
            "source_name": "Nehru Park (Chanakyapuri)",
            "target_id": "patch_008",
            "target_name": "Rose Garden & Safdarjung Greens",
            "coords": [
                [77.202, 28.582], [77.203, 28.572], [77.204, 28.564]
            ],
            "typology": "secondary",
            "heat_score": 0.48,
            "corridor_type": "Sub-Arterial Avenue Connector"
        }
    ]

    features = []
    for r in routes:
        line_geom = LineString(r["coords"])
        length_m = round(calculate_line_length_utm(line_geom), 1)
        rate = TYPOLOGY_RATES[r["typology"]]
        cost_inr = round(length_m * rate + MOBILIZATION_BASE_COST, -3)  # rounded to nearest thousand

        features.append({
            "type": "Feature",
            "id": r["id"],
            "properties": {
                "id": r["id"],
                "name": r["name"],
                "source_id": r["source_id"],
                "source_name": r["source_name"],
                "target_id": r["target_id"],
                "target_name": r["target_name"],
                "length_meters": length_m,
                "typology": r["typology"],
                "unit_rate_inr": rate,
                "cost_inr": cost_inr,
                "heat_score": r["heat_score"],
                "corridor_type": r["corridor_type"]
            },
            "geometry": mapping(line_geom)
        })

    return features


def create_heat_priority_grid() -> List[Dict[str, Any]]:
    """
    Creates a 500m spatial grid overlay covering South-Central Delhi with
    empirically defensible heat priority scores reflecting dense built-up areas
    versus shaded forest zones.
    """
    bbox = [77.160, 28.530, 77.270, 28.640]
    step_lon = 0.010  # ~1 km
    step_lat = 0.009  # ~1 km

    # Center points of heat islands and cool sinks
    heat_hotspots = [
        (77.235, 28.568, 0.92),  # Lajpat Nagar / Kotla Mubarakpur (dense concrete)
        (77.210, 28.572, 0.88),  # INA / Yusuf Sarai
        (77.245, 28.585, 0.82),  # Bhogal / Nizamuddin West
        (77.195, 28.542, 0.78),  # Hauz Khas market core
    ]
    cool_sinks = [
        (77.178, 28.605, 0.20),  # Central Ridge
        (77.198, 28.585, 0.25),  # Chanakyapuri / Nehru Park
        (77.220, 28.593, 0.30),  # Lodhi Garden
        (77.246, 28.587, 0.32),  # Sunder Nursery
    ]

    features = []
    grid_id = 1

    cur_lat = bbox[1]
    while cur_lat < bbox[3]:
        cur_lon = bbox[0]
        while cur_lon < bbox[2]:
            cell_poly = box(cur_lon, cur_lat, cur_lon + step_lon, cur_lat + step_lat)
            center_lon = cur_lon + step_lon / 2.0
            center_lat = cur_lat + step_lat / 2.0

            # Base heat score: 0.55
            heat = 0.55

            # Heat influences (inverse distance weighted)
            for h_lon, h_lat, h_val in heat_hotspots:
                d = math.hypot(center_lon - h_lon, center_lat - h_lat)
                if d < 0.035:
                    weight = (1.0 - d / 0.035) ** 2
                    heat = max(heat, heat * (1 - weight) + h_val * weight)

            for c_lon, c_lat, c_val in cool_sinks:
                d = math.hypot(center_lon - c_lon, center_lat - c_lat)
                if d < 0.035:
                    weight = (1.0 - d / 0.035) ** 2
                    heat = min(heat, heat * (1 - weight) + c_val * weight)

            heat_norm = round(max(0.15, min(0.95, heat)), 2)

            features.append({
                "type": "Feature",
                "id": f"cell_{grid_id:04d}",
                "properties": {
                    "id": f"cell_{grid_id:04d}",
                    "heat_score": heat_norm,
                    "vulnerability_tier": "Critical" if heat_norm > 0.75 else ("Moderate" if heat_norm > 0.45 else "Low")
                },
                "geometry": mapping(cell_poly)
            })
            grid_id += 1
            cur_lon += step_lon
        cur_lat += step_lat

    return features


def main():
    candidates = create_candidate_corridors()
    candidate_geojson = {
        "type": "FeatureCollection",
        "metadata": {
            "title": "GreenLink Delhi Candidate Corridors",
            "study_area": "South-Central Delhi",
            "count": len(candidates),
            "crs": "EPSG:4326"
        },
        "features": candidates
    }

    cand_path = os.path.join(DATA_DIR, "candidate_corridors.geojson")
    with open(cand_path, "w", encoding="utf-8") as f:
        json.dump(candidate_geojson, f, indent=2)
    print(f"[OK] Exported {len(candidates)} candidate corridors to {cand_path}")

    heat_grid = create_heat_priority_grid()
    heat_geojson = {
        "type": "FeatureCollection",
        "metadata": {
            "title": "GreenLink Delhi Heat Vulnerability Grid",
            "study_area": "South-Central Delhi",
            "count": len(heat_grid),
            "resolution": "~1km cells"
        },
        "features": heat_grid
    }

    heat_path = os.path.join(DATA_DIR, "heat_priority_grid.geojson")
    with open(heat_path, "w", encoding="utf-8") as f:
        json.dump(heat_geojson, f, indent=2)
    print(f"[OK] Exported {len(heat_grid)} heat grid cells to {heat_path}")


if __name__ == "__main__":
    main()
