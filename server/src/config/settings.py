import os
from dotenv import load_dotenv
load_dotenv()

DATABASE_URL        = os.getenv("DATABASE_URL", "")
FLASK_SECRET_KEY    = os.getenv("FLASK_SECRET_KEY", "trace-dev-secret")
FLASK_ENV           = os.getenv("FLASK_ENV", "development")
NOAA_STORM_URL      = os.getenv("NOAA_STORM_URL", "https://www.nhc.noaa.gov/CurrentStorms.json")
JTWC_BULLETIN_URL   = os.getenv("JTWC_BULLETIN_URL", "https://www.metoc.navy.mil/jtwc/jtwc.html")
STORM_REFRESH_MIN   = int(os.getenv("STORM_REFRESH_MINUTES", "10"))
OPENMETEO_URL       = os.getenv("OPENMETEO_URL", "https://api.open-meteo.com/v1/forecast")
WIND_REFRESH_MIN    = int(os.getenv("WIND_FIELD_REFRESH_MINUTES", "10"))
raw_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",") if o.strip()]
vercel_domain = os.getenv("VERCEL_DOMAIN", "").strip()
if vercel_domain and vercel_domain not in raw_origins:
    raw_origins.append(vercel_domain)
CORS_ORIGINS        = [o.rstrip("/") for o in raw_origins]
