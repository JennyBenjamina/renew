import { Link } from 'react-router-dom'
import './LocalSection.css'

const points = [
  {
    title: 'Las Vegas, Nevada',
    body: 'Our lab and our people are based right here in the Las Vegas valley — not routed through an anonymous overseas warehouse. When you order from Renew, you’re ordering local.',
    icon: (
      <>
        <path d="M12 21s7-5.2 7-11a7 7 0 0 0-14 0c0 5.8 7 11 7 11z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
  },
  {
    title: 'Talk to a real person',
    body: 'A small, independent team answers every message — no call centers, no bots. Reach out and a real member of Renew gets back to you and stands behind every vial we send.',
    icon: (
      <>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <path d="M8 9h8M8 13h5" />
      </>
    ),
  },
  {
    title: 'Hand-checked & locally delivered',
    body: 'Every order is packed and quality-checked by us before it goes out, with fast local delivery across the Las Vegas area — real hands on every package.',
    icon: (
      <>
        <path d="M3 7l9-4 9 4v10l-9 4-9-4z" />
        <path d="M3 7l9 4 9-4M12 11v10" />
      </>
    ),
  },
]

export default function LocalSection() {
  return (
    <section className="section local" id="local">
      <div className="container">
        <div className="section__head">
          <span className="eyebrow">Local &amp; independent</span>
          <h2>Real people, right here in Las Vegas.</h2>
          <p>
            Renew isn’t a faceless dropshipper. We’re a small, independent
            team in Las Vegas, Nevada — synthesizing, checking, and delivering
            research compounds ourselves, and standing behind every batch.
          </p>
        </div>

        <div className="local__grid">
          {points.map((p) => (
            <article className="local__card" key={p.title}>
              <span className="local__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none"
                  stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
                  strokeLinejoin="round">
                  {p.icon}
                </svg>
              </span>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </article>
          ))}
        </div>

        <div className="local__cta">
          <Link to="/delivery" className="btn btn--primary">
            See local delivery
          </Link>
          <Link to="/coas" className="btn btn--outline">
            View our lab results
          </Link>
        </div>
      </div>
    </section>
  )
}
