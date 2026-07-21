import './legal.css'

/** Shared shell for legal/policy pages: a deco-band header with an eyebrow,
 *  title, intro, and optional action (e.g. a Print button), then page body. */
export default function LegalLayout({ eyebrow, title, intro, action, children }) {
  return (
    <div className="legal">
      <header className="legal__hero deco-band">
        <div className="container legal__hero-row">
          <div className="legal__hero-copy">
            <span className="eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            {intro && <p>{intro}</p>}
          </div>
          {action}
        </div>
      </header>

      <div className="container legal__body">{children}</div>
    </div>
  )
}
