import { saveRuntimeArtifact } from "../../runtime/services/artifacts.service.js";
import { assertPhase11TargetedMutationProposal, PHASE11_TARGETED_PROPOSAL_STATUS } from "./operator-challenge-targeted-adapter.contract.js";
import { validatePhase11WriteManifest } from "./operator-challenge-write-manifest.js";
import { validatePhase11TargetedMutation } from "./operator-challenge-mutation-guard.js";

export const PHASE11_TARGETED_COMMIT_VERSION = "phase11_targeted_mutation_commit.v1";

export async function commitPhase11TargetedMutationProposal({ run, dispatch, proposal, beforeArtifacts = {}, baselineArtifactVersions = {}, ownerActor, ownerPhase } = {}) {
  assertPhase11TargetedMutationProposal({ proposal, dispatch });
  if (proposal.status !== PHASE11_TARGETED_PROPOSAL_STATUS.proposedMutation) {
    return Object.freeze({
      schema_version: PHASE11_TARGETED_COMMIT_VERSION,
      status: proposal.status,
      dispatch_id: proposal.dispatch_id,
      challenge_candidate_id: proposal.challenge_candidate_id,
      committed_writes: [],
      substantive_attempt_committed: false,
      validation_basis: "No proposed mutation was committed."
    });
  }
  const manifestValidation = validatePhase11WriteManifest({ proposal, baselineArtifactVersions });
  if (manifestValidation.status !== "PASS") throw new Error(`PHASE11_WRITE_MANIFEST_REJECTED:${manifestValidation.missing_or_mismatched_baseline_artifacts.join("|") || manifestValidation.unauthorized_reasons.join("|")}`);
  const afterArtifacts = Object.fromEntries(proposal.proposed_writes.map((write) => [write.artifact_name, write.proposed_artifact]));
  const fieldPaths = unique(proposal.proposed_writes.flatMap((write) => [...write.allowed_field_paths, ...write.mechanically_dependent_paths]));
  const mutation = validatePhase11TargetedMutation({ dispatch: { ...dispatch, artifact_names: manifestValidation.proposed_write_names, field_paths: fieldPaths }, beforeArtifacts, afterArtifacts });
  if (mutation.status !== "PASS") throw new Error(`PHASE11_MUTATION_GUARD_REJECTED:${mutation.unauthorized_changes.map((row) => row.path).join("|")}`);
  const committed = [];
  try {
    for (const write of proposal.proposed_writes) {
      const result = await saveRuntimeArtifact({
        run_id: run.run_id,
        phase: ownerPhase || dispatch.owner_internal_job,
        agent_id: ownerActor,
        artifact_name: write.artifact_name,
        artifact: write.proposed_artifact,
        lock_status: write.lock_status || write.proposed_artifact?.status || "LOCKED_WITH_LIMITATIONS"
      });
      committed.push({ artifact_name: write.artifact_name, version: result.version, lock_status: result.lock_status });
    }
  } catch (error) {
    for (const write of committed.slice().reverse()) {
      const baseline = beforeArtifacts[write.artifact_name];
      if (baseline) await saveRuntimeArtifact({ run_id: run.run_id, phase: ownerPhase || dispatch.owner_internal_job, agent_id: ownerActor, artifact_name: write.artifact_name, artifact: baseline, lock_status: "LOCKED_WITH_LIMITATIONS" });
    }
    error.phase11_commit_rolled_back = true;
    error.phase11_substantive_attempt_committed = false;
    throw error;
  }
  return Object.freeze({
    schema_version: PHASE11_TARGETED_COMMIT_VERSION,
    status: "COMMITTED",
    dispatch_id: proposal.dispatch_id,
    challenge_candidate_id: proposal.challenge_candidate_id,
    attempt_number: proposal.attempt_number,
    committed_writes: committed,
    mutation_guard: mutation,
    manifest_validation: manifestValidation,
    substantive_attempt_committed: proposal.substantive_reinvestigation_performed === true,
    persistence_before_mutation_guard: false,
    exact_runtime_write_manifest_required: true
  });
}

function unique(value) { return [...new Set(Array.isArray(value) ? value.filter(Boolean).map(String) : [])]; }
