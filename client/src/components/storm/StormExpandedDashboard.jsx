import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast, { Toaster } from 'react-hot-toast'
import {
  FiX,
  FiMinimize2,
  FiTrendingUp,
  FiTrendingDown,
  FiMinus,
  FiActivity,
  FiDroplet,
  FiWind,
  FiCompass,
  FiThermometer,
  FiShield,
  FiClock,
  FiLayers,
  FiBarChart2,
  FiAlertOctagon,
  FiMaximize2,
} from 'react-icons/fi'
import { BsExclamationTriangleFill, BsLightningChargeFill } from 'react-icons/bs'
import { MdCyclone, MdWaves, MdThunderstorm, MdSpeed } from 'react-icons/md'
import { getCategoryColor, getCategoryLabel } from '../../utils/stormColors'
import { formatBasin, formatLat, formatLon, windToKph } from '../../utils/formatters'

// ─── Full-page Card Graph Modal ───────────────────────────────────────────────
function CardGraphModal({ card, onClose }) {
  const [hovered, setHovered] = useState(null)
  if (!card) return null

  const { title, subtitle, color, icon: Icon, data, unit, stats, accentRows } = card

  const W = 900, H = 320
  const PAD_L = 56, PAD_R = 32, PAD_T = 36, PAD_B = 44

  const vals = data.map(d => d.value)
  const minV = Math.min(...vals)
  const maxV = Math.max(...vals)
  const range = maxV - minV || 1

  const pts = data.map((d, i) => {
    const x = PAD_L + (i / (data.length - 1)) * (W - PAD_L - PAD_R)
    const y = PAD_T + (H - PAD_T - PAD_B) - ((d.value - minV) / range) * (H - PAD_T - PAD_B)
    return { ...d, x, y }
  })

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${(H - PAD_B).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(H - PAD_B).toFixed(1)} Z`

  // Y-axis grid labels (5 levels)
  const gridLevels = [0, 0.25, 0.5, 0.75, 1].map(r => ({
    y: PAD_T + (H - PAD_T - PAD_B) * (1 - r),
    val: (minV + r * range).toFixed(1)
  }))

  const nowPt = pts.find(p => p.label === 'NOW') || pts[2]

  return (
    <motion.div
      className="card-graph-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.div
        className="card-graph-modal"
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.96 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="cgm-header" style={{ borderBottomColor: `${color}33` }}>
          <div className="cgm-header-left">
            <div className="cgm-icon-box" style={{ background: `${color}18`, color }}>
              <Icon size={22} />
            </div>
            <div>
              <h2 className="cgm-title" style={{ color }}>{title}</h2>
              <p className="cgm-subtitle">{subtitle}</p>
            </div>
          </div>
          <button className="cgm-close-btn" onClick={onClose} title="Close">
            <FiX size={18} />
          </button>
        </div>

        {/* Stat row */}
        <div className="cgm-stat-row">
          {stats.map((s, i) => (
            <div key={i} className="cgm-stat-cell" style={{ borderLeftColor: i === 0 ? color : 'rgba(255,255,255,0.08)' }}>
              <span className="cgm-stat-label">{s.label}</span>
              <span className="cgm-stat-val" style={{ color: s.color || color }}>{s.value}</span>
              {s.note && <span className="cgm-stat-note">{s.note}</span>}
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="cgm-chart-wrap">
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="cgm-area-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.32" />
                <stop offset="80%" stopColor={color} stopOpacity="0.04" />
                <stop offset="100%" stopColor={color} stopOpacity="0.0" />
              </linearGradient>
              <filter id="cgm-glow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Y-axis grid */}
            {gridLevels.map((g, i) => (
              <g key={i}>
                <line x1={PAD_L} y1={g.y} x2={W - PAD_R} y2={g.y}
                  stroke={i === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}
                  strokeDasharray={i === 0 ? 'none' : '5 5'} />
                <text x={PAD_L - 8} y={g.y + 4} fill="rgba(255,255,255,0.3)"
                  fontSize="11" textAnchor="end" fontFamily="monospace">
                  {g.val}
                </text>
              </g>
            ))}

            {/* Vertical markers */}
            {pts.map((p, i) => (
              <line key={i}
                x1={p.x} y1={PAD_T} x2={p.x} y2={H - PAD_B}
                stroke={p.label === 'NOW' ? `${color}55` : 'rgba(255,255,255,0.04)'}
                strokeWidth={p.label === 'NOW' ? 1.5 : 1}
                strokeDasharray={p.label === 'NOW' ? 'none' : '3 5'} />
            ))}

            {/* NOW vertical label */}
            <text x={nowPt.x} y={PAD_T - 10} fill={color}
              fontSize="10" textAnchor="middle" fontFamily="monospace" fontWeight="700" letterSpacing="0.08em">
              NOW
            </text>

            {/* Area fill */}
            <path d={areaPath} fill="url(#cgm-area-grad)" />

            {/* Line */}
            <path d={linePath} fill="none" stroke={color} strokeWidth="2.8"
              strokeLinecap="round" strokeLinejoin="round"
              filter="url(#cgm-glow)" />

            {/* Hover target rects (invisible, full column) */}
            {pts.map((p, i) => (
              <rect key={i}
                x={i === 0 ? PAD_L : (pts[i - 1].x + p.x) / 2}
                y={PAD_T}
                width={i === 0
                  ? (pts[1].x - p.x) / 2
                  : i === pts.length - 1
                  ? (p.x - pts[i - 1].x) / 2
                  : (pts[i + 1].x - pts[i - 1].x) / 2}
                height={H - PAD_T - PAD_B}
                fill="transparent"
                style={{ cursor: 'crosshair' }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            ))}

            {/* Data points */}
            {pts.map((p, i) => {
              const isHov = hovered === i
              const isNow = p.label === 'NOW'
              return (
                <g key={i}>
                  {isHov && (
                    <line x1={p.x} y1={PAD_T} x2={p.x} y2={H - PAD_B}
                      stroke={color} strokeWidth="1" opacity="0.4" />
                  )}
                  <circle cx={p.x} cy={p.y}
                    r={isHov ? 8 : isNow ? 6 : 4}
                    fill={isNow ? '#fff' : color}
                    stroke={isHov ? '#fff' : 'var(--bg-void)'}
                    strokeWidth={isHov ? 2 : 1.5}
                    style={{ transition: 'r 0.15s' }} />
                  {/* Hover tooltip */}
                  {isHov && (
                    <g>
                      <rect
                        x={Math.min(p.x - 44, W - PAD_R - 88)}
                        y={p.y - 52}
                        width="88" height="40" rx="8"
                        fill="rgba(8,11,22,0.95)"
                        stroke={color} strokeWidth="1" />
                      <text
                        x={Math.min(p.x, W - PAD_R - 44)}
                        y={p.y - 34}
                        fill="rgba(255,255,255,0.55)" fontSize="10"
                        textAnchor="middle" fontFamily="monospace">
                        {p.label}
                      </text>
                      <text
                        x={Math.min(p.x, W - PAD_R - 44)}
                        y={p.y - 18}
                        fill={color} fontSize="14" fontWeight="700"
                        textAnchor="middle" fontFamily="monospace">
                        {p.value.toFixed(1)}{unit}
                      </text>
                    </g>
                  )}
                </g>
              )
            })}

            {/* X-axis labels */}
            {pts.map((p, i) => (
              <text key={i} x={p.x} y={H - PAD_B + 20}
                fill={p.label === 'NOW' ? color : 'rgba(255,255,255,0.3)'}
                fontSize="11" fontWeight={p.label === 'NOW' ? '700' : '400'}
                textAnchor="middle" fontFamily="monospace">
                {p.label}
              </text>
            ))}

            {/* Y-axis unit label */}
            <text x={PAD_L - 10} y={PAD_T - 14}
              fill={color} fontSize="11" fontWeight="700"
              textAnchor="end" fontFamily="monospace" letterSpacing="0.06em">
              {unit}
            </text>
          </svg>
        </div>

        {/* Accent info rows */}
        {accentRows && accentRows.length > 0 && (
          <div className="cgm-accent-rows">
            {accentRows.map((row, i) => (
              <div key={i} className="cgm-accent-item">
                <span className="cgm-accent-key">{row.key}</span>
                <span className="cgm-accent-val" style={{ color: row.color || 'var(--text-primary)' }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="cgm-footer">
          <FiActivity size={12} style={{ color: 'rgba(255,255,255,0.3)' }} />
          <span>Timeline: -12h observed → +48h AI ensemble forecast · Click anywhere outside to close</span>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Animated cyclone spiral SVG ─────────────────────────────────────────────
function CyclonePatternChart({ wind, pressure, rh, sst, riProb, color }) {
  const [rotation, setRotation] = useState(0)
  const rafRef = useRef(null)
  const lastTimeRef = useRef(null)

  useEffect(() => {
    const animate = (ts) => {
      if (lastTimeRef.current !== null) {
        const delta = ts - lastTimeRef.current
        setRotation(r => (r + delta * 0.018) % 360)
      }
      lastTimeRef.current = ts
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  const CX = 200, CY = 200, RINGS = 5, MAX_R = 160
  const armColors = ['#ff3b52', '#ff7a3b', '#ffb020', '#2fd8c4']

  const buildSpiral = (startAngle, numPoints, maxRadius) => {
    const points = []
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints
      const angle = startAngle + t * Math.PI * 4.5
      const r = maxRadius * Math.pow(t, 0.55)
      points.push({ x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) })
    }
    return points
  }
  const spiralToPath = (pts) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')

  const arms = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5]

  return (
    <div className="cyclone-pattern-container">
      <div className="cyclone-pattern-top">
        <div className="cyclone-spiral-wrap">
          <svg viewBox="0 0 400 400" width="100%" style={{ maxWidth: 400 }}>
            <defs>
              <filter id="spiral-glow">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            {Array.from({ length: RINGS }, (_, i) => {
              const r = ((i + 1) / RINGS) * MAX_R
              return <circle key={i} cx={CX} cy={CY} r={r}
                fill="none" stroke={i === 0 ? `${color}22` : 'rgba(255,255,255,0.04)'}
                strokeWidth={i === 0 ? 0.8 : 0.5}
                strokeDasharray={i > 0 ? '3 5' : 'none'} />
            })}
            {[25, 50, 75, 100].map((pct, i) => (
              <text key={i} x={CX + (pct / 100) * MAX_R + 4} y={CY - 4}
                fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="monospace">{pct}%</text>
            ))}
            <line x1={CX - MAX_R - 8} y1={CY} x2={CX + MAX_R + 8} y2={CY} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
            <line x1={CX} y1={CY - MAX_R - 8} x2={CX} y2={CY + MAX_R + 8} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
            <g transform={`rotate(${rotation}, ${CX}, ${CY})`}>
              {arms.map((startAngle, ai) => (
                <path key={ai}
                  d={spiralToPath(buildSpiral(startAngle, 120, MAX_R * 0.92))}
                  fill="none" stroke={armColors[ai]}
                  strokeWidth={ai === 0 ? 2.2 : 1.6}
                  strokeLinecap="round" opacity={0.75}
                  filter="url(#spiral-glow)" />
              ))}
            </g>
            <circle cx={CX} cy={CY} r={MAX_R * 0.115}
              fill="rgba(255,26,46,0.08)" stroke="#ff1a2e" strokeWidth="1.8"
              style={{ filter: 'drop-shadow(0 0 8px #ff1a2e88)' }} />
            <circle cx={CX} cy={CY} r={MAX_R * 0.055}
              fill="rgba(10,14,26,0.95)" stroke="rgba(255,80,80,0.4)" strokeWidth="1" />
            <text x={CX} y={CY + 4} textAnchor="middle" fill="rgba(255,255,255,0.5)"
              fontSize="7" fontFamily="monospace" letterSpacing="0.05em">EYE</text>
          </svg>
          <div className="spiral-label-row">
            <span className="spiral-label-badge"><MdCyclone size={12} /> Cyclonic Band Pattern</span>
            <span className="spiral-label-note">Logarithmic spiral · Animated wind band structure</span>
          </div>
        </div>

        <div className="cyclone-pattern-bars">
          <div className="cpb-title">Core Intensity Profile</div>
          {[
            { label: 'Eye (calm)',       value: 5,               max: 100,  color: '#ffffff33', unit: '%'   },
            { label: 'Eyewall Wind',     value: Math.round(wind),max: 185,  color: '#ff3b52',   unit: 'kt'  },
            { label: 'Central Pressure', value: Math.round(pressure), max: 1013, color: '#ff9d4d', unit: 'hPa', invert: true },
            { label: 'SST (Fuel)',       value: sst,             max: 32,   color: '#2fd8c4',   unit: '°C'  },
            { label: 'Mid-Level RH',     value: rh,              max: 100,  color: '#7c8cf8',   unit: '%'   },
            { label: 'RI Probability',   value: riProb,          max: 100,  color: riProb >= 40 ? '#ff3b52' : '#ffb020', unit: '%' },
          ].map((bar, i) => {
            const fillPct = bar.invert
              ? Math.max(0, Math.min(100, ((bar.max - bar.value) / bar.max) * 100 * 1.5))
              : Math.max(0, Math.min(100, (bar.value / bar.max) * 100))
            return (
              <div key={i} className="cpb-row">
                <div className="cpb-label-row">
                  <span className="cpb-label">{bar.label}</span>
                  <span className="cpb-val" style={{ color: bar.color }}>{bar.value}{bar.unit}</span>
                </div>
                <div className="cpb-track">
                  <motion.div className="cpb-fill" style={{ background: bar.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${fillPct}%` }}
                    transition={{ duration: 1.1, delay: i * 0.1, ease: 'easeOut' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="cyclone-track-chart">
        <div className="track-chart-title">
          <FiActivity size={13} style={{ color: 'var(--accent-cyan)' }} />
          <span>Cyclone Intensity Timeline — Wind Band Evolution</span>
        </div>
        <div className="track-chart-desc">Spiral tightens as storm intensifies · Each color band = a different wind zone</div>
        <div className="track-color-bands">
          {[
            { label: 'Eye Wall',         color: '#ff3b52', desc: 'Max sustained winds' },
            { label: 'Inner Rainbands',  color: '#ff9d4d', desc: 'Heavy rain & gusts' },
            { label: 'Outer Bands',      color: '#ffb020', desc: 'Tropical storm force' },
            { label: 'Circulation Limit',color: '#2fd8c4', desc: 'Outer wind field' },
          ].map((b, i) => (
            <div key={i} className="track-band-item">
              <span className="track-band-dot" style={{ background: b.color }} />
              <span className="track-band-label">{b.label}</span>
              <span className="track-band-desc">{b.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

import { fireDangerToast } from '../../utils/dangerAlerts'

// ─── Main component ───────────────────────────────────────────────────────────
export default function StormExpandedDashboard({ storm, prediction, onClose, onMinimize, initialCardGraph = null }) {
  const [activeTab, setActiveTab] = useState('all')
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [activeChart, setActiveChart] = useState('wind-pressure')
  const [activeCardGraph, setActiveCardGraph] = useState(initialCardGraph) // the card config for the full-page modal
  const alertsFiredRef = useRef(false)

  const color = storm ? getCategoryColor(storm.category) : '#2fd8c4'
  const catLabel = storm ? getCategoryLabel(storm.category) : 'UNKNOWN'
  const wind = storm?.wind_speed || 0
  const pressure = storm?.pressure || 1010
  const lat = storm?.lat ?? storm?.latitude ?? 20.0
  const lon = storm?.lon ?? storm?.longitude ?? -120.0

  const pred = prediction || {}
  const sst = pred.sst ?? 29.2
  const sstAnomaly = pred.sst_anomaly ?? 1.4
  const ohc = pred.ocean_heat_content ?? 74.0
  const windShear = pred.wind_shear ?? 13.5
  const shearDir = pred.shear_direction ?? 'NE'
  const shearStatus = pred.shear_status ?? (windShear < 10 ? 'Highly Favorable' : windShear <= 18 ? 'Moderate' : 'Disruptive')
  const rh = pred.relative_humidity ?? 78.0
  const tpw = pred.precipitable_water ?? 68.0
  const pDrop3h = pred.pressure_trend_3h ?? -2.1
  const pDrop24h = pred.pressure_trend_24h ?? -7.4
  const cloudTop = pred.convection?.cloud_top_temp_c ?? -78.5
  const burstCount = pred.convection?.burst_count ?? 32
  const symmetry = pred.convection?.eyewall_symmetry_pct ?? 84
  const cdoStructure = pred.convection?.cdo_structure ?? 'Curved Band Pattern'
  const riProb = Math.round((pred.ri_probability ?? 0.31) * 100)
  const isRI = pred.rapid_intensify ?? (riProb >= 40)
  const riDiagnostics = pred.ri_diagnostics ?? {
    sst_favorable: sst >= 28.0,
    shear_favorable: windShear <= 12.0,
    humidity_favorable: rh >= 70.0,
    convection_active: burstCount >= 25,
    outflow_strong: true,
    risk_level: riProb > 65 ? 'EXTREME' : riProb > 40 ? 'HIGH' : riProb > 20 ? 'MODERATE' : 'LOW'
  }

  // ── Fire danger alerts once ──────────────────────────────────────────────────
  useEffect(() => {
    if (alertsFiredRef.current) return
    alertsFiredRef.current = true
    const stormName = (storm?.name || 'This cyclone').toUpperCase()
    let delay = 800

    if (storm?.category >= 5) {
      setTimeout(() => fireDangerToast({
        Icon: BsExclamationTriangleFill,
        title: `CAT 5 EXTREME DANGER — ${stormName}`,
        message: `Catastrophic Category 5 hurricane with ${Math.round(wind)} kt sustained winds. Unsurvivable conditions near eye.`,
        advice: 'EVACUATE immediately. All coastal zones and barrier islands — leave NOW.',
        severity: 'danger'
      }), delay); delay += 1200
    } else if (storm?.category >= 4) {
      setTimeout(() => fireDangerToast({
        Icon: MdCyclone,
        title: `CAT 4 MAJOR HURRICANE — ${stormName}`,
        message: `Extreme Category 4 system. ${Math.round(wind)} kt winds, expected catastrophic structural damage.`,
        advice: 'Evacuate Zones A & B. Storm surge of 4–6m possible. Monitor NHC advisories.',
        severity: 'danger'
      }), delay); delay += 1200
    } else if (storm?.category >= 3) {
      setTimeout(() => fireDangerToast({
        Icon: MdCyclone,
        title: `CAT 3 MAJOR HURRICANE — ${stormName}`,
        message: `Major hurricane — ${Math.round(wind)} kt winds. Devastating damage likely in path.`,
        advice: 'Evacuate low-lying coastal areas. Prepare emergency supplies for 5+ days.',
        severity: 'warning'
      }), delay); delay += 1200
    }

    if (isRI) {
      setTimeout(() => fireDangerToast({
        Icon: BsLightningChargeFill,
        title: `RAPID INTENSIFICATION — ${stormName}`,
        message: `AI forecast: ≥30 kt wind increase in 24h. RI probability: ${riProb}%. ${riDiagnostics.risk_level} RISK.`,
        advice: 'Do NOT wait for updated advisories. Begin precautionary evacuation immediately.',
        severity: 'danger'
      }), delay); delay += 1200
    }

    if (Math.abs(pDrop24h) >= 15) {
      setTimeout(() => fireDangerToast({
        Icon: FiTrendingDown,
        title: `EXPLOSIVE DEEPENING — ${stormName}`,
        message: `Pressure dropping ${pDrop24h} hPa / 24h. Explosive intensification underway.`,
        advice: 'Structural changes occurring rapidly. Forecast tracks may shift — stay alert.',
        severity: 'warning'
      }), delay); delay += 1200
    }

    const allPrecursorsMet = riDiagnostics.sst_favorable && riDiagnostics.shear_favorable && riDiagnostics.humidity_favorable && riDiagnostics.convection_active
    if (allPrecursorsMet && !isRI) {
      setTimeout(() => fireDangerToast({
        Icon: FiAlertOctagon,
        title: `CONDITIONS CRITICAL — ${stormName}`,
        message: `All RI precursors met: warm SST (${sst}°C), low shear (${windShear} kt), saturated moisture. Intensification expected.`,
        advice: 'Monitor every 3-hour NHC advisory. Prepare emergency evacuation plan.',
        severity: 'warning'
      }), delay)
    }
  }, [storm, pred])

  // ── Timeline data ────────────────────────────────────────────────────────────
  const rawTimeline = pred.timeline && pred.timeline.length > 0 ? pred.timeline : [
    { time: '-12H', label: '12h Ago', wind: Math.max(20, wind - 5),           pressure: pressure + 4,  sst, shear: windShear + 1.2, rh: rh - 2 },
    { time: '-6H',  label: '6h Ago',  wind: Math.max(20, wind - 2),           pressure: pressure + 2,  sst, shear: windShear + 0.8, rh: rh - 1 },
    { time: 'NOW',  label: 'NOW',     wind,                                    pressure,                sst, shear: windShear,       rh },
    { time: '+6H',  label: '+6H',     wind: pred.wind_6hr  ?? (wind + 5),      pressure: pressure - 3,  sst: sst - 0.1, shear: windShear + 0.4, rh },
    { time: '+12H', label: '+12H',    wind: pred.wind_12hr ?? (wind + 8),      pressure: pressure - 6,  sst: sst - 0.2, shear: windShear + 0.6, rh: rh + 1 },
    { time: '+18H', label: '+18H',    wind: pred.wind_18hr ?? (wind + 12),     pressure: pressure - 9,  sst: sst - 0.3, shear: windShear + 0.9, rh: rh + 1 },
    { time: '+24H', label: '+24H',    wind: pred.wind_24hr ?? (wind + 14),     pressure: pressure - 12, sst: sst - 0.4, shear: windShear + 1.1, rh: rh + 2 },
    { time: '+36H', label: '+36H',    wind: pred.wind_36hr ?? (wind + 10),     pressure: pressure - 9,  sst: sst - 0.5, shear: windShear + 1.4, rh: rh + 1 },
    { time: '+48H', label: '+48H',    wind: pred.wind_48hr ?? (wind + 6),      pressure: pressure - 5,  sst: sst - 0.7, shear: windShear + 1.8, rh },
  ]

  // ── Card configs — what each card opens in the full modal ─────────────────
  const cardGraphConfigs = {
    sst: {
      title: 'Sea Surface Temperature',
      subtitle: 'Oceanic thermal reservoir & cyclone fuel · -12h observation to +48h projection',
      color: '#ff9d4d',
      icon: MdWaves,
      unit: '°C',
      data: rawTimeline.map(d => ({ label: d.label, value: d.sst })),
      stats: [
        { label: 'Current SST',    value: `${sst}°C`,         color: '#ff9d4d' },
        { label: '30yr Anomaly',   value: `+${sstAnomaly}°C`, color: 'var(--accent-green)', note: 'vs climatology' },
        { label: 'OHC',            value: `${ohc} kJ/cm²`,    color: 'var(--text-primary)' },
        { label: 'Threshold',      value: '26.5°C',           color: '#ff3b52', note: 'Cyclogenesis min' },
      ],
      accentRows: [
        { key: 'Isotherm 26°C Depth',  value: '~65 meters (Deep warm pool)' },
        { key: 'Thermal Assessment',   value: 'High thermal flux sustains rapid convection', color: 'var(--accent-green)' },
        { key: 'Status vs Threshold',  value: `${(sst - 26.5).toFixed(1)}°C above cyclogenesis threshold`, color: '#ff9d4d' },
      ]
    },
    shear: {
      title: 'Vertical Wind Shear (VWS)',
      subtitle: 'Deep-layer 850–200 hPa environmental shear · Lower = more favorable for intensification',
      color: 'var(--accent-green)',
      icon: FiWind,
      unit: 'kt',
      data: rawTimeline.map(d => ({ label: d.label, value: d.shear })),
      stats: [
        { label: 'Current Shear', value: `${windShear} kt`,  color: windShear < 12 ? 'var(--accent-green)' : '#ffb020' },
        { label: 'Direction',     value: `${shearDir}`,      color: 'var(--text-primary)' },
        { label: 'Status',        value: shearStatus,        color: windShear < 12 ? 'var(--accent-green)' : '#ffb020' },
        { label: 'Threshold',     value: '< 10 kt',          color: 'var(--accent-green)', note: 'Highly favorable' },
      ],
      accentRows: [
        { key: 'Vortex Vertical Tilt',  value: 'Minimal (<15 km tilt displacement)', color: 'var(--accent-green)' },
        { key: 'Dry Air Ventilation',   value: 'Suppressed — Intact Warm Core' },
        { key: 'Structural Impact',     value: windShear < 12 ? 'Upper tropospheric winds support symmetry' : 'Moderate structural stress on eyewall', color: windShear < 12 ? 'var(--accent-green)' : '#ffb020' },
      ]
    },
    rh: {
      title: 'Tropospheric Humidity',
      subtitle: 'Mid-level (700–500 hPa) relative humidity · Moisture envelope protects cyclone core',
      color: 'var(--accent-cyan)',
      icon: FiDroplet,
      unit: '%',
      data: rawTimeline.map(d => ({ label: d.label, value: d.rh })),
      stats: [
        { label: 'Mid-Level RH',   value: `${rh}%`,    color: 'var(--accent-cyan)' },
        { label: 'TPW',            value: `${tpw} mm`, color: 'var(--text-primary)', note: 'Precipitable water' },
        { label: 'Status',         value: rh > 75 ? 'Saturated' : rh > 60 ? 'Moist' : 'Dry', color: rh > 75 ? 'var(--accent-cyan)' : '#ffb020' },
        { label: 'Dry Air Risk',   value: 'Negligible (<10%)', color: 'var(--accent-green)' },
      ],
      accentRows: [
        { key: 'Saharan / Dry Air Intrusion', value: 'Negligible (<10%)', color: 'var(--accent-green)' },
        { key: 'Entrainment Vulnerability',   value: 'Low — Moist envelope protects core' },
        { key: 'Convective Feeder Bands',     value: 'Deep spiral inflows active', color: 'var(--accent-cyan)' },
      ]
    },
    pres: {
      title: 'Barometric Pressure Dynamics',
      subtitle: 'Central minimum pressure & deepening velocity · Lower = stronger storm',
      color: '#ff9d4d',
      icon: MdSpeed,
      unit: 'hPa',
      data: rawTimeline.map(d => ({ label: d.label, value: d.pressure })),
      stats: [
        { label: 'Central Pressure', value: `${Math.round(pressure)} hPa`, color: '#ffffff' },
        { label: 'Drop (3h)',         value: `${pDrop3h} hPa`,             color: 'var(--danger-red)' },
        { label: 'Drop (24h)',        value: `${pDrop24h} hPa`,            color: 'var(--danger-red)' },
        { label: 'Deepening Stage',   value: Math.abs(pDrop24h) >= 15 ? 'Explosive' : 'Progressive', color: 'var(--accent-amber)' },
      ],
      accentRows: [
        { key: 'Pressure Gradient Force', value: 'Elevated — Tightly packed isobars' },
        { key: 'Eye Outflow Efficiency',  value: 'Vigorous Upper-Level Radial Divergence', color: 'var(--accent-cyan)' },
        { key: 'Deepening Classification',value: Math.abs(pDrop24h) >= 15 ? 'Explosive cyclogenesis (>15 hPa/24h)' : 'Standard progressive deepening', color: Math.abs(pDrop24h) >= 15 ? '#ff3b52' : '#ffb020' },
      ]
    },
    conv: {
      title: 'Convection & Core Eyewall',
      subtitle: 'Infrared cloud-top temperature & lightning burst dynamics · Lower temp = deeper convection',
      color: '#7c8cf8',
      icon: MdThunderstorm,
      unit: '°C',
      data: rawTimeline.map((d, i) => ({ label: d.label, value: cloudTop - i * 0.5 + (i > 2 ? -1 : 0.3) })),
      stats: [
        { label: 'Cloud Top Temp', value: `${cloudTop}°C`,    color: '#7c8cf8' },
        { label: 'Burst Count',    value: `${burstCount}/hr`, color: 'var(--accent-amber)' },
        { label: 'Eyewall Sym.',   value: `${symmetry}%`,     color: 'var(--accent-green)' },
        { label: 'CDO Structure',  value: cdoStructure,       color: 'var(--text-primary)' },
      ],
      accentRows: [
        { key: 'Central Dense Overcast (CDO)', value: cdoStructure },
        { key: 'Overshooting Tops',            value: 'Detected (T < -75°C)', color: '#7c8cf8' },
        { key: 'Inner-Core Lightning',         value: `Active Eyewall Pulses — ${burstCount}/hr`, color: 'var(--accent-amber)' },
        { key: 'Eyewall Pinning',              value: 'Circular symmetric core consolidating', color: 'var(--accent-green)' },
      ]
    },
    ri: {
      title: 'Rapid Intensification (RI) Probability',
      subtitle: 'NOAA 24h threshold: ≥30 kt wind increase · LSTM + Random Forest AI ensemble',
      color: isRI ? '#ff3b52' : '#ffb020',
      icon: BsExclamationTriangleFill,
      unit: '%',
      data: rawTimeline.map((d, i) => ({
        label: d.label,
        value: Math.min(100, Math.max(0, riProb + (i - 2) * 4 - (i > 4 ? 3 : 0)))
      })),
      stats: [
        { label: 'RI Probability', value: `${riProb}%`,                   color: isRI ? '#ff3b52' : '#ffb020' },
        { label: 'Risk Level',     value: riDiagnostics.risk_level,       color: isRI ? '#ff3b52' : '#ffb020' },
        { label: 'SST Check',      value: riDiagnostics.sst_favorable ? 'PASS' : 'FAIL', color: riDiagnostics.sst_favorable ? 'var(--accent-green)' : '#ff3b52' },
        { label: 'Shear Check',    value: riDiagnostics.shear_favorable ? 'PASS' : 'FAIL', color: riDiagnostics.shear_favorable ? 'var(--accent-green)' : '#ff3b52' },
      ],
      accentRows: [
        { key: 'SST > 28°C',             value: riDiagnostics.sst_favorable ? `PASS — ${sst}°C warm water fuel` : `FAIL — ${sst}°C insufficient`, color: riDiagnostics.sst_favorable ? 'var(--accent-green)' : '#ff3b52' },
        { key: 'Shear < 12 kt',          value: riDiagnostics.shear_favorable ? `PASS — ${windShear} kt low shear` : `FAIL — ${windShear} kt disruptive`, color: riDiagnostics.shear_favorable ? 'var(--accent-green)' : '#ff3b52' },
        { key: 'Mid-Level RH > 70%',     value: riDiagnostics.humidity_favorable ? `PASS — ${rh}% saturated core` : `FAIL — ${rh}% insufficient`, color: riDiagnostics.humidity_favorable ? 'var(--accent-green)' : '#ff3b52' },
        { key: 'Convective Bursts',      value: riDiagnostics.convection_active ? `PASS — ${burstCount}/hr active pumping` : 'FAIL — insufficient convection', color: riDiagnostics.convection_active ? 'var(--accent-green)' : '#ff3b52' },
      ]
    }
  }

  // ── Main trend chart coords ──────────────────────────────────────────────────
  const svgWidth = 840, svgHeight = 260
  const padLeft = 60, padRight = 60, padTop = 30, padBottom = 40
  const plotWidth = svgWidth - padLeft - padRight
  const plotHeight = svgHeight - padTop - padBottom

  const allWinds = rawTimeline.map(d => d.wind)
  const minWind = Math.max(0, Math.floor(Math.min(...allWinds) / 10) * 10 - 10)
  const maxWind = Math.ceil(Math.max(...allWinds, 100) / 10) * 10 + 10
  const allPres = rawTimeline.map(d => d.pressure)
  const minPres = Math.floor(Math.min(...allPres, 920) / 10) * 10 - 10
  const maxPres = Math.ceil(Math.max(...allPres, 1010) / 10) * 10 + 5

  const points = rawTimeline.map((item, idx) => {
    const x = padLeft + (idx / (rawTimeline.length - 1)) * plotWidth
    const windNorm = (item.wind - minWind) / (maxWind - minWind || 1)
    const yWind = padTop + plotHeight - windNorm * plotHeight
    const presNorm = (item.pressure - minPres) / (maxPres - minPres || 1)
    const yPres = padTop + plotHeight - presNorm * plotHeight
    const ySst = padTop + plotHeight - ((item.sst - 25) / 7) * plotHeight
    const yShear = padTop + plotHeight - (item.shear / 30) * plotHeight
    return { ...item, x, yWind, yPres, ySst, yShear }
  })

  const windPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yWind.toFixed(1)}`).join(' ')
  const windArea = `${windPath} L ${points[points.length-1].x.toFixed(1)} ${(padTop+plotHeight).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padTop+plotHeight).toFixed(1)} Z`
  const presPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yPres.toFixed(1)}`).join(' ')
  const sstPath  = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.ySst.toFixed(1)}`).join(' ')
  const shearPath= points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yShear.toFixed(1)}`).join(' ')
  const activePoint = hoveredIndex !== null ? points[hoveredIndex] : points.find(p => p.time === 'NOW') || points[2]

  return (
    <motion.div
      className="rv-expanded-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Toaster position="top-right" containerStyle={{ top: 72 }} />

      {/* ── Full-page card graph modal ── */}
      <AnimatePresence>
        {activeCardGraph && (
          <CardGraphModal
            card={cardGraphConfigs[activeCardGraph]}
            onClose={() => setActiveCardGraph(null)}
          />
        )}
      </AnimatePresence>

      <div className="rv-expanded-window">

        {/* HEADER */}
        <div className="rv-expanded-header">
          <div className="rv-expanded-title-group">
            <div className="rv-expanded-badge-row">
              <span className="panel-cat-badge" style={{
                background: `${color}22`, border: `1px solid ${color}66`, color,
                padding: '4px 12px', fontSize: '12px'
              }}>{catLabel}</span>
              <div className="panel-active-indicator" style={{ fontSize: '12px' }}>
                <span className="panel-active-dot" /> ACTIVE CYCLONE TELEMETRY
              </div>
              <span className="rv-header-pill">
                <FiCompass size={13} style={{ color: 'var(--accent-cyan)' }} />
                {formatLat(lat)}, {formatLon(lon)}
              </span>
              <span className="rv-header-pill">
                {formatBasin(storm.basin)} Basin · ID: {storm.id}
              </span>
            </div>
            <div className="rv-expanded-storm-name">
              <MdCyclone size={34} style={{ color, filter: `drop-shadow(0 0 10px ${color}88)` }} />
              <h1>{(storm.name || 'Unnamed Cyclone').toUpperCase()}</h1>
              <span className="rv-expanded-ai-source">TRACE Ensemble AI · IBTrACS 50-Yr Calibration</span>
            </div>
          </div>
          <div className="rv-expanded-controls">
            <button className="rv-expanded-btn" onClick={onMinimize} title="Minimize to Side Card">
              <FiMinimize2 size={16} /><span>Minimize to Card</span>
            </button>
            <button className="rv-expanded-btn-close" onClick={onClose} title="Close to Full Map">
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* TELEMETRY RIBBON */}
        <div className="rv-telemetry-ribbon">
          <div className="telemetry-ribbon-cell" style={{ borderLeft: `3px solid ${color}` }}>
            <span className="ribbon-label">Sustained Wind</span>
            <div className="ribbon-val" style={{ color }}>
              {Math.round(wind)} <span className="ribbon-unit">kt</span>
              <span className="ribbon-sub">({windToKph(wind)} km/h)</span>
            </div>
          </div>
          <div className="telemetry-ribbon-cell">
            <span className="ribbon-label">Central Pressure</span>
            <div className="ribbon-val">
              {Math.round(pressure)} <span className="ribbon-unit">hPa</span>
              <span className="ribbon-sub" style={{ color: pDrop3h < -1 ? '#ff3b52' : 'var(--text-muted)' }}>
                {pDrop3h > 0 ? `+${pDrop3h}` : pDrop3h} hPa/3h
              </span>
            </div>
          </div>
          <div className="telemetry-ribbon-cell">
            <span className="ribbon-label">Sea Surface Temp (SST)</span>
            <div className="ribbon-val" style={{ color: sst >= 28.5 ? '#ff9d4d' : 'var(--accent-cyan)' }}>
              {sst}°C <span className="ribbon-unit">({((sst * 9) / 5 + 32).toFixed(1)}°F)</span>
              <span className="ribbon-sub" style={{ color: 'var(--accent-green)' }}>+{sstAnomaly}°C Anomaly</span>
            </div>
          </div>
          <div className="telemetry-ribbon-cell">
            <span className="ribbon-label">Vertical Wind Shear</span>
            <div className="ribbon-val" style={{ color: windShear < 12 ? 'var(--accent-green)' : '#ffb020' }}>
              {windShear} <span className="ribbon-unit">kt</span>
              <span className="ribbon-sub">Vector {shearDir} · {shearStatus}</span>
            </div>
          </div>
          <div className="telemetry-ribbon-cell">
            <span className="ribbon-label">Mid-Level RH (700-500mb)</span>
            <div className="ribbon-val" style={{ color: 'var(--accent-cyan)' }}>
              {rh}% <span className="ribbon-unit">RH</span>
              <span className="ribbon-sub">TPW {tpw} mm</span>
            </div>
          </div>
          <div className="telemetry-ribbon-cell" style={{
            background: isRI ? 'rgba(255,35,68,0.12)' : 'rgba(47,216,196,0.05)',
            borderRight: isRI ? '3px solid #ff2344' : 'none'
          }}>
            <span className="ribbon-label" style={{ color: isRI ? '#ff4d6a' : 'var(--text-muted)' }}>
              {isRI ? 'RAPID INTENSIFICATION' : 'RI Risk Status'}
            </span>
            <div className="ribbon-val" style={{ color: isRI ? '#ff2344' : 'var(--text-primary)' }}>
              {riProb}% <span className="ribbon-unit">Prob</span>
              <span className="ribbon-sub" style={{ color: isRI ? '#ff4d6a' : 'var(--accent-green)' }}>
                {riDiagnostics.risk_level} RISK
              </span>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="rv-expanded-tabs">
          {[
            { id: 'all',         label: 'Mission Overview',              icon: FiLayers },
            { id: 'environmental',label: 'SST & Wind Shear & Humidity',  icon: FiThermometer },
            { id: 'trends',      label: 'Pressure & Wind Dynamic Graphs',icon: FiActivity },
            { id: 'pattern',     label: 'Cyclone Pattern Chart',         icon: MdCyclone },
            { id: 'ri',          label: 'Rapid Intensification Engine',  icon: BsLightningChargeFill },
            { id: 'timeline',    label: 'Forecast Matrix (+48h)',         icon: FiClock },
          ].map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`rv-expanded-tab-btn ${isActive ? 'active' : ''}`}>
                <Icon size={14} />
                <span>{tab.label}</span>
                {tab.id === 'ri' && isRI && <span className="tab-ri-pill">ALERT</span>}
                {tab.id === 'pattern' && <span className="tab-new-pill">NEW</span>}
              </button>
            )
          })}
        </div>

        {/* BODY */}
        <div className="rv-expanded-body">

          {/* Main trend chart */}
          {(activeTab === 'all' || activeTab === 'trends') && (
            <div className="rv-expanded-card mb-20">
              <div className="chart-header-row">
                <div className="chart-title-group">
                  <div className="chart-title">
                    <FiActivity size={18} style={{ color: 'var(--accent-cyan)' }} />
                    <span>Dynamic Evolution & Trend Analysis</span>
                  </div>
                  <div className="chart-subtitle">
                    Synchronized timeline from -12h observation to +48h AI ensemble prediction
                  </div>
                </div>
                <div className="chart-switch-group">
                  <button className={`chart-switch-btn ${activeChart === 'wind-pressure' ? 'active' : ''}`}
                    onClick={() => setActiveChart('wind-pressure')}>
                    <FiWind size={13} /> Wind & Barometric Pressure
                  </button>
                  <button className={`chart-switch-btn ${activeChart === 'sst-shear' ? 'active' : ''}`}
                    onClick={() => setActiveChart('sst-shear')}>
                    <FiThermometer size={13} /> SST & Wind Shear
                  </button>
                </div>
              </div>

              <div className="chart-svg-container">
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="chart-svg" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <linearGradient id="windGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0.0" />
                    </linearGradient>
                    <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>
                  {[0.2,0.4,0.6,0.8].map((r,i) => (
                    <line key={i} x1={padLeft} y1={padTop+plotHeight*r} x2={svgWidth-padRight} y2={padTop+plotHeight*r}
                      stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                  ))}
                  {points.map(p => (
                    <line key={p.time} x1={p.x} y1={padTop} x2={p.x} y2={padTop+plotHeight}
                      stroke={p.time === 'NOW' ? 'rgba(47,216,196,0.35)' : 'rgba(255,255,255,0.04)'}
                      strokeWidth={p.time === 'NOW' ? 1.5 : 1}
                      strokeDasharray={p.time === 'NOW' ? 'none' : '3 3'} />
                  ))}

                  {activeChart === 'wind-pressure' && (
                    <>
                      <path d={windArea} fill="url(#windGradient)" />
                      <path d={windPath} fill="none" stroke="var(--accent-cyan)" strokeWidth="2.5" filter="url(#glowEffect)" />
                      <path d={presPath} fill="none" stroke="#ff9d4d" strokeWidth="2" strokeDasharray="6 3" />
                      {points.map((p,i) => (
                        <g key={i} style={{ cursor:'pointer' }} onMouseEnter={() => setHoveredIndex(i)}>
                          <circle cx={p.x} cy={p.yWind} r={hoveredIndex===i ? 6 : p.time==='NOW' ? 5 : 3.5}
                            fill={p.time==='NOW' ? '#fff' : 'var(--accent-cyan)'} stroke="var(--bg-void)" strokeWidth="2" />
                          <circle cx={p.x} cy={p.yPres} r={hoveredIndex===i ? 5 : 3}
                            fill="#ff9d4d" stroke="var(--bg-void)" strokeWidth="1.5" />
                        </g>
                      ))}
                    </>
                  )}

                  {activeChart === 'sst-shear' && (
                    <>
                      {(() => {
                        const y265 = padTop + plotHeight - ((26.5-25)/7)*plotHeight
                        return (
                          <g>
                            <line x1={padLeft} y1={y265} x2={svgWidth-padRight} y2={y265}
                              stroke="#ff3b52" strokeDasharray="5 3" strokeWidth="1.2" opacity="0.8" />
                            <text x={padLeft+8} y={y265-6} fill="#ff3b52" fontSize="10" fontFamily="var(--font-data)">
                              26.5°C Cyclogenesis Threshold
                            </text>
                          </g>
                        )
                      })()}
                      <path d={sstPath}   fill="none" stroke="#ff9d4d" strokeWidth="2.5" filter="url(#glowEffect)" />
                      <path d={shearPath} fill="none" stroke="#a78bfa" strokeWidth="2" strokeDasharray="5 4" />
                      {points.map((p,i) => (
                        <g key={i} style={{ cursor:'pointer' }} onMouseEnter={() => setHoveredIndex(i)}>
                          <circle cx={p.x} cy={p.ySst}   r={hoveredIndex===i ? 6 : 4} fill="#ff9d4d" stroke="var(--bg-void)" strokeWidth="2" />
                          <circle cx={p.x} cy={p.yShear} r={hoveredIndex===i ? 5 : 3.5} fill="#a78bfa" stroke="var(--bg-void)" strokeWidth="1.5" />
                        </g>
                      ))}
                    </>
                  )}

                  {points.map(p => (
                    <text key={p.time} x={p.x} y={padTop+plotHeight+20}
                      fill={p.time==='NOW' ? 'var(--accent-cyan)' : 'var(--text-muted)'}
                      fontSize="11" fontWeight={p.time==='NOW' ? '700' : '500'}
                      fontFamily="var(--font-data)" textAnchor="middle">{p.time}</text>
                  ))}
                  <text x={padLeft-10} y={padTop-8}
                    fill={activeChart==='wind-pressure' ? 'var(--accent-cyan)' : '#ff9d4d'}
                    fontSize="11" fontWeight="600" fontFamily="var(--font-data)" textAnchor="end">
                    {activeChart==='wind-pressure' ? 'Wind (kt)' : 'SST (°C)'}
                  </text>
                  <text x={svgWidth-padRight+10} y={padTop-8}
                    fill={activeChart==='wind-pressure' ? '#ff9d4d' : '#a78bfa'}
                    fontSize="11" fontWeight="600" fontFamily="var(--font-data)" textAnchor="start">
                    {activeChart==='wind-pressure' ? 'Pressure (hPa)' : 'Shear (kt)'}
                  </text>
                </svg>

                {activePoint && (
                  <div className="chart-live-tooltip">
                    <div className="tooltip-badge">
                      <span className="tooltip-dot" />
                      {activePoint.time === 'NOW' ? 'LIVE ADVISORY' : `HORIZON ${activePoint.time}`}
                    </div>
                    <div className="tooltip-grid">
                      <div><span className="tt-label">Sustained Wind</span>
                        <span className="tt-val" style={{ color:'var(--accent-cyan)' }}>{Math.round(activePoint.wind)} kt</span></div>
                      <div><span className="tt-label">Central Pressure</span>
                        <span className="tt-val" style={{ color:'#ff9d4d' }}>{Math.round(activePoint.pressure)} hPa</span></div>
                      <div><span className="tt-label">SST at Eye</span>
                        <span className="tt-val" style={{ color:'#ffb020' }}>{activePoint.sst}°C</span></div>
                      <div><span className="tt-label">Vertical Shear</span>
                        <span className="tt-val" style={{ color:'#a78bfa' }}>{activePoint.shear} kt</span></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="chart-legend-row">
                {activeChart === 'wind-pressure' ? (
                  <>
                    <div className="legend-item"><span className="legend-line" style={{background:'var(--accent-cyan)'}}/><span>Sustained 1-Min Wind (kt)</span></div>
                    <div className="legend-item"><span className="legend-line dashed" style={{background:'#ff9d4d'}}/><span>Central Barometric Pressure (hPa)</span></div>
                    <div className="legend-item"><span className="legend-dot" style={{background:'#fff'}}/><span>Current Position (NOW)</span></div>
                  </>
                ) : (
                  <>
                    <div className="legend-item"><span className="legend-line" style={{background:'#ff9d4d'}}/><span>Sea Surface Temperature (°C)</span></div>
                    <div className="legend-item"><span className="legend-line dashed" style={{background:'#a78bfa'}}/><span>850-200 hPa Vertical Wind Shear (kt)</span></div>
                    <div className="legend-item"><span className="legend-line dashed" style={{background:'#ff3b52'}}/><span>26.5°C Cyclone Support Threshold</span></div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Cyclone pattern tab */}
          {activeTab === 'pattern' && (
            <div className="rv-expanded-card mb-20">
              <div className="chart-header-row">
                <div className="chart-title-group">
                  <div className="chart-title">
                    <MdCyclone size={18} style={{ color }} />
                    <span>Cyclone Spiral Pattern & Intensity Structure</span>
                  </div>
                  <div className="chart-subtitle">
                    Animated logarithmic spiral showing cyclone band structure and core intensity profile
                  </div>
                </div>
                <div className="rv-header-pill" style={{ fontSize: 12 }}>
                  <span className="panel-active-dot" /> LIVE ANIMATION
                </div>
              </div>
              <CyclonePatternChart wind={wind} pressure={pressure} rh={rh} sst={sst} riProb={riProb} color={color} />
            </div>
          )}

          {/* 6 Diagnostic cards — tap to open full graph modal */}
          {(activeTab === 'all' || activeTab === 'environmental' || activeTab === 'ri') && (
            <div className="rv-diagnostics-grid">

              {/* Helper to render each card */}
              {[
                {
                  id: 'sst',
                  iconBox: { bg: 'rgba(255,157,77,0.15)', color: '#ff9d4d', Icon: MdWaves },
                  title: 'Sea Surface Temperature (SST)',
                  sub: 'Oceanic Thermal Reservoir & Heat Energy',
                  bigVal: sst, bigUnit: '°C', bigColor: '#ff9d4d',
                  chip: { text: `+${sstAnomaly}°C vs 30yr Climatology`, type: 'success' },
                  note: 'Intensification threshold: 26.5°C',
                  meter: { fill: Math.min(100, Math.max(10, ((sst-24)/7)*100)), cls: 'sst-gradient', labels: ['24.0°C','26.5°C','30.5°C'], marker: ((26.5-24)/7)*100 },
                  rows: [
                    { k:'Ocean Heat Content (OHC)', v:`${ohc} kJ/cm²` },
                    { k:'Isotherm 26°C Depth', v:'~65 meters (Deep warm pool)' },
                    { k:'Thermal Assessment', v:'High thermal flux sustains rapid convection', vc:'var(--accent-green)' },
                  ]
                },
                {
                  id: 'shear',
                  iconBox: { bg: 'rgba(52,211,153,0.15)', color: 'var(--accent-green)', Icon: FiWind },
                  title: 'Vertical Wind Shear (VWS)',
                  sub: 'Deep-Layer 850–200 hPa Environmental Shear',
                  bigVal: windShear, bigUnit: 'kt', bigColor: windShear < 12 ? 'var(--accent-green)' : '#ffb020',
                  chip: { text: shearStatus, type: windShear < 12 ? 'success' : 'warn' },
                  note: `Shear Vector: ${shearDir} @ ${Math.round(windShear)} kt`,
                  meter: { fill: Math.min(100,(windShear/30)*100), cls: 'shear-gradient', labels: ['<10 kt','10-20 kt','>20 kt'] },
                  rows: [
                    { k:'Vortex Vertical Tilt', v:'Minimal (<15 km tilt displacement)' },
                    { k:'Dry Air Ventilation', v:'Suppressed · Intact Warm Core' },
                    { k:'Structural Impact', v:'Upper tropospheric winds support symmetry', vc: windShear < 12 ? 'var(--accent-green)' : 'var(--text-secondary)' },
                  ]
                },
                {
                  id: 'rh',
                  iconBox: { bg: 'rgba(47,216,196,0.15)', color: 'var(--accent-cyan)', Icon: FiDroplet },
                  title: 'Tropospheric Humidity',
                  sub: 'Mid-Level (700-500 hPa) Relative Humidity',
                  bigVal: rh, bigUnit: '%', bigColor: 'var(--accent-cyan)',
                  chip: { text: 'Saturated Inner Core', type: 'info' },
                  note: `Total Precipitable Water: ${tpw} mm`,
                  meter: { fill: Math.min(100, rh), cls: 'rh-gradient', labels: ['Dry (<50%)','Neutral (60-70%)','Saturated (>75%)'] },
                  rows: [
                    { k:'Saharan / Dry Air Intrusion', v:'Negligible (<10%)', vc:'var(--accent-green)' },
                    { k:'Entrainment Vulnerability', v:'Low (Moist envelope protects core)' },
                    { k:'Convective Feeder Bands', v:'Deep spiral inflows active' },
                  ]
                },
                {
                  id: 'pres',
                  iconBox: { bg: 'rgba(255,59,82,0.15)', color: 'var(--danger-red)', Icon: MdSpeed },
                  title: 'Pressure Dynamics & Trends',
                  sub: 'Central Minimum Pressure & Deepening Velocity',
                  bigVal: Math.round(pressure), bigUnit: 'hPa', bigColor: '#ffffff',
                  chip: { text: `${pDrop3h} hPa / 3h Deepening`, type: 'danger' },
                  note: `24h Delta: ${pDrop24h} hPa`,
                  trendBox: true,
                  rows: [
                    { k:'Pressure Gradient Force', v:'Elevated (Tightly packed isobars)' },
                    { k:'Eye Outflow Efficiency', v:'Vigorous Upper-Level Radial Divergence', vc:'var(--accent-cyan)' },
                  ]
                },
                {
                  id: 'conv',
                  iconBox: { bg: 'rgba(124,140,248,0.15)', color: '#7c8cf8', Icon: MdThunderstorm },
                  title: 'Convection & Core Eyewall',
                  sub: 'Infrared CDO & Lightning Burst Dynamics',
                  bigVal: cloudTop, bigUnit: '°C', bigColor: '#7c8cf8',
                  chip: { text: `${burstCount} Bursts / Hour`, type: 'purple' },
                  note: `Eyewall Symmetry: ${symmetry}%`,
                  rows: [
                    { k:'Central Dense Overcast (CDO)', v: cdoStructure },
                    { k:'Overshooting Tops', v:'Detected (T < -75°C)', vc:'#7c8cf8' },
                    { k:'Inner-Core Lightning', v:`Active Eyewall Pulses (${burstCount}/hr)`, vc:'var(--accent-amber)' },
                    { k:'Eyewall Pinning', v:'Circular symmetric core consolidating' },
                  ]
                },
                {
                  id: 'ri',
                  cls: 'ri-highlight-card',
                  iconBox: { bg: 'rgba(255,35,68,0.2)', color: 'var(--danger-red)', Icon: BsExclamationTriangleFill },
                  title: 'Rapid Intensification (RI) AI Engine',
                  titleColor: isRI ? '#ff4d6a' : '#ffffff',
                  sub: 'NOAA 24h Threshold: ≥30 kt Wind Increase',
                  bigVal: riProb, bigUnit: '%', bigColor: isRI ? 'var(--danger-red)' : 'var(--accent-cyan)',
                  chip: { text: `${riDiagnostics.risk_level} RISK OF RI`, type: isRI ? 'danger' : 'info' },
                  note: 'AI Consensus: LSTM + Random Forest',
                  riChecklist: true,
                },
              ].map(card => (
                <div
                  key={card.id}
                  className={`rv-diag-card card-tappable ${card.cls || ''}`}
                  onClick={() => setActiveCardGraph(card.id)}
                  title="Tap to open full graph"
                >
                  <div className="diag-header">
                    <div className="diag-icon-box" style={{ background: card.iconBox.bg, color: card.iconBox.color }}>
                      <card.iconBox.Icon size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 className="diag-title" style={{ color: card.titleColor }}>{card.title}</h3>
                      <p className="diag-sub">{card.sub}</p>
                    </div>
                    <div className="card-expand-hint" title="Open full graph">
                      <FiMaximize2 size={13} />
                    </div>
                  </div>

                  <div className="diag-metric-hero">
                    <div className="diag-big-val" style={{ color: card.bigColor }}>
                      {card.bigVal}<span className="unit">{card.bigUnit}</span>
                    </div>
                    <div className="diag-sub-status">
                      <span className={`status-chip ${card.chip.type}`}>{card.chip.text}</span>
                      <span className="status-note">{card.note}</span>
                    </div>
                  </div>

                  {card.meter && (
                    <div className="sst-threshold-meter">
                      <div className="meter-labels">
                        {card.meter.labels.map((l, i) => <span key={i}>{l}</span>)}
                      </div>
                      <div className="meter-track">
                        <div className={`meter-fill ${card.meter.cls}`} style={{ width: `${card.meter.fill}%` }} />
                        {card.meter.marker != null && (
                          <div className="meter-target-marker" style={{ left: `${card.meter.marker}%` }} />
                        )}
                      </div>
                    </div>
                  )}

                  {card.trendBox && (
                    <div className="pressure-trend-box">
                      <div className="trend-stat">
                        <span className="ts-label">Drop Rate (3h)</span>
                        <span className="ts-val" style={{ color:'var(--danger-red)' }}>{pDrop3h} hPa</span>
                      </div>
                      <div className="trend-divider" />
                      <div className="trend-stat">
                        <span className="ts-label">Drop Rate (24h)</span>
                        <span className="ts-val" style={{ color:'var(--danger-red)' }}>{pDrop24h} hPa</span>
                      </div>
                      <div className="trend-divider" />
                      <div className="trend-stat">
                        <span className="ts-label">Deepening Stage</span>
                        <span className="ts-val" style={{ color:'var(--accent-amber)' }}>
                          {Math.abs(pDrop24h) >= 15 ? 'Explosive' : 'Progressive'}
                        </span>
                      </div>
                    </div>
                  )}

                  {card.riChecklist && (
                    <div className="ri-factors-checklist">
                      {[
                        { key:'sst_favorable',      label:'SST > 28.0°C',            sub:`${sst}°C Warm Water Fuel` },
                        { key:'shear_favorable',    label:'Vertical Shear < 12 kt',  sub:`${windShear} kt Shear Env.` },
                        { key:'humidity_favorable', label:'Mid-Level RH > 70%',      sub:`${rh}% Saturated Core` },
                        { key:'convection_active',  label:'Convective Eyewall Bursts',sub:`${burstCount}/hr Pumping` },
                      ].map(item => (
                        <div key={item.key} className="ri-check-item">
                          <div className={`check-icon ${riDiagnostics[item.key] ? 'pass' : 'fail'}`}>
                            {riDiagnostics[item.key] ? '✓' : '✗'}
                          </div>
                          <div className="check-text">
                            <span>{item.label}</span>
                            <small>{item.sub}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {card.rows && (
                    <div className="diag-factors-list">
                      {card.rows.map((row, i) => (
                        <div key={i} className="factor-row">
                          <span>{row.k}</span>
                          <strong style={{ color: row.vc || 'var(--text-primary)' }}>{row.v}</strong>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tap hint at bottom */}
                  <div className="card-tap-hint">
                    <FiBarChart2 size={11} />
                    <span>Tap for full graph</span>
                  </div>
                </div>
              ))}

            </div>
          )}

          {/* Forecast matrix */}
          {(activeTab === 'all' || activeTab === 'timeline') && (
            <div className="rv-expanded-card mt-20">
              <div className="matrix-header">
                <div>
                  <h3 className="matrix-title">Detailed Horizon Forecast & Environmental Matrix</h3>
                  <p className="matrix-sub">Multi-parameter atmospheric and oceanic forecast along projected cyclone track</p>
                </div>
                <span className="matrix-model-pill">
                  LSTM + RF Model Confidence: {Math.round((pred.confidence ?? 0.84) * 100)}%
                </span>
              </div>
              <div className="rv-matrix-table-container">
                <table className="rv-matrix-table">
                  <thead>
                    <tr>
                      <th>HORIZON</th><th>INTENSITY (KT)</th><th>SPEED (KM/H)</th><th>CATEGORY</th>
                      <th>DELTA</th><th>PRESSURE</th><th>SST ALONG TRACK</th><th>WIND SHEAR</th><th>RI STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rawTimeline.map((item) => {
                      const cat = item.wind >= 137 ? 5 : item.wind >= 113 ? 4 : item.wind >= 96 ? 3 : item.wind >= 83 ? 2 : item.wind >= 64 ? 1 : item.wind >= 34 ? 0 : -1
                      const c = getCategoryColor(cat)
                      const delta = Math.round(item.wind - wind)
                      const isCurrent = item.time === 'NOW'
                      return (
                        <tr key={item.time} className={isCurrent ? 'row-current' : ''}>
                          <td>
                            <div className="horizon-pill" style={{ color: isCurrent ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                              {item.time}{isCurrent && <span className="current-marker">NOW</span>}
                            </div>
                          </td>
                          <td><strong style={{ color: c, fontSize:'15px' }}>{Math.round(item.wind)} kt</strong></td>
                          <td style={{ color:'var(--text-secondary)' }}>{windToKph(item.wind)} km/h</td>
                          <td>
                            <span className="panel-cat-badge" style={{ background:`${c}18`, border:`1px solid ${c}55`, color:c, padding:'2px 8px', fontSize:'10px' }}>
                              {getCategoryLabel(cat)}
                            </span>
                          </td>
                          <td>
                            {isCurrent ? <span style={{color:'var(--text-muted)'}}>—</span>
                              : delta > 0 ? <span style={{color:'var(--accent-green)',display:'inline-flex',alignItems:'center',gap:'3px'}}><FiTrendingUp size={12}/> +{delta} kt</span>
                              : delta < 0 ? <span style={{color:'var(--danger-red)',display:'inline-flex',alignItems:'center',gap:'3px'}}><FiTrendingDown size={12}/> {delta} kt</span>
                              : <span style={{color:'var(--text-muted)'}}><FiMinus size={12}/> 0 kt</span>}
                          </td>
                          <td style={{fontFamily:'var(--font-data)'}}>{Math.round(item.pressure)} hPa</td>
                          <td style={{color: item.sst >= 28.5 ? '#ff9d4d' : 'var(--accent-cyan)'}}>{item.sst}°C</td>
                          <td style={{color: item.shear < 12 ? 'var(--accent-green)' : '#ffb020'}}>{item.shear} kt</td>
                          <td>
                            {delta >= 30 ? <span className="matrix-ri-badge alert">RI WATCH</span>
                              : delta >= 15 ? <span className="matrix-ri-badge elevate">STRENGTHENING</span>
                              : <span className="matrix-ri-badge stable">STEADY</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </motion.div>
  )
}
