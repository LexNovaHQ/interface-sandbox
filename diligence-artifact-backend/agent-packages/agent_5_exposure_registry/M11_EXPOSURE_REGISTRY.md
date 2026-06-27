# MODULE XI — REGISTRY HANDSHAKE AND EXPOSURE PROFILE
## New Reality Lock — Batched M11 + Deterministic System + Split Material Output

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
  M11 is the only exposure-registry evaluation module.
  M11 evaluates AI Threat Registry rows only through phased batch execution.
  M11 must never require one model call to evaluate all 98 registry rows.
  M11 model calls evaluate only the active batch instance supplied by the backend.
  M11 material output is split into two deterministic reader-facing artifacts: `exposure_registry_controlled_profile` and `exposure_registry_triggered_profile`.
  M11 preserves all 98 row outcomes, all 22 LEP selector outcomes, route planning, batch planning, M12 batch validation custody, evidence binding, limitations, repairs, and projection reconciliation in saved workpad/forensic artifacts.
  M11 does not issue legal advice, legal applicability conclusions, compliance conclusions, liability findings, breach findings, enforceability opinions, risk scores, final report output, compiler output, or renderer output.

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
  - saved Agent 1 source/legal artifacts
  - saved Agent 2B M9 legal cartography artifact
  - saved Agent 3 M7/M8 material and forensic artifacts
  - saved Agent 4 M10 material and forensic artifacts

execution_rule:
  Execute M11 only.
  Read only saved backend artifacts and registry references authorized for Agent 5.
  Load and account for all 98 active AI Threat Registry rows.
  Apply all 22 LEP selector rows.
  Use `AI_THREAT_REGISTRY.yaml` row metadata plus the row's exact `Hunter_Trigger` as mandatory row-level derivation authority.
  Use `03_REGISTRY_EVALUATION_RULES.yaml` as mandatory evaluation discipline for `Hunter_Trigger`.
  No M11 batch may derive trigger status, control/exclude status, or final material status from intuition, summary, archetype name, surface label, category label, route reason, or prior model memory.
  M9 / Agent 2B is the sole builder and owner of `legal_cartography_index`. M11 consumes the saved M9 artifact as legal/governance navigation authority. M11 must not build, rebuild, reinterpret as a new artifact, replace, mutate, or save any legal-cartography object.
  Legal/governance evidence must be selected through the saved M9 `legal_cartography_index` before L1-L6 lossless text is used, except where a locked upstream artifact already carries the row-specific proof.
  `legal_cartography_index` is navigation/custody/index authority. It is not trigger/control proof by itself unless the row is only about document presence, absence, custody, or limitation.
  Do not blindly scan all six legal/governance lossless buckets.
  Do not treat M9 document titles, route labels, policy headings, section names, or summaries as proof without admitted lossless text or locked upstream proof.
  Deterministically create `exposure_registry_route_plan` before any registry-row evaluation.
  Route UNI rows first.
  Batch evaluation-routed rows by UNI/archetype/surface grouping with a maximum of 8 rows per model batch.
  Current registry count requires 37 UNI rows to split into five UNI batches at max 8 rows per batch. Future registry amendments must calculate batch count dynamically.
  Each model batch must evaluate only its assigned `expected_threat_ids[]`.
  Each accepted batch must be challenged by M12 batch validation before it becomes a persisted accepted batch artifact.
  Build `exposure_registry_workpad_98` deterministically from `exposure_registry_route_plan`, accepted M11 batch artifacts, paired M12 batch validation artifacts, and deterministic inactive non-UNI not-applicable rows.
  Build `exposure_registry_controlled_profile` deterministically from `exposure_registry_workpad_98` using only final CONTROLLED rows.
  Build `exposure_registry_triggered_profile` deterministically from `exposure_registry_workpad_98` using only final TRIGGERED rows.
  Build `exposure_registry_profile_forensics` only after route plan, accepted batches, batch validations, canonical workpad, controlled profile, and triggered profile are complete, validated, and saved.
  Do not emit `operator_challenge_gate`, `challenge_gate`, `final_output_handoff`, report prose, HTML, markdown, renderer output, terminal receipt text, or compatibility wrappers from M11.

internal_stage_order:
  - PHASE A / M11-A: Deterministic registry/reference load, custody/access gate, M9 legal-cartography consumption, route plan, and batch plan.
  - PHASE B / M11-B: Agentic M11 active-batch registry row evaluation only.
  - PHASE B2 / M12-BATCH: Agentic M12 active-batch validation and backend batch acceptance gate.
  - PHASE C / M11-C: Deterministic canonical 98-row workpad merge.
  - PHASE D / M11-D: Deterministic controlled material projection.
  - PHASE E / M11-E: Deterministic triggered material projection.
  - PHASE F / M11-F: Deterministic exposure profile forensics assembly.
  - POST-M11: M12 global challenge outside M11.

phase_terminal_sequence:
  Backend execution returns strict JSON only at the active boundary.
  M11 route-plan boundary saves exactly `exposure_registry_route_plan`.
  M11 batch boundary returns exactly `m11_batch_registry_ledger` for the active batch only.
  M12 batch validation boundary saves exactly `exposure_registry_batch_validation__{GROUP}__{NNN}`.
  Backend accepted-batch boundary saves exactly `exposure_registry_batch__{GROUP}__{NNN}` only after paired M12 validation allows acceptance.
  M11 canonical merge boundary saves exactly `exposure_registry_workpad_98`.
  M11 controlled material boundary saves exactly `exposure_registry_controlled_profile`.
  M11 triggered material boundary saves exactly `exposure_registry_triggered_profile`.
  M11 forensic boundary saves exactly `exposure_registry_profile_forensics`.
  A response containing more than the active boundary object is invalid unless explicitly marked non-production debug mode.

allowed_gate_outcomes:
  - PASS
  - PASS_WITH_WARNING
  - PASS_WITH_LIMITATION
  - REINVESTIGATION_COMPLETED_WITH_LIMITATION
  - SOURCE_REPAIR_REQUIRED
  - CONTROLLED_FAILURE

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

stop_condition:
  Stop local M11 execution only; return control to backend runner.
  Backend may advance to M12 global challenge only after `exposure_registry_workpad_98`, `exposure_registry_controlled_profile`, `exposure_registry_triggered_profile`, and `exposure_registry_profile_forensics` are saved and M11 returns PASS, PASS_WITH_WARNING, PASS_WITH_LIMITATION, or REINVESTIGATION_COMPLETED_WITH_LIMITATION.
  If M11 returns SOURCE_REPAIR_REQUIRED or CONTROLLED_FAILURE, do not advance.
</phase_call_card>

`M11.S0.C1` This module is standalone Agent 5 / M11. It is not M6, M7, M8, M9, M10, M12, M13, compiler, renderer, or report output.

`M11.S0.C2` Production M11 is batched. A one-shot 98-row model call is invalid.

`M11.S0.C3` Production M11 has split material artifacts. A combined `exposure_registry_profile` material root is retired and forbidden.

`M11.S0.C4` M11 model output is not final material output. The M11 model emits batch ledger slices only. Final workpad, controlled profile, triggered profile, and forensics are deterministic projections from saved artifacts.

---

# M11.S0B — Execution Ownership Contract

| Work item | Owner | M11 model allowed? | Deterministic backend allowed? | Rule |
|---|---|---:|---:|---|
| Registry/reference load | Backend deterministic | No | Yes | Load exact reference files before route planning. |
| YAML schema validation | Backend deterministic | No | Yes | Confirm 98 active rows and required fields. |
| `FIELD21/22/23` reconciliation | Backend deterministic | No | Yes | Validate decomposed `Threat_ID` segments. |
| Upstream artifact custody check | Backend deterministic | No | Yes | Confirm saved upstream material + forensic artifacts. |
| M9 legal cartography consumption | Backend deterministic | No | Yes | Select relevant locators/excerpts from saved `legal_cartography_index`; do not build a new cartography artifact. |
| Active archetype/surface extraction | Backend deterministic | No | Yes | Extract only from M8 patched paths. |
| Route plan creation | Backend deterministic | No | Yes | Writes `exposure_registry_route_plan`. |
| Batch plan creation | Backend deterministic | No | Yes | Max 8 rows per batch. |
| Batch packet formation | Backend deterministic | No | Yes | Supplies one active batch packet. |
| Batch row evaluation | M11 model | Yes, active batch only | No, except deterministic inactive non-UNI not-applicable rows | Emits `m11_batch_registry_ledger`. |
| Batch mechanical validation | Backend deterministic validator | No | Yes | Checks root, IDs, shape, derivation representation, forbidden output. |
| Batch challenge | M12 model in batch mode | No for M11 | No substantive row decision | Writes batch validation artifact. |
| Accepted batch save | Backend deterministic | No | Yes | Saves accepted batch only after paired M12 validation. |
| Batch cursor advance | Backend deterministic | No | Yes | Run metadata only. |
| Canonical 98-row merge | Backend deterministic | No | Yes | Writes `exposure_registry_workpad_98`. |
| Controlled projection | Backend deterministic | No | Yes | Writes `exposure_registry_controlled_profile`. |
| Triggered projection | Backend deterministic | No | Yes | Writes `exposure_registry_triggered_profile`. |
| Forensic assembly | Backend deterministic | No under this contract | Yes | Writes `exposure_registry_profile_forensics`. |
| Global challenge | M12 model in global mode | No for M11 | No substantive challenge decision | Writes `challenge_gate`. |

`M11.S0B.C1` M11 model ownership is limited to `M11_BATCH_EVALUATE::{GROUP}::{NNN}`.

`M11.S0B.C2` The M11 model must not route, batch, save, validate as M12, accept a batch, merge 98 rows, project controlled rows, project triggered rows, assemble forensics, or claim backend state.

`M11.S0B.C3` Backend deterministic logic may route, batch, validate structure, save, merge, and project. It may not substitute for row-level `Hunter_Trigger` evaluation on model-routed rows.

`M11.S0B.C4` Deterministic inactive non-UNI rows may be placed into the 98-row workpad as `NOT_APPLICABLE_CONTEXTUAL` / audit-only only when the route plan shows no UNI, archetype, or surface route.

`M11.S0B.C5` M12 batch validation is outside M11. M11 must not emit or simulate M12 validation.

---

# M11.S0C — Phase Interconnect and Access Contract

`M11.S0C.C1` Each phase must be independently executable from its declared inputs and must output only its declared boundary artifact.

`M11.S0C.C2` Each phase interconnects only through saved artifacts, backend phase packets, or explicit validation outcomes. Hidden model memory and same-chat continuity are forbidden as state.

## Required upstream read access

| Required read artifact/reference | Required by | Use |
|---|---|---|
| `source_discovery_handoff` | A/B/B2/F | admitted evidence authority, source custody, source-text location, access/absence limits |
| `legal_cartography_index` | A/B/B2/F | saved M9 navigation authority for legal/governance documents, controls, missing/limited items, and source locators |
| `target_profile` | A/B/B2/F | target identity/context |
| `target_profile_forensics` | A/B/B2/F | target derivation proof and limitations |
| `target_feature_profile` | A/B/B2/F | activities, archetypes, surfaces, feature refs |
| `target_feature_profile_forensics` | A/B/B2/F | activity/archetype/surface proof and limits |
| `data_provenance_profile` | A/B/B2/F | data/control/provenance substrate |
| `data_provenance_profile_forensics` | A/B/B2/F | data/control proof, Anti-Unknown outcomes, missing-proof linkage |
| `lossless_family__L1_CORE_TERMS_PRIVACY` | A/B/B2/F | terms/privacy/EULA/control evidence selected through M9 navigation |
| `lossless_family__L2_B2B_CONTRACTING` | A/B/B2/F | DPA/AUP/SLA/customer agreement/control evidence selected through M9 navigation |
| `lossless_family__L3_AI_USAGE_GOVERNANCE` | A/B/B2/F | AI governance/safety/usage-policy evidence selected through M9 navigation |
| `lossless_family__L4_PRIVACY_ADJACENT_NOTICES` | A/B/B2/F | privacy-adjacent controls and limitations selected through M9 navigation |
| `lossless_family__L5_LEGAL_HUB_HOSTED` | A/B/B2/F | legal/trust hub source custody and controls selected through M9 navigation |
| `lossless_family__L6_ENTITY_NOTICE` | A/B/B2/F | legal notice/entity/contact/controller support selected through M9 navigation |
| `AI_THREAT_REGISTRY.yaml` | A/B/C/F | registry row source of truth |
| `REGISTRY_KEY_v3_0.md` | A/B/C/F | ID vocabulary and row semantics |
| `03_REGISTRY_EVALUATION_RULES.yaml` | A/B/B2/F | trigger/exclude/control evaluation discipline |
| `FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml` | A/F | 22 LEP selector authority |
| `FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml` | F | forensic structure and audit-preservation authority |

## Required own-output read dependencies

| Phase | Must read saved M11/M12 artifacts |
|---|---|
| Phase B active batch | `exposure_registry_route_plan` and backend-provided active batch packet |
| Phase B2 M12 batch validation | `exposure_registry_route_plan` and active `m11_batch_registry_ledger` |
| Phase C canonical merge | `exposure_registry_route_plan`, all accepted `exposure_registry_batch__{GROUP}__{NNN}`, all `exposure_registry_batch_validation__{GROUP}__{NNN}` |
| Phase D controlled projection | `exposure_registry_workpad_98` |
| Phase E triggered projection | `exposure_registry_workpad_98`, saved `exposure_registry_controlled_profile` for sequencing |
| Phase F forensics | route plan, all accepted batches, all batch validations, workpad, controlled profile, triggered profile |

## Required write boundaries

| Boundary | Owner | Required artifact |
|---|---|---|
| Route plan save | Backend deterministic | `exposure_registry_route_plan` |
| Batch evaluation | M11 model output, not accepted save | `m11_batch_registry_ledger` |
| Batch validation | M12 batch mode | `exposure_registry_batch_validation__{GROUP}__{NNN}` |
| Accepted batch save | Backend deterministic | `exposure_registry_batch__{GROUP}__{NNN}` |
| Canonical merge | Backend deterministic | `exposure_registry_workpad_98` |
| Controlled projection | Backend deterministic | `exposure_registry_controlled_profile` |
| Triggered projection | Backend deterministic | `exposure_registry_triggered_profile` |
| Forensics | Backend deterministic | `exposure_registry_profile_forensics` |
| Global challenge | M12 global, post-M11 | `challenge_gate` |

`M11.S0C.C3` If any required upstream profile, upstream forensic profile, own-output dependency, M9 locator/excerpt, or legal/governance lossless bucket is unavailable to the relevant phase, that phase must not infer missing content from summaries, route labels, document titles, or memory.

`M11.S0C.C4` Missing access must produce the smallest truthful state: controlled limitation, source repair route, or controlled failure. It must not produce silent downgrading, row suppression, or synthetic proof.

---

# M11.S1 — M9 Legal Cartography Consumption Rule

`M11.S1.C1` M9 / Agent 2B already builds `legal_cartography_index`. M11 must consume it. M11 must not build a new legal cartography map, new legal index, or new legal navigation artifact.

`M11.S1.C2` The canonical M9 artifact families are:

```text
document_coverage_index
document_structure_index
incorporated_linked_document_map
control_language_locator
missing_limited_legal_governance_items
downstream_rules
lock_status
```

`M11.S1.C3` Backend deterministic packet formation may select row-scoped excerpts or locators from those existing M9 arrays. Those selected excerpts are packet context only, not a new artifact.

`M11.S1.C4` `control_language_locator` is the first place to look for public control wording. `document_coverage_index`, `document_structure_index`, and `incorporated_linked_document_map` locate documents/units/references. `missing_limited_legal_governance_items` carries absence, limitation, gated, thin, unavailable, or not-fetched states.

`M11.S1.C5` M11 may rely on M9 for navigation, source family, document class, source status, missing/limited status, and locator path. M11 may not rely on M9 alone as proof of a registry condition unless the relevant row is only about document presence/absence/navigation/limitation.

`M11.S1.C6` For trigger/control proof, M11 must bind to admitted lossless text, locked upstream proof, or formal absence/access limitation. A document title, policy heading, source label, route label, or M9 summary is not proof by itself.

`M11.S1.C7` If M9 identifies a legal/governance source but the corresponding lossless text is unavailable, gated, metadata-only, corrupt, or referenced-but-not-fetched, M11 must ledger a row-specific limitation and must not invent the missing text.

`M11.S1.C8` If M9 is missing or unusable, M11 must not broad-scan all L1-L6 buckets to compensate. It must return controlled limitation, source repair, or controlled failure depending on affected row coverage.

---

# M11.S2 — AI Threat Registry YAML Field Canon

`M11.S2.C1` M11 must treat repository `AI_THREAT_REGISTRY.yaml` row keys as the strict registry schema:

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

`M11.S2.C2` `Threat_ID` is the canonical row identifier. `Threat_Name` is the canonical row name. `Archetype` and `Surface` are routing/context fields. `Hunter_Trigger` is the canonical row-level derivation logic field.

`M11.S2.C3` `FIELD21`, `FIELD22`, and `FIELD23` are decomposed `Threat_ID` parts: `FIELD21` = archetype/scope segment, `FIELD22` = harm/subcat segment, and `FIELD23` = variant/counter/provenance suffix. They support identity validation, batching, grouping, and forensic reconciliation only. They do not replace `Hunter_Trigger`.

`M11.S2.C4` `CONDITION_N`, `TRIGGER_IF`, and `EXCLUDE_IF` are not separate YAML columns. They are mandatory logical components inside `Hunter_Trigger`.

`M11.S2.C5` There is no source column named `Subcat`, `Registry_Signal`, `Threat_Signal`, `Condition`, `Trigger_IF`, or `Exclude_IF`. If harm/subcat grouping is required, use `FIELD22` or the middle segment of `Threat_ID`.

`M11.S2.C6` Numeric `FIELD23` values normalize the third `Threat_ID` segment by removing leading zeroes. Special variants such as `IN1` and `LB1` remain unchanged.

`M11.S2.C7` `Hunter_Trigger` plus `03_REGISTRY_EVALUATION_RULES.yaml` are the only source of truth for row-level trigger/exclude/control derivation.

---

# M11.S3 — Material Field Matrix

M11 has two material artifacts but one locked row schema.

| Artifact | Container | Included rows | Row schema |
|---|---|---|---|
| `exposure_registry_controlled_profile` | `controlled_rows[]` | final CONTROLLED rows only | seven locked fields |
| `exposure_registry_triggered_profile` | `triggered_rows[]` | final TRIGGERED rows only | seven locked fields |

| # | Material field | Source / derivation authority | Validation rule |
|---:|---|---|---|
| 1 | `registry_exposure` | Copy/project from `Threat_ID`, `Threat_Name`, `Lane`, `Archetype`, `Surface`, `Authority_IN`, `Authority_EU`, `Authority_US`, `Status`, `Effective_Date`, `FIELD21`, `FIELD22`, `FIELD23`. | Preserve exact row identity and registry-native context. No mutation. |
| 2 | `target_match` | `Archetype`, `Surface`, `FP_Mechanism`, `FIELD21`, `FIELD22`, plus locked M8/M10/M9 context. | Explains why the row is relevant. Cannot by itself decide TRIGGERED or CONTROLLED. |
| 3 | `evaluation_status` | Derived only by applying row-specific `Hunter_Trigger` and `03_REGISTRY_EVALUATION_RULES.yaml` to admitted evidence. | In controlled artifact: CONTROLLED only. In triggered artifact: TRIGGERED only. |
| 4 | `basis_proof` | Applied `CONDITION_N`, `TRIGGER_IF`, `EXCLUDE_IF`, admitted evidence/control refs, M9-selected legal/governance proof paths where relevant. | Must show evidence, control, exclusion, or limitation basis. No route-label-only proof. |
| 5 | `impact_priority` | `Velocity`, `Pain_Tier`, `Pain_Category`, `Pain_Depth`, `Legal_Pain`, `FP_Impact`. | Business review priority only. No legal-risk verdict. |
| 6 | `review_route` | `Lex_Nova_Fix` plus row-specific missing-proof/control context. | Registry-derived route only. Do not invent new remediation category. |
| 7 | `row_limitations` | `Hunter_Trigger`, especially `EXCLUDE_IF`, evidence gaps, source limitations, access failures, upstream limitations, M12 batch validation limits. | Must be row-specific. No generic limitation padding. |

`M11.S3.C1` Every material row must contain exactly these seven fields. No extra fields.

`M11.S3.C2` `CONTROLLED` means visible public control exists for the row. It does not mean compliant, sufficient, enforceable, legally adequate, solved, risk-free, or counsel-approved.

`M11.S3.C3` `TRIGGERED` means the registry signal remains triggered after applying row-specific conditions and available controls/limitations. It does not mean illegality, breach, liability, or non-compliance.

---

# M11.S4 — Status Vocabulary

## Route values

| Route value | Meaning |
|---|---|
| `EVALUATION_ROUTED` | Row must be evaluated. |
| `NOT_TRIGGERED_NOT_APPLICABLE` | Non-UNI row has no active archetype/surface route and is audit-only. |

## Route reasons

| Route reason | Meaning |
|---|---|
| `UNI_ALWAYS_RUN` | Universal row; always evaluation-routed. |
| `ARCHETYPE_TRIGGERED` | Row archetype intersects active M8 archetypes. |
| `SURFACE_TRIGGERED` | Row surface tags intersect active M8 `surface_context_tokens[]`. |
| `INT_NOT_TRIGGERED_NOT_APPLICABLE` | Non-UNI row lacks route basis; still preserved in workpad. |

## Internal trigger statuses

```text
UNI_ALWAYS_RUN
REGISTRY_SIGNAL_TRIGGERED
REGISTRY_SIGNAL_NOT_TRIGGERED
CONDITIONAL_TRIGGERED
CONDITIONAL_NOT_TRIGGERED
TRIGGER_INSUFFICIENT_EVIDENCE
TRIGGER_CONFLICTING_SIGNALS
TRIGGER_REQUIRES_REVIEW
ACCESS_FAILED_TRIGGER_CHECK
```

## Internal evaluation statuses

```text
SUPPORTED_EXPOSURE_SIGNAL
SUPPORTED_CONTROL_PRESENT
PARTIAL_OR_WEAK_SIGNAL
CONFLICTING_SIGNALS
INSUFFICIENT_EVIDENCE
NOT_VISIBLE_AFTER_TARGETED_SEARCH
ACCESS_FAILED
NOT_TRIGGERED
NOT_APPLICABLE_CONTEXTUAL
REQUIRES_QUALIFIED_REVIEW
CONTROLLED_FAILURE
```

## Final material statuses

```text
TRIGGERED
CONTROLLED
```

`M11.S4.C1` Internal trigger/evaluation statuses are workpad/forensic statuses. Material artifacts may expose only final `TRIGGERED` or final `CONTROLLED` in `evaluation_status`.

`M11.S4.C2` Forbidden verdict words include `COMPLIANT`, `NON_COMPLIANT`, `LEGAL`, `ILLEGAL`, `LIABLE`, `NOT_LIABLE`, `VIOLATION`, `NO_VIOLATION`, `BREACH`, `ENFORCEABLE`, `UNENFORCEABLE`, `RISK_SCORE`, `HIGH_RISK`, and `LOW_RISK`.

---

# M11.S5 — PHASE A: Deterministic Registry Load, M9 Consumption, Route Plan, and Batch Plan

## Owner

Backend deterministic system.

## Inputs

```text
source_discovery_handoff
legal_cartography_index
target_profile
target_profile_forensics
target_feature_profile
target_feature_profile_forensics
data_provenance_profile
data_provenance_profile_forensics
lossless_family__L1_CORE_TERMS_PRIVACY
lossless_family__L2_B2B_CONTRACTING
lossless_family__L3_AI_USAGE_GOVERNANCE
lossless_family__L4_PRIVACY_ADJACENT_NOTICES
lossless_family__L5_LEGAL_HUB_HOSTED
lossless_family__L6_ENTITY_NOTICE
AI_THREAT_REGISTRY.yaml
REGISTRY_KEY_v3_0.md
03_REGISTRY_EVALUATION_RULES.yaml
FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml
FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml
```

## Execution steps

1. Confirm active agent and phase resolve to Agent 5 / M11.
2. Load registry references through the backend reference loader.
3. Confirm `AI_THREAT_REGISTRY.yaml` has exactly 98 active rows.
4. Confirm every row has required YAML fields, including `Threat_ID`, `Threat_Name`, `Archetype`, `Surface`, `Hunter_Trigger`, `Lex_Nova_Fix`, `FIELD21`, `FIELD22`, and `FIELD23`.
5. Validate `FIELD21/22/23` against `Threat_ID` decomposition.
6. Confirm all 22 selected LEP rows are loaded.
7. Confirm required upstream material and forensic profiles exist.
8. Confirm `legal_cartography_index` exists and is the saved M9 artifact.
9. Consume M9 `legal_cartography_index` to select legal/governance locators/excerpts for row or batch evidence packets where relevant.
10. Do not build or save any new legal-cartography artifact.
11. Extract active archetypes from `target_feature_profile.activities[].archetype_codes[]`.
12. Extract active surfaces from `target_feature_profile.activities[].surface_context_tokens[]`.
13. Reject stale M8 paths including `surface_tokens[]`, `activity_inventory`, `activity_mechanics`, and `registry_routing_substrate`.
14. Route every UNI row as `EVALUATION_ROUTED` with reason `UNI_ALWAYS_RUN`.
15. Route non-UNI rows where `Archetype` intersects active archetypes as `EVALUATION_ROUTED` with reason `ARCHETYPE_TRIGGERED`.
16. Route non-UNI rows where `Surface` intersects active surfaces as `EVALUATION_ROUTED` with reason `SURFACE_TRIGGERED`.
17. Route inactive non-UNI rows as `NOT_TRIGGERED_NOT_APPLICABLE` with reason `INT_NOT_TRIGGERED_NOT_APPLICABLE`.
18. Build batch plan for evaluation-routed rows: max 8 rows per batch, UNI first, one archetype per batch by default, two archetypes max only if small and adjacent.
19. Save `exposure_registry_route_plan`.
20. Stop Phase A.

## Output contract

```json
{
  "exposure_registry_route_plan": {
    "registry_inventory": {
      "expected_active_rows": 98,
      "loaded_active_rows": 98,
      "registry_schema_status": "PASS"
    },
    "upstream_access_manifest": {},
    "m9_legal_cartography_consumption": {
      "m9_artifact": "legal_cartography_index",
      "m9_is_builder": true,
      "m11_builds_legal_cartography": false,
      "selected_locator_policy": "consume_existing_m9_rows_only"
    },
    "active_routing_substrate": {
      "active_archetypes": [],
      "active_surfaces": []
    },
    "route_rows": [],
    "batch_plan": [],
    "deterministic_not_applicable_rows": [],
    "phase_a_validation": {}
  }
}
```

## Phase A forbidden actions

Phase A must not evaluate `Hunter_Trigger`, decide TRIGGERED/CONTROLLED truth for evaluation-routed rows, call the M11 model, call M12, scan L1-L6 blindly, mutate M9, build a new legal-cartography artifact, save batch artifacts, build material profiles, or build forensics.

---

# M11.S6 — PHASE B: Agentic Active-Batch Registry Evaluation

## Owner

M11 model only.

## Input packet

The M11 model receives one active batch packet only:

```text
batch_id
batch_group
expected_threat_ids[]
registry rows for active batch only
route reasons for active batch only
M9 legal_cartography_index locators/excerpts where legal/governance evidence is relevant
legal-cartography-selected legal/governance lossless evidence where relevant
locked upstream profile/forensic excerpts needed for the batch
exact `Hunter_Trigger` for each expected Threat_ID
parsed `CONDITION_N`, `TRIGGER_IF`, `EXCLUDE_IF` for each expected Threat_ID
applicable `03_REGISTRY_EVALUATION_RULES.yaml` rules
```

## Execution steps

1. Read only the active batch packet.
2. Confirm `batch_id`, `batch_group`, and `expected_threat_ids[]` are present.
3. Confirm the packet contains only assigned registry rows.
4. For each expected Threat_ID, read exact YAML metadata.
5. For each expected Threat_ID, read exact `Hunter_Trigger`.
6. Apply every `CONDITION_N`, `TRIGGER_IF`, and `EXCLUDE_IF` under `03_REGISTRY_EVALUATION_RULES.yaml`.
7. Use M9 `legal_cartography_index` locators/excerpts to identify legal/governance evidence paths before relying on L1-L6 lossless text.
8. Bind admitted evidence or formal limitation for each evaluated row.
9. Assign internal `trigger_status`.
10. Assign internal evaluation status.
11. Determine final material status candidate: TRIGGERED, CONTROLLED, or workpad-only.
12. Populate batch ledger rows with `Threat_ID`, `trigger_status`, and the locked seven material fields.
13. Return only `m11_batch_registry_ledger`.
14. Stop.

## Output contract

```json
{
  "m11_batch_registry_ledger": {
    "batch_id": "",
    "batch_group": "",
    "expected_threat_ids": [],
    "returned_threat_ids": [],
    "m9_legal_cartography_consumed": true,
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

## Phase B forbidden actions

The M11 model must not load the full registry independently, change the route plan, change batch membership, evaluate rows outside `expected_threat_ids[]`, run all 98 rows, create deterministic inactive not-applicable rows outside the active batch, save artifacts, claim an artifact is saved, broad-scan all L1-L6 buckets, treat M9 route labels/document titles/headings as proof without admitted lossless text, mechanically validate as backend, perform M12 batch validation, build workpad, build controlled profile, build triggered profile, build forensics, emit challenge gate, emit compiler/renderer/report output, or mutate upstream artifacts.

---

# M11.S7 — PHASE B Mechanical Validation and M12 Batch Validation Dependency

## Backend mechanical validation gates

Before M12 batch validation, backend must confirm:

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
| `Hunter_Trigger` represented for each expected row | true |
| registry evaluation rules represented | true |
| M9 legal-cartography consumption where legal evidence used | true |
| legal verdict language | none |
| upstream mutation | none |
| source expansion | none |

`M11.S7.C1` If mechanical validation fails, repair only the affected batch.

`M11.S7.C2` No failed or unvalidated batch may enter `exposure_registry_workpad_98`.

## M12 batch validation contract

M12 batch validation receives one active M11 batch ledger plus route plan, upstream profile/forensic excerpts, M9 legal-cartography locators/excerpts where relevant, legal-cartography-selected legal/governance evidence where relevant, exact registry rows, parsed `Hunter_Trigger`, and evaluation rules.

M12 batch validation must check:

1. exact Threat_ID coverage;
2. no unexpected, duplicate, grouped, or composite rows;
3. row-specific `Hunter_Trigger` use;
4. registry evaluation rule use;
5. evidence binding;
6. limitation handling;
7. M9 legal-cartography consumption discipline;
8. legal-firewall compliance;
9. no source expansion;
10. no upstream mutation.

M12 batch validation writes exactly:

```text
exposure_registry_batch_validation__{GROUP}__{NNN}
```

Backend saves the accepted M11 batch artifact exactly:

```text
exposure_registry_batch__{GROUP}__{NNN}
```

only if M12 returns PASS, PASS_WITH_LIMITATION, or a controlled failure that is truthfully ledgered and does not corrupt registry-wide reconciliation.

---

# M11.S8 — PHASE C: Deterministic Canonical 98-Row Workpad Merge

## Owner

Backend deterministic system.

## Inputs

```text
exposure_registry_route_plan
all accepted exposure_registry_batch__{GROUP}__{NNN}
all paired exposure_registry_batch_validation__{GROUP}__{NNN}
registry references
LEP selector authority
deterministic inactive non-UNI route-plan rows
```

## Execution steps

1. Load route plan.
2. Load all accepted M11 batch artifacts.
3. Load all paired M12 batch validation artifacts.
4. Insert deterministic `NOT_APPLICABLE_CONTEXTUAL` rows for inactive non-UNI rows from route plan.
5. Preserve UNI rows as evaluation-routed only.
6. Validate exactly 98 active Threat_ID outcomes.
7. Validate no missing, duplicate, unexpected, grouped, or composite Threat_IDs.
8. Preserve registry order where possible.
9. Preserve batch and validation references.
10. Save `exposure_registry_workpad_98`.
11. Stop Phase C.

## Output contract

```json
{
  "exposure_registry_workpad_98": {
    "workpad_metadata": {},
    "registry_rows": [],
    "batch_index": [],
    "m12_batch_validation_index": [],
    "m9_legal_cartography_consumption_index": [],
    "merge_validation": {}
  }
}
```

Phase C must not call the M11 model, re-evaluate `Hunter_Trigger`, change final material status, add material fields, hide batch failure, emit material profiles, emit forensics, or emit M12 global challenge.

---

# M11.S9 — PHASE D: Deterministic Controlled Material Projection

## Owner

Backend deterministic system.

## Input

```text
exposure_registry_workpad_98
```

## Execution steps

1. Load `exposure_registry_workpad_98`.
2. Select rows whose final material status is CONTROLLED.
3. Project exactly the seven locked material fields.
4. Confirm every projected row has `evaluation_status: CONTROLLED`.
5. Confirm no TRIGGERED or workpad-only row appears.
6. Validate no duplicate Threat_IDs through traceability to workpad.
7. Save `exposure_registry_controlled_profile`.
8. Stop Phase D.

## Output contract

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

Phase D must not call the model, re-evaluate rows, alter row status, add fields, include TRIGGERED rows, include workpad-only rows, emit forensics, or emit M12 global challenge.

---

# M11.S10 — PHASE E: Deterministic Triggered Material Projection

## Owner

Backend deterministic system.

## Input

```text
exposure_registry_workpad_98
exposure_registry_controlled_profile for sequencing only
```

## Execution steps

1. Load `exposure_registry_workpad_98`.
2. Confirm `exposure_registry_controlled_profile` has saved.
3. Select rows whose final material status is TRIGGERED.
4. Project exactly the seven locked material fields.
5. Confirm every projected row has `evaluation_status: TRIGGERED`.
6. Confirm no CONTROLLED or workpad-only row appears.
7. Validate no duplicate Threat_IDs through traceability to workpad.
8. Save `exposure_registry_triggered_profile`.
9. Stop Phase E.

## Output contract

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

Phase E must not call the model, re-evaluate rows, alter row status, add fields, include CONTROLLED rows, include workpad-only rows, emit forensics, or emit M12 global challenge.

---

# M11.S11 — PHASE F: Deterministic Exposure Profile Forensics

## Owner

Backend deterministic system under this contract.

## Inputs

```text
exposure_registry_route_plan
all accepted exposure_registry_batch__{GROUP}__{NNN}
all exposure_registry_batch_validation__{GROUP}__{NNN}
exposure_registry_workpad_98
exposure_registry_controlled_profile
exposure_registry_triggered_profile
AI_THREAT_REGISTRY.yaml
REGISTRY_KEY_v3_0.md
03_REGISTRY_EVALUATION_RULES.yaml
FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml
FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml
```

## Required forensic families

| Family | Required content |
|---|---|
| `registry_input_manifest` | Required inputs loaded, missing, limited, or controlled-failed. |
| `full_registry_inventory_ledger` | All 98 active Threat_ID rows, registry order, row metadata integrity. |
| `lep_selector_application_ledger` | 22/22 LEP rows with outcome and forbidden-inference checks. |
| `internal_registry_route_plan_ledger` | UNI/archetype/surface route decisions and route integrity. |
| `trigger_review_workspace_ledger` | One workspace per evaluation-routed row. |
| `trigger_adjudication_ledger` | Trigger status, basis type, reason, confidence, path used. |
| `evidence_binding_ledger` | Source/profile/lossless/absence/access/conflict refs actually used. |
| `control_exclude_evaluation_ledger` | Evaluation status, visible-control basis, EXCLUDE_IF/control analysis, limits. |
| `registry_row_workpad_accountability_ledger` | One final workpad outcome per active Threat_ID. |
| `triggered_controlled_row_assembly_ledger` | Final material status reconciliation across split artifacts. |
| `emission_manifest` | Expected-vs-emitted controlled and triggered reconciliation. |
| `registry_self_check_result` | Self-check outcomes. |
| `registry_lock_gate_result` | Final lock gate outcomes. |
| `legal_firewall_ledger` | No legal/compliance/liability/verdict language leaked. |
| `runtime_trace_m11_only` | Agent/module-only trace, no private reasoning. |
| `forensic_boundary` | Confirms forensics are custody/proof only. |

## Execution steps

1. Load all required saved M11/M12 artifacts.
2. Confirm workpad has 98 rows.
3. Confirm LEP selector coverage has 22 rows.
4. Confirm every model-routed row has an accepted batch and paired M12 validation.
5. Confirm controlled profile reconciles to CONTROLLED rows in workpad.
6. Confirm triggered profile reconciles to TRIGGERED rows in workpad.
7. Preserve M9 legal-cartography consumption trace inside existing forensic families where legal/governance evidence was used.
8. Preserve evidence binding to admitted lossless text or locked upstream proof.
9. Preserve formal limitation where text was absent, gated, metadata-only, referenced-but-not-fetched, or not visible.
10. Validate legal firewall.
11. Save `exposure_registry_profile_forensics`.
12. Stop Phase F.

## Output contract

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

Phase F must not call the model, re-evaluate `Hunter_Trigger`, change row final material status, add material fields, hide missing batch validation, mutate upstream artifacts, emit material profiles again, emit `challenge_gate`, or emit compiler/renderer/report output.

---

# M11.S12 — Post-M11 M12 Global Challenge Boundary

`M11.S12.C1` M12 global challenge is outside M11 execution.

`M11.S12.C2` M11 may be considered ready for M12 global challenge only if backend confirms these saved artifacts exist:

```text
exposure_registry_workpad_98
exposure_registry_controlled_profile
exposure_registry_triggered_profile
exposure_registry_profile_forensics
```

`M11.S12.C3` M12 global challenge may inspect Agent 5 output integrity, under-trigger risk, controlled-row omission risk, unresolved batch failures, M9 legal-cartography consumption discipline, forensic sufficiency, and legal-firewall compliance.

`M11.S12.C4` M12 global challenge may not ask M11 to redo all 98 rows. Any repair must route to the smallest affected unit: a specific batch, M12 batch validation, canonical merge, controlled projection, triggered projection, or forensic assembly.

`M11.S12.C5` M11 must not emit `challenge_gate` or represent M12 global challenge status.

---

# M11.S13 — Repair Policy

`M11.S13.C1` Repair means the smallest affected M11 unit only. Do not rerun the full agent when a batch, projection, merge, or forensic defect can be isolated.

| Defect | Repair route |
|---|---|
| registry/reference missing | Phase A controlled failure or reference-loader/backend repair |
| M9 legal cartography missing/unusable | Phase A source repair or controlled failure depending materiality |
| legal lossless text missing for M9-selected route | row-specific limitation or source repair depending materiality |
| route plan wrong | repair Phase A only |
| one batch malformed | rerun same M11 batch only |
| M12 batch validation repair required | rerun same batch + same M12 validation only |
| accepted batch missing | backend save-gate repair only |
| workpad count wrong | repair Phase C only unless missing batch causes it |
| controlled projection wrong | repair Phase D only |
| triggered projection wrong | repair Phase E only |
| forensic reconciliation wrong | repair Phase F only |
| upstream profile missing/malformed | route to owning upstream agent; do not mutate inside M11 |

`M11.S13.C2` Do not solve missing emitted rows by downgrading, suppressing, grouping, summarizing, or moving them into a count/category branch.

`M11.S13.C3` If a row remains weak, access-limited, conflicting, or partially supported after targeted review, preserve the correct status where registry logic requires TRIGGERED or CONTROLLED, add row-specific `row_limitations`, and ledger the limitation.

---

# M11.S14 — Final Local Lock Gate

Before M11 can be treated as locally locked, verify:

- active runtime binding resolves to Agent 5 / M11 only;
- all required upstream material and forensic artifacts exist or have controlled limitations/failures;
- M9 `legal_cartography_index` exists and was consumed as navigation authority, not rebuilt by M11;
- all six legal/governance buckets are available where required or limitations are ledgered;
- registry references are loaded through backend reference loader;
- expected active registry row count is 98 and loaded active row count is 98;
- all 22 LEP selector rows are loaded and accounted for;
- every `FIELD21/22/23` value reconciles to `Threat_ID` decomposition or is ledgered as a controlled registry metadata defect;
- route plan accounts for all 98 rows;
- every UNI row is evaluation-routed;
- no UNI row is not-applicable;
- all evaluation-routed rows are assigned to batches of max 8 rows;
- every model-routed row has accepted M11 batch artifact and paired M12 batch validation;
- `exposure_registry_workpad_98` contains exactly 98 active Threat_ID rows;
- no grouped rows, composite Threat_ID rows, category rows, material-public-route rows, or compact route summaries appear;
- every final CONTROLLED row appears in `exposure_registry_controlled_profile.controlled_rows[]`;
- every final TRIGGERED row appears in `exposure_registry_triggered_profile.triggered_rows[]`;
- every material row uses exactly the locked seven fields;
- controlled profile contains no key except `controlled_rows`;
- triggered profile contains no key except `triggered_rows`;
- forensics are separate and emitted only after route plan, batches, validations, workpad, and split material artifacts are saved;
- no legal advice, compliance conclusion, legality conclusion, legal applicability conclusion, liability finding, breach finding, enforceability verdict, risk score, or high/low legal-risk verdict appears;
- no M12 global challenge, M13, compiler, renderer, or final canonical object is emitted by M11.

Return control to backend after the active boundary. Do not emit terminal prose in backend mode.
