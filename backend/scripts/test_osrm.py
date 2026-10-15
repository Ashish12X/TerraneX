import json
from urllib.request import Request, urlopen
from urllib.error import URLError

def test_osrm():
    # OSRM demo server for car routing between Rudraprayag (30.2844, 78.9811) and Augustmuni (30.39, 79.023)
    # lon,lat format
    url = "https://router.project-osrm.org/route/v1/driving/78.9811,30.2844;79.023,30.39?overview=full&geometries=geojson"
    req = Request(url, headers={"User-Agent": "TerranexHackathon/1.0"})
    try:
        with urlopen(req, timeout=10) as r:
            data = json.load(r)
            if "routes" in data and len(data["routes"]) > 0:
                coords = data["routes"][0]["geometry"]["coordinates"]
                print(f"OSRM SUCCESS! Got {len(coords)} real road points for Rudraprayag-Augustmuni!")
                return True
    except Exception as e:
        print("OSRM error:", e)
        return False

if __name__ == "__main__":
    test_osrm()
