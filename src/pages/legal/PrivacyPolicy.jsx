import LegalLayout from './LegalLayout.jsx'

export default function PrivacyPolicy() {
  return (
    <LegalLayout
      eyebrow="Renew"
      title="Privacy Policy"
      intro="This policy explains what information Renew collects, how it is used, and the choices you have."
    >
      <div className="legal__prose">
        <p className="legal__updated">Last updated: {new Date().getFullYear()}</p>

        <h2>Information we collect</h2>
        <p>
          We collect information you provide directly — such as your name, email
          address, and order details when you make a purchase or contact us — as
          well as limited technical information (such as browser type and pages
          visited) collected automatically when you use the site.
        </p>

        <h2>How we use your information</h2>
        <ul>
          <li>To process and fulfill orders, including local pickup</li>
          <li>To respond to compliance, documentation, and support requests</li>
          <li>To operate, maintain, and improve the website</li>
          <li>To meet legal, regulatory, and record-keeping obligations</li>
        </ul>

        <h2>Compliance records</h2>
        <p>
          When you accept our compliance notice, we record that an acceptance
          occurred (the terms version and a timestamp) to document agreement to
          our Research Use Only terms. This record does not include personal
          identifiers beyond what is necessary for that purpose.
        </p>

        <h2>Cookies and local storage</h2>
        <p>
          We use your browser’s local storage to remember preferences — such as
          your color theme, cart contents, and whether you have accepted the
          compliance notice — so the site works smoothly on return visits. This
          information stays on your device.
        </p>

        <h2>Sharing</h2>
        <p>
          We do not sell your personal information. We share it only with service
          providers who help us operate the site and fulfill orders, or where
          required by law.
        </p>

        <h2>Data retention</h2>
        <p>
          We retain information for as long as needed to provide our services and
          to satisfy legal, tax, and compliance requirements, after which it is
          deleted or anonymized.
        </p>

        <h2>Your choices</h2>
        <p>
          You may request access to, correction of, or deletion of your personal
          information, subject to legal limits. To make a request, contact us at{' '}
          <a href="mailto:privacy@renewpeptides.com">privacy@renewpeptides.com</a>.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this policy can be sent to{' '}
          <a href="mailto:privacy@renewpeptides.com">privacy@renewpeptides.com</a>.
        </p>

        <p className="legal__note">
          This privacy policy is a general template provided for the Renew MVP and
          should be reviewed and adapted by qualified legal counsel before launch
          to ensure it meets the requirements that apply to your business.
        </p>
      </div>
    </LegalLayout>
  )
}
