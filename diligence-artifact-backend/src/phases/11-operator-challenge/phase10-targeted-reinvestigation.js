import { buildPhasePrompt } from "../../runtime/services/prompts.service.js";
import { callProviderJson } from "../../runtime/services/provider.service.js";
import { readRuntimeArtifactPayload, saveRuntimeArtifact } from "../../runtime/services/artifacts.service.js";
import { readPhaseRouteRuntimePacket } from "../02-cartography-index/services/phase-route-runtime.reader.js";
import { stampPhase10ExecutionMetadata } from "../10-exposure-profile/active-threat-registry-manifest.js";
import {
  assembleAcceptedBatch,
  buildDomainAgnosticForensics,
  buildDynamicWorkpad,
  buildPackageScopedSemanticPacket,
  projectDynamicProfiles,
  validateSemanticLedger
} from "../10-exposure-profile/phase10-semantic-finalization.js";

const ADDENDUM = "agent-packages/agent_7_operator_challenge/PHASE11_TARGETED_REINVESTIGATION_ADDENDUM.md";
const BATCH_PROMPTS = Object.freeze([
  "agent-packages/agent_5_exposure_registry/AGENT5_RUNTIME_BINDING_PACKET_SYNCED_M11.yaml",
  "agent-packages/agent_5_exposure_registry/00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED_AGENT5_SYNCED.md",
  "agent-packages/agent_5_exposure_registry/00_M11_RUNTIME_CONTROLLER.md",
  "agent-packages/agent_5_exposure_registry/M11_EXPOSURE_REGISTRY.md",
  "agent-packages/agent_5_exposure_registry/M11_B_BATCH_PACKET_ASSEMBLY.md",
  "agent-packages/agent_5_exposure_registry/M11_DOMAIN_CONTROL_OBLIGATION_HANDOFF.md",
  "agent-packages/agent_5_exposure_registry/M11_C_BATCH_EVALUATION.md",
  "agent-packages/agent_5_exposure_registry/00_VALIDATOR_RULES_INTEGRATED_AGENT5_SYNCED.md",
  "agent-packages/agent_5_exposure_registry/BACKEND_CANONICAL_OUTPUT_ADAPTER.md",
  ADDENDUM
]);
const REPAIR_PROMPTS = Object.freeze([
  ...BATCH_PROMPTS.filter((name) => !name.endsWith("M11_C_BATCH_EVALUATION.md")),
  "agent-packages/agent_5_exposure_registry/M11_D_BATCH_REINVESTIGATION_REPAIR.md"
]);

export async function runPhase10TargetedReinvestigation({ run, dispatch, contract, readArtifacts, buildPrompt = buildPhasePrompt, callProvider = callProviderJson } = {}) {
  const routed = await readPhaseRouteRuntimePacket({
    internalJobId: "M11",
    readArtifacts,
    consumerAgentId: contract.agent_id || contract.actor_id || "agent_5_exposure_registry"
  });
  const artifacts = routed.artifacts;
  const manifest = unwrap(artifacts.active_threat_registry_manifest, "active_threat_registry_manifest");
  const routePlan = unwrap(artifacts.exposure_registry_route_plan, "exposure_registry_route_plan");
  const affectedKeys = new Set(dispatch.affected_row_identity || []);
  const targetBatch = array(routePlan.batch_plan).find((batch) => array(batch.expected_registry_row_keys).some((key) => affectedKeys.has(key)));
  if (!targetBatch) throw new Error(`PHASE11_PHASE10_TARGET_BATCH_NOT_FOUND:${dispatch.challenge_candidate_id}`);
  if (array(targetBatch.expected_registry_row_keys).filter((key) => affectedKeys.has(key)).length === 0) throw new Error("PHASE11_PHASE10_TARGET_BATCH_SCOPE_EMPTY");

  const packet = buildPackageScopedSemanticPacket({ batch: targetBatch, routePlan, upstreamArtifacts: artifacts, manifest });
  let semanticOutput = await callBatchModel({ run, dispatch, batch: targetBatch, packet, buildPrompt, callProvider, repair: false });
  let validation = validateSemanticLedger({ semanticOutput, batch: targetBatch, routePlan });
  if (validation.exposure_registry_batch_validation.status !== "PASS") {
    semanticOutput = await callBatchModel({ run, dispatch, batch: targetBatch, packet, buildPrompt, callProvider, repair: true, priorOutput: semanticOutput, priorValidation: validation });
    validation = validateSemanticLedger({ semanticOutput, batch: targetBatch, routePlan });
  }
  if (validation.exposure_registry_batch_validation.status !== "PASS") throw new Error(`PHASE11_PHASE10_TARGET_BATCH_INVALID:${array(validation.exposure_registry_batch_validation.failures).join("|")}`);

  const stampedValidation = stampPhase10ExecutionMetadata(validation, manifest);
  const accepted = stampPhase10ExecutionMetadata(assembleAcceptedBatch({ semanticOutput, batch: targetBatch, routePlan }), manifest);
  await save("M11", batchValidationArtifactName(targetBatch), stampedValidation, "LOCKED", run.run_id);
  await save("M11", batchArtifactName(targetBatch), accepted, "LOCKED", run.run_id);

  const acceptedBatches = [];
  const batchValidations = [];
  for (const batch of array(routePlan.batch_plan)) {
    if (batch.batch_id === targetBatch.batch_id) {
      acceptedBatches.push(accepted);
      batchValidations.push(stampedValidation);
      continue;
    }
    acceptedBatches.push(await readRuntimeArtifactPayload({ run_id: run.run_id, artifact_name: batchArtifactName(batch), agent_id: "agent_5_exposure_registry" }));
    batchValidations.push(await readRuntimeArtifactPayload({ run_id: run.run_id, artifact_name: batchValidationArtifactName(batch), agent_id: "agent_5_exposure_registry" }));
  }

  const workpad = stampPhase10ExecutionMetadata(buildDynamicWorkpad({ manifest, routePlan, acceptedBatches, batchValidations }).exposure_registry_workpad_98, manifest);
  const projections = projectDynamicProfiles({ exposure_registry_workpad_98: workpad });
  const controlled = stampPhase10ExecutionMetadata(projections.controlled.exposure_registry_controlled_profile, manifest);
  const triggered = stampPhase10ExecutionMetadata(projections.triggered.exposure_registry_triggered_profile, manifest);
  const forensics = stampPhase10ExecutionMetadata(buildDomainAgnosticForensics({
    manifest,
    routePlan,
    workpad: { exposure_registry_workpad_98: workpad },
    controlledProfile: { exposure_registry_controlled_profile: controlled },
    triggeredProfile: { exposure_registry_triggered_profile: triggered },
    acceptedBatches,
    batchValidations
  }).exposure_registry_profile_forensics, manifest);

  await save("M11", "exposure_registry_workpad_98", workpad, "LOCKED", run.run_id);
  await save("M11", "exposure_registry_controlled_profile", controlled, "LOCKED", run.run_id);
  await save("M11", "exposure_registry_triggered_profile", triggered, "LOCKED", run.run_id);
  const forensicStatus = forensics?.forensic_lock_gate_result?.status === "PASS" ? "LOCKED" : "LOCKED_WITH_LIMITATIONS";
  await save("M11", "exposure_registry_profile_forensics", forensics, forensicStatus, run.run_id);

  return {
    ok: true,
    targeted_batch_id: targetBatch.batch_id,
    targeted_registry_row_keys: array(targetBatch.expected_registry_row_keys).filter((key) => affectedKeys.has(key)),
    unaffected_batch_count_reused: Math.max(0, array(routePlan.batch_plan).length - 1),
    rebuilt_artifacts: [
      batchValidationArtifactName(targetBatch),
      batchArtifactName(targetBatch),
      "exposure_registry_workpad_98",
      "exposure_registry_controlled_profile",
      "exposure_registry_triggered_profile",
      "exposure_registry_profile_forensics"
    ],
    full_phase_batch_rerun_performed: false,
    normal_downstream_cascade_allowed: false
  };
}

async function callBatchModel({ run, dispatch, batch, packet, buildPrompt, callProvider, repair, priorOutput = null, priorValidation = null }) {
  const prompt = await buildPrompt({
    prompt_files: repair ? REPAIR_PROMPTS : BATCH_PROMPTS,
    phase: `PHASE11_REINVESTIGATION:${repair ? "REPAIR" : "BATCH"}:${batch.batch_id}`,
    run: { ...run, phase11_reinvestigation_context: dispatch },
    artifacts: repair ? {
      m11_batch_packet: packet.m11_batch_packet,
      m11_batch_registry_ledger: priorOutput,
      backend_structural_validation: priorValidation,
      phase11_reinvestigation_context: dispatch
    } : { m11_batch_packet: packet.m11_batch_packet, phase11_reinvestigation_context: dispatch },
    writes: ["m11_batch_registry_ledger"],
    references: []
  });
  const result = await callProvider({ prompt, phase: `OPERATOR_CHALLENGE_PHASE10_${repair ? "REPAIR" : "REINVESTIGATION"}` });
  return result?.json || result || {};
}

async function save(phase, artifact_name, artifact, lock_status, run_id) {
  return saveRuntimeArtifact({ run_id, phase, agent_id: "agent_5_exposure_registry", artifact_name, artifact, lock_status });
}
function batchArtifactSuffix(batch = {}) {
  const prefix = `${batch.stream_type || ""}${batch.package_id || ""}${batch.batch_group || ""}`.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const number = String(batch.batch_number || String(batch.batch_id || "").split("__").pop() || "1").padStart(3, "0");
  if (!prefix) throw new Error("PHASE11_PHASE10_BATCH_SUFFIX_MISSING");
  return `${prefix}__${number}`;
}
function batchArtifactName(batch) { return `exposure_registry_batch__${batchArtifactSuffix(batch)}`; }
function batchValidationArtifactName(batch) { return `exposure_registry_batch_validation__${batchArtifactSuffix(batch)}`; }
function unwrap(value, key) { return value?.[key] || value?.artifact?.[key] || value || {}; }
function array(value) { return Array.isArray(value) ? value : []; }
