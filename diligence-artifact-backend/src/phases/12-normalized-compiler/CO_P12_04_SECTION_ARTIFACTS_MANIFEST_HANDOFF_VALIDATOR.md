# CO-P12-04 — Section Artifact Families, Manifest, Handoff and Validator

## Status

`LOCKED`

## Governing doctrine

**Upstream phases decide. Phase 12 arranges.**

Every mandatory material field emitted by an owning upstream profile is mandatory for Phase 12 projection. Phase 12 may reorganize material values into clean report-facing profiles, but it must not delete, hide, downgrade, reinterpret, mutate or replace a mandatory upstream material field.

Report cleanliness is not achieved by dropping material. It is achieved by isolating custody and mechanical payloads from renderable report profiles.

## Global artifact purity rule

Every renderable Phase 12 artifact is a clean normalized report profile or a thin section wrapper.

Renderable artifacts may contain only:

- locked public titles and labels;
- deterministic summaries and counts over upstream material values;
- findings and rows containing upstream-owned material values;
- upstream-owned limitations;
- upstream-owned review notes;
- upstream-owned recommended responses and review routes;
- minimal render controls such as schema version, artifact name, section ID, profile ID, order, status and child references.

Renderable artifacts must not contain:

- forensic payloads or forensic rows;
- semantic ledgers or batch ledgers;
- workpads;
- route rows or full route plans;
- Phase 2G packets, buckets or manifests;
- prompt/model traces;
- checkpoint or retry data;
- validation failures/warnings;
- raw registry mechanics such as `Hunter_Trigger`, `FIELD21`, `FIELD22`, `FIELD23`, `registry_order` or `batch_id`;
- raw source buckets or lossless evidence;
- unnecessary fingerprints or replay data.

## Mandatory material field preservation

For FDR-owned profiles, every active FDR field must remain represented by its field ID, canonical FDR label and upstream value or an explicit unresolved upstream-value state.

For Phase 10 exposure rows, the clean report row must preserve all substantive material fields:

- Threat ID and Threat Name;
- Lane, Behavior Class, Surface and Subcategory;
- Compliance Framework where present;
- India, EU and US authority fields;
- Velocity, Pain Tier, Pain Category, Pain Depth, legal status and effective date;
- target match, basis proof, control/exclusion position, evidence basis and provenance;
- legal pain, false-positive mechanism, false-positive impact and applied mechanism;
- recommended fix, review route and upstream row limitations;
- final material status.

Execution identity and trace fields remain in `phase12_report_custody_manifest`, not in renderable rows.

## Section 5 artifact family

The canonical parent remains:

`report_section__05_data_provenance_privacy_architecture`

It is a thin `SECTION_WRAPPER` with child references, counts and renderer instructions only. It must not contain DAP rows or findings.

Its clean child profiles are:

1. `report_section__05_parties_roles`
2. `report_section__05_data_objects_flows`
3. `report_section__05_purpose_authorization_user_controls`
4. `report_section__05_privacy_contacts_consent_manager`
5. `report_section__05_vendor_processor_chain`
6. `report_section__05_location_transfer_custody`
7. `report_section__05_retention_deletion_portability`
8. `report_section__05_security_access_incident_governance`
9. `report_section__05_sensitive_high_risk_contexts`
10. `report_section__05_regulatory_readiness`
11. `report_section__05_missing_proof_diligence_requests`

All active `DAP.*` material fields must appear exactly once across those child profiles.

## Section 8 artifact family

The canonical parent remains:

`report_section__08_exposure_register`

It is a thin `SECTION_WRAPPER`. It contains no exposure rows. It carries child references, status definitions, counts and renderer ordering only.

Primary Sector profiles:

1. `report_section__08_primary_triggered_exposures`
2. `report_section__08_primary_controlled_by_visible_control`
3. `report_section__08_primary_controlled_by_exclusion`
4. `report_section__08_primary_controlled_by_public_evidence_limitation`

Capability Overlay profiles:

5. `report_section__08_overlay_triggered_exposures`
6. `report_section__08_overlay_controlled_by_visible_control`
7. `report_section__08_overlay_controlled_by_exclusion`
8. `report_section__08_overlay_controlled_by_public_evidence_limitation`

The public label for `CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION` is **Not Confirmed on Public Footprint** / **Controlled by Public-Evidence Limitation**. It must not be described as a finding that no exposure exists.

Each child profile has one stream scope and one material-status scope. Primary and overlay rows must never be merged. Triggered, visible-control, exclusion and public-evidence-limitation rows must never be merged.

## Canonical output surface

Ten canonical report sections remain locked.

The physical renderable output contains 29 clean report-facing artifacts:

- 10 canonical parent section artifacts;
- 11 Section 5 child profiles;
- 8 Section 8 child profiles.

Control artifacts are non-renderable:

- `phase12_admission`;
- `phase12_route_plan`;
- `phase12_report_custody_manifest`;
- `phase12_compiler_validation`;
- `report_manifest`;
- `report_handoff`;
- `final_output_handoff`;
- `renderer_payload`.

## Manifest

`report_manifest` is canonical. It records:

- ten canonical sections;
- all 29 renderable artifacts;
- parent/child relationships;
- deterministic render order;
- admission, route, custody and validator references;
- the global artifact purity contract.

`normalized_report_manifest` is a temporary exact alias only. It must not diverge from `report_manifest`.

## Handoff

`report_handoff` is canonical. It carries artifact references and render order, not duplicated report payloads. It contains the Review-Ready Draft notice and mandatory local-counsel review requirement.

`review_ready_section_handoff` is a temporary exact alias only.

## Renderer boundary

`renderer_payload` contains references and a render plan. It must not embed a second copy of all sections, read custody, merge profiles semantically, inspect forensics or create prose that changes upstream meaning.

## Validator

`phase12_compiler_validation` must block the projection when:

- a canonical section or required child profile is missing;
- a renderable artifact contains a forbidden mechanical/forensic key;
- a mandatory material field is removed;
- a DAP field is missing or duplicated across Section 5 children;
- a Section 8 row enters the wrong stream or status profile;
- Section 5 or Section 8 wrappers contain rows/findings;
- custody identity is missing or rendered;
- manifest, handoff, aliases or renderer references drift;
- Phase 2G or old `normalized_section__*` artifacts enter the adapter output.

## Current cutover boundary

CO-P12-04 builds and certifies the clean artifact family, canonical manifest, handoff and validator. It does not swap `compiler.js`, delete the legacy recursive compiler stack or cut over the production renderer. Those destructive changes require a later atomic cutover after this surface is certified.
