"""
openmeteo.service.py — Open-Meteo Weather Data Fetcher
--------------------------------------------------------
Fetches real-time atmospheric data from the Open-Meteo free API (no key required).
Used to provide live feature inputs for the prediction pipeline and to populate
the wind field grid layer.
"""

import logging
import math
from datetime import datetime, timezone
from typing import Optional

import requests

from src.config.db import db
from src.config.settings import settings
from src.models.wind_field_point import WindFieldPoint

log = logging.getLogger(__name__)

VARIABLES = [
    "wind_speed_10m",
    "wind_direction_10m",
    "pressure_msl",
    "temperature_2m",
    "relative_humidity_2m",
]

# Grid spacing in degrees for wind field queries near a storm
WIND_FIELD_GRID_DEG = 1.0
WIND_FIELD_RADIUS   = 5     # degrees around storm centre


def fetch_point(lat: float, lon: float) -> Optional[dict]:
    """
    Fetch current atmospheric conditions for a single lat/lon point.
    Returns a dict with the variables or None on failure.
    """
    params = {
        "latitude":   lat,
        "longitude":  lon,
        "current":    ",".join(VARIABLES),
        "wind_speed_unit": "kn",   # knots — consistent with IBTrACS
        "timezone":   "UTC",
    }
    try:
        resp = requests.get(settings.OPENMETEO_URL, params=params, timeout=10)
        resp.raise_for_status()
        data     = resp.json()
        current  = data.get("current", {})
        return {
            "lat":            lat,
            "lon":            lon,
            "wind_speed_kt":  current.get("wind_speed_10m"),
            "wind_direction": current.get("wind_direction_10m"),
            "pressure_msl":   current.get("pressure_msl"),
            "temperature_2m": current.get("temperature_2m"),
            "humidity_2m":    current.get("relative_humidity_2m"),
            "fetched_at":     datetime.now(timezone.utc).isoformat(),
        }
    except Exception as exc:
        log.warning(f"[OpenMeteo] Failed for ({lat}, {lon}): {exc}")
        return None


def fetch_wind_field_grid(center_lat: float, center_lon: float) -> list[dict]:
    """
    Fetch a grid of wind observations around a storm centre.
    Grid spacing: WIND_FIELD_GRID_DEG degrees, WIND_FIELD_RADIUS radius.
    """
    points = []
    for dlat in _float_range(-WIND_FIELD_RADIUS, WIND_FIELD_RADIUS + WIND_FIELD_GRID_DEG, WIND_FIELD_GRID_DEG):
        for dlon in _float_range(-WIND_FIELD_RADIUS, WIND_FIELD_RADIUS + WIND_FIELD_GRID_DEG, WIND_FIELD_GRID_DEG):
            lat = round(center_lat + dlat, 2)
            lon = round(center_lon + dlon, 2)
            if abs(lat) > 85:
                continue
            obs = fetch_point(lat, lon)
            if obs:
                points.append(obs)

    _persist_wind_field(points)
    return points


def _persist_wind_field(points: list[dict]) -> None:
    """Save wind field points to DB (replace recent batch)."""
    try:
        # Purge stale points older than 30 minutes
        from sqlalchemy import text
        db.session.execute(
            text("DELETE FROM wind_field_points WHERE captured_at < NOW() - INTERVAL '30 minutes'")
        )
        for p in points:
            wfp = WindFieldPoint(
                lat=p["lat"],
                lon=p["lon"],
                wind_speed=p.get("wind_speed_kt"),
                wind_direction=p.get("wind_direction"),
                source="open-meteo",
                captured_at=datetime.now(timezone.utc),
            )
            db.session.add(wfp)
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        log.error(f"[OpenMeteo] Wind field persist error: {exc}")


def _float_range(start: float, stop: float, step: float):
    """Generator equivalent of range() for floats."""
    val = start
    while val < stop:
        yield round(val, 6)
        val += step
