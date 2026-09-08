import os
import logging
from flask_sqlalchemy import SQLAlchemy
from src.config.settings import DATABASE_URL

logger = logging.getLogger(__name__)

db = SQLAlchemy()

def init_db(app=None):
    if not DATABASE_URL:
        logger.warning("DATABASE_URL not set — running in mock mode, no DB persistence")
        return False
    try:
        if app is not None:
            app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
            app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
            db.init_app(app)
            with app.app_context():
                import src.models  # noqa: F401
                db.create_all()
            logger.info("Database connected successfully")
            return True
        return False
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        logger.warning("Running in mock mode — no DB persistence")
        return False

def get_db():
    return db.session
