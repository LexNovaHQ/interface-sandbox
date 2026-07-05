# 00_VALIDATOR_RULES_INTEGRATED

## Agent 4 / M10 validator lock

This file validates the active M10 packet contract.

## Required validator inputs

```yaml
validator_required_inputs:
  runtime_binding_packet: required
  resolved_agent_profile_row: required
  run_id: required
  phase_scope: required
  attempted_artifacts: required
  attempted_phase_lock: required
  active_module_outputs: required
  module_local_gate_results: required
  backend_save_receipts: required where backend writes are performed
```

The validator may return only:

```text
PASS
PASS_WITH_LIMITATION
REPAIR_REQUIRED
CONTROLLED_FAILURE
```

## M10 direct signal read contract

For `M10_DATA_PROVENANCE`, the allowed active input set is exactly:

- `source_discovery_handoff`
- `legal_cartography_index`
- `legal_signal_derivation_profile`
- `target_feature_profile`
- `lossless_family__D1_SECURITY_TRUST`
- `lossless_family__D2_SUBPROCESSOR_PRIVACY_CENTER`
- `lossless_family__D3_DATA_GOVERNANCE_CONTROLS`
- `lossless_family__D4_DOCS_API_DATA_FLOW`
- `lossless_family__D5_AI_SAFETY_TRANSPARENCY`

## Source priority

- D1-D5 are the primary source for M10 field derivation.
- `target_feature_profile` supplies the activity/product spine.
- `legal_cartography_index` supplies navigation and locator context.
- `legal_signal_derivation_profile` is deterministic support only for DAP.CONTACT and DAP.CM fields.

## Explicit exclusions

M10 must not use these as active inputs:

- `target_profile`
- `target_profile_forensics`
- `feature_candidate_inventory`
- `target_feature_profile_forensics`
- `m10_selected_legal_support_packet`
- whole L1/L2/L3/L4/L5/L6 family artifacts
- any whole family payload outside the active read set

## Limitation rule

If D-family material and `legal_signal_derivation_profile` cannot support a field, M10 must emit a controlled limitation or missing-proof request. It must not request whole L-family artifacts and must not request `m10_selected_legal_support_packet`.

## Nested contact / consent lock

M10 must preserve the locked 34 top-level material fields in `data_provenance_profile`.

The validator must reject top-level material fields named:

- `contact_routes`
- `consent_manager_readiness`

`contact_routes` may appear only inside:

```text
data_provenance_profile.privacy_governance_contact_accountability_signals[].contact_routes
```

`consent_manager_readiness` may appear only inside:

```text
data_provenance_profile.consent_withdrawal_controls[].consent_manager_readiness
```

A readiness row for consent-manager review may appear only inside:

```text
data_provenance_profile.law_regulatory_readiness_matrix[]
```

using:

```text
readiness_area: consent_manager_readiness
```
