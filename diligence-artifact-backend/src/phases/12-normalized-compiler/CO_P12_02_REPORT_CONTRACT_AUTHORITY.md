# CO-P12-02 — Report Contract Authority

## Status

`LOCKED`

## Governing rule

**Upstream phases decide. Phase 12 arranges.**

CO-P12-02 freezes the report-facing contract layer before the Phase 12 runtime is rebuilt. It does not cut over the compiler loader, remove Phase 2G from the current compiler, assemble report artifacts, or change the renderer.

## Deliverables

1. `REPORT_SECTION_SCHEMA.yml` — the final ten-section public report structure.
2. `REPORT_NORMALIZER_KEY.yml` — a complete FDR-backed field dictionary and Registry-Key value-normalization authority.
3. `REPORT_FIELD_OWNERSHIP_MATRIX.json` — field-to-owner and field-to-report-section authority.
4. `UPSTREAM_REPORT_GAP_REGISTER.yml` — fields Phase 12 is forbidden to synthesize because an upstream owner is absent.

## Final report sections

1. Matter Overview & Review Boundary
2. Executive Legal Risk Overview
3. Target, Entity & Sector Profile
4. Product & Activity Architecture
5. Data Provenance & Privacy Architecture
6. Sector-Specific Control Obligations
7. Legal & Governance Architecture
8. Exposure Register
9. Open Review Items & Handoff Plan
10. Methodology, Limitations & Technical Annexure Index

## Section 8 / Section 9 separation

Section 8 is the complete exposure register. It carries triggered and controlled exposure rows, severity, legal pain, visible-control or exclusion basis, and upstream-owned response/remediation/review routes.

Section 9 contains only open or unresolved handoff items. It must not repeat the complete exposure register, create new questions, create new remediation, re-prioritize rows, or create new counsel routes.

## FDR authority

The FDR currently contains 457 unique locked fields although its metadata declares 456. CO-P12-02 preserves all 457 rows and records the metadata mismatch. No field is dropped to force agreement with stale metadata.

- 430 fields have a current upstream material owner.
- 27 fields are blocked as upstream-owner gaps:
  - 17 `DRR.*` Document Redline & Remediation Matrix fields.
  - 10 `FPA.*` Final Assessment fields.

Phase 12 may not derive either gap family. They remain unavailable until an explicit upstream owner is created.

## Normalization authority

Field identity and canonical labels come from `Diligence_Field_Derivation_Registry.yml`.

Domain-specific display names come only from the mounted Registry Key:

- Behavior Class
- Lane
- Surface
- Subcategory
- Compliance Framework
- Pain Tier / Pain Category
- Pain Depth
- Velocity
- legal status

Generic title-casing, fallback humanizers, guessed labels, and hardcoded cross-domain vocabularies are forbidden.

## Route boundary

CO-P12-02 records owning artifacts but deliberately leaves exact source paths unbound. Exact material-artifact path bindings belong to CO-P12-03. Until that contract is frozen, the current compiler runtime remains unchanged.

## Control metadata

Run IDs, artifact fingerprints, source-artifact names, section order, gate status, and Review-Ready/local-counsel notices are permitted control metadata. They are not FDR substantive findings and must not masquerade as diligence fields.
