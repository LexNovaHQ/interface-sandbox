# M10 D-PRIMARY DIRECT LEGAL SIGNAL CONTRACT

This file supersedes older M10 prompt text that asks M10 to read target_profile, target_profile_forensics, feature_candidate_inventory, target_feature_profile_forensics, whole L-family artifacts, or selected legal-support packets.

## Active M10 source contract

M10 may use only:

- source_discovery_handoff
- legal_cartography_index
- legal_signal_derivation_profile
- target_feature_profile
- lossless_family__D1_SECURITY_TRUST
- lossless_family__D2_SUBPROCESSOR_PRIVACY_CENTER
- lossless_family__D3_DATA_GOVERNANCE_CONTROLS
- lossless_family__D4_DOCS_API_DATA_FLOW
- lossless_family__D5_AI_SAFETY_TRANSPARENCY

## Source priority

1. D1-D5 are primary for M10 field derivation.
2. target_feature_profile is the activity/product spine.
3. legal_cartography_index is navigation and locator context.
4. legal_signal_derivation_profile is deterministic support only for DAP.CONTACT and DAP.CM fields.

## Forbidden for M10 model prompt

M10 must not use:

- target_profile
- target_profile_forensics
- feature_candidate_inventory
- target_feature_profile_forensics
- full L1/L2/L3/L4/L5/L6 family artifacts
- any whole legal-family payload
- m10_selected_legal_support_packet

## Failure / limitation rule

If D-family material and legal_signal_derivation_profile cannot support a field, emit a controlled limitation or missing-proof request. Do not ask for whole L-family artifacts, do not ask for m10_selected_legal_support_packet, and do not block only because whole L-family artifacts are absent.
