import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");

patchPipelineContract();
patchPipelineService();

console.log("Activity Candidate Inventory phase runner cutover patch applied to pipeline.contract.js and pipeline.service.js");

function patchPipelineContract() {
  const filePath = path.join(backendRoot, "src/runtime/contracts/pipeline.contract.js");
  let source = fs.readFileSync(filePath, "utf8");

  const readsConst = `const ACTIVITY_CANDIDATE_INVENTORY_READS = Object.freeze(["source_discovery_handoff", "target_profile", "target_profile_forensics", "lossless_family__P1_PRODUCT", "lossless_family__P2_PLATFORM_FEATURE_SOLUTION", "lossless_family__P3_AI_CAPABILITY_TECHNICAL", "lossless_family__P5_ENTERPRISE_PRICING"]);`;
  const anchorConst = `const TARGET_PROFILE_REVIEW_READS = Object.freeze(["source_discovery_handoff", ...TARGET_PROFILE_FAMILY_ARTIFACT_NAMES, ...LEGAL_SIGNAL_READS]);`;
  if (!source.includes(readsConst)) {
    if (!source.includes(anchorConst)) throw new Error("ACTIVITY_CANDIDATE_INVENTORY_READS_ANCHOR_NOT_FOUND");
    source = source.replace(anchorConst, `${anchorConst}\n${readsConst}`);
  }

  const legacyContract = `M8_FEATURE_CANDIDATE_INVENTORY: { type: "deterministic", agent_id: "agent_3_target_feature", actor_id: "agent_3_target_feature", reads: ["source_discovery_handoff", "target_profile", "target_profile_forensics", ...PRODUCT_ACTIVITY_FAMILY_ARTIFACT_NAMES], references: [], writes: FEATURE_CANDIDATE_INVENTORY_ARTIFACT_NAMES, next: "M8_TARGET_FEATURE_PROFILE", central_phase_id: "ACTIVITY_PROFILE_REVIEW", public_label: "Activity Profile Review" }`;
  const cutoverContract = `M8_FEATURE_CANDIDATE_INVENTORY: { type: "deterministic", agent_id: "agent_3_target_feature", actor_id: "agent_3_target_feature", reads: ACTIVITY_CANDIDATE_INVENTORY_READS, references: [], writes: FEATURE_CANDIDATE_INVENTORY_ARTIFACT_NAMES, next: "M8_TARGET_FEATURE_PROFILE", central_phase_id: "ACTIVITY_PROFILE_REVIEW", public_label: "Activity Profile Review", runtime_wiring_status: "PHASE_RUNNER_CUTOVER", production_entrypoint_switched: true, global_production_deployment_switched: false }`;
  if (!source.includes(cutoverContract)) {
    if (!source.includes(legacyContract)) throw new Error("ACTIVITY_CANDIDATE_INVENTORY_CONTRACT_ANCHOR_NOT_FOUND");
    source = source.replace(legacyContract, cutoverContract);
  }

  const statusNeedle = `target_profile_review_production_entrypoint_switched: true, global_production_deployment_switched: false`;
  const statusReplacement = `target_profile_review_production_entrypoint_switched: true, activity_candidate_inventory_contract_locked: true, activity_candidate_inventory_phase_runner_cutover: true, activity_candidate_inventory_production_entrypoint_switched: true, global_production_deployment_switched: false`;
  if (!source.includes("activity_candidate_inventory_phase_runner_cutover: true")) {
    if (!source.includes(statusNeedle)) throw new Error("ACTIVITY_CANDIDATE_INVENTORY_STATUS_ANCHOR_NOT_FOUND");
    source = source.replace(statusNeedle, statusReplacement);
  }

  fs.writeFileSync(filePath, source);
}

function patchPipelineService() {
  const filePath = path.join(backendRoot, "src/runtime/services/pipeline.service.js");
  let source = fs.readFileSync(filePath, "utf8");

  const runnerImport = `import { runActivityCandidateInventoryPhase } from "../../phases/05-activity-profile-review/activity-candidate-inventory.runner.js";`;
  const forensicsImport = `import { runTargetProfileForensicsPhase } from "../../phases/04-target-profile-forensics/target-profile-forensics.runner.js";`;
  if (!source.includes(runnerImport)) {
    if (!source.includes(forensicsImport)) throw new Error("ACTIVITY_CANDIDATE_INVENTORY_IMPORT_ANCHOR_NOT_FOUND");
    source = source.replace(forensicsImport, `${forensicsImport}\n${runnerImport}`);
  }

  const statusNeedle = `target_profile_forensics_phase_runner_wired: true, central_phase_language: true`;
  const statusReplacement = `target_profile_forensics_phase_runner_wired: true, activity_candidate_inventory_phase_runner_wired: true, central_phase_language: true`;
  if (!source.includes("activity_candidate_inventory_phase_runner_wired: true")) {
    if (!source.includes(statusNeedle)) throw new Error("ACTIVITY_CANDIDATE_INVENTORY_SERVICE_STATUS_ANCHOR_NOT_FOUND");
    source = source.replace(statusNeedle, statusReplacement);
  }

  const dispatchNeedle = `else if (internalJobId === JOB.activityCandidateInventory) await runActivityCandidateInventoryJob({ run: runtimeRun, persistencePhase, internalJobId, contract, central });`;
  const dispatchReplacement = `else if (internalJobId === JOB.activityCandidateInventory) await runActivityCandidateInventoryRuntimeJob({ run: runtimeRun, persistencePhase, internalJobId, contract, central });`;
  if (!source.includes(dispatchReplacement)) {
    if (!source.includes(dispatchNeedle)) throw new Error("ACTIVITY_CANDIDATE_INVENTORY_DISPATCH_ANCHOR_NOT_FOUND");
    source = source.replace(dispatchNeedle, dispatchReplacement);
  }

  const functionAnchor = `async function runActivityCandidateInventoryJob({ run, persistencePhase, internalJobId, contract, central })`;
  const runnerFunction = `async function runActivityCandidateInventoryRuntimeJob({ run, persistencePhase, internalJobId, contract, central }) { const result = await runActivityCandidateInventoryPhase({ run, internalJobId, contract, readArtifacts: ({ reads, agent_id }) => readArtifactsForCentralJob({ run_id: run.run_id, reads, agent_id, strict: true }), saveArtifact: async ({ artifact_name, artifact, lock_status }) => saveArtifact(artifactSaveBody({ run_id: run.run_id, phase: persistencePhase, agent_id: contract.actor_id || contract.agent_id, artifact_name, artifact, lock_status })) }); await logCentralEvent({ run_id: run.run_id, event_type: "ACTIVITY_CANDIDATE_INVENTORY_PHASE_RUNNER_COMPLETED", actor: contract.actor_id || contract.agent_id, persistencePhase, internalJobId, central, payload: { writes: contract.writes, saved_artifacts: result.saved_artifacts, lock_status: result.phase_lock_status, raw_hit_count: result.raw_hit_count, canonical_candidate_count: result.canonical_candidate_count, source_families_indexed: result.source_families_indexed || [], model_usage: result.model_usage, source_helper: result.source_helper, validator: result.validator, activity_candidate_inventory_phase_runner_used: true } }); await lockCentralPhase({ run, persistencePhase, contract, status: result.phase_lock_status, nextPhase: contract.next, central }); }\n`;
  if (!source.includes("async function runActivityCandidateInventoryRuntimeJob")) {
    if (!source.includes(functionAnchor)) throw new Error("ACTIVITY_CANDIDATE_INVENTORY_FUNCTION_ANCHOR_NOT_FOUND");
    source = source.replace(functionAnchor, `${runnerFunction}${functionAnchor}`);
  }

  fs.writeFileSync(filePath, source);
}
