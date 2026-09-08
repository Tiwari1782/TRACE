import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useStormStore } from '../../store/stormStore'
import { MdRadar, MdCyclone } from 'react-icons/md'
import { FiGlobe, FiMenu, FiX, FiCloudRain } from 'react-icons/fi'
import { RiLiveFill } from 'react-icons/ri'

const NAV_ITEMS = [
  { to: '/', label: 'Hurricane tracking', icon: MdCyclone, match: (p) => p === '/' },
  { to: '/globe', label: 'Globe view', icon: FiGlobe, match: (p) => p === '/globe' },
  { to: '/live-weather', label: 'Live weather', icon: FiCloudRain, match: (p) => p === '/live-weather' },
  { to: '/map', label: 'Live radar map', icon: MdRadar, match: (p) => p === '/map' || p === '/tracker' },
]

export default function Navbar() {
  const { connected } = useStormStore()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  // Close the mobile menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <header className="rv-navbar">
      <Link to="/" className="nav-brand">
        <div className="nav-brand-icon">
          <MdCyclone size={22} />
        </div>
        <span className="nav-brand-text">TRACE</span>
        <span className="nav-beta-badge">BETA</span>
      </Link>

      {/* Desktop navigation */}
      <nav className="nav-links" aria-label="Primary">
        {NAV_ITEMS.map(({ to, label, icon: Icon, match }) => (
          <Link key={to} to={to} className={`nav-link ${match(location.pathname) ? 'active' : ''}`}>
            <Icon size={14} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="nav-right">
        <div className="nav-live" role="status">
          <span className={`hero-status-dot ${connected ? 'is-live' : 'is-connecting'}`} />
          <span>{connected ? 'Live' : 'Connecting'}</span>
        </div>
        <Link to="/map" className="nav-radar-btn">
          <RiLiveFill size={13} />
          <span>Live radar</span>
        </Link>

        <button
          type="button"
          className="nav-mobile-toggle"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
      </div>

      {/* Mobile navigation */}
      <div className={`nav-mobile-menu ${menuOpen ? 'is-open' : ''}`}>
        <nav aria-label="Primary, mobile">
          {NAV_ITEMS.map(({ to, label, icon: Icon, match }) => (
            <Link
              key={to}
              to={to}
              className={`nav-mobile-link ${match(location.pathname) ? 'active' : ''}`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="nav-mobile-footer">
          <div className="nav-live">
            <span className={`hero-status-dot ${connected ? 'is-live' : 'is-connecting'}`} />
            <span>{connected ? 'Live' : 'Connecting'}</span>
          </div>
          <Link to="/map" className="nav-radar-btn">
            <RiLiveFill size={13} />
            <span>Live radar</span>
          </Link>
        </div>
      </div>

      {menuOpen && (
        <button
          type="button"
          className="nav-mobile-scrim"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </header>
  )
}