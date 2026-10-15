import json
from pathlib import Path

def inspect():
    base = Path(r"c:\Study\Hekathon\Innotech 2026\Terranex\backend\data")
    with open(base / "osm_roads_raw.geojson", encoding="utf-8") as f:
        geo = json.load(f)

    for f in geo["features"]:
        props = f["properties"]
        geom = f["geometry"]
        coords = geom["coordinates"]
        lats = [c[1] for c in coords]
        lons = [c[0] for c in coords]
        print(f"Way {props.get('@id')}: ref={props.get('ref')} name={props.get('name')} pts={len(coords)} lat_range=[{min(lats):.4f}, {max(lats):.4f}], lon_range=[{min(lons):.4f}, {max(lons):.4f}]")

if __name__ == "__main__":
    inspect()
