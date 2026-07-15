# Pass 5C — Activity Candidate Inventory Runtime Smoke

Date: 2026-07-05
Branch: runtime-central-tree-pass1

## Scope

This pass adds a mocked runtime smoke for the phase-owned Activity Candidate Inventory runner.

It does not execute a real provider call, Cloud Run job, Firestore write, live runtime dispatch, Activity Profile Review material job, Activity Profile Forensics, or downstream phases.

## Smoke target

```text
runActivityCandidateInventoryPhase
```

with mocked callbacks:

- `readArtifacts`
- `saveArtifact`

## Scenarios covered

1. Valid deterministic inventory output is built from P1/P2/P3/P5 sources and saved as `feature_candidate_inventory`.
2. Injected P4 runtime artifact is rejected before save.
3. Contract read mismatch that adds P4 is rejected before save.

## Assertions

The smoke asserts:

- exact phase-owned reads are used
- only `feature_candidate_inventory` is saved
- output is `m8_feature_candidate_inventory_index_v1`
- derivation mode is `DETERMINISTIC_INDEX_NO_MODEL_NO_EVIDENCE_COMPILATION`
- index boundary is present
- no copied source text or evidence fields appear in the inventory
- P4 is not indexed and no candidate source pointer references P4
- canonical candidates are produced from product/API/model/integration routes

## Aggregate

Updated:

```text
scripts/check-phase5-activity-profile-review.mjs
```

It now runs:

- Activity Candidate Inventory contract check
- Activity Candidate Inventory runner check
- Activity Candidate Inventory runtime smoke

## Boundary

Runtime service cutover remains pending.

The next pass should be Activity Candidate Inventory runtime cutover, not Activity Profile Review material migration yet.
