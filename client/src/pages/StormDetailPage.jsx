import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast, { Toaster } from 'react-hot-toast'
import { FiArrowLeft, FiTrendingUp, FiTrendingDown, FiMinus, FiChevronRight, FiChevronLeft } from 'react-icons/fi'
import { BsExclamationTriangleFill } from 'react-icons/bs'
import { MdCyclone } from 'react-icons/md'

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

/** Delta arrow + colour for forecast change indicator */
function DeltaIndicator({ currentWind, forecastWind }) {
  const raw   = Math.round((forecastWind || 0) - (currentWind || 0))
  const isUp  = raw > 0
  const isDown= raw < 0
  const color = isUp ? '#00e5a0' : isDown ? '#ff2244' : 'var(--text-muted)'
  const Icon  = isUp ? FiTrendingUp : isDown ? FiTrendingDown : FiMinus
  return (
    <div className="fc-delta" style={{ color, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
      <Icon size={11} /> {Math.abs(raw)} kt
    </div>
  )
}

export default function StormDetailPage() {
  const { stormId } = useParams()
  const { storms, predictions, setPrediction, connected } = useStormStore()

  const [storm, setStorm]       = useState(null)
  const [loading, setLoading]   = useState(true)
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
      .then((pred) => { if (pred) setPrediction(stormId, pred) })
      .catch(() => {})
  }, [stormId, setPrediction])

  const pred     = predictions[stormId]
  const catColor = storm ? getCategoryColor(storm.category) : '#00d4ff'
  const catLabel = storm ? getCategoryLabel(storm.category) : 'UNKNOWN'
  const lat      = storm?.lat ?? storm?.latitude
  const lon      = storm?.lon ?? storm?.longitude

  // Live clock
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
        <p style={{ fontFamily: 'var(--font-data)', fontSize: '12px', letterSpacing: '0.1em', color: 'var(--accent-cyan)' }}>
          ACQUIRING CYCLONE TELEMETRY...
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
            textAlign: 'center',
            padding: '120px 24px',
          }}
        >
          <MdCyclone size={48} style={{ marginBottom: '16px', opacity: 0.4, color: 'var(--text-muted)' }} />
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
            Cyclone Not Found
          </h2>
          <p style={{ fontSize: '14px', marginBottom: '24px', maxWidth: '400px', color: 'var(--text-secondary)' }}>
            The requested storm identifier{' '}
            <code
              style={{
                color: 'var(--accent-cyan)',
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
          <Link to="/" className="rv-back-btn" style={{ position: 'static', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <FiArrowLeft size={14} /> Back to Hurricane Tracker
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
      <Link to="/" className="rv-back-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <FiArrowLeft size={14} /> Back
      </Link>

      {/* Panel toggle button */}
      <button
        onClick={() => setPanelOpen(!panelOpen)}
        style={{
          position: 'fixed',
          top: '72px',
          right: panelOpen ? '380px' : '16px',
          zIndex: 101,
          width: '34px',
          height: '34px',
          borderRadius: '8px',
          background: 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur)',
          border: 'var(--glass-border)',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s var(--ease-out)',
          fontSize: '13px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}
        title={panelOpen ? 'Hide Panel' : 'Show Panel'}
      >
        {panelOpen ? <FiChevronRight size={16} /> : <FiChevronLeft size={16} />}
      </button>

      {/* ═══ INFO PANEL ═══ */}
      {panelOpen && (
        <motion.div
          className="rv-info-panel"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* ── Header ── */}
          <div className="rv-info-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span
                className="panel-cat-badge"
                style={{
                  background: `${catColor}22`,
                  border: `1px solid ${catColor}55`,
                  color: catColor,
                }}
              >
                {catLabel}
              </span>
              <div className="panel-active-indicator">
                <span className="panel-active-dot" />
                ACTIVE
              </div>
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
                <div className="ri-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BsExclamationTriangleFill size={13} color="var(--danger-red)" /> RAPID INTENSIFICATION
                </div>
                <div className="ri-desc">
                  AI models forecast ≥35 kt wind increase in 24 hours.
                  Probability: {formatRI(pred.ri_probability)}
                </div>
                <div className="ri-bar">
                  <div
                    className="ri-bar-fill"
                    style={{ width: `${Math.round((pred.ri_probability || 0) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* ── LIVE TELEMETRY ── */}
            <div className="panel-section-label">
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
                <div className="stat-value" style={{ color: 'var(--accent-green)', fontSize: '15px' }}>
                  {storm.movement_dir || 'WNW'}
                </div>
              </div>
            </div>

            {/* ── AI INTENSITY FORECAST ── */}
            {pred && (
              <>
                <div className="panel-section-label">
                  AI INTENSITY FORECAST
                </div>
                <div className="panel-forecast-row">
                  {[
                    { label: '+6H',  wind: pred.wind_6hr,  cat: pred.category_6hr  },
                    { label: '+12H', wind: pred.wind_12hr, cat: pred.category_12hr },
                    { label: '+24H', wind: pred.wind_24hr, cat: pred.category_24hr },
                  ].map((h) => {
                    const c = getCategoryColor(h.cat)
                    return (
                      <div key={h.label} className="panel-forecast-cell">
                        <div className="fc-label">{h.label}</div>
                        <div className="fc-wind">
                          {Math.round(h.wind || 0)}
                          <span>kt</span>
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
                        <DeltaIndicator
                          currentWind={storm.wind_speed}
                          forecastWind={h.wind}
                        />
                      </div>
                    )
                  })}
                </div>

                {/* ── MODEL CONFIDENCE ── */}
                <div className="panel-confidence">
                  <div className="panel-confidence-header">
                    <span className="panel-confidence-label">MODEL CONFIDENCE</span>
                    <span className="panel-confidence-pct">
                      {Math.round((pred.confidence ?? 0.88) * 100)}%
                    </span>
                  </div>
                  <div className="confidence-meter">
                    <div
                      className="confidence-fill"
                      style={{ width: `${Math.round((pred.confidence ?? 0.88) * 100)}%` }}
                    />
                  </div>
                  <div className="panel-confidence-note">
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
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  fontFamily: 'var(--font-data)',
                  letterSpacing: '0.08em',
                }}
              >
                GENERATING ML FORECAST...
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}
