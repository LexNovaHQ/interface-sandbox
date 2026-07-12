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
import { runM11OrchestratedPhase } from "../10-exposure-profile/exposure-profile.runner.js";
import { buildOperatorChallengeInventory } from "./operator-challenge-inventory.js";
import { buildOperatorChallengeLayer3 } from "./operator-challenge-adjudication.js";
import { recordOperatorChallengeReinvestigationAttempt } from "./operator-challenge-reinvestigation.js";
import {
  createPhase11ReinvestigationDispatch,
  phase11DispatchContractForRun,
  evaluatePhase11ReinvestigationReturn,
  candidateForDispatch
} from "./operator-challenge-dispatch.js";

const ADDENDUM = "agent-packages/agent_7_operator_challenge/PHASE11_TARGETED_REINVESTIGATION_ADDENDUM.md";
const OWNER_ACTOR = Object.freeze({
  P3_DOMAIN_DERIVATION_LAYER: "agent_3_target_feature",
  M8_TARGET_FEATURE_PROFILE: "agent_3_target_feature",
  DATA_PROVENANCE_PROFILE_LAYER4: "agent_4_data_privacy",
  DOMAIN_CONTROL_OBLIGATION_PROFILE: "agent_8_domain_control_obligation",
  M11: "agent_5_exposure_registry"
});

export async function executePhase11ReinvestigationLoop({
  run,
  m12Contract,
  inventory,
  semanticLedger,
  initialChallengeGate,
  readArtifacts,
  buildPrompt = buildPhasePrompt,
  callProvider = callProviderJson
} = {}) {
  let gate = initialChallengeGate;
  let dispatchCount = 0;
  const dispatchReceipts = [];

  while (gate?.status === "REINVESTIGATION_REQUIRED") {
    const directive = Array.isArray(gate.reinvestigation_directives) ? gate.reinvestigation_directives[0] : null;
    if (!directive) throw new Error("PHASE11_REINVESTIGATION_DIRECTIVE_MISSING");
    const baselineArtifactVersions = await artifactVersions(run.run_id, directive.artifact_names);
    const dispatch = createPhase11ReinvestigationDispatch({ challengeGate: gate, run, baselineArtifactVersions });
    const previousCandidate = candidateForDispatch({ challengeGate: gate, dispatch });
    let runtimeError = null;

    try {
      await executeOwnerPhase({ run, dispatch, readArtifacts, buildPrompt, callProvider });
    } catch (error) {
      runtimeError = error;
      await logEvent({
        run_id: run.run_id,
        event_type: "PHASE11_REINVESTIGATION_OWNER_ERROR",
        actor: "agent_7_m12",
        payload: { dispatch_id: dispatch.dispatch_id, owner_internal_job: dispatch.owner_internal_job, attempt_number: dispatch.attempt_number, message: error.message }
      });
    }

    const returnedArtifactVersions = await artifactVersions(run.run_id, dispatch.artifact_names);
    const currentInventory = await rebuildInventory({ run, m12Contract, readArtifacts });
    const attemptResult = evaluatePhase11ReinvestigationReturn({ dispatch, previousCandidate, currentInventory, returnedArtifactVersions, runtimeError });
    const gateWithAttempt = recordOperatorChallengeReinvestigationAttempt({ challengeGate: gate, result: attemptResult });
    gate = buildOperatorChallengeLayer3({ inventory, semanticLedger, priorChallengeGate: gateWithAttempt, run }).challenge_gate;
    dispatchCount += 1;
    dispatchReceipts.push({
      dispatch_id: dispatch.dispatch_id,
      challenge_candidate_id: dispatch.challenge_candidate_id,
      attempt_number: dispatch.attempt_number,
      owning_phase: dispatch.owning_phase,
      owner_internal_job: dispatch.owner_internal_job,
      result: attemptResult.result,
      validation_basis: attemptResult.validation_basis,
      return_fingerprint: attemptResult.return_fingerprint
    });

    if (dispatchCount > Math.max(1, Number(initialChallengeGate?.operator_challenge_reinvestigation_ledger?.entries?.length || 0) * 2 + 2)) {
      throw new Error("PHASE11_REINVESTIGATION_LOOP_GUARD_EXCEEDED");
    }
  }

  return {
    challenge_gate: {
      ...gate,
      reinvestigation_dispatch_adapter: {
        schema_version: "phase11_reinvestigation_dispatch_return_adapter.v1",
        status: "COMPLETE",
        dispatch_count: dispatchCount,
        owner_phase_locking_performed: false,
        normal_downstream_cascade_allowed: false,
        returned_directly_to_phase11: true,
        dispatch_receipts: dispatchReceipts
      }
    },
    dispatch_count: dispatchCount,
    dispatch_receipts: dispatchReceipts
  };
}

async function executeOwnerPhase({ run, dispatch, readArtifacts, buildPrompt, callProvider }) {
  const baseContract = getInternalJobContract(dispatch.owner_internal_job);
  const scopedContract = phase11DispatchContractForRun({ contract: { ...baseContract }, dispatch });
  const targetedRun = {
    ...run,
    current_phase: dispatch.owner_internal_job,
    phase11_reinvestigation_context: scopedContract.phase11_reinvestigation_context
  };
  const actor = OWNER_ACTOR[dispatch.owner_internal_job];
  if (!actor) throw new Error(`PHASE11_REINVESTIGATION_OWNER_JOB_UNSUPPORTED:${dispatch.owner_internal_job}`);
  const saveArtifact = async ({ artifact_name, artifact, lock_status }) => saveRuntimeArtifact({
    run_id: run.run_id,
    phase: dispatch.owner_internal_job,
    agent_id: actor,
    artifact_name,
    artifact,
    lock_status: lock_status || artifact?.status || "LOCKED_WITH_LIMITATIONS"
  });
  const targetedBuildPrompt = (params = {}) => buildPrompt({
    ...params,
    prompt_files: [...new Set([...(params.prompt_files || []), ADDENDUM])],
    run: { ...(params.run || targetedRun), phase11_reinvestigation_context: scopedContract.phase11_reinvestigation_context }
  });
  const common = {
    run: targetedRun,
    internalJobId: dispatch.owner_internal_job,
    contract: scopedContract,
    readArtifacts,
    buildPrompt: targetedBuildPrompt,
    callProvider,
    saveArtifact
  };

  if (dispatch.owner_internal_job === "P3_DOMAIN_DERIVATION_LAYER") return runDomainDerivationPhase(common);
  if (dispatch.owner_internal_job === "M8_TARGET_FEATURE_PROFILE") return runActivityProfileReviewPhase(common);
  if (dispatch.owner_internal_job === "DATA_PROVENANCE_PROFILE_LAYER4") return runDataProvenanceProfilePhase(common);
  if (dispatch.owner_internal_job === "DOMAIN_CONTROL_OBLIGATION_PROFILE") return runDomainControlObligationProfilePhase(common);
  if (dispatch.owner_internal_job === "M11") return runM11OrchestratedPhase({
    run: targetedRun,
    phase: "M11",
    contract: scopedContract,
    readArtifacts
  });
  throw new Error(`PHASE11_REINVESTIGATION_OWNER_JOB_UNSUPPORTED:${dispatch.owner_internal_job}`);
}

async function rebuildInventory({ run, m12Contract, readArtifacts }) {
  const routed = await readPhaseRouteRuntimePacket({
    internalJobId: "M12",
    readArtifacts,
    consumerAgentId: m12Contract.actor_id || m12Contract.agent_id || "agent_7_m12"
  });
  return buildOperatorChallengeInventory({ run, artifacts: routed.artifacts }).operator_challenge_inventory;
}

async function artifactVersions(runId, artifactNames = []) {
  const out = {};
  for (const artifactName of [...new Set((artifactNames || []).filter(Boolean))]) {
    try {
      const meta = await getArtifactMetadata(runId, artifactName);
      out[artifactName] = Number(meta.latest_version || meta.version || 0);
    } catch {
      out[artifactName] = 0;
    }
  }
  return out;
}

export async function readCurrentChallengeGate({ runId, actor = "agent_7_m12" } = {}) {
  try {
    return await readRuntimeArtifactPayload({ run_id: runId, artifact_name: "challenge_gate", agent_id: actor });
  } catch {
    return null;
  }
}
