"""
GreenLink Delhi 2.0 — User-Supplied Real-World Reference Data

This module defines dictionaries mapping reference IDs to user-supplied metadata.
These values are APPROXIMATE REFERENCE DATA, not independently verified measurements.

The preprocessing script (scripts/build_precomputed_data.py) imports this module and
merges the reference information into the precomputed JSON structures alongside
GIS-derived measurements, maintaining clear separation between the two data categories.

Key conventions:
  - Reference IDs use UPPERCASE (CAND_001, PATCH_001) while backend IDs use lowercase
    (cand_001, patch_001). The mapping is positional and one-to-one.
  - Route lengths may be single values or ranges; preserve the original format.
  - Road widths are supplied as approximate ranges in metres.
  - Green-space areas include hectares, acres, and km² as supplied by the user.
  - Perimeter values are supplied as min/max ranges in kilometres.
"""

# ===========================================================================
# PART A — CORRIDOR REFERENCE METADATA (User-Supplied)
# ===========================================================================

CORRIDOR_REFERENCE = {
    "CAND_001": {
        "name": "Sanjay Van — Hauz Khas Forest Corridor",
        "primary_connecting_roads": [
            "Gamal Abdel Nasser Marg",
            "Sri Aurobindo Marg",
            "Press Enclave Marg / Inner Ring Road"
        ],
        "route_length_km": {"driving": 8.6, "direct": 4.5},
        "road_width_m": {
            "Sri Aurobindo Marg": "30-45",
            "Press Enclave Marg": "24-30"
        },
        "road_descriptions": {
            "Sri Aurobindo Marg": "6-lane arterial road, approximately 30 m to 45 m wide",
            "Press Enclave Marg": "4-to-6-lane urban road, approximately 24 m to 30 m wide"
        },
        "source_label": "user_supplied_reference",
        "verification_status": "approximate_unverified"
    },
    "CAND_002": {
        "name": "Nehru Park (Chanakyapuri) — Lodhi Garden Corridor",
        "primary_connecting_roads": [
            "Brigadier Hoshiyar Singh Marg",
            "Lodhi Road",
            "Amrita Shergill Marg / Max Mueller Marg"
        ],
        "route_length_km": {"driving": 7.4, "direct": 2.8},
        "road_width_m": {
            "Brigadier Hoshiyar Singh Marg": "30",
            "Lodhi Road": "30",
            "Amrita Shergill Marg / Max Mueller Marg": "18-24"
        },
        "road_descriptions": {
            "Brigadier Hoshiyar Singh Marg": "4-to-6-lane divided avenue, approximately 30 m wide",
            "Lodhi Road": "4-to-6-lane divided avenue, approximately 30 m wide",
            "Amrita Shergill Marg / Max Mueller Marg": "2-to-4-lane residential or embassy avenues, approximately 18 m to 24 m wide"
        },
        "source_label": "user_supplied_reference",
        "verification_status": "approximate_unverified"
    },
    "CAND_003": {
        "name": "Central Ridge Reserve Forest — Nehru Park (Chanakyapuri) Corridor",
        "primary_connecting_roads": [
            "Vande Mataram Marg (Upper Ridge Road)",
            "Shanti Path / Niti Marg"
        ],
        "route_length_km": {"driving": 6.4, "direct": 2.2},
        "road_width_m": {
            "Vande Mataram Marg": "24-30",
            "Shanti Path / Niti Marg": "60-80"
        },
        "road_descriptions": {
            "Vande Mataram Marg": "4-lane forest-surrounded arterial road, approximately 24 m to 30 m wide",
            "Shanti Path / Niti Marg": "diplomatic boulevard, up to 6 lanes, with wide green central medians and approximately 60 m to 80 m total right-of-way"
        },
        "source_label": "user_supplied_reference",
        "verification_status": "approximate_unverified"
    },
    "CAND_004": {
        "name": "Lodhi Garden — Sunder Nursery & Humayun Greens Corridor",
        "primary_connecting_roads": [
            "Lodhi Road",
            "Bharat Scouts and Guides Marg"
        ],
        "route_length_km": {"driving": 3.9, "direct": 2.5},
        "road_width_m": {
            "Lodhi Road": "30",
            "Bharat Scouts and Guides Marg": "18-22"
        },
        "road_descriptions": {
            "Lodhi Road": "4-to-6-lane boulevard, approximately 30 m wide",
            "Bharat Scouts and Guides Marg": "2-to-4-lane access road, approximately 18 m to 22 m wide"
        },
        "source_label": "user_supplied_reference",
        "verification_status": "approximate_unverified"
    },
    "CAND_005": {
        "name": "Lodhi Garden — Delhi Golf Club Ecological Sanctuary Corridor",
        "primary_connecting_roads": [
            "Dr. Zakir Hussain Marg",
            "Subramaniam Bharti Marg"
        ],
        "route_length_km": {"min": 1.8, "max": 2.2},
        "road_width_m": {
            "Dr. Zakir Hussain Marg": "30-45",
            "Subramaniam Bharti Marg": "24-30"
        },
        "road_descriptions": {
            "Dr. Zakir Hussain Marg": "6-lane-wide arterial road, approximately 30 m to 45 m wide",
            "Subramaniam Bharti Marg": "4-lane divided street, approximately 24 m to 30 m wide"
        },
        "source_label": "user_supplied_reference",
        "verification_status": "approximate_unverified"
    },
    "CAND_006": {
        "name": "Lodhi Garden — National Zoological Park & Purana Qila Greens Corridor",
        "primary_connecting_roads": [
            "Lodhi Road",
            "Mathura Road"
        ],
        "route_length_km": {"min": 3.2, "max": 3.8},
        "road_width_m": {
            "Mathura Road": "45-60",
            "Lodhi Road": "30"
        },
        "road_descriptions": {
            "Mathura Road": "major 6-to-8-lane national highway corridor (NH-44 section, as supplied), approximately 45 m to 60 m wide",
            "Lodhi Road": "4-to-6-lane boulevard, approximately 30 m wide"
        },
        "source_label": "user_supplied_reference",
        "verification_status": "approximate_unverified"
    },
    "CAND_007": {
        "name": "India Gate Lawns & Central Vista Greens — National Zoological Park & Purana Qila Greens Corridor",
        "primary_connecting_roads": [
            "Kartavya Path / C-Hexagon to Purana Qila Road and Mathura Road"
        ],
        "route_length_km": {"min": 1.5, "max": 2.1},
        "road_width_m": {
            "Purana Qila Road": "24-30",
            "C-Hexagon (India Gate Circle)": "45-60"
        },
        "road_descriptions": {
            "Purana Qila Road": "4-lane street, approximately 24 m to 30 m wide",
            "C-Hexagon (India Gate Circle)": "multi-lane rotary corridor, approximately 45 m to 60 m right-of-way"
        },
        "source_label": "user_supplied_reference",
        "verification_status": "approximate_unverified"
    },
    "CAND_008": {
        "name": "India Gate Lawns & Central Vista Greens — Delhi Golf Club Ecological Sanctuary Corridor",
        "primary_connecting_roads": [
            "Dr. Zakir Hussain Marg",
            "Shershah Road"
        ],
        "route_length_km": {"min": 1.6, "max": 2.0},
        "road_width_m": {
            "Dr. Zakir Hussain Marg": "30-45",
            "Shershah Road": "24"
        },
        "road_descriptions": {
            "Dr. Zakir Hussain Marg": "6-lane primary avenue, approximately 30 m to 45 m wide",
            "Shershah Road": "4-lane access avenue, approximately 24 m wide"
        },
        "source_label": "user_supplied_reference",
        "verification_status": "approximate_unverified"
    },
    "CAND_009": {
        "name": "Sunder Nursery & Humayun Greens — National Zoological Park & Purana Qila Greens Corridor",
        "primary_connecting_roads": [
            "Mathura Road",
            "Sundar Nagar Market Road"
        ],
        "route_length_km": {"min": 1.0, "max": 1.5},
        "road_width_m": {
            "Mathura Road": "45-60"
        },
        "road_descriptions": {
            "Mathura Road": "6-to-8-lane arterial road, approximately 45 m to 60 m wide"
        },
        "notes": "Directly adjacent boundary alignment across Mathura Road.",
        "source_label": "user_supplied_reference",
        "verification_status": "approximate_unverified"
    },
    "CAND_010": {
        "name": "Delhi Golf Club Ecological Sanctuary — Sunder Nursery & Humayun Greens Corridor",
        "primary_connecting_roads": [
            "Subramaniam Bharti Marg",
            "Mathura Road"
        ],
        "route_length_km": {"min": 1.2, "max": 1.8},
        "road_width_m": {
            "Subramaniam Bharti Marg / Mathura Road intersection": "40-60"
        },
        "road_descriptions": {
            "Subramaniam Bharti Marg / Mathura Road intersection": "6-to-8-lane major junction corridor, approximately 40 m to 60 m wide"
        },
        "notes": "Directly across Mathura Road / Golf Links edge.",
        "source_label": "user_supplied_reference",
        "verification_status": "approximate_unverified"
    },
    "CAND_011": {
        "name": "Hauz Khas Forest — Siri Fort City Forest Corridor",
        "primary_connecting_roads": [
            "Khel Gaon Marg",
            "August Kranti Marg"
        ],
        "route_length_km": {"min": 2.2, "max": 2.8},
        "road_width_m": {
            "Khel Gaon Marg": "24-30"
        },
        "road_descriptions": {
            "Khel Gaon Marg": "4-to-6-lane divided urban avenue, approximately 24 m to 30 m wide"
        },
        "source_label": "user_supplied_reference",
        "verification_status": "approximate_unverified"
    },
    "CAND_012": {
        "name": "Siri Fort City Forest — Jahanpanah City Forest Corridor",
        "primary_connecting_roads": [
            "Josip Broz Tito Marg (BRT Corridor)",
            "Chirag Delhi Flyover Road"
        ],
        "route_length_km": {"min": 2.5, "max": 3.2},
        "road_width_m": {
            "Josip Broz Tito Marg": "38-45"
        },
        "road_descriptions": {
            "Josip Broz Tito Marg": "6-to-8-lane major arterial boulevard, approximately 38 m to 45 m wide"
        },
        "source_label": "user_supplied_reference",
        "verification_status": "approximate_unverified"
    },
    "CAND_013": {
        "name": "Aravalli Biodiversity Park (Vasant Kunj) — Sanjay Van Corridor",
        "primary_connecting_roads": [
            "Aruna Asaf Ali Marg",
            "Abdul Gaffar Khan Marg (Vasant Kunj Marg, as supplied)"
        ],
        "route_length_km": {"min": 3.5, "max": 4.2},
        "road_width_m": {
            "Aruna Asaf Ali Marg": "30",
            "Abdul Gaffar Khan Marg": "24-30"
        },
        "road_descriptions": {
            "Aruna Asaf Ali Marg": "4-to-6-lane forest-edge road, approximately 30 m wide",
            "Abdul Gaffar Khan Marg": "4-lane avenue, approximately 24 m to 30 m wide"
        },
        "source_label": "user_supplied_reference",
        "verification_status": "approximate_unverified"
    },
    "CAND_014": {
        "name": "Mehrauli Archaeological Park — Sanjay Van Corridor",
        "primary_connecting_roads": [
            "Anuvrat Marg",
            "Sri Aurobindo Marg"
        ],
        "route_length_km": {"min": 1.2, "max": 1.8},
        "road_width_m": {
            "Anuvrat Marg / Sri Aurobindo Marg": "30-45"
        },
        "road_descriptions": {
            "Anuvrat Marg / Sri Aurobindo Marg": "4-to-6-lane primary junction corridor, approximately 30 m to 45 m wide"
        },
        "notes": "Directly adjacent across Sri Aurobindo Marg / Anuvrat Marg.",
        "source_label": "user_supplied_reference",
        "verification_status": "approximate_unverified"
    },
}


# ===========================================================================
# PART B — GREEN-SPACE REFERENCE METADATA (User-Supplied)
# ===========================================================================

GREEN_SPACE_REFERENCE = {
    "PATCH_001": {
        "name": "Central Ridge Reserve Forest",
        "area_ha": 673.32,
        "area_acres": 1664,
        "area_km2": 6.73,
        "perimeter_km": {"min": 14.5, "max": 16.0},
        "source_label": "user_supplied_reference",
        "verification_status": "approximate_unverified"
    },
    "PATCH_002": {
        "name": "Nehru Park (Chanakyapuri)",
        "area_ha": 32.37,
        "area_acres": 80,
        "area_km2": 0.32,
        "perimeter_km": {"min": 2.3, "max": 2.6},
        "source_label": "user_supplied_reference",
        "verification_status": "approximate_unverified"
    },
    "PATCH_003": {
        "name": "Lodhi Garden",
        "area_ha": 36.42,
        "area_acres": 90,
        "area_km2": 0.36,
        "perimeter_km": {"min": 2.5, "max": 2.8},
        "source_label": "user_supplied_reference",
        "verification_status": "approximate_unverified"
    },
    "PATCH_004": {
        "name": "Delhi Golf Club Ecological Sanctuary",
        "area_ha": 89.03,
        "area_acres": 220,
        "area_km2": 0.89,
        "perimeter_km": {"min": 4.2, "max": 4.6},
        "source_label": "user_supplied_reference",
        "verification_status": "approximate_unverified"
    },
    "PATCH_005": {
        "name": "India Gate Lawns & Central Vista Greens",
        "area_ha": 80.00,
        "area_acres": 198,
        "area_km2": 0.80,
        "perimeter_km": {"min": 4.0, "max": 4.5},
        "source_label": "user_supplied_reference",
        "verification_status": "approximate_unverified"
    },
    "PATCH_006": {
        "name": "National Zoological Park & Purana Qila Greens",
        "area_ha": 110.00,
        "area_acres": 272,
        "area_km2": 1.10,
        "perimeter_km": {"min": 4.8, "max": 5.2},
        "source_label": "user_supplied_reference",
        "verification_status": "approximate_unverified"
    },
    "PATCH_007": {
        "name": "Sunder Nursery & Humayun Greens",
        "area_ha": 36.42,
        "area_acres": 90,
        "area_km2": 0.36,
        "perimeter_km": {"min": 2.4, "max": 2.7},
        "source_label": "user_supplied_reference",
        "verification_status": "approximate_unverified"
    },
    "PATCH_008": {
        "name": "Hauz Khas Forest & Lake Complex",
        "area_ha": 70.00,
        "area_acres": 173,
        "area_km2": 0.70,
        "perimeter_km": {"min": 3.6, "max": 4.0},
        "source_label": "user_supplied_reference",
        "verification_status": "approximate_unverified"
    },
    "PATCH_009": {
        "name": "Siri Fort City Forest",
        "area_ha": 35.00,
        "area_acres": 86,
        "area_km2": 0.35,
        "perimeter_km": {"min": 2.5, "max": 2.8},
        "source_label": "user_supplied_reference",
        "verification_status": "approximate_unverified"
    },
    "PATCH_010": {
        "name": "Jahanpanah City Forest",
        "area_ha": 176.04,
        "area_acres": 435,
        "area_km2": 1.76,
        "perimeter_km": {"min": 6.5, "max": 7.2},
        "source_label": "user_supplied_reference",
        "verification_status": "approximate_unverified"
    },
    "PATCH_011": {
        "name": "Sanjay Van",
        "area_ha": 316.87,
        "area_acres": 783,
        "area_km2": 3.17,
        "perimeter_km": {"min": 8.5, "max": 9.2},
        "source_label": "user_supplied_reference",
        "verification_status": "approximate_unverified"
    },
    "PATCH_012": {
        "name": "Aravalli Biodiversity Park (Vasant Kunj)",
        "area_ha": 280.00,
        "area_acres": 692,
        "area_km2": 2.80,
        "perimeter_km": {"min": 7.8, "max": 8.4},
        "source_label": "user_supplied_reference",
        "verification_status": "approximate_unverified"
    },
}


# ===========================================================================
# REFERENCE-ID TO BACKEND-ID MAPPINGS
# ===========================================================================
# Explicit semantic mappings connecting user-supplied reference IDs to existing
# backend GIS feature IDs based on feature identity, names, and geographic endpoints.
# Unmatched features resolve to None and explicitly report no reference metadata.

CORRIDOR_REF_TO_BACKEND = {
    "CAND_001": None,          # Sanjay Van — Hauz Khas Forest Corridor (no direct candidate route in current 14)
    "CAND_002": "cand_002",    # Nehru Park (Chanakyapuri) — Lodhi Garden Corridor
    "CAND_003": "cand_001",    # Central Ridge Reserve Forest — Nehru Park (Chanakyapuri) Corridor
    "CAND_004": "cand_004",    # Lodhi Garden — Sunder Nursery & Humayun Greens Corridor
    "CAND_005": "cand_005",    # Lodhi Garden — Delhi Golf Club Ecological Sanctuary Corridor
    "CAND_006": "cand_006",    # Lodhi Garden — National Zoological Park & Purana Qila Greens Corridor
    "CAND_007": "cand_012",    # India Gate Lawns & Central Vista Greens — National Zoological Park Corridor
    "CAND_008": "cand_011",    # India Gate Lawns & Central Vista Greens — Delhi Golf Club Corridor
    "CAND_009": "cand_009",    # Sunder Nursery & Humayun Greens — National Zoological Park Corridor
    "CAND_010": "cand_008",    # Delhi Golf Club Ecological Sanctuary — Sunder Nursery Corridor
    "CAND_011": "cand_013",    # Hauz Khas Forest — Siri Fort City Forest Corridor (via Khel Gaon / Rose Garden)
    "CAND_012": "cand_014",    # Siri Fort City Forest — Jahanpanah City Forest Corridor
    "CAND_013": None,          # Aravalli Biodiversity Park — Sanjay Van Corridor (unmatched)
    "CAND_014": None           # Mehrauli Archaeological Park — Sanjay Van Corridor (unmatched)
}

GREEN_SPACE_REF_TO_BACKEND = {
    "PATCH_001": "patch_001",  # Central Ridge Reserve Forest
    "PATCH_002": "patch_002",  # Nehru Park (Chanakyapuri)
    "PATCH_003": "patch_003",  # Lodhi Garden
    "PATCH_004": "patch_005",  # Delhi Golf Club Ecological Sanctuary
    "PATCH_005": "patch_011",  # India Gate Lawns & Central Vista Greens
    "PATCH_006": "patch_006",  # National Zoological Park & Purana Qila Greens
    "PATCH_007": "patch_004",  # Sunder Nursery & Humayun Greens
    "PATCH_008": "patch_007",  # Hauz Khas Forest & Lake Complex <-> Hauz Khas District Park & Deer Park
    "PATCH_009": "patch_009",  # Siri Fort City Forest <-> Siri Fort Sports Complex & City Forest
    "PATCH_010": "patch_012",  # Jahanpanah City Forest <-> Jahanpanah City Forest (Northern Fringe)
    "PATCH_011": "patch_010",  # Sanjay Van <-> Sanjay Van Northern Forest Corridor
    "PATCH_012": None          # Aravalli Biodiversity Park (Vasant Kunj) (unmatched in 12 GIS polygons)
}

# Reverse mappings: backend_id -> ref_id (only for matched features)
CORRIDOR_BACKEND_TO_REF = {v: k for k, v in CORRIDOR_REF_TO_BACKEND.items() if v is not None}
GREEN_SPACE_BACKEND_TO_REF = {v: k for k, v in GREEN_SPACE_REF_TO_BACKEND.items() if v is not None}


def get_corridor_reference(backend_id: str) -> dict:
    """Get reference metadata for a corridor by backend ID (e.g. 'cand_001')."""
    ref_id = CORRIDOR_BACKEND_TO_REF.get(backend_id)
    if ref_id:
        return CORRIDOR_REFERENCE.get(ref_id, {})
    return {}


def get_green_space_reference(backend_id: str) -> dict:
    """Get reference metadata for a green space by backend ID (e.g. 'patch_001')."""
    ref_id = GREEN_SPACE_BACKEND_TO_REF.get(backend_id)
    if ref_id:
        return GREEN_SPACE_REFERENCE.get(ref_id, {})
    return {}
