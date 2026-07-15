# CO-P12-03 — Route, Admission and Projection Adapters

## Status

`LOCKED`

## Scope

CO-P12-03 installs the executable adapter path for Phase 12 without deleting the old recursive compiler stack.

The scope is:

1. direct-profile admission adapter;
2. FDR-backed route adapter;
3. one-section-one-artifact projection adapter;
4. renderer payload adapter surface; and
5. validator coverage for P12-08 through P12-10.

## Non-scope

CO-P12-03 does not perform the destructive compiler swap. `compiler.js` may still export the transitional legacy stack until the adapter path is promoted in a later cutover.

CO-P12-03 does not create new upstream findings, questions, priorities, remediation, review routes or legal conclusions.

## P12-08 — Route adapter

`phase12-route-adapter.js` consumes:

- `REPORT_FIELD_OWNERSHIP_MATRIX.json`;
- `REPORT_NORMALIZER_KEY.yml`; and
- `REPORT_SECTION_SCHEMA.yml`.

It routes all 430 active owned FDR fields to direct upstream owner artifacts and blocks all 27 missing-owner fields.

Phase 2G buckets, route packets and phase routing manifests are forbidden.

## P12-09 — Admission adapter

`phase12-admission-adapter.js` consumes only direct upstream material artifacts plus the final `challenge_gate`.

It enforces:

- CO-P12-01 Phase 10 / Phase 11 exact gate;
- CO-P12-02 report authority receipt;
- absence of Phase 2G runtime packets; and
- availability of all owner artifacts needed by active report fields.

## P12-10 — Projection adapter

`phase12-projection-adapter.js` projects exactly ten report-section artifacts:

- `report_section__01_matter_review_boundary`
- `report_section__02_executive_legal_risk_overview`
- `report_section__03_target_entity_sector_profile`
- `report_section__04_product_activity_architecture`
- `report_section__05_data_provenance_privacy_architecture`
- `report_section__06_sector_control_obligations`
- `report_section__07_legal_governance_architecture`
- `report_section__08_exposure_register`
- `report_section__09_open_review_items_handoff`
- `report_section__10_methodology_limitations_annexure`

It also emits:

- `phase12_admission`
- `phase12_route_plan`
- `normalized_report_manifest`
- `review_ready_section_handoff`
- `final_output_handoff`
- `renderer_payload`

The adapter does not emit `normalized_section__*` artifacts.

## Section 8 / Section 9 hard split

Section 8 is the complete exposure register. It carries Phase 10 material rows without row re-evaluation.

Section 9 is only the open handoff queue sourced from the final Phase 11 gate warning projection. It must not duplicate the complete exposure register.

## Review-Ready boundary

The projection includes the Review-Ready Draft and local counsel mandate in the handoff and methodology surfaces. This remains a legal-architecture deliverable, not legal advice.
