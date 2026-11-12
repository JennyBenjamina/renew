import { Link } from 'react-router-dom'

/** Sign in / Create account switch shown at the top of both forms. Carries
 *  `from` along so the shopper lands back where they started (e.g. checkout). */
export default function AuthTabs({ active, from }) {
  const state = from ? { from } : undefined
  return (
    <nav className="bench__tabs" aria-label="Account">
      <Link to="/login" state={state} replace
        className={`bench__tab ${active === 'login' ? 'is-active' : ''}`}
        aria-current={active === 'login' ? 'page' : undefined}>
        Sign in
      </Link>
      <Link to="/signup" state={state} replace
        className={`bench__tab ${active === 'signup' ? 'is-active' : ''}`}
        aria-current={active === 'signup' ? 'page' : undefined}>
        Create account
      </Link>
    </nav>
  )
}
