import { useState } from 'react'
import './LocalPickup.css'

const steps = [
  {
    n: '01',
    title: 'Place your order online',
    body: 'Add research compounds to your cart and select “Local Pickup” at checkout. No shipping fees apply.',
  },
  {
    n: '02',
    title: 'Get your confirmation',
    body: 'You’ll receive a pickup code by email, usually within a few hours, once your order is packed and verified.',
  },
  {
    n: '03',
    title: 'Collect at the lab',
    body: 'Bring your pickup code and a valid ID to our facility during pickup hours. Orders are held for 7 days.',
  },
]

export default function LocalPickup() {
  const [sent, setSent] = useState(false)

  return (
    <div className="pickup">
      <header className="pickup__hero">
        <div className="container">
          <span className="eyebrow">Local pickup</span>
          <h1>Collect your order in person.</h1>
          <p>
            Skip shipping and pick up your research compounds directly from our
            facility. Available to verified researchers in the local area.
          </p>
        </div>
      </header>

      <section className="section">
        <div className="container">
          <div className="section__head">
            <h2>How local pickup works</h2>
            <p>Three simple steps from order to collection.</p>
          </div>

          <div className="pickup__steps">
            {steps.map((s) => (
              <article className="pickup__step" key={s.n}>
                <span className="pickup__num">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--subtle">
        <div className="container pickup__lower">
          <div className="pickup__info">
            <h2>Pickup location &amp; hours</h2>
            <dl>
              <div>
                <dt>Facility</dt>
                <dd>Renew Research Labs — Receiving Bay B</dd>
              </div>
              <div>
                <dt>Hours</dt>
                <dd>Mon–Fri, 10:00 AM – 5:00 PM</dd>
              </div>
              <div>
                <dt>What to bring</dt>
                <dd>Your pickup code and a valid government-issued ID.</dd>
              </div>
              <div>
                <dt>Hold period</dt>
                <dd>Orders are held for 7 days after confirmation.</dd>
              </div>
            </dl>
            <p className="pickup__note">
              Address details are shared in your pickup confirmation email for
              verified orders only.
            </p>
          </div>

          <form
            className="pickup__form"
            onSubmit={(e) => {
              e.preventDefault()
              setSent(true)
            }}
          >
            <h3>Check pickup eligibility</h3>
            {sent ? (
              <p className="pickup__success">
                Thanks — we’ll email you whether local pickup is available for
                your area. (This form is a placeholder in the MVP.)
              </p>
            ) : (
              <>
                <label>
                  Email
                  <input type="email" required placeholder="you@lab.com" />
                </label>
                <label>
                  ZIP / Postal code
                  <input type="text" required placeholder="00000" />
                </label>
                <button type="submit" className="btn btn--primary btn--block">
                  Check availability
                </button>
              </>
            )}
          </form>
        </div>
      </section>
    </div>
  )
}
