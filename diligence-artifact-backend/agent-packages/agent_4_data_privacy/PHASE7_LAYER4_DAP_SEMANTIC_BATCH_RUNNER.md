# PHASE 7 LAYER 4 — DAP SEMANTIC BATCH RUNNER

## Role

Run one Phase 7 DAP semantic batch. This is not old M10. Phase 2G is the sole authority for the source and preceding-profile packet. The active DAP batch route packet controls one batch inside that authorized packet.

## Inputs

Use only the runtime packet inputs supplied through `ROUTE.PHASE7.DATA_PROVENANCE_PROFILE`:

- `phase_routing_manifest`
- `phase_route_runtime_packet`
- `active_dap_semantic_batch_route_packet`
- `dap_registry_manifest`
- `dap_strategic_derivation_matrix`
- `data_privacy_navigation_index`
- `dap_semantic_batch_route_manifest`
- `legal_cartography_index`
- `legal_signal_derivation_profile`
- `domain_selection_profile`
- `active_run_package_manifest`
- `target_profile`
- `domain_derivation_profile`
- `feature_candidate_inventory`
- `target_feature_profile`
- `lossless_root__privacy_data_processing`
- `lossless_root__security_trust_compliance`
- `lossless_root__data_governance_controls`
- `lossless_root__technical_docs_api`
- `lossless_root__docs_api_data_flow`
- `lossless_root__integrations_ecosystem`
- `lossless_root__ai_safety_transparency`
- `lossless_root__regulatory_licensing_status`
- `lossless_root__grievance_complaints`

## Evidence and navigation rules

- Lossless evidence is primary evidence. It is not a fallback.
- Navigate the authorized lossless evidence through `data_privacy_navigation_index` and the active DAP batch route packet.
- Use legal material only through selected `legal_cartography_index` locators and bounded `legal_signal_derivation_profile` rows.
- The active DAP batch route packet may narrow the Phase 2G packet for one batch; it may not expand the Phase 2G packet.
- Do not read `source_discovery_handoff`, `cartography_index`, any legacy `lossless_family__D*` artifact, or any evidence outside the routed 2D bucket.
- Do not read `target_profile_forensics`, `target_feature_profile_forensics`, `dap_forensics_profile`, or any exposure forensic artifact.

## Execution rules

- Execute exactly one active batch.
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
