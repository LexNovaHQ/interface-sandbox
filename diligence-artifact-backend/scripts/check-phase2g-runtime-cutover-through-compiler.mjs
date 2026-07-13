import assert from "node:assert/strict";
import { PIPELINE_CONTRACTS, PIPELINE_CONTRACT_STATUS } from "../src/runtime/contracts/pipeline.contract.js";
import { PHASE12_DIRECT_PROFILE_READ_ARTIFACT_NAMES } from "../src/runtime/contracts/artifact-permissions.contract.js";
import {
  P2G_RUNTIME_ROUTE_BY_JOB,
  P2G_PHASE_ROUTE_RUNTIME_READER_STATUS
} from "../src/phases/02-cartography-index/services/phase-route-runtime.reader.js";
import { P2G_ROUTE_BUCKETS } from "../src/phases/02-cartography-index/phase-routing.contract.js";

assert.equal(P2G_ROUTE_BUCKETS.length, 6);
assert.equal(Object.prototype.hasOwnProperty.call(P2G_RUNTIME_ROUTE_BY_JOB, "NORMALIZED_COMPILER"), false);
assert.equal(P2G_PHASE_ROUTE_RUNTIME_READER_STATUS.cutover_jobs.includes("NORMALIZED_COMPILER"), false);
assert.equal(P2G_PHASE_ROUTE_RUNTIME_READER_STATUS.phase12_compiler_excluded, true);
assert.equal(PIPELINE_CONTRACT_STATUS.phase2g_runtime_boundary_ends_before_compiler, true);
assert.equal(PIPELINE_CONTRACT_STATUS.phase12_direct_profile_runtime_wired, true);
assert.deepEqual(PIPELINE_CONTRACTS.NORMALIZED_COMPILER.reads, PHASE12_DIRECT_PROFILE_READ_ARTIFACT_NAMES);
assert.equal(PIPELINE_CONTRACTS.NORMALIZED_COMPILER.reads.includes("phase_routing_manifest"), false);
assert.equal(PIPELINE_CONTRACTS.M12.reads.includes("phase_routing_manifest"), true);
for (const forbidden of ["exposure_registry_route_plan", "exposure_registry_workpad_98", "exposure_registry_profile_forensics"]) {
  assert.equal(PHASE12_DIRECT_PROFILE_READ_ARTIFACT_NAMES.includes(forbidden), false);
}
console.log("Phase 2G runtime boundary ends at Phase 11; Phase 12 direct-profile cutover: PASS");
