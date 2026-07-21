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
import ResearchUseTerms from './pages/legal/ResearchUseTerms.jsx'
import CertificatesOfAnalysis from './pages/legal/CertificatesOfAnalysis.jsx'
import PrivacyPolicy from './pages/legal/PrivacyPolicy.jsx'
import Login from './pages/account/Login.jsx'
import Signup from './pages/account/Signup.jsx'
import Account from './pages/account/Account.jsx'

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
          <Route path="/research-use-terms" element={<ResearchUseTerms />} />
          <Route
            path="/certificates-of-analysis"
            element={<CertificatesOfAnalysis />}
          />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />

          {/* Customer accounts */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  )
}
