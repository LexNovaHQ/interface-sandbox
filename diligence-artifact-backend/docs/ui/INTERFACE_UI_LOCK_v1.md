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

The Diligence landing page uses a single execution-console layout. The former global left rail and mobile funnel remain retired.

The live matter card must show the **sixteen central diligence phases separately**:

1. `Source Discovery`
2. `Cartography and Index`
3. `Target Profile Review`
4. `Target Profile Forensics`
5. `Activity Profile Review`
6. `Activity Profile Forensics`
7. `Data Provenance Profile`
8. `Domain Control Obligation Profile`
9. `Data Provenance Forensics`
10. `Exposure Profile`
11. `Operator Challenge`
12. `Compiler`
13. `Qualified Review`
14. `Qualified Review Submission`
15. `Diligence-QA Complete`
16. `Assembly Engine`

No public UI may merge these phases into broad stage buckets such as `Source + Legal`, `Target + Feature`, `Data Provenance`, `Exposure Registry`, `Challenge Gate`, or `Validation`.

The active phase row must show the exact internal job ID. Internal job IDs remain implementation details, but they are required in the live execution trace for operational diagnosis.

Before a run starts, every phase must display `Not started`. The UI must not label Phase 1 `Ready` merely because the intake page is idle.

## Sector, domain and registry authority

The New Matter intake collects the target source. It must not ask the user to choose an internal registry.

The following are forbidden on intake:

- `Active Vertical Registry`
- manual sector/domain package selection
- demo-only registry lanes
- disabling runs because a manually selected registry is not activated

Phase 3 is the selection authority. The UI must display a read-only projection after Phase 3 containing:

- derived sector/domain;
- primary domain package;
- AI overlay status; and
- mounted registry package(s).

The projection must come from `active_run_package_manifest` and, where available, `active_threat_registry_manifest`. It may not create a second selection authority.

Manual override, if introduced later, belongs only in authenticated Operator Diagnostics and requires an explicit governing change order.

## Failure and reinvestigation rule

`REINVESTIGATION_REQUIRED` is not a terminal public stop. It remains the current phase with a `Reinvestigating` state.

Only a genuine `CRITICAL_FAILURE`, `CONTROLLED_FAILURE`, or failed runner state may stop the run.

The executable authority for the landing rules is `scripts/check-interface-ui-universal.mjs`. Any of the following is a production-gate failure:

- merged public phase buckets;
- missing central phases;
- missing exact current job;
- false idle `Ready`;
- a returned manual registry selector;
- missing Phase 3 domain/package projection;
- reinvestigation treated as terminal; or
- restoration of the retired global left rail or mobile funnel.

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
