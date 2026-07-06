import { ACTIVITY_PROFILE_REVIEW_CONTRACT } from "./activity-profile-review.contract.js";
import { validateM8TargetFeatureOutput } from "../../m8-validator.js";

export const ACTIVITY_PROFILE_REVIEW_RUNNER_STATUS = Object.freeze({
  phase_runner: "activity-profile-review.runner",
  central_phase_id: ACTIVITY_PROFILE_REVIEW_CONTRACT.central_phase_id,
  phase_job_id: ACTIVITY_PROFILE_REVIEW_CONTRACT.phase_job_id,
  public_label: ACTIVITY_PROFILE_REVIEW_CONTRACT.public_label,
  compatibility_internal_job_id: ACTIVITY_PROFILE_REVIEW_CONTRACT.compatibility_internal_job_id,
  phase_owned_runner: true,
  production_entrypoint_switched: false,
  global_production_deployment_switched: false,
  model_usage: ACTIVITY_PROFILE_REVIEW_CONTRACT.model_usage,
  validator: ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.validator,
  validator_phase: ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.validator_phase,
  writes: [...ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.writes],
  reads: [...ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.reads]
});

export async function runActivityProfileReviewPhase({ run, internalJobId = "M8_TARGET_FEATURE_PROFILE", contract, readArtifacts, buildPrompt, callProvider, saveArtifact } = {}) {
  assertRuntimeContract(contract);
  assertCallback(readArtifacts, "readArtifacts");
  assertCallback(buildPrompt, "buildPrompt");
  assertCallback(callProvider, "callProvider");
  assertCallback(saveArtifact, "saveArtifact");

  const artifacts = await readArtifacts({ reads: contract.reads, agent_id: contract.agent_id || contract.actor_id });
  assertAllowedRuntimeArtifacts(artifacts);
  assertCandidateInventoryPresent(artifacts.feature_candidate_inventory);

  const prompt = await buildPrompt({
    prompt_files: contract.prompt_files,
    prompt_file: contract.prompt_file,
    phase: internalJobId,
    run,
    artifacts,
    writes: contract.writes,
    references: contract.references || []
  });

  const providerResult = await callProvider({ prompt, phase: ACTIVITY_PROFILE_REVIEW_CONTRACT.central_phase_id });
  const output = providerResult?.json || providerResult || {};
  validateM8TargetFeatureOutput(output, { phase: internalJobId });
  assertMaterialBoundary(output);

  const artifactName = contract.writes[0];
  const artifact = output?.[artifactName];
  if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) throw new Error(`ACTIVITY_PROFILE_REVIEW_OUTPUT_MISSING_ARTIFACT:${artifactName}`);

  const phaseLockStatus = resolveActivityProfileReviewLockStatus(artifact);
  await saveArtifact({ artifact_name: artifactName, artifact, lock_status: phaseLockStatus });

  return {
    ok: true,
    output,
    saved_artifacts: [artifactName],
    artifacts_read: Object.keys(artifacts).sort(),
    phase_lock_status: phaseLockStatus,
    model_metadata: providerResult?.metadata || {},
    model_usage: ACTIVITY_PROFILE_REVIEW_CONTRACT.model_usage,
    activity_profile_review_phase_runner_used: true,
    validator: ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.validator,
    validator_phase: ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.validator_phase,
    internal_job_id: internalJobId
  };
}

function assertRuntimeContract(contract = {}) {
  if (contract.central_phase_id !== ACTIVITY_PROFILE_REVIEW_CONTRACT.central_phase_id) throw new Error(`ACTIVITY_PROFILE_REVIEW_CONTRACT_MISMATCH:${contract.central_phase_id || "missing"}`);
  if (contract.public_label !== ACTIVITY_PROFILE_REVIEW_CONTRACT.public_label) throw new Error(`ACTIVITY_PROFILE_REVIEW_LABEL_MISMATCH:${contract.public_label || "missing"}`);
  assertSameArray(contract.reads || [], ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.reads, "ACTIVITY_PROFILE_REVIEW_READS");
  assertSameArray(contract.writes || [], ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.writes, "ACTIVITY_PROFILE_REVIEW_WRITES");
  assertSameArray(contract.prompt_files || [], ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.prompt_files, "ACTIVITY_PROFILE_REVIEW_PROMPT_FILES");
  assertSameArray(contract.references || [], ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.references, "ACTIVITY_PROFILE_REVIEW_REFERENCES");
}

function assertAllowedRuntimeArtifacts(artifacts = {}) {
  const allowed = new Set(ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.reads);
  for (const key of Object.keys(artifacts)) {
    if (!allowed.has(key)) throw new Error(`ACTIVITY_PROFILE_REVIEW_FORBIDDEN_RUNTIME_ARTIFACT:${key}`);
  }
}

function assertCandidateInventoryPresent(inventory) {
  if (!inventory || typeof inventory !== "object" || Array.isArray(inventory)) throw new Error("ACTIVITY_PROFILE_REVIEW_MISSING_FEATURE_CANDIDATE_INVENTORY");
  if (!Array.isArray(inventory.candidates)) throw new Error("ACTIVITY_PROFILE_REVIEW_FEATURE_CANDIDATE_INVENTORY_CANDIDATES_MISSING");
}

function assertMaterialBoundary(output = {}) {
  const artifact = output.target_feature_profile;
  if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) throw new Error("ACTIVITY_PROFILE_REVIEW_MATERIAL_ARTIFACT_MISSING");
  const expectedProfileKeys = [...ACTIVITY_PROFILE_REVIEW_CONTRACT.output_contract.required_profile_keys].sort();
  assertSameArray(Object.keys(artifact).sort(), expectedProfileKeys, "ACTIVITY_PROFILE_REVIEW_PROFILE_KEYS");
  if (!Array.isArray(artifact.activities)) throw new Error("ACTIVITY_PROFILE_REVIEW_ACTIVITIES_NOT_ARRAY");
  if (!Array.isArray(artifact.profile_level_limitations)) throw new Error("ACTIVITY_PROFILE_REVIEW_LIMITATIONS_NOT_ARRAY");
  if (!artifact.commercial_availability_posture || typeof artifact.commercial_availability_posture !== "object" || Array.isArray(artifact.commercial_availability_posture)) throw new Error("ACTIVITY_PROFILE_REVIEW_COMMERCIAL_POSTURE_NOT_OBJECT");
  assertSameArray(Object.keys(artifact.commercial_availability_posture).sort(), [...ACTIVITY_PROFILE_REVIEW_CONTRACT.output_contract.commercial_availability_fields].sort(), "ACTIVITY_PROFILE_REVIEW_COMMERCIAL_POSTURE_KEYS");
  if (containsForbiddenMaterialKey(artifact)) throw new Error("ACTIVITY_PROFILE_REVIEW_FORBIDDEN_MATERIAL_KEY_PRESENT");
}

function containsForbiddenMaterialKey(value) {
  const forbidden = new Set(ACTIVITY_PROFILE_REVIEW_CONTRACT.forbidden_material_keys);
  return containsForbiddenKey(value, forbidden);
}

function containsForbiddenKey(value, forbidden) {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((item) => containsForbiddenKey(item, forbidden));
  return Object.keys(value).some((key) => forbidden.has(key)) || Object.values(value).some((item) => containsForbiddenKey(item, forbidden));
}

function resolveActivityProfileReviewLockStatus(profile = {}) {
  if (Array.isArray(profile.profile_level_limitations) && profile.profile_level_limitations.length) return "LOCKED_WITH_LIMITATIONS";
  const limitation = profile.commercial_availability_posture?.limitation || "";
  if (typeof limitation === "string" && limitation.trim() && !/^No material commercial availability limitation identified/i.test(limitation.trim())) return "LOCKED_WITH_LIMITATIONS";
  return "LOCKED";
}

function assertSameArray(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${label}_MISMATCH:${JSON.stringify({ actual, expected })}`);
}

function assertCallback(fn, label) {
  if (typeof fn !== "function") throw new Error(`ACTIVITY_PROFILE_REVIEW_RUNNER_MISSING_CALLBACK:${label}`);
}
