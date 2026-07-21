import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { ComplianceProvider } from './context/ComplianceContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { applyTheme, DEFAULT_THEME } from './lib/theme.js'
import './styles/theme.css'
import './styles/global.css'

// Force the Stone color scheme for all visitors (theme switcher is disabled).
applyTheme(DEFAULT_THEME)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ComplianceProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </ComplianceProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
