import { Link, useLocation } from 'react-router-dom'
import { useStormStore } from '../../store/stormStore'

export default function Navbar() {
  const { connected } = useStormStore()
  const location = useLocation()

  const isOverview = location.pathname === '/'
  const isMap = location.pathname === '/map' || location.pathname === '/tracker'

  return (
    <header className="rv-navbar">
      {/* Brand */}
      <Link to="/" className="nav-brand">
        <div className="nav-brand-icon">
          <i className="fa-solid fa-hurricane" />
        </div>
        <span className="nav-brand-text">TRACE</span>
      </Link>

      {/* Navigation Links */}
      <nav className="nav-links">
        <Link
          to="/"
          className={`nav-link ${isOverview ? 'active' : ''}`}
        >
          Hurricane Tracking
        </Link>
        <Link
          to="/map"
          className={`nav-link ${isMap ? 'active' : ''}`}
        >
          <i className="fa-solid fa-satellite" style={{ fontSize: '11px', marginRight: '6px', opacity: 0.8 }} />
          Live Radar Map
        </Link>
      </nav>

      {/* Right Side */}
      <div className="nav-right">
        <Link
          to="/map"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(0,212,255,0.15) 0%, rgba(0,153,204,0.25) 100%)',
            border: '1px solid rgba(0,212,255,0.4)',
            color: '#00d4ff',
            fontSize: '12px',
            fontWeight: 600,
            textDecoration: 'none',
            boxShadow: '0 2px 10px rgba(0,212,255,0.15)',
            transition: 'all 0.2s',
          }}
        >
          <i className="fa-solid fa-globe" style={{ fontSize: '11px' }} />
          <span>Live Radar</span>
        </Link>
        <div className="nav-live">
          <span
            className="nav-live-dot"
            style={{
              background: connected ? 'var(--status-live)' : '#ff9800',
              boxShadow: connected
                ? '0 0 8px rgba(0,230,118,0.5)'
                : '0 0 8px rgba(255,152,0,0.5)',
            }}
          />
          <span style={{ color: connected ? 'var(--status-live)' : '#ff9800' }}>
            {connected ? 'LIVE' : 'CONNECTING'}
          </span>
        </div>
      </div>
    </header>
  )
}
