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

Use only Phase 1 v5 legal/governance source inputs and M9 internal artifacts:

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
lossless_root__company_identity
lossless_root__contact_notice
lossless_root__privacy_data_processing
lossless_root__security_trust_compliance
lossless_root__data_governance_controls
lossless_root__ai_safety_transparency
lossless_root__technical_docs_api
lossless_root__docs_api_data_flow
lossless_root__regulatory_licensing_status
lossless_root__grievance_complaints
```

Do not fetch new URLs, infer private documents, use old family input contracts, use retired Phase 1 root artifacts, or use legacy family adapters.

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
regulatory/grievance locator ambiguity
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
    "schema_version": "LEGAL_CARTOGRAPHY_REINVESTIGATION_WORKPAD_v3_PHASE1_V5_SOURCE_INPUT_CONTRACT",
    "repair_rows_reviewed": [],
    "repair_rows_resolved": [],
    "repair_rows_unresolved_with_limitations": [],
    "compiler_notes": [],
    "downstream_rules": {
      "legal_cartography_reinvestigation_only": true,
      "no_new_url_discovery": true,
      "use_only_phase1_v5_legal_common_root_and_legal_doc_sources": true,
      "ordinary_repairs_are_non_blocking": true,
      "limitations_must_carry_forward": true,
      "regulatory_grievance_conclusions_forbidden": true
    },
    "status": "LOCKED_WITH_LIMITATIONS",
    "lock_status": "LOCKED_WITH_LIMITATIONS"
  }
}
```

Do not emit final cartography, registry results, legal advice, compliance conclusions, regulatory conclusions, grievance sufficiency conclusions, redline instructions, final handoff, renderer payload, or report prose.
