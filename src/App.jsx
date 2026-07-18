import { Routes, Route } from 'react-router-dom'
import { useCompliance } from './context/ComplianceContext.jsx'
import ComplianceGate from './components/ComplianceGate.jsx'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import CartDrawer from './components/CartDrawer.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import Home from './pages/Home.jsx'
import Catalog from './pages/Catalog.jsx'
import LocalPickup from './pages/LocalPickup.jsx'
import About from './pages/About.jsx'
import './App.css'

export default function App() {
  const { accepted } = useCompliance()

  return (
    <>
      {!accepted && <ComplianceGate />}
      <div className={accepted ? 'app' : 'app app--gated'} aria-hidden={!accepted}>
        <ScrollToTop />
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/local-pickup" element={<LocalPickup />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
        <Footer />
        <CartDrawer />
      </div>
    </>
  )
}
