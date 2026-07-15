import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");
const filePath = path.join(backendRoot, "src/runtime/services/pipeline.service.js");
let source = fs.readFileSync(filePath, "utf8");

const runnerImport = `import { runTargetProfileReviewPhase } from "../../phases/03-target-profile-review/target-profile-review.runner.js";`;
const sourceDiscoveryImport = `import { runSourceUrlManifestJob as runSourceUrlManifestPhaseJob, runSourceExtractionJob as runSourceExtractionPhaseJob, runSourceFamilyHandoffJob as runSourceFamilyHandoffPhaseJob } from "../../phases/01-source-discovery/source-discovery.runner.js";`;
if (!source.includes(runnerImport)) {
  if (!source.includes(sourceDiscoveryImport)) throw new Error("SOURCE_DISCOVERY_IMPORT_ANCHOR_NOT_FOUND");
  source = source.replace(sourceDiscoveryImport, `${sourceDiscoveryImport}\n${runnerImport}`);
}

const statusNeedle = `source_discovery_phase_runner_wired: true, central_phase_language: true`;
const statusReplacement = `source_discovery_phase_runner_wired: true, target_profile_review_phase_runner_wired: true, central_phase_language: true`;
if (!source.includes("target_profile_review_phase_runner_wired: true")) {
  if (!source.includes(statusNeedle)) throw new Error("PIPELINE_SERVICE_STATUS_ANCHOR_NOT_FOUND");
  source = source.replace(statusNeedle, statusReplacement);
}

const dispatchNeedle = `else if (internalJobId === JOB.legalCartographyIndex) await runLegalCartographyIndexJob({ run: runtimeRun, persistencePhase, internalJobId, contract, central });`;
const dispatchReplacement = `${dispatchNeedle}\n    else if (internalJobId === JOB.targetProfileReview) await runTargetProfileReviewRuntimeJob({ run: runtimeRun, persistencePhase, internalJobId, contract, central });`;
if (!source.includes("runTargetProfileReviewRuntimeJob({ run: runtimeRun")) {
  if (!source.includes(dispatchNeedle)) throw new Error("TARGET_PROFILE_REVIEW_DISPATCH_ANCHOR_NOT_FOUND");
  source = source.replace(dispatchNeedle, dispatchReplacement);
}

const functionAnchor = `async function runDeterministicProfileForensicsJob({ run, persistencePhase, internalJobId, contract, central })`;
const runnerFunction = `async function runTargetProfileReviewRuntimeJob({ run, persistencePhase, internalJobId, contract, central }) { const result = await runTargetProfileReviewPhase({ run, internalJobId, contract, readArtifacts: ({ reads, agent_id }) => readArtifactsForCentralJob({ run_id: run.run_id, reads, agent_id }), buildPrompt: (args) => buildPhasePrompt(args), callProvider: ({ prompt, phase }) => callProviderJson({ prompt, phase }), saveArtifact: async ({ artifact_name, artifact, lock_status }) => saveArtifact(artifactSaveBody({ run_id: run.run_id, phase: persistencePhase, agent_id: contract.agent_id, artifact_name, artifact, lock_status })) }); await logCentralEvent({ run_id: run.run_id, event_type: "TARGET_PROFILE_REVIEW_PHASE_RUNNER_COMPLETED", actor: contract.agent_id, persistencePhase, internalJobId, central, payload: { writes: contract.writes, saved_artifacts: result.saved_artifacts, lock_status: result.phase_lock_status, reference_files: contract.references || [], prompt_files: contract.prompt_files || [contract.prompt_file], model_metadata: result.model_metadata, legal_signal_derivation_profile_supplied_directly: result.legal_signal_derivation_profile_supplied_directly, target_profile_review_phase_runner_used: true } }); await lockCentralPhase({ run, persistencePhase, contract, status: result.phase_lock_status, nextPhase: ["LOCKED", "LOCKED_WITH_LIMITATIONS"].includes(result.phase_lock_status) ? contract.next : persistencePhase, central }); }\n`;
if (!source.includes("async function runTargetProfileReviewRuntimeJob")) {
  if (!source.includes(functionAnchor)) throw new Error("TARGET_PROFILE_REVIEW_RUNNER_FUNCTION_ANCHOR_NOT_FOUND");
  source = source.replace(functionAnchor, `${runnerFunction}${functionAnchor}`);
}

fs.writeFileSync(filePath, source);
console.log("Target Profile Review phase runner cutover patch applied to pipeline.service.js");
