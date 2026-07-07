import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPhasePrompt } from "./prompt-loader.js";
import { callGeminiJson } from "./gemini-client.js";
import { artifactSaveBody, lockPhase, readArtifactPayload, saveArtifact } from "./artifact-service.js";
import { compilePhase7DapRegistryDerivationRules, PHASE7_REGISTRY_SOURCE_PATH } from "./phases/07-data-provenance-profile/dap-registry-derivation-rule-compiler.js";
import { buildPhase7StrategicDerivationMatrixArtifact } from "./phases/07-data-provenance-profile/dap-strategic-derivation-matrix.js";
import { buildPhase7DataPrivacyNavigationIndex } from "./phases/07-data-provenance-profile/layer2-data-privacy-navigation-index-builder.js";
import { buildPhase7SemanticBatchRouteManifest } from "./phases/07-data-provenance-profile/layer3-semantic-batch-route-manifest-builder.js";
import { validatePhase7Layer4SemanticBatchArtifact } from "./phases/07-data-provenance-profile/layer4-semantic-batch-artifact-validator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(__dirname, "..");
const AGENT_4 = "agent_4_data_privacy";
const BATCH_PROMPTS = Object.freeze([
  "agent-packages/agent_4_data_privacy/AGENT4_PHASE7_LAYER4_RUNTIME_BINDING_PACKET.yaml",
  "agent-packages/agent_4_data_privacy/PHASE7_LAYER4_DAP_SEMANTIC_BATCH_RUNNER.md"
]);
const REPAIR_PROMPTS = Object.freeze([
  "agent-packages/agent_4_data_privacy/AGENT4_PHASE7_LAYER4_RUNTIME_BINDING_PACKET.yaml",
  "agent-packages/agent_4_data_privacy/PHASE7_LAYER4_DAP_SEMANTIC_BATCH_RUNNER.md",
  "agent-packages/agent_4_data_privacy/PHASE7_LAYER4_DAP_SEMANTIC_BATCH_REPAIR.md"
]);

export async function runPhase7Layer4SemanticBatchPhase({ run, phase, contract }) {
  const sourceArtifacts = await readPhase7Layer4Artifacts({ run_id: run.run_id, reads: contract.reads || [], agent_id: contract.agent_id || AGENT_4 });
  const bootstrap = await buildAndSaveLayer4BootstrapArtifacts({ run, phase, sourceArtifacts });
  const artifacts = { ...sourceArtifacts, ...bootstrap };
  const routeManifest = artifacts.dap_semantic_batch_route_manifest;
  const routePackets = routeManifest?.batch_route_packets || [];
  if (!routePackets.length) {
    await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_4, artifact_name: "dap_semantic_batch_validation__DAP-SEM-BATCH-00", artifact: { dap_semantic_batch_validation: { status: "LOCKED_WITH_LIMITATIONS", non_blocking_repair_required: true, blocking_failure: false, errors: ["missing_route_packets"] } }, lock_status: "LOCKED_WITH_LIMITATIONS" }));
    return lockPhase({ run_id: run.run_id, phase, agent_id: AGENT_4, status: "LOCKED_WITH_LIMITATIONS", next_phase: contract.next });
  }

  let hasLimitations = false;
  const accepted = [];
  const validations = [];
  for (const routePacket of routePackets) {
    const existing = await readOptionalArtifactPayload({ run_id: run.run_id, artifact_name: routePacket.expected_artifact_name, agent_id: AGENT_4 });
    if (existing) {
      accepted.push(existing);
      continue;
    }
    let output = await runBatchModel({ run, phase, routePacket, artifacts, repair: false });
    let validation = validatePhase7Layer4SemanticBatchArtifact(output, { routePacket });
    if (validation.status !== "PASS") {
      output = await runBatchModel({ run, phase, routePacket, artifacts, repair: true, priorOutput: output, validation });
      validation = validatePhase7Layer4SemanticBatchArtifact(output, { routePacket });
    }
    const validationStatus = validation.status === "PASS" ? "PASS" : "LOCKED_WITH_LIMITATIONS";
    if (validationStatus !== "PASS") hasLimitations = true;
    const normalizedValidation = Object.freeze({ ...validation, status: validationStatus, non_blocking_repair_required: validation.status !== "PASS", blocking_failure: false });
    await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_4, artifact_name: `dap_semantic_batch_validation__${routePacket.batch_id}`, artifact: { dap_semantic_batch_validation: normalizedValidation }, lock_status: validationStatus === "PASS" ? "LOCKED" : "LOCKED_WITH_LIMITATIONS" }));
    await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_4, artifact_name: routePacket.expected_artifact_name, artifact: output && typeof output === "object" ? output : { [routePacket.expected_artifact_name]: { batch_id: routePacket.batch_id, families: routePacket.families, returned_field_ids: [], field_rows: [], batch_limitations: ["model_output_missing_or_non_object"], batch_quality_flags: ["NON_BLOCKING_REPAIR_REQUIRED"] } }, lock_status: validationStatus === "PASS" ? "LOCKED" : "LOCKED_WITH_LIMITATIONS" }));
    accepted.push(output);
    validations.push(normalizedValidation);
  }

  return lockPhase({ run_id: run.run_id, phase, agent_id: AGENT_4, status: hasLimitations ? "LOCKED_WITH_LIMITATIONS" : "LOCKED", next_phase: contract.next });
}

async function buildAndSaveLayer4BootstrapArtifacts({ run, phase, sourceArtifacts }) {
  const registryText = fs.readFileSync(path.join(BACKEND_ROOT, PHASE7_REGISTRY_SOURCE_PATH), "utf8");
  const dapRegistryManifest = compilePhase7DapRegistryDerivationRules(registryText);
  const strategicMatrix = buildPhase7StrategicDerivationMatrixArtifact(dapRegistryManifest.material_rules);
  if (strategicMatrix.validation_quality_control_result?.status !== "PASS") throw new Error(`PHASE7_LAYER4_BOOTSTRAP_STRATEGIC_MATRIX_FAILED:${JSON.stringify(strategicMatrix.validation_quality_control_result)}`);
  const navigationIndex = buildPhase7DataPrivacyNavigationIndex({ dapRegistryManifest, strategicDerivationMatrix: strategicMatrix, artifacts: sourceArtifacts });
  if (navigationIndex.validation_quality_control_result?.status !== "PASS") throw new Error(`PHASE7_LAYER4_BOOTSTRAP_NAVIGATION_INDEX_FAILED:${JSON.stringify(navigationIndex.validation_quality_control_result)}`);
  const routeManifest = buildPhase7SemanticBatchRouteManifest({ dapRegistryManifest, strategicDerivationMatrix: strategicMatrix, dataPrivacyNavigationIndex: navigationIndex });
  if (routeManifest.validation_quality_control_result?.status !== "PASS") throw new Error(`PHASE7_LAYER4_BOOTSTRAP_ROUTE_MANIFEST_FAILED:${JSON.stringify(routeManifest.validation_quality_control_result)}`);

  const bootstrap = {
    dap_registry_manifest: dapRegistryManifest,
    dap_strategic_derivation_matrix: strategicMatrix,
    data_privacy_navigation_index: navigationIndex,
    dap_semantic_batch_route_manifest: routeManifest
  };
  for (const [artifactName, artifact] of Object.entries(bootstrap)) {
    const existing = await readOptionalArtifactPayload({ run_id: run.run_id, artifact_name: artifactName, agent_id: AGENT_4 });
    if (existing) continue;
    await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_4, artifact_name: artifactName, artifact, lock_status: "LOCKED" }));
  }
  return bootstrap;
}

async function runBatchModel({ run, phase, routePacket, artifacts, repair, priorOutput = null, validation = null }) {
  const prompt = await buildPhasePrompt({
    prompt_files: repair ? REPAIR_PROMPTS : BATCH_PROMPTS,
    phase: `${phase}:${repair ? "REPAIR" : "BATCH"}:${routePacket.batch_id}`,
    run,
    artifacts: repair ? { ...artifacts, active_dap_semantic_batch_route_packet: routePacket, prior_batch_output: priorOutput, backend_batch_validation: validation } : { ...artifacts, active_dap_semantic_batch_route_packet: routePacket },
    writes: [routePacket.expected_artifact_name],
    references: []
  });
  return (await callGeminiJson({ prompt, phase: `${phase}:${repair ? "REPAIR" : "BATCH"}:${routePacket.batch_id}` })).json;
}

async function readPhase7Layer4Artifacts({ run_id, reads, agent_id }) {
  const artifacts = {};
  for (const name of reads) artifacts[name] = await readArtifactPayload({ run_id, artifact_name: name, agent_id });
  return artifacts;
}

async function readOptionalArtifactPayload({ run_id, artifact_name, agent_id }) {
  try { return await readArtifactPayload({ run_id, artifact_name, agent_id }); } catch (_error) { return null; }
}
