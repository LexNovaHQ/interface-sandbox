# Pass 4A — Target Profile Forensics Deterministic Migration

Date: 2026-07-05
Branch: runtime-central-tree-pass1

## Scope

This pass begins Phase 4 by migrating Target Profile Forensics into the phase-owned structure.

This is intentionally a simple migration from the old runtime helper:

```text
buildM7DeterministicTargetForensics
```

The helper is not rewritten. It is wrapped in a phase-owned contract and runner.

## Central phase

```text
TARGET_PROFILE_FORENSICS
```

Public label:

```text
Target Profile Forensics
```

Compatibility internal job ID retained:

```text
M7_TARGET_PROFILE_FORENSICS
```

## Read boundary

The phase reads exactly:

- `source_discovery_handoff`
- `legal_signal_derivation_profile`
- `target_profile`
- `lossless_family__T0_ROOT`
- `lossless_family__T1_IDENTITY`
- `lossless_family__T2_LEGAL_IDENTITY`
- `lossless_family__T3_OPERATOR_ENTITY`
- `lossless_family__T4_SUPPORTING_IDENTITY`

## Write boundary

The phase writes exactly:

```text
target_profile_forensics
```

## Boundary rules

- deterministic only
- no provider/model call
- no raw `legal_cartography_index`
- no old deterministic overlay
- no legal-governance lossless families
- no product/activity lossless families
- no data-provenance lossless families
- no material `target_profile` re-emission

## Files added/updated

- `src/phases/04-target-profile-forensics/target-profile-forensics.contract.js`
- `src/phases/04-target-profile-forensics/target-profile-forensics.phase.js`
- `src/phases/04-target-profile-forensics/target-profile-forensics.runner.js`
- `src/phases/04-target-profile-forensics/index.js`
- `src/phases/phase-registry.js`
- `scripts/check-target-profile-forensics-contract.mjs`
- `scripts/check-target-profile-forensics-runtime-smoke.mjs`
- `scripts/check-phase4-target-profile-forensics.mjs`

## Validation added

The Phase 4 aggregate check is:

```powershell
node scripts/check-phase4-target-profile-forensics.mjs
```

## Boundary

No live dispatch cutover was performed in this pass.

Runtime service still owns orchestration and persistence.
