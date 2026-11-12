/* Account registration rules. An account is required to check out.
 * The same required fields, entity types, attestations and signature match are
 * enforced again in the database by supabase/signup_fields.sql, so the form
 * can't be bypassed through the API. Keep ENTITY_TYPES in step with that file. */

/** Business / entity types. Values are stored in profiles.entity_type. */
export const ENTITY_TYPES = [
  { value: 'university', label: 'University / academic institution' },
  { value: 'research_lab', label: 'Research laboratory' },
  { value: 'biotech_pharma', label: 'Biotechnology / pharmaceutical company' },
  { value: 'cro', label: 'Contract research organization (CRO)' },
  { value: 'government_nonprofit', label: 'Government or non-profit research organization' },
  { value: 'other_business', label: 'Other registered business' },
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const LOCAL_RE = /^[^\s@]+$/
const DOMAIN_RE = /^[^\s@]+\.[^\s@]{2,}$/

/** Collapse spaces and lowercase, so "Jane  Doe" signs as "jane doe". */
export const normalizeName = (s = '') => s.trim().replace(/\s+/g, ' ').toLowerCase()

/** The full email from the split name @ domain inputs. */
export function composeEmail(form) {
  const local = form.emailLocal.trim()
  const domain = form.emailDomain.trim().replace(/^@/, '')
  return local && domain ? `${local}@${domain}`.toLowerCase() : ''
}

/** Returns { field: message } for every problem with the registration. */
export function validateRegistration(form) {
  const errors = {}
  const local = form.emailLocal.trim()
  const domain = form.emailDomain.trim().replace(/^@/, '')
  if (!local || !domain) errors.email = 'Enter your full email address.'
  else if (!LOCAL_RE.test(local) || !DOMAIN_RE.test(domain) || !EMAIL_RE.test(`${local}@${domain}`)) {
    errors.email = 'Enter a valid email address.'
  }

  const inst = form.institution.trim()
  if (!inst) errors.institution = 'Enter your registered business or institution.'
  else if (inst.length < 3) errors.institution = 'Enter the full name of your business or institution.'

  if (form.password.length < 8) errors.password = 'Password must be at least 8 characters.'

  const name = form.fullName.trim()
  if (!name) errors.fullName = 'Enter your legal name.'
  else if (name.length < 2) errors.fullName = 'Enter your full legal name.'

  if (!ENTITY_TYPES.some((t) => t.value === form.entityType)) {
    errors.entityType = 'Select your business or entity type.'
  }

  if (!form.attestAge || !form.attestQualified) {
    errors.attestations = 'Confirm both statements to create an account.'
  }

  if (!form.signature.trim()) {
    errors.signature = 'Type your legal full name to sign.'
  } else if (normalizeName(form.signature) !== normalizeName(form.fullName)) {
    errors.signature = 'Your signature must match your legal name exactly.'
  }
  return errors
}

/* Personal email providers. Personal addresses are allowed to register; the
 * admin Accounts page uses this list only to flag them for your information. */
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

/** Label for a stored entity_type value. */
export const entityTypeLabel = (value) =>
  ENTITY_TYPES.find((t) => t.value === value)?.label || value || ''

/** True when a profile has complete institutional credentials on file. Keep in
 *  step with requireApprovedAccount in netlify/functions/_order.mjs. */
export function hasCredentials(p) {
  return Boolean(
    p &&
      (p.institution || '').trim().length >= 3 &&
      ENTITY_TYPES.some((t) => t.value === p.entity_type) &&
      (p.signature_name || '').trim().length >= 2 &&
      p.attest_age_21 && p.attest_researcher && p.attest_research_only && p.attest_terms
  )
}

/** Validation for the credentials form shown to existing accounts at checkout
 *  (same rules as registration, minus email and password). */
export function validateCredentials(form) {
  const errors = validateRegistration({
    ...form,
    emailLocal: 'x',
    emailDomain: 'example.com',
    password: 'xxxxxxxx',
  })
  delete errors.email
  delete errors.password
  return errors
}
