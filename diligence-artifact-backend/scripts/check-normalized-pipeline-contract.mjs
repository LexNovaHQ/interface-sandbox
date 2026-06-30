import assert from "node:assert/strict";
import { PHASES, NORMALIZED_SECTION_ARTIFACT_NAMES, COMPILER_ARTIFACT_NAMES, PHASE_WRITE_PERMISSIONS } from "../src/constants.js";
import { PHASE_CONTRACTS } from "../src/phase-contracts.js";

assert.ok(PHASES.includes("NORMALIZED_COMPILER"), "NORMALIZED_COMPILER phase missing");
assert.ok(!PHASES.includes("COMPILER"), "COMPILER must not remain an active pipeline phase");
assert.equal(PHASE_CONTRACTS.M12.next, "NORMALIZED_COMPILER", "M12 must route to NORMALIZED_COMPILER");
assert.ok(PHASE_CONTRACTS.NORMALIZED_COMPILER, "NORMALIZED_COMPILER contract missing");
assert.equal(PHASE_CONTRACTS.NORMALIZED_COMPILER.next, "RENDERER", "NORMALIZED_COMPILER must route to RENDERER");
assert.deepEqual(PHASE_CONTRACTS.NORMALIZED_COMPILER.writes, COMPILER_ARTIFACT_NAMES, "NORMALIZED_COMPILER writes must match normalized compiler artifact set");
assert.deepEqual(PHASE_WRITE_PERMISSIONS.NORMALIZED_COMPILER, COMPILER_ARTIFACT_NAMES, "NORMALIZED_COMPILER phase write permissions must match writes");
for (const artifactName of NORMALIZED_SECTION_ARTIFACT_NAMES) {
  assert.ok(PHASE_CONTRACTS.NORMALIZED_COMPILER.writes.includes(artifactName), `${artifactName} missing from NORMALIZED_COMPILER writes`);
  assert.ok(PHASE_CONTRACTS.RENDERER.reads.includes(artifactName), `${artifactName} missing from RENDERER reads`);
}
assert.ok(PHASE_CONTRACTS.RENDERER.reads.includes("normalized_report_manifest"), "renderer must read normalized_report_manifest");
assert.ok(PHASE_CONTRACTS.RENDERER.reads.includes("qualified_review_handoff"), "renderer must read qualified_review_handoff");
assert.ok(PHASE_CONTRACTS.RENDERER.reads.includes("final_output_handoff"), "renderer must retain thin final handoff read");
console.log("normalized pipeline contract: PASS");
