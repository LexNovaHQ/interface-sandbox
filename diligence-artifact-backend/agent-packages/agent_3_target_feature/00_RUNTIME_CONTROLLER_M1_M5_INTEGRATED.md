# 00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED
## Agent 3 Target Feature Runtime — Current Backend Contract

This file governs only the current backend Agent 3 package.

## Current system order

1. Agent 1A — Scout and Manifest
2. Agent 1B — Extract
3. Agent 2A — Bucket and Routing / M6
4. Agent 2B — Legal Cartography / M9
5. Agent 3 — Target Profile / M7, then Target Feature Profile / M8

## Active identity

`active_agent_id: agent_3_target_feature`

Agent 3 is the only owner of M7 and M8 in the current backend.

Old labels such as `agent_2_target_feature`, `Agent 2 / M7`, `Agent 2 / M8`, `Agent 2 sequence lock`, and `AGENT2_RUNTIME_BINDING_PACKET.yaml` are deprecated and must not control execution.

## Mandatory module order

Agent 3 must run as two separate backend model phases:

```text
M7_TARGET_PROFILE
→ validate M7 output
→ save target_profile
→ save target_profile_forensics
→ lock M7_TARGET_PROFILE
→ advance to M8_TARGET_FEATURE_PROFILE
→ validate M8 output
→ save target_feature_profile
→ save target_feature_profile_forensics
→ lock M8_TARGET_FEATURE_PROFILE
→ advance to M10
```

M7 and M8 must never be merged into one model call.

M8 must never start unless both `target_profile` and `target_profile_forensics` exist as saved artifacts.

## M7 write order

The M7 phase writes exactly:

```text
1. target_profile
2. target_profile_forensics
```

`target_profile` is the material profile. It must not contain forensics, source ledgers, derivation ledgers, extraction capsules, runtime traces, validation status, lock status, debug branches, or same-chat receipt material.

`target_profile_forensics` is the separate provenance/forensic artifact. It may be saved only after `target_profile` has passed validation and been prepared for save.

## M8 write order

The M8 phase writes exactly:

```text
1. target_feature_profile
2. target_feature_profile_forensics
```

`target_feature_profile` is the material activity/profile artifact. It must not contain forensics, source ledgers, derivation ledgers, extraction capsules, runtime traces, validation status, lock status, debug branches, or same-chat receipt material.

`target_feature_profile_forensics` is the separate provenance/forensic artifact. It may be saved only after `target_feature_profile` has passed validation and been prepared for save.

## Backend execution output rule

For backend execution, the model must return strict JSON only.

No markdown.
No `<phase_output>` block.
No checkpoint prose.
No terminal receipt.
No next-agent command.
No array wrapper.
No `phase_output`, `output`, `result`, `data`, `M7`, `M8`, `M7_TARGET_PROFILE`, or `M8_TARGET_FEATURE_PROFILE` wrapper.

## Forbidden modules

Agent 3 must not execute M6, M9, M10, M11, M12, M13, M14, compiler, or renderer work.

## Forbidden writes

Agent 3 must not write:

- `source_discovery_handoff`
- `legal_cartography_index`
- `data_provenance_profile`
- `exposure_registry_profile`
- `challenge_gate`
- `final_output_handoff`
- `renderer_payload`

## Stop rule

If M7 fails, stop at `M7_TARGET_PROFILE`. Do not advance to M8.

If M8 fails, stop at `M8_TARGET_FEATURE_PROFILE`. Preserve saved M7 artifacts. Do not advance to M10.

If M7 passes, only then may the backend set `current_phase` to `M8_TARGET_FEATURE_PROFILE`.

If M8 passes, only then may the backend set `current_phase` to `M10`.
