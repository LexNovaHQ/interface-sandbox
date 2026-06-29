# M9-B — Semantic Cartography Layer

This file belongs to `agent_2b_m9` only.

M9-B reads `legal_cartography_deterministic_map` and the loaded legal/governance lossless corpus. It saves one M9-owned artifact:

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

## Work Product

Create a navigation profile that labels mapped documents and macro units by:

```text
artifact role
macro unit family
notice type
control-language family
registry subcat relevance
document-route relevance
substitute-control posture
absence/access interpretation
indemnity location
confidence
boundary note
```

This is navigation only. It is not a legal opinion, risk report, compliance conclusion, sufficiency assessment, enforceability assessment, registry evaluation, redline instruction, or final report.

## Controlled Vocabularies

Registry subcat relevance may use only:

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

Control-language families may use only:

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

Document-route relevance may use only:

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

Confidence may use only:

```text
CLEAR
PARTIAL
UNCLEAR
THIN
REINVESTIGATE
```

Control posture may use only:

```text
VISIBLE_CONTROL
PARTIAL_CONTROL
SUBSTITUTE_CONTROL
REFERENCE_ONLY
ABSENCE_SIGNAL
UNCLEAR_CONTROL
NO_CONTROL_LABEL
```

## Output Contract

Return strict JSON only:

```json
{
  "legal_cartography_semantic_profile": {
    "run_id": "",
    "generated_by": "m9_hybrid_semantic_layer",
    "schema_version": "M9_SEMANTIC_CARTOGRAPHY_PROFILE_v1",
    "model_used": true,
    "artifact_inventory_labels": [],
    "macro_unit_semantic_labels": [],
    "notice_semantic_labels": [],
    "control_language_location_labels": [],
    "indemnity_location_labels": [],
    "absence_access_semantic_interpretation": [],
    "document_route_relevance_map": [],
    "substitute_control_map": [],
    "semantic_repair_queue": [],
    "downstream_rules": {
      "m9_semantic_layer_only": true,
      "registry_aware_not_registry_evaluative": true,
      "legal_advice_forbidden": true,
      "new_url_discovery_forbidden": true,
      "full_legal_text_copy_forbidden": true,
      "use_only_loaded_legal_corpus": true,
      "deterministic_map_is_source_of_pointers": true,
      "reinvestigation_before_blocking": true
    },
    "status": "LOCKED_WITH_LIMITATIONS",
    "lock_status": "LOCKED_WITH_LIMITATIONS"
  }
}
```

Every semantic row must attach to a deterministic `document_id`, `section_id`, `embedded_unit_id`, `reference_id`, or `missing_id`.

If a semantic claim cannot attach to a deterministic pointer, route it to `semantic_repair_queue` or omit it.

Reinvestigation is the rule for repair rows. Blocking is the exception.
