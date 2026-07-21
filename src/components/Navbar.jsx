import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import Logo from './Logo.jsx'
import './Navbar.css'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/catalog', label: 'Catalog' },
  { to: '/local-pickup', label: 'Local Pickup' },
  { to: '/about', label: 'About' },
]

export default function Navbar() {
  const { count, openCart } = useCart()
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="nav">
      <div className="container nav__inner">
        <Link to="/" className="nav__brand" onClick={() => setMenuOpen(false)}>
          <Logo />
        </Link>

        <nav className={`nav__links ${menuOpen ? 'is-open' : ''}`}>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `nav__link ${isActive ? 'is-active' : ''}`
              }
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav__actions">
          <button
            className="nav__icon"
            aria-label="Open cart"
            onClick={openCart}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
              stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
              strokeLinejoin="round">
              <circle cx="9" cy="20" r="1.4" />
              <circle cx="18" cy="20" r="1.4" />
              <path d="M2 3h2l2.4 12.4a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L22 7H5.4" />
            </svg>
            {count > 0 && <span className="nav__badge">{count}</span>}
          </button>

          <Link
            to={user ? '/account' : '/login'}
            className="nav__icon"
            aria-label={user ? 'My account' : 'Log in'}
            onClick={() => setMenuOpen(false)}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
              stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>

          <Link to="/catalog" className="btn btn--primary nav__shop">
            Shop
          </Link>

          <button
            className={`nav__burger ${menuOpen ? 'is-open' : ''}`}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  )
}
