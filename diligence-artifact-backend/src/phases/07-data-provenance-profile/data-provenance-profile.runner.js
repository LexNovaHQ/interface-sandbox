import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compilePhase7DapRegistryDerivationRules, PHASE7_REGISTRY_SOURCE_PATH } from "./dap-registry-derivation-rule-compiler.js";
import { buildPhase7StrategicDerivationMatrixArtifact } from "./dap-strategic-derivation-matrix.js";
import { buildPhase7DataPrivacyNavigationIndex } from "./layer2-data-privacy-navigation-index-builder.js";
import { buildPhase7SemanticBatchRouteManifest } from "./layer3-semantic-batch-route-manifest-builder.js";
import { validatePhase7Layer4SemanticBatchArtifact } from "./layer4-semantic-batch-artifact-validator.js";
import { buildPhase7SemanticBatchQualityGate, validatePhase7SemanticBatchQualityGate } from "./layer5-semantic-batch-quality-gate-builder.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(__dirname, "../../..");
const AGENT_4 = "agent_4_data_privacy";
const LAYER4_PROMPTS = Object.freeze(["agent-packages/agent_4_data_privacy/AGENT4_PHASE7_LAYER4_RUNTIME_BINDING_PACKET.yaml", "agent-packages/agent_4_data_privacy/PHASE7_LAYER4_DAP_SEMANTIC_BATCH_RUNNER.md"]);
const LAYER4_REPAIR_PROMPTS = Object.freeze(["agent-packages/agent_4_data_privacy/AGENT4_PHASE7_LAYER4_RUNTIME_BINDING_PACKET.yaml", "agent-packages/agent_4_data_privacy/PHASE7_LAYER4_DAP_SEMANTIC_BATCH_RUNNER.md", "agent-packages/agent_4_data_privacy/PHASE7_LAYER4_DAP_SEMANTIC_BATCH_REPAIR.md"]);

export async function runDataProvenanceProfilePhase({ run, internalJobId, contract, readArtifacts, buildPrompt, callProvider, saveArtifact } = {}) {
  assertCallback(readArtifacts, "readArtifacts");
  assertCallback(saveArtifact, "saveArtifact");
  if (internalJobId === "DATA_PROVENANCE_PROFILE_LAYER4") return runLayer4({ run, contract, readArtifacts, buildPrompt, callProvider, saveArtifact });
  if (internalJobId === "DATA_PROVENANCE_PROFILE_LAYER5") return runLayer5({ run, contract, readArtifacts, saveArtifact });
  throw new Error(`DATA_PROVENANCE_PROFILE_UNKNOWN_JOB:${internalJobId || "missing"}`);
}

async function runLayer4({ run, contract, readArtifacts, buildPrompt, callProvider, saveArtifact }) {
  assertCallback(buildPrompt, "buildPrompt");
  assertCallback(callProvider, "callProvider");
  const sourceArtifacts = await readArtifacts({ reads: contract.reads || [], agent_id: contract.agent_id || contract.actor_id || AGENT_4 });
  assertAllowedLayer4Reads(sourceArtifacts, contract.reads || []);
  const bootstrap = buildBootstrapArtifacts(sourceArtifacts);
  const saved = [];
  for (const [artifact_name, artifact] of Object.entries(bootstrap)) {
    await saveArtifact({ artifact_name, artifact, lock_status: "LOCKED" });
    saved.push(artifact_name);
  }
  let hasLimitations = false;
  const routePackets = bootstrap.dap_semantic_batch_route_manifest.batch_route_packets || [];
  for (const routePacket of routePackets) {
    let output = await runBatchModel({ run, routePacket, artifacts: { ...sourceArtifacts, ...bootstrap }, buildPrompt, callProvider, repair: false });
    let validation = validatePhase7Layer4SemanticBatchArtifact(output, { routePacket });
    if (validation.status !== "PASS") {
      output = await runBatchModel({ run, routePacket, artifacts: { ...sourceArtifacts, ...bootstrap }, buildPrompt, callProvider, repair: true, priorOutput: output, validation });
      validation = validatePhase7Layer4SemanticBatchArtifact(output, { routePacket });
    }
    const validationStatus = validation.status === "PASS" ? "PASS" : "LOCKED_WITH_LIMITATIONS";
    if (validationStatus !== "PASS") hasLimitations = true;
    const normalizedValidation = Object.freeze({ ...validation, status: validationStatus, non_blocking_repair_required: validation.status !== "PASS", blocking_failure: false });
    await saveArtifact({ artifact_name: `dap_semantic_batch_validation__${routePacket.batch_id}`, artifact: { dap_semantic_batch_validation: normalizedValidation }, lock_status: validationStatus === "PASS" ? "LOCKED" : "LOCKED_WITH_LIMITATIONS" });
    saved.push(`dap_semantic_batch_validation__${routePacket.batch_id}`);
    await saveArtifact({ artifact_name: routePacket.expected_artifact_name, artifact: normalizeBatchOutput({ output, routePacket }), lock_status: validationStatus === "PASS" ? "LOCKED" : "LOCKED_WITH_LIMITATIONS" });
    saved.push(routePacket.expected_artifact_name);
  }
  return Object.freeze({ ok: true, output: bootstrap, saved_artifacts: saved, phase_lock_status: hasLimitations ? "LOCKED_WITH_LIMITATIONS" : "LOCKED", model_usage: "SEMANTIC_BATCH_AGENT", route_packet_count: routePackets.length });
}

async function runLayer5({ contract, readArtifacts, saveArtifact }) {
  const artifacts = await readArtifacts({ reads: contract.reads || [], agent_id: contract.agent_id || contract.actor_id || AGENT_4 });
  const routeManifest = unwrap(artifacts.dap_semantic_batch_route_manifest, "dap_semantic_batch_route_manifest");
  const validationNames = (routeManifest.batch_route_packets || []).map((packet) => `dap_semantic_batch_validation__${packet.batch_id}`);
  const validationArtifacts = validationNames.length ? await readArtifacts({ reads: validationNames, agent_id: contract.agent_id || contract.actor_id || AGENT_4 }) : {};
  const batchArtifacts = Object.fromEntries((routeManifest.batch_route_packets || []).map((packet) => [packet.expected_artifact_name, artifacts[packet.expected_artifact_name]]));
  const output = buildPhase7SemanticBatchQualityGate({ routeManifest, batchArtifacts, batchValidations: validationArtifacts });
  const validation = validatePhase7SemanticBatchQualityGate(output);
  const lockStatus = validation.status === "PASS" && output.data_provenance_profile_semantic_batch_gate.status === "PASS" ? "LOCKED" : "LOCKED_WITH_LIMITATIONS";
  await saveArtifact({ artifact_name: "dap_semantic_batch_validation_manifest", artifact: output.dap_semantic_batch_validation_manifest, lock_status: lockStatus });
  await saveArtifact({ artifact_name: "data_provenance_profile_semantic_batch_gate", artifact: output.data_provenance_profile_semantic_batch_gate, lock_status: lockStatus });
  return Object.freeze({ ok: true, output, saved_artifacts: ["dap_semantic_batch_validation_manifest", "data_provenance_profile_semantic_batch_gate"], phase_lock_status: lockStatus, model_usage: "NONE_DETERMINISTIC", validation });
}

function buildBootstrapArtifacts(sourceArtifacts) {
  const registryText = fs.readFileSync(path.join(BACKEND_ROOT, PHASE7_REGISTRY_SOURCE_PATH), "utf8");
  const dapRegistryManifest = compilePhase7DapRegistryDerivationRules(registryText);
  const strategicMatrix = buildPhase7StrategicDerivationMatrixArtifact(dapRegistryManifest.material_rules);
  const navigationIndex = buildPhase7DataPrivacyNavigationIndex({ dapRegistryManifest, strategicDerivationMatrix: strategicMatrix, artifacts: sourceArtifacts });
  const routeManifest = buildPhase7SemanticBatchRouteManifest({ dapRegistryManifest, strategicDerivationMatrix: strategicMatrix, dataPrivacyNavigationIndex: navigationIndex });
  assertPass(dapRegistryManifest.validation_quality_control_result, "PHASE7_REGISTRY_MANIFEST");
  assertPass(strategicMatrix.validation_quality_control_result, "PHASE7_STRATEGIC_MATRIX");
  assertPass(navigationIndex.validation_quality_control_result, "PHASE7_NAVIGATION_INDEX");
  assertPass(routeManifest.validation_quality_control_result, "PHASE7_ROUTE_MANIFEST");
  return Object.freeze({ dap_registry_manifest: dapRegistryManifest, dap_strategic_derivation_matrix: strategicMatrix, data_privacy_navigation_index: navigationIndex, dap_semantic_batch_route_manifest: routeManifest });
}

async function runBatchModel({ run, routePacket, artifacts, buildPrompt, callProvider, repair, priorOutput = null, validation = null }) {
  const prompt = await buildPrompt({ prompt_files: repair ? LAYER4_REPAIR_PROMPTS : LAYER4_PROMPTS, phase: `DATA_PROVENANCE_PROFILE_LAYER4:${repair ? "REPAIR" : "BATCH"}:${routePacket.batch_id}`, run, artifacts: repair ? { ...artifacts, active_dap_semantic_batch_route_packet: routePacket, prior_batch_output: priorOutput, backend_batch_validation: validation } : { ...artifacts, active_dap_semantic_batch_route_packet: routePacket }, writes: [routePacket.expected_artifact_name], references: [] });
  const result = await callProvider({ prompt, phase: `DATA_PROVENANCE_PROFILE_LAYER4:${routePacket.batch_id}` });
  return result?.json || result || {};
}
function normalizeBatchOutput({ output, routePacket }) { if (output?.[routePacket.expected_artifact_name]) return output; return { [routePacket.expected_artifact_name]: output && typeof output === "object" ? output : { batch_id: routePacket.batch_id, families: routePacket.families, returned_field_ids: [], field_rows: [], batch_limitations: ["model_output_missing_or_non_object"], batch_quality_flags: ["NON_BLOCKING_REPAIR_REQUIRED"] } }; }
function assertAllowedLayer4Reads(artifacts, reads) { const allowed = new Set(reads); for (const key of Object.keys(artifacts || {})) if (!allowed.has(key)) throw new Error(`DATA_PROVENANCE_PROFILE_LAYER4_FORBIDDEN_RUNTIME_ARTIFACT:${key}`); }
function assertPass(result = {}, label) { if (result.status !== "PASS") throw new Error(`${label}_FAILED:${JSON.stringify(result.errors || [])}`); }
function unwrap(value, key) { return value?.[key] || value?.artifact?.[key] || value || {}; }
function assertCallback(fn, label) { if (typeof fn !== "function") throw new Error(`DATA_PROVENANCE_PROFILE_RUNNER_MISSING_CALLBACK:${label}`); }
