import { createContext, useContext, useState } from 'react'
import { recordAcceptance, TERMS_VERSION } from '../lib/compliance.js'

const ComplianceContext = createContext(null)
// Versioned so a wording change makes remembered visitors agree again.
const STORAGE_KEY = `renew.compliance.acceptedUntil.${TERMS_VERSION}`

function rememberedAcceptance() {
  try {
    if (sessionStorage.getItem(STORAGE_KEY) === 'yes') return true // this tab
    const until = Number(localStorage.getItem(STORAGE_KEY))
    return Boolean(until && until > Date.now())
  } catch {
    return false // localStorage unavailable — gate simply shows each visit
  }
}

export function ComplianceProvider({ children }) {
  // Read synchronously so a remembered visitor never sees the gate flash.
  const [accepted, setAccepted] = useState(rememberedAcceptance)

  const accept = (remember) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, 'yes') // survive refreshes in this tab
    } catch {
      /* ignore */
    }
    if (remember) {
      try {
        const until = Date.now() + 14 * 24 * 60 * 60 * 1000 // 14 days
        localStorage.setItem(STORAGE_KEY, String(until))
      } catch {
        /* ignore */
      }
    }
    // Log the acceptance server-side (fire-and-forget; no-op without Supabase).
    recordAcceptance({ remembered: Boolean(remember) })
    setAccepted(true)
  }

  return (
    <ComplianceContext.Provider value={{ accepted, accept }}>
      {children}
    </ComplianceContext.Provider>
  )
}

export function useCompliance() {
  const ctx = useContext(ComplianceContext)
  if (!ctx) throw new Error('useCompliance must be used within ComplianceProvider')
  return ctx
}
