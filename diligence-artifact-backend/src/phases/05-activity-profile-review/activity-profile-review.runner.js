import { ACTIVITY_PROFILE_REVIEW_CONTRACT } from "./activity-profile-review.contract.js";
import { validateM8TargetFeatureOutput } from "./validators/activity-profile-review.validator.js";
import { readPhaseRouteRuntimePacket } from "../02-cartography-index/services/phase-route-runtime.reader.js";

export const ACTIVITY_PROFILE_REVIEW_RUNNER_STATUS = Object.freeze({
  phase_runner: "activity-profile-review.runner",
  central_phase_id: ACTIVITY_PROFILE_REVIEW_CONTRACT.central_phase_id,
  phase_job_id: ACTIVITY_PROFILE_REVIEW_CONTRACT.phase_job_id,
  public_label: ACTIVITY_PROFILE_REVIEW_CONTRACT.public_label,
  compatibility_internal_job_id: ACTIVITY_PROFILE_REVIEW_CONTRACT.compatibility_internal_job_id,
  phase_owned_runner: true,
  production_entrypoint_switched: true,
  global_production_deployment_switched: false,
  model_usage: ACTIVITY_PROFILE_REVIEW_CONTRACT.model_usage,
  validator: ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.validator,
  validator_phase: ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.validator_phase,
  phase2c_activity_profile_source_index_required: true,
  phase2g_route_scoped_runtime_reader_active: true,
  profile_forensics_inputs_forbidden: true,
  active_package_manifest_required: true,
  root_validator_dependency_removed: true,
  writes: [...ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.writes],
  routing_manifest_read: "phase_routing_manifest"
});

export async function runActivityProfileReviewPhase({ run, internalJobId = "M8_TARGET_FEATURE_PROFILE", contract, readArtifacts, buildPrompt, callProvider, saveArtifact } = {}) {
  assertRuntimeContract(contract);
  assertCallback(readArtifacts, "readArtifacts");
  assertCallback(buildPrompt, "buildPrompt");
  assertCallback(callProvider, "callProvider");
  assertCallback(saveArtifact, "saveArtifact");
  const routed = await readPhaseRouteRuntimePacket({ internalJobId, readArtifacts, consumerAgentId: contract.agent_id || contract.actor_id });
  const artifacts = routed.artifacts;
  assertRoutePacket(artifacts.phase_route_runtime_packet, internalJobId);
  assertCandidateInventoryPresent(artifacts.feature_candidate_inventory);
  assertPackageContextPresent(artifacts);
  const prompt = await buildPrompt({ prompt_files: contract.prompt_files, prompt_file: contract.prompt_file, phase: internalJobId, run, artifacts, writes: contract.writes, references: contract.references || [] });
  const providerResult = await callProvider({ prompt, phase: ACTIVITY_PROFILE_REVIEW_CONTRACT.central_phase_id });
  const output = providerResult?.json || providerResult || {};
  validateM8TargetFeatureOutput(output, { phase: internalJobId });
  assertMaterialBoundary(output);
  const artifactName = contract.writes[0];
  const artifact = output?.[artifactName];
  if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) throw new Error(`ACTIVITY_PROFILE_REVIEW_OUTPUT_MISSING_ARTIFACT:${artifactName}`);
  const phaseLockStatus = resolveActivityProfileReviewLockStatus(artifact);
  await saveArtifact({ artifact_name: artifactName, artifact, lock_status: phaseLockStatus });
  return { ok: true, output, saved_artifacts: [artifactName], artifacts_read: Object.keys(artifacts).sort(), phase_lock_status: phaseLockStatus, model_metadata: providerResult?.metadata || {}, model_usage: ACTIVITY_PROFILE_REVIEW_CONTRACT.model_usage, phase2g_route_id: routed.route.route_id, phase2g_bucket_id: routed.route.bucket_id, activity_profile_review_phase_runner_used: true, validator: ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.validator, validator_phase: ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.validator_phase, internal_job_id: internalJobId };
}

function assertRuntimeContract(contract = {}) {
  if (contract.central_phase_id !== ACTIVITY_PROFILE_REVIEW_CONTRACT.central_phase_id) throw new Error(`ACTIVITY_PROFILE_REVIEW_CONTRACT_MISMATCH:${contract.central_phase_id || "missing"}`);
  if (contract.public_label !== ACTIVITY_PROFILE_REVIEW_CONTRACT.public_label) throw new Error(`ACTIVITY_PROFILE_REVIEW_LABEL_MISMATCH:${contract.public_label || "missing"}`);
  if (!(contract.reads || []).includes("phase_routing_manifest")) throw new Error("ACTIVITY_PROFILE_REVIEW_PHASE2G_MANIFEST_READ_MISSING");
  assertSameArray(contract.writes || [], ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.writes, "ACTIVITY_PROFILE_REVIEW_WRITES");
  assertSameArray(contract.prompt_files || [], ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.prompt_files, "ACTIVITY_PROFILE_REVIEW_PROMPT_FILES");
  assertSameArray(contract.references || [], ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.references, "ACTIVITY_PROFILE_REVIEW_REFERENCES");
}
function assertRoutePacket(packet = {}, internalJobId) { if (packet.routing_authority !== "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY") throw new Error("ACTIVITY_PROFILE_REVIEW_PHASE2G_AUTHORITY_MISSING"); if (packet.internal_job_id !== internalJobId) throw new Error(`ACTIVITY_PROFILE_REVIEW_PHASE2G_JOB_MISMATCH:${packet.internal_job_id || "missing"}`); if (packet.lossless_evidence_role !== "PRIMARY_EVIDENCE") throw new Error("ACTIVITY_PROFILE_REVIEW_LOSSLESS_PRIMARY_BOUNDARY_MISSING"); if (packet.index_role !== "MANDATORY_NAVIGATION_MAP_INTO_PRIMARY_EVIDENCE") throw new Error("ACTIVITY_PROFILE_REVIEW_INDEX_NAVIGATION_BOUNDARY_MISSING"); if (packet.profile_forensics_inputs_allowed !== false) throw new Error("ACTIVITY_PROFILE_REVIEW_FORENSICS_INPUT_BOUNDARY_MISSING"); }
function assertCandidateInventoryPresent(inventory) { if (!inventory || typeof inventory !== "object" || Array.isArray(inventory)) throw new Error("ACTIVITY_PROFILE_REVIEW_MISSING_FEATURE_CANDIDATE_INVENTORY"); if (!Array.isArray(inventory.candidates)) throw new Error("ACTIVITY_PROFILE_REVIEW_FEATURE_CANDIDATE_INVENTORY_CANDIDATES_MISSING"); }
function assertPackageContextPresent(artifacts = {}) { if (!artifacts.activity_profile_source_index || typeof artifacts.activity_profile_source_index !== "object") throw new Error("ACTIVITY_PROFILE_REVIEW_MISSING_ACTIVITY_PROFILE_SOURCE_INDEX"); if (!artifacts.domain_derivation_profile || typeof artifacts.domain_derivation_profile !== "object") throw new Error("ACTIVITY_PROFILE_REVIEW_MISSING_DOMAIN_DERIVATION_PROFILE"); if (!artifacts.active_run_package_manifest || typeof artifacts.active_run_package_manifest !== "object") throw new Error("ACTIVITY_PROFILE_REVIEW_MISSING_ACTIVE_RUN_PACKAGE_MANIFEST"); }
function assertMaterialBoundary(output = {}) { const artifact = output.target_feature_profile; if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) throw new Error("ACTIVITY_PROFILE_REVIEW_MATERIAL_ARTIFACT_MISSING"); const expectedProfileKeys = [...ACTIVITY_PROFILE_REVIEW_CONTRACT.output_contract.required_profile_keys].sort(); assertSameArray(Object.keys(artifact).sort(), expectedProfileKeys, "ACTIVITY_PROFILE_REVIEW_PROFILE_KEYS"); if (!Array.isArray(artifact.activities)) throw new Error("ACTIVITY_PROFILE_REVIEW_ACTIVITIES_NOT_ARRAY"); if (!Array.isArray(artifact.profile_level_limitations)) throw new Error("ACTIVITY_PROFILE_REVIEW_LIMITATIONS_NOT_ARRAY"); }
function resolveActivityProfileReviewLockStatus(artifact = {}) { const status = artifact.lock_status || artifact.validation_status || artifact.status; if (["LOCKED", "LOCKED_WITH_LIMITATIONS"].includes(status)) return status; if (Array.isArray(artifact.profile_level_limitations) && artifact.profile_level_limitations.length) return "LOCKED_WITH_LIMITATIONS"; return "LOCKED"; }
function assertSameArray(actual, expected, label) { if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${label}_MISMATCH:${JSON.stringify({ actual, expected })}`); }
function assertCallback(fn, label) { if (typeof fn !== "function") throw new Error(`ACTIVITY_PROFILE_REVIEW_RUNNER_MISSING_CALLBACK:${label}`); }
