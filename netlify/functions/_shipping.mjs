// Renew — ZIP-based shipping estimate (ships from Las Vegas, NV).
// Single source of truth for the shipping fee: the checkout page fetches an
// estimate from estimate-shipping.mjs (which calls this), and the payment
// functions recompute the fee here so the amount charged always matches.
//
// Method: buyer ZIP → US state (by leading 3 digits) → distance zone from
// Nevada → flat tier price. It's an estimate, not a live carrier rate.

const ZONE = {
  1: { fee: 8, name: 'Zone 1 · West' },
  2: { fee: 12, name: 'Zone 2 · Mountain/SW' },
  3: { fee: 15, name: 'Zone 3 · Central' },
  4: { fee: 18, name: 'Zone 4 · East/South' },
  5: { fee: 25, name: 'Zone 5 · AK/HI' },
}
const DEFAULT_ZONE = 3 // used when a ZIP can't be resolved

const STATE_ZONE = {
  NV: 1, CA: 1, AZ: 1, UT: 1, ID: 1, OR: 1,
  WA: 2, CO: 2, NM: 2, WY: 2, MT: 2,
  TX: 3, ND: 3, SD: 3, NE: 3, KS: 3, OK: 3, MN: 3, IA: 3, MO: 3, AR: 3, LA: 3, WI: 3, IL: 3,
  MI: 4, IN: 4, OH: 4, KY: 4, TN: 4, MS: 4, AL: 4, GA: 4, FL: 4, SC: 4, NC: 4, VA: 4,
  WV: 4, PA: 4, NY: 4, VT: 4, NH: 4, ME: 4, MA: 4, RI: 4, CT: 4, NJ: 4, DE: 4, MD: 4, DC: 4,
  AK: 5, HI: 5, PR: 5, GU: 5, VI: 5,
}

// Leading-3-digit ZIP ranges → state (standard USPS prefix allocation).
const ZIP3_RANGES = [
  [6, 9, 'PR'], [10, 27, 'MA'], [28, 29, 'RI'], [30, 38, 'NH'], [39, 49, 'ME'],
  [50, 54, 'VT'], [55, 55, 'MA'], [56, 59, 'VT'], [60, 69, 'CT'], [70, 89, 'NJ'],
  [100, 149, 'NY'], [150, 196, 'PA'], [197, 199, 'DE'], [200, 205, 'DC'],
  [206, 219, 'MD'], [220, 246, 'VA'], [247, 268, 'WV'], [270, 289, 'NC'],
  [290, 299, 'SC'], [300, 319, 'GA'], [320, 349, 'FL'], [350, 369, 'AL'],
  [370, 385, 'TN'], [386, 397, 'MS'], [398, 399, 'GA'], [400, 427, 'KY'],
  [430, 459, 'OH'], [460, 479, 'IN'], [480, 499, 'MI'], [500, 528, 'IA'],
  [530, 549, 'WI'], [550, 567, 'MN'], [569, 569, 'DC'], [570, 577, 'SD'],
  [580, 588, 'ND'], [590, 599, 'MT'], [600, 629, 'IL'], [630, 658, 'MO'],
  [660, 679, 'KS'], [680, 693, 'NE'], [700, 714, 'LA'], [716, 729, 'AR'],
  [730, 749, 'OK'], [750, 799, 'TX'], [800, 816, 'CO'], [820, 831, 'WY'],
  [832, 838, 'ID'], [840, 847, 'UT'], [850, 865, 'AZ'], [870, 884, 'NM'],
  [889, 898, 'NV'], [900, 961, 'CA'], [967, 968, 'HI'], [969, 969, 'GU'],
  [970, 979, 'OR'], [980, 994, 'WA'], [995, 999, 'AK'],
]

export function stateFromZip(zip) {
  const p = parseInt(String(zip || '').replace(/\D/g, '').slice(0, 3), 10)
  if (Number.isNaN(p)) return null
  for (const [lo, hi, st] of ZIP3_RANGES) if (p >= lo && p <= hi) return st
  return null
}

/** Estimate: { fee, zone, zoneName, state } for a destination ZIP. */
export function shippingEstimate(zip) {
  const state = stateFromZip(zip)
  const zone = (state && STATE_ZONE[state]) || DEFAULT_ZONE
  const z = ZONE[zone]
  return { fee: z.fee, zone, zoneName: z.name, state: state || null }
}
