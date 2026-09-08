import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/layout/Navbar'
import MapView from '../components/map/MapView'
import { useStormStore } from '../store/stormStore'
import { getCategoryColor, getCategoryLabel } from '../utils/stormColors'
import { windToKph } from '../utils/formatters'

/**
 * MapPage — Full-screen interactive RainViewer-style live storm map.
 * Shows all active storms, colored tracks, forecast cones, and interactive telemetry drawer.
 */
export default function MapPage() {
  const navigate = useNavigate()
  const { storms, selectedStorm, selectStorm } = useStormStore()
  const [activeStormId, setActiveStormId] = useState(null)
  const [timeStr, setTimeStr] = useState('')

  // Default to first storm if available
  useEffect(() => {
    if (storms.length > 0 && !activeStormId) {
      const initial = selectedStorm?.id || storms[0].id
      setActiveStormId(initial)
      const found = storms.find((s) => s.id === initial)
      if (found) selectStorm(found)
    }
  }, [storms, selectedStorm, activeStormId, selectStorm])

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

  const currentStorm = storms.find((s) => s.id === activeStormId) || selectedStorm || storms[0]

  const handleSelectStorm = (storm) => {
    setActiveStormId(storm.id)
    selectStorm(storm)
  }

  const catColor = currentStorm ? getCategoryColor(currentStorm.category) : 'var(--cyan-core)'
  const catLabel = currentStorm ? getCategoryLabel(currentStorm.category) : 'Active System'

  return (
    <div style={{ height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg-void)', position: 'relative' }}>
      <Navbar />

      {/* Main Fullscreen Map */}
      <div style={{ position: 'absolute', inset: '52px 0 0 0' }}>
        <MapView
          focusStormId={activeStormId}
          embedded={false}
          showControls={true}
          interactive={true}
          onStormClick={(storm) => handleSelectStorm(storm)}
        />
      </div>

      {/* Top Floating Storm Selector Pills */}
      {storms.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '68px',
            left: '24px',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            maxWidth: 'calc(100vw - 120px)',
          }}
        >
          <Link
            to="/"
            style={{
              padding: '7px 14px',
              borderRadius: '20px',
              background: 'rgba(14,21,37,0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.8)',
              fontSize: '12px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              transition: 'all 0.2s',
            }}
          >
            <i className="fa-solid fa-arrow-left" style={{ fontSize: '11px' }} />
            Overview
          </Link>

          {storms.map((storm) => {
            const isSelected = storm.id === activeStormId
            const color = getCategoryColor(storm.category)
            return (
              <button
                key={storm.id}
                onClick={() => handleSelectStorm(storm)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '20px',
                  background: isSelected ? 'rgba(20,30,48,0.95)' : 'rgba(14,21,37,0.75)',
                  backdropFilter: 'blur(12px)',
                  border: isSelected ? `1.5px solid ${color}` : '1px solid rgba(255,255,255,0.08)',
                  color: isSelected ? '#fff' : 'rgba(255,255,255,0.7)',
                  fontSize: '12px',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: isSelected ? `0 0 12px ${color}40` : '0 4px 12px rgba(0,0,0,0.3)',
                  transition: 'all 0.2s',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: color,
                    boxShadow: isSelected ? `0 0 6px ${color}` : 'none',
                  }}
                />
                <span>{(storm.name || 'Unnamed').toUpperCase()}</span>
                <span style={{ fontSize: '10px', opacity: 0.6, fontFamily: 'var(--font-data)' }}>
                  {Math.round(storm.wind_speed || 0)} kt
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Bottom-Left Floating Quick Telemetry Card */}
      <AnimatePresence>
        {currentStorm && (
          <motion.div
            key={currentStorm.id}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'absolute',
              bottom: '32px',
              left: '24px',
              zIndex: 100,
              width: '320px',
              background: 'rgba(14,21,37,0.92)',
              backdropFilter: 'blur(16px)',
              border: `1px solid ${catColor}44`,
              borderRadius: '16px',
              padding: '18px 20px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(0,0,0,0.4)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    background: `${catColor}20`,
                    border: `1px solid ${catColor}60`,
                    color: catColor,
                    marginBottom: '4px',
                  }}
                >
                  {catLabel}
                </span>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '20px',
                    fontWeight: 700,
                    color: '#fff',
                    letterSpacing: '0.02em',
                  }}
                >
                  {(currentStorm.name || 'UNNAMED').toUpperCase()}
                </h3>
              </div>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-data)' }}>
                {currentStorm.basin} Basin
              </span>
            </div>

            {/* Quick Metrics */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                marginTop: '12px',
                marginBottom: '16px',
                padding: '10px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                  Wind Speed
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: catColor, fontFamily: 'var(--font-data)' }}>
                  {windToKph(currentStorm.wind_speed)} <span style={{ fontSize: '11px', fontWeight: 400 }}>km/h</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                  Central Pressure
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#e8f0f8', fontFamily: 'var(--font-data)' }}>
                  {Math.round(currentStorm.pressure || 1010)} <span style={{ fontSize: '11px', fontWeight: 400 }}>hPa</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                  Moving
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#7c8cf8' }}>
                  {currentStorm.movement_dir || 'WNW'} {currentStorm.movement_speed ? `${windToKph(currentStorm.movement_speed)} km/h` : ''}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                  Position
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-data)' }}>
                  {currentStorm.latitude?.toFixed(1) ?? '0.0'}°, {currentStorm.longitude?.toFixed(1) ?? '0.0'}°
                </div>
              </div>
            </div>

            {/* Deep Analysis CTA */}
            <button
              onClick={() => navigate(`/storm/${currentStorm.id}`)}
              style={{
                width: '100%',
                padding: '11px 16px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(0,212,255,0.18) 0%, rgba(0,153,204,0.3) 100%)',
                border: '1px solid var(--cyan-core)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(0,212,255,0.2)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,212,255,0.3) 0%, rgba(0,153,204,0.45) 100%)'
                e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,212,255,0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,212,255,0.18) 0%, rgba(0,153,204,0.3) 100%)'
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,212,255,0.2)'
              }}
            >
              <span>View Deep AI Forecast</span>
              <i className="fa-solid fa-arrow-right" style={{ fontSize: '11px' }} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Badge */}
      <div className="rv-live-badge" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 100 }}>
        <div className="live-dot">
          <span />
          LIVE
        </div>
        <div className="live-time">{timeStr}</div>
      </div>
    </div>
  )
}
