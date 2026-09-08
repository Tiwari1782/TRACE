import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import useStormStore from '../../store/stormStore.js'
import { getCategoryColor } from '../../utils/stormColors.js'
import { getTrackHistory } from '../../services/api.js'
import WindRadiusRings from './WindRadiusRings.jsx'
import WindParticleCanvas from './WindParticleCanvas.jsx'

/**
 * MapView — MapLibre GL map with satellite imagery.
 * Renders storm markers as dark pill labels (RainViewer style),
 * track history as colored dots, and prediction cones.
 *
 * @param {Object} props
 * @param {boolean} props.embedded - If true, used inside hero section (smaller)
 * @param {string|null} props.focusStormId - If set, center on this storm
 * @param {boolean} props.showControls - Show zoom controls
 * @param {boolean} props.interactive - Allow map interaction
 */
export default function MapView({
  embedded = false,
  focusStormId = null,
  showControls = true,
  interactive = true,
  onStormClick = null,
  weatherOverlay = null,
}) {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const markers = useRef({})
  const trackMarkers = useRef([])
  const [styleLoaded, setStyleLoaded] = useState(false)
  const [mapReady, setMapReady] = useState(false)

  const storms = useStormStore((s) => s.storms)
  const selectedStorm = useStormStore((s) => s.selectedStorm)
  const selectStorm = useStormStore((s) => s.selectStorm)
  const predictions = useStormStore((s) => s.predictions)

  // ── Satellite tile style for MapLibre ────────────────────────────
  const mapStyle = {
    version: 8,
    name: 'Satellite Hybrid',
    sources: {
      'esri-satellite': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        maxzoom: 18,
        attribution: '© Esri, NASA, USGS',
      },
      'carto-labels': {
        type: 'raster',
        tiles: [
          'https://basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}@2x.png',
        ],
        tileSize: 256,
        maxzoom: 18,
        attribution: '© CARTO',
      },
    },
    layers: [
      {
        id: 'satellite',
        type: 'raster',
        source: 'esri-satellite',
        minzoom: 0,
        maxzoom: 18,
      },
      {
        id: 'labels',
        type: 'raster',
        source: 'carto-labels',
        minzoom: 0,
        maxzoom: 18,
        paint: {
          'raster-opacity': 0.7,
        },
      },
    ],
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  }

  // ── Init Map ──────────────────────────────────────────────────────
  useEffect(() => {
    if (map.current || !mapContainer.current) return

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: [0, 20],
        zoom: embedded ? 1.5 : 2,
        attributionControl: false,
        interactive: interactive,
      })

      if (showControls) {
        map.current.addControl(
          new maplibregl.NavigationControl({ showCompass: false }),
          'top-right'
        )
      }

      map.current.on('load', () => {
        setStyleLoaded(true)
        setMapReady(true)
      })
    } catch (err) {
      console.error('[MapView] MapLibre init error:', err)
    }

    return () => {
      Object.values(markers.current).forEach((m) => m.remove())
      markers.current = {}
      clearTrackMarkers()
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // ── Fly to focused storm ─────────────────────────────────────────
  useEffect(() => {
    if (!map.current || !focusStormId) return
    const storm = storms.find(
      (s) => s.id === focusStormId || String(s.id) === String(focusStormId)
    )
    if (!storm) return
    const lat = storm.lat ?? storm.latitude
    const lon = storm.lon ?? storm.longitude
    if (lat == null || lon == null) return

    map.current.flyTo({
      center: [lon, lat],
      zoom: 4.5,
      essential: true,
      duration: 1500,
    })
  }, [focusStormId, storms])

  // ── Fly to selected storm ────────────────────────────────────────
  useEffect(() => {
    if (!map.current || !selectedStorm) return
    const lat = selectedStorm.lat ?? selectedStorm.latitude
    const lon = selectedStorm.lon ?? selectedStorm.longitude
    if (lat == null || lon == null) return

    map.current.flyTo({
      center: [lon, lat],
      zoom: 4.5,
      essential: true,
      duration: 1500,
    })
  }, [selectedStorm])

  // ── Storm markers (dark pill labels like RainViewer) ─────────────
  useEffect(() => {
    if (!map.current) return

    const currentIds = new Set(storms.map((s) => s.id))

    // Remove stale
    Object.keys(markers.current).forEach((id) => {
      if (!currentIds.has(id)) {
        markers.current[id].remove()
        delete markers.current[id]
      }
    })

    storms.forEach((storm) => {
      const lat = storm.lat ?? storm.latitude
      const lon = storm.lon ?? storm.longitude
      if (lat == null || lon == null) return

      const color = getCategoryColor(storm.category)

      if (markers.current[storm.id]) {
        // Update position
        markers.current[storm.id].setLngLat([lon, lat])
        return
      }

      // Create dark pill label marker
      const el = document.createElement('div')
      el.className = 'storm-marker-label'
      el.innerHTML = `
        <span class="storm-marker-dot" style="background:${color};box-shadow:0 0 6px ${color};"></span>
        <span>${(storm.name || 'UNNAMED').toUpperCase()}</span>
      `
      el.style.cursor = 'pointer'
      el.onclick = (e) => {
        e.stopPropagation()
        selectStorm(storm)
        if (onStormClick) onStormClick(storm)
      }

      markers.current[storm.id] = new maplibregl.Marker({
        element: el,
        anchor: 'bottom',
        offset: [0, -8],
      })
        .setLngLat([lon, lat])
        .addTo(map.current)
    })
  }, [storms, selectStorm])

  // ── Track history as colored dots ────────────────────────────────
  const clearTrackMarkers = () => {
    trackMarkers.current.forEach((m) => m.remove())
    trackMarkers.current = []
  }

  useEffect(() => {
    if (!map.current || !styleLoaded) return

    // Only show track for focused or selected storm
    const targetId = focusStormId || selectedStorm?.id
    if (!targetId) {
      clearTrackMarkers()
      return
    }

    let isMounted = true

    getTrackHistory(targetId)
      .then((res) => {
        if (!isMounted || !map.current) return
        clearTrackMarkers()

        const track = res?.track || []
        if (track.length === 0) return

        track.forEach((pt) => {
          if (pt.lat == null || pt.lon == null) return

          const dotColor = getCategoryColor(pt.category ?? 0)
          const el = document.createElement('div')
          el.className = 'track-dot'
          el.style.cssText = `
            background: ${dotColor};
            border-color: ${dotColor}80;
            box-shadow: 0 0 4px ${dotColor}60;
          `

          const marker = new maplibregl.Marker({
            element: el,
            anchor: 'center',
          })
            .setLngLat([pt.lon, pt.lat])
            .addTo(map.current)

          trackMarkers.current.push(marker)
        })

        // Also draw a line connecting track dots
        const coords = track
          .filter((pt) => pt.lat != null && pt.lon != null)
          .map((pt) => [pt.lon, pt.lat])

        const storm = storms.find(
          (s) => s.id === targetId || String(s.id) === String(targetId)
        )
        if (storm) {
          const sLat = storm.lat ?? storm.latitude
          const sLon = storm.lon ?? storm.longitude
          if (sLat != null && sLon != null) {
            coords.push([sLon, sLat])
          }
        }

        if (coords.length > 1) {
          const sourceId = 'track-line'
          const layerId = 'track-line-layer'

          // Remove existing
          try {
            if (map.current.getLayer(layerId)) map.current.removeLayer(layerId)
            if (map.current.getSource(sourceId)) map.current.removeSource(sourceId)
          } catch (_) {}

          map.current.addSource(sourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: { type: 'LineString', coordinates: coords },
            },
          })
          map.current.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': 'rgba(255,255,255,0.25)',
              'line-width': 1.5,
            },
          })
        }
      })
      .catch(() => {})

    return () => {
      isMounted = false
    }
  }, [focusStormId, selectedStorm?.id, styleLoaded, storms])

  // ── Prediction cones ────────────────────────────────────────────
  useEffect(() => {
    if (!map.current || !styleLoaded) return

    storms.forEach((storm) => {
      const pred = predictions[storm.id]
      const lat = storm.lat ?? storm.latitude
      const lon = storm.lon ?? storm.longitude
      if (!pred || lat == null || lon == null) return

      const sourceId = `cone-${storm.id}`
      const layerId = `cone-fill-${storm.id}`

      const steps = 16
      const coneRadius = 3
      const coords = []
      coords.push([lon, lat])
      for (let i = 0; i <= steps; i++) {
        const angle = (i / steps) * 180 - 90
        const rad = (angle * Math.PI) / 180
        coords.push([
          lon + coneRadius * Math.sin(rad),
          lat + coneRadius * Math.cos(rad),
        ])
      }
      coords.push([lon, lat])

      const geojson = {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [coords] },
      }

      try {
        if (!map.current.getSource(sourceId)) {
          map.current.addSource(sourceId, { type: 'geojson', data: geojson })
          map.current.addLayer({
            id: layerId,
            type: 'fill',
            source: sourceId,
            paint: { 'fill-color': '#00d4ff', 'fill-opacity': 0.1 },
          })
          map.current.addLayer({
            id: `${layerId}-line`,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': '#00d4ff',
              'line-opacity': 0.3,
              'line-width': 1.5,
              'line-dasharray': [3, 3],
            },
          })
        } else {
          map.current.getSource(sourceId).setData(geojson)
        }
      } catch (_) {}
    })
  }, [storms, predictions, styleLoaded])

  // ── Dynamic Weather Overlay (Radar / Satellite) ────────────────
  useEffect(() => {
    if (!map.current || !styleLoaded) return

    const SOURCE_ID = 'mapview-weather-source'
    const LAYER_ID  = 'mapview-weather-layer'

    try {
      if (map.current.getLayer(LAYER_ID)) map.current.removeLayer(LAYER_ID)
      if (map.current.getSource(SOURCE_ID)) map.current.removeSource(SOURCE_ID)
    } catch (_) {}

    if (!weatherOverlay || weatherOverlay === 'wind') return

    let tileUrl = null
    if (weatherOverlay === 'radar') {
      tileUrl = 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png'
    } else if (weatherOverlay === 'satellite') {
      tileUrl = 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/goes-east-ir-4km-900913/{z}/{x}/{y}.png'
    }

    if (tileUrl) {
      try {
        map.current.addSource(SOURCE_ID, {
          type: 'raster',
          tiles: [tileUrl],
          tileSize: 256,
        })
        const beforeId = map.current.getLayer('labels') ? 'labels' : undefined
        map.current.addLayer(
          {
            id: LAYER_ID,
            type: 'raster',
            source: SOURCE_ID,
            paint: { 'raster-opacity': 0.8 },
          },
          beforeId
        )
      } catch (err) {
        console.warn('[MapView] overlay error:', err)
      }
    }
  }, [weatherOverlay, styleLoaded])

  return (
    <>
      <div
        ref={mapContainer}
        className="w-full h-full"
        style={{ background: '#0a0f1a' }}
      />
      {/* Animated danger-zone rings per storm */}
      {mapReady && (
        <WindRadiusRings map={map.current} storms={storms} />
      )}
      {/* Animated Wind Particle Streamlines Overlay */}
      {mapReady && weatherOverlay === 'wind' && (
        <WindParticleCanvas map={map.current} storms={storms} visible={true} particleCount={240} />
      )}
    </>
  )
}
