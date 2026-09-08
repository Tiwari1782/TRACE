"""
Storm ORM model — maps to the `storms` table.
"""

from datetime import datetime, timezone
from src.config.db import db


class Storm(db.Model):
    __tablename__ = "storms"

    id              = db.Column(db.Text,          primary_key=True)
    name            = db.Column(db.Text,          nullable=True)
    basin           = db.Column(db.Text,          nullable=True)
    category        = db.Column(db.Integer,       nullable=True)
    wind_speed      = db.Column(db.Numeric(6, 2), nullable=True)
    pressure        = db.Column(db.Numeric(7, 2), nullable=True)
    lat             = db.Column(db.Numeric(8, 4), nullable=True)
    lon             = db.Column(db.Numeric(9, 4), nullable=True)
    movement_speed  = db.Column(db.Numeric(5, 2), nullable=True)
    movement_dir    = db.Column(db.Text,          nullable=True)
    status          = db.Column(db.Text,          nullable=True)
    last_updated    = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    predictions  = db.relationship("Prediction",    back_populates="storm", lazy="dynamic")
    track_points = db.relationship("TrackPoint",    back_populates="storm", lazy="dynamic")
    alerts       = db.relationship("Alert",         back_populates="storm", lazy="dynamic")

    def to_dict(self) -> dict:
        return {
            "id":            self.id,
            "name":          self.name,
            "basin":         self.basin,
            "category":      self.category,
            "wind_speed":    float(self.wind_speed)   if self.wind_speed  is not None else None,
            "pressure":      float(self.pressure)     if self.pressure    is not None else None,
            "lat":           float(self.lat)          if self.lat         is not None else None,
            "lon":           float(self.lon)          if self.lon         is not None else None,
            "movement_speed": float(self.movement_speed) if self.movement_speed is not None else None,
            "movement_dir":  self.movement_dir,
            "status":        self.status,
            "last_updated":  self.last_updated.isoformat() if self.last_updated else None,
        }
