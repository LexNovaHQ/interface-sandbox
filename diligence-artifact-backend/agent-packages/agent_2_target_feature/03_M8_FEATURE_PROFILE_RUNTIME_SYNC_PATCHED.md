# MODULE VIII — TARGET FEATURE PROFILE

## M8.S0 — Phase Call Card and Phase Local Lock Gate

<phase_call_card>
phase_id: PHASE_03
module_id: M8
module_name: TARGET_FEATURE_PROFILE
active_phase_only: true

module_design_lock:
  M8 is a routing-first Product / Activity Profile module.
  Activity extraction, mechanics extraction, archetype testing, and surface testing exist to prove or reject routing.
  A product, API, model, app, platform, service, page, route, slogan, or navigation label is not automatically an emitted activity.
  An emitted activity must have mechanics proof, at least one evidence-supported archetype, completed surface testing, and routing limitations handled.

governing_imports:
  - 00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md
  - AGENT2_RUNTIME_BINDING_PACKET.yaml
  - 00_TERMINAL_RECEIPT_RULES_INTEGRATED.md
  - 00_VALIDATOR_RULES_INTEGRATED.md
  - FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml
  - FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml
  - CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml

execution_rule:
  Execute M8 only.
  Build `target_feature_profile` first.
  Build `target_feature_profile_forensics` only after `target_feature_profile` has been completed.
  Use only locked M6 route-universe material and locked M7 `target_profile` context.
  Do not assume M6 supplied a lossless evidence vault.
  Do not discover new URLs.
  Do not evaluate registry rows.
  Do not perform M9, M10, M11, M12, M13, or M14 work.
  Do not emit final_output_handoff.
  After phase output, call validate_phase.

internal_stage_order:
  - M8-A: Product / Activity Source Extraction Capsule
  - M8-B: PA Field Application + Routing Derivation
  - M8-C: Product / Activity Forensics

phase_terminal_sequence:
  In phased execution, emit exactly one `<phase_output phase="M8">` block.
  Inside the block, emit compact coverage only.
  First emit the exact extraction checkpoint line: `PHASE EXTRACTION COMPLETE: PRODUCT_ACTIVITY_SOURCE_CAPSULE 100% ROUTE FAMILY COVERAGE CHECKED`.
  Then emit the exact profile checkpoint line: `PHASE MATERIAL PROFILE COMPLETE: TARGET_FEATURE_PROFILE ROUTING_FIRST_12_FIELD_CARD`.
  Then emit the exact forensic checkpoint line: `PHASE FORENSICS COMPLETE: TARGET_FEATURE_PROFILE_FORENSICS`.
  Then emit the phase JSON packet containing `target_feature_profile`, `target_feature_profile_forensics`, and `phase_local_gate`.
  Close with `</phase_output>`.
  Do not emit `<technical_audit_log>`.
  Do not emit `<operator_challenge_gate>`.
  Do not emit `final_output_handoff`.

phase_local_gate:
  Before handoff, verify:
    - M8-A extraction has covered 100% of M6-approved Product / Activity route-family URLs.
    - route existence was not treated as field evidence.
    - field-relevant lossless material fragments were extracted before PA application.
    - PA registry authority is loaded as derivation authority, not full material output schema.
    - only selected PA rows mapped to the locked 12-field routing-first activity card are applied for material execution.
    - every emitted activity uses exactly the locked 12 activity keys in `M8.S15`.
    - `target_feature_profile` exists before `target_feature_profile_forensics` is built.
    - no source/provenance/forensic material appears inside `target_feature_profile`.
    - every emitted activity has mechanics proof, archetype codes, archetype proof, surface token array, and surface proof/routing limitation handling.
    - all 11 locked archetype codes were tested for every mechanically valid emitted activity.
    - all ten surface tokens were tested for every emitted activity.
    - weak fields, weak archetype tests, and weak surface tests were sent to targeted re-extraction before limitation status.
    - selected PA row coverage is recorded in the Module V workpad and projected into `target_feature_profile_forensics`.
    - no registry evaluation or M9-M14 canonical object is emitted.

  allowed_gate_outcomes:
    - PASS
    - REPAIR_REQUIRED
    - REINVESTIGATE_REQUIRED
    - PASS_WITH_LIMITATION
    - CONTROLLED_FAILURE

allowed_inputs:
  - source_discovery_handoff
  - target_profile
  - PA.* field selector authority
  - M6-approved Product / Activity route-family families from `source_discovery_handoff.bucket_family_index.product_activity_profile_urls.families`
  - loaded product-family artifacts `lossless_family__P1_PRODUCT` through `lossless_family__P5_ENTERPRISE_PRICING`
  - product-family artifact limitation branches where present
  - M7 `target_profile` context
  - M7 `target_profile_forensics` limitation/custody context where needed

required_visible_rows:
  FD_ROW_PREFIX: NONE_IN_MAIN_PHASE_OUTPUT
  REQUIRED_EXTRACTION_CHECKPOINT: PHASE EXTRACTION COMPLETE: PRODUCT_ACTIVITY_SOURCE_CAPSULE 100% ROUTE FAMILY COVERAGE CHECKED
  REQUIRED_PROFILE_CHECKPOINT: PHASE MATERIAL PROFILE COMPLETE: TARGET_FEATURE_PROFILE ROUTING_FIRST_12_FIELD_CARD
  REQUIRED_FORENSIC_CHECKPOINT: PHASE FORENSICS COMPLETE: TARGET_FEATURE_PROFILE_FORENSICS
  INTERNAL_LEDGER_REQUIREMENT: selected PA.* rows only, through Module V workpad and M8 forensics

required_machine_output:
  - target_feature_profile
  - target_feature_profile_forensics

forbidden_outputs:
  - legal_cartography_index
  - target_data_provenance_profile
  - target_exposure_profile
  - operator_challenge_gate
  - final_output_handoff
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
  action_name: validate_phase
  phase: M8
  pass_condition: target_feature_profile emitted first + target_feature_profile_forensics emitted second + M8-A extraction lock + selected PA material-selector coverage + archetype/surface routing proof complete
  fail_behavior: repair M8 only; do not advance to M9/M10/M11

repair_policy:
  - If the local gate returns REPAIR_REQUIRED, repair M8 only and rerun the local gate.
  - If the local gate returns REINVESTIGATE_REQUIRED, emit a scoped targeted re-extraction request and do not advance.
  - If the necessary Product / Activity route is absent from M6, route repair back to M6/Agent 1 instead of inventing or searching.
  - Do not recompute unrelated upstream objects.

stop_condition:
  Stop local M8 phase only; return control to the Agent 2 resolver in 00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md.
  The Agent 2 resolver may lock Agent 2 and provide the next-agent command only after `target_feature_profile` and `target_feature_profile_forensics` are saved and M8 returns PASS, PASS_WITH_LIMITATION, or CONTROLLED_FAILURE that is expressly safe for downstream use. If M8 returns REPAIR_REQUIRED or REINVESTIGATE_REQUIRED, do not advance.
</phase_call_card>

`M8.S0.C1` This phase call card is the first executable block for this Module when extracted into a standalone phase prompt.

`M8.S0.C2` In Agent 2 sequential execution, this call card functions as a module-local lock gate and terminal-projection contract. It does not authorize standalone `<phase_output>` blocks in the final monolith response; final monolith emission remains governed by Module XIV and `00_TERMINAL_RECEIPT_RULES_INTEGRATED.md`.

`M8.S0.C3` The Module may not advance, hand off, or be treated as locked until its phase-local gate has returned `PASS`, `PASS_WITH_LIMITATION`, or `CONTROLLED_FAILURE` under the rules above.

`M8.S0.C4` `REPAIR_REQUIRED` and `REINVESTIGATE_REQUIRED` are stop states. The Module must repair or route scoped reinvestigation before the next Module begins.

## M8.S1 — Function and Hard Rules

---

### M8.T0 — Applied Global Rules — Compressed Import

`M8.T0.C1` Module VIII imports `GRK.001` through `GRK.019` and `GRK.003A` under `GRK.000A`. Imported rules apply in full.

`M8.T0.C2` Local deltas for Module VIII are limited to routing-first Product / Activity Profile work: use only the live M6 `source_discovery_handoff.bucket_family_index.product_activity_profile_urls.families`, loaded product-family artifacts `lossless_family__P1_PRODUCT` through `lossless_family__P5_ENTERPRISE_PRICING`, locked M7 `target_profile` context, M7 limitation/custody context where needed, and admitted cross-route material that independently supports product/activity mechanics, archetype derivation, surface-token derivation, routing proof, or routing limitations.

`M8.T0.C3` M8 does not assume M6 supplied lossless downstream evidence. M8 must build a module-scoped Product / Activity Source Extraction Capsule before applying PA rows.

`M8.T0.C4` Archetype and surface derivation are the central M8 duties. They are not postscript tags, registry evaluation, risk scoring, legal advice, compliance analysis, or exposure findings.

`M8.T0.C5` Product context, candidate extraction, and mechanics proof are upstream proof steps for archetype and surface routing. They are not product-brochure summaries.

`M8.T0.C6` Output root, lock status, ledger duties, limitation carry-forward, no-alias discipline, no-legal-advice boundary, no-registry-evaluation boundary, and terminal preservation remain governed by the imported Global Rules, Module IV, Module V, `M8.S3`, and `M8.S15`.

---

### M8.T0A — Module Duty Card — Compressed

`M8.T0A.C1` Module VIII executes under the common duty-card doctrine in Module II, Module IV, Module V, Module VI, Module VII, and `GRK.000A`.

`M8.T0A.C2` Canonical material output is `target_feature_profile`. Canonical forensic/provenance output is `target_feature_profile_forensics`. Required inputs are locked M7 `target_profile`, M7 `target_profile_forensics` limitation/custody context where needed, M6 `source_discovery_handoff.bucket_family_index.product_activity_profile_urls.families`, loaded product-family artifacts `lossless_family__P1_PRODUCT` through `lossless_family__P5_ENTERPRISE_PRICING`, product-family artifact limitation context, `FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml` with `PA.*` selector authority, and `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml` for archetype/surface derivation.

`M8.T0A.C3` Unique model duties are: cover 100% of M6-approved Product / Activity route-family sources in the live family artifacts; extract field-relevant lossless material fragments into the M8-A Source Extraction Capsule; admit only evidence-supported activity candidates; derive mechanics proof; test all 11 locked archetype codes; test all 10 locked surface tokens; preserve all supported archetypes/surfaces; targeted re-extract weak fields/tests before limitation; emit the 12-field routing-first activity card; save forensics after the main profile.

`M8.T0A.C4` Unique forbidden acts are: source discovery, using unapproved URLs, treating route labels as evidence, treating products/wrappers as activities without mechanics, forcing archetypes, inventing surfaces, assigning threat IDs/exposure statuses, emitting old multi-branch profile sections, legal/data/registry/handoff work, and clumping material profile with forensic/provenance output.

`M8.T0A.C5` Repair route: Module VIII feature/archetype/surface defects are classified under `M8.S14.C0A–C0D` and the `00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md` Section 8 Repair Routing Matrix, with return to Agent 1 / M6 only where the necessary route is absent from the M6 route universe.

---

### M8.S1A — Function

`M8.S1A.C1` Module VIII converts locked M7 target context and M6-approved Product / Activity route-family material into the canonical routing-first `target_feature_profile` object. `Product / Activity Profile` is the authorized display label; `target_feature_profile` remains the canonical material object.

`M8.S1A.C2` Module VIII identifies evidence-supported public activities and links each emitted activity to a product, platform, API, model, app, solution, integration, deployment surface, or service wrapper where visible.

`M8.S1A.C3` Module VIII extracts mechanics specifically to prove or reject archetype and surface routing.

`M8.S1A.C4` Module VIII performs evidence-backed archetype derivation for every mechanically valid emitted activity.

`M8.S1A.C5` Module VIII performs evidence-backed surface-token derivation for every emitted activity and writes an empty surface token set only where mechanics are valid but visible evidence does not support a surface token after targeted re-extraction.

`M8.S1A.C6` Module VIII emits `target_feature_profile` first and `target_feature_profile_forensics` second.

`M8.S1A.C7` Module VIII working memory is governed by Module V through `target_feature_profile_ledger`; the separate forensic output is the external proof artifact, not the scratchpad.

`M8.S1A.C8` Module VIII is the registry-routing substrate for downstream Modules, but it does not evaluate registry rows.

### M8.S1B — Mandatory Duties

`M8.S1B.C1` MUST consume locked M7 `target_profile` as context only.

`M8.S1B.C2` MUST consume M6 `source_discovery_handoff`.

`M8.S1B.C3` MUST use the live backend M6 family-index structure as the M8 route universe: `source_discovery_handoff.bucket_family_index.product_activity_profile_urls.families` and loaded product-family artifacts `lossless_family__P1_PRODUCT`, `lossless_family__P2_PLATFORM_FEATURE_SOLUTION`, `lossless_family__P3_AI_CAPABILITY_TECHNICAL`, `lossless_family__P4_USE_CASE_INDUSTRY`, and `lossless_family__P5_ENTERPRISE_PRICING`.

`M8.S1B.C4` MUST use `source_discovery_handoff.bucket_family_index.product_activity_profile_urls.families` plus loaded product-family artifact branches, including `sources[]`, `missing_limited_primary_sources[]`, `rejected_sources[]`, `manifest_only_sources[]`, and `metadata_only_sources[]` where present, to prove source custody and limitations. Do not look for legacy `bucket_handoff`, `discovered_route_inventory`, `route_execution_ledger`, or `source_coverage_gates` branches.

`M8.S1B.C5` MUST cover 100% of M6-approved Product / Activity route-family URLs before PA application begins.

`M8.S1B.C6` MUST extract field-relevant lossless fragments from approved URLs/materials into the M8-A Source Extraction Capsule before applying selected PA rows.

`M8.S1B.C7` MUST apply the selected `PA.*` material selector from `FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml` for every material Product / Activity output field.

`M8.S1B.C8` MUST emit only atomic activity rows under `target_feature_profile.activities[]` using the locked 12-field routing-first activity card.

`M8.S1B.C9` MUST test every mechanically valid emitted activity against all 11 locked archetype codes and all 10 locked surface tokens in `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml`.

`M8.S1B.C10` MUST assign at least one evidence-supported archetype code to every emitted activity, or omit/limit the candidate after targeted re-extraction.

`M8.S1B.C11` MUST preserve all supported archetypes and surfaces for an activity.

`M8.S1B.C12` MUST send weak fields, weak archetype tests, and weak surface tests back to targeted re-extraction before assigning limitation status.

`M8.S1B.C13` MUST write Module V ledger rows before lock and project the relevant proof into `target_feature_profile_forensics` after the main profile.

`M8.S1B.C14` MUST record cross-route use reason when non-primary M8 route material supports an M8 field. Cross-route use must remain M8-field-relevant.

### M8.S1C — Forbidden Acts

`M8.S1C.C1` Apply `M8.T0`, especially `GRK.001`, `GRK.002`, `GRK.004`, `GRK.007`, `GRK.008`, `GRK.009`, and `GRK.015`.

`M8.S1C.C2` Module VIII must not discover new sources, use unapproved URLs, use candidate leads, use search snippets, or use rejected, quarantined, access-failed-only, deferred, duplicate-suppressed-only, snippet-only, or non-routed material as evidence.

`M8.S1C.C3` Module VIII must not treat a URL, route label, page title, product name, API name, navigation item, pricing tier, model name, or marketing slogan as activity evidence unless mechanics are extracted from the approved source.

`M8.S1C.C4` Module VIII must not use legal/governance material for product mechanics unless the approved source itself describes the product/activity mechanics. No legal interpretation is allowed.

`M8.S1C.C5` Module VIII must not use any route or admitted material for non-M8 purposes. Cross-route material may be used only where it independently supports product context, activity existence, mechanics proof, archetype derivation, surface-token derivation, routing proof, or limitations.

`M8.S1C.C6` Module VIII must not emit product wrappers as activities, emit old section branches, force archetypes, invent surfaces, assign threat IDs, registry statuses, risk levels, exposure findings, or registry conclusions. TRUE/FALSE/NOT_EVIDENCED condition results are permitted only inside M8 archetype/surface derivation forensic rows governed by `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml`; they must not be used as registry-row or exposure results.

`M8.S1C.C7` Module VIII must not perform target profiling, legal cartography, data provenance, controller/processor, retention, transfer, subprocessor, compliance, liability, legal-advice, report/handoff/terminal work, or emit trace, forensic ledger, scratchpad, debug, compatibility, or extra output keys inside `target_feature_profile`.

`M8.S1C.C8` Any violation of `M8.S1C` must be classified under `M8.S14.C0A–C0D` and routed through the `00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md` Section 8 Repair Routing Matrix.

---

## M8.S2 — Input Protocol

### M8.S2A — Required Inputs

| Required Input | Required Use |
| --- | --- |
| M7 `target_profile` | locked target context only; no target re-profiling |
| `target_profile.target_identity` / equivalent M7 identity section | public target identity context only |
| `target_profile.business_context` | business context for product/activity interpretation only |
| `target_profile.product_service_wrapper` | wrapper context only; M8 must still prove mechanics independently |
| `target_profile.target_profile_limitations` | upstream limitations affecting product/activity review |
| M6 `source_discovery_handoff` | upstream route universe and source custody |
| `source_discovery_handoff.bucket_family_index.product_activity_profile_urls.families` | primary M8 route universe |
| `lossless_family__P1_PRODUCT` through `lossless_family__P5_ENTERPRISE_PRICING` | loaded lossless product/activity source text |
| product-family artifact `sources[]` | extracted primary source rows with source IDs and URLs |
| product-family artifact limitation branches | inherited source coverage state |
| `target_profile` + `target_profile_forensics` | locked M7 context and limitation/custody context only |
| `source_discovery_handoff.downstream_routing` | downstream bucket routing context |
| `fd_registry_reference` | governing `PA.*` selector authority |

### M8.S2B — Route-Family Access Matrix

| Route / Material Family | Access Status | Permitted Use |
| --- | --- | --- |
| Product pages | Primary | product context, activity candidate, mechanics, archetype/surface signals |
| API pages / API slugs | Primary | API activity, input/output, endpoint behavior, delivery channel, automation/action signals |
| Docs / API reference categories | Primary | detailed mechanics, inputs, outputs, object touched, routing proof |
| Model pages | Primary | model activity, generation/translation/transcription/reading/orchestration signals |
| Integration pages | Primary | integration mechanics, external/internal action signals, orchestration/surface signals |
| Pricing / rate-limit / changelog | Conditional | only where it discloses product mechanics, rate-limit behavior, API usage, or product change affecting mechanics |
| Target-controlled product subdomains | Primary | product/activity mechanics and deployment context |
| Target-profile routes | Narrow context | wrapper/business context only; no target re-profiling |
| Legal/governance routes | Strict exception | only if the source text itself describes product/activity mechanics; no legal interpretation |
| Data/trust/security routes | Strict exception | only if the source text itself describes activity mechanics or data/content/object touched; no data provenance |
| Uploaded/pasted public material | Conditional | only where admitted by M6 and scoped to public product/activity evidence |

### M8.S2C — Input Failure Handling

| Condition | Required Handling |
| --- | --- |
| M7 `target_profile` missing | emit `CONTROLLED_FAILURE` |
| M6 `source_discovery_handoff` missing | emit `CONTROLLED_FAILURE` |
| M6 route universe lacks Product / Activity routes | route to M6 repair or lock with no-activity limitation only where target truly has no public product/activity material |
| M6 Product / Activity route exists but is gated/broken/non-public | carry inherited limitation and do not invent mechanics |
| M8-A extraction cannot cover 100% of M8-approved routes | `REPAIR_REQUIRED` before PA application |
| route exists but first extraction is weak for a field/test | targeted re-extraction inside M8 |
| necessary route is absent from M6 | return to M6 repair; do not search or infer |
| candidate has no mechanics after targeted re-extraction | omit candidate and ledger reason |
| candidate has mechanics but no supported archetype after targeted re-extraction | omit or limit candidate; do not force archetype |
| surface evidence remains unsupported after targeted re-extraction | emit empty surface token set with limitation, not invented surface |

### M8.S2D — Source-Mode Scope Rule

`M8.S2D.C1` In `url` and `url_plus_text` modes, Module VIII may derive product/activity rows only from M6-approved URLs/materials and M7 locked context.

`M8.S2D.C2` In `NO_URL_PUBLIC_MATERIAL_ONLY` / `text` mode, Module VIII may emit activity rows only where supplied public material admitted by M6 supports activity existence, mechanics, archetype routing, and surface routing.

`M8.S2D.C3` If supplied material is legal/governance/data-only and contains no feature mechanics, Module VIII must emit a limited or empty `target_feature_profile` with controlled limitations. It must not infer product features from company familiarity, external knowledge, or legal-policy references alone.

`M8.S2D.C4` In document-only mode, archetype and surface routing must be limited to evidence-supported signals in the supplied material. Missing website/product evidence must not be repaired by invention.

---

## M8.S3 — Archetype and Surface Authority

### M8.S3A — Archetype Rule

`M8.S3A.C1` Archetype means what the feature does behaviorally.

`M8.S3A.C2` Archetype is not a legal conclusion.

`M8.S3A.C3` Archetype is not a registry row result.

`M8.S3A.C4` Module VIII must test every emitted activity against every locked archetype code in `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml`: `UNI`, `DOE`, `JDG`, `CMP`, `CRT`, `RDR`, `ORC`, `TRN`, `SHD`, `OPT`, and `MOV`.

`M8.S3A.C5` A feature may trigger more than one archetype.

`M8.S3A.C6` Module VIII must not choose the “best” archetype when multiple archetypes are supported.

`M8.S3A.C7` Module VIII must preserve all supported archetype codes in `target_feature_profile.activities[].archetype_codes[]`.

`M8.S3A.C8` Every emitted feature must contain at least one archetype code.

`M8.S3A.C9` If no archetype can be derived after re-evaluation, the candidate is not a valid emitted feature.

`M8.S3A.C10` Archetype derivation is a core registry-routing substrate.

`M8.S3A.C11` Module VIII must maintain archetype derivation as a standalone execution step governed by `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml.archetype_derivation_matrix`, with `PA.BEH.*` rows and `M8.T1` used only as supporting selector/vocabulary context where consistent with the locked matrix.

`M8.S3A.C12` A single feature may support multiple archetypes. Module VIII must preserve all supported archetypes and must not collapse them into one dominant archetype.

`M8.S3A.C13` Close-call rejected archetypes must be ledgered where material, but rejected archetypes must not be emitted as supported route keys.

`M8.S3A.C14` Module XI exposure routing may consume only emitted, evidence-supported `target_feature_profile.activities[].archetype_codes[]`; it must not infer missing archetypes downstream.

### M8.T1 — Archetype Detection Table

`M8.T1.C0` `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml.archetype_derivation_matrix` is the controlling source for archetype conditions, `trigger_if`, `trigger_with_limitation_if`, `exclude_if`, forbidden-inference checks, and evidence minimums. The table below is a quick route label map only. If it differs from the locked matrix, the locked matrix controls. Do not invent archetype codes beyond the locked matrix.

```yaml
archetype_detection_records:
- table_id: M8.T1
  row_index: 0
  code: '`UNI`'
  name: Universal / Baseline
  match_test: Use only when the activity exists, is tied to the reviewed target, and no narrower archetype is sufficiently proven under the locked matrix.
  hard_exclusion: Do not use UNI as a lazy fallback when a narrower archetype is proven.
- table_id: M8.T1
  row_index: 1
  code: '`DOE`'
  name: The Doer
  match_test: Feature takes autonomous external action on a user/customer’s behalf without per-action human approval.
  hard_exclusion: Agent, automation, workflow, or assistant language alone is insufficient. Needs external action plus autonomy.
- table_id: M8.T1
  row_index: 2
  code: '`JDG`'
  name: The Judge
  match_test: Feature outputs a score, ranking, recommendation, classification, eligibility, risk, or assessment about a human in consequential
    context.
  hard_exclusion: Generic analytics, search, dashboards, or summarization are insufficient without human-consequential decision context.
- table_id: M8.T1
  row_index: 3
  code: '`CMP`'
  name: The Companion
  match_test: Feature forms or sustains ongoing emotional, relational, therapeutic, romantic, child-facing, or companion-like interaction as a
    primary function.
  hard_exclusion: Generic chatbot, support bot, or one-shot assistant is insufficient.
- table_id: M8.T1
  row_index: 4
  code: '`CRT`'
  name: The Creator
  match_test: Feature generates new synthetic, expressive, copyrightable, code, image, audio, video, text, design, or media output.
  hard_exclusion: Retrieval, display, storage, or search without generation/transformation is insufficient.
- table_id: M8.T1
  row_index: 5
  code: '`RDR`'
  name: The Reader
  match_test: Feature ingests, reads, parses, retrieves, analyzes, summarizes, embeds, or processes third-party/customer/user data to function.
  hard_exclusion: No match if no external/customer/user data ingestion is visible.
- table_id: M8.T1
  row_index: 6
  code: '`ORC`'
  name: The Orchestrator
  match_test: Feature dynamically routes, selects, coordinates, or chains requests across multiple models, subprocessors, agents, tools, or execution
    paths.
  hard_exclusion: API, webhook, integration, static workflow, or single model call is insufficient.
- table_id: M8.T1
  row_index: 7
  code: '`TRN`'
  name: The Translator
  match_test: Feature processes audio, voice, speech, diarization, face, voiceprint, biometric, or audio/biometric-derived signals.
  hard_exclusion: Plain text translation, OCR, image generation, or generic multimodal input is insufficient.
- table_id: M8.T1
  row_index: 8
  code: '`SHD`'
  name: The Shield
  match_test: Feature monitors, detects, blocks, filters, investigates, scores, or responds to security, abuse, fraud, integrity, or system-threat
    signals.
  hard_exclusion: Generic trust, security, compliance, safety, or quality language is insufficient.
- table_id: M8.T1
  row_index: 9
  code: '`OPT`'
  name: The Optimizer
  match_test: Feature optimizes pricing, allocation, trading, bidding, logistics, operations, financial outcome, resources, or high-stakes business
    loops.
  hard_exclusion: Generic recommendations or analytics are insufficient.
- table_id: M8.T1
  row_index: 10
  code: '`MOV`'
  name: The Mover
  match_test: Feature controls, directs, navigates, moves, activates, or influences physical systems, devices, robotics, vehicles, sensors, IoT,
    or infrastructure.
  hard_exclusion: Digital workflow automation is insufficient.
```
### M8.S3B — Surface Rule

`M8.S3B.C1` Surface means what data, audience, or operational context the feature touches.

`M8.S3B.C2` Surface is not jurisdiction.

`M8.S3B.C3` Surface is not a law.

`M8.S3B.C4` Surface is not a compliance status.

`M8.S3B.C5` Surface is not a registry conclusion.

`M8.S3B.C6` A feature may trigger more than one surface token.

`M8.S3B.C7` Surface tokens may be empty only when feature mechanics are valid but visible evidence does not support a surface token.

`M8.S3B.C8` Surface derivation is a core registry-routing substrate.

`M8.S3B.C9` Module VIII must maintain surface derivation as a standalone execution step governed by `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml.surface_derivation_matrix`, with `PA.SURF.*` rows and `M8.T2` used only as supporting selector/vocabulary context where consistent with the locked matrix.

`M8.S3B.C10` A single feature may support multiple surface/context tokens. Module VIII must preserve all supported surface tokens and must not collapse them into one dominant surface.

`M8.S3B.C11` Missing surface evidence must be recorded as a limitation or empty supported token set, not repaired by invention.

`M8.S3B.C12` Module XI exposure routing may consume only emitted, evidence-supported `target_feature_profile.activities[].surface_context_tokens[]`; it must not infer missing surfaces downstream.

### M8.T2 — Surface Detection Table

`M8.T2.C0` `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml.surface_derivation_matrix` is the controlling source for surface conditions, `trigger_if`, `trigger_with_limitation_if`, `exclude_if`, forbidden-inference checks, and evidence minimums. The table below is a quick route label map only. If it differs from the locked matrix, the locked matrix controls. Do not invent surface tokens beyond the locked matrix.

```yaml
surface_detection_records:
- table_id: M8.T2
  row_index: 1
  surface_token: '`Consumer-Public`'
  match_test: Feature is offered to, interacts with, or affects public consumers/end users outside purely internal enterprise context.
  hard_exclusion: Public website alone is insufficient.
- table_id: M8.T2
  row_index: 2
  surface_token: '`Enterprise-Private`'
  match_test: Feature is used in business, internal, B2B, enterprise, workspace, admin, or private operational context.
  hard_exclusion: Technical language alone is insufficient.
- table_id: M8.T2
  row_index: 3
  surface_token: '`PII`'
  match_test: Feature visibly collects, processes, stores, generates, analyzes, or transmits identifiable personal/account/contact data.
  hard_exclusion: Do not infer personal data merely because users exist.
- table_id: M8.T2
  row_index: 4
  surface_token: '`Employment`'
  match_test: Feature touches hiring, recruiting, workforce, HR, employees, contractors, productivity monitoring, resumes, candidate screening,
    or workplace decisions.
  hard_exclusion: Generic productivity/business workflow is insufficient.
- table_id: M8.T2
  row_index: 5
  surface_token: '`Sensitive/Biometric`'
  match_test: Feature touches biometric, voiceprint, face, health, special-category, sensitive, intimate, protected, or high-sensitivity data.
  hard_exclusion: Audio/image alone is insufficient without sensitive/biometric context.
- table_id: M8.T2
  row_index: 6
  surface_token: '`Financial`'
  match_test: Feature touches payments, credit, banking, insurance, pricing, trading, lending, billing, spend, procurement, or monetary transactions.
  hard_exclusion: Pricing page alone is insufficient.
- table_id: M8.T2
  row_index: 7
  surface_token: '`Content&IP`'
  match_test: Feature generates, ingests, transforms, analyzes, stores, or distributes creative/content/code/media/documents/IP-bearing material.
  hard_exclusion: Generic text display is insufficient.
- table_id: M8.T2
  row_index: 8
  surface_token: '`Safety&Physical`'
  match_test: Feature affects health, safety, physical harm, emergency, wellbeing, infrastructure safety, critical services, vehicles, robotics,
    or physical-world consequence.
  hard_exclusion: Generic reliability/trust/safety claims are insufficient.
- table_id: M8.T2
  row_index: 9
  surface_token: '`Infrastructure`'
  match_test: Feature operates, secures, monitors, controls, automates, or materially affects production, network, cloud, database, or operational
    infrastructure.
  hard_exclusion: Ordinary SaaS backend/API/cloud/database evidence alone is insufficient.
- table_id: M8.T2
  row_index: 10
  surface_token: '`Minors`'
  match_test: Feature is used by, targeted at, accessible to, or materially affects children, minors, students, youth, or child-facing products.
  hard_exclusion: No match without child/minor/student/youth context.
```

---

## M8.S4 — Inventory and Field Derivation

`M8.S4.C1` Module VIII owns `target_feature_profile` and `target_feature_profile_forensics` only.

`M8.S4.C2` `target_feature_profile` remains the canonical material object. `Product / Activity Profile` is the authorized display label only.

`M8.S4.C3` `target_feature_profile_forensics` is the separate proof object. It is not part of the material profile.

`M8.S4.C4` Material field authority for the Product / Activity Profile comes from `FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml`.

`M8.S4.C5` Module VIII must load the Product / Activity registry selector as derivation authority, but must not execute all 51 PA rows merely because they exist.

```yaml
fd_registry_selector:
  registry_reference: FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml
  profile_section: Product / Activity Profile
  field_id_prefix: PA.
  source_registry_available_rows: 51
  material_output_shape:
    target_feature_profile:
      activities[]:
        - activity_reference
        - product_service_wrapper
        - activity_feature_name
        - activity_candidate_summary
        - mechanics_proof
        - autonomy_human_control_signal
        - data_content_object_touched
        - external_internal_action_signal
        - archetype_codes
        - archetype_proof
        - surface_context_tokens
        - surface_proof_and_routing_limits
      profile_level_limitations: []
  execution_rule:
    - select only PA rows mapped to the locked 12-field routing-first activity card
    - record selected PA row coverage in Module V ledger and M8 forensics
    - route evidence, confidence, labels, close-call details, source URLs, extraction fragments, rejected candidates, and validation logs to forensics only
    - never expand target_feature_profile into the retired multi-branch schema
```

`M8.S4.C6` M8 field families are applied in this routing-first order: Activity Candidate → Mechanics Proof → Archetype Routing → Surface Routing → Routing Limitations.

`M8.S4.C7` The material activity field selector is locked as follows:

| Activity Card Field | Registry Fields to Use | Rule |
|---|---|---|
| `activity_reference` | M8-generated, linked to selected PA rows | Stable downstream handle. Not evidence. |
| `product_service_wrapper` | `PA.INV.002`, optionally `PA.INV.005` | Parent product, platform, API, model, app, integration, deployment surface, or service wrapper. |
| `activity_feature_name` | `PA.INV.001`, optionally `PA.INV.004` | Public/evidence-backed activity name or functional label. |
| `activity_candidate_summary` | `PA.INV.004`, `PA.INV.005`, selected `PA.INV.*` | Short statement of what the public source says the candidate does. |
| `mechanics_proof` | `PA.MECH.001`, `PA.MECH.004`, `PA.MECH.005`, `PA.MECH.006`, `PA.MECH.007` | Actor/user → input/material → system action → output/result → object affected. |
| `autonomy_human_control_signal` | `PA.MECH.008`, `PA.MECH.009`, `PA.MECH.014` | Visible autonomy level and human-control/HITL signal, or controlled limitation after re-extraction. |
| `data_content_object_touched` | `PA.MECH.004`, `PA.MECH.007`, selected `PA.SURF.*` | Data, content, object, media, workflow, transaction, user record, model, endpoint, or asset touched. |
| `external_internal_action_signal` | `PA.MECH.010`, `PA.MECH.011`, `PA.MECH.012` | Delivery channel and whether the activity acts externally, internally, or only within product environment. |
| `archetype_codes` | `PA.BEH.001` + `M8.T1` | Emit all evidence-supported archetypes. At least one required for emitted activity. |
| `archetype_proof` | `PA.BEH.*`, `PA.MECH.*`, `M8.T1` | Explain why each emitted archetype is supported by mechanics and why material close calls were rejected. |
| `surface_context_tokens` | `PA.SURF.001` + `M8.T2` | Emit all evidence-supported surfaces. Empty array allowed only with limitation after testing. |
| `surface_proof_and_routing_limits` | `PA.SURF.*`, `PA.LIM.*`, `PA.BEH.008`, `PA.MECH.014` | Explain why surfaces were selected and what routing limits remain after targeted extraction. |

`M8.S4.C8` Activity evidence rows (`PA.EV.*`) are for forensics only. They must not appear inside `target_feature_profile`.

`M8.S4.C9` Activity limitation rows (`PA.LIM.*`) support `profile_level_limitations[]` and `surface_proof_and_routing_limits`, but detailed limitation proof belongs in forensics.

`M8.S4.C10` Archetype and surface derivation are core registry-routing fields, not secondary descriptive fields.

`M8.S4.C11` `PA.BEH.*` and `PA.SURF.*` rows must be applied in dedicated execution steps and must not be buried under generic mechanics or a generic routing summary.

`M8.S4.C12` Every emitted activity row must preserve all supported `archetype_codes[]`. A single activity may carry more than one archetype.

`M8.S4.C13` Every emitted activity row must preserve all supported `surface_context_tokens[]`. A single activity may carry more than one surface/context token. Empty surface token set is allowed only where mechanics are valid but visible evidence does not support a surface token after targeted re-extraction.

`M8.S4.C14` If mechanics are visible but archetype or surface support is weak, Module VIII must targeted re-extract before limitation. It must not invent archetype/surface tokens to satisfy downstream routing.

`M8.S4.C15` Module XI must consume `target_feature_profile.activities[].archetype_codes[]` and `target_feature_profile.activities[].surface_context_tokens[]` as primary exposure-routing inputs.

`M8.S4.C16` For every selected `PA.*` row, Module VIII must apply the governing `Mode`, `Source_Basis`, `Conditions`, `Trigger_Outcome`, `Exclude_Fallback`, and `Forbidden_Inference`.

`M8.S4.C17` Every substantive populated Product / Activity field must cite the applicable `PA.*` `Field_ID` in Module V and `target_feature_profile_forensics`.

### M8.T3 — Product / Activity FD Registry Selector

```yaml
product_activity_fd_registry_selector:
  table_id: M8.T3
  selector_type: routing_first_material_selector_over_governing_registry
  governing_registry: FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml
  profile_section: Product / Activity Profile
  field_id_prefix: PA.
  source_registry_available_row_count: 51
  canonical_material_output: target_feature_profile
  canonical_forensic_output: target_feature_profile_forensics
  authorized_display_label: Product / Activity Profile
  local_fd_table_replaced: true
  no_local_redefinition: true
  material_activity_card:
    always_present_fields:
      - activity_reference
      - product_service_wrapper
      - activity_feature_name
      - activity_candidate_summary
      - mechanics_proof
      - autonomy_human_control_signal
      - data_content_object_touched
      - external_internal_action_signal
      - archetype_codes
      - archetype_proof
      - surface_context_tokens
      - surface_proof_and_routing_limits
    profile_level_limitations: []
  retired_to_forensics:
    - source URLs
    - evidence quotes
    - evidence strength
    - linked artifact IDs
    - confidence scores
    - raw extraction fragments
    - route coverage rows
    - candidate omission records
    - field derivation rows
    - archetype test rows
    - surface test rows
    - targeted re-extraction rows
    - validation logs
    - old activity_inventory[] branch
    - old activity_mechanics[] branch
    - old vertical_behavior_classification[] branch
    - old surface_context_classification[] branch
    - old registry_routing_substrate branch
    - old activity_evidence[] branch
    - old activity_limitations object
  material_field_execution_rule:
    - complete M8-A source extraction before PA application
    - load PA registry authority
    - apply only selected material PA rows for the 12-field activity card
    - keep archetype and surface routing central
    - preserve multiple archetype_codes[] where supported
    - preserve multiple surface_context_tokens[] where supported
    - write Module V and forensic rows with fd_registry_id, fd_field_id, fd_profile_section, fd_mode, fd_outcome, fallback_code where applicable, evidence basis, targeted re-extraction status, and forbidden_inference_check
```

---

## M8.S5 — Execution Step 1: Input and Scope Check

### Consumes

`M8.S5.C1` Consume locked M7 `target_profile` as context only.

`M8.S5.C2` Consume M7 identity, business-context, product/service-wrapper, and target-profile limitation fields only to interpret public product/activity context. Do not re-profile the target.

`M8.S5.C3` Consume M6 `source_discovery_handoff`.

`M8.S5.C4` Consume `source_discovery_handoff.bucket_family_index.product_activity_profile_urls.families`.

`M8.S5.C5` Consume loaded product-family artifacts `lossless_family__P1_PRODUCT`, `lossless_family__P2_PLATFORM_FEATURE_SOLUTION`, `lossless_family__P3_AI_CAPABILITY_TECHNICAL`, `lossless_family__P4_USE_CASE_INDUSTRY`, and `lossless_family__P5_ENTERPRISE_PRICING`.

`M8.S5.C6` Consume product-family artifact `sources[]` rows as source-custody anchors, including `source_id`, canonical URL, route type, and lossless text where present.

`M8.S5.C7` Consume product-family artifact limitation branches, including `missing_limited_primary_sources[]`, `rejected_sources[]`, `manifest_only_sources[]`, and `metadata_only_sources[]` where present.

### Applies

`M8.S5.C8` Load the PA material selector in `M8.S4`. No material Product / Activity field may be populated until M8-A extraction locks.

`M8.S5.C9` Build the M8-approved route universe from M6 product/activity route families only.

### Writes

`M8.S5.C10` Initialize the material shell only after input custody passes:

```json
{
  "target_feature_profile": {
    "activities": [],
    "profile_level_limitations": []
  }
}
```

`M8.S5.C11` Initialize forensic shell only as pending; it must not be populated before the material profile is completed.

`M8.S5.C12` Write Module V ledger row types:

* `target_feature_profile_input_check`;
* `target_feature_profile_initialization`;
* `feature_target_context_use`;
* `product_activity_route_universe_initialization`.

### Forbidden

`M8.S5.C13` Do not derive activities in Step 1.

`M8.S5.C14` Do not apply PA rows in Step 1.

`M8.S5.C15` Do not use any URL/material not present in M6-approved route universe.

`M8.S5.C16` Do not require old M6 package or lossless payload structures.

### Failure Handling

`M8.S5.C17` Missing M7 `target_profile` means `CONTROLLED_FAILURE`.

`M8.S5.C18` Missing M6 `source_discovery_handoff` means `CONTROLLED_FAILURE`.

`M8.S5.C19` Missing Product / Activity route universe means return to M6 repair or lock with explicit no-public-product/activity limitation only where justified.

---

## M8.S5A — Execution Step 1A: Product / Activity Source Extraction Capsule

### Purpose

`M8.S5A.C1` M8-A exists to prevent schema-shaped hallucination. It forces the model to extract route-grounded product/activity material before PA field application.

`M8.S5A.C2` M8-A is not the forensic output. It is internal working material later summarized and proven in `target_feature_profile_forensics`.

`M8.S5A.C3` M8-A must be completed before M8-B begins.

### Route Coverage Requirement

`M8.S5A.C4` M8 must cover 100% of M6-approved Product / Activity route-family URLs before applying PA rows.

`M8.S5A.C5` For every M8-approved route, write one route coverage row with:

```yaml
m8_route_coverage_row:
  route_url: plain URL or material reference
  route_family: PRODUCT_ROOT | PRODUCT_SLUG | API_ROOT | API_SLUG | MODEL_ROUTE | INTEGRATION_ROUTE | DOCS_ROOT | DOCS_CATEGORY | API_REFERENCE_CATEGORY | PRICING_RATE_LIMIT_CHANGELOG | TARGET_CONTROLLED_SUBDOMAIN | UPLOADED_PUBLIC_MATERIAL | PASTED_PUBLIC_MATERIAL | SYNTHETIC_DEMO_MATERIAL
  source_status: EXTRACTED | EXTRACTED_WITH_LIMITATION | DUPLICATE_CANONICALIZED | NON_PUBLIC_OR_GATED | BROKEN_OR_404 | OUT_OF_SCOPE_FOR_M8_WITH_REASON | RETURN_TO_M6_REPAIR
  extraction_parent_coverage:
    activity_candidate_extraction: COMPLETE | LIMITED | NOT_FOUND | NOT_APPLICABLE
    mechanics_proof_extraction: COMPLETE | LIMITED | NOT_FOUND | NOT_APPLICABLE
    archetype_signal_extraction: COMPLETE | LIMITED | NOT_FOUND | NOT_APPLICABLE
    surface_signal_extraction: COMPLETE | LIMITED | NOT_FOUND | NOT_APPLICABLE
    routing_limitation_extraction: COMPLETE | LIMITED | NOT_FOUND | NOT_APPLICABLE
  targeted_reextraction_needed: true | false
  limitation_or_repair_reason: short reason if not EXTRACTED
```

`M8.S5A.C6` Route existence is not evidence. A route proves only source custody. Field evidence exists only when the capsule extracts field-relevant material from that route.

### Lossless Fragment Rule

`M8.S5A.C7` Extraction must be lossless at the material-fragment level: retain all source-supported text needed to justify candidate admission, mechanics, archetype routing, surface routing, and limitations.

`M8.S5A.C8` Do not summarize away actor, input, system action, output, object touched, autonomy/human-control, delivery channel, external/internal action, archetype signal, or surface signal.

`M8.S5A.C9` Do not dump full pages. Extract only route-grounded fragments relevant to M8 field families.

### Extraction Parents

`M8.S5A.C10` The extraction capsule must be organized under five parents:

```text
1. Activity Candidate Extraction
2. Mechanics Proof Extraction
3. Archetype Signal Extraction
4. Surface Signal Extraction
5. Routing Limitation Extraction
```

`M8.S5A.C11` Activity Candidate Extraction must capture product/service wrapper, public feature/activity name, candidate behavior summary, and candidate source route.

`M8.S5A.C12` Mechanics Proof Extraction must capture actor/user, input/submitted material, system/business action, output/result, object affected, autonomy/human-control signal, delivery channel, external action signal, and internal workflow signal where visible.

`M8.S5A.C13` Archetype Signal Extraction must extract or reject signals relevant to all 11 locked archetype codes in `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml`. It must not preselect only likely archetypes.

`M8.S5A.C14` Surface Signal Extraction must extract or reject signals relevant to all ten surface tests in `M8.T2`. It must not infer sensitive, financial, employment, minors, PII, infrastructure, or biometric surfaces without explicit support.

`M8.S5A.C15` Routing Limitation Extraction must capture thin source, gated source, missing mechanics, unclear input/output, unclear autonomy, unsupported archetype, unsupported surface, and downstream routing effect.

### Targeted Re-Extraction Trigger

`M8.S5A.C16` If any candidate field, archetype test, or surface test is weak after first extraction, that specific field/test must be returned to targeted re-extraction before limitation status.

`M8.S5A.C17` Targeted re-extraction may only use M6-approved routes/materials already in the M8 route universe.

`M8.S5A.C18` If the necessary route is absent from M6, M8 must return to M6 repair instead of searching or inventing.

### Extraction Quality Gate

`M8.S5A.C19` M8-A passes only if:

* every M8-approved route has a route coverage row;
* each extraction parent has coverage status;
* every admitted candidate has mechanics-supporting material or is omitted/limited;
* archetype signals have been extracted/test-ready for all 11 locked archetype codes;
* surface signals have been extracted/test-ready for all ten surfaces;
* targeted re-extraction has been run for weak fields/tests or routed to M6 repair;
* no unapproved source was used.

`M8.S5A.C20` Only after `M8.S5A.C19` passes may the module emit: `PHASE EXTRACTION COMPLETE: PRODUCT_ACTIVITY_SOURCE_CAPSULE 100% ROUTE FAMILY COVERAGE CHECKED`.

---

## M8.S6 — Execution Step 2: Activity Candidate Admission

### Consumes

`M8.S6.C1` Consume M8-A Activity Candidate Extraction parent.

`M8.S6.C2` Consume M8-A Mechanics Proof Extraction parent for minimum mechanics signal.

`M8.S6.C3` Consume locked M7 target context only as context.

### Applies

`M8.S6.C4` Apply `PA.INV.001`, `PA.INV.002`, `PA.INV.004`, and optionally `PA.INV.005` for candidate admission.

### Writes

`M8.S6.C5` Write provisional candidates only in working space with provisional activity reference, wrapper, name, summary, and source route.

`M8.S6.C6` Write Module V ledger row types:

* `feature_candidate_found`;
* `feature_candidate_omitted`;
* `feature_candidate_targeted_reextraction`;
* `feature_product_context_reconciliation`.

### Candidate Admission Test

`M8.S6.C7` Candidate may proceed only if visible functional behavior exists.

`M8.S6.C8` Product, platform, module, solution, pricing tier, package, slogan, page title, marketing claim, route name, API name, model name, or navigation label is not automatically an activity.

`M8.S6.C9` A candidate must have enough extracted mechanics signal to test archetypes. If not, targeted re-extraction is mandatory before omission/limitation.

`M8.S6.C10` Invalid candidates must be omitted from material output and recorded in forensics.

`M8.S6.C11` Every candidate must carry source-backed product/service wrapper or controlled general platform context.

---

## M8.S7 — Execution Step 3: Mechanics Proof Derivation

### Consumes

`M8.S7.C1` Consume admitted candidates from `M8.S6`.

`M8.S7.C2` Consume M8-A Mechanics Proof Extraction parent.

`M8.S7.C3` Consume M8-A Routing Limitation Extraction parent.

### Applies

`M8.S7.C4` Apply `PA.MECH.001`, `PA.MECH.004`, `PA.MECH.005`, `PA.MECH.006`, `PA.MECH.007`, `PA.MECH.008`, `PA.MECH.009`, `PA.MECH.010`, `PA.MECH.011`, `PA.MECH.012`, and `PA.MECH.014`.

### Writes

`M8.S7.C5` Write provisional material values for:

* `mechanics_proof`;
* `autonomy_human_control_signal`;
* `data_content_object_touched`;
* `external_internal_action_signal`.

`M8.S7.C6` Write Module V ledger row types:

* `feature_mechanics_derivation`;
* `feature_tmt_mechanics_signal`;
* `feature_mechanics_targeted_reextraction`;
* `feature_role_derivation`, only where role/category materially informs mechanics.

### Lock-Critical Mechanics

`M8.S7.C7` Every emitted activity must have mechanics proof that accounts for actor/user → input/material → system action → output/result → object affected.

`M8.S7.C8` Every emitted activity must have a supported system action and output/result.

`M8.S7.C9` Autonomy/human-control may be `FIELD_LIMITED`, `FIELD_NOT_PUBLIC`, `FIELD_CONFLICTED`, or `FIELD_NOT_FOUND` only after targeted re-extraction or inherited M6 limitation.

`M8.S7.C10` If system action or output/result remains unsupported after targeted re-extraction, do not emit the activity.

### Forbidden

`M8.S7.C11` Do not infer input/action/output from product category.

`M8.S7.C12` Do not produce data-flow, processing-role, retention, transfer, subprocessor, or legal-basis analysis.

---

## M8.S8 — Execution Step 4: Archetype Routing Derivation

### Consumes

`M8.S8.C1` Consume each mechanically valid candidate from `M8.S7`.

`M8.S8.C2` Consume `mechanics_proof`, `autonomy_human_control_signal`, `data_content_object_touched`, and `external_internal_action_signal`.

`M8.S8.C3` Consume M8-A Archetype Signal Extraction parent.

### Applies

`M8.S8.C4` Apply `PA.BEH.001` for vertical behavior / archetype classification.

`M8.S8.C5` Apply `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml.archetype_derivation_matrix`; use `M8.T1` only as a quick label map where consistent with the locked matrix.

`M8.S8.C6` Apply `PA.BEH.007` and `PA.BEH.008` only for material close-call rejection or limitation handling.

### Writes

`M8.S8.C7` Write only provisional `archetype_codes[]` and `archetype_proof` for each candidate.

`M8.S8.C8` Write Module V ledger row family `feature_archetype_derivation` and project the final rows into `target_feature_profile_forensics.archetype_derivation_ledger[]` using the locked classification row contract in `M8.T4`.

### Required Archetype Test Sequence

`M8.S8.C9` For each mechanically valid candidate, test every locked archetype code: `UNI`, `DOE`, `JDG`, `CMP`, `CRT`, `RDR`, `ORC`, `TRN`, `SHD`, `OPT`, and `MOV`.

`M8.S8.C10` Apply each archetype's locked conditions, `trigger_if`, `trigger_with_limitation_if`, `exclude_if`, and forbidden-inference check from `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml`.

`M8.S8.C11` Emit all matched archetype codes.

`M8.S8.C12` Do not emit unmatched archetype codes.

`M8.S8.C13` Do not choose only one archetype if multiple are supported.

`M8.S8.C14` Do not assign an archetype merely to satisfy the gate.

### Re-Extraction Rule

`M8.S8.C15` If an archetype test is weak, vague, or conflicted, reopen targeted extraction for that archetype test before limitation or rejection.

`M8.S8.C16` If `archetype_codes[]` remains empty after targeted re-extraction and retesting, do not emit the candidate in `activities[]`.

`M8.S8.C17` Removed no-archetype candidates must be recorded in forensics as `feature_candidate_not_emitted_no_archetype`.

### Archetype Ledger Requirement

`M8.S8.C18` For every matched archetype, every material close-call rejected archetype, and every targeted re-extraction archetype test, Module VIII must write a `feature_archetype_derivation` / `archetype_derivation_ledger[]` row with the fields required in `M8.T4`.

### Forbidden

`M8.S8.C19` Do not evaluate registry rows.

`M8.S8.C20` Do not assign threat IDs.

`M8.S8.C21` Do not use `UNI` as a lazy fallback and do not emit Universal registry row routing. `UNI` may be emitted only when the locked matrix permits it and no narrower archetype is sufficiently proven.

`M8.S8.C22` Do not turn archetype classification into legal, compliance, liability, risk, or exposure conclusions.

---

## M8.S9 — Execution Step 5: Surface Routing Derivation

### Consumes

`M8.S9.C1` Consume each candidate with at least one supported archetype.

`M8.S9.C2` Consume mechanics proof and data/content/object touched.

`M8.S9.C3` Consume M8-A Surface Signal Extraction parent.

`M8.S9.C4` Consume M8-A Routing Limitation Extraction parent.

### Applies

`M8.S9.C5` Apply `PA.SURF.001` for surface / context classification.

`M8.S9.C6` Apply `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml.surface_derivation_matrix`; use `M8.T2` only as a quick label map where consistent with the locked matrix.

`M8.S9.C7` Apply `PA.SURF.003`, `PA.SURF.004`, and `PA.SURF.006` only for material surface routing proof or limitation handling.

### Writes

`M8.S9.C8` Write only provisional `surface_context_tokens[]` and `surface_proof_and_routing_limits` for each candidate.

`M8.S9.C9` Write Module V ledger row type `feature_surface_derivation` and project final rows into `target_feature_profile_forensics.surface_token_derivation_ledger[]` using the locked classification row contract in `M8.T4`.

### Surface Rules

`M8.S9.C10` Test visible context against every locked surface token in `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml`: `Consumer-Public`, `Enterprise-Private`, `PII`, `Employment`, `Sensitive/Biometric`, `Financial`, `Content&IP`, `Safety&Physical`, `Infrastructure`, and `Minors`.

`M8.S9.C11` Emit all supported surface tokens.

`M8.S9.C12` Do not emit unsupported surface tokens.

`M8.S9.C13` `surface_context_tokens[]` may be empty only if no surface can be derived from visible evidence after targeted re-extraction and the limitation is recorded.

### Forbidden

`M8.S9.C14` Do not use country, region, law, regulation, compliance framework, legal standard, industry sector, customer type, product category, or approximate label as a surface token. Use only the 10 locked surface tokens.

`M8.S9.C15` Do not infer sensitive, biometric, financial, employment, minors, PII, or infrastructure surfaces without explicit support.

---

## M8.S10 — Execution Step 6: Activity Finalization

### Consumes

`M8.S10.C1` Consume mechanically valid candidates.

`M8.S10.C2` Consume archetype derivation results.

`M8.S10.C3` Consume surface derivation results.

`M8.S10.C4` Consume routing limitation results.

### Applies

`M8.S10.C5` Apply selected `PA.INV.*`, `PA.MECH.*`, `PA.BEH.*`, `PA.SURF.*`, and `PA.LIM.*` material selector rows before finalizing each activity row.

### Writes

`M8.S10.C6` Write only `target_feature_profile.activities[]` rows using the locked 12-field routing-first activity card.

`M8.S10.C7` Write Module V ledger row types:

* `feature_candidate_emitted`;
* `feature_quality_derivation`;
* `feature_routing_profile_finalization`.

### Finalization Rules

`M8.S10.C8` Emit only activities with all 12 locked activity keys in `M8.S15`.

`M8.S10.C9` Emit only activities with mechanics proof.

`M8.S10.C10` Emit only activities with at least one archetype code.

`M8.S10.C11` Emit only activities with surface-context token array present. Empty array is allowed only under `M8.S9.C13`.

`M8.S10.C12` Emit only activities with archetype proof and surface proof/routing limitation handling.

`M8.S10.C13` Evidence refs and source URLs are required in Module V ledger and `target_feature_profile_forensics`, but must not be emitted inside `target_feature_profile`.

---

## M8.S11 — Execution Step 7: Evidence Mapping to Forensics

### Consumes

`M8.S11.C1` Consume completed `target_feature_profile`.

`M8.S11.C2` Consume M8-A route coverage rows and extraction capsule.

`M8.S11.C3` Consume Module V ledger rows for selected PA fields.

### Applies

`M8.S11.C4` Apply `PA.EV.*` rows for activity evidence mapping as forensic/audit support only.

### Writes

`M8.S11.C5` Write evidence mapping only to Module V ledger and later `target_feature_profile_forensics`.

`M8.S11.C6` Write Module V ledger row type `feature_evidence_mapping`.

### Forbidden

`M8.S11.C7` Do not create evidence entries for empty arrays, schema-only fields, unsupported values, or non-substantive metadata.

`M8.S11.C8` Do not cite non-routed, rejected, quarantined, access-failed-only, duplicate-suppressed-only, snippet-only, or otherwise unapproved source material.

`M8.S11.C9` Do not quote unsupported text.

`M8.S11.C10` Do not emit activity evidence, evidence-basis objects, linked-source fields, or confidence fields inside `target_feature_profile`.

---

## M8.S12 — Execution Step 8: Limitations Assembly

### Consumes

`M8.S12.C1` Consume M6 missing/limited primary source context.

`M8.S12.C2` Consume M8-A extraction limitations, omitted candidates, unclear product context, failed mechanics, failed archetype derivations, weak evidence, partial support, unsupported surfaces, and missing or unauthorized-cross-route states.

### Applies

`M8.S12.C3` Apply `PA.MECH.014`, `PA.BEH.008`, `PA.SURF.006`, and `PA.LIM.001` through `PA.LIM.009` for Product / Activity limitations.

### Writes

`M8.S12.C4` Write only `target_feature_profile.profile_level_limitations[]` and activity-level short limitation text inside `surface_proof_and_routing_limits` where material.

`M8.S12.C5` Write Module V ledger row type `feature_limitation_carry_forward`.

### Forbidden

`M8.S12.C6` Do not turn limitations into findings, recommendations, legal conclusions, registry triggers, or data-provenance conclusions.

`M8.S12.C7` Do not emit the old `activity_limitations` object.

---

## M8.S13 — Working Ledger and Forensic Projection

`M8.S13.C1` Module VIII ledger is governed by Module V. `target_feature_profile_forensics` is a separate saved proof artifact built after `target_feature_profile`.

`M8.S13.C2` Required Module VIII ledger row types:

* `fd_row_application_workpad`;
* `fd_row_reinvestigation`;
* `fd_row_fallback_or_exclusion`;
* `target_feature_profile_input_check`;
* `target_feature_profile_initialization`;
* `feature_target_context_use`;
* `product_activity_route_universe_initialization`;
* `product_activity_source_route_coverage`;
* `product_activity_extraction_capsule`;
* `feature_candidate_found`;
* `feature_candidate_omitted`;
* `feature_candidate_targeted_reextraction`;
* `feature_mechanics_derivation`;
* `feature_mechanics_targeted_reextraction`;
* `feature_tmt_mechanics_signal`;
* `feature_role_derivation`, only where role/category materially informs mechanics;
* `feature_archetype_derivation`;
* `feature_archetype_reopened`;
* `feature_surface_derivation`;
* `feature_surface_reopened`;
* `feature_candidate_not_emitted_no_archetype`;
* `feature_candidate_emitted`;
* `feature_quality_derivation`;
* `feature_routing_profile_finalization`;
* `feature_evidence_mapping`;
* `feature_cross_route_evidence_use`, only if cross-route approved material supports an M8 field;
* `feature_limitation_carry_forward`;
* `target_feature_profile_forensics_build`;
* `target_feature_profile_lock_check`.

`M8.S13.C3` No separate hidden scratchpad object is authorized. The Module V `target_feature_profile_ledger` is the sole scratchpad/workpad and must contain one final workpad row for every selected material `PA.*` row, including archetype and surface rows selected for emitted activities.

`M8.S13.C4` `target_feature_profile_forensics` must include:

```yaml
target_feature_profile_forensics:
  product_activity_source_route_coverage_ledger: []
  product_activity_extraction_capsule_summary: []
  candidate_admission_and_omission_ledger: []
  selected_pa_field_derivation_ledger: []
  activity_mechanics_derivation_ledger: []
  archetype_derivation_ledger: []
  surface_token_derivation_ledger: []
  targeted_re_extraction_ledger: []
  activity_limitations_ledger: []
  cross_route_use_ledger: []
  validation_quality_control_result: ""
  runtime_trace_m8_only: ""
  forensic_boundary: ""
```

`M8.S13.C5` Forensics must not contain chain-of-thought, hidden scratchpad, secrets, API keys, or legal conclusions.

`M8.S13.C6` Module V ledger rows must persist through Module XIV.

`M8.S13.C7` Module XIII may later reference `target_feature_profile` and `target_feature_profile_forensics`, but must not merge them into one clumped output.

### M8.T4 — Required Classification Derivation Ledger Row Contract

`M8.T4.C1` `target_feature_profile_forensics.archetype_derivation_ledger[]` and `target_feature_profile_forensics.surface_token_derivation_ledger[]` must use the locked forensic row contract from `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml`.

| Field | Required Rule |
|---|---|
| `activity_reference` | emitted or omitted activity being tested |
| `classification_type` | `ARCHETYPE` or `SURFACE` |
| `code` | exact locked archetype code or exact locked surface token |
| `conditions[]` | condition rows tested separately before trigger application |
| `trigger_if` | boolean logic copied from the locked matrix |
| `trigger_result` | `TRIGGERED`, `TRIGGERED_WITH_LIMITATION`, `NOT_TRIGGERED`, `NOT_EVIDENCED`, or `EXCLUDED` |
| `trigger_with_limitation_if` | limitation trigger copied from locked matrix |
| `exclude_if` | exclusion rule copied from locked matrix |
| `exclusion_result` | `EXCLUDED` or `NOT_EXCLUDED` |
| `forbidden_inference_check` | `PASS` or `FAIL` |
| `confidence` | `HIGH`, `MEDIUM`, or `LOW` |
| `limitation_if_any` | concise limitation or `NONE` |

`M8.T4.C2` Each `conditions[]` item must contain `condition_id`, `condition_text`, `result`, `source_ref`, `source_url`, and `evidence_summary`.

`M8.T4.C3` Every `TRUE` condition must include a loaded source ID and exact `source_url`. `FALSE` or `NOT_EVIDENCED` rows may use controlled `N/A` values for source fields where no source exists, but must still record the condition tested.

`M8.T4.C4` Every emitted archetype/surface value must have a corresponding derivation ledger row with `trigger_result` equal to `TRIGGERED` or `TRIGGERED_WITH_LIMITATION`. Every triggered derivation ledger row must be emitted in the matching activity row.

---

## M8.S14 — Lock Gate

`M8.S14.C0A` Module VIII lock defects must be classified under `M8.S14.C0B–C0E` and the `00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md` Section 8 Repair Routing Matrix.

`M8.S14.C0B` Missing M7 profile, missing M6 route universe, unauthorized source use, source discovery, registry evaluation, legal cartography, data provenance, target re-profiling, archetype forcing, surface invention, or old multi-branch profile emission is `CRITICAL_BLOCKER`.

`M8.S14.C0C` Emitted activity with missing mechanics proof, unsupported mechanics, missing archetype proof, unsupported archetype, missing surface test, or missing route coverage is `REPAIRABLE_FAILURE`; if unresolved after targeted re-extraction, remove or limit the candidate and ledger the reason.

`M8.S14.C0D` Empty activity inventory caused by thin public evidence may be `PASS_WITH_LIMITATION` only if 100% M8 route coverage, candidate review, and limitation rows are present.

`M8.S14.C0E` Close-call archetype exclusions are `FORENSIC_LEDGER_ONLY` if the emitted archetype set remains evidence-supported and all material close calls are ledgered.

`M8.S14.C1` Lock only if M7 `target_profile` exists or controlled failure is preserved.

`M8.S14.C2` Lock only if M6 `source_discovery_handoff` exists or controlled failure is preserved.

`M8.S14.C3` Lock only if 100% of M6-approved Product / Activity route-family URLs have route coverage rows.

`M8.S14.C4` Lock only if M8-A extraction checkpoint passed before PA application.

`M8.S14.C5` Lock only if all populated substantive fields are derived through the selected `PA.*` material selector in `M8.S4` or are expressly module-native stable references.

`M8.S14.C6` Lock only if all evidence refs in Module V and forensics resolve to M6-approved routes/materials or authorized locked upstream object paths.

`M8.S14.C7` Lock only if cross-route material use, if any, is M8-field-relevant, cited, and ledgered.

`M8.S14.C8` Lock only if cross-route material use did not perform target profiling, legal cartography, data provenance, registry evaluation, challenge, handoff, report, or terminal work.

`M8.S14.C9` Lock only if no unapproved source material, candidate lead, search snippet, rejected material, quarantined material, access-failed-only material, deferred material, duplicate-suppressed-only material, or non-routed material was used as evidence.

`M8.S14.C10` Lock only if `target_feature_profile` has exactly two top-level keys: `activities` and `profile_level_limitations`.

`M8.S14.C11` Lock only if every emitted activity has exactly these keys: `activity_reference`, `product_service_wrapper`, `activity_feature_name`, `activity_candidate_summary`, `mechanics_proof`, `autonomy_human_control_signal`, `data_content_object_touched`, `external_internal_action_signal`, `archetype_codes`, `archetype_proof`, `surface_context_tokens`, and `surface_proof_and_routing_limits`.

`M8.S14.C12` Lock only if every emitted activity has mechanics proof.

`M8.S14.C13` Lock only if every emitted activity has at least one archetype code.

`M8.S14.C14` Lock only if every emitted activity has Module V and forensic `feature_archetype_derivation` rows supporting its archetype codes.

`M8.S14.C15` Lock only if every emitted activity with material close-call archetype risk has ledgered close-call exclusion reasoning.

`M8.S14.C16` Lock only if every emitted activity has `surface_context_tokens[]` present; an empty array is allowed only where unsupported surface evidence is ledgered or limited after targeted re-extraction.

`M8.S14.C17` Lock only if every emitted activity has `archetype_proof` and `surface_proof_and_routing_limits` explaining routing decisions and remaining limitations.

`M8.S14.C18` Lock only if all 11 locked archetype codes were tested for every mechanically valid emitted activity.

`M8.S14.C19` Lock only if all ten surface tokens were tested for every emitted activity.

`M8.S14.C20` Lock only if no activity has `archetype_codes[] = []`.

`M8.S14.C21` If any candidate has `archetype_codes[] = []`, Module VIII must reopen archetype derivation for that candidate before lock.

`M8.S14.C22` If reopened derivation still produces no archetype, the candidate must not be emitted in `activities[]` and must be recorded in forensics as `feature_candidate_not_emitted_no_archetype`.

`M8.S14.C23` Lock only if no archetype was forced without evidence.

`M8.S14.C24` Lock only if no surface token was inferred without explicit support.

`M8.S14.C25` Limitation statuses `FIELD_LIMITED`, `FIELD_NOT_PUBLIC`, `FIELD_CONFLICTED`, and `FIELD_NOT_FOUND` are invalid unless targeted re-extraction occurred or the limitation was inherited from M6 source status.

`M8.S14.C26` Lock only if `target_feature_profile` is completed before `target_feature_profile_forensics` is built.

`M8.S14.C27` Lock only if no forensic/provenance material appears inside `target_feature_profile`.

`M8.S14.C28` Lock only if `target_feature_profile_forensics` includes route coverage, extraction capsule summary, candidate admission/omission, PA derivation, mechanics derivation, archetype derivation, surface derivation, targeted re-extraction, limitations, cross-route use, validation/QC, runtime trace, and forensic boundary.

`M8.S14.C29` Lock only if every selected material `PA.*` row has a Module V or forensic workpad row with `fd_registry_id`, `fd_field_id`, `fd_profile_section`, `fd_mode`, `fd_outcome`, applicable refs, fallback code where applicable, targeted re-extraction status where applicable, and `forbidden_inference_check`.

`M8.S14.C30` If any selected material `PA.*` row lacks a final outcome, Module VIII must reopen only that row, targeted re-extract within M6-approved routes/materials, and record `FD_ROW_WORKPAD_GAP` before repair.

`M8.S14.C31` Silent skipping is forbidden.

`M8.S14.C32` If all gates pass, set `lock_status = "LOCKED"` in the phase-local gate / ledger, not inside `target_feature_profile`.

`M8.S14.C33` If usable but limited, set `lock_status = "LOCKED_WITH_LIMITATIONS"` in the phase-local gate / ledger, not inside `target_feature_profile`.

`M8.S14.C34` If unsafe or unusable, set `lock_status = "CONTROLLED_FAILURE"` in the phase-local gate / ledger, not inside `target_feature_profile`.

`M8.S14.C35` The following keys are forbidden inside `target_feature_profile`: `profile_meta`, `activity_inventory`, `activity_mechanics`, `vertical_behavior_classification`, `surface_context_classification`, `registry_routing_substrate`, `activity_evidence`, `activity_limitations`, `public_evidence_basis`, `mechanics_evidence_basis`, `matched_evidence`, `surface_evidence`, confidence fields, source URL fields, route coverage rows, extraction fragments, validation logs, and compatibility wrappers.

---

## M8.S15 — Output Contract

`M8.S15.C1` Module VIII emits `target_feature_profile` first and `target_feature_profile_forensics` second.

`M8.S15.C2` `target_feature_profile` is the canonical material object. `Product / Activity Profile` is the report/display label only.

`M8.S15.C3` `target_feature_profile_forensics` is the canonical forensic/provenance object. It must not be clumped into `target_feature_profile`.

`M8.S15.C4` `target_feature_profile` must contain exactly these top-level fields:

```json id="m8-output-contract"
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

`M8.S15.C5` `target_feature_profile_forensics` must contain exactly the proof families listed in `M8.S13.C4`.

`M8.S15.C6` Each emitted activity must connect the activity to product/service wrapper context. If the parent product, platform, API, model, app, service wrapper, or offering is not clear from M6-approved public evidence, use a controlled limitation and disclose it in `surface_proof_and_routing_limits` and `profile_level_limitations[]` where material.

`M8.S15.C7` `mechanics_proof` must be a compact TMT-relevant proof chain, not a vague product summary. It must account for actor/user, input/material, system action, output/result, and object affected where supported.

`M8.S15.C8` `autonomy_human_control_signal`, `data_content_object_touched`, and `external_internal_action_signal` are not decorative details. They exist to prove or reject archetype and surface routing.

`M8.S15.C9` `archetype_proof` must explain why each emitted archetype code was selected based on mechanics and hard-exclusion tests.

`M8.S15.C10` `surface_proof_and_routing_limits` must explain why each emitted surface/context token was selected and what limitation remains where support is partial.

`M8.S15.C11` Archetype and surface material remain first-class through `activities[].archetype_codes[]`, `activities[].archetype_proof`, `activities[].surface_context_tokens[]`, and `activities[].surface_proof_and_routing_limits`. They are not optional display summaries; they are the core route substrate consumed by Module XI.

`M8.S15.C12` Apply `M8.T0`, `M8.S1C`, `M8.S3`, `GRK.006`, `GRK.007`, `GRK.008`, `GRK.009`, `GRK.015`, and `GRK.016` to the Module VIII output boundary. Module VIII must not emit legal/data/registry/final-output/report/recommendation branches, aliases, compatibility wrappers, old multi-branch activity sections, source/provenance inside the material profile, or extra output keys.
