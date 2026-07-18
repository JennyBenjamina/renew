import MissionSection from '../components/MissionSection.jsx'
import AffiliateSection from '../components/AffiliateSection.jsx'
import './About.css'

const stats = [
  { value: '99.9%', label: 'Verified purity' },
  { value: '100%', label: 'Batches tested' },
  { value: 'ISO', label: 'Certified labs' },
  { value: '24/7', label: 'COA access' },
]

export default function About() {
  return (
    <div className="about">
      <header className="about__hero">
        <div className="container">
          <span className="eyebrow">About Renew</span>
          <h1>Uncompromising transparency and scientific rigor.</h1>
          <p>
            Renew equips research facilities with compounds that meet the
            highest standards of purity. We exist to make credible, reproducible
            research possible — starting with what’s in the vial.
          </p>
        </div>
      </header>

      <section className="section">
        <div className="container about__stats">
          {stats.map((s) => (
            <div className="about__stat" key={s.label}>
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      <MissionSection />

      <section className="section section--subtle">
        <div className="container about__values">
          <div className="section__head">
            <span className="eyebrow">Quality &amp; testing</span>
            <h2>How we guarantee what’s on the label</h2>
          </div>
          <div className="about__value-grid">
            <article>
              <h3>Third-party verification</h3>
              <p>
                Independent laboratories test every batch for identity,
                concentration, and purity. Certificates of Analysis are
                available for each compound so you can verify before you order.
              </p>
            </article>
            <article>
              <h3>Controlled synthesis</h3>
              <p>
                Production happens in ISO-certified facilities using advanced
                protocols designed to eliminate contaminants and preserve
                structural integrity from batch to batch.
              </p>
            </article>
            <article>
              <h3>Traceable batches</h3>
              <p>
                Every vial is labeled with dedicated areas for Lot and
                Reconstitution Date, making it simple to document and reproduce
                research conditions.
              </p>
            </article>
            <article>
              <h3>Research-use compliance</h3>
              <p>
                All products are intended strictly for laboratory research and
                are not for human consumption, medical, or veterinary use.
              </p>
            </article>
          </div>
        </div>
      </section>

      <AffiliateSection />
    </div>
  )
}
