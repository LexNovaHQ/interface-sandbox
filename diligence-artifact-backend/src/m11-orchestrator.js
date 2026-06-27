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
const AGENT_7 = "agent_7_m12";
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
    const validationArtifact = buildStructuralBatchValidationArtifact({ batch, structuralValidation, modelMetadata: result.metadata });
    const validationName = `exposure_registry_batch_validation__${batch.batch_id}`;

    await saveArtifact(artifactSaveBody({
      run_id: run.run_id,
      phase,
      agent_id: AGENT_7,
      artifact_name: validationName,
      artifact: validationArtifact,
      lock_status: structuralValidation.ok ? "LOCKED" : "REPAIR_REQUIRED"
    }));

    if (!structuralValidation.ok) {
      await logEvent({ run_id: run.run_id, event_type: "M11_BATCH_REPAIR_REQUIRED", actor: AGENT_5, payload: { batch_id: batch.batch_id, failures: structuralValidation.failures } });
      await lockPhase({ run_id: run.run_id, phase, agent_id: AGENT_5, status: "REPAIR_REQUIRED", next_phase: phase });
      return;
    }

    const batchArtifactName = `exposure_registry_batch__${batch.batch_id}`;
    await saveArtifact(artifactSaveBody({
      run_id: run.run_id,
      phase,
      agent_id: AGENT_5,
      artifact_name: batchArtifactName,
      artifact: batchOutput,
      lock_status: "LOCKED"
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
  await logEvent({ run_id: run.run_id, event_type: "M11_ORCHESTRATED_PHASE_COMPLETED", actor: AGENT_5, payload: { batch_count: acceptedBatches.length, workpad_status: workpadStatus, forensic_status: forensicStatus, batch_validation_mode: "backend_structural_until_m12_semantic_is_wired" } });

  await lockPhase({ run_id: run.run_id, phase, agent_id: AGENT_5, status: forensicStatus, next_phase: forensicStatus === "LOCKED" ? contract.next : phase });
}

function buildStructuralBatchValidationArtifact({ batch, structuralValidation, modelMetadata }) {
  return {
    exposure_registry_batch_validation: {
      batch_id: batch.batch_id,
      batch_group: batch.batch_group,
      status: structuralValidation.ok ? "PASS" : "REPAIR_REQUIRED",
      validation_owner: "backend_structural_validator",
      semantic_m12_validation_status: "NOT_YET_WIRED",
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
