import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FiWind, FiThermometer, FiCloudRain, FiArrowLeft, FiExternalLink,
} from 'react-icons/fi'
import { MdSatelliteAlt, MdRadar, MdWaves } from 'react-icons/md'
import Navbar from '../components/layout/Navbar'
import WeatherMapView from '../components/map/WeatherMapView'
import { useStormStore } from '../store/stormStore'
import { getCategoryColor } from '../utils/stormColors'

/**
 * LiveWeatherPage — Full-screen live weather map.
 * Route: /live-weather
 *
 * Uses MapLibre + RainViewer tile overlays (no iframes, no API keys).
 * Six switchable atmospheric layers. Storm-centered view.
 */
export default function LiveWeatherPage() {
  const navigate = useNavigate()
  const { storms, selectedStorm, selectStorm } = useStormStore()

  const [activeLayer,   setActiveLayer]   = useState('radar')
  const [activeStormId, setActiveStormId] = useState(selectedStorm?.id || storms[0]?.id || null)

  const centerStorm = storms.find((s) => s.id === activeStormId) || selectedStorm || storms[0] || null
  const centerLon   = centerStorm?.lon ?? centerStorm?.longitude ?? -40
  const centerLat   = centerStorm?.lat ?? centerStorm?.latitude  ?? 20

  const layers = [
    { id: 'radar',     icon: <MdRadar size={13} />,          label: 'Live Radar',       color: '#00d4ff' },
    { id: 'satellite', icon: <MdSatelliteAlt size={13} />,   label: 'Satellite IR',     color: '#a855f7' },
    { id: 'rain',      icon: <FiCloudRain size={13} />,       label: 'Rain & Thunder',   color: '#7c8cf8' },
    { id: 'wind',      icon: <FiWind size={13} />,            label: 'Wind Velocity',    color: '#00e5a0' },
    { id: 'temp',      icon: <FiThermometer size={13} />,     label: 'Thermal / SST',    color: '#ff5722' },
    { id: 'waves',     icon: <MdWaves size={13} />,           label: 'Wave Radar',       color: '#ffaa00' },
  ]

  const handleStormSelect = (storm) => {
    setActiveStormId(storm.id)
    selectStorm(storm)
  }

  return (
    <div className="lw-page">
      <Navbar />

      <div className="lw-container">
        {/* ── Main Weather Map ──────────────────────────────────── */}
        <WeatherMapView
          key={`${activeLayer}-${activeStormId}`}
          activeLayer={activeLayer}
          center={[centerLon, centerLat]}
          zoom={3.5}
          showStorms={true}
          onStormClick={handleStormSelect}
        />

        {/* ── Top-Left Info Badge ───────────────────────────────── */}
        <div className="lw-badge-tl">
          <div className="lw-badge-live">
            <span className="lw-live-dot" />
            LIVE ATMOSPHERIC INTELLIGENCE
          </div>
          {centerStorm && (
            <div className="lw-badge-storm">
              Centered · {(centerStorm.name || 'Active Storm').toUpperCase()}
              {' '}· {centerLat.toFixed(1)}°{centerLat >= 0 ? 'N' : 'S'}{' '}
              {Math.abs(centerLon).toFixed(1)}°{centerLon >= 0 ? 'E' : 'W'}
            </div>
          )}
          <div className="lw-badge-source">RainViewer · ESRI · Live Tiles</div>
        </div>

        {/* ── Layer Switcher Toolbar ────────────────────────────── */}
        <div className="lw-toolbar">
          {layers.map((layer) => {
            const isActive = activeLayer === layer.id
            return (
              <button
                key={layer.id}
                className={`lw-layer-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveLayer(layer.id)}
                style={isActive ? {
                  background:  `${layer.color}18`,
                  borderColor: `${layer.color}55`,
                  color:        layer.color,
                  boxShadow:   `0 0 12px ${layer.color}20`,
                } : {}}
              >
                {layer.icon}
                <span>{layer.label}</span>
              </button>
            )
          })}

          <div className="lw-toolbar-divider" />

          <a
            href="https://www.rainviewer.com"
            target="_blank"
            rel="noopener noreferrer"
            className="lw-external-btn"
          >
            <FiExternalLink size={12} />
            <span>RainViewer</span>
          </a>
        </div>

        {/* ── Return to TRACE Button ────────────────────────────── */}
        <motion.button
          className="lw-return-btn"
          onClick={() => navigate('/')}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <FiArrowLeft size={14} />
          Return to TRACE
        </motion.button>

        {/* ── Storm Context Strip ───────────────────────────────── */}
        {storms.length > 0 && (
          <div className="lw-storm-strip">
            {storms.map((storm) => {
              const isCenter = storm.id === activeStormId
              const color    = getCategoryColor(storm.category)
              return (
                <button
                  key={storm.id}
                  className={`lw-storm-chip ${isCenter ? 'active' : ''}`}
                  onClick={() => handleStormSelect(storm)}
                  style={isCenter ? {
                    background:  `${color}18`,
                    borderColor: `${color}55`,
                    color,
                  } : {}}
                >
                  <span
                    className="lw-storm-chip-dot"
                    style={{ background: isCenter ? color : '#555' }}
                  />
                  {(storm.name || 'UNNAMED').toUpperCase()}
                  <span className="lw-storm-chip-kt">
                    {Math.round(storm.wind_speed || 0)} kt
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
