import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
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
  PHASE_WRITE_PERMISSIONS,
  LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES,
  TARGET_PROFILE_FAMILY_ARTIFACT_NAMES,
  artifactMatchesPermission
} from "../src/constants.js";
import { PHASE_CONTRACTS } from "../src/phase-contracts.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const M7_LEGAL_SIGNAL_OVERLAY = "m7_deterministic_legal_signal_overlay";

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

assert.deepEqual(PHASE_CONTRACTS.M7_TARGET_PROFILE.reads, ["source_discovery_handoff", M7_LEGAL_SIGNAL_OVERLAY, ...TARGET_PROFILE_FAMILY_ARTIFACT_NAMES]);
assert.deepEqual(PHASE_CONTRACTS.M7_TARGET_PROFILE_FORENSICS.reads, ["source_discovery_handoff", M7_LEGAL_SIGNAL_OVERLAY, "target_profile", ...TARGET_PROFILE_FAMILY_ARTIFACT_NAMES]);
assert.equal(PHASE_CONTRACTS.M7_TARGET_PROFILE.reads.includes("legal_cartography_index"), false);
assert.equal(PHASE_CONTRACTS.M7_TARGET_PROFILE_FORENSICS.reads.includes("legal_cartography_index"), false);
assert.equal(PHASE_CONTRACTS.M7_TARGET_PROFILE.reads.some((name) => LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES.includes(name)), false);
assert.equal(PHASE_CONTRACTS.M7_TARGET_PROFILE_FORENSICS.reads.some((name) => LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES.includes(name)), false);
assert.equal(READ_PERMISSIONS.agent_3_target_feature.includes("legal_cartography_index"), false);
assert.equal(READ_PERMISSIONS.agent_3_target_feature.some((name) => LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES.includes(name)), false);
assert.ok(READ_PERMISSIONS.agent_3_target_feature.includes(M7_LEGAL_SIGNAL_OVERLAY));

const m7Prompt = fs.readFileSync(path.join(repoRoot, "agent-packages/agent_3_target_feature/02_M7_TARGET_PROFILE_BACKEND_CURRENT.md"), "utf8");
assert.ok(m7Prompt.includes("M7 must not use any artifact whose name starts with `lossless_family__L`"));
assert.ok(m7Prompt.includes("legal_cartography_index` is not an active M7 model input"));
assert.equal(m7Prompt.includes("legal_governance_profile_urls.families` | legal-family route universe"), false);
assert.equal(m7Prompt.includes("only for the legal-family exception"), false);

for (const [phase, contract] of Object.entries(PHASE_CONTRACTS)) {
  const actor = contract.agent_id || contract.actor_id;
  const allowed = READ_PERMISSIONS[actor] || [];
  for (const artifactName of contract.reads || []) {
    assert.ok(allowed.some((permission) => artifactMatchesPermission(artifactName, permission)), `PHASE_READ_PERMISSION_DRIFT:${phase}:${actor}:${artifactName}`);
  }
}

assert.deepEqual(QUALIFIED_REVIEW_ARTIFACT_NAMES, [
  "qualified_review_handoff",
  "qualified_review_renderer_payload",
  "qualified_review_submission"
]);
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
