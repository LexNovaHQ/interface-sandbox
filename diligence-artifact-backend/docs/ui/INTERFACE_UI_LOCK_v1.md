# Interface UI Lock v1

## Status

Locked for the Interface Sandbox UI build sequence.

## Product identity

Interface Sandbox is a multi-sector diligence engine. It is not Lex Nova-branded UI.

The following curated public identity surfaces are locked unless an explicit later change order unlocks them:

- `Interface Diligence Engine`
- `The Interface`
- `Law × Technology · AI Governance · Privacy · Systems`
- Diligence landing-page header, title, and eyebrow copy
- Report, Technical Annexure, Qualified Review, Assembly Preview, and Signals Preview navigation structure

## Visual source rule

`portfolio-shwetav` is a visual-quality reference only. It may inform polish, hierarchy, rail treatment, cards, spacing, print/report grammar, and premium editorial feel.

It must not be copied as a rebrand and must not overwrite Interface Sandbox product identity.

## Phase 12 renderer rule

The frontend report bridge must treat the Phase 12 renderer payload as the source of truth:

- accepted schema: `renderer_payload.v14.co_p12_05`
- accepted renderer source: `report_manifest_clean_profiles`
- accepted public section IDs: `01` through `10`

The frontend presents report structure. It must not reinterpret legal, sector, exposure, control, or qualified-review substance.

## Stale payload rule

The public report UI must reject stale renderer payloads, including:

- `normalized_section_artifacts_only`
- old semantic section IDs such as `matter_overview`, `executive_summary`, `target_profile`, `product_activity_ip_profile`, `data_provenance_controls`, `legal_document_control_review`, `exposure_findings`, `review_route_handoff_plan`, `clarification_missing_source_queue`, or `methodology_limitations_public_annexure`
- raw public debug/legacy keys that bypass the Phase 12 clean-profile report contract

## Build discipline

Build page by page:

1. UI-00 doctrine lock
2. UI-P12 renderer bridge and UI contract
3. Base Interface UI shell
4. Landing page
5. Report page
6. Public Technical Annexure
7. Qualified Review
8. Assembly Preview
9. Signals Preview / Regulatory Signal
10. Multi-sector package/admin surface
11. Controlled-failure and empty states
12. Universal UI contract gate
