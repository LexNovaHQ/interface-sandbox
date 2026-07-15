# Pass 3G — Target Profile Review Runtime Smoke

Date: 2026-07-05
Branch: runtime-central-tree-pass1

## Scope

This pass adds a runtime smoke for the phase-owned Target Profile Review runner.

It does not execute a real provider call, Firestore write, Cloud Run job, Target Profile Forensics, Activity Profile Review, or later phases.

## Runtime surface tested

The smoke directly calls:

```text
runTargetProfileReviewPhase
```

with mocked runtime callbacks for:

- `readArtifacts`
- `buildPrompt`
- `callProvider`
- `saveArtifact`

## Scenarios covered

1. Valid Target Profile Review output is validated and saved as `target_profile`.
2. Controlled limitation output resolves to `LOCKED_WITH_LIMITATIONS`.
3. Injected forbidden runtime artifact `legal_cartography_index` is rejected before prompt/provider/save.
4. Provider output that leaks `legal_signal_derivation_profile` inside `target_profile` is rejected and not saved.

## Assertions

The smoke asserts:

- exact runtime reads come from the Target Profile Review pipeline contract
- prompt build receives `writes: ["target_profile"]`
- provider is called with phase `TARGET_PROFILE_REVIEW`
- only `target_profile` is saved
- runner metadata marks `target_profile_review_phase_runner_used: true`
- `legal_signal_derivation_profile_supplied_directly` is true when supplied as approved input

## Files added/updated

- `scripts/check-target-profile-review-runtime-smoke.mjs`
- `scripts/check-phase3-target-profile-review.mjs`

## Boundary

This is not a live pipeline run. It is a phase-owned runner smoke.

Live pipeline smoke remains the next pass.
