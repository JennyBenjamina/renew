import { Link } from 'react-router-dom'
import './Hero.css'

export default function Hero() {
  return (
    <section className="hero deco-band">
      <div className="container hero__inner">
        <div className="hero__copy">
          <span className="eyebrow">Third-party tested purity</span>
          <span className="hero__local">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
              strokeLinejoin="round" aria-hidden="true">
              <path d="M12 21s7-5.2 7-11a7 7 0 0 0-14 0c0 5.8 7 11 7 11z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            Based in Las Vegas, Nevada
          </span>
          <h1 className="hero__title">
            Research compounds <span>synthesized for precision.</span>
          </h1>
          <p className="hero__lede">
            A Las Vegas–based lab, run by real people. Equip your research with
            premium peptides and compounds — hand-checked, third-party tested, and
            backed by people you can actually reach.
          </p>
          <div className="hero__actions">
            <Link to="/products" className="btn btn--primary">
              Shop Products
            </Link>
            <Link to="/partner" className="btn btn--outline">
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
          {/* Blurred color orbs make the product pop off the background. */}
          <span className="hero__orb hero__orb--1" />
          <span className="hero__orb hero__orb--2" />
          {/* Geometric accents around the image. */}
          <span className="hero__ring" />
          <span className="hero__ring hero__ring--sm" />
          <span className="hero__dots" />
          <figure className="hero__stage">
            <img
              className="hero__img"
              src="/hero-vial.png"
              alt="Renew Labs GLP-3 RETA research-grade compound vial"
              width="640"
              height="640"
              loading="eager"
              onError={(e) => {
                // Until public/hero-vial.png is added, hide the broken image.
                e.currentTarget.closest('.hero__art').classList.add('is-empty')
              }}
            />
          </figure>
        </div>
      </div>
    </section>
  )
}
