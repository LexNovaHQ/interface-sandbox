# 00_VALIDATOR_RULES_INTEGRATED
## Universal Validator Kernel for Phased Interface Diligence Agents
### Model-Agnostic Validation: Custom GPT, Gemini API, OpenAI API, Claude, Manual Prompt, Backend Runner

---

# VALIDATOR LOCK

`VAL.RUNTIME.C1` This is the single integrated validator rule file for all phased Interface Diligence agents.

`VAL.RUNTIME.C2` Do not create separate full validator overlays per agent.

`VAL.RUNTIME.C3` Validator customization happens through the prompt-level `RUNTIME_BINDING_PACKET`, the Agent Profile Matrix in `00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md`, and the Agent Validation Profile Matrix in this file.

`VAL.RUNTIME.C4` This validator is model-agnostic. It must work when placed inside a Custom GPT, Gemini API prompt, OpenAI API prompt, Claude prompt, manual copy/paste prompt, or backend-composed prompt.

`VAL.RUNTIME.C5` External Custom GPT instructions, descriptions, UI configuration, chat memory, and system-message-only behavior cannot expand or override this validator.

`VAL.RUNTIME.C6` A validator pass is not a prose judgment. It is a contract-state judgment based on exact run_id, active_agent_id, artifact custody, write order, module output contracts, forbidden output checks, extraction/review gates, forensic separation, and repair routing.

---

# SECTION 1 — VALIDATOR INPUT CONTRACT

## 1.1 Required Inputs

`VAL.S1.C1` Every validator execution must receive or locate the following within the executable prompt payload:

```yaml
validator_required_inputs:
  runtime_binding_packet: required
  resolved_agent_profile_row: required
  run_id: required unless Agent 1 is creating the run
  phase_scope: required
  attempted_artifacts: required
  attempted_phase_lock: required
  active_module_outputs: required
  module_local_gate_results: required
  backend_save_receipts: required where backend writes are performed
```

`VAL.S1.C2` If the `RUNTIME_BINDING_PACKET` is absent, malformed, or inconsistent with the Agent Profile Matrix, the validator must return:

```text
CONTROLLED_FAILURE: RUNTIME_BINDING_PACKET_INVALID
```

`VAL.S1.C3` If `run_id_required: true` and no exact `run_id` is present, the validator must return:

```text
CONTROLLED_FAILURE: RUN_ID_REQUIRED_BUT_MISSING
```

`VAL.S1.C4` The validator must never identify a run by company name, domain, target name, latest run, most recent run, chat memory, or inferred current conversation.

## 1.2 Validator Output Contract

`VAL.S1.C5` The validator must return one of these states only:

```text
PASS
PASS_WITH_LIMITATION
REPAIR_REQUIRED
CONTROLLED_FAILURE
```

`VAL.S1.C6` `PASS` means every required gate for the active agent profile and module validation profile passed.

`VAL.S1.C7` `PASS_WITH_LIMITATION` means all required artifacts are usable, all limitations were lawfully produced after targeted re-extraction or inherited upstream limitation, and downstream use will not be materially misleading.

`VAL.S1.C8` `REPAIR_REQUIRED` means the active agent can repair the defect within its owned module/artifact scope.

`VAL.S1.C9` `CONTROLLED_FAILURE` means the run cannot safely proceed in the current agent because a hard scope, custody, source, binding, hallucination, artifact, order, or permission violation occurred.

`VAL.S1.C10` If the validator returns `REPAIR_REQUIRED` or `CONTROLLED_FAILURE`, terminal rules must not provide a next-agent command.

---

# SECTION 2 — M10 D-PRIMARY SELECTED-SUPPORT VALIDATOR OVERRIDE

This section appears after the M10 module prompt in the assembled prompt stack. It supersedes older M10 wording that refers to target_profile, target_profile_forensics, feature_candidate_inventory, target_feature_profile_forensics, or whole L-family artifacts as active M10 inputs.

## 2.1 Active M10 read set

For `M10_DATA_PROVENANCE`, the allowed active input set is exactly:

- `source_discovery_handoff`
- `legal_cartography_index`
- `target_feature_profile`
- `lossless_family__D1_SECURITY_TRUST`
- `lossless_family__D2_SUBPROCESSOR_PRIVACY_CENTER`
- `lossless_family__D3_DATA_GOVERNANCE_CONTROLS`
- `lossless_family__D4_DOCS_API_DATA_FLOW`
- `lossless_family__D5_AI_SAFETY_TRANSPARENCY`
- `m10_selected_legal_support_packet`

## 2.2 Source priority

- D1-D5 are the primary source for M10 field derivation.
- `target_feature_profile` supplies the activity/product spine.
- `legal_cartography_index` supplies navigation and locator context.
- `m10_selected_legal_support_packet` is secondary support only where D-family material cannot support a field.

## 2.3 Explicit exclusions

M10 must not use these as active inputs:

- `target_profile`
- `target_profile_forensics`
- `feature_candidate_inventory`
- `target_feature_profile_forensics`
- whole L1/L2/L4 legal-family artifacts
- any whole legal-family payload

## 2.4 Failure / limitation rule

If D-family material and the selected support packet cannot support a field, M10 must emit a controlled limitation or missing-proof request. It must not request whole legal-family artifacts and must not block only because whole legal-family artifacts are absent.

---

# SECTION 3 — M10 QR CONTACT ROUTES AND CONSENT MANAGER VALIDATOR LOCK

## 3.1 34-field preservation

M10 must preserve the locked 34 top-level material fields in `data_provenance_profile`.

The validator must reject top-level material fields named:

- `contact_routes`
- `consent_manager_readiness`

These are authorized only as nested material objects inside existing 34-field homes.

## 3.2 Authorized nested homes

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

## 3.3 Required nested shape

When emitted, `contact_routes` must contain:

- `privacy_contact_email`
- `grievance_contact_email`
- `dpo_or_privacy_officer_contact`
- `rights_request_contact_route`
- `evidence_basis`
- `anti_unknown_status`
- `limitation`

When emitted, `consent_manager_readiness` must contain:

- `applicability_signal`
- `public_flow_visible`
- `consent_collection_artefact_route`
- `withdrawal_revocation_grievance_route`
- `third_party_route_signal`
- `evidence_basis`
- `anti_unknown_status`
- `limitation_private_confirmation_required`

`evidence_basis` must be an array of short business-readable basis notes. It must not contain source URLs, copied excerpts, forensic rows, trace, or source IDs.

## 3.4 Registry and source boundary

`contact_routes` must be governed by `DAP.CONTACT.001` through `DAP.CONTACT.005`.

`consent_manager_readiness` must be governed by `DAP.CM.001` through `DAP.CM.007`.

Both objects must use only the M10 active read set defined in Section 2.

## 3.5 Forbidden conclusions

The nested objects must not state legal applicability, compliance, non-compliance, violation, lawful-basis sufficiency, DPA sufficiency, security adequacy, transfer legality, liability, risk level, threat ID, registry row status, or exposure status.
