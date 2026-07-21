import { useEffect, useRef, useState } from 'react'
import { NavLink, Link, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import Logo from '../../components/Logo.jsx'
import './admin.css'

/** Shared admin shell: top bar with Products/Orders nav + an account dropdown,
 *  mirroring the customer portal. Child pages render into <Outlet />. */
export default function AdminLayout() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    const onEsc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  const initials = (user?.email?.[0] || 'A').toUpperCase()

  return (
    <div className="admin">
      <header className="admin__bar">
        <div className="admin__bar-left">
          <Link to="/admin" className="admin__brand">
            <Logo />
          </Link>
          <span className="adminlogin__tag">Admin</span>
          <nav className="admin__tabs">
            <NavLink
              to="/admin"
              end
              className={({ isActive }) => `admin__tab ${isActive ? 'is-active' : ''}`}
            >
              Products
            </NavLink>
            <NavLink
              to="/admin/orders"
              className={({ isActive }) => `admin__tab ${isActive ? 'is-active' : ''}`}
            >
              Orders
            </NavLink>
          </nav>
        </div>

        <div className="acct" ref={ref}>
          <button
            className="acct__trigger"
            onClick={() => setOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <span className="acct__avatar" aria-hidden="true">{initials}</span>
            <span className="acct__name">{user?.email}</span>
            <svg className="acct__chev" viewBox="0 0 24 24" width="16" height="16"
              fill="none" stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {open && (
            <div className="acct__menu" role="menu">
              <div className="acct__head">
                <span className="acct__head-name">{user?.email}</span>
                <span className="acct__role">admin</span>
              </div>
              <NavLink to="/admin" end className="acct__item" role="menuitem" onClick={() => setOpen(false)}>
                Products
              </NavLink>
              <NavLink to="/admin/orders" className="acct__item" role="menuitem" onClick={() => setOpen(false)}>
                Orders
              </NavLink>
              <Link to="/" className="acct__item" role="menuitem" onClick={() => setOpen(false)}>
                View store ↗
              </Link>
              <button className="acct__item acct__item--danger" role="menuitem" onClick={signOut}>
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="admin__main">
        <Outlet />
      </main>
    </div>
  )
}
