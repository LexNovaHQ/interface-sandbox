import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { P2G_PHASE_ROUTER_CONTRACT, P2G_ROUTE_BUCKETS, PHASE_ROUTE_IDS } from "../src/phases/02-cartography-index/phase-routing.contract.js";
import { P2G_RUNTIME_ROUTE_BY_JOB } from "../src/phases/02-cartography-index/services/phase-route-runtime.reader.js";
import { PIPELINE_CONTRACTS } from "../src/runtime/contracts/pipeline.contract.js";
import { AGENT_IDS, READ_PERMISSIONS } from "../src/runtime/contracts/artifact-permissions.contract.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROUTER_IMPLEMENTATION_FILES = new Set([
  "src/phases/02-cartography-index/phase-routing.contract.js",
  "src/phases/02-cartography-index/services/phase-route-runtime.reader.js",
  "src/phases/02-cartography-index/services/phase-routing-manifest.builder.js",
  "src/phases/02-cartography-index/validators/phase-routing-manifest.validator.js",
  "src/phases/02-cartography-index/orchestrators/phase-routing-manifest.orchestrator.js"
]);
const CUTOVER_RUNNERS = Object.freeze({
  M7_TARGET_PROFILE: "src/phases/03-target-profile-review/target-profile-review.runner.js",
  P3_DOMAIN_DERIVATION_LAYER: "src/phases/03-domain-derivation/domain-derivation.runner.js",
  M7_TARGET_PROFILE_FORENSICS: "src/phases/04-target-profile-forensics/target-profile-forensics.runner.js",
  M8_FEATURE_CANDIDATE_INVENTORY: "src/phases/05-activity-profile-review/activity-candidate-inventory.runner.js",
  M8_TARGET_FEATURE_PROFILE: "src/phases/05-activity-profile-review/activity-profile-review.runner.js",
  M8_TARGET_FEATURE_PROFILE_FORENSICS: "src/phases/06-activity-profile-forensics/activity-profile-forensics.runner.js",
  DATA_PROVENANCE_PROFILE_LAYER4: "src/phases/07-data-provenance-profile/data-provenance-profile.runner.js",
  DATA_PROVENANCE_PROFILE_FORENSICS: "src/phases/08-data-provenance-forensics/dap-forensics.runner.js",
  M11: "src/m11-orchestrator-m11v2.js",
  M12: "src/m12-phase2g.runner.js",
  NORMALIZED_COMPILER: "src/compiler-phase2g.runner.js"
});
const PROFILE_FORENSIC_INPUTS = Object.freeze([
  "target_profile_forensics",
  "target_feature_profile_forensics",
  "dap_forensics_profile",
  "exposure_registry_profile_forensics"
]);
const ROUTED_JOBS = Object.freeze(Object.keys(CUTOVER_RUNNERS));

assert.equal(P2G_PHASE_ROUTER_CONTRACT.designation, "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY");
assert.equal(P2G_PHASE_ROUTER_CONTRACT.doctrine.centralized_routing_authority, true);
assert.equal(P2G_PHASE_ROUTER_CONTRACT.doctrine.no_other_routing_authority_allowed_after_cutover, true);
assert.equal(P2G_PHASE_ROUTER_CONTRACT.doctrine.phase2f_forward_owner_exposure_profile, true);
assert.equal(P2G_PHASE_ROUTER_CONTRACT.doctrine.runtime_cutover_complete_through_compiler, true);

const legalRoute = P2G_ROUTE_BUCKETS.find((route) => route.route_id === PHASE_ROUTE_IDS.legalCartographySignals);
assert.ok(legalRoute, "2F legal route missing");
assert.equal(legalRoute.route_id, "ROUTE.PHASE9.EXPOSURE_PROFILE");
assert.equal(legalRoute.parent_phase, "EXPOSURE_PROFILE");
assert.deepEqual(legalRoute.parent_jobs, ["M11"]);
assert.deepEqual(legalRoute.downstream_jobs, ["M12", "NORMALIZED_COMPILER"]);
assert.equal(legalRoute.parent_jobs.includes("M9"), false, "2F must not route backward to M9");

assert.deepEqual(Object.keys(P2G_RUNTIME_ROUTE_BY_JOB), ROUTED_JOBS);
for (const [jobId, relativePath] of Object.entries(CUTOVER_RUNNERS)) {
  const source = read(relativePath);
  assert.ok(source.includes("readPhaseRouteRuntimePacket"), `${jobId} does not use the centralized 2G reader`);
  assert.equal(source.includes("readArtifacts({ reads: contract.reads"), false, `${jobId} still directly loads its contract read array`);
  assert.equal(source.includes("readArtifacts({reads:contract.reads"), false, `${jobId} still directly loads its contract read array`);
  assert.ok(P2G_RUNTIME_ROUTE_BY_JOB[jobId], `${jobId} has no 2G route mapping`);
  assert.deepEqual(PIPELINE_CONTRACTS[jobId].reads, ["phase_routing_manifest"], `${jobId} central contract retains a shadow read list`);
}

const activeSourceFiles = walk(path.join(ROOT, "src")).filter((file) => file.endsWith(".js"));
for (const absolutePath of activeSourceFiles) {
  const relativePath = slash(path.relative(ROOT, absolutePath));
  const source = fs.readFileSync(absolutePath, "utf8");
  if (!ROUTER_IMPLEMENTATION_FILES.has(relativePath)) {
    for (const marker of ["P2G_RUNTIME_ROUTE_BY_JOB", "phaseRouteIdForRuntimeJob", "buildPhaseRouteRuntimeReadPlan"]) {
      const definesMarker = new RegExp(`(?:export\\s+)?(?:const|let|var|function)\\s+${marker}\\b`).test(source);
      assert.equal(definesMarker, false, `${relativePath} defines competing routing authority ${marker}`);
    }
  }
  assert.equal(source.includes("direct_lossless_as_fallback_allowed: true"), false, `${relativePath} enables forbidden lossless fallback framing`);
}

for (const route of P2G_ROUTE_BUCKETS) {
  for (const artifact of route.allowed_preceding_derived_profiles || []) assert.equal(PROFILE_FORENSIC_INPUTS.includes(artifact), false, `${route.route_id} permits forensic profile input ${artifact}`);
  for (const artifacts of Object.values(route.job_scoped_derived_profiles || {})) for (const artifact of artifacts || []) assert.equal(PROFILE_FORENSIC_INPUTS.includes(artifact), false, `${route.route_id} job scope permits forensic profile input ${artifact}`);
}

for (const agentId of [AGENT_IDS.targetActivity, AGENT_IDS.dataProvenance, AGENT_IDS.operatorChallenge, AGENT_IDS.compiler, AGENT_IDS.qualifiedReview]) {
  const reads = READ_PERMISSIONS[agentId] || [];
  for (const forensic of PROFILE_FORENSIC_INPUTS) assert.equal(reads.includes(forensic), false, `${agentId} retains forensic read permission ${forensic}`);
}
for (const forensic of ["target_profile_forensics", "target_feature_profile_forensics", "dap_forensics_profile"]) assert.equal((READ_PERMISSIONS[AGENT_IDS.exposureRegistry] || []).includes(forensic), false, `M11 retains preceding forensic read permission ${forensic}`);

const runtimeArtifactsService = read("src/runtime/services/artifacts.service.js");
const legacyArtifactsService = read("src/artifact-service.js");
for (const forbiddenRequirement of [
  "target_feature_profile_requires_target_profile_forensics",
  "data_provenance_requires_target_feature_profile_forensics",
  "m11_route_plan_requires_data_provenance_profile_forensics",
  "challenge_gate_requires_m11_forensics",
  "M11_requires_locked_forensics",
  "M12_requires_locked_m11_forensics"
]) {
  assert.equal(runtimeArtifactsService.includes(forbiddenRequirement), false, `runtime artifact service retains ${forbiddenRequirement}`);
  assert.equal(legacyArtifactsService.includes(forbiddenRequirement), false, `legacy artifact service retains ${forbiddenRequirement}`);
}

console.log(JSON.stringify({
  check: "Phase 2G no competing routing authority",
  status: "PASS",
  routing_authority: P2G_PHASE_ROUTER_CONTRACT.designation,
  phase2f_owner: legalRoute.parent_phase,
  cutover_jobs: ROUTED_JOBS,
  enforced_gates: [
    "ONE_ROUTE_MAP_ONLY",
    "ONE_RUNTIME_ROUTE_RESOLVER_ONLY",
    "NO_DOWNSTREAM_SHADOW_READ_ARRAYS",
    "NO_DIRECT_CONTRACT_READ_LOADING",
    "NO_BACKWARD_2F_ROUTE_TO_M9",
    "NO_PROFILE_FORENSIC_INPUTS",
    "NO_FORENSIC_PERMISSION_PROPAGATION",
    "NO_FORENSIC_SAVE_ORDER_PROPAGATION",
    "NO_LOSSLESS_FALLBACK_FRAMING"
  ]
}, null, 2));

function read(relativePath) { return fs.readFileSync(path.join(ROOT, relativePath), "utf8"); }
function walk(root) { const output = []; for (const entry of fs.readdirSync(root, { withFileTypes: true })) { const absolute = path.join(root, entry.name); if (entry.isDirectory()) output.push(...walk(absolute)); else output.push(absolute); } return output; }
function slash(value) { return value.split(path.sep).join("/"); }
