/* Starter blog content for Renew — "Research Notes".
 *
 * This file is the source of truth for the four launch posts. It doubles as:
 *   1. The local fallback the blog renders from when Supabase isn't configured.
 *   2. The seed data — supabase/blog_seed.sql is generated from this file
 *      (scripts/gen-blog-seed.mjs) so the same posts live in the database and
 *      become editable in the admin Blog manager + appear in the sitemap.
 *
 * Each post is written research-use-only: structural / procedural / verification
 * facts only, no outcome, dosing, or human-use claims. Titles, headings, and the
 * `keywords` + `faq` fields target informational search (SEO) and answer engines
 * (AEO) — the FAQ blocks are emitted as FAQPage JSON-LD on each post.
 */

export const BLOG_CATEGORIES = [
  'Compound Guides',
  'COA & Testing',
  'Buying Guides',
  'Comparisons',
  'Shipping & Storage',
]

export const blogPosts = [
  /* ------------------------------------------------------------------ *
   * 1. COMPOUND GUIDE
   * ------------------------------------------------------------------ */
  {
    slug: 'what-is-bpc-157',
    title: 'What Is BPC-157? Peptide Class, Sequence, and Handling',
    category: 'Compound Guides',
    author: 'Renew Research Team',
    published: true,
    published_at: '2026-08-05',
    updated_at: '2026-08-05',
    read_minutes: 5,
    image_url: null,
    excerpt:
      'A research-use-only structural reference for BPC-157: its pentadecapeptide class, 15-residue sequence, molecular weight, salt form, and how a lyophilized vial is handled and reconstituted.',
    meta_title: 'What Is BPC-157? Sequence, Class & Handling | Renew Research Notes',
    meta_description:
      'BPC-157 explained for research use: pentadecapeptide class, 15-amino-acid sequence, molecular weight, acetate salt form, reconstitution and cold-chain storage. No outcome claims.',
    keywords: [
      'what is BPC-157',
      'BPC-157 sequence',
      'BPC-157 molecular weight',
      'BPC-157 peptide class',
      'BPC-157 reconstitution',
      'research peptide BPC-157',
    ],
    body: `BPC-157 is one of the most frequently referenced compounds in the research-peptide catalog. This guide covers only what can be stated structurally and procedurally — its classification, sequence, and laboratory handling. It makes no claims about biological effects, and nothing here is guidance for human or animal use.

## Peptide class and origin

BPC-157 is a synthetic **pentadecapeptide** — a chain of 15 amino acids. The designation "BPC" refers to "body protection compound," and the "157" is a fragment identifier from the research literature. It is produced by solid-phase peptide synthesis rather than extracted from any biological source, which is why a certificate of analysis for a given batch is the only reliable statement of what a vial actually contains.

## Sequence and molecular data

The 15-residue amino-acid sequence is **Gly-Glu-Pro-Pro-Pro-Gly-Lys-Pro-Ala-Asp-Asp-Ala-Gly-Leu-Val**. A few structural facts researchers commonly record:

- **Residue count:** 15 amino acids
- **Molecular formula:** C62H98N16O22 (free acid form)
- **Average molecular weight:** ~1419.5 g/mol
- **Common supplied form:** lyophilized acetate salt

Because the acetate salt form is what most vials contain, the mass on the label refers to peptide content, and the matching COA states the measured purity for that specific lot.

## How a lyophilized vial is handled

BPC-157 is supplied as a **lyophilized** (freeze-dried) powder — a dry cake at the bottom of the vial. Lyophilized peptide is comparatively stable for short-term room-temperature shipping, but for anything beyond immediate use it is kept frozen. Reconstitution is done with bacteriostatic water, and the concentration is simple arithmetic: milligrams of peptide divided by milliliters of diluent gives milligrams per milliliter.

## Why the COA matters more than the label

A printed label states an intended identity and amount; a **certificate of analysis** states what a third-party lab actually measured for that batch — purity by HPLC and identity by LC-MS. When evaluating any BPC-157 vial, the batch ID on the label should resolve to a COA showing both tests. A guide to reading that document is linked below.`,
    faq: [
      {
        q: 'What class of peptide is BPC-157?',
        a: 'BPC-157 is a synthetic pentadecapeptide — a single chain of 15 amino acids produced by solid-phase peptide synthesis. It is supplied for laboratory research use only.',
      },
      {
        q: 'What is the molecular weight of BPC-157?',
        a: 'The average molecular weight of BPC-157 in its free-acid form is approximately 1419.5 g/mol, with the molecular formula C62H98N16O22. Vials are commonly supplied as the lyophilized acetate salt.',
      },
      {
        q: 'How is a lyophilized BPC-157 vial reconstituted?',
        a: 'A lyophilized vial is reconstituted with bacteriostatic water. Concentration in mg/mL equals the milligrams of peptide divided by the milliliters of diluent added. The vial label and matching certificate of analysis define the amount you are working from.',
      },
    ],
  },

  /* ------------------------------------------------------------------ *
   * 2. COA & TESTING (how-to)
   * ------------------------------------------------------------------ */
  {
    slug: 'how-to-read-a-peptide-coa',
    title: 'How to Read a Peptide Certificate of Analysis (COA)',
    category: 'COA & Testing',
    author: 'Renew Research Team',
    published: true,
    published_at: '2026-08-06',
    updated_at: '2026-08-06',
    read_minutes: 6,
    image_url: null,
    excerpt:
      'A field-by-field walkthrough of a research-peptide certificate of analysis: batch and lot IDs, the HPLC purity chromatogram, LC-MS identity confirmation, and the dates that prove the document matches the vial in your hand.',
    meta_title: 'How to Read a Peptide Certificate of Analysis (COA) | Renew',
    meta_description:
      'Learn to read a peptide COA field by field: batch/lot ID, HPLC purity, LC-MS identity, test dates, and the testing lab. A verification-first guide for research buyers.',
    keywords: [
      'how to read a peptide COA',
      'certificate of analysis peptide',
      'peptide purity HPLC',
      'LC-MS peptide identity',
      'batch ID COA lookup',
      'verify peptide COA',
    ],
    body: `A certificate of analysis (COA) is the single most useful document a research-peptide buyer can read. It is a third-party laboratory report tied to one production batch. Knowing how to read it — and how to confirm it matches the vial in front of you — is the difference between a verifiable purchase and a marketing claim.

## Start with the identifiers

Every legitimate COA opens with identifiers that let you tie the report to a physical vial:

- **Batch or lot number** — must match the number printed on the vial label
- **Accession or report number** — the testing lab's internal record ID
- **Product / compound name** — the labeled identity being tested
- **Test date** — when the lab ran the analysis

If the batch number on the COA does not match the vial, the document is meaningless for that vial, regardless of how good the numbers look.

## Read the HPLC purity result

**High-performance liquid chromatography (HPLC)** measures how *pure* the material is — what percentage of the sample is the target compound versus impurities. On the report you'll see a chromatogram (a plot of peaks) and a stated purity percentage, usually 98–99%+ for research-grade material. One tall, cleanly integrated main peak with minimal side peaks is what purity looks like on paper.

## Confirm identity with LC-MS

HPLC tells you the sample is pure; it does not tell you it is the *right* molecule. **Liquid chromatography–mass spectrometry (LC-MS)** confirms identity by measuring molecular mass. The reported mass should match the known molecular weight of the labeled peptide. A complete COA carries both tests — purity *and* identity. One without the other leaves a gap.

## Check the dates and the lab

Two final checks separate a real report from a decorative one:

1. **Whose lab is it?** A COA should name the independent testing laboratory, not just the vendor. Named third-party labs can be contacted or cross-referenced.
2. **Do the dates line up?** The test date should predate the vial reaching you, and reconstitution or expiry windows on the label should be consistent with the report.

## Verifying the document is authentic

The strongest verification is matching the report against the testing lab's own records rather than trusting a PDF supplied in isolation. A doctored COA typically shows mismatched fonts, inconsistent batch numbers between the label and the report, or a purity figure with no supporting chromatogram. When those elements are consistent and independently checkable, the COA does its job.`,
    faq: [
      {
        q: 'What does a peptide certificate of analysis show?',
        a: 'A peptide COA is a third-party lab report for one production batch. It shows the batch/lot number, HPLC purity percentage with a chromatogram, LC-MS identity confirmation, the test date, and the name of the testing laboratory.',
      },
      {
        q: 'What is the difference between HPLC and LC-MS on a COA?',
        a: 'HPLC measures purity — the percentage of the sample that is the target compound. LC-MS confirms identity by measuring molecular mass to verify the material is the labeled molecule. A complete COA includes both.',
      },
      {
        q: 'How do I verify a peptide COA is authentic?',
        a: 'Match the batch number on the COA to the number on the vial, confirm the report names an independent testing lab, check that the purity figure is backed by a chromatogram, and where possible cross-reference the report against the testing lab’s own records rather than a standalone PDF.',
      },
    ],
  },

  /* ------------------------------------------------------------------ *
   * 3. BUYING GUIDE
   * ------------------------------------------------------------------ */
  {
    slug: 'how-to-choose-a-research-peptide-supplier',
    title: 'How to Choose a Research Peptide Supplier: A Verification Checklist',
    category: 'Buying Guides',
    author: 'Renew Research Team',
    published: true,
    published_at: '2026-08-07',
    updated_at: '2026-08-07',
    read_minutes: 6,
    image_url: null,
    excerpt:
      'A concrete checklist for evaluating research-peptide suppliers: named third-party labs, batch-ID-to-COA matching, HPLC plus LC-MS coverage, US-domestic handling, and transparent business practices.',
    meta_title: 'How to Choose a Research Peptide Supplier (Checklist) | Renew',
    meta_description:
      'A verification-first checklist for choosing a research peptide supplier: per-batch COAs, named third-party labs, HPLC + LC-MS testing, domestic handling, and transparency red flags.',
    keywords: [
      'how to choose a research peptide supplier',
      'research peptide supplier checklist',
      'best research peptide vendor',
      'verify peptide vendor',
      'peptide supplier red flags',
      'buy research peptides',
    ],
    body: `Choosing a research-peptide supplier comes down to one question: how much of what they claim can you actually verify? Marketing copy is easy to write; documentation is not. This checklist ranks suppliers on evidence you can independently confirm, not on adjectives.

## 1. Per-batch, public certificates of analysis

The strongest signal is a **certificate of analysis for every batch**, not a single generic COA reused across products. Look for a vial-level batch ID that resolves to its own report. If a vendor cannot show you the COA for the specific lot you'd receive, you are buying on trust alone.

## 2. Named, independent testing labs

A COA should name the **independent third-party laboratory** that ran the analysis. "Tested in-house" is not the same thing — independence is what makes a purity number credible. Named labs can be cross-referenced; anonymous testing cannot.

## 3. Both HPLC and LC-MS

Purity and identity are two different questions. **HPLC** establishes purity; **LC-MS** confirms the material is the labeled molecule. A supplier that reports only one is answering half the question. Insist on both.

## 4. Transparent domestic handling

Where a compound is synthesized, tested, stored, and shipped affects how verifiable the chain of custody is. **US-domestic** end-to-end handling — as opposed to overseas material transshipped through a US warehouse — shortens the chain and makes claims easier to confirm. Ask specifically which of those four steps happen domestically.

## 5. Business transparency

Finally, weigh the operational signals that are harder to fake:

- A real, reachable support contact and business address
- Clear research-use-only terms and a stated returns policy
- Consistent compound naming (by structure, not outcome claims)
- Payment handled through a recognized, secure processor

## Red flags to walk away from

Certain patterns should end the evaluation: no COA available before purchase, purity claims with no supporting chromatogram, batch numbers that don't match between label and report, outcome or dosing language on product pages, or a vendor that can't say who tests their material. Any one of these means the core claim — purity and identity — is unverifiable.

A supplier that clears this checklist isn't promising results; it's proving contents. That's the most a research buyer should expect, and the least a serious vendor should provide.`,
    faq: [
      {
        q: 'What should I look for in a research peptide supplier?',
        a: 'Prioritize suppliers that publish a certificate of analysis for every batch, name the independent lab that tested it, report both HPLC purity and LC-MS identity, handle synthesis and fulfillment domestically, and provide transparent business contact and research-use-only terms.',
      },
      {
        q: 'What are red flags when buying research peptides?',
        a: 'Walk away from vendors with no COA available before purchase, purity claims lacking a supporting chromatogram, batch numbers that don’t match between the vial and the report, outcome or dosing language, or an inability to name who tests their material.',
      },
      {
        q: 'Why does third-party testing matter more than in-house testing?',
        a: 'Independent third-party testing removes the conflict of interest in a vendor grading its own product. A named external lab can be cross-referenced, which is what makes a reported purity figure credible and verifiable.',
      },
    ],
  },

  /* ------------------------------------------------------------------ *
   * 4. COMPARISON
   * ------------------------------------------------------------------ */
  {
    slug: 'research-peptide-vendor-comparison-checklist',
    title: 'Comparing Research Peptide Vendors: A Verification-First Framework',
    category: 'Comparisons',
    author: 'Renew Research Team',
    published: true,
    published_at: '2026-08-08',
    updated_at: '2026-08-08',
    read_minutes: 5,
    image_url: null,
    excerpt:
      'A neutral, verification-first framework for comparing research-peptide vendors side by side — the exact documentation and handling questions to line up before choosing, so a comparison rests on facts you can confirm.',
    meta_title: 'Comparing Research Peptide Vendors: A Verification Framework | Renew',
    meta_description:
      'A neutral framework for comparing research peptide vendors: COA availability, testing methods, batch traceability, domestic handling, and support — the verifiable criteria that matter.',
    keywords: [
      'research peptide vendor comparison',
      'compare peptide suppliers',
      'peptide vendor alternatives',
      'best research peptide company',
      'peptide supplier comparison',
      'COA verified peptides',
    ],
    body: `Vendor comparisons are only as good as the criteria behind them. Ranking suppliers on "quality" or "reputation" invites opinion; ranking them on documentation you can independently confirm produces a comparison that holds up. This framework lists the columns to fill in for any two vendors before deciding between them.

## Line up these criteria side by side

For each vendor under consideration, answer the same questions and compare the answers directly:

- **COA availability** — Is a certificate of analysis published for every batch, and can you see it *before* buying?
- **Batch traceability** — Does a unique batch ID on the vial resolve to that specific lot's report?
- **Testing methods** — Are both HPLC (purity) and LC-MS (identity) reported, or only one?
- **Testing independence** — Is the lab named and independent, or is testing described as in-house?
- **Domestic handling** — Which of synthesis, testing, storage, and shipping happen in-country?
- **Catalog framing** — Are compounds described by structure and class, or by outcome claims (a compliance and credibility signal)?
- **Support and terms** — Is there a reachable contact, a clear returns policy, and research-use-only language?

## Why a neutral framework beats a ranked list

Head-to-head posts that assert one named vendor is "better" than another often rest on claims neither buyer nor writer can check. A framework flips that: you gather the same **verifiable** facts for each option and let the evidence rank them. It also stays accurate over time — a vendor's marketing changes weekly, but whether they publish a per-batch COA is a fact you can re-check on any given day.

## How Renew fits the framework

Applied to Renew: every compound is positioned for laboratory research use only, described by structure and class rather than outcome, and backed by third-party testing documentation. The same questions above can — and should — be asked of us as of anyone else. A serious vendor welcomes being held to a checklist it can pass.

## Using this before you buy

Before committing to any supplier, fill in the seven rows above for your shortlist. If a vendor leaves the COA, testing-method, or lab-independence rows blank, that gap *is* the comparison result. The goal isn't to crown a winner in the abstract — it's to confirm, for the specific vial you'd receive, that its contents are documented and its identity is verifiable.`,
    faq: [
      {
        q: 'How should I compare research peptide vendors?',
        a: 'Compare vendors on verifiable criteria applied identically to each: per-batch COA availability, batch-ID traceability, HPLC and LC-MS testing, lab independence, domestic handling, structure-based catalog framing, and support/terms. Let the evidence rank them rather than reputation.',
      },
      {
        q: 'Why avoid "X vs Y" vendor rankings that name a winner?',
        a: 'Named head-to-head rankings often rest on claims that can’t be independently checked and go stale as marketing changes. A verification-first framework — gathering the same confirmable facts for each vendor — produces a comparison that stays accurate.',
      },
      {
        q: 'What single factor matters most when comparing suppliers?',
        a: 'Whether a supplier publishes a certificate of analysis for the specific batch you would receive, showing both HPLC purity and LC-MS identity from a named independent lab. If that row is blank, the rest of the comparison is moot.',
      },
    ],
  },
]
