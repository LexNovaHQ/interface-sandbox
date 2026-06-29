# M11_C_BATCH_EVALUATION

## PURPOSE
Evaluate only the active M11 batch supplied in `RUNTIME_PACKET.upstream_artifacts.m11_batch_packet`.

This is a slim batch phase. Do not evaluate rows outside the active batch. Do not rebuild the route plan. Do not merge the workpad. Do not emit controlled/triggered profiles. Do not emit forensics. Do not emit the challenge gate.

## REQUIRED INPUT
The backend supplies:
- `m11_batch_packet.batch_id`
- `m11_batch_packet.expected_threat_ids`
- `m11_batch_packet.registry_rows[]`
- parsed Hunter Trigger material for those rows
- selected M9 legal-cartography rows for those rows
- M9-guided full lossless legal/governance sections or parts for those rows
- closest relevant full lossless legal/governance sections or parts when M9 is silent or thin
- backend full-evidence access manifest showing which locked legal/governance lossless packages remain available to the backend

## EVIDENCE RULE
Use M9-guided full lossless units first.
Use M9 legal cartography as the mandatory navigation layer where available. M9 silence is not evidence absence.
If M9 is silent, use the backend-supplied closest relevant full lossless legal/governance sections or parts.
If the supplied lossless evidence is insufficient, do not fabricate a trigger. Return CONTROLLED with a limitation and identify the missing evidence route in `row_limitations`.

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
    "batch_registry_ledger": []
  }
}
```

## ROW SHAPE
Each row in `batch_registry_ledger[]` must have exactly these keys plus `Threat_ID` and optional `trigger_status`:

```json
{
  "Threat_ID": "",
  "trigger_status": "",
  "registry_exposure": "",
  "target_match": "",
  "evaluation_status": "TRIGGERED | CONTROLLED",
  "basis_proof": "",
  "impact_priority": "",
  "review_route": "",
  "row_limitations": ""
}
```

## HARD RULES
- Return one row per `expected_threat_ids` item.
- Do not group Threat_IDs.
- Do not add extra keys.
- Final material `evaluation_status` must be only `TRIGGERED` or `CONTROLLED`.
- Evidence gaps, unclear public evidence, gated pages, thin evidence, or insufficient full lossless units are controlled limitations, not hallucination permission.
