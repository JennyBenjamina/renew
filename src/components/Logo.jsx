/** Renew wordmark + mark. Colors come from theme tokens via currentColor. */
export default function Logo() {
  return (
    <span className="logo">
      <svg className="logo__mark" viewBox="0 0 32 32" width="30" height="30"
        fill="none" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="var(--color-primary)" />
        <path d="M16 8a8 8 0 1 0 5.7 2.35" stroke="var(--color-primary-contrast)"
          strokeWidth="2.4" strokeLinecap="round" />
        <path d="M22 7.5v4h-4" stroke="var(--color-primary-contrast)"
          strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="logo__word">Renew</span>
    </span>
  )
}
