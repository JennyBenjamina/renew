import './Logo.css'

/** Renew brand logo (cropped transparent wordmark).
 *  Pass `light` on dark backgrounds (e.g. the footer) for the white variant.
 *  Sizing is controlled per placement via CSS. */
export default function Logo({ light = false }) {
  return (
    <span className="logo">
      <img
        className="logo__img"
        src={light ? '/logo-mark-light.png' : '/logo-mark.png'}
        alt="Renew Peptides"
      />
    </span>
  )
}
