# Normalized Profiler Patch Notes

## Locked Direction

The temporary `COMPILER` phase is now a deterministic normalized-profiler boundary. It emits report-section artifacts and a thin compatibility handoff instead of relying on the old merged profile blob as the product layer.

## Current Compiler Outputs

- `normalized_report_manifest`
- `vault_section_handoff`
- `final_output_handoff`
- `normalized_section__matter_overview`
- `normalized_section__executive_summary`
- `normalized_section__target_profile`
- `normalized_section__product_activity_ip_profile`
- `normalized_section__data_provenance_controls`
- `normalized_section__legal_document_control_review`
- `normalized_section__exposure_findings`
- `normalized_section__implications_review_path`
- `normalized_section__evidence_gaps_clarification_points`
- `normalized_section__methodology_limitations_review_notes`
- `normalized_section__forensic_ledger_appendix`

## Boundary

- No model call after M12.
- Normalized Profiler only reformats locked upstream artifacts.
- Raw registry IDs remain appendix/detail material.
- Reviewer-facing labels are normalized through `report-normalization-map.js`.
- Renderer prefers normalized section artifacts when present and falls back to the legacy handoff adapter when absent.

## Smoke Checks

Run from `diligence-artifact-backend`:

```bash
node scripts/check-normalized-shape.mjs
```
