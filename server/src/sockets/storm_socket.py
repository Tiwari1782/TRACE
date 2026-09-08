"""
storm.socket.py — TRACE SocketIO Namespace for /storms
"""

import logging
import threading
import time

from flask_socketio import Namespace, emit, join_room, leave_room

from src.config.settings import settings

log = logging.getLogger(__name__)


class StormNamespace(Namespace):
    """
    SocketIO namespace /storms.

    Server → Client events:
      storm_update       : list of active storm dicts
      prediction_update  : prediction dict for a storm
      alert_update       : alert dict
      wind_field_update  : list of wind field points

    Client → Server events:
      subscribe_storm    : { storm_id }
      unsubscribe_storm  : { storm_id }
    """

    _background_task_started = False

    def on_connect(self, auth=None):
        log.info(f"[Socket] Client connected to /storms")
        # Immediately push current storm list on connect
        try:
            from src.services.noaa_service import fetch_active_storms
            storms = fetch_active_storms()
            emit("storm_update", storms)
        except Exception as exc:
            log.warning(f"[Socket] Could not push storms on connect: {exc}")

        # Start background refresh task once
        if not StormNamespace._background_task_started:
            StormNamespace._background_task_started = True
            self.start_background_task(self._refresh_loop)

    def on_disconnect(self):
        log.info("[Socket] Client disconnected from /storms")

    def on_subscribe_storm(self, data: dict):
        storm_id = data.get("storm_id")
        if storm_id:
            join_room(storm_id)
            log.info(f"[Socket] Client subscribed to storm {storm_id}")

    def on_unsubscribe_storm(self, data: dict):
        storm_id = data.get("storm_id")
        if storm_id:
            leave_room(storm_id)
            log.info(f"[Socket] Client unsubscribed from storm {storm_id}")

    def _refresh_loop(self):
        """Background greenlet: push updates every STORM_REFRESH_MINUTES."""
        storm_interval  = settings.STORM_REFRESH_MINUTES  * 60
        wind_interval   = settings.WIND_FIELD_REFRESH_MINUTES * 60
        last_wind_push  = 0

        while True:
            time.sleep(storm_interval)
            self._push_storm_updates()
            if time.time() - last_wind_push >= wind_interval:
                self._push_wind_field()
                last_wind_push = time.time()

    def _push_storm_updates(self):
        try:
            from src.services.noaa_service import fetch_active_storms
            from src.services import prediction_service, alert_service
            from app import socketio

            storms = fetch_active_storms()
            socketio.emit("storm_update", storms, namespace="/storms")

            for storm in storms:
                pred = prediction_service.predict(storm["id"])
                if pred:
                    socketio.emit("prediction_update", pred, namespace="/storms", room=storm["id"])
                    alert_service.check_and_emit_alerts(pred, socketio)

            log.info(f"[Socket] Pushed updates for {len(storms)} storm(s).")
        except Exception as exc:
            log.error(f"[Socket] Storm push error: {exc}")

    def _push_wind_field(self):
        try:
            from src.services.openmeteo_service import fetch_wind_field_grid
            from src.models.storm import Storm
            from src.config.db import db
            from app import socketio

            with db.engine.connect():
                storm = Storm.query.first()
                if storm and storm.lat and storm.lon:
                    points = fetch_wind_field_grid(float(storm.lat), float(storm.lon))
                    socketio.emit("wind_field_update", points, namespace="/storms")
        except Exception as exc:
            log.error(f"[Socket] Wind field push error: {exc}")
