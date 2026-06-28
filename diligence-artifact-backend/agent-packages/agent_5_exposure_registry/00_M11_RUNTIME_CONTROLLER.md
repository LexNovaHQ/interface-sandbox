# 00_M11_RUNTIME_CONTROLLER

## ROLE
This file is the mechanical controller for M11/M12 split-phase execution. It sits below `00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED_AGENT5_SYNCED.md` and does not override global runtime, evidence, no-simulation, or no-legal-advice rules.

## UNIVERSAL BLOCKING RULE
Only critical structural, routing, schema, source-integrity, or evaluation failures block a phase.
Non-critical metadata gaps, thin public evidence, unavailable public materials, and registry metadata blanks must be carried as limitations or warnings and must not stop the run.

## CHECKPOINT RULE
Every saved output artifact is a checkpoint.
If a checkpoint already exists with `LOCKED` or `LOCKED_WITH_LIMITATIONS`, the backend must reuse it unless a forced rebuild is explicitly requested by backend control state.

Checkpoint artifacts:
- `exposure_registry_route_plan`
- `exposure_registry_batch_validation__{GROUP}__{NNN}`
- `exposure_registry_batch__{GROUP}__{NNN}`
- `exposure_registry_workpad_98`
- `exposure_registry_controlled_profile`
- `exposure_registry_triggered_profile`
- `exposure_registry_profile_forensics`
- `challenge_gate`

## PHASE SEPARATION
M11 is mechanically separated into:
1. Route planning.
2. Batch packet construction.
3. Batch evaluation.
4. M12 batch validation.
5. Accepted batch save.
6. Workpad merge.
7. Controlled projection.
8. Triggered projection.
9. Forensics.
10. M12 global challenge.

A model phase must only perform the specific work assigned to its current checkpoint. It must not emit downstream artifacts early.

## BATCH EVIDENCE ACCESS RULE
Each batch receives only the active batch packet and selected legal/governance evidence excerpts.
The backend retains read access to the full locked legal/governance lossless package. The model must treat the backend legal cartography as the navigation layer for that full evidence package.
If the provided excerpts are insufficient, the model must mark the row as controlled or limited and identify the missing evidence route in `row_limitations`; it must not invent evidence.

## ARTIFACT BOUNDARY
Batch evaluation may only return `m11_batch_registry_ledger`.
M12 batch validation may only return `exposure_registry_batch_validation`.
No batch phase may emit the route plan, workpad, controlled profile, triggered profile, forensics, challenge gate, final handoff, renderer payload, or vault payload.
