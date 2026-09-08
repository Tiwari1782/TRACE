from flask import Blueprint, jsonify
from src.services.noaa_service import fetch_active_storms
from src.services.prediction_service import predict

storms_bp = Blueprint("storms", __name__)

@storms_bp.route("/active")
def get_active():
    storms = fetch_active_storms()
    return jsonify({"storms": storms, "count": len(storms)})

@storms_bp.route("/<storm_id>")
def get_storm(storm_id):
    storms = fetch_active_storms()
    storm = next((s for s in storms if s["id"] == storm_id), None)
    if not storm:
        return jsonify({"error": "Storm not found"}), 404
    return jsonify(storm)

@storms_bp.route("/<storm_id>/track")
def get_storm_track(storm_id):
    from src.controllers.alert_controller import get_track_history
    return get_track_history(storm_id)

@storms_bp.route("/basin/<basin>")
def get_by_basin(basin):
    storms = fetch_active_storms()
    filtered = [s for s in storms if s["basin"].upper() == basin.upper()]
    return jsonify({"storms": filtered, "count": len(filtered)})

@storms_bp.route("/refresh", methods=["POST"])
def refresh_storms():
    storms = fetch_active_storms()
    return jsonify({"storms": storms, "count": len(storms), "refreshed": True})
