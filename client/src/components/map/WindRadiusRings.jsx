import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'

/**
 * WindRadiusRings — Animated concentric danger-zone rings per storm.
 *
 * Three rings per storm:
 *   • Inner  → Red    (#ff2244) — 34-kt wind radius (max danger)
 *   • Middle → Amber  (#ffaa00) — 50-kt wind radius boundary
 *   • Outer  → Green  (#00c896) — 64-kt or watch boundary
 *
 * Ring radii come from storm.wind_radii_34kt / 50kt / 64kt (nm).
 * Falls back to 40 / 70 / 100 pixel radii when data is unavailable.
 * CAT 4/5 storms pulse at 1.2s; others at 2.5s.
 *
 * @param {maplibregl.Map} map    - The live MapLibre map instance
 * @param {Array}          storms - Storm objects from the store
 */
export default function WindRadiusRings({ map, storms }) {
  const ringMarkers = useRef({}) // stormId → [Marker, Marker, Marker]

  useEffect(() => {
    if (!map) return

    const FALLBACK_PX = [40, 70, 100]
    const COLORS      = ['#ff2244', '#ffaa00', '#00c896']
    const RING_LABELS = ['34kt', '50kt', '64kt']
    const RADII_KEYS  = ['wind_radii_34kt', 'wind_radii_50kt', 'wind_radii_64kt']

    /**
     * Convert nautical miles to approximate CSS pixels at the current zoom.
     * 1 nm ≈ 1852 m. At zoom z, one pixel represents (78271.5 / 2^z) metres
     * at the equator. We scale by cos(lat) for latitude correction.
     */
    function nmToPx(nm, lat, zoom) {
      const metersPerPx = (78271.5 / Math.pow(2, zoom)) * Math.cos((lat * Math.PI) / 180)
      return (nm * 1852) / metersPerPx
    }

    function buildRingEl(storm) {
      const isCritical = storm.category >= 4
      const pulseDuration = isCritical ? '1.2s' : '2.5s'

      const zoom = map.getZoom ? map.getZoom() : 4
      const lat  = storm.lat ?? storm.latitude ?? 20

      const radiiPx = RADII_KEYS.map((key, i) => {
        const nmVal = storm[key]
        if (nmVal && nmVal > 0) return nmToPx(nmVal, lat, zoom)
        return FALLBACK_PX[i]
      })

      // Outer container sized to the largest ring + padding
      const maxPx   = Math.max(...radiiPx)
      const sizePx  = maxPx * 2 + 20
      const centerPx = sizePx / 2

      const wrapper = document.createElement('div')
      wrapper.className = 'wind-ring-container'
      wrapper.style.cssText = `
        width: ${sizePx}px;
        height: ${sizePx}px;
        position: relative;
        pointer-events: none;
      `

      COLORS.forEach((color, i) => {
        const ring = document.createElement('div')
        const r    = radiiPx[i]
        ring.className = 'wind-ring'
        ring.setAttribute('data-ring', RING_LABELS[i])
        ring.style.cssText = `
          position: absolute;
          left: ${centerPx - r}px;
          top:  ${centerPx - r}px;
          width:  ${r * 2}px;
          height: ${r * 2}px;
          border-radius: 50%;
          border: 2px solid ${color};
          background: ${color}08;
          box-shadow: 0 0 12px ${color}40, inset 0 0 8px ${color}10;
          animation: wind-ring-pulse ${pulseDuration} ease-out infinite;
          animation-delay: ${i * (parseFloat(pulseDuration) / 3)}s;
          pointer-events: none;
        `
        wrapper.appendChild(ring)
      })

      // Storm center dot
      const dot = document.createElement('div')
      dot.style.cssText = `
        position: absolute;
        left: ${centerPx - 5}px;
        top:  ${centerPx - 5}px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #ff2244;
        box-shadow: 0 0 10px #ff2244, 0 0 20px #ff224480;
        animation: wind-ring-core-pulse ${pulseDuration} ease-in-out infinite;
        pointer-events: none;
      `
      wrapper.appendChild(dot)

      return { el: wrapper, sizePx }
    }

    // ── Add / update markers ─────────────────────────────────────────
    const currentIds = new Set(storms.map((s) => s.id))

    // Remove stale
    Object.keys(ringMarkers.current).forEach((id) => {
      if (!currentIds.has(id)) {
        ringMarkers.current[id].forEach((m) => m.remove())
        delete ringMarkers.current[id]
      }
    })

    // Add / refresh
    storms.forEach((storm) => {
      const lat = storm.lat ?? storm.latitude
      const lon = storm.lon ?? storm.longitude
      if (lat == null || lon == null) return

      // Remove existing rings for this storm before rebuilding
      if (ringMarkers.current[storm.id]) {
        ringMarkers.current[storm.id].forEach((m) => m.remove())
      }

      const { el, sizePx } = buildRingEl(storm)
      const halfPx = sizePx / 2

      const marker = new maplibregl.Marker({
        element: el,
        anchor: 'center',
        offset: [0, 0],
      })
        .setLngLat([lon, lat])
        .addTo(map)

      ringMarkers.current[storm.id] = [marker]
    })

    // Rebuild rings when zoom changes (radii depend on zoom level)
    const onZoom = () => {
      storms.forEach((storm) => {
        const lat = storm.lat ?? storm.latitude
        const lon = storm.lon ?? storm.longitude
        if (lat == null || lon == null) return
        if (ringMarkers.current[storm.id]) {
          ringMarkers.current[storm.id].forEach((m) => m.remove())
        }
        const { el } = buildRingEl(storm)
        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([lon, lat])
          .addTo(map)
        ringMarkers.current[storm.id] = [marker]
      })
    }

    map.on('zoom', onZoom)

    return () => {
      map.off('zoom', onZoom)
      Object.values(ringMarkers.current).forEach((markers) =>
        markers.forEach((m) => m.remove())
      )
      ringMarkers.current = {}
    }
  }, [map, storms])

  return null // purely imperative — no JSX rendered
}
