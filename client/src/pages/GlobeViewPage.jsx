import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { FiWind, FiThermometer, FiCloudRain, FiExternalLink } from 'react-icons/fi'
import { MdSatelliteAlt, MdRadar, MdWaves } from 'react-icons/md'
import Navbar from '../components/layout/Navbar'
import WeatherMapView from '../components/map/WeatherMapView'
import MapStormCard from '../components/map/MapStormCard'
import { useStormStore } from '../store/stormStore'

/**
 * GlobeViewPage — Live atmospheric map powered by RainViewer tiles on MapLibre.
 * Route: /globe
 *
 * Replaced Windy iframe (which was blocked) with native MapLibre + RainViewer tiles.
 */
export default function GlobeViewPage() {
  const [activeLayer, setActiveLayer] = useState('wind')
  const [tooltipId,   setTooltipId]   = useState(null)
  const [selectedCardStorm, setSelectedCardStorm] = useState(null)

  const { storms, selectedStorm, selectStorm } = useStormStore()
  const centerStorm = selectedStorm || storms[0] || null
  const centerLon   = centerStorm?.lon ?? centerStorm?.longitude ?? -40
  const centerLat   = centerStorm?.lat ?? centerStorm?.latitude  ?? 20

  const layers = [
    {
      id: 'wind',
      icon: <FiWind size={13} />,
      label: 'Wind Streamlines',
      tip: 'Global radar wind-velocity overlay (RainViewer, light palette)',
    },
    {
      id: 'satellite',
      icon: <MdSatelliteAlt size={13} />,
      label: 'Satellite IR',
      tip: 'Real-time geostationary infrared satellite cloud tops (RainViewer)',
    },
    {
      id: 'radar',
      icon: <MdRadar size={13} />,
      label: 'Live Radar',
      tip: 'Composite Doppler radar precipitation reflectivity (RainViewer)',
    },
    {
      id: 'rain',
      icon: <FiCloudRain size={13} />,
      label: 'Rain & Thunder',
      tip: 'Precipitation radar with warm color palette (RainViewer)',
    },
    {
      id: 'temp',
      icon: <FiThermometer size={13} />,
      label: 'Sea Surface Temp',
      tip: 'Infrared thermal satellite (cold = blue, warm = orange)',
    },
  ]

  return (
    <div style={{ height: '100vh', width: '100vw', background: 'var(--bg-void)', overflow: 'hidden' }}>
      <Navbar />

      <div className="globe-page">
        {/* ── Weather Map ─────────────────────────────────────────── */}
        <WeatherMapView
          activeLayer={activeLayer}
          center={[centerLon, centerLat]}
          zoom={2.8}
          showStorms={true}
          onStormClick={(storm) => {
            setSelectedCardStorm(storm)
            selectStorm(storm)
          }}
        />

        {/* ── Interactive Cyclone Card on Click ─────────────────── */}
        <AnimatePresence>
          {selectedCardStorm && (
            <MapStormCard
              storm={selectedCardStorm}
              onClose={() => setSelectedCardStorm(null)}
              style={{
                bottom: '32px',
                left: '24px',
                zIndex: 95,
              }}
            />
          )}
        </AnimatePresence>

        {/* ── Top-Left Info Badge ─────────────────────────────────── */}
        <div className="globe-overlay-tl" style={{ pointerEvents: 'none' }}>
          <div className="globe-overlay-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-cyan)', animation: 'live-pulse 1.8s ease-in-out infinite' }} />
            GLOBAL ATMOSPHERIC INTELLIGENCE
          </div>
          <div className="globe-overlay-sub">
            RainViewer · ESRI Satellite · Live Tiles
          </div>
        </div>

        {/* ── Top-Right Layer Switcher ────────────────────────────── */}
        <div className="globe-toolbar">
          {layers.map((layer) => {
            const isActive = activeLayer === layer.id
            return (
              <button
                key={layer.id}
                className={`globe-toolbar-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveLayer(layer.id)}
                onMouseEnter={() => setTooltipId(layer.id)}
                onMouseLeave={() => setTooltipId(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: isActive ? 'var(--accent-cyan-dim)' : 'rgba(17,18,23,0.85)',
                  borderColor: isActive ? 'var(--border-glow)' : 'var(--border-subtle)',
                  color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                }}
              >
                {layer.icon}
                <span>{layer.label}</span>
                {tooltipId === layer.id && (
                  <div className="globe-tooltip">{layer.tip}</div>
                )}
              </button>
            )
          })}

          <a
            href="https://www.rainviewer.com"
            target="_blank"
            rel="noopener noreferrer"
            className="globe-external-link"
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <span>RainViewer</span>
            <FiExternalLink size={11} />
          </a>
        </div>
      </div>
    </div>
  )
}
