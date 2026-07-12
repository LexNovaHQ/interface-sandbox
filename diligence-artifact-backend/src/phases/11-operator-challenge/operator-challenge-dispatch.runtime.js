import { getInternalJobContract } from "../../runtime/contracts/internal-job.contract.js";
import { saveRuntimeArtifact, readRuntimeArtifactPayload } from "../../runtime/services/artifacts.service.js";
import { getArtifactMetadata, logEvent } from "../../runtime/services/storage/firestore.service.js";
import { buildPhasePrompt } from "../../runtime/services/prompts.service.js";
import { callProviderJson } from "../../runtime/services/provider.service.js";
import { readPhaseRouteRuntimePacket } from "../02-cartography-index/services/phase-route-runtime.reader.js";
import { runDomainDerivationPhase } from "../03-domain-derivation/domain-derivation.runner.js";
import { runActivityProfileReviewPhase } from "../05-activity-profile-review/activity-profile-review.runner.js";
import { runDataProvenanceProfilePhase } from "../07-data-provenance-profile/data-provenance-profile.runner.js";
import { runDomainControlObligationProfilePhase } from "../08-domain-control-obligation-profile/domain-control-obligation-profile.runner.js";
import { buildOperatorChallengeInventory } from "./operator-challenge-inventory.js";
import { buildOperatorChallengeLayer3 } from "./operator-challenge-adjudication.js";
import { recordOperatorChallengeReinvestigationAttempt } from "./operator-challenge-reinvestigation.js";
import { runPhase10TargetedReinvestigation } from "./phase10-targeted-reinvestigation.js";
import { validatePhase11TargetedMutation } from "./operator-challenge-mutation-guard.js";
import { acquirePhase11DispatchLease, releasePhase11DispatchLease, buildPhase11DispatchCheckpoint, checkpointMayResume } from "./operator-challenge-dispatch-checkpoint.js";
import { createPhase11ReinvestigationDispatch, phase11DispatchContractForRun, evaluatePhase11ReinvestigationReturn, candidateForDispatch } from "./operator-challenge-dispatch.js";

const AGENT = "agent_7_m12";
const CHECKPOINT = "operator_challenge_dispatch_checkpoint";
const ADDENDUM = "agent-packages/agent_7_operator_challenge/PHASE11_TARGETED_REINVESTIGATION_ADDENDUM.md";
const OWNER_ACTOR = Object.freeze({ P3_DOMAIN_DERIVATION_LAYER: "agent_3_target_feature", M8_TARGET_FEATURE_PROFILE: "agent_3_target_feature", DATA_PROVENANCE_PROFILE_LAYER4: "agent_4_data_privacy", DOMAIN_CONTROL_OBLIGATION_PROFILE: "agent_8_domain_control_obligation" });

export async function executePhase11ReinvestigationLoop({ run, m12Contract, inventory, semanticLedger, initialChallengeGate, readArtifacts, buildPrompt = buildPhasePrompt, callProvider = callProviderJson, workerId = `phase11-${process.pid || "worker"}` } = {}) {
  let gate = initialChallengeGate;
  let dispatchCount = 0;
  const dispatchReceipts = [];
  while (gate?.status === "REINVESTIGATION_REQUIRED") {
    const directive = Array.isArray(gate.reinvestigation_directives) ? gate.reinvestigation_directives[0] : null;
    if (!directive) throw new Error("PHASE11_REINVESTIGATION_DIRECTIVE_MISSING");
    const baselineArtifactVersions = await artifactVersions(run.run_id, directive.artifact_names);
    const dispatch = createPhase11ReinvestigationDispatch({ challengeGate: gate, run, baselineArtifactVersions });
    const previousCandidate = candidateForDispatch({ challengeGate: gate, dispatch });
    await acquirePhase11DispatchLease({ runId: run.run_id, dispatch, workerId });
    try {
      const completed = await executeOneDispatch({ run, m12Contract, dispatch, previousCandidate, gate, readArtifacts, buildPrompt, callProvider });
      gate = buildOperatorChallengeLayer3({ inventory, semanticLedger, priorChallengeGate: completed.gateWithAttempt, run }).challenge_gate;
      dispatchCount += 1;
      dispatchReceipts.push(completed.receipt);
      await saveIndependent(run.run_id, "operator_challenge_reinvestigation_ledger", gate.operator_challenge_reinvestigation_ledger, gate.status);
      await saveCheckpoint(run, dispatch, "COMPLETE", completed.checkpoint, { receipt: completed.receipt, resulting_gate_status: gate.status });
    } finally {
      await releasePhase11DispatchLease({ runId: run.run_id, dispatchId: dispatch.dispatch_id, workerId });
    }
    if (dispatchCount > Math.max(1, Number(initialChallengeGate?.operator_challenge_reinvestigation_ledger?.entries?.length || 0) * 2 + 2)) throw new Error("PHASE11_REINVESTIGATION_LOOP_GUARD_EXCEEDED");
  }
  return { challenge_gate: { ...gate, reinvestigation_dispatch_adapter: { schema_version: "phase11_reinvestigation_dispatch_return_adapter.v2.production", status: "COMPLETE", dispatch_count: dispatchCount, mutation_guard_active: true, durable_checkpoints_active: true, run_scoped_lease_active: true, owner_phase_locking_performed: false, normal_downstream_cascade_allowed: false, returned_directly_to_phase11: true, dispatch_receipts: dispatchReceipts } }, dispatch_count: dispatchCount, dispatch_receipts: dispatchReceipts };
}

async function executeOneDispatch({ run, m12Contract, dispatch, previousCandidate, gate, readArtifacts, buildPrompt, callProvider }) {
  let checkpoint = await readCheckpoint(run.run_id);
  if (!checkpointMayResume(checkpoint, dispatch) || checkpoint.stage === "COMPLETE") checkpoint = null;
  const guardNames = ownerGuardArtifactNames(dispatch);
  const beforeArtifacts = checkpoint?.payload?.before_artifacts || await readNamedArtifacts(run.run_id, guardNames, AGENT);
  const baselineVersions = checkpoint?.payload?.baseline_artifact_versions || dispatch.baseline_artifact_versions;
  if (!checkpoint) checkpoint = await saveCheckpoint(run, dispatch, "DISPATCH_CREATED", null, { dispatch, guard_artifact_names: guardNames, before_artifacts: beforeArtifacts, baseline_artifact_versions: baselineVersions });

  if (checkpoint.stage === "ATTEMPT_RECORDED") {
    const recorded = checkpoint.payload?.attempt_result;
    if (!recorded) throw new Error("PHASE11_CHECKPOINT_ATTEMPT_RESULT_MISSING");
    return buildCompletedDispatch({ dispatch, checkpoint, gateWithAttempt: recordOperatorChallengeReinvestigationAttempt({ challengeGate: gate, result: recorded }), attemptResult: recorded, mutation: checkpoint.payload?.mutation_guard || { status: "PASS" } });
  }

  let runtimeError = checkpoint?.payload?.runtime_error ? new Error(checkpoint.payload.runtime_error) : null;
  let returnedArtifactVersions = checkpoint?.payload?.returned_artifact_versions || null;
  if (!["OWNER_RETURNED", "RETURN_VALIDATED"].includes(checkpoint.stage)) {
    const currentVersions = await artifactVersions(run.run_id, dispatch.artifact_names);
    if (!versionAdvanced(baselineVersions, currentVersions)) {
      checkpoint = await saveCheckpoint(run, dispatch, "OWNER_RUNNING", checkpoint, { ...checkpoint.payload });
      try { await executeOwnerPhase({ run, dispatch, readArtifacts, buildPrompt, callProvider }); }
      catch (error) { runtimeError = error; await logEvent({ run_id: run.run_id, event_type: "PHASE11_REINVESTIGATION_OWNER_ERROR", actor: AGENT, payload: { dispatch_id: dispatch.dispatch_id, owner_internal_job: dispatch.owner_internal_job, attempt_number: dispatch.attempt_number, message: error.message } }); }
    }
    returnedArtifactVersions = await artifactVersions(run.run_id, dispatch.artifact_names);
    checkpoint = await saveCheckpoint(run, dispatch, "OWNER_RETURNED", checkpoint, { ...checkpoint.payload, returned_artifact_versions: returnedArtifactVersions, runtime_error: runtimeError?.message || "" });
  }

  let mutation = checkpoint.payload?.mutation_guard || null;
  if (checkpoint.stage !== "RETURN_VALIDATED") {
    const afterArtifacts = await readNamedArtifacts(run.run_id, guardNames, AGENT);
    mutation = validatePhase11TargetedMutation({ dispatch: { ...dispatch, artifact_names: guardNames }, beforeArtifacts, afterArtifacts });
    if (mutation.rollback_required) {
      await rollbackArtifacts({ run, dispatch, beforeArtifacts, artifactNames: guardNames });
      runtimeError = new Error(`PHASE11_UNAUTHORIZED_MUTATION:${mutation.unauthorized_changes.map((row) => row.path).join("|")}`);
      returnedArtifactVersions = await artifactVersions(run.run_id, dispatch.artifact_names);
    }
    checkpoint = await saveCheckpoint(run, dispatch, "RETURN_VALIDATED", checkpoint, { ...checkpoint.payload, returned_artifact_versions: returnedArtifactVersions, mutation_guard: mutation, runtime_error: runtimeError?.message || "" });
  }

  const currentInventory = await rebuildInventory({ run, m12Contract, readArtifacts });
  const attemptResult = evaluatePhase11ReinvestigationReturn({ dispatch, previousCandidate, currentInventory, returnedArtifactVersions, runtimeError });
  const gateWithAttempt = recordOperatorChallengeReinvestigationAttempt({ challengeGate: gate, result: attemptResult });
  checkpoint = await saveCheckpoint(run, dispatch, "ATTEMPT_RECORDED", checkpoint, { ...checkpoint.payload, attempt_result: attemptResult });
  return buildCompletedDispatch({ dispatch, checkpoint, gateWithAttempt, attemptResult, mutation });
}

function buildCompletedDispatch({ dispatch, checkpoint, gateWithAttempt, attemptResult, mutation }) {
  return { gateWithAttempt, checkpoint, receipt: { dispatch_id: dispatch.dispatch_id, challenge_candidate_id: dispatch.challenge_candidate_id, attempt_number: dispatch.attempt_number, owning_phase: dispatch.owning_phase, owner_internal_job: dispatch.owner_internal_job, result: attemptResult.result, mutation_guard_status: mutation?.status || "PASS", validation_basis: attemptResult.validation_basis, return_fingerprint: attemptResult.return_fingerprint } };
}

async function executeOwnerPhase({ run, dispatch, readArtifacts, buildPrompt, callProvider }) {
  if (dispatch.owner_internal_job === "M11") return runPhase10TargetedReinvestigation({ run, dispatch, contract: getInternalJobContract("M11"), readArtifacts, buildPrompt, callProvider });
  const baseContract = getInternalJobContract(dispatch.owner_internal_job);
  const scopedContract = phase11DispatchContractForRun({ contract: { ...baseContract }, dispatch });
  const targetedRun = { ...run, current_phase: dispatch.owner_internal_job, phase11_reinvestigation_context: scopedContract.phase11_reinvestigation_context };
  const actor = OWNER_ACTOR[dispatch.owner_internal_job];
  if (!actor) throw new Error(`PHASE11_REINVESTIGATION_OWNER_JOB_UNSUPPORTED:${dispatch.owner_internal_job}`);
  const saveArtifact = async ({ artifact_name, artifact, lock_status }) => saveRuntimeArtifact({ run_id: run.run_id, phase: dispatch.owner_internal_job, agent_id: actor, artifact_name, artifact, lock_status: lock_status || artifact?.status || "LOCKED_WITH_LIMITATIONS" });
  const targetedBuildPrompt = (params = {}) => buildPrompt({ ...params, prompt_files: [...new Set([...(params.prompt_files || []), ADDENDUM])], run: { ...(params.run || targetedRun), phase11_reinvestigation_context: scopedContract.phase11_reinvestigation_context } });
  const common = { run: targetedRun, internalJobId: dispatch.owner_internal_job, contract: scopedContract, readArtifacts, buildPrompt: targetedBuildPrompt, callProvider, saveArtifact };
  if (dispatch.owner_internal_job === "P3_DOMAIN_DERIVATION_LAYER") return runDomainDerivationPhase(common);
  if (dispatch.owner_internal_job === "M8_TARGET_FEATURE_PROFILE") return runActivityProfileReviewPhase(common);
  if (dispatch.owner_internal_job === "DATA_PROVENANCE_PROFILE_LAYER4") return runDataProvenanceProfilePhase(common);
  if (dispatch.owner_internal_job === "DOMAIN_CONTROL_OBLIGATION_PROFILE") return runDomainControlObligationProfilePhase(common);
  throw new Error(`PHASE11_REINVESTIGATION_OWNER_JOB_UNSUPPORTED:${dispatch.owner_internal_job}`);
}

function ownerGuardArtifactNames(dispatch) {
  if (dispatch.owner_internal_job === "M11") return [...new Set(dispatch.artifact_names || [])];
  const contract = getInternalJobContract(dispatch.owner_internal_job);
  return [...new Set([...(contract.writes || []).filter((name) => !String(name).includes("{")), ...(dispatch.artifact_names || [])])];
}
async function rollbackArtifacts({ run, dispatch, beforeArtifacts, artifactNames }) { const actor = OWNER_ACTOR[dispatch.owner_internal_job] || "agent_5_exposure_registry"; for (const name of artifactNames) if (beforeArtifacts[name] !== undefined) await saveRuntimeArtifact({ run_id: run.run_id, phase: dispatch.owner_internal_job, agent_id: actor, artifact_name: name, artifact: beforeArtifacts[name], lock_status: "LOCKED_WITH_LIMITATIONS" }); }
async function rebuildInventory({ run, m12Contract, readArtifacts }) { const routed = await readPhaseRouteRuntimePacket({ internalJobId: "M12", readArtifacts, consumerAgentId: m12Contract.actor_id || m12Contract.agent_id || AGENT }); return buildOperatorChallengeInventory({ run, artifacts: routed.artifacts }).operator_challenge_inventory; }
async function saveCheckpoint(run, dispatch, stage, previous, payload) { const checkpoint = buildPhase11DispatchCheckpoint({ run, dispatch, stage, previous, payload }); await saveIndependent(run.run_id, CHECKPOINT, checkpoint, checkpoint.status === "COMPLETE" ? "LOCKED" : "CREATED"); return checkpoint; }
async function readCheckpoint(runId) { try { return await readRuntimeArtifactPayload({ run_id: runId, artifact_name: CHECKPOINT, agent_id: AGENT }); } catch { return null; } }
async function readNamedArtifacts(runId, names = [], agentId = AGENT) { const out = {}; for (const name of names) { try { out[name] = await readRuntimeArtifactPayload({ run_id: runId, artifact_name: name, agent_id: agentId }); } catch { out[name] = undefined; } } return out; }
async function artifactVersions(runId, names = []) { const out = {}; for (const name of [...new Set(names.filter(Boolean))]) { try { const meta = await getArtifactMetadata(runId, name); out[name] = Number(meta.latest_version || meta.version || 0); } catch { out[name] = 0; } } return out; }
function versionAdvanced(before = {}, after = {}) { return Object.keys(before).some((name) => Number(after[name] || 0) > Number(before[name] || 0)); }
async function saveIndependent(runId, artifactName, artifact, lockStatus) { return saveRuntimeArtifact({ run_id: runId, phase: "M12", agent_id: AGENT, artifact_name: artifactName, artifact, lock_status: lockStatus || "LOCKED" }); }
