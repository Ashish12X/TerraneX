import json
from pathlib import Path

path = Path("data/osm_roads_raw.geojson")

with open(path, encoding="utf-8") as f:
    data = json.load(f)

features = data["features"]
print(f"Total road segments: {len(features)}")

# Highway types count
from collections import Counter
highways = Counter()
for f in features:
    h = f["properties"].get("highway", "unknown")
    highways[h] += 1

print("\nHighway types:")
for k, v in highways.most_common():
    print(f"  {k}: {v}")