import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCompliance } from '../context/ComplianceContext.jsx'
import './ComplianceGate.css'

/* The four conditions every visitor must acknowledge before entering. Bump
 * TERMS_VERSION in src/lib/compliance.js whenever this wording changes. */
const CONDITIONS = [
  <>I am at least <strong>21 years of age</strong>.</>,
  <>I am a <strong>qualified researcher</strong> or represent a qualified research institution.</>,
  <>All products are intended strictly for <strong>legitimate research purposes</strong> and are{' '}
    <strong>not for human or animal consumption</strong>.</>,
  <>I agree to the Renew <Link to="/terms-of-service">Terms of Service</Link>,{' '}
    <Link to="/research-use-terms">Research Use Terms</Link>, policies, and applicable
    compliance requirements.</>,
]

const MIN_AGE = 21

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 100 }, (_, i) => CURRENT_YEAR - i)

/** Whole-years age from y/m/d parts, or null if the date is incomplete/invalid. */
function ageFromParts(year, month, day) {
  if (!year || !month || !day) return null
  const y = Number(year)
  const m = Number(month) // 1–12
  const d = Number(day)
  const date = new Date(y, m - 1, d)
  // Reject impossible dates like Feb 30 (JS would roll them over).
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return null
  }
  const now = new Date()
  let age = now.getFullYear() - y
  const mm = now.getMonth() - (m - 1)
  if (mm < 0 || (mm === 0 && now.getDate() < d)) age--
  return age
}

export default function ComplianceGate() {
  const { accept } = useCompliance()
  const [agreed, setAgreed] = useState(false)
  const [remember, setRemember] = useState(false)
  const [month, setMonth] = useState('')
  const [day, setDay] = useState('')
  const [year, setYear] = useState('')

  const complete = Boolean(month && day && year)
  const age = ageFromParts(year, month, day)
  const isOldEnough = age !== null && age >= MIN_AGE
  const dobTooYoung = complete && (age === null || age < MIN_AGE)
  const canEnter = isOldEnough && agreed

  return (
    <div className="gate" role="dialog" aria-modal="true" aria-labelledby="gate-title">
      <div className="gate__card">
        <header className="gate__head">
          <span className="gate__shield" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </span>
          <h2 id="gate-title">Compliance agreement</h2>
          <p>Renew sells research compounds to verified researchers only. Confirm the following to continue.</p>
        </header>

        <div className="gate__terms">
          <div className="gate__dob">
            <span className="gate__dob-label">Date of birth</span>
            <div className="gate__dob-row">
              <select className="gate__dob-select" value={month}
                onChange={(e) => setMonth(e.target.value)}
                aria-label="Birth month" aria-invalid={dobTooYoung}>
                <option value="">Month</option>
                {MONTHS.map((name, i) => (
                  <option key={name} value={i + 1}>{name}</option>
                ))}
              </select>
              <select className="gate__dob-select" value={day}
                onChange={(e) => setDay(e.target.value)}
                aria-label="Birth day" aria-invalid={dobTooYoung}>
                <option value="">Day</option>
                {DAYS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select className="gate__dob-select" value={year}
                onChange={(e) => setYear(e.target.value)}
                aria-label="Birth year" aria-invalid={dobTooYoung}>
                <option value="">Year</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            {dobTooYoung && (
              <span className="gate__dob-error">
                You must be {MIN_AGE} or older to enter this site.
              </span>
            )}
          </div>

          <div className="gate__conditions">
            <span className="gate__dob-label">By entering, I confirm that:</span>
            <ul>
              {CONDITIONS.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>

          <label className={`gate__agree ${agreed ? 'is-checked' : ''}`}>
            <input
              id="gate-agree"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>I have read and agree to all of the conditions above.</span>
          </label>

          <label className="gate__remember">
            <input
              id="gate-remember"
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Remember this device for 14 days
          </label>
        </div>

        <footer className="gate__foot">
          <a className="btn btn--outline" href="https://www.google.com">
            Leave site
          </a>
          <button
            className="btn btn--primary"
            disabled={!canEnter}
            onClick={() => accept(remember)}
          >
            {canEnter
              ? 'Agree & continue'
              : !isOldEnough
                ? 'Enter your date of birth'
                : 'Check the box to continue'}
          </button>
        </footer>
      </div>
    </div>
  )
}
