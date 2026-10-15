import json
from urllib.request import Request, urlopen

# Test OSRM nearest service to see where it snaps
def test_snap(lat, lon):
    url = f"https://router.project-osrm.org/nearest/v1/driving/{lon},{lat}?number=1"
    req = Request(url, headers={"User-Agent": "TerranexHackathon/1.0"})
    try:
        with urlopen(req, timeout=10) as r:
            data = json.load(r)
            if "waypoints" in data and len(data["waypoints"]) > 0:
                wp = data["waypoints"][0]
                print(f"Original ({lat}, {lon}) -> Snapped ({wp['location'][1]}, {wp['location'][0]}) dist={wp['distance']:.1f}m name={wp['name']}")
                return wp['location']
    except Exception as e:
        print(f"Snap error for {lat}, {lon}: {e}")
    return None

if __name__ == "__main__":
    print("Sonprayag:")
    sp = test_snap(30.631, 79.078)
    print("Triyuginarayan:")
    tr = test_snap(30.656, 79.098)
    print("Rambara:")
    rb = test_snap(30.685, 79.075)
    print("Kedarnath:")
    kd = test_snap(30.7352, 79.0669)
