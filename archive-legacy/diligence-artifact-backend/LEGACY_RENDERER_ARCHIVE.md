# Legacy Renderer Archive

## Retired path

The legacy handoff adapter in `src/report-section-adapter.js` is archived and must not be used for public report rendering.

## Active path

The only active renderer path is:

```text
normalized_report_manifest + normalized_section__* -> src/report-renderer.js -> renderer_payload.sections[]
```

## Public renderer rule

The public report may render only the locked projection:

- `report_shell`
- `public_report_ui`
- `sections[]`
  - `section_id`
  - `section_title`
  - `reviewer_summary`
  - `subsections[]`
    - `subsection_id`
    - `subsection_title`
    - `fields[]`
      - `field_id`
      - `label`
      - `value`
      - `qualified_review_note`
      - `limitation`
  - `section_limitations`

The public report must not render backend wrapper/internal keys such as `artifact_name`, `source_artifact`, `source_path`, `technical_refs`, `normalization`, `vault_mapping`, `raw_final_output_handoff`, `renderer_contract`, or `registry_authority`.
