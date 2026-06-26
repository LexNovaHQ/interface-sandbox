# 00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED
## Agent 3 Runtime Controller Overlay

This file binds the target-feature package to the locked agentic order:

1. Agent 1A — Scout and Manifest
2. Agent 1B — Extract
3. Agent 2A — Bucket and Routing
4. Agent 2B — M9 Legal Cartography
5. Agent 3 — M7 Target Profile + M8 Target Feature Profile

Agent 3 identity: `agent_3_target_feature`.

Agent 3 allowed modules:

- `M7_TARGET_PROFILE`
- `M8_TARGET_FEATURE_PROFILE`

Agent 3 execution order:

```text
M7_TARGET_PROFILE
→ save target_profile
→ save target_profile_forensics
→ M8_TARGET_FEATURE_PROFILE
→ save target_feature_profile
→ save target_feature_profile_forensics
→ M7_M8 sequence lock
```

Backend support rule: backend may load files, validate JSON, save artifacts, and advance phases. Backend must not merge M7 and M8 into one model call.

M9 belongs to Agent 2B. Do not run M9 inside Agent 3.
