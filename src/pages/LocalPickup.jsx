import { useState } from "react";
import { PICKUP_PHONE, PICKUP_PHONE_HREF } from "../lib/orders.js";
import "./LocalPickup.css";

const steps = [
  {
    n: "01",
    title: "Place your order online",
    body: "Add research compounds to your cart and check out. No online payment — you pay on delivery.",
  },
  {
    n: "02",
    title: "We confirm your order",
    body: "A member of our team reaches out within 24 hours to arrange a convenient delivery time.",
  },
  {
    n: "03",
    title: "We deliver to you",
    body: "We hand-deliver your order and collect payment in person — fast, discreet, and local.",
  },
];

export default function LocalPickup() {
  const [sent, setSent] = useState(false);

  return (
    <div className="pickup">
      <header className="pickup__hero deco-band">
        <div className="container">
          <span className="eyebrow">Delivery</span>
          <h1>Delivered right to you.</h1>
          <p>
            We bring your research compounds directly to you. Place your order
            online and we’ll arrange a convenient delivery — available to
            verified researchers in the local area.
          </p>
        </div>
      </header>

      <section className="section">
        <div className="container">
          <div className="section__head">
            <h2>How delivery works</h2>
            <p>Three simple steps from order to your door.</p>
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
            <h2>Delivery details</h2>
            <dl>
              <div>
                <dt>Delivery area</dt>
                <dd>Available to verified researchers in the local area.</dd>
              </div>
              <div>
                <dt>Hours</dt>
                <dd>Mon–Sun, 10:00 AM – 5:00 PM</dd>
              </div>
              <div>
                <dt>What to have ready</dt>
                <dd>Payment and a valid government-issued ID.</dd>
              </div>
              <div>
                <dt>Scheduling</dt>
                <dd>We reach out within 24 hours to arrange your delivery.</dd>
              </div>
              <div>
                <dt>Contact</dt>
                <dd>
                  Abraham at{" "}
                  <a href={PICKUP_PHONE_HREF} className="pickup__phone">
                    {PICKUP_PHONE}
                  </a>
                </dd>
              </div>
            </dl>
            <p className="pickup__note">
              Delivery details are confirmed by phone or email for verified
              orders only. Questions? Call us at{" "}
              <a href={PICKUP_PHONE_HREF}>{PICKUP_PHONE}</a>.
            </p>
          </div>

          <form
            className="pickup__form"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            <h3>Check delivery availability</h3>
            {sent ? (
              <p className="pickup__success">
                Thanks — we’ll email you whether delivery is available for your
                area. (This form is a placeholder in the MVP.)
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
  );
}
