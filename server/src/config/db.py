import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from src.config.settings import DATABASE_URL
import logging

logger = logging.getLogger(__name__)

class Base(DeclarativeBase):
    pass

engine = None
SessionLocal = None

def init_db():
    global engine, SessionLocal
    if not DATABASE_URL:
        logger.warning("DATABASE_URL not set — running in mock mode, no DB persistence")
        return False
    try:
        engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_size=5)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        SessionLocal = sessionmaker(bind=engine)
        Base.metadata.create_all(engine)
        logger.info("Database connected successfully")
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        logger.warning("Running in mock mode — no DB persistence")
        return False

def get_db():
    if SessionLocal is None:
        return None
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
