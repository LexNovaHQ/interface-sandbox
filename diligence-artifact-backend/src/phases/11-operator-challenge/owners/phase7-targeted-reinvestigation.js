import { buildPhasePrompt } from "../../../runtime/services/prompts.service.js";
import { callProviderJson } from "../../../runtime/services/provider.service.js";
import { PHASE7_DAP_BATCH_ARTIFACT_NAMES } from "../../../runtime/contracts/artifact-permissions.contract.js";
import { readPhaseRouteRuntimePacket } from "../../02-cartography-index/services/phase-route-runtime.reader.js";
import { buildPhase11TargetedMutationProposal, PHASE11_TARGETED_PROPOSAL_STATUS } from "../operator-challenge-targeted-adapter.contract.js";
import { assertPhase11TargetedPacket, injectPhase11TargetedPacket } from "../operator-challenge-targeted-packet.js";
import { artifactVersion, extractProviderArtifact, isObject, ownerAllowedPaths, readArtifactAsOwner, withTargetedAddendum } from "./targeted-owner-common.js";

export const PHASE11_PHASE7_TARGETED_REINVESTIGATION_VERSION = "phase11_phase7_single_batch_targeted_reinvestigation.v1";

export async function runPhase7TargetedReinvestigation({ run, dispatch, contract, readArtifacts, buildPrompt = buildPhasePrompt, callProvider = callProviderJson, phase11TargetedPacket } = {}) {
  assertPhase11TargetedPacket({ packet: phase11TargetedPacket, dispatch });
  const ownerInternalJob = "DATA_PROVENANCE_PROFILE_LAYER4";
  if (dispatch.owner_internal_job !== ownerInternalJob) throw new Error(`PHASE11_PHASE7_OWNER_MISMATCH:${dispatch.owner_internal_job || "missing"}`);
  const agentId = contract?.agent_id || contract?.actor_id || "agent_4_data_privacy";
  const routed = await readPhaseRouteRuntimePacket({ internalJobId: ownerInternalJob, readArtifacts, consumerAgentId: agentId });
  const targetBatchArtifact = resolveTargetBatchArtifact({ dispatch, routedArtifacts: routed.artifacts });
  const validationArtifact = validationArtifactForBatch(targetBatchArtifact);
  const currentBatch = await readArtifactAsOwner({ runId: run.run_id, artifactName: targetBatchArtifact, agentId });
  const currentValidation = await readArtifactAsOwner({ runId: run.run_id, artifactName: validationArtifact, agentId });
  const batchVersion = await artifactVersion(run.run_id, targetBatchArtifact);
  const validationVersion = await artifactVersion(run.run_id, validationArtifact);
  const prompt = await buildPrompt({
    prompt_files: withTargetedAddendum(contract?.prompt_files || []),
    phase: `PHASE11_TARGETED_REINVESTIGATION:${ownerInternalJob}:${targetBatchArtifact}`,
    run: { ...run, current_phase: ownerInternalJob, phase11_reinvestigation_context: phase11TargetedPacket },
    artifacts: injectPhase11TargetedPacket({
      artifacts: {
        ...(routed?.artifacts || {}),
        target_dap_batch_artifact_name: targetBatchArtifact,
        target_dap_batch_validation_artifact_name: validationArtifact,
        current_dap_batch_artifact: currentBatch,
        current_dap_batch_validation: currentValidation
      },
      packet: phase11TargetedPacket
    }),
    writes: [targetBatchArtifact, validationArtifact],
    references: contract?.references || []
  });
  const providerResult = await callProvider({ prompt, phase: `OPERATOR_CHALLENGE_TARGETED_${ownerInternalJob}` });
  const proposedBatch = extractProviderArtifact(providerResult, targetBatchArtifact);
  if (!isObject(proposedBatch)) {
    return buildPhase11TargetedMutationProposal({
      dispatch,
      phase11_reinvestigation_context: phase11TargetedPacket,
      status: PHASE11_TARGETED_PROPOSAL_STATUS.invalidOwnerOutput,
      proposed_writes: [],
      actual_write_manifest: [],
      provider_call_count: 1,
      substantive_reinvestigation_performed: false,
      owner_notes: `Phase 7 targeted adapter returned no object for ${targetBatchArtifact}.`
    });
  }
  return buildPhase11TargetedMutationProposal({
    dispatch,
    phase11_reinvestigation_context: phase11TargetedPacket,
    status: PHASE11_TARGETED_PROPOSAL_STATUS.proposedMutation,
    baseline_artifact_versions: { [targetBatchArtifact]: batchVersion, [validationArtifact]: validationVersion },
    proposed_writes: [
      {
        artifact_name: targetBatchArtifact,
        expected_previous_version: batchVersion,
        proposed_artifact: proposedBatch,
        lock_status: proposedBatch?.status || "LOCKED_WITH_LIMITATIONS",
        allowed_field_paths: ownerAllowedPaths(targetBatchArtifact, dispatch.field_paths),
        mechanically_dependent_paths: []
      },
      {
        artifact_name: validationArtifact,
        expected_previous_version: validationVersion,
        proposed_artifact: currentValidation,
        lock_status: currentValidation?.status || "LOCKED_WITH_LIMITATIONS",
        allowed_field_paths: [],
        mechanically_dependent_paths: [validationArtifact]
      }
    ],
    actual_write_manifest: [
      { artifact_name: targetBatchArtifact, reason: "Phase 11 targeted Phase 7 single DAP batch reinvestigation", direct_or_mechanical_dependency: "direct" },
      { artifact_name: validationArtifact, reason: "Phase 11 targeted Phase 7 matching validation artifact preserved/recommitted with target batch", direct_or_mechanical_dependency: "mechanical_dependency" }
    ],
    provider_call_count: 1,
    output_repair_count: 0,
    technical_retry_count: 0,
    substantive_reinvestigation_performed: true,
    owner_notes: `Phase 7 targeted adapter resolved ${targetBatchArtifact}; all other DAP batches are untouched.`
  });
}

function resolveTargetBatchArtifact({ dispatch, routedArtifacts = {} } = {}) {
  const direct = array(dispatch?.artifact_names).find((name) => PHASE7_DAP_BATCH_ARTIFACT_NAMES.includes(name));
  if (direct) return direct;
  const route = routedArtifacts?.dap_semantic_batch_route_manifest || {};
  const affected = new Set(array(dispatch?.affected_row_identity).concat(array(dispatch?.affected_data_field_ids)).concat(array(dispatch?.field_paths)));
  const matches = [];
  for (const row of array(route.batch_plan || route.batches || route.routes)) {
    const artifactName = String(row.artifact_name || row.batch_artifact_name || "");
    if (!PHASE7_DAP_BATCH_ARTIFACT_NAMES.includes(artifactName)) continue;
    const rowSignals = array(row.field_ids).concat(array(row.data_field_ids)).concat(array(row.expected_data_field_ids)).concat(array(row.field_paths));
    if (rowSignals.some((signal) => affected.has(String(signal)))) matches.push(artifactName);
  }
  const uniqueMatches = [...new Set(matches)];
  if (uniqueMatches.length === 1) return uniqueMatches[0];
  throw new Error(`PHASE11_PHASE7_TARGET_BATCH_AMBIGUOUS:${uniqueMatches.join("|") || "none"}`);
}

function validationArtifactForBatch(batchArtifactName) {
  const index = PHASE7_DAP_BATCH_ARTIFACT_NAMES.indexOf(batchArtifactName);
  if (index < 0) throw new Error(`PHASE11_PHASE7_BATCH_UNKNOWN:${batchArtifactName || "missing"}`);
  return `dap_semantic_batch_validation__DAP-SEM-BATCH-${String(index + 1).padStart(2, "0")}`;
}

function array(value) { return Array.isArray(value) ? value : []; }
