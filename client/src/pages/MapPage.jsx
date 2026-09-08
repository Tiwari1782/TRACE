import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiArrowLeft, FiArrowRight, FiWind } from 'react-icons/fi'
import { MdRadar, MdSatelliteAlt } from 'react-icons/md'
import Navbar from '../components/layout/Navbar'
import MapView from '../components/map/MapView'
import WindFlowLayer from '../components/map/WindFlowLayer'
import { useStormStore } from '../store/stormStore'
import { getCategoryColor, getCategoryLabel } from '../utils/stormColors'
import { windToKph } from '../utils/formatters'

export default function MapPage() {
  const navigate = useNavigate()
  const { storms, selectedStorm, selectStorm } = useStormStore()
  const [activeStormId, setActiveStormId] = useState(null)
  const [timeStr, setTimeStr]             = useState('')
  const [windyOpen, setWindyOpen]         = useState(false)
  const [weatherOverlay, setWeatherOverlay] = useState('wind')

  useEffect(() => {
    if (storms.length > 0 && !activeStormId) {
      const initial = selectedStorm?.id || storms[0].id
      setActiveStormId(initial)
      const found = storms.find((s) => s.id === initial)
      if (found) selectStorm(found)
    }
  }, [storms, selectedStorm, activeStormId, selectStorm])

  useEffect(() => {
    const update = () => {
      setTimeStr(
        new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      )
    }
    update()
    const t = setInterval(update, 30000)
    return () => clearInterval(t)
  }, [])

  const currentStorm = storms.find((s) => s.id === activeStormId) || selectedStorm || storms[0]
  const handleSelectStorm = (storm) => { setActiveStormId(storm.id); selectStorm(storm) }
  const catColor = currentStorm ? getCategoryColor(currentStorm.category) : 'var(--accent-cyan)'
  const catLabel = currentStorm ? getCategoryLabel(currentStorm.category) : 'Active System'

  const handleToggleWindy = () => setWindyOpen((v) => !v)

  return (
    <div style={{ height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg-void)', position: 'relative' }}>
      <Navbar />

      {/* Full-screen Map */}
      <div style={{ position: 'absolute', inset: '56px 0 0 0' }}>
        <MapView
          focusStormId={activeStormId}
          embedded={false}
          showControls={true}
          interactive={true}
          weatherOverlay={weatherOverlay}
          onStormClick={(storm) => handleSelectStorm(storm)}
        />
      </div>

      {/* Top-Right Weather Layer Selector */}
      <div
        style={{
          position: 'absolute',
          top: '68px',
          right: '24px',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(4, 4, 10, 0.88)',
          backdropFilter: 'blur(12px)',
          padding: '4px 6px',
          borderRadius: '24px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}
      >
        {[
          { id: 'wind', label: 'Wind Particles', icon: FiWind },
          { id: 'radar', label: 'Doppler Radar', icon: MdRadar },
          { id: 'satellite', label: 'Satellite IR', icon: MdSatelliteAlt },
          { id: 'none', label: 'Base Map', icon: null },
        ].map(({ id, label, icon: Icon }) => {
          const isSelected = weatherOverlay === id || (id === 'none' && !weatherOverlay)
          return (
            <button
              key={id}
              onClick={() => setWeatherOverlay(id === 'none' ? null : id)}
              style={{
                padding: '6px 12px',
                borderRadius: '16px',
                border: isSelected ? '1px solid #00d4ff' : '1px solid transparent',
                background: isSelected ? 'rgba(0, 212, 255, 0.18)' : 'transparent',
                color: isSelected ? '#fff' : 'var(--text-secondary)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
            >
              {Icon && <Icon size={12} />}
              <span>{label}</span>
            </button>
          )
        })}
      </div>

      {/* Top Toolbar */}
      {storms.length > 0 && (
        <div
          style={{
            position: 'absolute', top: '68px', left: '24px', zIndex: 100,
            display: 'flex', alignItems: 'center', gap: '8px',
            flexWrap: 'wrap', maxWidth: 'calc(100vw - 120px)',
          }}
        >
          <Link
            to="/"
            style={{
              padding: '7px 14px', borderRadius: '20px',
              background: 'rgba(4,4,10,0.85)', backdropFilter: 'blur(12px)',
              border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)',
              fontSize: '12px', fontWeight: 600, textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: '6px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)', transition: 'all 0.2s',
            }}
          >
            <FiArrowLeft size={12} />
            Overview
          </Link>

          {storms.map((storm) => {
            const isSelected = storm.id === activeStormId
            const color = getCategoryColor(storm.category)
            return (
              <button
                key={storm.id}
                onClick={() => handleSelectStorm(storm)}
                className={`map-storm-tab ${isSelected ? 'active' : ''}`}
                style={
                  isSelected
                    ? { background: `${color}18`, border: `1px solid ${color}55`, color: '#fff', boxShadow: `0 0 14px ${color}30` }
                    : {}
                }
              >
                <span
                  className={`map-tab-dot ${isSelected ? 'pulsing' : ''}`}
                  style={{ background: color, boxShadow: isSelected ? `0 0 6px ${color}` : 'none' }}
                />
                <span>{(storm.name || 'Unnamed').toUpperCase()}</span>
                <span className="map-tab-speed" style={{ color: isSelected ? color : undefined }}>
                  {Math.round(storm.wind_speed || 0)} kt
                </span>
              </button>
            )
          })}

          {/* Windy toggle */}
          <button
            onClick={handleToggleWindy}
            className={`windy-toggle-btn ${windyOpen ? 'active' : ''}`}
          >
            <FiWind size={13} />
            Wind Field
          </button>
        </div>
      )}

      {/* Bottom-Left Popup Card */}
      <AnimatePresence>
        {currentStorm && (
          <motion.div
            key={currentStorm.id}
            className="map-popup-card"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            style={{
              bottom: windyOpen ? 'calc(45vh + 24px)' : '32px',
              transition: 'bottom 0.35s var(--ease-out)',
            }}
          >
            <div
              className="map-popup-cat-badge"
              style={{ background: `${catColor}18`, border: `1px solid ${catColor}44`, color: catColor }}
            >
              {catLabel}
            </div>
            <div className="map-popup-name">
              {(currentStorm.name || 'UNNAMED').toUpperCase()}
            </div>
            <div className="map-popup-stats">
              <div className="map-popup-stat">
                <div className="map-popup-stat-label">Wind Speed</div>
                <div className="map-popup-stat-value" style={{ color: catColor }}>
                  {windToKph(currentStorm.wind_speed)}<span className="map-popup-stat-unit">km/h</span>
                </div>
              </div>
              <div className="map-popup-stat">
                <div className="map-popup-stat-label">Pressure</div>
                <div className="map-popup-stat-value" style={{ color: 'var(--text-primary)' }}>
                  {Math.round(currentStorm.pressure || 1010)}<span className="map-popup-stat-unit">hPa</span>
                </div>
              </div>
              <div className="map-popup-stat">
                <div className="map-popup-stat-label">Moving</div>
                <div className="map-popup-stat-value" style={{ color: '#7c8cf8', fontSize: '13px' }}>
                  {currentStorm.movement_dir || 'WNW'}{' '}
                  {currentStorm.movement_speed ? `${windToKph(currentStorm.movement_speed)} km/h` : ''}
                </div>
              </div>
              <div className="map-popup-stat">
                <div className="map-popup-stat-label">Position</div>
                <div className="map-popup-stat-value" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                  {currentStorm.latitude?.toFixed(1) ?? '0.0'}°,{' '}
                  {currentStorm.longitude?.toFixed(1) ?? '0.0'}°
                </div>
              </div>
            </div>
            <button
              className="map-popup-cta"
              onClick={() => navigate(`/storm/${currentStorm.id}`)}
            >
              View Deep AI Forecast
              <FiArrowRight size={13} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Badge */}
      <div className="rv-live-badge" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 100 }}>
        <div className="live-dot"><span />LIVE</div>
        <div className="live-time">{timeStr}</div>
      </div>

      {/* Wind Flow Layer — storm-centered Windy embed */}
      <WindFlowLayer
        windyOpen={windyOpen}
        onClose={() => setWindyOpen(false)}
        storm={currentStorm}
      />
    </div>
  )
}
