import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PIPELINE_CONTRACTS } from "../src/runtime/contracts/pipeline.contract.js";
import { TARGET_PROFILE_REVIEW_CONTRACT } from "../src/phases/03-target-profile-review/target-profile-review.contract.js";
import { TARGET_PROFILE_REVIEW_RUNNER_STATUS } from "../src/phases/03-target-profile-review/target-profile-review.runner.js";

const ROOT = process.cwd();
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const files = {
  prompt: "agent-packages/agent_3_target_feature/02_M7_TARGET_PROFILE_BACKEND_CURRENT.md",
  runtime: "agent-packages/agent_3_target_feature/00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md",
  binding: "agent-packages/agent_3_target_feature/AGENT3_RUNTIME_BINDING_PACKET.yaml",
  validatorRules: "agent-packages/agent_3_target_feature/00_VALIDATOR_RULES_INTEGRATED.md",
  authority: "references/registry/M7_TARGET_PROFILE_DERIVATION_AUTHORITY.yaml"
};
const content = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, read(file)]));
const m7 = PIPELINE_CONTRACTS.M7_TARGET_PROFILE;
assert.deepEqual(m7.reads, TARGET_PROFILE_REVIEW_CONTRACT.material_job.reads, "M7 pipeline reads must match phase-owned contract");
assert.deepEqual(TARGET_PROFILE_REVIEW_RUNNER_STATUS.reads, TARGET_PROFILE_REVIEW_CONTRACT.material_job.reads, "M7 runner reads must match phase-owned contract");
assert.deepEqual(m7.references, ["M7_TARGET_PROFILE_DERIVATION_AUTHORITY.yaml", "FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml"], "M7 references must not include AI/domain package registry authority");
for (const root of TARGET_PROFILE_REVIEW_CONTRACT.scoped_lossless_evidence_reads) {
  assert.ok(m7.reads.includes(root), `M7 missing scoped root ${root}`);
  assert.ok(content.prompt.includes(root), `M7 prompt missing scoped root ${root}`);
  assert.ok(content.binding.includes(root), `Agent3 binding missing scoped root ${root}`);
  assert.ok(content.authority.includes(root), `M7 authority missing scoped root ${root}`);
}
for (const forbidden of ["lossless_family__", "Lane is mandatory", "Semantic Lane derivation", "must derive business_context.lane", "AI_REGISTRY_KEY.md is the base registry derivation reference for Target Profile Review", "lossless_family__T0_ROOT", "lossless_family__T1_IDENTITY", "lossless_family__T2_LEGAL_IDENTITY", "lossless_family__T3_OPERATOR_ENTITY", "lossless_family__T4_SUPPORTING_IDENTITY"]) {
  for (const [key, text] of Object.entries(content)) assert.equal(text.includes(forbidden), false, `${key} contains forbidden 3A marker: ${forbidden}`);
}
for (const forbiddenRead of ["legal_cartography_index", "legal_doc_inventory", "legal_doc_extraction_index", "legal_doc_{DOC_TYPE}", "activity_profile_source_index", "data_privacy_navigation_index"]) assert.equal(m7.reads.includes(forbiddenRead), false, `M7 reads forbidden artifact ${forbiddenRead}`);
assert.equal(TARGET_PROFILE_REVIEW_CONTRACT.boundary_rules.company_level_lane_forbidden, true);
assert.equal(TARGET_PROFILE_REVIEW_CONTRACT.boundary_rules.primary_domain_package_derivation_forbidden, true);
assert.equal(TARGET_PROFILE_REVIEW_CONTRACT.boundary_rules.ai_overlay_mount_derivation_forbidden, true);
assert.ok(content.prompt.includes("Target Profile Review must not emit `business_context.lane`"));
assert.ok(content.validatorRules.includes("`business_context` must not include `lane`"));
assert.ok(content.authority.includes("business_context_lane_forbidden: true"));
assert.ok(content.prompt.includes("legal_signal_derivation_profile"));
assert.ok(content.prompt.includes("owned legal notice and jurisdiction fields"));
console.log(JSON.stringify({ check: "phase3a target profile package", status: "PASS", enforced_gates: ["M7_READS_MATCH_PHASE_CONTRACT", "SCOPED_LOSSLESS_ROOTS_PRESENT", "NO_RETIRED_FAMILY_MARKERS", "NO_LANE_DERIVATION", "NO_AI_REGISTRY_REFERENCE_FOR_3A", "LEGAL_SIGNAL_ONLY_BOUNDED"] }, null, 2));
