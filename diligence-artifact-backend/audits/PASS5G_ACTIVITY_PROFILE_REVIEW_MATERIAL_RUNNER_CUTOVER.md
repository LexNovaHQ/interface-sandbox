# Pass 5G — Activity Profile Review Material Runtime Cutover

Date: 2026-07-05
Branch: runtime-central-tree-pass1

## Scope

This pass stages Activity Profile Review material runtime cutover from the generic model fallback to the phase-owned material runner.

It does not migrate Activity Profile Forensics, Data Provenance Profile, Exposure Profile, Operator Challenge, Compiler, Qualified Review, or Assembly Engine.

## Runtime target

Compatibility internal job ID retained:

```text
M8_TARGET_FEATURE_PROFILE
```

Central phase:

```text
ACTIVITY_PROFILE_REVIEW
```

Phase-owned material job:

```text
ACTIVITY_PROFILE_REVIEW_MATERIAL
```

## Cutover behavior

After the local patch script is applied, `pipeline.service.js` routes Activity Profile Review material through:

```text
runActivityProfileReviewPhase
```

instead of the generic model fallback.

## Runtime contract

After the local patch script is applied, `pipeline.contract.js` marks `M8_TARGET_FEATURE_PROFILE` as:

```text
runtime_wiring_status: PHASE_RUNNER_CUTOVER
production_entrypoint_switched: true
global_production_deployment_switched: false
```

The read/write/prompt/reference contract remains synchronized with `src/phases/05-activity-profile-review/activity-profile-review.contract.js`.

## Files added/updated

- `src/phases/05-activity-profile-review/activity-profile-review.contract.js`
- `src/phases/05-activity-profile-review/activity-profile-review.runner.js`
- `src/phases/05-activity-profile-review/activity-profile-review.phase.js`
- `src/phases/phase-registry.js`
- `scripts/apply-activity-profile-review-runner-cutover.mjs`
- `scripts/check-activity-profile-review-contract.mjs`
- `scripts/check-activity-profile-review-runner.mjs`
- `scripts/check-activity-profile-review-runner-cutover.mjs`
- `scripts/check-phase5-activity-profile-review.mjs`

## Local validation order

The Activity Candidate Inventory cutover script must be applied first, then the Activity Profile Review material cutover script:

```powershell
node scripts/apply-activity-candidate-inventory-runner-cutover.mjs
node scripts/apply-activity-profile-review-runner-cutover.mjs
```

Then run:

```powershell
node scripts/check-activity-profile-review-runner-cutover.mjs
node scripts/check-phase5-activity-profile-review.mjs
```

## Boundary

Global production deployment remains unswitched.

Activity Profile Forensics remains pending.
