import eventlet
eventlet.monkey_patch()

from flask import Flask, jsonify
from flask_socketio import SocketIO
from flask_cors import CORS
from src.config.settings import FLASK_SECRET_KEY, FLASK_ENV, CORS_ORIGINS
from src.config.db import init_db
from src.routes.storms import storms_bp
from src.routes.predictions import predictions_bp
from src.routes.alerts import alerts_bp, add_alert
from src.routes.wind_field import wind_field_bp
import logging
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = FLASK_SECRET_KEY

# CORS — must be configured before SocketIO init
CORS(app,
     origins=CORS_ORIGINS,
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "OPTIONS"])

socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode="eventlet",
    logger=False,
    engineio_logger=False,
    ping_timeout=60,
    ping_interval=25
)

# Register blueprints
app.register_blueprint(storms_bp,      url_prefix="/api/storms")
app.register_blueprint(predictions_bp, url_prefix="/api/predict")
app.register_blueprint(alerts_bp,      url_prefix="/api/alerts")
app.register_blueprint(wind_field_bp,  url_prefix="/api/wind-field")

@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "service": "TRACE", "version": "1.0"})

# Background push every 10 min
def push_storm_updates():
    from src.services.noaa_service import fetch_active_storms
    from src.services.prediction_service import predict
    while True:
        try:
            storms = fetch_active_storms()
            for s in storms:
                socketio.emit("storm_update", s)
                pred = predict(s)
                socketio.emit("prediction_update", pred)
                if pred.get("rapid_intensify"):
                    alert = {
                        "storm_id": s["id"],
                        "type": "RAPID_INTENSIFY",
                        "severity": "WARNING",
                        "message": f"Rapid intensification forecast for {s['name']}"
                    }
                    add_alert(alert)
                    socketio.emit("alert_update", alert)
        except Exception as e:
            logger.error(f"Push error: {e}")
        time.sleep(600)

@socketio.on("connect")
def on_connect():
    logger.info("Client connected")
    # Immediately send current storms on connect
    from src.services.noaa_service import fetch_active_storms
    storms = fetch_active_storms()
    for s in storms:
        socketio.emit("storm_update", s)

@socketio.on("disconnect")
def on_disconnect():
    logger.info("Client disconnected")

@socketio.on("subscribe_storm")
def on_subscribe(data):
    from src.services.noaa_service import fetch_active_storms
    from src.services.prediction_service import predict
    storm_id = data.get("storm_id")
    storms = fetch_active_storms()
    storm = next((s for s in storms if s["id"] == storm_id), None)
    if storm:
        socketio.emit("prediction_update", predict(storm))

if __name__ == "__main__":
    init_db()
    eventlet.spawn(push_storm_updates)
    socketio.run(app, host="0.0.0.0", port=5000, debug=(FLASK_ENV == "development"))
