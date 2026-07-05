# Pass 5B — Activity Candidate Inventory Runner Wrapper

Date: 2026-07-05
Branch: runtime-central-tree-pass1

## Scope

This pass adds the phase-owned deterministic runner wrapper for Activity Candidate Inventory.

It does not cut over the live runtime service and does not migrate the model Activity Profile Review material job.

## Runner

Added:

```text
src/phases/05-activity-profile-review/activity-candidate-inventory.runner.js
```

The runner wraps the active inventory index helper:

```text
buildFeatureCandidateInventoryIndex
```

and validates through:

```text
validateFeatureCandidateInventoryIndex
```

## Read boundary

The runner requires the phase-owned inventory contract reads exactly:

- `source_discovery_handoff`
- `target_profile`
- `target_profile_forensics`
- `lossless_family__P1_PRODUCT`
- `lossless_family__P2_PLATFORM_FEATURE_SOLUTION`
- `lossless_family__P3_AI_CAPABILITY_TECHNICAL`
- `lossless_family__P5_ENTERPRISE_PRICING`

`lossless_family__P4_USE_CASE_INDUSTRY` is not accepted for candidate creation.

## Write boundary

The runner saves exactly:

```text
feature_candidate_inventory
```

## Boundary rules

The runner asserts:

- no forbidden runtime artifacts are injected
- inventory artifact type/version/mode match the locked contract
- inventory is index-only
- source text copy is forbidden
- indexed families are limited to P1/P2/P3/P5
- source pointers do not reference P4

## Validation added

Added:

```text
scripts/check-activity-candidate-inventory-runner.mjs
```

## Boundary

No runtime service cutover was performed in this pass.
