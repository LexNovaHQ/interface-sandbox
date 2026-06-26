# MODULE XI — REGISTRY HANDSHAKE AND EXPOSURE PROFILE
## Runtime-Synced / Full Triggered-Controlled Emission Upgrade

<phase_call_card>
phase_id: M11_EXPOSURE_REGISTRY
module_id: M11
module_name: REGISTRY_HANDSHAKE_AND_EXPOSURE_PROFILE
active_phase_only: true
active_agent: agent_5_exposure_registry
canonical_material_output: target_exposure_profile
canonical_forensic_output: target_exposure_profile_forensics

module_design_lock:
  M11 is the only registry-evaluation module.
  M11 evaluates all active AI Threat Registry rows against locked upstream artifacts and admitted evidence.
  M11 emits a reader-facing `target_exposure_profile` containing only triggered and controlled registry rows.
  M11 preserves full registry-row accountability, all LEP selector outcomes, route planning, trigger/evaluation decisions, evidence binding, self-checks, lock-gates, and emission reconciliation inside a separate forensic artifact.
  M11 does not issue legal advice, legal applicability conclusions, compliance conclusions, liability findings, breach findings, final legal-risk verdicts, or final report output.

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
  Evaluate all 98 active AI Threat Registry rows.
  Apply all 22 LEP selector rows from the Field Derivation Registry.
  Preserve exactly one registry-row workpad outcome per active Threat_ID in `target_exposure_profile_forensics` / Module V audit material.
  Build `target_exposure_profile` first from final TRIGGERED and CONTROLLED rows only.
  Build `target_exposure_profile_forensics` only after `target_exposure_profile` is complete, validated, and saved as the M11 material artifact by the backend runner.
  Every final TRIGGERED row must appear in `target_exposure_profile.triggered_and_controlled_rows[]`.
  Every final CONTROLLED row must appear in `target_exposure_profile.triggered_and_controlled_rows[]`.
  A row that is CONTROLLED and limited must still be emitted as CONTROLLED with limitation text.
  A row that is TRIGGERED and weak/conflicting must still be emitted as TRIGGERED with limitation text.
  Do not emit only summaries, counts, category buckets, matrices, review registers, controlled-only wrappers, or partial material rows.
  Do not perform M6, M7, M8, M9, M10, M12, M13, or M14 work.
  Do not mutate upstream profiles, registry metadata, registry rows, or source-discovery custody.
  Do not emit `operator_challenge_gate`, `final_output_handoff`, report prose, HTML, renderer output, or terminal report output.
  After each local phase output boundary, use the backend validator/save gate required for that phase. Do not use visible same-chat phase packets in backend execution.

internal_stage_order:
  - PHASE A / M11-A: Exposure Source, Registry, and Upstream Evidence Extraction Capsule
    - M11-A1: Runtime and Registry Handshake
    - M11-A2: Input Custody and Upstream Artifact Gate
    - M11-A3: Legal/Governance Lossless Bucket Extraction
    - M11-A4: Full Registry Inventory and LEP Selector Load
    - M11-A5: Internal Registry Route Planning
    - M11-A6: Trigger Review Workspace Formation
  - PHASE B / M11-B: Material Target Exposure Profile Derivation
    - M11-B1: Model-Led Trigger Adjudication
    - M11-B2: Evidence Binding
    - M11-B3: Model-Led Control / Exclude Evaluation
    - M11-B4: Registry Row Workpad Accountability
    - M11-B5: Triggered / Controlled Row Assembly
    - M11-B6: Seven-Column Row Shaping
  - PHASE B1 / M11-B1: Material Target Exposure Profile Validator + Save Gate
    - M11-B1A: Emission Manifest Reconciliation
    - M11-B1B: Registry Self-Check and Material Save Gate
  - PHASE C / M11-C: Target Exposure Profile Forensics Derivation
  - PHASE D / M11-D: Target Exposure Profile Forensics Validator + Save Gate

phase_terminal_sequence:
  In backend execution, return strict JSON only.
  Do not emit `<phase_output>` blocks.
  Do not emit checkpoint prose.
  Do not emit terminal receipt text.
  Do not emit audit logs, operator challenge gates, final handoff JSON, report prose, HTML, markdown, or renderer payload.
  M11 has two separate backend terminal events, not one combined response.
  Phase B1 terminal event returns exactly one top-level key: `target_exposure_profile`.
  The backend runner must validate and save `target_exposure_profile` as an artifact before Phase C starts.
  Phase D terminal event returns exactly one top-level key: `target_exposure_profile_forensics`.
  The backend runner must validate and save `target_exposure_profile_forensics` before M12/M13.
  A response that contains both `target_exposure_profile` and `target_exposure_profile_forensics` in the same backend call is invalid unless the operator has explicitly invoked a non-production debug bundling mode.

phase_local_gate:
  Before handoff, verify:
    - active runtime binding resolves to Agent 5 / M11 only.
    - all required Agent 1, Agent 3, and Agent 4 artifacts exist or controlled limitation/failure is recorded.
    - `AI_THREAT_REGISTRY.yaml`, `REGISTRY_KEY_v3_0.md`, `03_REGISTRY_EVALUATION_RULES.yaml`, and LEP selector authority are loaded.
    - expected active registry row count is 98 and loaded active registry row count is 98.
    - all 22 LEP selector rows have final workpad outcomes.
    - all 98 active registry rows have exactly one final registry-row workpad outcome.
    - every registry-row workpad outcome contains exactly one Threat_ID.
    - no grouped rows, composite Threat_ID rows, category rows, material-public-route rows, or compact route summaries appear.
    - patched M8 activity paths are used: `activity_reference`, `product_service_wrapper`, `activity_feature_name`, `mechanics_proof`, `data_content_object_touched`, `archetype_codes`, `surface_context_tokens`, `surface_proof_and_routing_limits`.
    - stale M8 paths are rejected: `activity_id`, `product_context`, `activity_name`, `mechanics`, `surface_tokens`, `routing_basis`, `activity_inventory`, `activity_mechanics`, `registry_routing_substrate`.
    - M10 main and M10 forensics are consumed only as locked upstream artifacts; M10 data provenance is not re-derived.
    - trigger status and evaluation status remain separate in forensic/workpad material.
    - every final TRIGGERED row appears in `target_exposure_profile.triggered_and_controlled_rows[]`.
    - every final CONTROLLED row appears in `target_exposure_profile.triggered_and_controlled_rows[]`.
    - the emission manifest shows no missing triggered rows, no missing controlled rows, no duplicate emitted Threat_IDs, and no wrong-status emitted rows.
    - every emitted row uses exactly the locked seven-column row contract.
    - `target_exposure_profile` contains no key except `triggered_and_controlled_rows`.
    - `target_exposure_profile_forensics` is separate and emitted only after the main profile.
    - no legal advice, compliance conclusion, legality conclusion, legal applicability conclusion, liability finding, breach finding, enforceability verdict, risk score, or high/low legal-risk verdict appears.
    - no M12, M13, or M14 canonical object is emitted.

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
  - target_data_provenance_profile
  - target_data_provenance_profile_forensics
  - AI_THREAT_REGISTRY.yaml
  - REGISTRY_KEY_v3_0.md
  - 03_REGISTRY_EVALUATION_RULES.yaml
  - FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml LEP.* authority
  - FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml forensic authority
  - admitted M6 registry/product/legal/data/control evidence and limitations

required_machine_output_by_phase:
  PHASE_B1_MATERIAL_SAVE_EVENT:
    - target_exposure_profile
  PHASE_D_FORENSIC_SAVE_EVENT:
    - target_exposure_profile_forensics

forbidden_outputs:
  - operator_challenge_gate
  - final_output_handoff
  - exposure_summary
  - material_exposure_findings
  - controlled_exposure_rows
  - absent_not_triggered_registry_rows
  - registry_coverage_matrix
  - activity_to_exposure_matrix
  - data_asset_to_exposure_matrix
  - legal_control_to_exposure_matrix
  - review_priority_register
  - exposure_limitations as separate profile branch
  - grouped route rows
  - composite Threat_ID rows
  - material public route summaries
  - compact registry categories
  - old M8 path names
  - legal/compliance verdicts

validator_action:
  action_name: backend_validate_and_save_M11_EXPOSURE_REGISTRY
  phase: M11_EXPOSURE_REGISTRY
  pass_condition: Phase B1 emits and saves target_exposure_profile first with every final TRIGGERED and CONTROLLED row; only after backend save may Phase C/D emit and save target_exposure_profile_forensics with 98/98 registry workpad coverage, 22/22 LEP selector coverage, legal/governance lossless source extraction coverage, and clean emission manifest
  fail_behavior: repair M11 only; do not advance to M12/M13

repair_policy:
  - Repair in M11 means targeted registry-row, evidence-path, LEP-selector, emitted-row, or forensic-ledger reinvestigation first; not immediate hard blocking, silent row suppression, summary substitution, or status downgrade.
  - If a registry row, route decision, trigger decision, evaluation status, visible-control basis, evidence binding, LEP selector outcome, seven-column emitted row, emission-manifest entry, legal/governance lossless evidence use, or forensic ledger row is inadequate, unsupported, weak, thin, vague, conflicting, or wrong, run targeted item-specific reinvestigation inside the existing Agent 1 / Agent 3 / Agent 4 approved source universe.
  - Re-evaluate the affected Threat_ID or LEP row using the governing `AI_THREAT_REGISTRY.yaml`, `03_REGISTRY_EVALUATION_RULES.yaml`, `REGISTRY_KEY_v3_0.md`, selected `LEP.*` authority, patched M8 activity paths, M10 data/control substrate, M9 legal/governance navigation, and admitted legal/governance lossless evidence.
  - If the row can be supported after targeted reinvestigation, emit or repair the supported TRIGGERED or CONTROLLED row using the seven-column contract.
  - If the row remains weak, access-limited, conflicting, or partially supported after targeted reinvestigation, keep the correct final material status where registry logic requires TRIGGERED or CONTROLLED, add controlled limitation/review-route text in `row_limitations`, and record the limitation in `target_exposure_profile_forensics`.
  - If the row is not TRIGGERED or CONTROLLED after proper evaluation, preserve it in forensic/workpad accountability only; do not emit it in `target_exposure_profile`.
  - Proceed only after every weakness, conflict, not-visible state, access failure, review-required state, omission, or limitation is controlled and ledgered.
  - Do not solve missing emitted rows by downgrading TRIGGERED or CONTROLLED rows merely to avoid emission.
  - Do not recompute unrelated upstream objects.
  - Only route back to Agent 1 / M6 source repair when the source universe, legal/governance lossless buckets, or admitted evidence custody is missing, corrupted, inaccessible, or contradictory in a way M11 cannot repair from loaded artifacts.
  - Only route back to Agent 3 or Agent 4 when a locked upstream profile artifact itself is missing, malformed, or contradictory in a way M11 cannot repair without mutating that upstream artifact.

stop_condition:
  Stop local M11 phase only; return control to the backend runner. The backend runner may advance to M12/M13 only after `target_exposure_profile` and `target_exposure_profile_forensics` are saved and M11 returns PASS, PASS_WITH_WARNING, PASS_WITH_LIMITATION, or REINVESTIGATION_COMPLETED_WITH_LIMITATION. If M11 returns SOURCE_REPAIR_REQUIRED or CONTROLLED_FAILURE, do not advance.
</phase_call_card>

`M11.S0.C1` This M11 module is the standalone Exposure Registry phase for Agent 5. It is not a combined M11/M12/M13 prompt.

`M11.S0.C2` M11 does not authorize merged material/forensic output. The old one-shot `<phase_output>` shape containing both `target_exposure_profile` and `target_exposure_profile_forensics` is expressly rejected for production backend execution.

`M11.S0.C3` M11 cannot hand off to M12/M13 until `target_exposure_profile` and `target_exposure_profile_forensics` are both saved artifacts and the M11 lock gate has passed.

`M11.S0.C4` M11 material exposure-profile derivation and M11 forensic derivation are sequential. The forensic profile is not allowed to be invented from memory, summary, or unsaved material-profile assumptions.

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
Every final CONTROLLED row must appear in target_exposure_profile.triggered_and_controlled_rows[].
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

Forbidden branches inside `target_exposure_profile`:

| Forbidden branch | Reason |
|---|---|
| `exposure_summary` | summary substitution hides row-level material output |
| `controlled_exposure_rows` | controlled rows must be inside `triggered_and_controlled_rows[]` |
| `absent_not_triggered_registry_rows` | audit/workpad only |
| `registry_coverage_matrix` | forensic only |
| `review_priority_register` | forensic/workpad only |
| `activity_to_exposure_matrix` | forensic/workpad only |
| `data_asset_to_exposure_matrix` | forensic/workpad only |
| `legal_control_to_exposure_matrix` | forensic/workpad only |

---

# M11.S1 — Function, Boundary, and Non-Negotiables

## M11.S1A — Function

`M11.S1A.C1` Module XI converts locked upstream target, feature, legal, data-provenance, source, registry, and registry-evaluation authorities into the canonical `target_exposure_profile`.

`M11.S1A.C2` Module XI is the only module authorized to evaluate AI Threat Registry rows.

`M11.S1A.C3` Module XI must evaluate or account for every active registry row exactly once.

`M11.S1A.C4` Module XI emits reader-facing exposure rows only for final TRIGGERED and CONTROLLED rows.

`M11.S1A.C5` Module XI preserves all non-emitted rows, route decisions, trigger decisions, evidence binding, control/exclude evaluation, limitations, and self-checks in `target_exposure_profile_forensics` / Module V audit material.

## M11.S1B — Hard Non-Negotiables

| Non-negotiable | Rule |
|---|---|
| Registry completeness | Load and account for all 98 active registry rows. |
| LEP completeness | Apply all 22 LEP selector rows. |
| UNI routing | Every UNI row is evaluation-routed. UNI rows may not be `NOT_TRIGGERED_NOT_APPLICABLE`. |
| Active routing source | Active archetypes and surfaces come only from locked M8, not M7 or model memory. |
| Surface path | Use `surface_context_tokens[]`, never `surface_tokens[]`. |
| Main output | `target_exposure_profile.triggered_and_controlled_rows[]` only. |
| Controlled rows | Every final CONTROLLED row must be emitted. |
| Triggered rows | Every final TRIGGERED row must be emitted. |
| Forensics | Full 98-row ledger and emission manifest must live in `target_exposure_profile_forensics`. |
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
| `target_data_provenance_profile` | Data/privacy/control/missing-proof/readiness substrate. |
| `target_data_provenance_profile_forensics` | DAP derivation proof, Anti-Unknown outcomes, readiness matrix proof, and missing-proof linkage. |
| `AI_THREAT_REGISTRY.yaml` | Locked active registry row inventory. |
| `REGISTRY_KEY_v3_0.md` | Registry vocabulary, ID syntax, archetype/surface interpretation, row semantics. |
| `03_REGISTRY_EVALUATION_RULES.yaml` | Trigger/exclude/control/evaluation discipline. |
| `FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml` | LEP field derivation authority. |
| `FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml` | Forensic shape and audit-preservation authority. |

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
| `target_data_provenance_profile` missing | `CONTROLLED_FAILURE` unless M11 locks with explicit limitations for rows that do not depend on data/privacy/control evidence |
| `target_data_provenance_profile_forensics` missing | `LOCKED_WITH_LIMITATIONS` only if row evidence can still be bound truthfully; otherwise `CONTROLLED_FAILURE` |
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
| `ACCESS_FAILED` | Relevant source route failed or was text-insufficient. |
| `NOT_TRIGGERED` | Trigger conditions not met on merits. |
| `NOT_APPLICABLE_CONTEXTUAL` | Non-UNI row contextually not applicable; audit-only. |
| `REQUIRES_QUALIFIED_REVIEW` | Qualified review required to resolve. |
| `CONTROLLED_FAILURE` | Unsafe or unusable module state. |

## M11.S3E — Emitted Material Status

| Final emitted status | Emission rule |
|---|---|
| `TRIGGERED` | Must be emitted in `triggered_and_controlled_rows[]`. |
| `CONTROLLED` | Must be emitted in `triggered_and_controlled_rows[]`. |

`M11.S3E.C1` Internal evaluation statuses are not the emitted material status.

`M11.S3E.C2` A row with final material status `TRIGGERED` or `CONTROLLED` must be emitted even if it also carries limitation, conflict, weak-evidence, access-failure, or qualified-review context.

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

| Column | Machine field | Required content |
|---|---|---|
| Registry Exposure | `registry_exposure` | Threat ID, threat name, lane/family, authority anchors, and registry lifecycle/status. |
| Target Match | `target_match` | Product/activity/data/legal-control context that made the row relevant. |
| Evaluation Status | `evaluation_status` | `TRIGGERED` or `CONTROLLED` only. |
| Basis / Proof | `basis_proof` | Trigger basis, visible-control basis, and admitted evidence refs. |
| Impact / Priority | `impact_priority` | Registry pain/velocity plus derived business review priority. No legal-risk verdict. |
| Review Route | `review_route` | Normalized `Registry Remediation Route`, missing proof, and next review action. |
| Row Limitations | `row_limitations` | Weak evidence, not searched, access failed, conflicting signals, public-footprint limits, and controlled-status boundary. |

`M11.S4B.C1` Every emitted row must contain exactly these seven fields.

`M11.S4B.C2` `CONTROLLED` means visible public control exists. It does not mean compliant, sufficient, enforceable, legally adequate, solved, risk-free, or locally counsel-approved.

`M11.S4B.C3` `Registry Remediation Route` is the only public-facing remediation-route label. Legacy registry column names must not appear in emitted output.

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

`M11.S6A.C2` The capsule is internal working material until Phase C. It must not be emitted inside `target_exposure_profile`.

`M11.S6A.C3` The capsule must be built only from locked upstream artifacts, loaded legal/governance lossless buckets, M6-admitted evidence/absence/access records, and registry authorities.

### M11.S6A.1 — Required Extraction Parents

| Extraction parent | Required source basis | Required extraction focus |
|---|---|---|
| Upstream profile extraction | `target_profile`, `target_profile_forensics`, `target_feature_profile`, `target_feature_profile_forensics`, `target_data_provenance_profile`, `target_data_provenance_profile_forensics` | active target context, activities, archetypes, surfaces, data/control signals, limitations, and proof paths. |
| Legal/governance lossless extraction | `lossless_family__L1_CORE_TERMS_PRIVACY` through `lossless_family__L6_ENTITY_NOTICE` | public control wording, legal/governance commitments, policies, DPA/AUP/SLA, AI governance, privacy notices, security/trust controls, absence/access limitations. |
| Registry authority extraction | `AI_THREAT_REGISTRY.yaml`, `REGISTRY_KEY_v3_0.md`, `03_REGISTRY_EVALUATION_RULES.yaml` | active Threat_ID inventory, trigger/control/exclude logic, archetype/surface routing metadata, registry remediation route vocabulary. |
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
| Row metadata | Preserve threat name, lane, archetype, surface, authority, velocity, pain tier, status, trigger, and remediation-route source. |
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

# M11.S9 — PHASE A: Trigger Review Workspace Formation

| Workspace component | Required content |
|---|---|
| Registry row reference | Threat_ID, threat name, lane, archetype, surfaces, registry trigger rule. |
| Candidate upstream context | M8 activity refs, M10 data/control refs, M9 legal-control refs, M6 admitted source refs. |
| Candidate evidence paths | Admitted evidence refs, lossless block refs, absence refs, access-failed refs. |
| Model path authority | May use, expand, or reject candidate routes only inside admitted evidence. |
| Actual path used | Must be recorded after model route selection. |
| Workspace limitations | Must record sparse evidence, access failure, weak wording, or missing proof. |

`M11.S9.C1` Every evaluation-routed row must receive one trigger review workspace.

`M11.S9.C2` Trigger review workspaces are not emitted in the main profile.

---

# M11.S10 — PHASE B: Material Profile Derivation — Model-Led Trigger Adjudication

| Trigger task | Required action |
|---|---|
| Evaluate row condition fit | Compare registry trigger condition with locked upstream profiles and admitted evidence. |
| Select actual evidence path | Use the actual source/profile path relied on. |
| Assign trigger status | Use only the locked trigger-status vocabulary. |
| Assign trigger basis type | Feature, archetype, surface, data, legal-control, absence, access-failed, conflict, insufficient, universal, or review-required context. |
| Record trigger confidence | high / medium / low / unknown. |
| Record trigger reason | Concise, no legal verdict. |
| Determine if evaluation continues | `needs_row_evaluation` true/false. |

`M11.S10.C1` Trigger adjudication must occur before control/exclude evaluation.

`M11.S10.C2` Risk surface alone is insufficient.

`M11.S10.C3` No trigger decision may use model memory or unadmitted evidence.

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

# M11.S14 — PHASE B: Material Profile Derivation — Triggered / Controlled Row Assembly

## Emission Rule

| Final material status | Emit in main profile? |
|---|---|
| `TRIGGERED` | Yes |
| `CONTROLLED` | Yes |
| `LIMITED` only | No |
| `CANDIDATE_ONLY` only | No |
| `INSUFFICIENT_EVIDENCE` only | No |
| `PARTIAL_OR_WEAK_SIGNAL` only | No |
| `CONFLICTING_SIGNALS` only | No |
| `REQUIRES_QUALIFIED_REVIEW` only | No |
| `NOT_TRIGGERED` only | No |
| `NOT_APPLICABLE_CONTEXTUAL` only | No |
| `AUDIT_ONLY` only | No |

`M11.S14.C1` A row that is both CONTROLLED and LIMITED must still be emitted as CONTROLLED.

`M11.S14.C2` A row that is TRIGGERED and weak/conflicting/review-required must still be emitted as TRIGGERED.

`M11.S14.C3` Missing emitted triggered/controlled rows cannot be repaired by downgrading the row to avoid emission.

`M11.S14.C4` The main profile may contain no row unless its final material emitted status is TRIGGERED or CONTROLLED.

---

# M11.S15 — PHASE B: Material Profile Derivation — Seven-Column Row Shaping

| Row field | Shaping rule |
|---|---|
| `registry_exposure` | Copy registry identity and registry-native context without mutation: Threat_ID, name, lane/family, authority anchors, lifecycle/status. |
| `target_match` | Explain target-specific route: M8 activity/archetype/surface, M10 data/control, M9 legal-control, and source context that made the row relevant. |
| `evaluation_status` | Use only `TRIGGERED` or `CONTROLLED`. |
| `basis_proof` | Summarize trigger basis, visible-control basis, and evidence refs. No long source dump. |
| `impact_priority` | Use registry pain tier, velocity, pain/impact metadata, and business review priority. No legal-risk verdict. |
| `review_route` | Use normalized `Registry Remediation Route`, missing-proof route, and next review action. |
| `row_limitations` | Include weak evidence, absence/not-searched limits, access failure, conflict, public-footprint limit, and controlled-status boundary. |

`M11.S15.C1` No emitted row may contain extra keys beyond the seven locked fields.

---

# M11.S16 — PHASE B1: Emission Manifest Reconciliation and Material Save Gate

`M11.S16.C1` Module XI must create a forensic-only emission manifest after row assembly and before lock.

## Emission Manifest Required Checks

| Manifest check | Required result |
|---|---|
| active registry rows expected | 98 |
| active registry rows loaded | 98 |
| active registry rows evaluated or accounted | 98 |
| LEP selector rows expected | 22 |
| LEP selector rows applied | 22 |
| final triggered Threat_ID list | complete list from final reconciliation |
| final controlled Threat_ID list | complete list from final reconciliation |
| emitted triggered Threat_ID list | complete list from main profile |
| emitted controlled Threat_ID list | complete list from main profile |
| missing triggered Threat_IDs | none |
| missing controlled Threat_IDs | none |
| duplicate emitted Threat_IDs | none |
| wrong-status emitted rows | none |
| emitted rows with non-seven-column shape | none |
| all triggered rows emitted | true |
| all controlled rows emitted | true |

`M11.S16.C2` The emission manifest must live inside `target_exposure_profile_forensics`, not inside `target_exposure_profile`.

`M11.S16.C3` The lock gate must fail if the emission manifest does not reconcile.

## M11.S16A — Phase B1 Material Validator + Save Gate

`M11.S16A.C1` Phase B1 validates the completed `target_exposure_profile` before forensics may begin.

`M11.S16A.C2` Phase B1 passes only if:

- `target_exposure_profile` contains exactly one top-level key: `triggered_and_controlled_rows`;
- every final `TRIGGERED` Threat_ID appears exactly once in `triggered_and_controlled_rows[]`;
- every final `CONTROLLED` Threat_ID appears exactly once in `triggered_and_controlled_rows[]`;
- no non-triggered, not-applicable, audit-only, candidate-only, summary-only, or absent row appears in the material profile;
- every emitted row has exactly the seven locked fields in M11.S15;
- every emitted row has evidence basis or formal limitation from admitted upstream evidence or legal/governance lossless source text;
- the emission manifest reconciles with no missing triggered rows, missing controlled rows, duplicate emitted Threat_IDs, or wrong-status emitted rows;
- no legal/compliance/liability/verdict language appears.

`M11.S16A.C3` At the Phase B1 backend output boundary, M11 must emit exactly one top-level artifact and stop:

```json
{
  "target_exposure_profile": {
    "triggered_and_controlled_rows": []
  }
}
```

`M11.S16A.C4` Phase B1 must not emit `target_exposure_profile_forensics`, upstream artifacts, phase wrappers, terminal receipts, checkpoints, report prose, operator challenge, final handoff, renderer payload, or compatibility wrappers.

`M11.S16A.C5` The backend runner must validate and save `target_exposure_profile` as the M11 material artifact before Phase C begins. Phase C is forbidden until the saved `target_exposure_profile` artifact exists in the backend / Drive artifact vault.

## M11.S16B — Phase B1 Material Repair / Targeted Reinvestigation Behavior

`M11.S16B.C1` If Phase B1 finds an inadequate, unsupported, weak, thin, vague, conflicting, missing, duplicated, wrongly shaped, wrongly emitted, or wrong-status material row, do not proceed to Phase C.

`M11.S16B.C2` Phase B1 repair must identify the exact failing `Threat_ID`, emitted-row field, LEP selector row, evidence path, trigger/evaluation decision, or emission-manifest entry. Generic category repair is forbidden.

`M11.S16B.C3` Run targeted Threat_ID-specific or LEP-specific reinvestigation inside the loaded Agent 1 / Agent 3 / Agent 4 approved source universe only, including upstream profiles, upstream forensics, M9 legal/governance navigation, M10 data/control substrate, and admitted legal/governance lossless buckets.

`M11.S16B.C4` Re-apply the governing registry row, evaluation rules, LEP selector authority, patched M8 routing paths, M10 data/control evidence, and admitted evidence basis to the specific failing row.

`M11.S16B.C5` If support is found, repair the emitted row and preserve the correct final material status: `TRIGGERED` or `CONTROLLED`.

`M11.S16B.C6` If support remains weak, conflicting, access-limited, not visible, or review-required after targeted reinvestigation, keep the row emitted where final material status remains `TRIGGERED` or `CONTROLLED`, add controlled limitation text in `row_limitations`, and create matching forensic ledger entries.

`M11.S16B.C7` If the row no longer qualifies as `TRIGGERED` or `CONTROLLED` after proper evaluation, remove it from `target_exposure_profile` only if the forensic workpad records the final non-emitted status and the emission manifest still reconciles. Do not use removal as a shortcut to avoid difficult support.

`M11.S16B.C8` Missing triggered or controlled rows cannot be repaired by downgrading, suppressing, grouping, summarizing, or moving the row into a count/category branch. They must be repaired, emitted, or controlled with limitation according to registry logic.

`M11.S16B.C9` After any material repair, rerun emission-manifest reconciliation, registry self-check, seven-column shape validation, legal/firewall validation, and Phase B1 before saving `target_exposure_profile`.

---

# M11.S17 — PHASE B1: Registry Self-Check and Material Save Gate

## Required Self-Check Challenges

| Challenge | Required check |
|---|---|
| Full registry preservation | 98/98 rows accounted exactly once. |
| UNI always-run | All UNI rows evaluation-routed. |
| Route integrity | Archetype/surface routing uses patched M8 paths. |
| Trigger/evaluation separation | Trigger status and evaluation status remain separate. |
| Model authority | Model evaluated routed rows within admitted evidence only. |
| Evidence path | Actual evidence path used is recorded. |
| Supported row evidence | Triggered/controlled rows have basis proof or formal limitation. |
| Absence/access basis | Not-visible and access-failed outcomes carry basis refs where available. |
| Legal firewall | No forbidden legal/compliance/verdict language. |
| Upstream mutation | No upstream artifact mutation. |
| Registry mutation | No registry metadata mutation. |
| Triggered/controlled emission | Every triggered and every controlled row emitted. |
| Final JSON/main profile lock | Main profile contains only `triggered_and_controlled_rows`. |

`M11.S17.C1` Registry Self-Check output is forensic/workpad material only.

`M11.S17.C2` Final lock is impossible unless the self-check passes or is repaired.



`M11.S17.C3` Registry self-check is part of Phase B1 material validation. It does not authorize forensic derivation until `target_exposure_profile` has been saved.

---

# M11.S18 — PHASE C: Exposure Profile Forensics Derivation

`M11.S18.C1` Module XI must build `target_exposure_profile_forensics` only after `target_exposure_profile` has passed Phase B1 validation and has been saved as the M11 material artifact by the backend runner.

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
| `triggered_controlled_row_assembly_ledger` | Final material status reconciliation. |
| `emission_manifest` | Expected-vs-emitted triggered/controlled reconciliation. |
| `registry_self_check_result` | OCG/self-check challenge outcomes. |
| `registry_lock_gate_result` | Final TG/lock gate outcomes. |
| `legal_firewall_ledger` | Confirmation that no legal/compliance/liability/verdict language leaked. |
| `runtime_trace_m11_only` | Agent/module-only trace, no private reasoning. |
| `forensic_boundary` | Confirms forensics are proof/custody only, not main material output. |

`M11.S18.C2` Forensics may contain row IDs, internal statuses, route plans, full workpad coverage, and audit manifests. The main material profile may not.



## M11.S18A — Forensic Row-Count and Coverage Gates

Forensics must be row-complete, not summary-only.

Minimum row-count and coverage gates:

- `full_registry_inventory_ledger[]` must contain 98 rows, one for each active Threat_ID.
- `registry_row_workpad_accountability_ledger[]` must contain 98 rows, one final workpad outcome per active Threat_ID.
- `lep_selector_application_ledger[]` must contain 22 rows, one for each selected `LEP.*` selector row.
- `internal_registry_route_plan_ledger[]` must account for all 98 active Threat_IDs.
- `trigger_review_workspace_ledger[]` must contain one row for every evaluation-routed Threat_ID.
- `trigger_adjudication_ledger[]` must contain one row for every evaluation-routed Threat_ID.
- `evidence_binding_ledger[]` must contain evidence or formal limitation basis for every triggered/controlled material row and every routed row that required evidence review.
- `control_exclude_evaluation_ledger[]` must contain one row for every evaluation-routed Threat_ID.
- `triggered_controlled_row_assembly_ledger[]` must reconcile final material status with emitted material rows.
- `emission_manifest{}` must reconcile all triggered and controlled rows and show no missing, duplicate, or wrong-status emitted Threat_IDs.
- legal/governance lossless coverage rows from Phase A must be projected into `registry_input_manifest`, `evidence_binding_ledger`, or row-specific limitation/evidence entries where used.

A forensic artifact that merely summarizes registry coverage without row-level Threat_ID accountability is inadequate and must be repaired.

---

# M11.S19 — PHASE D: Forensic Validation and Lock Gate

## M11.S19A — Critical Blockers

| Blocker | Required result |
|---|---|
| Missing registry authority | `CONTROLLED_FAILURE` |
| Registry count not 98 | `CONTROLLED_FAILURE` unless registry contract amended |
| Missing LEP selector authority | `CONTROLLED_FAILURE` |
| Missing required upstream artifact | `CONTROLLED_FAILURE` or controlled limitation only if truthful |
| New source discovery | `CRITICAL_BLOCKER` |
| Unadmitted evidence use | `CRITICAL_BLOCKER` |
| Upstream mutation | `CRITICAL_BLOCKER` |
| Registry metadata mutation | `CRITICAL_BLOCKER` |
| Legal/compliance verdict leakage | `CRITICAL_BLOCKER` |
| Missing triggered row emission | `CRITICAL_BLOCKER` |
| Missing controlled row emission | `CRITICAL_BLOCKER` |
| Missing emission manifest | `CRITICAL_BLOCKER` |
| Stale M8 surface path used | `CRITICAL_BLOCKER` |

## M11.S19B — Lock Conditions

Lock only if all conditions pass:

| Lock condition | Required result |
|---|---|
| Active agent scope | Agent 5 / M11 only |
| Registry row count | 98/98 |
| LEP selector coverage | 22/22 |
| Full registry workpad coverage | 98/98 exactly once |
| Duplicate Threat_IDs | none |
| UNI rows | all evaluation-routed |
| Not-applicable rows | non-UNI only |
| Trigger/evaluation status vocabularies | valid |
| Evidence refs | present or formally limited for material rows |
| Emission manifest | reconciled cleanly |
| Main output root | `target_exposure_profile` only |
| Main output key | `triggered_and_controlled_rows` only |
| Emitted row shape | exactly seven fields per row |
| Forensics artifact | separate and complete |
| Legal firewall | pass |
| Registry firewall | pass |
| Upstream mutation gate | pass |

## M11.S19C — Lock Status

| Outcome | Use |
|---|---|
| `LOCKED` | All gates pass. |
| `LOCKED_WITH_LIMITATIONS` | Usable, truthful, limitations recorded, emission manifest reconciled. |
| `CONTROLLED_FAILURE` | Unsafe, unusable, missing registry authority/count, or unresolved critical blocker. |
| `PASS_WITH_WARNING` | All required artifacts are usable and non-blocking warnings are controlled and ledgered. |
| `REINVESTIGATION_COMPLETED_WITH_LIMITATION` | Targeted M11 reinvestigation was completed; unresolved weakness is controlled, emitted where required, and ledgered. |
| `SOURCE_REPAIR_REQUIRED` | Upstream source universe, lossless bucket, or admitted evidence custody defect requires Agent 1 / M6 repair. |


## M11.S19D — Phase D Forensic Validator + Save Gate

`M11.S19D.C1` Phase D validates `target_exposure_profile_forensics` after Phase C forensic derivation.

`M11.S19D.C2` Phase D passes only if the forensic artifact contains the required forensic families in M11.S18, satisfies the row-count and coverage gates in M11.S18A, preserves 98/98 registry accountability, preserves 22/22 LEP selector coverage, reconciles the emission manifest, and confirms the legal/firewall and upstream-mutation gates.

`M11.S19D.C3` At the Phase D backend output boundary, M11 must emit exactly one top-level artifact and stop:

```json
{
  "target_exposure_profile_forensics": {}
}
```

`M11.S19D.C4` Phase D must not re-emit `target_exposure_profile`, upstream artifacts, phase wrappers, terminal receipts, checkpoints, report prose, operator challenge, final handoff, renderer payload, or compatibility wrappers.

`M11.S19D.C5` The backend runner must validate and save `target_exposure_profile_forensics` before M12/M13 begins.

## M11.S19E — Phase D Forensic Repair / Targeted Reinvestigation Behavior

`M11.S19E.C1` If Phase D finds an inadequate, missing, summary-only, inconsistent, non-row-complete, or unsupported forensic branch, repair the exact forensic family or row before save.

`M11.S19E.C2` Forensic repair must identify the exact failing `Threat_ID`, LEP selector row, route-plan row, trigger workspace, adjudication row, evidence-binding row, control/exclude evaluation row, workpad-accountability row, emission-manifest entry, legal-firewall entry, or source-custody entry.

`M11.S19E.C3` If the defect is forensic-only, repair `target_exposure_profile_forensics` without re-emitting `target_exposure_profile`.

`M11.S19E.C4` If the forensic defect exposes a material-row defect, return to the smallest affected Phase B step, repair the affected Threat_ID or emitted row, rerun Phase B1, resave `target_exposure_profile`, then rerun Phase C and Phase D.

`M11.S19E.C5` Forensic repair may not invent evidence, mutate upstream artifacts, mutate registry rows, downgrade triggered/controlled rows, collapse rows into summaries, or hide defects in generic limitation prose.

`M11.S19E.C6` If public evidence remains insufficient after targeted reinvestigation, preserve the insufficiency in the relevant forensic ledger, link it to the emitted row limitation or non-emitted workpad outcome, and mark the final phase state as `REINVESTIGATION_COMPLETED_WITH_LIMITATION` or `PASS_WITH_LIMITATION` where downstream use remains safe.

`M11.S19E.C7` If row-level forensic accountability cannot be restored because the upstream source universe or lossless custody is defective, return `SOURCE_REPAIR_REQUIRED` and route to Agent 1 / M6.

---

# M11.S20 — Split Backend Output Contract

M11 owns two artifacts, but they are saved in separate backend phases. M11 must not return a combined material+forensic object in production backend execution.

## M11.S20A — PHASE B1 Material Output Contract

After Phase B material derivation and Phase B1 validation pass, return exactly this top-level JSON shape and stop:

```json
{
  "target_exposure_profile": {
    "triggered_and_controlled_rows": [
      {
        "registry_exposure": "",
        "target_match": "",
        "evaluation_status": "TRIGGERED | CONTROLLED",
        "basis_proof": "",
        "impact_priority": "",
        "review_route": "",
        "row_limitations": ""
      }
    ]
  }
}
```

The `target_exposure_profile` object must contain exactly one top-level key: `triggered_and_controlled_rows`.

`triggered_and_controlled_rows[]` must contain every final `TRIGGERED` row and every final `CONTROLLED` row, with no missing triggered rows, no missing controlled rows, no duplicate Threat_IDs, and no wrong-status emitted rows.

Every row inside `triggered_and_controlled_rows[]` must contain exactly these seven fields:

| Field | Required content |
|---|---|
| `registry_exposure` | Threat ID, threat name, lane/family, authority anchors, lifecycle/status. |
| `target_match` | Target-specific product/activity/data/legal-control context. |
| `evaluation_status` | `TRIGGERED` or `CONTROLLED` only. |
| `basis_proof` | Trigger basis, visible-control basis, admitted evidence refs or formal limitation. |
| `impact_priority` | Registry pain/velocity plus business review priority. No legal-risk verdict. |
| `review_route` | Registry Remediation Route, missing proof, next review action. |
| `row_limitations` | Weak evidence, not searched, access failed, conflict, public-footprint limits, controlled-status boundary. |

Do not emit `target_exposure_profile_forensics`, `operator_challenge_gate`, `final_output_handoff`, renderer payload, report prose, upstream artifacts, registry audit ledgers, emission manifest, or compatibility wrappers in the Phase B1 material output.

The backend runner must save `target_exposure_profile` before Phase C begins.

## M11.S20B — PHASE D Forensic Output Contract

After the saved `target_exposure_profile` artifact exists, Phase C forensic derivation and Phase D validation may run. After Phase D passes, return exactly this top-level JSON shape and stop:

```json
{
  "target_exposure_profile_forensics": {
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

`target_exposure_profile_forensics` must preserve full 98-row accountability, 22-row LEP selector coverage, legal/governance lossless source extraction coverage where used, route planning, trigger/evaluation decisions, evidence binding, self-checks, lock-gates, and emission reconciliation.

Do not re-emit `target_exposure_profile`, upstream artifacts, `operator_challenge_gate`, `final_output_handoff`, renderer payload, report prose, or compatibility wrappers in the Phase D forensic output.

M12/M13 may begin only after both saved artifacts exist:

- `target_exposure_profile` saved from Phase B1; and
- `target_exposure_profile_forensics` saved from Phase D.

## M11.S20C — Combined Output Prohibition

The following production backend output shape is forbidden:

```json
{
  "target_exposure_profile": {},
  "target_exposure_profile_forensics": {}
}
```

That shape incorrectly mixes the Phase B1 material artifact and the Phase D forensic artifact into one response. It may be shown only as documentation that M11 ultimately owns two artifacts, not as an executable backend response.

## M11.S20D — Manual Terminal Boundary

Same-chat next-step receipts belong only to the terminal/receipt layer after backend validation and lock. M11 backend artifact output must not include same-chat commands, checkpoint prose, markdown receipts, report text, or handoff instructions.
