# 00_VALIDATOR_RULES_INTEGRATED_AGENT5_SYNCED
## Agent 5 / M11 Batched Exposure Registry Validator Contract

---

# VALIDATOR LOCK

`A5.VAL.C1` This validator governs Agent 5 / M11 package execution after the batched deterministic M11 prompt upgrade.

`A5.VAL.C2` It validates package-level contracts. Backend structural validators will later enforce these rules mechanically.

`A5.VAL.C3` If this validator conflicts with `M11_EXPOSURE_REGISTRY.md`, the stricter custody, no-scope-drift, no-legal-advice, no-forensic-clumping, and boundary rule controls.

---

# SECTION 1 — REQUIRED INPUT AND ACCESS GATES

`A5.VAL.S1.C1` Validate that Agent 5 receives or can load the required upstream artifacts:

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
```

`A5.VAL.S1.C2` Validate that Agent 5 receives or can load the required registry references:

```text
AI_THREAT_REGISTRY.yaml
REGISTRY_KEY_v3_0.md
03_REGISTRY_EVALUATION_RULES.yaml
FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml
FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml
```

`A5.VAL.S1.C3` Validate that Agent 5 does not mutate, overwrite, regenerate, repair, or backfill any M6, M9, M7, M8, or M10 upstream artifact.

`A5.VAL.S1.C4` Missing `data_provenance_profile_forensics` is a full-sync defect unless the active M11 boundary has a row-scoped controlled limitation expressly permitted by the prompt.

---

# SECTION 2 — M9 LEGAL CARTOGRAPHY CONSUMPTION GATE

`A5.VAL.S2.C1` Validate that `legal_cartography_index` is consumed as the saved M9 artifact.

`A5.VAL.S2.C2` Reject any Agent 5 output that builds, rebuilds, saves, mutates, replaces, or renames legal cartography.

`A5.VAL.S2.C3` Validate that legal/governance evidence use follows M9 navigation discipline:

```text
legal_cartography_index -> locator/custody/coverage/missing-state
lossless L1-L6 or locked upstream proof -> evidentiary proof
```

`A5.VAL.S2.C4` Reject proof based only on document titles, route labels, section headings, source labels, or M9 summary rows unless the registry row is only about document presence, absence, navigation, custody, or limitation.

`A5.VAL.S2.C5` Reject blind L1-L6 bucket scanning as a substitute for M9 navigation.

---

# SECTION 3 — REGISTRY AND LEP COMPLETENESS GATE

`A5.VAL.S3.C1` Validate that expected active registry row count is 98 and loaded active registry row count is 98.

`A5.VAL.S3.C2` Validate that every active registry row contains required YAML fields, including `Threat_ID`, `Threat_Name`, `Archetype`, `Surface`, `Hunter_Trigger`, `Lex_Nova_Fix`, `FIELD21`, `FIELD22`, and `FIELD23`.

`A5.VAL.S3.C3` Validate that `FIELD21`, `FIELD22`, and `FIELD23` reconcile to `Threat_ID` decomposition.

`A5.VAL.S3.C4` Validate that every evaluation-routed row applies the row's exact `Hunter_Trigger` and `03_REGISTRY_EVALUATION_RULES.yaml`.

`A5.VAL.S3.C5` Validate 22/22 LEP selector accountability.

---

# SECTION 4 — ROUTE PLAN AND BATCH PLAN GATE

`A5.VAL.S4.C1` `exposure_registry_route_plan` must account for all 98 active Threat_IDs exactly once.

`A5.VAL.S4.C2` Every UNI row must be `EVALUATION_ROUTED` with route reason `UNI_ALWAYS_RUN`.

`A5.VAL.S4.C3` No UNI row may be `NOT_TRIGGERED_NOT_APPLICABLE`.

`A5.VAL.S4.C4` Non-UNI inactive rows may be deterministic not-applicable only if route plan shows no active archetype or surface route.

`A5.VAL.S4.C5` Every model-routed batch must contain max 8 rows.

`A5.VAL.S4.C6` Current 37-row UNI inventory must split into five UNI batches unless registry count is formally amended.

`A5.VAL.S4.C7` Reject grouped, composite, duplicate, missing, unexpected, or category Threat_ID route rows.

---

# SECTION 5 — ACTIVE BATCH MODEL OUTPUT GATE

`A5.VAL.S5.C1` M11 model batch output must have exactly one root:

```text
m11_batch_registry_ledger
```

`A5.VAL.S5.C2` Batch `returned_threat_ids[]` must match backend-provided `expected_threat_ids[]` exactly.

`A5.VAL.S5.C3` `batch_registry_ledger[]` must contain exactly one row per expected Threat_ID and no other rows.

`A5.VAL.S5.C4` Each batch row may contain `Threat_ID`, `trigger_status`, and the seven locked material fields only.

`A5.VAL.S5.C5` Batch rows must not emit final material profiles, workpad, forensics, M12 validation, challenge gate, final handoff, renderer, report prose, or terminal receipts.

---

# SECTION 6 — M12 BATCH VALIDATION / ACCEPTED BATCH GATE

`A5.VAL.S6.C1` No accepted batch artifact may exist without paired `exposure_registry_batch_validation__{GROUP}__{NNN}`.

`A5.VAL.S6.C2` No batch may enter `exposure_registry_workpad_98` unless backend mechanical validation and paired M12 batch validation passed, passed with limitation, or controlled-failed safely.

`A5.VAL.S6.C3` M11 model output must not simulate M12 batch validation or claim save/acceptance state.

---

# SECTION 7 — CANONICAL WORKPAD GATE

`A5.VAL.S7.C1` `exposure_registry_workpad_98` must contain exactly 98 active Threat_ID outcomes.

`A5.VAL.S7.C2` Every model-routed row must trace to accepted M11 batch artifact plus paired M12 batch validation artifact.

`A5.VAL.S7.C3` Deterministic not-applicable rows must be non-UNI only.

`A5.VAL.S7.C4` Reject missing, duplicate, unexpected, grouped, composite, or category Threat_ID workpad rows.

---

# SECTION 8 — SPLIT MATERIAL OUTPUT GATES

`A5.VAL.S8.C1` `exposure_registry_controlled_profile` must contain exactly one top-level key:

```text
controlled_rows
```

`A5.VAL.S8.C2` Every controlled row must contain exactly seven fields:

```text
registry_exposure
target_match
evaluation_status
basis_proof
impact_priority
review_route
row_limitations
```

`A5.VAL.S8.C3` Every controlled row must have `evaluation_status: CONTROLLED`.

`A5.VAL.S8.C4` `exposure_registry_triggered_profile` must contain exactly one top-level key:

```text
triggered_rows
```

`A5.VAL.S8.C5` Every triggered row must contain exactly the same seven fields.

`A5.VAL.S8.C6` Every triggered row must have `evaluation_status: TRIGGERED`.

`A5.VAL.S8.C7` Every final CONTROLLED workpad row must appear in `controlled_rows[]` exactly once.

`A5.VAL.S8.C8` Every final TRIGGERED workpad row must appear in `triggered_rows[]` exactly once.

`A5.VAL.S8.C9` Reject old combined material roots and containers:

```text
target_exposure_profile
target_exposure_profile_forensics
exposure_registry_profile
triggered_and_controlled_rows
controlled_exposure_rows
material_exposure_findings
exposure_summary
```

---

# SECTION 9 — FORENSIC GATE

`A5.VAL.S9.C1` `exposure_registry_profile_forensics` may be built only after route plan, accepted batches, paired batch validations, workpad, controlled profile, and triggered profile are saved.

`A5.VAL.S9.C2` Forensics must include these proof families:

```text
registry_input_manifest
full_registry_inventory_ledger
lep_selector_application_ledger
internal_registry_route_plan_ledger
trigger_review_workspace_ledger
trigger_adjudication_ledger
evidence_binding_ledger
control_exclude_evaluation_ledger
registry_row_workpad_accountability_ledger
triggered_controlled_row_assembly_ledger
emission_manifest
registry_self_check_result
registry_lock_gate_result
legal_firewall_ledger
runtime_trace_m11_only
forensic_boundary
```

`A5.VAL.S9.C3` Forensics must prove 98/98 row coverage, 22/22 LEP coverage, accepted batch + validation custody, controlled/triggered projection reconciliation, and M9 legal-cartography consumption without rebuild.

`A5.VAL.S9.C4` Forensics must not re-emit material profiles, challenge gate, final handoff, renderer payload, report prose, or terminal receipts.

---

# SECTION 10 — LEGAL / REGISTRY FIREWALL

`A5.VAL.S10.C1` Reject legal advice, legal applicability, compliance/non-compliance, illegality, liability, violation, breach, enforceability, transfer legality, security adequacy, legal-risk verdicts, risk scores, HIGH_RISK, or LOW_RISK as final findings.

`A5.VAL.S10.C2` Validate that CONTROLLED rows preserve the boundary: visible public control exists, but this does not mean compliant, sufficient, enforceable, legally adequate, solved, or risk-free.

`A5.VAL.S10.C3` Validate that TRIGGERED rows do not state illegality, breach, liability, violation, or non-compliance.

---

# SECTION 11 — LOCK AND REPAIR GATE

`A5.VAL.S11.C1` Agent 5 may lock `M11_EXPOSURE_REGISTRY` only after these saved artifacts exist:

```text
exposure_registry_route_plan
exposure_registry_workpad_98
exposure_registry_controlled_profile
exposure_registry_triggered_profile
exposure_registry_profile_forensics
```

and every model-routed batch has paired saved artifacts:

```text
exposure_registry_batch__{GROUP}__{NNN}
exposure_registry_batch_validation__{GROUP}__{NNN}
```

`A5.VAL.S11.C2` If a defect is local to one batch, repair only that batch and its M12 validation.

`A5.VAL.S11.C3` If a defect is local to route plan, workpad, controlled projection, triggered projection, or forensics, repair only that boundary.

`A5.VAL.S11.C4` If a required upstream artifact or M9 legal-cartography artifact is missing/corrupt, route to the owning upstream/backend repair. Do not invent, search, or proceed.

---

# SECTION 12 — VALIDATOR RESULT FORMAT

Validator result must be machine-compact and must not expose chain-of-thought:

```json
{
  "validator_result": {
    "active_agent_id": "agent_5_exposure_registry",
    "phase_scope": "M11_EXPOSURE_REGISTRY",
    "run_id": "",
    "status": "PASS | PASS_WITH_WARNING | PASS_WITH_LIMITATION | REINVESTIGATION_COMPLETED_WITH_LIMITATION | SOURCE_REPAIR_REQUIRED | CONTROLLED_FAILURE",
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

If status is `SOURCE_REPAIR_REQUIRED` or `CONTROLLED_FAILURE`, `lock_allowed` and `next_agent_command_allowed` must be false.
