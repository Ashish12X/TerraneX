import json
import time
from pathlib import Path
from typing import Any
from urllib.parse import urlencode
from urllib.request import urlopen

DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "network.json"

# Rudraprayag district ka approximate centre (single-point telemetry)
LAT, LON = 30.2844, 78.9811
CACHE_SECONDS = 600

_cache = {"t": 0.0, "data": None}
_villages_cache = {"t": 0.0, "data": None}


def _fetch_single():
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
    """Pichhle 24h aur agle 24h ka rainfall (mm), 10 minute cache ke saath (single-point)."""
    now = time.time()
    if _cache["data"] and now - _cache["t"] < CACHE_SECONDS:
        return {**_cache["data"], "cached": True}

    try:
        raw = _fetch_single()
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


def _get_network_villages():
    with open(DATA_FILE, encoding="utf-8") as f:
        net = json.load(f)
    return [n for n in net["nodes"] if n.get("type") == "village"]


def _calc_metrics(raw_item):
    times = raw_item["hourly"]["time"]
    values = [v or 0.0 for v in raw_item["hourly"]["precipitation"]]

    current_hour = raw_item.get("current", {}).get("time", "")[:13] + ":00"
    idx = times.index(current_hour) if current_hour in times else len(times) // 2

    p0 = sum(values[max(0, idx - 23): idx + 1])          # 0-24h
    p1 = sum(values[max(0, idx - 47): max(0, idx - 23)]) # 24-48h
    p2 = sum(values[max(0, idx - 71): max(0, idx - 47)]) # 48-72h
    effective = p0 + 0.5 * p1 + 0.25 * p2
    next_24h = sum(values[idx + 1: idx + 25])
    cur_intensity = raw_item.get("current", {}).get("precipitation", 0.0)

    return {
        "current_mm_per_hr": cur_intensity,
        "past_24h_mm": round(p0, 1),
        "past_24_48h_mm": round(p1, 1),
        "past_48_72h_mm": round(p2, 1),
        "effective_72h_mm": round(effective, 1),
        "next_24h_mm": round(next_24h, 1),
    }


def get_live_villages_rainfall():
    """
    Har village ke lat/lon (network.json) ke liye Open-Meteo multi-location API se rainfall lata hai.
    Ek hi request mein comma-separated lat/lons bheje jaate hain.
    10-minute cache rehta hai.
    Open-Meteo multi-location fail hone par single-point fallback use karta hai.
    """
    now = time.time()
    if _villages_cache["data"] and now - _villages_cache["t"] < CACHE_SECONDS:
        return {**_villages_cache["data"], "cached": True}

    villages = _get_network_villages()
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

    try:
        with urlopen(url, timeout=10) as r:
            raw_list = json.load(r)

        # Multi-location query returns a list matching village index
        if not isinstance(raw_list, list):
            raw_list = [raw_list]

        village_data_list = []
        by_id = {}

        for i, v in enumerate(villages):
            raw_item = raw_list[i] if i < len(raw_list) else raw_list[0]
            metrics = _calc_metrics(raw_item)
            item = {
                "id": v["id"],
                "name": v["name"],
                "lat": v["lat"],
                "lon": v["lon"],
                "elevation_m": raw_item.get("elevation"),
                **metrics,
            }
            village_data_list.append(item)
            by_id[v["id"]] = item

        observed_at = raw_list[0].get("current", {}).get("time", "") if raw_list else ""
        data = {
            "source": "Open-Meteo (Multi-Location)",
            "observed_at": observed_at,
            "cached": False,
            "fallback": False,
            "villages": village_data_list,
            "by_id": by_id,
        }
        _villages_cache["t"] = now
        _villages_cache["data"] = data
        return data

    except Exception as multi_err:
        # Fallback handling
        if _villages_cache["data"]:
            return {**_villages_cache["data"], "cached": True, "stale": True}

        # Agar multi-location fail ho to single-point fallback
        try:
            single = get_live_rainfall()
            village_data_list = []
            by_id = {}
            for v in villages:
                item = {
                    "id": v["id"],
                    "name": v["name"],
                    "lat": v["lat"],
                    "lon": v["lon"],
                    "current_mm_per_hr": single.get("current_mm_per_hr", 0.0),
                    "past_24h_mm": single.get("past_24h_mm", 0.0),
                    "past_24_48h_mm": single.get("past_24_48h_mm", 0.0),
                    "past_48_72h_mm": single.get("past_48_72h_mm", 0.0),
                    "effective_72h_mm": single.get("effective_72h_mm", 0.0),
                    "next_24h_mm": single.get("next_24h_mm", 0.0),
                }
                village_data_list.append(item)
                by_id[v["id"]] = item

            fallback_data = {
                "source": "Open-Meteo (Single-Point Fallback)",
                "observed_at": single.get("observed_at", ""),
                "cached": False,
                "fallback": True,
                "villages": village_data_list,
                "by_id": by_id,
            }
            _villages_cache["t"] = now
            _villages_cache["data"] = fallback_data
            return fallback_data
        except Exception as e:
            raise RuntimeError(f"Live village weather data fetch fail hua: {multi_err} (Fallback error: {e})")


def get_live_edge_rainfalls(basis: str = "past_24h") -> dict[str, float]:
    """
    Road-level rainfall calculate karta hai:
    Har road ki rainfall = uske do end-villages ki baarish ka maximum.
    """
    v_info = get_live_villages_rainfall()
    by_id = v_info.get("by_id", {})

    basis_key = "effective_72h_mm" if basis == "effective_72h" else ("next_24h_mm" if basis == "next_24h" else "past_24h_mm")

    with open(DATA_FILE, encoding="utf-8") as f:
        net = json.load(f)

    # District fallback if no village matches
    default_rf = 0.0
    if by_id:
        default_rf = sum(item.get(basis_key, 0.0) for item in by_id.values()) / len(by_id)

    edge_rainfalls = {}
    for e in net["edges"]:
        u, v = e["from"], e["to"]
        end_rainfalls = [
            by_id[nid][basis_key]
            for nid in (u, v)
            if nid in by_id and basis_key in by_id[nid]
        ]
        if end_rainfalls:
            edge_rainfalls[e["id"]] = round(max(end_rainfalls), 1)
        else:
            edge_rainfalls[e["id"]] = round(default_rf, 1)

    return edge_rainfalls


def get_hourly_forecast_series(hours: int = 24) -> dict[str, Any]:
    """
    Returns hour-by-hour forecast rainfall for Rudraprayag for the next N hours,
    along with antecedent 72h saturation values.
    """
    try:
        raw = _fetch_single()
        times = raw["hourly"]["time"]
        values = [v or 0.0 for v in raw["hourly"]["precipitation"]]
        current_hour = raw["current"]["time"][:13] + ":00"
        idx = times.index(current_hour) if current_hour in times else len(times) // 2

        p1 = sum(values[max(0, idx - 47): max(0, idx - 23)])  # 24-48h
        p2 = sum(values[max(0, idx - 71): max(0, idx - 47)])  # 48-72h
        ante_72h = 0.5 * p1 + 0.25 * p2

        series = []
        for h in range(min(hours, 48)):
            fut_idx = idx + h
            t_label = times[fut_idx] if fut_idx < len(times) else f"T+{h}h"
            val = values[fut_idx] if fut_idx < len(values) else 0.0
            series.append({
                "hour_step": h,
                "time": t_label,
                "rainfall_mm": round(val, 2)
            })

        return {
            "source": "Open-Meteo Hourly Forecast",
            "observed_at": raw["current"]["time"],
            "past_24_48h_mm": round(p1, 1),
            "past_48_72h_mm": round(p2, 1),
            "antecedent_72h_mm": round(ante_72h, 1),
            "series": series
        }
    except Exception as e:
        # Fallback series if network is unreachable
        return {
            "source": "Fallback Offline Projection",
            "observed_at": time.strftime("%Y-%m-%dT%H:00"),
            "past_24_48h_mm": 5.0,
            "past_48_72h_mm": 2.0,
            "antecedent_72h_mm": 3.0,
            "series": [{"hour_step": h, "time": f"T+{h}h", "rainfall_mm": 0.0} for h in range(hours)]
        }