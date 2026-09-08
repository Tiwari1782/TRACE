"""
prediction_controller.py — Prediction REST controller
"""

from flask import jsonify

from src.services import prediction_service


def get_prediction(storm_id: str):
    prediction = prediction_service.predict(storm_id)
    if prediction is None:
        return jsonify({
            "error": "Prediction unavailable",
            "message": "Models not loaded or storm not found. Ensure training is complete.",
        }), 503
    return jsonify(prediction)
