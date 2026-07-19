import { Routes, Route } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop.jsx'
import StorefrontLayout from './components/StorefrontLayout.jsx'
import ProtectedRoute from './components/admin/ProtectedRoute.jsx'
import Home from './pages/Home.jsx'
import Catalog from './pages/Catalog.jsx'
import LocalPickup from './pages/LocalPickup.jsx'
import About from './pages/About.jsx'
import AdminLogin from './pages/admin/AdminLogin.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Storefront (public) */}
        <Route element={<StorefrontLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/local-pickup" element={<LocalPickup />} />
          <Route path="/about" element={<About />} />
        </Route>

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  )
}
