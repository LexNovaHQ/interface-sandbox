# MODULE XII — BATCH VALIDATION MODE
## Agent 5 / M12-BATCH

<phase_call_card>
phase_id: M12_BATCH_VALIDATION
module_id: M12
module_name: BATCH_REGISTRY_CHALLENGE_GATE
active_phase_only: true
active_agent: agent_5_exposure_registry
canonical_output_pattern: exposure_registry_batch_validation__{GROUP}__{NNN}

execution_rule:
  Execute M12 batch validation only.
  Validate one active M11 batch ledger supplied by the backend.
  Do not create new source evidence.
  Do not rewrite the M11 batch ledger.
  Do not emit global challenge output.
  Do not emit compiler, renderer, report, or final handoff output.

required_inputs:
  - exposure_registry_route_plan
  - active m11_batch_registry_ledger
  - expected_threat_ids[] for the active batch
  - AI_THREAT_REGISTRY.yaml row metadata for the active batch
  - 03_REGISTRY_EVALUATION_RULES.yaml
  - legal_cartography_index consumption trace where supplied
  - upstream limitation context where supplied

required_machine_output:
  - exposure_registry_batch_validation__{GROUP}__{NNN}

forbidden_outputs:
  - m11_batch_registry_ledger
  - exposure_registry_batch__{GROUP}__{NNN}
  - exposure_registry_workpad_98
  - exposure_registry_controlled_profile
  - exposure_registry_triggered_profile
  - exposure_registry_profile_forensics
  - challenge_gate
  - final_output_handoff
  - renderer_payload
  - report prose

stop_condition:
  Stop after emitting the batch validation object for the active batch.
</phase_call_card>

## M12B.S1 — Function

`M12B.S1.C1` M12 batch validation is a challenge-only gate for one M11 batch.

`M12B.S1.C2` It validates shape, custody, row identity, Threat_ID coverage, forbidden output leakage, and obvious false-green or undertrigger risk within the active batch.

`M12B.S1.C3` It must not create new registry findings, new evidence, new statuses, or repaired batch rows. It may only pass, pass with limitation, or require repair of the active batch.

## M12B.S2 — Required Checks

The validator must check:

1. returned_threat_ids[] equals backend expected_threat_ids[] exactly.
2. batch_registry_ledger[] has exactly one row per expected Threat_ID.
3. No missing, duplicate, grouped, composite, category, or unexpected Threat_ID appears.
4. Every returned row contains the seven locked material fields plus Threat_ID and trigger_status where required by the M11 batch contract.
5. UNI rows in the batch were not treated as not-applicable.
6. basis_proof does not rely only on M9 titles, route labels, headings, source labels, or summaries unless the row is about document presence, absence, navigation, custody, or limitation.
7. Row limitations are row-specific where evidence is weak, missing, gated, access-failed, or controlled.
8. The M11 batch output did not emit final material profiles, workpad, forensics, global challenge, compiler, renderer, or report output.

## M12B.S3 — Output Contract

Return exactly one JSON root:

```json
{
  "exposure_registry_batch_validation": {
    "batch_id": "GROUP__NNN",
    "batch_group": "GROUP",
    "status": "PASS | PASS_WITH_LIMITATION | REPAIR_REQUIRED | CONTROLLED_FAILURE",
    "validation_owner": "agent_5_exposure_registry:M12_BATCH_VALIDATION",
    "semantic_m12_validation_status": "PASS | PASS_WITH_LIMITATION | REPAIR_REQUIRED | CONTROLLED_FAILURE",
    "expected_threat_ids": [],
    "validated_threat_ids": [],
    "shape_checks": {},
    "challenge_checks": {},
    "findings": [],
    "repair_directives": [],
    "limitations": []
  }
}
```

`M12B.S3.C1` The backend persists this object under exposure_registry_batch_validation__{GROUP}__{NNN}.

`M12B.S3.C2` A batch may become an accepted exposure_registry_batch__{GROUP}__{NNN} artifact only if this validation status is PASS or PASS_WITH_LIMITATION.
