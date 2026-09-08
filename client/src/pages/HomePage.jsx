import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { MdSatelliteAlt, MdRadar, MdCyclone } from 'react-icons/md'
import { FiChevronDown, FiMaximize2, FiExternalLink } from 'react-icons/fi'
import { RiRobot2Line } from 'react-icons/ri'
import Navbar from '../components/layout/Navbar'
import MapView from '../components/map/MapView'
import StormCard from '../components/storm/StormCard'
import MapStormCard from '../components/map/MapStormCard'
import { useStormStore } from '../store/stormStore'
import { fireDangerToast } from '../utils/dangerAlerts'

export default function HomePage() {
  const navigate = useNavigate()
  const { storms, lastSync, connected, selectStorm } = useStormStore()
  const [timeStr, setTimeStr] = useState('')
  const [selectedMapStorm, setSelectedMapStorm] = useState(null)
  const [highlightedStormId, setHighlightedStormId] = useState(null)

  const videoRef = useRef(null)
  const lightningRef = useRef(null)
  const timerRef = useRef(null)
  const heroRef = useRef(null)
  const homeAlertFiredRef = useRef(false)

  // Live clock
  useEffect(() => {
    const update = () => {
      setTimeStr(
        new Date().toLocaleTimeString('en-US', {
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

  // Danger alert on homepage for high-threat storms
  useEffect(() => {
    if (!storms || storms.length === 0 || homeAlertFiredRef.current) return
    homeAlertFiredRef.current = true

    const dangerous = [...storms].sort((a, b) => (b.category || 0) - (a.category || 0))
    const highest = dangerous[0]

    if (highest && highest.category >= 3) {
      setTimeout(() => {
        fireDangerToast({
          title: `ACTIVE CAT ${highest.category} HURRICANE — ${(highest.name || 'CYCLONE').toUpperCase()}`,
          message: `${Math.round(highest.wind_speed || 0)} kt winds active in ${highest.basin || 'Oceanic'} Basin. Potential threat to coastal populations.`,
          advice: 'Public Advisory: Monitor emergency directives. Tap this alert to open live telemetry.',
          severity: highest.category >= 4 ? 'danger' : 'warning',
          Icon: MdCyclone,
          onClick: () => navigate(`/storm/${highest.id}`),
        })
      }, 1500)
    }
  }, [storms, navigate])

  // Mobile: slow video slightly so cloud motion doesn't feel frantic on small screens
  useEffect(() => {
    if (videoRef.current && window.innerWidth <= 768) {
      videoRef.current.playbackRate = 0.85
    }
  }, [])

  // Lightning — a single ambient effect, off entirely for reduced-motion users
  useEffect(() => {
    const lightningEl = lightningRef.current
    if (!lightningEl) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const triggerLightning = () => {
      const x = Math.random() * 100
      const y = Math.random() * 50

      lightningEl.style.background = `
        radial-gradient(
          ellipse 200px 400px at ${x}% ${y}%,
          rgba(160, 220, 210, 0.14) 0%,
          rgba(90, 180, 170, 0.06) 40%,
          transparent 70%
        )
      `
      lightningEl.style.opacity = '1'
      setTimeout(() => { lightningEl.style.opacity = '0.25' }, 80)
      setTimeout(() => { lightningEl.style.opacity = '0.8' }, 140)
      setTimeout(() => { lightningEl.style.opacity = '0' }, 220)
      setTimeout(() => { lightningEl.style.background = 'transparent' }, 250)
    }

    const scheduleNext = () => {
      const delay = 5000 + Math.random() * 7000
      return setTimeout(() => {
        triggerLightning()
        timerRef.current = scheduleNext()
      }, delay)
    }

    timerRef.current = scheduleNext()
    return () => clearTimeout(timerRef.current)
  }, [])

  const lastUpdated = lastSync
    ? new Date(lastSync).toUTCString().replace('GMT', 'UTC')
    : new Date().toUTCString().replace('GMT', 'UTC')

  const stormLabel = storms.length === 1 ? 'storm' : 'storms'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-void)', overflowX: 'hidden', overflowY: 'auto' }}>
      <Toaster position="top-right" containerStyle={{ top: 72 }} />
      <Navbar />

      {/* ═══ HERO SECTION ═══ */}
      <section className="rv-hero" ref={heroRef}>

        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="hero-video-bg"
          aria-hidden="true"
          onError={() => heroRef.current?.classList.add('video-failed')}
        >
          <source src="/vid/video.mp4" type="video/mp4" />
        </video>

        <div className="hero-vignette" aria-hidden="true" />
        <div className="hero-lightning" ref={lightningRef} aria-hidden="true" />
        <div className="hero-atmo-tint" aria-hidden="true" />
        <div className="hero-grid" aria-hidden="true" />

        {/* ── Left: Hero Content ── */}
        <motion.div
          className="rv-hero-content"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
        >
          <div className="hero-status-line">
            <span className={`hero-status-dot ${connected ? 'is-live' : 'is-connecting'}`} />
            {connected ? 'Connected to NOAA & JTWC feeds' : 'Connecting to storm feeds'}
          </div>

          <h1>
            <span className="hero-title-white">Every storm,</span>
            <span className="hero-title-accent">tracked live.</span>
          </h1>

          <p className="hero-desc">
            TRACE follows every active hurricane and tropical storm worldwide, sourced
            directly from NOAA's National Hurricane Center and the Joint Typhoon Warning
            Center. An LSTM model forecasts intensity at 6, 12, and 24 hours out.
          </p>

          <div className="hero-stat-row">
            <div className="hero-stat-item">
              <span className="hero-stat-label">Active storms</span>
              <span className="hero-stat-value">
                <MdCyclone size={14} className="hero-stat-icon" />
                {storms.length}
              </span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat-item">
              <span className="hero-stat-label">Data sources</span>
              <span className="hero-stat-value">
                <MdSatelliteAlt size={14} className="hero-stat-icon" />
                NOAA + JTWC
              </span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat-item">
              <span className="hero-stat-label">Forecast model</span>
              <span className="hero-stat-value">
                <RiRobot2Line size={14} className="hero-stat-icon" />
                LSTM
              </span>
            </div>
          </div>

          <div className="hero-cta-group">
            <Link to="/map" className="hero-cta-primary">
              <MdRadar size={16} />
              <span>Open live radar map</span>
            </Link>
            <a href="#active-hurricanes" className="hero-cta-secondary">
              <span>
                {storms.length > 0
                  ? `See ${storms.length} active ${stormLabel}`
                  : 'See active storms'}
              </span>
              <FiChevronDown size={14} />
            </a>
          </div>
        </motion.div>

        {/* ── Right: Map Preview ── */}
        <motion.div
          className="rv-hero-map-wrapper"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <div className="rv-hero-map-container">
            <div className="map-panel-topbar">
              <span className="map-panel-live-label">
                <span className={`hero-status-dot ${connected ? 'is-live' : 'is-connecting'}`} />
                Live feed
              </span>
              <span className="map-panel-sync-time">Synced {timeStr}</span>
            </div>

            <div className="map-controls">
              <button
                className="map-control-btn"
                title="Open live radar map"
                aria-label="Open live radar map"
                onClick={() => navigate('/map')}
              >
                <FiExternalLink size={13} />
              </button>
              <button
                className="map-control-btn"
                title="View fullscreen"
                aria-label="View map fullscreen"
                onClick={() => {
                  const el = document.querySelector('.rv-hero-map-container')
                  if (el) el.requestFullscreen?.()
                }}
              >
                <FiMaximize2 size={13} />
              </button>
            </div>

            <MapView
              embedded
              interactive={true}
              showControls={false}
              onStormClick={(storm) => {
                setSelectedMapStorm(storm)
                setHighlightedStormId(storm.id)
                selectStorm(storm)
              }}
            />

            {/* Interactive Floating Storm Card on Map Click */}
            <AnimatePresence>
              {selectedMapStorm && (
                <MapStormCard
                  storm={selectedMapStorm}
                  compact={true}
                  onClose={() => setSelectedMapStorm(null)}
                  onViewInList={(s) => {
                    const el = document.getElementById(`storm-card-${s.id}`)
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      setHighlightedStormId(s.id)
                    }
                  }}
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '12px',
                    zIndex: 40,
                    maxWidth: 'min(330px, calc(100% - 24px))',
                  }}
                />
              )}
            </AnimatePresence>

            <div className="map-scan-line" aria-hidden="true" style={{ pointerEvents: 'none' }} />
          </div>

          <Link to="/map" className="rv-hero-map-fullscreen">
            <FiMaximize2 size={11} />
            Launch full screen map
          </Link>
        </motion.div>
      </section>

      {/* ═══ ACTIVE HURRICANES LIST ═══ */}
      <section id="active-hurricanes" className="rv-storms-section">
        <motion.div
          className="storms-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2>Active hurricanes</h2>
          <p className="storms-updated">
            {storms.length} {stormLabel} tracked · last updated {lastUpdated}
          </p>
        </motion.div>

        {storms.length === 0 ? (
          <motion.div
            className="storms-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <MdCyclone size={44} className="storms-empty-icon" aria-hidden="true" />
            <p className="storms-empty-title">Skies are clear</p>
            <p className="storms-empty-sub">
              No named storms are being tracked right now. This page updates automatically
              as new advisories come in from NOAA and JTWC.
            </p>
          </motion.div>
        ) : (
          <div>
            {storms.map((storm, i) => (
              <motion.div
                key={storm.id}
                id={`storm-card-${storm.id}`}
                className={highlightedStormId === storm.id ? 'storm-card-highlighted' : ''}
                style={{ borderRadius: 'var(--glass-radius)', transition: 'all 0.3s ease' }}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.06, 0.3) }}
              >
                <StormCard storm={storm} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="rv-footer">
        <span>TRACE · Cyclone intelligence, powered by NOAA, JTWC and an LSTM forecast model</span>
      </footer>
    </div>
  )
}