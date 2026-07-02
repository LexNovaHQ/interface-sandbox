# M10 D-PRIMARY SELECTED-SUPPORT CONTRACT

This file supersedes any older M10 prompt text that asks M10 to read target_profile, target_profile_forensics, feature_candidate_inventory, target_feature_profile_forensics, or whole L-family artifacts.

## Active M10 source contract

M10 may use only:

- source_discovery_handoff
- legal_cartography_index
- target_feature_profile
- lossless_family__D1_SECURITY_TRUST
- lossless_family__D2_SUBPROCESSOR_PRIVACY_CENTER
- lossless_family__D3_DATA_GOVERNANCE_CONTROLS
- lossless_family__D4_DOCS_API_DATA_FLOW
- lossless_family__D5_AI_SAFETY_TRANSPARENCY
- m10_selected_legal_support_packet

## Source priority

1. D1-D5 are primary for M10 field derivation.
2. target_feature_profile is the activity/product spine.
3. legal_cartography_index is navigation and locator context.
4. m10_selected_legal_support_packet is secondary support only when a field cannot be supported from D-family materials.

## Forbidden for M10 model prompt

M10 must not use:

- target_profile
- target_profile_forensics
- feature_candidate_inventory
- target_feature_profile_forensics
- full L1/L2/L4 family artifacts
- any whole legal-family payload

## Failure / limitation rule

If D-family material and the selected support packet cannot support a field, emit a controlled limitation or missing-proof request. Do not ask for whole L-family artifacts and do not block only because whole L-family artifacts are absent.
