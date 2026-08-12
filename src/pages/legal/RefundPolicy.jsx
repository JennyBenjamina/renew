import { Link } from 'react-router-dom'
import LegalLayout from './LegalLayout.jsx'

export default function RefundPolicy() {
  return (
    <LegalLayout
      eyebrow="Renew"
      title="Refund & Returns Policy"
      intro="We want you to be confident in your order. Returns and refunds are available for products that are unused and unopened."
    >
      <div className="legal__prose">
        <p className="legal__updated">Last updated: {new Date().getFullYear()}</p>

        <h2>Eligibility for a return or refund</h2>
        <p>To qualify for a return or refund, the product must be:</p>
        <ul>
          <li>
            <strong>Unused and unopened</strong> — seals and packaging intact, with
            no signs of use.
          </li>
          <li>In its original packaging and labeling.</li>
          <li>
            Requested within <strong>14 days</strong> of the delivery date.
          </li>
        </ul>

        <h2>What cannot be returned</h2>
        <p>
          For the safety and integrity of research materials, we cannot accept
          returns of items that have been <strong>opened or used</strong>, including
          any vial whose seal has been broken or that has been reconstituted. This
          also applies to bacteriostatic water and any consumable supplies once
          opened. Such items are non-returnable and non-refundable.
        </p>

        <h2>Damaged, defective, or incorrect items</h2>
        <p>
          If your order arrives damaged, defective, or incorrect, contact us within
          <strong> 48 hours</strong> of delivery with your order number and photos
          of the item and packaging. We will arrange a replacement or a full refund
          at no cost to you.
        </p>

        <h2>How to request a return or refund</h2>
        <p>
          Email{' '}
          <a href="mailto:support@renewlabslv.com">support@renewlabslv.com</a> with
          your order number and the reason for the return. We’ll confirm whether
          your item qualifies and provide return instructions. Please do not send
          items back before receiving confirmation.
        </p>

        <h2>Refunds</h2>
        <p>
          Once we receive and inspect the returned item and confirm it is unused and
          unopened, we’ll issue your refund to the original method of payment.
          Refunds are typically processed within <strong>5–10 business days</strong>,
          though your bank or card issuer may take additional time to post it.
        </p>

        <h2>Return shipping</h2>
        <p>
          Unless the return is due to our error (a damaged, defective, or incorrect
          item), you are responsible for return shipping costs. Original delivery or
          shipping fees are non-refundable.
        </p>

        <h2>Order cancellations</h2>
        <p>
          You may cancel an order before it has been delivered by contacting us as
          soon as possible. Once an order has been delivered, the return conditions
          above apply.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about a return or refund? Email{' '}
          <a href="mailto:support@renewlabslv.com">support@renewlabslv.com</a>. See
          also our <Link to="/terms-of-service">Terms of Service</Link>.
        </p>

        <p className="legal__note">
          All products are intended for laboratory research use only and are not for
          human or animal consumption. This policy is a general template for the
          Renew MVP and should be reviewed by qualified legal counsel before launch.
        </p>
      </div>
    </LegalLayout>
  )
}
