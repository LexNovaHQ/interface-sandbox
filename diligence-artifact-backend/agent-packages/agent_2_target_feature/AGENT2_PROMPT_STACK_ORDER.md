# Agent 2 Prompt Stack Order

Use this order for any Custom GPT, model/API runner, or backend-composed prompt:

1. `AGENT2_RUNTIME_BINDING_PACKET.yaml`
2. `00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md`
3. `02_M7_TARGET_PROFILE_RUNTIME_SYNC_PATCHED.md`
4. `03_M8_FEATURE_PROFILE_RUNTIME_SYNC_PATCHED.md`
5. `00_VALIDATOR_RULES_INTEGRATED.md`
6. `00_TERMINAL_RECEIPT_RULES_INTEGRATED.md`

Execution is sequential inside the same Agent 2 packet:

```text
M7_TARGET_PROFILE
→ target_profile
→ target_profile_forensics
→ M8_TARGET_FEATURE_PROFILE
→ target_feature_profile
→ target_feature_profile_forensics
→ Agent 2 M7_M8 sequence lock
```

For single-prompt execution, use:

- `AGENT2_TARGET_FEATURE_FULL_PROMPT_PACKET.md`

Operator command:

```text
Continue run {{run_id}}
```
