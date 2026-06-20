# Diligence Canonical Spine v1

## Status

This document is the sole human-readable Stage 6 spine for the Interface Diligence Engine.

The matching machine-readable source of truth is:

```text
runtime-api/src/diligence/stage6CanonicalVocabulary.js
```

The single Stage 6 schema is:

```text
data/schemas/stage6Review.schema.json
```

No Stage 6A schema, model-overlay schema, prompt-local enum list, local `ALLOWED_ENUMS`, generated bundle, disabled audit, legacy prompt, or legacy legal-stack schema is an independent authority.

## Stage 6 Role

Stage 6 is the navigation layer between Stage 4/5 facts and Stage 7 registry evaluation.

Stage 6 organizes public legal/control documents and data-flow signals so Stage 7 can navigate the admitted source bundle. Stage 6 does not decide Hunter triggers, registry final statuses, legal conclusions, compliance verdicts, control gaps, recommendations, Vault prefill, or report prose.

## Canonical Runtime Object

```json
{
  "stage6_review_version": "stage6_review_v1",
  "stage6_component": "stage6a_legal_document_cartography",
  "stage_role": "stage7_navigation_index",
  "input_refs": {},
  "legal_document_cartography": {},
  "data_provenance_profile": {},
  "stage7_navigation_index": {},
  "stage6_limitations": []
}
```

`legal_document_cartography` is required for `stage6a_legal_document_cartography` and `stage6_integrated_handoff`. `data_provenance_profile` is required for `stage6b_data_provenance` and `stage6_integrated_handoff`. 6A-only output must not contain 6B data. 6B-only output must not contain 6A legal cartography.

## Stage 6 Components

```text
stage6a_legal_document_cartography
stage6b_data_provenance
stage6_integrated_handoff
```

## Stage 6A Legal Document Cartography

Canonical object:

```text
legal_document_cartography
  legal_document_inventory[]
  legal_document_index[]
  document_relationship_map[]
  document_control_signal_map[]
  document_mismatch_signal_map[]
  legal_document_summary_signals
  legal_document_limitations[]
```

## Document Inventory Row

```text
document_id
document_type
document_family
document_title
document_status
access_status
source_record_ref
source_url
final_url
parent_document_id
effective_date
last_updated
version
jurisdiction_scope[]
language
confidence
```

## Document Types

```text
tos
privacy_policy
dpa
aup
sla
eula
cookie_policy
subprocessor_page
security_page
trust_center
status_page
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
terms_page
pricing_terms
service_description_page
other_valid_control_doc
unknown
```

## Document Family / Status / Access

```text
document_family = core | supplemental | embedded | operational | unknown
document_status = visible | embedded | linked | not_visible | unknown
access_status = ingested | metadata_only | fetch_failed | blocked | not_attempted | unknown
confidence = high | medium | low | unknown
```

## Macro Legal Unit Index

Canonical legal unit rows use:

```text
index_id
document_id
legal_unit_id
legal_unit_type
legal_unit_title
legal_unit_path
legal_unit_order
section_function
control_families_detected[]
feature_refs[]
data_flow_refs[]
source_record_ref
source_locator
basis_codes[]
confidence
```

The index is macro-only. It must not emit every heading, subheading, page header, page footer, table-of-contents row, FAQ item, modal notice, banner notice, or arbitrary micro-section as a canonical legal unit.

Allowed `legal_unit_type` values:

```text
main_section
annexure
schedule
exhibit
linked_policy
material_table
control_notice
unknown
```

## Section Function Values

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
ip_ownership_terms
minor_access_terms
automated_decision_terms
sensitive_data_terms
other
unknown
```

## Document Relationship Map

```text
relationship_id
from_ref
to_ref
relationship_type
basis_codes[]
confidence
```

Allowed `relationship_type` values:

```text
incorporates_by_reference
supplements
controls_on_conflict
linked_from
defines_terms_for
activates_when
supersedes_for_subject_matter
embedded_within
unknown
```

## Document Control Signal Map

```text
control_signal_id
document_id
legal_unit_id
control_family
control_signal
basis_codes[]
source_refs[]
feature_refs[]
data_flow_refs[]
confidence
```

Allowed `control_signal` values:

```text
visible
partial
absent_after_search
unclear
not_applicable
unknown
```

## Control Families

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
commercial_terms
dispute_terms
ip_ownership
minor_access
automated_decision
sensitive_data
unknown
```

## Document Mismatch Signal Map

```text
mismatch_id
mismatch_type
mismatch_signal
expected_ref
actual_ref
control_family
basis_codes[]
confidence
```

Allowed `mismatch_type` values:

```text
feature_vs_document
data_flow_vs_document
document_vs_document
claim_vs_absence
stack_vs_reality
unknown
```

Allowed `mismatch_signal` values:

```text
expected_signal_absent
expected_signal_partial
conflicting_signal
source_absent
source_unclear
unknown
```

## Stage 6B Data Provenance

Canonical object:

```text
data_provenance_profile
  data_provenance_profile_version
  data_flow_profile[]
  data_profile_summary_signals
  data_profile_limitations[]
```

Each `data_flow_profile[]` row must use only these canonical root fields:

```text
data_flow_id
feature_id
provenance_id
feature_role
flow_role
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
basis_codes[]
source_refs[]
confidence
```

No 6B object may allow arbitrary additional properties.

## Stage 7 Navigation Index

```text
stage7_navigation_index
  feature_to_data_flow_index[]
  feature_to_legal_unit_index[]
  control_family_index[]
  data_signal_index[]
  legal_unit_source_locator_index[]
  absence_unknown_index[]
  fallback_source_packet[]
```

Retired names include `feature_to_document_section_index[]` and `document_source_locator_index[]`.

## Stage 6B Data Provenance

Stage 6B uses the same Stage 6 object and schema. It owns `data_provenance_profile` only when `stage6_component` is `stage6b_data_provenance` or `stage6_integrated_handoff`.

Stage 6A-only outputs must not contain 6B data fields.

### Stage 6B Hybrid Architecture

Stage 6B is hybrid in the same pattern as Stage 6A:

```text
1. Deterministic seed builder creates the canonical data-flow spine.
2. Gemini receives a bounded semantic packet built from deterministic rows.
3. Gemini returns only controlled semantic classifications.
4. Deterministic normalizer validates and repairs model output against stage6CanonicalVocabulary.js.
5. Deterministic merge/finalizer emits the final stage6_review_v1 object.
6. Final output validates against data/schemas/stage6Review.schema.json.
```

Gemini must never author the final Stage 6 schema object directly.

### Stage 6B Deterministic Source Of Truth

Stage 6B row creation is deterministic from Stage 5:

```text
target_feature_profile.data_provenance_map[] -> data_provenance_profile.data_flow_profile[]
```

If Stage 5 has data-provenance rows, Stage 6B must preserve one canonical row per Stage 5 row. An empty `data_flow_profile[]` in that condition is a Critical failure.

Canonical row identity fields:

```text
data_flow_id
feature_id
provenance_id
feature_role
flow_role
source_refs
basis_codes
confidence
```

Canonical semantic blocks:

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

Gemini may classify semantic fields inside those blocks only. It may not create, delete, reorder, rename, or mutate row identity, source references, legal-unit references, document references, basis codes, Stage 7 indexes, summary signals, final limitations, final JSON wrapper, or final schema structure.

### Stage 6B Finalizer Derivations

The deterministic finalizer derives:

```text
stage7_navigation_index.feature_to_data_flow_index[]
stage7_navigation_index.data_signal_index[]
data_provenance_profile.data_profile_summary_signals
data_provenance_profile.data_profile_limitations[]
```

Model classifications for unknown `data_flow_id` values must be rejected. Model output may never create a new final row or delete a seeded row.

## Basis Codes

Allowed basis codes:

```text
source_bundle_record_ref
stage5_feature_ref
stage5_data_provenance
stage5_regulated_surface
stage5_architecture_hint
stage6_legal_unit_ref
stage6_control_signal_ref
stage6_data_flow_ref
direct_policy_signal
indirect_policy_signal
absence_after_search
macro_heading_classification
source_metadata
model_semantic_classification
deterministic_seed
unknown
```

## Retired Stage 6 Runtime Terms

These terms are not active runtime/schema/prompt authority. They may appear here only as a retirement list:

```text
legal_stack_review_version
legal_stack_review_v2
legal_stack_review
legal_stack
document_stack_redline
document_stack_synthesis
legal_stack_assessment
limitations as Stage 6 root
doc_id
doc_type
doc_family
doc_title
section_id
section_path
heading_text
heading_level
structural_zone
control_topics_detected
feature_to_document_section_index
document_source_locator_index
source_text_classification
stage6_section_ref
stage6_legal_section_ref
document_relationship_signal
feature_control_alignment
model_overlay
heading_classification
stage6a_model_overlay_v1
stage6a_model_overlay_version
section_classification_overlay
feature_section_overlay
document_section
flow_id
profile_summary_signals
section_refs
```

## Audit Severity Model

Audits and guardrails are inactive until rebuilt against this spine and `stage6Review.schema.json`.

When rebuilt:

```text
Critical = canon violated; hard fail; no deployment.
Repair = deterministic migration mapping allowed only during an explicit migration window; after migration, hard fail.
Warning = canon valid but quality/coverage is weak; pass with exact counts.
```

Critical examples: legacy root key appears; independent Stage 6 schema key active; local enum list used; micro-heading indexing active; 6B field appears in 6A-only output; old audit script used as canonical proof.

Repair examples: `document_id` migration from older source refs only where deterministic; old section identifiers only where they map to approved macro legal units; old basis code migration only inside explicit migration code.

Warning examples: too many `unknown` values; no relationship rows despite multiple documents; fallback packet absent when primary locators are incomplete.

## Disabled Until Rebuilt

The following are not canonical proof until rebuilt from this spine and the single Stage 6 schema:

```text
runtime-api/scripts/audit-stage6a-intelligence-path.mjs
runtime-api/scripts/e2e-stage6a-legal-cartography.mjs
runtime-api/scripts/e2e-stage6-legal-stack-review.mjs
runtime-api/src/diligence/legalStackReviewGuardrails.js
```

End of Diligence Canonical Spine v1.
