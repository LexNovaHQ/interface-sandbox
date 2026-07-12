# PHASE 11 PRODUCTION CLOSURE CHANGE ORDER v1

**Repository:** `LexNovaHQ/interface-sandbox`  
**Branch:** `domain-gate-v0-preflight`  
**Audit baseline commit:** `80a7bdc26db3891fd4a8f27b91e4ac2fe390463e`  
**Audit basis:** LOCKED  
**Change-order status:** READY FOR FOUNDER REVIEW  
**Scope:** Phase 11 Operator Challenge production closure only  
**Code changes authorized by this document:** None until this change order is locked

---

## 1. Governing decision

Phase 11 remains an adversarial, derived-only coherence gate. It is not a new diligence phase, a second exposure-profile phase, or an unrestricted repair controller.

The following rules are controlling:

1. Blocking is exceptional.
2. Only a deterministically confirmed critical systemic failure may block the run.
3. A material field defect triggers targeted reinvestigation.
4. Targeted reinvestigation is limited to the smallest affected unit.
5. A full owner-phase rerun is forbidden.
6. A normal downstream cascade is forbidden.
7. A maximum of two substantive reinvestigation attempts is permitted per challenge candidate.
8. Technical failures, provider retries, malformed transport responses, checkpoint resumes, and output-format repairs are not substantive attempts.
9. An unresolved material field after two substantive attempts becomes `PASS_WITH_LIMITATION`.
10. Phase 11 must preserve every unaffected field, row, artifact identity, and compound registry identity.
11. The compiler reads only the final `challenge_gate`.
12. Phase 11 internal artifacts remain independently persisted for auditability.
13. Profile forensics remain prohibited inputs to Phase 11.
14. The Phase 2G routing authority remains the only downstream routing authority.
15. Existing owner-phase canonical artifacts may be read as reinvestigation baselines, but only through a Phase 11-controlled targeted adapter.

---

## 2. Audit defects being closed

### P11-DEF-001 — Reinvestigation directive is not delivered to owner models

The dispatch runtime creates `phase11_reinvestigation_context`, but the ordinary prompt builder does not serialize it. The prompt addendum therefore refers to a context object that the model never receives.

### P11-DEF-002 — Phase 3, Phase 5, Phase 7 and Phase 8 run their normal workflows

The existing dispatch runtime calls ordinary phase runners. Those runners rebuild full artifacts or, in Phase 7, all semantic batches. This violates the smallest-affected-unit rule.

### P11-DEF-003 — Current canonical owner artifacts are not supplied as preservation baselines

The existing routed packet does not reliably include the owner artifact that must be patched while preserving all unaffected material.

### P11-DEF-004 — Mutation guard does not cover the complete runtime write set

The guard is based on declared or challenged artifacts, not the exact writes actually proposed by the owner adapter. Dynamic artifacts and mechanically dependent outputs can escape the guard.

### P11-DEF-005 — Rejected writes can already have been persisted

Owner runners save before the Phase 11 mutation guard executes. Rollback is therefore required and is incomplete, especially when an unauthorized artifact did not previously exist.

### P11-DEF-006 — Technical failures consume substantive attempts

An owner runtime error is converted into `UNRESOLVED` and recorded as an attempt. Two infrastructure failures can exhaust the substantive attempt allowance.

### P11-DEF-007 — Invalid Layer 2 output can become `CONTROLLED_FAILURE`

After one output-repair call, malformed Layer 2 output throws into the central runtime, which marks the run as `CONTROLLED_FAILURE`. This is a false blocker because no deterministic critical failure was established.

### P11-DEF-008 — `REPAIR_REQUIRED` remains a terminal run status

The async runtime still treats `REPAIR_REQUIRED` as terminal, contrary to the locked doctrine.

### P11-DEF-009 — Dispatch lease ownership is unsafe

The lease has no renewal and release does not verify active ownership. An expired worker can deactivate a newer worker’s lease.

### P11-DEF-010 — Multi-owner candidates are routed by string-order accident

Owner labels such as `PHASE_5_OR_PHASE_10` and `PHASE_8_AND_PHASE_10` are collapsed to one owner through substring order rather than deterministic ownership adjudication.

### P11-DEF-011 — Existing tests prove markers, not production behavior

Current checks rely heavily on source-string assertions. They do not execute real targeted owner repairs through the central runtime.

---

## 3. Locked closure architecture

### 3.1 No-save-before-guard rule

Every Phase 11 owner adapter must be a **proposal generator**, not a persistence runner.

An adapter must return a staged mutation proposal:

```js
{
  schema_version: "phase11_targeted_mutation_proposal.v1",
  dispatch_id,
  challenge_candidate_id,
  attempt_number,
  owner_internal_job,
  baseline_fingerprint,
  proposed_writes: [
    {
      artifact_name,
      expected_previous_version,
      proposed_artifact,
      lock_status,
      allowed_field_paths,
      mechanically_dependent_paths
    }
  ],
  actual_write_manifest: [
    {
      artifact_name,
      reason,
      direct_or_mechanical_dependency
    }
  ],
  provider_call_count,
  output_repair_count,
  technical_retry_count,
  substantive_reinvestigation_performed: true
}
```

No adapter may call `saveRuntimeArtifact()` directly.

Phase 11 must:

1. load all baseline artifacts and versions;
2. execute the owner adapter in memory;
3. validate the complete proposed write set;
4. validate that every proposed artifact already exists;
5. validate field and row preservation;
6. validate exact artifact-version expectations;
7. commit only after every guard passes;
8. record the substantive attempt only after commit and rebuilt-inventory validation.

### 3.2 New-artifact creation is forbidden during material reinvestigation

A Phase 11 material-field reinvestigation may not create a new canonical artifact.

If a required artifact is missing, that condition is a critical substrate failure and must be handled by Layer 3 as a blocking systemic failure—not by a material repair adapter.

This eliminates rollback-to-absence as a normal reinvestigation requirement.

### 3.3 Exact runtime write manifest

The mutation guard must consume the adapter’s `actual_write_manifest`, not:

- `contract.writes`;
- `dispatch.artifact_names` alone;
- inferred static owner outputs.

Any write not listed in the manifest is forbidden.

Any listed write without a baseline artifact and baseline version is forbidden.

Any adapter return whose proposed-write names differ from the write manifest must fail before persistence.

### 3.4 Explicit reinvestigation prompt packet

The targeted prompt wrapper must inject a reserved object into `upstream_artifacts`:

```js
phase11_reinvestigation_context
```

It must contain:

```js
{
  schema_version,
  dispatch_id,
  challenge_candidate_id,
  attempt_number,
  owning_phase,
  owner_internal_job,
  artifact_names,
  field_paths,
  affected_row_identity,
  problem,
  required_reinvestigation,
  baseline_artifact_versions,
  targeted_reinvestigation_only: true,
  full_phase_rerun_forbidden: true,
  return_to_phase11_after_completion: true
}
```

The addendum must refer to:

```text
upstream_artifacts.phase11_reinvestigation_context
```

It must not refer to a contract object that is absent from the model packet.

The backend must fingerprint the context before the provider call and verify that the returned proposal is tied to the same dispatch, candidate, attempt and baseline.

---

## 4. Change orders

## CO-00 — Freeze and closure boundary

### Purpose

Prevent additional Phase 11 feature work from being layered over a defective production boundary.

### Required changes

1. Add this change order to `diligence-artifact-backend/change-orders/`.
2. Record the audit baseline commit.
3. Mark Phase 11 production status as `CLOSURE_REQUIRED`.
4. Do not change compiler behavior, report design, Qualified Review or Assembly Engine except where required to preserve the existing Phase 11 handoff contract.
5. Do not introduce a second routing authority.
6. Do not reintroduce forensic inputs.

### Acceptance

- The branch contains this change order.
- No source file is modified by CO-00.

---

## CO-01 — Targeted reinvestigation packet contract

### Purpose

Deliver the exact directive to every owner model and adapter.

### Primary files

- `src/phases/11-operator-challenge/operator-challenge-dispatch.js`
- `src/phases/11-operator-challenge/operator-challenge-dispatch.runtime.js`
- `src/runtime/services/prompts.service.js`
- `agent-packages/agent_7_operator_challenge/PHASE11_TARGETED_REINVESTIGATION_ADDENDUM.md`
- new: `src/phases/11-operator-challenge/operator-challenge-targeted-packet.js`

### Required behavior

1. Build and freeze an explicit packet.
2. Inject the packet under `upstream_artifacts.phase11_reinvestigation_context`.
3. Include a packet fingerprint.
4. Reject missing, changed or mismatched packet identity.
5. Keep the generic prompt builder backward-compatible.
6. Do not make Phase 11 context globally available to ordinary phase runs.

### Forbidden

- Depending only on `run.phase11_reinvestigation_context`.
- Depending on a prompt instruction without a backend packet assertion.
- Allowing the model to choose or alter the owner, attempt number, artifact names or affected identities.

### Acceptance tests

- The provider test double receives the complete context.
- The addendum path and runtime packet use the same key.
- A modified dispatch ID or candidate ID is rejected.
- An ordinary owner-phase run does not receive Phase 11 context.

---

## CO-02 — Staged mutation proposal and commit protocol

### Purpose

Eliminate write-before-guard behavior.

### New files

- `src/phases/11-operator-challenge/operator-challenge-targeted-adapter.contract.js`
- `src/phases/11-operator-challenge/operator-challenge-targeted-commit.js`
- `src/phases/11-operator-challenge/operator-challenge-write-manifest.js`

### Required behavior

1. Adapters return proposed artifacts in memory.
2. Phase 11 loads baseline payloads and metadata before adapter execution.
3. Phase 11 validates:
   - proposal schema;
   - exact write manifest;
   - expected previous versions;
   - existing-artifact requirement;
   - field-scope mutation;
   - unaffected row preservation;
   - compound identity preservation.
4. Persistence occurs only after guard status `PASS`.
5. The commit layer writes with the owning phase and owning agent identity.
6. A partial persistence failure must:
   - stop further writes;
   - restore every already-written artifact from its baseline snapshot;
   - record a technical failure;
   - not record a substantive attempt.
7. A commit receipt must contain every committed artifact and resulting version.

### Required proposal statuses

- `PROPOSED_MUTATION`
- `NO_MATERIAL_CHANGE`
- `TECHNICAL_FAILURE`
- `INVALID_OWNER_OUTPUT`

Only `PROPOSED_MUTATION` followed by a successful guarded commit can count as a substantive attempt.

### Acceptance tests

- No storage write occurs before mutation validation.
- An extra proposed artifact is rejected.
- A missing baseline version is rejected.
- A partial commit is restored and does not consume an attempt.
- A technical failure leaves `attempts_used` unchanged.

---

## CO-03 — Targeted owner adapter registry

### Purpose

Separate Phase 11 reinvestigation execution from ordinary phase runners.

### New file

- `src/phases/11-operator-challenge/operator-challenge-owner-adapter.registry.js`

### Registry

```js
{
  P3_DOMAIN_DERIVATION_LAYER: runPhase3TargetedReinvestigation,
  M8_TARGET_FEATURE_PROFILE: runPhase5TargetedReinvestigation,
  DATA_PROVENANCE_PROFILE_LAYER4: runPhase7TargetedReinvestigation,
  DOMAIN_CONTROL_OBLIGATION_PROFILE: runPhase8TargetedReinvestigation,
  M11: runPhase10TargetedReinvestigation
}
```

### Required behavior

1. The dispatch runtime calls only the registered targeted adapter.
2. Ordinary owner runners are forbidden in Phase 11 mode.
3. Every adapter conforms to the staged proposal contract.
4. Every adapter declares its allowed direct and mechanically dependent artifacts.
5. Unsupported owners become advisory warnings unless the underlying defect is independently classified as critical.

### Acceptance tests

- A spy proves ordinary owner runners are not called.
- Every registered owner returns the same proposal schema.
- Unknown owner execution fails before any provider call or persistence.

---

## CO-04 — Phase 3 targeted domain-derivation adapter

### New file

- `src/phases/11-operator-challenge/owners/phase3-targeted-reinvestigation.js`

### Allowed baseline artifacts

- `domain_derivation_profile`
- `domain_derivation_source_index`
- routed primary evidence required by the Phase 3 route
- `target_profile`
- immutable domain/package runtime context

### Allowed direct write

- `domain_derivation_profile`

### Immutable during Phase 11

- `active_run_package_manifest`
- primary package identity
- mounted capability overlays
- mounted regulatory overlays
- source route identity

### Rule

If the challenged conclusion requires changing the mounted package identity or invalidating downstream package custody, the adapter must not silently alter the manifest. It must return:

```text
SYSTEMIC_PACKAGE_CUSTODY_CHANGE_REQUIRED
```

Layer 3 must classify that as a critical systemic failure.

### Scope

- Existing field or existing domain row only.
- No full domain-profile regeneration.
- No package remount.
- No downstream rerun.

### Acceptance tests

- One challenged field changes.
- Every unaffected field is byte-equivalent after canonical normalization.
- Package identity mutation is rejected.
- The adapter performs at most one primary provider call and one output-format repair call.

---

## CO-05 — Phase 5 targeted activity-profile adapter

### New file

- `src/phases/11-operator-challenge/owners/phase5-targeted-reinvestigation.js`

### Allowed baseline artifacts

- `target_feature_profile`
- `feature_candidate_inventory`
- `activity_profile_source_index`
- resolved mounted taxonomy
- routed Phase 5 evidence
- preceding derived profiles allowed by Phase 2G

### Allowed direct write

- `target_feature_profile`

### Scope

- The exact existing activity row identified by `affected_activity_ids` or an exact field path.
- Mechanically dependent profile-level counts or limitations only when deterministic dependency is proven.
- Activity identity and order must remain stable.

### Forbidden

- Full profile regeneration.
- Creating or deleting an activity unless a future separately locked critical-reconstruction protocol authorizes it.
- Changing mounted taxonomy identity.
- Reclassifying unrelated activities.

### Acceptance tests

- Exactly one activity row is eligible for material mutation.
- Unaffected rows are byte-equivalent after canonical normalization.
- Row order and activity IDs remain stable.
- A model response containing a new activity is rejected.

---

## CO-06 — Phase 7 single-batch targeted data-provenance adapter

### New file

- `src/phases/11-operator-challenge/owners/phase7-targeted-reinvestigation.js`

### Target resolution

The adapter must resolve one semantic batch from:

1. `affected_data_field_ids`;
2. concrete DAP artifact names;
3. the existing `dap_semantic_batch_route_manifest`.

Ambiguous resolution is invalid and does not consume an attempt.

### Allowed direct writes

- one concrete `dap_semantic_batch_*_artifact`;
- its matching `dap_semantic_batch_validation__DAP-SEM-BATCH-XX`.

### Allowed mechanically dependent writes

- `dap_semantic_batch_validation_manifest`;
- `data_provenance_profile_semantic_batch_gate`.

### Immutable

- `dap_registry_manifest`
- `dap_strategic_derivation_matrix`
- `dap_semantic_batch_route_manifest`
- every non-target DAP batch
- every non-target validation artifact

### Required behavior

1. Run only the target batch.
2. Permit one output-format repair call for that batch.
3. Rebuild Layer 5 validation manifest and gate deterministically.
4. Do not rerun all 17 batches.
5. Do not rewrite route or registry artifacts.

### Acceptance tests

- Provider call count proves only one batch was evaluated.
- Sixteen unrelated batches and validations remain unchanged.
- Layer 5 artifacts are rebuilt mechanically.
- An ambiguous field-to-batch mapping produces a non-substantive technical/contract failure.

---

## CO-07 — Phase 8 targeted obligation adapter

### New file

- `src/phases/11-operator-challenge/owners/phase8-targeted-reinvestigation.js`

### Allowed baseline artifacts

- `domain_control_obligation_profile`
- `domain_control_obligation_candidate_inventory`
- `domain_control_obligation_navigation_index`
- existing target feature profile
- resolved obligation taxonomy
- applicable FDR rules
- routed evidence authorized by Phase 2G

### Allowed direct write

- `domain_control_obligation_profile`

### Scope

- One existing obligation row identified by `affected_obligation_ids` or an exact field path.
- Deterministically dependent profile counts only.
- Candidate universe, obligation identity, package identity and row order remain fixed.

### Forbidden

- Regenerating the full obligation profile.
- Creating new obligations.
- Changing candidate inventory.
- Reading DAP or forensic profiles forbidden by the Phase 8 route.

### Acceptance tests

- Exactly one obligation row is eligible for mutation.
- All unrelated rows remain unchanged.
- Candidate count and obligation identities remain fixed.
- A response that changes regulatory package identity is rejected.

---

## CO-08 — Phase 10 targeted adapter hardening

### Primary file

- `src/phases/11-operator-challenge/phase10-targeted-reinvestigation.js`

### Required changes

1. Remove all direct persistence.
2. Return a staged mutation proposal.
3. Declare the complete actual write manifest:
   - target batch validation;
   - target accepted batch;
   - workpad;
   - controlled profile;
   - triggered profile;
   - exposure forensics, only if still retained as a deterministic side output.
4. Guard every listed artifact.
5. Preserve every unaffected row in the target batch.
6. Reuse every unaffected batch.
7. Preserve compound `registry_row_key` identity.
8. Permit no new registry row.
9. Ensure `targetedKeys` are the only materially re-evaluated rows.
10. If exposure forensics is rebuilt, mark it as mechanically dependent and do not deliver it back into Phase 11 inventory.

### Acceptance tests

- All six proposed writes, when applicable, are in the guard manifest.
- An unauthorized change in controlled or triggered profile is rejected.
- No storage write occurs inside the adapter.
- Unaffected batches are loaded and reused without provider calls.

---

## CO-09 — Technical versus substantive attempt separation

### Primary files

- `operator-challenge-dispatch.runtime.js`
- `operator-challenge-reinvestigation.js`
- `operator-challenge-technical-retry.js`
- new: `operator-challenge-attempt-classifier.js`

### Substantive attempt definition

A substantive attempt exists only when all of the following are true:

1. targeted owner packet was valid;
2. owner adapter performed the substantive field review;
3. returned proposal passed schema validation;
4. mutation guard passed;
5. commit completed;
6. rebuilt Layer 1 inventory evaluated the challenged condition.

### Non-substantive events

- provider timeout;
- provider quota/rate error;
- transport failure;
- malformed JSON;
- output-format repair call;
- lease conflict;
- checkpoint resume;
- baseline-version conflict;
- mutation-guard rejection;
- partial-commit rollback;
- unsupported or ambiguous target mapping.

These events may be logged and retried according to their own bounded technical policy, but may not increment `attempts_used`.

### Acceptance tests

- Two provider timeouts leave substantive attempts at zero.
- One output repair plus one successful field review counts as one substantive attempt.
- A mutation-guard rejection does not count as an attempt.
- A committed but still-persisting challenge counts as one unresolved substantive attempt.

---

## CO-10 — Lease renewal, ownership and checkpoint safety

### Primary file

- `operator-challenge-dispatch-checkpoint.js`

### Required lease fields

- `lease_token`
- `worker_id`
- `acquired_at_epoch`
- `renewed_at_epoch`
- `expires_at_epoch`
- `active`
- `release_reason`

### Required behavior

1. Acquisition returns a cryptographically random lease token.
2. Renewal requires the current worker ID and lease token.
3. Release requires the current worker ID and lease token.
4. A stale worker cannot release a newer lease.
5. Long-running provider calls renew the lease before expiry.
6. Checkpoints include the lease token hash and adapter stage.
7. A resumed checkpoint must match:
   - dispatch;
   - candidate;
   - attempt;
   - owner;
   - baseline versions;
   - lease lineage.
8. A baseline version change invalidates resume and requires a fresh dispatch decision.

### Acceptance tests

- Worker A cannot release Worker B’s lease.
- Renewal extends expiry.
- Expired lease takeover is safe.
- A checkpoint from a different baseline is rejected.
- Concurrent workers cannot both commit.

---

## CO-11 — Deterministic multi-owner adjudication

### Purpose

Replace substring-order owner selection.

### Candidate contract extension

Each material candidate must expose:

```js
{
  owner_candidates: [],
  owner_relation: "SINGLE" | "OR" | "AND",
  primary_owner_basis: [],
  alternate_owner_basis: []
}
```

### Rules

#### SINGLE

Dispatch to the sole owner.

#### OR

Choose the owner that owns the challenged field path or canonical artifact.

If attempt one against the primary owner does not resolve the exact condition and an alternate owner exists, attempt two may be dispatched to the alternate owner.

#### AND

Create a coordinated two-owner sequence:

- attempt one: first owner’s exact field;
- rebuild Layer 1;
- attempt two, only if still required: second owner’s exact field.

The two attempts remain the maximum.

### Critical package-custody rule

A required change to primary package identity, route custody, compound registry identity, or source-bucket authority is not an ordinary multi-owner field repair. It must be classified as a critical systemic failure.

### Acceptance tests

- `PHASE_5_OR_PHASE_10` does not automatically resolve to Phase 5.
- `PHASE_8_AND_PHASE_10` can dispatch one bounded unit to each owner.
- Owner choice is explainable from artifact and field ownership.
- No owner is selected solely because its text appears first.

---

## CO-12 — False-blocker removal

### 12.1 Layer 2 malformed-output fallback

After bounded technical retries and one output-format repair:

1. Do not throw into central `CONTROLLED_FAILURE` solely because the semantic ledger is malformed.
2. Build a backend fallback semantic ledger:
   - deterministic critical candidates remain critical-review candidates;
   - deterministic material candidates become `MATERIAL_REINVESTIGATION`;
   - advisory candidates become `ADVISORY`.
3. Record a visible limitation:
   - `PHASE11_LAYER2_MODEL_OUTPUT_UNUSABLE`;
   - `semantic_fallback_used: true`.
4. Continue to deterministic Layer 3.

The fallback must not let the model create or suppress criticality.

### 12.2 Top-level `REPAIR_REQUIRED`

1. Remove `REPAIR_REQUIRED` from async terminal run statuses.
2. Prevent `REPAIR_REQUIRED` from being used as a final phase lock.
3. Retain it only as a transient internal validation state.
4. After bounded repair:
   - noncritical exhaustion maps to `LOCKED_WITH_LIMITATIONS`;
   - deterministically confirmed critical failure maps to `CONTROLLED_FAILURE`.

### Acceptance tests

- Two malformed Layer 2 responses do not block the run.
- Material candidates still reach reinvestigation under fallback.
- `REPAIR_REQUIRED` does not make `isTerminal(run)` true.
- No production phase can finish with top-level `REPAIR_REQUIRED`.

---

## CO-13 — Final gate, compiler and warning synchronization

### Purpose

Revalidate the existing handoff after the closure surgery.

### Required assertions

1. Compiler reads `challenge_gate` only from Phase 11.
2. Compiler cannot read semantic ledger, inventory or reinvestigation ledger.
3. `PASS` permits compiler handoff.
4. `PASS_WITH_LIMITATION` permits compiler handoff.
5. `REINVESTIGATION_REQUIRED` does not permit compiler handoff.
6. `CONTROLLED_FAILURE` does not permit compiler handoff.
7. Every exhausted material challenge projects a visible report warning.
8. Every warning includes:
   - challenge identity;
   - owner;
   - affected artifact and field;
   - attempts used;
   - remaining uncertainty;
   - report impact;
   - local-counsel review route.
9. Internal technical failures are not represented as substantive field attempts.

### No design expansion

This change order may not redesign the report or Qualified Review. It only preserves the existing Phase 11 warning handoff.

---

## CO-14 — Executable production acceptance suite

### New or rebuilt checks

- `scripts/check-phase11-targeted-packet-runtime.mjs`
- `scripts/check-phase11-staged-mutation-commit.mjs`
- `scripts/check-phase11-owner-adapters.mjs`
- `scripts/check-phase11-phase3-targeted.mjs`
- `scripts/check-phase11-phase5-targeted.mjs`
- `scripts/check-phase11-phase7-single-batch-targeted.mjs`
- `scripts/check-phase11-phase8-targeted.mjs`
- `scripts/check-phase11-phase10-targeted-hardening.mjs`
- `scripts/check-phase11-technical-attempt-separation.mjs`
- `scripts/check-phase11-lease-concurrency.mjs`
- `scripts/check-phase11-multi-owner-routing.mjs`
- `scripts/check-phase11-false-blockers.mjs`
- `scripts/check-phase11-central-runtime-e2e.mjs`

### Test doctrine

Source-marker checks may remain supplementary. They may not be the primary proof.

The suite must execute behavior with storage and provider test doubles.

### Mandatory scenarios

1. Clean `PASS`.
2. Advisory-only `PASS_WITH_LIMITATION`.
3. Material defect resolved on attempt one.
4. Material defect resolved on attempt two.
5. Material defect unresolved after two attempts and passed with warning.
6. Critical substrate failure blocks.
7. Layer 2 malformed twice and falls back without blocking.
8. Provider fails technically twice and no substantive attempt is consumed.
9. Mutation guard rejects unrelated field change.
10. Adapter proposes unauthorized artifact.
11. Phase 7 reruns exactly one batch.
12. Phase 10 reuses all unaffected batches.
13. Multi-owner OR uses alternate owner on attempt two.
14. Multi-owner AND uses one bounded owner unit per attempt.
15. Stale worker cannot release current lease.
16. Compiler is unreachable while gate is `REINVESTIGATION_REQUIRED`.
17. Compiler proceeds on `PASS_WITH_LIMITATION`.
18. Forensics are never delivered to Phase 11.

### Package scripts

Add:

```json
"check:phase11-targeted-runtime": "...",
"check:phase11-owner-adapters": "...",
"check:phase11-control-plane": "...",
"check:phase11-central-e2e": "...",
"check:phase11-production-closure": "..."
```

`check:phase11-full` must include `check:phase11-production-closure`.

---

## 5. Required implementation order

The order is mandatory.

### Foundation

1. CO-00 — Freeze
2. CO-01 — Targeted packet
3. CO-02 — Staged mutation and commit
4. CO-03 — Adapter registry

### Owner adapters

5. CO-04 — Phase 3
6. CO-05 — Phase 5
7. CO-06 — Phase 7
8. CO-07 — Phase 8
9. CO-08 — Phase 10 hardening

### Control plane

10. CO-09 — Attempt separation
11. CO-10 — Lease/checkpoint safety
12. CO-11 — Multi-owner adjudication
13. CO-12 — False-blocker removal

### Handoff and proof

14. CO-13 — Compiler/warning sync
15. CO-14 — Executable production acceptance

No owner adapter may be merged before CO-01 through CO-03 are complete.

No Phase 11 closure may be declared before every CO-14 mandatory scenario passes.

---

## 6. Global invariants

The finished implementation must prove all of the following:

- `only_critical_failure_blocks === true`
- `material_field_problem_is_blocking === false`
- `maximum_reinvestigation_attempts === 2`
- `third_attempt_forbidden === true`
- `technical_retry_is_not_substantive_attempt === true`
- `output_repair_is_not_substantive_attempt === true`
- `mutation_guard_rejection_is_not_substantive_attempt === true`
- `full_phase_rerun_forbidden === true`
- `normal_downstream_cascade_allowed === false`
- `owner_phase_locking_performed === false`
- `forensic_inputs_used === false`
- `compiler_reads_final_challenge_gate_only === true`
- `new_artifact_creation_during_material_reinvestigation === false`
- `persistence_before_mutation_guard === false`
- `exact_runtime_write_manifest_required === true`
- `unresolved_after_two_attempts === "PASS_WITH_LIMITATION"`
- `repair_required_is_terminal_run_status === false`

---

## 7. Explicit non-goals

This closure does not authorize:

- changes to the six Phase 2G bucket architecture;
- a new routing authority;
- forensic inputs to Phase 11;
- a new exposure taxonomy;
- registry redesign;
- report redesign;
- Qualified Review redesign;
- Assembly Engine work;
- a third substantive attempt;
- full upstream reruns;
- package remounting during ordinary material reinvestigation;
- client-facing legal conclusions created by Phase 11.

---

## 8. Completion definition

Phase 11 is production-closed only when:

1. all five independent artifacts remain correctly owned and persisted;
2. each material candidate receives at most two real substantive attempts;
3. every owner repair is field/row/batch targeted;
4. no owner runner performs an ordinary full-phase execution;
5. no write occurs before the full mutation proposal is validated;
6. the complete actual write set is guarded;
7. technical failures do not consume substantive attempts;
8. malformed semantic output cannot falsely block the run;
9. `REPAIR_REQUIRED` is not a terminal production run status;
10. lease and checkpoint concurrency are safe;
11. multi-owner routing is deterministic;
12. the compiler receives only a safe final gate;
13. all mandatory executable scenarios pass locally;
14. the branch remains free of legacy or shadow routing/runtime authority.

---

## 9. Founder decision required before code

Lock one of the following:

### Option A — Full production closure

Execute CO-00 through CO-14 in the mandatory order.

**Consequence:** Phase 11 becomes production-grade before compiler work continues.

### Option B — Reduced closure

Implement only CO-01, CO-02, CO-06, CO-09 and CO-12.

**Consequence:** This is not acceptable for production because Phase 3, Phase 5, Phase 8, mutation coverage, lease safety and multi-owner routing remain defective.

**Recommendation:** Lock Option A. The reduced path creates the appearance of closure without fixing the runtime boundary.
