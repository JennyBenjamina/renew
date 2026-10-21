/* Researcher registration rules (compliance gate). Any email address may
 * register (personal ones included). The institution and attestations are
 * enforced again in the database by supabase/researcher_approval.sql. */

export const emailDomain = (email = '') => email.trim().toLowerCase().split('@')[1] || ''

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** The four statements a registrant must confirm (stored on their profile). */
export const ATTESTATIONS = [
  { key: 'attest_age_21', label: <>I confirm I am <strong>21 years of age or older</strong>.</> },
  { key: 'attest_researcher', label: <>I am a <strong>qualified researcher</strong> or affiliated with a research institution.</> },
  { key: 'attest_research_only', label: <>All products are for <strong>in-vitro laboratory research only</strong>, never for human or animal use.</> },
  { key: 'attest_terms', label: null }, // rendered with links in Signup
]

/** Returns { field: message } for every problem with the registration. */
export function validateRegistration(form) {
  const errors = {}
  const email = form.email.trim()
  if (!email) errors.email = 'Enter your email address.'
  else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.'
  const inst = form.institution.trim()
  if (!inst) errors.institution = 'Enter your registered business or institution.'
  else if (inst.length < 3) errors.institution = 'Enter the full name of your business or institution.'
  if (form.password.length < 8) errors.password = 'Password must be at least 8 characters.'
  if (ATTESTATIONS.some((a) => !form[a.key])) {
    errors.attestations = 'Confirm every statement to create an account.'
  }
  return errors
}
