# Pass 5F — Activity Profile Review Material Runner Smoke

Date: 2026-07-05
Branch: runtime-central-tree-pass1

## Scope

This pass adds the phase-owned Activity Profile Review material runner and mocked runtime smoke.

It does not cut over the live runtime service dispatch for the material job, does not migrate Activity Profile Forensics, and does not touch downstream phases.

## Runner

Added:

```text
src/phases/05-activity-profile-review/activity-profile-review.runner.js
```

The runner wraps the model/material job for compatibility internal job:

```text
M8_TARGET_FEATURE_PROFILE
```

and writes exactly:

```text
target_feature_profile
```

## Runner behavior

The runner:

- asserts runtime contract reads, writes, prompt files, and reference files against `activity-profile-review.contract.js`
- reads only the locked Activity Profile Review material artifacts
- rejects injected runtime artifacts outside the read boundary
- requires `feature_candidate_inventory.candidates[]` before provider call
- builds the prompt using the runtime prompt stack
- calls the JSON provider
- validates provider JSON using `validateM8TargetFeatureOutput` with phase `M8_TARGET_FEATURE_PROFILE`
- asserts material-only boundary after validation
- saves only `target_feature_profile`
- returns `LOCKED` or `LOCKED_WITH_LIMITATIONS`

## Runtime smoke

Added:

```text
scripts/check-activity-profile-review-runtime-smoke.mjs
```

The smoke covers:

1. Clean material output saves `target_feature_profile` with `LOCKED`.
2. Material output with profile-level limitations saves with `LOCKED_WITH_LIMITATIONS`.
3. Injected forbidden runtime artifact is rejected before provider call.
4. Missing `feature_candidate_inventory` is rejected before provider call.
5. Provider output with forensic/runtime trace leakage is rejected before save.
6. Contract read mismatch is rejected before provider call.

## Runner status check

Added:

```text
scripts/check-activity-profile-review-runner.mjs
```

## Aggregate

Updated:

```text
scripts/check-phase5-activity-profile-review.mjs
```

The aggregate now includes:

- Activity Candidate Inventory contract
- Activity Candidate Inventory runner
- Activity Candidate Inventory runtime smoke
- Activity Candidate Inventory runtime cutover check
- Activity Profile Review material contract
- Activity Profile Review material runner
- Activity Profile Review material runtime smoke

## Boundary

Activity Profile Review material runtime cutover remains pending.

Activity Profile Forensics remains pending.
