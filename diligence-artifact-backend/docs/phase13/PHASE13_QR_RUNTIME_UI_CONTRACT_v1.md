# Phase 13 Qualified Review Runtime and UI Contract v1

## Status

`CO-P13-06_TO_09_ACTIVE`

## Purpose

This contract governs the deterministic Qualified Review workspace between the Phase 12 report renderer and Qualified Review submission compilation.

Phase 13 does not investigate, derive new legal facts, read raw evidence, or assemble documents. It presents the active registry values, accepts reviewer corrections, obtains one attestation per active section, and pauses the pipeline until the reviewer submits the final workspace state.

## Runtime sequence

```text
NORMALIZED_REPORT_RENDERER
→ QUALIFIED_REVIEW
→ AWAITING_QUALIFIED_REVIEW
→ QUALIFIED_REVIEW_SUBMISSION
```

`QUALIFIED_REVIEW` is intercepted by the active Cloud Tasks worker entrypoint. Every Phase 1–12 job continues through the unchanged central pipeline worker.

The Phase 13 worker:

1. Loads the locked Phase 13 runtime read contract.
2. Builds registry activation and Phase 12 value resolution.
3. Builds the active field ledger.
4. Compiles section-based handoff and renderer artifacts.
5. Saves all nine Phase 13 runtime artifacts.
6. Sets the run to `AWAITING_QUALIFIED_REVIEW`.
7. Sets `runner_auto_continue` to `false`.

A run in `AWAITING_QUALIFIED_REVIEW` must not enqueue or execute another pipeline step.

## Runtime reads

Phase 13 reads only:

- `domain_derivation_profile`
- `active_run_package_manifest`
- the Phase 12 report manifest and report-facing artifacts declared by `PHASE12_RENDERER_READ_ARTIFACT_NAMES`

Raw evidence, cartography indexes, forensic artifacts, and Phase 3–11 profile artifacts are forbidden.

## Runtime outputs

The Qualified Review runtime writes:

- `qr_registry_load_manifest`
- `qr_registry_structural_validation`
- `qr_registry_resolution_manifest`
- `qr_phase12_value_resolution`
- `qr_active_field_ledger`
- `phase13_domain_field_resolution_summary`
- `qualified_review_handoff`
- `qualified_review_renderer_payload`
- `qualified_review_validation_manifest`

All outputs are versioned in Drive and Firestore before the run enters the pause state.

## Confirmation model

Confirmation is exclusively per section.

Every active section has one attestation state. Individual fields remain editable but have no mandatory confirmation action.

Editing any field after attestation invalidates only that section's attestation. Other section attestations remain valid.

## Activation probes

An unresolved domain subpackage renders only the existing registry fields declared as activation probes.

Attesting a probe section confirms the current probe value without requiring a per-field confirmation action. The runtime then rebuilds registry activation.

When activation adds fields to the section, its state hash changes and the expanded section must be reviewed and attested again.

## Value provenance

Saving an unchanged value must not convert it into a reviewer-authored value.

Only actual changes, limitations, not-applicable decisions, or section-confirmed activation-probe values are stored in `qualified_review_draft.field_edits`.

The original Phase 12 or `{MARKET BASED}` provenance therefore remains intact for unchanged values.

## Public API

Active routes:

```text
GET  /public/diligence-system/qualified-review/:run_id
PUT  /public/diligence-system/qualified-review/:run_id/draft
PUT  /public/diligence-system/qualified-review/:run_id/sections/:section_id/attestation
POST /public/diligence-system/qualified-review/:run_id/submit
```

The old per-question endpoint is retired:

```text
POST /public/diligence-system/qualified-review/:run_id/responses
→ 410 QUALIFIED_REVIEW_MATRIX_SUBMISSION_RETIRED
```

## Persistence

Draft state is stored as:

- `qualified_review_draft`

Final UI submission creates:

- `qualified_review_submission_request`

The request is not the immutable final-value ledger. That ledger is compiled by `QUALIFIED_REVIEW_SUBMISSION` in CO-P13-10.

## UI contract

The active workspace:

- renders only active registry sections;
- displays every active atomic value;
- distinguishes `DILIGENCE DERIVED` and `{MARKET BASED}` values;
- allows direct edits, limitations, and not-applicable decisions;
- displays exact affected documents;
- displays activation probes explicitly;
- requires one attestation per active section;
- refreshes the active registry immediately after probe attestation;
- blocks final submission while an activation probe remains unresolved;
- performs no document assembly.

## Review-Ready boundary

Qualified Review supports preparation of Review-Ready Drafts by a Legal Architecture service. It is not legal advice and does not replace review and approval by qualified local counsel.
