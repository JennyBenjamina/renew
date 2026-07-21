import { Link } from 'react-router-dom'
import LegalLayout from './LegalLayout.jsx'

const sections = [
  {
    title: 'Introduction',
    icon: (
      <>
        <path d="M4 5h16M4 12h16M4 19h10" />
      </>
    ),
    body: 'These terms and conditions govern your purchase and use of products from Renew. By accessing our site or purchasing our products, you explicitly acknowledge and agree to these terms. Renew reserves the right to deny service or cancel orders from any individual or entity suspected of misuse or violation of this agreement.',
  },
  {
    title: 'Intended Use',
    icon: (
      <>
        <rect x="6" y="3" width="12" height="18" rx="2" />
        <path d="M9 8h6M9 12h6" />
      </>
    ),
    body: 'All products sold by Renew are explicitly designated for RESEARCH USE ONLY (RUO). They are intended strictly for laboratory and in-vitro testing by qualified researchers and academic institutions. Our compounds are not intended for clinical, therapeutic, diagnostic, or human application.',
  },
  {
    title: 'Lawful Purposes',
    icon: (
      <>
        <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
        <path d="M9 12l2 2 4-4" />
      </>
    ),
    body: 'You certify that you are purchasing these products exclusively for lawful research purposes. It is your strict responsibility to understand and comply with all local, state, and federal regulations regarding the acquisition, handling, and application of these research compounds in your jurisdiction.',
  },
  {
    title: 'Product Restrictions',
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M5.6 5.6l12.8 12.8" />
      </>
    ),
    body: 'Under no circumstances are these products to be used for human consumption, animal consumption (veterinary use), food additives, dietary supplements, cosmetics, household chemicals, or any unauthorized clinical trial. Misuse of these compounds carries severe legal and health risks.',
  },
  {
    title: 'Liability Disclaimer',
    icon: (
      <>
        <path d="M12 3l9 16H3z" />
        <path d="M12 10v4M12 17h.01" />
      </>
    ),
    body: 'Renew assumes no liability for any damages, injuries, legal consequences, or financial losses resulting from the handling, storage, or misuse of our products. The purchaser bears full responsibility for any risks associated with the procurement and application of these research compounds.',
  },
  {
    title: 'Age & Qualification Verification',
    icon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M5 20a7 7 0 0 1 14 0" />
      </>
    ),
    body: 'By purchasing from Renew, you attest that you are at least 21 years of age and possess the necessary academic, institutional, or professional qualifications to safely handle and research these compounds.',
  },
  {
    title: 'Compliance Acknowledgment',
    icon: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M8 12l3 3 5-5" />
      </>
    ),
    body: 'During the checkout process, you will be required to legally acknowledge and sign off on our compliance requirements. Falsifying this acknowledgment or providing deceptive information regarding your research intent constitutes a breach of this agreement.',
  },
  {
    title: 'Contact Information',
    icon: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M4 7l8 6 8-6" />
      </>
    ),
    body: 'If you have any questions regarding compliance, documentation, or acceptable use of our products, please contact our compliance team directly at compliance@renewpeptides.com prior to placing an order.',
  },
]

export default function ResearchUseTerms() {
  return (
    <LegalLayout
      eyebrow="Renew Compliance Policy"
      title={
        <>
          Research Use Only —<br />
          Terms &amp; Conditions
        </>
      }
      intro="Strict adherence to these terms is mandatory for all transactions and engagements with Renew. Please read carefully before purchasing."
      action={
        <button className="btn btn--outline legal__print" onClick={() => window.print()}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
            stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
            strokeLinejoin="round">
            <path d="M6 9V3h12v6" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="7" />
          </svg>
          Print Policy
        </button>
      }
    >
      <ol className="legal__cards">
        {sections.map((s, i) => (
          <li className="legal__card" key={s.title}>
            <span className="legal__card-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
                stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
                strokeLinejoin="round">
                {s.icon}
              </svg>
            </span>
            <div className="legal__card-text">
              <h2>
                {i + 1}. {s.title}
              </h2>
              <p>{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="legal__cta">
        <h3>Ready to proceed with your research?</h3>
        <Link to="/products" className="btn btn--primary">
          View Catalog
        </Link>
      </div>
    </LegalLayout>
  )
}
