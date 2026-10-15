import json
import time
from urllib.parse import urlencode
from urllib.request import urlopen

# Rudraprayag district ka approximate centre (baad mein village-wise karenge)
LAT, LON = 30.2844, 78.9811
CACHE_SECONDS = 600

_cache = {"t": 0.0, "data": None}


def _fetch():
    params = urlencode({
        "latitude": LAT,
        "longitude": LON,
        "current": "precipitation",
        "hourly": "precipitation",
        "past_days": 3,
        "forecast_days": 2,
        "timezone": "Asia/Kolkata",
    })
    url = f"https://api.open-meteo.com/v1/forecast?{params}"
    with urlopen(url, timeout=10) as r:
        return json.load(r)


def get_live_rainfall():
    """Pichhle 24h aur agle 24h ka rainfall (mm), 10 minute cache ke saath."""
    now = time.time()
    if _cache["data"] and now - _cache["t"] < CACHE_SECONDS:
        return {**_cache["data"], "cached": True}

    try:
        raw = _fetch()
    except Exception as e:
        if _cache["data"]:
            return {**_cache["data"], "cached": True, "stale": True}
        raise RuntimeError(f"Live weather data nahi mila: {e}")

    times = raw["hourly"]["time"]
    values = [v or 0.0 for v in raw["hourly"]["precipitation"]]

    current_hour = raw["current"]["time"][:13] + ":00"
    idx = times.index(current_hour) if current_hour in times else len(times) // 2

    # weights 0.5 aur 0.25 prototype weighting hain, kisi paper se calibrated nahi.
    p0 = sum(values[max(0, idx - 23): idx + 1])          # 0-24h
    p1 = sum(values[max(0, idx - 47): max(0, idx - 23)]) # 24-48h
    p2 = sum(values[max(0, idx - 71): max(0, idx - 47)]) # 48-72h
    effective = p0 + 0.5 * p1 + 0.25 * p2
    next_24h = sum(values[idx + 1: idx + 25])

    data = {
        "source": "Open-Meteo",
        "location": "Rudraprayag",
        "observed_at": raw["current"]["time"],
        "current_mm_per_hr": raw["current"]["precipitation"],
        "past_24h_mm": round(p0, 1),
        "past_24_48h_mm": round(p1, 1),
        "past_48_72h_mm": round(p2, 1),
        "effective_72h_mm": round(effective, 1),
        "next_24h_mm": round(next_24h, 1),
        "cached": False,
    }
    _cache["t"] = now
    _cache["data"] = data
    return data