# MODULE XI — REGISTRY HANDSHAKE AND EXPOSURE PROFILE
## Runtime-Synced / Full Triggered-Controlled Emission Upgrade

<phase_call_card>
phase_id: M11_EXPOSURE_REGISTRY
module_id: M11
module_name: REGISTRY_HANDSHAKE_AND_EXPOSURE_PROFILE
active_phase_only: true
active_agent: agent_5_exposure_registry
canonical_route_plan_output: exposure_registry_route_plan
canonical_batch_output_pattern: exposure_registry_batch__{GROUP}__{NNN}
canonical_batch_validation_pattern: exposure_registry_batch_validation__{GROUP}__{NNN}
canonical_workpad_output: exposure_registry_workpad_98
canonical_material_outputs:
  - exposure_registry_controlled_profile
  - exposure_registry_triggered_profile
canonical_forensic_output: exposure_registry_profile_forensics

module_design_lock:
  M11 is the only registry-evaluation module.
  M11 evaluates all active AI Threat Registry rows against locked upstream artifacts and admitted evidence.
  M11 execution is batched. No production backend call may require one model call to evaluate all 98 registry rows.
  M11 model calls evaluate only the Threat_IDs assigned to the active batch instance.
  M11 preserves full registry-row accountability, all LEP selector outcomes, route planning, trigger/evaluation decisions, evidence binding, self-checks, lock-gates, and emission reconciliation inside persisted workpad/forensic artifacts.
  M11 material output is split into two deterministic reader-facing artifacts: `exposure_registry_controlled_profile` and `exposure_registry_triggered_profile`.
  M11 does not issue legal advice, legal applicability conclusions, compliance conclusions, liability findings, breach findings, final legal-risk verdicts, final report output, compiler output, or renderer output.

runtime_binding_expectation:
  active_agent_id: agent_5_exposure_registry
  active_agent_name: Interface Exposure Registry Agent
  active_phase_scope: M11_EXPOSURE_REGISTRY

governing_imports:
  - 00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md
  - AGENT5_RUNTIME_BINDING_PACKET.yaml
  - 00_TERMINAL_RECEIPT_RULES_INTEGRATED.md
  - 00_VALIDATOR_RULES_INTEGRATED.md
  - AGENT5_BACKEND_OUTPUT_CONTRACT_SYNCED_M11.md
  - AI_THREAT_REGISTRY.yaml
  - REGISTRY_KEY_v3_0.md
  - 03_REGISTRY_EVALUATION_RULES.yaml
  - FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml
  - FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml
  - locked Agent 1 source/legal artifact contracts
  - locked Agent 3 M7/M8 material and forensic artifact contracts
  - locked Agent 4 M10 material and forensic artifact contracts

execution_rule:
  Execute M11 only.
  Read only locked upstream artifacts approved for Agent 5.
  Load and account for all 98 active AI Threat Registry rows.
  Apply all 22 LEP selector rows from the Field Derivation Registry.
  For each registry row, treat `AI_THREAT_REGISTRY.yaml` row metadata plus `Hunter_Trigger` as the mandatory row-level derivation authority.
  The `Hunter_Trigger` column is the registry signal / detection-logic column. It contains the row-specific `CONDITION_N`, `TRIGGER_IF`, and `EXCLUDE_IF` logic.
  `03_REGISTRY_EVALUATION_RULES.yaml` supplies the mandatory evaluation procedure for applying each row's `Hunter_Trigger`.
  No M11 batch may derive trigger status, control/exclude status, or final material status from intuition, summary, archetype name, surface label, category label, or prior model memory.
  Do not evaluate all 98 rows in a single model call.
  Deterministically create `exposure_registry_route_plan` before any registry-row evaluation.
  Route UNI rows first.
  Batch evaluation-routed rows by UNI/archetype/surface grouping with a maximum of 8 rows per model batch.
  Each model batch must evaluate only its assigned `expected_threat_ids`.
  Each model batch must produce a row-level registry ledger slice for its assigned Threat_IDs only.
  Each batch ledger must be challenged by M12 batch validation before it becomes an accepted persisted batch artifact.
  Each accepted batch must be saved as `exposure_registry_batch__{GROUP}__{NNN}` and paired with `exposure_registry_batch_validation__{GROUP}__{NNN}`.
  Preserve exactly one final registry-row workpad outcome per active Threat_ID in `exposure_registry_workpad_98` and `exposure_registry_profile_forensics`.
  Build `exposure_registry_workpad_98` deterministically from accepted batch artifacts, M12 batch validation artifacts, and deterministic not-applicable rows.
  Build `exposure_registry_controlled_profile` deterministically from `exposure_registry_workpad_98` using only final CONTROLLED rows.
  Build `exposure_registry_triggered_profile` deterministically from `exposure_registry_workpad_98` using only final TRIGGERED rows.
  Build `exposure_registry_profile_forensics` only after both split material artifacts are complete, validated, and saved.
  Every final CONTROLLED row must appear in `exposure_registry_controlled_profile.controlled_rows[]`.
  Every final TRIGGERED row must appear in `exposure_registry_triggered_profile.triggered_rows[]`.
  A CONTROLLED row that is limited must still be emitted as CONTROLLED with limitation text.
  A TRIGGERED row that is weak/conflicting must still be emitted as TRIGGERED with limitation text.
  Do not emit summaries, counts, category buckets, matrices, review registers, controlled-only wrappers outside the controlled profile, triggered-only wrappers outside the triggered profile, grouped rows, or partial material rows.
  Do not perform M6, M7, M8, M9, M10, M12 global challenge, M13, M14, compiler, renderer, or report work.
  Do not mutate upstream profiles, registry metadata, registry rows, or source-discovery custody.
  Do not emit `operator_challenge_gate`, `challenge_gate`, `final_output_handoff`, report prose, HTML, markdown, renderer output, or terminal report output from any M11 batch or M11 material/forensic save boundary.
  After each local output boundary, use the backend validator/save gate required for that boundary. Do not use visible same-chat phase packets in backend execution.

internal_stage_order:
  - PHASE A / M11-A: Exposure Source, Registry, and Upstream Evidence Extraction Capsule
    - M11-A1: Runtime and Registry Handshake
    - M11-A2: Input Custody and Upstream Artifact Gate
    - M11-A3: Legal/Governance Lossless Bucket Extraction
    - M11-A4: Full Registry Inventory and LEP Selector Load
    - M11-A5: Deterministic Internal Registry Route Planning
    - M11-A6: Deterministic Batch Plan Formation
    - M11-A7: Save `exposure_registry_route_plan`
  - PHASE B / M11-B: Batched Registry Row Evaluation
    - M11-B1: Batch Packet Formation
    - M11-B2: Model-Led Trigger Adjudication for active batch only
    - M11-B3: Evidence Binding for active batch only
    - M11-B4: Model-Led Control / Exclude Evaluation for active batch only
    - M11-B5: Batch Registry Ledger Slice Assembly
    - M11-B6: Batch Mechanical Validation
  - PHASE B2 / M12-BATCH: External M12 Batch Validation Gate
    - M12 validates the active batch only.
    - M11 batch artifacts are not accepted until M12 batch validation passes, passes with limitation, or records controlled failure.
  - PHASE C / M11-C: Deterministic Canonical 98-Row Workpad Merge
  - PHASE D / M11-D: Deterministic Controlled Material Projection
  - PHASE E / M11-E: Deterministic Triggered Material Projection
  - PHASE F / M11-F: Exposure Profile Forensics Derivation and Save Gate

phase_terminal_sequence:
  In backend execution, return strict JSON only.
  Do not emit `<phase_output>` blocks.
  Do not emit checkpoint prose.
  Do not emit terminal receipt text.
  Do not emit audit logs, operator challenge gates, final handoff JSON, report prose, HTML, markdown, or renderer payload.
  M11 has multiple backend output boundaries, not one combined response.
  M11 route-plan boundary saves exactly one artifact: `exposure_registry_route_plan`.
  M11 batch boundary returns exactly one batch ledger object for the active batch only. The backend persists accepted batch ledgers as `exposure_registry_batch__{GROUP}__{NNN}` only after M12 batch validation.
  M11 canonical merge boundary saves exactly one artifact: `exposure_registry_workpad_98`.
  M11 controlled material boundary saves exactly one artifact: `exposure_registry_controlled_profile`.
  M11 triggered material boundary saves exactly one artifact: `exposure_registry_triggered_profile`.
  M11 forensic boundary saves exactly one artifact: `exposure_registry_profile_forensics`.
  A response that contains more than the active boundary artifact is invalid unless the operator has explicitly invoked a non-production debug bundling mode.

phase_local_gate:
  Before handoff, verify:
    - active runtime binding resolves to Agent 5 / M11 only.
    - all required Agent 1, Agent 3, and Agent 4 artifacts exist or controlled limitation/failure is recorded.
    - `AI_THREAT_REGISTRY.yaml`, `REGISTRY_KEY_v3_0.md`, `03_REGISTRY_EVALUATION_RULES.yaml`, and LEP selector authority are loaded.
    - expected active registry row count is 98 and loaded active registry row count is 98.
    - all 22 LEP selector rows have final workpad outcomes.
    - all 98 active registry rows have exactly one final registry-row workpad outcome in `exposure_registry_workpad_98`.
    - every registry-row workpad outcome contains exactly one Threat_ID.
    - no grouped rows, composite Threat_ID rows, category rows, material-public-route rows, or compact route summaries appear.
    - patched M8 activity paths are used: `activity_reference`, `product_service_wrapper`, `activity_feature_name`, `mechanics_proof`, `data_content_object_touched`, `archetype_codes`, `surface_context_tokens`, `surface_proof_and_routing_limits`.
    - stale M8 paths are rejected: `activity_id`, `product_context`, `activity_name`, `mechanics`, `surface_tokens`, `routing_basis`, `activity_inventory`, `activity_mechanics`, `registry_routing_substrate`.
    - M10 main and M10 forensics are consumed only as locked upstream artifacts; M10 data provenance is not re-derived.
    - trigger status and evaluation status remain separate in batch ledger/workpad/forensics.
    - every final CONTROLLED row appears in `exposure_registry_controlled_profile.controlled_rows[]`.
    - every final TRIGGERED row appears in `exposure_registry_triggered_profile.triggered_rows[]`.
    - the emission manifest shows no missing triggered rows, no missing controlled rows, no duplicate emitted Threat_IDs, and no wrong-status emitted rows.
    - every emitted material row uses exactly the locked seven-column row contract.
    - `exposure_registry_controlled_profile` contains no key except `controlled_rows`.
    - `exposure_registry_triggered_profile` contains no key except `triggered_rows`.
    - `exposure_registry_profile_forensics` is separate and emitted only after both split material artifacts are saved.
    - no legal advice, compliance conclusion, legality conclusion, legal applicability conclusion, liability finding, breach finding, enforceability verdict, risk score, or high/low legal-risk verdict appears.
    - no M12 global challenge, M13, M14, compiler, renderer, or final canonical object is emitted by M11.

allowed_gate_outcomes:
  - PASS
  - PASS_WITH_WARNING
  - PASS_WITH_LIMITATION
  - REINVESTIGATION_COMPLETED_WITH_LIMITATION
  - SOURCE_REPAIR_REQUIRED
  - CONTROLLED_FAILURE

allowed_inputs:
  - source_discovery_handoff
  - legal_cartography_index
  - source_discovery_handoff.bucket_family_index.legal_governance_profile_urls.families
  - source_discovery_handoff.contract.source_text_location
  - lossless_family__L1_CORE_TERMS_PRIVACY
  - lossless_family__L2_B2B_CONTRACTING
  - lossless_family__L3_AI_USAGE_GOVERNANCE
  - lossless_family__L4_PRIVACY_ADJACENT_NOTICES
  - lossless_family__L5_LEGAL_HUB_HOSTED
  - lossless_family__L6_ENTITY_NOTICE
  - target_profile
  - target_profile_forensics
  - target_feature_profile
  - target_feature_profile_forensics
  - data_provenance_profile
  - data_provenance_profile_forensics
  - AI_THREAT_REGISTRY.yaml
  - REGISTRY_KEY_v3_0.md
  - 03_REGISTRY_EVALUATION_RULES.yaml
  - FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml LEP.* authority
  - FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml forensic authority
  - admitted M6 registry/product/legal/data/control evidence and limitations

required_machine_output_by_boundary:
  ROUTE_PLAN_SAVE_EVENT:
    - exposure_registry_route_plan
  BATCH_EVALUATION_EVENT:
    - m11_batch_registry_ledger
  BATCH_ACCEPTED_SAVE_EVENT:
    - exposure_registry_batch__{GROUP}__{NNN}
    - exposure_registry_batch_validation__{GROUP}__{NNN}
  CANONICAL_98_MERGE_EVENT:
    - exposure_registry_workpad_98
  CONTROLLED_MATERIAL_SAVE_EVENT:
    - exposure_registry_controlled_profile
  TRIGGERED_MATERIAL_SAVE_EVENT:
    - exposure_registry_triggered_profile
  FORENSIC_SAVE_EVENT:
    - exposure_registry_profile_forensics

forbidden_outputs:
  - operator_challenge_gate
  - challenge_gate
  - final_output_handoff
  - exposure_summary
  - material_exposure_findings
  - absent_not_triggered_registry_rows
  - registry_coverage_matrix
  - activity_to_exposure_matrix
  - data_asset_to_exposure_matrix
  - legal_control_to_exposure_matrix
  - review_priority_register
  - exposure_limitations as separate material profile branch
  - grouped route rows
  - composite Threat_ID rows
  - material public route summaries
  - compact registry categories
  - old M8 path names
  - legal/compliance verdicts
  - target_exposure_profile as production backend material root
  - target_exposure_profile_forensics as production backend forensic root
  - exposure_registry_profile as production backend combined material root

validator_action:
  action_name: backend_validate_and_save_M11_BATCHED_EXPOSURE_REGISTRY
  phase: M11_EXPOSURE_REGISTRY
  pass_condition: M11 route plan saved; every model-routed batch evaluated and M12 batch-validated; `exposure_registry_workpad_98` contains 98/98 registry workpad coverage; 22/22 LEP selector coverage preserved; controlled rows projected into `exposure_registry_controlled_profile`; triggered rows projected into `exposure_registry_triggered_profile`; `exposure_registry_profile_forensics` preserves full row-level accountability, legal/governance lossless source extraction coverage where used, clean emission manifest, batch index, and M12 batch validation index.
  fail_behavior: repair the smallest affected M11 unit only; do not advance to M12 global challenge.

repair_policy:
  - Repair in M11 means targeted registry-row, evidence-path, LEP-selector, emitted-row, batch-ledger, workpad, projection, or forensic-ledger reinvestigation first; not immediate hard blocking, silent row suppression, summary substitution, or status downgrade.
  - If a batch row, route decision, trigger decision, evaluation status, visible-control basis, evidence binding, LEP selector outcome, seven-column emitted row, emission-manifest entry, legal/governance lossless evidence use, or forensic ledger row is inadequate, unsupported, weak, thin, vague, conflicting, or wrong, repair the smallest affected unit.
  - If the defect is batch-local, rerun only the affected `M11_BATCH_EVALUATE::{GROUP}::{NNN}` and its paired M12 batch validation.
  - Re-evaluate the affected Threat_ID or LEP row using the governing `AI_THREAT_REGISTRY.yaml`, `03_REGISTRY_EVALUATION_RULES.yaml`, `REGISTRY_KEY_v3_0.md`, selected `LEP.*` authority, patched M8 activity paths, M10 data/control substrate, M9 legal/governance navigation, and admitted legal/governance lossless evidence.
  - If a row can be supported after targeted reinvestigation, preserve or repair the supported final material status: `TRIGGERED` or `CONTROLLED`.
  - If a row remains weak, access-limited, conflicting, or partially supported after targeted reinvestigation, keep the correct final material status where registry logic requires TRIGGERED or CONTROLLED, add controlled limitation/review-route text in `row_limitations`, and record the limitation in `exposure_registry_profile_forensics`.
  - If the row is not TRIGGERED or CONTROLLED after proper evaluation, preserve it in workpad/forensic accountability only; do not emit it in either split material profile.
  - Proceed only after every weakness, conflict, not-visible state, access failure, review-required state, omission, or limitation is controlled and ledgered.
  - Do not solve missing emitted rows by downgrading, suppressing, grouping, summarizing, or moving the row into a count/category branch.
  - Do not recompute unrelated upstream objects.
  - Only route back to Agent 1 / M6 source repair when the source universe, legal/governance lossless buckets, or admitted evidence custody is missing, corrupted, inaccessible, or contradictory in a way M11 cannot repair from loaded artifacts.
  - Only route back to Agent 3 or Agent 4 when a locked upstream profile artifact itself is missing, malformed, or contradictory in a way M11 cannot repair without mutating that upstream artifact.

stop_condition:
  Stop local M11 execution only; return control to the backend runner.
  The backend runner may advance to M12 global challenge only after `exposure_registry_workpad_98`, `exposure_registry_controlled_profile`, `exposure_registry_triggered_profile`, and `exposure_registry_profile_forensics` are saved and M11 returns PASS, PASS_WITH_WARNING, PASS_WITH_LIMITATION, or REINVESTIGATION_COMPLETED_WITH_LIMITATION.
  If M11 returns SOURCE_REPAIR_REQUIRED or CONTROLLED_FAILURE, do not advance.
</phase_call_card>

`M11.S0.C1` This M11 module is the standalone Exposure Registry phase for Agent 5. It is not a combined M11/M12-global/M13/compiler/renderer prompt.

`M11.S0.C2` M11 does not authorize one-shot 98-row production evaluation. Production M11 registry evaluation is batched, with a maximum of 8 rows per model batch and with persisted batch artifacts.

`M11.S0.C3` M11 does not authorize merged material/forensic output. The old one-shot `<phase_output>` shape containing material and forensic objects is expressly rejected for production backend execution.

`M11.S0.C4` M11 cannot hand off to M12 global challenge until `exposure_registry_workpad_98`, `exposure_registry_controlled_profile`, `exposure_registry_triggered_profile`, and `exposure_registry_profile_forensics` are all saved artifacts and the M11 lock gate has passed.

`M11.S0.C5` M11 batch artifacts cannot remain in model memory. Every accepted batch must be saved as a persisted artifact only after paired M12 batch validation exists.

`M11.S0.C6` M11 material exposure profiles are deterministic projections from `exposure_registry_workpad_98`; the model evaluates registry rows, but the final controlled and triggered material artifacts are not model-assembled from memory.

---

## M11.S0A — Phase-Local Forbidden Examples

### M11.S0A.1 — Forbidden grouped registry workpad row

Forbidden:

```text
REGISTRY_ROW | TRN_BIO_001/TRN_BIO_002 | M11 | TRIGGERED | EMITTED:YES | FINALIZED
```

Correct workpad preservation:

```text
REGISTRY_ROW | TRN_BIO_001 | M11 | TRIGGERED | AUDIT_PRESERVED:YES | JSON_ROW_REQUIRED:YES | FINALIZED
REGISTRY_ROW | TRN_BIO_002 | M11 | CONTROLLED | AUDIT_PRESERVED:YES | JSON_ROW_REQUIRED:YES | FINALIZED
```

Rule: one final registry-row workpad outcome per Threat_ID. Composite Threat_ID rows are invalid.

### M11.S0A.2 — Forbidden summary substitution

Forbidden:

```text
exposure_summary: controlled_count = 4, controlled_rows_emitted = 0
```

Correct rule:

```text
Every final CONTROLLED row must appear in exposure_registry_controlled_profile.controlled_rows[]. Every final TRIGGERED row must appear in exposure_registry_triggered_profile.triggered_rows[].
```

### M11.S0A.3 — Forbidden old M8 routing path

Forbidden:

```text
active_surfaces derived from target_feature_profile.activities[].surface_tokens[]
```

Correct:

```text
active_surfaces derived from target_feature_profile.activities[].surface_context_tokens[]
```

### M11.S0A.4 — Forbidden output branches

Forbidden branches inside split material artifacts:

| Forbidden branch | Reason |
|---|---|
| `exposure_summary` | summary substitution hides row-level material output |
| `controlled_exposure_rows` | use only `exposure_registry_controlled_profile.controlled_rows[]` |
| `absent_not_triggered_registry_rows` | audit/workpad only; never material output |
| `registry_coverage_matrix` | forensic only |
| `review_priority_register` | forensic/workpad only |
| `activity_to_exposure_matrix` | forensic/workpad only |
| `data_asset_to_exposure_matrix` | forensic/workpad only |
| `legal_control_to_exposure_matrix` | forensic/workpad only |

---

# M11.S1 — Function, Boundary, and Non-Negotiables

## M11.S1A — Function

`M11.S1A.C1` Module XI converts locked upstream target, feature, legal, data-provenance, source, registry, and registry-evaluation authorities into persisted batch ledgers, `exposure_registry_workpad_98`, and the split material artifacts `exposure_registry_controlled_profile` and `exposure_registry_triggered_profile`.

`M11.S1A.C2` Module XI is the only module authorized to evaluate AI Threat Registry rows.

`M11.S1A.C3` Module XI must evaluate or account for every active registry row exactly once.

`M11.S1A.C4` Module XI emits reader-facing exposure rows only for final TRIGGERED and CONTROLLED rows.

`M11.S1A.C5` Module XI preserves all non-emitted rows, route decisions, trigger decisions, evidence binding, control/exclude evaluation, limitations, batch validation custody, and self-checks in `exposure_registry_workpad_98` and `exposure_registry_profile_forensics` / Module V audit material.

## M11.S1B — Hard Non-Negotiables

| Non-negotiable | Rule |
|---|---|
| Registry completeness | Load and account for all 98 active registry rows. |
| LEP completeness | Apply all 22 LEP selector rows. |
| UNI routing | Every UNI row is evaluation-routed. UNI rows may not be `NOT_TRIGGERED_NOT_APPLICABLE`. |
| Active routing source | Active archetypes and surfaces come only from locked M8, not M7 or model memory. |
| Surface path | Use `surface_context_tokens[]`, never `surface_tokens[]`. |
| Material outputs | `exposure_registry_controlled_profile.controlled_rows[]` for CONTROLLED rows and `exposure_registry_triggered_profile.triggered_rows[]` for TRIGGERED rows only. |
| Controlled rows | Every final CONTROLLED row must be emitted. |
| Triggered rows | Every final TRIGGERED row must be emitted. |
| Forensics | Full 98-row ledger, batch custody, M12 batch validation index, and emission manifest must live in `exposure_registry_profile_forensics`. |
| Legal firewall | No legal/compliance/liability/violation/adequacy conclusions. |
| Source firewall | No new discovery, browsing, crawling, source refresh, or unadmitted evidence. |
| Upstream custody | Do not mutate M6, M7, M8, M9, or M10 artifacts. |

## M11.S1C — Forbidden Acts

`M11.S1C.C1` Module XI must not discover or admit new sources.

`M11.S1C.C2` Module XI must not invent, delete, merge, rename, sample, or mutate registry rows.

`M11.S1C.C3` Module XI must not suppress controlled rows, triggered rows, UNI rows, or messy/limited triggered-controlled rows.

`M11.S1C.C4` Module XI must not use summaries, counts, matrices, category labels, or compact route buckets as substitutes for row-level registry workpad and emitted-row output.

`M11.S1C.C5` Module XI must not use stale M8 paths, including `surface_tokens[]`.

`M11.S1C.C6` Module XI must not re-derive target profile, feature profile, legal cartography, or data provenance.

`M11.S1C.C7` Module XI must not issue legal advice, compliance verdicts, liability findings, illegal/legal conclusions, enforceability findings, breach findings, high/low legal-risk verdicts, risk scores, or statutory violation conclusions.

---

# M11.S2 — Input Custody Protocol

## M11.S2A — Required Primary Inputs

| Required input | Required use |
|---|---|
| `source_discovery_handoff` | Admitted evidence authority, registry-support routes, access/absence/coverage limitations. |
| `legal_cartography_index` | Legal/governance/control artifact navigation only; no re-indexing. |
| `source_discovery_handoff.bucket_family_index.legal_governance_profile_urls.families` | Legal/governance route universe and source-family routing; route existence alone is not evidence. |
| `source_discovery_handoff.contract.source_text_location` | Confirms that source text must be read from loaded lossless family artifacts, not route labels or summaries. |
| `lossless_family__L1_CORE_TERMS_PRIVACY` | Full lossless Terms/ToS/Privacy/EULA evidence for controls, notices, commitments, route limitations, and legal/governance source support. |
| `lossless_family__L2_B2B_CONTRACTING` | Full lossless DPA/AUP/SLA/customer/platform agreement evidence for public controls, subprocessors, restrictions, customer instructions, and limitations. |
| `lossless_family__L3_AI_USAGE_GOVERNANCE` | Full lossless AI policy/usage/content/model/safety governance evidence for registry controls and AI-use limitations. |
| `lossless_family__L4_PRIVACY_ADJACENT_NOTICES` | Full lossless cookie/GDPR/CCPA/privacy-center notice evidence for public privacy/control routes and limitations. |
| `lossless_family__L5_LEGAL_HUB_HOSTED` | Full lossless legal/policies/trust hub evidence and linked governance-material custody. |
| `lossless_family__L6_ENTITY_NOTICE` | Full lossless legal notice/imprint/controller/contact evidence for entity/control/governance support and limitations. |
| `target_profile` | Target identity/context only; no re-profiling. |
| `target_profile_forensics` | Target derivation proof and limitation context. |
| `target_feature_profile` | Active activities, archetypes, surfaces, feature refs, mechanics/data touchpoints. |
| `target_feature_profile_forensics` | Activity/archetype/surface derivation proof and limitations. |
| `data_provenance_profile` | Data/privacy/control/missing-proof/readiness substrate. |
| `data_provenance_profile_forensics` | DAP derivation proof, Anti-Unknown outcomes, readiness matrix proof, and missing-proof linkage. |
| `AI_THREAT_REGISTRY.yaml` | Locked active registry row inventory. |
| `REGISTRY_KEY_v3_0.md` | Registry vocabulary, ID syntax, archetype/surface interpretation, row semantics. |
| `03_REGISTRY_EVALUATION_RULES.yaml` | Trigger/exclude/control/evaluation discipline. |
| `FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml` | LEP field derivation authority. |
| `FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml` | Forensic shape and audit-preservation authority. |

## M11.S2AA — AI Threat Registry YAML Field Canon

`M11.S2AA.C1` M11 must treat the repository `AI_THREAT_REGISTRY.yaml` row keys as the strict registry schema. The active registry row fields are:

```text
Threat_ID
Threat_Name
Lane
Archetype
Surface
Authority_IN
Authority_EU
Authority_US
Velocity
Pain_Tier
Pain_Category
Pain_Depth
Status
Effective_Date
Legal_Pain
FP_Mechanism
FP_Impact
Lex_Nova_Fix
Hunter_Trigger
Provenance
FIELD21
FIELD22
FIELD23
```

`M11.S2AA.C2` `Threat_ID` is the canonical row identifier. `Threat_Name` is the canonical row name. `Archetype` and `Surface` are routing/context fields. `Hunter_Trigger` is the canonical row-level derivation logic field.

`M11.S2AA.C3` `FIELD21`, `FIELD22`, and `FIELD23` are decomposed `Threat_ID` parts: `FIELD21` = archetype/scope segment, `FIELD22` = harm/subcat segment, and `FIELD23` = variant/counter/provenance suffix. They support identity validation, batching, grouping, and forensic reconciliation only. They do not replace `Hunter_Trigger`.

`M11.S2AA.C4` There is no source column named `Subcat`, `Registry_Signal`, `Threat_Signal`, `Condition`, `Trigger_IF`, or `Exclude_IF`. `CONDITION_N`, `TRIGGER_IF`, and `EXCLUDE_IF` are mandatory logical components inside the `Hunter_Trigger` value.

`M11.S2AA.C5` If a row requires harm/subcat grouping, use `FIELD22` or the middle segment of `Threat_ID`. Do not invent or require a non-existent `Subcat` YAML field.

`M11.S2AA.C6` `Hunter_Trigger` plus `03_REGISTRY_EVALUATION_RULES.yaml` are the only source of truth for row-level trigger/exclude/control derivation. `Archetype`, `Surface`, `Threat_Name`, `Pain_Tier`, `Legal_Pain`, `FP_Impact`, `Lex_Nova_Fix`, route reason, or model intuition may support context but may not substitute for applying `Hunter_Trigger`.

## M11.S2B — Input Failure Handling

| Condition | Required handling |
|---|---|
| `AI_THREAT_REGISTRY.yaml` missing | `CONTROLLED_FAILURE` |
| active registry row count not 98 | `CONTROLLED_FAILURE` unless registry contract is expressly amended |
| `REGISTRY_KEY_v3_0.md` missing | `CONTROLLED_FAILURE` |
| `03_REGISTRY_EVALUATION_RULES.yaml` missing | `CONTROLLED_FAILURE` |
| `FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml` missing | `CONTROLLED_FAILURE` |
| `source_discovery_handoff` missing | `CONTROLLED_FAILURE` |
| `target_feature_profile` missing | `CONTROLLED_FAILURE` |
| `data_provenance_profile` missing | `CONTROLLED_FAILURE` unless M11 locks with explicit limitations for rows that do not depend on data/privacy/control evidence |
| `data_provenance_profile_forensics` missing | `LOCKED_WITH_LIMITATIONS` only if row evidence can still be bound truthfully; otherwise `CONTROLLED_FAILURE` |
| admitted evidence missing for a row | Use insufficient evidence, absence, access-failure, row limitation, or review route; do not invent proof |
| legal/governance lossless bucket missing or corrupt | Route to Agent 1 source/legal repair where the bucket is required for row evidence or visible-control proof; otherwise record a controlled limitation. |
| legal/governance route exists but full lossless text is unavailable | Use access/text limitation; do not rely on legal_cartography_index summary as a substitute for row-specific evidence. |

## M11.S2C — Patched M8 Path Dependency

| M11 need | Correct M8 source |
|---|---|
| Feature reference | `target_feature_profile.activities[].activity_reference` |
| Product/service context | `target_feature_profile.activities[].product_service_wrapper` |
| Feature/activity name | `target_feature_profile.activities[].activity_feature_name` |
| Product mechanics | `target_feature_profile.activities[].mechanics_proof` |
| Data/content object touched | `target_feature_profile.activities[].data_content_object_touched` |
| Active archetypes | `target_feature_profile.activities[].archetype_codes[]` |
| Archetype proof | `target_feature_profile.activities[].archetype_proof` |
| Active surfaces | `target_feature_profile.activities[].surface_context_tokens[]` |
| Surface proof / limits | `target_feature_profile.activities[].surface_proof_and_routing_limits` |

`M11.S2C.C1` The path `target_feature_profile.activities[].surface_tokens[]` is invalid in M11.

`M11.S2C.C2` If a registry row cannot be routed because old M8 path names are absent, repair M11 routing logic. Do not downgrade the row and do not invent surfaces.

## M11.S2D — Legal / Governance Lossless Bucket Access Matrix

| Route / Object | Access Status | Permitted M11 Use |
|---|---|---|
| `lossless_family__L1_CORE_TERMS_PRIVACY` | primary legal/governance evidence | Terms, privacy, EULA, notice wording, rights/control commitments, restrictions, user/customer obligations, absence/access limitations. |
| `lossless_family__L2_B2B_CONTRACTING` | primary legal/governance evidence | DPA, AUP, SLA, customer/platform agreement signals, customer instructions, subprocessor controls, restriction/control language, contractual control visibility. |
| `lossless_family__L3_AI_USAGE_GOVERNANCE` | primary AI governance evidence | AI usage, content, safety, model, acceptable-use, responsible-AI, policy commitments, prohibited-use controls, moderation/safety controls. |
| `lossless_family__L4_PRIVACY_ADJACENT_NOTICES` | supporting privacy/control evidence | cookie, privacy-center, opt-out, GDPR/CCPA-style notices, data privacy framework statements, consumer/control route visibility. |
| `lossless_family__L5_LEGAL_HUB_HOSTED` | legal/governance hub evidence | legal center/policies/trust hub source custody, linked policy availability, hub-level controls, document availability/absence. |
| `lossless_family__L6_ENTITY_NOTICE` | supporting legal notice evidence | legal notice, imprint, controller/contact, public entity/control/contact support where row evidence requires it. |
| `source_discovery_handoff.bucket_family_index.legal_governance_profile_urls.families` | custody/control | family-level route availability, family state, and source-to-family routing; route existence alone is not registry evidence. |
| `legal_cartography_index` | navigation/index only | legal/governance artifact navigation, section location, document inventory, and absence/access context; not a substitute for full lossless row evidence where source text is required. |

`M11.S2D.C1` M11 may use legal/governance lossless buckets only for row-specific trigger, visible-control, exclusion/control, limitation, missing-proof, or review-route support.

`M11.S2D.C2` M11 must not perform legal analysis on legal/governance text. It may only bind public evidence to registry-row evaluation and controlled/triggered emission.

`M11.S2D.C3` If a row depends on public legal/governance control wording, M11 must prefer the exact loaded lossless bucket text over summary/index text.

`M11.S2D.C4` If exact legal/governance lossless text is absent, access-failed, gated, or metadata-only, M11 must record the limitation and may not invent control wording from route labels or document titles.

---

# M11.S3 — Status Vocabulary

## M11.S3A — Route Values

| Route value | Meaning |
|---|---|
| `EVALUATION_ROUTED` | Row must be evaluated. |
| `NOT_TRIGGERED_NOT_APPLICABLE` | Non-UNI row has no active archetype/surface route and is audit-only. |

## M11.S3B — Row Route Reasons

| Route reason | Meaning |
|---|---|
| `UNI_ALWAYS_RUN` | Universal row; always evaluation-routed. |
| `ARCHETYPE_TRIGGERED` | Row archetype intersects active M8 archetypes. |
| `SURFACE_TRIGGERED` | Row surface tags intersect active M8 `surface_context_tokens[]`. |
| `INT_NOT_TRIGGERED_NOT_APPLICABLE` | Non-UNI row lacks route basis; still preserved in workpad. |

## M11.S3C — Trigger Status Vocabulary

| Trigger status | Use |
|---|---|
| `UNI_ALWAYS_RUN` | Universal row routed for evaluation. |
| `REGISTRY_SIGNAL_TRIGGERED` | Registry signal visibly supported. |
| `REGISTRY_SIGNAL_NOT_TRIGGERED` | Registry signal not supported after evaluation. |
| `CONDITIONAL_TRIGGERED` | Conditional route/trigger is supported. |
| `CONDITIONAL_NOT_TRIGGERED` | Conditional route/trigger is not supported. |
| `TRIGGER_INSUFFICIENT_EVIDENCE` | Insufficient proof to trigger confidently. |
| `TRIGGER_CONFLICTING_SIGNALS` | Admitted sources conflict. |
| `TRIGGER_REQUIRES_REVIEW` | Qualified review is needed. |
| `ACCESS_FAILED_TRIGGER_CHECK` | Relevant source route failed. |

## M11.S3D — Evaluation Status Vocabulary

| Evaluation status | Use |
|---|---|
| `SUPPORTED_EXPOSURE_SIGNAL` | Visible evidence supports exposure signal. |
| `SUPPORTED_CONTROL_PRESENT` | Visible first-party public control evidence supports controlled status. |
| `PARTIAL_OR_WEAK_SIGNAL` | Evidence is weak, vague, partial, or incomplete. |
| `CONFLICTING_SIGNALS` | Admitted evidence conflicts. |
| `INSUFFICIENT_EVIDENCE` | Evidence too thin to evaluate. |
| `NOT_VISIBLE_AFTER_TARGETED_SEARCH` | Expected route reviewed; signal/control not visible. |
| `ACCESS_FAILED` | Relevant route failed or was text-insufficient. |
| `NOT_TRIGGERED` | Trigger conditions not met on merits. |
| `NOT_APPLICABLE_CONTEXTUAL` | Non-UNI row contextually not applicable; audit-only. |
| `REQUIRES_QUALIFIED_REVIEW` | Qualified review required to resolve. |
| `CONTROLLED_FAILURE` | Unsafe or unusable module state. |

## M11.S3E — Emitted Material Status and Split Material Projection

| Final emitted status | Emission rule |
|---|---|
| `TRIGGERED` | Must be emitted in `exposure_registry_triggered_profile.triggered_rows[]`. |
| `CONTROLLED` | Must be emitted in `exposure_registry_controlled_profile.controlled_rows[]`. |

`M11.S3E.C1` Internal evaluation statuses are not the emitted material status.

`M11.S3E.C2` A row with final material status `TRIGGERED` or `CONTROLLED` must be emitted even if it also carries limitation, conflict, weak-evidence, access-failure, or qualified-review context.

`M11.S3E.C3` CONTROLLED and TRIGGERED rows must not be mixed inside one production material artifact.

`M11.S3E.C4` The old combined `triggered_and_controlled_rows[]` production material artifact is retired for backend execution. Its seven-field row contract remains locked and is projected into the split controlled and triggered artifacts.

## M11.S3F — Forbidden Status / Verdict Terms

The following may not appear as final statuses or verdicts:

| Forbidden term | Reason |
|---|---|
| `TRUE` / `FALSE` | Boolean verdict shortcut. |
| `COMPLIANT` / `NON_COMPLIANT` | Legal/compliance conclusion. |
| `ILLEGAL` / `LEGAL` | Legal conclusion. |
| `LIABLE` / `NOT_LIABLE` | Liability conclusion. |
| `VIOLATION` / `NO_VIOLATION` | Legal violation conclusion. |
| `BREACH` | Legal breach conclusion. |
| `ENFORCEABLE` / `UNENFORCEABLE` | Enforceability conclusion. |
| `RISK_SCORE`, `HIGH_RISK`, `LOW_RISK` | Unauthorized scoring/verdict language. |

---

# M11.S4 — LEP Registry Selector and Seven-Column Output Map

## M11.S4A — LEP Selector Authority

| Selector item | Locked value |
|---|---|
| Registry reference | `FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml` |
| Profile section | `Legal Exposure Profile` |
| Field prefix | `LEP.` |
| Expected locked rows | 22 |
| Runtime role | Derivation authority, not visible output schema |

`M11.S4A.C1` Module XI must apply all 22 LEP selector rows.

`M11.S4A.C2` Every selected LEP row must have a final workpad outcome in forensics / Module V audit material.

`M11.S4A.C3` Summary, matrix, join, and count LEP families may support audit/workpad material but must not create extra main-profile output branches.

## M11.S4B — Seven-Column Reader-Facing Row Contract

The M11 material row field contract is locked. M11 has two material artifacts, but one row schema.

| Column | Machine field | Required content | Exact registry YAML source / derivation authority |
|---|---|---|---|
| Registry Exposure | `registry_exposure` | Threat ID, threat name, lane/family, authority anchors, and registry lifecycle/status. | Copy/project from `Threat_ID`, `Threat_Name`, `Lane`, `Archetype`, `Surface`, `Authority_IN`, `Authority_EU`, `Authority_US`, `Status`, `Effective_Date`, `FIELD21`, `FIELD22`, `FIELD23`. |
| Target Match | `target_match` | Product/activity/data/legal-control context that made the row relevant. | Use `Archetype`, `Surface`, `FP_Mechanism`, `FIELD21`, `FIELD22` plus locked M8/M10/M9 context. These fields route/contextualize only; they do not decide final material status. |
| Evaluation Status | `evaluation_status` | `TRIGGERED` or `CONTROLLED` only. | Derived only by applying the row's `Hunter_Trigger` and `03_REGISTRY_EVALUATION_RULES.yaml` to admitted evidence. |
| Basis / Proof | `basis_proof` | Trigger basis, visible-control basis, and admitted evidence refs. | Must cite the applied `Hunter_Trigger` components: `CONDITION_N`, `TRIGGER_IF`, `EXCLUDE_IF`, plus admitted evidence/control refs. `FP_Mechanism` and `Provenance` may support context only. |
| Impact / Priority | `impact_priority` | Registry pain/velocity plus derived business review priority. No legal-risk verdict. | Project from `Velocity`, `Pain_Tier`, `Pain_Category`, `Pain_Depth`, `Legal_Pain`, and `FP_Impact`. |
| Review Route | `review_route` | Normalized registry remediation/review route, missing proof, and next review action. | Project from `Lex_Nova_Fix` plus row-specific missing-proof/control context. Do not invent a new remediation category. |
| Row Limitations | `row_limitations` | Weak evidence, not searched, access failed, conflicting signals, public-footprint limits, and controlled-status boundary. | Derived from `Hunter_Trigger`, especially `EXCLUDE_IF`, evidence gaps, source limitations, access failures, upstream forensic limitations, and M12 batch validation limitations where applicable. |

`M11.S4B.C1` Every emitted material row must contain exactly these seven fields.

`M11.S4B.C2` The same seven-column row contract applies to both `exposure_registry_controlled_profile.controlled_rows[]` and `exposure_registry_triggered_profile.triggered_rows[]`.

`M11.S4B.C3` `CONTROLLED` means visible public control exists. It does not mean compliant, sufficient, enforceable, legally adequate, solved, risk-free, or locally counsel-approved.

`M11.S4B.C4` `Lex_Nova_Fix` is the registry source for the public-facing remediation/review route. The phrase `Registry Remediation Route` may be used as the display label, but the registry-source field is `Lex_Nova_Fix`.

`M11.S4B.C5` No new material row fields may be added to either split material artifact.

`M11.S4B.C6` The material row fields are projections and derivations. None of the seven material field names are source-column names in `AI_THREAT_REGISTRY.yaml`; validators must check source mapping, not exact source-name equality.

`M11.S4B.C7` `Hunter_Trigger` plus `03_REGISTRY_EVALUATION_RULES.yaml` are the only source of truth for row-level derivation. `Archetype`, `Surface`, `Threat_Name`, `Legal_Pain`, `Pain_Tier`, `FP_Impact`, `Lex_Nova_Fix`, route reason, or model intuition cannot independently produce `TRIGGERED` or `CONTROLLED`.

---

# M11.S5 — PHASE A: Runtime and Registry Handshake

## Consumes

| Input | Use |
|---|---|
| Runtime binding packet | Confirm Agent 5 / M11. |
| `AI_THREAT_REGISTRY.yaml` | Load all active rows. |
| `REGISTRY_KEY_v3_0.md` | Interpret registry row IDs, archetypes, surfaces, authority, and route vocabulary. |
| `03_REGISTRY_EVALUATION_RULES.yaml` | Trigger, exclude/control, insufficiency, and reconciliation rules. |
| LEP selector authority | Load 22 LEP derivation rows. |

## Writes to forensics / workpad only

| Workpad family | Required content |
|---|---|
| `registry_initialization` | Registry authority, expected count, loaded count, registry status. |
| `registry_input_manifest` | Required inputs loaded / missing / limited. |
| `registry_manifest_load` | Active row inventory load result. |
| `lep_selector_load` | 22/22 LEP selector status. |

## Rules

`M11.S5.C1` No row evaluation may occur before registry count and LEP selector load pass.

`M11.S5.C2` If loaded active registry row count is not 98, stop with `CONTROLLED_FAILURE` unless the registry contract is explicitly amended.

---

# M11.S6 — PHASE A: Input Custody, Source Boundary, and Legal/Governance Lossless Extraction Gate

| Gate | Required pass condition |
|---|---|
| Upstream artifact gate | All required Agent 1, Agent 3, and Agent 4 artifacts are present or controlled limitation/failure is recorded. |
| Source authority gate | Only M6-admitted evidence, locked upstream artifacts, and registry authorities are used. |
| M8 route-source gate | Active archetypes/surfaces come from patched M8 paths. |
| M10 substrate gate | M10 profile and forensics are consumed as locked upstream material only. |
| No mutation gate | M6/M7/M8/M9/M10 artifacts are not modified. |
| No source discovery gate | No browsing/search/crawl/fetch/reopen/refresh/source expansion. |

`M11.S6.C1` If any gate fails, do not evaluate registry rows until repaired or controlled-limited.

## M11.S6A — Phase A Exposure Source / Registry Extraction Capsule

`M11.S6A.C1` Phase A creates and locks the M11 Exposure Source / Registry Extraction Capsule before any trigger adjudication, control/exclude evaluation, row assembly, or material profile derivation begins.

`M11.S6A.C2` The capsule is internal working material until forensics. It must not be emitted inside `exposure_registry_controlled_profile` or `exposure_registry_triggered_profile`.

`M11.S6A.C3` The capsule must be built only from locked upstream artifacts, loaded legal/governance lossless buckets, M6-admitted evidence/absence/access records, and registry authorities.

### M11.S6A.1 — Required Extraction Parents

| Extraction parent | Required source basis | Required extraction focus |
|---|---|---|
| Upstream profile extraction | `target_profile`, `target_profile_forensics`, `target_feature_profile`, `target_feature_profile_forensics`, `data_provenance_profile`, `data_provenance_profile_forensics` | active target context, activities, archetypes, surfaces, data/control signals, limitations, and proof paths. |
| Legal/governance lossless extraction | `lossless_family__L1_CORE_TERMS_PRIVACY` through `lossless_family__L6_ENTITY_NOTICE` | public control wording, legal/governance commitments, policies, DPA/AUP/SLA, AI governance, privacy notices, security/trust controls, absence/access limitations. |
| Registry authority extraction | `AI_THREAT_REGISTRY.yaml`, `REGISTRY_KEY_v3_0.md`, `03_REGISTRY_EVALUATION_RULES.yaml` | active Threat_ID inventory, `Hunter_Trigger` trigger/control/exclude logic, archetype/surface routing metadata, `Lex_Nova_Fix` review-route vocabulary. |
| LEP selector extraction | `FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml` selected `LEP.*` rows | 22 LEP selector rows, mode/source/condition/fallback/forbidden-inference duties. |
| Source custody and limitation extraction | `source_discovery_handoff`, `legal_cartography_index`, lossless family limitation branches | approved route/source universe, source-text location, absence/access/gated/metadata-only records, legal/governance document navigation. |

### M11.S6A.2 — Legal / Governance Source Coverage Row

For every loaded legal/governance lossless source object relevant to M11, record a coverage row with:

- `root_family`
- `source_id`
- `source_url`
- `source_status`
- `legal_governance_family`
- `registry_row_relevance[]`
- `visible_control_or_trigger_support[]`
- `absence_or_access_limitation_if_any`
- `permitted_use`: trigger support, visible-control support, limitation, missing-proof, or review-route support

### M11.S6A.3 — Phase A Extraction Quality Gate

Phase A passes only if:

- all required upstream artifacts from Agent 1, Agent 3, and Agent 4 exist or have controlled failure/limitation status;
- every loaded legal/governance lossless family source relevant to M11 has a coverage row or formal limitation;
- registry row inventory is loaded before route planning;
- 22/22 LEP selector rows are loaded before material derivation;
- M8 active archetype/surface paths use `archetype_codes[]` and `surface_context_tokens[]` only;
- M10 is consumed as locked substrate only and is not re-derived;
- route labels and document titles are not treated as trigger/control evidence without lossless text or authorized upstream proof;
- no browsing, searching, crawling, fetching, reopening, or source expansion occurred.

---

# M11.S7 — PHASE A: Full Registry Inventory and LEP Selector Load

| Inventory requirement | Rule |
|---|---|
| Expected active rows | 98 |
| Loaded active rows | 98 |
| Row identity | Preserve Threat_ID exactly. |
| Row order | Preserve registry order where possible. |
| Row metadata | Preserve exact YAML fields: `Threat_ID`, `Threat_Name`, `Lane`, `Archetype`, `Surface`, `Authority_IN`, `Authority_EU`, `Authority_US`, `Velocity`, `Pain_Tier`, `Pain_Category`, `Pain_Depth`, `Status`, `Effective_Date`, `Legal_Pain`, `FP_Mechanism`, `FP_Impact`, `Lex_Nova_Fix`, `Hunter_Trigger`, `Provenance`, `FIELD21`, `FIELD22`, `FIELD23`. |
| Duplicates | Forbidden. |
| Silent skipping | Forbidden. |

`M11.S7.C1` Every loaded registry row must receive exactly one final registry-row workpad outcome.

---

# M11.S8 — PHASE A: Internal Registry Route Planning

## Route Planning Rule

| Condition | Route | Reason |
|---|---|---|
| Registry archetype is `UNI` | `EVALUATION_ROUTED` | `UNI_ALWAYS_RUN` |
| Registry archetype intersects active M8 `archetype_codes[]` | `EVALUATION_ROUTED` | `ARCHETYPE_TRIGGERED` |
| Registry surface tags intersect active M8 `surface_context_tokens[]` | `EVALUATION_ROUTED` | `SURFACE_TRIGGERED` |
| Non-UNI row has no archetype/surface match | `NOT_TRIGGERED_NOT_APPLICABLE` | `INT_NOT_TRIGGERED_NOT_APPLICABLE` |

## Route Plan Integrity Checks

| Check | Required result |
|---|---|
| all registry rows accounted for | true |
| no duplicate rows | true |
| all UNI rows evaluation-routed | true |
| no UNI row not-applicable | true |
| group coverage complete | true |
| not-triggered-not-applicable rows are non-UNI only | true |

`M11.S8.C1` Internal route planning may not decide trigger truth, EXCLUDE_IF truth, control status, evidence sufficiency, or final material status.

`M11.S8.C2` Route planning output is forensic/workpad material only.

---

## M11.S8B — PHASE A: Batch Plan Formation

| Batch planning rule | Requirement |
|---|---|
| Maximum rows per model batch | 8 |
| UNI sequencing | UNI batches run first. |
| UNI split | UNI count is derived from `AI_THREAT_REGISTRY.yaml`; current registry has 37 UNI rows, so UNI must split into `UNI__001` through `UNI__005` at max 8 rows per batch. Future amendments must calculate `ceil(UNI_row_count / 8)`, never assume two UNI batches. |
| Archetype grouping | One archetype per batch by default. |
| Two-archetype limit | Two archetypes may be combined only if both groups are small and semantically adjacent. |
| More than two archetypes | Forbidden. |
| Filler mixing | Forbidden. Do not mix unrelated archetypes merely to fill a batch. |
| Surface-triggered rows | Attach to dominant archetype where possible; otherwise preserve explicit surface route reason. |
| Batch identity | Every batch receives `{GROUP}__{NNN}` identity. |
| Expected Threat_IDs | Every batch contains explicit `expected_threat_ids[]`. |

`M11.S8B.C1` Batch planning may not decide trigger truth, EXCLUDE_IF truth, control status, evidence sufficiency, or final material status.

`M11.S8B.C2` Batch planning must preserve all model-routed Threat_IDs exactly once across the batch plan.

`M11.S8B.C3` A model-routed Threat_ID cannot enter `exposure_registry_workpad_98` unless its batch artifact and paired M12 batch validation artifact both exist.

---

# M11.S9 — PHASE A: Trigger Review Workspace Formation

| Workspace component | Required content |
|---|---|
| Registry row reference | Exact YAML row: `Threat_ID`, `Threat_Name`, `Lane`, `Archetype`, `Surface`, authority fields, pain/impact fields, `Lex_Nova_Fix`, `Hunter_Trigger`, `Provenance`, `FIELD21`, `FIELD22`, `FIELD23`. |
| Candidate upstream context | M8 activity refs, M10 data/control refs, M9 legal-control refs, M6 admitted source refs. |
| Candidate evidence paths | Admitted evidence refs, lossless block refs, absence refs, access-failed refs. |
| Hunter derivation logic | Parse and apply row-specific `Hunter_Trigger` components: `CONDITION_N`, `TRIGGER_IF`, `EXCLUDE_IF`. |
| Model path authority | May use, expand, or reject candidate routes only inside admitted evidence while applying `Hunter_Trigger` and `03_REGISTRY_EVALUATION_RULES.yaml`. |
| Actual path used | Must be recorded after model route selection. |
| Workspace limitations | Must record sparse evidence, access failure, weak wording, or missing proof. |

`M11.S9.C1` Every evaluation-routed row must receive one trigger review workspace.

`M11.S9.C2` Trigger review workspaces are not emitted in the main profile.

---

# M11.S10 — PHASE B: Material Profile Derivation — Model-Led Trigger Adjudication

| Trigger task | Required action |
|---|---|
| Evaluate row condition fit | Parse the row-specific `Hunter_Trigger` and compare every `CONDITION_N`, `TRIGGER_IF`, and `EXCLUDE_IF` posture with locked upstream profiles and admitted evidence. |
| Select actual evidence path | Use the actual source/profile path relied on. |
| Assign trigger status | Use only the locked trigger-status vocabulary after applying `Hunter_Trigger` and `03_REGISTRY_EVALUATION_RULES.yaml`. |
| Assign trigger basis type | Feature, archetype, surface, data, legal-control, absence, access-failed, conflict, insufficient, universal, or review-required context. |
| Record trigger confidence | high / medium / low / unknown. |
| Record trigger reason | Concise, no legal verdict. |
| Determine if evaluation continues | `needs_row_evaluation` true/false. |

`M11.S10.C1` Trigger adjudication must occur before control/exclude evaluation.

`M11.S10.C2` Risk surface alone is insufficient.

`M11.S10.C3` No trigger decision may use model memory or unadmitted evidence.

`M11.S10.C4` No trigger decision may be derived from `Archetype`, `Surface`, `Threat_Name`, `Legal_Pain`, `Pain_Tier`, `FP_Impact`, `Lex_Nova_Fix`, route reason, or model intuition without applying the row-specific `Hunter_Trigger`.

`M11.S10.C5` If `Hunter_Trigger` is missing, malformed, or unparsable for an evaluation-routed row, M11 must controlled-limit or controlled-fail the row according to registry evaluation rules. It must not invent replacement trigger logic.

---

# M11.S11 — PHASE B: Material Profile Derivation — Evidence Binding

| Evidence basis type | Allowed use |
|---|---|
| `DIRECT_QUOTE_REF` | Direct admitted source quote/block where available. |
| `ARTIFACT_SECTION_REF` | M9 legal/governance section ref. |
| `FEATURE_PROFILE_REF` | M8 activity/archetype/surface ref. |
| `DATA_PROFILE_REF` | M10 data/control/missing-proof/readiness ref. |
| `LEGAL_CARTOGRAPHY_REF` | M9 artifact/control/absence navigation ref. |
| `LEGAL_GOVERNANCE_LOSSLESS_REF` | Full L1-L6 legal/governance lossless source text used for row-specific trigger/control/limitation support. |
| `ABSENCE_RECORD_REF` | M6/M9/M10 absence or not-visible basis. |
| `ACCESS_FAILURE_REF` | M6/M9/M10 access-failed basis. |
| `CONFLICT_RECORD_REF` | Conflicting admitted evidence basis. |
| `NO_EVIDENCE_REQUIRED_NOT_TRIGGERED` | Not-triggered-not-applicable audit rows only. |

`M11.S11.C1` Supported exposure, supported control, partial/weak, conflicting, and qualified-review rows must carry evidence refs or formal limitations.

`M11.S11.C2` Evidence binding must reflect the actual path used, not merely copied candidate routes.

---

# M11.S12 — PHASE B: Material Profile Derivation — Model-Led Control / Exclude Evaluation

| Evaluation scenario | Required internal evaluation status |
|---|---|
| Visible row signal supported and no visible row-specific neutralizing control | `SUPPORTED_EXPOSURE_SIGNAL` |
| Visible first-party row-specific control is present | `SUPPORTED_CONTROL_PRESENT` |
| Evidence is partial, weak, vague, or incomplete | `PARTIAL_OR_WEAK_SIGNAL` |
| Admitted evidence conflicts | `CONFLICTING_SIGNALS` |
| Evidence too thin | `INSUFFICIENT_EVIDENCE` |
| Targeted route reviewed and signal/control not visible | `NOT_VISIBLE_AFTER_TARGETED_SEARCH` |
| Relevant route failed | `ACCESS_FAILED` |
| Trigger conditions not met on merits | `NOT_TRIGGERED` |
| Qualified review needed | `REQUIRES_QUALIFIED_REVIEW` |

`M11.S12.C1` Control/exclude evaluation must not use compliance, sufficiency, enforceability, adequacy, solved, or risk-free language.

`M11.S12.C2` Visible control may support `CONTROLLED`, but not a compliance conclusion.

`M11.S12.C3` EXCLUDE/control evaluation must apply the row-specific `EXCLUDE_IF` posture inside `Hunter_Trigger`; generic policy/control existence is insufficient unless it defeats the row-specific condition under `03_REGISTRY_EVALUATION_RULES.yaml`.

---

# M11.S13 — PHASE B: Material Profile Derivation — Registry-Row Workpad Accountability

| Row category | Required workpad outcome |
|---|---|
| Evaluation-routed rows | Trigger status, evaluation status, evidence basis, final material status, limitations. |
| Not-triggered-not-applicable rows | Route, route reason, conditional-not-triggered status, contextual not-applicable status, audit-only status. |
| UNI rows | Evaluation-routed status and valid non-not-applicable evaluation outcome. |
| Limited rows | Limitation status and review route. |
| Controlled rows | Visible-control basis and controlled-status boundary. |
| Triggered rows | Trigger basis and evidence basis. |

`M11.S13.C1` Exactly one registry-row workpad outcome is required per Threat_ID.

`M11.S13.C2` Workpad outcomes are forensic/audit material, not main-profile branches.

---

# M11.S14 — PHASE B: Material Status Assembly and Split Projection Eligibility

## Emission Rule

| Final material status | Material projection | Emit? |
|---|---|---|
| `TRIGGERED` | `exposure_registry_triggered_profile.triggered_rows[]` | Yes |
| `CONTROLLED` | `exposure_registry_controlled_profile.controlled_rows[]` | Yes |
| `LIMITED` only | Workpad/forensics only | No |
| `CANDIDATE_ONLY` only | Workpad/forensics only | No |
| `INSUFFICIENT_EVIDENCE` only | Workpad/forensics only | No |
| `PARTIAL_OR_WEAK_SIGNAL` only | Workpad/forensics only | No |
| `CONFLICTING_SIGNALS` only | Workpad/forensics only | No |
| `REQUIRES_QUALIFIED_REVIEW` only | Workpad/forensics only | No |
| `NOT_TRIGGERED` only | Workpad/forensics only | No |
| `NOT_APPLICABLE_CONTEXTUAL` only | Workpad/forensics only | No |
| `AUDIT_ONLY` only | Workpad/forensics only | No |

`M11.S14.C1` A row that is both CONTROLLED and LIMITED must still be emitted as CONTROLLED in `exposure_registry_controlled_profile.controlled_rows[]`.

`M11.S14.C2` A row that is TRIGGERED and weak/conflicting/review-required must still be emitted as TRIGGERED in `exposure_registry_triggered_profile.triggered_rows[]`.

`M11.S14.C3` Missing emitted triggered/controlled rows cannot be repaired by downgrading the row to avoid emission.

`M11.S14.C4` The split material profiles may contain no row unless its final material emitted status is TRIGGERED or CONTROLLED.

`M11.S14.C5` Final material status is derived only from the row-specific `Hunter_Trigger`, `03_REGISTRY_EVALUATION_RULES.yaml`, and admitted evidence as preserved in the accepted batch artifact and paired M12 batch validation artifact.

---

# M11.S15 — PHASE B: Seven-Column Row Shaping and Registry Field Mapping

| Row field | Shaping rule | Exact registry YAML source / derivation authority |
|---|---|---|
| `registry_exposure` | Copy registry identity and registry-native context without mutation. | `Threat_ID`, `Threat_Name`, `Lane`, `Archetype`, `Surface`, `Authority_IN`, `Authority_EU`, `Authority_US`, `Status`, `Effective_Date`, `FIELD21`, `FIELD22`, `FIELD23`. |
| `target_match` | Explain target-specific route: M8 activity/archetype/surface, M10 data/control, M9 legal-control, and source context that made the row relevant. | `Archetype`, `Surface`, `FP_Mechanism`, `FIELD21`, `FIELD22`, plus locked upstream M8/M10/M9 evidence. |
| `evaluation_status` | Use only `TRIGGERED` or `CONTROLLED`. | Derived only from row-specific `Hunter_Trigger` plus `03_REGISTRY_EVALUATION_RULES.yaml` applied to admitted evidence. |
| `basis_proof` | Summarize trigger basis, visible-control basis, and evidence refs. No long source dump. | Must reflect applied `CONDITION_N`, `TRIGGER_IF`, and `EXCLUDE_IF` from `Hunter_Trigger`, plus admitted evidence/control refs. |
| `impact_priority` | Use registry pain tier, velocity, pain/impact metadata, and business review priority. No legal-risk verdict. | `Velocity`, `Pain_Tier`, `Pain_Category`, `Pain_Depth`, `Legal_Pain`, `FP_Impact`. |
| `review_route` | Use normalized registry remediation/review route, missing-proof route, and next review action. | `Lex_Nova_Fix` plus row-specific missing-proof/control context. |
| `row_limitations` | Include weak evidence, absence/not-searched limits, access failure, conflict, public-footprint limit, and controlled-status boundary. | Derived from `Hunter_Trigger`, especially `EXCLUDE_IF`, evidence gaps, source limitations, access failures, upstream limitation ledgers, and M12 batch validation limitations. |

`M11.S15.C1` No emitted row may contain extra keys beyond the seven locked fields.

`M11.S15.C2` The same seven-field row shaping rule applies to `exposure_registry_controlled_profile.controlled_rows[]` and `exposure_registry_triggered_profile.triggered_rows[]`.

`M11.S15.C3` No material row field may be populated by model intuition, category inference, or route labels alone.

`M11.S15.C4` `FIELD21`, `FIELD22`, and `FIELD23` support row identity, grouping, batching, and forensic reconciliation. They are not derivation substitutes for `Hunter_Trigger`.

---

# M11.S16 — PHASE B: Batch Evaluation Output Contract

## M11.S16A — Batch Output Contract

Each M11 batch model call evaluates only the active batch.

The model receives:

- `batch_id`
- `batch_group`
- `expected_threat_ids[]`
- registry rows for the active batch only
- route reasons for the active batch only
- locked upstream profiles and forensics
- legal/governance lossless evidence admitted for M11
- registry authorities and LEP selector authority
- for each expected Threat_ID: the exact registry row metadata, including `Hunter_Trigger`
- for each expected Threat_ID: the parsed `Hunter_Trigger` components: `CONDITION_N`, `TRIGGER_IF`, and `EXCLUDE_IF`
- the applicable `03_REGISTRY_EVALUATION_RULES.yaml` rules for trigger, exclude/control, insufficiency, limitation, and reconciliation

The model must derive each batch row by applying the row's own `Hunter_Trigger` and the registry evaluation rules to locked upstream artifacts and admitted evidence.

The model must return exactly this top-level JSON shape and stop:

```json
{
  "m11_batch_registry_ledger": {
    "batch_id": "",
    "batch_group": "",
    "expected_threat_ids": [],
    "returned_threat_ids": [],
    "batch_registry_ledger": [
      {
        "Threat_ID": "",
        "registry_exposure": "",
        "target_match": "",
        "trigger_status": "",
        "evaluation_status": "",
        "basis_proof": "",
        "impact_priority": "",
        "review_route": "",
        "row_limitations": ""
      }
    ]
  }
}
```

`M11.S16A.C1` `m11_batch_registry_ledger.expected_threat_ids[]` must match the backend-provided expected Threat_IDs for the active batch.

`M11.S16A.C2` `m11_batch_registry_ledger.returned_threat_ids[]` must match `expected_threat_ids[]` exactly.

`M11.S16A.C3` `batch_registry_ledger[]` must contain exactly one row for every expected Threat_ID and no other Threat_ID.

`M11.S16A.C3A` For every expected Threat_ID, the batch must apply that row's exact `Hunter_Trigger` string from the AI Threat Registry. The batch must parse and apply every `CONDITION_N`, the `TRIGGER_IF` boolean expression, and the `EXCLUDE_IF` posture.

`M11.S16A.C3B` `Hunter_Trigger` plus `03_REGISTRY_EVALUATION_RULES.yaml` are the only source of truth for row-level trigger/exclude/control derivation. Archetype, Surface, Threat_Name, Legal_Pain, Pain_Tier, route reason, or model intuition may support context but may not substitute for `Hunter_Trigger` application.

`M11.S16A.C3C` If `Hunter_Trigger` is missing, malformed, unparsable, or not applicable to the admitted evidence, the row must be marked with a controlled limitation or controlled failure according to registry evaluation rules; the model must not invent replacement trigger logic.

`M11.S16A.C4` Batch rows may include `trigger_status` because trigger status is internal workpad material. Reader-facing split material projections must not include `trigger_status`.

`M11.S16A.C5` Batch rows must not include any reader-facing material field beyond the locked seven material fields plus batch/workpad-only `Threat_ID` and `trigger_status`.

`M11.S16A.C6` The batch output must not emit `exposure_registry_controlled_profile`, `exposure_registry_triggered_profile`, `exposure_registry_profile_forensics`, `challenge_gate`, `final_output_handoff`, renderer payload, report prose, terminal receipts, phase wrappers, checkpoints, or compatibility wrappers.

## M11.S16B — Batch Mechanical Validation Gate

Before M12 batch validation, backend validation must confirm:

| Gate | Required result |
|---|---|
| batch root | `m11_batch_registry_ledger` only |
| expected IDs | present |
| returned IDs | exact match |
| missing IDs | none |
| unexpected IDs | none |
| duplicate IDs | none |
| grouped Threat_IDs | none |
| composite Threat_IDs | none |
| legal verdict language | none |
| `Hunter_Trigger` present for each expected Threat_ID | true |
| `Hunter_Trigger` parsed into `CONDITION_N`, `TRIGGER_IF`, `EXCLUDE_IF` | true |
| registry evaluation rules applied | true |
| substituted trigger logic | none |
| upstream mutation | none |
| source expansion | none |

`M11.S16B.C1` If the batch mechanical validator fails, repair only the affected batch.

`M11.S16B.C2` No failed or unvalidated batch may enter `exposure_registry_workpad_98`.

---

# M11.S17 — PHASE B2: M12 Batch Validation Dependency

`M11.S17.C1` Every M11 batch ledger must be challenged by M12 batch validation before it becomes an accepted persisted artifact.

`M11.S17.C2` M12 batch validation is scoped to one active batch only.

`M11.S17.C3` M12 batch validation may not create new evidence, mutate upstream artifacts, mutate registry metadata, rewrite batch rows silently, emit global challenge output, or emit report prose.

`M11.S17.C3A` M12 batch validation must confirm that every batch row was derived from the row's own `Hunter_Trigger` and the mandatory registry evaluation rules, not from category inference, route summary, or model intuition.

`M11.S17.C4` The paired batch artifacts are:

```text
exposure_registry_batch__{GROUP}__{NNN}
exposure_registry_batch_validation__{GROUP}__{NNN}
```

`M11.S17.C5` A batch is accepted only if M12 batch validation returns `PASS`, `PASS_WITH_LIMITATION`, or controlled `CONTROLLED_FAILURE` that is truthfully ledgered and does not corrupt registry-wide reconciliation.

`M11.S17.C6` If M12 batch validation returns `REPAIR_REQUIRED`, rerun only the affected batch and its paired M12 validation.

`M11.S17.C7` Batch retry limit is a backend policy. After retry exhaustion, the batch may proceed only as controlled failure if the failure is truthfully ledgered and global registry integrity remains usable.

---

# M11.S18 — PHASE C: Deterministic Canonical 98-Row Workpad Merge

`M11.S18.C1` After all model-routed batches are accepted or controlled-limited, M11 must build `exposure_registry_workpad_98` deterministically.

`M11.S18.C2` `exposure_registry_workpad_98` is the canonical internal source of truth for Agent 5 exposure registry output.

`M11.S18.C3` `exposure_registry_workpad_98` must contain exactly 98 active Threat_ID rows, one final workpad outcome per active Threat_ID.

## M11.S18A — Canonical Merge Inputs

The merge reads:

- `exposure_registry_route_plan`
- all accepted `exposure_registry_batch__{GROUP}__{NNN}` artifacts
- all paired `exposure_registry_batch_validation__{GROUP}__{NNN}` artifacts
- deterministic not-applicable route-plan rows
- registry authorities
- LEP selector authority

## M11.S18B — Canonical Merge Gates

| Gate | Required result |
|---|---|
| active Threat_ID count | 98 |
| missing Threat_IDs | none |
| duplicate Threat_IDs | none |
| unexpected Threat_IDs | none |
| model-routed rows | all have accepted batch artifact |
| batch validation | every model-routed row has paired M12 validation |
| deterministic not-applicable rows | non-UNI only |
| UNI rows | all model-routed |
| row order | registry order preserved where possible |
| legal firewall | pass |
| upstream mutation | none |

`M11.S18B.C1` A canonical workpad that merely summarizes batch coverage without row-level Threat_ID accountability is inadequate and must be repaired.

`M11.S18B.C2` A row cannot be projected into controlled or triggered material output unless it exists in `exposure_registry_workpad_98`.

---

# M11.S19 — PHASE D/E: Split Material Profile Projections

## M11.S19A — Controlled Material Output Contract

After `exposure_registry_workpad_98` passes canonical merge validation, build `exposure_registry_controlled_profile` deterministically.

Return exactly this top-level JSON shape and stop:

```json
{
  "exposure_registry_controlled_profile": {
    "controlled_rows": [
      {
        "registry_exposure": "",
        "target_match": "",
        "evaluation_status": "CONTROLLED",
        "basis_proof": "",
        "impact_priority": "",
        "review_route": "",
        "row_limitations": ""
      }
    ]
  }
}
```

`M11.S19A.C1` `controlled_rows[]` contains only rows whose final material status is `CONTROLLED`.

`M11.S19A.C2` Every controlled row must contain exactly the seven locked material fields.

`M11.S19A.C3` `evaluation_status` must be `CONTROLLED` only.

`M11.S19A.C4` No TRIGGERED row may appear in `controlled_rows[]`.

`M11.S19A.C5` `exposure_registry_controlled_profile` must contain no key except `controlled_rows`.

## M11.S19B — Triggered Material Output Contract

After `exposure_registry_controlled_profile` is saved, build `exposure_registry_triggered_profile` deterministically.

Return exactly this top-level JSON shape and stop:

```json
{
  "exposure_registry_triggered_profile": {
    "triggered_rows": [
      {
        "registry_exposure": "",
        "target_match": "",
        "evaluation_status": "TRIGGERED",
        "basis_proof": "",
        "impact_priority": "",
        "review_route": "",
        "row_limitations": ""
      }
    ]
  }
}
```

`M11.S19B.C1` `triggered_rows[]` contains only rows whose final material status is `TRIGGERED`.

`M11.S19B.C2` Every triggered row must contain exactly the seven locked material fields.

`M11.S19B.C3` `evaluation_status` must be `TRIGGERED` only.

`M11.S19B.C4` No CONTROLLED row may appear in `triggered_rows[]`.

`M11.S19B.C5` `exposure_registry_triggered_profile` must contain no key except `triggered_rows`.

## M11.S19C — Split Material Projection Reconciliation

The split material projections pass only if:

| Gate | Required result |
|---|---|
| controlled projection source | `exposure_registry_workpad_98` |
| triggered projection source | `exposure_registry_workpad_98` |
| controlled rows | all CONTROLLED |
| triggered rows | all TRIGGERED |
| wrong-status rows | none |
| duplicate emitted Threat_IDs | none |
| missing CONTROLLED rows | none |
| missing TRIGGERED rows | none |
| seven-field shape | exact |
| row traceability | every row traces to canonical workpad |

---

# M11.S20 — PHASE F: Exposure Profile Forensics Derivation and Save Gate

`M11.S20.C1` Module XI must build `exposure_registry_profile_forensics` only after `exposure_registry_workpad_98`, `exposure_registry_controlled_profile`, and `exposure_registry_triggered_profile` have passed validation and have been saved as artifacts by the backend runner.

## Required forensic families

| Forensic family | Required content |
|---|---|
| `registry_input_manifest` | Required inputs loaded, missing, limited, or controlled-failed. |
| `full_registry_inventory_ledger` | All 98 active Threat_ID rows, registry order, row metadata integrity. |
| `lep_selector_application_ledger` | 22/22 LEP rows with mode/source/condition/outcome/fallback/forbidden-inference check. |
| `internal_registry_route_plan_ledger` | UNI/archetype/surface route decisions and route integrity checks. |
| `trigger_review_workspace_ledger` | One workspace per evaluation-routed row. |
| `trigger_adjudication_ledger` | Trigger status, basis type, trigger reason, confidence, actual path used. |
| `evidence_binding_ledger` | Source/profile/absence/access/conflict refs actually used. |
| `control_exclude_evaluation_ledger` | Evaluation status, visible control basis, EXCLUDE_IF/control analysis, limitations. |
| `registry_row_workpad_accountability_ledger` | One final workpad outcome per active Threat_ID. |
| `triggered_controlled_row_assembly_ledger` | Final material status reconciliation across controlled and triggered split artifacts. |
| `emission_manifest` | Expected-vs-emitted controlled and triggered reconciliation. |
| `registry_self_check_result` | OCG/self-check challenge outcomes. |
| `registry_lock_gate_result` | Final TG/lock gate outcomes. |
| `legal_firewall_ledger` | Confirmation that no legal/compliance/liability/verdict language leaked. |
| `runtime_trace_m11_only` | Agent/module-only trace, no private reasoning. |
| `forensic_boundary` | Confirms forensics are proof/custody only, not main material output. |

`M11.S20.C2` Forensics may contain row IDs, internal statuses, route plans, batch plans, batch artifact indexes, M12 batch validation indexes, full workpad coverage, and audit manifests. The split material profiles may not.

## M11.S20A — Additional Forensic Indexes Required by Batched Execution

The forensic artifact must also include, inside the existing forensic families where appropriate:

- route-plan artifact reference;
- batch-plan inventory;
- accepted batch artifact index;
- M12 batch validation artifact index;
- batch repair ledger;
- controlled failure ledger;
- controlled projection reconciliation;
- triggered projection reconciliation.

These are forensic/custody indexes only. They do not add new reader-facing material row fields.

## M11.S20B — Forensic Row-Count and Coverage Gates

Forensics must be row-complete, not summary-only.

Minimum row-count and coverage gates:

- `full_registry_inventory_ledger[]` must contain 98 rows, one for each active Threat_ID.
- `registry_row_workpad_accountability_ledger[]` must contain 98 rows, one final workpad outcome per active Threat_ID.
- `lep_selector_application_ledger[]` must contain 22 rows, one for each selected `LEP.*` selector row.
- `internal_registry_route_plan_ledger[]` must account for all 98 active Threat_IDs.
- `trigger_review_workspace_ledger[]` must contain one row for every evaluation-routed Threat_ID.
- `trigger_adjudication_ledger[]` must contain one row for every evaluation-routed Threat_ID.
- `evidence_binding_ledger[]` must contain evidence or formal limitation basis for every controlled/triggered material row and every routed row that required evidence review.
- `control_exclude_evaluation_ledger[]` must contain one row for every evaluation-routed Threat_ID.
- `triggered_controlled_row_assembly_ledger[]` must reconcile final material status with both split material artifacts.
- `emission_manifest{}` must reconcile all controlled and triggered rows and show no missing, duplicate, or wrong-status emitted Threat_IDs.
- legal/governance lossless coverage rows from Phase A must be projected into `registry_input_manifest`, `evidence_binding_ledger`, or row-specific limitation/evidence entries where used.

A forensic artifact that merely summarizes registry coverage without row-level Threat_ID accountability is inadequate and must be repaired.

## M11.S20C — Forensic Output Contract

After Phase F forensic derivation and validation pass, return exactly this top-level JSON shape and stop:

```json
{
  "exposure_registry_profile_forensics": {
    "registry_input_manifest": {},
    "full_registry_inventory_ledger": [],
    "lep_selector_application_ledger": [],
    "internal_registry_route_plan_ledger": [],
    "trigger_review_workspace_ledger": [],
    "trigger_adjudication_ledger": [],
    "evidence_binding_ledger": [],
    "control_exclude_evaluation_ledger": [],
    "registry_row_workpad_accountability_ledger": [],
    "triggered_controlled_row_assembly_ledger": [],
    "emission_manifest": {},
    "registry_self_check_result": {},
    "registry_lock_gate_result": {},
    "legal_firewall_ledger": {},
    "runtime_trace_m11_only": {},
    "forensic_boundary": {}
  }
}
```

`M11.S20C.C1` `exposure_registry_profile_forensics` must preserve full 98-row accountability, 22-row LEP selector coverage, legal/governance lossless source extraction coverage where used, route planning, batch planning, M12 batch validation custody, trigger/evaluation decisions, evidence binding, self-checks, lock-gates, and emission reconciliation.

`M11.S20C.C2` Do not re-emit `exposure_registry_controlled_profile`, `exposure_registry_triggered_profile`, upstream artifacts, `operator_challenge_gate`, `challenge_gate`, `final_output_handoff`, renderer payload, report prose, or compatibility wrappers in the forensic output.

`M11.S20C.C3` M12 global challenge may begin only after all saved artifacts exist:

- `exposure_registry_workpad_98`;
- `exposure_registry_controlled_profile`;
- `exposure_registry_triggered_profile`; and
- `exposure_registry_profile_forensics`.

## M11.S20D — Combined Output Prohibition

The following production backend output shape is forbidden:

```json
{
  "exposure_registry_controlled_profile": {},
  "exposure_registry_triggered_profile": {},
  "exposure_registry_profile_forensics": {}
}
```

That shape incorrectly mixes separate material and forensic boundaries into one response. It may be shown only as documentation that M11 ultimately owns multiple artifacts, not as an executable backend response.

## M11.S20E — Manual Terminal Boundary

Same-chat next-step receipts belong only to the terminal/receipt layer after backend validation and lock. M11 backend artifact output must not include same-chat commands, checkpoint prose, markdown receipts, report text, or handoff instructions.
