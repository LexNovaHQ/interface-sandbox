# M9-C — Reinvestigation Rules

This file belongs to `agent_2b_m9` only.

Reinvestigation is row-level repair for the M9 hybrid path. It is not a new phase, not a new agent, and not a downstream dependency.

## Purpose

Use reinvestigation when the deterministic or semantic M9 layers produce weak, thin, unclear, or ambiguous map rows.

The goal is to repair navigation quality without blocking the pipeline for ordinary quality gaps.

## Optional Artifact

If reinvestigation is run, it may save this M9-owned workpad:

```text
legal_cartography_reinvestigation_workpad
```

This workpad is optional and internal to M9. It must not become a required input for M7, M8, M10, M11, M12, compiler, renderer, or public UI.

## Inputs

Use only:

```text
legal_cartography_deterministic_map
legal_cartography_semantic_profile
source_discovery_handoff
lossless_family__L1_CORE_TERMS_PRIVACY
lossless_family__L2_B2B_CONTRACTING
lossless_family__L3_AI_USAGE_GOVERNANCE
lossless_family__L4_PRIVACY_ADJACENT_NOTICES
lossless_family__L5_LEGAL_HUB_HOSTED
lossless_family__L6_ENTITY_NOTICE
```

Do not fetch new URLs or infer private documents.

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

Blocking is allowed only for critical M9 failures:

```text
no usable legal/governance corpus
missing all legal/governance lossless artifacts
source custody corruption
malformed final legal_cartography_index
semantic claim cannot be safely attached or rejected by compiler
M9 boundary breach
artifact save failure
```

## Output Contract

If used, return strict JSON only:

```json
{
  "legal_cartography_reinvestigation_workpad": {
    "run_id": "",
    "generated_by": "m9_hybrid_reinvestigation_layer",
    "schema_version": "M9_REINVESTIGATION_WORKPAD_v1",
    "repair_rows_reviewed": [],
    "repair_rows_resolved": [],
    "repair_rows_unresolved_with_limitations": [],
    "compiler_notes": [],
    "downstream_rules": {
      "m9_reinvestigation_only": true,
      "no_new_url_discovery": true,
      "use_only_loaded_legal_corpus": true,
      "ordinary_repairs_are_non_blocking": true,
      "limitations_must_carry_forward": true
    },
    "status": "LOCKED_WITH_LIMITATIONS",
    "lock_status": "LOCKED_WITH_LIMITATIONS"
  }
}
```

Do not emit final cartography, registry results, redline instructions, final handoff, renderer payload, or report prose.
