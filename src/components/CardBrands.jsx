import './CardBrands.css'

/** Accepted card badges: Visa, Mastercard, American Express.
 *  Uses each brand's own mark colors (not the site theme) so they read as real
 *  card logos, on neutral white chips. */
export default function CardBrands({ className = '' }) {
  return (
    <div
      className={`cardbrands ${className}`}
      role="img"
      aria-label="We accept Visa, Mastercard, and American Express"
    >
      <span className="cardbrand cardbrand--visa">VISA</span>
      <span className="cardbrand cardbrand--mc" title="Mastercard">
        <svg viewBox="0 0 40 24" width="34" height="20" aria-hidden="true">
          <circle cx="16" cy="12" r="8" fill="#eb001b" />
          <circle cx="24" cy="12" r="8" fill="#f79e1b" />
          <path
            d="M20 5.6a8 8 0 0 0 0 12.8 8 8 0 0 0 0-12.8z"
            fill="#ff5f00"
          />
        </svg>
      </span>
      <span className="cardbrand cardbrand--amex">AMEX</span>
    </div>
  )
}
