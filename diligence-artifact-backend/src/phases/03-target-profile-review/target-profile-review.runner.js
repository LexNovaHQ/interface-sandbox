import { TARGET_PROFILE_REVIEW_CONTRACT } from "./target-profile-review.contract.js";
import { validateTargetProfileReviewOutput } from "../../m7-validator.js";

const LOCKED_STATUSES = new Set(["LOCKED", "LOCKED_WITH_LIMITATIONS"]);
const CONTROLLED_VALUES = new Set(TARGET_PROFILE_REVIEW_CONTRACT.output_contract.controlled_field_values);

export const TARGET_PROFILE_REVIEW_RUNNER_STATUS = Object.freeze({
  phase_runner: "target-profile-review.runner",
  central_phase_id: TARGET_PROFILE_REVIEW_CONTRACT.central_phase_id,
  public_label: TARGET_PROFILE_REVIEW_CONTRACT.public_label,
  phase_owned_runner: true,
  production_entrypoint_switched: true,
  global_production_deployment_switched: false,
  writes: [...TARGET_PROFILE_REVIEW_CONTRACT.material_job.writes],
  reads: [...TARGET_PROFILE_REVIEW_CONTRACT.material_job.reads]
});

export async function runTargetProfileReviewPhase({ run, internalJobId = "M7_TARGET_PROFILE", contract, readArtifacts, buildPrompt, callProvider, saveArtifact } = {}) {
  assertRuntimeContract(contract);
  assertCallback(readArtifacts, "readArtifacts");
  assertCallback(buildPrompt, "buildPrompt");
  assertCallback(callProvider, "callProvider");
  assertCallback(saveArtifact, "saveArtifact");

  const artifacts = await readArtifacts({ reads: contract.reads, agent_id: contract.agent_id });
  assertAllowedRuntimeArtifacts(artifacts);

  const prompt = await buildPrompt({
    prompt_files: contract.prompt_files,
    prompt_file: contract.prompt_file,
    phase: internalJobId,
    run,
    artifacts,
    writes: contract.writes,
    references: contract.references || []
  });

  const providerResult = await callProvider({ prompt, phase: TARGET_PROFILE_REVIEW_CONTRACT.central_phase_id });
  const output = providerResult?.json || providerResult || {};
  validateTargetProfileReviewOutput(output, { phase: internalJobId });

  const phaseLockStatus = resolveTargetProfileReviewLockStatus(output.target_profile || output);
  const saved_artifacts = [];
  for (const artifactName of contract.writes) {
    const artifact = output?.[artifactName];
    if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) throw new Error(`TARGET_PROFILE_REVIEW_OUTPUT_MISSING_ARTIFACT:${artifactName}`);
    await saveArtifact({ artifact_name: artifactName, artifact, lock_status: phaseLockStatus });
    saved_artifacts.push(artifactName);
  }

  return {
    ok: true,
    output,
    artifacts_read: Object.keys(artifacts).sort(),
    saved_artifacts,
    phase_lock_status: phaseLockStatus,
    model_metadata: providerResult?.metadata || {},
    legal_signal_derivation_profile_supplied_directly: Boolean(artifacts.legal_signal_derivation_profile),
    target_profile_review_phase_runner_used: true
  };
}

function assertRuntimeContract(contract = {}) {
  if (contract.central_phase_id !== TARGET_PROFILE_REVIEW_CONTRACT.central_phase_id) throw new Error(`TARGET_PROFILE_REVIEW_CONTRACT_MISMATCH:${contract.central_phase_id || "missing"}`);
  if (contract.public_label !== TARGET_PROFILE_REVIEW_CONTRACT.public_label) throw new Error(`TARGET_PROFILE_REVIEW_LABEL_MISMATCH:${contract.public_label || "missing"}`);
  assertSameArray(contract.reads || [], TARGET_PROFILE_REVIEW_CONTRACT.material_job.reads, "TARGET_PROFILE_REVIEW_READS");
  assertSameArray(contract.writes || [], TARGET_PROFILE_REVIEW_CONTRACT.material_job.writes, "TARGET_PROFILE_REVIEW_WRITES");
  if ((contract.references || []).includes("M7_TARGET_PROFILE_DERIVATION_AUTHORITY.yaml") !== true) throw new Error("TARGET_PROFILE_REVIEW_AUTHORITY_REFERENCE_MISSING");
}

function assertAllowedRuntimeArtifacts(artifacts = {}) {
  const allowed = new Set(TARGET_PROFILE_REVIEW_CONTRACT.material_job.reads);
  for (const key of Object.keys(artifacts)) {
    if (!allowed.has(key)) throw new Error(`TARGET_PROFILE_REVIEW_FORBIDDEN_RUNTIME_ARTIFACT:${key}`);
  }
}

function resolveTargetProfileReviewLockStatus(targetProfile = {}) {
  const explicit = targetProfile.lock_status || targetProfile.validation_status || targetProfile.status;
  if (LOCKED_STATUSES.has(explicit)) return explicit;
  if (hasControlledLimitationSignal(targetProfile)) return "LOCKED_WITH_LIMITATIONS";
  return "LOCKED";
}

function hasControlledLimitationSignal(value) {
  if (!value) return false;
  if (typeof value === "string") return CONTROLLED_VALUES.has(value) || value.includes("FIELD_") || value.toUpperCase().includes("LIMITATION");
  if (Array.isArray(value)) return value.length > 0 && value.some((item) => hasControlledLimitationSignal(item));
  if (typeof value !== "object") return false;
  if (Array.isArray(value.target_profile_limitations) && value.target_profile_limitations.length) return true;
  return Object.values(value).some((item) => hasControlledLimitationSignal(item));
}

function assertSameArray(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${label}_MISMATCH:${JSON.stringify({ actual, expected })}`);
}

function assertCallback(fn, label) {
  if (typeof fn !== "function") throw new Error(`TARGET_PROFILE_REVIEW_RUNNER_MISSING_CALLBACK:${label}`);
}
