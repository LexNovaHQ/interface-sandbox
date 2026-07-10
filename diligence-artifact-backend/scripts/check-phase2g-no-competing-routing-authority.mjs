import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { P2G_PHASE_ROUTER_CONTRACT, P2G_ROUTE_BUCKETS, PHASE_ROUTE_IDS } from "../src/phases/02-cartography-index/phase-routing.contract.js";
import { P2G_RUNTIME_ROUTE_BY_JOB } from "../src/phases/02-cartography-index/services/phase-route-runtime.reader.js";

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
  M8_FEATURE_CANDIDATE_INVENTORY: "src/phases/05-activity-profile-review/activity-candidate-inventory.runner.js",
  M8_TARGET_FEATURE_PROFILE: "src/phases/05-activity-profile-review/activity-profile-review.runner.js",
  DATA_PROVENANCE_PROFILE_LAYER4: "src/phases/07-data-provenance-profile/data-provenance-profile.runner.js"
});
const PROFILE_FORENSIC_INPUTS = Object.freeze([
  "target_profile_forensics",
  "target_feature_profile_forensics",
  "dap_forensics_profile",
  "exposure_registry_profile_forensics"
]);

assert.equal(P2G_PHASE_ROUTER_CONTRACT.designation, "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY");
assert.equal(P2G_PHASE_ROUTER_CONTRACT.doctrine.centralized_routing_authority, true);
assert.equal(P2G_PHASE_ROUTER_CONTRACT.doctrine.no_other_routing_authority_allowed_after_cutover, true);
assert.equal(P2G_PHASE_ROUTER_CONTRACT.doctrine.phase2f_forward_owner_exposure_profile, true);

const legalRoute = P2G_ROUTE_BUCKETS.find((route) => route.route_id === PHASE_ROUTE_IDS.legalCartographySignals);
assert.ok(legalRoute, "2F legal route missing");
assert.equal(legalRoute.route_id, "ROUTE.PHASE9.EXPOSURE_PROFILE");
assert.equal(legalRoute.parent_phase, "EXPOSURE_PROFILE");
assert.deepEqual(legalRoute.parent_jobs, ["M11"]);
assert.equal(legalRoute.parent_jobs.includes("M9"), false, "2F must not route backward to M9");
for (const forbidden of PROFILE_FORENSIC_INPUTS) assert.equal(legalRoute.allowed_preceding_derived_profiles.includes(forbidden), false, `2F allows forensic input ${forbidden}`);

assert.deepEqual(Object.keys(P2G_RUNTIME_ROUTE_BY_JOB), Object.keys(CUTOVER_RUNNERS));
for (const [jobId, relativePath] of Object.entries(CUTOVER_RUNNERS)) {
  const source = read(relativePath);
  assert.ok(source.includes("readPhaseRouteRuntimePacket"), `${jobId} does not use the centralized 2G reader`);
  assert.equal(source.includes("readArtifacts({ reads: contract.reads"), false, `${jobId} still directly loads its contract read array`);
  assert.equal(source.includes("readArtifacts({reads:contract.reads"), false, `${jobId} still directly loads its contract read array`);
  assert.ok(P2G_RUNTIME_ROUTE_BY_JOB[jobId], `${jobId} has no 2G route mapping`);
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
  for (const artifact of route.allowed_preceding_derived_profiles || []) {
    assert.equal(PROFILE_FORENSIC_INPUTS.includes(artifact), false, `${route.route_id} permits forensic profile input ${artifact}`);
  }
  for (const artifacts of Object.values(route.job_scoped_derived_profiles || {})) {
    for (const artifact of artifacts || []) assert.equal(PROFILE_FORENSIC_INPUTS.includes(artifact), false, `${route.route_id} job scope permits forensic profile input ${artifact}`);
  }
}

console.log(JSON.stringify({
  check: "Phase 2G no competing routing authority",
  status: "PASS",
  routing_authority: P2G_PHASE_ROUTER_CONTRACT.designation,
  phase2f_owner: legalRoute.parent_phase,
  cutover_jobs: Object.keys(CUTOVER_RUNNERS),
  enforced_gates: [
    "ONE_ROUTE_MAP_ONLY",
    "ONE_RUNTIME_ROUTE_RESOLVER_ONLY",
    "NO_DIRECT_PROFILE_CONTRACT_READ_LOADING",
    "NO_BACKWARD_2F_ROUTE_TO_M9",
    "NO_PROFILE_FORENSIC_INPUTS",
    "NO_LOSSLESS_FALLBACK_FRAMING"
  ]
}, null, 2));

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function walk(root) {
  const output = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) output.push(...walk(absolute));
    else output.push(absolute);
  }
  return output;
}

function slash(value) {
  return value.split(path.sep).join("/");
}
