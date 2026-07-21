import { Routes, Route, Navigate } from 'react-router-dom'
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
import OrderHistory from './pages/account/OrderHistory.jsx'
import ForgotPassword from './pages/account/ForgotPassword.jsx'
import ResetPassword from './pages/account/ResetPassword.jsx'

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Storefront (public) */}
        <Route element={<StorefrontLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Catalog />} />
          {/* Old slug → redirect so existing /catalog links still work */}
          <Route path="/catalog" element={<Navigate to="/products" replace />} />
          <Route path="/local-pickup" element={<LocalPickup />} />
          <Route path="/partner" element={<About />} />
          {/* Old slug → redirect so existing /about links still work */}
          <Route path="/about" element={<Navigate to="/partner" replace />} />
          <Route path="/research-use-terms" element={<ResearchUseTerms />} />
          <Route
            path="/certificates-of-analysis"
            element={<CertificatesOfAnalysis />}
          />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />

          {/* Customer accounts */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/orders"
            element={
              <ProtectedRoute>
                <OrderHistory />
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
