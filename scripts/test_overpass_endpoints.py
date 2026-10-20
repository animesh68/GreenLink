"""
Test alternative Overpass endpoints for South-Central Delhi road extraction.
"""
import requests

BBOX = {"south": 28.530, "west": 77.160, "north": 28.640, "east": 77.270}
query = f"""
[out:json][timeout:25];
(
  way["highway"~"^(primary|secondary)$"]({BBOX['south']},{BBOX['west']},{BBOX['north']},{BBOX['east']});
);
out count;
"""

endpoints = [
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://overpass-api.de/api/interpreter"
]

for ep in endpoints:
    print(f"Testing {ep}...")
    try:
        r = requests.post(ep, data={"data": query}, headers={"User-Agent": "GreenLinkDelhiResearch/1.0"}, timeout=15)
        print(f"  -> Status: {r.status_code}")
        if r.status_code == 200:
            print("  -> Success! Result:", r.json())
            break
    except Exception as e:
        print(f"  -> Failed: {e}")
