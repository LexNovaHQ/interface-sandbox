# Pass 3E — Target Profile Review Runtime Wiring Audit

Date: 2026-07-05
Branch: runtime-central-tree-pass1

## Scope

This pass audited and locked Target Profile Review runtime wiring.

It did not switch the production entrypoint and did not migrate Target Profile Forensics or Activity Profile Review.

## Runtime contract lock

`M7_TARGET_PROFILE` remains the compatibility internal job ID.

Its central phase is:

```text
TARGET_PROFILE_REVIEW
```

Its public label is:

```text
Target Profile Review
```

It reads exactly:

- `source_discovery_handoff`
- `lossless_family__T0_ROOT`
- `lossless_family__T1_IDENTITY`
- `lossless_family__T2_LEGAL_IDENTITY`
- `lossless_family__T3_OPERATOR_ENTITY`
- `lossless_family__T4_SUPPORTING_IDENTITY`
- `legal_signal_derivation_profile`

It writes exactly:

- `target_profile`

## Runtime path audited

The runtime model job path:

1. reads artifacts from `contract.reads`
2. builds prompt from `contract.prompt_files`
3. passes reference files from `contract.references`
4. validates Target Profile Review output with the active Target Profile Review validator
5. saves only `contract.writes`

## Forbidden wiring confirmed

The wiring check fails if Target Profile Review reads:

- raw `legal_cartography_index`
- old deterministic legal overlay artifact
- legal-governance families
- product/activity families
- data-provenance families

## Validation added

- `scripts/check-target-profile-review-runtime-wiring.mjs`

Updated aggregate:

- `scripts/check-phase3-target-profile-review.mjs`

## Boundary

`production_entrypoint_switched` remains `false`.

Next pass should be a runtime cutover / runner patch only if the local checks pass.
