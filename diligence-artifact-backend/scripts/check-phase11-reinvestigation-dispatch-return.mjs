import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  createPhase11ReinvestigationDispatch,
  phase11DispatchContractForRun,
  evaluatePhase11ReinvestigationReturn,
  candidateForDispatch,
  assertPhase11DispatchOwner
} from "../src/phases/11-operator-challenge/operator-challenge-dispatch.js";

const candidate = {
  challenge_candidate_id: "OCI-0007",
  candidate_class: "MATERIAL_FIELD_CANDIDATE",
  challenge_type: "VISIBLE_CONTROL_WITHOUT_COMPLETE_SUPPORT",
  affected_artifacts: ["exposure_registry_workpad_98"],
  affected_field_paths: ["exposure_registry_workpad_98.registry_rows[fintech::UNI_PRV_001].control_exclusion_evaluation"],
  affected_registry_row_keys: ["fintech::UNI_PRV_001"],
  affected_activity_ids: [],
  affected_data_field_ids: [],
  affected_obligation_ids: [],
  contradiction_statement: "Visible control lacks complete support.",
  proposed_owner: "PHASE_10_EXPOSURE_PROFILE",
  proposed_reinvestigation_scope: "CONTROL_AND_EVIDENCE_SUPPORT"
};
const gate = {
  status: "REINVESTIGATION_REQUIRED",
  final_gate_fingerprint: "gate-fp",
  operator_challenge_inventory: { challenge_candidates: [candidate] },
  reinvestigation_directives: [{
    challenge_candidate_id: candidate.challenge_candidate_id,
    owning_phase: "PHASE_10_EXPOSURE_PROFILE",
    artifact_names: candidate.affected_artifacts,
    field_paths: candidate.affected_field_paths,
    affected_row_identity: candidate.affected_registry_row_keys,
    problem: candidate.contradiction_statement,
    required_reinvestigation: candidate.proposed_reinvestigation_scope,
    attempt_number: 1,
    full_phase_rerun_required: false,
    smallest_affected_unit_only: true
  }]
};

const dispatch = createPhase11ReinvestigationDispatch({ challengeGate: gate, run: { run_id: "RUN-11-DISPATCH" }, baselineArtifactVersions: { exposure_registry_workpad_98: 3 } });
assert.equal(dispatch.schema_version, "phase11_reinvestigation_dispatch.v1");
assert.equal(dispatch.owner_internal_job, "M11");
assert.equal(dispatch.return_internal_job, "M12");
assert.equal(dispatch.attempt_number, 1);
assert.equal(dispatch.targeted_reinvestigation_only, true);
assert.equal(dispatch.full_phase_rerun_forbidden, true);
assert.equal(candidateForDispatch({ challengeGate: gate, dispatch }).challenge_candidate_id, candidate.challenge_candidate_id);
assert.equal(assertPhase11DispatchOwner({ dispatch, internalJobId: "M11" }), true);
assert.throws(() => assertPhase11DispatchOwner({ dispatch, internalJobId: "M8_TARGET_FEATURE_PROFILE" }), /PHASE11_DISPATCH_JOB_MISMATCH/);

const scoped = phase11DispatchContractForRun({ contract: { prompt_files: ["base.md"], next: "M12" }, dispatch });
assert.equal(scoped.phase11_reinvestigation_mode, true);
assert.equal(scoped.phase11_reinvestigation_context.challenge_candidate_id, "OCI-0007");
assert.equal(scoped.phase11_reinvestigation_context.full_phase_rerun_forbidden, true);

const unresolved = evaluatePhase11ReinvestigationReturn({
  dispatch,
  previousCandidate: candidate,
  currentInventory: { challenge_candidates: [{ ...candidate, challenge_candidate_id: "OCI-0002" }] },
  returnedArtifactVersions: { exposure_registry_workpad_98: 4 }
});
assert.equal(unresolved.result, "UNRESOLVED");
assert.equal(unresolved.validated, true);
assert.equal(unresolved.condition_persisted, true);
assert.equal(unresolved.artifact_version_advanced, true);

const resolved = evaluatePhase11ReinvestigationReturn({
  dispatch,
  previousCandidate: candidate,
  currentInventory: { challenge_candidates: [] },
  returnedArtifactVersions: { exposure_registry_workpad_98: 4 }
});
assert.equal(resolved.result, "RESOLVED");
assert.equal(resolved.validated, true);
assert.equal(resolved.condition_persisted, false);

const noVersionAdvance = evaluatePhase11ReinvestigationReturn({
  dispatch,
  previousCandidate: candidate,
  currentInventory: { challenge_candidates: [] },
  returnedArtifactVersions: { exposure_registry_workpad_98: 3 }
});
assert.equal(noVersionAdvance.result, "UNRESOLVED");
assert.match(noVersionAdvance.validation_basis, /No challenged artifact version advanced/);

assert.throws(() => createPhase11ReinvestigationDispatch({ challengeGate: { ...gate, reinvestigation_directives: [{ ...gate.reinvestigation_directives[0], full_phase_rerun_required: true }] } }), /PHASE11_DISPATCH_SCOPE_NOT_TARGETED/);
assert.throws(() => createPhase11ReinvestigationDispatch({ challengeGate: { ...gate, reinvestigation_directives: [{ ...gate.reinvestigation_directives[0], owning_phase: "COMPILER_PRESENTATION_ONLY" }] } }), /PHASE11_DISPATCH_OWNER_UNSUPPORTED/);

const runner = readFileSync("src/phases/11-operator-challenge/operator-challenge.runner.js", "utf8");
const runtime = readFileSync("src/phases/11-operator-challenge/operator-challenge-dispatch.runtime.js", "utf8");
const binding = readFileSync("agent-packages/agent_7_operator_challenge/AGENT7_PHASE11_RUNTIME_BINDING.yaml", "utf8");
const addendum = readFileSync("agent-packages/agent_7_operator_challenge/PHASE11_TARGETED_REINVESTIGATION_ADDENDUM.md", "utf8");

for (const marker of [
  "PHASE11_TARGETED_DISPATCH_AND_RETURN_ACTIVE",
  "executePhase11ReinvestigationLoop",
  "reinvestigation_dispatch_count"
]) assert.ok(runner.includes(marker), `runner missing ${marker}`);
for (const marker of [
  "owner_phase_locking_performed: false",
  "normal_downstream_cascade_allowed: false",
  "returned_directly_to_phase11: true",
  "buildOperatorChallengeInventory",
  "recordOperatorChallengeReinvestigationAttempt"
]) assert.ok(runtime.includes(marker), `dispatch runtime missing ${marker}`);
for (const marker of [
  "runtime_contract_version: v4_reinvestigation_dispatch_return",
  "status: ACTIVE",
  "resolved_only_if_exact_candidate_disappears: true",
  "artifact_version_advance_required: true",
  "maximum_dispatches_per_candidate: 2"
]) assert.ok(binding.includes(marker), `binding missing ${marker}`);
for (const marker of [
  "Preserve every unaffected field and row",
  "Do not rerun downstream phases",
  "Phase 11 rebuilds Layer 1"
]) assert.ok(addendum.includes(marker), `addendum missing ${marker}`);

console.log(JSON.stringify({
  check: "Phase 11 reinvestigation dispatch-and-return adapter",
  status: "PASS",
  dispatch_version: dispatch.schema_version,
  exact_field_scope_preserved: true,
  owner_phase_locking_performed: false,
  normal_downstream_cascade_allowed: false,
  deterministic_return_validation: true,
  maximum_attempts_per_candidate: 2
}, null, 2));
