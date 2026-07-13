import assert from "node:assert/strict";
import { PIPELINE_CONTRACTS } from "../src/runtime/contracts/pipeline.contract.js";
import {
  COMPILER_ARTIFACT_NAMES,
  PHASE12_DIRECT_PROFILE_READ_ARTIFACT_NAMES,
  PHASE12_RENDERER_READ_ARTIFACT_NAMES,
  REPORT_FACING_ARTIFACT_NAMES
} from "../src/runtime/contracts/artifact-permissions.contract.js";

assert.equal(PIPELINE_CONTRACTS.M12.next, "NORMALIZED_COMPILER");
assert.equal(PIPELINE_CONTRACTS.NORMALIZED_COMPILER.next, "NORMALIZED_REPORT_RENDERER");
assert.equal(PIPELINE_CONTRACTS.NORMALIZED_REPORT_RENDERER.next, "QUALIFIED_REVIEW");
assert.deepEqual(PIPELINE_CONTRACTS.NORMALIZED_COMPILER.reads, PHASE12_DIRECT_PROFILE_READ_ARTIFACT_NAMES);
assert.equal(PIPELINE_CONTRACTS.NORMALIZED_COMPILER.reads.includes("phase_routing_manifest"), false);
assert.equal(PIPELINE_CONTRACTS.NORMALIZED_COMPILER.route_delivery_mode, "DIRECT_MATERIAL_PROFILES");
assert.equal(PIPELINE_CONTRACTS.NORMALIZED_COMPILER.phase2g_dependency_forbidden, true);
assert.deepEqual(PIPELINE_CONTRACTS.NORMALIZED_COMPILER.writes, COMPILER_ARTIFACT_NAMES);
assert.deepEqual(PIPELINE_CONTRACTS.NORMALIZED_REPORT_RENDERER.reads, PHASE12_RENDERER_READ_ARTIFACT_NAMES);
assert.deepEqual(PIPELINE_CONTRACTS.NORMALIZED_REPORT_RENDERER.writes, ["renderer_payload"]);
for (const artifactName of REPORT_FACING_ARTIFACT_NAMES) {
  assert.ok(PIPELINE_CONTRACTS.NORMALIZED_COMPILER.writes.includes(artifactName));
  assert.ok(PIPELINE_CONTRACTS.NORMALIZED_REPORT_RENDERER.reads.includes(artifactName));
}
for (const retired of ["normalized_report_manifest", "review_ready_section_handoff"]) {
  assert.equal(PIPELINE_CONTRACTS.NORMALIZED_COMPILER.writes.includes(retired), false);
  assert.equal(PIPELINE_CONTRACTS.NORMALIZED_REPORT_RENDERER.reads.includes(retired), false);
}
console.log("Phase 12 production pipeline contract: PASS");
