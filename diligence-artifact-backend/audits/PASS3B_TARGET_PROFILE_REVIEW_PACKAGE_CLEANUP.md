# Pass 3B — Target Profile Review Prompt / Package Cleanup

Date: 2026-07-05
Branch: runtime-central-tree-pass1

## Scope

This pass cleaned package and prompt behavior for Target Profile Review against the 3A contract lock.

It did not migrate the runner, rewrite the runtime pipeline, or execute a phase smoke.

## Updated package surfaces

- `agent-packages/agent_3_target_feature/AGENT3_RUNTIME_BINDING_PACKET.yaml`
- `agent-packages/agent_3_target_feature/00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md`
- `agent-packages/agent_3_target_feature/02_M7_TARGET_PROFILE_BACKEND_CURRENT.md`
- `agent-packages/agent_3_target_feature/00_VALIDATOR_RULES_INTEGRATED.md`
- `agent-packages/agent_3_target_feature/AGENT3_BACKEND_OUTPUT_CONTRACT.md`
- `references/registry/M7_TARGET_PROFILE_DERIVATION_AUTHORITY.yaml`

## Lock applied

Target Profile Review uses target-family source artifacts as primary source authority.

Target Profile Review may use `legal_signal_derivation_profile` only as a bounded secondary field-signal input for legal notice and jurisdiction fields.

The package now rejects or forbids:

- raw `legal_cartography_index` as model evidence
- legal-governance source families
- old deterministic legal overlay artifact behavior
- direct legal signal use for `target_identity`, `business_context`, or `product_service_wrapper`
- privacy/grievance contact signal-map use
- consent-manager signal-map use

## Validation added

- `scripts/check-target-profile-review-package.mjs`
- `scripts/check-phase3-target-profile-review.mjs`

## Boundary

Target Profile Forensics and Activity Profile Review compatibility remains in the Agent 3 package until their own phase migration passes.
