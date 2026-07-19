/* Theme selection helpers, shared by main.jsx (initial paint) and the
 * ThemeSwitcher UI. Adding a new scheme is a two-step change: add its tokens
 * in styles/theme.css, then add an entry to THEMES below. */

export const THEMES = [
  {
    id: 'option1',
    label: 'Option 1 · Sky',
    swatches: ['#38bdf8', '#0f172a', '#f1f5f9'],
  },
  {
    id: 'option2',
    label: 'Option 2 · Mint',
    swatches: ['#5bb9a6', '#2f5d57', '#d9f5ef'],
  },
]

export const DEFAULT_THEME = 'option1'
const STORAGE_KEY = 'renew.theme'

export function getSavedTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && THEMES.some((t) => t.id === saved)) return saved
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME
}

export function applyTheme(id) {
  document.documentElement.setAttribute('data-theme', id)
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    /* ignore */
  }
}
