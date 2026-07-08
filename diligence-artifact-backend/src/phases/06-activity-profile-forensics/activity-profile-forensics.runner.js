import { ACTIVITY_PROFILE_FORENSICS_CONTRACT } from "./activity-profile-forensics.contract.js";
import { buildM8DeterministicFeatureForensics } from "../_shared/forensics/profile-forensics.shared.js";

export const ACTIVITY_PROFILE_FORENSICS_RUNNER_STATUS = Object.freeze({ phase_runner: "activity-profile-forensics.runner", central_phase_id: ACTIVITY_PROFILE_FORENSICS_CONTRACT.central_phase_id, public_label: ACTIVITY_PROFILE_FORENSICS_CONTRACT.public_label, phase_owned_runner: true, production_entrypoint_switched: true, global_production_deployment_switched: false, model_usage: "NONE_DETERMINISTIC", source_helper: ACTIVITY_PROFILE_FORENSICS_CONTRACT.deterministic_job.source_helper, root_forensics_dependency_removed: true, writes: [...ACTIVITY_PROFILE_FORENSICS_CONTRACT.deterministic_job.writes], reads: [...ACTIVITY_PROFILE_FORENSICS_CONTRACT.deterministic_job.reads] });

export async function runActivityProfileForensicsPhase({ run, internalJobId = "M8_TARGET_FEATURE_PROFILE_FORENSICS", contract, readArtifacts, saveArtifact } = {}) {
  assertRuntimeContract(contract);
  if (typeof readArtifacts !== "function") throw new Error("ACTIVITY_PROFILE_FORENSICS_RUNNER_MISSING_READ_CALLBACK");
  if (typeof saveArtifact !== "function") throw new Error("ACTIVITY_PROFILE_FORENSICS_RUNNER_MISSING_SAVE_CALLBACK");
  const artifacts = await readArtifacts({ reads: contract.reads, agent_id: contract.agent_id || contract.actor_id });
  assertAllowedRuntimeArtifacts(artifacts);
  const output = buildM8DeterministicFeatureForensics({ artifacts });
  const artifactName = contract.writes[0]; const artifact = output?.[artifactName];
  if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) throw new Error("ACTIVITY_PROFILE_FORENSICS_OUTPUT_MISSING_ARTIFACT");
  const phaseLockStatus = resolveForensicLockStatus(artifact);
  await saveArtifact({ artifact_name: artifactName, artifact, lock_status: phaseLockStatus });
  return { ok: true, output, saved_artifacts: [artifactName], phase_lock_status: phaseLockStatus, artifacts_read: Object.keys(artifacts).sort(), model_usage: "NONE_DETERMINISTIC", activity_profile_forensics_phase_runner_used: true, source_helper: ACTIVITY_PROFILE_FORENSICS_CONTRACT.deterministic_job.source_helper, validator: ACTIVITY_PROFILE_FORENSICS_CONTRACT.deterministic_job.validator };
}
function assertRuntimeContract(contract = {}) { if (contract.central_phase_id !== ACTIVITY_PROFILE_FORENSICS_CONTRACT.central_phase_id) throw new Error("ACTIVITY_PROFILE_FORENSICS_CONTRACT_MISMATCH"); if (contract.public_label !== ACTIVITY_PROFILE_FORENSICS_CONTRACT.public_label) throw new Error("ACTIVITY_PROFILE_FORENSICS_LABEL_MISMATCH"); if (JSON.stringify(contract.reads || []) !== JSON.stringify(ACTIVITY_PROFILE_FORENSICS_CONTRACT.deterministic_job.reads)) throw new Error("ACTIVITY_PROFILE_FORENSICS_READS_MISMATCH"); if (JSON.stringify(contract.writes || []) !== JSON.stringify(ACTIVITY_PROFILE_FORENSICS_CONTRACT.deterministic_job.writes)) throw new Error("ACTIVITY_PROFILE_FORENSICS_WRITES_MISMATCH"); }
function assertAllowedRuntimeArtifacts(artifacts = {}) { const allowed = new Set(ACTIVITY_PROFILE_FORENSICS_CONTRACT.deterministic_job.reads); for (const key of Object.keys(artifacts)) if (!allowed.has(key)) throw new Error(`ACTIVITY_PROFILE_FORENSICS_UNEXPECTED_RUNTIME_ARTIFACT:${key}`); }
function resolveForensicLockStatus(artifact = {}) { const status = artifact.forensic_lock_gate_result?.status || artifact.validation_quality_control_result?.status; if (status === "PASS") return "LOCKED"; if (status === "PASS_WITH_LIMITATION") return "LOCKED_WITH_LIMITATIONS"; return "REPAIR_REQUIRED"; }
