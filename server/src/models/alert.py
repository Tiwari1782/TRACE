"""
Alert ORM model — maps to the `alerts` table.
"""

from datetime import datetime, timezone
from src.config.db import db


class Alert(db.Model):
    __tablename__ = "alerts"

    id         = db.Column(db.BigInteger,     primary_key=True, autoincrement=True)
    storm_id   = db.Column(db.Text,           db.ForeignKey("storms.id"), nullable=False, index=True)
    alert_type = db.Column(db.Text,           nullable=False)  # e.g. RAPID_INTENSIFY, CAT5
    severity   = db.Column(db.Text,           nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    message    = db.Column(db.Text,           nullable=True)
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    storm = db.relationship("Storm", back_populates="alerts")

    def to_dict(self) -> dict:
        return {
            "id":         self.id,
            "storm_id":   self.storm_id,
            "alert_type": self.alert_type,
            "severity":   self.severity,
            "message":    self.message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
