import { useState } from 'react'
import { THEMES, applyTheme, getSavedTheme } from '../lib/theme.js'
import './ThemeSwitcher.css'

/** Floating control to flip between color schemes live (for demos).
 *  To remove it from the site, just delete <ThemeSwitcher /> in App.jsx. */
export default function ThemeSwitcher() {
  const [active, setActive] = useState(getSavedTheme)
  const [open, setOpen] = useState(false)

  const choose = (id) => {
    applyTheme(id)
    setActive(id)
  }

  return (
    <div className={`themesw ${open ? 'is-open' : ''}`}>
      <div className="themesw__panel" role="group" aria-label="Color scheme">
        {THEMES.map((t) => (
          <button
            key={t.id}
            className={`themesw__opt ${active === t.id ? 'is-active' : ''}`}
            onClick={() => choose(t.id)}
          >
            <span className="themesw__swatches" aria-hidden="true">
              {t.swatches.map((c) => (
                <i key={c} style={{ background: c }} />
              ))}
            </span>
            <span className="themesw__label">{t.label}</span>
          </button>
        ))}
      </div>

      <button
        className="themesw__toggle"
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle theme switcher"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
          stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
          strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none" />
        </svg>
        Theme
      </button>
    </div>
  )
}
