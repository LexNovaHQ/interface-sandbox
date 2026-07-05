import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPipelineContract, PIPELINE_CONTRACT_STATUS } from "../src/runtime/contracts/pipeline.contract.js";
import { promptContractForInternalJob } from "../src/runtime/services/prompts.service.js";
import { TARGET_PROFILE_REVIEW_CONTRACT, targetProfileReviewReadArtifacts } from "../src/phases/03-target-profile-review/index.js";
import { READ_PERMISSIONS, WRITE_PERMISSIONS, INTERNAL_JOB_WRITE_PERMISSIONS, AGENT_IDS } from "../src/runtime/contracts/artifact-permissions.contract.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");

const contract = getPipelineContract("M7_TARGET_PROFILE");
const promptContract = promptContractForInternalJob("M7_TARGET_PROFILE");
const expectedReads = targetProfileReviewReadArtifacts();

assert.equal(contract.central_phase_id, "TARGET_PROFILE_REVIEW");
assert.equal(contract.public_label, "Target Profile Review");
assert.equal(contract.type, "model");
assert.equal(contract.agent_id, "agent_3_target_feature");
assert.equal(contract.runtime_wiring_status, "PHASE_RUNNER_CUTOVER");
assert.equal(contract.production_entrypoint_switched, true);
assert.equal(contract.global_production_deployment_switched, false);
assert.deepEqual(contract.reads, expectedReads);
assert.deepEqual(contract.writes, ["target_profile"]);
assert.deepEqual(contract.references, ["M7_TARGET_PROFILE_DERIVATION_AUTHORITY.yaml", "FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml"]);
assert.equal(contract.next, "M7_TARGET_PROFILE_FORENSICS");

for (const forbidden of [
  "legal_cartography_index",
  "m7_deterministic_legal_signal_overlay",
  "lossless_family__L1_CORE_TERMS_PRIVACY",
  "lossless_family__L2_B2B_CONTRACTING",
  "lossless_family__L3_AI_USAGE_GOVERNANCE",
  "lossless_family__L4_PRIVACY_ADJACENT_NOTICES",
  "lossless_family__L5_LEGAL_HUB_HOSTED",
  "lossless_family__L6_ENTITY_NOTICE",
  "lossless_family__P1_PRODUCT",
  "lossless_family__P2_PLATFORM_FEATURE_SOLUTION",
  "lossless_family__P3_AI_CAPABILITY_TECHNICAL",
  "lossless_family__P4_USE_CASE_INDUSTRY",
  "lossless_family__P5_ENTERPRISE_PRICING",
  "lossless_family__D1_SECURITY_TRUST",
  "lossless_family__D2_SUBPROCESSOR_PRIVACY_CENTER",
  "lossless_family__D3_DATA_GOVERNANCE_CONTROLS",
  "lossless_family__D4_DOCS_API_DATA_FLOW",
  "lossless_family__D5_AI_SAFETY_TRANSPARENCY"
]) assert.equal(contract.reads.includes(forbidden), false, `Target Profile Review runtime read leak: ${forbidden}`);

assert.deepEqual(promptContract.prompt_files, contract.prompt_files);
assert.deepEqual(promptContract.writes, ["target_profile"]);
assert.deepEqual(promptContract.references, contract.references);
assert.equal(promptContract.has_prompt_files, true);

for (const requiredPromptFile of [
  "agent-packages/00_SYSTEM_BLOCKING_DOCTRINE.md",
  "agent-packages/agent_3_target_feature/00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md",
  "agent-packages/agent_3_target_feature/AGENT3_RUNTIME_BINDING_PACKET.yaml",
  "agent-packages/agent_3_target_feature/02_M7_TARGET_PROFILE_BACKEND_CURRENT.md",
  "agent-packages/agent_3_target_feature/00_VALIDATOR_RULES_INTEGRATED.md",
  "agent-packages/agent_3_target_feature/AGENT3_BACKEND_OUTPUT_CONTRACT.md"
]) assert.equal(contract.prompt_files.includes(requiredPromptFile), true, `missing Target Profile Review prompt file: ${requiredPromptFile}`);

const targetActivityReads = READ_PERMISSIONS[AGENT_IDS.targetActivity] || [];
const targetActivityWrites = WRITE_PERMISSIONS[AGENT_IDS.targetActivity] || [];
const targetProfileInternalWrites = INTERNAL_JOB_WRITE_PERMISSIONS.M7_TARGET_PROFILE || [];

assert.equal(targetActivityReads.includes("legal_cartography_index"), false);
assert.equal(targetActivityReads.includes("m7_deterministic_legal_signal_overlay"), false);
assert.equal(targetActivityReads.some((name) => String(name).startsWith("lossless_family__L")), false);
assert.equal(targetActivityReads.some((name) => String(name).startsWith("lossless_family__D")), false);
assert.equal(targetActivityWrites.includes("target_profile"), true);
assert.deepEqual(targetProfileInternalWrites, ["target_profile"]);

assert.equal(PIPELINE_CONTRACT_STATUS.target_profile_review_runtime_wiring_audited, true);
assert.equal(PIPELINE_CONTRACT_STATUS.target_profile_review_reads_contract_locked, true);
assert.equal(PIPELINE_CONTRACT_STATUS.target_profile_review_prompt_stack_contract_locked, true);
assert.equal(PIPELINE_CONTRACT_STATUS.target_profile_review_validator_wired, true);
assert.equal(PIPELINE_CONTRACT_STATUS.target_profile_review_phase_runner_cutover, true);
assert.equal(PIPELINE_CONTRACT_STATUS.target_profile_review_production_entrypoint_switched, true);
assert.equal(PIPELINE_CONTRACT_STATUS.global_production_deployment_switched, false);

const pipelineSource = read("src/runtime/services/pipeline.service.js");
assert.ok(pipelineSource.includes("import { validateM7TargetProfileOutput as validateTargetProfileOutput }"));
assert.ok(pipelineSource.includes("readArtifactsForCentralJob({ run_id: run.run_id, reads: contract.reads, agent_id: contract.agent_id })"));
assert.ok(pipelineSource.includes("buildPhasePrompt({ prompt_file: contract.prompt_file, prompt_files: contract.prompt_files"));
assert.ok(pipelineSource.includes("validateTargetProfileOutput(output, { phase: internalJobId })"));
assert.ok(pipelineSource.includes("for (const artifactName of contract.writes)"));
assert.ok(pipelineSource.includes("artifact_name: artifactName"));
assert.ok(pipelineSource.includes("legal_signal_derivation_profile_supplied_directly"));

const phaseContractsSource = read("src/phase-contracts.js");
assert.ok(phaseContractsSource.includes("M7_TARGET_PROFILE"));
assert.ok(phaseContractsSource.includes("legal_signal_derivation_profile"));
assert.equal(/M7_TARGET_PROFILE:[^\n]+legal_cartography_index/.test(phaseContractsSource), false);
assert.equal(/M7_TARGET_PROFILE:[^\n]+m7_deterministic_legal_signal_overlay/.test(phaseContractsSource), false);

assert.deepEqual(expectedReads, TARGET_PROFILE_REVIEW_CONTRACT.material_job.reads);

console.log("Target Profile Review runtime wiring audit: PASS");

function read(relativePath) {
  return fs.readFileSync(path.join(backendRoot, relativePath), "utf8");
}
