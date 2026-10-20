"""
GreenLink Delhi: Adaptive OSM Road Network Harvester
Recursively subdivides bounding boxes if they exceed OSM's 50k node limit.
Builds a unified, topologically connected NetworkX road graph for South-Central Delhi.
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
from shapely.geometry import Point, LineString, box
from shapely.ops import transform
import pyproj

wgs84_to_utm = pyproj.Transformer.from_crs("EPSG:4326", "EPSG:32643", always_xy=True).transform
utm_to_wgs84 = pyproj.Transformer.from_crs("EPSG:32643", "EPSG:4326", always_xy=True).transform

RAW_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "raw")
PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "processed")
os.makedirs(RAW_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

# Study bounding box: South-Central Delhi
BBOX = {"min_lon": 77.160, "min_lat": 28.530, "max_lon": 77.270, "max_lat": 28.640}

ALLOWED_HIGHWAYS = {
    "primary", "primary_link",
    "secondary", "secondary_link",
    "tertiary", "tertiary_link",
    "residential", "living_street",
    "unclassified", "pedestrian", "cycleway", "footway"
}

EXCLUDED_HIGHWAYS = {
    "motorway", "motorway_link",
    "trunk", "trunk_link",
    "service", "track"
}


def fetch_osm_bbox(min_lon: float, min_lat: float, max_lon: float, max_lat: float, label: str, depth: int = 0) -> List[str]:
    """
    Fetches an OSM XML box. If OSM returns 400 (too many nodes), recursively subdivides into 4 quadrants.
    Returns list of paths to cached XML files.
    """
    cache_path = os.path.join(RAW_DIR, f"osm_{label}.xml")
    if os.path.exists(cache_path) and os.path.getsize(cache_path) > 5000:
        return [cache_path]

    url = f"https://api.openstreetmap.org/api/0.6/map?bbox={min_lon:.4f},{min_lat:.4f},{max_lon:.4f},{max_lat:.4f}"
    headers = {"User-Agent": "GreenLinkDelhiResearch/1.0 (academic geospatial research; contact: research@greenlink.delhi)"}

    try:
        time.sleep(0.5)
        resp = requests.get(url, headers=headers, timeout=60)
        if resp.status_code == 200 and len(resp.content) > 1000:
            with open(cache_path, "wb") as f:
                f.write(resp.content)
            print(f"[OK] Fetched {label} ({len(resp.content):,} bytes)")
            return [cache_path]
        elif resp.status_code == 400 and depth < 3:
            # Subdivide into 4 quadrants
            mid_lon = (min_lon + max_lon) / 2.0
            mid_lat = (min_lat + max_lat) / 2.0
            print(f"[*] Node limit reached on {label}. Subdividing to depth {depth+1}...")
            
            q1 = fetch_osm_bbox(min_lon, min_lat, mid_lon, mid_lat, f"{label}_sw", depth + 1)
            q2 = fetch_osm_bbox(mid_lon, min_lat, max_lon, mid_lat, f"{label}_se", depth + 1)
            q3 = fetch_osm_bbox(min_lon, mid_lat, mid_lon, max_lat, f"{label}_nw", depth + 1)
            q4 = fetch_osm_bbox(mid_lon, mid_lat, max_lon, max_lat, f"{label}_ne", depth + 1)
            return q1 + q2 + q3 + q4
        else:
            print(f"[!] Tile {label} returned {resp.status_code}")
            return []
    except Exception as e:
        print(f"[!] Network error on {label}: {e}")
        return []


def main():
    print("[*] Starting adaptive harvesting of South-Central Delhi street network...")
    # Base 3x3 grid
    lons = [77.160, 77.198, 77.234, 77.270]
    lats = [28.530, 28.568, 28.604, 28.640]

    xml_files = []
    for i in range(len(lons) - 1):
        for j in range(len(lats) - 1):
            tile_label = f"grid_{j}_{i}"
            min_l = max(77.158, lons[i] - 0.001)
            max_l = min(77.272, lons[i + 1] + 0.001)
            min_b = max(28.528, lats[j] - 0.001)
            max_b = min(28.642, lats[j + 1] + 0.001)
            files = fetch_osm_bbox(min_l, min_b, max_l, max_b, tile_label, depth=0)
            xml_files.extend(files)

    print(f"[OK] Total XML files harvested: {len(xml_files)}")

    all_nodes: Dict[int, Tuple[float, float, float, float]] = {}
    ways: Dict[int, Dict[str, Any]] = {}

    for fpath in xml_files:
        try:
            tree = ET.parse(fpath)
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
                ways[wid] = {
                    "way_id": wid,
                    "highway": highway,
                    "name": name,
                    "nodes": way_nodes
                }
        except Exception as e:
            print(f"[!] Error parsing {fpath}: {e}")

    print(f"[OK] Parsed {len(all_nodes):,} unique nodes, {len(ways):,} street ways.")

    # Build NetworkX graph
    G = nx.Graph()
    for nid, (lon, lat, utm_x, utm_y) in all_nodes.items():
        G.add_node(nid, lon=lon, lat=lat, x=utm_x, y=utm_y)

    for w in ways.values():
        nodes = w["nodes"]
        hwy = w["highway"]
        name = w["name"]
        wid = w["way_id"]

        for idx in range(len(nodes) - 1):
            u, v = nodes[idx], nodes[idx + 1]
            if u in all_nodes and v in all_nodes:
                ux, uy = all_nodes[u][2], all_nodes[u][3]
                vx, vy = all_nodes[v][2], all_nodes[v][3]
                d = math.hypot(vx - ux, vy - uy)
                if d > 0.1:
                    if G.has_edge(u, v):
                        if d < G[u][v]["weight"]:
                            G[u][v]["weight"] = d
                            G[u][v]["highway"] = hwy
                            G[u][v]["name"] = name
                            G[u][v]["way_id"] = wid
                    else:
                        G.add_edge(u, v, weight=d, highway=hwy, name=name, way_id=wid)

    isolated = [n for n in G.nodes() if G.degree(n) == 0]
    G.remove_nodes_from(isolated)
    print(f"[OK] Cleaned Road Graph: {G.number_of_nodes():,} nodes, {G.number_of_edges():,} edges.")

    # Save road graph representation for fast backend loading
    graph_data = {
        "nodes": {
            str(nid): {
                "lon": G.nodes[nid]["lon"],
                "lat": G.nodes[nid]["lat"],
                "x": G.nodes[nid]["x"],
                "y": G.nodes[nid]["y"]
            }
            for nid in G.nodes()
        },
        "edges": [
            {
                "u": str(u),
                "v": str(v),
                "weight": round(data["weight"], 2),
                "highway": data.get("highway", "unclassified"),
                "name": data.get("name", "Unnamed Street"),
                "way_id": data.get("way_id", 0)
            }
            for u, v, data in G.edges(data=True)
        ]
    }

    out_file = os.path.join(PROCESSED_DIR, "street_network.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(graph_data, f)
    print(f"[OK] Saved processed street network graph to {out_file} ({os.path.getsize(out_file):,} bytes)")


if __name__ == "__main__":
    main()
