# Lex Nova Source Discovery Magna Carta v1

This document is the controlling authority for Source Discovery. If source-discovery code, prompts, tests, or audits conflict with this document, this document wins unless expressly amended by the founder.

## Supreme Rule

Gemini discovers and classifies. Deterministic code fetches, extracts, normalizes, deduplicates, verifies first-party status, and prepares source text.

Provenance is a report. Provenance never blocks a URL before classification.

## Final Allowed Families

Only four final source families exist:

1. `company_profile`
2. `product_profile`
3. `legal_profile`
4. `governance_profile`

There is no final `docs_developer`, `commercial`, or `updates` family.

Docs/API/developer pages belong to `product_profile` when they reveal product mechanics. Trust/security/compliance pages belong to `governance_profile`. Terms/privacy/DPA/SLA/EULA/AUP/subprocessor pages belong to `legal_profile`. Homepage/about/company pages belong to `company_profile` unless they reveal product features, in which case they may also be used as product evidence.

## Family Definitions

### Company Profile

Basic company identity, positioning, geography, entity clues, market posture, and broad public marketing claim.

Allowed if useful:

- homepage
- about / about-us
- company
- team
- mission
- customers / case studies only if they reveal company or product substance

Not needed unless they reveal substantive company/product information:

- contact
- contact-us
- contact-sales
- sales
- demo
- request-demo
- signup
- login/dashboard/auth
- generic pricing pages

### Product Profile

Anything that explains products, product features, models, APIs, workflows, agents, inputs, outputs, deployment modes, integrations, docs, or product capabilities.

The atomic unit is the feature.

Allowed if useful:

- product index and product detail pages
- platform/features/solutions/use-cases pages that explain capabilities
- models/model pages
- agent pages
- API/docs/developer/reference/SDK/quickstart/guides/integrations/playground pages that explain mechanics
- blog/news/changelog/release/customer/case-study/pricing pages only if they reveal product features, product movement, feature tiers, or usage mechanics

Not needed:

- pure marketing fluff
- pure contact/demo/sales/signup pages
- generic blog/company PR with no product feature/change

### Legal Profile

Binding legal terms and customer/user/data obligations.

Allowed:

- legal
- terms / terms-of-service / terms-and-conditions
- privacy / privacy-policy
- cookie policy
- data protection terms
- DPA / data processing addendum
- subprocessors
- acceptable use / AUP
- EULA
- SLA

Embedded legal artifacts count. A DPA/SLA/subprocessor/support annexure inside Terms still belongs to Legal Profile.

### Governance Profile

Trust, security, compliance, responsible AI, safety, governance, certifications, auditability, model/data controls, and status/incident posture.

Allowed:

- trust / trust-center
- security
- compliance
- status
- responsible AI / AI policy
- governance
- safety / model safety
- data security
- certifications
- enterprise security

## Family Anchor URLs

Anchor URLs are minimum surfaces to inspect. They are not limits. The system must fetch safe first-party anchors, extract first-party links from those anchors, and ask Gemini to classify the expanded candidate universe.

Use `{origin}` as the selected normalized origin, with `www` and non-`www` treated as the same first-party site.

### Company Profile Anchors

- `{origin}/`
- `{origin}/about`
- `{origin}/about-us`
- `{origin}/company`
- `{origin}/team`
- `{origin}/mission`
- `{origin}/customers`
- `{origin}/customer-stories`
- `{origin}/case-studies`

### Product Profile Anchors

- `{origin}/`
- `{origin}/products`
- `{origin}/product`
- `{origin}/platform`
- `{origin}/features`
- `{origin}/solutions`
- `{origin}/use-cases`
- `{origin}/models`
- `{origin}/agents`
- `{origin}/studio`
- `{origin}/apis`
- `{origin}/api`
- `{origin}/developers`
- `{origin}/developer`
- `{origin}/docs`
- `{origin}/documentation`
- `{origin}/reference`
- `{origin}/sdk`
- `{origin}/quickstart`
- `{origin}/guides`
- `{origin}/integrations`
- `{origin}/playground`
- `{origin}/blog`
- `{origin}/changelog`
- `{origin}/release-notes`
- `{origin}/updates`
- `{origin}/news`
- `{origin}/announcements`
- `{origin}/releases`
- `{origin}/customers`
- `{origin}/customer-stories`
- `{origin}/case-studies`
- `{origin}/pricing`
- `{origin}/plans`

Blog/news/changelog/release/customer/case-study/pricing anchors survive only if Gemini classifies them as product-feature/product-movement evidence.

### Legal Profile Anchors

- `{origin}/legal`
- `{origin}/terms`
- `{origin}/terms-of-service`
- `{origin}/terms-and-conditions`
- `{origin}/privacy`
- `{origin}/privacy-policy`
- `{origin}/cookie-policy`
- `{origin}/data-protection`
- `{origin}/dpa`
- `{origin}/data-processing-addendum`
- `{origin}/subprocessors`
- `{origin}/acceptable-use`
- `{origin}/acceptable-use-policy`
- `{origin}/aup`
- `{origin}/eula`
- `{origin}/sla`

### Governance Profile Anchors

- `{origin}/trust`
- `{origin}/trust-center`
- `{origin}/security`
- `{origin}/compliance`
- `{origin}/status`
- `{origin}/responsible-ai`
- `{origin}/ai-policy`
- `{origin}/governance`
- `{origin}/safety`
- `{origin}/model-safety`
- `{origin}/data-security`
- `{origin}/certifications`
- `{origin}/enterprise-security`

## URL Normalization

User input may omit protocol or `www`.

The system must accept and normalize inputs such as:

- `sarvam.ai`
- `www.sarvam.ai`
- `http://sarvam.ai`
- `https://sarvam.ai`
- `https://www.sarvam.ai/`

The system must compute:

- `primary_input_url`
- `normalized_origin_candidates`
- `selected_origin`
- `registrable_domain`
- `www_variant`
- `non_www_variant`

`www` and non-`www` are the same first-party site.

## Discovery Flow

1. User submits URL.
2. Runtime normalizes origin/domain.
3. Runtime builds minimum family anchors for the four allowed families.
4. Deterministic code fetches every safe first-party anchor URL.
5. Deterministic code extracts first-party links from anchor pages.
6. Gemini classifies all candidate URLs into `company_profile`, `product_profile`, `legal_profile`, `governance_profile`, or `reject`.
7. Gemini runs a compact free first-party search to find anything missed.
8. Deterministic code fetches final admitted sources.
9. Full admitted source documents go downstream losslessly.

## Filters

### Pre-fetch filters

Only these filters apply before fetch/classification:

1. URL safety filter.
2. First-party filter.
3. Duplicate-normalization filter.

Reject unsafe protocols: `javascript:`, `mailto:`, `tel:`, `file:`, `data:`, `blob:`.

Reject localhost/private/internal/metadata IP/malformed URLs.

Reject non-first-party domains.

Normalize fragments away.

Dedupe exact normalized URLs while preserving all provenance paths.

### Post-classification filters

Only these filters apply after Gemini classification:

1. Not first-party.
2. Not one of the four allowed families.
3. Low-value content after Gemini marks it as such.
4. Quota/volume caps.

Provenance is never a filter.

There is no primary/support/secondary gate.

## Report Size and Quota Control

Use compact metadata for Gemini URL classification:

- URL
- anchor family
- link text
- location hint
- page title
- short snippet/meta text

Do not send full HTML or full page text to Gemini during discovery classification.

After Gemini admits a URL, the final fetched document must go downstream in full.

Recommended caps:

- Max anchor URLs fetched per family: 12
- Max extracted links sent to Gemini per family: 60
- Max free-search URLs sent to Gemini per family: 20
- Max final admitted sources per family:
  - Company Profile: 5
  - Product Profile: 15
  - Legal Profile: 8
  - Governance Profile: 8

## Lossless Downstream Rule

Source Discovery may use compact snippets and metadata only for URL classification and quota control.

Once a URL is finally admitted, the full fetched document goes downstream losslessly.

No summary. No compression. No truncation. No selective excerpting. No important-parts-only. No Gemini rewriting.

Processing admitted documents is the downstream stage's job.

## Provenance Report

Every URL must carry accumulated provenance:

- discovery method
- family anchor that produced it
- extracted link source
- link text
- location hint
- Gemini classification family
- Gemini reason
- fetch status
- duplicate merge history

Provenance reports history. It never kills the URL before classification.
