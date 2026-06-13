# Diligence Canon Field Dictionary v1

## Status

This is the canonical field-definition dictionary for the non-Stage-6 Diligence Engine runtime prompt chain.

Its Stage 6 block is retired as active authority. Stage 6 now derives from `docs/contracts/DILIGENCE_CANONICAL_SPINE_v1.md`, `runtime-api/src/diligence/stage6CanonicalVocabulary.js`, and `data/schemas/stage6Review.schema.json`.

For non-Stage-6 slices, this dictionary governs the meaning of canonical stage objects, navigation handles, controlled values, and stage boundaries. Schemas enforce structure; prompts derive values from this dictionary; runtime code must not invent parallel definitions in another file.

## Runtime slicing

The runtime prompt loader must append only the blocks relevant to the active stage.

```text
company_profile              -> UNIVERSAL + STAGE4
target_feature_profile       -> UNIVERSAL + STAGE5
stage6a_legal_document_cartography -> DILIGENCE_CANONICAL_SPINE_v1
registry_ledger_evaluation   -> UNIVERSAL + STAGE7_NAVIGATION
```

Do not append the full dictionary to every prompt. Stage slices prevent token waste and prevent Stage 6/7 definitions from leaking into Stage 4/5.

<!-- CANON:UNIVERSAL:START -->

# UNIVERSAL CANON

## Canonical object

A canonical object is the structured stage-owned JSON object emitted under the runtime output key for that stage. Canonical objects use stable refs, IDs, enums, short labels, and short phrases instead of long prose where possible.

## Universal derivation rules

| Rule | Requirement |
|---|---|
| Evidence first | Use only admitted source material in the current runtime input and validated prior-stage outputs. Discovery-only URLs, snippets, prior knowledge, market assumptions, and model memory are not evidence. |
| Required field discipline | Required fields must be present. Absence is represented using `unknown`, `not_visible`, `not_applicable`, empty arrays, or limitations depending on the field. Do not omit required fields. |
| No hallucinated certainty | Do not convert silence into a positive fact. If evidence is absent, preserve the absence state. |
| Public-footprint wording | Use public-footprint language. Never state or imply legal compliance, non-compliance, liability, illegality, enforceability, or legal certification. |
| Confidence | `high` = direct and specific admitted evidence. `medium` = supported but requires interpretation. `low` = weak signal needing confirmation. `unknown` = not visible or not safely derivable. |
| Stage boundary | Each stage owns only its canonical object. Later-stage outputs must not be backfilled into earlier stages. |
| Registry boundary | Only registry_ledger_evaluation assigns Hunter/final statuses. Earlier stages may create navigation signals but must not decide trigger status. |
| Vault boundary | Model stages must not emit final Vault prefill. Node 5B owns deterministic Vault prefill and handoff. |

## Standard signal enum

Use this enum for document, data, notice, rights, transfer, retention, processor, and security signals unless the stage schema defines a stricter enum:

```text
visible
not_visible
partial
conflicting
not_applicable
unknown
```

## Standard confidence enum

```text
high
medium
low
unknown
```

## Standard evidence handle rule

Canonical outputs should use handles rather than repeating source text where possible:

```text
source_record_ref
source_url
doc_id
section_id
section_path
feature_id
provenance_id
flow_id
control_signal_id
```

Evidence quotes/excerpts belong in source/evidence artifacts, not Stage 6 canon. Stage 6 canonical outputs are quote-free. Quotes remain in source/evidence artifacts or later report rendering, not in Stage 6 canonical maps.

<!-- CANON:UNIVERSAL:END -->

<!-- CANON:STAGE4:START -->

# STAGE 4 CANON — `target_profile_v2`

## Ownership

Stage 4 owns identity and baseline target facts. It may read all admitted docs, but only for identity/profile/contact/baseline extraction.

Stage 4 must not own feature classification, legal-stack adequacy, registry evaluation, or Vault handoff.

## Runtime wrapper

Runtime output key may remain:

```text
company_profile
```

Canonical object inside the wrapper:

```text
target_profile_v2
```

## Top-level object definitions

| Field | Definition | Derive from | Do not derive from | Absence handling |
|---|---|---|---|---|
| `target_profile_version` | Object version marker. | Always set to `target_profile_v2`. | Model choice. | Must equal `target_profile_v2`. |
| `identity` | Canonical brand, legal-name, website, operator/controller, and entity-form signals. | About/company/contact/terms/privacy/notices/trust pages. | Marketing category, founder country, domain suffix. | Empty strings/arrays and `unknown` confidence. |
| `jurisdiction` | Registered/notice address plus governing-law and venue signals. | Terms, privacy, contact, legal notices, footer, DPA. | Customer geography, domain suffix, language, timezone. | Visible parts only; unknown where absent. |
| `business_model` | Commercial model and customer orientation. | Product pages, pricing/contact-sales CTAs, docs, enterprise pages. | Legal entity type, investor language, generic AI category. | `unknown` or public-footprint absence language. |
| `market_context` | Industry, target geography/languages, regulated-sector hints. | Product/use-case/language/public-sector pages. | Final risk surfaces, registry rows. | Empty arrays and `unknown` confidence. |
| `product_baseline` | High-level offering and public product labels only. | Homepage, product pages, docs, API pages. | Detailed archetype classification or threat logic. | Empty arrays or `unknown`. |
| `data_touchpoint_map[]` | Baseline data touchpoints visible before atomic feature mapping. | Privacy policy, terms, account/API forms, product/docs, contact forms. | Generic legal prohibitions alone. | `[]` plus limitations/unresolved questions where needed. |
| `vault_baseline_candidates` | Candidate projection into baseline/compliance Vault fields. | Stage 4 evidence only. | Final Vault handoff, architecture guesses, registry rows. | Candidate objects use `UNKNOWN` where not visible. |
| `pipeline_assumptions` | Non-Vault notes for downstream stages. | Evidence limitations and downstream dependencies. | Final findings. | Empty arrays if none. |
| `evidence` | Field-level evidence audit for material Stage 4 claims. | Admitted source refs and source handles. | Fabricated quotes or discovery-only URLs. | Empty only when no material claims. |
| `limitations` | Source-bounded Stage 4 limitations. | Missing/ambiguous evidence. | Speculation. | `[]` if none. |

## Stage 4 boundary rules

```text
- Stage 4 may identify public product labels, but it must not decompose features.
- Stage 4 may identify data touchpoints, but Stage 5 owns feature-level data provenance.
- Stage 4 may create Vault baseline candidates, but Node 5B owns final Vault prefill.
- Stage 4 must not rewrite facts from later stages.
```

<!-- CANON:STAGE4:END -->

<!-- CANON:STAGE5:START -->

# STAGE 5 CANON — `feature_profile_v2`

## Ownership

Stage 5 owns atomic product/function inventory, feature-level data provenance, archetype provenance, and regulated-surface provenance.

Stage 5 must not rewrite Stage 4 identity, evaluate registry threat rows, review legal-stack adequacy, or emit Vault handoff fields.

## Runtime wrapper

Runtime output key may remain:

```text
target_feature_profile
```

Canonical object inside the wrapper:

```text
feature_profile_v2
```

Legacy-only fields:

```text
product_feature_map[]
primary_product
target_profile inside Stage 5
```

These are not compiler truth.

## Top-level object definitions

| Field | Definition | Derive from | Do not derive from | Absence handling |
|---|---|---|---|---|
| `feature_profile_version` | Object version marker. | Always set to `feature_profile_v2`. | Model choice. | Must equal `feature_profile_v2`. |
| `target_profile_ref` | Read-only reference to Stage 4 target identity/baseline. | Stage 4 canonical output. | Re-analysis or rewrite of identity. | Preserve ref; use limitations if missing. |
| `feature_inventory[]` | Canonical atomic feature/function inventory. | Product/docs/API/use-case/source text. | Marketing categories alone, legal boilerplate, registry threat rows. | `[]` only if no usable feature can be derived; otherwise include all visible atomic functions. |
| `data_provenance_map[]` | Feature-level data provenance and processing signals. | Feature evidence, docs, privacy/product/API text. | Generic policy prohibitions alone. | Unknown subfields are preserved, not dropped. |
| `regulated_surface_map[]` | Feature-linked regulated surface tokens. | Feature behavior and surface evidence. | Threat rows or legal conclusions. | Empty where no surface is visible. |
| `architecture_hints[]` | Explicit public architecture clues only. | Public docs/API/security/product text. | Architecture guesses. | Empty if not visible. |
| `commercial_scan` | Completeness accounting for admitted Stage 5 sources/outcomes. | Every admitted Stage 5 source. | Sampling/top-N. | Use source coverage statuses and warnings. |
| `vault_feature_candidates` | Non-final feature-derived candidates for later Node 5B consideration. | Stage 5 public evidence only. | Final Vault handoff. | Use `UNKNOWN`/confirmation status where thin. |
| `evidence` | Evidence handles for material feature claims. | Admitted source refs. | Fabricated quotes. | Empty only when no material claim. |
| `limitations` | Source-bounded Stage 5 limitations. | Missing/thin/ambiguous evidence. | Speculation. | `[]` if none. |

## `feature_inventory[]` unit rule

The unit is an atomic commercial/product function, not a product label or marketing category.

Each feature should carry stable IDs and compact fields such as:

```text
feature_id
feature_name
feature_role
commercial_function
business_label_or_product_area
actor_or_user
input_data[]
system_action
output_or_result
autonomy_level
human_review_signal
external_action_signal
delivery_channels[]
archetype_codes[]
surface_tokens[]
confidence
evidence_refs[]
```

`CORE` means independently valuable commercial function. `SECONDARY` means dependency/enabler.

## Provenance discipline

```text
- Every feature should have data provenance where data is involved.
- Every archetype code must have matching archetype provenance.
- Every surface token must have matching surface provenance.
- Registry key vocabulary may be used for archetype/surface labels.
- Registry threat rows and Hunter Trigger logic are forbidden in Stage 5.
```

<!-- CANON:STAGE5:END -->

<!-- CANON:STAGE6:START -->

# STAGE 6 CANON - RETIRED BY `DILIGENCE_CANONICAL_SPINE_v1.md`

This block is retained only as a routing marker for legacy prompt slicing. It is not active Stage 6 authority after the canonical reset.

Active Stage 6 authority is exclusively:

```text
docs/contracts/DILIGENCE_CANONICAL_SPINE_v1.md
runtime-api/src/diligence/stage6CanonicalVocabulary.js
data/schemas/stage6Review.schema.json
```

Runtime prompt loading for `stage6a_legal_document_cartography` must use `DILIGENCE_CANONICAL_SPINE_v1.md`, not this retired block.

<!-- CANON:STAGE6:END -->

<!-- CANON:STAGE7_NAVIGATION:START -->

# STAGE 7 NAVIGATION CANON

## Role of Stage 6 in Stage 7

Stage 6 helps Stage 7 navigate. It does not decide Stage 7.

Stage 7 must use Stage 6 maps as handles into the full lossless source bundle. Stage 7 still reads the underlying source/document text line-by-line before applying Hunter Trigger logic.

## Required Stage 7 handoff principle

```text
Stage 7 starts from Stage 6 refs.
Stage 7 still reads the underlying source/document text line-by-line before triggering a Hunter row.
Stage 6 never pre-decides Hunter Trigger status.
```

## `stage7_navigation_index`

```json
"stage7_navigation_index": {
  "feature_to_data_flow_index": [],
  "feature_to_document_section_index": [],
  "control_family_index": [],
  "data_signal_index": [],
  "document_source_locator_index": [],
  "absence_unknown_index": [],
  "fallback_source_packet": []
}
```

### `feature_to_data_flow_index[]`

Required fields:

```text
feature_id
flow_ids[]
provenance_ids[]
data_categories[]
surface_tokens[]
```

Purpose: tells Stage 7 which data flows belong to which feature.

### `feature_to_document_section_index[]`

Required fields:

```text
feature_id
doc_ids[]
section_ids[]
control_families[]
```

Purpose: points Stage 7 to relevant legal/control sections.

### `control_family_index[]`

Required fields:

```text
control_family
coverage_signal
control_signal_ids[]
doc_ids[]
section_ids[]
```

Purpose: lets Stage 7 find relevant visible/not-visible controls quickly.

### `data_signal_index[]`

Required fields:

```text
signal_type
signal_value
flow_ids[]
feature_ids[]
section_ids[]
```

Purpose: lets Stage 7 find personal/sensitive/training/transfer/rights/processor signals.

### `document_source_locator_index[]`

Required fields:

```text
doc_id
section_id
source_record_ref
source_url
locator_type
locator_value
```

Purpose: tells Stage 7 where to read line-by-line.

### `absence_unknown_index[]`

Required fields:

```text
signal_type
object_ref
search_scope
absence_basis
confidence
```

Purpose: helps Stage 7 distinguish public-footprint absence from missing evidence.

### `fallback_source_packet[]`

Required fields:

```text
source_record_ref
source_url
source_type
reason_for_fallback
```

Purpose: provides raw source fallback references for Hunter Trigger evaluation.

## Stage 7 forbidden shortcuts

Stage 7 must not treat Stage 6 control/data signals as final proof of Hunter status by themselves.

Forbidden shortcuts:

```text
Stage 6 says not_visible -> automatically TRIGGERED
Stage 6 says visible -> automatically CONTROLLED
Stage 6 data profile has personal_data_visible -> automatically PRV threat triggered
Stage 6 legal stack has DPA visible -> automatically PRV threat controlled
```

Allowed use:

```text
Use Stage 6 maps to find the relevant source text and evidence scope faster.
Then evaluate the supplied registry row's Hunter Trigger line-by-line.
```

<!-- CANON:STAGE7_NAVIGATION:END -->

End of Diligence Canon Field Dictionary v1.
