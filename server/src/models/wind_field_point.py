"""
WindFieldPoint ORM model — maps to the `wind_field_points` table.
"""

from datetime import datetime, timezone
from src.config.db import db


class WindFieldPoint(db.Model):
    __tablename__ = "wind_field_points"

    id             = db.Column(db.BigInteger,     primary_key=True, autoincrement=True)
    lat            = db.Column(db.Numeric(8, 4),  nullable=False)
    lon            = db.Column(db.Numeric(9, 4),  nullable=False)
    wind_speed     = db.Column(db.Numeric(6, 2),  nullable=True)
    wind_direction = db.Column(db.Numeric(5, 1),  nullable=True)
    source         = db.Column(db.Text,           nullable=True)   # e.g. "open-meteo"
    captured_at    = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self) -> dict:
        return {
            "id":             self.id,
            "lat":            float(self.lat)            if self.lat            is not None else None,
            "lon":            float(self.lon)            if self.lon            is not None else None,
            "wind_speed":     float(self.wind_speed)     if self.wind_speed     is not None else None,
            "wind_direction": float(self.wind_direction) if self.wind_direction is not None else None,
            "source":         self.source,
            "captured_at":    self.captured_at.isoformat() if self.captured_at else None,
        }
