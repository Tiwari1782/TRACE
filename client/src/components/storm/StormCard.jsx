import { Link } from 'react-router-dom'
import { getCategoryColor, getCategoryLabel } from '../../utils/stormColors'
import { windToKph } from '../../utils/formatters'

/**
 * Get hurricane emoji based on category strength
 */
function getStormEmoji(category) {
  if (category >= 4) return '🌀'
  if (category >= 2) return '🌀'
  if (category >= 0) return '🌀'
  return '🌀'
}

/**
 * Get category text label for the card
 */
function getCategoryFullLabel(category) {
  if (category >= 5) return 'Category 5 Hurricane'
  if (category === 4) return 'Category 4 Hurricane'
  if (category === 3) return 'Category 3 Hurricane'
  if (category === 2) return 'Category 2 Hurricane'
  if (category === 1) return 'Category 1 Hurricane'
  if (category === 0) return 'Tropical Storm'
  return 'Tropical Depression'
}

/**
 * StormCard — RainViewer-style hurricane list card
 */
export default function StormCard({ storm }) {
  const color = getCategoryColor(storm.category)
  const windKmh = windToKph(storm.wind_speed)
  const movementSpeed = storm.movement_speed ? windToKph(storm.movement_speed) : null
  const movementDir = storm.movement_dir || ''

  return (
    <Link
      to={`/storm/${storm.id}`}
      className="rv-storm-card"
      style={{ borderColor: `${color}30` }}
    >
      {/* Storm Identity */}
      <div className="storm-identity">
        <div className="storm-name-row">
          <span className="storm-emoji">{getStormEmoji(storm.category)}</span>
          <span className="storm-name" style={{ color }}>
            {(storm.name || 'UNNAMED').toUpperCase()}
          </span>
        </div>
        <span className="storm-category-label">
          {getCategoryFullLabel(storm.category)}
        </span>
      </div>

      {/* Stats */}
      <div className="storm-stats">
        <div className="storm-stat">
          <span className="storm-stat-label">Wind Speed</span>
          <span className="storm-stat-value">{windKmh} kmh</span>
        </div>
        <div className="storm-stat">
          <span className="storm-stat-label">Moving</span>
          <span className="storm-stat-value">
            {movementDir}{movementSpeed ? ` ${movementSpeed} kmh` : ''}
          </span>
        </div>
      </div>

      {/* Track Link */}
      <div className="storm-track-link">
        <span>Track</span>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '12px' }} />
      </div>
    </Link>
  )
}
