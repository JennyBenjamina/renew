import { Outlet, useLocation } from 'react-router-dom'
import { useCompliance } from '../context/ComplianceContext.jsx'
import ComplianceGate from './ComplianceGate.jsx'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'
import CartDrawer from './CartDrawer.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import '../App.css'

/** Public storefront shell: compliance gate, nav, footer, cart.
 *  Storefront pages render into <Outlet />. The /admin area does NOT use this
 *  layout, so the gate and cart never appear there.
 *  (The theme switcher is intentionally not rendered — the site is locked to
 *  the Stone scheme. To re-enable it for a demo, restore <ThemeSwitcher />.) */
export default function StorefrontLayout() {
  const { accepted } = useCompliance()
  const { pathname } = useLocation()

  return (
    <>
      {!accepted && <ComplianceGate />}
      <div className={accepted ? 'app' : 'app app--gated'} aria-hidden={!accepted}>
        <Navbar />
        <main>
          {/* Keyed by route so a page error clears when navigating away,
              and nav/footer stay usable instead of a blank screen. */}
          <ErrorBoundary resetKey={pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
        <Footer />
        <CartDrawer />
      </div>
    </>
  )
}
