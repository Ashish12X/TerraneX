import json
from urllib.request import Request, urlopen
from urllib.parse import quote

def test_overpass():
    # Bounding box around Kedarnath valley: lat 30.60 to 30.75, lon 79.00 to 79.12
    # Find highway in this box
    query = """
    [out:json][timeout:25];
    (
      way["highway"~"path|footway|track|tertiary|unclassified"](30.63,79.05,30.75,79.10);
    );
    out geom;
    """
    url = f"https://overpass-api.de/api/interpreter?data={quote(query)}"
    req = Request(url, headers={"User-Agent": "TerranexHackathon/1.0"})
    try:
        with urlopen(req, timeout=20) as r:
            data = json.load(r)
            elements = data.get("elements", [])
            print(f"Overpass SUCCESS! Got {len(elements)} trek/path ways in Kedarnath valley!")
            for el in elements[:5]:
                print(el.get("tags", {}).get("name", "unnamed"), el.get("tags", {}).get("highway"), len(el.get("geometry", [])))
            return data
    except Exception as e:
        print("Overpass error:", e)
        return None

if __name__ == "__main__":
    test_overpass()
