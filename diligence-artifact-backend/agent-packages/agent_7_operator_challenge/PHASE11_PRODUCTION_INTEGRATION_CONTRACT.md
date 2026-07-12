# Phase 11 Production Integration Contract

Version: `PHASE11_PRODUCTION_RUNTIME_CONTRACT_v1`

## Governing doctrine

Phase 11 blocks only for deterministically confirmed critical systemic failure. Material field defects receive no more than two targeted reinvestigation attempts. A field that remains unresolved after two attempts proceeds as `PASS_WITH_LIMITATION` with an explicit warning.

## Independent artifacts

Phase 11 must persist five independent artifacts in this order:

1. `operator_challenge_inventory`
2. `operator_challenge_semantic_ledger`
3. `operator_challenge_reinvestigation_ledger`
4. `operator_challenge_dispatch_checkpoint`
5. `challenge_gate`

The compiler may treat only `challenge_gate` as authority. The inventory and ledgers remain audit and recovery artifacts.

## Mutation boundary

A reinvestigation owner may change only the exact field paths identified in the directive plus mechanically necessary status, validation, version and execution metadata. Any unrelated mutation must be rejected and the challenged canonical artifact restored from the pre-dispatch snapshot.

The owner phase may not broaden the field scope, alter unaffected rows, rerun its normal downstream chain or decide that its own output resolved the challenge.

## Durable checkpoint sequence

Every dispatch must persist these stages:

- `DISPATCH_CREATED`
- `OWNER_RUNNING`
- `OWNER_RETURNED`
- `RETURN_VALIDATED`
- `ATTEMPT_RECORDED`
- `COMPLETE`

A restarted worker must resume a matching dispatch from the latest durable checkpoint. It must not issue a duplicate model call when the challenged artifact version already advanced after `OWNER_RUNNING`.

## Lease

A run-scoped Firestore lease must bind `run_id`, `dispatch_id`, `challenge_candidate_id`, `attempt_number`, `worker_id` and expiry. A second live worker must not execute the same attempt.

## Resolution authority

An attempt is `RESOLVED` only when:

- the owning runtime completed without error;
- at least one challenged artifact version advanced;
- the mutation guard passed;
- the exact deterministic Layer 1 candidate condition disappeared from the rebuilt inventory.

Otherwise the attempt is `UNRESOLVED`.

## Phase 10 special rule

Phase 10 reinvestigation must rerun only the package-scoped batch containing the challenged `registry_row_key`. All unaffected accepted batches are reused. The workpad, controlled profile, triggered profile and domain-agnostic forensics are then rebuilt from the complete accepted-batch set.

## Final gate

- `PASS` → compiler handoff allowed.
- `PASS_WITH_LIMITATION` → compiler handoff allowed with warnings.
- `REINVESTIGATION_REQUIRED` → execute the next targeted dispatch inside Phase 11.
- `CONTROLLED_FAILURE` → block the run.

A third substantive attempt is forbidden.
