import './AffiliateSection.css'

const perks = [
  { tag: 'BEST', title: 'Commission rates', body: 'Industry-leading payouts on every referred order.' },
  { tag: 'EXCLUSIVE', title: 'Discounts for your audience', body: 'Unique codes that reward the researchers who follow you.' },
  { tag: 'TRUSTED', title: 'A credible research brand', body: 'Professional, lab-focused presentation you can stand behind.' },
]

export default function AffiliateSection() {
  return (
    <section className="section section--subtle affiliate" id="affiliate">
      <div className="container affiliate__inner">
        <div className="affiliate__copy">
          <span className="eyebrow">Partner with Renew</span>
          <h2>Earn by recommending the industry standard.</h2>
          <p>
            Are you an influencer, independent researcher, or content creator in
            the scientific community? Join our affiliate program and earn by
            recommending research compounds you can trust.
          </p>
          <button
            className="btn btn--primary"
            onClick={() =>
              alert('Affiliate application form is a placeholder in this MVP.')
            }
          >
            Apply for Partnership
          </button>
        </div>

        <div className="affiliate__perks">
          {perks.map((p) => (
            <div className="affiliate__perk" key={p.title}>
              <span className="badge affiliate__tag">{p.tag}</span>
              <div>
                <strong>{p.title}</strong>
                <span>{p.body}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
