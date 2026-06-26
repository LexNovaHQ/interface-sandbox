# MODULE VIII — TARGET FEATURE PROFILE

## M8.S0 — Phase Call Card and Phase Local Lock Gate

<phase_call_card>
phase_id: M8_TARGET_FEATURE_PROFILE
module_id: M8
module_name: TARGET_FEATURE_PROFILE
active_phase_only: true
active_agent: agent_3_target_feature
canonical_material_output: target_feature_profile
canonical_forensic_output: target_feature_profile_forensics

module_design_lock:
  M8 is a routing-first Product / Activity Profile module.
  Activity extraction, mechanics extraction, archetype testing, and surface testing exist to prove or reject routing.
  A product, API, model, app, platform, service, page, route, slogan, pricing tier, or navigation label is not automatically an emitted activity.
  An emitted activity must have source-backed candidate behavior, mechanics proof, at least one evidence-supported archetype, completed surface-token testing, and routing limitations handled.
  M8 does not create a product brochure, feature list, data-provenance profile, legal analysis, exposure profile, report section, or renderer payload.

governing_imports:
  - 00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md
  - AGENT3_RUNTIME_BINDING_PACKET.yaml
  - 00_TERMINAL_RECEIPT_RULES_INTEGRATED.md
  - 00_VALIDATOR_RULES_INTEGRATED.md
  - FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml
  - FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml
  - CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml

execution_rule:
  Execute M8 only.
  Build `target_feature_profile` first.
  Build `target_feature_profile_forensics` only after `target_feature_profile` has been completed, validated, and saved as the M8 material artifact by the backend runner.
  Use only locked M7 artifacts, live Agent 1/2-approved source custody and routing artifacts, live backend M6 `source_discovery_handoff.bucket_family_index`, loaded product-family lossless artifacts, selected `PA.*` rows from `FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml`, and `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml`.
  Do not assume M6 supplied a lossless evidence vault.
  Do not discover new URLs.
  Do not browse, crawl, search, fetch, or use memory/general knowledge about the target.
  Do not evaluate exposure registry rows.
  Do not perform M7, M9, M10, M11, M12, M13, or M14 work.
  Do not emit final_output_handoff.

internal_stage_order:
  - PHASE A / M8-A: Product / Activity Source Extraction From Agent 1/2 Drive Artifacts
  - PHASE B / M8-B: Material Target Feature Profile Derivation
  - PHASE B1 / M8-B1: Material Target Feature Profile Validator + Save Gate
  - PHASE C / M8-C: Target Feature Profile Forensics Derivation
  - PHASE D / M8-D: Target Feature Profile Forensics Validator + Save Gate

phase_boundary_map:
  PHASE_A_SOURCE_EXTRACTION: M8.S5 + M8.S5A
  PHASE_B_PROFILE_DERIVATION: M8.S6 + M8.S7 + M8.S8 + M8.S9
  PHASE_B1_PROFILE_VALIDATION_SAVE_GATE: M8.S10
  PHASE_C_FORENSIC_DERIVATION: M8.S11 + M8.S12 + M8.S13
  PHASE_D_FORENSIC_VALIDATION_SAVE_GATE: M8.S14
  FINAL_OUTPUT_CONTRACT: M8.S15
  sequence_rule: Phase A must pass before Phase B; Phase B must complete every emitted activity and every locked material field before Phase B1; Phase B1 must validate and mark `target_feature_profile` save-ready before Phase C; Phase C may begin only after `target_feature_profile` is saved; Phase D must validate and save `target_feature_profile_forensics` before M10.

phase_terminal_sequence:
  In backend execution, return strict JSON only.
  Do not emit `<phase_output>` blocks.
  Do not emit checkpoint prose.
  Do not emit terminal receipt text.
  Do not emit audit logs, operator challenge gates, report prose, or markdown.
  M8 has two separate backend terminal events, not one combined response.
  Phase B1 terminal event returns exactly one top-level key: `target_feature_profile`.
  The backend runner must validate and save `target_feature_profile` as an artifact before Phase C starts.
  Phase D terminal event returns exactly one top-level key: `target_feature_profile_forensics`.
  The backend runner must validate and save `target_feature_profile_forensics` before M10.
  A response that contains both `target_feature_profile` and `target_feature_profile_forensics` in the same backend call is invalid unless the operator has explicitly invoked a non-production debug bundling mode.

phase_local_gate:
  Before handoff, verify:
    - saved M7 `target_profile` and `target_profile_forensics` exist and are consumed only as context.
    - M8-A extraction has covered 100% of Agent 1/2-approved Product / Activity route-family URLs in the live backend source universe.
    - route existence was not treated as field evidence.
    - field-relevant lossless material fragments were extracted before PA application.
    - `FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml` is loaded as selected `PA.*` derivation authority, not full material output schema.
    - `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml` is loaded as controlling archetype and surface derivation authority.
    - inline archetype/surface quick tables are labels only and cannot override the classification matrix.
    - only selected PA rows mapped to the locked 12-field routing-first activity card are applied for material execution.
    - every emitted activity uses exactly the locked 12 activity keys in `M8.S15`.
    - `target_feature_profile` exists before `target_feature_profile_forensics` is derived.
    - no source/provenance/forensic material appears inside `target_feature_profile`.
    - every emitted activity has mechanics proof, archetype codes, archetype proof, surface token array, and surface proof/routing limitation handling.
    - all 11 locked archetype codes were tested for every mechanically valid emitted activity.
    - all 10 locked surface tokens were tested for every emitted activity.
    - weak fields, weak archetype tests, and weak surface tests were sent to targeted re-extraction before limitation status.
    - selected PA row coverage is recorded in the Module V workpad and projected into `target_feature_profile_forensics.selected_pa_field_derivation_ledger`.
    - every source ID cited in any forensic row is paired with its exact source URL from the loaded upstream artifact.
    - no registry exposure evaluation or M9-M14 canonical object is emitted.

  allowed_gate_outcomes:
    - PASS
    - PASS_WITH_WARNING
    - PASS_WITH_LIMITATION
    - REINVESTIGATION_COMPLETED_WITH_LIMITATION
    - SOURCE_REPAIR_REQUIRED
    - CONTROLLED_FAILURE

allowed_inputs:
  - source_discovery_handoff
  - source_discovery_handoff.bucket_family_index.product_activity_profile_urls.families
  - target_profile
  - target_profile_forensics
  - loaded product-family artifacts `lossless_family__P1_PRODUCT` through `lossless_family__P5_ENTERPRISE_PRICING`
  - product-family artifact limitation branches where present
  - FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml selected `PA.*` rows
  - FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml
  - CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml

required_visible_rows:
  FD_ROW_PREFIX: NONE_IN_MAIN_PHASE_OUTPUT
  REQUIRED_EXTRACTION_CHECKPOINT: INTERNAL_ONLY_PRODUCT_ACTIVITY_SOURCE_CAPSULE_100_PERCENT_ROUTE_FAMILY_COVERAGE_CHECKED
  REQUIRED_PROFILE_CHECKPOINT: INTERNAL_ONLY_TARGET_FEATURE_PROFILE_ROUTING_FIRST_12_FIELD_CARD_COMPLETE
  REQUIRED_FORENSIC_CHECKPOINT: INTERNAL_ONLY_TARGET_FEATURE_PROFILE_FORENSICS_COMPLETE
  INTERNAL_LEDGER_REQUIREMENT: selected PA.* rows only, through Module V workpad and M8 forensics

required_machine_output_by_phase:
  PHASE_B1_MATERIAL_SAVE_EVENT:
    - target_feature_profile
  PHASE_D_FORENSIC_SAVE_EVENT:
    - target_feature_profile_forensics

forbidden_outputs:
  - target_profile
  - target_profile_forensics
  - legal_cartography_index
  - target_data_provenance_profile
  - target_exposure_profile
  - operator_challenge_gate
  - final_output_handoff
  - renderer_payload
  - REGISTRY_ROW lines
  - old activity_inventory branch
  - old activity_mechanics branch
  - old vertical_behavior_classification branch
  - old surface_context_classification branch
  - old registry_routing_substrate branch
  - old activity_evidence branch
  - old activity_limitations branch
  - profile_meta inside target_feature_profile

validator_action:
  action_name: backend_validate_and_save_M8_TARGET_FEATURE_PROFILE
  phase: M8_TARGET_FEATURE_PROFILE
  pass_condition: Phase B1 emits and saves target_feature_profile first; only after backend save may Phase C/D emit and save target_feature_profile_forensics; M8-A extraction lock + selected PA material-selector coverage + classification-matrix archetype/surface routing proof complete + source-ID/URL custody complete
  fail_behavior: repair M8 only; do not advance to M10/M11/M12

repair_policy:
  - If the local gate returns repair, repair M8 only and rerun the relevant gate.
  - If the local gate returns reinvestigation required, perform scoped targeted re-extraction inside the approved source universe and do not advance until the specific field/test is repaired or controlled.
  - If the necessary Product / Activity route is absent from the M6 route universe, route repair back to M6/Agent 1 instead of inventing or searching.
  - Do not recompute unrelated upstream objects.

stop_condition:
  Stop local M8 phase only; return control to the backend runner.
  The backend runner may advance to M10 only after `target_feature_profile` and `target_feature_profile_forensics` are saved and M8 returns PASS, PASS_WITH_WARNING, PASS_WITH_LIMITATION, REINVESTIGATION_COMPLETED_WITH_LIMITATION, or CONTROLLED_FAILURE expressly safe for downstream use.
  If M8 returns SOURCE_REPAIR_REQUIRED, do not advance.
</phase_call_card>

`M8.S0.C1` This phase call card is the first executable block for this Module when extracted into a standalone Agent 3 phase prompt.

`M8.S0.C2` This call card functions as the M8 module-local lock gate and backend artifact-save contract. It does not authorize same-chat `<phase_output>` wrappers, terminal receipts, compatibility wrappers, or multi-phase output packets.

`M8.S0.C3` The Module may not advance, hand off, or be treated as locked until its phase-local gate has returned a pass/control outcome and both M8 artifacts have been saved in order.

`M8.S0.C4` Repair and reinvestigation are scoped to M8. M8 may route to Agent 1/M6 only where the source universe itself is defective.

---

## M8.S1 — Function and Hard Rules

---

### M8.T0 — Applied Global Rules — Compressed Import

`M8.T0.C1` Module VIII imports the common runtime, source, evidence, no-simulation, no-legal-advice, no-registry-evaluation, locked-state, repair, terminal, and backend artifact rules from the governing runtime packet. Imported rules apply in full.

`M8.T0.C2` Local deltas for Module VIII are limited to routing-first Product / Activity Profile work: use only the live M6 `source_discovery_handoff.bucket_family_index.product_activity_profile_urls.families`, loaded product-family artifacts `lossless_family__P1_PRODUCT` through `lossless_family__P5_ENTERPRISE_PRICING`, locked M7 `target_profile` context, M7 limitation/custody context where needed, selected `PA.*` material rows, and `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml` for archetype/surface derivation.

`M8.T0.C3` M8 does not assume M6 supplied lossless downstream evidence. M8 must build a module-scoped Product / Activity Source Extraction Capsule before applying PA rows.

`M8.T0.C4` Archetype and surface derivation are central M8 duties. They are not postscript tags, registry evaluation, risk scoring, legal advice, compliance analysis, or exposure findings.

`M8.T0.C5` Product context, candidate extraction, and mechanics proof are upstream proof steps for archetype and surface routing. They are not product-brochure summaries.

`M8.T0.C6` Output root, lock status, ledger duties, limitation carry-forward, no-alias discipline, no-legal-advice boundary, no-registry-evaluation boundary, source-ID custody, and terminal preservation remain governed by imported Global Rules, Module IV, Module V, `M8.S3`, and `M8.S15`.

---

### M8.T0A — Module Duty Card — Compressed

`M8.T0A.C1` Module VIII executes under common duty-card doctrine in Module II, Module IV, Module V, Module VI, Module VII, and the runtime controller.

`M8.T0A.C2` Canonical material output is `target_feature_profile`. Canonical forensic/provenance output is `target_feature_profile_forensics`. Required inputs are locked M7 `target_profile`, M7 `target_profile_forensics` limitation/custody context where needed, M6 `source_discovery_handoff.bucket_family_index.product_activity_profile_urls.families`, loaded product-family artifacts `lossless_family__P1_PRODUCT` through `lossless_family__P5_ENTERPRISE_PRICING`, product-family artifact limitation context, `FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml` with selected `PA.*` rows, `FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml`, and `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml`.

`M8.T0A.C3` Unique model duties are: cover 100% of M6-approved Product / Activity route-family sources in the live family artifacts; extract field-relevant lossless material fragments into the M8-A Source Extraction Capsule; admit only evidence-supported activity candidates; derive mechanics proof; test all 11 locked archetype codes; test all 10 locked surface tokens; preserve all supported archetypes/surfaces; targeted re-extract weak fields/tests before limitation; emit the 12-field routing-first activity card; save forensics after the main profile.

`M8.T0A.C4` Unique forbidden acts are: source discovery, using unapproved URLs, treating route labels as evidence, treating products/wrappers as activities without mechanics, forcing archetypes, inventing surfaces, assigning threat IDs/exposure statuses, emitting old multi-branch profile sections, legal/data/registry/handoff work, and clumping material profile with forensic/provenance output.

`M8.T0A.C5` Repair route: M8 feature/archetype/surface defects are classified under `M8.S14` and the runtime repair matrix, with return to Agent 1/M6 only where the necessary route is absent from the M6 route universe or the loaded source artifact is defective.

---

### M8.S1A — Function

`M8.S1A.C1` Module VIII converts locked M7 target context and M6-approved Product / Activity route-family material into the canonical routing-first `target_feature_profile` object. `Product / Activity Profile` is the authorized display label; `target_feature_profile` remains the canonical material object.

`M8.S1A.C2` Module VIII identifies evidence-supported public activities and links each emitted activity to a product, platform, API, model, app, solution, integration, deployment surface, or service wrapper where visible.

`M8.S1A.C3` Module VIII extracts mechanics specifically to prove or reject archetype and surface routing.

`M8.S1A.C4` Module VIII performs evidence-backed archetype derivation for every mechanically valid emitted activity using `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml.archetype_derivation_matrix`.

`M8.S1A.C5` Module VIII performs evidence-backed surface-token derivation for every emitted activity using `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml.surface_derivation_matrix` and writes an empty surface token set only where mechanics are valid but visible evidence does not support a surface token after targeted re-extraction.

`M8.S1A.C6` Module VIII emits `target_feature_profile` in the Phase B1 material save event first. Only after the backend has saved that material artifact may Module VIII emit `target_feature_profile_forensics` in the Phase D forensic save event.

`M8.S1A.C7` Module VIII working memory is governed by Module V through `target_feature_profile_ledger`; the separate forensic output is the external proof artifact, not the scratchpad.

`M8.S1A.C8` Module VIII is the registry-routing substrate for downstream Modules, but it does not evaluate exposure registry rows.

### M8.S1B — Mandatory Duties

`M8.S1B.C1` MUST consume locked M7 `target_profile` as context only.

`M8.S1B.C2` MUST consume locked M7 `target_profile_forensics` only for inherited limitations, custody context, and M7 boundary warnings relevant to M8.

`M8.S1B.C3` MUST consume live backend M6 `source_discovery_handoff` and the live backend M6 family-index route universe: `source_discovery_handoff.bucket_family_index.product_activity_profile_urls.families`.

`M8.S1B.C4` MUST use loaded product-family artifact branches, including `sources[]`, `rejected_sources[]`, `manifest_only_sources[]`, `metadata_only_sources[]`, and family-local limitation arrays where present, to prove source custody and limitations. Do not look for legacy `bucket_handoff`, `discovered_route_inventory`, `route_execution_ledger`, or `source_coverage_gates` branches.

`M8.S1B.C5` MUST cover 100% of M6-approved Product / Activity route-family URLs before PA application begins.

`M8.S1B.C6` MUST extract field-relevant lossless fragments from approved URLs/materials into the M8-A Source Extraction Capsule before applying selected PA rows.

`M8.S1B.C7` MUST apply the selected `PA.*` material selector from `FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml` for every material Product / Activity output field.

`M8.S1B.C8` MUST emit only atomic activity rows under `target_feature_profile.activities[]` using the locked 12-field routing-first activity card.

`M8.S1B.C9` MUST use `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml` as controlling authority for archetype and surface derivation.

`M8.S1B.C10` MUST test every mechanically valid emitted activity against all 11 locked archetype codes and all 10 locked surface tokens.

`M8.S1B.C11` MUST assign at least one evidence-supported archetype code to every emitted activity, or omit/limit the candidate after targeted re-extraction.

`M8.S1B.C12` MUST preserve all supported archetypes and surfaces for an activity.

`M8.S1B.C13` MUST send weak fields, weak archetype tests, and weak surface tests back to targeted re-extraction before assigning limitation status.

`M8.S1B.C14` MUST write Module V ledger rows before lock and project the relevant proof into `target_feature_profile_forensics` after the main profile.

`M8.S1B.C15` MUST keep all source references, source URLs, evidence excerpts, derivation ledgers, route coverage, validation rows, and forensic proof out of `target_feature_profile` and inside `target_feature_profile_forensics` only.

### M8.S1C — Forbidden Acts

`M8.S1C.C1` M8 must not discover new sources, search the web, browse, crawl, follow unapproved links, use memory/general knowledge, use search snippets as evidence, or use rejected/quarantined/deferred/duplicate-suppressed/non-routed source material.

`M8.S1C.C2` M8 must not mutate, rewrite, repair, or supplement M7 artifacts. M7 is context only.

`M8.S1C.C3` M8 must not use product/page/API/model labels as activity evidence without mechanics proof.

`M8.S1C.C4` M8 must not create or emit old material branches: `activity_inventory`, `activity_mechanics`, `vertical_behavior_classification`, `surface_context_classification`, `registry_routing_substrate`, `activity_evidence`, `activity_limitations`, or `profile_meta`.

`M8.S1C.C5` M8 must not place `validation_status`, `lock_status`, source refs, source URLs, evidence basis, confidence, extraction fragments, route-coverage rows, derivation ledgers, or forensic branches inside `target_feature_profile`.

`M8.S1C.C6` M8 must not perform data provenance, privacy readiness, legal cartography, registry exposure, challenge-gate, final-report, or renderer work.

`M8.S1C.C7` M8 must not treat archetype or surface labels in this prompt as the derivation matrix. Labels are shorthand only. The classification matrix file controls.

---

## M8.S2 — Input Protocol

### M8.S2A — Required Inputs

| Required Input | Required Use |
|---|---|
| `source_discovery_handoff` | source boundary, family routing, inherited limitations, and source custody index |
| `source_discovery_handoff.bucket_family_index.product_activity_profile_urls.families` | M8 Product / Activity route universe |
| `source_discovery_handoff.contract.source_text_location` | confirms source text location in lossless family artifacts |
| `lossless_family__P1_PRODUCT` | product/page/product-slug source text and custody refs |
| `lossless_family__P2_PLATFORM_FEATURE_SOLUTION` | platform/features/solutions source text and custody refs |
| `lossless_family__P3_AI_CAPABILITY_TECHNICAL` | API/docs/model/capability/developer source text and custody refs |
| `lossless_family__P4_USE_CASE_INDUSTRY` | use-case/industry/sector source text and custody refs |
| `lossless_family__P5_ENTERPRISE_PRICING` | pricing/enterprise/package/request-demo source text and custody refs |
| `target_profile` | M7 target identity/business/wrapper context only |
| `target_profile_forensics` | M7 limitations/custody context only where needed |
| `FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml` | governing `PA.*` field derivation authority |
| `FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml` | governing forensic ledger authority |
| `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml` | controlling archetype/surface derivation matrix |
| `M8.T3 Product / Activity FD Registry Selector` | selected 12-field material execution map |

### M8.S2B — Route-Family Access Matrix

| Route / Object | Access Status | Permitted M8 Use |
|---|---|---|
| `lossless_family__P1_PRODUCT` | primary product/activity family | activity candidates, wrapper-to-activity linkage, product-level mechanics, candidate limitations |
| `lossless_family__P2_PLATFORM_FEATURE_SOLUTION` | primary product/activity family | platform/features/solutions as candidate sources only where mechanics are visible |
| `lossless_family__P3_AI_CAPABILITY_TECHNICAL` | primary product/activity family | API/docs/model/capability mechanics, developer-facing mechanics, programmatic delivery and technical activity signals |
| `lossless_family__P4_USE_CASE_INDUSTRY` | supporting product/activity family | use-case/sector/industry context only where it supports a concrete activity candidate, archetype test, surface test, or limitation |
| `lossless_family__P5_ENTERPRISE_PRICING` | supporting product/activity family | enterprise/self-serve/pricing/package/request-demo context where it supports candidate admission, market delivery signal, surface limitation, or activity limitation |
| `source_discovery_handoff.bucket_family_index.product_activity_profile_urls.families` | custody/control | family-level route availability, family state, and source-to-family routing; route existence alone is not field evidence |
| `target_profile` | context only | target identity/business/wrapper context; never overwritten and never used as mechanics proof without product-family source support |
| `target_profile_forensics` | limitation/custody context only | inherited M7 limitations and source-custody warnings; never used as substitute for M8 source extraction |
| legal/data/registry families | not primary M8 evidence | may be used only if already Agent 1/2-approved and independently supports product/activity mechanics or limitation; never legal/risk/data-provenance analysis |

### M8.S2C — Input Failure Handling

`M8.S2C.C1` If `source_discovery_handoff` is missing, malformed, or lacks the live `bucket_family_index.product_activity_profile_urls.families` path, return `SOURCE_REPAIR_REQUIRED` and do not invent source routes.

`M8.S2C.C2` If a product-family artifact is missing or corrupt, record the exact artifact failure and return `SOURCE_REPAIR_REQUIRED` only for that upstream defect.

`M8.S2C.C3` If a route exists but contains no M8 field support, record `NO_M8_FIELD_SUPPORT` in the source extraction capsule and continue with limitation/omission where appropriate.

`M8.S2C.C4` If an activity field/test is weak, missing, thin, vague, or conflicting but the source universe exists, perform targeted re-extraction before limitation.

`M8.S2C.C5` Do not block the entire M8 phase for ordinary public-footprint thinness after targeted re-extraction. Save controlled limitations where downstream use can remain safe.

### M8.S2D — Source-Mode Scope Rule

`M8.S2D.C1` M8 operates in public-footprint source mode. It may use only material captured by Agent 1/2 and saved in backend artifacts.

`M8.S2D.C2` M8 must not infer private deployment, private data flows, hidden subprocessors, internal model behavior, legal role, compliance status, or risk posture from public product claims.

`M8.S2D.C3` Public source absence creates a limitation/omission, not a guessed value.

---

## M8.S3 — Archetype and Surface Authority

### M8.S3A — Archetype Rule

`M8.S3A.C1` Archetype derivation authority comes from `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml.archetype_derivation_matrix`.

`M8.S3A.C2` Every mechanically valid emitted activity must be tested against all 11 locked archetype codes.

`M8.S3A.C3` An archetype may be emitted only where matrix conditions support `TRIGGERED` or `TRIGGERED_WITH_LIMITATION` after trigger, limitation, exclusion, and forbidden-inference checks.

`M8.S3A.C4` Do not use local archetype labels, common sense, marketing category, product name, or M7 wrapper as archetype proof.

`M8.S3A.C5` If an inline archetype label in `M8.T1` conflicts with the classification matrix, the classification matrix wins.

### M8.T1 — Archetype Detection Table

This table is a label index only. It is not derivation authority. The controlling conditions, triggers, limitations, exclusions, and forbidden-inference checks live in `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml.archetype_derivation_matrix`.

| Code | Label | Use |
|---|---|---|
| `UNI` | User Navigation / Interface | emit only if matrix conditions support user-facing navigation/interface activity |
| `DOE` | Drafting / Output Engine | emit only if matrix conditions support generation/drafting/output production activity |
| `JDG` | Judgment / Decision Guidance | emit only if matrix conditions support evaluation/recommendation/scoring/guidance activity |
| `CMP` | Comparison / Matching / Prioritization | emit only if matrix conditions support matching/comparison/ranking/prioritization activity |
| `CRT` | Creative / Content Transformation | emit only if matrix conditions support creative or transformative content activity |
| `RDR` | Retrieval / Data Retrieval | emit only if matrix conditions support retrieval/search/querying/retrieval-augmented activity |
| `ORC` | Orchestration / Workflow Coordination | emit only if matrix conditions support workflow orchestration/coordinated task activity |
| `TRN` | Training / Fine-Tuning / Model Adaptation | emit only if matrix conditions support training/tuning/adaptation activity |
| `SHD` | Shielding / Guardrail / Safety | emit only if matrix conditions support safety/filtering/guardrail/moderation activity |
| `OPT` | Optimization / Automation | emit only if matrix conditions support optimization, automation, or efficiency activity |
| `MOV` | Movement / External Action | emit only if matrix conditions support external action, communication, transfer, execution, or movement beyond internal analysis |

### M8.S3B — Surface Rule

`M8.S3B.C1` Surface derivation authority comes from `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml.surface_derivation_matrix`.

`M8.S3B.C2` Every emitted activity must be tested against all 10 locked surface tokens.

`M8.S3B.C3` A surface token may be emitted only where matrix conditions support `TRIGGERED` or `TRIGGERED_WITH_LIMITATION` after trigger, limitation, exclusion, and forbidden-inference checks.

`M8.S3B.C4` Do not use jurisdiction, law, regulation, compliance framework, country, region, sector label, customer type, product category, or approximate label as a surface token.

`M8.S3B.C5` If an inline surface label in `M8.T2` conflicts with the classification matrix, the classification matrix wins.

### M8.T2 — Surface Detection Table

This table is a label index only. It is not derivation authority. The controlling conditions, triggers, limitations, exclusions, and forbidden-inference checks live in `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml.surface_derivation_matrix`.

| Surface Token | Use |
|---|---|
| `Consumer-Public` | public consumer/user-facing surface where matrix support exists |
| `Enterprise-Private` | enterprise/private business/customer surface where matrix support exists |
| `PII` | personal-information surface where matrix support exists |
| `Employment` | employment/hiring/workforce surface where matrix support exists |
| `Sensitive/Biometric` | sensitive or biometric surface where matrix support exists |
| `Financial` | financial/payment/credit/transactional surface where matrix support exists |
| `Content&IP` | content/copyright/IP/creative asset surface where matrix support exists |
| `Safety&Physical` | safety, health, physical-world, or safety-critical surface where matrix support exists |
| `Infrastructure` | infrastructure, security, developer, deployment, or system-operation surface where matrix support exists |
| `Minors` | minors/children/youth surface where matrix support exists |

---

## M8.S4 — Inventory and Field Derivation

`M8.S4.C1` Material field authority for `target_feature_profile` comes only from `FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml`, filtered through selected `PA.*` rows in `M8.T3`.

`M8.S4.C2` M8 does not define local field derivation rules that override the registry. Local field names are output slots only; governing logic comes from the corresponding `PA.*` rows.

`M8.S4.C3` Every material field derivation must apply the governing registry row's `Mode`, `Source_Basis`, `Conditions`, `Trigger_Outcome`, `Exclude_Fallback`, `Forbidden_Inference`, and `Lock_Status`.

`M8.S4.C4` Every populated material field and every controlled status must create a matching `selected_pa_field_derivation_ledger` row in `target_feature_profile_forensics` using the applicable `PA.*` `Field_ID`.

`M8.S4.C5` Non-selected PA rows remain registry authority but are audit-retired for M8 material output. They may support limitations or forensics only where relevant.

`M8.S4.C6` The 12-field activity card is executed through four material parent groups for derivation discipline only. These parent groups must not become material output branches. Material output remains `activities[]` plus `profile_level_limitations[]`.

Parent groups for derivation discipline:

1. Activity identity and wrapper: `activity_reference`, `product_service_wrapper`, `activity_feature_name`, `activity_candidate_summary`.
2. Mechanics and control: `mechanics_proof`, `autonomy_human_control_signal`, `data_content_object_touched`, `external_internal_action_signal`.
3. Archetype routing: `archetype_codes`, `archetype_proof`.
4. Surface routing and limitations: `surface_context_tokens`, `surface_proof_and_routing_limits`, plus `profile_level_limitations[]`.

### M8.T3 — Product / Activity FD Registry Selector

| Parent Group | Output Field | Registry Field_ID(s) | Required Derivation Action |
|---|---|---|---|
| Activity identity and wrapper | `activity_reference` | `PA.INV.001`, `PA.INV.004` | Create stable downstream activity handle only after candidate admission. The reference is not evidence and must not be used as source proof. |
| Activity identity and wrapper | `product_service_wrapper` | `PA.INV.002`, optional `PA.INV.005` | Derive wrapper/product/platform/API/service context from product-family lossless text. Do not infer from route slug alone. |
| Activity identity and wrapper | `activity_feature_name` | `PA.INV.001`, optional `PA.INV.004` | Derive the visible activity/feature/action name from source text. Do not emit page title as activity unless mechanics support it. |
| Activity identity and wrapper | `activity_candidate_summary` | `PA.INV.004`, `PA.INV.005`, selected `PA.INV.*` rows | Summarize the admitted activity candidate as behavior, not brochure copy. Include only what public source text supports. |
| Mechanics and control | `mechanics_proof` | `PA.MECH.001`, `PA.MECH.004`, `PA.MECH.005`, `PA.MECH.006`, `PA.MECH.007` | Prove actor/user, input/material, system action, output/result, and object affected. If action or output cannot be proven, omit or limit. |
| Mechanics and control | `autonomy_human_control_signal` | `PA.MECH.008`, `PA.MECH.009`, `PA.MECH.014` | Derive visible autonomy/human-control signal only from text. Do not infer automation level from AI branding. |
| Mechanics and control | `data_content_object_touched` | `PA.MECH.004`, `PA.MECH.007`, selected `PA.SURF.*` rows | Identify the object/content/data class touched by the activity at public-footprint level only. Do not do data provenance. |
| Mechanics and control | `external_internal_action_signal` | `PA.MECH.010`, `PA.MECH.011`, `PA.MECH.012` | Derive whether action appears internal, external, programmatic, workflow, communication, or movement-oriented where visible. |
| Archetype routing | `archetype_codes` | `PA.BEH.001` + `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml.archetype_derivation_matrix` | Emit only supported codes from the 11-code matrix after condition/trigger/exclusion/forbidden-inference testing. |
| Archetype routing | `archetype_proof` | `PA.BEH.*`, `PA.MECH.*`, classification matrix rows | Summarize why emitted archetypes are supported and limitations for any close-call trigger. The proof must link to forensic matrix rows. |
| Surface routing and limitations | `surface_context_tokens` | `PA.SURF.001` + `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml.surface_derivation_matrix` | Emit only supported tokens from the 10-token matrix after condition/trigger/exclusion/forbidden-inference testing. |
| Surface routing and limitations | `surface_proof_and_routing_limits` | `PA.SURF.*`, `PA.LIM.*`, `PA.BEH.008`, `PA.MECH.014` | Summarize surface proof and routing limitations. Do not use law/region/sector labels as surface tokens. |
| Profile limitations | `profile_level_limitations` | selected `PA.LIM.*` rows | Emit profile-level limitations affecting M8 or downstream routing: missing routes, thin mechanics, omitted candidates, weak archetype/surface support, source limitations. |

---

## M8.S5 — PHASE A: Source Extraction Input and Scope Check

`M8.S5.PHASE_RULE` This section opens PHASE A. M8 may not begin candidate admission, mechanics proof, archetype testing, surface testing, material finalization, or forensics until M8.S5 and M8.S5A pass the source-extraction gate.


### Consumes

- `source_discovery_handoff`
- `source_discovery_handoff.bucket_family_index.product_activity_profile_urls.families`
- saved `target_profile`
- saved `target_profile_forensics`
- loaded product-family artifacts `lossless_family__P1_PRODUCT` through `lossless_family__P5_ENTERPRISE_PRICING`
- `FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml`
- `FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml`
- `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml`

### Applies

- verify M7 material and forensic artifacts exist before M8 begins;
- verify live M6 family index exists;
- verify source text location points to loaded `lossless_family__{ROOT_FAMILY}.sources[].lossless_text`;
- verify selected `PA.*` material selector is available;
- verify classification matrix is available and controls archetype/surface derivation;
- verify no legacy source branch is required.

### Writes

- internal input/scope checkpoint in Module V workpad;
- no material output yet;
- no forensic output yet.

### Forbidden

- do not emit activities before source extraction capsule;
- do not invent missing source routes;
- do not browse;
- do not use M7 artifacts as mechanics proof;
- do not advance on missing classification matrix.

### Failure Handling

If live M6 route universe, loaded product-family artifacts, or classification matrix are missing/corrupt, return `SOURCE_REPAIR_REQUIRED` or upstream configuration repair. If ordinary field support is thin but source universe exists, proceed to M8.S5A and use targeted re-extraction.

---

## M8.S5A — PHASE A: Product / Activity Source Extraction Capsule

`M8.S5A.PHASE_RULE` This section completes PHASE A. It must create the Product / Activity Source Extraction Capsule from Agent 1/2-approved Drive/backend artifacts before any PA field derivation begins.


### Purpose

M8.S5A creates and locks the Product / Activity Source Extraction Capsule before any material activity field is derived.

The capsule is internal working material until M8 forensics. It must not be emitted inside `target_feature_profile`.

### Route Coverage Requirement

For every source object in the M8 route universe, record one of:

- `FIELD_RELEVANT_EXTRACTED`
- `NO_M8_FIELD_SUPPORT`
- `GATED_OR_NON_PUBLIC`
- `BROKEN_OR_UNAVAILABLE`
- `DUPLICATE_CANONICALIZED`
- `OUTSIDE_M8_SCOPE`

Every reviewed source row must include:

- `root_family`
- `source_id`
- `source_url`
- `extraction_status`
- `candidate_relevance`
- `mechanics_relevance`
- `archetype_signal_relevance`
- `surface_signal_relevance`
- `supported_output_fields[]`
- `lossless_excerpt_or_summary`
- `limitation_if_any`

### Lossless Fragment Rule

Retain all source-supported fragments needed to justify candidate admission, mechanics, archetype routing, surface routing, and limitations. Do not summarize away actor, input/material, system action, output/result, object touched, autonomy/human-control, delivery channel, external/internal action, archetype signal, or surface signal.

### Extraction Parents

The capsule must extract source support separately for these M8 derivation parents:

1. Activity Candidate Extraction
2. Mechanics Proof Extraction
3. Archetype Signal Extraction
4. Surface Signal Extraction
5. Routing Limitation Extraction

### Targeted Re-Extraction Trigger

Run targeted re-extraction if:

- a candidate has a product/page label but unclear mechanics;
- actor/input/action/output/object is missing;
- archetype trigger conditions are close but thin;
- surface trigger conditions are close but thin;
- source IDs lack exact URLs;
- source text is contradictory across product-family sources;
- a candidate may need omission rather than emission.

### Extraction Quality Gate

M8.S5A passes only if:

- all loaded P1–P5 product-family sources were reviewed;
- every cited source ID has its exact source URL;
- no deprecated source branch is used as authority;
- no route label is treated as field evidence;
- every admitted candidate has mechanics-supporting material or a controlled omission/limitation path;
- archetype signals are test-ready for all 11 locked codes;
- surface signals are test-ready for all 10 locked tokens;
- source limitations are carried forward.

---

## M8.S6 — PHASE B: Material Profile Derivation — Activity Candidate Admission

`M8.S6.PHASE_RULE` This section opens PHASE B. It may run only after PHASE A has passed. It admits candidate activities for material profile derivation but does not yet authorize forensics.


### Consumes

- M8-A Product / Activity Source Extraction Capsule;
- M7 target context only;
- selected `PA.INV.*` rows;
- product-family lossless excerpts;
- source limitation rows.

### Applies

- candidate admission requires visible functional behavior;
- product name, API name, model name, route name, pricing tier, package, app, platform, slogan, or page title is not enough;
- mechanics signal must exist or be targeted-re-extracted before admission;
- duplicates must be merged when same public mechanics appear across routes;
- candidates must be split only where actor/object/action/output, archetype routing, or surface routing materially differs.

### Writes

- candidate admission rows in Module V workpad;
- omitted candidate rows for unsupported/product-label-only candidates;
- no final `activities[]` row until mechanics proof in M8.S7 and routing proof in M8.S8/M8.S9.

### Candidate Admission Test

A candidate may proceed only if all of the following are true:

1. the candidate is tied to an approved product-family source;
2. the source has source ID and source URL;
3. the candidate describes behavior, not only a product/page label;
4. mechanics proof is extractable or targeted re-extraction can make it extractable;
5. candidate is not duplicate of an already-admitted mechanics-equivalent activity;
6. no forbidden inference is required to treat the candidate as an activity.

If a candidate fails, omit it and record the omission in `candidate_admission_and_omission_ledger` during forensics.

---

## M8.S7 — PHASE B: Material Profile Derivation — Mechanics Proof Derivation

### Consumes

- admitted activity candidates from M8.S6;
- M8-A extraction capsule;
- selected `PA.MECH.*` rows;
- product-family source text and source custody;
- targeted re-extraction results.

### Applies

For every admitted candidate, derive mechanics proof using these field clauses:

- Actor/user: identify who uses or triggers the activity where visible.
- Input/material: identify what input, object, content, request, data, prompt, file, query, instruction, API call, or user action starts the activity where visible.
- System action: identify what the target system does.
- Output/result: identify what output, result, action, transformation, recommendation, generation, retrieval, routing, or execution appears.
- Object affected: identify what object/content/data/process is affected.
- Evidence basis: source-backed summary only; detailed evidence stays in forensics.
- Limitation: controlled limitation if any mechanics element remains thin after targeted re-extraction.

### Writes

- `mechanics_proof` material value for each emitted activity;
- `autonomy_human_control_signal` material value;
- `data_content_object_touched` material value;
- `external_internal_action_signal` material value;
- mechanics proof rows for `activity_mechanics_derivation_ledger` in forensics.

### Lock-Critical Mechanics

If system action or output/result cannot be supported after targeted re-extraction, do not emit the activity. Omit it and ledger the omission.

### Forbidden

Do not produce data-flow, processing-role, retention, transfer, subprocessor, legal-basis, compliance, exposure, or risk analysis.

---

## M8.S8 — PHASE B: Material Profile Derivation — Archetype Routing Derivation

### Consumes

- mechanically valid activity candidates;
- M8-A extraction capsule;
- mechanics derivation rows;
- selected `PA.BEH.*` rows;
- `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml.archetype_derivation_matrix`.

### Applies

The archetype derivation matrix is mandatory. It must be loaded and applied. If unavailable, M8 cannot validly derive archetype codes.

For every mechanically valid emitted activity, test all 11 archetype codes:

```text
UNI, DOE, JDG, CMP, CRT, RDR, ORC, TRN, SHD, OPT, MOV
```

### Writes

- `archetype_codes[]` material field;
- `archetype_proof` material field;
- one `archetype_derivation_ledger` row per activity per tested archetype code;
- targeted re-extraction rows for weak archetype tests;
- limitation rows for supported-with-limitation archetype outcomes.

### Required Archetype Test Sequence

For each activity and each archetype code:

1. load the code's row from `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml.archetype_derivation_matrix`;
2. test every listed condition separately;
3. record each condition as `TRUE`, `FALSE`, or `NOT_EVIDENCED`;
4. attach source ID and exact source URL to each supporting condition;
5. apply `trigger_if` exactly;
6. apply `trigger_with_limitation_if` where support is partial or source-thin;
7. apply `exclude_if` after condition testing;
8. run forbidden-inference check;
9. emit the code only if final `trigger_result` is `TRIGGERED` or `TRIGGERED_WITH_LIMITATION`;
10. preserve all supported codes;
11. never use `UNI` as a lazy fallback when narrower archetype is proven.

### Re-Extraction Rule

If a code is close but thin, run targeted re-extraction before deciding not evidenced or triggered-with-limitation.

If `archetype_codes[]` remains empty after targeted re-extraction and retesting, omit the candidate.

### Archetype Ledger Requirement

Every emitted activity must have exactly or at least 11 archetype test rows, one for every locked archetype code. A ledger that contains only matched archetypes is inadequate.

Every `archetype_derivation_ledger` row must follow the row contract in `M8.T4`.

### Forbidden

Do not infer archetype from product label, route label, marketing slogan, M7 business category, or general knowledge.

---

## M8.S9 — PHASE B: Material Profile Derivation — Surface Routing Derivation

### Consumes

- emitted/mechanically valid activities;
- M8-A extraction capsule;
- mechanics derivation rows;
- selected `PA.SURF.*` and limitation rows;
- `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml.surface_derivation_matrix`.

### Applies

The surface derivation matrix is mandatory. It must be loaded and applied. If unavailable, M8 cannot validly derive surface tokens.

For every emitted activity, test all 10 surface tokens:

```text
Consumer-Public, Enterprise-Private, PII, Employment, Sensitive/Biometric, Financial, Content&IP, Safety&Physical, Infrastructure, Minors
```

### Writes

- `surface_context_tokens[]` material field;
- `surface_proof_and_routing_limits` material field;
- one `surface_token_derivation_ledger` row per activity per tested surface token;
- targeted re-extraction rows for weak surface tests;
- limitation rows for supported-with-limitation surface outcomes.

### Surface Rules

For each activity and each surface token:

1. load the token's row from `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml.surface_derivation_matrix`;
2. test every listed condition separately;
3. record each condition as `TRUE`, `FALSE`, or `NOT_EVIDENCED`;
4. attach source ID and exact source URL to each supporting condition;
5. apply `trigger_if` exactly;
6. apply `trigger_with_limitation_if` where support is partial, indirect, source-thin, or sector-level rather than activity-level;
7. apply `exclude_if` after condition testing;
8. run forbidden-inference check;
9. emit the token only if final `trigger_result` is `TRIGGERED` or `TRIGGERED_WITH_LIMITATION`;
10. preserve all supported tokens.

`surface_context_tokens[]` may be empty only where mechanics are valid but no surface token is supported after targeted re-extraction and the limitation is recorded.

### Forbidden

Do not use country, region, law, regulation, compliance framework, legal standard, industry sector, customer type, product category, or approximate label as a surface token.

---

## M8.S10 — PHASE B1: Material Profile Finalization, Validator, and Save Gate

`M8.S10.PHASE_RULE` This section is the PHASE B1 material validator/save gate. It must validate `target_feature_profile` schema and substance, emit only `target_feature_profile`, and require backend save confirmation before any PHASE C forensic derivation begins.


### Consumes

- candidate admission rows;
- mechanics proof rows;
- archetype derivation rows;
- surface derivation rows;
- selected PA field derivation rows;
- targeted re-extraction outcomes;
- limitation outcomes.

### Applies

Finalize only activity rows that passed candidate admission, mechanics proof, archetype routing, and surface routing gates.

Every emitted activity must contain exactly the 12 locked material fields in `M8.S15` and no other fields.

The field clauses below must be satisfied for every emitted activity:

1. `activity_reference` — stable module-generated handle linked to candidate admission row; not evidence.
2. `product_service_wrapper` — wrapper/product/platform/API/service context tied to source text.
3. `activity_feature_name` — visible activity/feature/action name tied to mechanics proof.
4. `activity_candidate_summary` — behavior summary; not marketing copy.
5. `mechanics_proof` — compact actor/input/action/output/object proof.
6. `autonomy_human_control_signal` — source-backed autonomy/control signal or controlled limitation.
7. `data_content_object_touched` — public-footprint object/content/data class touched; no data provenance.
8. `external_internal_action_signal` — source-backed signal for internal/external/action/movement where visible.
9. `archetype_codes` — supported codes from M8.S8 only.
10. `archetype_proof` — compact proof linked to archetype ledger.
11. `surface_context_tokens` — supported tokens from M8.S9 only.
12. `surface_proof_and_routing_limits` — compact proof and limitation summary linked to surface ledger.

### Writes

- `target_feature_profile.activities[]`;
- `target_feature_profile.profile_level_limitations[]`;
- material profile save-ready state.

### PHASE B1 Backend Output Contract

At the end of Phase B1, the backend/model call must return exactly one top-level artifact and stop:

```json
{
  "target_feature_profile": {
    "activities": [
      {
        "activity_reference": "",
        "product_service_wrapper": "",
        "activity_feature_name": "",
        "activity_candidate_summary": "",
        "mechanics_proof": "",
        "autonomy_human_control_signal": "",
        "data_content_object_touched": "",
        "external_internal_action_signal": "",
        "archetype_codes": [],
        "archetype_proof": "",
        "surface_context_tokens": [],
        "surface_proof_and_routing_limits": ""
      }
    ],
    "profile_level_limitations": []
  }
}
```

Do not include `target_feature_profile_forensics` in the Phase B1 output. Phase B1 ends when the backend validates and saves `target_feature_profile`.

### Finalization Rules

- Do not emit source IDs, URLs, evidence fragments, confidence, validation status, provenance, or forensics inside an activity row.
- Do not emit an activity with empty `archetype_codes[]`.
- Do not emit a candidate with missing mechanics proof.
- Do not emit duplicate activities where mechanics are materially the same.
- Do not split activities unless mechanics or routing materially differs.
- Preserve all supported archetype codes and surface tokens.

---

## M8.S11 — PHASE C: Forensic Derivation — Evidence Mapping to Forensics

`M8.S11.PHASE_RULE` This section opens PHASE C. It may run only after `target_feature_profile` has passed PHASE B1 and is saved by the backend runner.


### Consumes

- saved/validated `target_feature_profile` material artifact;
- M8-A extraction capsule;
- selected PA field derivation outcomes;
- mechanics derivation outcomes;
- classification matrix test outcomes;
- targeted re-extraction outcomes;
- limitation outcomes;
- source custody rows.

### Applies

M8.S11 maps proof to `target_feature_profile_forensics`. It does not change the material profile unless a forensic defect exposes a material derivation defect requiring repair.

Every material activity field must have a matching selected PA field derivation row.

Every archetype/surface emitted in material profile must have a matching triggered classification row.

Every source reference must carry exact source URL.

### Writes

Forensics must include exactly the branches listed in M8.S13 and M8.S15.

### Forbidden

Do not place forensic proof back into `target_feature_profile`. Do not invent source refs. Do not create summary-only forensics when row-level proof is required.

---

## M8.S12 — PHASE C: Forensic Derivation — Limitations Assembly

### Consumes

- profile-level limitations from M8.S10;
- omitted candidates from M8.S6;
- mechanics limitations from M8.S7;
- archetype limitations from M8.S8;
- surface limitations from M8.S9;
- inherited source/custody limitations from M7/M6 where relevant.

### Applies

Every limitation must state:

- affected activity or profile-level issue;
- affected field/test;
- source basis reviewed;
- targeted re-extraction performed;
- final controlled status or omission reason;
- downstream effect.

### Writes

- `profile_level_limitations[]` in material profile;
- `activity_limitations_ledger[]` in forensics;
- `targeted_re_extraction_ledger[]` in forensics;
- `candidate_admission_and_omission_ledger[]` for omitted candidates.

### Forbidden

Do not use vague limitations such as “unknown,” “insufficient data,” or “not available” without field/test, source basis, reinvestigation, and downstream effect.

---

## M8.S13 — PHASE C: Forensic Derivation — Working Ledger and Forensic Projection

`M8.S13.C1` The Module V workpad is internal. The external forensic artifact is `target_feature_profile_forensics`.

`M8.S13.C2` `target_feature_profile_forensics` must include exactly these branches:

| Forensic Branch | Required Coverage |
|---|---|
| `product_activity_source_route_coverage_ledger` | one row per reviewed M8 route/source, or family-level no-source row for empty/gated/broken/out-of-scope families |
| `product_activity_extraction_capsule_summary` | M8-A extraction capsule summary by source family and supported field/test parent |
| `candidate_admission_and_omission_ledger` | admitted and omitted candidates, with reasons and source support |
| `selected_pa_field_derivation_ledger` | one row per emitted activity per locked material field, minimum 12 rows per activity |
| `activity_mechanics_derivation_ledger` | actor/input/action/output/object proof per emitted activity |
| `archetype_derivation_ledger` | 11 matrix-test rows per mechanically valid emitted activity |
| `surface_token_derivation_ledger` | 10 matrix-test rows per emitted activity |
| `targeted_re_extraction_ledger` | every weak field/test reinvestigation or zero-row justification |
| `activity_limitations_ledger` | activity and profile-level limitations with downstream effect |
| `cross_route_use_ledger` | every non-primary or cross-route source use and why allowed |
| `validation_quality_control_result` | schema checks, field counts, row counts, source URL checks, alias checks, warnings/blockers |
| `runtime_trace_m8_only` | M8-only sanitized runtime status and artifact refs |
| `forensic_boundary` | audit-only boundary; no chain-of-thought, no secrets, no legal conclusions |

`M8.S13.C3` Forensic branch aliases are prohibited. Invalid aliases include `source_custody`, `feature_route_family_coverage`, `field_derivation_decisions`, `validation_qc_status`, `runtime_trace_boundaries`, `extraction_capsule_summary`, `route_coverage`, `evidence_summary_only`, `generic_derivation_summary`, `activity_evidence`, and `activity_limitations` as standalone forensic replacements.

### M8.T4 — Required Classification Derivation Ledger Row Contract

Every row in `archetype_derivation_ledger[]` and `surface_token_derivation_ledger[]` must include:

- `activity_reference`
- `classification_type`: `ARCHETYPE` or `SURFACE`
- `classification_matrix_source`: `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml`
- `matrix_branch`: `archetype_derivation_matrix` or `surface_derivation_matrix`
- `code`
- `conditions[]`
- `trigger_if`
- `trigger_result`
- `trigger_with_limitation_if`
- `exclude_if`
- `exclusion_result`
- `forbidden_inference_check`
- `confidence`
- `limitation_if_any`

Every `conditions[]` item must include:

- `condition_id`
- `condition_text`
- `result`: `TRUE`, `FALSE`, or `NOT_EVIDENCED`
- `source_ref`
- `source_url`
- `evidence_summary`

Any archetype or surface ledger row that lacks `conditions[]`, `trigger_if`, `trigger_result`, `exclude_if`, `exclusion_result`, or `forbidden_inference_check` is invalid.

---

## M8.S14 — PHASE D: Forensic Validator and Save Gate

`M8.S14.PHASE_RULE` This section is PHASE D. It validates `target_feature_profile_forensics`, repairs forensic defects through targeted reinvestigation where needed, and marks the forensic artifact save-ready before M10.


M8 locks only if all of the following pass:

1. `target_feature_profile` exists and contains exactly two keys: `activities` and `profile_level_limitations`.
2. Every emitted activity contains exactly the 12 locked activity fields in `M8.S15`.
3. No activity contains source refs, source URLs, evidence basis, confidence, validation status, profile metadata, extraction fragments, forensic branches, or old material branches.
4. Every emitted activity has non-empty mechanics proof.
5. Every emitted activity has non-empty `archetype_codes[]` supported by matrix rows.
6. Every emitted activity has `surface_context_tokens[]` as an array supported by matrix rows or controlled empty-token limitation.
7. M8-A route coverage equals 100% of the Agent 1/2-approved Product / Activity route universe.
8. Every emitted activity has at least 12 selected PA field derivation rows.
9. Every mechanically valid emitted activity has 11 archetype derivation rows.
10. Every emitted activity has 10 surface-token derivation rows.
11. Every forensic row that cites a source ID includes the exact source URL copied from the loaded upstream source object.
12. Targeted re-extraction exists for weak fields/tests, or the issue is controlled as limitation/omission.
13. Omitted candidates are ledgered.
14. All classification derivation rows use `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml` and satisfy `M8.T4`.
15. No registry exposure evaluation, legal conclusion, data-provenance conclusion, M9-M14 output, or report prose appears.

If the lock gate finds inadequate or wrong output:

1. do not proceed to M10;
2. reinvestigate the specific field/test/candidate inside the approved source universe;
3. re-apply the governing `PA.*` row or classification matrix row;
4. if support is found, correct the value/test;
5. if support remains insufficient, omit/limit the candidate or mark the field/test with controlled limitation;
6. re-run the relevant lock gate.

Do not hard-block the entire M8 phase for ordinary missing public evidence after reinvestigation. Phase B1 must already have saved the material profile; Phase D saves only the forensic profile with controlled limitations where downstream use remains safe.

---

## M8.S15 — Split Backend Output Contracts

M8 does not authorize a combined material+forensic backend response in production execution. The two canonical artifacts are emitted through two separate backend save events.

### M8.S15A — PHASE B1 Material Output Contract

At the end of Phase B1, return exactly this top-level JSON shape and stop:

```json
{
  "target_feature_profile": {
    "activities": [
      {
        "activity_reference": "",
        "product_service_wrapper": "",
        "activity_feature_name": "",
        "activity_candidate_summary": "",
        "mechanics_proof": "",
        "autonomy_human_control_signal": "",
        "data_content_object_touched": "",
        "external_internal_action_signal": "",
        "archetype_codes": [],
        "archetype_proof": "",
        "surface_context_tokens": [],
        "surface_proof_and_routing_limits": ""
      }
    ],
    "profile_level_limitations": []
  }
}
```

This Phase B1 output must not contain `target_feature_profile_forensics`, source refs, source URLs, source ledgers, derivation ledgers, extraction capsules, validation status, confidence, metadata, report prose, or compatibility wrappers.

After this output is validated, the backend runner must save `target_feature_profile`. Only after that save exists may Phase C begin.

### M8.S15B — PHASE D Forensic Output Contract

At the end of Phase D, consume the saved `target_feature_profile` artifact and return exactly this top-level JSON shape:

```json
{
  "target_feature_profile_forensics": {
    "product_activity_source_route_coverage_ledger": [],
    "product_activity_extraction_capsule_summary": [],
    "candidate_admission_and_omission_ledger": [],
    "selected_pa_field_derivation_ledger": [],
    "activity_mechanics_derivation_ledger": [],
    "archetype_derivation_ledger": [],
    "surface_token_derivation_ledger": [],
    "targeted_re_extraction_ledger": [],
    "activity_limitations_ledger": [],
    "cross_route_use_ledger": [],
    "validation_quality_control_result": {},
    "runtime_trace_m8_only": {},
    "forensic_boundary": {}
  }
}
```

This Phase D output must not contain `target_feature_profile` or any M7, M9, M10, M11, M12, final handoff, renderer, report, or compatibility-wrapper artifact.

`target_feature_profile_forensics` must contain the proof material required by `M8.S13`, including selected PA field derivation rows, classification-matrix rows, source URL custody, targeted re-extraction rows, limitation rows, and validation quality control.

M10 may begin only after both saved artifacts exist:

- `target_feature_profile` saved from Phase B1; and
- `target_feature_profile_forensics` saved from Phase D.
