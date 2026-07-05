# Pass 3F — Target Profile Review Runtime Cutover / Runner Patch

Date: 2026-07-05
Branch: runtime-central-tree-pass1

## Scope

This pass adds the Target Profile Review phase-owned runner and marks the runtime contract for phase-runner cutover.

It does not migrate Target Profile Forensics, Activity Profile Review, Data Provenance Profile, or later phases.

## Added phase runner

Added:

- `src/phases/03-target-profile-review/target-profile-review.runner.js`

The runner owns Target Profile Review read/prompt/provider/validator/save-preparation logic and enforces the 3A/3B/3C contract boundary.

## Runtime contract status

`M7_TARGET_PROFILE` remains the compatibility internal job ID.

Its central phase remains:

```text
TARGET_PROFILE_REVIEW
```

The pipeline contract now marks:

```text
runtime_wiring_status: PHASE_RUNNER_CUTOVER
production_entrypoint_switched: true
global_production_deployment_switched: false
```

## Connector limitation

Direct replacement of `src/runtime/services/pipeline.service.js` was blocked by the connector safety layer because the file is stored as a large compressed service with many single-line functions.

To avoid a risky manual rewrite through the connector, this pass adds a deterministic local patch script:

- `scripts/apply-target-profile-review-runner-cutover.mjs`

The script applies the exact dispatch/import/function insertion to `pipeline.service.js` locally.

## Validation added

- `scripts/check-target-profile-review-runner-cutover.mjs`

Run order locally:

```powershell
node scripts/apply-target-profile-review-runner-cutover.mjs
node scripts/check-target-profile-review-runner-cutover.mjs
```

## Boundary

Global production deployment remains unswitched.

After local patch execution, the Target Profile Review internal job should dispatch through the phase-owned runner instead of the generic model-profile path.
