import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function initials(name, email) {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/)
    return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase()
  }
  return (email?.[0] || '?').toUpperCase()
}

/** Navbar account control. Logged out → "Log in". Logged in → name + avatar
 *  button that opens a dropdown (Order history, Account settings, Sign out). */
export default function AccountMenu({ onNavigate }) {
  const { user, profile, isAdmin, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onEsc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  if (!user) {
    return (
      <Link
        to="/login"
        className="nav__icon"
        aria-label="Log in"
        onClick={onNavigate}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
          stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
          strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </Link>
    )
  }

  const name = profile?.full_name || user.email
  const firstName = profile?.full_name?.trim().split(/\s+/)[0] || null

  const go = () => {
    setOpen(false)
    onNavigate?.()
  }

  return (
    <div className="acct" ref={ref}>
      <button
        className="acct__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="acct__avatar" aria-hidden="true">
          {initials(profile?.full_name, user.email)}
        </span>
        <span className="acct__name">{firstName || 'Account'}</span>
        <svg className="acct__chev" viewBox="0 0 24 24" width="16" height="16"
          fill="none" stroke="currentColor" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="acct__menu" role="menu">
          <div className="acct__head">
            <span className="acct__head-name">{name}</span>
            {profile?.role && (
              <span className="acct__role">{profile.role}</span>
            )}
          </div>

          {isAdmin && (
            <Link to="/admin" className="acct__item" role="menuitem" onClick={go}>
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none"
                stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
                strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
              Admin dashboard
            </Link>
          )}

          <Link to="/account/orders" className="acct__item" role="menuitem" onClick={go}>
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none"
              stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M6 2l1.5 3h9L18 2" />
              <path d="M3 6h18l-1.5 13a2 2 0 0 1-2 1.7H6.5a2 2 0 0 1-2-1.7L3 6z" />
              <path d="M9 11h6" />
            </svg>
            Order history
          </Link>

          <Link to="/account" className="acct__item" role="menuitem" onClick={go}>
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none"
              stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
              strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1A1.6 1.6 0 0 0 6.6 19l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 13.4H3a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 4.6 6.6l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 10 3.6V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.4 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
            </svg>
            Account settings
          </Link>

          <button
            className="acct__item acct__item--danger"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              signOut()
            }}
          >
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none"
              stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5M21 12H9" />
            </svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
