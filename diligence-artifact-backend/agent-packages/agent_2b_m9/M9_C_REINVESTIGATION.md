# Legal Cartography and Index — Reinvestigation Rules

This file belongs to the Legal Cartography and Index phase.

The backend package path retains its existing internal identifier.

Reinvestigation is row-level repair for the Legal Cartography and Index hybrid path. It is not a new phase, not a new agent, and not a downstream dependency.

## Purpose

Use reinvestigation when deterministic or semantic Legal Cartography and Index layers produce weak, thin, unclear, or ambiguous map rows.

The goal is to repair navigation quality without blocking the pipeline for ordinary quality gaps.

## Optional Artifact

If reinvestigation is run, it may save this internal workpad:

```text
legal_cartography_reinvestigation_workpad
```

This workpad is optional and internal to Legal Cartography and Index. It must not become a required input for Target Profile Review, Activity Profile Review, Data Provenance Profile, Exposure Profile, Operator Challenge, Compiler, Renderer, or public UI.

## Inputs

Use only:

```text
legal_cartography_deterministic_map
legal_cartography_semantic_profile
source_discovery_handoff
post_phase_1_domain_gate_handoff
source_discovery_matrix_manifest
neutral_evidence_bucket_manifest
adapter_expansion_log
source_family_index
legal_doc_inventory
legal_doc_extraction_index
legal_doc_lossless_validation_manifest
legal_doc_{DOC_TYPE}
lossless_root__legal_identity_notice
lossless_root__privacy_data_processing
lossless_root__security_trust
lossless_root__trust_compliance
lossless_root__contact_notice
lossless_root__technical_docs_api_developer
lossless_root__docs_api_data_flow
```

Do not fetch new URLs, infer private documents, use old family input contracts, or use legacy family adapters.

## Non-Blocking Repair Classes

These route to reinvestigation first:

```text
unclear artifact class
unclear macro-unit label
unclear notice label
unclear control-language family
thin heading structure
fallback full-artifact unit
referenced-but-unloaded document
missing standalone artifact with possible substitute control
embedded instrument requiring confirmation
ambiguous document-route relevance
ambiguous subcat relevance
```

After reinvestigation, unresolved ordinary issues carry limitations and allow `LOCKED_WITH_LIMITATIONS`.

## Critical Blocking Classes

Blocking is allowed only for critical Legal Cartography and Index failures:

```text
no usable legal-governance corpus
missing all legal-governance Phase 1 source artifacts
source custody corruption
malformed final legal_cartography_index
semantic claim cannot be safely attached or rejected by compiler
Legal Cartography and Index boundary breach
artifact save failure
```

## Output Contract

If used, return strict JSON only:

```json
{
  "legal_cartography_reinvestigation_workpad": {
    "run_id": "",
    "generated_by": "legal_cartography_reinvestigation_layer",
    "schema_version": "LEGAL_CARTOGRAPHY_REINVESTIGATION_WORKPAD_v2_PHASE1_SOURCE_INPUT_CONTRACT",
    "repair_rows_reviewed": [],
    "repair_rows_resolved": [],
    "repair_rows_unresolved_with_limitations": [],
    "compiler_notes": [],
    "downstream_rules": {
      "legal_cartography_reinvestigation_only": true,
      "no_new_url_discovery": true,
      "use_only_phase1_legal_common_root_and_legal_doc_sources": true,
      "ordinary_repairs_are_non_blocking": true,
      "limitations_must_carry_forward": true
    },
    "status": "LOCKED_WITH_LIMITATIONS",
    "lock_status": "LOCKED_WITH_LIMITATIONS"
  }
}
```

Do not emit final cartography, registry results, redline instructions, final handoff, renderer payload, or report prose.
