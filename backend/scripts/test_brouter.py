import json
from urllib.request import Request, urlopen

# Test GraphHopper or BRouter or Valhalla or alternative OSM pedestrian servers
# BRouter is free, public, specifically designed for trekking and cycling in OSM!
# BRouter URL: brouter.de/brouter?lonlats=...&profile=trekking&alternativeidx=0&format=geojson
def test_brouter():
    # Rambara (30.685, 79.075) to Kedarnath (30.7352, 79.0669)
    # lon,lat|lon,lat
    url = "https://brouter.de/brouter?lonlats=79.075,30.685|79.0669,30.7352&profile=hiking&alternativeidx=0&format=geojson"
    req = Request(url, headers={"User-Agent": "TerranexHackathon/1.0"})
    try:
        with urlopen(req, timeout=15) as r:
            data = json.load(r)
            coords = data["features"][0]["geometry"]["coordinates"]
            print(f"BROUTER SUCCESS! Got {len(coords)} real hiking trek points for Rambara -> Kedarnath!")
            return coords
    except Exception as e:
        print("BRouter error:", e)
        return None

if __name__ == "__main__":
    test_brouter()
