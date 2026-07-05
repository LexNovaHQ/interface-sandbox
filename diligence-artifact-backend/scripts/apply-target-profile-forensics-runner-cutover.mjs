import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");
const filePath = path.join(backendRoot, "src/runtime/services/pipeline.service.js");
let source = fs.readFileSync(filePath, "utf8");

const runnerImport = `import { runTargetProfileForensicsPhase } from "../../phases/04-target-profile-forensics/target-profile-forensics.runner.js";`;
const reviewImport = `import { runTargetProfileReviewPhase } from "../../phases/03-target-profile-review/target-profile-review.runner.js";`;
if (!source.includes(runnerImport)) {
  if (!source.includes(reviewImport)) throw new Error("TARGET_PROFILE_REVIEW_IMPORT_ANCHOR_NOT_FOUND");
  source = source.replace(reviewImport, `${reviewImport}\n${runnerImport}`);
}

const statusNeedle = `target_profile_review_phase_runner_wired: true, central_phase_language: true`;
const statusReplacement = `target_profile_review_phase_runner_wired: true, target_profile_forensics_phase_runner_wired: true, central_phase_language: true`;
if (!source.includes("target_profile_forensics_phase_runner_wired: true")) {
  if (!source.includes(statusNeedle)) throw new Error("PIPELINE_SERVICE_STATUS_ANCHOR_NOT_FOUND");
  source = source.replace(statusNeedle, statusReplacement);
}

const dispatchNeedle = `else if (internalJobId === JOB.targetProfileReview) await runTargetProfileReviewRuntimeJob({ run: runtimeRun, persistencePhase, internalJobId, contract, central });`;
const dispatchReplacement = `${dispatchNeedle}\n    else if (internalJobId === JOB.targetProfileForensics) await runTargetProfileForensicsRuntimeJob({ run: runtimeRun, persistencePhase, internalJobId, contract, central });`;
if (!source.includes("runTargetProfileForensicsRuntimeJob({ run: runtimeRun")) {
  if (!source.includes(dispatchNeedle)) throw new Error("TARGET_PROFILE_FORENSICS_DISPATCH_ANCHOR_NOT_FOUND");
  source = source.replace(dispatchNeedle, dispatchReplacement);
}

const functionAnchor = `async function runDeterministicProfileForensicsJob({ run, persistencePhase, internalJobId, contract, central })`;
const runnerFunction = `async function runTargetProfileForensicsRuntimeJob({ run, persistencePhase, internalJobId, contract, central }) { const result = await runTargetProfileForensicsPhase({ run, internalJobId, contract, readArtifacts: ({ reads, agent_id }) => readArtifactsForCentralJob({ run_id: run.run_id, reads, agent_id }), saveArtifact: async ({ artifact_name, artifact, lock_status }) => saveArtifact(artifactSaveBody({ run_id: run.run_id, phase: persistencePhase, agent_id: contract.agent_id || contract.actor_id, artifact_name, artifact, lock_status })) }); await logCentralEvent({ run_id: run.run_id, event_type: "TARGET_PROFILE_FORENSICS_PHASE_RUNNER_COMPLETED", actor: contract.agent_id || contract.actor_id, persistencePhase, internalJobId, central, payload: { writes: contract.writes, saved_artifacts: result.saved_artifacts, lock_status: result.phase_lock_status, model_usage: result.model_usage, source_helper: result.source_helper, target_profile_forensics_phase_runner_used: true } }); await lockCentralPhase({ run, persistencePhase, contract, status: result.phase_lock_status, nextPhase: ["LOCKED", "LOCKED_WITH_LIMITATIONS"].includes(result.phase_lock_status) ? contract.next : persistencePhase, central }); }\n`;
if (!source.includes("async function runTargetProfileForensicsRuntimeJob")) {
  if (!source.includes(functionAnchor)) throw new Error("TARGET_PROFILE_FORENSICS_RUNNER_FUNCTION_ANCHOR_NOT_FOUND");
  source = source.replace(functionAnchor, `${runnerFunction}${functionAnchor}`);
}

fs.writeFileSync(filePath, source);
console.log("Target Profile Forensics phase runner cutover patch applied to pipeline.service.js");
