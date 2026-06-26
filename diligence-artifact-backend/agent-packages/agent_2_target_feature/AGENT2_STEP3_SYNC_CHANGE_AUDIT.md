# AGENT2 STEP 3 RUNTIME / VALIDATOR / TERMINAL / BRIDGE SYNC AUDIT

## Scope

Updated Agent 2 package only. M9 is parked. Backend repo is not patched in this step.

## Non-Negotiable Structure Preserved

- M7 and M8 remain separate module prompts.
- M7 runs first and saves `target_profile`, then `target_profile_forensics`.
- M8 runs only after saved M7 outputs and saves `target_feature_profile`, then `target_feature_profile_forensics`.
- `M7_M8` is only an Agent 2 sequence lock label, not a combined model call.
- No one-shot four-artifact output is authorized.

## Files Updated in Step 3

- `AGENT2_RUNTIME_BINDING_PACKET.yaml`
- `00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md`
- `00_VALIDATOR_RULES_INTEGRATED.md`
- `00_TERMINAL_RECEIPT_RULES_INTEGRATED.md`
- `AGENT2_PROMPT_STACK_ORDER.md`
- `AGENT2_TARGET_FEATURE_FULL_PROMPT_PACKET.md`
- minor import/reference sync in M7 and M8 module files
- packet manifest and packet validation regenerated

## Runtime Sync

The runtime now states that Agent 2 is a sequential two-module agent and that backend runners must support, not override, this structure.

## Validator Sync

The validator now validates M7 and M8 separately and then performs an Agent 2 final lock validation. Legacy M6 branch names are no longer required inputs in the 00 validator.

## Terminal Sync

The terminal receipt now withholds the M10 handoff until both M7 and M8 have completed and all four Agent 2 artifacts have saved in order.

## Backend Note

Step 4 still needs backend orchestration changes so the live runner executes M7 and M8 separately rather than using one combined M7_M8 model call.
