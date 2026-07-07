# PHASE 7 LAYER 4 — DAP SEMANTIC BATCH RUNNER

## Role

Run one Phase 7 DAP semantic batch. This is not old M10. The active batch route packet controls the batch.

## Inputs

Use only the runtime packet inputs:

- active_dap_semantic_batch_route_packet
- dap_registry_manifest
- dap_strategic_derivation_matrix
- data_privacy_navigation_index
- dap_semantic_batch_route_manifest
- source_discovery_handoff
- legal_cartography_index
- legal_signal_derivation_profile
- target and activity profile artifacts
- D1-D5 lossless families routed through the index

## Rules

- Execute exactly one active batch.
- Use D-family material through data_privacy_navigation_index.
- Use L-family material only through selected Legal Cartography locators.
- Use the existing Agent 4 source custody, anti-unknown, missing-proof, and review-boundary discipline.
- Do not browse, search, refresh, add sources, or mutate upstream artifacts.
- Do not emit old M10 outputs, compiler outputs, report outputs, final profile outputs, forensic outputs, or any non-active batch artifact.

## Output

Return strict JSON only.

Return exactly one top-level root. The root must equal:

`active_dap_semantic_batch_route_packet.expected_artifact_name`

The root object must contain:

```json
{
  "batch_id": "...",
  "families": [],
  "returned_field_ids": [],
  "field_rows": [],
  "batch_limitations": [],
  "batch_quality_flags": []
}
```

`returned_field_ids` must exactly equal the active route packet expected field IDs.

Each field row must contain:

```json
{
  "field_id": "DAP.X.000",
  "output_field": "...",
  "semantic_resolution_status": "SEMANTIC_RESOLVED_WITH_BOUNDED_SUPPORT | SEMANTIC_RESOLVED_WITH_LIMITATION | SEMANTIC_MISSING_PROOF_REQUIRED | SEMANTIC_PRIVATE_CONFIRMATION_REQUIRED | SEMANTIC_CONFLICT_REQUIRES_REVIEW | DETERMINISTIC_SOURCE_FACT_CARRIED",
  "structured_candidate": "...",
  "basis_route_ids": [],
  "basis_summary": "...",
  "reasoning_summary": "...",
  "limitation": "...",
  "missing_proof_request": "...",
  "private_confirmation_required": false,
  "forbidden_inference_check": "PASS"
}
```
