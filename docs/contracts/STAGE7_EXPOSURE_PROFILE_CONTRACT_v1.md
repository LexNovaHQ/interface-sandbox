# STAGE7_EXPOSURE_PROFILE_CONTRACT_v1

Status: LOCKED CONTRACT.

## Purpose

Stage 7 produces the Exposure Profile. The Registry Ledger is the main artifact of the Exposure Profile. It is not a side appendix and must not be replaced by a summary-only exposure object.

## Canonical handoff

Stage 7 handoff key: `exposure_profile`.

Required top-level shape:

```json
{
  "profile_version": "exposure_profile_v1",
  "artifact_type": "stage7_exposure_profile",
  "registry_ledger": [],
  "ledger_summary": {},
  "routing_summary": {},
  "exposure_findings": [],
  "remediation_map": [],
  "evidence_coverage_manifest": [],
  "forensic_appendix_indexes": {},
  "limitations": []
}
```

## Registry Ledger rule

`registry_ledger` is the canonical merged registry ledger after deterministic rows, model rows, coverage validation, and any operator-challenge correction handoff later in the pipeline.

The ledger remains row-level, registry-key aligned, and threat-ID complete. Stage 9 uses it to build the exposure table, remediation table, appendix, and forensic explanations.

## What Exposure Profile may wrap

The profile may wrap these native Stage 7 fields:

- merged registry ledger
- route records
- active archetypes and active surfaces used for routing
- deterministic NOT_APPLICABLE rows
- model-evaluated rows
- batch summaries and model metadata summaries
- coverage/merge validation result
- routing summary
- evidence coverage manifest when Stage 7 evidence-safety mode is implemented
- limitations and warnings

## What Exposure Profile must not do

- It must not hide the registry ledger behind a short executive summary.
- It must not delete row-level ledger evidence.
- It must not downgrade the registry ledger into a mere appendix.
- It must not create legal advice or final counsel conclusions.
- It must not invent Stage 5/6 facts missing from upstream profiles.

## Token-safety doctrine for later build

Deterministic evidence packaging may organise Stage 7 evidence but must not conclusively exclude evidence. If a registry row lacks a required evidence class in the packet, the row should trigger an evidence-expansion path before final `UNKNOWN` or `INSUFFICIENT_EVIDENCE` is accepted.

This token-safety expansion is a later build. This contract only locks the canonical Stage 7 handoff shape.
