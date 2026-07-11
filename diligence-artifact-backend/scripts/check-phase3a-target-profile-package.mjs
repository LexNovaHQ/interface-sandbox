import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PIPELINE_CONTRACTS } from "../src/runtime/contracts/pipeline.contract.js";
import { TARGET_PROFILE_SOURCE_ARTIFACT_NAMES } from "../src/runtime/contracts/artifact-permissions.contract.js";
import { TARGET_PROFILE_REVIEW_CONTRACT } from "../src/phases/03-target-profile-review/target-profile-review.contract.js";
import { TARGET_PROFILE_REVIEW_RUNNER_STATUS } from "../src/phases/03-target-profile-review/target-profile-review.runner.js";
import { buildPhaseRoutingManifest } from "../src/phases/02-cartography-index/services/phase-routing-manifest.builder.js";
import { buildPhaseRouteRuntimeReadPlan } from "../src/phases/02-cartography-index/services/phase-route-runtime.reader.js";

const ROOT = process.cwd();
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const files = {
  prompt: "agent-packages/agent_3_target_feature/02_M7_TARGET_PROFILE_BACKEND_CURRENT.md",
  runtime: "agent-packages/agent_3_target_feature/00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md",
  binding: "agent-packages/agent_3_target_feature/AGENT3_RUNTIME_BINDING_PACKET.yaml",
  validatorRules: "agent-packages/agent_3_target_feature/00_VALIDATOR_RULES_INTEGRATED.md",
  outputContract: "agent-packages/agent_3_target_feature/AGENT3_BACKEND_OUTPUT_CONTRACT.md",
  authority: "references/registry/M7_TARGET_PROFILE_DERIVATION_AUTHORITY.yaml"
};
const content = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, read(file)]));
const packageContent = Object.fromEntries(Object.entries(content).filter(([key]) => key !== "authority"));
const m7 = PIPELINE_CONTRACTS.M7_TARGET_PROFILE;
const expectedRoots = [...TARGET_PROFILE_SOURCE_ARTIFACT_NAMES];
const retiredRootMarkers = [
  "lossless_root__about_company",
  "lossless_root__legal_identity_notice",
  "lossless_root__operator_entity_signals",
  "lossless_root__supporting_company_signals",
  "lossless_root__technical_docs_api_developer"
];

assert.ok(m7.reads.includes("phase_routing_manifest"), "M7 central contract must expose the 2G manifest to the runtime wrapper");
assert.equal(TARGET_PROFILE_REVIEW_CONTRACT.route_contract.routing_authority, "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY");
assert.equal(TARGET_PROFILE_REVIEW_CONTRACT.route_contract.route_id, "ROUTE.PHASE3A.TARGET_PROFILE");
assert.equal(TARGET_PROFILE_REVIEW_CONTRACT.route_contract.bucket_id, "2A_BUCKET_TARGET_PROFILE");
assert.equal(TARGET_PROFILE_REVIEW_RUNNER_STATUS.phase2g_route_scoped_runtime_reader_active, true);
assert.equal(TARGET_PROFILE_REVIEW_RUNNER_STATUS.direct_contract_read_loading_forbidden, true);
assert.equal(TARGET_PROFILE_REVIEW_RUNNER_STATUS.profile_forensics_inputs_forbidden, true);
assert.deepEqual(TARGET_PROFILE_REVIEW_CONTRACT.scoped_lossless_evidence_reads, expectedRoots);

const manifest = buildPhaseRoutingManifest({ runId: "CHECK-3A", artifacts: presentPhase2Artifacts() }).phase_routing_manifest;
const plan = buildPhaseRouteRuntimeReadPlan({ internalJobId: "M7_TARGET_PROFILE", phaseRoutingManifest: manifest });
assert.equal(plan.route_id, TARGET_PROFILE_REVIEW_CONTRACT.route_contract.route_id);
assert.equal(plan.bucket_id, TARGET_PROFILE_REVIEW_CONTRACT.route_contract.bucket_id);
assert.deepEqual(plan.required_index_artifacts, ["target_profile_source_index"]);
assert.deepEqual(plan.primary_lossless_evidence, expectedRoots);
assert.deepEqual(plan.allowed_legal_artifacts, ["legal_signal_derivation_profile"]);
assert.deepEqual(plan.consumer_context_reads, []);
assert.equal(plan.artifact_reads.includes("target_profile_forensics"), false);
assert.deepEqual(new Set(TARGET_PROFILE_REVIEW_CONTRACT.material_job.reads), new Set(["phase_routing_manifest", "phase_route_runtime_packet", ...plan.artifact_reads]));

for (const root of expectedRoots) {
  assert.ok(content.prompt.includes(root), `M7 prompt missing scoped root ${root}`);
  assert.ok(content.runtime.includes(root), `Agent3 runtime controller missing scoped root ${root}`);
  assert.ok(content.binding.includes(root), `Agent3 binding missing scoped root ${root}`);
  assert.ok(content.validatorRules.includes(root), `Agent3 validator rules missing scoped root ${root}`);
  assert.ok(content.authority.includes(root), `M7 authority missing scoped root ${root}`);
}

for (const marker of retiredRootMarkers) {
  for (const [key, text] of Object.entries(packageContent)) assert.equal(text.includes(marker), false, `${key} contains retired root marker: ${marker}`);
}
for (const forbidden of ["lossless_family__", "Lane is mandatory", "Semantic Lane derivation", "must derive business_context.lane", "AI_Registry_Key.yml is the base registry derivation reference for Target Profile Review"]) {
  for (const [key, text] of Object.entries(content)) assert.equal(text.includes(forbidden), false, `${key} contains forbidden 3A marker: ${forbidden}`);
}
for (const forbiddenRead of ["source_discovery_handoff", "cartography_index", "target_profile_forensics", "legal_cartography_index", "activity_profile_source_index", "data_privacy_navigation_index", "legal_doc_inventory", "legal_doc_extraction_index", "legal_doc_{DOC_TYPE}"]) assert.equal(TARGET_PROFILE_REVIEW_CONTRACT.material_job.reads.includes(forbiddenRead), false, `3A routed contract reads forbidden artifact ${forbiddenRead}`);

assert.equal(TARGET_PROFILE_REVIEW_CONTRACT.boundary_rules.phase2g_route_scoped_runtime_reader_required, true);
assert.equal(TARGET_PROFILE_REVIEW_CONTRACT.boundary_rules.profile_forensics_inputs_forbidden, true);
assert.equal(TARGET_PROFILE_REVIEW_CONTRACT.boundary_rules.phase2a_target_profile_source_index_required, true);
assert.equal(TARGET_PROFILE_REVIEW_CONTRACT.boundary_rules.target_profile_source_index_navigation_only, true);
assert.equal(TARGET_PROFILE_REVIEW_CONTRACT.boundary_rules.company_level_lane_forbidden, true);
assert.equal(TARGET_PROFILE_REVIEW_CONTRACT.boundary_rules.primary_domain_package_derivation_forbidden, true);
assert.equal(TARGET_PROFILE_REVIEW_CONTRACT.boundary_rules.ai_overlay_mount_derivation_forbidden, true);

for (const marker of ["P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY", "ROUTE.PHASE3A.TARGET_PROFILE", "target_profile_source_index", "PRIMARY_EVIDENCE", "MANDATORY_NAVIGATION_MAP_INTO_PRIMARY_EVIDENCE"]) assert.ok(content.binding.includes(marker) || content.runtime.includes(marker), `Agent3 package missing Phase 2G marker ${marker}`);
assert.ok(content.prompt.includes("Target Profile Review must not emit `business_context.lane`"));
assert.ok(content.validatorRules.includes("`business_context` must not include `lane`"));
assert.ok(content.authority.includes("business_context_lane_forbidden: true"));
assert.ok(content.prompt.includes("legal_signal_derivation_profile"));

console.log(JSON.stringify({ check: "phase3a target profile package", status: "PASS", enforced_gates: ["PHASE2G_2A_ROUTE_PLAN", "P2A_TARGET_SOURCE_INDEX_NAVIGATION_AUTHORITY", "PRIMARY_LOSSLESS_EVIDENCE", "NO_FORENSICS_INPUT", "NO_RETIRED_ROOT_MARKERS", "NO_LANE_DERIVATION", "LEGAL_SIGNAL_BOUNDED_BY_2G"] }, null, 2));

function presentPhase2Artifacts() {
  return {
    target_profile_source_index: {},
    domain_derivation_source_index: {},
    activity_profile_source_index: {},
    data_privacy_navigation_index: {},
    domain_control_obligation_navigation_index: {},
    legal_cartography_index: {},
    legal_signal_derivation_profile: {}
  };
}
