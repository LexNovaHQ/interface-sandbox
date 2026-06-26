# 00_VALIDATOR_RULES_INTEGRATED
## Agent 3 Target Feature Sequential Validation Contract

# VALIDATOR LOCK

`VAL.RUNTIME.C1` This file is the final Agent 3 validation overlay. It supports the module-local validators inside M7 and M8. It does not replace them.

`VAL.RUNTIME.C2` Agent 3 must execute M7 and M8 separately. A single model response containing all four Agent 3 artifacts is invalid.

`VAL.RUNTIME.C3` The backend supports the agent packet. The backend must not merge M7 and M8, compress their outputs into one call, or delay M7 saving until after M8.

`VAL.RUNTIME.C4` Validation is sequential: validate M7 first, save M7 artifacts, then validate M8, save M8 artifacts, then perform the Agent 3 aggregate sequence lock check.

# SECTION 1 — UNIVERSAL AGENT 3 GATES

`VAL.S1.C1` Required runtime packet: `AGENT2_RUNTIME_BINDING_PACKET.yaml` until the physical file-name migration is separately performed.

`VAL.S1.C2` Required active agent id: `agent_3_target_feature`.

`VAL.S1.C3` Allowed modules only: `M7_TARGET_PROFILE` and `M8_TARGET_FEATURE_PROFILE`.

`VAL.S1.C4` M7 may write only `target_profile` and `target_profile_forensics`.

`VAL.S1.C5` M8 may write only `target_feature_profile` and `target_feature_profile_forensics`.

`VAL.S1.C6` M9 belongs to Agent 2B and must not run inside Agent 3.

`VAL.S1.C7` Agent 3 must not emit M10, M11, M12, compiler, final handoff, or renderer artifacts.
