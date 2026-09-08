import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/layout/Navbar'
import MapView from '../components/map/MapView'
import StormCard from '../components/storm/StormCard'
import { useStormStore } from '../store/stormStore'

/**
 * HomePage — RainViewer-style hurricane tracker landing page.
 * Hero section with satellite map + Active Hurricanes list below.
 */
export default function HomePage() {
  const navigate = useNavigate()
  const { storms, lastSync } = useStormStore()
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

  const lastUpdated = lastSync
    ? new Date(lastSync).toUTCString().replace('GMT', 'UTC')
    : `${new Date().toUTCString().replace('GMT', 'UTC')}`

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-void)',
        overflowX: 'hidden',
        overflowY: 'auto',
      }}
    >
      <Navbar />

      {/* ═══ HERO SECTION ═══ */}
      <section className="rv-hero">
        <div className="rv-hero-bg" />

        {/* Left: Text Content */}
        <motion.div
          className="rv-hero-content"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1>Hurricane tracker live</h1>
          <p className="hero-subtitle">
            Live radar shows position and path for every active storm.
          </p>
          <p className="hero-desc">
            TRACE shows live data for every active hurricane and tropical storm.
            Data comes from NOAA NHC and JTWC feeds worldwide. AI-powered
            intensity forecasting with LSTM neural networks predicts wind speed
            at +6h, +12h, and +24h horizons. Track position, wind speed, and
            forecast path for each storm below.
          </p>

          {/* Action CTAs */}
          <div className="hero-cta-group">
            <Link to="/map" className="hero-cta-primary">
              <i className="fa-solid fa-satellite" />
              <span>Launch Live Radar Map</span>
            </Link>
            <a href="#active-hurricanes" className="hero-cta-secondary">
              <i className="fa-solid fa-arrow-down" />
              <span>View Active Storms ({storms.length})</span>
            </a>
          </div>
        </motion.div>

        {/* Right: Embedded Map */}
        <motion.div
          className="rv-hero-map-wrapper"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <div className="rv-hero-map-container">
            {/* Sync Badge */}
            <div className="map-sync-badge">
              <div style={{ fontSize: '13px', fontWeight: 600 }}>
                Server Sync:
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700 }}>
                {timeStr}
              </div>
            </div>

            {/* Map Controls */}
            <div className="map-controls">
              <button
                className="map-control-btn"
                title="Open Live Radar Map"
                onClick={() => navigate('/map')}
              >
                <i className="fa-solid fa-up-right-from-square" />
              </button>
              <button
                className="map-control-btn"
                title="Fullscreen"
                onClick={() => {
                  const el = document.querySelector('.rv-hero-map-container')
                  if (el) el.requestFullscreen?.()
                }}
              >
                <i className="fa-solid fa-expand" />
              </button>
            </div>

            {/* Satellite Map */}
            <MapView
              embedded
              interactive={true}
              showControls={false}
              onStormClick={(storm) => navigate(`/storm/${storm.id}`)}
            />

            {/* Live Badge */}
            <div className="rv-live-badge">
              <div className="live-dot">
                <span />
                LIVE
              </div>
              <div className="live-time">{timeStr}</div>
            </div>
          </div>

          {/* Full Screen Map Link */}
          <Link to="/map" className="rv-hero-map-fullscreen">
            <i className="fa-solid fa-expand" style={{ fontSize: '12px' }} />
            Launch Full Screen Map
          </Link>
        </motion.div>
      </section>

      {/* ═══ ACTIVE HURRICANES LIST ═══ */}
      <section id="active-hurricanes" className="rv-storms-section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2>Active Hurricanes</h2>
          <p className="storms-updated">
            Last updated: {lastUpdated}
          </p>
        </motion.div>

        {storms.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'rgba(255,255,255,0.3)',
            }}
          >
            <i
              className="fa-solid fa-cloud-sun"
              style={{
                fontSize: '48px',
                marginBottom: '16px',
                display: 'block',
                opacity: 0.3,
              }}
            />
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>
              No active storms detected
            </p>
            <p style={{ fontSize: '13px', opacity: 0.6 }}>
              Data refreshes automatically from NOAA and JTWC feeds
            </p>
          </motion.div>
        ) : (
          <div>
            {storms.map((storm, i) => (
              <motion.div
                key={storm.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
              >
                <StormCard storm={storm} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="rv-footer">
        <span>
          © TRACE · Cyclone Intelligence · AI-Powered Storm Tracking
        </span>
      </footer>
    </div>
  )
}
