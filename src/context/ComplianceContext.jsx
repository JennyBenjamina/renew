import { createContext, useContext, useEffect, useState } from 'react'
import { recordAcceptance } from '../lib/compliance.js'

const ComplianceContext = createContext(null)
const STORAGE_KEY = 'renew.compliance.acceptedUntil'

export function ComplianceProvider({ children }) {
  const [accepted, setAccepted] = useState(false)

  // On mount, honor a previously remembered acceptance that hasn't expired.
  useEffect(() => {
    try {
      const until = Number(localStorage.getItem(STORAGE_KEY))
      if (until && until > Date.now()) setAccepted(true)
    } catch {
      /* localStorage unavailable — gate simply shows each visit */
    }
  }, [])

  const accept = (remember) => {
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
