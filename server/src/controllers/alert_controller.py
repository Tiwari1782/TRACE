"""
alert_controller.py — Alert REST controller
"""

from flask import jsonify

from src.services.alert_service import get_recent_alerts as _get_recent_alerts
from src.models.track_point import TrackPoint


def get_recent_alerts():
    alerts = _get_recent_alerts(limit=50)
    return jsonify({"alerts": alerts, "count": len(alerts)})


def get_track_history(storm_id: str):
    points = (
        TrackPoint.query
        .filter_by(storm_id=storm_id)
        .order_by(TrackPoint.timestamp.asc())
        .all()
    )
    return jsonify({
        "storm_id":   storm_id,
        "track":      [p.to_dict() for p in points],
        "count":      len(points),
    })
