import { useCart } from '../context/CartContext.jsx'
import { money } from '../lib/format.js'
import './ProductCard.css'

/** Placeholder product art — a themed vial illustration keyed off image_hue.
 *  Swap this for a real <img src={product.image_url} /> when you have photos. */
function VialArt({ hue = 150 }) {
  return (
    <svg className="pcard__art" viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <linearGradient id={`g${hue}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={`hsl(${hue} 40% 92%)`} />
          <stop offset="1" stopColor={`hsl(${hue} 35% 82%)`} />
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="14" fill={`url(#g${hue})`} />
      <rect x="50" y="24" width="20" height="8" rx="2" fill={`hsl(${hue} 30% 45%)`} />
      <rect x="52" y="32" width="16" height="6" fill={`hsl(${hue} 25% 60%)`} />
      <path d="M50 38h20v44a10 10 0 0 1-10 10 10 10 0 0 1-10-10V38z"
        fill="#fff" stroke={`hsl(${hue} 30% 55%)`} strokeWidth="2" />
      <rect x="50" y="66" width="20" height="16" rx="0"
        fill={`hsl(${hue} 45% 70%)`} opacity="0.55" />
    </svg>
  )
}

export default function ProductCard({ product }) {
  const { add } = useCart()
  const onSale = product.compare_at_price && product.compare_at_price > product.price

  return (
    <article className="pcard">
      <div className="pcard__media">
        <div className="pcard__flags">
          {product.badges?.includes('new') && (
            <span className="badge badge--new">New</span>
          )}
          {onSale && <span className="badge badge--sale">Sale</span>}
        </div>
        <span
          className={`badge ${
            product.in_stock ? 'badge--instock' : 'badge--outstock'
          } pcard__stock`}
        >
          {product.in_stock ? 'In Stock' : 'Out of Stock'}
        </span>
        {product.image_url ? (
          <img
            className="pcard__photo"
            src={product.image_url}
            alt={product.name}
            loading="lazy"
          />
        ) : (
          <VialArt hue={product.image_hue} />
        )}
      </div>

      <div className="pcard__body">
        <span className="badge badge--research">Research Only</span>
        <h3 className="pcard__name">{product.name}</h3>
        <p className="pcard__desc">{product.description}</p>

        <div className="pcard__meta">
          {product.purity && (
            <span className="pcard__purity">Purity {product.purity}</span>
          )}
        </div>

        <div className="pcard__footer">
          <div className="pcard__price">
            <span className="pcard__now">{money(product.price)}</span>
            {onSale && (
              <span className="pcard__was">
                {money(product.compare_at_price)}
              </span>
            )}
          </div>
          <button
            className="btn btn--primary pcard__add"
            disabled={!product.in_stock}
            onClick={() => add(product)}
          >
            {product.in_stock ? 'Add to Cart' : 'Sold Out'}
          </button>
        </div>
      </div>
    </article>
  )
}
