"""
jtwc.service.py — JTWC Active Storm Parser
--------------------------------------------
Parses the JTWC public bulletin page to supplement NOAA NHC data for
Western Pacific and Indian Ocean basins (which NHC does not cover live).

JTWC provides plain-text advisories; this service scrapes the index page,
extracts active storm IDs, and returns lightweight storm dicts.
"""

import logging
import re
from datetime import datetime, timezone

import requests
from bs4 import BeautifulSoup

from src.config.db import db
from src.config.settings import settings
from src.models.storm import Storm

log = logging.getLogger(__name__)

BASIN_MAP = {
    "W":  "WP",   # Western Pacific
    "A":  "IO",   # North Indian Ocean
    "B":  "IO",   # Bay of Bengal
    "S":  "SH",   # Southern Hemisphere
    "P":  "SP",   # South Pacific
}


def _parse_jtwc_page(html: str) -> list[dict]:
    """
    Extract storm records from the JTWC html bulletin index.
    Returns a list of dicts with keys: id, name, basin, lat, lon, wind_speed, pressure
    """
    soup    = BeautifulSoup(html, "html.parser")
    storms  = []

    # JTWC typically lists active storms in <a> tags pointing to .txt advisories
    # Pattern: e.g. "WP012025.web" → storm WP01 season 2025
    links = soup.find_all("a", href=re.compile(r"[A-Z]{2}\d{2}\d{4}"))
    seen  = set()

    for link in links:
        href = link.get("href", "")
        m    = re.search(r"([A-Z]{2})(\d{2})(\d{4})", href)
        if not m:
            continue
        basin_code, storm_num, season = m.group(1), m.group(2), m.group(3)
        storm_id = f"JTWC-{basin_code}{storm_num}-{season}"

        if storm_id in seen:
            continue
        seen.add(storm_id)

        basin = BASIN_MAP.get(basin_code[1], basin_code)
        storms.append({
            "id":          storm_id,
            "name":        link.get_text(strip=True) or f"Storm {storm_num}",
            "basin":       basin,
            "category":    None,
            "wind_speed":  None,
            "pressure":    None,
            "lat":         None,
            "lon":         None,
            "movement_speed": None,
            "movement_dir":   "",
            "status":      "ACTIVE",
            "last_updated": datetime.now(timezone.utc),
        })

    return storms


def fetch_jtwc_storms() -> list[dict]:
    """Fetch and parse JTWC bulletin page; upsert storms into DB."""
    try:
        resp = requests.get(settings.JTWC_BULLETIN_URL, timeout=20)
        resp.raise_for_status()
    except Exception as exc:
        log.error(f"[JTWC] Failed to fetch bulletin: {exc}")
        return []

    storms = _parse_jtwc_page(resp.text)
    log.info(f"[JTWC] Parsed {len(storms)} storm(s) from bulletin.")

    for storm_data in storms:
        _upsert_storm(storm_data)

    return storms


def _upsert_storm(data: dict) -> None:
    try:
        storm = db.session.get(Storm, data["id"])
        if storm is None:
            storm = Storm(id=data["id"])
            db.session.add(storm)
        for key, val in data.items():
            if key != "id":
                setattr(storm, key, val)
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        log.error(f"[JTWC] DB upsert failed for {data.get('id')}: {exc}")
