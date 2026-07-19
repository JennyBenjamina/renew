import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { ComplianceProvider } from './context/ComplianceContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { applyTheme, getSavedTheme } from './lib/theme.js'
import './styles/theme.css'
import './styles/global.css'

// Apply the saved (or default) color scheme before the first paint.
applyTheme(getSavedTheme())

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
