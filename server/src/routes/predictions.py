from flask import Blueprint, jsonify
from src.services.noaa_service import fetch_active_storms
from src.services.prediction_service import predict

predictions_bp = Blueprint("predictions", __name__)

@predictions_bp.route("/<storm_id>")
def get_prediction(storm_id):
    storms = fetch_active_storms()
    storm = next((s for s in storms if s["id"] == storm_id), None)
    if not storm:
        return jsonify({"error": "Storm not found"}), 404
    return jsonify(predict(storm))
