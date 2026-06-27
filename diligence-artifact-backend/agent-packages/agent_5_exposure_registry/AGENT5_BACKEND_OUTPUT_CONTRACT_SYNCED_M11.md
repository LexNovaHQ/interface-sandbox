# AGENT5_BACKEND_OUTPUT_CONTRACT_SYNCED_M11
## Backend Output Contract — Batched M11 / Split Material / Deterministic System

---

# CONTRACT LOCK

`A5.M11.CONTRACT.C1` This file governs Agent 5 / M11 backend output boundaries.

`A5.M11.CONTRACT.C2` This contract is subordinate to the runtime controller and the locked `M11_EXPOSURE_REGISTRY.md` prompt. It controls machine output shape, backend save order, artifact boundaries, and forbidden compatibility aliases for Agent 5.

`A5.M11.CONTRACT.C3` Agent 5 no longer owns a single combined material artifact. The old production root `exposure_registry_profile` is retired.

`A5.M11.CONTRACT.C4` Agent 5 production output is phased. Each boundary emits or saves exactly one declared artifact family.

---

# SECTION 1 — AGENT AND PHASE IDENTITY

```yaml
active_agent_id: agent_5_exposure_registry
active_agent_name: Interface Exposure Registry Agent
active_phase_scope: M11_EXPOSURE_REGISTRY
allowed_modules:
  - M11_EXPOSURE_REGISTRY
phase_lock: M11_EXPOSURE_REGISTRY
```

Agent 5 may read Agent 1, Agent 2B/M9, Agent 3, Agent 4, registry-reference, and its own prior M11 artifacts only as authorized by the runtime binding packet and backend phase contracts. Agent 5 may not mutate upstream artifacts.

---

# SECTION 2 — REQUIRED INPUTS

Agent 5 must receive or load these upstream artifacts/references before M11 execution:

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

`A5.M11.CONTRACT.C5` M9 / Agent 2B is the sole builder of `legal_cartography_index`. Agent 5 consumes the saved M9 artifact for legal/governance navigation only.

`A5.M11.CONTRACT.C6` Agent 5 must not create, rebuild, reinterpret as a new artifact, mutate, save, or replace any legal-cartography object.

`A5.M11.CONTRACT.C7` Legal/governance proof must bind to admitted lossless text, locked upstream proof, or a formal absence/access limitation. M9 titles, route labels, document headings, and locator rows are navigation/custody only unless the registry row is specifically about presence/absence/navigation/limitation.

---

# SECTION 3 — PHASE A ROUTE PLAN OUTPUT CONTRACT

Phase A is deterministic backend work. It saves exactly:

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

`A5.M11.CONTRACT.C8` Route plan rows must account for all 98 active Threat_IDs exactly once.

`A5.M11.CONTRACT.C9` UNI rows must be evaluation-routed. Non-UNI inactive rows may be deterministic not-applicable only if no UNI/archetype/surface route applies.

---

# SECTION 4 — PHASE B M11 BATCH MODEL OUTPUT CONTRACT

Each M11 model call evaluates one active batch only and returns exactly:

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

`A5.M11.CONTRACT.C10` `returned_threat_ids[]` must equal `expected_threat_ids[]` exactly.

`A5.M11.CONTRACT.C11` `batch_registry_ledger[]` must contain exactly one row per expected Threat_ID and no unexpected, duplicate, grouped, composite, or category rows.

`A5.M11.CONTRACT.C12` A batch ledger is not an accepted artifact until backend mechanical validation and paired M12 batch validation allow acceptance.

M12 batch validation is Agent 5-owned. The backend persists the M12 semantic output under exposure_registry_batch_validation__{GROUP}__{NNN}. Accepted batch save is forbidden unless semantic M12 status is PASS or PASS_WITH_LIMITATION.

---

# SECTION 5 — PHASE B2 M12 BATCH VALIDATION + ACCEPTED BATCH SAVE

M12 batch validation writes exactly:

```text
exposure_registry_batch_validation__{GROUP}__{NNN}
```

The backend saves the accepted M11 batch artifact exactly:

```text
exposure_registry_batch__{GROUP}__{NNN}
```

only after paired M12 batch validation returns PASS or PASS_WITH_LIMITATION.

`A5.M11.CONTRACT.C13` The M11 model must not emit or simulate M12 batch validation.

`A5.M11.CONTRACT.C14` The M11 model must not claim that a batch was saved or accepted.

---

# SECTION 6 — PHASE C CANONICAL WORKPAD OUTPUT CONTRACT

Phase C is deterministic backend work. It saves exactly:

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

`A5.M11.CONTRACT.C15` `registry_rows[]` must contain exactly 98 active Threat_ID outcomes.

`A5.M11.CONTRACT.C16` Every model-routed row must trace to an accepted M11 batch artifact and paired M12 batch validation artifact.

---

# SECTION 7 — PHASE D CONTROLLED MATERIAL OUTPUT CONTRACT

Phase D is deterministic backend work. It saves exactly:

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

`A5.M11.CONTRACT.C17` `exposure_registry_controlled_profile` may contain no top-level key except `controlled_rows`.

`A5.M11.CONTRACT.C18` Every controlled row must have `evaluation_status: CONTROLLED` and exactly the seven locked material fields.

---

# SECTION 8 — PHASE E TRIGGERED MATERIAL OUTPUT CONTRACT

Phase E is deterministic backend work. It saves exactly:

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

`A5.M11.CONTRACT.C19` `exposure_registry_triggered_profile` may contain no top-level key except `triggered_rows`.

`A5.M11.CONTRACT.C20` Every triggered row must have `evaluation_status: TRIGGERED` and exactly the seven locked material fields.

---

# SECTION 9 — PHASE F FORENSIC OUTPUT CONTRACT

Phase F is deterministic backend work. It saves exactly:

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

The forensic artifact must prove:

```text
98/98 active registry rows loaded
98/98 active registry rows accounted exactly once
22/22 LEP selector rows accounted
all UNI rows evaluation-routed
all model-routed rows have accepted batch + M12 validation
all final CONTROLLED rows emitted in controlled profile
all final TRIGGERED rows emitted in triggered profile
no duplicate emitted Threat_IDs
no wrong-status emitted rows
M9 legal_cartography_index consumed but not rebuilt
no legal/compliance/liability/verdict language leaked
```

---

# SECTION 10 — COMBINED OUTPUT AND LEGACY ALIAS PROHIBITION

The following production roots are forbidden:

```text
target_exposure_profile
target_exposure_profile_forensics
exposure_registry_profile
triggered_and_controlled_rows as combined material container
```

The following combined production output shape is forbidden:

```json
{
  "exposure_registry_controlled_profile": {},
  "exposure_registry_triggered_profile": {},
  "exposure_registry_profile_forensics": {}
}
```

Each boundary must emit/save only the active boundary artifact.

---

# SECTION 11 — SAVE ORDER

Save order is locked:

```text
1. exposure_registry_route_plan
2. for each planned batch:
   a. m11_batch_registry_ledger returned by model
   b. backend mechanical validation passes
   c. exposure_registry_batch_validation__{GROUP}__{NNN}
   d. exposure_registry_batch__{GROUP}__{NNN}
3. exposure_registry_workpad_98
4. exposure_registry_controlled_profile
5. exposure_registry_triggered_profile
6. exposure_registry_profile_forensics
7. M12 global challenge may begin
8. challenge_gate
```

If any boundary fails, repair the smallest affected boundary only.

---

# SECTION 12 - M12 GLOBAL CHALLENGE

After exposure_registry_profile_forensics is saved, M12 global emits challenge_gate. challenge_gate is the only M12 global backend artifact. Compiler may proceed only if challenge_gate.lock_status is PASS or PASS_WITH_LIMITATION.
