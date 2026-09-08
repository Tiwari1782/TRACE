"""
storm_controller.py — Storm REST controller
"""

from flask import jsonify, request

from src.services.noaa_service import fetch_active_storms, get_active_storms_from_db
from src.services.jtwc_service import fetch_jtwc_storms
from src.models.storm import Storm
from src.models.wind_field_point import WindFieldPoint
from src.config.db import db


def get_active_storms():
    storms = get_active_storms_from_db()
    return jsonify({"storms": storms, "count": len(storms)})


def get_storm_by_id(storm_id: str):
    storm = db.session.get(Storm, storm_id)
    if not storm:
        return jsonify({"error": f"Storm {storm_id} not found"}), 404
    return jsonify(storm.to_dict())


def get_basin_storms(basin: str):
    storms = Storm.query.filter_by(basin=basin.upper()).all()
    return jsonify({"storms": [s.to_dict() for s in storms], "basin": basin.upper()})


def refresh_storms():
    noaa_storms = fetch_active_storms()
    jtwc_storms = fetch_jtwc_storms()
    all_storms  = noaa_storms + jtwc_storms
    return jsonify({"refreshed": len(all_storms), "storms": all_storms})


def get_wind_field():
    limit  = min(int(request.args.get("limit", 500)), 2000)
    points = WindFieldPoint.query.order_by(WindFieldPoint.captured_at.desc()).limit(limit).all()
    return jsonify({"points": [p.to_dict() for p in points]})
