import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compilePhase7DapRegistryDerivationRules, PHASE7_REGISTRY_SOURCE_PATH } from "./dap-registry-derivation-rule-compiler.js";
import { buildPhase7StrategicDerivationMatrixArtifact } from "./dap-strategic-derivation-matrix.js";
import { buildPhase7SemanticBatchRouteManifest } from "./layer3-semantic-batch-route-manifest-builder.js";
import { validatePhase7Layer4SemanticBatchArtifact } from "./layer4-semantic-batch-artifact-validator.js";
import { buildPhase7SemanticBatchQualityGate, validatePhase7SemanticBatchQualityGate } from "./layer5-semantic-batch-quality-gate-builder.js";
import { readPhaseRouteRuntimePacket } from "../02-cartography-index/services/phase-route-runtime.reader.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(__dirname, "../../..");
const AGENT_4 = "agent_4_data_privacy";

export async function runDataProvenanceProfilePhase({ run, internalJobId, contract, readArtifacts, buildPrompt, callProvider, saveArtifact } = {}) {
  assertCallback(readArtifacts, "readArtifacts");
  assertCallback(saveArtifact, "saveArtifact");
  if (internalJobId === "DATA_PROVENANCE_PROFILE_LAYER4") return runLayer4({ run, internalJobId, contract, readArtifacts, buildPrompt, callProvider, saveArtifact });
  if (internalJobId === "DATA_PROVENANCE_PROFILE_LAYER5") return runLayer5({ run, contract, readArtifacts, saveArtifact });
  throw new Error(`DATA_PROVENANCE_PROFILE_UNKNOWN_JOB:${internalJobId || "missing"}`);
}

async function runLayer4({ run, internalJobId, contract, readArtifacts, buildPrompt, callProvider, saveArtifact }) {
  assertCallback(buildPrompt, "buildPrompt");
  assertCallback(callProvider, "callProvider");
  const promptFiles = assertPromptFiles(contract.prompt_files, "DATA_PROVENANCE_PROFILE_LAYER4_PROMPT_FILES");
  const repairPromptFiles = assertPromptFiles(contract.repair_prompt_files, "DATA_PROVENANCE_PROFILE_LAYER4_REPAIR_PROMPT_FILES");
  if (!(contract.reads || []).includes("phase_routing_manifest")) throw new Error("DATA_PROVENANCE_PROFILE_LAYER4_PHASE2G_MANIFEST_READ_MISSING");
  const routed = await readPhaseRouteRuntimePacket({ internalJobId, readArtifacts, consumerAgentId: contract.agent_id || contract.actor_id || AGENT_4 });
  const sourceArtifacts = routed.artifacts;
  assertRoutePacket(sourceArtifacts.phase_route_runtime_packet, internalJobId);
  const bootstrap = buildBootstrapArtifacts(sourceArtifacts);
  const saved = [];
  for (const [artifact_name, artifact] of Object.entries(bootstrap)) {
    await saveArtifact({ artifact_name, artifact, lock_status: "LOCKED" });
    saved.push(artifact_name);
  }
  let hasLimitations = false;
  const routePackets = bootstrap.dap_semantic_batch_route_manifest.batch_route_packets || [];
  for (const routePacket of routePackets) {
    let output = await runBatchModel({ run, routePacket, artifacts: { ...sourceArtifacts, ...bootstrap }, buildPrompt, callProvider, promptFiles, repairPromptFiles, repair: false });
    let validation = validatePhase7Layer4SemanticBatchArtifact(output, { routePacket });
    if (validation.status !== "PASS") {
      output = await runBatchModel({ run, routePacket, artifacts: { ...sourceArtifacts, active_phase2_data_privacy_navigation_index: sourceArtifacts.data_privacy_navigation_index, ...bootstrap }, buildPrompt, callProvider, promptFiles, repairPromptFiles, repair: true, priorOutput: output, validation });
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
  return Object.freeze({ ok: true, output: bootstrap, saved_artifacts: saved, phase_lock_status: hasLimitations ? "LOCKED_WITH_LIMITATIONS" : "LOCKED", model_usage: "SEMANTIC_BATCH_AGENT", route_packet_count: routePackets.length, prompt_files_source: "pipeline.contract", repair_prompt_files_source: "pipeline.contract", phase2_data_privacy_navigation_index_reused: true, phase2g_route_scoped_runtime_reader_active: true, phase2g_route_id: routed.route.route_id, phase2g_bucket_id: routed.route.bucket_id, profile_forensics_inputs_used: false });
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
  const navigationIndex = resolvePhase2DataPrivacyNavigationIndex(sourceArtifacts);
  const routeManifest = buildPhase7SemanticBatchRouteManifest({ dapRegistryManifest, strategicDerivationMatrix: strategicMatrix, dataPrivacyNavigationIndex: navigationIndex });
  assertPass(dapRegistryManifest.validation_quality_control_result, "PHASE7_REGISTRY_MANIFEST");
  assertPass(strategicMatrix.validation_quality_control_result, "PHASE7_STRATEGIC_MATRIX");
  assertPass(navigationIndex.validation_quality_control_result, "PHASE2_DATA_PRIVACY_NAVIGATION_INDEX");
  assertPass(routeManifest.validation_quality_control_result, "PHASE7_ROUTE_MANIFEST");
  return Object.freeze({ dap_registry_manifest: dapRegistryManifest, dap_strategic_derivation_matrix: strategicMatrix, dap_semantic_batch_route_manifest: routeManifest });
}

async function runBatchModel({ run, routePacket, artifacts, buildPrompt, callProvider, promptFiles, repairPromptFiles, repair, priorOutput = null, validation = null }) {
  const prompt = await buildPrompt({ prompt_files: repair ? repairPromptFiles : promptFiles, phase: `DATA_PROVENANCE_PROFILE_LAYER4:${repair ? "REPAIR" : "BATCH"}:${routePacket.batch_id}`, run, artifacts: repair ? { ...artifacts, active_dap_semantic_batch_route_packet: routePacket, prior_batch_output: priorOutput, backend_batch_validation: validation } : { ...artifacts, active_dap_semantic_batch_route_packet: routePacket }, writes: [routePacket.expected_artifact_name], references: [] });
  const result = await callProvider({ prompt, phase: `DATA_PROVENANCE_PROFILE_LAYER4:${routePacket.batch_id}` });
  return result?.json || result || {};
}
function normalizeBatchOutput({ output, routePacket }) { if (output?.[routePacket.expected_artifact_name]) return output; return { [routePacket.expected_artifact_name]: output && typeof output === "object" ? output : { batch_id: routePacket.batch_id, families: routePacket.families, returned_field_ids: [], field_rows: [], batch_limitations: ["model_output_missing_or_non_object"], batch_quality_flags: ["NON_BLOCKING_REPAIR_REQUIRED"] } }; }
function resolvePhase2DataPrivacyNavigationIndex(sourceArtifacts = {}) { const index = unwrap(sourceArtifacts.data_privacy_navigation_index, "data_privacy_navigation_index"); if (!index || index.artifact_type !== "data_privacy_navigation_index") throw new Error("PHASE7_LAYER4_REQUIRES_PHASE2_DATA_PRIVACY_NAVIGATION_INDEX"); return index; }
function assertRoutePacket(packet = {}, internalJobId) { if (packet.routing_authority !== "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY") throw new Error("DATA_PROVENANCE_PROFILE_LAYER4_PHASE2G_AUTHORITY_MISSING"); if (packet.internal_job_id !== internalJobId) throw new Error(`DATA_PROVENANCE_PROFILE_LAYER4_PHASE2G_JOB_MISMATCH:${packet.internal_job_id || "missing"}`); if (packet.lossless_evidence_role !== "PRIMARY_EVIDENCE") throw new Error("DATA_PROVENANCE_PROFILE_LAYER4_LOSSLESS_PRIMARY_BOUNDARY_MISSING"); if (packet.index_role !== "MANDATORY_NAVIGATION_MAP_INTO_PRIMARY_EVIDENCE") throw new Error("DATA_PROVENANCE_PROFILE_LAYER4_INDEX_NAVIGATION_BOUNDARY_MISSING"); if (packet.profile_forensics_inputs_allowed !== false) throw new Error("DATA_PROVENANCE_PROFILE_LAYER4_FORENSICS_INPUT_BOUNDARY_MISSING"); }
function assertPass(result = {}, label) { if (result.status !== "PASS") throw new Error(`${label}_FAILED:${JSON.stringify(result.errors || [])}`); }
function assertPromptFiles(files, label) { if (!Array.isArray(files) || !files.length) throw new Error(`${label}_MISSING`); for (const file of files) if (!(typeof file === "string" && file.trim())) throw new Error(`${label}_INVALID_ENTRY`); return Object.freeze([...files]); }
function unwrap(value, key) { return value?.[key] || value?.artifact?.[key] || value || {}; }
function assertCallback(fn, label) { if (typeof fn !== "function") throw new Error(`DATA_PROVENANCE_PROFILE_RUNNER_MISSING_CALLBACK:${label}`); }
