/* Researcher registration rules (compliance gate). Only institutional or
 * business emails may register. The same personal-domain list, institution and
 * attestations are enforced again in the database by
 * supabase/researcher_approval.sql, so the form can't be bypassed. */

export const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com','googlemail.com','yahoo.com','ymail.com','rocketmail.com',
  'outlook.com','hotmail.com','live.com','msn.com','icloud.com','me.com',
  'mac.com','aol.com','proton.me','protonmail.com','pm.me','gmx.com','gmx.net',
  'mail.com','zoho.com','zohomail.com','yandex.com','yandex.ru','tutanota.com',
  'tuta.io','hey.com','fastmail.com','inbox.com','att.net','sbcglobal.net',
  'comcast.net','verizon.net','cox.net','charter.net','earthlink.net',
  'duck.com','mailinator.com','qq.com','163.com',
])

export const emailDomain = (email = '') => email.trim().toLowerCase().split('@')[1] || ''

export const isPersonalEmail = (email) => PERSONAL_EMAIL_DOMAINS.has(emailDomain(email))

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
  if (!email) errors.email = 'Enter your email.'
  else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.'
  if (form.password.length < 8) errors.password = 'Password must be at least 8 characters.'
  if (ATTESTATIONS.some((a) => !form[a.key])) {
    errors.attestations = 'Confirm every statement to create an account.'
  }
  return errors
}
