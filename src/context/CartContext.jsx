import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react'

const CartContext = createContext(null)

const STORAGE_KEY = 'renew.cart'
const CART_TTL = 14 * 24 * 60 * 60 * 1000 // 14 days, matching the compliance gate

/** Load a previously saved cart from localStorage, ignoring expired or
 *  malformed data. Runs once when the provider mounts. */
function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const saved = JSON.parse(raw)
    if (!saved || !Array.isArray(saved.items)) return []
    if (saved.savedAt && Date.now() - saved.savedAt > CART_TTL) return []
    return saved.items
  } catch {
    return []
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'add': {
      const existing = state.items.find((i) => i.id === action.product.id)
      const items = existing
        ? state.items.map((i) =>
            i.id === action.product.id ? { ...i, qty: i.qty + 1 } : i
          )
        : [...state.items, { ...action.product, qty: 1 }]
      return { items, open: true }
    }
    case 'remove':
      return { ...state, items: state.items.filter((i) => i.id !== action.id) }
    case 'setQty':
      return {
        ...state,
        items: state.items
          .map((i) =>
            i.id === action.id ? { ...i, qty: Math.max(0, action.qty) } : i
          )
          .filter((i) => i.qty > 0),
      }
    case 'open':
      return { ...state, open: true }
    case 'close':
      return { ...state, open: false }
    case 'clear':
      return { items: [], open: false }
    default:
      return state
  }
}

export function CartProvider({ children }) {
  // Lazily initialize from localStorage so a returning visitor keeps their cart.
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    items: loadCart(),
    open: false,
  }))

  // Persist the cart (items only — not the open/closed drawer state) whenever
  // it changes, so it survives refreshes and closing the tab.
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ items: state.items, savedAt: Date.now() })
      )
    } catch {
      /* localStorage unavailable — cart simply won't persist */
    }
  }, [state.items])

  const value = useMemo(() => {
    const count = state.items.reduce((n, i) => n + i.qty, 0)
    const subtotal = state.items.reduce((s, i) => s + i.price * i.qty, 0)
    return {
      items: state.items,
      open: state.open,
      count,
      subtotal,
      add: (product) => dispatch({ type: 'add', product }),
      remove: (id) => dispatch({ type: 'remove', id }),
      setQty: (id, qty) => dispatch({ type: 'setQty', id, qty }),
      openCart: () => dispatch({ type: 'open' }),
      closeCart: () => dispatch({ type: 'close' }),
      clear: () => dispatch({ type: 'clear' }),
    }
  }, [state])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
