# Phase 11 Production Integration Contract

Version: `PHASE11_PRODUCTION_RUNTIME_CONTRACT_v1`

## Governing doctrine

Phase 11 blocks only for deterministically confirmed critical systemic failure. Material field defects receive no more than two targeted substantive reinvestigation attempts. A field that remains unresolved after two substantive attempts proceeds as `PASS_WITH_LIMITATION` with an explicit warning.

Technical provider or infrastructure failures are not substantive attempts. They use the bounded technical-retry policy and, when still unresolved, produce a non-substantive retry receipt rather than consuming one of the two field-reinvestigation attempts.

## Independent artifacts

Phase 11 must persist five independent artifacts in this order:

1. `operator_challenge_inventory`
2. `operator_challenge_semantic_ledger`
3. `operator_challenge_reinvestigation_ledger`
4. `operator_challenge_dispatch_checkpoint`
5. `challenge_gate`

The compiler may treat only `challenge_gate` as Phase 11 authority. The inventory and ledgers remain audit and recovery artifacts.

## Mutation boundary

A reinvestigation owner may propose changes only to the exact field paths identified in the directive plus mechanically necessary status, validation, version and execution metadata. The proposal is not persisted by the owner runtime.

Phase 11 must read the current canonical artifacts, validate the proposed mutation, reject any unrelated change, and only then commit the approved targeted proposal. Any unauthorized or failed commit must leave or restore the challenged canonical artifacts to their pre-dispatch state.

The owner phase may not broaden the field scope, alter unaffected rows, rerun its normal downstream chain, lock its own phase, or decide that its own output resolved the challenge.

## Durable checkpoint sequence

Every dispatch follows the v2 attempt-safe state machine:

- `DISPATCH_CREATED`
- `OWNER_PROPOSAL_RUNNING`
- `OWNER_PROPOSAL_CREATED`
- `PROPOSAL_COMMITTED`
- `NON_SUBSTANTIVE_RETRY_REQUIRED` when a technical or non-committed outcome must not consume a substantive attempt
- `ATTEMPT_RECORDED`
- `COMPLETE`

A restarted worker must resume a matching dispatch from the latest durable checkpoint. It must not issue a duplicate owner call after a proposal has been created, and it must not reapply a proposal after a commit receipt has been persisted.

## Lease

A run-scoped Firestore lease must bind `run_id`, `dispatch_id`, `challenge_candidate_id`, `attempt_number`, `worker_id`, `lease_token` and expiry. A second live worker must not execute the same dispatch attempt. Renew and release operations require both the worker identity and lease token.

## Resolution authority

A substantive attempt is `RESOLVED` only when:

- an owner proposal was committed through the Phase 11 mutation boundary;
- at least one challenged artifact version advanced;
- the mutation guard passed;
- the exact deterministic Layer 1 candidate condition disappeared from the rebuilt inventory.

Otherwise the substantive attempt is `UNRESOLVED`.

An owner runtime failure, malformed proposal, mutation rejection, or uncommitted proposal is classified separately. It must not be recorded as a substantive field attempt merely because a dispatch occurred.

## Phase 10 special rule

Phase 10 reinvestigation must rerun only the package-scoped batch containing the challenged `registry_row_key`. All unaffected accepted batches are reused. The workpad, controlled profile, triggered profile and domain-agnostic forensics are then rebuilt from the complete accepted-batch set.

## Final gate

- `PASS` → compiler handoff allowed.
- `PASS_WITH_LIMITATION` → compiler handoff allowed with warnings.
- `REINVESTIGATION_REQUIRED` → execute the next targeted substantive dispatch inside Phase 11.
- `CONTROLLED_FAILURE` → block the run only for a deterministically confirmed critical failure.

A third substantive attempt is forbidden.
