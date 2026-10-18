import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

endpoints = [
    ("/health", {}),
    ("/network", {"rainfall_mm": 80.0}),
    ("/live/rainfall", {}),
    ("/live/villages", {}),
    ("/risk/timeline", {"hours": 24, "threshold": 0.5}),
    ("/risk/segment/E06", {"rainfall_mm": 15.0, "prior1": 10.0, "prior2": 5.0}),
    ("/dispatch/plan", {"rainfall_mm": 85.0, "prior1": 0.0, "prior2": 0.0, "hours": 1.0}),
    ("/simulate/cascade", {"rainfall_mm": 85.0}),
    ("/ml/status", {}),
    ("/ml/predict", {"mean_gradient_pct": 28.0, "hourly_rainfall_mm": 18.0}),
]

print(f"{'Endpoint':<25} | {'Status':<6} | {'Key Fields Returned'}")
print("-" * 75)

for path, params in endpoints:
    r = client.get(path, params=params)
    keys_str = ""
    if r.status_code == 200:
        data = r.json()
        if isinstance(data, dict):
            keys_str = ", ".join(list(data.keys())[:6])
        elif isinstance(data, list):
            keys_str = f"List of {len(data)} items"
    else:
        keys_str = f"Error: {r.text[:50]}"
    print(f"{path:<25} | {r.status_code:<6} | {keys_str}")
