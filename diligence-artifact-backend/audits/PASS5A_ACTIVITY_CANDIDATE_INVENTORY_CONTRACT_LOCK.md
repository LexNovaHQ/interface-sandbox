# Pass 5A — Activity Candidate Inventory Contract Lock

Date: 2026-07-05
Branch: runtime-central-tree-pass1

## Scope

This pass locks the deterministic Activity Candidate Inventory contract under Activity Profile Review.

It does not migrate the model Activity Profile Review job, Activity Profile Forensics, Data Provenance Profile, Exposure Profile, Operator Challenge, Compiler, Qualified Review, or Assembly Engine.

## Central phase

```text
ACTIVITY_PROFILE_REVIEW
```

## Locked deterministic job

```text
ACTIVITY_CANDIDATE_INVENTORY
```

Compatibility internal job ID retained:

```text
M8_FEATURE_CANDIDATE_INVENTORY
```

## Read boundary

The phase-owned inventory contract reads exactly:

- `source_discovery_handoff`
- `target_profile`
- `target_profile_forensics`
- `lossless_family__P1_PRODUCT`
- `lossless_family__P2_PLATFORM_FEATURE_SOLUTION`
- `lossless_family__P3_AI_CAPABILITY_TECHNICAL`
- `lossless_family__P5_ENTERPRISE_PRICING`

## Candidate creation family scope

Candidate creation is limited to:

- `P1_PRODUCT`
- `P2_PLATFORM_FEATURE_SOLUTION`
- `P3_AI_CAPABILITY_TECHNICAL`
- `P5_ENTERPRISE_PRICING`

`P4_USE_CASE_INDUSTRY` is intentionally excluded from candidate creation and remains reserved for the later Activity Profile Review material job as context only.

## Write boundary

The job writes exactly:

```text
feature_candidate_inventory
```

## Output boundary

The inventory is an index-only artifact:

```text
artifact_type: feature_candidate_inventory
inventory_version: m8_feature_candidate_inventory_index_v1
derivation_mode: DETERMINISTIC_INDEX_NO_MODEL_NO_EVIDENCE_COMPILATION
```

The inventory must not contain lossless text, excerpts, mechanics proof, activity summaries, archetype proof, surface proof, legal analysis, privacy analysis, registry exposure analysis, risk scoring, or recommendations.

## Files added/updated

- `src/phases/05-activity-profile-review/activity-candidate-inventory.contract.js`
- `src/phases/05-activity-profile-review/activity-profile-review.phase.js`
- `src/phases/05-activity-profile-review/index.js`
- `src/phases/phase-registry.js`
- `scripts/check-activity-candidate-inventory-contract.mjs`
- `scripts/check-phase5-activity-profile-review.mjs`

## Boundary

No runtime service cutover was performed in this pass.

The legacy runtime may still read `lossless_family__P4_USE_CASE_INDUSTRY` until cutover, but the phase-owned Activity Candidate Inventory contract forbids P4 candidate creation.
