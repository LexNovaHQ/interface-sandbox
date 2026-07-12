import { logEvent } from "../../runtime/services/storage/firestore.service.js";
import { buildPhasePrompt } from "../../runtime/services/prompts.service.js";
import { callGeminiJson } from "../../runtime/services/provider.service.js";
import { loadReferencePacket } from "../../runtime/services/reference.service.js";
import { lockPhase, readArtifact, readArtifactPayload, saveArtifact } from "../../runtime/services/artifacts.service.js";
import { readPhaseRouteRuntimePacket } from "../02-cartography-index/services/phase-route-runtime.reader.js";
import {
  artifactMatchesPhase10ExecutionFingerprint,
  buildActiveThreatRegistryManifest,
  isCurrentActiveThreatRegistryManifest,
  resolveActiveThreatRegistryContext,
  stampPhase10ExecutionMetadata
} from "./active-threat-registry-manifest.js";
import {
  buildPackageScopedExposureRegistryRoutePlan,
  finalizePhase10RoutingContext,
  PACKAGE_SCOPED_ROUTE_PLAN_SCHEMA
} from "./phase10-classification-routing.js";
import { assertRequiredPhase5ClassificationStreams } from "./phase10-classification-inventory.validator.js";
import {
  assembleAcceptedBatch,
  buildDomainAgnosticForensics,
  buildDynamicWorkpad,
  buildPackageScopedSemanticPacket,
  projectDynamicProfiles,
  validateSemanticLedger
} from "./phase10-semantic-finalization.js";

const AGENT_5 = "agent_5_exposure_registry";
const ACCEPTED = new Set(["LOCKED", "LOCKED_WITH_LIMITATIONS", "COMPLETE"]);
const BATCH_PROMPTS = Object.freeze([
  "agent-packages/agent_5_exposure_registry/AGENT5_RUNTIME_BINDING_PACKET_SYNCED_M11.yaml",
  "agent-packages/agent_5_exposure_registry/00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED_AGENT5_SYNCED.md",
  "agent-packages/agent_5_exposure_registry/00_M11_RUNTIME_CONTROLLER.md",
  "agent-packages/agent_5_exposure_registry/M11_EXPOSURE_REGISTRY.md",
  "agent-packages/agent_5_exposure_registry/M11_B_BATCH_PACKET_ASSEMBLY.md",
  "agent-packages/agent_5_exposure_registry/M11_DOMAIN_CONTROL_OBLIGATION_HANDOFF.md",
  "agent-packages/agent_5_exposure_registry/M11_C_BATCH_EVALUATION.md",
  "agent-packages/agent_5_exposure_registry/00_VALIDATOR_RULES_INTEGRATED_AGENT5_SYNCED.md",
  "agent-packages/agent_5_exposure_registry/BACKEND_CANONICAL_OUTPUT_ADAPTER.md"
]);
const REPAIR_PROMPTS = Object.freeze([
  "agent-packages/agent_5_exposure_registry/AGENT5_RUNTIME_BINDING_PACKET_SYNCED_M11.yaml",
  "agent-packages/agent_5_exposure_registry/00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED_AGENT5_SYNCED.md",
  "agent-packages/agent_5_exposure_registry/00_M11_RUNTIME_CONTROLLER.md",
  "agent-packages/agent_5_exposure_registry/M11_EXPOSURE_REGISTRY.md",
  "agent-packages/agent_5_exposure_registry/M11_B_BATCH_PACKET_ASSEMBLY.md",
  "agent-packages/agent_5_exposure_registry/M11_DOMAIN_CONTROL_OBLIGATION_HANDOFF.md",
  "agent-packages/agent_5_exposure_registry/M11_D_BATCH_REINVESTIGATION_REPAIR.md",
  "agent-packages/agent_5_exposure_registry/00_VALIDATOR_RULES_INTEGRATED_AGENT5_SYNCED.md",
  "agent-packages/agent_5_exposure_registry/BACKEND_CANONICAL_OUTPUT_ADAPTER.md"
]);
const ART = Object.freeze({
  manifest: "active_threat_registry_manifest",
  legalIndex: "legal_cartography_index",
  featureMain: "target_feature_profile",
  route: "exposure_registry_route_plan",
  workpad: "exposure_registry_workpad_98",
  controlled: "exposure_registry_controlled_profile",
  triggered: "exposure_registry_triggered_profile",
  forensics: "exposure_registry_profile_forensics"
});

export const M11_PHASE2G_RUNTIME_STATUS = Object.freeze({
  routing_authority: "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY",
  route_id: "ROUTE.PHASE10.EXPOSURE_PROFILE",
  bucket_id: "2F_BUCKET_LEGAL_CARTOGRAPHY_LEGAL_SIGNALS",
  delivery_mode: "SOURCE_BUCKET_PROFILE",
  lossless_evidence_is_primary: true,
  index_navigation_mandatory: true,
  preceding_forensic_inputs_forbidden: true,
  infrastructure_authority: "CENTRAL_RUNTIME_SERVICES",
  phase_owned_path: "src/phases/10-exposure-profile",
  deterministic_route_stage: "CO_4_CO_5_CO_6_ACTIVE",
  semantic_package_stage: "CO_7_CONTRACT_READY",
  semantic_runtime_stage: "CO_8_DOMAIN_AGNOSTIC_LAYER2_ACTIVE",
  deterministic_finalization_stage: "CO_9_DYNAMIC_LAYER3_ACTIVE",
  forensics_stage: "CO_10_DOMAIN_AGNOSTIC_TRACE_ACTIVE"
});

export async function runM11OrchestratedPhase({ run, phase, contract }) {
  if (!(contract.reads || []).includes("phase_routing_manifest")) throw new Error("M11_PHASE2G_MANIFEST_READ_MISSING");
  const routed = await readPhaseRouteRuntimePacket({
    internalJobId: "M11",
    consumerAgentId: contract.agent_id || AGENT_5,
    readArtifacts: ({ reads, agent_id, strict }) => readArtifactsForM11({ run_id: run.run_id, reads, agent_id, strict })
  });
  const artifacts = routed.artifacts;
  assertM11RoutePacket(artifacts.phase_route_runtime_packet);
  const baseReferencePacket = await loadReferencePacket(contract.references || []);

  let registryContext;
  try {
    const selectedContext = await resolveActiveThreatRegistryContext({ runId: run.run_id, artifacts, baseReferencePacket });
    registryContext = finalizePhase10RoutingContext({ registryContext: selectedContext, targetFeatureProfile: artifacts[ART.featureMain] });
    assertRequiredPhase5ClassificationStreams({ inventory: registryContext.classification_inventory, manifest: registryContext.artifact });
  } catch (error) {
    return controlledFailure({ run, phase, eventType: "M11_AUTO_SELECTOR_OR_CLASSIFICATION_ADAPTER_CONTROLLED_FAILURE", error });
  }

  const manifest = await getOrBuildActiveThreatRegistryManifest({ run, phase, registryContext });
  if (!isAccepted(manifest.lock_status)) return lockPhase({ run_id: run.run_id, phase, agent_id: AGENT_5, status: "CONTROLLED_FAILURE", next_phase: phase });
  const route = await getOrBuildRoutePlan({ run, phase, artifacts, registryContext, manifest: manifest.artifact });
  if (!isAccepted(route.lock_status)) return lockPhase({ run_id: run.run_id, phase, agent_id: AGENT_5, status: "CONTROLLED_FAILURE", next_phase: phase });

  const acceptedBatches = [];
  const batchValidations = [];
  for (const batch of route.artifact.batch_plan || []) {
    const checkpoint = await readCompletedBatchCheckpoint({
      run_id: run.run_id,
      batch,
      expectedExecutionFingerprint: manifest.artifact.phase10_execution_fingerprint
    });
    if (checkpoint) {
      acceptedBatches.push(checkpoint.batchArtifact);
      batchValidations.push(checkpoint.validationArtifact);
      continue;
    }

    let packet;
    try {
      packet = buildPackageScopedSemanticPacket({ batch, routePlan: route.artifact, upstreamArtifacts: artifacts, manifest: manifest.artifact });
    } catch (error) {
      return failBatch({ run, phase, batch, failures: [String(error?.message || error)], manifest: manifest.artifact });
    }

    let semanticOutput = await callSemanticModel({ run, phase, batch, packet, repair: false });
    let validation = validateSemanticLedger({ semanticOutput, batch, routePlan: route.artifact });
    if (validation.exposure_registry_batch_validation.status !== "PASS") {
      semanticOutput = await callSemanticModel({ run, phase, batch, packet, repair: true, priorOutput: semanticOutput, priorValidation: validation });
      validation = validateSemanticLedger({ semanticOutput, batch, routePlan: route.artifact });
    }
    if (validation.exposure_registry_batch_validation.status !== "PASS") {
      return failBatch({ run, phase, batch, failures: validation.exposure_registry_batch_validation.failures, manifest: manifest.artifact, validation });
    }

    const stampedValidation = stampPhase10ExecutionMetadata(validation, manifest.artifact);
    const accepted = stampPhase10ExecutionMetadata(assembleAcceptedBatch({ semanticOutput, batch, routePlan: route.artifact }), manifest.artifact);
    const validationName = `exposure_registry_batch_validation__${batch.batch_id}`;
    const batchName = `exposure_registry_batch__${batch.batch_id}`;
    await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_5, artifact_name: validationName, artifact: stampedValidation, lock_status: "LOCKED" }));
    await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_5, artifact_name: batchName, artifact: accepted, lock_status: "LOCKED" }));
    acceptedBatches.push(accepted);
    batchValidations.push(stampedValidation);
  }

  let workpad;
  let controlled;
  let triggered;
  let forensics;
  try {
    workpad = await getOrBuildArtifact({
      run, phase, artifactName: ART.workpad, manifest: manifest.artifact,
      build: () => buildDynamicWorkpad({ manifest: manifest.artifact, routePlan: route.artifact, acceptedBatches, batchValidations })[ART.workpad]
    });
    const projections = projectDynamicProfiles({ [ART.workpad]: workpad.artifact });
    controlled = await getOrBuildArtifact({ run, phase, artifactName: ART.controlled, manifest: manifest.artifact, build: () => projections.controlled[ART.controlled] });
    triggered = await getOrBuildArtifact({ run, phase, artifactName: ART.triggered, manifest: manifest.artifact, build: () => projections.triggered[ART.triggered] });
    forensics = await getOrBuildArtifact({
      run, phase, artifactName: ART.forensics, manifest: manifest.artifact,
      build: () => buildDomainAgnosticForensics({
        manifest: manifest.artifact,
        routePlan: route.artifact,
        workpad: { [ART.workpad]: workpad.artifact },
        controlledProfile: { [ART.controlled]: controlled.artifact },
        triggeredProfile: { [ART.triggered]: triggered.artifact },
        acceptedBatches,
        batchValidations
      })[ART.forensics]
    });
  } catch (error) {
    return controlledFailure({ run, phase, eventType: "M11_LAYER3_OR_FORENSICS_CONTROLLED_FAILURE", error });
  }

  const finalStatus = forensics.artifact?.forensic_lock_gate_result?.status === "PASS" ? "LOCKED" : "REPAIR_REQUIRED";
  await logEvent({
    run_id: run.run_id,
    event_type: "M11_DOMAIN_AGNOSTIC_PHASE_COMPLETED",
    actor: AGENT_5,
    payload: {
      mounted_packages: manifest.artifact.mounted_packages,
      expected_registry_row_keys: manifest.artifact.expected_registry_row_key_count,
      stream_count: route.artifact.stream_plans?.length || 0,
      batch_count: route.artifact.batch_plan?.length || 0,
      accepted_batch_count: acceptedBatches.length,
      controlled_rows: controlled.artifact.controlled_rows?.length || 0,
      triggered_rows: triggered.artifact.triggered_rows?.length || 0,
      phase10_execution_fingerprint: manifest.artifact.phase10_execution_fingerprint,
      final_status: finalStatus
    }
  });
  return lockPhase({ run_id: run.run_id, phase, agent_id: AGENT_5, status: finalStatus, next_phase: finalStatus === "LOCKED" ? contract.next : phase });
}

async function callSemanticModel({ run, phase, batch, packet, repair, priorOutput = null, priorValidation = null }) {
  const prompt = await buildPhasePrompt({
    prompt_files: repair ? REPAIR_PROMPTS : BATCH_PROMPTS,
    phase: `${phase}:${repair ? "M11_REPAIR" : "M11_BATCH"}:${batch.batch_id}`,
    run,
    artifacts: repair ? {
      m11_batch_packet: packet.m11_batch_packet,
      m11_batch_registry_ledger: priorOutput,
      backend_structural_validation: priorValidation,
      repair_context: {
        batch_id: batch.batch_id,
        package_id: batch.package_id,
        stream_id: batch.stream_id,
        repair_reason: "SEMANTIC_LEDGER_VALIDATION",
        maximum_attempts: 1
      }
    } : { m11_batch_packet: packet.m11_batch_packet },
    writes: ["m11_batch_registry_ledger"],
    references: []
  });
  return (await callGeminiJson({ prompt, phase: `${phase}:${repair ? "REPAIR" : "BATCH"}:${batch.batch_id}`, temperature: 0, repairOnJsonParse: true })).json;
}

async function getOrBuildActiveThreatRegistryManifest({ run, phase, registryContext }) {
  const expected = registryContext.phase10_execution_fingerprint;
  const existing = await readAcceptedCheckpoint({ run_id: run.run_id, artifact_name: ART.manifest });
  if (existing && isCurrentActiveThreatRegistryManifest(existing.artifact, expected)) return existing;
  const artifact = buildActiveThreatRegistryManifest({ context: registryContext })[ART.manifest];
  const lock_status = artifact.validation?.status === "PASS" || artifact.validation?.status === "PASS_WITH_LIMITATION" ? "LOCKED" : "CONTROLLED_FAILURE";
  await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_5, artifact_name: ART.manifest, artifact, lock_status }));
  return { artifact, lock_status };
}

async function getOrBuildRoutePlan({ run, phase, artifacts, registryContext, manifest }) {
  const existing = await readAcceptedCheckpoint({ run_id: run.run_id, artifact_name: ART.route });
  if (existing && artifactMatchesPhase10ExecutionFingerprint(existing.artifact, manifest.phase10_execution_fingerprint) && existing.artifact?.schema_version === PACKAGE_SCOPED_ROUTE_PLAN_SCHEMA) return existing;
  const output = buildPackageScopedExposureRegistryRoutePlan({ registryContext, targetFeatureProfile: artifacts[ART.featureMain], legalCartographyIndex: artifacts[ART.legalIndex], upstreamArtifacts: artifacts, runId: run.run_id, manifest });
  const artifact = stampPhase10ExecutionMetadata(output[ART.route], manifest);
  const lock_status = routePlanLockStatus(artifact.phase_a_validation?.status);
  await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_5, artifact_name: ART.route, artifact, lock_status }));
  return { artifact, lock_status };
}

async function getOrBuildArtifact({ run, phase, artifactName, manifest, build }) {
  const existing = await readAcceptedCheckpoint({ run_id: run.run_id, artifact_name: artifactName });
  if (existing && artifactMatchesPhase10ExecutionFingerprint(existing.artifact, manifest.phase10_execution_fingerprint)) return existing;
  const artifact = stampPhase10ExecutionMetadata(build(), manifest);
  const lock_status = artifact?.forensic_lock_gate_result?.status === "REPAIR_REQUIRED" ? "REPAIR_REQUIRED" : "LOCKED";
  await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_5, artifact_name: artifactName, artifact, lock_status }));
  return { artifact, lock_status };
}

async function readCompletedBatchCheckpoint({ run_id, batch, expectedExecutionFingerprint }) {
  const validationName = `exposure_registry_batch_validation__${batch.batch_id}`;
  const batchName = `exposure_registry_batch__${batch.batch_id}`;
  const validation = await readAcceptedCheckpoint({ run_id, artifact_name: validationName });
  const accepted = await readAcceptedCheckpoint({ run_id, artifact_name: batchName });
  if (!validation || !accepted) return null;
  if (!artifactMatchesPhase10ExecutionFingerprint(validation.artifact, expectedExecutionFingerprint) || !artifactMatchesPhase10ExecutionFingerprint(accepted.artifact, expectedExecutionFingerprint)) return null;
  const root = accepted.artifact?.m11_batch_registry_ledger || {};
  if (root.batch_id !== batch.batch_id || root.stream_id !== batch.stream_id || root.package_id !== batch.package_id) return null;
  return { validationArtifact: validation.artifact, batchArtifact: accepted.artifact };
}

async function failBatch({ run, phase, batch, failures, manifest, validation = null }) {
  const artifact = stampPhase10ExecutionMetadata(validation || {
    exposure_registry_batch_validation: {
      schema_version: "exposure_registry_batch_validation.v3.package_scoped",
      batch_id: batch.batch_id,
      stream_id: batch.stream_id,
      stream_type: batch.stream_type,
      package_id: batch.package_id,
      status: "CONTROLLED_FAILURE",
      failures: failures || []
    }
  }, manifest);
  await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_5, artifact_name: `exposure_registry_batch_validation__${batch.batch_id}`, artifact, lock_status: "CONTROLLED_FAILURE" }));
  await logEvent({ run_id: run.run_id, event_type: "M11_PACKAGE_SCOPED_BATCH_CONTROLLED_FAILURE", actor: AGENT_5, payload: { batch_id: batch.batch_id, package_id: batch.package_id, stream_id: batch.stream_id, failures } });
  return lockPhase({ run_id: run.run_id, phase, agent_id: AGENT_5, status: "CONTROLLED_FAILURE", next_phase: phase });
}

async function controlledFailure({ run, phase, eventType, error }) {
  await logEvent({ run_id: run.run_id, event_type: eventType, actor: AGENT_5, payload: { error: String(error?.message || error) } });
  return lockPhase({ run_id: run.run_id, phase, agent_id: AGENT_5, status: "CONTROLLED_FAILURE", next_phase: phase });
}

async function readAcceptedCheckpoint({ run_id, artifact_name }) {
  try {
    const result = await readArtifact({ run_id, artifact_name, agent_id: AGENT_5 });
    return isAccepted(result.lock_status) ? { artifact: result.artifact, lock_status: result.lock_status } : null;
  } catch (_error) { return null; }
}

async function readArtifactsForM11({ run_id, reads, agent_id, strict = true }) {
  const artifacts = {};
  for (const artifactName of reads || []) {
    try { artifacts[artifactName] = await readArtifactPayload({ run_id, artifact_name: artifactName, agent_id }); }
    catch (error) { if (strict) throw error; artifacts[artifactName] = null; }
  }
  return artifacts;
}

function assertM11RoutePacket(packet = {}) {
  if (packet.routing_authority !== "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY") throw new Error("M11_PHASE2G_AUTHORITY_MISSING");
  if (packet.internal_job_id !== "M11") throw new Error(`M11_PHASE2G_JOB_MISMATCH:${packet.internal_job_id || "missing"}`);
  if (packet.route_id !== "ROUTE.PHASE10.EXPOSURE_PROFILE") throw new Error(`M11_PHASE2G_ROUTE_MISMATCH:${packet.route_id || "missing"}`);
  if (packet.delivery_mode !== "SOURCE_BUCKET_PROFILE") throw new Error(`M11_PHASE2G_DELIVERY_MODE_MISMATCH:${packet.delivery_mode || "missing"}`);
  if (packet.source_bucket_delivered !== true) throw new Error("M11_PHASE2G_SOURCE_BUCKET_MISSING");
  if (packet.lossless_evidence_role !== "PRIMARY_EVIDENCE") throw new Error("M11_PHASE2G_LOSSLESS_PRIMARY_MISSING");
  if (packet.index_role !== "MANDATORY_NAVIGATION_MAP_INTO_PRIMARY_EVIDENCE") throw new Error("M11_PHASE2G_INDEX_NAVIGATION_MISSING");
  if (packet.profile_forensics_inputs_allowed !== false) throw new Error("M11_PHASE2G_FORENSICS_INPUT_BOUNDARY_MISSING");
}
function artifactSaveBody({ run_id, phase, agent_id, artifact_name, artifact, lock_status = "LOCKED" }) { return { run_id, phase, agent_id, artifact_name, lock_status, artifact }; }
function routePlanLockStatus(status) { return status === "PASS" ? "LOCKED" : status === "PASS_WITH_LIMITATION" ? "LOCKED_WITH_LIMITATIONS" : "CONTROLLED_FAILURE"; }
function isAccepted(status) { return ACCEPTED.has(status); }
