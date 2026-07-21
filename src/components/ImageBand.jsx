import { Link } from 'react-router-dom'
import './ImageBand.css'

/** Full-width image + copy section. Set `reverse` to put the image on the left. */
export default function ImageBand({
  image,
  alt,
  eyebrow,
  title,
  body,
  ctaLabel,
  ctaTo,
  reverse = false,
  subtle = false,
}) {
  return (
    <section className={`iband section ${subtle ? 'section--subtle' : ''}`}>
      <div className={`container iband__inner ${reverse ? 'iband__inner--rev' : ''}`}>
        <figure className="iband__media">
          <img src={image} alt={alt} loading="lazy" />
        </figure>
        <div className="iband__copy">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h2>{title}</h2>
          <p>{body}</p>
          {ctaLabel && ctaTo && (
            <Link to={ctaTo} className="btn btn--primary">
              {ctaLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
