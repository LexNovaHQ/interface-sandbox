import { getInternalJobContract } from "../../runtime/contracts/internal-job.contract.js";
import { saveRuntimeArtifact, readRuntimeArtifactPayload } from "../../runtime/services/artifacts.service.js";
import { getArtifactMetadata, logEvent } from "../../runtime/services/storage/firestore.service.js";
import { buildPhasePrompt } from "../../runtime/services/prompts.service.js";
import { callProviderJson } from "../../runtime/services/provider.service.js";
import { readPhaseRouteRuntimePacket } from "../02-cartography-index/services/phase-route-runtime.reader.js";
import { buildOperatorChallengeInventory } from "./operator-challenge-inventory.js";
import { buildOperatorChallengeLayer3 } from "./operator-challenge-adjudication.js";
import { recordOperatorChallengeReinvestigationAttempt } from "./operator-challenge-reinvestigation.js";
import { callPhase11WithTechnicalRetry } from "./operator-challenge-technical-retry.js";
import { acquirePhase11DispatchLease, renewPhase11DispatchLease, releasePhase11DispatchLease, buildPhase11DispatchCheckpoint, checkpointMayResume } from "./operator-challenge-dispatch-checkpoint.js";
import { createPhase11ReinvestigationDispatch, evaluatePhase11ReinvestigationReturn, candidateForDispatch } from "./operator-challenge-dispatch.js";
import { buildPhase11TargetedPacket, assertPhase11TargetedPacket } from "./operator-challenge-targeted-packet.js";
import { runPhase11RegisteredOwnerAdapter } from "./operator-challenge-owner-adapter.registry.js";
import { commitPhase11TargetedMutationProposal } from "./operator-challenge-targeted-commit.js";
import { classifyPhase11AttemptOutcome, buildPhase11NonSubstantiveReceipt } from "./operator-challenge-attempt-classifier.js";
import { runPhase10TargetedReinvestigation } from "./phase10-targeted-reinvestigation.js";

const AGENT = "agent_7_m12";
const CHECKPOINT = "operator_challenge_dispatch_checkpoint";
const OWNER_ACTOR = Object.freeze({
  P3_DOMAIN_DERIVATION_LAYER: "agent_3_target_feature",
  M8_TARGET_FEATURE_PROFILE: "agent_3_target_feature",
  DATA_PROVENANCE_PROFILE_LAYER4: "agent_4_data_privacy",
  DOMAIN_CONTROL_OBLIGATION_PROFILE: "agent_8_domain_control_obligation",
  M11: "agent_5_exposure_registry"
});
const REGISTERED_TARGETED_OWNER_ADAPTERS = Object.freeze({ M11: runPhase10TargetedReinvestigation });

export async function executePhase11ReinvestigationLoop({ run, m12Contract, inventory, semanticLedger, initialChallengeGate, readArtifacts, buildPrompt = buildPhasePrompt, callProvider = callProviderJson, workerId = `phase11-${process.pid || "worker"}` } = {}) {
  let gate = initialChallengeGate; let dispatchCount = 0; const dispatchReceipts = [];
  while (gate?.status === "REINVESTIGATION_REQUIRED") {
    const directive = Array.isArray(gate.reinvestigation_directives) ? gate.reinvestigation_directives[0] : null;
    if (!directive) throw new Error("PHASE11_REINVESTIGATION_DIRECTIVE_MISSING");
    const baselineArtifactVersions = await artifactVersions(run.run_id, directive.artifact_names);
    const dispatch = createPhase11ReinvestigationDispatch({ challengeGate: gate, run, baselineArtifactVersions });
    const previousCandidate = candidateForDispatch({ challengeGate: gate, dispatch });
    const lease = await acquirePhase11DispatchLease({ runId: run.run_id, dispatch, workerId });
    try {
      const completed = await executeOneDispatch({ run, m12Contract, dispatch, previousCandidate, gate, readArtifacts, buildPrompt, callProvider, workerId, lease });
      dispatchCount += 1; dispatchReceipts.push(completed.receipt);
      if (completed.nonSubstantive === true) {
        gate = {
          ...completed.gateWithAttempt,
          reinvestigation_dispatch_non_substantive_pending: true,
          compiler_handoff_allowed: false,
          reinvestigation_dispatch_required: true
        };
        await saveCheckpoint(run, dispatch, "NON_SUBSTANTIVE_RETRY_REQUIRED", completed.checkpoint, { receipt: completed.receipt, resulting_gate_status: gate.status });
        break;
      }
      gate = buildOperatorChallengeLayer3({ inventory, semanticLedger, priorChallengeGate: completed.gateWithAttempt, run }).challenge_gate;
      await saveIndependent(run.run_id, "operator_challenge_reinvestigation_ledger", gate.operator_challenge_reinvestigation_ledger, gate.status);
      await saveCheckpoint(run, dispatch, "COMPLETE", completed.checkpoint, { receipt: completed.receipt, resulting_gate_status: gate.status });
    } finally {
      await releasePhase11DispatchLease({ runId: run.run_id, dispatchId: dispatch.dispatch_id, workerId, leaseToken: lease.lease_token });
    }
    if (dispatchCount > Math.max(1, Number(initialChallengeGate?.operator_challenge_reinvestigation_ledger?.entries?.length || 0) * 2 + 2)) throw new Error("PHASE11_REINVESTIGATION_LOOP_GUARD_EXCEEDED");
  }
  return { challenge_gate: { ...gate, reinvestigation_dispatch_adapter: { schema_version: "phase11_reinvestigation_dispatch_return_adapter.v4.attempt_safe", status: "COMPLETE", dispatch_count: dispatchCount, mutation_guard_active: true, staged_mutation_proposals_active: true, persistence_before_mutation_guard: false, durable_checkpoints_active: true, run_scoped_lease_active: true, lease_owner_token_required: true, technical_retry_active: true, technical_failures_are_not_substantive_attempts: true, owner_phase_locking_performed: false, ordinary_owner_runners_forbidden: true, normal_downstream_cascade_allowed: false, returned_directly_to_phase11: true, dispatch_receipts: dispatchReceipts } }, dispatch_count: dispatchCount, dispatch_receipts: dispatchReceipts };
}

async function executeOneDispatch({ run, m12Contract, dispatch, previousCandidate, gate, readArtifacts, buildPrompt, callProvider, workerId, lease }) {
  let checkpoint = await readCheckpoint(run.run_id);
  if (!checkpointMayResume(checkpoint, dispatch) || checkpoint.stage === "COMPLETE") checkpoint = null;
  const baselineVersions = checkpoint?.payload?.baseline_artifact_versions || dispatch.baseline_artifact_versions;
  const targetedPacket = checkpoint?.payload?.phase11_reinvestigation_context || buildPhase11TargetedPacket({ dispatch, baselineArtifactVersions: baselineVersions });
  assertPhase11TargetedPacket({ packet: targetedPacket, dispatch });
  if (!checkpoint) checkpoint = await saveCheckpoint(run, dispatch, "DISPATCH_CREATED", null, { dispatch, baseline_artifact_versions: baselineVersions, phase11_reinvestigation_context: targetedPacket });
  if (checkpoint.stage === "ATTEMPT_RECORDED") {
    const recorded = checkpoint.payload?.attempt_result;
    if (!recorded) throw new Error("PHASE11_CHECKPOINT_ATTEMPT_RESULT_MISSING");
    return buildCompletedDispatch({ dispatch, checkpoint, gateWithAttempt: recordOperatorChallengeReinvestigationAttempt({ challengeGate: gate, result: recorded }), attemptResult: recorded, commitReceipt: checkpoint.payload?.commit_receipt || null });
  }
  if (checkpoint.stage === "NON_SUBSTANTIVE_RETRY_REQUIRED") {
    const receipt = checkpoint.payload?.receipt || buildPhase11NonSubstantiveReceipt({ dispatch, classification: checkpoint.payload?.attempt_classification || {}, technicalRetryCount: checkpoint.payload?.technical_retry_count || 0 });
    return { gateWithAttempt: gate, checkpoint, receipt, nonSubstantive: true };
  }

  let runtimeError = checkpoint?.payload?.runtime_error ? new Error(checkpoint.payload.runtime_error) : null;
  let proposal = checkpoint?.payload?.proposal || null;
  let commitReceipt = checkpoint?.payload?.commit_receipt || null;
  let returnedArtifactVersions = checkpoint?.payload?.returned_artifact_versions || null;
  let technicalRetryCount = Number(checkpoint?.payload?.technical_retry_count || 0);

  if (!proposal && !runtimeError) {
    checkpoint = await saveCheckpoint(run, dispatch, "OWNER_PROPOSAL_RUNNING", checkpoint, { ...checkpoint.payload, phase11_reinvestigation_context: targetedPacket });
    await renewPhase11DispatchLease({ runId: run.run_id, dispatchId: dispatch.dispatch_id, workerId, leaseToken: lease.lease_token });
    try {
      const ownerCall = await callPhase11WithTechnicalRetry({ label: `PHASE11_OWNER_${dispatch.owner_internal_job}`, call: () => executeOwnerAdapter({ run, dispatch, targetedPacket, readArtifacts, buildPrompt, callProvider }) });
      technicalRetryCount += ownerCall.technical_retry_count;
      proposal = ownerCall.result || ownerCall;
    } catch (error) {
      runtimeError = error;
      technicalRetryCount += Number(error.phase11_technical_retry_count || 0);
      await logEvent({ run_id: run.run_id, event_type: "PHASE11_REINVESTIGATION_OWNER_ERROR", actor: AGENT, payload: { dispatch_id: dispatch.dispatch_id, owner_internal_job: dispatch.owner_internal_job, attempt_number: dispatch.attempt_number, technical_retry_count: technicalRetryCount, message: error.message } });
    }
    checkpoint = await saveCheckpoint(run, dispatch, "OWNER_PROPOSAL_CREATED", checkpoint, { ...checkpoint.payload, proposal, technical_retry_count: technicalRetryCount, runtime_error: runtimeError?.message || "", phase11_reinvestigation_context: targetedPacket });
  }

  if (!runtimeError && proposal && !commitReceipt) {
    try {
      await renewPhase11DispatchLease({ runId: run.run_id, dispatchId: dispatch.dispatch_id, workerId, leaseToken: lease.lease_token });
      const writeNames = proposalWriteNames(proposal);
      const ownerActor = ownerActorFor(dispatch.owner_internal_job);
      const beforeArtifacts = await readNamedArtifacts(run.run_id, writeNames, ownerActor);
      const proposalBaselineVersions = await artifactVersions(run.run_id, writeNames);
      commitReceipt = await commitPhase11TargetedMutationProposal({
        run,
        dispatch,
        proposal,
        beforeArtifacts,
        baselineArtifactVersions: proposalBaselineVersions,
        ownerActor,
        ownerPhase: dispatch.owner_internal_job
      });
      returnedArtifactVersions = await artifactVersions(run.run_id, [...new Set([...(dispatch.artifact_names || []), ...writeNames])]);
      if (commitReceipt.substantive_attempt_committed !== true) runtimeError = new Error(`PHASE11_TARGETED_PROPOSAL_NOT_COMMITTED:${commitReceipt.status}`);
    } catch (error) {
      runtimeError = error;
      returnedArtifactVersions = await artifactVersions(run.run_id, dispatch.artifact_names);
      await logEvent({ run_id: run.run_id, event_type: "PHASE11_REINVESTIGATION_COMMIT_ERROR", actor: AGENT, payload: { dispatch_id: dispatch.dispatch_id, owner_internal_job: dispatch.owner_internal_job, attempt_number: dispatch.attempt_number, message: error.message, rolled_back: error.phase11_commit_rolled_back === true } });
    }
    checkpoint = await saveCheckpoint(run, dispatch, "PROPOSAL_COMMITTED", checkpoint, { ...checkpoint.payload, proposal, commit_receipt: commitReceipt, returned_artifact_versions: returnedArtifactVersions, technical_retry_count: technicalRetryCount, runtime_error: runtimeError?.message || "", phase11_reinvestigation_context: targetedPacket });
  }

  const classification = classifyPhase11AttemptOutcome({ proposal, commitReceipt, runtimeError });
  if (classification.substantive_attempt !== true) {
    const receipt = buildPhase11NonSubstantiveReceipt({ dispatch, classification, technicalRetryCount });
    checkpoint = await saveCheckpoint(run, dispatch, "NON_SUBSTANTIVE_RETRY_REQUIRED", checkpoint, { ...checkpoint.payload, proposal, commit_receipt: commitReceipt, attempt_classification: classification, receipt, returned_artifact_versions: returnedArtifactVersions || {}, technical_retry_count: technicalRetryCount, runtime_error: runtimeError?.message || "", phase11_reinvestigation_context: targetedPacket });
    return { gateWithAttempt: gate, checkpoint, receipt, nonSubstantive: true };
  }

  const currentInventory = await rebuildInventory({ run, m12Contract, readArtifacts });
  const attemptResult = evaluatePhase11ReinvestigationReturn({ dispatch, previousCandidate, currentInventory, returnedArtifactVersions: returnedArtifactVersions || {}, runtimeError: null });
  const gateWithAttempt = recordOperatorChallengeReinvestigationAttempt({ challengeGate: gate, result: attemptResult });
  checkpoint = await saveCheckpoint(run, dispatch, "ATTEMPT_RECORDED", checkpoint, { ...checkpoint.payload, attempt_result: attemptResult, attempt_classification: classification, phase11_reinvestigation_context: targetedPacket });
  return buildCompletedDispatch({ dispatch, checkpoint, gateWithAttempt, attemptResult, commitReceipt, technicalRetryCount });
}

function buildCompletedDispatch({ dispatch, checkpoint, gateWithAttempt, attemptResult, commitReceipt = null, technicalRetryCount = 0 }) { return { gateWithAttempt, checkpoint, receipt: { dispatch_id: dispatch.dispatch_id, challenge_candidate_id: dispatch.challenge_candidate_id, attempt_number: dispatch.attempt_number, owning_phase: dispatch.owning_phase, owner_internal_job: dispatch.owner_internal_job, result: attemptResult.result, substantive_attempt_recorded: true, technical_retry_count: technicalRetryCount, technical_retry_is_not_substantive_attempt: true, mutation_guard_status: commitReceipt?.mutation_guard?.status || (commitReceipt?.status === "COMMITTED" ? "PASS" : "NOT_COMMITTED"), staged_mutation_proposal_used: true, persistence_before_mutation_guard: false, validation_basis: attemptResult.validation_basis, return_fingerprint: attemptResult.return_fingerprint } }; }

async function executeOwnerAdapter({ run, dispatch, targetedPacket, readArtifacts, buildPrompt, callProvider }) {
  assertPhase11TargetedPacket({ packet: targetedPacket, dispatch });
  const contract = getInternalJobContract(dispatch.owner_internal_job);
  return runPhase11RegisteredOwnerAdapter({ ownerInternalJob: dispatch.owner_internal_job, run: { ...run, current_phase: dispatch.owner_internal_job, phase11_reinvestigation_context: targetedPacket }, dispatch, contract, readArtifacts, buildPrompt, callProvider, phase11TargetedPacket: targetedPacket });
}
function proposalWriteNames(proposal = {}) { return [...new Set((proposal.proposed_writes || []).map((row) => row.artifact_name).filter(Boolean))]; }
function ownerActorFor(ownerInternalJob) { const actor = OWNER_ACTOR[ownerInternalJob]; if (!actor) throw new Error(`PHASE11_REINVESTIGATION_OWNER_JOB_UNSUPPORTED:${ownerInternalJob || "missing"}`); return actor; }
async function rebuildInventory({ run, m12Contract, readArtifacts }) { const routed = await readPhaseRouteRuntimePacket({ internalJobId: "M12", readArtifacts, consumerAgentId: m12Contract.actor_id || m12Contract.agent_id || AGENT }); return buildOperatorChallengeInventory({ run, artifacts: routed.artifacts }).operator_challenge_inventory; }
async function saveCheckpoint(run, dispatch, stage, previous, payload) { const checkpoint = buildPhase11DispatchCheckpoint({ run, dispatch, stage, previous, payload }); await saveIndependent(run.run_id, CHECKPOINT, checkpoint, checkpoint.status === "COMPLETE" ? "LOCKED" : "CREATED"); return checkpoint; }
async function readCheckpoint(runId) { try { return await readRuntimeArtifactPayload({ run_id: runId, artifact_name: CHECKPOINT, agent_id: AGENT }); } catch { return null; } }
async function readNamedArtifacts(runId, names = [], agentId = AGENT) { const out = {}; for (const name of names) { try { out[name] = await readRuntimeArtifactPayload({ run_id: runId, artifact_name: name, agent_id: agentId }); } catch { out[name] = undefined; } } return out; }
async function artifactVersions(runId, names = []) { const out = {}; for (const name of [...new Set(names.filter(Boolean))]) { try { const meta = await getArtifactMetadata(runId, name); out[name] = Number(meta.latest_version || meta.version || 0); } catch { out[name] = 0; } } return out; }
async function saveIndependent(runId, artifactName, artifact, lockStatus) { return saveRuntimeArtifact({ run_id: runId, phase: "M12", agent_id: AGENT, artifact_name: artifactName, artifact, lock_status: lockStatus || "LOCKED" }); }
