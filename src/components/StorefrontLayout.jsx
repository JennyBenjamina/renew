import { Outlet } from 'react-router-dom'
import { useCompliance } from '../context/ComplianceContext.jsx'
import ComplianceGate from './ComplianceGate.jsx'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'
import CartDrawer from './CartDrawer.jsx'
import ThemeSwitcher from './ThemeSwitcher.jsx'
import '../App.css'

/** Public storefront shell: compliance gate, nav, footer, cart, theme switcher.
 *  Storefront pages render into <Outlet />. The /admin area does NOT use this
 *  layout, so the gate and cart never appear there. */
export default function StorefrontLayout() {
  const { accepted } = useCompliance()

  return (
    <>
      {!accepted && <ComplianceGate />}
      <div className={accepted ? 'app' : 'app app--gated'} aria-hidden={!accepted}>
        <Navbar />
        <main>
          <Outlet />
        </main>
        <Footer />
        <CartDrawer />
        <ThemeSwitcher />
      </div>
    </>
  )
}
