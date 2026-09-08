from flask import Blueprint, jsonify
import random, math

wind_field_bp = Blueprint("wind_field", __name__)

@wind_field_bp.route("")
@wind_field_bp.route("/")
def get_wind_field():
    # Generate a realistic wind field grid for demo
    points = []
    for lat in range(-60, 61, 5):
        for lon in range(-180, 181, 5):
            u = random.uniform(-15, 15)
            v = random.uniform(-15, 15)
            speed = math.sqrt(u*u + v*v)
            points.append({"lat": lat, "lon": lon, "u": round(u, 2), "v": round(v, 2), "speed": round(speed, 2)})
    return jsonify({"points": points, "count": len(points)})
