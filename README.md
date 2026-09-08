<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=00D4FF&height=280&section=header&text=TRACE&fontSize=90&fontColor=ffffff&animation=fadeIn&fontAlignY=40&desc=Tropical%20Cyclone%20Recognition%2C%20Analysis%20%26%20Classification%20Engine&descAlignY=62&descColor=CADCFC&descSize=18&stroke=0077B6&strokeWidth=2" width="100%"/>

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=18&duration=3000&pause=800&color=00D4FF&center=true&vCenter=true&multiline=false&width=700&lines=Real-Time+Global+Cyclone+Tracking+%26+Prediction;LSTM+%2B+Random+Forest+ML+%7C+Mapbox+Globe+%2B+2D+Map;Multi-Source+Satellite+%2B+Atmospheric+Data+Fusion;IIC+3.0+%E2%9C%88+Aerotech+%26+Aerospace+Innovation" alt="TRACE typing animation"/>

<br/>

[![IIC 3.0](https://img.shields.io/badge/🏆%20IIC%203.0-Problem%20%2325-0D1B3E?style=for-the-badge&labelColor=0D1B3E&color=005B9E)](/)
[![Track](https://img.shields.io/badge/🌪%20Track-Aerotech%20%26%20Aerospace%20Innovation-005B9E?style=for-the-badge&labelColor=005B9E&color=00D4FF)](/)
[![Status](https://img.shields.io/badge/⚡%20Status-In%20Development-F07D00?style=for-the-badge&labelColor=F07D00&color=E06500)](/)
[![License](https://img.shields.io/badge/📄%20License-MIT-007A3D?style=for-the-badge&labelColor=007A3D&color=005C2E)](LICENSE)

<br/>

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=flat-square&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Mapbox](https://img.shields.io/badge/Mapbox%20GL%20JS-3.x-000000?style=flat-square&logo=mapbox&logoColor=white)](https://www.mapbox.com/)
[![TensorFlow](https://img.shields.io/badge/TensorFlow%2FKeras-2.x-FF6F00?style=flat-square&logo=tensorflow&logoColor=white)](https://www.tensorflow.org/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.4-F7931E?style=flat-square&logo=scikit-learn&logoColor=white)](https://scikit-learn.org)
[![PostgreSQL](https://img.shields.io/badge/Neon%20PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://neon.tech)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io)
[![NOAA](https://img.shields.io/badge/Dataset-NOAA%20IBTrACS-0B3D91?style=flat-square&logo=noaa&logoColor=white)](https://www.ncei.noaa.gov/)

<br/>

<table>
<tr>
<td align="center" width="25%">
<img src="https://img.shields.io/badge/Global-Every%20Basin%20Covered-00D4FF?style=for-the-badge" /><br/>
<sub>NA · EP · WP · NI · SI · SP · SA</sub>
</td>
<td align="center" width="25%">
<img src="https://img.shields.io/badge/6%2F12%2F18%2F24hr-Intensity%20Forecast-007A3D?style=for-the-badge" /><br/>
<sub>LSTM wind-speed prediction horizon</sub>
</td>
<td align="center" width="25%">
<img src="https://img.shields.io/badge/RI%20Detection-Rapid%20Intensification-F07D00?style=for-the-badge" /><br/>
<sub>≥35kt wind gain in 24hrs — the research gap</sub>
</td>
<td align="center" width="25%">
<img src="https://img.shields.io/badge/11-Live%20%26%20Historical%20Sources-C00000?style=for-the-badge" /><br/>
<sub>Satellite, scatterometer, reanalysis, bulletins</sub>
</td>
</tr>
</table>

<br/>

> [!IMPORTANT]
> **TRACE** is an AI-powered, real-time global tropical cyclone tracking and prediction platform. It fuses satellite, atmospheric, and oceanic data from NOAA, JTWC, EUMETSAT, and Open-Meteo through an **LSTM intensity model** and a **Random Forest classifier**, streaming live storm state, 6–24hr predictions, and rapid-intensification alerts to an interactive **Mapbox 3D globe + 2D news-style map** — updating every 10 minutes via WebSocket.

<br/>

**IIC 3.0 | Problem #25** &nbsp;·&nbsp; Aerotech & Aerospace Innovation Track

---

</div>

## 📋 Table of Contents

<details>
<summary><b>Click to expand full table of contents</b></summary>

- [What is TRACE?](#-what-is-trace)
- [Prototype Screenshots](#-prototype-screenshots--visual-walkthrough)
- [Live Demo Highlights](#-live-demo-highlights)
- [Why Mapbox for Both Globe and Map](#-why-mapbox-for-both-globe-and-map)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Data Sources](#-data-sources)
- [Deployment Stack — Zero Cost](#-deployment-stack--zero-cost)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema-neon-postgresql)
- [ML Pipeline](#-ml-pipeline)
- [API Reference](#-server-api-reference)
- [WebSocket Events](#-socketio-events)
- [UI Design Language](#-ui-design-language)
- [Environment Variables](#-environment-variables)
- [Getting Started](#-getting-started)
- [On Accuracy — An Honest Note](#-on-accuracy--an-honest-note)
- [Team](#-team)
- [License](#-license)

</details>

---

## 🌪 What is TRACE?

> *"Cyclone forecasting today is fragmented across a dozen agency websites, static advisory PDFs, and separate satellite feeds — with no single, real-time, globally consistent picture of what a storm is doing and what it will do next."*

Tropical cyclones are among the most destructive natural events on Earth, yet the tools available to track and understand them in real time remain scattered and inconsistent across basins and agencies:

<div align="center">

| Problem | Real-World Cost |
|---|---|
| 🌐 **Fragmented data** — NOAA, JTWC, EUMETSAT each cover different basins separately | No single global live view of all active storms |
| 📉 **Static advisories** — bulletins updated a few times a day, not continuously | Delayed situational awareness during rapid changes |
| 🚨 **Rapid Intensification blind spot** — the single hardest event to forecast | Historically the leading cause of forecast bust and surprise landfalls |
| 🗺 **No unified visualization** — track, cone, wind field, and structure live in different tools | Analysts and the public piece together the picture manually |

</div>

**TRACE solves this** by fusing global storm, atmospheric, and satellite data into one continuously-updated platform — tracking every active cyclone on Earth, in real time, with an ML-driven prediction and rapid-intensification detection layer:

<div align="center">

| Capability | What We Monitor | Data Feeding It |
|---|---|---|
| 🌍 **Global Storm Tracking** | Position, wind, pressure, category, movement | NOAA NHC, JTWC, IBTrACS |
| 📈 **Intensity Prediction** | 6 / 12 / 18 / 24hr wind speed forecast | LSTM sequence model |
| 🚩 **Rapid Intensification Flag** | ≥35kt wind gain in 24hrs, with probability score | Random Forest classifier |
| 🌬 **Wind Flow Visualization** | Live near-surface wind streamlines over sea & land | Open-Meteo + EUMETSAT ASCAT |

</div>

---

## 📸 Prototype Screenshots & Visual Walkthrough

> **Interactive 3D Globe, News-Style 2D Map & Real-Time Prediction Dashboard** — Built & presented for **IIC 3.0, Problem #25 — Aerotech & Aerospace Innovation**.

<div align="center">

### 🌍 1. Primary Globe View — Live Global Storm Tracking
[![TRACE Globe Dashboard](Screenshot/01.png)](Screenshot/01.png)

<table width="100%">
<tr>
<td align="left">
<b>Key Visual Highlights:</b><br/>
• <b>Interactive 3D Mapbox Globe:</b> Rotating globe projection with pulsing storm markers sized by wind speed<br/>
• <b>Category Color Coding:</b> Live SSHS category badges from Tropical Depression through CAT 5<br/>
• <b>Storm Detail Panel:</b> Live stats — wind speed, pressure, movement direction, basin<br/>
• <b>Glassmorphism UI:</b> Deep-space dark theme with cyan accent data readouts
</td>
</tr>
</table>

<br/>

### 🗺 2. 2D News-Style Map — Track, Prediction Cone & Wind Flow
[![TRACE 2D Map View](Screenshot/02.png)](Screenshot/02.png)

<table width="100%">
<tr>
<td align="left">
<b>Key Visual Highlights:</b><br/>
• <b>Mercator News-Style Map:</b> Seamless toggle from 3D globe to broadcast-standard flat map<br/>
• <b>Storm Track + Prediction Cone:</b> Native GeoJSON layers from NHC GIS data<br/>
• <b>Animated Wind Flow Layer:</b> Streamline overlay from Open-Meteo + ASCAT showing convergence and shear<br/>
• <b>Wind Radius Rings:</b> Live wind-field extent around the storm center
</td>
</tr>
</table>

<br/>

### 🚨 3. ML Prediction Panel — Intensity Forecast & RI Alert
[![TRACE Prediction Panel](Screenshot/03.png)](Screenshot/03.png)

<table width="100%">
<tr>
<td align="left">
<b>Key Visual Highlights:</b><br/>
• <b>LSTM Intensity Chart:</b> 6/12/18/24hr wind speed forecast with Recharts visualization<br/>
• <b>Rapid Intensification Alert:</b> Random Forest RI probability score with confidence band<br/>
• <b>Auto-Tiered Alert Banner:</b> WARNING / WATCH / ADVISORY severity, generated automatically<br/>
• <b>Multi-Source Attribution:</b> Data fusion badges — NOAA, JTWC, GOES, ASCAT — visible on the panel
</td>
</tr>
</table>

</div>

---

## ⚡ Live Demo Highlights

```
╔══════════════════════════════════════════════════════════════════════════╗
║                      TRACE DASHBOARD — LIVE DEMO                        ║
╠══════════════════════════════════════════════════════════════════════════╣
║  ✅  Every active global cyclone tracked live, updated every 10 minutes  ║
║  ✅  Mapbox 3D globe ↔ 2D news-style map — seamless single-library toggle║
║  ✅  LSTM intensity forecast — 6 / 12 / 18 / 24hr wind speed             ║
║  ✅  Random Forest category + Rapid Intensification probability score   ║
║  ✅  Animated wind flow layer — explains WHY a storm is intensifying     ║
║  ✅  Storm track + prediction cone rendered as native GeoJSON layers     ║
║  ✅  Multi-source data fusion — NOAA, JTWC, GOES, ASCAT, Sentinel-1      ║
║  ✅  Full historical track + prediction log in Neon PostgreSQL           ║
╚══════════════════════════════════════════════════════════════════════════╝
```

### 5-Minute Demo Script

| Time | Action | Judge Sees |
|------|--------|-----------|
| `0:00–0:30` | Open app | Dark globe, active storm markers pulsing |
| `0:30–1:30` | Pan to active storm | Glowing marker, category badge, wind speed |
| `1:30–2:30` | Click storm | Detail panel — live stats + 6/12/24hr ML prediction |
| `2:30–3:00` | Toggle to 2D map | News-style flat map with track + prediction cone |
| `3:00–3:30` | Toggle wind flow layer | Animated wind streamlines around the storm — explains why it is intensifying, not just what it is doing |
| `3:30–4:30` | Point out data fusion | Satellite (GOES), scatterometer (ASCAT), public JTWC/NHC bulletins feeding the model — grounds the ML in real, verifiable sources |
| `4:30–5:00` | Close on RI detection | Highlight the rapid-intensification probability score as the research contribution |

---

## 🗺 Why Mapbox For Both Globe and Map

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

## 🏗 System Architecture

```
╔══════════════════════════════════════════════════════════════════╗
║              LAYER 4 — PRESENTATION                              ║
║  React.js 18  │  Mapbox GL JS (Globe + 2D)  │  Recharts Charts   ║
║  View Toggle  │  Alert Banner              │  Storm Detail Panel║
╚══════════════════════╦═══════════════════════════════════════════╝
                       ║  WebSocket (Socket.IO 4.7)
                       ║  pushed every 10 minutes
╔══════════════════════╩═══════════════════════════════════════════╗
║              LAYER 3 — APPLICATION & API                        ║
║  Flask 3.0 REST API  │  Socket.IO Server                        ║
║  SQLAlchemy ORM       │  Alert Controller                        ║
╚══════════╦═══════════════════════════════════╦═══════════════════╝
           ║ READ/WRITE                        ║ READ
╔══════════╩══════════╗       ╔════════════════╩══════════════════╗
║  NEON POSTGRESQL     ║       ║   LAYER 2 — INTELLIGENCE          ║
║  storms              ║       ║  prediction.service.py            ║
║  predictions          ║◄─────►║  LSTM (intensity) + RF (class.) ║
║  track_points         ║       ║  alert.service.py                ║
║  wind_field_points    ║       ╚════════════════╦══════════════════╝
╚══════════════════════╝                        ║
                                ╔═══════════════════╩═══════════════════╗
                                ║        LAYER 1 — LIVE DATA SOURCES    ║
                                ║  NOAA NHC · JTWC · GOES · ASCAT       ║
                                ║  Sentinel-1 · Open-Meteo · IBTrACS    ║
                                ╚════════════════════════════════════════╝
```

---

## 🛠 Tech Stack

<div align="center">

### Server Side

| Layer | Technology | Version | Why |
|-------|-----------|---------|-----|
| Language | Python | 3.11+ | ML ecosystem, Flask compatibility |
| Framework | Flask | 3.0 | Lightweight, proven |
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

</div>

---

## 📡 Data Sources

### Primary Training Data

| # | Source | What | Size | Free? |
|---|--------|------|------|-------|
| 1 | **IBTrACS** — International Best Track Archive | 50+ years of all global cyclones, ground-truth labels | ~150MB | ✅ Yes |
| 2 | **ERA5 Reanalysis** (Copernicus) | Global atmospheric data — wind, pressure, humidity, SST | ~400MB (subset) | ✅ Yes, free account |
| 3 | **NOAA HURSAT** | Satellite imagery for tropical storms, by basin/decade | ~200MB (subset) | ✅ Yes |

### Live Data APIs — No Download Required

| # | Source | What | URL |
|---|--------|------|-----|
| 4 | **NOAA NHC Active Storms Feed** | All active storms globally, updates every 6hrs | `nhc.noaa.gov/CurrentStorms.json` |
| 5 | **Open-Meteo Atmospheric API** | Live global atmospheric parameters at any lat/lon | `api.open-meteo.com/v1/forecast` |
| 6 | **NHC GIS Storm Track Data** | Live track + prediction cone, GeoJSON | `nhc.noaa.gov/gis/` |

### Multi-Source Data Fusion — Satellite, Aerial & Marine Wind Data

| # | Source | What | Use |
|---|--------|------|-----|
| 7 | **NOAA/NESDIS GOES-16/18** | Real-time IR + visible cloud imagery, Americas & Pacific | Structure / eye detection features |
| 8 | **JTWC** — Joint Typhoon Warning Center | Public bulletins, Pacific & Indian Ocean basins | Cross-validation for uncovered basins |
| 9 | **EUMETSAT ASCAT** | Satellite radar-derived ocean surface wind vectors | Wind field input + RI features |
| 10 | **Copernicus Sentinel-1 SAR** | Radar imagery through cloud cover, day/night | Structure confirmation during eyewall cycles |
| 11 | **NOAA Hurricane Hunter Aircraft Archive** | In-storm dropsonde readings | Ground-truth model validation |

```
Total Data Budget
────────────────────────────────
IBTrACS global CSV       ~150MB
ERA5 subset              ~400MB
NOAA HURSAT subset       ~200MB
ASCAT wind subset        ~50MB  (region/date limited)
────────────────────────────────
Total                    ~800MB  — trim ASCAT date range first if over
```

---

## ☁️ Deployment Stack — Zero Cost

| Service | Purpose | Free Tier | Sleeps? |
|---------|---------|-----------|---------|
| Vercel | Client hosting | Unlimited | Never |
| Render | Server hosting | 750 hrs/month | After 15 min |
| Neon PostgreSQL | Database | 512MB forever | Never |
| UptimeRobot | Keep Render awake | 50 monitors free | — |

```
GitHub Repository (source of truth)
        |                    |
   Render (server)      Vercel (client)
        |
  Neon PostgreSQL (permanent data)
        |
  NOAA / JTWC / Open-Meteo / EUMETSAT feeds (live storm + wind data)

UptimeRobot → pings Render every 10min → never sleeps
```

---

## 📁 Project Structure

```
trace/
│
├── server/                              # Flask — deployed on Render
│   ├── src/
│   │   ├── routes/                      # /api/storms, /api/predict, /api/history, /api/health
│   │   ├── controllers/
│   │   ├── services/                    # noaa, jtwc, goes, ascat, openmeteo, prediction, alert
│   │   ├── models/                      # storm, prediction, track, alert
│   │   ├── sockets/
│   │   ├── middleware/
│   │   └── config/
│   ├── app.py
│   └── requirements.txt
│
├── client/                              # React — deployed on Vercel
│   └── src/
│       ├── components/
│       │   ├── ui/                      # Button, Badge, Card, Spinner, AlertBanner
│       │   ├── layout/                  # Navbar, Sidebar, Layout
│       │   ├── map/                     # GlobeView, MapView, StormTrack, PredictionCone, WindFlowLayer
│       │   └── storm/                   # StormDetailPanel, PredictionCard, IntensityChart
│       ├── hooks/                       # useSocket, useStorms, useWindField, usePrediction
│       ├── services/api.js
│       ├── store/stormStore.js
│       └── utils/
│
├── ml/                                  # ML pipeline — run locally only
│   ├── data/                            # download_ibtracs, download_era5, download_hursat, download_ascat
│   ├── preprocessing/                   # clean_ibtracs, engineer_features, build_sequences
│   ├── training/                        # train_lstm, train_rf, evaluate
│   ├── saved_models/                    # NOT committed to Git
│   └── notebooks/
│
├── Screenshot/                          # Prototype screenshots
│   ├── 01.png                           # Globe view — live global storm tracking
│   ├── 02.png                           # 2D map — track, prediction cone, wind flow
│   └── 03.png                           # Prediction panel — LSTM forecast + RI alert
│
├── .env.example
├── .gitignore
├── README.md
└── ROADMAP.md
```

---

## 🗄 Database Schema (Neon PostgreSQL)

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

## 🤖 ML Pipeline

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
```

### Rapid Intensification Definition

```
Rapid Intensification = wind speed increases >= 35 knots in 24 hours
This is the #1 killer in cyclone forecasting — almost no model predicts it well.
This is the research gap. This is what wins.
```

---

## 📡 Server API Reference

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

**Server → Client** *(pushed every 10 minutes)*

| Event | Payload |
|---|---|
| `storm_update` | `{ storm_id, wind_speed, pressure, lat, lon, category }` |
| `prediction_update` | `{ storm_id, wind_6hr, wind_12hr, wind_24hr, ri_flag }` |
| `alert_update` | `{ storm_id, type, severity, message }` |
| `wind_field_update` | `{ points: [{ lat, lon, speed, direction }, ...] }` |

**Client → Server**

| Event | Payload |
|---|---|
| `subscribe_storm` | `{ storm_id }` — get updates for a specific storm |
| `unsubscribe_storm` | `{ storm_id }` |

---

## 🎨 UI Design Language

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

---

## 🔐 Environment Variables

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

> [!WARNING]
> **Never commit `.env` to Git.** It contains database credentials and API keys. It is in `.gitignore` by default.

---

## 🚀 Getting Started

### Prerequisites

```
Python 3.11+  ·  Node.js 18+  ·  Neon PostgreSQL account  ·  Git
```

### Step 1 — Clone

```bash
git clone https://github.com/yourusername/trace.git
cd trace
```

### Step 2 — Server Setup

```bash
cd server
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # Mac/Linux
pip install -r requirements.txt
cp ../.env.example .env
# Edit .env — add DATABASE_URL
```

### Step 3 — ML Pipeline (run once locally)

```bash
cd ../ml
python data/download_ibtracs.py
python preprocessing/clean_ibtracs.py
python preprocessing/engineer_features.py
python preprocessing/build_sequences.py
python training/train_lstm.py        # ~45-60 mins
python training/train_rf.py          # ~5 mins
```

### Step 4 — Start Backend

```bash
cd ../server
python app.py
# http://localhost:5000
```

### Step 5 — Start Frontend

```bash
cd ../client
npm install
npm run dev
# http://localhost:3000
```

---

## 🎯 On Accuracy — An Honest Note

No combination of these sources allows prediction of every movement with certainty. Cyclone track and intensity forecasting is inherently probabilistic — which is why every prediction in this system ships with a **confidence score** and, for track, a **prediction cone** rather than a single line. The goal of fusing these sources is to tighten that cone and improve RI-detection recall, not to eliminate uncertainty. This framing is also more credible in front of judges familiar with the domain than an "accurate and precise" claim would be.

---

## 👥 Team

<div align="center">

<table>
<tr>
<td align="center" width="25%">
<br/>
<b>Your Name</b><br/>
<sub>Team Lead · Backend · Architecture</sub>
</td>
<td align="center" width="25%">
<br/>
<b>Teammate Name</b><br/>
<sub>Frontend · Mapbox · UI/UX</sub>
</td>
<td align="center" width="25%">
<br/>
<b>Teammate Name</b><br/>
<sub>ML Pipeline · Data Engineering</sub>
</td>
<td align="center" width="25%">
<br/>
<b>Teammate Name</b><br/>
<sub>Data Fusion · Documentation</sub>
</td>
</tr>
</table>

</div>

---

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

---

<div align="center">

<br/>

**Built for IIC 3.0 — Problem #25 — Aerotech & Aerospace Innovation**

<br/>

<img src="https://capsule-render.vercel.app/api?type=waving&color=00D4FF&height=120&section=footer" width="100%"/>

</div>