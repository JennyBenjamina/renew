import { Link } from 'react-router-dom'
import './Hero.css'

export default function Hero() {
  return (
    <section className="hero deco-band">
      <div className="container hero__inner">
        <div className="hero__copy">
          <span className="hero__local">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
              strokeLinejoin="round" aria-hidden="true">
              <path d="M12 21s7-5.2 7-11a7 7 0 0 0-14 0c0 5.8 7 11 7 11z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            Las Vegas, Nevada
          </span>

          <h1 className="hero__title">
            Research compounds from <span>real people in Las Vegas.</span>
          </h1>
          <p className="hero__lede">
            A small, independent Las Vegas lab — every batch third-party tested
            with a COA, packed and checked by hand, and delivered locally by
            people you can actually reach.
          </p>

          <div className="hero__actions">
            <Link to="/products" className="btn btn--primary">
              Shop Products →
            </Link>
            <Link to="/delivery" className="btn btn--outline">
              See local delivery
            </Link>
          </div>

          <ul className="hero__trust">
            <li>
              <strong>Local</strong>
              <span>Las Vegas delivery</span>
            </li>
            <li>
              <strong>99%+</strong>
              <span>Verified purity</span>
            </li>
            <li>
              <strong>COA</strong>
              <span>On every batch</span>
            </li>
          </ul>
        </div>

        {/* Friendly Renew mascot — GLP-3 RETA character. */}
        <div className="hero__art">
          <img
            className="hero__mascot"
            src="/hero-mascot.png"
            alt="Renew Labs GLP-3 RETA research compound mascot giving a thumbs up"
            loading="eager"
            width="472"
            height="636"
          />
        </div>
      </div>
    </section>
  )
}
