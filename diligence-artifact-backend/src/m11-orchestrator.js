import { logEvent } from "./firestore.js";
import { buildPhasePrompt } from "./prompt-loader.js";
import { loadReferencePacket } from "./reference-loader.js";
import { callGeminiJson } from "./gemini-client.js";
import {
  artifactSaveBody,
  lockPhase,
  readArtifactPayload,
  saveArtifact
} from "./artifact-service.js";
import {
  buildExposureRegistryRoutePlan,
  buildM11BatchPacket,
  mergeExposureRegistryWorkpad98,
  projectControlledProfile,
  projectTriggeredProfile,
  validateM11BatchLedger
} from "./m11-deterministic-system.js";
import { buildExposureRegistryForensicsFromSavedArtifacts } from "./m11-deterministic-forensics.js";

const AGENT_5 = "agent_5_exposure_registry";
const AGENT_5_M12_BATCH_FILES = Object.freeze([
  "agent-packages/00_SYSTEM_BLOCKING_DOCTRINE.md",
  "agent-packages/agent_5_exposure_registry/AGENT5_RUNTIME_BINDING_PACKET_SYNCED_M11.yaml",
  "agent-packages/agent_5_exposure_registry/00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED_AGENT5_SYNCED.md",
  "agent-packages/agent_5_exposure_registry/M12_BATCH_VALIDATION.md",
  "agent-packages/agent_5_exposure_registry/00_VALIDATOR_RULES_INTEGRATED_AGENT5_SYNCED.md",
  "agent-packages/agent_5_exposure_registry/BACKEND_CANONICAL_OUTPUT_ADAPTER.md"
]);
const ART = Object.freeze({
  legalIndex: "legal_cartography_index",
  featureMain: "target_feature_profile",
  exposureRoutePlan: "exposure_registry_route_plan",
  exposureWorkpad: "exposure_registry_workpad_98",
  exposureControlled: "exposure_registry_controlled_profile",
  exposureTriggered: "exposure_registry_triggered_profile",
  exposureForensics: "exposure_registry_profile_forensics"
});

export async function runM11OrchestratedPhase({ run, phase, contract }) {
  const artifacts = await readArtifactsForM11({ run_id: run.run_id, reads: contract.reads, agent_id: contract.agent_id || AGENT_5 });
  const referencePacket = await loadReferencePacket(contract.references || []);

  const routePlanOutput = buildExposureRegistryRoutePlan({
    upstreamArtifacts: artifacts,
    targetFeatureProfile: artifacts[ART.featureMain],
    legalCartographyIndex: artifacts[ART.legalIndex],
    referencePacket,
    runId: run.run_id
  });
  const routePlan = routePlanOutput[ART.exposureRoutePlan];
  const routeStatus = routePlan.phase_a_validation?.status === "PASS" ? "LOCKED" : "CONTROLLED_FAILURE";

  await saveArtifact(artifactSaveBody({
    run_id: run.run_id,
    phase,
    agent_id: AGENT_5,
    artifact_name: ART.exposureRoutePlan,
    artifact: routePlan,
    lock_status: routeStatus
  }));

  if (routeStatus !== "LOCKED") {
    await lockPhase({ run_id: run.run_id, phase, agent_id: AGENT_5, status: "CONTROLLED_FAILURE", next_phase: phase });
    return;
  }

  const acceptedBatches = [];
  const batchValidations = [];

  for (const batch of routePlan.batch_plan || []) {
    const batchPacket = buildM11BatchPacket({ routePlan: routePlanOutput, batchId: batch.batch_id, upstreamArtifacts: artifacts, referencePacket });
    const batchPrompt = await buildPhasePrompt({
      prompt_files: contract.prompt_files,
      phase,
      run,
      artifacts: {
        ...artifacts,
        [ART.exposureRoutePlan]: routePlan,
        m11_batch_packet: batchPacket.m11_batch_packet
      },
      writes: ["m11_batch_registry_ledger"],
      references: contract.references || []
    });

    const result = await callGeminiJson({ prompt: batchPrompt, phase: `${phase}:${batch.batch_id}` });
    const batchOutput = result.json;
    const structuralValidation = validateM11BatchLedger(batchOutput, batch.expected_threat_ids || []);
    const validationName = `exposure_registry_batch_validation__${batch.batch_id}`;

    if (!structuralValidation.ok) {
      const repairValidationArtifact = buildStructuralBatchValidationArtifact({ batch, structuralValidation, modelMetadata: result.metadata });
      await saveArtifact(artifactSaveBody({
        run_id: run.run_id,
        phase,
        agent_id: AGENT_5,
        artifact_name: validationName,
        artifact: repairValidationArtifact,
        lock_status: "REPAIR_REQUIRED"
      }));
      await logEvent({ run_id: run.run_id, event_type: "M11_BATCH_REPAIR_REQUIRED", actor: AGENT_5, payload: { batch_id: batch.batch_id, failures: structuralValidation.failures } });
      await lockPhase({ run_id: run.run_id, phase, agent_id: AGENT_5, status: "REPAIR_REQUIRED", next_phase: phase });
      return;
    }

    const validationArtifact = await runM12BatchValidation({
      run,
      phase,
      batch,
      batchOutput,
      structuralValidation,
      routePlan,
      artifacts
    });
    const m12Status = validationArtifact.exposure_registry_batch_validation.status;

    await saveArtifact(artifactSaveBody({
      run_id: run.run_id,
      phase,
      agent_id: AGENT_5,
      artifact_name: validationName,
      artifact: validationArtifact,
      lock_status: batchValidationLockStatus(m12Status)
    }));

    if (!isAcceptedBatchValidationStatus(m12Status)) {
      await logEvent({ run_id: run.run_id, event_type: "M12_BATCH_REPAIR_REQUIRED", actor: AGENT_5, payload: { batch_id: batch.batch_id, status: m12Status, repair_directives: validationArtifact.exposure_registry_batch_validation.repair_directives } });
      await lockPhase({ run_id: run.run_id, phase, agent_id: AGENT_5, status: m12Status === "CONTROLLED_FAILURE" ? "CONTROLLED_FAILURE" : "REPAIR_REQUIRED", next_phase: phase });
      return;
    }

    const batchArtifactName = `exposure_registry_batch__${batch.batch_id}`;
    await saveArtifact(artifactSaveBody({
      run_id: run.run_id,
      phase,
      agent_id: AGENT_5,
      artifact_name: batchArtifactName,
      artifact: batchOutput,
      lock_status: m12Status === "PASS_WITH_LIMITATION" ? "LOCKED_WITH_LIMITATIONS" : "LOCKED"
    }));

    acceptedBatches.push(batchOutput);
    batchValidations.push(validationArtifact);
  }

  const workpadOutput = mergeExposureRegistryWorkpad98({ routePlan: routePlanOutput, acceptedBatches, batchValidations });
  const workpad = workpadOutput[ART.exposureWorkpad];
  const workpadStatus = workpad.merge_validation?.status === "PASS" ? "LOCKED" : "REPAIR_REQUIRED";

  await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_5, artifact_name: ART.exposureWorkpad, artifact: workpad, lock_status: workpadStatus }));
  if (workpadStatus !== "LOCKED") {
    await lockPhase({ run_id: run.run_id, phase, agent_id: AGENT_5, status: "REPAIR_REQUIRED", next_phase: phase });
    return;
  }

  const controlledOutput = projectControlledProfile(workpadOutput);
  await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_5, artifact_name: ART.exposureControlled, artifact: controlledOutput[ART.exposureControlled], lock_status: "LOCKED" }));

  const triggeredOutput = projectTriggeredProfile(workpadOutput);
  await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_5, artifact_name: ART.exposureTriggered, artifact: triggeredOutput[ART.exposureTriggered], lock_status: "LOCKED" }));

  const forensicOutput = buildExposureRegistryForensicsFromSavedArtifacts({
    routePlan: routePlanOutput,
    acceptedBatches,
    batchValidations,
    workpad: workpadOutput,
    controlledProfile: controlledOutput,
    triggeredProfile: triggeredOutput,
    fieldDerivationRegistryText: referencePacket.files?.["FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml"]?.content || ""
  });
  const forensicArtifact = forensicOutput[ART.exposureForensics];
  const forensicStatus = forensicArtifact.registry_lock_gate_result?.status === "PASS" ? "LOCKED" : "REPAIR_REQUIRED";

  await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_5, artifact_name: ART.exposureForensics, artifact: forensicArtifact, lock_status: forensicStatus }));
  await logEvent({ run_id: run.run_id, event_type: "M11_ORCHESTRATED_PHASE_COMPLETED", actor: AGENT_5, payload: { batch_count: acceptedBatches.length, workpad_status: workpadStatus, forensic_status: forensicStatus, batch_validation_mode: "m12_batch_prompt" } });

  await lockPhase({ run_id: run.run_id, phase, agent_id: AGENT_5, status: forensicStatus, next_phase: forensicStatus === "LOCKED" ? contract.next : phase });
}

async function runM12BatchValidation({ run, phase, batch, batchOutput, structuralValidation, routePlan, artifacts }) {
  const prompt = await buildPhasePrompt({
    prompt_files: AGENT_5_M12_BATCH_FILES,
    phase: `${phase}:M12_BATCH:${batch.batch_id}`,
    run,
    artifacts: {
      ...artifacts,
      exposure_registry_route_plan: routePlan,
      m11_batch_registry_ledger: batchOutput,
      backend_structural_validation: structuralValidation,
      m12_batch_context: {
        batch_id: batch.batch_id,
        batch_group: batch.batch_group,
        expected_threat_ids: batch.expected_threat_ids || []
      }
    },
    writes: [`exposure_registry_batch_validation__${batch.batch_id}`],
    references: []
  });

  const result = await callGeminiJson({ prompt, phase: `${phase}:M12_BATCH:${batch.batch_id}` });
  return normalizeM12BatchValidationResult({ batch, result });
}

function normalizeM12BatchValidationResult({ batch, result }) {
  const root = result.json?.exposure_registry_batch_validation || result.json;
  const status = normalizeBatchValidationStatus(root?.status);
  return {
    exposure_registry_batch_validation: {
      batch_id: root?.batch_id || batch.batch_id,
      batch_group: root?.batch_group || batch.batch_group,
      status,
      validation_owner: root?.validation_owner || "agent_5_exposure_registry:M12_BATCH_VALIDATION",
      semantic_m12_validation_status: normalizeBatchValidationStatus(root?.semantic_m12_validation_status || status),
      expected_threat_ids: root?.expected_threat_ids || batch.expected_threat_ids || [],
      validated_threat_ids: root?.validated_threat_ids || [],
      shape_checks: root?.shape_checks || {},
      challenge_checks: root?.challenge_checks || {},
      findings: Array.isArray(root?.findings) ? root.findings : [],
      repair_directives: Array.isArray(root?.repair_directives) ? root.repair_directives : [],
      limitations: Array.isArray(root?.limitations) ? root.limitations : [],
      model_metadata: result.metadata || {}
    }
  };
}

function normalizeBatchValidationStatus(status) {
  return ["PASS", "PASS_WITH_LIMITATION", "REPAIR_REQUIRED", "CONTROLLED_FAILURE"].includes(status) ? status : "REPAIR_REQUIRED";
}

function isAcceptedBatchValidationStatus(status) {
  return status === "PASS" || status === "PASS_WITH_LIMITATION";
}

function batchValidationLockStatus(status) {
  if (status === "PASS") return "LOCKED";
  if (status === "PASS_WITH_LIMITATION") return "LOCKED_WITH_LIMITATIONS";
  if (status === "CONTROLLED_FAILURE") return "CONTROLLED_FAILURE";
  return "REPAIR_REQUIRED";
}

function buildStructuralBatchValidationArtifact({ batch, structuralValidation, modelMetadata }) {
  return {
    exposure_registry_batch_validation: {
      batch_id: batch.batch_id,
      batch_group: batch.batch_group,
      status: "REPAIR_REQUIRED",
      validation_owner: "backend_structural_validator",
      semantic_m12_validation_status: "REPAIR_REQUIRED",
      expected_threat_ids: batch.expected_threat_ids || [],
      failures: structuralValidation.failures || [],
      model_metadata: modelMetadata || {}
    }
  };
}

async function readArtifactsForM11({ run_id, reads, agent_id }) {
  const artifacts = {};
  for (const artifactName of reads) artifacts[artifactName] = await readArtifactPayload({ run_id, artifact_name: artifactName, agent_id });
  return artifacts;
}
