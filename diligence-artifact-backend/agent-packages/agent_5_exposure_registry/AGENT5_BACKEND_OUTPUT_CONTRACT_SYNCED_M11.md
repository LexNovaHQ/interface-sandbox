# AGENT5_BACKEND_OUTPUT_CONTRACT_SYNCED_M11
## Backend Output Contract for Interface Exposure Registry Agent

---

# CONTRACT LOCK

`A5.M11.CONTRACT.C1` This file governs the backend output contract for Agent 5 / M11 Exposure Registry.

`A5.M11.CONTRACT.C2` This contract is subordinate to `00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md` and the locked M11 module prompt, but it controls machine output shape, backend save order, and split artifact boundaries for Agent 5.

`A5.M11.CONTRACT.C3` Agent 5 owns exactly two artifacts:

```text
target_exposure_profile
target_exposure_profile_forensics
```

`A5.M11.CONTRACT.C4` Agent 5 must not emit both artifacts in one production backend response.

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

Agent 5 may read Agent 1, Agent 3, and Agent 4 locked artifacts only. Agent 5 may not mutate any upstream artifact.

---

# SECTION 2 — REQUIRED INPUTS

Agent 5 must receive or load the following before M11 material derivation:

```text
source_discovery_handoff
source_discovery_handoff.bucket_family_index.legal_governance_profile_urls.families
lossless_family__L1_CORE_TERMS_PRIVACY
lossless_family__L2_B2B_CONTRACTING
lossless_family__L3_AI_USAGE_GOVERNANCE
lossless_family__L4_PRIVACY_ADJACENT_NOTICES
lossless_family__L5_LEGAL_HUB_HOSTED
lossless_family__L6_ENTITY_NOTICE
legal_cartography_index
target_profile
target_profile_forensics
target_feature_profile
target_feature_profile_forensics
target_data_provenance_profile
target_data_provenance_profile_forensics
AI_THREAT_REGISTRY.yaml
REGISTRY_KEY_v3_0.md
03_REGISTRY_EVALUATION_RULES.yaml
FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml
FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml
```

If the Agent 1 source universe, legal/governance lossless bucket custody, registry authority, or LEP authority is missing/corrupt, Agent 5 must return `SOURCE_REPAIR_REQUIRED` or `CONTROLLED_FAILURE` according to the locked validator and must not invent source support.

---

# SECTION 3 — PHASE B1 MATERIAL OUTPUT CONTRACT

After Phase A extraction and Phase B material derivation pass, Agent 5 must emit exactly one top-level artifact and stop:

```json
{
  "target_exposure_profile": {
    "triggered_and_controlled_rows": []
  }
}
```

`target_exposure_profile` must contain exactly one top-level key:

```text
triggered_and_controlled_rows
```

Every row inside `triggered_and_controlled_rows[]` must contain exactly seven fields:

```text
registry_exposure
target_match
evaluation_status
basis_proof
impact_priority
review_route
row_limitations
```

`evaluation_status` may contain only:

```text
TRIGGERED
CONTROLLED
```

Every final TRIGGERED row and every final CONTROLLED row from the M11 registry workpad must be emitted exactly once in `triggered_and_controlled_rows[]`.

The Phase B1 material output must not contain:

```text
target_exposure_profile_forensics
exposure_summary
material_exposure_findings
controlled_exposure_rows
absent_not_triggered_registry_rows
registry_coverage_matrix
activity_to_exposure_matrix
data_asset_to_exposure_matrix
legal_control_to_exposure_matrix
review_priority_register
operator_challenge_gate
final_output_handoff
renderer_payload
terminal receipt
report prose
phase wrapper
technical_audit_log
```

The backend runner must validate and save `target_exposure_profile` before Phase C forensic derivation begins.

---

# SECTION 4 — PHASE D FORENSIC OUTPUT CONTRACT

After saved `target_exposure_profile` exists, Phase C forensic derivation and Phase D forensic validation may run. Agent 5 must emit exactly one top-level artifact:

```json
{
  "target_exposure_profile_forensics": {
    "registry_input_manifest": [],
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
    "legal_firewall_ledger": [],
    "runtime_trace_m11_only": {},
    "forensic_boundary": {}
  }
}
```

The forensic artifact must prove:

```text
98/98 active registry rows loaded
98/98 active registry rows accounted exactly once
22/22 LEP selector rows applied
all UNI rows evaluation-routed
all final TRIGGERED rows emitted
all final CONTROLLED rows emitted
no duplicate emitted Threat_IDs
no missing triggered Threat_IDs
no missing controlled Threat_IDs
no wrong-status emitted rows
no grouped or composite Threat_ID rows
legal/governance lossless evidence projected where used
```

The Phase D forensic output must not re-emit `target_exposure_profile` and must not emit M12, M13, M14, final handoff, renderer, report, terminal receipt, or compatibility-wrapper artifacts.

---

# SECTION 5 — COMBINED OUTPUT PROHIBITION

The following production backend output shape is forbidden:

```json
{
  "target_exposure_profile": {},
  "target_exposure_profile_forensics": {}
}
```

That shape incorrectly mixes the Phase B1 material artifact and the Phase D forensic artifact into one response. It may appear only as documentation showing that Agent 5 ultimately owns two artifacts, not as an executable backend response.

---

# SECTION 6 — REPAIR AND SAVE ORDER

Agent 5 repair follows the locked targeted-reinvestigation doctrine.

If a registry row, trigger decision, control/evaluation decision, evidence path, LEP selector, emitted row, emission manifest, or forensic ledger is inadequate, unsupported, weak, thin, vague, conflicting, or wrong, Agent 5 must first run targeted Threat_ID-specific / LEP-specific / evidence-path-specific reinvestigation inside approved Agent 1 / Agent 3 / Agent 4 artifacts and legal/governance lossless buckets.

Agent 5 must not solve defects by:

```text
downgrading TRIGGERED or CONTROLLED rows
suppressing rows
grouping Threat_IDs
using category summaries
using counts instead of emitted rows
inventing evidence
mutating upstream artifacts
```

Save order:

```text
1. validate and save target_exposure_profile
2. confirm saved material artifact exists
3. derive target_exposure_profile_forensics from saved material + Module V workpad
4. validate and save target_exposure_profile_forensics
5. lock M11_EXPOSURE_REGISTRY
6. terminal receipt may be emitted only in manual/same-chat mode
```

Backend execution must return strict JSON only at each save boundary.
