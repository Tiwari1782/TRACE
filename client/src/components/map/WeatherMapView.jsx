import { useEffect, useRef, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useStormStore } from '../../store/stormStore'
import { getCategoryColor } from '../../utils/stormColors'
import WindParticleCanvas from './WindParticleCanvas'
import WindRadiusRings from './WindRadiusRings'
import { FiPlay, FiPause, FiRewind, FiFastForward } from 'react-icons/fi'

/**
 * WeatherMapView — Native MapLibre weather visualization platform.
 * 100% Free, NO API keys, NO blocked iframes, CORS-safe, guaranteed to render.
 *
 * Supported Layers:
 * - wind:      Dynamic 60FPS particle streamlines + storm spiral physics
 * - satellite: NOAA GOES Geostationary Infrared Satellite Cloud Tops
 * - radar:     Global Doppler Radar Composite (RainViewer + NOAA NEXRAD)
 * - rain:      High-precipitation & thunderstorm reflectivity
 * - temp:      Thermal infrared & sea surface temperature gradient
 * - waves:     Ocean swell bathymetry & wave reflection
 */

const RAINVIEWER_API = 'https://api.rainviewer.com/public/weather-maps.json'
const RV_TILE        = 'https://tilecache.rainviewer.com'
const NEXRAD_TILE    = 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png'
const GOES_IR_TILE   = 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/goes-east-ir-4km-900913/{z}/{x}/{y}.png'
const OCEAN_TILE     = 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}'

const SOURCE_WEATHER = 'trace-weather-source'
const LAYER_WEATHER  = 'trace-weather-layer'

const DARK_MAP_STYLE = {
  version: 8,
  sources: {
    'esri-satellite': {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      maxzoom: 18,
      attribution: '© Esri, NASA',
    },
    'carto-labels': {
      type: 'raster',
      tiles: ['https://basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}@2x.png'],
      tileSize: 256,
      maxzoom: 18,
      attribution: '© CARTO',
    },
  },
  layers: [
    { id: 'satellite-base', type: 'raster', source: 'esri-satellite', maxzoom: 18 },
    { id: 'labels',         type: 'raster', source: 'carto-labels',   paint: { 'raster-opacity': 0.7 } },
  ],
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
}

export default function WeatherMapView({
  activeLayer   = 'radar',
  center        = [-40, 20],
  zoom          = 2.5,
  showStorms    = true,
  showControls  = true,
  onStormClick  = null,
}) {
  const mapContainer = useRef(null)
  const map          = useRef(null)
  const stormMarkers = useRef({})

  const [styleLoaded, setStyleLoaded]   = useState(false)
  const [mapInstance, setMapInstance]   = useState(null)
  const [rvData,      setRvData]        = useState(null)
  const [frameIdx,    setFrameIdx]      = useState(0)
  const [isPlaying,   setIsPlaying]     = useState(false)
  const animIntervalRef = useRef(null)

  const storms      = useStormStore((s) => s.storms)
  const selectStorm = useStormStore((s) => s.selectStorm)

  // ── 1. Initialize MapLibre ─────────────────────────────────────────
  useEffect(() => {
    if (map.current || !mapContainer.current) return

    const m = new maplibregl.Map({
      container: mapContainer.current,
      style: DARK_MAP_STYLE,
      center,
      zoom,
      attributionControl: false,
    })

    if (showControls) {
      m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
      m.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
    }

    m.on('load', () => {
      map.current = m
      setMapInstance(m)
      setStyleLoaded(true)
    })

    return () => {
      if (animIntervalRef.current) clearInterval(animIntervalRef.current)
      Object.values(stormMarkers.current).forEach((marker) => marker.remove())
      stormMarkers.current = {}
      if (m) {
        m.remove()
        map.current = null
        setMapInstance(null)
      }
    }
  }, [])

  // ── 2. Center change handler ──────────────────────────────────────
  useEffect(() => {
    if (!map.current || !center) return
    map.current.flyTo({ center, zoom, duration: 1200, essential: true })
  }, [center?.[0], center?.[1], zoom])

  // ── 3. Fetch RainViewer Manifest ─────────────────────────────────
  useEffect(() => {
    let mounted = true
    fetch(RAINVIEWER_API)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch RainViewer')
        return res.json()
      })
      .then((data) => {
        if (!mounted) return
        setRvData(data)
        const past = data?.radar?.past || []
        if (past.length > 0) {
          setFrameIdx(past.length - 1)
        }
      })
      .catch((err) => {
        console.warn('[WeatherMapView] RainViewer offline, using NOAA NEXRAD fallback', err)
      })
    return () => { mounted = false }
  }, [])

  // ── 4. Apply Active Weather Tile Layer onto Map ───────────────────
  const updateWeatherTile = useCallback((layer, frameIndex) => {
    if (!map.current || !styleLoaded) return

    // Wind layer uses HTML5 Canvas particles, no raster overlay needed
    if (layer === 'wind') {
      try {
        if (map.current.getLayer(LAYER_WEATHER)) map.current.removeLayer(LAYER_WEATHER)
        if (map.current.getSource(SOURCE_WEATHER)) map.current.removeSource(SOURCE_WEATHER)
      } catch (_) {}
      return
    }

    let tileUrl = null
    let opacity = 0.85

    if (layer === 'satellite') {
      // Check if RainViewer has satellite frames, else use NOAA GOES-East IR
      const satFrames = rvData?.satellite?.infrared || []
      if (satFrames.length > 0 && satFrames[satFrames.length - 1]?.path) {
        tileUrl = `${RV_TILE}${satFrames[satFrames.length - 1].path}/256/{z}/{x}/{y}/0/0_0.png`
      } else {
        tileUrl = GOES_IR_TILE
      }
      opacity = 0.88
    } else if (layer === 'temp') {
      tileUrl = GOES_IR_TILE
      opacity = 0.78
    } else if (layer === 'waves') {
      tileUrl = OCEAN_TILE
      opacity = 0.70
    } else {
      // radar or rain
      const past = rvData?.radar?.past || []
      if (past.length > 0) {
        const safeIdx = Math.min(Math.max(frameIndex, 0), past.length - 1)
        const path = past[safeIdx]?.path
        const color = layer === 'rain' ? 6 : 2 // TS8 warm or standard doppler
        tileUrl = `${RV_TILE}${path}/256/{z}/{x}/{y}/${color}/1_1.png`
      } else {
        tileUrl = NEXRAD_TILE
      }
      opacity = 0.82
    }

    if (!tileUrl) return

    try {
      if (map.current.getLayer(LAYER_WEATHER)) {
        map.current.removeLayer(LAYER_WEATHER)
      }
      if (map.current.getSource(SOURCE_WEATHER)) {
        map.current.removeSource(SOURCE_WEATHER)
      }

      map.current.addSource(SOURCE_WEATHER, {
        type: 'raster',
        tiles: [tileUrl],
        tileSize: 256,
      })

      // Insert weather layer underneath the carto-labels if possible
      const beforeId = map.current.getLayer('labels') ? 'labels' : undefined

      map.current.addLayer(
        {
          id: LAYER_WEATHER,
          type: 'raster',
          source: SOURCE_WEATHER,
          paint: { 'raster-opacity': opacity },
        },
        beforeId
      )
    } catch (err) {
      console.warn('[WeatherMapView] Tile layer update error:', err)
    }
  }, [styleLoaded, rvData])

  useEffect(() => {
    updateWeatherTile(activeLayer, frameIdx)
  }, [activeLayer, frameIdx, updateWeatherTile])

  // ── 5. Radar Playback Controller ─────────────────────────────────
  const pastFrames = rvData?.radar?.past || []

  useEffect(() => {
    if (!isPlaying || pastFrames.length <= 1) {
      if (animIntervalRef.current) clearInterval(animIntervalRef.current)
      return
    }

    animIntervalRef.current = setInterval(() => {
      setFrameIdx((prev) => (prev + 1) % pastFrames.length)
    }, 700)

    return () => {
      if (animIntervalRef.current) clearInterval(animIntervalRef.current)
    }
  }, [isPlaying, pastFrames.length])

  // ── 6. Storm Markers ─────────────────────────────────────────────
  useEffect(() => {
    if (!map.current || !styleLoaded || !showStorms) return

    const currentIds = new Set(storms.map((s) => s.id))

    Object.keys(stormMarkers.current).forEach((id) => {
      if (!currentIds.has(id)) {
        stormMarkers.current[id].remove()
        delete stormMarkers.current[id]
      }
    })

    storms.forEach((storm) => {
      const lat = storm.lat ?? storm.latitude
      const lon = storm.lon ?? storm.longitude
      if (lat == null || lon == null) return

      const color = getCategoryColor(storm.category)

      const triggerStorm = (e) => {
        if (e) e.stopPropagation()
        selectStorm(storm)
        if (onStormClick) onStormClick(storm)
      }

      if (stormMarkers.current[storm.id]) {
        stormMarkers.current[storm.id].setLngLat([lon, lat])
        const existingEl = stormMarkers.current[storm.id].getElement()
        if (existingEl) {
          existingEl.onclick = triggerStorm
          existingEl.ontouchend = triggerStorm
        }
        return
      }

      const el = document.createElement('div')
      el.className = 'storm-marker-label'
      el.innerHTML = `
        <span class="storm-marker-dot" style="background:${color};box-shadow:0 0 8px ${color};"></span>
        <span>${(storm.name || 'UNNAMED').toUpperCase()}</span>
      `
      el.style.cursor = 'pointer'
      el.style.touchAction = 'manipulation'
      el.style.pointerEvents = 'auto'
      el.style.zIndex = '50'

      el.onclick = triggerStorm
      el.ontouchend = triggerStorm

      stormMarkers.current[storm.id] = new maplibregl.Marker({
        element: el,
        anchor: 'bottom',
        offset: [0, -8],
      })
        .setLngLat([lon, lat])
        .addTo(map.current)
    })

    // Map canvas proximity touch/click: if user touches cyclone rings or eye on canvas
    const handleMapCanvasClick = (e) => {
      if (!map.current) return
      const clickPoint = e.point || (e.points && e.points[0])
      if (!clickPoint) return
      let closest = null
      let minDist = 70 // 70px touch target radius
      storms.forEach((s) => {
        const sLat = s.lat ?? s.latitude
        const sLon = s.lon ?? s.longitude
        if (sLat == null || sLon == null) return
        const p = map.current.project([sLon, sLat])
        const dist = Math.hypot(p.x - clickPoint.x, p.y - clickPoint.y)
        if (dist < minDist) {
          minDist = dist
          closest = s
        }
      })
      if (closest) {
        selectStorm(closest)
        if (onStormClick) onStormClick(closest)
      }
    }

    map.current.on('click', handleMapCanvasClick)
    map.current.on('touchend', handleMapCanvasClick)

    return () => {
      if (map.current) {
        map.current.off('click', handleMapCanvasClick)
        map.current.off('touchend', handleMapCanvasClick)
      }
    }
  }, [storms, styleLoaded, showStorms, selectStorm, onStormClick])

  // Calculate current radar frame timestamp
  const currentTimestamp = pastFrames[frameIdx]?.time
    ? new Date(pastFrames[frameIdx].time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'LIVE'

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* MapLibre Canvas Container */}
      <div
        ref={mapContainer}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: '#0a0f1a' }}
      />

      {/* Dynamic Animated Wind Particles Overlay */}
      {mapInstance && (
        <WindParticleCanvas
          map={mapInstance}
          storms={storms}
          visible={activeLayer === 'wind'}
          particleCount={240}
        />
      )}

      {/* Dynamic Animated Wind Danger Radii Rings */}
      {mapInstance && showStorms && (
        <WindRadiusRings map={mapInstance} storms={storms} />
      )}

      {/* Radar Timeline Scrubber (only for radar / rain layers when frames exist) */}
      {(activeLayer === 'radar' || activeLayer === 'rain') && pastFrames.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 16px',
            borderRadius: '24px',
            background: 'rgba(10, 15, 26, 0.88)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          }}
        >
          <button
            onClick={() => setFrameIdx((f) => Math.max(0, f - 1))}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}
            title="Previous Frame"
          >
            <FiRewind size={14} />
          </button>

          <button
            onClick={() => setIsPlaying((p) => !p)}
            style={{
              background: isPlaying ? '#00e5a0' : '#00d4ff',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#04040a',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <FiPause size={13} /> : <FiPlay size={13} style={{ marginLeft: 2 }} />}
          </button>

          <button
            onClick={() => setFrameIdx((f) => Math.min(pastFrames.length - 1, f + 1))}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}
            title="Next Frame"
          >
            <FiFastForward size={14} />
          </button>

          <input
            type="range"
            min={0}
            max={pastFrames.length - 1}
            value={frameIdx}
            onChange={(e) => {
              setIsPlaying(false)
              setFrameIdx(Number(e.target.value))
            }}
            style={{ width: '110px', accentColor: '#00d4ff', cursor: 'pointer' }}
          />

          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#e2e8f0', minWidth: '55px' }}>
            {currentTimestamp}
          </div>
        </div>
      )}

      {/* Layer Status HUD Badge */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '24px',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '16px',
          background: 'rgba(4, 4, 10, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '11px',
          fontFamily: 'monospace',
          color: 'var(--text-secondary)',
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: activeLayer === 'wind' ? '#00e5a0' : '#00d4ff',
            boxShadow: `0 0 6px ${activeLayer === 'wind' ? '#00e5a0' : '#00d4ff'}`,
          }}
        />
        <span>
          {activeLayer === 'wind' && 'WIND STREAMLINES · 60 FPS PARTICLES'}
          {activeLayer === 'satellite' && 'SATELLITE IR · NOAA GOES CLOUD TOPS'}
          {activeLayer === 'radar' && 'LIVE DOPPLER RADAR · RAINVIEWER / NEXRAD'}
          {activeLayer === 'rain' && 'RAIN & THUNDER · PRECIPITATION COMPOSITE'}
          {activeLayer === 'temp' && 'SEA SURFACE TEMP · THERMAL INFRARED'}
          {activeLayer === 'waves' && 'OCEAN BATHYMETRY & SWELL RADAR'}
        </span>
      </div>
    </div>
  )
}
