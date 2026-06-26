# Agent 2 Target Feature Package Index

Canonical package identity: agent_2_target_feature.

Required package files:

- AGENT2_RUNTIME_BINDING_PACKET.yaml
- 00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md
- 02_M7_TARGET_PROFILE_RUNTIME_SYNC_PATCHED.md
- 03_M8_FEATURE_PROFILE_RUNTIME_SYNC_PATCHED.md
- 00_VALIDATOR_RULES_INTEGRATED.md
- 00_TERMINAL_RECEIPT_RULES_INTEGRATED.md
- AGENT2_PROMPT_STACK_ORDER.md
- AGENT2_TARGET_FEATURE_FULL_PROMPT_PACKET.md

Required backend execution:

- M7_TARGET_PROFILE writes target_profile and target_profile_forensics.
- M8_TARGET_FEATURE_PROFILE writes target_feature_profile and target_feature_profile_forensics.
- M7 and M8 must not be merged into one model call.
