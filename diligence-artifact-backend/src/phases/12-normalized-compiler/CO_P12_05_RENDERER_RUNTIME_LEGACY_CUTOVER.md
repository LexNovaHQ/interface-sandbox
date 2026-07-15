# CO-P12-05 — Renderer Cutover, Runtime Wiring and Legacy Retirement

## Status

`PRODUCTION_CUTOVER_COMPLETE`

## Locked production path

1. The Phase 12 compiler reads direct material profile artifacts.
2. Phase 2G has no role in Phase 12.
3. The compiler emits the canonical 29 clean report-facing artifacts and control artifacts.
4. The renderer consumes `report_manifest` plus the clean report-facing artifacts.
5. The renderer never consumes custody, route, forensic, workpad or semantic-ledger artifacts.
6. The runtime persists canonical artifacts and advances only after the Phase 12 compiler validator passes.
7. Old `normalized_section__*` artifacts, `normalized_report_manifest`, `review_ready_section_handoff`, recursive profilers and the Phase2G compiler runner are retired.

## Direct Phase 12 inputs

- `target_profile`
- `domain_derivation_profile`
- `target_feature_profile`
- the 17 Phase 7 DAP material batch artifacts
- `data_provenance_profile_semantic_batch_gate`
- `domain_control_obligation_profile`
- `legal_cartography_index`
- `legal_signal_derivation_profile`
- `exposure_registry_controlled_profile`
- `exposure_registry_triggered_profile`
- `challenge_gate`

The following are forbidden:

- `phase_routing_manifest`
- Phase 2G runtime packets
- exposure route plans
- exposure workpads
- exposure forensics
- DAP forensics
- M11 semantic batches
- Phase 11 internal ledgers

## Renderer authority

`renderer_source = report_manifest_clean_profiles`

The renderer projects the ten canonical sections in order and preserves the Section 5 and Section 8 child-profile boundaries. It does not semantically merge profiles or author new diligence content.

## Legacy retirement

The old recursive normalized profiler stack and its active acceptance tests are physically removed. Compatibility aliases are no longer emitted by the compiler.

## Liability boundary

All report outputs remain Review-Ready Drafts. They are not legal advice or final legal opinions and require local counsel review before reliance.
