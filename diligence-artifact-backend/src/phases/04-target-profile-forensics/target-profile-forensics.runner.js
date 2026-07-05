import { TARGET_PROFILE_FORENSICS_CONTRACT } from "./target-profile-forensics.contract.js";
import { buildM7DeterministicTargetForensics } from "../../deterministic-profile-forensics.js";
import { validateM7TargetProfileOutput } from "../../m7-validator.js";

export const TARGET_PROFILE_FORENSICS_RUNNER_STATUS = Object.freeze({
  phase_runner: "target-profile-forensics.runner",
  central_phase_id: TARGET_PROFILE_FORENSICS_CONTRACT.central_phase_id,
  public_label: TARGET_PROFILE_FORENSICS_CONTRACT.public_label,
  phase_owned_runner: true,
  production_entrypoint_switched: false,
  model_usage: "NONE_DETERMINISTIC",
  source_helper: TARGET_PROFILE_FORENSICS_CONTRACT.deterministic_job.source_helper,
  writes: [...TARGET_PROFILE_FORENSICS_CONTRACT.deterministic_job.writes],
  reads: [...TARGET_PROFILE_FORENSICS_CONTRACT.deterministic_job.reads]
});

export async function runTargetProfileForensicsPhase({ run, internalJobId = "M7_TARGET_PROFILE_FORENSICS", contract, readArtifacts, saveArtifact } = {}) {
  assertRuntimeContract(contract);
  assertCallback(readArtifacts, "readArtifacts");
  assertCallback(saveArtifact, "saveArtifact");

  const artifacts = await readArtifacts({ reads: contract.reads, agent_id: contract.agent_id || contract.actor_id });
  assertAllowedRuntimeArtifacts(artifacts);

  const output = buildM7DeterministicTargetForensics({ artifacts });
  validateM7TargetProfileOutput(output, { phase: internalJobId });

  const artifactName = contract.writes[0];
  const artifact = output?.[artifactName];
  if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) throw new Error(`TARGET_PROFILE_FORENSICS_OUTPUT_MISSING_ARTIFACT:${artifactName}`);

  assertForensicBoundary(artifact);
  const phaseLockStatus = resolveForensicLockStatus(artifact);
  await saveArtifact({ artifact_name: artifactName, artifact, lock_status: phaseLockStatus });

  return {
    ok: true,
    output,
    saved_artifacts: [artifactName],
    phase_lock_status: phaseLockStatus,
    artifacts_read: Object.keys(artifacts).sort(),
    model_usage: "NONE_DETERMINISTIC",
    target_profile_forensics_phase_runner_used: true,
    source_helper: TARGET_PROFILE_FORENSICS_CONTRACT.deterministic_job.source_helper
  };
}

function assertRuntimeContract(contract = {}) {
  if (contract.central_phase_id !== TARGET_PROFILE_FORENSICS_CONTRACT.central_phase_id) throw new Error(`TARGET_PROFILE_FORENSICS_CONTRACT_MISMATCH:${contract.central_phase_id || "missing"}`);
  if (contract.public_label !== TARGET_PROFILE_FORENSICS_CONTRACT.public_label) throw new Error(`TARGET_PROFILE_FORENSICS_LABEL_MISMATCH:${contract.public_label || "missing"}`);
  assertSameArray(contract.reads || [], TARGET_PROFILE_FORENSICS_CONTRACT.deterministic_job.reads, "TARGET_PROFILE_FORENSICS_READS");
  assertSameArray(contract.writes || [], TARGET_PROFILE_FORENSICS_CONTRACT.deterministic_job.writes, "TARGET_PROFILE_FORENSICS_WRITES");
}

function assertAllowedRuntimeArtifacts(artifacts = {}) {
  const allowed = new Set(TARGET_PROFILE_FORENSICS_CONTRACT.deterministic_job.reads);
  for (const key of Object.keys(artifacts)) {
    if (!allowed.has(key)) throw new Error(`TARGET_PROFILE_FORENSICS_FORBIDDEN_RUNTIME_ARTIFACT:${key}`);
  }
}

function assertForensicBoundary(artifact = {}) {
  if (artifact?.forensic_contract?.model_generated_forensics_allowed !== false) throw new Error("TARGET_PROFILE_FORENSICS_MODEL_GENERATED_TRACE_NOT_FORBIDDEN");
  if (artifact?.forensic_boundary?.material_profile_re_emitted !== false) throw new Error("TARGET_PROFILE_FORENSICS_MATERIAL_PROFILE_REEMISSION_NOT_FORBIDDEN");
  if (artifact?.forensic_boundary?.semantic_forensic_profile_retired !== true) throw new Error("TARGET_PROFILE_FORENSICS_SEMANTIC_FORENSICS_NOT_RETIRED");
  if (!Array.isArray(artifact.material_profile_trace_index)) throw new Error("TARGET_PROFILE_FORENSICS_MISSING_MATERIAL_TRACE_INDEX");
  if (!Array.isArray(artifact.source_custody_trace_index)) throw new Error("TARGET_PROFILE_FORENSICS_MISSING_SOURCE_CUSTODY_TRACE_INDEX");
  if (!artifact.forensic_lock_gate_result || typeof artifact.forensic_lock_gate_result !== "object") throw new Error("TARGET_PROFILE_FORENSICS_MISSING_LOCK_GATE");
}

function resolveForensicLockStatus(artifact = {}) {
  const status = artifact.forensic_lock_gate_result?.status || artifact.validation_quality_control_result?.status;
  if (status === "PASS") return "LOCKED";
  if (status === "PASS_WITH_LIMITATION") return "LOCKED_WITH_LIMITATIONS";
  return "REPAIR_REQUIRED";
}

function assertSameArray(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${label}_MISMATCH:${JSON.stringify({ actual, expected })}`);
}

function assertCallback(fn, label) {
  if (typeof fn !== "function") throw new Error(`TARGET_PROFILE_FORENSICS_RUNNER_MISSING_CALLBACK:${label}`);
}
