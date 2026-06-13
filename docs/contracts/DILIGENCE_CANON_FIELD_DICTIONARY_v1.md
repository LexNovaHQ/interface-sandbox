# Diligence Canon Field Dictionary v1

## Status

This is the single canonical field-definition dictionary for the Diligence Engine runtime prompt chain.

It governs the meaning of canonical stage objects, navigation handles, controlled values, and stage boundaries. Schemas enforce structure; prompts derive values from this dictionary; runtime code must not invent parallel definitions in another file.

## Runtime slicing

The runtime prompt loader must append only the blocks relevant to the active stage.

```text
company_profile              -> UNIVERSAL + STAGE4
target_feature_profile       -> UNIVERSAL + STAGE5
legal_stack_review           -> UNIVERSAL + STAGE6
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

# STAGE 6 CANON — `legal_stack_review_v2`

## Role

Stage 6 is the Legal Stack + Data Provenance Navigation Layer.

Primary job:

```text
Organise public legal/control documents and data-flow signals so Stage 7 can navigate the full lossless source bundle faster and cleaner.
```

Stage 6 helps Stage 7 navigate. It does not take away Stage 7's job. Stage 7 still reads the underlying document/source text line-by-line when applying Hunter Trigger logic.

## Runtime wrapper

Runtime output key remains:

```text
legal_stack_review
```

Canonical internal version:

```text
legal_stack_review_v2
```

## Hard boundaries

Stage 6 must not emit:

```text
threat_status
triggered_threat_ids
Hunter Trigger decisions
registry final_status values
candidate control gaps
recommended controls
missing required clauses
DPDP/GDPR/CCPA compliance verdicts
compliance verdicts
Vault questions
Vault prefill
Vault handoff
HTML/report narrative
legal advice
```

## Top-level structure

```json
{
  "legal_stack_review_version": "legal_stack_review_v2",
  "stage_role": "stage7_navigation_index",
  "input_refs": {},
  "legal_document_cartography": {},
  "data_provenance_profile": {},
  "stage7_navigation_index": {},
  "stage6_limitations": []
}
```

## 6A — `legal_document_cartography`

6A maps documents and their internal structure. It does not judge compliance.

```json
"legal_document_cartography": {
  "legal_document_inventory": [],
  "legal_document_index": [],
  "document_relationship_map": [],
  "document_control_signal_map": [],
  "document_mismatch_signal_map": [],
  "legal_stack_summary_signals": {},
  "legal_stack_limitations": []
}
```

### `legal_document_inventory[]`

One row per public legal/control artifact.

Required fields:

```text
doc_id
doc_type
doc_family
doc_title
document_status
access_status
source_record_ref
source_url
canonical_or_supplemental
effective_date
last_updated
version
jurisdiction_scope[]
language
confidence
```

Core `doc_type` values:

```text
tos
privacy_policy
dpa
aup
sla
```

Supplemental `doc_type` values:

```text
cookie_policy
subprocessor_page
security_page
trust_center
ai_policy
responsible_ai_page
model_card
developer_terms
api_terms
community_guidelines
data_deletion_page
dsr_page
grievance_page
baa
hipaa_notice
data_transfer_addendum
other_valid_control_doc
unknown
```

### `legal_document_index[]`

One row per section, heading, schedule, annexure, table, appendix, linked policy, banner, footer notice, modal notice, FAQ, or equivalent document unit.

Required fields:

```text
index_id
doc_id
section_id
section_path
heading_level
heading_text
structural_zone
section_function
control_topics_detected[]
feature_refs[]
data_flow_refs[]
source_record_ref
source_locator
confidence
```

`structural_zone` values:

```text
main_body
annexure
schedule
exhibit
table
appendix
linked_policy
footer_notice
banner_notice
modal_notice
faq
unknown
```

`section_function` values:

```text
definitions
service_description
ai_disclosure
privacy_notice
data_processing_terms
subprocessor_terms
acceptable_use_rules
prohibited_use_rules
security_terms
breach_terms
retention_deletion_terms
rights_request_terms
cross_border_transfer_terms
liability_terms
warranty_disclaimer
sla_terms
agentic_controls
commercial_terms
dispute_terms
other
unknown
```

### `document_relationship_map[]`

One row per doc-to-doc or section-to-section relationship.

Required fields:

```text
relationship_id
from_doc_id
to_doc_id
from_section_id
to_section_id
relationship_type
relationship_signal
section_refs[]
source_record_ref
confidence
```

`relationship_type` values:

```text
incorporates_by_reference
supplements
controls_on_conflict
linked_from
defines_terms_for
activates_when
supersedes_for_subject_matter
unknown
```

### `document_control_signal_map[]`

One row per visible or absent legal/control signal.

Required fields:

```text
control_signal_id
doc_id
section_id
control_family
coverage_signal
feature_refs[]
data_flow_refs[]
basis_codes[]
source_record_ref
confidence
```

`control_family` values:

```text
ai_disclosure
hallucination_disclaimer
hitl_mandate
acceptable_use
prohibited_use
privacy_notice
data_collection
data_use
data_sharing
subprocessor_disclosure
model_provider_disclosure
training_or_finetuning
retention
deletion
data_subject_rights
consent_withdrawal
grievance_channel
security_safeguards
breach_notice
cross_border_transfer
liability_cap
warranty_disclaimer
sla_performance
agentic_controls
unknown
```

### `document_mismatch_signal_map[]`

One row per quote-free mismatch signal.

Required fields:

```text
mismatch_id
mismatch_type
left_ref_type
left_ref
right_ref_type
right_ref
control_family
mismatch_signal
basis_codes[]
confidence
```

`mismatch_type` values:

```text
feature_vs_document
data_flow_vs_document
document_vs_document
claim_vs_absence
stack_vs_reality
unknown
```

### `legal_stack_summary_signals`

One compact object.

Required fields:

```text
core_stack_status
supplemental_artifacts_detected[]
document_hierarchy_signal
legal_stack_coverage_signal
major_unknowns[]
```

Core stack keys:

```text
tos
privacy_policy
dpa
aup
sla
```

### `legal_stack_limitations[]`

One row per limitation.

Required fields:

```text
limitation_id
scope
doc_id
section_id
reason_code
impact_code
confidence
```

## 6B — `data_provenance_profile`

6B maps data flows. One row per data flow. No quotes. No prose. No control gaps. No compliance findings.

```json
"data_provenance_profile": {
  "data_provenance_profile_version": "data_provenance_profile_v1",
  "data_flow_profile": [],
  "profile_summary_signals": {},
  "data_profile_limitations": []
}
```

### `data_flow_profile[]`

One row per data flow.

Root fields:

```text
flow_id
feature_id
provenance_id
feature_role
flow_role
confidence
```

`flow_role` values:

```text
primary_input
secondary_input
system_metadata
generated_output
stored_record
third_party_transfer
derived_data
unknown
```

Each row contains these sub-objects:

```text
data_subject
data_category
processing
role_allocation
regime_relevance
notice
consent_basis
rights
processor_chain
transfer_location
retention_deletion_ai
security_accountability
source_trace
```

### `data_subject`

Required fields:

```text
subject_type
dpdp_label
gdpr_label
us_label
minor_signal
```

`subject_type` values:

```text
website_visitor
registered_user
customer_admin
customer_end_user
developer
employee
contractor
candidate
patient
child_or_minor
business_contact
unknown
```

### `data_category`

Required fields:

```text
category
personal_data_signal
sensitive_signal_gdpr
sensitive_signal_us
sensitive_signal_dpdp
biometric_signal
```

`category` values:

```text
account_identity
contact_data
authentication_data
prompt_text
uploaded_file
audio
image_video
generated_output
usage_logs
device_network_data
payment_billing
support_communications
employment_hr
financial
health
biometric_identifier
child_data
location
public_web_data
third_party_dataset
unknown
```

### `processing`

Required fields:

```text
data_origin
collection_context
processing_actions[]
purpose_category
output_category
```

`processing_actions[]` values:

```text
collect
receive
store
embed
retrieve
infer
generate
summarize
translate
classify
score
rank
recommend
route
share
transfer
delete
log
monitor
train_or_finetune
unknown
```

### `role_allocation`

Required fields:

```text
dpdp_company_role
gdpr_company_role
us_company_role
customer_role
third_party_role
role_confidence
```

DPDP role values:

```text
data_fiduciary
data_processor
both
not_applicable
unknown
```

GDPR role values:

```text
controller
processor
joint_controller
subprocessor
both
not_applicable
unknown
```

US role values:

```text
business
service_provider
contractor
third_party
not_applicable
unknown
```

### `regime_relevance`

Required fields:

```text
dpdp
gdpr
uk_gdpr
ccpa_cpra
us_state_privacy
basis_tags[]
```

`basis_tags[]` values:

```text
india_entity
india_users
eu_users
uk_users
california_users
global_users
privacy_policy_mentions_regime
terms_mentions_regime
no_regime_signal
unknown
```

### `notice`

Required fields:

```text
notice_signal
purpose_notice_signal
data_category_notice_signal
ai_processing_notice_signal
model_provider_notice_signal
notice_section_refs[]
```

### `consent_basis`

Required fields:

```text
gdpr_lawful_basis_signal
dpdp_basis_signal
consent_collection_signal
withdrawal_signal
consent_manager_signal
basis_section_refs[]
```

GDPR lawful-basis values:

```text
consent
contract
legal_obligation
vital_interests
public_task
legitimate_interests
not_visible
not_applicable
unknown
```

DPDP basis values:

```text
consent
legitimate_use
not_visible
not_applicable
unknown
```

### `rights`

Required fields:

```text
access_signal
correction_signal
deletion_erasure_signal
withdrawal_signal
portability_signal
objection_optout_signal
grievance_signal
nomination_signal_dpdp
rights_channel_type
rights_section_refs[]
```

`rights_channel_type` values:

```text
email
web_form
dashboard
mailing_address
consent_manager
not_visible
unknown
```

### `processor_chain`

Required fields:

```text
processor_signal
subprocessor_signal
model_provider_signal
cloud_provider_signal
analytics_provider_signal
payment_provider_signal
recipient_categories[]
processor_section_refs[]
```

`recipient_categories[]` values:

```text
ai_model_provider
cloud_host
vector_database
analytics_provider
payment_processor
email_provider
authentication_provider
support_tool
customer_system
government_or_legal
unknown
```

### `transfer_location`

Required fields:

```text
origin_region_signal
destination_region_signal
cross_border_transfer_signal
transfer_basis_signal_gdpr
transfer_restriction_signal_dpdp
location_section_refs[]
```

Region values:

```text
india
eu_eea
uk
us
canada
global
unknown
not_applicable
```

### `retention_deletion_ai`

Required fields:

```text
retention_period_signal
deletion_mechanism_signal
embedding_signal
vector_store_signal
rag_signal
fine_tuning_signal
training_use_signal
model_weight_risk_signal
ai_architecture_section_refs[]
```

### `security_accountability`

Required fields:

```text
security_safeguard_signal
encryption_signal
access_control_signal
audit_log_signal
breach_notice_signal
grievance_officer_signal
dpo_signal
security_section_refs[]
```

### `source_trace`

Required fields:

```text
feature_refs[]
provenance_refs[]
source_record_refs[]
document_refs[]
section_refs[]
evidence_strength
```

`evidence_strength` values:

```text
direct
indirect
inferred_from_feature
absence_after_search
conflicting
unknown
```

## `profile_summary_signals`

Required keys:

```text
personal_data_visible
sensitive_data_visible
children_data_visible
cross_border_visible
subprocessor_visible
training_or_finetuning_visible
deletion_channel_visible
automated_decision_visible
```

All values use the standard signal enum.

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
