# Pass 4B — Target Profile Forensics Runtime Cutover

Date: 2026-07-05
Branch: runtime-central-tree-pass1

## Scope

This pass stages the Target Profile Forensics runtime cutover from the generic deterministic forensics fallback to the phase-owned runner.

It does not touch Activity Profile Review or later phases.

## Runtime target

Compatibility internal job ID retained:

```text
M7_TARGET_PROFILE_FORENSICS
```

Central phase:

```text
TARGET_PROFILE_FORENSICS
```

Public label:

```text
Target Profile Forensics
```

## Cutover behavior

After the local patch script is applied, `pipeline.service.js` routes Target Profile Forensics through:

```text
runTargetProfileForensicsPhase
```

instead of the generic deterministic forensics fallback.

The generic deterministic forensics fallback remains available for Activity Profile Forensics and Data Provenance Forensics.

## Files added/updated

- `src/phases/04-target-profile-forensics/target-profile-forensics.contract.js`
- `src/phases/04-target-profile-forensics/target-profile-forensics.runner.js`
- `scripts/apply-target-profile-forensics-runner-cutover.mjs`
- `scripts/check-target-profile-forensics-runner-cutover.mjs`
- `scripts/check-phase4-target-profile-forensics.mjs`

## Connector limitation

Direct replacement of `src/runtime/services/pipeline.service.js` is intentionally avoided because the file is a compressed runtime service and connector replacement is risky.

The deterministic local patch script applies the exact changes:

- import Target Profile Forensics phase runner
- mark `target_profile_forensics_phase_runner_wired: true`
- insert explicit Target Profile Forensics dispatch before generic deterministic forensics fallback
- insert `runTargetProfileForensicsRuntimeJob` wrapper
- log `TARGET_PROFILE_FORENSICS_PHASE_RUNNER_COMPLETED`

## Local validation

Run:

```powershell
node scripts/apply-target-profile-forensics-runner-cutover.mjs
node scripts/check-target-profile-forensics-runner-cutover.mjs
node scripts/check-phase4-target-profile-forensics.mjs
```

## Boundary

Global production deployment remains unswitched.

Activity Profile Review remains untouched.
