import { Link } from 'react-router-dom'
import { MdCyclone } from 'react-icons/md'
import { FiArrowRight } from 'react-icons/fi'
import { getCategoryColor } from '../../utils/stormColors'
import { windToKph } from '../../utils/formatters'

function getCategoryBadgeLabel(category) {
  if (category >= 5) return 'CAT 5 HURRICANE'
  if (category === 4) return 'CAT 4 HURRICANE'
  if (category === 3) return 'CAT 3 HURRICANE'
  if (category === 2) return 'CAT 2 HURRICANE'
  if (category === 1) return 'CAT 1 HURRICANE'
  if (category === 0) return 'TROPICAL STORM'
  return 'TROPICAL DEPRESSION'
}

export default function StormCard({ storm }) {
  const color        = getCategoryColor(storm.category)
  const windKt       = Math.round(storm.wind_speed || 0)
  const pressure     = Math.round(storm.pressure || 1010)
  const moveSpeedKmh = storm.movement_speed ? windToKph(storm.movement_speed) : null
  const movementDir  = storm.movement_dir || ''

  return (
    <Link
      to={`/storm/${storm.id}`}
      className="rv-storm-card"
      style={{ '--card-accent-color': color, borderLeftColor: color }}
    >
      {/* Left: Storm Identity */}
      <div className="storm-identity">
        <div className="storm-cyclone-icon" style={{ color }}>
          <MdCyclone size={30} />
        </div>
        <div className="storm-identity-text">
          <span className="storm-name">
            {(storm.name || 'UNNAMED').toUpperCase()}
          </span>
          <span
            className="storm-category-badge"
            style={{ background: `${color}18`, border: `1px solid ${color}44`, color }}
          >
            {getCategoryBadgeLabel(storm.category)}
          </span>
        </div>
      </div>

      {/* Middle: Data blocks */}
      <div className="storm-stats">
        <div className="storm-data-block">
          <span className="storm-data-label">Wind Speed</span>
          <span className="storm-data-value" style={{ color }}>
            {windKt}<span className="storm-data-unit">kt</span>
          </span>
        </div>
        <div className="storm-data-block">
          <span className="storm-data-label">Moving</span>
          <span className="storm-data-value" style={{ fontSize: '16px', color: 'var(--text-primary)' }}>
            {movementDir || '—'}
            {moveSpeedKmh ? <span className="storm-data-unit">{moveSpeedKmh} kmh</span> : null}
          </span>
        </div>
        <div className="storm-data-block">
          <span className="storm-data-label">Pressure</span>
          <span className="storm-data-value" style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>
            {pressure}<span className="storm-data-unit">hPa</span>
          </span>
        </div>
      </div>

      {/* Right: Track button */}
      <div className="storm-track-btn">
        Track
        <FiArrowRight size={14} className="track-arrow" />
      </div>
    </Link>
  )
}
