# M11_D_BATCH_REINVESTIGATION_REPAIR

## PURPOSE
Perform one targeted reinvestigation/repair pass for an M11 batch when backend structural validation or M12 batch semantic validation reports `REPAIR_REQUIRED` or `CONTROLLED_FAILURE`.

This is not a new substantive evaluation phase. It is a repair loop for the same active batch checkpoint.

## INPUTS
The backend supplies:
- `m11_batch_packet`
- `m11_batch_registry_ledger`
- `backend_structural_validation`
- `m12_batch_validation`
- `repair_context`

## DUTY
You must reinvestigate only the rows and fields identified in the repair context.
Use M9-guided full lossless legal/governance units first. If M9 is silent or thin, use the backend-supplied closest relevant full lossless section or part. Do not invent evidence.

## REPAIR RULE
If the prior output has a concrete repairable error, repair the affected row(s) and return a corrected `m11_batch_registry_ledger`.

After one targeted reinvestigation, any remaining non-structural uncertainty, semantic validation concern, evidence thinness, public-source limitation, or field-level validation concern must be carried as a warning/limitation. Do not block unless the repaired batch output remains structurally invalid or unusable.

## OUTPUT ROOT
Return exactly one JSON root:

```json
{
  "m11_batch_registry_ledger": {
    "batch_id": "",
    "batch_group": "",
    "expected_threat_ids": [],
    "returned_threat_ids": [],
    "m9_legal_cartography_consumed": true,
    "repair_attempted": true,
    "repair_result": "REPAIRED | SAME_RESULT_WITH_WARNING",
    "batch_registry_ledger": []
  }
}
```

## HARD RULES

* Do not add rows outside the active batch.
* Do not remove expected Threat_IDs.
* Do not group Threat_IDs.
* Do not emit downstream artifacts.
* Keep repaired rows in the semantic evidence-application shape only; backend derives final material status and profile placement.
* After one targeted reinvestigation, any remaining non-structural uncertainty, semantic validation concern, evidence thinness, public-source limitation, or field-level validation concern must be carried as a warning/limitation. Do not block unless the repaired batch output remains structurally invalid or unusable.
