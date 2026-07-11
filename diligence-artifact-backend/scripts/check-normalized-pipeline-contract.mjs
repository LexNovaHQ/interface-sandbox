import assert from "node:assert/strict";
import { PIPELINE_CONTRACTS } from "../src/runtime/contracts/pipeline.contract.js";
import {
  COMPILER_ARTIFACT_NAMES,
  NORMALIZED_SECTION_ARTIFACT_NAMES,
  READ_PERMISSIONS,
  WRITE_PERMISSIONS,
  INTERNAL_JOB_WRITE_PERMISSIONS
} from "../src/runtime/contracts/artifact-permissions.contract.js";

assert.equal(PIPELINE_CONTRACTS.M12.next, "NORMALIZED_COMPILER");
assert.equal(PIPELINE_CONTRACTS.NORMALIZED_COMPILER.next, "NORMALIZED_REPORT_RENDERER");
assert.equal(PIPELINE_CONTRACTS.NORMALIZED_REPORT_RENDERER.next, "QUALIFIED_REVIEW");
assert.deepEqual(PIPELINE_CONTRACTS.NORMALIZED_COMPILER.reads, ["phase_routing_manifest"]);
assert.equal(PIPELINE_CONTRACTS.NORMALIZED_COMPILER.route_delivery_mode, "DERIVED_ONLY");
assert.deepEqual(PIPELINE_CONTRACTS.NORMALIZED_COMPILER.writes, COMPILER_ARTIFACT_NAMES);
assert.deepEqual(INTERNAL_JOB_WRITE_PERMISSIONS.NORMALIZED_COMPILER, COMPILER_ARTIFACT_NAMES);

for (const artifactName of NORMALIZED_SECTION_ARTIFACT_NAMES) {
  assert.ok(PIPELINE_CONTRACTS.NORMALIZED_COMPILER.writes.includes(artifactName));
  assert.ok(PIPELINE_CONTRACTS.NORMALIZED_REPORT_RENDERER.reads.includes(artifactName));
}
assert.ok(PIPELINE_CONTRACTS.NORMALIZED_REPORT_RENDERER.reads.includes("normalized_report_manifest"));
assert.ok(PIPELINE_CONTRACTS.NORMALIZED_REPORT_RENDERER.reads.includes("final_output_handoff"));
assert.deepEqual(PIPELINE_CONTRACTS.NORMALIZED_REPORT_RENDERER.writes, ["renderer_payload"]);
assert.equal(PIPELINE_CONTRACTS.NORMALIZED_REPORT_RENDERER.reads.includes("qualified_review_handoff"), false);
assert.equal(PIPELINE_CONTRACTS.NORMALIZED_REPORT_RENDERER.reads.includes("qualified_review_renderer_payload"), false);

assert.deepEqual(PIPELINE_CONTRACTS.M7_TARGET_PROFILE.reads, ["phase_routing_manifest"]);
assert.deepEqual(PIPELINE_CONTRACTS.M7_TARGET_PROFILE_FORENSICS.reads, ["phase_routing_manifest"]);
assert.deepEqual(PIPELINE_CONTRACTS.M7_TARGET_PROFILE.references, ["M7_TARGET_PROFILE_DERIVATION_AUTHORITY.yaml", "FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml"]);
assert.equal(READ_PERMISSIONS.agent_3_target_feature.includes("legal_cartography_index"), false);
assert.equal(READ_PERMISSIONS.agent_3_target_feature.some((name) => name.startsWith("lossless_family__")), false);
assert.ok(READ_PERMISSIONS.agent_3_target_feature.includes("legal_signal_derivation_profile"));
assert.equal(READ_PERMISSIONS.agent_4_data_privacy.includes("data_provenance_profile"), false);
assert.equal(WRITE_PERMISSIONS.agent_4_data_privacy.includes("data_provenance_profile"), false);

console.log("normalized pipeline contract: PASS");
