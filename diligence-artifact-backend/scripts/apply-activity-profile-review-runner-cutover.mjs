import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");

patchPipelineContract();
patchPipelineService();

console.log("Activity Profile Review material phase runner cutover patch applied to pipeline.contract.js and pipeline.service.js");

function patchPipelineContract() {
  const filePath = path.join(backendRoot, "src/runtime/contracts/pipeline.contract.js");
  let source = fs.readFileSync(filePath, "utf8");

  const legacyContract = `M8_TARGET_FEATURE_PROFILE: { type: "model", agent_id: "agent_3_target_feature", prompt_files: [...TA_RUNTIME, \`${TA_ROOT}/03_M8_FEATURE_PROFILE_BACKEND_CURRENT.md\`, \`${TA_ROOT}/03A_M8_FEATURE_CANDIDATE_INVENTORY_DETERMINISTIC.md\`, ...TA_VALIDATION], reads: ["source_discovery_handoff", "target_profile", "target_profile_forensics", "feature_candidate_inventory", ...PRODUCT_ACTIVITY_FAMILY_ARTIFACT_NAMES], references: TARGET_ACTIVITY_REFERENCE_FILES, writes: ["target_feature_profile"], next: "M8_TARGET_FEATURE_PROFILE_FORENSICS", central_phase_id: "ACTIVITY_PROFILE_REVIEW", public_label: "Activity Profile Review" }`;
  const cutoverContract = `M8_TARGET_FEATURE_PROFILE: { type: "model", agent_id: "agent_3_target_feature", prompt_files: [...TA_RUNTIME, \`${TA_ROOT}/03_M8_FEATURE_PROFILE_BACKEND_CURRENT.md\`, \`${TA_ROOT}/03A_M8_FEATURE_CANDIDATE_INVENTORY_DETERMINISTIC.md\`, ...TA_VALIDATION], reads: ["source_discovery_handoff", "target_profile", "target_profile_forensics", "feature_candidate_inventory", ...PRODUCT_ACTIVITY_FAMILY_ARTIFACT_NAMES], references: TARGET_ACTIVITY_REFERENCE_FILES, writes: ["target_feature_profile"], next: "M8_TARGET_FEATURE_PROFILE_FORENSICS", central_phase_id: "ACTIVITY_PROFILE_REVIEW", public_label: "Activity Profile Review", runtime_wiring_status: "PHASE_RUNNER_CUTOVER", production_entrypoint_switched: true, global_production_deployment_switched: false }`;
  if (!source.includes(cutoverContract)) {
    if (!source.includes(legacyContract)) throw new Error("ACTIVITY_PROFILE_REVIEW_MATERIAL_CONTRACT_ANCHOR_NOT_FOUND");
    source = source.replace(legacyContract, cutoverContract);
  }

  if (!source.includes("activity_profile_review_material_phase_runner_cutover: true")) {
    const preferredNeedle = `activity_candidate_inventory_production_entrypoint_switched: true, global_production_deployment_switched: false`;
    const fallbackNeedle = `target_profile_review_production_entrypoint_switched: true, global_production_deployment_switched: false`;
    const insertion = `activity_profile_review_material_contract_locked: true, activity_profile_review_material_phase_runner_cutover: true, activity_profile_review_material_production_entrypoint_switched: true, `;
    if (source.includes(preferredNeedle)) source = source.replace(preferredNeedle, `activity_candidate_inventory_production_entrypoint_switched: true, ${insertion}global_production_deployment_switched: false`);
    else if (source.includes(fallbackNeedle)) source = source.replace(fallbackNeedle, `target_profile_review_production_entrypoint_switched: true, ${insertion}global_production_deployment_switched: false`);
    else throw new Error("ACTIVITY_PROFILE_REVIEW_MATERIAL_STATUS_ANCHOR_NOT_FOUND");
  }

  fs.writeFileSync(filePath, source);
}

function patchPipelineService() {
  const filePath = path.join(backendRoot, "src/runtime/services/pipeline.service.js");
  let source = fs.readFileSync(filePath, "utf8");

  const runnerImport = `import { runActivityProfileReviewPhase } from "../../phases/05-activity-profile-review/activity-profile-review.runner.js";`;
  const candidateImport = `import { runActivityCandidateInventoryPhase } from "../../phases/05-activity-profile-review/activity-candidate-inventory.runner.js";`;
  const forensicsImport = `import { runTargetProfileForensicsPhase } from "../../phases/04-target-profile-forensics/target-profile-forensics.runner.js";`;
  if (!source.includes(runnerImport)) {
    if (source.includes(candidateImport)) source = source.replace(candidateImport, `${candidateImport}\n${runnerImport}`);
    else if (source.includes(forensicsImport)) source = source.replace(forensicsImport, `${forensicsImport}\n${runnerImport}`);
    else throw new Error("ACTIVITY_PROFILE_REVIEW_MATERIAL_IMPORT_ANCHOR_NOT_FOUND");
  }

  if (!source.includes("activity_profile_review_phase_runner_wired: true")) {
    const preferredNeedle = `activity_candidate_inventory_phase_runner_wired: true, central_phase_language: true`;
    const fallbackNeedle = `target_profile_forensics_phase_runner_wired: true, central_phase_language: true`;
    if (source.includes(preferredNeedle)) source = source.replace(preferredNeedle, `activity_candidate_inventory_phase_runner_wired: true, activity_profile_review_phase_runner_wired: true, central_phase_language: true`);
    else if (source.includes(fallbackNeedle)) source = source.replace(fallbackNeedle, `target_profile_forensics_phase_runner_wired: true, activity_profile_review_phase_runner_wired: true, central_phase_language: true`);
    else throw new Error("ACTIVITY_PROFILE_REVIEW_MATERIAL_SERVICE_STATUS_ANCHOR_NOT_FOUND");
  }

  const dispatchNeedle = `else if (internalJobId === JOB.targetProfileForensics) await runTargetProfileForensicsRuntimeJob({ run: runtimeRun, persistencePhase, internalJobId, contract, central });`;
  const dispatchInsertion = `${dispatchNeedle}\n    else if (internalJobId === JOB.activityProfileReview) await runActivityProfileReviewRuntimeJob({ run: runtimeRun, persistencePhase, internalJobId, contract, central });`;
  if (!source.includes("internalJobId === JOB.activityProfileReview) await runActivityProfileReviewRuntimeJob")) {
    if (!source.includes(dispatchNeedle)) throw new Error("ACTIVITY_PROFILE_REVIEW_MATERIAL_DISPATCH_ANCHOR_NOT_FOUND");
    source = source.replace(dispatchNeedle, dispatchInsertion);
  }

  const functionAnchor = `async function runDeterministicProfileForensicsJob({ run, persistencePhase, internalJobId, contract, central })`;
  const runnerFunction = `async function runActivityProfileReviewRuntimeJob({ run, persistencePhase, internalJobId, contract, central }) { const result = await runActivityProfileReviewPhase({ run, internalJobId, contract, readArtifacts: ({ reads, agent_id }) => readArtifactsForCentralJob({ run_id: run.run_id, reads, agent_id, strict: true }), buildPrompt: (args) => buildPhasePrompt(args), callProvider: ({ prompt, phase }) => callProviderJson({ prompt, phase }), saveArtifact: async ({ artifact_name, artifact, lock_status }) => saveArtifact(artifactSaveBody({ run_id: run.run_id, phase: persistencePhase, agent_id: contract.agent_id, artifact_name, artifact, lock_status })) }); await logCentralEvent({ run_id: run.run_id, event_type: "ACTIVITY_PROFILE_REVIEW_PHASE_RUNNER_COMPLETED", actor: contract.agent_id, persistencePhase, internalJobId, central, payload: { writes: contract.writes, saved_artifacts: result.saved_artifacts, lock_status: result.phase_lock_status, reference_files: contract.references || [], prompt_files: contract.prompt_files || [contract.prompt_file], model_metadata: result.model_metadata, model_usage: result.model_usage, validator: result.validator, validator_phase: result.validator_phase, activity_profile_review_phase_runner_used: true } }); await lockCentralPhase({ run, persistencePhase, contract, status: result.phase_lock_status, nextPhase: ["LOCKED", "LOCKED_WITH_LIMITATIONS"].includes(result.phase_lock_status) ? contract.next : persistencePhase, central }); }\n`;
  if (!source.includes("async function runActivityProfileReviewRuntimeJob")) {
    if (!source.includes(functionAnchor)) throw new Error("ACTIVITY_PROFILE_REVIEW_MATERIAL_FUNCTION_ANCHOR_NOT_FOUND");
    source = source.replace(functionAnchor, `${runnerFunction}${functionAnchor}`);
  }

  fs.writeFileSync(filePath, source);
}
