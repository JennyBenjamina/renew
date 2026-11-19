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

/** Credential document types a customer can upload. Values are stored in
 *  profiles.credential_doc_type; keep in step with credential_documents.sql. */
export const CREDENTIAL_DOC_TYPES = [
  { value: 'business_license', label: 'Business license / registration' },
  { value: 'institution_id', label: 'Institutional ID or employee badge' },
  { value: 'institution_letter', label: 'Letter on institutional letterhead' },
  { value: 'research_license', label: 'Research or laboratory license / permit' },
  { value: 'other', label: 'Other proof of research employment' },
]

export const credentialDocTypeLabel = (value) =>
  CREDENTIAL_DOC_TYPES.find((t) => t.value === value)?.label || value || ''

export const CREDENTIAL_DOC_MAX_BYTES = 10 * 1024 * 1024
export const CREDENTIAL_DOC_ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,.heic,.heif'
const DOC_MIME = /^(application\/pdf|image\/(jpeg|png|webp|heic|heif))$/i
const DOC_EXT = /\.(pdf|jpe?g|png|webp|heic|heif)$/i

/** Problem with a chosen credential file, or '' if it's fine. */
export function credentialFileError(file) {
  if (!file) return 'Upload a document that shows you work in the industry.'
  if (!(DOC_MIME.test(file.type || '') || DOC_EXT.test(file.name || ''))) {
    return 'Upload a PDF or a photo (JPG, PNG, WEBP or HEIC).'
  }
  if (file.size > CREDENTIAL_DOC_MAX_BYTES) return 'The file must be 10 MB or smaller.'
  return ''
}

/** True when the written credentials (institution, entity type, statements,
 *  e-signature) are on file. */
export function hasCredentialDetails(p) {
  return Boolean(
    p &&
      (p.institution || '').trim().length >= 3 &&
      ENTITY_TYPES.some((t) => t.value === p.entity_type) &&
      (p.signature_name || '').trim().length >= 2 &&
      p.attest_age_21 && p.attest_researcher && p.attest_research_only && p.attest_terms
  )
}

/* ---- Account required to check out (TOGGLE) ----
 * While true, shoppers must log in to check out.
 * While false, guests can check out without an account; their order
 * confirmation goes to the email they enter at checkout. Signed-in shoppers
 * still have the order linked to their account (and the other toggles below
 * still apply to them).
 * TO TURN IT BACK ON: set this to true AND ACCOUNT_REQUIRED in
 * netlify/functions/_order.mjs to true, then redeploy. */
export const ACCOUNT_REQUIRED = false

/* ---- Admin approval before checkout (TOGGLE) ----
 * While true, a new account waits in "Under review" until an admin approves it
 * in Admin → Accounts, and can't check out before then.
 * While false, every signed-in account can check out straight away, except
 * one an admin has explicitly rejected.
 * TO TURN IT BACK ON: set this to true AND APPROVAL_REQUIRED in
 * netlify/functions/_order.mjs to true, then redeploy. */
export const APPROVAL_REQUIRED = false

/* ---- Credential verification before checkout (TOGGLE) ----
 * While true, an account must upload institutional credentials (the "Verify
 * your credentials" step at /account/credentials) before it can check out.
 * While false, that step is skipped entirely; admin approval still applies.
 * TO TURN IT BACK ON: set this to true AND CREDENTIALS_REQUIRED in
 * netlify/functions/_order.mjs to true, then redeploy. */
export const CREDENTIALS_REQUIRED = false

/** True when everything needed to check out is on file: the written
 *  credentials AND an uploaded credential document. Approval is separate.
 *  Keep in step with requireApprovedAccount in netlify/functions/_order.mjs. */
export function hasCredentials(p) {
  return hasCredentialDetails(p) && Boolean(p.credential_doc_path)
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

/* ---- Registration email allowlist (TEMPORARY, website only) ----
 * While EMAIL_ALLOWLIST_ENABLED is true, the signup form only accepts these
 * four email providers (no other domain, .edu included), and refuses addresses
 * that break the provider's username rules (they would bounce). Pure logic and
 * regex in the browser; nothing is enforced in Supabase or Netlify functions.
 * TO LIFT IT: set EMAIL_ALLOWLIST_ENABLED to false and redeploy. */
export const EMAIL_ALLOWLIST_ENABLED = true

/* ---- Registration closed (TEMPORARY, website only) ----
 * While true, EVERY email is refused at signup with the "ACCOUNT CREATION
 * DENIED" message, whatever its domain. Existing accounts can still log in.
 * TO REOPEN REGISTRATION: set REGISTRATION_CLOSED to false and redeploy (the
 * email allowlist above then applies, if it's still on). */
export const REGISTRATION_CLOSED = false

export const ALLOWED_SIGNUP_DOMAINS = ['gmail.com', 'yahoo.com', 'aol.com', 'hotmail.com']

/** True when an email's domain may register. */
export function isAllowedSignupEmail(email) {
  const domain = emailDomain(email)
  if (!domain) return false
  return ALLOWED_SIGNUP_DOMAINS.includes(domain)
}

/* Username rules for each allowed provider. An address that breaks its
 * provider's rules can't exist, so mail to it would bounce. (A "+tag" is
 * allowed on Gmail and Hotmail and is ignored when checking the username.) */
const PROVIDER_USERNAME_RULES = {
  // Gmail: 6–30 letters, numbers and periods; no leading, trailing or double periods.
  'gmail.com': /^(?=.{6,30}$)[a-z0-9](?:[a-z0-9]|\.(?!\.))*[a-z0-9]$/,
  // Yahoo: 4–32 characters, starts with a letter; letters, numbers, underscores
  // and at most one period; can't end with a period or underscore.
  'yahoo.com': /^(?=.{4,32}$)(?!(?:[^.]*\.){2})[a-z][a-z0-9_.]*[a-z0-9]$/,
  // AOL: 3–32 characters, starts with a letter; letters, numbers, underscores
  // and periods; can't end with a period or underscore.
  'aol.com': /^(?=.{3,32}$)[a-z][a-z0-9_.]*[a-z0-9]$/,
  // Hotmail: up to 64 characters, starts with a letter; letters, numbers,
  // periods, underscores and hyphens; no double periods; can't end with a period.
  'hotmail.com': /^(?=.{1,64}$)[a-z](?:[a-z0-9_-]|\.(?!\.))*[a-z0-9_-]$|^[a-z]$/,
}

/** True when the address follows the rules for its provider (Gmail, Yahoo,
 *  AOL, Hotmail), i.e. it isn't an address that
 *  would obviously bounce. Pure logic and regex; no network lookups. */
export function isLikelyDeliverable(email) {
  const addr = String(email || '').trim().toLowerCase()
  const at = addr.lastIndexOf('@')
  if (at <= 0 || addr.indexOf('@') !== at) return false
  const local = addr.slice(0, at)
  const domain = addr.slice(at + 1)

  const rule = PROVIDER_USERNAME_RULES[domain]
  if (rule) {
    const allowsTag = domain === 'gmail.com' || domain === 'hotmail.com'
    const username = allowsTag ? local.split('+')[0] : local
    if (!allowsTag && local.includes('+')) return false
    return rule.test(username)
  }
  return false
}
