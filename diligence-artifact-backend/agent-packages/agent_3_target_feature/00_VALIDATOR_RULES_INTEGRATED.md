# 00_VALIDATOR_RULES_INTEGRATED
## Agent 3 Target Feature Validation Contract — Current Backend

This file governs only `agent_3_target_feature` in the current backend.

## Active agent

Required active agent id: `agent_3_target_feature`.

Deprecated labels are forbidden: `agent_2_target_feature`, `Agent 2 / M7`, `Agent 2 / M8`, `Agent 2 sequence lock`, and `AGENT2_RUNTIME_BINDING_PACKET.yaml`.

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

A single combined M7/M8 model response is invalid.

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

- `source_discovery_handoff`
- `legal_cartography_index`
- target-family lossless artifacts for M7
- saved `target_profile` and `target_profile_forensics` for M8
- product/activity family lossless artifacts for M8

Agent 3 may write only:

- `target_profile`
- `target_profile_forensics`
- `target_feature_profile`
- `target_feature_profile_forensics`

Agent 3 must not write source, legal, data, exposure, challenge, final handoff, compiler, or renderer artifacts.

## Failure routing

If M7 validation fails, repair M7 only and do not run M8.

If M8 validation fails, preserve M7 artifacts, repair M8 only, and do not run M10.
