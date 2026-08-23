/* Per-product Certificate of Analysis (COA) metadata, keyed by product slug.
 *
 * Every product currently shows as "In Testing". When a COA is ready to
 * publish, set that product's `status` to 'available' and make sure `pdf`,
 * `lot`, `purity`, etc. are filled — the COA page will then show a "View COA"
 * button linking to the PDF (hosted in public/coas/).
 *
 * The Retatrutide 15mg COA (Lot RNRT15001, tested by Freedom Diagnostics) is
 * already uploaded and wired below — flip its status to 'available' to publish.
 */

export const COA_DEFAULT_STATUS = 'testing' // for any product without an entry

export const coas = {
  'glp3-reta-15mg': {
    status: 'available', // published — shows a "View COA" button linking the PDF
    lot: 'RNRT15001',
    purity: '99.57%',
    net_content: '14.05 mg',
    identity: 'Confirmed',
    tested_by: 'Freedom Diagnostics',
    reported: '2026-08-21',
    pdf: '/coas/coa-rt15.pdf',
  },
}

/** Merge a product with its COA record (or a default "testing" record). */
export function coaFor(product) {
  const rec = coas[product.slug] || {}
  return {
    status: rec.status || COA_DEFAULT_STATUS,
    lot: rec.lot || null,
    purity: rec.purity || product.purity || null,
    net_content: rec.net_content || null,
    identity: rec.identity || null,
    tested_by: rec.tested_by || null,
    reported: rec.reported || null,
    pdf: rec.pdf || null,
  }
}
