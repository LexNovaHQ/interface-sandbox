import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPipelineContract, PIPELINE_CONTRACT_STATUS } from "../src/runtime/contracts/pipeline.contract.js";
import { TARGET_PROFILE_REVIEW_CONTRACT, TARGET_PROFILE_REVIEW_RUNNER_STATUS, targetProfileReviewReadArtifacts } from "../src/phases/03-target-profile-review/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");

const contract = getPipelineContract("M7_TARGET_PROFILE");
const expectedReads = targetProfileReviewReadArtifacts();

assert.equal(TARGET_PROFILE_REVIEW_CONTRACT.central_phase_id, "TARGET_PROFILE_REVIEW");
assert.equal(TARGET_PROFILE_REVIEW_CONTRACT.public_label, "Target Profile Review");
assert.deepEqual(TARGET_PROFILE_REVIEW_CONTRACT.material_job.reads, expectedReads);
assert.deepEqual(TARGET_PROFILE_REVIEW_CONTRACT.material_job.writes, ["target_profile"]);

assert.equal(contract.central_phase_id, "TARGET_PROFILE_REVIEW");
assert.equal(contract.public_label, "Target Profile Review");
assert.deepEqual(contract.reads, expectedReads);
assert.deepEqual(contract.writes, ["target_profile"]);
assert.equal(contract.runtime_wiring_status, "PHASE_RUNNER_CUTOVER");
assert.equal(contract.production_entrypoint_switched, true);
assert.equal(contract.global_production_deployment_switched, false);

assert.equal(TARGET_PROFILE_REVIEW_RUNNER_STATUS.phase_owned_runner, true);
assert.equal(TARGET_PROFILE_REVIEW_RUNNER_STATUS.production_entrypoint_switched, true);
assert.equal(TARGET_PROFILE_REVIEW_RUNNER_STATUS.global_production_deployment_switched, false);
assert.deepEqual(TARGET_PROFILE_REVIEW_RUNNER_STATUS.reads, expectedReads);
assert.deepEqual(TARGET_PROFILE_REVIEW_RUNNER_STATUS.writes, ["target_profile"]);

assert.equal(PIPELINE_CONTRACT_STATUS.target_profile_review_runtime_wiring_audited, true);
assert.equal(PIPELINE_CONTRACT_STATUS.target_profile_review_reads_contract_locked, true);
assert.equal(PIPELINE_CONTRACT_STATUS.target_profile_review_prompt_stack_contract_locked, true);
assert.equal(PIPELINE_CONTRACT_STATUS.target_profile_review_validator_wired, true);
assert.equal(PIPELINE_CONTRACT_STATUS.target_profile_review_phase_runner_cutover, true);
assert.equal(PIPELINE_CONTRACT_STATUS.target_profile_review_production_entrypoint_switched, true);
assert.equal(PIPELINE_CONTRACT_STATUS.global_production_deployment_switched, false);

for (const forbiddenRead of [
  "legal_cartography_index",
  "m7_deterministic_legal_signal_overlay",
  "lossless_family__L1_CORE_TERMS_PRIVACY",
  "lossless_family__L2_B2B_CONTRACTING",
  "lossless_family__L3_AI_USAGE_GOVERNANCE",
  "lossless_family__L4_PRIVACY_ADJACENT_NOTICES",
  "lossless_family__L5_LEGAL_HUB_HOSTED",
  "lossless_family__L6_ENTITY_NOTICE",
  "lossless_family__P1_PRODUCT",
  "lossless_family__D1_SECURITY_TRUST"
]) assert.equal(contract.reads.includes(forbiddenRead), false, `Target Profile Review closure read pollution: ${forbiddenRead}`);

const expectedScripts = [
  "scripts/check-target-profile-review-contract.mjs",
  "scripts/check-target-profile-review-package.mjs",
  "scripts/check-target-profile-review-validator.mjs",
  "scripts/check-target-profile-review-phase-smoke.mjs",
  "scripts/check-target-profile-review-runtime-wiring.mjs",
  "scripts/check-target-profile-review-runner-cutover.mjs",
  "scripts/check-target-profile-review-runtime-smoke.mjs",
  "scripts/check-target-profile-review-closure.mjs"
];
for (const script of expectedScripts) assertFile(script);

const expectedAudits = [
  "audits/PASS3A_TARGET_PROFILE_REVIEW_CONTRACT_LOCK.md",
  "audits/PASS3B_TARGET_PROFILE_REVIEW_PACKAGE_CLEANUP.md",
  "audits/PASS3C_TARGET_PROFILE_REVIEW_VALIDATOR_UPDATE.md",
  "audits/PASS3D_TARGET_PROFILE_REVIEW_SELF_CONTAINED_SMOKE.md",
  "audits/PASS3E_TARGET_PROFILE_REVIEW_RUNTIME_WIRING_AUDIT.md",
  "audits/PASS3F_TARGET_PROFILE_REVIEW_RUNNER_CUTOVER.md",
  "audits/PASS3G_TARGET_PROFILE_REVIEW_RUNTIME_SMOKE.md",
  "audits/PASS3H_TARGET_PROFILE_REVIEW_CLOSURE_AUDIT.md"
];
for (const audit of expectedAudits) assertFile(audit);

const aggregate = read("scripts/check-phase3-target-profile-review.mjs");
for (const script of expectedScripts) {
  const importPath = `./${path.basename(script)}`;
  assert.ok(aggregate.includes(importPath), `aggregate missing ${importPath}`);
}
assert.ok(aggregate.includes("Target Profile Review phase checks: PASS"));

const pipelineService = read("src/runtime/services/pipeline.service.js");
assert.ok(pipelineService.includes("runTargetProfileReviewPhase"));
assert.ok(pipelineService.includes("target_profile_review_phase_runner_wired: true"));
assert.ok(pipelineService.includes("internalJobId === JOB.targetProfileReview) await runTargetProfileReviewRuntimeJob"));
assert.ok(pipelineService.includes("TARGET_PROFILE_REVIEW_PHASE_RUNNER_COMPLETED"));
assert.ok(pipelineService.includes("target_profile_review_phase_runner_used: true"));

const runnerSource = read("src/phases/03-target-profile-review/target-profile-review.runner.js");
assert.ok(runnerSource.includes("assertAllowedRuntimeArtifacts"));
assert.ok(runnerSource.includes("validateTargetProfileReviewOutput(output, { phase: internalJobId })"));
assert.ok(runnerSource.includes("TARGET_PROFILE_REVIEW_FORBIDDEN_RUNTIME_ARTIFACT"));
assert.ok(runnerSource.includes("TARGET_PROFILE_REVIEW_OUTPUT_MISSING_ARTIFACT"));

console.log("Target Profile Review closure audit: PASS");

function assertFile(relativePath) {
  assert.equal(fs.existsSync(path.join(backendRoot, relativePath)), true, `missing closure file: ${relativePath}`);
}

function read(relativePath) {
  return fs.readFileSync(path.join(backendRoot, relativePath), "utf8");
}
