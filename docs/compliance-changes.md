# Stripe pre-approval compliance — changes log

Worked from _Renew Labs LV Compliance Checklist — PreApproval_ (reviewed 9 Sep 2026).

## Done in code (deploys with your next push)

**Must-fix**

- **"GLP-3 RETA" renamed to "GLP3-RT"** in all site copy and the fallback
  catalog (homepage lineup band, product seed data, COA note). ⚠️ The _live_
  product names are in Supabase — see admin list below.
- **"who makes the product" contradiction resolved.** Removed "we synthesize"
  language and all **ISO** claims; the site now consistently says compounds are
  produced and third-party tested by the certified partner lab, **Freedom
  Diagnostics** (LocalSection, MissionSection, About, product copy).
- **Terms of Service §5** now says **payment is taken at checkout** (matches the
  Stripe application) and adds a **US-only shipping policy** (no international or
  sanctioned-country shipping).
- **Compliance agreement is server-side.** Acceptance is recorded in Supabase
  with terms version + timestamp (and now the signed-in account); each order's
  note records the accepted terms version + time. Privacy Policy wording updated
  to say the authoritative record is server-side, not browser storage. Terms
  version bumped to `2026-09-10`.

**Should-fix**

- Governing law is now **Nevada** (was "the state in which Renew operates").
- **Real dates** on every legal page ("Last updated: September 10, 2026").
- Damage-report window changed from **48 hours → 7 days**.
- Dropped "**creators**" from marketing (homepage partner band + affiliate copy)
  so it targets qualified researchers, not content creators.
- "Research water" wording in the Refund Policy changed to "research water".

## You must do these (I can't from here)

**In the admin panel (live catalog — I only have the read-only anon key):**

1. Rename **GLP-3 RETA 15mg** and **30mg** products → **GLP3-RT …**, and scrub
   "GLP-3 RETA / retatrutide" from their descriptions.
2. Rename the **Research Water** product → **Research Water** (name + description).
3. **Remove / unlist** any **needles and syringes** products — these signal a
   self-injecting customer and are the checklist's #2 must-fix.
4. Check every product description for stray **ISO** claims or dosing/human-use language.

**Run in Supabase SQL editor:**

- `supabase/compliance.sql` (adds the account link to the acceptance log).

**Give me real business details to publish** (checklist "should-fix" — I won't
invent these): a real **street address**, a **phone number**, and your **Nevada
business licence number**. Send them and I'll add them to the footer/legal pages.

**On Stripe's side (from the runbook):** set a recognizable statement descriptor
and keep the business description matching the site.

## Informational (no change)

- Watch FDA rulemaking on BPC-157, TB-500, and MOTS-c — legal today, status can change.
- COA page verified: `coa-rt15.pdf` is present and published for GLP3-RT 15mg;
  other products honestly show "In Testing".

---

# Compliance gate + researcher approval (Oct 20, 2026)

**Run first:** `supabase/researcher_approval.sql` in the Supabase SQL editor,
*before* deploying this code. It approves every existing account, makes new
accounts start as pending, validates signups in the database, and limits
product reads to approved accounts and admins.

- Compliance agreement: date of birth (21+) plus one required checkbox covering
  age, qualified researcher, research-only/not for human or animal use, and the
  terms. Agreeing sends the visitor to `/login`. Terms version is `2026-10-20`.
- Everything except the legal pages, login, signup, password reset and
  `/account/pending` needs an approved account. Direct links redirect.
- Signup: institutional email (Gmail, Yahoo, Outlook etc. refused), registered business /
  institution (checked against ror.org at review), password, four attestations.
- New accounts land on the pending notice. Review them at **Admin → Accounts**;
  approving or rejecting emails the person.
- Checkout functions (`create-payment-intent`, `create-checkout-session`,
  `process-payment`, `submit-order`) refuse anyone not approved.
- The bundled sample catalog is no longer shipped in the site code.
- Sitemap lists only the public pages; blog posts are behind the gate.
- Still public as static files: COA PDFs in `public/coas` and product photos.
