# BACKEND CANONICAL OUTPUT ADAPTER — AGENT 5 / M11

## Package-Scoped Semantic Boundary

## ADAPTER VERSION

```text
AGENT5_PACKAGE_SCOPED_OUTPUT_ADAPTER_v1
```

This adapter separates the model response boundary from backend-produced Phase 10 artifacts.

## MODEL OUTPUT AUTHORITY

For normal semantic evaluation and repair, the model may return exactly one root:

```text
m11_batch_registry_ledger
```

No other top-level key is permitted.

The root must follow `M11_PACKAGE_SCOPED_SEMANTIC_LEDGER_v1` and echo the active packet’s immutable batch metadata.

## MODEL OUTPUT SHAPE

```json
{
  "m11_batch_registry_ledger": {
    "semantic_contract_version": "M11_PACKAGE_SCOPED_SEMANTIC_LEDGER_v1",
    "batch_id": "",
    "batch_group": "",
    "stream_id": "",
    "stream_type": "PRIMARY | OVERLAY",
    "package_id": "",
    "source_domain": "",
    "expected_threat_ids": [],
    "returned_threat_ids": [],
    "m9_legal_cartography_consumed": true,
    "batch_registry_ledger": []
  }
}
```

A repair response may additionally include:

```text
repair_contract_version
repair_attempted
repair_result
```

inside the same root.

## MODEL ROW AUTHORITY

Model rows contain canonical `Threat_ID` plus semantic evidence-application fields only.

The model must not emit `registry_row_key`, deterministic registry spine fields, package routing fields, final status, or profile placement.

The backend maps canonical Threat IDs to deterministic compound row keys within the single package-scoped batch.

## BACKEND-ONLY ARTIFACTS

The following are backend artifacts and are forbidden as model output roots:

```text
active_threat_registry_manifest
exposure_registry_route_plan
exposure_registry_batch_validation
exposure_registry_workpad_98
exposure_registry_controlled_profile
exposure_registry_triggered_profile
exposure_registry_profile_forensics
challenge_gate
```

The backend may persist dynamic artifacts as:

```text
exposure_registry_batch_validation__{batch_id}
exposure_registry_batch__{batch_id}
```

`batch_id` already contains stream, package, archetype group, and sequence identity.

## BACKEND ARTIFACT ORDER

After the CO-8 runtime cutover, backend custody order is:

```text
1. active_threat_registry_manifest
2. exposure_registry_route_plan
3. for each planned batch:
   a. model m11_batch_registry_ledger response
   b. exposure_registry_batch_validation__{batch_id}
   c. exposure_registry_batch__{batch_id}
4. exposure_registry_workpad_98
5. exposure_registry_controlled_profile
6. exposure_registry_triggered_profile
7. exposure_registry_profile_forensics
```

The stable workpad artifact name does not impose a fixed row count.

## LEGAL CARTOGRAPHY RULE

`legal_cartography_index` is consumed as the saved navigation artifact. Agent 5 must not output, rebuild, mutate, rename, or replace legal cartography.

Legal/governance source selection may appear only as evidence-consumption trace inside packets, accepted rows, workpad trace, or forensics.

## RETIRED AND FORBIDDEN ROOTS

```text
exposure_registry_profile
target_exposure_profile
target_exposure_profile_forensics
triggered_and_controlled_rows
controlled_exposure_rows
material_exposure_findings
exposure_summary
registry_coverage_matrix
activity_to_exposure_matrix
data_asset_to_exposure_matrix
legal_control_to_exposure_matrix
review_priority_register
operator_challenge_gate
final_output_handoff
renderer_payload
```

## STOP RULE

The model stops after the single semantic ledger root. It must not simulate save state, validation, workpad merge, profile projection, forensics, global challenge, compiler, renderer, terminal receipt, or compatibility wrapper.