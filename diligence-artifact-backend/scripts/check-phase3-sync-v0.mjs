import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const ROOT = process.cwd();
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

const pipeline = read("src/runtime/contracts/pipeline.contract.js");
const pipelineService = read("src/runtime/services/pipeline.service.js");
const targetContract = read("src/phases/03-target-profile-review/target-profile-review.contract.js");
const targetPrompt = read("agent-packages/agent_3_target_feature/02_M7_TARGET_PROFILE_BACKEND_CURRENT.md");
const targetRunner = read("src/phases/03-target-profile-review/target-profile-review.runner.js");
const domainContract = read("src/phases/03-domain-derivation/domain-derivation.contract.js");
const domainPrompt = read("agent-packages/agent_3_target_feature/02B_P3_DOMAIN_DERIVATION_LAYER_BACKEND.md");
const domainValidator = read("src/phases/03-domain-derivation/validators/domain-derivation.validator.js");
const domainRegistry = read("references/domain-packages/DOMAIN_DERIVATION_REGISTRY_v0.yaml");
const packageJson = read("package.json");

assert.ok(pipeline.includes("M7_TARGET_PROFILE"), "pipeline must retain M7_TARGET_PROFILE job id");
assert.ok(pipeline.includes("P3_DOMAIN_DERIVATION_LAYER"), "pipeline must include P3 domain derivation job");
assert.ok(pipeline.includes('next: "P3_DOMAIN_DERIVATION_LAYER"'), "3A must advance to 3B");
assert.ok(pipeline.includes('next: "M7_TARGET_PROFILE_FORENSICS"'), "3B must advance to Phase 4 target forensics");
assert.ok(pipeline.includes('runtime_wiring_status: "PHASE3A_SCOPED_LOSSLESS_INPUTS_SYNCED"'), "3A central contract must be synced to scoped lossless inputs");
assert.ok(pipeline.includes('company_level_lane_forbidden: true'), "3B central contract must forbid company-level lane");
assert.ok(pipelineService.includes("runTargetProfileReviewPhase"), "pipeline service must use phase-owned 3A runner");
assert.ok(pipelineService.includes("runDomainDerivationPhase"), "pipeline service must use phase-owned 3B runner");
assert.ok(targetRunner.includes("production_entrypoint_switched: true"), "3A runner must advertise production entrypoint switched");

assert.ok(targetContract.includes('implementation_status: "CONTRACT_RUNNER_AND_PROMPT_ACTIVE"'), "3A contract metadata must match active runner state");
assert.ok(targetContract.includes("production_entrypoint_switched: true"), "3A contract must advertise active cutover");
assert.ok(targetContract.includes('phase_2_indexes_are_mandatory_navigation_tools: true'), "3A must require Phase 2 navigation");
assert.ok(targetContract.includes('phase_2_indexes_are_not_evidence: true'), "3A must declare indexes are not evidence");
assert.ok(targetContract.includes('company_level_lane_forbidden: true'), "3A must forbid company-level lane");
assert.ok(targetPrompt.includes("Target Profile Review must not emit `business_context.lane`"), "3A prompt must forbid business_context.lane");
assert.equal(targetContract.includes('"lane"'), false, "3A target profile schema must not contain a lane field");

assert.ok(domainContract.includes('implementation_status: "CONTRACT_RUNNER_AND_REGISTRY_LADDER_PROMPT_ACTIVE"'), "3B contract must be active");
assert.ok(domainContract.includes('registry_ladder_prompt_active: true'), "3B must use registry ladder prompt");
assert.ok(domainContract.includes('phase_2_indexes_are_navigation_only: true'), "3B must declare Phase 2 indexes navigation-only");
assert.ok(domainContract.includes('company_level_lane_forbidden: true'), "3B must forbid company-level lane");
assert.ok(domainContract.includes('"business_context.lane"'), "3B forbidden outputs must include business_context.lane");
assert.ok(domainPrompt.includes("not evidence"), "3B prompt must state indexes are not evidence");
assert.ok(domainPrompt.includes("must not emit Lane"), "3B prompt must forbid Lane");
assert.ok(domainPrompt.includes("package mount"), "3B prompt must distinguish AI package mount from activity/exposure lock");

assert.ok(domainRegistry.includes("AI package mount is AI_PRIMARY and AI overlay is prohibited"), "registry must prohibit overlay when AI is primary");
assert.ok(domainRegistry.includes("AI_OVERLAY_MOUNTED is package availability only and does not trigger AI exposure rows"), "registry must limit AI overlay to package availability only in 3B");
assert.ok(domainRegistry.includes("Fusion candidates are owned by the locked primary domain package"), "registry must keep fusion ownership with primary domain");
assert.ok(domainValidator.includes('"LOCKED_FOR_PACKAGE_MOUNT_ONLY"'), "3B validator must expose package-mount-only AI overlay status");
assert.ok(domainValidator.includes('activity_lock_status: "DEFERRED_TO_PHASE_5"'), "3B validator must defer AI activity lock to Phase 5");
assert.ok(domainValidator.includes('exposure_lock_status: "DEFERRED_TO_PHASE_9"'), "3B validator must defer AI exposure lock to Phase 9");
assert.ok(domainValidator.includes('fusion_owner: primary.selected_package'), "fusion candidates must be owned by locked primary domain");
assert.ok(domainValidator.includes('dynamic_routing_enabled'), "manifest compiler must keep runtime flags false");
assert.ok(packageJson.includes("check:phase3-sync-v0"), "package.json must expose Phase 3 sync check");

console.log(JSON.stringify({ check: "phase3 sync v0", status: "PASS", enforced: ["3A_ACTIVE_METADATA", "3A_LANE_FREE", "3B_REGISTRY_LADDER", "PHASE2_NAVIGATION_NOT_EVIDENCE", "AI_PACKAGE_MOUNT_ONLY", "FUSION_DOMAIN_OWNED"] }, null, 2));
