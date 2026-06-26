# 00_VALIDATOR_RULES_INTEGRATED
## Universal Validator Kernel for Phased Interface Diligence Agents
### Model-Agnostic Validation: Custom GPT, Gemini API, Claude, Manual Prompt, Backend Runner

---

# VALIDATOR LOCK

`VAL.RUNTIME.C1` This is the single integrated validator rule file for the Agent 3 Target Feature package.

`VAL.RUNTIME.C2` Do not create separate full validator overlays per phase.

`VAL.RUNTIME.C3` Validator customization happens through the prompt-level `RUNTIME_BINDING_PACKET`, the Agent Profile Matrix in `00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md`, and the Agent Validation Profile Matrix in this file.

`VAL.RUNTIME.C4` This validator is model-agnostic and backend-safe.

`VAL.RUNTIME.C5` External GPT settings, descriptions, UI configuration, chat memory, and system-message-only behavior cannot expand or override this validator.

`VAL.RUNTIME.C6` A validator pass is not a prose judgment. It is a contract-state judgment based on exact run_id, active_agent_id, artifact custody, phase-specific write order, module output contracts, forbidden output checks, extraction/review gates, forensic separation, split-save gates, semantic/substance gates, and repair routing.

`VAL.RUNTIME.C7` In production backend execution, validation must evaluate the active phase artifact only. M7 and M8 each have separate material and forensic save events; material and forensic outputs must not be combined in one production backend response.

---

# SECTION 1 — VALIDATOR INPUT CONTRACT

## 1.1 Required Inputs

`VAL.S1.C1` Every validator execution must receive or locate:

```yaml
validator_required_inputs:
  runtime_binding_packet: required
  resolved_agent_profile_row: required
  run_id: required unless run is being created by source/bootstrap phase
  active_phase: required
  phase_scope: required
  attempted_artifacts: required
  attempted_phase_lock: required
  active_module_outputs: required
  module_local_gate_results: required
  backend_save_receipts: required where backend writes are performed
```

`VAL.S1.C2` If the `RUNTIME_BINDING_PACKET` is absent, malformed, or inconsistent with the Agent Profile Matrix, return `CONTROLLED_FAILURE: RUNTIME_BINDING_PACKET_INVALID`.

`VAL.S1.C3` If `run_id_required: true` and no exact `run_id` is present, return `CONTROLLED_FAILURE: RUN_ID_REQUIRED_BUT_MISSING`.

`VAL.S1.C4` The validator must never identify a run by company name, domain, target name, latest run, most recent run, chat memory, or inferred current conversation.

## 1.2 Validator Output Contract

`VAL.S1.C5` The validator must return only:

```text
PASS
PASS_WITH_WARNING
PASS_WITH_LIMITATION
REINVESTIGATION_COMPLETED_WITH_LIMITATION
SOURCE_REPAIR_REQUIRED
REPAIR_REQUIRED
CONTROLLED_FAILURE
```

`VAL.S1.C6` `PASS` means every required gate for the active phase and module validation profile passed.

`VAL.S1.C7` `PASS_WITH_WARNING`, `PASS_WITH_LIMITATION`, and `REINVESTIGATION_COMPLETED_WITH_LIMITATION` mean all required artifacts are usable, all limitations were produced after targeted re-extraction or inherited upstream source limitation, and downstream use will not be materially misleading.

`VAL.S1.C8` `SOURCE_REPAIR_REQUIRED` means the defect belongs to Agent 1A, Agent 1B, Agent 2A, or Agent 2B source/routing/legal-cartography custody and cannot be repaired by M7/M8 alone.

`VAL.S1.C9` `REPAIR_REQUIRED` means Agent 3 can repair the defect within its owned M7 or M8 phase/artifact scope.

`VAL.S1.C10` `CONTROLLED_FAILURE` means the run cannot safely proceed in the current phase because a hard scope, custody, source, binding, hallucination, artifact, order, or permission violation occurred.

`VAL.S1.C11` If status is `REPAIR_REQUIRED`, `SOURCE_REPAIR_REQUIRED`, or `CONTROLLED_FAILURE`, terminal rules must not provide a next-phase command.

`VAL.S1.C12` Backend lock-status mapping: PASS → LOCKED; PASS_WITH_WARNING/PASS_WITH_LIMITATION/REINVESTIGATION_COMPLETED_WITH_LIMITATION → LOCKED_WITH_LIMITATIONS; SOURCE_REPAIR_REQUIRED/REPAIR_REQUIRED → REPAIR_REQUIRED; CONTROLLED_FAILURE → CONTROLLED_FAILURE.

---

# SECTION 2 — UNIVERSAL VALIDATOR GATES

## 2.1 Binding and Matrix Gate

`VAL.S2.C1` Validate that `active_agent_id` resolves to exactly one row in the runtime Agent Profile Matrix.

`VAL.S2.C2` Validate that packet fields do not exceed the resolved matrix row for allowed_modules, read_artifacts, write_artifacts_in_order, phase_lock, next_agent_command, and stop_condition.

`VAL.S2.C3` If packet and matrix conflict, return `CONTROLLED_FAILURE: RUNTIME_BINDING_CONFLICT`.

## 2.2 Module Permission Gate

`VAL.S2.C4` Validate that the active agent executed only modules authorized by its Agent Profile Matrix row and the active phase prompt.

`VAL.S2.C5` Any unauthorized module output is `CONTROLLED_FAILURE: UNAUTHORIZED_MODULE_EXECUTION`.

## 2.3 Artifact Custody Gate

`VAL.S2.C6` Validate that every read artifact is authorized for the active agent and active phase.

`VAL.S2.C7` Validate that every written artifact is owned by Agent 3 and authorized for the active phase.

`VAL.S2.C8` Validate that no upstream artifact from Agent 1A, Agent 1B, Agent 2A, Agent 2B, M7, or M8 was mutated outside the owning phase.

`VAL.S2.C9` Any upstream mutation is `CONTROLLED_FAILURE: UPSTREAM_ARTIFACT_MUTATION`.

## 2.4 Backend Save Gate

`VAL.S2.C10` Validate every backend write uses exact `run_id`, exact `agent_id`, exact `phase`, exact `artifact_name`, and payload key `artifact`.

`VAL.S2.C11` The payload key `content` is forbidden for artifact saves.

`VAL.S2.C12` If backend save receipts are required but absent, return `REPAIR_REQUIRED` unless run mode is explicitly offline/manual and backend saving is not being attempted.

`VAL.S2.C13` In production backend execution, a model output containing both the material artifact and its forensic artifact in the same phase response is invalid.

## 2.5 Write Order Gate

`VAL.S2.C14` Validate exact phase-specific write order.

`VAL.S2.C15` Main material artifacts must be saved before forensic/provenance artifacts.

`VAL.S2.C16` Forensics before main output is `CONTROLLED_FAILURE: FORENSICS_BEFORE_MAIN_OUTPUT`.

`VAL.S2.C17` For M7, `target_profile` must be saved from Phase B1 before `target_profile_forensics` may be derived or saved from Phase D.

`VAL.S2.C18` For M8, `target_feature_profile` must be saved from Phase B1 before `target_feature_profile_forensics` may be derived or saved from Phase D.

## 2.6 Extraction / Review Before Application Gate

`VAL.S2.C19` Validate that required extraction/review capsule locked before field/PA/classification application.

`VAL.S2.C20` Route existence is not evidence. A module may not pass if it populated fields solely from URL labels, page titles, source route presence, product names, or model memory.

## 2.7 Targeted Re-Extraction Gate

`VAL.S2.C21` Validate that any limited, weak, omitted, absent, conflicted, not-public, or controlled-with-limitation field/test/candidate was assigned only after targeted item-specific re-extraction/review unless inherited from upstream source coverage.

`VAL.S2.C22` Missing targeted re-extraction for a limited/absent/conflicted item is `REPAIR_REQUIRED` unless the output is materially unusable, in which case return `CONTROLLED_FAILURE`.

## 2.8 Main / Forensics Separation Gate

`VAL.S2.C23` Validate that material outputs do not contain forensic/provenance payloads.

`VAL.S2.C24` Material outputs must not contain source ledgers, source refs, source URLs, extraction capsules, route coverage ledgers, evidence quotes, full field-derivation ledgers, validation logs, debug notes, chain-of-thought, hidden scratchpad, runtime trace, confidence maps, or forensic branches.

`VAL.S2.C25` Forensic outputs must contain the proof families required by the active module prompt.

## 2.9 Forbidden Output Gate

`VAL.S2.C26` Validate that Agent 3 did not emit source-discovery handoff, legal-cartography index, M10 data profile, M11 exposure profile, M12 challenge gate, M13 final handoff, M14 renderer payload, legal conclusions, privacy conclusions, exposure statuses, or remediation routes.

## 2.10 Anti-Hallucination Gate

`VAL.S2.C27` Hard-fail unsupported invention of source URL, source title, source content, legal entity, jurisdiction, governing law, venue, product capability, API behavior, feature mechanics, autonomy/human-control signal, archetype, surface token, data flow, registry trigger, threat ID, legal conclusion, or privacy conclusion.

`VAL.S2.C28` Use of model memory or outside knowledge as source support is forbidden for M7/M8.

## 2.11 Anti-Laziness Gate

`VAL.S2.C29` Hard-fail schema-shaped but unsupported output, generic limitation buckets, placeholder values, empty arrays without limitation, “not enough information” without targeted re-extraction, route labels copied as facts, and route existence treated as field evidence.

---

# SECTION 3 — AGENT VALIDATION PROFILE MATRIX

## 3.1 Matrix Rule

`VAL.S3.C1` Agent-specific validation is activated by `active_agent_id` and active phase.

`VAL.S3.C2` Agent validation rows may narrow but cannot expand the universal validator gates.

`VAL.S3.C3` Agent 1A, Agent 1B, Agent 2A, Agent 2B, Agent 3, Agent 4, and Agent 5 rows are active design rows for the current chain. Agent 6 and Agent 7 remain placeholders until their contracts are locked.

## 3.2 Locked Agent Validation Matrix

| active_agent_id | validator_profile | Required Checks |
|---|---|---|
| `agent_1a_url_manifest` | `agent_1a_url_manifest_validator` | URL manifest exists; no downstream artifacts; URL manifest lock only. |
| `agent_1b_extract` | `agent_1b_extract_validator` | Lossless family artifacts and `source_family_index` exist; no downstream profiles; extraction lock only. |
| `agent_2a_bucket_routing` | `agent_2a_m6_validator` | `source_discovery_handoff` exists; bucket family index present; no downstream profile objects; M6 bucket-routing lock only. |
| `agent_2b_m9` | `agent_2b_m9_validator` | `legal_cartography_index` exists; legal/governance lossless buckets used; no legal advice; M9 lock only. |
| `agent_3_target_feature` / M7 | `agent_3_m7_validator` | M7 checks in Section 4; source extraction before field derivation; Phase B1 material-only output/save; Phase D forensic-only output/save; no M8/M10/M11 work; no combined material+forensic output. |
| `agent_3_target_feature` / M8 | `agent_3_m8_validator` | M8 checks in Section 5; saved M7 artifacts required; source extraction before PA/classification derivation; Phase B1 material-only output/save; Phase D forensic-only output/save; classification matrix row proof; no M10/M11 work. |
| `agent_4_data_privacy` | `agent_4_m10_validator` | M10 is downstream; Agent 3 may not execute it. |
| `agent_5_exposure_registry` | `agent_5_m11_validator` | M11 is downstream; Agent 3 may not execute it. |
| `agent_6_challenge_handoff` | `agent_6_m12_m13_validator_PLACEHOLDER` | Placeholder only. |
| `agent_7_terminal_renderer` | `agent_7_m14_validator_PLACEHOLDER` | Placeholder only. |

---

# SECTION 4 — AGENT 3 / M7 VALIDATION PROFILE

## 4.1 M7 Required Inputs

`VAL.M7.C1` Validate that M7 read-only inputs include `source_discovery_handoff`, `legal_cartography_index`, selected TP.* authority, M7 material selector, and M6-approved target/legal route families and limitations.

`VAL.M7.C2` Validate that M7 did not create, discover, search, browse, follow unapproved links, or use non-Agent-1/2 source material.

## 4.2 M7 Extraction Gate

`VAL.M7.C3` Validate that the M7 Target Source Extraction Capsule completed before field application.

`VAL.M7.C4` Validate 100% coverage of approved M7 route-family URLs or explicit broken/gated/duplicate/non-public/out-of-scope/upstream-repair status.

`VAL.M7.C5` Validate that source text came from loaded target/legal lossless family artifacts, not route labels.

## 4.3 M7 Material Output Gate

`VAL.M7.C6` `target_profile` must contain exactly five parent sections: `target_identity`, `jurisdiction_notice`, `business_context`, `product_service_wrapper`, and `target_profile_limitations`.

`VAL.M7.C7` `target_profile` must contain exactly eighteen material fields.

`VAL.M7.C8` Reject `profile_meta`, `lock_status`, `target_profile_forensics`, source ledgers, traces, old flat M7 keys, feature fields, data fields, registry fields, legal-risk fields, or final handoff fields inside `target_profile`.

## 4.4 M7 FD / Forensics Gate

`VAL.M7.C9` Validate that populated fields were derived through selected TP.* rows mapped in the M7 material selector.

`VAL.M7.C10` Validate that non-selected TP.* rows were not executed as material fields.

`VAL.M7.C11` Validate that `target_profile_forensics` exists only after saved `target_profile` and contains the required M7 forensic proof branches.

`VAL.M7.C12` Validate that every selected TP.* row has workpad/forensic outcome with source basis, outcome, fallback/limitation where applicable, and forbidden-inference check.

## 4.5 M7 Local Status Gate

`VAL.M7.C13` If M7 returns `REPAIR_REQUIRED` or `SOURCE_REPAIR_REQUIRED`, Agent 3 must not proceed to M8.

`VAL.M7.C14` If M7 returns a limitation/warning outcome, Agent 3 may proceed only if limitations are controlled, ledgered, and safe for M8 use.

---

# SECTION 5 — AGENT 3 / M8 VALIDATION PROFILE

## 5.1 M8 Required Inputs

`VAL.M8.C1` Validate that M8 receives `source_discovery_handoff`, saved `target_profile`, saved `target_profile_forensics`, product-family lossless artifacts P1-P5, selected PA.* authority, forensic annexure authority, and classification matrix authority.

`VAL.M8.C2` Validate that M8 did not execute M6, M7 material mutation, M9, M10, M11, M12, M13, or M14 work.

## 5.2 M8 Extraction Gate

`VAL.M8.C3` Validate that Product / Activity Source Extraction Capsule completed before PA application.

`VAL.M8.C4` Validate 100% coverage of approved Product / Activity route-family URLs before material derivation.

`VAL.M8.C5` Validate five extraction parents: Activity Candidate Extraction, Mechanics Proof Extraction, Archetype Signal Extraction, Surface Signal Extraction, and Routing Limitation Extraction.

`VAL.M8.C6` Validate that route labels, product names, API names, pricing tiers, slogans, or page titles were not treated as activities without mechanics proof.

## 5.3 M8 Material Output Gate

`VAL.M8.C7` `target_feature_profile` must contain exactly two top-level keys: `activities` and `profile_level_limitations`.

`VAL.M8.C8` Every emitted activity must contain exactly the locked 12 keys from M8.S15.

`VAL.M8.C9` The key `surface_tokens` is forbidden; valid key is `surface_context_tokens`.

`VAL.M8.C10` Every emitted activity must have mechanics proof, at least one archetype code, archetype proof, present `surface_context_tokens[]`, and surface proof/routing limitation handling.

`VAL.M8.C11` Empty `surface_context_tokens[]` is allowed only after all ten surface tests and targeted re-extraction fail to support a surface token, with limitation recorded.

`VAL.M8.C12` `target_feature_profile` must not contain source URLs, evidence quotes, confidence scores, derivation ledgers, raw extraction fragments, route coverage ledgers, validation logs, extraction capsule, chain-of-thought, or forensic material.

## 5.4 M8 Archetype / Surface Gate

`VAL.M8.C13` Validate every mechanically valid emitted activity was tested against all 11 archetypes, including `UNI` and the ten behavior codes.

`VAL.M8.C14` Validate that all evidence-supported archetypes were emitted and unsupported archetypes were rejected or ledgered.

`VAL.M8.C15` Validate that no archetype was forced merely to satisfy schema.

`VAL.M8.C16` Validate every emitted activity was tested against all 10 surface tokens.

`VAL.M8.C17` Validate that sensitive, biometric, financial, employment, minors, PII, infrastructure, and safety/physical surfaces are not inferred without explicit source support.

## 5.5 M8 FD / Forensics Gate

`VAL.M8.C18` Validate PA.* registry authority was used as derivation authority, not as a 51-row material output schema.

`VAL.M8.C19` Validate selected PA rows support the 12-field routing-first activity card.

`VAL.M8.C20` Validate `target_feature_profile_forensics` exists only after saved `target_feature_profile` and contains required M8 forensic proof branches.

`VAL.M8.C21` Validate every selected PA.* row and every classification test has a workpad/forensic outcome with source basis, outcome, limitation/fallback where applicable, and forbidden-inference check.

## 5.6 M8 Local Status Gate

`VAL.M8.C22` If M8 returns `REPAIR_REQUIRED` or `SOURCE_REPAIR_REQUIRED`, Agent 3 must not lock target-feature and must not advance to M10.

`VAL.M8.C23` If M8 returns a limitation/warning outcome, Agent 3 may lock only if limitations are recorded and downstream M10/M11 use remains safe.

---

# SECTION 6 — AGENT 3 SEQUENTIAL TARGET-FEATURE PHASE VALIDATION

`VAL.A3.C1` Agent 3 may finish only if all four required artifacts exist and were saved in order: `target_profile`, `target_profile_forensics`, `target_feature_profile`, `target_feature_profile_forensics`.

`VAL.A3.C2` Agent 3 may advance from M7 to M8 only after M7 material and forensic artifacts pass and are saved.

`VAL.A3.C3` Agent 3 may advance to M10 only after M8 material and forensic artifacts pass and are saved.

`VAL.A3.C4` Agent 3 must not mutate Agent 1A, Agent 1B, Agent 2A, or Agent 2B artifacts.

`VAL.A3.C5` If M7 or M8 requires source-universe repair, route to the owning upstream source/routing/legal-cartography phase; do not invent, search, or proceed.

---

# SECTION 7 — PLACEHOLDER PRODUCTION GUARD

`VAL.PG.C1` Downstream Agent 6 and Agent 7 validator rows are placeholder rows.

`VAL.PG.C2` If a placeholder-only downstream agent is invoked without a separately locked module contract, return `CONTROLLED_FAILURE: VALIDATOR_PROFILE_NOT_LOCKED_FOR_PRODUCTION`.

`VAL.PG.C3` This guard prevents fake universal validation for modules that have not been locked.

---

# SECTION 8 — VALIDATOR RESULT FORMAT

`VAL.RF.C1` Validator result must be machine-compact and must not expose chain-of-thought.

```json
{
  "validator_result": {
    "active_agent_id": "",
    "active_phase": "",
    "phase_scope": "",
    "run_id": "",
    "status": "PASS | PASS_WITH_WARNING | PASS_WITH_LIMITATION | REINVESTIGATION_COMPLETED_WITH_LIMITATION | SOURCE_REPAIR_REQUIRED | REPAIR_REQUIRED | CONTROLLED_FAILURE",
    "lock_allowed": true,
    "next_agent_command_allowed": true,
    "passed_gates": [],
    "failed_gates": [],
    "repair_owner": "",
    "repair_scope": "",
    "blocking_reasons": [],
    "limitations": []
  }
}
```

`VAL.RF.C2` If status is `REPAIR_REQUIRED`, `SOURCE_REPAIR_REQUIRED`, or `CONTROLLED_FAILURE`, `lock_allowed` and `next_agent_command_allowed` must be false.

`VAL.RF.C3` If status is `PASS_WITH_WARNING`, `PASS_WITH_LIMITATION`, or `REINVESTIGATION_COMPLETED_WITH_LIMITATION`, `limitations[]` or warnings must not be empty.

`VAL.RF.C4` Validator results may be saved in backend only where the active agent schema permits it. They must not be inserted into material profile artifacts.

---

# VALIDATOR FINAL LOCK

`VAL.LOCK.C1` This integrated validator is subordinate to the integrated 00 runtime and the active module output contracts, but it is the governing validation rule file for Agent 3 target-feature validation.

`VAL.LOCK.C2` If this validator conflicts with the runtime, the runtime controls scope and permission; the validator controls pass/fail criteria inside that scope.

`VAL.LOCK.C3` If this validator conflicts with an active module contract, the stricter no-hallucination, no-scope-drift, no-forensic-clumping, no-unauthorized-source, no-skipped-extraction, no-skipped-re-extraction, schema, semantic/substance, custody, emission, and save-order rule controls.
