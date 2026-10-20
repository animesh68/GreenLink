"""
GreenLink Delhi: Street Network Extraction & Candidate Corridor Generation Pipeline
Extracts real OpenStreetMap road networks for South-Central Delhi using the official OSM API.
Builds a NetworkX graph with metric edge weights (EPSG:32643) and performs anchor-to-anchor routing.
"""

import os
import sys
import time
import json
import math
import xml.etree.ElementTree as ET
from typing import Dict, Any, List, Tuple, Set, Optional

import requests
import networkx as nx
from shapely.geometry import Point, LineString, Polygon, mapping, shape
from shapely.ops import transform
import pyproj

# Coordinate transformers
wgs84_to_utm = pyproj.Transformer.from_crs("EPSG:4326", "EPSG:32643", always_xy=True).transform
utm_to_wgs84 = pyproj.Transformer.from_crs("EPSG:32643", "EPSG:4326", always_xy=True).transform

RAW_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "raw")
PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "processed")
os.makedirs(RAW_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

# Study bounding box
BBOX = {"min_lon": 77.160, "min_lat": 28.530, "max_lon": 77.270, "max_lat": 28.640}

# Road classes appropriate for urban green corridor interventions
# Excludes high-speed, inaccessible barriers (motorway, trunk)
ALLOWED_HIGHWAYS = {
    "primary", "primary_link",
    "secondary", "secondary_link",
    "tertiary", "tertiary_link",
    "residential", "living_street",
    "unclassified", "pedestrian", "cycleway"
}

EXCLUDED_HIGHWAYS = {
    "motorway", "motorway_link",
    "trunk", "trunk_link",
    "service", "track"
}

# Provisional, configurable implementation cost rates (INR per linear meter)
# These represent provisional planning benchmarks, NOT official municipal tender rates.
CONFIGURABLE_COST_MODEL = {
    "primary": 6000.0,       # Arterial avenue: multi-tier tree canopy + bioswale buffer
    "primary_link": 5000.0,
    "secondary": 4500.0,     # Secondary street: continuous shade canopy + permeable verge
    "secondary_link": 4000.0,
    "tertiary": 3500.0,      # Collector corridor: street trees + green infrastructure
    "tertiary_link": 3000.0,
    "residential": 2500.0,   # Neighborhood greenway: traffic-calmed tree canopy
    "living_street": 2500.0,
    "pedestrian": 2000.0,    # Dedicated pedestrian shaded greenway
    "cycleway": 2000.0,
    "unclassified": 2500.0,
    "base_mobilization_inr": 150000.0  # Site mobilization / survey setup per corridor
}


def download_osm_tile(min_lon: float, min_lat: float, max_lon: float, max_lat: float, tile_id: str) -> Optional[str]:
    """Downloads an OSM XML bounding box from api.openstreetmap.org and caches locally."""
    cache_path = os.path.join(RAW_DIR, f"osm_tile_{tile_id}.xml")
    if os.path.exists(cache_path) and os.path.getsize(cache_path) > 5000:
        return cache_path

    url = f"https://api.openstreetmap.org/api/0.6/map?bbox={min_lon:.4f},{min_lat:.4f},{max_lon:.4f},{max_lat:.4f}"
    headers = {"User-Agent": "GreenLinkDelhiResearch/1.0 (academic geospatial corridor planning; contact: research@greenlink.delhi)"}
    
    try:
        time.sleep(1.0)  # Respectful pause
        resp = requests.get(url, headers=headers, timeout=60)
        if resp.status_code == 200 and len(resp.content) > 1000:
            with open(cache_path, "wb") as f:
                f.write(resp.content)
            return cache_path
        else:
            print(f"[!] Tile {tile_id} returned HTTP {resp.status_code}: {resp.text[:100]}")
            return None
    except Exception as e:
        print(f"[!] Failed tile {tile_id}: {e}")
        return None


def harvest_street_network() -> Tuple[Dict[int, Tuple[float, float, float, float]], List[Dict[str, Any]]]:
    """
    Harvests OSM road network across the South-Central Delhi bounding box.
    Uses 9 overlapping sub-tiles (3x3 grid) to stay strictly below OSM 50k node limits.
    """
    lons = [77.160, 77.198, 77.234, 77.270]
    lats = [28.530, 28.568, 28.604, 28.640]

    all_nodes: Dict[int, Tuple[float, float, float, float]] = {}
    ways: Dict[int, Dict[str, Any]] = {}

    tile_count = 0
    success_count = 0

    print("[*] Harvesting OpenStreetMap road network via official OSM API...")
    for i in range(len(lons) - 1):
        for j in range(len(lats) - 1):
            tile_count += 1
            tile_id = f"r{j}_c{i}"
            min_lon = max(77.158, lons[i] - 0.002)
            max_lon = min(77.272, lons[i + 1] + 0.002)
            min_lat = max(28.528, lats[j] - 0.002)
            max_lat = min(28.642, lats[j + 1] + 0.002)

            xml_path = download_osm_tile(min_lon, min_lat, max_lon, max_lat, tile_id)
            if not xml_path:
                continue

            success_count += 1
            try:
                tree = ET.parse(xml_path)
                root = tree.getroot()

                for node in root.findall("node"):
                    nid = int(node.get("id"))
                    if nid not in all_nodes:
                        lon = float(node.get("lon"))
                        lat = float(node.get("lat"))
                        pt_utm = transform(wgs84_to_utm, Point(lon, lat))
                        all_nodes[nid] = (lon, lat, pt_utm.x, pt_utm.y)

                for way in root.findall("way"):
                    wid = int(way.get("id"))
                    if wid in ways:
                        continue

                    tags = {tag.get("k"): tag.get("v") for tag in way.findall("tag")}
                    highway = tags.get("highway")

                    if not highway or highway in EXCLUDED_HIGHWAYS or highway not in ALLOWED_HIGHWAYS:
                        continue

                    way_nodes = [int(nd.get("ref")) for nd in way.findall("nd")]
                    if len(way_nodes) < 2:
                        continue

                    name = tags.get("name", tags.get("name:en", "Unnamed Street"))
                    oneway = tags.get("oneway", "no") == "yes"

                    ways[wid] = {
                        "way_id": wid,
                        "highway": highway,
                        "name": name,
                        "nodes": way_nodes,
                        "oneway": oneway
                    }
            except Exception as e:
                print(f"[!] Error parsing {xml_path}: {e}")

    print(f"[OK] Harvested {success_count}/{tile_count} tiles successfully.")
    print(f"[OK] Unique street nodes: {len(all_nodes):,}, Filtered road ways: {len(ways):,}")
    return all_nodes, list(ways.values())


def build_networkx_graph(all_nodes: Dict[int, Tuple[float, float, float, float]], ways: List[Dict[str, Any]]) -> nx.Graph:
    """
    Builds a metric NetworkX graph from OSM nodes and ways.
    Edge weights represent metric distances in EPSG:32643 (UTM 43N).
    """
    G = nx.Graph()

    for nid, (lon, lat, utm_x, utm_y) in all_nodes.items():
        G.add_node(nid, lon=lon, lat=lat, x=utm_x, y=utm_y)

    for w in ways:
        nodes = w["nodes"]
        highway = w["highway"]
        name = w["name"]
        wid = w["way_id"]

        for i in range(len(nodes) - 1):
            u = nodes[i]
            v = nodes[i + 1]

            if u in all_nodes and v in all_nodes:
                ux, uy = all_nodes[u][2], all_nodes[u][3]
                vx, vy = all_nodes[v][2], all_nodes[v][3]
                dist_m = math.hypot(vx - ux, vy - uy)

                # Avoid degenerate zero-length segments
                if dist_m > 0.1:
                    # If multiple ways share this segment, keep the shortest or update
                    if G.has_edge(u, v):
                        if dist_m < G[u][v]["weight"]:
                            G[u][v]["weight"] = dist_m
                            G[u][v]["highway"] = highway
                            G[u][v]["name"] = name
                            G[u][v]["way_id"] = wid
                    else:
                        G.add_edge(u, v, weight=dist_m, highway=highway, name=name, way_id=wid)

    print(f"[OK] Initial NetworkX Graph: {G.number_of_nodes():,} nodes, {G.number_of_edges():,} edges")
    
    # Prune isolated nodes with degree 0
    isolated = [n for n in G.nodes() if G.degree(n) == 0]
    G.remove_nodes_from(isolated)
    print(f"[OK] After pruning isolated nodes: {G.number_of_nodes():,} nodes, {G.number_of_edges():,} edges")

    return G


if __name__ == "__main__":
    nodes, ways = harvest_street_network()
    G = build_networkx_graph(nodes, ways)
    print(f"[OK] Finished harvest. Graph has {G.number_of_nodes()} connected nodes.")
