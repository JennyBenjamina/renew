import { useState } from 'react'
import { useCompliance } from '../context/ComplianceContext.jsx'
import './ComplianceGate.css'

const TERMS = [
  'I confirm that I am 21 years of age or older.',
  'I understand that all products on this website are intended for research use only.',
  'I understand these products are not intended for human consumption, medical use, diagnosis, treatment, prevention of disease, cosmetic use, dietary supplement use, food use, or veterinary use.',
  'I certify that I am accessing this website for lawful research purposes only and agree to the Renew Research Use Only Terms & Conditions.',
]

export default function ComplianceGate() {
  const { accept } = useCompliance()
  const [checked, setChecked] = useState(TERMS.map(() => false))
  const [remember, setRemember] = useState(false)

  const checkedCount = checked.filter(Boolean).length
  const allChecked = checkedCount === TERMS.length

  const toggle = (i) =>
    setChecked((c) => c.map((v, idx) => (idx === i ? !v : v)))

  return (
    <div className="gate" role="dialog" aria-modal="true" aria-labelledby="gate-title">
      <div className="gate__card">
        <header className="gate__head">
          <span className="gate__shield" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
          </span>
          <h2 id="gate-title">Renew Compliance Notice</h2>
          <p>Please review and confirm the following before entering this site.</p>
        </header>

        <div className="gate__terms">
          {TERMS.map((t, i) => (
            <button
              type="button"
              key={i}
              className={`gate__term ${checked[i] ? 'is-checked' : 'is-unchecked'}`}
              onClick={() => toggle(i)}
              aria-pressed={checked[i]}
            >
              <span className="gate__radio" aria-hidden="true" />
              <span>{t}</span>
            </button>
          ))}

          <label className="gate__remember">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Remember this device for 14 days
          </label>
        </div>

        <footer className="gate__foot">
          <a className="btn btn--outline" href="https://www.google.com">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            Leave Site
          </a>
          <button
            className="btn btn--primary"
            disabled={!allChecked}
            onClick={() => accept(remember)}
            title={
              allChecked
                ? undefined
                : `Confirm all ${TERMS.length} statements to continue`
            }
          >
            {allChecked
              ? 'I Agree & Enter Site'
              : `Confirm all statements (${checkedCount}/${TERMS.length})`}
            {allChecked && (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            )}
          </button>
        </footer>
      </div>
    </div>
  )
}
