"""
TrackPoint ORM model — maps to the `track_points` table.
"""

from src.config.db import db


class TrackPoint(db.Model):
    __tablename__ = "track_points"

    id           = db.Column(db.BigInteger,     primary_key=True, autoincrement=True)
    storm_id     = db.Column(db.Text,           db.ForeignKey("storms.id"), nullable=False, index=True)
    timestamp    = db.Column(db.DateTime(timezone=True), nullable=False)
    lat          = db.Column(db.Numeric(8, 4),  nullable=False)
    lon          = db.Column(db.Numeric(9, 4),  nullable=False)
    wind_speed   = db.Column(db.Numeric(6, 2),  nullable=True)
    pressure     = db.Column(db.Numeric(7, 2),  nullable=True)
    category     = db.Column(db.Integer,        nullable=True)
    is_predicted = db.Column(db.Boolean,        default=False)

    storm = db.relationship("Storm", back_populates="track_points")

    def to_dict(self) -> dict:
        return {
            "id":           self.id,
            "storm_id":     self.storm_id,
            "timestamp":    self.timestamp.isoformat() if self.timestamp else None,
            "lat":          float(self.lat)        if self.lat        is not None else None,
            "lon":          float(self.lon)        if self.lon        is not None else None,
            "wind_speed":   float(self.wind_speed) if self.wind_speed is not None else None,
            "pressure":     float(self.pressure)   if self.pressure   is not None else None,
            "category":     self.category,
            "is_predicted": self.is_predicted,
        }
