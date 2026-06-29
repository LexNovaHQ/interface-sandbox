# M9-B — Semantic Legal Stack Labels

This file belongs to `agent_2b_m9` only.

M9-B reads the deterministic legal stack index and the loaded legal/governance lossless corpus. It saves one artifact:

```text
legal_cartography_semantic_profile
```

M9-B does not emit `legal_cartography_index`.

## Inputs

Use only:

```text
legal_cartography_deterministic_map
source_discovery_handoff
lossless_family__L1_CORE_TERMS_PRIVACY
lossless_family__L2_B2B_CONTRACTING
lossless_family__L3_AI_USAGE_GOVERNANCE
lossless_family__L4_PRIVACY_ADJACENT_NOTICES
lossless_family__L5_LEGAL_HUB_HOSTED
lossless_family__L6_ENTITY_NOTICE
```

Do not fetch new sources.

## Role

Use the deterministic index. Label the mapped legal/governance units.

M9-B may label:

```text
documents
macro units
embedded units
notice candidates
control candidates
indemnity candidates
cross references
missing source rows
```

M9-B must not create new deterministic IDs.

M9-B must not create remediation route fields or fix-document route fields. Any fix/remediation routing belongs outside M9.

M9-B must not decide registry row status, compliance, sufficiency, enforceability, or final report conclusions.

## Required Coverage

One `document_labels` row is required for every deterministic `document_map` row.

One `unit_subcat_labels` row is required for every deterministic `macro_unit_map` row.

One `control_family_labels` row is required for every deterministic `control_language_candidate_map` row.

If full coverage is not achieved:

```text
semantic_integrity_summary.ready_for_compiler = false
lock_status = REPAIR_REQUIRED
```

## Allowed Subcats

```text
CNS
LIA
HAL
INF
PRV
BIO
DEC
HRM
FRD
TRD
```

## Allowed Control Families

```text
FORMATION_CONTRACT
ACTIVITY_SPECIFIC_DISCLOSURE
DATA_PRIVACY
VENDORS_TRANSFER
SECURITY
USE_SAFETY
AGENT_AUTHORITY
IP_CONTENT
COMMERCIAL_LEGAL_ALLOCATION
CONTACT_ROUTES
INDEMNITY
UNKNOWN_CONTROL_LANGUAGE
```

## Output Root

Return strict JSON only:

```json
{
  "legal_cartography_semantic_profile": {
    "run_id": "",
    "generated_by": "m9_hybrid_semantic_layer",
    "schema_version": "M9_SEMANTIC_LEGAL_STACK_LABELS_v3",
    "model_used": true,
    "document_labels": [],
    "unit_subcat_labels": [],
    "control_family_labels": [],
    "indemnity_labels": [],
    "cross_reference_labels": [],
    "missing_source_labels": [],
    "semantic_repair_queue": [],
    "semantic_integrity_summary": {},
    "downstream_rules": {
      "m9_semantic_layer_only": true,
      "legal_stack_labels_only": true,
      "registry_aware_not_registry_evaluative": true,
      "remediation_routes_forbidden": true,
      "new_source_fetch_forbidden": true,
      "full_legal_text_copy_forbidden": true,
      "use_only_loaded_legal_corpus": true,
      "deterministic_map_is_source_of_pointers": true,
      "semantic_rows_must_attach_to_deterministic_ids": true,
      "coverage_gate_required": true
    },
    "status": "LOCKED_WITH_LIMITATIONS",
    "lock_status": "LOCKED_WITH_LIMITATIONS"
  }
}
```

No other top-level key is allowed.

## Row Shapes

### document_labels[]

```json
{
  "document_id": "",
  "artifact_id": "",
  "artifact_class_label": "",
  "document_role_label": "",
  "confidence": "CLEAR",
  "unit_semantic_status": "LOCKED",
  "downstream_treatment": "USE_AS_NAVIGATION",
  "boundary_note": ""
}
```

### unit_subcat_labels[]

```json
{
  "unit_id": "",
  "section_id": "",
  "document_id": "",
  "unit_type": "SECTION",
  "unit_label": "",
  "registry_subcat_relevance": [],
  "control_language_family": [],
  "confidence": "CLEAR",
  "unit_semantic_status": "LOCKED",
  "downstream_treatment": "USE_AS_NAVIGATION",
  "boundary_note": ""
}
```

### control_family_labels[]

Use exact deterministic `control_candidate_id` values only.

```json
{
  "control_candidate_id": "",
  "unit_id": "",
  "section_id": "",
  "document_id": "",
  "control_language_family": [],
  "registry_subcat_relevance": [],
  "confidence": "CLEAR",
  "unit_semantic_status": "LOCKED",
  "downstream_treatment": "USE_AS_NAVIGATION",
  "boundary_note": ""
}
```

### indemnity_labels[]

```json
{
  "indemnity_candidate_id": "",
  "unit_id": "",
  "section_id": "",
  "document_id": "",
  "indemnity_signal": "",
  "confidence": "CLEAR",
  "unit_semantic_status": "LOCKED",
  "downstream_treatment": "REVIEW_WITH_LIMITATION",
  "boundary_note": ""
}
```

### cross_reference_labels[]

```json
{
  "cross_reference_id": "",
  "from_document_id": "",
  "to_document_or_policy": "",
  "reference_type_label": "",
  "loaded_status_interpretation": "",
  "confidence": "CLEAR",
  "unit_semantic_status": "LOCKED_WITH_LIMITATIONS",
  "downstream_treatment": "REVIEW_WITH_LIMITATION",
  "boundary_note": ""
}
```

### missing_source_labels[]

```json
{
  "missing_id": "",
  "missing_or_limited_item": "",
  "absence_status_interpretation": "",
  "confidence": "PARTIAL",
  "unit_semantic_status": "LOCKED_WITH_LIMITATIONS",
  "downstream_treatment": "REVIEW_WITH_LIMITATION",
  "boundary_note": ""
}
```

### semantic_integrity_summary

```json
{
  "deterministic_documents_total": 0,
  "semantic_documents_labeled": 0,
  "deterministic_macro_units_total": 0,
  "semantic_units_labeled": 0,
  "deterministic_control_candidates_total": 0,
  "semantic_control_candidates_labeled": 0,
  "semantic_rows_total": 0,
  "semantic_rows_attached_to_deterministic_ids": 0,
  "semantic_rows_repaired_or_omitted": 0,
  "coverage_ratio": 0,
  "full_text_copied": false,
  "new_sources_created": false,
  "ready_for_compiler": false
}
```

Return strict JSON only.
