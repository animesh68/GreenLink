import requests
import re

r = requests.get('https://download.bbbike.org/osm/bbbike/NewDelhi/', timeout=15)
matches = re.findall(r'href=[\'"]([^\'"]+)[\'"]', r.text)
for m in matches:
    if any(ext in m for ext in ['.geojson', '.pbf', '.shp', '.gz', '.xz', '.osm']):
        print(m)
