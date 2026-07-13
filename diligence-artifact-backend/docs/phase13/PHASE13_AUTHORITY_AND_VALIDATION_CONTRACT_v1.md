# Phase 13 Authority and Validation Contract v1

**Contract ID:** `PHASE13_AUTHORITY_AND_VALIDATION_CONTRACT_v1`  
**Status:** LOCKED  
**Owner:** Phase 13 — Qualified Review  
**Role boundary:** Lex Nova acts as a Legal Architect, not a law firm.

## 1. Purpose

Phase 13 is the deterministic bridge between Phase 12 material findings, reviewer-confirmed final values, and Review-Ready document assembly. It does not investigate, perform new substantive legal derivation, or read raw evidence.

## 2. Sole diligence-prefill authority

Phase 13 may use only the following diligence-side authorities:

1. `report_manifest`
2. Phase 12 report-facing artifacts identified by `REPORT_FACING_ARTIFACT_NAMES`
3. `phase12_compiler_validation`
4. `report_handoff`
5. `domain_derivation_profile`
6. `active_run_package_manifest`
7. run metadata, including demo or production mode

Phase 13 must not read cartography indexes, lossless evidence, legal-document source artifacts, Phase 2 routing buckets, raw Phase 3–11 profiles, threat rows, or forensic artifacts.

## 3. Registry authority

The sole registry authority is:

`references/registry/qr/ACTIVE_QR_REGISTRY.yml`

That pointer must resolve to one active catalog under `references/registry/qr/v2_1/`. Runtime code must not hardcode AI field IDs, lane names, document IDs, domain names, capability overlays, or regulatory overlays. New domains are added through catalog entries, registries, template manifests, and injection maps.

Registry activation order is:

1. Universal
2. Primary domain
3. Capability overlays
4. Regulatory overlays
5. Domain lanes or subpackages

The operator must never select a domain or lane manually.

## 4. Runtime sequence

The locked sequence is:

`NORMALIZED_REPORT_RENDERER`
→ `QUALIFIED_REVIEW`
→ `AWAITING_QUALIFIED_REVIEW`
→ `QUALIFIED_REVIEW_SUBMISSION`
→ `DILIGENCE_QA_COMPLETE`
→ `ASSEMBLY_ENGINE`
→ `COMPLETE`

`AWAITING_QUALIFIED_REVIEW` is a paused run status, not an automatically advanced pipeline job.

## 5. Review and attestation

Confirmation is **per section**, never per question.

Individual active fields remain editable and may record:

- `UNCHANGED`
- `EDITED`
- `NOT_APPLICABLE`
- `LIMITATION_ADDED`

Each active section requires one attestation covering the section’s current final state. Editing a field after attestation invalidates that section’s attestation and returns it to `ATTESTATION_REQUIRED`.

Submission is permitted only when:

- every active section is attested;
- every activation probe is resolved;
- no unresolved critical field remains.

Mandatory per-field confirmation controls are forbidden.

## 6. Value precedence and provenance

Final value precedence is:

1. reviewer-edited value;
2. Phase 12 material value;
3. `{MARKET BASED}` demo value;
4. unresolved.

Every atomic value must retain its source as `REVIEWER`, `PHASE_12`, `MARKET_BASED`, or `UNRESOLVED`.

In demo mode, missing values may be automatically populated with `{MARKET BASED}` values. In production mode, market-based values are suggestions requiring section attestation before submission. Market-based values are never diligence evidence.

## 7. Final authority

`qr_final_value_ledger` is the sole value authority after Qualified Review submission. Diligence-QA and Assembly must not independently re-read Phase 12 to override it.

Assembly may read only:

- `qr_final_value_ledger`
- `document_activation_manifest`
- active template manifest
- active document injection map
- `diligence_qa_completion_receipt`

## 8. Severity

Critical structural failures block the run. Critical failures isolated to one document block that document unless they compromise system integrity. Material unresolved values receive two clarification attempts and then pass with an explicit warning marker where the document requires the value.

## 9. Legacy authority prohibition

The following must not be active Phase 13 authorities:

- the 79-row Qualified Review matrix;
- normalized-section selectors;
- the four legacy QR section artifacts;
- `vault_payload` routes;
- static matrix-based document-impact defaults;
- any compatibility adapter that makes the legacy matrix authoritative.

## 10. CO-P13-00–02 exit rule

Authority and validation are ready only when:

- the active pointer resolves to the v2.1 catalog;
- every catalog path resolves inside the backend root;
- all registries validate structurally;
- every Phase 12 exact field ID is owned;
- every field-family prefix resolves to at least one owned Phase 12 row;
- every document ID resolves to the template manifest;
- every registry document binding exactly reconciles with the injection map;
- catalog and registry counts reconcile;
- no duplicate canonical field or placeholder authority exists.
