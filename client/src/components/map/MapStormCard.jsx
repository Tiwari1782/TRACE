import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FiArrowRight, FiX, FiChevronDown, FiCompass } from 'react-icons/fi'
import { MdCyclone } from 'react-icons/md'
import { getCategoryColor, getCategoryLabel } from '../../utils/stormColors'
import { windToKph } from '../../utils/formatters'

/**
 * MapStormCard — Floating interactive storm card rendered over any map
 * when a user taps or clicks any cyclone pin or proximity zone.
 *
 * @param {Object} props
 * @param {Object} props.storm - Cyclone data object
 * @param {Function} props.onClose - Callback to dismiss card
 * @param {Function} [props.onViewInList] - Optional callback to scroll to card in list
 * @param {Object} [props.style] - Custom positioning style overrides
 * @param {boolean} [props.compact] - Compact mode for smaller map viewports
 */
export default function MapStormCard({
  storm,
  onClose,
  onViewInList = null,
  style = {},
  compact = false,
}) {
  const navigate = useNavigate()
  if (!storm) return null

  const color = getCategoryColor(storm.category)
  const catLabel = getCategoryLabel(storm.category)
  const windKt = Math.round(storm.wind_speed || 0)
  const windKmh = windToKph(windKt)
  const pressure = Math.round(storm.pressure || 1010)
  const moveSpeed = storm.movement_speed ? windToKph(storm.movement_speed) : null
  const moveDir = storm.movement_dir || 'WNW'
  const lat = storm.latitude ?? storm.lat ?? 0
  const lon = storm.longitude ?? storm.lon ?? 0

  return (
    <motion.div
      key={storm.id}
      className={`map-popup-card ${compact ? 'compact' : ''}`}
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.95 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      style={{
        '--card-accent': color,
        borderLeft: `4px solid ${color}`,
        ...style,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top row: Category Badge & Close Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div
          className="map-popup-cat-badge"
          style={{
            background: `${color}18`,
            border: `1px solid ${color}44`,
            color,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            margin: 0,
          }}
        >
          <MdCyclone size={12} />
          <span>{catLabel}</span>
        </div>

        {onClose && (
          <button
            type="button"
            className="map-popup-close-btn"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            aria-label="Close storm card"
          >
            <FiX size={14} />
          </button>
        )}
      </div>

      {/* Storm Name */}
      <div
        className="map-popup-name"
        style={{
          marginBottom: compact ? '8px' : '12px',
          fontSize: compact ? '18px' : '21px',
          textShadow: `0 0 16px ${color}40`,
        }}
      >
        {(storm.name || 'UNNAMED').toUpperCase()}
      </div>

      {/* 2x2 Stats Grid */}
      <div
        className="map-popup-stats"
        style={{
          gap: compact ? '6px' : '8px',
          marginBottom: compact ? '10px' : '14px',
        }}
      >
        {/* Wind Speed */}
        <div className="map-popup-stat" style={{ padding: compact ? '7px 9px' : '10px 12px' }}>
          <div className="map-popup-stat-label">Wind Velocity</div>
          <div className="map-popup-stat-value" style={{ color }}>
            {windKt}
            <span className="map-popup-stat-unit">kt</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '4px' }}>
              ({windKmh} km/h)
            </span>
          </div>
        </div>

        {/* Barometric Pressure */}
        <div className="map-popup-stat" style={{ padding: compact ? '7px 9px' : '10px 12px' }}>
          <div className="map-popup-stat-label">Central Pressure</div>
          <div className="map-popup-stat-value" style={{ color: 'var(--text-primary)' }}>
            {pressure}
            <span className="map-popup-stat-unit">hPa</span>
          </div>
        </div>

        {/* Movement */}
        <div className="map-popup-stat" style={{ padding: compact ? '7px 9px' : '10px 12px' }}>
          <div className="map-popup-stat-label">Movement</div>
          <div className="map-popup-stat-value" style={{ color: '#7c8cf8', fontSize: '13px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <FiCompass size={11} /> {moveDir}
            </span>{' '}
            {moveSpeed ? `${moveSpeed} km/h` : ''}
          </div>
        </div>

        {/* Coordinates */}
        <div className="map-popup-stat" style={{ padding: compact ? '7px 9px' : '10px 12px' }}>
          <div className="map-popup-stat-label">Eye Position</div>
          <div className="map-popup-stat-value" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
            {Math.abs(lat).toFixed(1)}°{lat >= 0 ? 'N' : 'S'}, {Math.abs(lon).toFixed(1)}°{lon >= 0 ? 'E' : 'W'}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <button
          type="button"
          className="map-popup-cta"
          style={{ padding: compact ? '9px 12px' : '12px 16px', fontSize: compact ? '12px' : '13px' }}
          onClick={() => navigate(`/storm/${storm.id}`)}
        >
          <span>View Deep AI Forecast</span>
          <FiArrowRight size={13} />
        </button>

        {onViewInList && (
          <button
            type="button"
            className="map-popup-secondary-cta"
            onClick={(e) => {
              e.stopPropagation()
              onViewInList(storm)
            }}
          >
            <span>Jump to Storm Card</span>
            <FiChevronDown size={13} />
          </button>
        )}
      </div>
    </motion.div>
  )
}
