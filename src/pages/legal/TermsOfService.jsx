import { Link } from 'react-router-dom'
import LegalLayout from './LegalLayout.jsx'

export default function TermsOfService() {
  return (
    <LegalLayout
      eyebrow="Renew"
      title="Terms of Service"
      intro="These terms govern your use of the Renew website and your purchase of our products. By accessing the site or placing an order, you agree to them."
    >
      <div className="legal__prose">
        <p className="legal__updated">Last updated: {new Date().getFullYear()}</p>

        <h2>1. Acceptance of these terms</h2>
        <p>
          By accessing this website, creating an account, or placing an order,
          you acknowledge that you have read, understood, and agree to be bound by
          these Terms of Service and our{' '}
          <Link to="/research-use-terms">Research Use Only Terms</Link>,{' '}
          <Link to="/refund-policy">Refund &amp; Returns Policy</Link>, and{' '}
          <Link to="/privacy-policy">Privacy Policy</Link>. If you do not agree, do
          not use the site.
        </p>

        <h2>2. Eligibility</h2>
        <p>
          You must be at least 21 years of age and legally able to enter into a
          binding contract to use this site or purchase our products. By ordering,
          you represent that you meet these requirements and that you are acquiring
          products for lawful research purposes only.
        </p>

        <h2>3. Research use only</h2>
        <p>
          All products sold by Renew are intended strictly for laboratory research
          use. They are not for human or animal consumption and are not approved to
          diagnose, treat, cure, or prevent any disease or condition. Full
          restrictions are set out in our{' '}
          <Link to="/research-use-terms">Research Use Only Terms</Link>, which are
          incorporated into these terms by reference.
        </p>

        <h2>4. Orders, pricing, and availability</h2>
        <p>
          All orders are subject to acceptance and product availability. We may
          refuse, cancel, or limit any order at our discretion, including where we
          suspect misuse or a violation of these terms. Prices, promotions, and
          product descriptions may change at any time without notice, and we are
          not liable for typographical errors.
        </p>

        <h2>5. Payment and delivery</h2>
        <p>
          Orders are fulfilled by local delivery, with payment collected at the
          time of delivery unless otherwise stated at checkout. Title and risk of
          loss pass to you upon delivery. You are responsible for providing
          accurate contact and delivery information.
        </p>

        <h2>6. Returns and refunds</h2>
        <p>
          Returns and refunds are governed by our{' '}
          <Link to="/refund-policy">Refund &amp; Returns Policy</Link>. In short, we
          accept returns and refunds only for products that are unused and unopened.
        </p>

        <h2>7. Acceptable use</h2>
        <p>
          You agree not to misuse the site, attempt to gain unauthorized access,
          interfere with its operation, or use it for any unlawful purpose. You
          agree not to resell, redistribute, or apply our products outside of
          controlled research settings.
        </p>

        <h2>8. Disclaimer of warranties</h2>
        <p>
          The site and products are provided “as is” and “as available.” To the
          fullest extent permitted by law, Renew disclaims all warranties, express
          or implied, including merchantability, fitness for a particular purpose,
          and non-infringement. We do not warrant that the site will be
          uninterrupted or error-free.
        </p>

        <h2>9. Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, Renew shall not be liable for any
          indirect, incidental, special, or consequential damages, or for any loss
          arising from the handling, storage, or misuse of our products. Our total
          liability for any claim will not exceed the amount you paid for the
          product giving rise to the claim.
        </p>

        <h2>10. Indemnification</h2>
        <p>
          You agree to indemnify and hold harmless Renew and its team from any
          claims, damages, or expenses arising out of your use of the site, your
          purchase or use of products, or your violation of these terms.
        </p>

        <h2>11. Changes to these terms</h2>
        <p>
          We may update these terms from time to time. Changes take effect when
          posted to this page, and your continued use of the site constitutes
          acceptance of the updated terms.
        </p>

        <h2>12. Governing law &amp; contact</h2>
        <p>
          These terms are governed by the laws of the state in which Renew operates,
          without regard to conflict-of-law principles. Questions about these terms
          can be sent to{' '}
          <a href="mailto:support@renewlabslv.com">support@renewlabslv.com</a>.
        </p>

        <p className="legal__note">
          This Terms of Service is a general template provided for the Renew MVP and
          should be reviewed and adapted by qualified legal counsel before launch to
          ensure it meets the requirements that apply to your business.
        </p>
      </div>
    </LegalLayout>
  )
}
