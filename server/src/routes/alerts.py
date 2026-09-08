from flask import Blueprint, jsonify

alerts_bp = Blueprint("alerts", __name__)

_alerts_cache = []

@alerts_bp.route("/recent")
def get_recent_alerts():
    return jsonify({"alerts": _alerts_cache, "count": len(_alerts_cache)})

def add_alert(alert):
    _alerts_cache.insert(0, alert)
    if len(_alerts_cache) > 50:
        _alerts_cache.pop()
