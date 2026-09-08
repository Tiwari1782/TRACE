"""
alert.service.py — TRACE Alert Generation Service
---------------------------------------------------
Checks ML predictions and emits SocketIO alerts for:
  - RAPID_INTENSIFY: when rapid_intensify flag is True
  - CAT5:            when predicted category_24hr == 5
Inserts alerts into the `alerts` table and broadcasts via SocketIO.
"""

import logging
from datetime import datetime, timezone

from src.config.db import db
from src.models.alert import Alert

log = logging.getLogger(__name__)


def check_and_emit_alerts(prediction: dict, socketio) -> list[dict]:
    """
    Given a prediction dict, generate and persist relevant alerts,
    then emit them via SocketIO.

    Returns a list of alert dicts that were created.
    """
    if not prediction:
        return []

    storm_id   = prediction.get("storm_id")
    created    = []

    # ── Rapid Intensification alert ───────────────────────────────────────────
    if prediction.get("rapid_intensify"):
        ri_prob = prediction.get("ri_probability", 0) or 0
        alert   = _create_alert(
            storm_id=storm_id,
            alert_type="RAPID_INTENSIFY",
            severity="CRITICAL",
            message=(
                f"Rapid Intensification detected for storm {storm_id}. "
                f"RI probability: {ri_prob*100:.0f}%. "
                f"Wind speed may increase ≥35 kt within 24 hours."
            ),
        )
        if alert:
            created.append(alert.to_dict())

    # ── CAT 5 alert ───────────────────────────────────────────────────────────
    if prediction.get("category_24hr") == 5:
        alert = _create_alert(
            storm_id=storm_id,
            alert_type="CAT5",
            severity="CRITICAL",
            message=(
                f"Storm {storm_id} is forecast to reach Category 5 intensity "
                "within 24 hours. Winds > 137 knots anticipated."
            ),
        )
        if alert:
            created.append(alert.to_dict())

    # ── Emit via SocketIO ─────────────────────────────────────────────────────
    for alert_dict in created:
        try:
            socketio.emit("alert_update", alert_dict, namespace="/storms")
            log.info(f"[Alert] Emitted {alert_dict['alert_type']} for storm {storm_id}")
        except Exception as exc:
            log.error(f"[Alert] SocketIO emit failed: {exc}")

    return created


def _create_alert(storm_id: str, alert_type: str, severity: str, message: str) -> Alert | None:
    """Persist an alert to the database and return the Alert object."""
    try:
        alert = Alert(
            storm_id=storm_id,
            alert_type=alert_type,
            severity=severity,
            message=message,
            created_at=datetime.now(timezone.utc),
        )
        db.session.add(alert)
        db.session.commit()
        log.info(f"[Alert] Persisted {alert_type} for storm {storm_id}")
        return alert
    except Exception as exc:
        db.session.rollback()
        log.error(f"[Alert] DB insert failed: {exc}")
        return None


def get_recent_alerts(limit: int = 50) -> list[dict]:
    """Fetch the most recent alerts for the /api/alerts/recent endpoint."""
    try:
        alerts = (
            Alert.query
            .order_by(Alert.created_at.desc())
            .limit(limit)
            .all()
        )
        return [a.to_dict() for a in alerts]
    except Exception as exc:
        log.error(f"[Alert] Query failed: {exc}")
        return []
