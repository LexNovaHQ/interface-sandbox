# Phase 1 — Source Discovery

## Purpose

Phase 1 is the public-source capture layer for the diligence pipeline. Its job is to discover, classify, fetch, preserve, and hand off public source material from a target-controlled web footprint.

Phase 1 does **not** derive profile facts. It does **not** decide the target's domain. It does **not** decide legal risk. It does **not** classify exposure. It does **not** prepare the report. It creates the source record that later phases may use.

The locked doctrine is:

```text
Phase 1 captures source truth.
Phase 2 indexes source navigation.
Profile phases derive facts from index-guided source reads.
```

Phase 1 is deliberately domain-agnostic. Any pre-Phase-1 domain preflight is passive and expand-only. It may add discovery hints, but it may not narrow discovery, lock the target domain, exclude sources, or route prompts dynamically.

---

## Runtime location

Primary Phase 1 files:

```text
src/phases/01-source-discovery/source-discovery.contract.js
src/phases/01-source-discovery/source-discovery.runner.js
src/phases/01-source-discovery/services/source-discovery-taxonomy.service.js
src/phases/01-source-discovery/services/url-manifest.service.js
src/phases/01-source-discovery/services/source-extraction.service.js
src/phases/01-source-discovery/services/source-family-handoff.service.js
src/phases/01-source-discovery/validators/source-discovery.validator.js
```

Runtime and permissions surfaces that must remain in sync:

```text
src/runtime/contracts/artifact-permissions.contract.js
src/runtime/contracts/pipeline.contract.js
src/runtime/services/pipeline.service.js
src/phase-contracts.js
scripts/check-phase1-agnostic-source-discovery.mjs
```

---

## Phase 1 internal jobs

Phase 1 is implemented as three internal jobs.

### 1. `AGENT_1A_URL_MANIFEST`

Deterministic. No model usage.

Responsibilities:

- resolve target URL and target-controlled host boundary;
- run passive pre-Phase-1 domain preflight;
- discover candidate URLs from root page, header/footer, sitemap, known paths, legal-doc probes, and adapter expansion hints;
- traverse the locked 15-root classifier matrix in root order;
- dedupe candidate URLs;
- classify manifest rows into locked common roots, route types, signal roles, and admission tiers;
- emit manifest/control artifacts.

Writes:

```text
domain_selection_profile
active_run_package_manifest
deduped_url_manifest
source_discovery_matrix_manifest
adapter_expansion_log
neutral_evidence_bucket_manifest
```

### 2. `AGENT_1B_EXTRACT`

Deterministic. No model usage.

Responsibilities:

- read `deduped_url_manifest`;
- fetch only rows with `admission_tier = PRIMARY` and `extraction_decision = EXTRACT`;
- preserve lossless source text;
- save sparse common-root artifacts only when extracted non-legal material source text exists;
- split legal documents into independent `legal_doc_*` artifacts;
- emit `source_family_index` and legal-doc control artifacts.

Writes:

```text
source_family_index
lossless_root__{COMMON_ROOT}
lossless_root__{COMMON_ROOT}__part_{NNN}
legal_doc_inventory
legal_doc_extraction_index
legal_doc_{DOC_TYPE}
legal_doc_lossless_validation_manifest
```

### 3. `M6_BUCKET_INDEX`

Deterministic. No model usage.

Responsibilities:

- build the downstream source handoff;
- preserve full Phase 1 classifier metadata;
- expose virtual/sparse root status;
- expose legal-doc navigation while preserving individual `legal_doc_*` artifacts as the source of truth;
- produce the post-Phase-1 handoff for Phase 2.

Writes:

```text
source_discovery_handoff
post_phase_1_domain_gate_handoff
```

---

## Locked 15-root matrix

Phase 1 stores source material under exactly 15 common physical roots. These are neutral source roots, not downstream profile families.

```text
1. homepage_landing
2. company_identity
3. contact_notice
4. product_service
5. platform_feature_solution
6. technical_docs_api
7. docs_api_data_flow
8. integrations_ecosystem
9. pricing_commercial_availability
10. use_case_customer_industry
11. privacy_data_processing
12. security_trust_compliance
13. data_governance_controls
14. ai_safety_transparency
15. support_help_resources
```

No other common root may be emitted as a physical Phase 1 root artifact.

---

## Root traversal policy

Each root has an explicit traversal policy.

### `PRIMARY_SINGLE_EXTRACT`

```text
homepage_landing
```

The submitted/resolved homepage is primary, but it does not create a same-root slug chain under `/`.

### `PRIMARY_FULL_EXTRACT`

```text
company_identity
contact_notice
product_service
platform_feature_solution
technical_docs_api
docs_api_data_flow
privacy_data_processing
security_trust_compliance
data_governance_controls
ai_safety_transparency
```

For these roots, Phase 1 must touch the complete same-root slug chain before moving to the next root.

Example:

```text
/product
/product/speech-to-text
/product/translation
/product/ocr
/product/voice-ai
```

All discovered same-root child pages must be captured before moving to the next root.

Example:

```text
/docs
/docs/api
/docs/api/authentication
/docs/api/webhooks
/docs/api/speech-to-text
```

All discovered same-root descendants must be touched.

### `SECONDARY_CONDITIONAL`

```text
integrations_ecosystem
pricing_commercial_availability
use_case_customer_industry
support_help_resources
```

These are not useless. They remain part of the matrix and may carry important source evidence. They are secondary by default unless downstream indexing elevates their practical reading priority.

---

## Root-ordered traversal

The URL manifest job traverses roots in locked matrix order.

For each root, it:

1. probes known root paths;
2. fetches available root pages;
3. extracts same-root links;
4. crawls every same-root child slug for `PRIMARY_FULL_EXTRACT` roots;
5. classifies every discovered candidate;
6. dedupes canonical URLs;
7. then moves to the next root.

This means Phase 1 must not sample one product page and move on. For primary full-extract roots, the full same-root chain is mandatory.

---

## Classifier matrix

The classifier is not a generic prefix loop. The locked classifier has dedicated logic for each root:

```text
classifyHomepage
classifyCompanyIdentity
classifyContactNotice
classifyProductService
classifyPlatformFeatureSolution
classifyTechnicalDocsApi
classifyDocsApiDataFlow
classifyIntegrationsEcosystem
classifyPricingCommercialAvailability
classifyUseCaseCustomerIndustry
classifyPrivacyDataProcessing
classifySecurityTrustCompliance
classifyDataGovernanceControls
classifyAiSafetyTransparency
classifySupportHelpResources
classifyLegalDocumentSurfaces
```

Each classified manifest row must carry:

```text
common_root
root_traversal_policy
canonical_url
fetch_url
route_type
route_type_aliases
materiality
source_signal_roles
technical_route_shape
api_data_flow_signal
neutral_buckets
admission_tier
variant_class
extraction_decision
legal_doc_candidate
legal_doc_type
legal_doc_artifact_hint
adapter_discovery
phase_1_classification_effect
```

The required `phase_1_classification_effect` is:

```text
SOURCE_ROUTING_ONLY_NOT_JOB_ROUTING
```

This is a boundary guard. Phase 1 routing is not domain selection and not downstream job routing.

---

## Source signal roles

Source signal roles are routing metadata for downstream navigation. They are not conclusions.

Locked roles:

```text
TARGET_IDENTITY_SIGNAL
CONTACT_NOTICE_SIGNAL
COMMERCIAL_AVAILABILITY_SIGNAL
COMMERCIAL_POSITIONING_SIGNAL
PRODUCT_ACTIVITY_SIGNAL
TECHNICAL_MECHANICS_SIGNAL
API_INTEGRATION_SIGNAL
DATA_FLOW_SIGNAL
DATA_PROCESSING_SIGNAL
DATA_GOVERNANCE_SIGNAL
SECURITY_TRUST_SIGNAL
AI_MECHANISM_SIGNAL
AI_SAFETY_TRANSPARENCY_SIGNAL
REGULATED_ACTIVITY_SIGNAL
CUSTOMER_SEGMENT_SIGNAL
LEGAL_DOCUMENT_SIGNAL
LEGAL_NOTICE_SIGNAL
VENDOR_PROCESSING_SIGNAL
SUPPORT_CONTEXT_SIGNAL
```

These roles must survive into:

```text
deduped_url_manifest
source_family_index
lossless_root__* artifacts
legal_doc_* artifacts
source_discovery_handoff
post_phase_1_domain_gate_handoff
```

No classifier field may die before Phase 2.

---

## Technical route shapes

Technical sources may carry additional route shape metadata.

Locked route shapes include:

```text
MACHINE_READABLE_API_INDEX
DOCS_SUBDOMAIN_ROOT
API_DOCS_ROOT
API_FAMILY_ROOT
SDK_CLIENT_DOCS
EXAMPLE_OR_FAQ_CONTEXT
LANGUAGE_VARIANT
TECHNICAL_CHILD_PAGE
MODEL_OVERVIEW
MODEL_DETAIL
INTEGRATION_ROOT
INTEGRATION_CHILD
CHANGELOG_INDEX
CHANGELOG_ENTRY
APP_SHELL_METADATA
```

`docs_api_data_flow` rows must also carry `api_data_flow_signal.present = true` when they are primary data-flow rows.

API/data-flow family segments include:

```text
speech
text-to-speech
speech-to-text
voice
audio
translation
dubbing
document
digitisation
digitization
ocr
vision
image
file
batch
transcription
```

---

## Neutral evidence buckets

Neutral buckets are evidence organization helpers. They are not profile answers and not domain conclusions.

Locked buckets:

```text
company_identity_sources
commercial_positioning_sources
product_activity_sources
technical_docs_sources
api_integration_sources
pricing_plan_sources
legal_terms_sources
privacy_security_sources
trust_compliance_sources
regulated_activity_signals
ai_mechanism_signals
data_processing_signals
contact_notice_sources
customer_segment_signals
jurisdiction_market_signals
support_context_sources
thin_or_missing_source_gaps
```

The classifier must use tokenized matching for AI-related signals. It must not use raw substring matching such as `includes("ai")`.

False positives that must not trigger AI classification include examples like:

```text
/chair
/claims
/email
/availability
```

---

## Legal document handling

Legal documents are not common roots.

They are independent artifacts.

The locked rule is:

```text
one discovered legal document URL = one independent legal_doc_* artifact
```

Examples:

```text
/privacy-policy -> legal_doc_privacy_policy
/dpa -> legal_doc_data_processing_agreement
/subprocessors -> legal_doc_subprocessor_list
/cookie-policy -> legal_doc_cookie_policy
/legal-notice -> legal_doc_legal_notice
/usage-policy -> legal_doc_usage_policy
/safety-policy -> legal_doc_safety_policy
```

Legal-doc inventory artifacts are navigation/control artifacts only:

```text
legal_doc_inventory
legal_doc_extraction_index
legal_doc_lossless_validation_manifest
```

The individual `legal_doc_*` artifact is the source of truth for legal document substance.

Common roots may reference legal documents, but legal document lossless text must live only in `legal_doc_*` artifacts. Merged legal blobs are forbidden.

---

## Sparse root storage

Phase 1 uses sparse physical storage.

Every root is evaluated and represented in `source_family_index.root_artifact_manifest`, but a physical `lossless_root__*` artifact is saved only if the root has extracted non-legal material source text.

This avoids saving empty artifacts.

Rules:

```text
Every one of the 15 roots must appear in source_family_index.root_artifact_manifest.
A root with no extracted non-legal material source text is virtual only.
A saved root artifact must contain at least one source.
A material root must have required_artifacts[] in root_artifact_manifest.
Legal document text does not count as common-root material source text.
Legal document text must not leak into common-root source blobs.
```

Empty/no-material roots are not failure by default. They are recorded as one of:

```text
UNSAVED_ABSENT
UNSAVED_INDEX_ONLY
UNSAVED_NO_MATERIAL_SOURCE
```

---

## Sharding rule

Large roots may be sharded into physical artifacts:

```text
lossless_root__{COMMON_ROOT}__part_{NNN}
```

Sharding may split source rows across files, but it must never cut source text inside a source row.

Locked shard rules:

```text
source_text_cutting_allowed = false
root_sources_required_together = true when more than one shard exists
all required_artifacts[] must be loaded together
source_ids must appear exactly once across required shards
```

The runtime resolver must use `source_family_index.root_artifact_manifest` to resolve virtual roots and shards.

---

## Retired roots

The following old roots are retired and must not be emitted as physical artifacts or active input reads:

```text
about_company
legal_identity_notice
operator_entity_signals
supporting_company_signals
security_trust
trust_compliance
support_help
blog_resources
careers_hiring
public_repository_developer_assets
third_party_profiles
technical_docs_api_developer
```

Mappings:

```text
about_company -> company_identity
legal_identity_notice -> company_identity + legal_doc_legal_notice
operator_entity_signals -> downstream signal, not Phase 1 physical root
supporting_company_signals -> company_identity / manifest context
security_trust + trust_compliance -> security_trust_compliance
support_help -> support_help_resources
blog_resources -> support_help_resources or manifest/context only
careers_hiring -> company_identity / manifest context
public_repository_developer_assets -> technical_docs_api / manifest context
third_party_profiles -> manifest-only, not physical root
technical_docs_api_developer -> technical_docs_api
```

---

## Adapter expansion boundary

Adapters are expand-only.

They may add probe paths. They may not narrow discovery.

Locked adapter flags:

```text
may_expand_discovery = true
may_narrow_discovery = false
may_exclude_sources = false
classification_effect = NONE
dynamic_routing_used = false
domain_lock_used = false
```

Passive preflight can suggest additional paths, but cannot change Phase 1's source universe.

---

## Phase 1 to Phase 2 handoff

The handoff artifacts are:

```text
source_discovery_handoff
post_phase_1_domain_gate_handoff
```

The required handoff schema versions are:

```text
PHASE1_SOURCE_DISCOVERY_HANDOFF_v2_FULL_ROOT_MATRIX
POST_PHASE_1_DOMAIN_GATE_HANDOFF_v2_FULL_ROOT_MATRIX
```

The handoff must preserve:

```text
full_15_root_classifier_matrix_preserved
primary_full_extract_slug_chain_preserved
source_signal_roles_preserved
technical_route_shape_preserved
api_data_flow_signal_preserved
legal_doc_granularity_preserved
```

Phase 2's input contract requires Phase 1 v4:

```text
PHASE1_AGNOSTIC_COMMON_ROOT_INDEX_v4_STORAGE_RESOLVER_HARDENED
PHASE_OWNED_IMPLEMENTATION_AGNOSTIC_V4_STORAGE_RESOLVER_HARDENED
```

---

## Artifact list

### Control artifacts

```text
domain_selection_profile
active_run_package_manifest
deduped_url_manifest
source_discovery_matrix_manifest
adapter_expansion_log
neutral_evidence_bucket_manifest
```

### Extraction/index artifacts

```text
source_family_index
lossless_root__{COMMON_ROOT}
lossless_root__{COMMON_ROOT}__part_{NNN}
```

### Legal document artifacts

```text
legal_doc_inventory
legal_doc_extraction_index
legal_doc_lossless_validation_manifest
legal_doc_{DOC_TYPE}
legal_doc_other__{slug}
```

### Handoff artifacts

```text
source_discovery_handoff
post_phase_1_domain_gate_handoff
```

---

## What Phase 1 must never do

Forbidden work:

```text
domain_locking
source_discovery_narrowing_from_domain_preflight
domain_specific_source_exclusion
dynamic_prompt_routing
field_registry_compilation
legal_cartography
target_profile_derivation
activity_profile_derivation
data_provenance_derivation
exposure_selection
qualified_review_prefill
report_rendering
legal_document_blob_merging
retired_common_root_artifact_emission
primary_root_slug_chain_sampling
full_matrix_metadata_stripping
empty_root_physical_artifact_emission
source_text_cutting_inside_row
```

If a future patch needs one of these, it is not a Phase 1 patch. It belongs downstream or requires a contract change.

---

## Validation gate

The primary check script is:

```text
scripts/check-phase1-agnostic-source-discovery.mjs
```

It is wired into `npm run check`.

The check currently validates:

```text
exact 15-root matrix
PRIMARY_FULL_EXTRACT roots
SECONDARY_CONDITIONAL roots
retired root artifact ban
pipeline read-set sanity
full-root-matrix contract markers
sparse storage contract markers
legal_doc_* mappings
mocked-source behavioral classifier fixtures
AI false-positive behavior
adapter expand-only behavior
source-family handoff metadata preservation
storage-resolver hardened schema markers
```

The behavioral fixture covers representative URLs including:

```text
/about
/legal-notice
/contact
/product/speech-to-text
/features/voice-ai
/docs/api/authentication
/apis/speech-to-text
/integrations/slack
/pricing
/use-cases/healthcare
/privacy
/dpa
/subprocessors
/cookie-policy
/security
/data-residency
/model-cards/foo
/usage-policy
/help/article
```

False-positive fixtures include:

```text
/chair
/claims
/email
/availability
```

---

## Audit checklist

When auditing Phase 1, check these in order:

1. `source-discovery-taxonomy.service.js` contains exactly the locked 15 roots.
2. No retired root is present as an active physical artifact or active read.
3. `url-manifest.service.js` uses dedicated root classifiers, not only a generic prefix loop.
4. `PRIMARY_FULL_EXTRACT` roots are traversed through same-root slug chains.
5. `deduped_url_manifest.manifest_sources[]` carries full matrix metadata.
6. `source-extraction.service.js` saves sparse root artifacts only when non-legal material source text exists.
7. `source_family_index.root_artifact_manifest` has all 15 roots.
8. Sharded roots require all physical shards together and do not cut source text inside a source row.
9. Legal document text exists only in `legal_doc_*` artifacts.
10. `source-family-handoff.service.js` preserves matrix metadata into `source_discovery_handoff`.
11. `post_phase_1_domain_gate_handoff` advertises the full-root-matrix handoff schema.
12. `pipeline.contract.js` does not read retired roots.
13. `cartography-index.contract.js` accepts only Phase 1 v4 full-matrix input contract.
14. `scripts/check-phase1-agnostic-source-discovery.mjs` includes behavioral classifier fixtures.
15. `npm run check` must pass locally before merge.

---

## Current lock status

As of this branch state, Phase 1 is intended to be locked at:

```text
PHASE_OWNED_IMPLEMENTATION_AGNOSTIC_V4_STORAGE_RESOLVER_HARDENED
```

The Phase 2 input contract expects:

```text
PHASE2_INPUT_CONTRACT_v2_PHASE1_FULL_MATRIX
```

Local validation was not run from the ChatGPT/GitHub connector environment. Any merge should be preceded by local validation in the repository environment.
