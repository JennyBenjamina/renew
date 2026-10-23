import { Outlet, useLocation } from 'react-router-dom'
import { useCompliance } from '../context/ComplianceContext.jsx'
import ComplianceGate from './ComplianceGate.jsx'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'
import CartDrawer from './CartDrawer.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import '../App.css'

/* Storefront layout. The store is open to everyone (no account or approval
 * needed to browse or buy).
 *
 *   1. Legal pages are readable by anyone, so the agreement's links work.
 *   2. Every other storefront page first requires the 21+ / research-use
 *      compliance agreement.
 *
 * The /admin area doesn't use this layout. */
const LEGAL_PATHS = new Set([
  '/terms-of-service',
  '/privacy-policy',
  '/refund-policy',
  '/research-use-terms',
  '/certificates-of-analysis',
])
export default function StorefrontLayout() {
  const { accepted } = useCompliance()
  const { pathname } = useLocation()
  const path = pathname.replace(/\/+$/, '') || '/'

  const isLegal = LEGAL_PATHS.has(path)

  // Step 1: the compliance agreement, before anything but the legal pages.
  if (!isLegal && !accepted) {
    return (
      <>
        <ComplianceGate />
        <div className="app app--gated" aria-hidden="true" />
      </>
    )
  }

  const showStore = true

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
