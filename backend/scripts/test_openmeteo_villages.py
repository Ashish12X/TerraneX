import json
from urllib.request import urlopen
from urllib.parse import urlencode
from pathlib import Path

DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "network.json"
with open(DATA_FILE, encoding="utf-8") as f:
    net = json.load(f)

villages = [n for n in net["nodes"] if n.get("type") == "village"]
lats = ",".join(str(v["lat"]) for v in villages)
lons = ",".join(str(v["lon"]) for v in villages)

params = urlencode({
    "latitude": lats,
    "longitude": lons,
    "current": "precipitation",
    "hourly": "precipitation",
    "past_days": 3,
    "forecast_days": 2,
    "timezone": "Asia/Kolkata",
})
url = f"https://api.open-meteo.com/v1/forecast?{params}"
print(f"Requesting multi-location url: {url[:80]}... (total len: {len(url)})")

with urlopen(url, timeout=10) as r:
    data = json.load(r)

print(f"Received {len(data)} items for {len(villages)} villages.")
for i, item in enumerate(data):
    v = villages[i]
    times = item["hourly"]["time"]
    vals = [x or 0.0 for x in item["hourly"]["precipitation"]]
    cur_time = item["current"]["time"][:13] + ":00"
    idx = times.index(cur_time) if cur_time in times else len(times) // 2
    p0 = sum(vals[max(0, idx - 23): idx + 1])
    p1 = sum(vals[max(0, idx - 47): max(0, idx - 23)])
    p2 = sum(vals[max(0, idx - 71): max(0, idx - 47)])
    eff = p0 + 0.5 * p1 + 0.25 * p2
    next24 = sum(vals[idx + 1: idx + 25])
    print(f"  {v['id']} ({v['name']}): past_24h={p0:.1f}mm, eff_72h={eff:.1f}mm, next_24h={next24:.1f}mm, cur={item['current']['precipitation']}mm/hr, elev={item.get('elevation')}m")
