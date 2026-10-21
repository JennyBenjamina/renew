import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useCompliance } from '../context/ComplianceContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import ComplianceGate from './ComplianceGate.jsx'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'
import CartDrawer from './CartDrawer.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import '../App.css'

/* Compliance gate (required by our payment processor).
 *
 *   1. Legal pages are readable by anyone, so the agreement's links work.
 *   2. Every other storefront page first requires the compliance agreement.
 *   3. Login, signup, password reset and the pending notice need only the
 *      agreement.
 *   4. Everything else (home, catalog, COAs, blog, cart, checkout, account…)
 *      needs a signed-in account that an admin has approved. Pending, rejected
 *      and logged-out visitors are redirected, including on direct links.
 *
 * The catalog itself is also locked in the database (row-level security), and
 * checkout functions re-check approval server-side, so hiding pages here is
 * not the only line of defence. The /admin area doesn't use this layout. */
const LEGAL_PATHS = new Set([
  '/terms-of-service',
  '/privacy-policy',
  '/refund-policy',
  '/research-use-terms',
  '/certificates-of-analysis',
])
const ACCOUNT_ENTRY_PATHS = new Set([
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/account/pending',
])

export default function StorefrontLayout() {
  const { accepted } = useCompliance()
  const { user, isApproved, loading } = useAuth()
  const { pathname } = useLocation()
  const path = pathname.replace(/\/+$/, '') || '/'

  const isLegal = LEGAL_PATHS.has(path)
  const isEntry = ACCOUNT_ENTRY_PATHS.has(path)
  const isRestricted = !isLegal && !isEntry

  // Step 1: the compliance agreement, before anything but the legal pages.
  if (!isLegal && !accepted) {
    return (
      <>
        <ComplianceGate />
        <div className="app app--gated" aria-hidden="true" />
      </>
    )
  }

  // Steps 2–4: restricted pages need an approved account.
  if (isRestricted) {
    if (loading) return <div className="admin-loading">Checking access…</div>
    if (!user) return <Navigate to="/login" replace state={{ from: pathname }} />
    if (!isApproved) return <Navigate to="/account/pending" replace />
  }

  const showStore = Boolean(user && isApproved)

  return (
    <div className="app">
      <div className="ruo-banner" role="note">
        For laboratory research use only — not for human or animal consumption.
      </div>
      <Navbar restricted={!showStore} />
      <main>
        {/* Keyed by route so a page error clears when navigating away,
            and nav/footer stay usable instead of a blank screen. */}
        <ErrorBoundary resetKey={pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
      {showStore && <CartDrawer />}
    </div>
  )
}
