import assert from "node:assert/strict";
import {
  AGENTS,
  PHASES,
  NORMALIZED_SECTION_ARTIFACT_NAMES,
  COMPILER_ARTIFACT_NAMES,
  QUALIFIED_REVIEW_ARTIFACT_NAMES,
  QUALIFIED_REVIEW_READ_ARTIFACT_NAMES,
  QUALIFIED_REVIEW_SYSTEM_AGENT,
  READ_PERMISSIONS,
  WRITE_PERMISSIONS,
  PHASE_WRITE_PERMISSIONS
} from "../src/constants.js";
import { PHASE_CONTRACTS } from "../src/phase-contracts.js";

assert.ok(PHASES.includes("NORMALIZED_COMPILER"));
assert.ok(!PHASES.includes("COMPILER"));
assert.ok(PHASES.includes("QUALIFIED_REVIEW_HANDOFF"));
assert.ok(PHASES.includes("QUALIFIED_REVIEW_RENDERER"));
assert.ok(PHASES.includes("AGENT_4B_EXTENDED_DAP_INDIA_READINESS"));
assert.ok(PHASES.includes("AGENT_4C_INTEGRATED_DAP_REPORT"));

assert.equal(PHASE_CONTRACTS.M10_FORENSICS.next, "AGENT_4B_EXTENDED_DAP_INDIA_READINESS");
assert.equal(PHASE_CONTRACTS.AGENT_4B_EXTENDED_DAP_INDIA_READINESS.next, "AGENT_4C_INTEGRATED_DAP_REPORT");
assert.equal(PHASE_CONTRACTS.AGENT_4C_INTEGRATED_DAP_REPORT.next, "M11");
assert.deepEqual(PHASE_WRITE_PERMISSIONS.AGENT_4B_EXTENDED_DAP_INDIA_READINESS, ["extended_dap_india_readiness_profile"]);
assert.deepEqual(PHASE_WRITE_PERMISSIONS.AGENT_4C_INTEGRATED_DAP_REPORT, ["integrated_dap_report"]);

assert.equal(PHASE_CONTRACTS.M12.next, "NORMALIZED_COMPILER");
assert.equal(PHASE_CONTRACTS.NORMALIZED_COMPILER.next, "RENDERER");
assert.equal(PHASE_CONTRACTS.RENDERER.next, "COMPLETE");
assert.ok(PHASE_CONTRACTS.NORMALIZED_COMPILER.reads.includes("extended_dap_india_readiness_profile"));
assert.ok(PHASE_CONTRACTS.NORMALIZED_COMPILER.reads.includes("integrated_dap_report"));
assert.deepEqual(PHASE_CONTRACTS.NORMALIZED_COMPILER.writes, COMPILER_ARTIFACT_NAMES);
assert.deepEqual(PHASE_WRITE_PERMISSIONS.NORMALIZED_COMPILER, COMPILER_ARTIFACT_NAMES);

for (const artifactName of NORMALIZED_SECTION_ARTIFACT_NAMES) {
  assert.ok(PHASE_CONTRACTS.NORMALIZED_COMPILER.writes.includes(artifactName));
  assert.ok(PHASE_CONTRACTS.RENDERER.reads.includes(artifactName));
}

assert.ok(PHASE_CONTRACTS.RENDERER.reads.includes("normalized_report_manifest"));
assert.ok(PHASE_CONTRACTS.RENDERER.reads.includes("final_output_handoff"));
assert.equal(PHASE_CONTRACTS.RENDERER.reads.includes("qualified_review_handoff"), false);
assert.equal(PHASE_CONTRACTS.RENDERER.reads.includes("qualified_review_renderer_payload"), false);

assert.deepEqual(QUALIFIED_REVIEW_ARTIFACT_NAMES, ["qualified_review_handoff", "qualified_review_renderer_payload"]);
assert.deepEqual(PHASE_WRITE_PERMISSIONS.QUALIFIED_REVIEW_HANDOFF, ["qualified_review_handoff"]);
assert.deepEqual(PHASE_WRITE_PERMISSIONS.QUALIFIED_REVIEW_RENDERER, ["qualified_review_renderer_payload"]);
assert.equal(PHASE_CONTRACTS.QUALIFIED_REVIEW_HANDOFF, undefined);
assert.equal(PHASE_CONTRACTS.QUALIFIED_REVIEW_RENDERER, undefined);
assert.ok(AGENTS.includes(QUALIFIED_REVIEW_SYSTEM_AGENT));
assert.deepEqual(WRITE_PERMISSIONS[QUALIFIED_REVIEW_SYSTEM_AGENT], QUALIFIED_REVIEW_ARTIFACT_NAMES);
assert.deepEqual(READ_PERMISSIONS[QUALIFIED_REVIEW_SYSTEM_AGENT], QUALIFIED_REVIEW_READ_ARTIFACT_NAMES);
assert.ok(READ_PERMISSIONS[QUALIFIED_REVIEW_SYSTEM_AGENT].includes("final_output_handoff"));
assert.ok(READ_PERMISSIONS[QUALIFIED_REVIEW_SYSTEM_AGENT].includes("normalized_report_manifest"));
assert.ok(READ_PERMISSIONS[QUALIFIED_REVIEW_SYSTEM_AGENT].includes("target_profile"));
assert.ok(READ_PERMISSIONS[QUALIFIED_REVIEW_SYSTEM_AGENT].includes("target_feature_profile"));
assert.ok(READ_PERMISSIONS[QUALIFIED_REVIEW_SYSTEM_AGENT].includes("data_provenance_profile"));
assert.ok(READ_PERMISSIONS[QUALIFIED_REVIEW_SYSTEM_AGENT].includes("exposure_registry_triggered_profile"));
assert.ok(READ_PERMISSIONS[QUALIFIED_REVIEW_SYSTEM_AGENT].includes("challenge_gate"));

console.log("normalized pipeline contract: PASS");
