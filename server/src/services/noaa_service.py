import requests
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

MOCK_STORMS = [
    {
        "id": "AL052024", "name": "HELENE", "basin": "NA",
        "category": 4, "wind_speed": 130.0, "pressure": 937.0,
        "latitude": 26.5, "longitude": -84.2,
        "movement_speed": 14.0, "movement_dir": "NNE",
        "status": "active", "last_updated": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "EP082024", "name": "JOHN", "basin": "EP",
        "category": 2, "wind_speed": 100.0, "pressure": 968.0,
        "latitude": 16.3, "longitude": -107.8,
        "movement_speed": 8.0, "movement_dir": "WNW",
        "status": "active", "last_updated": datetime.now(timezone.utc).isoformat()
    }
]

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

def fetch_active_storms():
    try:
        resp = requests.get(
            "https://www.nhc.noaa.gov/CurrentStorms.json",
            timeout=8,
            headers={"User-Agent": "TRACE/1.0 research@trace.dev"}
        )
        resp.raise_for_status()
        data = resp.json()
        storms = []
        active_storms = data.get("activeStorms", [])
        if not active_storms:
            logger.info("NOAA returned 0 active storms — using mock data")
            return MOCK_STORMS

        for s in active_storms:
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

            mov_speed = 0.0
            if "movementSpeed" in s:
                try:
                    mov_speed = float(s.get("movementSpeed", 0) or 0)
                except Exception:
                    pass
            elif isinstance(s.get("motion"), dict):
                mov_speed = float(s.get("motion", {}).get("speed", 0) or 0)

            mov_dir = "N"
            if "movementDir" in s:
                mov_dir = deg_to_compass(s.get("movementDir"))
            elif isinstance(s.get("motion"), dict):
                mov_dir = s.get("motion", {}).get("direction", "N")

            basin = s.get("basin")
            if not basin:
                sid = s.get("id", "").lower()
                if sid.startswith("al"):
                    basin = "NA"
                elif sid.startswith("ep"):
                    basin = "EP"
                elif sid.startswith("cp"):
                    basin = "CP"
                elif sid.startswith("wp"):
                    basin = "WP"
                elif sid.startswith("io") or sid.startswith("sh"):
                    basin = "NI"
                else:
                    basin = "NA"

            category = wind_to_cat(wind, s.get("classification"))

            storms.append({
                "id": s.get("id", "UNKNOWN").upper(),
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
                "last_updated": datetime.now(timezone.utc).isoformat()
            })

        return storms if storms else MOCK_STORMS
    except Exception as e:
        logger.error(f"NOAA fetch failed: {e} — returning mock data")
        return MOCK_STORMS
