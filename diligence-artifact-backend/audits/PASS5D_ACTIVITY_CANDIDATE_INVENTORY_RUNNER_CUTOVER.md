# Pass 5D — Activity Candidate Inventory Runtime Cutover

Date: 2026-07-05
Branch: runtime-central-tree-pass1

## Scope

This pass stages Activity Candidate Inventory runtime cutover from the legacy inline deterministic inventory job to the phase-owned runner.

It does not migrate the model Activity Profile Review material job, Activity Profile Forensics, Data Provenance Profile, Exposure Profile, Operator Challenge, Compiler, Qualified Review, or Assembly Engine.

## Runtime target

Compatibility internal job ID retained:

```text
M8_FEATURE_CANDIDATE_INVENTORY
```

Central phase:

```text
ACTIVITY_PROFILE_REVIEW
```

Phase-owned job:

```text
ACTIVITY_CANDIDATE_INVENTORY
```

## Cutover behavior

After the local patch script is applied, `pipeline.service.js` routes Activity Candidate Inventory through:

```text
runActivityCandidateInventoryPhase
```

instead of the legacy inline `runActivityCandidateInventoryJob` dispatch.

## Contract tightening

The local patch script also updates `pipeline.contract.js` so the live runtime contract reads exactly:

- `source_discovery_handoff`
- `target_profile`
- `target_profile_forensics`
- `lossless_family__P1_PRODUCT`
- `lossless_family__P2_PLATFORM_FEATURE_SOLUTION`
- `lossless_family__P3_AI_CAPABILITY_TECHNICAL`
- `lossless_family__P5_ENTERPRISE_PRICING`

`lossless_family__P4_USE_CASE_INDUSTRY` is removed from the live inventory read contract and remains context-only for the later Activity Profile Review material job.

## Files added/updated

- `src/phases/05-activity-profile-review/activity-candidate-inventory.contract.js`
- `src/phases/05-activity-profile-review/activity-candidate-inventory.runner.js`
- `src/phases/05-activity-profile-review/activity-profile-review.phase.js`
- `src/phases/phase-registry.js`
- `scripts/apply-activity-candidate-inventory-runner-cutover.mjs`
- `scripts/check-activity-candidate-inventory-contract.mjs`
- `scripts/check-activity-candidate-inventory-runner.mjs`
- `scripts/check-activity-candidate-inventory-runner-cutover.mjs`
- `scripts/check-phase5-activity-profile-review.mjs`

## Connector limitation

Direct replacement of `src/runtime/services/pipeline.service.js` and `src/runtime/contracts/pipeline.contract.js` is avoided because both are compressed runtime files. The deterministic local patch script applies the exact changes.

## Local validation

Run:

```powershell
node scripts/apply-activity-candidate-inventory-runner-cutover.mjs
node scripts/check-activity-candidate-inventory-runner-cutover.mjs
node scripts/check-phase5-activity-profile-review.mjs
```

## Boundary

Global production deployment remains unswitched.

Activity Profile Review material migration remains pending.
