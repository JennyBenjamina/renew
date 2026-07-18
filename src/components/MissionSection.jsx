import './MissionSection.css'

const features = [
  {
    title: 'Verified Certificates of Analysis',
    body: 'Every batch undergoes rigorous third-party testing to guarantee exact concentration and purity, with comprehensive reports available for every compound.',
    icon: (
      <path d="M9 12l2 2 4-4M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
    ),
  },
  {
    title: 'Stringent Quality Control',
    body: 'Manufactured in ISO-certified laboratories using advanced synthesis protocols to eliminate contaminants and maintain absolute structural integrity.',
    icon: (
      <>
        <path d="M4 7h16M4 12h16M4 17h10" />
      </>
    ),
  },
  {
    title: 'Precision You Can Reproduce',
    body: 'Consistent, documented results across every vial — because reproducibility is the foundation of credible research.',
    icon: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l3 2" />
      </>
    ),
  },
]

export default function MissionSection() {
  return (
    <section className="section mission" id="mission">
      <div className="container">
        <div className="section__head">
          <span className="eyebrow">Our mission</span>
          <h2>Pioneering precision in scientific research.</h2>
          <p>
            At Renew, our mission is rooted in uncompromising transparency and
            scientific rigor. We provide research facilities with compounds that
            meet the highest standards of purity — ensuring reproducible,
            accurate results in every experiment.
          </p>
        </div>

        <div className="mission__grid">
          {features.map((f) => (
            <article className="mission__card" key={f.title}>
              <span className="mission__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none"
                  stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
                  strokeLinejoin="round">
                  {f.icon}
                </svg>
              </span>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
