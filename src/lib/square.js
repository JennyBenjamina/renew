/* Square Web Payments SDK loader. The card field is hosted by Square, so raw
 * card data never touches our code — tokenize() returns a single-use token we
 * send to the create-square-payment function to charge server-side. */

export function isSquareConfigured() {
  return Boolean(
    import.meta.env.VITE_SQUARE_APP_ID && import.meta.env.VITE_SQUARE_LOCATION_ID
  )
}

function sdkUrl() {
  const env = (import.meta.env.VITE_SQUARE_ENV || 'sandbox').toLowerCase()
  return env === 'production'
    ? 'https://web.squarecdn.com/v1/square.js'
    : 'https://sandbox.web.squarecdn.com/v1/square.js'
}

let paymentsPromise

/** Resolve to a Square `payments` instance (loads the SDK once). */
export function getSquarePayments() {
  if (!isSquareConfigured()) {
    return Promise.reject(new Error('Square is not configured.'))
  }
  if (!paymentsPromise) {
    paymentsPromise = new Promise((resolve, reject) => {
      if (window.Square) return resolve()
      const s = document.createElement('script')
      s.src = sdkUrl()
      s.async = true
      s.onload = () => resolve()
      s.onerror = () => reject(new Error('Failed to load the payment form.'))
      document.head.appendChild(s)
    }).then(() =>
      window.Square.payments(
        import.meta.env.VITE_SQUARE_APP_ID,
        import.meta.env.VITE_SQUARE_LOCATION_ID
      )
    )
  }
  return paymentsPromise
}
