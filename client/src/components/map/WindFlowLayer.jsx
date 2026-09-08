import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiWind, FiX } from 'react-icons/fi'

/**
 * WindFlowLayer — Windy embed panel anchored to active storm coordinates.
 * Uses embed.windy.com (proven to work; same source as GlobeViewPage).
 *
 * @param {boolean}  windyOpen  - Whether panel is visible
 * @param {function} onClose    - Callback to close the panel
 * @param {object}   storm      - Currently active storm object (for lat/lon centering)
 */
export default function WindFlowLayer({ windyOpen, onClose, storm }) {
  const [loaded, setLoaded] = useState(false)

  // Reset loader each time panel opens or storm changes
  useEffect(() => {
    if (windyOpen) setLoaded(false)
  }, [windyOpen, storm?.id])

  // Build a Windy embed URL centered on the active storm
  const lat  = storm?.lat ?? storm?.latitude  ?? 20
  const lon  = storm?.lon ?? storm?.longitude ?? -60
  const zoom = 4

  const embedUrl = [
    'https://embed.windy.com/embed2.html',
    `?lat=${lat.toFixed(2)}`,
    `&lon=${lon.toFixed(2)}`,
    `&zoom=${zoom}`,
    '&level=surface',
    '&overlay=wind',
    '&product=ecmwf',
    '&menu=true',
    '&message=true',
    '&pressure=true',
    '&type=map',
    '&location=coordinates',
    '&metricWind=kt',
    '&metricTemp=%C2%B0C',
  ].join('')

  return (
    <AnimatePresence>
      {windyOpen && (
        <motion.div
          className="windy-panel"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Header */}
          <div className="windy-panel-header">
            <span className="windy-panel-title">
              <FiWind size={12} style={{ marginRight: 6 }} />
              WIND FLOW {storm ? '· ' + (storm.name || 'UNNAMED').toUpperCase() : '· GLOBAL'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {storm && (
                <span style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-data)',
                }}>
                  {lat.toFixed(1)}&deg;{lat >= 0 ? 'N' : 'S'} &middot; {Math.abs(lon).toFixed(1)}&deg;{lon >= 0 ? 'E' : 'W'}
                </span>
              )}
              <span style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-data)',
              }}>
                ECMWF · REAL-TIME
              </span>
              <button
                className="windy-panel-close"
                onClick={onClose}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <FiX size={14} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="windy-panel-body">
            {!loaded && (
              <div className="windy-loading">
                <div className="spinner" />
                <span style={{
                  fontSize: '11px',
                  color: 'var(--accent-cyan)',
                  fontFamily: 'var(--font-data)',
                  letterSpacing: '0.1em',
                }}>
                  LOADING WIND FIELD...
                </span>
              </div>
            )}
            <iframe
              key={`${storm?.id ?? 'global'}-${lat.toFixed(1)}-${lon.toFixed(1)}`}
              src={embedUrl}
              title="Windy Wind Flow"
              onLoad={() => setLoaded(true)}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                opacity: loaded ? 1 : 0,
                transition: 'opacity 0.3s ease',
              }}
              allow="fullscreen"
            />
            <div className="windy-badge">Powered by Windy · ECMWF</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
