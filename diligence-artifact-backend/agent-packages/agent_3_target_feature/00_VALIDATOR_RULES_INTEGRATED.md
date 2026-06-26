# 00_VALIDATOR_RULES_INTEGRATED
## Agent 3 Target Feature Validation Contract — Current Backend

This file governs only `agent_3_target_feature` in the current backend.

## Active agent

Required active agent id: `agent_3_target_feature`.

M7 and M8 ownership belongs only to Agent 3 in this backend package. Legacy target-feature labels, sequence-lock labels, and legacy binding packets must not control execution.

## Non-negotiable execution order

```text
M7_TARGET_PROFILE
→ target_profile saved
→ target_profile_forensics saved
→ M7_TARGET_PROFILE locked
→ M8_TARGET_FEATURE_PROFILE
→ target_feature_profile saved
→ target_feature_profile_forensics saved
→ M8_TARGET_FEATURE_PROFILE locked
→ M10
```

A single combined target/feature model response is invalid.

M8 must not start until both saved M7 artifacts exist.

M10 must not start until both saved M8 artifacts exist.

## Backend output mode

The model response must be strict JSON only.

No markdown.
No same-chat receipt.
No checkpoint prose.
No `<phase_output>` block.
No array wrapper.
No wrapper keys such as `phase_output`, `output`, `result`, `data`, `M7`, `M8`, `M7_TARGET_PROFILE`, or `M8_TARGET_FEATURE_PROFILE`.

## M7 required top-level response

For `M7_TARGET_PROFILE`, return exactly:

```json
{
  "target_profile": {},
  "target_profile_forensics": {}
}
```

`target_profile` must contain exactly these material parent sections:

```text
target_identity
jurisdiction_notice
business_context
product_service_wrapper
target_profile_limitations
```

`target_profile` must not contain:

```text
target_profile_forensics
source_ledger
field_derivation_ledger
runtime_trace
validation_status
lock_status
profile_meta
scratchpad
extraction_capsule
```

`target_profile_forensics` must be separate from `target_profile`.

## M8 required top-level response

For `M8_TARGET_FEATURE_PROFILE`, return exactly:

```json
{
  "target_feature_profile": {},
  "target_feature_profile_forensics": {}
}
```

`target_feature_profile` must contain:

```text
activities
profile_level_limitations
```

`activities` must be an array.

`target_feature_profile` must not contain:

```text
target_feature_profile_forensics
source_ledger
archetype_derivation_ledger
surface_token_derivation_ledger
runtime_trace
validation_status
lock_status
profile_meta
scratchpad
extraction_capsule
```

`target_feature_profile_forensics` must be separate from `target_feature_profile`.

## Ownership boundaries

Agent 3 may read:

```text
source_discovery_handoff
legal_cartography_index
target_profile
target_profile_forensics
lossless_family__T0_ROOT
lossless_family__T1_IDENTITY
lossless_family__T2_LEGAL_IDENTITY
lossless_family__T3_OPERATOR_ENTITY
lossless_family__T4_SUPPORTING_IDENTITY
lossless_family__P1_PRODUCT
lossless_family__P2_PLATFORM_FEATURE_SOLUTION
lossless_family__P3_AI_CAPABILITY_TECHNICAL
lossless_family__P4_USE_CASE_INDUSTRY
lossless_family__P5_ENTERPRISE_PRICING
```

Agent 3 may write only:

```text
target_profile
target_profile_forensics
target_feature_profile
target_feature_profile_forensics
```

No other artifacts may be emitted or saved by Agent 3.
