# Diligence Canonical Spine v1

## Status

This document is the sole human-readable Stage 6 spine for the Interface Diligence Engine.

For Stage 6, this spine supersedes older Stage 6 language in:

```text
docs/contracts/DILIGENCE_CANON_FIELD_DICTIONARY_v1.md
docs/contracts/INTERFACE_DILIGENCE_CONTRACT_SPINE_v1.md
functions/_prompts/diligence-v2/03_LEGAL_STACK_REVIEW.prompt.md
functions/_prompts/diligence-v2/03A_LEGAL_CARTOGRAPHY.prompt.md
functions/_prompts/diligence-v2/03A_MODEL_LEGAL_CARTOGRAPHY_OVERLAY.prompt.md
```

The matching machine-readable source of truth is:

```text
runtime-api/src/diligence/stage6CanonicalVocabulary.js
```

The single Stage 6 schema is:

```text
data/schemas/stage6Review.schema.json
```

No Stage 6A schema, model-overlay schema, prompt-local enum list, local `ALLOWED_ENUMS`, or legacy legal-stack schema is an independent authority.

## Stage 6 Role

Stage 6 is the navigation layer between Stage 4/5 facts and Stage 7 registry evaluation.

Stage 6 organizes public legal/control documents and data-flow signals so Stage 7 can navigate the admitted source bundle. Stage 6 does not decide Hunter triggers, registry final statuses, legal conclusions, compliance verdicts, control gaps, recommendations, Vault prefill, or report prose.

## Canonical Runtime Object

Stage 6 emits one canonical object:

```json
{
  "stage6_review_version": "stage6_review_v1",
  "stage6_component": "stage6a_legal_document_cartography",
  "stage_role": "stage7_navigation_index",
  "input_refs": {},
  "legal_document_cartography": {},
  "stage7_navigation_index": {},
  "stage6_limitations": []
}
```

The allowed `stage6_component` values are:

```text
stage6a_legal_document_cartography
stage6b_data_provenance
stage6_integrated_handoff
```

## Stage 6A Legal Document Cartography

Stage 6A maps legal/control documents and macro legal units. It does not create a legal opinion or compliance assessment.

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

### Document Inventory

Canonical document inventory rows use:

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

Retired row keys include `doc_id`, `doc_type`, `doc_family`, and `doc_title`.

### Macro Legal Unit Index

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

The index is macro-only. It must not emit every heading, page header, page footer, table-of-contents row, FAQ item, modal notice, banner notice, or arbitrary micro-section as a canonical legal unit.

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

### Control Signal Map

Canonical control rows use:

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

Stage 6 control signals are navigation signals only. They are not registry outcomes.

### Stage 7 Navigation

Stage 6A populates Stage 7 handles using canonical legal-unit names:

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

Banned Stage 6 dialect values include:

```text
source_text_classification
stage6_section_ref
stage6_legal_section_ref
document_relationship_signal
feature_control_alignment
model_overlay
heading_classification
```

Runtime must not pass through or repair these values as canonical Stage 6 output.

## Disabled Until Rebuilt

The following are not canonical proof until rebuilt from this spine and the single Stage 6 schema:

```text
runtime-api/scripts/audit-stage6a-intelligence-path.mjs
runtime-api/scripts/e2e-stage6a-legal-cartography.mjs
runtime-api/scripts/e2e-stage6b-data-provenance.mjs
runtime-api/scripts/e2e-stage6-legal-stack-review.mjs
runtime-api/src/diligence/legalStackReviewGuardrails.js
.github/workflows/runtime-stage4-stage5-audit.yml Stage 6 steps
```

End of Diligence Canonical Spine v1.
