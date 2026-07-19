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

        <div className="hero__art">
          <div className="hero__glow" aria-hidden="true" />
          <figure className="hero__frame">
            <img
              className="hero__img"
              src="/hero-vial.png"
              alt="Renew Labs GLP-3 RETA research-grade compound vial"
              width="640"
              height="640"
              loading="eager"
              onError={(e) => {
                // Until public/hero-vial.png is added, hide the broken image and
                // let the framed gradient stand in.
                e.currentTarget.style.display = 'none'
              }}
            />
          </figure>
        </div>
      </div>
    </section>
  )
}
