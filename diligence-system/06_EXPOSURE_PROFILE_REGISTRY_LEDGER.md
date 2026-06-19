# 06_target_exposure_profile_REGISTRY_LEDGER.md

## PHASE 06 — EXPOSURE PROFILE / REGISTRY LEDGER

**Document status:** LOCKED BUILD  
**Phase ID:** `P6_target_exposure_profile_REGISTRY_LEDGER`  
**System:** The Interface — public-footprint diligence engine  
**Output handoff:** `target_exposure_profile`  
**Primary function:** Registry-led exposure ledger generation  
**Legal posture:** Public-footprint analysis only. No legal advice. No compliance verdict. No liability conclusion.

---

# 01. PHASE CALL CARD

Phase 06 evaluates the locked AI Threat Registry against the target's admitted evidence package and upstream profiles.

This phase produces a full 98-row registry ledger and a structured exposure profile for downstream final report assembly.

Phase 06 is the only phase authorized to evaluate registry rows.

Phase 06 is **model-led** for all substantive registry intelligence.

Deterministic systems are support rails only. They may build maps, packets, refs, source-route hints, row inventory, schema checks, row completeness checks, and legal-firewall checks. They may not become the evaluator, controller, suppressor, or silent override layer for substantive model judgment.

---

# 02. GOVERNING RUNTIME REFERENCES

Phase 06 must operate under the following governing references:

```text
00_RUNTIME_SPINE.md
REGISTRY_KEY_v3_0.md
AI_THREAT_REGISTRY
AI_THREAT_REGISTRY_HUNTER_ENGINE_RULES.csv
Phase 02 target_profile
Phase 03 target_feature_profile
Phase 04 legal_cartography_index
Phase 05 target_data_provenance_profile
Full admitted legal/governance lossless evidence package
Prior phase forensic ledgers / evidence refs
```

Runtime hierarchy:

```text
1. 00_RUNTIME_SPINE.md controls identity, evidence firewall, legal/advice boundary, and final-output discipline.
2. REGISTRY_KEY_v3_0.md controls registry vocabulary, archetypes, surfaces, subcategories, threat ID format, and row interpretation rules.
3. AI_THREAT_REGISTRY controls the locked registry row inventory. 
4. AI_THREAT_REGISTRY_HUNTER_ENGINE_RULES.csv controls Hunter runtime trigger discipline, EXCLUDE_IF handling, risk-surface insufficiency, and controlled evidence output behavior. 
5. Upstream phase profiles provide target, feature, legal cartography, and data-provenance context.
6. Full admitted legal/governance lossless evidence is the primary reasoning substrate for row trigger/evaluation.
```

---


# 02A. HUNTER ENGINE RULES

Phase 06 must apply the locked Hunter Engine Rules when evaluating model-routed registry rows.

These rules control trigger discipline. They do not authorize legal advice, compliance verdicts, liability findings, or enforceability conclusions.

## HER_001 — Universal EXCLUDE_IF First-Party Control Rule

For every Hunter-trigger row, Hunter must treat `EXCLUDE_IF` as a hard non-trigger rule only where first-party evidence shows legal, operational, product, UI, workflow, policy, or documentation controls sufficient to defeat the specific triggering conditions.

Neutralizing evidence may be a clause, product control, UI flow, policy, trust-center artifact, DPA, ToS, AUP, privacy/security document, internal policy surfaced by the prospect, or a combination of these.

Where the threat depends on legal allocation, a technical control alone is insufficient.

Where the threat depends on product flow, consent, notice, or user assent, a clause alone is insufficient.

Hunter must assess whether the evidence actually kills the row-specific conditions, not merely whether a generic control exists.

## HER_001B — Risk Surface Is Insufficient Rule

A risk surface alone is insufficient.

Hunter must trigger only when the risk surface exists and the first-party public, legal, product, or governance evidence does not kill the relevant row-specific conditions.

Row-specific `EXCLUDE_IF` language supplies examples, not the full universe of acceptable neutralizing evidence.

## HER_002 — Controlled Evidence Output Rule

Hunter must evaluate `CONDITION_N` and `TRIGGER_IF` first, then apply `EXCLUDE_IF`.

If `EXCLUDE_IF` evidence is present in first-party materials, the output should mark the row as `NOT_TRIGGERED` or `SUPPORTED_CONTROL_PRESENT`, not as a supported exposure signal.

## Hunter Rule Priority

```text
1. CONDITION_N / TRIGGER_IF fit must be assessed first.
2. EXCLUDE_IF / first-party neutralizing evidence must then be assessed.
3. A risk surface without row-specific unneutralized evidence is insufficient.
4. Product controls, UI controls, workflow controls, policy controls, legal clauses, trust/security artifacts, and surfaced internal policies may all neutralize a row where they actually defeat the row-specific condition.
5. Phase 06 must not treat generic risk-surface presence as enough to support an exposure row.

---

# 03. INPUT CONTRACT

## 03.1 Required Inputs

Phase 06 requires:

```json
{
  "runtime_spine": {},
  "registry_key": {},
  "ai_threat_registry": [],
  "hunter_engine_rules": [],
  "target_profile": {},
  "target_feature_profile": {},
  "legal_cartography_index": {},
  "target_data_provenance_profile": {},
  "legal_governance_lossless_evidence_package": [],
  "prior_phase_forensic_ledgers": {}
}
```

## 03.2 Primary Evidence Rule

For Phase 06:

```text
Primary evidence = full admitted legal/governance source text relevant to the row route.
```

Examples:

```text
Terms of Service
Privacy Policy
DPA
AUP
AI Terms
Agentic Addendum
Security / Trust page
Subprocessor page
Cookie Policy
Data deletion / rights request page
Legal center documents
Hosted legal/governance documents admitted by Phase 01 / Phase 04
```

## 03.3 Lossless Evidence Requirement

The model must receive row-relevant full admitted legal/governance lossless evidence, not only refs or summaries.

```text
Refs are trace anchors.
Lossless primary evidence is the reasoning substrate.
```

## 03.4 No Rediscovery Rule

Phase 06 may receive and use admitted upstream evidence. It may not independently search, fetch, crawl, or admit new evidence.

If primary evidence is missing, inaccessible, not routed, or incomplete, Phase 06 must use the correct insufficient/access/not-visible/review status rather than inventing.

---

# 04. OUTPUT CONTRACT

Phase 06 must emit exactly the following top-level object:

```json
{
  "exposure_profile_forensic_ledger": {},
  "registry_evaluation_trace": {},
  "target_exposure_profile": {}
}
```

No markdown report. No prose report. No email. No advice memo. No legal conclusion.

---

# 05. HARD RULES

## HR6.001 — Registry-Led Phase

Phase 06 evaluates registry rows. It does not generally analyze laws, policies, products, data practices, or contracts outside the registry-led workflow.

## HR6.002 — Full 98-Row Ledger Mandatory

All 98 registry rows must appear exactly once in `target_exposure_profile.registry_ledger[]`.

Rows may be supported, controlled, weak, conflicting, insufficient, not visible, access failed, review required, not triggered, or contextually not applicable. No row may disappear.

Phase 06 uses two row paths: 

```text 
MODEL_ROUTED_ROWS: 
- all UNI rows 
- all rows whose registry archetype is triggered by Phase 03 target_feature_profile 
- all rows whose registry surface is triggered by Phase 03 target_feature_profile, where surface routing is available 

DETERMINISTIC_NOT_APPLICABLE_ROWS: - non-UNI registry rows whose archetype and surface are not triggered by Phase 03 target_feature_profile


```markdown

## HR6.003 — Model-Led Registry Intelligence for Model-Routed Rows

Phase 06 is model-led for all `MODEL_ROUTED_ROWS`.

`MODEL_ROUTED_ROWS` are:

```text
- all UNI rows
- all registry rows whose archetype is triggered by Phase 03 target_feature_profile
- all registry rows whose surface is triggered by Phase 03 target_feature_profile, where surface routing is available

For MODEL_ROUTED_ROWS, the model decides:

- whether the Hunter signal condition is triggered
- whether CONDITION_N / TRIGGER_IF fits the admitted evidence
- whether EXCLUDE_IF / first-party neutralizing evidence defeats the row-specific condition
- whether a broader admitted evidence path is needed
- whether the row is supported, controlled, weak, conflicting, not visible, insufficient, access failed, or review-required

For DETERMINISTIC_NOT_APPLICABLE_ROWS, the deterministic route planner may assign the row to the final ledger without model evaluation only where the row is non-UNI and the row's archetype/surface was not triggered by Phase 03 target_feature_profile.

This deterministic assignment is not a substantive Hunter trigger decision. It is an applicability routing decision.

Deterministic systems cannot decide, downgrade, suppress, or overwrite substantive Hunter outcomes for MODEL_ROUTED_ROWS.


---

## HR6.004 — Deterministic Support Rails Only

Deterministic systems may:

```text
- load all 98 registry rows
- preserve row order
- identify UNI rows
- derive active archetypes from Phase 03 target_feature_profile
- derive active surfaces from Phase 03 target_feature_profile, where available
- classify rows into MODEL_ROUTED_ROWS or DETERMINISTIC_NOT_APPLICABLE_ROWS
- build deterministic NOT_APPLICABLE_CONTEXTUAL ledger rows for non-UNI rows whose archetype/surface is not triggered
- build model batch packets for MODEL_ROUTED_ROWS
- batch MODEL_ROUTED_ROWS in groups of up to 15
- preserve row route basis and batch basis
- attach legal cartography routes
- attach upstream profile refs
- attach admitted source refs
- attach lossless legal/governance evidence blocks
- flag missing inputs
- validate schema
- validate batch coverage
- validate status vocabulary
- validate ref resolution
- validate 98-row ledger completeness
- validate forbidden legal-verdict language
- merge model-routed rows and deterministic not-applicable rows into registry order

Deterministic systems may not:

- decide Hunter signal triggered / not triggered for MODEL_ROUTED_ROWS
- decide conditional triggered / not triggered for MODEL_ROUTED_ROWS
- decide whether governance language is sufficient for MODEL_ROUTED_ROWS
- decide whether visible control mitigates a MODEL_ROUTED_ROW
- decide whether absence supports an exposure signal for a MODEL_ROUTED_ROW
- decide whether qualified review is required for a MODEL_ROUTED_ROW
- narrow the model to one evidence path for MODEL_ROUTED_ROWS
- suppress UNI rows
- suppress triggered archetype/surface rows
- overwrite model trigger or evaluation status

---

## HR6.005 — Evidence Firewall

Permitted proof sources:

```text
- admitted legal/governance lossless evidence
- locked upstream target profile
- locked upstream feature profile
- locked upstream legal cartography index
- locked upstream data provenance profile
- prior phase absence/access/ref records
```

Forbidden proof sources:

```text
- model memory
- new web search
- unaudited third-party commentary
- non-admitted source material
- marketing-only claims as legal/governance proof
```

## HR6.006 — No Legal Verdicts

Phase 06 must not output legal advice, legal conclusions, compliance verdicts, liability findings, enforceability conclusions, or enforcement predictions.

Allowed language:

```text
visible signal
visible control
partial or weak signal
not visible after targeted search
access failed
requires qualified review
insufficient evidence
```

Forbidden language:

```text
COMPLIANT
NON_COMPLIANT
ILLEGAL
LEGAL
LIABLE
NOT LIABLE
VIOLATION
NO VIOLATION
BREACH
ENFORCEABLE
UNENFORCEABLE
CONFIRMED VIOLATION
```

## HR6.007 — Upstream Mutation Prohibited

Phase 06 may cite upstream profiles. It may not rewrite upstream target facts, feature facts, data provenance facts, legal cartography units, or registry metadata.

---

# 06. EXECUTION BLOCKS

```text
EB6.001 — Runtime and Registry Handshake 
EB6.002 — Input Boundary Gate 
EB6.003 — Full 98-Row Registry Inventory 
EB6.003A — Deterministic Hunter Route Planning 
EB6.004 — Deterministic Navigation Map + Candidate Packetization 
EB6.004A — Model Batch Construction 
EB6.005 — Model-Led Evidence Path Selection + Hunter Signal Trigger Adjudication 
EB6.006 — Evidence Binding of Model-Selected Path 
EB6.007 — Model-Led Registry Row Evaluation 
EB6.008 — Exposure Ledger Assembly 
EB6.009 — Operator Challenge Gate 
EB6.010 — Deterministic Terminal Gates + Final JSON Payload
```

## EB6.001 — Runtime and Registry Handshake

Load the governing runtime, registry key, registry row source, upstream phase profiles, and admitted legal/governance evidence package.

Output:

```json
{
  "phase_id": "P6_target_exposure_profile_REGISTRY_LEDGER",
  "runtime_registry_refs": [],
  "input_manifest": {},
  "target_exposure_profile_status": "READY"
}
```

## EB6.002 — Input Boundary Gate

Verify required inputs exist. Do not evaluate registry rows if the registry, registry key, or full admitted legal/governance lossless package is missing.

## EB6.003 — Full 98-Row Registry Inventory

Load all 98 registry rows from `AI_THREAT_REGISTRY`. Preserve threat IDs, archetypes, subcategories, surfaces, row titles, registry signal conditions, and order.

## EB6.003A — Deterministic Hunter Route Planning

Derive active routing signals from Phase 03 target_feature_profile.

The deterministic route planner must create:

```json
{
  "hunter_route_plan": {
    "active_archetypes": [],
    "active_surfaces": [],
    "model_routed_row_ids": [],
    "deterministic_not_applicable_row_ids": [],
    "row_route_reasons": []
  }
}

Routing rules:

1. All UNI rows are MODEL_ROUTED_ROWS.
2. Rows whose registry archetype appears in active_archetypes are MODEL_ROUTED_ROWS.
3. Rows whose registry surface appears in active_surfaces are MODEL_ROUTED_ROWS, where surface routing is available.
4. Non-UNI rows with no active archetype/surface match are DETERMINISTIC_NOT_APPLICABLE_ROWS.
5. DETERMINISTIC_NOT_APPLICABLE_ROWS must not be sent to the model.
6. DETERMINISTIC_NOT_APPLICABLE_ROWS must still appear in the final 98-row ledger with evaluation_status = NOT_APPLICABLE_CONTEXTUAL.

The route planner may determine row applicability. It may not determine Hunter trigger/evaluation status for model-routed rows.


## EB6.004 — Deterministic Navigation Map + Candidate Packetization

Build one `trigger_candidate_packet` per registry row.

The packet is a starting map, not a conclusion.

## EB6.004A — Model Batch Construction

Build model batches only from `MODEL_ROUTED_ROWS`.

Batching rules:

```text
1. Maximum batch size = 15 registry rows.
2. UNI rows are batched first.
3. Triggered archetype rows are batched after UNI rows.
4. Where possible, keep rows from the same archetype group together.
5. Do not mix more than three active archetype groups in one batch unless needed to avoid a tiny final batch.
6. If one archetype group exceeds 15 rows, split it into multiple batches.
7. The final batch may contain fewer than 15 rows.
8. DETERMINISTIC_NOT_APPLICABLE_ROWS are not included in model batches.

Each batch packet must include:

{
  "batch_id": "",
  "batch_number": 0,
  "batch_count": 0,
  "batch_size": 0,
  "expected_registry_row_ids": [],
  "registry_rows": [],
  "target_profile": {},
  "target_feature_profile": {},
  "legal_cartography_index": {},
  "target_data_provenance_profile": {},
  "legal_governance_lossless_evidence_package": [],
  "hunter_engine_rules": []
}

Each model batch must return only the rows listed in expected_registry_row_ids.

Batch output may not include rows outside the batch.

## EB6.005 — Model-Led Evidence Path Selection + Registry Signal Trigger Adjudication

For each model-routed batch row, the model uses the deterministic navigation map, Hunter Engine Rules, legal cartography, upstream profiles, and full admitted legal/governance lossless evidence to select the actual evidence path and decide Hunter signal trigger status.

The model may use, expand, or reject deterministic routes, but must stay within admitted evidence and record the actual path used.

## EB6.006 — Evidence Binding of Model-Selected Path

Bind evidence after model path selection. The binding record must reflect the evidence path actually used by the model, not merely the deterministic candidate route.

## EB6.007 — Model-Led Registry Row Evaluation

For rows requiring evaluation, the model assigns `evaluation_status` using admitted evidence only.

## EB6.008 — Exposure Ledger Assembly

Assemble all 98 rows into `registry_ledger[]` by merging model-routed batch outputs with deterministic not-applicable rows, preserving locked registry order and carrying row identity, navigation, trigger status, evaluation status, evidence, summaries, and limitations.

## EB6.009 — Operator Challenge Gate

Run OCG6.001–OCG6.018. Repair where allowed. Controlled failure where unsafe.

## EB6.010 — Deterministic Terminal Gates + Final JSON Payload

Run TG6.001–TG6.016. Emit final JSON only.

---

# 07. FIELD DERIVATION POWER TABLE

## FD6.001–FD6.060

| FD ID | Canonical Field / Group | Owner | Derivation Logic | Output Placement / Guardrail |
|---|---|---|---|---|
| FD6.001 | `phase_id` | Deterministic | Set exact value: `P6_target_exposure_profile_REGISTRY_LEDGER`. | `exposure_profile_forensic_ledger.phase_id`; blocks if altered. |
| FD6.002 | `runtime_registry_refs` | Deterministic | Record loaded runtime, registry key, registry table, and prior phase refs. | Forensic ledger only; no evidence inference. |
| FD6.003 | `target_ref` | Deterministic | Copy from Phase 02 only: target name, domain, legal name if available. | No re-identification from registry/legal docs. |
| FD6.004 | `input_manifest` | Deterministic | Record received/missing inputs: target profile, feature profile, legal cartography, data profile, registry key, registry rows, legal/governance source package. | Missing registry rows = controlled failure. |
| FD6.005 | `target_exposure_profile_status` | Deterministic | Assign one of: `READY`, `PARTIAL_INPUTS`, `REGISTRY_MISSING`, `CONTROLLED_FAILURE`, `LOCKED`. | Cannot be `LOCKED` until terminal gates pass. |
| FD6.006 | `registry_manifest` | Deterministic | Record registry version, registry source ref, expected row count, loaded row count, schema status. | Must reference `REGISTRY_KEY_v3_0` vocabulary. |
| FD6.007 | `total_registry_rows_loaded` | Deterministic | Count loaded registry rows. Expected value: `98`. | If not 98, registry completeness gate fails. |
| FD6.008 | `registry_row_inventory[]` | Deterministic | Create inventory row for every registry row before routing/adjudication. | No row can disappear later. |
| FD6.009 | `universal_row_inventory[]` | Deterministic | Extract all `UNI_*` rows from registry inventory. | UNI rows always proceed to trigger/evaluation flow. |
| FD6.010 | `row_inventory_completeness_status` | Deterministic | Compare expected row IDs against loaded row IDs. | Values: `COMPLETE_98`, `MISSING_ROWS`, `DUPLICATE_ROWS`, `SCHEMA_MISMATCH`. |
| FD6.011 | `trigger_candidate_packets[]` | Deterministic packetization | Build one candidate packet per registry row. Packet is a model workspace, not a trigger decision. | Deterministic system does not mark registry signal triggered/not triggered. |
| FD6.012 | `registry_row_ref` | Deterministic copy | Copy registry row ID, archetype, subcat, surface, row title, registry signal condition. | Must preserve registry IDs exactly. |
| FD6.013 | `registry_signal_condition` | Deterministic copy | Copy exact condition/trigger text from registry row. | No paraphrase that changes trigger meaning. |
| FD6.014 | `deterministic_navigation_map` | Deterministic support | Prepare candidate artifact, unit, control, feature, data, absence, and access routes. | Starting map only; model may expand/reject within admitted evidence. |
| FD6.015 | `model_navigation_authority` | Deterministic instruction | Declare model authority to use/expand/reject candidate routes while staying within admitted evidence. | Prevents deterministic suppression. |
| FD6.016 | `upstream_profiles` | Deterministic packetization | Attach target, feature, legal cartography, and data provenance contexts. | Context only; no upstream mutation. |
| FD6.017 | `primary_evidence_lossless` | Deterministic packetization | Attach full admitted legal/governance lossless evidence needed for model path selection. | Refs-only reasoning is prohibited for evaluable rows. |
| FD6.018 | `documented_absence_access_context` | Deterministic packetization | Attach absence basis, access-failed source refs, and route-searched markers. | Prevents lazy insufficient evidence. |
| FD6.019 | `registry_signal_trigger_decisions[]` | Model-owned | Model reads packet, selects actual evidence path, and decides trigger status. | Deterministic validator may challenge invalid structure, not overwrite. |
| FD6.020 | `registry_signal_trigger_status` | Model-owned | Choose locked trigger status. | Core semantic decision. |
| FD6.021 | `trigger_basis_type` | Model-owned | Classify primary trigger basis. | Closed vocabulary only. |
| FD6.022 | `deterministic_route_disposition` | Model-owned | Record whether model used, expanded, or rejected deterministic route. | Mandatory when route is expanded/rejected. |
| FD6.023 | `model_selected_evidence_path` | Model-owned | Record actual artifacts, units, sources, profile refs, and lossless blocks used. | Required for supported/review/triggered rows. |
| FD6.024 | `trigger_confidence` | Model-owned | Assign `high`, `medium`, `low`, or `unknown` based on evidence strength. | `unknown` requires source-route basis. |
| FD6.025 | `needs_row_evaluation` | Model-owned | Boolean derived from trigger status. True for UNI, triggered, conditional triggered, review-required, conflicting, insufficient, and access-failed trigger checks. | False only for clean not-triggered rows. |
| FD6.026 | `evidence_binding_records[]` | Deterministic / hybrid | Bind evaluable or review rows to exact model-selected evidence path. | Binding follows model path selection. |
| FD6.027 | `feature_evidence_refs[]` | Deterministic | Attach Phase 03 feature refs used by model. | No raw feature narrative unless referenced. |
| FD6.028 | `legal_cartography_evidence_refs[]` | Deterministic | Attach Phase 04 artifact/unit/control refs used by model. | Primary route for governance proof. |
| FD6.029 | `data_provenance_evidence_refs[]` | Deterministic | Attach Phase 05 data/privacy/control refs used by model. | Supports PRV/BIO/DEC/HRM/INF rows especially. |
| FD6.030 | `admitted_source_evidence_refs[]` | Deterministic | Attach only admitted source refs from prior phases. | Blocks new web search, model memory, third-party commentary. |
| FD6.031 | `bound_primary_evidence_lossless[]` | Deterministic / hybrid | Preserve lossless legal/governance blocks used in model-selected path. | Required for evaluable rows where governance proof is needed. |
| FD6.032 | `registry_row_evaluations[]` | Model-owned | Evaluate all rows where `needs_row_evaluation = true`. | Non-evaluable rows still appear in ledger. |
| FD6.033 | `evaluation_status` | Model-owned | Choose locked evaluation status. | No TRUE/FALSE or legal verdict status. |
| FD6.034 | `evaluation_basis` | Model-owned, validator-checked | Explain why evidence supports status. Must cite refs from binding. | Unsupported status fails evidence gate. |
| FD6.035 | `evidence_basis_types[]` | Model-selected, validator-checked | Identify type of evidence used. | Closed vocabulary only. |
| FD6.036 | `visible_signal_summary` | Model-owned | One concise evidence-grounded sentence. | No final report narrative; no legal conclusion. |
| FD6.037 | `visible_control_summary` | Model-owned / hybrid | Summarize visible mitigating/control language if present. | Do not call it compliant or non-compliant. |
| FD6.038 | `requires_qualified_review` | Model-owned / validator-checked | True where legal/professional judgment is required. | Prevents unauthorized legal conclusion. |
| FD6.039 | `row_limitation` | Model-owned / hybrid | State narrow limitation: source gap, legal cartography gap, access failed, ambiguous wording, public-footprint boundary. | No recommendations. |
| FD6.040 | `registry_ledger[]` | Deterministic assembly | Merge inventory, packet, trigger decision, evidence binding, and evaluation into full 98-row ledger. | All rows mandatory. |
| FD6.041 | `ledger_row_id` | Deterministic | Assign `RL6.001` to `RL6.098` in registry order. | Stable and reproducible. |
| FD6.042 | `ledger_trigger_status` | Deterministic copy | Copy from `registry_signal_trigger_status`. | Must not be overwritten during assembly. |
| FD6.043 | `ledger_evaluation_status` | Deterministic copy/projection | Copy model evaluation status or assign mechanical non-triggered status where no evaluation required. | Separate from trigger status. |
| FD6.044 | `ledger_evidence_refs[]` | Deterministic projection | Consolidate refs used for trigger/evaluation/absence/access basis. | Empty only for clean not-triggered rows with basis. |
| FD6.045 | `supported_exposure_rows[]` | Deterministic projection | Filter ledger rows where evaluation status = `SUPPORTED_EXPOSURE_SIGNAL`. | Projection only; no new findings. |
| FD6.046 | `controlled_or_mitigated_rows[]` | Deterministic projection | Filter rows where visible control is present or supported control exists. | Not a compliance conclusion. |
| FD6.047 | `insufficient_evidence_rows[]` | Deterministic projection | Filter rows with trigger/evaluation insufficiency. | Must carry missing basis. |
| FD6.048 | `not_visible_after_targeted_search_rows[]` | Deterministic projection | Filter rows where relevant route was searched and signal/control not visible. | Requires targeted-search basis. |
| FD6.049 | `access_failed_rows[]` | Deterministic projection | Filter rows blocked by access failure. | Must include failed source/route ref. |
| FD6.050 | `review_required_rows[]` | Deterministic projection | Filter rows with trigger/evaluation review status. | These are reviewer routes, not legal conclusions. |
| FD6.051 | `archetype_exposure_map` | Deterministic aggregation | Group ledger outcomes by registry archetype. | Aggregation only. |
| FD6.052 | `surface_exposure_map` | Deterministic aggregation | Group ledger outcomes by registry surface tags. | Uses registry surface vocabulary only. |
| FD6.053 | `subcat_exposure_map` | Deterministic aggregation | Group ledger outcomes by registry subcat. | Do not create new subcat labels. |
| FD6.054 | `legal_governance_control_map` | Deterministic aggregation | Map evaluated rows to legal/governance artifacts, units, controls, missing controls, and visible controls. | Primary downstream report map. |
| FD6.055 | `data_provenance_control_map` | Deterministic aggregation | Map evaluated rows to Phase 05 data/privacy/AI/security/control refs. | Support map only. |
| FD6.056 | `absence_evidence_map` | Deterministic aggregation | Group absence, not-visible, access-failed, and insufficient rows by source route and registry row. | Prevents disappearance of negative evidence. |
| FD6.057 | `operator_challenge_result` | Model + deterministic gate | Run challenge checks after preliminary ledger assembly. | Mandatory before lock. |
| FD6.058 | `challenged_rows_and_repairs[]` | Hybrid | Record rows challenged, reason, repair action, repaired status, or unresolved flag. | Deterministic validator confirms challenge was run. |
| FD6.059 | `evidence_limitations_trace` | Deterministic / hybrid | Consolidate evidence coverage, limitations, gaps, failures, ambiguity, and public-footprint boundaries. | Trace only; not final report prose. |
| FD6.060 | `terminal_gates_and_lock_status` | Deterministic | Run terminal gates and emit `LOCKED`, `REPAIR_REQUIRED`, or `CONTROLLED_FAILURE`. | Final lock gate. |


## FD6.BATCH — Deterministic Routing + Batch Merge Addendum

| FD ID | Canonical Field / Group | Owner | Derivation Logic | Output Placement / Guardrail |
|---|---|---|---|---|
| FD6.B01 | `active_archetypes[]` | Deterministic | Extract unique triggered archetype codes from Phase 03 target_feature_profile. | Used only for row applicability routing. |
| FD6.B02 | `active_surfaces[]` | Deterministic | Extract unique triggered surface tokens from Phase 03 target_feature_profile where available. | Used only for row applicability routing. |
| FD6.B03 | `row_route_plan[]` | Deterministic | Classify every registry row as `MODEL_ROUTED` or `DETERMINISTIC_NOT_APPLICABLE`. | Must include all 98 rows exactly once. |
| FD6.B04 | `row_route_reason` | Deterministic | Assign one of: `UNI_ALWAYS_RUN`, `ARCHETYPE_TRIGGERED`, `SURFACE_TRIGGERED`, `INT_NOT_TRIGGERED_NOT_APPLICABLE`. | Does not decide Hunter trigger status for model-routed rows. |
| FD6.B05 | `deterministic_not_applicable_rows[]` | Deterministic | Build non-model rows for non-UNI registry rows whose archetype/surface is not triggered. | Must use `evaluation_status = NOT_APPLICABLE_CONTEXTUAL`. |
| FD6.B06 | `model_batch_plan[]` | Deterministic | Split `MODEL_ROUTED_ROWS` into batches of up to 15, with UNI first and archetype grouping where possible. | Batch coverage must equal model-routed row count. |
| FD6.B07 | `batch_expected_registry_row_ids[]` | Deterministic | For each model batch, list exact expected row IDs. | Missing/unexpected/duplicate IDs fail batch validation. |
| FD6.B08 | `batch_registry_ledger_rows[]` | Model-owned | Model evaluates only rows in the current batch. | No row outside the batch may appear. |
| FD6.B09 | `batch_coverage_validation` | Deterministic | Validate exact batch ID coverage before merge. | Failed batch does not merge silently. |
| FD6.B10 | `final_registry_merge` | Deterministic | Merge model rows and deterministic not-applicable rows in registry order. | Final ledger count must equal 98. |
---

# 08. STATUS VOCABULARY

## SV6.000 — `row_route_reason`

```yaml
row_route_reason:
  - UNI_ALWAYS_RUN
  - ARCHETYPE_TRIGGERED
  - SURFACE_TRIGGERED
  - INT_NOT_TRIGGERED_NOT_APPLICABLE

Hard rules:

UNI_ALWAYS_RUN, ARCHETYPE_TRIGGERED, and SURFACE_TRIGGERED rows are MODEL_ROUTED_ROWS.
INT_NOT_TRIGGERED_NOT_APPLICABLE rows are DETERMINISTIC_NOT_APPLICABLE_ROWS.

## SV6.001 — `registry_signal_trigger_status`

```yaml
registry_signal_trigger_status:
  - UNI_ALWAYS_RUN
  - REGISTRY_SIGNAL_TRIGGERED
  - REGISTRY_SIGNAL_NOT_TRIGGERED
  - CONDITIONAL_TRIGGERED
  - CONDITIONAL_NOT_TRIGGERED
  - TRIGGER_INSUFFICIENT_EVIDENCE
  - TRIGGER_CONFLICTING_SIGNALS
  - TRIGGER_REQUIRES_REVIEW
  - ACCESS_FAILED_TRIGGER_CHECK
```

Hard rule:

```text
Deterministic validation may challenge this status but may not silently overwrite it.
```

## SV6.002 — `trigger_basis_type`

```yaml
trigger_basis_type:
  - FEATURE_MATCH
  - ARCHETYPE_MATCH
  - SURFACE_MATCH
  - DATA_SIGNAL_MATCH
  - LEGAL_CONTROL_MATCH
  - ABSENCE_MATCH
  - CONFLICTING_CONTEXT
  - ACCESS_FAILED_CONTEXT
  - INSUFFICIENT_CONTEXT
  - UNIVERSAL_ROW
  - REVIEW_REQUIRED_CONTEXT
```

Each trigger decision must carry exactly one primary `trigger_basis_type`.

## SV6.003 — `evaluation_status`

```yaml
evaluation_status:
  - SUPPORTED_EXPOSURE_SIGNAL
  - SUPPORTED_CONTROL_PRESENT
  - PARTIAL_OR_WEAK_SIGNAL
  - CONFLICTING_SIGNALS
  - INSUFFICIENT_EVIDENCE
  - NOT_VISIBLE_AFTER_TARGETED_SEARCH
  - ACCESS_FAILED
  - NOT_TRIGGERED
  - NOT_APPLICABLE_CONTEXTUAL
  - REQUIRES_QUALIFIED_REVIEW
  - CONTROLLED_FAILURE
```

Evaluation status is not a legal conclusion.

## SV6.004 — `evidence_basis_type`

```yaml
evidence_basis_type:
  - DIRECT_QUOTE_REF
  - ARTIFACT_SECTION_REF
  - FEATURE_PROFILE_REF
  - DATA_PROFILE_REF
  - LEGAL_CARTOGRAPHY_REF
  - ABSENCE_RECORD_REF
  - ACCESS_FAILURE_REF
  - CONFLICT_RECORD_REF
  - NO_EVIDENCE_REQUIRED_NOT_TRIGGERED
```

`SUPPORTED_EXPOSURE_SIGNAL` and `SUPPORTED_CONTROL_PRESENT` cannot use `NO_EVIDENCE_REQUIRED_NOT_TRIGGERED`.

## SV6.005 — `confidence`

```yaml
confidence:
  - high
  - medium
  - low
  - unknown
```

`unknown` requires source-route basis.

## SV6.006 — `operator_challenge_status`

```yaml
operator_challenge_status:
  - CHALLENGE_NOT_RUN
  - CHALLENGE_PASSED
  - CHALLENGE_REPAIRED
  - CHALLENGE_UNRESOLVED
  - CHALLENGE_CONTROLLED_FAILURE
```

Final lock is impossible unless status is `CHALLENGE_PASSED` or `CHALLENGE_REPAIRED`.

## SV6.007 — `terminal_lock_status`

```yaml
terminal_lock_status:
  - LOCKED
  - REPAIR_REQUIRED
  - CONTROLLED_FAILURE
```

Controlled failure is better than a polluted exposure profile.

## SV6.008 — `binding_status`

```yaml
binding_status:
  - BOUND
  - PARTIALLY_BOUND
  - NO_BINDING_REQUIRED_NOT_TRIGGERED
  - BINDING_BLOCKED_ACCESS_FAILED
  - BINDING_BLOCKED_MISSING_REFS
```

## SV6.009 — `deterministic_route_disposition`

```yaml
deterministic_route_disposition:
  - USED_AS_PROVIDED
  - EXPANDED_WITHIN_LEGAL_CARTOGRAPHY
  - EXPANDED_WITHIN_PRIMARY_LOSSLESS_EVIDENCE
  - REJECTED_AS_TOO_NARROW
  - REJECTED_AS_WRONG_ROUTE
  - INSUFFICIENT_ROUTE_BUT_MODEL_FOUND_PATH
  - INSUFFICIENT_ROUTE_AND_NO_PATH_FOUND
  - ACCESS_FAILED_ROUTE
```

## SV6.010 — Banned Statuses

These must not appear anywhere as final statuses:

```text
TRUE
FALSE
GAP_TRUE
GAP_FALSE
COMPLIANT
NON_COMPLIANT
ILLEGAL
LEGAL
LIABLE
NOT_LIABLE
VIOLATION
NO_VIOLATION
ENFORCEABLE
UNENFORCEABLE
RISK_SCORE
HIGH_RISK
LOW_RISK
```

---

# 09. ROW SCHEMAS

## RS6.000 — `p6_model_batch_output`

Purpose: model output for one batch of model-routed registry rows.

```json
{
  "batch_id": "P6B.001",
  "batch_number": 1,
  "batch_count": 1,
  "expected_registry_row_ids": [],
  "registry_signal_trigger_decisions": [],
  "evidence_binding_records": [],
  "registry_row_evaluations": [],
  "registry_ledger_batch": []
}

Rules:

1. `registry_ledger_batch[]` must contain only rows from expected_registry_row_ids.
2. `registry_ledger_batch[]` must not include deterministic not-applicable rows.
3. Each batch row must preserve registry metadata exactly.
4. Each batch row must apply HER_001, HER_001B, and HER_002.
5. If EXCLUDE_IF / neutralizing first-party evidence defeats the row-specific condition, use a controlled/not-triggered status, not a supported exposure signal.
6. A risk surface alone is insufficient.

## RS6.001 — `trigger_candidate_packet`

Purpose: create the model's starting workspace for a registry row.

This packet does not decide trigger status and does not limit the model to deterministic route tags.

```json
{
  "packet_id": "TCP6.001",
  "registry_row_id": "UNI_LIA_001",
  "registry_row_ref": {
    "threat_id": "",
    "archetype": "",
    "subcat": "",
    "surface_tags": [],
    "row_title": "",
    "registry_signal_condition": "",
    "registry_row_source_ref": ""
  },
  "deterministic_navigation_map": {
    "candidate_artifact_routes": [],
    "candidate_unit_routes": [],
    "candidate_control_routes": [],
    "candidate_feature_refs": [],
    "candidate_archetype_refs": [],
    "candidate_surface_refs": [],
    "candidate_data_signal_refs": [],
    "candidate_absence_refs": [],
    "candidate_access_failed_refs": [],
    "routing_confidence": "high",
    "routing_limitation": ""
  },
  "model_navigation_authority": {
    "may_use_deterministic_route": true,
    "may_expand_within_legal_cartography": true,
    "may_expand_within_primary_lossless_evidence": true,
    "may_reject_candidate_route_as_too_narrow": true,
    "may_reject_candidate_route_as_wrong": true,
    "must_stay_within_admitted_evidence": true,
    "must_record_actual_path_used": true
  },
  "upstream_profiles": {
    "target_profile_context": {},
    "feature_profile_context": {},
    "legal_cartography_index": {},
    "data_provenance_profile_context": {}
  },
  "primary_evidence_lossless": {
    "legal_governance_sources": [
      {
        "source_ref": "",
        "artifact_ref": "",
        "source_family": "legal_governance",
        "source_title": "",
        "source_url": "",
        "clean_text_lossless": "",
        "route_status": "ADMITTED_PRIMARY"
      }
    ],
    "source_scope_note": "Full admitted legal/governance lossless evidence available for model path selection."
  },
  "supporting_context": {
    "feature_profile_refs": [],
    "data_profile_refs": [],
    "legal_cartography_refs": [],
    "absence_refs": [],
    "access_failed_refs": []
  },
  "packet_limitations": []
}
```

## RS6.002 — `registry_signal_trigger_decision`

```json
{
  "decision_id": "HTD6.001",
  "registry_row_id": "UNI_LIA_001",
  "packet_id": "TCP6.001",
  "deterministic_route_disposition": "USED_AS_PROVIDED",
  "model_selected_evidence_path": {
    "artifact_refs_used": [],
    "unit_refs_used": [],
    "source_refs_used": [],
    "profile_refs_used": [],
    "lossless_evidence_blocks_used": [],
    "path_reason": ""
  },
  "registry_signal_trigger_status": "REGISTRY_SIGNAL_TRIGGERED",
  "trigger_basis_type": "LEGAL_CONTROL_MATCH",
  "trigger_reason": "",
  "trigger_evidence_refs": [],
  "trigger_confidence": "medium",
  "needs_row_evaluation": true,
  "review_required_reason": "",
  "trigger_limitations": []
}
```

## RS6.003 — `evidence_binding_record`

Evidence binding records the model-selected evidence path, not merely the deterministic route.

```json
{
  "binding_id": "EBR6.001",
  "registry_row_id": "UNI_LIA_001",
  "decision_id": "HTD6.001",
  "binding_status": "BOUND",
  "bound_model_selected_path": {
    "artifact_refs_used": [],
    "unit_refs_used": [],
    "source_refs_used": [],
    "profile_refs_used": [],
    "lossless_evidence_blocks_used": []
  },
  "bound_refs": {
    "feature_refs": [],
    "legal_cartography_refs": [],
    "data_provenance_refs": [],
    "admitted_source_refs": [],
    "absence_refs": [],
    "access_failed_refs": [],
    "conflict_refs": []
  },
  "bound_primary_evidence_lossless": [
    {
      "source_ref": "",
      "artifact_ref": "",
      "source_family": "legal_governance",
      "source_title": "",
      "source_url": "",
      "clean_text_lossless": ""
    }
  ],
  "evidence_basis_types": [],
  "binding_limitations": []
}
```

## RS6.004 — `registry_row_evaluation`

```json
{
  "evaluation_id": "RRE6.001",
  "registry_row_id": "UNI_LIA_001",
  "decision_id": "HTD6.001",
  "binding_id": "EBR6.001",
  "evaluation_status": "SUPPORTED_EXPOSURE_SIGNAL",
  "evaluation_basis": "",
  "evidence_basis_types": [],
  "visible_signal_summary": "",
  "visible_control_summary": "",
  "evaluation_confidence": "medium",
  "requires_qualified_review": false,
  "qualified_review_reason": "",
  "row_limitation": ""
}
```

## RS6.005 — `registry_ledger_row`

```json
{
  "ledger_row_id": "RL6.001",
  "registry_row_id": "UNI_LIA_001",
  "registry_row_ref": {
    "threat_id": "",
    "archetype": "",
    "subcat": "",
    "surface_tags": [],
    "row_title": ""
  },
  "navigation": {
    "packet_id": "TCP6.001",
    "deterministic_route_disposition": "USED_AS_PROVIDED",
    "model_selected_evidence_path": {
      "artifact_refs_used": [],
      "unit_refs_used": [],
      "source_refs_used": [],
      "profile_refs_used": [],
      "path_reason": ""
    }
  },
  "trigger": {
    "decision_id": "HTD6.001",
    "registry_signal_trigger_status": "UNI_ALWAYS_RUN",
    "trigger_basis_type": "UNIVERSAL_ROW",
    "trigger_confidence": "high"
  },
  "evaluation": {
    "evaluation_id": "RRE6.001",
    "evaluation_status": "SUPPORTED_EXPOSURE_SIGNAL",
    "evaluation_confidence": "medium",
    "requires_qualified_review": false
  },
  "evidence": {
    "binding_id": "EBR6.001",
    "ledger_evidence_refs": [],
    "absence_refs": [],
    "access_failed_refs": []
  },
  "summaries": {
    "visible_signal_summary": "",
    "visible_control_summary": "",
    "row_limitation": ""
  }
}
```

There must be exactly 98 `registry_ledger_row` objects.

## RS6.006 — `operator_challenge_result`

```json
{
  "operator_challenge_status": "CHALLENGE_PASSED",
  "challenge_run_id": "OCG6.001",
  "challenge_checks": {
    "all_98_rows_present": true,
    "all_uni_rows_evaluated": true,
    "triggered_rows_have_evaluations": true,
    "supported_rows_have_evidence": true,
    "absence_rows_have_search_basis": true,
    "access_failed_rows_have_route_basis": true,
    "model_route_expansions_recorded": true,
    "model_route_rejections_recorded": true,
    "no_unadmitted_evidence_used": true,
    "no_legal_verdict_language_used": true,
    "low_findings_challenged_against_feature_profile": true,
    "high_findings_challenged_against_evidence_limits": true,
    "deterministic_validator_did_not_overwrite_model_decisions": true
  },
  "challenged_rows": [],
  "repairs_applied": [],
  "unresolved_challenge_flags": [],
  "challenge_limitations": []
}
```

---

# 10. OPERATOR CHALLENGE GATE

Run OCG6.001–OCG6.018 after preliminary ledger assembly and before terminal gates.

```text
OCG6.001 — Full Registry Preservation Challenge
OCG6.002 — UNI Always-Run Challenge
OCG6.003 — Trigger / Evaluation Separation Challenge
OCG6.004 — Model Authority Challenge
OCG6.005 — Evidence Path Challenge
OCG6.006 — Full Primary Evidence Challenge
OCG6.007 — Admitted Evidence Boundary Challenge
OCG6.008 — Supported Row Evidence Challenge
OCG6.009 — Absence Basis Challenge
OCG6.010 — Access Failure Challenge
OCG6.011 — Low-Finding Challenge
OCG6.012 — High-Finding Challenge
OCG6.013 — Legal Verdict Language Challenge
OCG6.014 — Upstream Mutation Challenge
OCG6.015 — Registry Metadata Integrity Challenge
OCG6.016 — Qualified Review Challenge
OCG6.017 — Route Disposition Challenge
OCG6.018 — Final Lock Challenge
```

## OCG6.001 — Full Registry Preservation Challenge

Question: Are all 98 registry rows present in the final ledger?

Failure if any registry row is missing, duplicated, altered, or materially order-unstable without explanation.

Repair: rebuild ledger from registry inventory before continuing.

## OCG6.002 — UNI Always-Run Challenge

Question: Did every UNI row receive trigger adjudication and evaluation?

Failure if a UNI row is marked not triggered, skipped because feature/archetype did not match, or appears only in inventory.

Repair: force UNI rows through model trigger/evaluation path with `UNI_ALWAYS_RUN`.

## OCG6.003 — Trigger / Evaluation Separation Challenge

Question: Are trigger status and evaluation status kept separate?

Failure if one generic status replaces both, `NOT_APPLICABLE` is used as shortcut, triggered row lacks evaluation status, or not-triggered row has unsupported exposure evaluation.

Repair: split status into `registry_signal_trigger_status` and `evaluation_status`.

## OCG6.004 — Model Authority Challenge

Question: Did deterministic routing suppress or control any substantive model decision?

Failure if deterministic routing decided Hunter trigger/evaluation status for MODEL_ROUTED_ROWS, blocked legal/governance evidence review for MODEL_ROUTED_ROWS, overwrote model trigger/evaluation, suppressed UNI rows, or suppressed triggered archetype/surface rows.

Deterministic routing may assign non-UNI, non-triggered archetype/surface rows to DETERMINISTIC_NOT_APPLICABLE_ROWS without model evaluation.

Repair: re-run affected MODEL_ROUTED_ROWS with model-led evidence path selection, or correct deterministic route planning where a row was wrongly classified.

## OCG6.005 — Evidence Path Challenge

Question: Did the model record the actual evidence path used?

Failure if model-selected path is empty for supported/review rows, route expansion/rejection is not recorded, or evidence binding reflects deterministic route instead of model-selected path.

Repair: bind model-selected path and record route disposition.

## OCG6.006 — Full Primary Evidence Challenge

Question: Did model decisions use full admitted legal/governance lossless evidence where required?

Failure if decisions were refs-only or profile summaries replaced primary evidence where governance proof was needed.

Repair: inject row-relevant admitted legal/governance lossless evidence and re-evaluate.

## OCG6.007 — Admitted Evidence Boundary Challenge

Question: Did any row use non-admitted evidence?

Failure if model memory, new web search, third-party commentary, unaudited sources, or marketing-only claims were used as proof.

Repair: remove unsupported evidence and re-evaluate from admitted package only.

## OCG6.008 — Supported Row Evidence Challenge

Question: Does every supported row have valid evidence?

Failure if supported exposure/control/weak/conflict rows lack bound evidence or conflict refs.

Repair: attach valid refs/lossless blocks or downgrade to insufficient/review/access status.

## OCG6.009 — Absence Basis Challenge

Question: Are absence/not-visible conclusions backed by searched route basis?

Failure if absence is inferred from silence without route review.

Repair: attach absence/search basis or change status to `INSUFFICIENT_EVIDENCE` / `ACCESS_FAILED`.

## OCG6.010 — Access Failure Challenge

Question: Are access-failed rows separated from absence rows?

Failure if inaccessible artifact is treated as not visible, or fetch failure is converted into exposure signal.

Repair: use `ACCESS_FAILED` or `ACCESS_FAILED_TRIGGER_CHECK` with route basis.

## OCG6.011 — Low-Finding Challenge

Question: Do low exposure counts conflict with upstream feature/data/legal profiles?

Failure if active AI/data/agentic functionality produces implausibly few triggered rows without explanation.

Repair: re-check model trigger adjudication against feature profile, data profile, and legal cartography.

This does not force findings. It forces re-checking.

## OCG6.012 — High-Finding Challenge

Question: Do high exposure counts overreach the admitted evidence?

Failure if many rows are supported from one vague statement, weak signals become supported exposure, or rows trigger without row-specific condition fit.

Repair: downgrade unsupported rows to `PARTIAL_OR_WEAK_SIGNAL`, `INSUFFICIENT_EVIDENCE`, or `REQUIRES_QUALIFIED_REVIEW`.

## OCG6.013 — Legal Verdict Language Challenge

Question: Does output contain forbidden legal conclusion language?

Failure if output says compliant, non-compliant, illegal, liable, violation, unenforceable, legal breach, confirmed violation, or equivalents.

Repair: replace with visible-evidence language.

## OCG6.014 — Upstream Mutation Challenge

Question: Did Phase 06 rewrite upstream profiles?

Failure if Phase 06 invents features, alters target facts, changes data facts, rewrites legal cartography units, or changes registry metadata.

Repair: remove mutation.

## OCG6.015 — Registry Metadata Integrity Challenge

Question: Were registry IDs, archetypes, surfaces, subcats, and row titles preserved?

Failure if registry metadata is renamed, paraphrased into new meaning, or vocabulary is invented.

Repair: restore exact registry metadata.

## OCG6.016 — Qualified Review Challenge

Question: Did the model avoid making legal/professional judgments where review is required?

Failure if contract interpretation, jurisdictional applicability, enforceability, liability, or legal sufficiency is stated as final.

Repair: set `requires_qualified_review = true` and use `REQUIRES_QUALIFIED_REVIEW`.

## OCG6.017 — Route Disposition Challenge

Question: Are deterministic route expansions/rejections transparently recorded?

Failure if model used broader path but disposition says `USED_AS_PROVIDED`, or wrong/too-narrow route was silently ignored.

Repair: correct `deterministic_route_disposition` and `model_selected_evidence_path`.

## OCG6.018 — Final Lock Challenge

Pass only if:

```text
- full 98-row ledger present
- all UNI rows evaluated
- model-selected paths recorded
- supported rows have evidence
- absence/access rows have basis
- no unadmitted evidence used
- no legal verdict language used
- no upstream mutation
- unresolved challenge flags are empty or clearly limited
```

Allowed result:

```yaml
operator_challenge_status:
  - CHALLENGE_PASSED
  - CHALLENGE_REPAIRED
  - CHALLENGE_UNRESOLVED
  - CHALLENGE_CONTROLLED_FAILURE
```

---

# 11. TERMINAL GATES

Terminal gates validate structure, completeness, source discipline, schema discipline, and legal-firewall discipline.

They do not decide Hunter trigger status. They do not decide row evaluation status. They do not override model judgment.

```text
TG6.001 — Input Manifest Gate
TG6.002 — Registry Completeness Gate
TG6.003 — Registry Metadata Integrity Gate
TG6.004 — Full Ledger Gate
TG6.005 — UNI Row Gate
TG6.006 — Model Authority Gate
TG6.007 — Status Vocabulary Gate
TG6.008 — Trigger Decision Gate
TG6.009 — Evidence Path Gate
TG6.010 — Full Primary Evidence Gate
TG6.011 — Evidence Ref Resolution Gate
TG6.012 — Absence / Not-Visible Basis Gate
TG6.013 — Access Failure Gate
TG6.014 — Legal Firewall Gate
TG6.015 — Operator Challenge Completion Gate
TG6.016 — Final JSON Lock Gate
```

## TG6.001 — Input Manifest Gate

Required inputs:

```text
00_RUNTIME_SPINE.md
REGISTRY_KEY_v3_0.md
AI_THREAT_REGISTRY
Phase 02 target_profile
Phase 03 target_feature_profile
Phase 04 legal_cartography_index
Phase 05 target_data_provenance_profile
full admitted legal/governance lossless evidence package
prior phase forensic ledgers / evidence refs
```

Controlled failure if registry, registry key, or legal/governance lossless evidence package is missing.

## TG6.002 — Registry Completeness Gate

Check expected row count = 98, loaded row count = 98, no duplicate IDs, no missing IDs, no malformed IDs.

Fail reasons: `REGISTRY_ROWS_MISSING`, `REGISTRY_SCHEMA_MISMATCH`.

## TG6.003 — Registry Metadata Integrity Gate

Check threat ID, archetype, subcat, surface tags, row title, registry signal condition, and registry order are preserved.

Fail reason: `REGISTRY_SCHEMA_MISMATCH`.

## TG6.004 — Full Ledger Gate

Check `registry_ledger[]` exists, exactly 98 rows, every registry row appears exactly once, every row has `ledger_row_id`, and every row links to trigger/evaluation/evidence/navigation.

Rows assigned to DETERMINISTIC_NOT_APPLICABLE_ROWS satisfy this gate only if they preserve registry metadata, carry row_route_reason = INT_NOT_TRIGGERED_NOT_APPLICABLE, and use evaluation_status = NOT_APPLICABLE_CONTEXTUAL.

Fail reason: `LEDGER_ROW_MISSING`.

## TG6.005 — UNI Row Gate

Every UNI row must have `registry_signal_trigger_status = UNI_ALWAYS_RUN`, `needs_row_evaluation = true`, and an evaluation object.

Fail reason: `UNI_ROW_OMITTED`.

## TG6.006 — Model Authority Gate

Check that no deterministic field assigns Hunter trigger/evaluation status for MODEL_ROUTED_ROWS, no route tag suppresses UNI rows or triggered archetype/surface rows, no validator overwrites model decision, deterministic not-applicable rows are limited to non-UNI rows whose archetype/surface was not triggered, and route disposition is recorded where model expands/rejects route.

Fail reason: `DETERMINISTIC_MODEL_AUTHORITY_BREACH`.

## TG6.007 — Status Vocabulary Gate

Check all statuses use locked vocabulary only.

Fail reasons: `INVALID_TRIGGER_STATUS`, `INVALID_EVALUATION_STATUS`, `INVALID_STATUS_VOCABULARY`.

## TG6.008 — Trigger Decision Gate

Each trigger decision must include decision ID, row ID, packet ID, route disposition, model-selected evidence path, trigger status, basis type, reason, confidence, and `needs_row_evaluation`.

This gate validates presence/shape, not substantive correctness.

## TG6.009 — Evidence Path Gate

Supported rows must have model-selected evidence path, expanded/rejected routes must be recorded, evidence binding must reflect model-selected path, and lossless evidence blocks must be admitted legal/governance sources.

Fail reasons: `SUPPORTED_ROW_WITHOUT_EVIDENCE`, `UNADMITTED_EVIDENCE_USED`.

## TG6.010 — Full Primary Evidence Gate

Evaluable rows must have access to admitted legal/governance lossless evidence. Row packets may not rely on refs-only reasoning where primary governance proof is needed.

Fail reason: `PRIMARY_EVIDENCE_NOT_PROVIDED`.

## TG6.011 — Evidence Ref Resolution Gate

Check all evidence refs resolve to admitted upstream refs.

Fail reason: `EVIDENCE_REF_UNRESOLVED`.

## TG6.012 — Absence / Not-Visible Basis Gate

`NOT_VISIBLE_AFTER_TARGETED_SEARCH` requires searched route basis. `ABSENCE_MATCH` requires absence record. Missing-control exposure based on absence requires route-searched basis.

Fail reason: `ABSENCE_WITHOUT_SEARCH_BASIS`.

## TG6.013 — Access Failure Gate

`ACCESS_FAILED` and `ACCESS_FAILED_TRIGGER_CHECK` require access-failed refs. Access failure cannot be converted into absence or supported exposure.

Fail reason: `ACCESS_FAILURE_WITHOUT_ROUTE_BASIS`.

## TG6.014 — Legal Firewall Gate

Check no forbidden legal verdict language appears.

Fail reason: `LEGAL_VERDICT_LANGUAGE_USED`.

## TG6.015 — Operator Challenge Completion Gate

Check operator challenge exists, OCG6.001–OCG6.018 were run, status is `CHALLENGE_PASSED` or `CHALLENGE_REPAIRED`, and unresolved blocker flags are empty.

Fail reasons: `OPERATOR_CHALLENGE_NOT_RUN`, `OPERATOR_CHALLENGE_UNRESOLVED`.

## TG6.016 — Final JSON Lock Gate

Final object must parse as JSON and contain exactly:

```json
{
  "exposure_profile_forensic_ledger": {},
  "registry_evaluation_trace": {},
  "target_exposure_profile": {}
}
```

Fail reason: `FINAL_JSON_INVALID`.

## Controlled Failure Reasons

```yaml
controlled_failure_reasons:
  - REGISTRY_ROWS_MISSING
  - REGISTRY_SCHEMA_MISMATCH
  - UNI_ROW_OMITTED
  - LEDGER_ROW_MISSING
  - INVALID_TRIGGER_STATUS
  - INVALID_EVALUATION_STATUS
  - INVALID_STATUS_VOCABULARY
  - SUPPORTED_ROW_WITHOUT_EVIDENCE
  - ABSENCE_WITHOUT_SEARCH_BASIS
  - UNADMITTED_EVIDENCE_USED
  - LEGAL_VERDICT_LANGUAGE_USED
  - OPERATOR_CHALLENGE_NOT_RUN
  - OPERATOR_CHALLENGE_UNRESOLVED
  - FINAL_JSON_INVALID
  - DETERMINISTIC_MODEL_AUTHORITY_BREACH
  - PRIMARY_EVIDENCE_NOT_PROVIDED
  - EVIDENCE_REF_UNRESOLVED
  - ACCESS_FAILURE_WITHOUT_ROUTE_BASIS
```

## Terminal Gate Output Object

```json
{
  "terminal_lock_status": "LOCKED",
  "terminal_gate_results": {
    "input_manifest_gate": "PASS",
    "registry_completeness_gate": "PASS",
    "registry_metadata_integrity_gate": "PASS",
    "full_ledger_gate": "PASS",
    "uni_row_gate": "PASS",
    "model_authority_gate": "PASS",
    "status_vocabulary_gate": "PASS",
    "trigger_decision_gate": "PASS",
    "evidence_path_gate": "PASS",
    "full_primary_evidence_gate": "PASS",
    "evidence_ref_resolution_gate": "PASS",
    "absence_basis_gate": "PASS",
    "access_failure_gate": "PASS",
    "legal_firewall_gate": "PASS",
    "operator_challenge_completion_gate": "PASS",
    "final_json_lock_gate": "PASS"
  },
  "repair_required_flags": [],
  "controlled_failure_reasons": []
}
```

---

# 12. FINAL OUTPUT SCHEMA

Emit final JSON only.

```json
{
  "exposure_profile_forensic_ledger": {
    "phase_id": "P6_target_exposure_profile_REGISTRY_LEDGER",
    "runtime_registry_refs": [],
    "input_manifest": {},
    "registry_manifest": {},
    "routing_packet_summary": {},
    "model_trigger_adjudication_summary": {},
    "model_row_evaluation_summary": {},
    "operator_challenge_result": {},
    "terminal_gates_and_lock_status": {},
    "limitations": []
  },
  "registry_evaluation_trace": {
    "registry_row_inventory": [],
    "trigger_candidate_packets": [],
    "registry_signal_trigger_decisions": [],
    "evidence_binding_records": [],
    "registry_row_evaluations": [],
    "challenge_repairs": [],
    "repair_trace": []
  },
  "target_exposure_profile": {
    "target_ref": {},
    "registry_version_ref": {},
    "target_exposure_profile_status": "LOCKED",
    "registry_ledger": [],
    "supported_exposure_rows": [],
    "controlled_or_mitigated_rows": [],
    "insufficient_evidence_rows": [],
    "not_visible_after_targeted_search_rows": [],
    "access_failed_rows": [],
    "review_required_rows": [],
    "archetype_exposure_map": {},
    "surface_exposure_map": {},
    "subcat_exposure_map": {},
    "legal_governance_control_map": {},
    "data_provenance_control_map": {},
    "absence_evidence_map": {},
    "operator_challenge_result": {},
    "evidence": {},
    "limitations": [],
    "terminal_lock_status": "LOCKED"
  }
}
```

## Final Output Rule

Do not add narrative outside the JSON object.

Do not add legal advice.

Do not add final report prose.

Do not drop rows.

Do not mutate registry metadata.

Do not let deterministic systems control model intelligence.

---

# 13. LOCKED BUILD SUMMARY

```text
PHASE 06 CANONICAL STRUCTURE — LOCKED
FD6.001–FD6.060 — LOCKED
SV6.001–SV6.010 — LOCKED
RS6.001–RS6.006 — LOCKED
OCG6.001–OCG6.018 — LOCKED
TG6.001–TG6.016 — LOCKED
MODEL-LED REGISTRY INTELLIGENCE DOCTRINE — LOCKED
FULL 98-ROW LEDGER — MANDATORY
LEGAL VERDICT — 0%
```
