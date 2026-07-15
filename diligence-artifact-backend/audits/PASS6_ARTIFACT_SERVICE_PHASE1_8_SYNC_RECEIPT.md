# Pass 6 Receipt — Artifact Service Phase 1–8 Sync

Branch: `phase1-8-central-runtime-integration`
Scope: Full audit and repair of `src/runtime/services/artifacts.service.js` against active Phase 1–8 central runtime contracts.

## Audit Finding

Before Pass 6, `artifacts.service.js` still contained old DAP assumptions:

```txt
old data_provenance_profile save gate
old data_provenance_profile_forensics save gate
old extended DAP/4B sidecar generation path
exposure route plan gated on old DAP artifacts
stale forensics set included old data_provenance_profile_forensics
```

That was inconsistent with the Pass 3–5 Phase 7/8 cutover.

## File Patched

```txt
src/runtime/services/artifacts.service.js
```

## Active Phase 1–8 Gate Chain After Pass 6

The artifact service now enforces this save/lock chain:

```txt
deduped_url_manifest
→ source_family_index
→ source_discovery_handoff
→ legal_cartography_index
→ legal_signal_derivation_profile
→ target_profile
→ target_profile_forensics
→ feature_candidate_inventory
→ target_feature_profile
→ target_feature_profile_forensics
→ dap_registry_manifest
→ dap_strategic_derivation_matrix
→ data_privacy_navigation_index
→ dap_semantic_batch_route_manifest
→ 17 dap_semantic_batch_validation__DAP-SEM-BATCH-xx artifacts
→ 17 dap_semantic_batch_*_artifact files
→ dap_semantic_batch_validation_manifest
→ data_provenance_profile_semantic_batch_gate
→ dap_forensics_profile
→ exposure_registry_route_plan
```

## Old DAP/4B/4C Path Removed From Artifact Service

Removed from active artifact service behavior:

```txt
buildExtendedDapIndiaReadinessProfile import
buildExtendedDataReadinessSidecarNonblocking(...)
extended_dap_india_readiness_profile sidecar writes
AGENT_4B_EXTENDED_DAP_INDIA_READINESS sidecar phase metadata
data_provenance_profile save/lock gate
data_provenance_profile_forensics save/lock gate
```

Old artifact names may still exist in artifact-permission legacy/archive lists, but they are no longer artifact-service runtime gates.

## Phase 7 Enforcement

The artifact service now recognizes:

```txt
PHASE7_DAP_BATCH_ARTIFACT_PATTERN
PHASE7_DAP_BATCH_VALIDATION_ARTIFACT_PATTERN
```

It enforces:

```txt
dap_registry_manifest requires accepted target_feature_profile_forensics
dap_strategic_derivation_matrix requires dap_registry_manifest
data_privacy_navigation_index requires dap_registry_manifest + dap_strategic_derivation_matrix + accepted activity forensics
dap_semantic_batch_route_manifest requires accepted data_privacy_navigation_index
each dap_semantic_batch_validation__DAP-SEM-BATCH-xx requires dap_semantic_batch_route_manifest
each dap_semantic_batch_*_artifact requires its paired validation, resolved from the route manifest
dap_semantic_batch_validation_manifest requires all 17 planned DAP batches and validations
data_provenance_profile_semantic_batch_gate requires accepted validation manifest and all 17 planned DAP batches/validations
```

## Phase 8 Enforcement

`dap_forensics_profile` now requires:

```txt
data_privacy_navigation_index
dap_semantic_batch_route_manifest
all 17 planned DAP batches
all 17 paired DAP validations
dap_semantic_batch_validation_manifest
data_provenance_profile_semantic_batch_gate accepted
```

The DAP stale-forensics check now validates:

```txt
forensic_contract.contract_name === DAP_SEMANTIC_BATCH_FORENSICS_CONTRACT_V1
model_generated_forensics_allowed === false
old_m10_forensics_reused === false
four_b_four_c_reused === false
material_profile_trace_index is array
field_trace_index is array
forensic_lock_gate_result exists
```

## Exposure Gate Updated

`exposure_registry_route_plan` now requires:

```txt
dap_forensics_profile saved
dap_forensics_profile accepted
```

It no longer requires:

```txt
data_provenance_profile
data_provenance_profile_forensics
extended_dap_india_readiness_profile
integrated_dap_report
```

## Important Boundary

This pass did not archive root files and did not internalize Phase 2–6 root helper bridges.

The temporary bridge import remains only for target/activity deterministic forensic stale checks:

```txt
../../deterministic-profile-forensics.js
```

That is allowed until the later Phase 2–6 helper-internalization pass.

## Validation Status

This was GitHub-side surgery only. Local syntax/runtime validation has not been run.

Next required pass:

```txt
Pass 7 — Add hard validators for Phase 1–8 contracts, dispatch, artifacts, and old DAP removal.
```
