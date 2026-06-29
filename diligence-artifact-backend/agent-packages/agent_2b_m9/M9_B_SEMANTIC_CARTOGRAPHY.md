# M9-B — Semantic Cartography Layer

This file belongs to `agent_2b_m9` only.

M9-B is the model-owned semantic labeling layer inside M9. It reads the deterministic M9 map and the loaded legal/governance lossless corpus. It saves one M9-owned artifact:

```text
legal_cartography_semantic_profile
```

M9-B does not emit the final `legal_cartography_index`. The final compiled index belongs to the deterministic compiler.

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

Do not browse, crawl, search, fetch new URLs, infer private documents, or create downstream profile substance.

## Role

Create a semantic navigation profile over the deterministic map.

M9-B may label mapped documents, macro units, notices, candidate controls, cross-references, absence/access rows, and document-route slots.

M9-B is registry-aware but not registry-evaluative.

It may use registry subcat relevance as a navigation label only.

It must not decide final exposure status, product status, data status, clause adequacy, enforceability, compliance, legal sufficiency, redline action, or final report conclusions.

## Layer 1 Pointer Discipline

Every semantic row must attach to at least one deterministic pointer from `legal_cartography_deterministic_map`:

```text
document_id
artifact_id
unit_id
section_id
notice_id
control_candidate_id
indemnity_candidate_id
cross_reference_id
absence_id
slot_id
```

If a semantic claim cannot attach to one of those IDs, omit it or place it in `semantic_repair_queue`.

M9-B must not create new document IDs, section IDs, URLs, source statuses, or text pointers.

## No Parallel Evidence Store

M9-B may read lossless text for understanding.

M9-B must not copy full legal text or full control text into its output.

Use deterministic pointers and short labels only.

## Controlled Vocabularies

### registry_subcat_relevance[]

Use only:

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

### control_language_family

Use only:

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

### document_route_relevance[]

Use only:

```text
DOC_TOS
DOC_AUP
DOC_DPA
DOC_AGT
DOC_DPIA
DOC_SOP
DOC_HND
DOC_IP
DOC_SLA
DOC_PP
DOC_SECURITY
DOC_SUBPROCESSOR
DOC_COOKIE
DOC_NOTICE
DOC_UNKNOWN
```

### confidence

Use only:

```text
CLEAR
PARTIAL
UNCLEAR
THIN
REINVESTIGATE
```

### visible_control_posture

Use only:

```text
VISIBLE_CONTROL
PARTIAL_CONTROL
SUBSTITUTE_CONTROL
REFERENCE_ONLY
ABSENCE_SIGNAL
UNCLEAR_CONTROL
NO_CONTROL_LABEL
```

### downstream_treatment

Use only:

```text
USE_AS_NAVIGATION
REVIEW_WITH_LIMITATION
CHECK_SUBSTITUTE_LOCATIONS
CARRY_PUBLIC_FOOTPRINT_LIMITATION
DO_NOT_USE_WITHOUT_REPAIR
```

## Output Contract

Return strict JSON only:

```json
{
  "legal_cartography_semantic_profile": {
    "run_id": "",
    "generated_by": "m9_hybrid_semantic_layer",
    "schema_version": "M9_SEMANTIC_CARTOGRAPHY_PROFILE_v2",
    "model_used": true,
    "artifact_inventory_labels": [],
    "macro_unit_semantic_labels": [],
    "notice_semantic_labels": [],
    "control_language_location_labels": [],
    "indemnity_location_labels": [],
    "cross_reference_semantic_labels": [],
    "absence_access_semantic_interpretation": [],
    "document_route_relevance_map": [],
    "substitute_control_map": [],
    "semantic_repair_queue": [],
    "semantic_integrity_summary": {},
    "downstream_rules": {
      "m9_semantic_layer_only": true,
      "registry_aware_not_registry_evaluative": true,
      "legal_advice_forbidden": true,
      "new_url_discovery_forbidden": true,
      "full_legal_text_copy_forbidden": true,
      "use_only_loaded_legal_corpus": true,
      "deterministic_map_is_source_of_pointers": true,
      "semantic_rows_must_attach_to_deterministic_ids": true,
      "reinvestigation_before_blocking": true
    },
    "status": "LOCKED_WITH_LIMITATIONS",
    "lock_status": "LOCKED_WITH_LIMITATIONS"
  }
}
```

Do not add another top-level key.

## Row Shapes

### artifact_inventory_labels[]

```json
{
  "artifact_id": "",
  "document_id": "",
  "artifact_class_label": "",
  "artifact_family_label": "",
  "expected_core_document_slot": "DOC_UNKNOWN",
  "document_role_label": "",
  "document_scope_signal": "",
  "classification_confidence": "CLEAR",
  "downstream_treatment": "USE_AS_NAVIGATION",
  "boundary_note": ""
}
```

### macro_unit_semantic_labels[]

```json
{
  "unit_id": "",
  "section_id": "",
  "document_id": "",
  "macro_unit_type": "SECTION",
  "heading_interpretation": "",
  "control_language_candidates": [],
  "notice_candidates": [],
  "registry_subcat_relevance": [],
  "document_route_relevance": [],
  "confidence": "CLEAR",
  "downstream_treatment": "USE_AS_NAVIGATION",
  "boundary_note": ""
}
```

### notice_semantic_labels[]

```json
{
  "notice_id": "",
  "artifact_reference": "",
  "unit_reference": "",
  "notice_type": "",
  "related_control_language_family": [],
  "registry_subcat_relevance": [],
  "confidence": "CLEAR",
  "downstream_treatment": "USE_AS_NAVIGATION",
  "boundary_note": ""
}
```

### control_language_location_labels[]

```json
{
  "control_reference_id": "",
  "control_candidate_id": "",
  "section_id": "",
  "unit_id": "",
  "document_id": "",
  "control_language_family": "UNKNOWN_CONTROL_LANGUAGE",
  "control_language_type": "",
  "registry_subcat_relevance": [],
  "document_route_relevance": [],
  "visible_control_posture": "UNCLEAR_CONTROL",
  "requires_downstream_review": true,
  "confidence": "UNCLEAR",
  "downstream_treatment": "REVIEW_WITH_LIMITATION",
  "boundary_note": ""
}
```

### indemnity_location_labels[]

```json
{
  "indemnity_candidate_id": "",
  "section_id": "",
  "document_id": "",
  "indemnity_party_signal": "",
  "covered_claims_signal": "",
  "excluded_claims_signal": "",
  "procedure_signal": "",
  "cap_interaction_signal": "",
  "domain_specific_signal": "",
  "confidence": "UNCLEAR",
  "downstream_treatment": "REVIEW_WITH_LIMITATION",
  "boundary_note": ""
}
```

### cross_reference_semantic_labels[]

```json
{
  "cross_reference_id": "",
  "from_document_id": "",
  "from_unit_id": "",
  "to_document_or_policy": "",
  "reference_type_label": "",
  "document_route_relevance": [],
  "loaded_status_interpretation": "",
  "confidence": "CLEAR",
  "downstream_treatment": "USE_AS_NAVIGATION",
  "boundary_note": ""
}
```

### absence_access_semantic_interpretation[]

```json
{
  "absence_id": "",
  "expected_document_route": "DOC_UNKNOWN",
  "expected_artifact_class": "",
  "absence_status_interpretation": "",
  "substitute_control_signal": "NO_CONTROL_LABEL",
  "substitute_control_locations": [],
  "confidence": "UNCLEAR",
  "downstream_treatment": "CARRY_PUBLIC_FOOTPRINT_LIMITATION",
  "boundary_note": ""
}
```

### document_route_relevance_map[]

```json
{
  "slot_id": "DOC_UNKNOWN",
  "found_document_ids": [],
  "found_embedded_unit_ids": [],
  "semantic_route_status": "",
  "substitute_control_check_required": true,
  "confidence": "UNCLEAR",
  "downstream_treatment": "REVIEW_WITH_LIMITATION",
  "boundary_note": ""
}
```

### substitute_control_map[]

```json
{
  "missing_or_limited_item_ref": "",
  "expected_document_route": "DOC_UNKNOWN",
  "expected_artifact_class": "",
  "substitute_control_signal": "SUBSTITUTE_CONTROL",
  "substitute_control_locations": [],
  "registry_subcat_relevance": [],
  "confidence": "PARTIAL",
  "downstream_treatment": "CHECK_SUBSTITUTE_LOCATIONS",
  "boundary_note": ""
}
```

### semantic_repair_queue[]

```json
{
  "repair_id": "",
  "repair_type": "UNCLEAR_SEMANTIC_LABEL",
  "target_ref": "",
  "reason": "",
  "blocking": false,
  "recommended_reinvestigation": ""
}
```

### semantic_integrity_summary

```json
{
  "semantic_rows_total": 0,
  "semantic_rows_attached_to_deterministic_ids": 0,
  "semantic_rows_repaired_or_omitted": 0,
  "full_text_copied": false,
  "new_sources_created": false,
  "ready_for_compiler": true
}
```

## Repair Rule

Reinvestigation is the rule for repair rows.

Blocking is the exception.

If a label is unclear, thin, ambiguous, or only partially supported, create a semantic repair row. Do not block M9-B unless the loaded corpus is unusable, pointer attachment fails globally, or the output boundary is breached.

Return strict JSON only.
