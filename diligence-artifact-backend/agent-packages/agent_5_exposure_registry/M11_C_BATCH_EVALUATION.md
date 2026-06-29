# M11_C_BATCH_EVALUATION

## PURPOSE
Evaluate only the active M11 batch supplied in `RUNTIME_PACKET.upstream_artifacts.m11_batch_packet`.

This is a slim semantic batch phase. Do not evaluate rows outside the active batch. Do not rebuild the route plan. Do not merge the workpad. Do not emit controlled/triggered profiles. Do not emit forensics. Do not emit the challenge gate.

## REQUIRED INPUT
The backend supplies:
- `m11_batch_packet.batch_id`
- `m11_batch_packet.expected_threat_ids`
- `m11_batch_packet.registry_rows[]`
- backend-prefilled deterministic registry spine for each expected row
- parsed Hunter Trigger material for those rows
- selected M9 legal-cartography rows for those rows
- M9-guided full lossless legal/governance sections or parts for those rows
- closest relevant full lossless legal/governance sections or parts when M9 is silent or thin
- backend full-evidence access manifest showing which locked legal/governance lossless packages remain available to the backend

## SEMANTIC ROLE
The M11 model does not author the full material row from scratch.

The backend owns deterministic registry spine fields including Threat_ID, Archetype, Subcategory, Surface, authority anchors, pain fields, legal pain, base registry FP mechanism, remediation source, route reason, batch membership, and final status assignment.

The M11 model owns only active-batch evidence application:
- target_match
- basis_proof
- control_exclusion_evaluation
- evidence_source_basis
- applied_fp_mechanism
- row_limitations
- status_inputs

Do not rewrite deterministic registry spine fields. Do not choose final material profile placement.

## EVIDENCE RULE
Use M9-guided full lossless units first.
Use M9 legal cartography as the mandatory navigation layer where available. M9 silence is not evidence absence.
If M9 is silent, use the backend-supplied closest relevant full lossless legal/governance sections or parts.
If the supplied lossless evidence is insufficient, do not fabricate a trigger. Return evidence limitation through `status_inputs` and identify the missing evidence route in `row_limitations`.

## STATUS INPUT RULE
Do not freely assign the final material status. Provide structured status inputs so the backend can derive the final status.

The status inputs must address:
- target_match_present
- hunter_conditions_met
- trigger_if_met
- exclude_if_met
- visible_control_present
- visible_control_defeats_or_reduces_exposure
- evidence_sufficient
- public_evidence_limitation
- false_positive_concern

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
Each row in `batch_registry_ledger[]` must have exactly these semantic keys plus `Threat_ID` and optional `trigger_status`:

```json
{
  "Threat_ID": "",
  "trigger_status": "",
  "target_match": "",
  "basis_proof": "",
  "control_exclusion_evaluation": "",
  "evidence_source_basis": "",
  "applied_fp_mechanism": "",
  "row_limitations": "",
  "status_inputs": {
    "target_match_present": "yes | no | partial",
    "hunter_conditions_met": "yes | no | partial",
    "trigger_if_met": "yes | no | partial",
    "exclude_if_met": "yes | no | partial",
    "visible_control_present": "yes | no | partial",
    "visible_control_defeats_or_reduces_exposure": "yes | no | partial",
    "evidence_sufficient": "yes | no | partial",
    "public_evidence_limitation": "yes | no | partial",
    "false_positive_concern": "yes | no | partial"
  }
}
```

## HARD RULES
- Return one row per `expected_threat_ids` item.
- Do not group Threat_IDs.
- Do not add deterministic registry spine fields to the model row.
- Do not add final material profile containers.
- Do not assign final material profile placement.
- Do not treat surface as a route basis.
- Evidence gaps, unclear public evidence, gated pages, thin evidence, or insufficient full lossless units are limitations, not hallucination permission.
