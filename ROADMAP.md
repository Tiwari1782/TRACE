# TRACE — Tropical Cyclone Recognition, Analysis, Classification Engine
### IIC 3.0 | Aerotech & Aerospace Innovation | Problem #25

---

## Project Vision

> *"An AI-powered, real-time global cyclone tracking and prediction platform — combining an interactive 3D globe, news-broadcast-style 2D maps powered by Mapbox, and an LSTM-based machine learning engine — built to identify, classify, and predict tropical cyclone patterns using multi-source satellite, atmospheric, and oceanic data, anywhere on Earth."*

---

## Research Gap — Why TRACE Exists

Current operational tools — NOAA NHC, Windy, Weather.com — show where a cyclone is.
None of them predict Rapid Intensification (RI) in real-time using machine learning.

> "Every existing tool shows you where a cyclone is. None predict when it will jump
>  two categories in 24 hours. That gap kills people. TRACE uses an LSTM trained on
>  50+ years of multi-source global data to flag RI before it happens — globally,
>  in real-time."

Rapid Intensification is defined as a wind speed increase of >= 35 knots in 24 hours.
Current operational models achieve approximately 50-60% skill at 24-hour RI prediction.
TRACE specifically optimizes for RI recall — because in a life-safety context,
missing a real RI event is far more dangerous than a false alarm.

---

## Confirmed Tech Stack

### Server Side
| Layer | Technology | Version | Why |
|-------|-----------|---------|-----|
| Language | Python | 3.11+ | ML ecosystem, Flask compatibility |
| Framework | Flask | 3.0 | Lightweight, proven in prior projects |
| Real-time | Flask-SocketIO | 5.x | WebSocket bidirectional streaming |
| ORM | SQLAlchemy | 2.x | Clean PostgreSQL abstraction |
| ML — Time Series | TensorFlow / Keras LSTM | 2.x | Intensity prediction over time |
| ML — Classification | Scikit-learn Random Forest | 1.4 | Storm category, RI flag |
| Data Processing | Pandas + NumPy | Latest | Feature engineering, sequences |
| Database | Neon PostgreSQL | 16 | Free, permanent, serverless, never wipes |
| Live Storm Data | NOAA NHC Active Storms | — | Free, global, every 6 hours |
| Live Atmosphere | Open-Meteo API | — | Free, no API key, global |

### Client Side
| Layer | Technology | Version | Why |
|-------|-----------|---------|-----|
| Framework | React.js | 18 | Component-based, state management |
| Globe + Map | Mapbox GL JS | 3.x | Native globe + 2D, WebGL, news-standard |
| Charts | Recharts | 2.x | Intensity over time visualization |
| Real-time | Socket.IO Client | 4.7 | Live storm push from server |
| HTTP | Axios | 1.x | API calls to Flask |
| Styling | Tailwind CSS | 3.x | Fast, consistent dark theme |

### Why Mapbox For Both Globe and Map
```
Mapbox GL JS has native globe projection since v2.9.
One library handles:
  → 3D rotating globe view (globe projection)
  → 2D flat news-style map (mercator projection)
  → Storm track lines (native GeoJSON layer)
  → Prediction cone (native fill layer)
  → Wind radius rings (native circle layer)
  → Animated wind flow layer (particle/streamline overlay)
  → Seamless toggle between globe and flat

Three.js would require rebuilding all storm layers from scratch.
Mapbox does it natively. Less code = fewer bugs = more time for ML.
```

---

## Deployment Stack — Zero Cost

| Service | Purpose | Free Tier | Sleeps? |
|---------|---------|-----------|---------|
| Vercel | Client hosting | Unlimited | Never |
| Render | Server hosting | 750 hrs/month | After 15 min |
| Neon PostgreSQL | Database | 512MB forever | Never |
| UptimeRobot | Keep Render awake | 50 monitors free | — |

### UptimeRobot — Why It's Critical
```
Problem:
  Render free tier sleeps after 15 minutes of inactivity.
  Judge opens your app → 30 second white screen → bad impression.

Fix:
  UptimeRobot pings your Render URL every 10 minutes.
  Server never sleeps. App opens instantly every time.

Setup:
  1. Go to uptimerobot.com → free account
  2. Add monitor → HTTP(S) type
  3. URL → your Render server URL
  4. Interval → 10 minutes
```

### Full Deployment Flow
```
GitHub Repository (source of truth)
        |                    |
   Render (server)      Vercel (client)
        |
  Neon PostgreSQL (permanent data)
        |
  NOAA / JTWC / Open-Meteo / EUMETSAT feeds

UptimeRobot → pings Render every 10min → never sleeps
```

---

## Data Sources

### Primary Training Data

#### 1. IBTrACS — International Best Track Archive
```
What:    50+ years of ALL global cyclones. Every basin. Ground truth labels.
         WMO official dataset — every government meteorological agency
         in the world contributes to it.
Size:    ~150MB (global CSV)
Free:    Yes, completely
Link:    https://www.ncei.noaa.gov/data/international-best-track-archive-for-climate-stewardship-ibtracs/v04r00/access/csv/
File:    ibtracs.ALL.list.v04r00.csv
Columns used:
  → SID (storm ID), NAME, SEASON, BASIN
  → ISO_TIME (every 6 hours)
  → LAT, LON
  → USA_WIND (wind speed knots)
  → USA_PRES (pressure mb)
  → USA_SSHS (Saffir-Simpson category -5 to 5)
```

#### 2. ERA5 Reanalysis — Atmospheric Features
```
What:    Global atmospheric data — wind, pressure, humidity, sea surface temp.
         Provides atmospheric context AROUND the storm.
         IBTrACS gives us the storm. ERA5 gives us why it intensified.
Size:    ~400MB (Indian + Pacific + Atlantic subset, 2000-2023)
Free:    Yes, requires free account
Link:    https://cds.climate.copernicus.eu/datasets/reanalysis-era5-pressure-levels
Steps:
  1. Create free account at cds.climate.copernicus.eu
  2. Install CDS API: pip install cdsapi
  3. Download only the variables + region you need
  4. Do NOT download full global ERA5 — it is petabytes
Variables needed:
  → 10m u/v wind components
  → Mean sea level pressure
  → Sea surface temperature
  → Relative humidity 850hPa
```

#### 3. NOAA HURSAT — Hurricane Satellite Data
```
What:    Infrared satellite imagery specifically for tropical storms, global.
         IBTrACS = numerical data. HURSAT = actual satellite images.
Size:    ~200MB (subset by basin and year range)
Free:    Yes
Link:    https://www.ncdc.noaa.gov/hursat/
Note:    Download by decade — do NOT download all years at once
```

### Live Data APIs (Real-time, No Download Required)

#### 4. NOAA NHC Active Storms Feed
```
What:    All currently active storms globally, updates every 6 hours
Free:    Yes, no API key needed
URL:     https://www.nhc.noaa.gov/CurrentStorms.json
Returns: Active storm names, positions, wind speeds, categories
```

#### 5. Open-Meteo Atmospheric API
```
What:    Live global atmospheric parameters at any lat/lon — used both for
         storm feature input AND for the wind flow visualization layer
Free:    Yes, no API key needed, no rate limit for reasonable use
URL:     https://api.open-meteo.com/v1/forecast
Params:  latitude, longitude, wind_speed_10m, wind_direction_10m,
         pressure_msl, temperature_2m
```

#### 6. NHC GIS Storm Track Data
```
What:    Live storm track + prediction cone in GeoJSON format
Free:    Yes, no key needed
URL:     https://www.nhc.noaa.gov/gis/
Use:     Feed directly into Mapbox as GeoJSON layer
```

### Multi-Source Data Fusion — Satellite, Aerial & Marine Wind Data

Maritime surface data alone under-represents what drives cyclone formation
and intensification (upper-level wind shear, cloud-top structure, convective
banding). The following publicly accessible sources add that signal:

```
7. NOAA/NESDIS GOES-16 / GOES-18 Satellite Imagery
   What:    Real-time infrared + visible cloud imagery over the Americas
            and Pacific — shows storm structure, eye formation, convection
   Free:    Yes, fully public
   Link:    https://www.star.nesdis.noaa.gov/GOES/
   Use:     Visual overlay + eye/structure detection features

8. JTWC — Joint Typhoon Warning Center
   What:    Public warning bulletins for Pacific & Indian Ocean basins.
            Cross-validation for basins IBTrACS/NHC do not cover live.
            No classified or operational military data used.
   Free:    Yes, public bulletins
   Link:    https://www.metoc.navy.mil/jtwc/jtwc.html

9. EUMETSAT ASCAT — Scatterometer Ocean Surface Winds
   What:    Satellite radar-derived wind vectors over open ocean.
            Fills the gap maritime buoy/ship data leaves in open water.
   Free:    Yes, requires free registration
   Link:    https://www.eumetsat.int/
   Use:     Wind field input for the flow visualization layer + RI features

10. Copernicus Sentinel-1 SAR Imagery
    What:    Radar imagery through cloud cover, day or night.
             Useful when optical satellite view is blocked.
    Free:    Yes, ESA Copernicus program
    Link:    https://dataspace.copernicus.eu/
    Use:     Structure confirmation during eyewall replacement cycles

11. NOAA Hurricane Hunter Aircraft Archive (Dropsonde Data)
    What:    Real in-storm readings from reconnaissance aircraft.
             Ground-truth validation for model accuracy, not live feed.
    Free:    Yes, public archive
    Link:    https://www.aoml.noaa.gov/hrd/data_sub/hurr.html
```

On accuracy: No combination of sources allows prediction of every movement
with certainty. Cyclone forecasting is inherently probabilistic. Every prediction
in TRACE ships with a confidence score and — for track — a prediction cone rather
than a single line. The goal of fusing these sources is to tighten that cone and
improve RI-detection recall, not to eliminate uncertainty.

### Total Data Budget
```
IBTrACS global CSV       ~150MB
ERA5 subset              ~400MB
NOAA HURSAT subset       ~200MB
ASCAT wind subset        ~50MB  (region/date limited)
────────────────────────────────
Total                    ~800MB  — trim ASCAT date range first if over
```

---

## Professional Folder Structure

```
trace/
|
├── server/                              # Flask — deployed on Render
|   ├── src/
|   |   ├── routes/
|   |   |   ├── storm.routes.py         # /api/storms/*
|   |   |   ├── prediction.routes.py    # /api/predict/*
|   |   |   ├── history.routes.py       # /api/history/*
|   |   |   └── health.routes.py        # /api/health
|   |   |
|   |   ├── controllers/
|   |   |   ├── storm.controller.py
|   |   |   ├── prediction.controller.py
|   |   |   ├── history.controller.py
|   |   |   └── alert.controller.py
|   |   |
|   |   ├── services/
|   |   |   ├── noaa.service.py
|   |   |   ├── jtwc.service.py
|   |   |   ├── goes.service.py
|   |   |   ├── ascat.service.py
|   |   |   ├── openmeteo.service.py
|   |   |   ├── prediction.service.py
|   |   |   └── alert.service.py
|   |   |
|   |   ├── models/
|   |   |   ├── storm.model.py
|   |   |   ├── prediction.model.py
|   |   |   ├── track.model.py
|   |   |   └── alert.model.py
|   |   |
|   |   ├── sockets/
|   |   |   └── storm.socket.py
|   |   |
|   |   ├── middleware/
|   |   |   ├── error_handler.py
|   |   |   └── cors.py
|   |   |
|   |   └── config/
|   |       ├── db.py
|   |       └── settings.py
|   |
|   ├── app.py
|   └── requirements.txt
|
|
├── client/                              # React — deployed on Vercel
|   ├── public/
|   |   └── favicon.ico
|   |
|   └── src/
|       ├── assets/
|       |   ├── textures/
|       |   └── icons/
|       |
|       ├── components/
|       |   ├── ui/
|       |   |   ├── Button.jsx
|       |   |   ├── Badge.jsx
|       |   |   ├── Card.jsx
|       |   |   ├── Spinner.jsx
|       |   |   └── AlertBanner.jsx
|       |   |
|       |   ├── layout/
|       |   |   ├── Navbar.jsx
|       |   |   ├── Sidebar.jsx
|       |   |   └── Layout.jsx
|       |   |
|       |   ├── map/
|       |   |   ├── GlobeView.jsx
|       |   |   ├── MapView.jsx
|       |   |   ├── ViewToggle.jsx
|       |   |   ├── StormMarker.jsx
|       |   |   ├── StormTrack.jsx
|       |   |   ├── PredictionCone.jsx
|       |   |   ├── WindRadiusRings.jsx
|       |   |   └── WindFlowLayer.jsx
|       |   |
|       |   └── storm/
|       |       ├── StormDetailPanel.jsx
|       |       ├── PredictionCard.jsx
|       |       ├── IntensityChart.jsx
|       |       ├── StormListItem.jsx
|       |       └── RapidIntensifyAlert.jsx
|       |
|       ├── hooks/
|       |   ├── useSocket.js
|       |   ├── useStorms.js
|       |   ├── useWindField.js
|       |   └── usePrediction.js
|       |
|       ├── services/
|       |   └── api.js
|       |
|       ├── store/
|       |   └── stormStore.js
|       |
|       ├── utils/
|       |   ├── stormColors.js
|       |   ├── formatters.js
|       |   └── mapHelpers.js
|       |
|       ├── App.jsx
|       └── main.jsx
|
|
├── ml/                                  # ML pipeline — run locally only
|   ├── data/
|   |   ├── download_ibtracs.py
|   |   ├── download_era5.py
|   |   ├── download_hursat.py
|   |   └── download_ascat.py
|   |
|   ├── preprocessing/
|   |   ├── clean_ibtracs.py
|   |   ├── engineer_features.py
|   |   └── build_sequences.py
|   |
|   ├── training/
|   |   ├── train_lstm.py
|   |   ├── train_rf.py
|   |   └── evaluate.py
|   |
|   ├── saved_models/                    # Output — NOT committed to Git
|   |   ├── trace_lstm.keras
|   |   ├── trace_rf.pkl
|   |   └── scaler.pkl
|   |
|   └── notebooks/
|       └── data_exploration.ipynb
|
|
├── .env.example
├── .gitignore
├── README.md
└── ROADMAP.md
```

---

## Database Schema (Neon PostgreSQL)

```sql
-- Active and historical storms
CREATE TABLE storms (
    id              TEXT PRIMARY KEY,
    name            TEXT,
    basin           TEXT,               -- NA, EP, WP, NI, SI, SP, SA
    category        INTEGER,            -- -5 to 5 (SSHS scale)
    wind_speed      NUMERIC(6,2),       -- knots
    pressure        NUMERIC(7,2),       -- mb
    latitude        NUMERIC(8,4),
    longitude       NUMERIC(9,4),
    movement_speed  NUMERIC(5,2),
    movement_dir    TEXT,
    status          TEXT,               -- active / archived
    last_updated    TIMESTAMPTZ DEFAULT NOW()
);

-- ML predictions log
CREATE TABLE predictions (
    id              BIGSERIAL PRIMARY KEY,
    storm_id        TEXT REFERENCES storms(id),
    predicted_at    TIMESTAMPTZ DEFAULT NOW(),
    wind_6hr        NUMERIC(6,2),
    wind_12hr       NUMERIC(6,2),
    wind_24hr       NUMERIC(6,2),
    category_6hr    INTEGER,
    category_12hr   INTEGER,
    category_24hr   INTEGER,
    rapid_intensify BOOLEAN DEFAULT FALSE,
    ri_probability  NUMERIC(5,4),
    confidence      NUMERIC(5,4)
);

-- Storm track points
CREATE TABLE track_points (
    id              BIGSERIAL PRIMARY KEY,
    storm_id        TEXT REFERENCES storms(id),
    timestamp       TIMESTAMPTZ,
    latitude        NUMERIC(8,4),
    longitude       NUMERIC(9,4),
    wind_speed      NUMERIC(6,2),
    pressure        NUMERIC(7,2),
    category        INTEGER,
    is_predicted    BOOLEAN DEFAULT FALSE  -- true = ML predicted point
);

-- Alerts log
CREATE TABLE alerts (
    id              BIGSERIAL PRIMARY KEY,
    storm_id        TEXT REFERENCES storms(id),
    alert_type      TEXT,               -- RAPID_INTENSIFY / CAT5 / LANDFALL
    severity        TEXT,               -- WARNING / WATCH / ADVISORY
    message         TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Wind vector grid (for the animated flow layer, refreshed periodically)
CREATE TABLE wind_field_points (
    id              BIGSERIAL PRIMARY KEY,
    latitude        NUMERIC(8,4),
    longitude       NUMERIC(9,4),
    wind_speed      NUMERIC(6,2),       -- m/s at 10m
    wind_direction  NUMERIC(5,1),       -- degrees
    source          TEXT,               -- OPEN_METEO / ASCAT
    captured_at     TIMESTAMPTZ DEFAULT NOW()
);
```

---

## ML Pipeline

### LSTM Model — Intensity Prediction
```
Input:
  → 24 timesteps (6 days of 6-hourly readings)
  → 8 features per timestep:
     wind_speed, pressure, lat, lon,
     sea_surface_temp, humidity_850hPa,
     wind_change_24hr, pressure_change_24hr

Architecture:
  Input Layer       → (24, 8)
  LSTM Layer 1      → 128 units, return_sequences=True
  Dropout           → 0.2
  LSTM Layer 2      → 64 units
  Dropout           → 0.2
  Dense             → 32 units, ReLU
  Output            → 4 units (6hr / 12hr / 18hr / 24hr wind speed)

Training:
  Optimizer: Adam
  Loss: MSE
  Epochs: 100 with early stopping
  Batch size: 32
  Estimated CPU time: 45-60 minutes

Target metrics:
  MAE  < 8 knots
  RMSE < 12 knots
```

### Random Forest — Classification
```
Input features:
  → Current wind, pressure, lat, lon
  → Sea surface temperature
  → Basin (encoded)
  → Season (encoded)
  → 24hr wind change rate

Output:
  → Storm category (0-5)
  → Rapid Intensification flag (True/False)
  → RI probability score

Config:
  n_estimators: 100
  max_depth: 12
  random_state: 42

Target metrics:
  Category accuracy  > 80%
  RI recall          > 75%
```

### Rapid Intensification Definition
```
Rapid Intensification = wind speed increases >= 35 knots in 24 hours

This is the #1 gap in cyclone forecasting. Almost no operational model
predicts it reliably. TRACE specifically optimizes recall over precision
for RI events — the model is tunable for different risk thresholds.

Class imbalance handling:
  RI events represent only ~10% of all 6-hourly observations.
  Handled via weighted loss function + oversampling of RI events.
```

---

## Server API Reference

### REST Endpoints

| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/api/storms/active` | All currently active storms globally |
| GET | `/api/storms/:id` | Full detail for one storm |
| GET | `/api/storms/basin/:basin` | Storms filtered by basin |
| GET | `/api/predict/:stormId` | ML prediction for specific storm |
| GET | `/api/history/:stormId/track` | Full track history for storm |
| GET | `/api/alerts/recent` | Last 50 alerts generated |
| GET | `/api/wind-field` | Current wind vector grid for flow layer |
| GET | `/api/health` | Server health check |
| POST | `/api/storms/refresh` | Force refresh NOAA/JTWC data |

### Socket.IO Events

Server → Client (pushed every 10 minutes)
```
storm_update       → { storm_id, wind_speed, pressure, lat, lon, category }
prediction_update  → { storm_id, wind_6hr, wind_12hr, wind_24hr, ri_flag }
alert_update       → { storm_id, type, severity, message }
wind_field_update  → { points: [{ lat, lon, speed, direction }, ...] }
```

Client → Server
```
subscribe_storm    → { storm_id }
unsubscribe_storm  → { storm_id }
```

---

## UI Design Language

| Element | Value |
|---------|-------|
| Background | `#0a0a0f` deep space black |
| Primary accent | `#00d4ff` cyan |
| Danger / CAT 5 | `#ff2244` deep red |
| Warning / CAT 3-4 | `#ffaa00` amber |
| Safe / CAT 1-2 | `#00c896` emerald |
| Tropical Storm | `#aaaaff` light blue |
| Wind flow particles | `#66e0ff` faint cyan trail |
| Panels | Glassmorphism `rgba(255,255,255,0.05)` + blur |
| Font | Inter for UI, Fira Code for data values |
| Storm markers | Pulsing ring animation, size = wind speed |
| CAT 5 storms | Red glow + faster pulse |

### Storm Category Color Map
```
CAT 5  →  #ff2244  Deep Red     + glow
CAT 4  →  #ff6600  Orange Red   + pulse
CAT 3  →  #ffaa00  Amber        + pulse
CAT 2  →  #ffdd00  Yellow
CAT 1  →  #00c896  Emerald
TS     →  #aaaaff  Light Blue
TD     →  #888888  Grey
```

### Wind Flow Layer
```
What:      Animated streamline/particle overlay showing live near-surface
           wind movement over sea and land, sourced from Open-Meteo
           (grid pull) + EUMETSAT ASCAT (open-ocean scatterometer winds)
Purpose:   Visually explains WHY a storm is forming/intensifying —
           convergence zones, onshore flow, wind shear — not just
           showing storms that already exist
Toggle:    Off by default, switched on via ViewToggle.jsx
Scope:     Regional (around active storms), not full-globe
Render:    Mapbox custom WebGL layer or animated canvas overlay
```

---

## Environment Variables

```env
# Neon PostgreSQL
DATABASE_URL=postgresql://user:password@ep-xxxx.neon.tech/trace

# Mapbox
VITE_MAPBOX_TOKEN=pk.eyxxxxxxxxxxxx

# Flask
FLASK_SECRET_KEY=your-secret-key
FLASK_ENV=development

# Storm Data
NOAA_STORM_URL=https://www.nhc.noaa.gov/CurrentStorms.json
JTWC_BULLETIN_URL=https://www.metoc.navy.mil/jtwc/jtwc.html
STORM_REFRESH_MINUTES=10

# Wind / Satellite Data
OPENMETEO_URL=https://api.open-meteo.com/v1/forecast
EUMETSAT_ASCAT_KEY=your-eumetsat-key
WIND_FIELD_REFRESH_MINUTES=10
```

---

## Git Safety Rules

```gitignore
# Never commit these:
ml/data/
ml/saved_models/
server/.env
client/.env
__pycache__/
*.pyc
node_modules/
venv/
*.nc
*.npy
*.keras
*.pkl
```

### Model Weights (Too Large For Git)
```
Option A — GitHub Releases:
  Upload trace_lstm.keras to GitHub Releases (supports up to 2GB)
  Server downloads on first startup via script

Option B — Google Drive:
  Upload model to Drive → get shareable link
  Add download_model.py that fetches it on Render startup
```

---

## Branch Structure

```
main                      — Team Leader
feature/ml-lstm           — Member 1
feature/ml-classification — Member 2
feature/data-pipeline     — Member 3
```

### Branch Responsibilities

main — Team Leader
Integration, deployment (Render + Vercel + Neon), database schema, Flask
app init, Socket.IO setup, all REST routes + controllers, CORS/middleware,
UptimeRobot config, final merges, README, demo script.

feature/ml-lstm — Member 1
LSTM architecture, build_sequences.py, train_lstm.py, early stopping,
model export (trace_lstm.keras), scaler export, evaluation (MAE/RMSE).

feature/ml-classification — Member 2
Random Forest classifier, RI flag logic, RI probability score, category
prediction, class imbalance handling, evaluation (accuracy, recall),
model export (trace_rf.pkl).

feature/data-pipeline — Member 3
IBTrACS + ERA5 + HURSAT + ASCAT download scripts, data cleaning,
engineer_features.py, all React frontend components, Mapbox globe + 2D
map, Tailwind UI, Recharts intensity chart, Socket.IO client hooks.

---

## Quick Start

```bash
# Clone
git clone https://github.com/yourusername/trace.git
cd trace

# Server setup
cd server
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # Mac/Linux
pip install -r requirements.txt
cp ../.env.example .env
# Edit .env — add DATABASE_URL and VITE_MAPBOX_TOKEN

# ML pipeline (run once locally)
cd ../ml
python data/download_ibtracs.py
python preprocessing/clean_ibtracs.py
python preprocessing/engineer_features.py
python preprocessing/build_sequences.py
python training/train_lstm.py        # ~45-60 mins
python training/train_rf.py          # ~5 mins

# Start server
cd ../server
python app.py
# http://localhost:5000

# Client setup
cd ../client
npm install
npm run dev
# http://localhost:3000
```

---

## Judge Demo Script — 5 Minutes

| Time | Action | Judge Sees |
|------|--------|-----------|
| 0:00-0:30 | Open app | Dark globe, active storm markers pulsing |
| 0:30-1:30 | Pan to active storm | Glowing marker, category badge, wind speed |
| 1:30-2:30 | Click storm | Detail panel — live stats + 6/12/24hr ML prediction |
| 2:30-3:00 | Toggle to 2D map | News-style flat map with track + prediction cone |
| 3:00-3:30 | Toggle wind flow layer | Animated streamlines explain why the storm is intensifying |
| 3:30-4:30 | Point out data fusion | GOES satellite, ASCAT scatterometer, JTWC/NHC bulletins feeding the model |
| 4:30-5:00 | Close on RI detection | Rapid-intensification probability score as the research contribution |

---

*IIC 3.0 — International Innovation Challenge*
*Manipal University Jaipur | Aerotech & Aerospace Innovation | Problem #25*