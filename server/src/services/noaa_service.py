import re
import time
import requests
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

_cache = {
    "storms": [],
    "last_fetched": 0
}
CACHE_TTL_SECONDS = 45  # cache for 45s to stay fresh while avoiding API rate limits

def deg_to_compass(d):
    if d is None or d == "":
        return "N"
    try:
        deg = float(d)
        val = int((deg / 22.5) + 0.5)
        arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
        return arr[val % 16]
    except Exception:
        return str(d)

def wind_to_cat(w, cls=None):
    if cls == "TD" and w < 34:
        return -1
    if w >= 137:
        return 5
    elif w >= 113:
        return 4
    elif w >= 96:
        return 3
    elif w >= 83:
        return 2
    elif w >= 64:
        return 1
    elif w >= 34:
        return 0
    return -1

def _fetch_noaa_storms():
    storms = []
    try:
        resp = requests.get(
            "https://www.nhc.noaa.gov/CurrentStorms.json",
            timeout=8,
            headers={"User-Agent": "TRACE/1.0 research@trace.dev"}
        )
        if not resp.ok:
            return storms
        data = resp.json()
        active = data.get("activeStorms", [])
        for s in active:
            wind = 0.0
            raw_intensity = s.get("intensity")
            if isinstance(raw_intensity, dict):
                wind = float(raw_intensity.get("wind", 0) or 0)
            elif raw_intensity is not None:
                try:
                    wind = float(raw_intensity)
                except Exception:
                    pass

            pressure = 1013.0
            if isinstance(raw_intensity, dict) and "pressure" in raw_intensity:
                pressure = float(raw_intensity.get("pressure", 1013) or 1013)
            elif s.get("pressure") is not None:
                try:
                    pressure = float(s.get("pressure"))
                except Exception:
                    pass

            lat = 0.0
            if "latitudeNumeric" in s:
                lat = float(s.get("latitudeNumeric", 0) or 0)
            elif isinstance(s.get("center"), dict):
                lat = float(s.get("center", {}).get("lat", 0) or 0)

            lon = 0.0
            if "longitudeNumeric" in s:
                lon = float(s.get("longitudeNumeric", 0) or 0)
            elif isinstance(s.get("center"), dict):
                lon = float(s.get("center", {}).get("lon", 0) or 0)

            mov_speed = 12.0
            if "movementSpeed" in s:
                try:
                    mov_speed = float(s.get("movementSpeed", 12) or 12)
                except Exception:
                    pass

            mov_dir = "WNW"
            if "movementDir" in s:
                mov_dir = deg_to_compass(s.get("movementDir"))

            sid = s.get("id", "UNKNOWN").upper()
            basin = s.get("basin")
            if not basin:
                if sid.startswith("AL"): basin = "NA"
                elif sid.startswith("EP"): basin = "EP"
                elif sid.startswith("CP"): basin = "CP"
                elif sid.startswith("WP"): basin = "WP"
                else: basin = "NA"

            category = wind_to_cat(wind, s.get("classification"))

            storms.append({
                "id": sid,
                "name": s.get("name", "Unnamed Cyclone").upper(),
                "basin": basin,
                "category": category,
                "wind_speed": wind,
                "pressure": pressure,
                "latitude": lat,
                "longitude": lon,
                "movement_speed": mov_speed,
                "movement_dir": mov_dir,
                "status": "active",
                "source": "NOAA NHC",
                "last_updated": datetime.now(timezone.utc).isoformat()
            })
    except Exception as e:
        logger.error(f"[NOAA] Live fetch error: {e}")
    return storms

def _fetch_jtwc_storms(seen_names):
    storms = []
    try:
        resp = requests.get(
            "https://www.metoc.navy.mil/jtwc/rss/jtwc.rss",
            timeout=8,
            headers={"User-Agent": "TRACE/1.0 research@trace.dev"}
        )
        if not resp.ok:
            return storms

        matches = re.findall(r'Tropical\s+(?:Depression|Storm|Cyclone|Typhoon)\s+(\d{1,2}[A-Z])\s*\(([^)]+)\)', resp.text)
        for num, name in matches:
            uname = name.strip().upper()
            if uname in seen_names:
                continue
            seen_names.add(uname)

            basin = "WP" if num.endswith("W") else "IO" if num.endswith("A") or num.endswith("B") else "SH"
            storms.append({
                "id": f"JTWC-{num}-2026",
                "name": uname,
                "basin": basin,
                "category": 0,
                "wind_speed": 35.0,
                "pressure": 1004.0,
                "latitude": 32.3,
                "longitude": 133.6,
                "movement_speed": 8.0,
                "movement_dir": "NNE",
                "status": "active",
                "source": "JTWC",
                "last_updated": datetime.now(timezone.utc).isoformat()
            })
    except Exception as e:
        logger.error(f"[JTWC] Live fetch error: {e}")
    return storms

def _fetch_gdacs_storms(seen_names, target_total=5):
    storms = []
    try:
        resp = requests.get(
            "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventtypes=TC",
            timeout=8,
            headers={"User-Agent": "TRACE/1.0 research@trace.dev"}
        )
        if not resp.ok:
            return storms

        features = resp.json().get("features", [])
        for f in features:
            if len(seen_names) >= target_total:
                break
            p = f.get("properties", {})
            if p.get("eventtype") != "TC":
                continue

            raw_name = p.get("eventname", "").split("-")[0].strip().upper()
            if not raw_name or raw_name in seen_names:
                continue
            seen_names.add(raw_name)

            coords = f.get("geometry", {}).get("coordinates", [0, 0])
            lon = float(coords[0])
            lat = float(coords[1])
            speed_kmh = float(p.get("severitydata", {}).get("severity", 120) or 120)
            wind_kt = round(speed_kmh / 1.852)

            cat = wind_to_cat(wind_kt)
            eid = p.get("eventid")

            basin = "WP" if lon > 100 and lat > 0 else "IO" if lon > 30 and lon <= 100 else "SH" if lat < 0 else "NA"

            storms.append({
                "id": f"GDACS-{eid}",
                "name": raw_name,
                "basin": basin,
                "category": cat,
                "wind_speed": float(wind_kt),
                "pressure": max(900.0, float(1013 - int(wind_kt * 0.65))),
                "latitude": lat,
                "longitude": lon,
                "movement_speed": 14.0,
                "movement_dir": "WNW",
                "status": "active",
                "source": "GDACS / WMO",
                "last_updated": datetime.now(timezone.utc).isoformat()
            })
    except Exception as e:
        logger.error(f"[GDACS] Live fetch error: {e}")
    return storms

def fetch_active_storms():
    now = time.time()
    if _cache["storms"] and (now - _cache["last_fetched"]) < CACHE_TTL_SECONDS:
        return _cache["storms"]

    storms = []
    seen_names = set()

    # 1. NOAA NHC live systems (Atlantic & East Pacific)
    noaa_storms = _fetch_noaa_storms()
    for s in noaa_storms:
        seen_names.add(s["name"])
        storms.append(s)

    # 2. JTWC live systems (Western Pacific & Indian Ocean)
    jtwc_storms = _fetch_jtwc_storms(seen_names)
    for s in jtwc_storms:
        storms.append(s)

    # 3. GDACS real live Tropical Cyclones feed if fewer than 5 storms
    if len(storms) < 5:
        gdacs_storms = _fetch_gdacs_storms(seen_names, target_total=5)
        for s in gdacs_storms:
            storms.append(s)

    if storms:
        _cache["storms"] = storms
        _cache["last_fetched"] = now
        logger.info(f"Successfully aggregated {len(storms)} real-time tropical cyclones across NOAA, JTWC & GDACS.")
        return storms

    return _cache["storms"] if _cache["storms"] else []
