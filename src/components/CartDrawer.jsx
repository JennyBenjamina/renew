import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { money } from '../lib/format.js'
import './CartDrawer.css'

export default function CartDrawer() {
  const { items, open, closeCart, remove, setQty, subtotal, count } = useCart()
  const navigate = useNavigate()

  const goToCheckout = () => {
    closeCart()
    navigate('/checkout')
  }

  return (
    <>
      <div
        className={`drawer__scrim ${open ? 'is-open' : ''}`}
        onClick={closeCart}
        aria-hidden="true"
      />
      <aside
        className={`drawer ${open ? 'is-open' : ''}`}
        role="dialog"
        aria-label="Shopping cart"
        aria-hidden={!open}
      >
        <header className="drawer__head">
          <h3>Your Cart {count > 0 && <span>({count})</span>}</h3>
          <button className="drawer__close" onClick={closeCart} aria-label="Close cart">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        {items.length === 0 ? (
          <div className="drawer__empty">
            <p>Your cart is empty.</p>
            <span>Add research compounds from the products page to get started.</span>
          </div>
        ) : (
          <>
            <div className="drawer__items">
              {items.map((i) => (
                <div className="drawer__item" key={i.id}>
                  <div className="drawer__item-info">
                    <strong>{i.name}</strong>
                    <span>{money(i.price)}</span>
                  </div>
                  <div className="drawer__qty">
                    <button onClick={() => setQty(i.id, i.qty - 1)} aria-label="Decrease">
                      −
                    </button>
                    <span>{i.qty}</span>
                    <button onClick={() => setQty(i.id, i.qty + 1)} aria-label="Increase">
                      +
                    </button>
                  </div>
                  <button
                    className="drawer__remove"
                    onClick={() => remove(i.id)}
                    aria-label={`Remove ${i.name}`}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <footer className="drawer__foot">
              <div className="drawer__subtotal">
                <span>Subtotal</span>
                <strong>{money(subtotal)}</strong>
              </div>
              <button
                className="btn btn--primary btn--block"
                onClick={goToCheckout}
              >
                Checkout
              </button>
              <p className="drawer__note">
                Local pickup — no online payment. For research use only.
              </p>
            </footer>
          </>
        )}
      </aside>
    </>
  )
}
