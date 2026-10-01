import { useState } from 'react'
import { useCompliance } from '../context/ComplianceContext.jsx'
import './ComplianceGate.css'

const TERMS = [
  'I understand that all products on this website are intended for research use only.',
  'I understand these products are sold for laboratory research use only and are not for human or veterinary consumption.',
  'I certify that I am accessing this website for lawful research purposes only and agree to the Renew Research Use Only Terms & Conditions.',
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
  const [checked, setChecked] = useState(TERMS.map(() => false))
  const [remember, setRemember] = useState(false)
  const [month, setMonth] = useState('')
  const [day, setDay] = useState('')
  const [year, setYear] = useState('')

  const complete = Boolean(month && day && year)
  const age = ageFromParts(year, month, day)
  const isOldEnough = age !== null && age >= MIN_AGE
  const dobTooYoung = complete && (age === null || age < MIN_AGE)

  const checkedCount = checked.filter(Boolean).length
  const allChecked = checkedCount === TERMS.length
  const canEnter = isOldEnough && allChecked

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
          <div className="gate__dob">
            <span className="gate__dob-label">Date of birth</span>
            <div className="gate__dob-row">
              <select
                className="gate__dob-select"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                aria-label="Birth month"
                aria-invalid={dobTooYoung}
              >
                <option value="">Month</option>
                {MONTHS.map((name, i) => (
                  <option key={name} value={i + 1}>{name}</option>
                ))}
              </select>
              <select
                className="gate__dob-select"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                aria-label="Birth day"
                aria-invalid={dobTooYoung}
              >
                <option value="">Day</option>
                {DAYS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select
                className="gate__dob-select"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                aria-label="Birth year"
                aria-invalid={dobTooYoung}
              >
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
            disabled={!canEnter}
            onClick={() => accept(remember)}
            title={
              canEnter
                ? undefined
                : 'Enter your date of birth and confirm all statements to continue'
            }
          >
            {canEnter
              ? 'I Agree & Enter Site'
              : !isOldEnough
                ? 'Enter your date of birth'
                : `Confirm all statements (${checkedCount}/${TERMS.length})`}
            {canEnter && (
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
