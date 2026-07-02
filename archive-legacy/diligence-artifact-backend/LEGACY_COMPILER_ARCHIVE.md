# Legacy Compiler Artifact Archive

## Archived artifacts

The following compiler artifacts are preserved only for historical compatibility and must not be used as active report, renderer, or Qualified Review inputs:

- `profiles_combined`
- `forensics_combined`

## Active replacements

The active compiler outputs are:

- `normalized_report_manifest`
- `qualified_review_handoff`
- `vault_section_handoff` as a backward-compatible alias
- `final_output_handoff` as a thin compatibility manifest
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

## Rule

Renderer and Qualified Review flows must consume normalized section artifacts. They must not reconstruct the report from the old merged profile/forensics blob.
