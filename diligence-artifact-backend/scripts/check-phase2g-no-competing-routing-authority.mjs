import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { P2G_PHASE_ROUTER_CONTRACT, P2G_ROUTE_BUCKETS, PHASE_ROUTE_IDS } from "../src/phases/02-cartography-index/phase-routing.contract.js";
import { P2G_RUNTIME_ROUTE_BY_JOB } from "../src/phases/02-cartography-index/services/phase-route-runtime.reader.js";
import { PIPELINE_CONTRACTS } from "../src/runtime/contracts/pipeline.contract.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
assert.equal(P2G_PHASE_ROUTER_CONTRACT.designation, "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY");
assert.equal(P2G_PHASE_ROUTER_CONTRACT.doctrine.centralized_routing_authority, true);
assert.equal(P2G_PHASE_ROUTER_CONTRACT.doctrine.runtime_boundary_ends_at_operator_challenge, true);
assert.equal(P2G_PHASE_ROUTER_CONTRACT.doctrine.phase12_compiler_excluded, true);

const legalRoute = P2G_ROUTE_BUCKETS.find((route) => route.route_id === PHASE_ROUTE_IDS.legalCartographySignals);
assert.deepEqual(legalRoute.parent_jobs, ["M11"]);
assert.deepEqual(legalRoute.downstream_jobs, ["M12"]);
assert.equal(Object.prototype.hasOwnProperty.call(legalRoute.job_scoped_derived_profiles, "NORMALIZED_COMPILER"), false);
assert.equal(Object.prototype.hasOwnProperty.call(P2G_RUNTIME_ROUTE_BY_JOB, "NORMALIZED_COMPILER"), false);
assert.equal(PIPELINE_CONTRACTS.NORMALIZED_COMPILER.reads.includes("phase_routing_manifest"), false);

const source = fs.readFileSync(path.join(ROOT, "src/runtime/services/pipeline.service.js"), "utf8");
assert.equal(source.includes("runCompilerPhase2G"), false);
assert.ok(source.includes("runPhase12Compiler"));

for (const route of P2G_ROUTE_BUCKETS) {
  for (const artifacts of Object.values(route.job_scoped_derived_profiles || {})) {
    for (const artifact of artifacts || []) assert.equal(String(artifact).includes("forensics"), false, `${route.route_id} permits forensic input ${artifact}`);
  }
}
console.log("Phase 2G remains the sole router through Phase 11 and is excluded from Phase 12: PASS");
