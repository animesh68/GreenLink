"""
Test Overpass API road extraction for South-Central Delhi.
"""
import requests
import json
import os

BBOX = {"south": 28.530, "west": 77.160, "north": 28.640, "east": 77.270}

overpass_url = "https://overpass-api.de/api/interpreter"
query = f"""
[out:json][timeout:30];
(
  way["highway"~"^(primary|secondary|tertiary)$"]({BBOX['south']},{BBOX['west']},{BBOX['north']},{BBOX['east']});
);
out count;
"""

print("[*] Testing Overpass query for primary/secondary/tertiary roads in study area...")
try:
    resp = requests.post(overpass_url, data={"data": query}, headers={"User-Agent": "GreenLinkDelhiResearch/1.0"}, timeout=35)
    print("HTTP Status:", resp.status_code)
    if resp.status_code == 200:
        print("Response:", resp.json())
    else:
        print("Response text:", resp.text[:200])
except Exception as e:
    print("Exception:", e)
