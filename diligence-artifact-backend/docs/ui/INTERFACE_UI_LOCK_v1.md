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

`portfolio-shwetav` is a visual-quality reference only. It may inform polish, hierarchy, cards, spacing, proof-strip grammar, print/report grammar, and premium editorial feel.

It must not be copied as a rebrand and must not overwrite Interface Sandbox product identity.

## Landing execution-console rule

The Diligence landing page uses a single execution-console layout. The former global left phase rail and mobile funnel are retired from this page.

The landing page must show only these six public workflow stages:

1. `Source + Legal` — central Phases 1–2
2. `Target + Feature` — central Phases 3–6
3. `Data Provenance` — central Phases 7–9
4. `Exposure Registry` — central Phase 10
5. `Challenge Gate` — central Phase 11
6. `Validation` — central Phases 12–16, including Compiler, Qualified Review, Qualified Review Submission, Diligence-QA Complete, and Assembly Engine

Internal job IDs remain available in operator diagnostics and runtime responses. They must not become the public landing-page information architecture.

`REINVESTIGATION_REQUIRED` is not a terminal public stop. Only a genuine critical or controlled failure may stop the run.

The executable authority for this rule is `scripts/check-interface-ui-universal.mjs`. A returned rail, stale public phase map, missing Phase 12–16 stage, or reinvestigation-as-terminal behavior is a production-gate failure.

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
