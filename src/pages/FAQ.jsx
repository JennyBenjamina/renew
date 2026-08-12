import { useState } from 'react'
import { Link } from 'react-router-dom'
import LegalLayout from './legal/LegalLayout.jsx'
import './faq.css'

/* FAQ content. Items flagged `locked` relate to shipping, which isn't live yet:
 * their answer is blurred behind a "Shipping soon" badge. When shipping is
 * ready, simply remove `locked: true` (or set it to false) to activate them. */
const faqs = [
  {
    q: 'How fast does this ship?',
    a: "Orders placed before 2pm PST ship the same business day from our US facility. Standard delivery is 2–4 business days; expedited options are available at checkout. You'll receive a tracking number as soon as the label is created.",
    locked: true,
  },
  {
    q: "What's included with each vial?",
    a: 'Every order ships with the lyophilized vial, a tamper-evident seal, and a packing slip referencing the batch ID. The matching certificate of analysis is available on this page and in your account downloads after purchase.',
  },
  {
    q: 'How is purity verified?',
    a: 'Every batch is tested by an independent lab using HPLC for purity and LC-MS for identity. The COA is stamped with the batch number, test date, and lab name and uploaded to this page before any vial from that lot ships.',
  },
  {
    q: 'How should this be stored?',
    a: 'Lyophilized peptides are stable at room temperature for short-term shipping but should be kept at −4°F for long-term storage. Reconstituted product should be refrigerated at 36–46°F and used within the window noted on the COA.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'All major credit and debit cards through our secure checkout. We do not store payment information; transactions are processed by a PCI-compliant gateway.',
  },
  {
    q: "What's your return policy?",
    a: "If your order arrives damaged or doesn't match the COA, contact us within 30 days for a full refund or replacement. Because of the research-use nature of these products, we cannot accept returns of opened vials outside of those circumstances.",
  },
  {
    q: 'Do you ship internationally?',
    a: "Currently US-only. International shipping is on the roadmap but not yet enabled — sign up for our list and you'll be notified when we open more regions.",
    locked: true,
  },
  {
    q: 'Are these products for human use?',
    a: 'No. All products on this site are sold for laboratory research use only. They are not intended to diagnose, treat, cure, or prevent any disease, and are not for human or veterinary consumption. By purchasing you confirm you are a qualified researcher.',
  },
]

function FaqItem({ item, isOpen, onToggle }) {
  if (item.locked) {
    return (
      <div className="faq__item faq__item--locked">
        <div className="faq__q faq__q--locked">
          <span>{item.q}</span>
          <span className="faq__badge">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              strokeLinejoin="round">
              <rect x="4" y="11" width="16" height="9" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            Shipping soon
          </span>
        </div>
        <p className="faq__a faq__a--blurred" aria-hidden="true">
          {item.a}
        </p>
      </div>
    )
  }

  return (
    <div className={`faq__item${isOpen ? ' is-open' : ''}`}>
      <button
        type="button"
        className="faq__q"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <span>{item.q}</span>
        <svg className="faq__chevron" viewBox="0 0 24 24" width="18" height="18"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {isOpen && <p className="faq__a">{item.a}</p>}
    </div>
  )
}

export default function FAQ() {
  const [open, setOpen] = useState(null)

  return (
    <LegalLayout
      eyebrow="Renew Support"
      title="Frequently Asked Questions"
      intro="Answers to the questions we hear most about our research compounds, testing, and ordering. Still need help? Reach us at support@renewlabslv.com."
    >
      <div className="faq">
        {faqs.map((item, i) => (
          <FaqItem
            key={item.q}
            item={item}
            isOpen={open === i}
            onToggle={() => setOpen(open === i ? null : i)}
          />
        ))}
      </div>

      <div className="legal__cta">
        <h3>Still have a question?</h3>
        <a href="mailto:support@renewlabslv.com" className="btn btn--primary">
          Email Support
        </a>
      </div>

      <p className="legal__note" style={{ marginTop: 'var(--space-6)' }}>
        Looking for a batch report? Browse our{' '}
        <Link to="/certificates-of-analysis">Certificates of Analysis</Link> or
        view the full <Link to="/refund-policy">Refund &amp; Returns</Link> policy.
      </p>
    </LegalLayout>
  )
}
