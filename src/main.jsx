import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { ComplianceProvider } from './context/ComplianceContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { applyTheme, DEFAULT_THEME } from './lib/theme.js'
import { initTracking } from './lib/tracking.js'
import { captureReferralFromUrl } from './lib/referral.js'
import './styles/theme.css'
import './styles/global.css'

// Force the Stone color scheme for all visitors (theme switcher is disabled).
applyTheme(DEFAULT_THEME)

// Remember a sales-rep referral code from ?ref= so the rep gets credit at checkout.
captureReferralFromUrl()

// Load marketing pixels (no-op unless their IDs are set in env).
initTracking()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Top-level boundary: catches errors anywhere (navbar, providers, pages)
        so the app never shows a blank white screen. */}
    <ErrorBoundary resetKey="root">
      <BrowserRouter>
        <AuthProvider>
          <ComplianceProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </ComplianceProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)
