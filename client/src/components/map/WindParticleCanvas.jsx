import { useEffect, useRef } from 'react'

/**
 * WindParticleCanvas — High-performance HTML5 canvas overlay rendering
 * animated wind streamlines and cyclonic spiral vectors.
 *
 * Physics & Aesthetics:
 * - Calculates wind velocity vectors combining global trade winds and
 *   cyclonic rotation around each active storm.
 * - Colors particles by velocity: Cyan (calm) -> Green (gale) -> Orange (storm) -> Red (hurricane).
 * - Smooth fade trails using semi-transparent canvas clearing.
 * - Automatically resizes and repositions with MapLibre pan/zoom.
 */
export default function WindParticleCanvas({ map, storms = [], visible = true, particleCount = 200 }) {
  const canvasRef = useRef(null)
  const animFrameRef = useRef(null)
  const particlesRef = useRef([])

  useEffect(() => {
    if (!map || !visible) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = (canvas.width = canvas.parentElement.clientWidth)
    let height = (canvas.height = canvas.parentElement.clientHeight)

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return
      width = canvas.width = canvas.parentElement.clientWidth
      height = canvas.height = canvas.parentElement.clientHeight
    }

    // Initialize particles
    const initParticle = () => {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        age: Math.floor(Math.random() * 80),
        maxAge: 60 + Math.floor(Math.random() * 60),
        speed: 1.5 + Math.random() * 2,
      }
    }

    particlesRef.current = Array.from({ length: particleCount }, initParticle)

    // Compute wind vector at a given screen coordinate (px, py)
    const getWindAtScreen = (px, py) => {
      let vx = 1.0 // default easterly/westerly trade wind
      let vy = 0.0
      let maxSpeed = 15 // knots equivalent

      // Project screen point to [lon, lat]
      try {
        const lngLat = map.unproject([px, py])
        const lat = lngLat.lat
        const lon = lngLat.lng

        // Global planetary trade winds
        // Tropics (0-28°): Easterly (flowing westward, vx < 0)
        // Mid-latitudes (30-60°): Westerly (flowing eastward, vx > 0)
        if (Math.abs(lat) < 28) {
          vx = -1.8
          vy = lat > 0 ? 0.3 : -0.3
        } else {
          vx = 1.6
          vy = lat > 0 ? -0.2 : 0.2
        }

        // Add storm vortices
        storms.forEach((storm) => {
          const sLat = storm.lat ?? storm.latitude
          const sLon = storm.lon ?? storm.longitude
          if (sLat == null || sLon == null) return

          const stormPt = map.project([sLon, sLat])
          const dx = px - stormPt.x
          const dy = py - stormPt.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          // Influence radius depends on map zoom (~300px on screen)
          const radius = 350
          if (dist < radius && dist > 5) {
            const intensity = (1 - dist / radius)
            const stormKts = storm.wind_speed || 65

            // Cyclonic rotation:
            // Northern hemisphere rotates counter-clockwise (tangent vector [-dy, dx])
            // Southern hemisphere rotates clockwise (tangent vector [dy, -dx])
            const isNorth = sLat >= 0
            const tangX = isNorth ? dy / dist : -dy / dist
            const tangY = isNorth ? -dx / dist : dx / dist

            // Inflow towards eye (convergence)
            const inX = -dx / dist * 0.35
            const inY = -dy / dist * 0.35

            const vortexStrength = intensity * (stormKts / 20) * 2.2
            vx += (tangX + inX) * vortexStrength
            vy += (tangY + inY) * vortexStrength

            maxSpeed = Math.max(maxSpeed, stormKts * intensity)
          }
        })
      } catch (_) {}

      return { vx, vy, speed: maxSpeed }
    }

    // Animation Loop
    let running = true
    const render = () => {
      if (!running) return

      // Trail effect: clear with high-opacity dark fade
      ctx.fillStyle = 'rgba(10, 15, 26, 0.12)'
      ctx.fillRect(0, 0, width, height)

      const particles = particlesRef.current

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        const wind = getWindAtScreen(p.x, p.y)

        const oldX = p.x
        const oldY = p.y

        p.x += wind.vx * p.speed
        p.y += wind.vy * p.speed
        p.age++

        // Reset if off-screen or expired
        if (p.x < 0 || p.x > width || p.y < 0 || p.y > height || p.age > p.maxAge) {
          particles[i] = initParticle()
          continue
        }

        // Color based on wind intensity
        let strokeColor = 'rgba(0, 212, 255, 0.45)' // Calm: Cyan
        if (wind.speed > 64) {
          strokeColor = 'rgba(255, 45, 85, 0.85)' // Hurricane: Red
        } else if (wind.speed > 48) {
          strokeColor = 'rgba(255, 140, 0, 0.75)' // Storm: Amber
        } else if (wind.speed > 30) {
          strokeColor = 'rgba(0, 229, 160, 0.65)' // Gale: Green
        }

        ctx.strokeStyle = strokeColor
        ctx.lineWidth = wind.speed > 50 ? 2.0 : 1.4
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(oldX, oldY)
        ctx.lineTo(p.x, p.y)
        ctx.stroke()
      }

      animFrameRef.current = requestAnimationFrame(render)
    }

    map.on('resize', handleResize)
    map.on('movestart', () => {
      // Clear canvas on fast drag
      ctx.clearRect(0, 0, width, height)
    })

    render()

    return () => {
      running = false
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (map) {
        map.off('resize', handleResize)
      }
    }
  }, [map, storms, visible, particleCount])

  if (!visible) return null

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    />
  )
}
