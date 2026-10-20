"""
Extract and parse OSM roads from official OSM API into a clean NetworkX graph.
"""
import requests
import xml.etree.ElementTree as ET
import os
import json
import math
from typing import Dict, Any, List, Tuple
from shapely.geometry import LineString, Point
from shapely.ops import transform
import pyproj
import networkx as nx

wgs84_to_utm = pyproj.Transformer.from_crs("EPSG:4326", "EPSG:32643", always_xy=True).transform

RAW_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "raw")
PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "processed")
os.makedirs(RAW_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

# Study bounding box
BBOX = {"min_lon": 77.160, "min_lat": 28.530, "max_lon": 77.270, "max_lat": 28.640}

# Allowed road classes for urban / walkable green corridors
ALLOWED_HIGHWAYS = {
    "primary", "primary_link",
    "secondary", "secondary_link",
    "tertiary", "tertiary_link",
    "residential", "living_street",
    "unclassified", "pedestrian", "cycleway", "footway", "path"
}

# Explicitly excluded high-speed non-walkable barriers
EXCLUDED_HIGHWAYS = {
    "motorway", "motorway_link",
    "trunk", "trunk_link"
}


def download_osm_tile(min_lon: float, min_lat: float, max_lon: float, max_lat: float, tile_idx: int) -> str:
    """Download an OSM XML tile from api.openstreetmap.org and cache to raw/."""
    cache_file = os.path.join(RAW_DIR, f"osm_tile_{tile_idx}.xml")
    if os.path.exists(cache_file) and os.path.getsize(cache_file) > 1000:
        print(f"[*] Tile {tile_idx} found in cache ({os.path.getsize(cache_file):,} bytes)")
        return cache_file

    url = f"https://api.openstreetmap.org/api/0.6/map?bbox={min_lon},{min_lat},{max_lon},{max_lat}"
    print(f"[*] Downloading OSM tile {tile_idx} from: {url}")
    headers = {"User-Agent": "GreenLinkDelhiResearch/1.0 (academic geospatial research; contact: research@greenlink.delhi)"}
    
    resp = requests.get(url, headers=headers, timeout=60)
    if resp.status_code == 200 and len(resp.content) > 1000:
        with open(cache_file, "wb") as f:
            f.write(resp.content)
        print(f"[OK] Tile {tile_idx} cached ({len(resp.content):,} bytes)")
        return cache_file
    else:
        raise RuntimeError(f"Failed to fetch tile {tile_idx}: status {resp.status_code}")


def parse_osm_xml(xml_path: str, all_nodes: Dict[int, Tuple[float, float, float, float]], all_edges: List[Dict[str, Any]]):
    """
    Parse an OSM XML file, extracting node coordinates and filtered road ways.
    """
    print(f"[*] Parsing {os.path.basename(xml_path)}...")
    tree = ET.parse(xml_path)
    root = tree.getroot()

    # 1. Parse all nodes
    for node in root.findall("node"):
        nid = int(node.get("id"))
        lat = float(node.get("lat"))
        lon = float(node.get("lon"))
        
        # Metric UTM 43N coordinates
        pt_utm = transform(wgs84_to_utm, Point(lon, lat))
        all_nodes[nid] = (lon, lat, pt_utm.x, pt_utm.y)

    # 2. Parse all ways tagged with highway
    for way in root.findall("way"):
        wid = int(way.get("id"))
        tags = {tag.get("k"): tag.get("v") for tag in way.findall("tag")}
        highway = tags.get("highway")
        
        if not highway or highway in EXCLUDED_HIGHWAYS or highway not in ALLOWED_HIGHWAYS:
            continue

        way_nodes = [int(nd.get("ref")) for nd in way.findall("nd")]
        if len(way_nodes) < 2:
            continue

        name = tags.get("name", tags.get("name:en", "Unnamed Street"))
        oneway = tags.get("oneway", "no") == "yes"

        all_edges.append({
            "way_id": wid,
            "highway": highway,
            "name": name,
            "nodes": way_nodes,
            "oneway": oneway
        })


def main():
    # 4 tiles covering the study area
    tiles = [
        # South-West (Hauz Khas, Sanjay Van fringe)
        (77.160, 28.530, 77.215, 28.585, 1),
        # South-East (Lajpat Nagar, Siri Fort, Jahanpanah fringe)
        (77.215, 28.530, 77.270, 28.585, 2),
        # North-West (Central Ridge, Chanakyapuri, Nehru Park)
        (77.160, 28.585, 77.215, 28.640, 3),
        # North-East (Lodhi Garden, Sunder Nursery, Purana Qila)
        (77.215, 28.585, 77.270, 28.640, 4)
    ]

    all_nodes: Dict[int, Tuple[float, float, float, float]] = {}
    all_edges: List[Dict[str, Any]] = []

    for min_lon, min_lat, max_lon, max_lat, idx in tiles:
        try:
            tile_path = download_osm_tile(min_lon, min_lat, max_lon, max_lat, idx)
            parse_osm_xml(tile_path, all_nodes, all_edges)
        except Exception as e:
            print(f"[!] Error on tile {idx}: {e}")

    print(f"[OK] Total unique nodes parsed: {len(all_nodes):,}")
    print(f"[OK] Total road ways parsed: {len(all_edges):,}")


if __name__ == "__main__":
    main()
