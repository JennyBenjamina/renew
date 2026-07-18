import { Link } from 'react-router-dom'
import './Hero.css'

export default function Hero() {
  return (
    <section className="hero">
      <div className="container hero__inner">
        <div className="hero__copy">
          <span className="eyebrow">Third-party tested purity</span>
          <h1 className="hero__title">
            Research compounds <span>synthesized for precision.</span>
          </h1>
          <p className="hero__lede">
            Equip your laboratory with premium peptides and compounds
            manufactured under strict, verified quality controls.
          </p>
          <div className="hero__actions">
            <Link to="/catalog" className="btn btn--primary">
              Shop Catalog
            </Link>
            <Link to="/about" className="btn btn--outline">
              Our Quality Standards
            </Link>
          </div>

          <ul className="hero__trust">
            <li>
              <strong>99.9%</strong>
              <span>Verified purity</span>
            </li>
            <li>
              <strong>ISO</strong>
              <span>Certified synthesis</span>
            </li>
            <li>
              <strong>3rd-party</strong>
              <span>Batch tested</span>
            </li>
          </ul>
        </div>

        <div className="hero__art" aria-hidden="true">
          <div className="hero__glow" />
          <svg viewBox="0 0 320 340" className="hero__vial">
            <defs>
              <linearGradient id="hv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--color-bg-raised)" />
                <stop offset="1" stopColor="var(--color-bg-subtle)" />
              </linearGradient>
            </defs>
            <rect x="30" y="30" width="260" height="280" rx="24"
              fill="url(#hv)" stroke="var(--color-border)" />
            <rect x="140" y="70" width="40" height="16" rx="4"
              fill="var(--color-primary)" />
            <rect x="146" y="86" width="28" height="10"
              fill="var(--color-accent)" />
            <path d="M140 96h40v120a20 20 0 0 1-20 20 20 20 0 0 1-20-20V96z"
              fill="var(--color-bg-raised)" stroke="var(--color-primary)"
              strokeWidth="3" />
            <rect x="140" y="170" width="40" height="46"
              fill="var(--color-accent)" opacity="0.35" />
            <text x="160" y="270" textAnchor="middle"
              fontFamily="var(--font-display)" fontSize="15"
              fill="var(--color-text-muted)">RENEW · Lot ____</text>
          </svg>
        </div>
      </div>
    </section>
  )
}
