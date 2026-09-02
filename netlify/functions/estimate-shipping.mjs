// Renew — public shipping estimate for the checkout page.
// GET or POST with a ZIP; returns { fee, zone, zoneName }. No secrets.

import { shippingEstimate } from './_shipping.mjs'

const json = (status, body) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export async function handler(event) {
  let zip = ''
  if (event.httpMethod === 'GET') {
    zip = event.queryStringParameters?.zip || ''
  } else if (event.httpMethod === 'POST') {
    try {
      zip = JSON.parse(event.body || '{}').zip || ''
    } catch {
      return json(400, { error: 'Invalid JSON.' })
    }
  } else {
    return json(405, { error: 'Method not allowed' })
  }

  const est = shippingEstimate(zip)
  return json(200, est)
}
