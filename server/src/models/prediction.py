"""
Prediction ORM model — maps to the `predictions` table.
"""

from datetime import datetime, timezone
from src.config.db import db


class Prediction(db.Model):
    __tablename__ = "predictions"

    id             = db.Column(db.BigInteger,     primary_key=True, autoincrement=True)
    storm_id       = db.Column(db.Text,           db.ForeignKey("storms.id"), nullable=False, index=True)
    predicted_at   = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    wind_6hr       = db.Column(db.Numeric(6, 2),  nullable=True)
    wind_12hr      = db.Column(db.Numeric(6, 2),  nullable=True)
    wind_24hr      = db.Column(db.Numeric(6, 2),  nullable=True)
    category_6hr   = db.Column(db.Integer,        nullable=True)
    category_12hr  = db.Column(db.Integer,        nullable=True)
    category_24hr  = db.Column(db.Integer,        nullable=True)
    rapid_intensify = db.Column(db.Boolean,       default=False)
    ri_probability  = db.Column(db.Numeric(5, 4), nullable=True)
    confidence      = db.Column(db.Numeric(5, 4), nullable=True)

    storm = db.relationship("Storm", back_populates="predictions")

    def to_dict(self) -> dict:
        return {
            "id":             self.id,
            "storm_id":       self.storm_id,
            "predicted_at":   self.predicted_at.isoformat() if self.predicted_at else None,
            "wind_6hr":       float(self.wind_6hr)      if self.wind_6hr      is not None else None,
            "wind_12hr":      float(self.wind_12hr)     if self.wind_12hr     is not None else None,
            "wind_24hr":      float(self.wind_24hr)     if self.wind_24hr     is not None else None,
            "category_6hr":   self.category_6hr,
            "category_12hr":  self.category_12hr,
            "category_24hr":  self.category_24hr,
            "rapid_intensify": self.rapid_intensify,
            "ri_probability":  float(self.ri_probability) if self.ri_probability is not None else None,
            "confidence":      float(self.confidence)     if self.confidence     is not None else None,
        }
