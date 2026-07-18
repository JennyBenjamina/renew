import { createContext, useContext, useMemo, useReducer } from 'react'

const CartContext = createContext(null)

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
  const [state, dispatch] = useReducer(reducer, { items: [], open: false })

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
