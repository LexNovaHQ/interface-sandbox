# Pass 3D — Target Profile Review Self-Contained Smoke

Date: 2026-07-05
Branch: runtime-central-tree-pass1

## Scope

This pass added a self-contained Target Profile Review smoke.

It does not migrate the runner, execute a model call, execute Target Profile Forensics, execute Activity Profile Review, or run later phases.

## Smoke inputs

The smoke uses only the Target Profile Review contract-approved read artifacts:

- `source_discovery_handoff`
- `lossless_family__T0_ROOT`
- `lossless_family__T1_IDENTITY`
- `lossless_family__T2_LEGAL_IDENTITY`
- `lossless_family__T3_OPERATOR_ENTITY`
- `lossless_family__T4_SUPPORTING_IDENTITY`
- `legal_signal_derivation_profile`

## Smoke output

The smoke builds and validates exactly one material artifact:

```text
target_profile
```

## Scenarios covered

1. Derived jurisdiction signal values pass into `jurisdiction_notice`.
2. Source-conflict jurisdiction signals become `FIELD_CONFLICTED` plus limitation rows.
3. Missing legal signals become controlled not-found fields plus limitation rows.
4. Data Provenance Profile direct-signal families are ignored and must not leak into `target_profile`.
5. Raw `legal_cartography_index`, legal-governance families, old overlay artifact, downstream artifacts, renderer artifacts, and Qualified Review artifacts must not appear in the output.

## Files added/updated

- `scripts/check-target-profile-review-phase-smoke.mjs`
- `scripts/check-phase3-target-profile-review.mjs`

## Boundary

This is a phase-level smoke only. Runtime cutover remains future work.
