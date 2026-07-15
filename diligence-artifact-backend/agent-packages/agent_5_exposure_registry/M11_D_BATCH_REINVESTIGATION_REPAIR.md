# M11_D_BATCH_REINVESTIGATION_REPAIR

## PURPOSE

Perform one targeted repair pass for the same package-scoped semantic batch after backend validation identifies a repairable output defect.

This is not a new evaluation phase. Package, stream, route, batch membership, packet size, and deterministic row material are immutable.

## CONTRACT VERSION

`M11_PACKAGE_SCOPED_SEMANTIC_REPAIR_v1`

## INPUTS

The backend supplies:

- `m11_batch_packet`
- `m11_batch_registry_ledger`
- `backend_structural_validation`
- `m12_batch_validation`
- `repair_context`

The repair context identifies the affected canonical `Threat_ID` values, fields, and failure reasons.

## IMMUTABLE BATCH IDENTITY

Preserve exactly:

- `batch_id`
- `batch_group`
- `stream_id`
- `stream_type`
- `package_id`
- `source_domain`
- `expected_threat_ids[]`

Do not emit or modify `registry_row_key`. Do not alter canonical Threat IDs. Do not add a row from another package, stream, group, or batch.

## REPAIR DUTY

Re-read the supplied registry row, parsed Hunter Trigger, admitted evidence, navigation selections, and recorded index-gap primary-evidence navigation for each identified row.

Repair only these semantic fields:

- `target_match`
- `basis_proof`
- `control_exclusion_evaluation`
- `evidence_source_basis`
- `applied_fp_mechanism`
- `row_limitations`
- `status_inputs`

Do not alter deterministic spine fields, route reason, classification, activity references, package metadata, or final material status.

## FULL-LEDGER RETURN RULE

Return the complete semantic ledger for every expected Threat ID, not only the repaired subset.

- Preserve unaffected rows unless a mechanical schema correction is required.
- Return one row per expected Threat ID.
- Preserve expected order.
- Return no unexpected row.
- Do not group rows.
- Do not return a partial ledger.

Where evidence remains thin, gated, ambiguous, or unavailable, retain a precise limitation and conservative `yes | no | partial` status inputs. Structural identity, exact coverage, root, and schema failures remain blocking.

## OUTPUT ROOT

Return exactly:

```json
{
  "m11_batch_registry_ledger": {
    "semantic_contract_version": "M11_PACKAGE_SCOPED_SEMANTIC_LEDGER_v1",
    "repair_contract_version": "M11_PACKAGE_SCOPED_SEMANTIC_REPAIR_v1",
    "batch_id": "",
    "batch_group": "",
    "stream_id": "",
    "stream_type": "PRIMARY | OVERLAY",
    "package_id": "",
    "source_domain": "",
    "expected_threat_ids": [],
    "returned_threat_ids": [],
    "m9_legal_cartography_consumed": true,
    "repair_attempted": true,
    "repair_result": "REPAIRED | SAME_RESULT_WITH_LIMITATION",
    "batch_registry_ledger": []
  }
}
```

Rows must use the exact semantic row shape in `M11_C_BATCH_EVALUATION.md`.

## FORBIDDEN ACTIONS

Do not create or remove rows, change package or stream identity, emit deterministic row fields, emit `evaluation_status`, assign profile placement, simulate acceptance, save artifacts, or emit downstream outputs.

Stop after the corrected complete semantic ledger.