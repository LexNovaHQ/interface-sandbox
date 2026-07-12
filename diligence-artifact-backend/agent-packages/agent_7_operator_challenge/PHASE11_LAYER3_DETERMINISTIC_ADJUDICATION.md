# PHASE 11 LAYER 3 — DETERMINISTIC ADJUDICATION, REINVESTIGATION AND FINAL GATE

## Authority

Layer 3 is the only Phase 11 authority that may:

- confirm a critical failure;
- reject a semantic challenge;
- carry an advisory warning;
- issue a targeted reinvestigation directive;
- count reinvestigation attempts;
- close an unresolved field after two attempts with a warning;
- authorize compiler handoff.

The Layer 2 model is non-authoritative.

## Blocking doctrine

Blocking is exceptional.

Only a deterministically confirmed critical systemic failure may produce:

```text
CONTROLLED_FAILURE
```

A material field problem must produce:

```text
REINVESTIGATION_REQUIRED
```

This is an internal Phase 11 loop state. It is persisted with runtime lock status `CREATED`, remains on `M12`, and is not a terminal pipeline failure.

After two unsuccessful targeted attempts, the field is retained with an explicit warning and the final gate becomes:

```text
PASS_WITH_LIMITATION
```

unless an independent deterministic critical systemic failure exists.

## Deterministic dispositions

```text
CRITICAL_FAILURE
REJECTED_CHALLENGE
ADVISORY_WARNING
REINVESTIGATION_REQUIRED
RESOLVED_AFTER_REINVESTIGATION
UNRESOLVED_AFTER_REINVESTIGATION
```

## Critical systemic classes

Layer 3 may confirm critical failure only for deterministic substrate or custody failures such as:

- required artifact missing;
- required artifact unusable;
- forbidden forensic input boundary breach;
- Phase 10 compound identity custody mismatch;
- the same compound exposure row appearing in controlled and triggered profiles.

A model recommendation labelled `CRITICAL_REVIEW_CANDIDATE` is not itself a blocker.

## Reinvestigation directive

Every pending directive must identify:

```text
challenge_candidate_id
owning_phase
artifact_names[]
field_paths[]
affected_row_identity[]
problem
required_reinvestigation
attempt_number
full_phase_rerun_required: false
smallest_affected_unit_only: true
```

Allowed repair owners include:

```text
PHASE_3_DOMAIN_DERIVATION
PHASE_5_ACTIVITY_PROFILE
PHASE_7_DATA_PROVENANCE
PHASE_8_DOMAIN_CONTROL_OBLIGATION
PHASE_10_EXPOSURE_PROFILE
PHASE_2G_ROUTING
COMPILER_PRESENTATION_ONLY
```

## Attempt custody

Each returned attempt must preserve:

- candidate identity;
- owning phase;
- exact field paths;
- exact attempt sequence;
- returned artifact versions;
- result: `RESOLVED` or `UNRESOLVED`;
- deterministic validation basis.

A resolved attempt is accepted only when `validated: true`.

A third attempt is forbidden.

Malformed Layer 2 output repair is not a field reinvestigation attempt.

## Final gate statuses

```text
PASS
PASS_WITH_LIMITATION
REINVESTIGATION_REQUIRED
CONTROLLED_FAILURE
```

Runtime treatment:

```text
PASS                    -> LOCKED -> compiler
PASS_WITH_LIMITATION    -> LOCKED_WITH_LIMITATIONS -> compiler
REINVESTIGATION_REQUIRED-> CREATED -> remain on M12
CONTROLLED_FAILURE      -> CONTROLLED_FAILURE -> remain blocked on M12
```

## Canonical objects

```text
operator_challenge_inventory
operator_challenge_semantic_ledger
operator_challenge_reinvestigation_ledger
challenge_gate
```

Current storage remains the canonical `challenge_gate` artifact envelope.

## Prohibitions

Layer 3 must not:

- create new source evidence;
- inspect forensic profiles;
- rewrite upstream artifacts directly;
- broaden a field defect into a full-phase rerun without deterministic necessity;
- globally identify Phase 10 rows by raw `Threat_ID`;
- let the model choose final gate status;
- block merely because two reinvestigation attempts failed.
