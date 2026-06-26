# 00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED

## Agent 3 Target Feature Runtime

Active agent id: `agent_3_target_feature`.

Agent 3 owns two backend phases:

1. `M7_TARGET_PROFILE`
2. `M8_TARGET_FEATURE_PROFILE`

## System order

1. Agent 1A — Scout and Manifest
2. Agent 1B — Extract
3. Agent 2A — Bucket and Routing / M6
4. Agent 2B — Legal Cartography / M9
5. Agent 3 — M7 then M8

## Required order

```text
M7_TARGET_PROFILE
→ save target_profile
→ save target_profile_forensics
→ lock M7_TARGET_PROFILE
→ M8_TARGET_FEATURE_PROFILE
→ save target_feature_profile
→ save target_feature_profile_forensics
→ lock M8_TARGET_FEATURE_PROFILE
→ M10
```

M8 requires both saved M7 artifacts.

M10 requires both saved M8 artifacts.

## M7 outputs

```text
target_profile
target_profile_forensics
```

`target_profile` is material output. `target_profile_forensics` is provenance output.

## M8 outputs

```text
target_feature_profile
target_feature_profile_forensics
```

`target_feature_profile` is material output. `target_feature_profile_forensics` is provenance output.

## Backend output mode

Model responses are strict JSON only and use the exact top-level keys required by the active phase.

## Stop rules

If M7 fails, remain at `M7_TARGET_PROFILE`.

If M8 fails, remain at `M8_TARGET_FEATURE_PROFILE`.
