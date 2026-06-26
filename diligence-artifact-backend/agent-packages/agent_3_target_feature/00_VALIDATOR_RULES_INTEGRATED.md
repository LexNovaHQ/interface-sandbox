# 00_VALIDATOR_RULES_INTEGRATED
## Universal Validator Kernel for Phased Interface Diligence Agents
### Model-Agnostic Validation: Custom GPT, Gemini API, OpenAI API, Claude, Manual Prompt, Backend Runner

---

# VALIDATOR LOCK

`VAL.RUNTIME.C1` This is the single integrated validator rule file for all phased Interface Diligence agents.

`VAL.RUNTIME.C2` Do not create separate full validator overlays per agent.

`VAL.RUNTIME.C3` Validator customization happens through the prompt-level `RUNTIME_BINDING_PACKET`, the Agent Profile Matrix in `00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md`, and the Agent Validation Profile Matrix in this file.

`VAL.RUNTIME.C4` This validator is model-agnostic. It must work when placed inside a Custom GPT, Gemini API prompt, Claude prompt, manual copy/paste prompt, or backend-composed prompt.

`VAL.RUNTIME.C5` External Custom GPT instructions, descriptions, UI configuration, chat memory, and system-message-only behavior cannot expand or override this validator.

`VAL.RUNTIME.C6` A validator pass is not a prose judgment. It is a contract-state judgment based on exact run_id, active_agent_id, artifact custody, phase-specific write order, module output contracts, forbidden output checks, extraction/review gates, forensic separation, split-save gates, and repair routing.

`VAL.RUNTIME.C7` In production backend execution, validation must evaluate the active phase artifact only. M7 and M8 each have separate material and forensic save events; material and forensic outputs must not be combined in one production backend response.

---

# SECTION 1 — VALIDATOR INPUT CONTRACT

## 1.1 Required Inputs

`VAL.S1.C1` Every validator execution must receive or locate the following within the executable prompt payload:

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
PASS_WITH_WARNING
PASS_WITH_LIMITATION
REINVESTIGATION_COMPLETED_WITH_LIMITATION
SOURCE_REPAIR_REQUIRED
REPAIR_REQUIRED
CONTROLLED_FAILURE
```

`VAL.S1.C6` `PASS` means every required gate for the active phase and module validation profile passed.

`VAL.S1.C7` `PASS_WITH_WARNING`, `PASS_WITH_LIMITATION`, and `REINVESTIGATION_COMPLETED_WITH_LIMITATION` mean all required artifacts are usable, all limitations were produced after targeted re-extraction or inherited upstream source limitation, and downstream use will not be materially misleading.

`VAL.S1.C8` `SOURCE_REPAIR_REQUIRED` means the defect belongs to the source/routing universe or a missing/corrupt upstream artifact and cannot be repaired by the active module alone.

`VAL.S1.C9` `REPAIR_REQUIRED` means the active module can repair the defect within its owned phase/artifact scope.

`VAL.S1.C10` `CONTROLLED_FAILURE` means the run cannot safely proceed in the current phase because a hard scope, custody, source, binding, hallucination, artifact, order, or permission violation occurred.

`VAL.S1.C11` If the validator returns `REPAIR_REQUIRED`, `SOURCE_REPAIR_REQUIRED`, or `CONTROLLED_FAILURE`, terminal rules must not provide a next-phase command.

`VAL.S1.C12` Backend lock-status mapping:

```text
PASS -> LOCKED
PASS_WITH_WARNING -> LOCKED_WITH_LIMITATIONS
PASS_WITH_LIMITATION -> LOCKED_WITH_LIMITATIONS
REINVESTIGATION_COMPLETED_WITH_LIMITATION -> LOCKED_WITH_LIMITATIONS
SOURCE_REPAIR_REQUIRED -> REPAIR_REQUIRED
REPAIR_REQUIRED -> REPAIR_REQUIRED
CONTROLLED_FAILURE -> CONTROLLED_FAILURE
```

---

# SECTION 2 — UNIVERSAL VALIDATOR GATES

## 2.1 Binding and Matrix Gate

`VAL.S2.C1` Validate that `active_agent_id` resolves to exactly one row in `00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md` Section 2 Agent Profile Matrix.

`VAL.S2.C2` Validate that packet fields do not exceed the resolved matrix row for:

```text
allowed_modules
read_artifacts
write_artifacts_in_order
phase_lock_or_phase_locks
next_agent_command
stop_condition
```

`VAL.S2.C3` If packet and matrix conflict, return:

```text
CONTROLLED_FAILURE: RUNTIME_BINDING_CONFLICT
```

## 2.2 Module Permission Gate

`VAL.S2.C4` Validate that the active agent executed only modules authorized by its Agent Profile Matrix row and the active phase prompt.

`VAL.S2.C5` Any unauthorized module output is a hard failure.

```text
CONTROLLED_FAILURE: UNAUTHORIZED_MODULE_EXECUTION
```

## 2.3 Artifact Custody Gate

`VAL.S2.C6` Validate that every read artifact is authorized for the active agent and active phase.

`VAL.S2.C7` Validate that every written artifact is owned by the active agent and authorized for the active phase.

`VAL.S2.C8` Validate that no upstream artifact was mutated, overwritten, backfilled, repaired, or silently regenerated by a downstream phase.

`VAL.S2.C9` Any upstream mutation is a hard failure.

```text
CONTROLLED_FAILURE: UPSTREAM_ARTIFACT_MUTATION
```

## 2.4 Backend Save Gate

`VAL.S2.C10` Validate every backend write uses exact `run_id`, exact `agent_id`, exact `phase`, exact `artifact_name`, and the payload key `artifact`.

`VAL.S2.C11` The payload key `content` is forbidden for artifact saves.

`VAL.S2.C12` If backend save receipts are required but absent, return `REPAIR_REQUIRED` unless the run mode is explicitly offline/manual and backend saving is not being attempted.

`VAL.S2.C13` In production backend execution, a model output containing both the material artifact and its forensic artifact in the same phase response is invalid.

## 2.5 Write Order Gate

`VAL.S2.C14` Validate that artifacts are written in the exact phase-specific `write_artifacts_in_order` sequence resolved from the Agent Profile Matrix and active phase prompt.

`VAL.S2.C15` Main material artifacts must be saved before forensic/provenance artifacts.

`VAL.S2.C16` A forensic/provenance artifact saved before the corresponding main artifact is a hard failure.

```text
CONTROLLED_FAILURE: FORENSICS_BEFORE_MAIN_OUTPUT
```

`VAL.S2.C17` For M7, `target_profile` must be saved from Phase B1 before `target_profile_forensics` may be derived or saved from Phase D.

`VAL.S2.C18` For M8, `target_feature_profile` must be saved from Phase B1 before `target_feature_profile_forensics` may be derived or saved from Phase D.

## 2.6 Extraction / Review Before Application Gate

`VAL.S2.C19` If a module requires extraction or review before field/registry/application logic, validate the checkpoint or local gate proving it occurred before application.

`VAL.S2.C20` Route existence is not evidence. A module may not pass if it populated fields solely from URL labels, page titles, source route presence, product names, or general model knowledge.

## 2.7 Targeted Re-Extraction Gate

`VAL.S2.C21` Validate that any `FIELD_LIMITED`, `FIELD_NOT_PUBLIC`, `FIELD_CONFLICTED`, `FIELD_CONFLICTING`, or `FIELD_NOT_FOUND` status was assigned only after targeted field-specific re-extraction/review, unless the limitation was inherited from an upstream route/source coverage state.

`VAL.S2.C22` Missing targeted re-extraction for a limited/absent/conflicted field is `REPAIR_REQUIRED` unless the affected output is materially unusable, in which case return `CONTROLLED_FAILURE`.

## 2.8 Main / Forensics Separation Gate

`VAL.S2.C23` Validate that material outputs do not contain forensic/provenance payloads.

`VAL.S2.C24` Material outputs must not contain source ledgers, source refs, source URLs, extraction capsules, route coverage ledgers, evidence quotes, full field-derivation ledgers, validation logs, debug notes, chain-of-thought, hidden scratchpad, runtime trace, confidence maps, or forensic branches.

`VAL.S2.C25` Forensic/provenance outputs must contain the proof families required by the active module prompt.

## 2.9 Forbidden Output Gate

`VAL.S2.C26` Validate that the active agent did not emit artifacts, objects, terminal blocks, registry rows, renderer payloads, challenge gates, final handoff JSON, legal conclusions, privacy readiness conclusions, exposure statuses, or remediation routes outside its active profile.

## 2.10 Anti-Hallucination Gate

`VAL.S2.C27` Hard-fail unsupported invention of:

```text
source URL
source title
source content
legal entity
jurisdiction
governing law
venue
product capability
API behavior
feature mechanics
autonomy / human-control signal
archetype
surface token
data flow
registry trigger
threat ID
legal conclusion
privacy conclusion
```

`VAL.S2.C28` Use of model memory or outside knowledge as source support is forbidden unless the active module expressly permits non-source background reasoning. M7/M8 do not permit it.

## 2.11 Anti-Laziness Gate

`VAL.S2.C29` Hard-fail schema-shaped but unsupported output, generic limitation buckets, placeholder values, empty arrays without limitation, “not enough information” without targeted re-extraction, route labels copied as facts, and route existence treated as field evidence.

---

# SECTION 3 — AGENT VALIDATION PROFILE MATRIX

## 3.1 Matrix Rule

`VAL.S3.C1` Agent-specific validation is activated by `active_agent_id` and active phase.

`VAL.S3.C2` Agent validation rows may narrow but cannot expand the universal validator gates.

`VAL.S3.C3` Agent 1 and Agent 3 Target Feature rows are active design rows for the current package. Later module rows remain placeholders until their module prompts and artifact contracts are locked.

## 3.2 Locked Agent Validation Matrix

| active_agent_id | validator_profile | Required Checks |
|---|---|---|
| `agent_1_source_legal` | `agent_1_m6_m9_validator` | M6 handoff exists; M6 route-universe sections present; M9 legal cartography exists; no downstream profile objects; save order M6 then M9; lock source/legal phases only after both artifacts save. |
| `agent_3_target_feature` / M7 | `agent_3_m7_validator` | M7 checks in Section 4; source extraction before field derivation; Phase B1 material-only output/save; Phase D forensic-only output/save; no M8/M10/M11 work; no combined material+forensic output. |
| `agent_3_target_feature` / M8 | `agent_3_m8_validator` | M8 checks in Section 5; saved M7 artifacts required; source extraction before PA/classification derivation; Phase B1 material-only output/save; Phase D forensic-only output/save; classification matrix row proof; no M10/M11 work. |
| `agent_3_data_privacy` | `agent_3_m10_validator_PLACEHOLDER` | Placeholder only. Must fail production use until M10 artifact contract is locked. |
| `agent_4_exposure_registry` | `agent_4_m11_validator_PLACEHOLDER` | Placeholder only. Must fail production use until M11 artifact contract is locked. |
| `agent_5_challenge_handoff` | `agent_5_m12_m13_validator_PLACEHOLDER` | Placeholder only. Must fail production use until M12/M13 artifact contracts are locked. |
| `agent_6_terminal_renderer` | `agent_6_m14_validator_PLACEHOLDER` | Placeholder only. Must fail production use until M14 renderer/terminal contract is locked. |

---

# SECTION 4 — AGENT 3 / M7 VALIDATION PROFILE

## 4.1 M7 Required Inputs

`VAL.M7.C1` Validate that M7 read-only inputs include:

```text
source_discovery_handoff
source_discovery_handoff.bucket_family_index.target_profile_urls.families
source_discovery_handoff.bucket_family_index.legal_governance_profile_urls.families only for the narrow M7 legal exception
legal_cartography_index only for the narrow M7 legal exception
lossless_family__T0_ROOT through lossless_family__T4_SUPPORTING_IDENTITY
TP.* field selector authority
M7 material selector table
M6-approved target/legal route families and source limitations
```

`VAL.M7.C2` Validate that M7 did not create, discover, search, browse, follow unapproved links, or use non-approved sources.

## 4.2 M7 Extraction Gate

`VAL.M7.C3` Validate the M7 Phase A extraction checkpoint:

```text
TARGET_PROFILE_SOURCE_CAPSULE 100% ROUTE FAMILY COVERAGE CHECKED
```

`VAL.M7.C4` Validate that every M7 route-family source was reviewed or explicitly marked broken, gated, duplicate-canonicalized, non-public, outside M7 scope with reason, or returned to source repair.

`VAL.M7.C5` Validate that field application occurred only after M7 Phase A Target Source Extraction Capsule locked.

## 4.3 M7 Material Output Gate

`VAL.M7.C6` `target_profile` must contain exactly five parent sections:

```text
target_identity
jurisdiction_notice
business_context
product_service_wrapper
target_profile_limitations
```

`VAL.M7.C7` `target_profile` must contain exactly eighteen material fields.

`VAL.M7.C8` `target_profile.target_identity` must contain exactly:

```text
brand_name
legal_entity_name
entity_type
reviewed_website
primary_domain
```

`VAL.M7.C9` `target_profile.jurisdiction_notice` must contain exactly:

```text
registered_notice_location
governing_law
courts_venue
```

`VAL.M7.C10` `target_profile.business_context` must contain exactly:

```text
business_category
primary_customer_type
market_type_candidate
industry_sector
regulated_sector_hints
```

`VAL.M7.C11` `target_profile.product_service_wrapper` must contain exactly:

```text
high_level_offering
primary_public_claim
product_service_wrapper_names
delivery_model_signals
```

`VAL.M7.C12` `target_profile.target_profile_limitations` must be present as an array.

`VAL.M7.C13` `target_profile` must not contain `profile_meta`, `lock_status`, `validation_status`, `target_profile_forensics`, `source_ledger`, `source_ref`, `source_url`, `field_derivation_ledger`, `trace`, `scratchpad`, old flat M7 keys, feature fields, data fields, registry fields, legal-risk fields, or final handoff fields.

`VAL.M7.C14` Phase B1 output must contain exactly one top-level artifact: `target_profile`.

## 4.4 M7 FD / Forensics Gate

`VAL.M7.C15` Validate that all populated substantive fields were derived through selected `TP.*` rows mapped in M7 material selector.

`VAL.M7.C16` Validate that non-selected `TP.*` rows were not executed as material fields.

`VAL.M7.C17` Validate that `target_profile_forensics` exists only after saved `target_profile` and contains exactly these proof branches:

```text
source_ledger_used_for_m7
target_source_extraction_capsule_summary
target_source_route_coverage_ledger
field_derivation_ledger
targeted_re_extraction_ledger
limitation_ledger
cross_route_use_ledger
validation_quality_control_result
runtime_trace_m7_only
forensic_boundary
```

`VAL.M7.C18` Validate that every selected `TP.*` row has Module V or forensic outcome with FD field id, source basis, outcome, limitation/fallback where applicable, and forbidden inference check.

`VAL.M7.C19` Validate that `field_derivation_ledger[]` contains exactly 18 rows and every cited source ID has exact `source_url` or `source_urls`.

`VAL.M7.C20` Phase D output must contain exactly one top-level artifact: `target_profile_forensics`.

## 4.5 M7 Local Status Gate

`VAL.M7.C21` If M7 returns `REPAIR_REQUIRED` or `SOURCE_REPAIR_REQUIRED`, the backend must not proceed to M8.

`VAL.M7.C22` If M7 returns `PASS_WITH_LIMITATION`, `PASS_WITH_WARNING`, or `REINVESTIGATION_COMPLETED_WITH_LIMITATION`, the backend may proceed to M8 only if limitations do not block M8 use and are recorded in `target_profile_forensics` and `target_profile_limitations`.

---

# SECTION 5 — AGENT 3 / M8 VALIDATION PROFILE

## 5.1 M8 Required Inputs

`VAL.M8.C1` Validate that M8 receives only authorized inputs:

```text
source_discovery_handoff
source_discovery_handoff.bucket_family_index.product_activity_profile_urls.families
source_discovery_handoff.contract.source_text_location
lossless_family__P1_PRODUCT
lossless_family__P2_PLATFORM_FEATURE_SOLUTION
lossless_family__P3_AI_CAPABILITY_TECHNICAL
lossless_family__P4_USE_CASE_INDUSTRY
lossless_family__P5_ENTERPRISE_PRICING
target_profile
target_profile_forensics
PA.* field selector authority
FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml
CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml
```

`VAL.M8.C2` Validate that M8 did not execute M6, M7, M9, M10, M11, M12, M13, or M14 work.

`VAL.M8.C3` Validate that M8 did not rely on deprecated source branches: `bucket_handoff`, `discovered_route_inventory`, `route_execution_ledger`, `source_coverage_gates`, or root-level `missing_limited_primary_sources`.

## 5.2 M8 Extraction Gate

`VAL.M8.C4` Validate the M8 Phase A extraction checkpoint:

```text
PRODUCT_ACTIVITY_SOURCE_CAPSULE 100% ROUTE FAMILY COVERAGE CHECKED
```

`VAL.M8.C5` Validate that every Product / Activity route-family source was covered before PA application.

`VAL.M8.C6` Validate that M8-A source extraction used five parents:

```text
Activity Candidate Extraction
Mechanics Proof Extraction
Archetype Signal Extraction
Surface Signal Extraction
Routing Limitation Extraction
```

`VAL.M8.C7` Validate that M8 did not treat product page existence, nav labels, route labels, product names, API names, model names, pricing tiers, or slogans as activities without mechanics proof.

## 5.3 M8 Material Output Gate

`VAL.M8.C8` `target_feature_profile` must contain exactly two top-level keys:

```text
activities
profile_level_limitations
```

`VAL.M8.C9` Every emitted activity must contain exactly these 12 keys:

```text
activity_reference
product_service_wrapper
activity_feature_name
activity_candidate_summary
mechanics_proof
autonomy_human_control_signal
data_content_object_touched
external_internal_action_signal
archetype_codes
archetype_proof
surface_context_tokens
surface_proof_and_routing_limits
```

`VAL.M8.C10` The key `surface_tokens` is forbidden. The valid key is `surface_context_tokens`.

`VAL.M8.C11` Every emitted activity must have mechanics proof, at least one archetype code, archetype proof, a present `surface_context_tokens` array, and surface proof/routing limitation handling.

`VAL.M8.C12` Empty `surface_context_tokens[]` is allowed only if no surface support remains after all ten surface tests and targeted re-extraction, with limitation recorded.

`VAL.M8.C13` `target_feature_profile` must not contain source URLs, source refs, evidence quotes, confidence scores, field derivation ledgers, raw extraction fragments, route coverage ledgers, debug notes, validation logs, extraction capsule, chain-of-thought, or forensic material.

`VAL.M8.C14` Phase B1 output must contain exactly one top-level artifact: `target_feature_profile`.

## 5.4 M8 Archetype / Surface Gate

`VAL.M8.C15` Validate that every mechanically valid emitted activity was tested against all 11 archetypes:

```text
UNI
DOE
JDG
CMP
CRT
RDR
ORC
TRN
SHD
OPT
MOV
```

`VAL.M8.C16` Validate that all evidence-supported archetypes were emitted and unsupported archetypes were rejected or ledgered as not-evidenced/close-call where material.

`VAL.M8.C17` Validate that no archetype was forced merely to satisfy schema.

`VAL.M8.C18` Validate that every emitted activity was tested against all ten surface tokens:

```text
Consumer-Public
Enterprise-Private
PII
Employment
Sensitive/Biometric
Financial
Content&IP
Safety&Physical
Infrastructure
Minors
```

`VAL.M8.C19` Validate that sensitive, biometric, financial, employment, minors, PII, infrastructure, and safety/physical surfaces are not inferred without explicit support.

`VAL.M8.C20` Validate that archetype and surface derivation rows use `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml` as controlling authority, including conditions, trigger, limitation, exclusion, and forbidden-inference fields.

## 5.5 M8 FD / Forensics Gate

`VAL.M8.C21` Validate that M8 applied `PA.*` registry authority as derivation authority, not as a full material output schema.

`VAL.M8.C22` Validate that selected `PA.*` rows support the 12-field routing-first activity card.

`VAL.M8.C23` Validate that `target_feature_profile_forensics` exists only after saved `target_feature_profile` and contains these proof branches:

```text
product_activity_source_route_coverage_ledger
product_activity_extraction_capsule_summary
candidate_admission_and_omission_ledger
selected_pa_field_derivation_ledger
activity_mechanics_derivation_ledger
archetype_derivation_ledger
surface_token_derivation_ledger
targeted_re_extraction_ledger
activity_limitations_ledger
cross_route_use_ledger
validation_quality_control_result
runtime_trace_m8_only
forensic_boundary
```

`VAL.M8.C24` Validate that every selected `PA.*` row has Module V or forensic outcome with FD field id, source basis, outcome, limitation/fallback where applicable, and forbidden inference check.

`VAL.M8.C25` Validate that `selected_pa_field_derivation_ledger[]` contains at least 12 rows per emitted activity.

`VAL.M8.C26` Validate that `archetype_derivation_ledger[]` contains 11 test rows per mechanically valid emitted activity.

`VAL.M8.C27` Validate that `surface_token_derivation_ledger[]` contains 10 test rows per emitted activity.

`VAL.M8.C28` Validate that every forensic row citing a source ID includes exact `source_url` or `source_urls`.

`VAL.M8.C29` Phase D output must contain exactly one top-level artifact: `target_feature_profile_forensics`.

## 5.6 M8 Local Status Gate

`VAL.M8.C30` If M8 returns `REPAIR_REQUIRED` or `SOURCE_REPAIR_REQUIRED`, the backend must not lock M8 and must not proceed to M10.

`VAL.M8.C31` If M8 returns `PASS_WITH_LIMITATION`, `PASS_WITH_WARNING`, or `REINVESTIGATION_COMPLETED_WITH_LIMITATION`, the backend may lock `M8_TARGET_FEATURE_PROFILE` only if limitations are recorded and downstream M10/M11 use remains safe.

---

# SECTION 6 — AGENT 3 SEQUENTIAL TARGET-FEATURE PHASE VALIDATION

`VAL.A3.C1` Agent 3 Target Feature may lock M7 only if both required M7 artifacts exist and were saved in this exact order:

```text
1. target_profile
2. target_profile_forensics
```

`VAL.A3.C2` Agent 3 Target Feature may lock M8 only if saved M7 artifacts exist and the two required M8 artifacts were saved in this exact order:

```text
1. target_feature_profile
2. target_feature_profile_forensics
```

`VAL.A3.C3` Agent 3 Target Feature may not lock M8 before M7 has locked or been accepted with downstream-safe limitations.

`VAL.A3.C4` Agent 3 Target Feature must not mutate `source_discovery_handoff`, `legal_cartography_index`, `target_profile`, or `target_profile_forensics` during M8.

`VAL.A3.C5` Agent 3 Target Feature must not provide the next-phase command unless phase status maps to `LOCKED` or `LOCKED_WITH_LIMITATIONS`.

`VAL.A3.C6` If M7 or M8 requires source repair due to missing source route or corrupt source artifact, route back to source/routing repair and do not invent, search, or proceed.

`VAL.A3.C7` A combined M7+M8 output, a four-artifact output, or a response that mixes a material artifact with its forensic artifact in one production backend call is invalid.

---

# SECTION 7 — PLACEHOLDER PRODUCTION GUARD

`VAL.PG.C1` Data privacy, exposure registry, challenge/handoff, and terminal renderer validator rows are placeholder rows until their module prompts and artifact contracts are locked.

`VAL.PG.C2` If `active_agent_id` is `agent_3_data_privacy`, `agent_4_exposure_registry`, `agent_5_challenge_handoff`, or `agent_6_terminal_renderer` and no separately locked module contract is present in the prompt payload, return:

```text
CONTROLLED_FAILURE: VALIDATOR_PROFILE_NOT_LOCKED_FOR_PRODUCTION
```

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
    "mapped_backend_lock_status": "LOCKED | LOCKED_WITH_LIMITATIONS | REPAIR_REQUIRED | CONTROLLED_FAILURE",
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

`VAL.RF.C3` If status is `PASS_WITH_WARNING`, `PASS_WITH_LIMITATION`, or `REINVESTIGATION_COMPLETED_WITH_LIMITATION`, `limitations[]` must not be empty and `mapped_backend_lock_status` must be `LOCKED_WITH_LIMITATIONS`.

`VAL.RF.C4` Validator results may be saved in backend only where the active phase's schema permits it. They must not be inserted into material profile artifacts.

---

# VALIDATOR FINAL LOCK

`VAL.LOCK.C1` This integrated validator is subordinate to the integrated 00 runtime and the active module output contracts, but it is the governing validation rule file for all phased agents.

`VAL.LOCK.C2` If this validator conflicts with the runtime, the runtime controls scope and permission; the validator controls pass/fail criteria inside that scope.

`VAL.LOCK.C3` If this validator conflicts with an active module contract, the stricter no-hallucination, no-scope-drift, no-forensic-clumping, no-unauthorized-source, no-skipped-extraction, and no-skipped-re-extraction rule controls.
