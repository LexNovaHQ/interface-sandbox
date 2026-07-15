# Pass 5E — Activity Profile Review Material Contract Lock

Date: 2026-07-05
Branch: runtime-central-tree-pass1

## Scope

This pass locks the phase-owned Activity Profile Review material contract.

It does not add the Activity Profile Review material runner, does not cut over runtime service dispatch for the material job, and does not migrate Activity Profile Forensics or downstream phases.

## Central phase

```text
ACTIVITY_PROFILE_REVIEW
```

## Locked material job

```text
ACTIVITY_PROFILE_REVIEW_MATERIAL
```

Compatibility internal job ID retained:

```text
M8_TARGET_FEATURE_PROFILE
```

## Read boundary

The material contract reads exactly:

- `source_discovery_handoff`
- `target_profile`
- `target_profile_forensics`
- `feature_candidate_inventory`
- `lossless_family__P1_PRODUCT`
- `lossless_family__P2_PLATFORM_FEATURE_SOLUTION`
- `lossless_family__P3_AI_CAPABILITY_TECHNICAL`
- `lossless_family__P4_USE_CASE_INDUSTRY`
- `lossless_family__P5_ENTERPRISE_PRICING`

`feature_candidate_inventory` is the candidate universe.

P1-P5 lossless artifacts are evidence for mechanics, grouping, archetype derivation, surface-token derivation, limitations, and commercial availability posture.

P4 is allowed as Activity Profile Review context, but it does not create candidate existence outside the saved inventory.

## Write boundary

The material job writes exactly:

```text
target_feature_profile
```

## Output boundary

The material output must be strict JSON with exactly one top-level key:

```text
target_feature_profile
```

`target_feature_profile` must contain exactly:

- `activities`
- `commercial_availability_posture`
- `profile_level_limitations`

Every activity must use the locked 12-field activity card.

`commercial_availability_posture` must contain exactly:

- `posture`
- `free_trial_freemium_signal`
- `beta_pilot_early_access_signal`
- `paid_production_enterprise_plan_signal`
- `evidence_basis`
- `limitation`

## Agent package sync

This pass updates:

```text
agent-packages/agent_3_target_feature/AGENT3_RUNTIME_BINDING_PACKET.yaml
```

The runtime binding now points Activity Profile Review material output to:

- `03_M8_FEATURE_PROFILE_BACKEND_CURRENT.md`
- `AGENT3_BACKEND_OUTPUT_CONTRACT.md`
- `src/phases/05-activity-profile-review/activity-profile-review.contract.js`

## Validation added

Added:

```text
scripts/check-activity-profile-review-contract.mjs
```

The check compares:

- phase-owned material contract
- runtime pipeline contract for `M8_TARGET_FEATURE_PROFILE`
- runtime prompt stack
- runtime reference files
- Agent 3 runtime binding packet
- active Activity Profile Review package
- backend output contract
- active M8 validator

It also validates one passing material fixture and failure cases for forensic leakage, missing commercial availability posture, and missing archetype codes.

## Boundary

Activity Profile Review material runner and runtime cutover remain pending.
