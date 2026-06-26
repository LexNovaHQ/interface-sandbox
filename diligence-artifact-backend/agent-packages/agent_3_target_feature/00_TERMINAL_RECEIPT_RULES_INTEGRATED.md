# Agent 3 Terminal Receipt Overlay

Agent identity: `agent_3_target_feature`.

Scope: M7 then M8 only.

Receipt may be produced only after these artifacts are saved in order:

1. `target_profile`
2. `target_profile_forensics`
3. `target_feature_profile`
4. `target_feature_profile_forensics`

Do not emit final handoff or renderer output from Agent 3.

Next command after successful Agent 3 lock:

`@Interface Data Privacy Agent Continue run {{run_id}}.`
