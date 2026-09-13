import LegalLayout from "./LegalLayout.jsx";

export default function PrivacyPolicy() {
  return (
    <LegalLayout
      eyebrow="Renew"
      title="Privacy Policy"
      intro="This policy explains what information Renew collects, how it is used, and the choices you have."
    >
      <div className="legal__prose">
        <p className="legal__updated">
          Last updated: September 10, 2026
        </p>

        <h2>Information we collect</h2>
        <p>
          We collect information you provide directly — such as your name, email
          address, and order details when you make a purchase or contact us — as
          well as limited technical information (such as browser type and pages
          visited) collected automatically when you use the site.
        </p>

        <h2>How we use your information</h2>
        <ul>
          <li>To process and fulfill orders, including delivery</li>
          <li>To respond to compliance, documentation, and support requests</li>
          <li>To operate, maintain, and improve the website</li>
          <li>To meet legal, regulatory, and record-keeping obligations</li>
        </ul>

        <h2>Compliance records</h2>
        <p>
          When you accept our compliance notice or place an order, we record that
          acceptance on our servers — the terms version you agreed to, a
          timestamp, and, where you are signed in, your account — to document
          agreement to our Research Use Only terms. This authoritative record is
          kept server-side (not only in your browser) so it cannot be cleared
          from your device.
        </p>

        <h2>Text messages (SMS)</h2>
        <p>
          If you check the “Text me offers and updates” box at checkout and
          provide your mobile number, you consent to receive recurring marketing
          text messages from Renew Labs LV (offers, new-product and restock
          alerts). Consent is not a condition of any purchase. Message frequency
          varies, and message and data rates may apply. Reply <strong>STOP</strong>{" "}
          at any time to unsubscribe, or <strong>HELP</strong> for help.
        </p>
        <p>
          We do not sell, rent, or share your mobile phone number or SMS opt-in
          information with third parties or affiliates for their own marketing
          purposes. Your number is shared only with our SMS provider (Telnyx)
          solely to deliver the messages you requested, and your opt-out status
          is retained to honor your preferences.
        </p>

        <h2>Cookies and local storage</h2>
        <p>
          We also use your browser’s local storage for convenience — remembering
          your color theme, cart contents, and a short-lived flag so the
          compliance notice isn’t shown again on every visit. This device-side
          data is only a convenience; the authoritative acceptance record is the
          server-side one described above.
        </p>

        <h2>Sharing</h2>
        <p>
          We do not sell your personal information. We share it only with
          service providers who help us operate the site and fulfill orders, or
          where required by law.
        </p>

        <h2>Data retention</h2>
        <p>
          We retain information for as long as needed to provide our services
          and to satisfy legal, tax, and compliance requirements, after which it
          is deleted or anonymized.
        </p>

        <h2>Your choices</h2>
        <p>
          You may request access to, correction of, or deletion of your personal
          information, subject to legal limits. To make a request, contact us at{" "}
          <a href="mailto:privacy@renewlabslv.com">privacy@renewlabslv.com</a>.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this policy can be sent to{" "}
          <a href="mailto:privacy@renewlabslv.com">privacy@renewlabslv.com</a>.
        </p>
      </div>
    </LegalLayout>
  );
}
