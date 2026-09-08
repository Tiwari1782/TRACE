import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast, { Toaster } from 'react-hot-toast'

import Navbar from '../components/layout/Navbar'
import MapView from '../components/map/MapView'
import { useStormStore } from '../store/stormStore'
import { getPrediction, getStorm } from '../services/api'
import {
  getCategoryColor,
  getCategoryLabel,
} from '../utils/stormColors'
import {
  formatWind,
  formatPressure,
  formatLat,
  formatLon,
  formatBasin,
  windToKph,
  windDelta,
  formatRI,
} from '../utils/formatters'

export default function StormDetailPage() {
  const { stormId } = useParams()
  const { storms, predictions, setPrediction, connected } = useStormStore()

  const [storm, setStorm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [panelOpen, setPanelOpen] = useState(true)

  // 1. Locate storm from store or fetch
  useEffect(() => {
    let active = true
    const found = storms.find(
      (s) => s.id === stormId || String(s.id) === String(stormId)
    )

    if (found) {
      setStorm(found)
      setLoading(false)
    } else {
      getStorm(stormId)
        .then((data) => {
          if (active && data) {
            const norm = { ...data }
            if (data.latitude != null && data.lat == null) norm.lat = data.latitude
            if (data.longitude != null && data.lon == null) norm.lon = data.longitude
            setStorm(norm)
          }
        })
        .catch((err) => {
          console.error('[StormDetailPage] Failed to fetch storm:', err)
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    }

    return () => { active = false }
  }, [stormId, storms])

  // 2. Fetch ML prediction
  useEffect(() => {
    if (!stormId) return
    getPrediction(stormId)
      .then((pred) => {
        if (pred) setPrediction(stormId, pred)
      })
      .catch(() => {})
  }, [stormId, setPrediction])

  const pred = predictions[stormId]
  const catColor = storm ? getCategoryColor(storm.category) : '#00d4ff'
  const catLabel = storm ? getCategoryLabel(storm.category) : 'UNKNOWN'
  const lat = storm?.lat ?? storm?.latitude
  const lon = storm?.lon ?? storm?.longitude

  // Time string
  const [timeStr, setTimeStr] = useState('')
  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      )
    }
    update()
    const t = setInterval(update, 30000)
    return () => clearInterval(t)
  }, [])

  if (loading) {
    return (
      <div className="rv-loading">
        <Navbar />
        <div className="spinner" />
        <p style={{ fontFamily: 'var(--font-data)', fontSize: '13px' }}>
          Acquiring Cyclone Telemetry...
        </p>
      </div>
    )
  }

  if (!storm) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-void)' }}>
        <Navbar />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: 'calc(100vh - 56px)',
            paddingTop: '56px',
            color: 'rgba(255,255,255,0.5)',
            textAlign: 'center',
            padding: '120px 24px',
          }}
        >
          <i
            className="fa-solid fa-cloud-sun"
            style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}
          />
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#fff',
              marginBottom: '8px',
            }}
          >
            Cyclone Not Found
          </h2>
          <p style={{ fontSize: '14px', marginBottom: '24px', maxWidth: '400px' }}>
            The requested storm identifier{' '}
            <code
              style={{
                color: 'var(--cyan-core)',
                background: 'rgba(0,0,0,0.3)',
                padding: '2px 8px',
                borderRadius: '4px',
                fontFamily: 'var(--font-data)',
              }}
            >
              {stormId}
            </code>{' '}
            does not correspond to an active system.
          </p>
          <Link to="/" className="rv-back-btn" style={{ position: 'static' }}>
            <i className="fa-solid fa-arrow-left" style={{ fontSize: '12px' }} />
            Back to Hurricane Tracker
          </Link>
        </div>
      </div>
    )
  }

  const wind = storm.wind_speed || 0

  return (
    <div style={{ height: '100vh', overflow: 'hidden', background: 'var(--bg-void)' }}>
      <Toaster position="top-right" />
      <Navbar />

      {/* Full-screen map */}
      <div className="rv-fullmap">
        <div className="rv-fullmap-container">
          <MapView focusStormId={stormId} embedded={false} />
        </div>

        {/* Live badge */}
        <div className="rv-live-badge" style={{ position: 'fixed', bottom: '24px' }}>
          <div className="live-dot">
            <span />
            LIVE
          </div>
          <div className="live-time">{timeStr}</div>
        </div>
      </div>

      {/* Back button */}
      <Link to="/" className="rv-back-btn">
        <i className="fa-solid fa-arrow-left" style={{ fontSize: '12px' }} />
        Back
      </Link>

      {/* Toggle panel button */}
      <button
        onClick={() => setPanelOpen(!panelOpen)}
        style={{
          position: 'fixed',
          top: '72px',
          right: panelOpen ? '384px' : '16px',
          zIndex: 101,
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          background: 'rgba(14,21,37,0.92)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          fontSize: '14px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}
        title={panelOpen ? 'Hide Panel' : 'Show Panel'}
      >
        <i className={`fa-solid ${panelOpen ? 'fa-angles-right' : 'fa-angles-left'}`} />
      </button>

      {/* Info Panel */}
      {panelOpen && (
        <motion.div
          className="rv-info-panel"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="rv-info-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span
                className="cat-badge"
                style={{
                  background: `${catColor}22`,
                  border: `1px solid ${catColor}55`,
                  color: catColor,
                  fontSize: '11px',
                  padding: '3px 10px',
                }}
              >
                {catLabel}
              </span>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  color: 'var(--status-live)',
                  fontFamily: 'var(--font-data)',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--status-live)',
                    display: 'block',
                  }}
                />
                ACTIVE
              </span>
            </div>
            <div className="panel-storm-name">
              {storm.name || 'Unnamed Cyclone'}
            </div>
            <div className="panel-storm-meta">
              <span>{formatBasin(storm.basin)} Basin</span>
              <span>·</span>
              <span>ID: {storm.id}</span>
            </div>
          </div>

          <div className="rv-info-panel-body">
            {/* RI Alert */}
            {pred?.rapid_intensify && (
              <div className="panel-ri-alert">
                <div className="ri-title">
                  <i className="fa-solid fa-triangle-exclamation" />
                  RAPID INTENSIFICATION
                </div>
                <div className="ri-desc">
                  AI models forecast ≥35 kt wind increase in 24 hours.
                  Probability: {formatRI(pred.ri_probability)}
                </div>
                <div className="ri-bar">
                  <div
                    className="ri-bar-fill"
                    style={{
                      width: `${Math.round((pred.ri_probability || 0) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Telemetry */}
            <div className="panel-section-label">
              <i className="fa-solid fa-satellite-dish" />
              LIVE TELEMETRY
            </div>
            <div className="panel-stat-grid">
              <div className="panel-stat-item">
                <div className="stat-label">Sustained Wind</div>
                <div className="stat-value" style={{ color: catColor }}>
                  {Math.round(wind)}
                  <span className="stat-unit">kt</span>
                </div>
              </div>
              <div className="panel-stat-item">
                <div className="stat-label">Central Pressure</div>
                <div className="stat-value">
                  {Math.round(storm.pressure || 1010)}
                  <span className="stat-unit">hPa</span>
                </div>
              </div>
              <div className="panel-stat-item">
                <div className="stat-label">Latitude</div>
                <div className="stat-value" style={{ fontSize: '15px' }}>
                  {formatLat(lat)}
                </div>
              </div>
              <div className="panel-stat-item">
                <div className="stat-label">Longitude</div>
                <div className="stat-value" style={{ fontSize: '15px' }}>
                  {formatLon(lon)}
                </div>
              </div>
              <div className="panel-stat-item">
                <div className="stat-label">Forward Speed</div>
                <div className="stat-value" style={{ color: '#7c8cf8' }}>
                  {Math.round(storm.movement_speed || 0)}
                  <span className="stat-unit">kt</span>
                </div>
              </div>
              <div className="panel-stat-item">
                <div className="stat-label">Heading</div>
                <div
                  className="stat-value"
                  style={{ color: '#00e676', fontSize: '15px' }}
                >
                  {storm.movement_dir || 'WNW'}
                </div>
              </div>
            </div>

            {/* ML Forecast */}
            {pred && (
              <>
                <div className="panel-section-label">
                  <i className="fa-solid fa-brain" />
                  AI INTENSITY FORECAST
                </div>
                <div className="panel-forecast-row">
                  {[
                    { label: '+6H', wind: pred.wind_6hr, cat: pred.category_6hr },
                    { label: '+12H', wind: pred.wind_12hr, cat: pred.category_12hr },
                    { label: '+24H', wind: pred.wind_24hr, cat: pred.category_24hr },
                  ].map((h) => {
                    const c = getCategoryColor(h.cat)
                    const delta = windDelta(storm.wind_speed, h.wind)
                    const isUp = parseInt(delta) > 0
                    return (
                      <div key={h.label} className="panel-forecast-cell">
                        <div className="fc-label">{h.label}</div>
                        <div className="fc-wind" style={{ color: c }}>
                          {Math.round(h.wind || 0)}
                          <span
                            style={{
                              fontSize: '10px',
                              color: 'rgba(255,255,255,0.3)',
                              marginLeft: '2px',
                            }}
                          >
                            kt
                          </span>
                        </div>
                        <div
                          className="fc-cat"
                          style={{
                            background: `${c}18`,
                            border: `1px solid ${c}44`,
                            color: c,
                          }}
                        >
                          {getCategoryLabel(h.cat)}
                        </div>
                        <div
                          className="fc-delta"
                          style={{ color: isUp ? '#ff5722' : '#00e676' }}
                        >
                          {delta} kt
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Confidence */}
                <div
                  style={{
                    marginTop: '16px',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '6px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-data)',
                    }}
                  >
                    <span style={{ color: 'rgba(255,255,255,0.35)' }}>
                      Model Confidence
                    </span>
                    <span style={{ color: 'var(--cyan-core)' }}>
                      {Math.round((pred.confidence ?? 0.88) * 100)}%
                    </span>
                  </div>
                  <div className="confidence-meter">
                    <div
                      className="confidence-fill"
                      style={{
                        width: `${Math.round((pred.confidence ?? 0.88) * 100)}%`,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: '10px',
                      color: 'rgba(255,255,255,0.2)',
                      fontFamily: 'var(--font-data)',
                      marginTop: '6px',
                    }}
                  >
                    LSTM + RF Ensemble · IBTrACS 50yr
                  </div>
                </div>
              </>
            )}

            {!pred && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '24px',
                  color: 'rgba(255,255,255,0.25)',
                  fontSize: '12px',
                  fontFamily: 'var(--font-data)',
                }}
              >
                Generating ML forecast...
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}
