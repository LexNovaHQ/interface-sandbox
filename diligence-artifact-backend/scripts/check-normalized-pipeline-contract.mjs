import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AGENTS, PHASES, NORMALIZED_SECTION_ARTIFACT_NAMES, COMPILER_ARTIFACT_NAMES, QUALIFIED_REVIEW_ARTIFACT_NAMES, QUALIFIED_REVIEW_READ_ARTIFACT_NAMES, QUALIFIED_REVIEW_SYSTEM_AGENT, READ_PERMISSIONS, WRITE_PERMISSIONS, PHASE_WRITE_PERMISSIONS, LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES, TARGET_PROFILE_FAMILY_ARTIFACT_NAMES, PHASE7_DAP_BATCH_ARTIFACT_NAMES, PHASE7_DAP_LAYER5_ARTIFACT_NAMES, artifactMatchesPermission } from "../src/constants.js";
import { PHASE_CONTRACTS } from "../src/phase-contracts.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const LEGAL_SIGNAL_PROFILE = "legal_signal_derivation_profile";
const OLD_M7_OVERLAY = "m7_deterministic_legal_signal_overlay";
const OLD_M10_SUPPORT = "m10_selected_legal_support_packet";
const OLD_DATA_PROFILE = "data_provenance_profile";
const OLD_DATA_FORENSICS = "data_provenance_profile_forensics";
const OLD_4B = "extended_dap_india_readiness_profile";
const OLD_4C = "integrated_dap_report";

assert.ok(PHASES.includes("NORMALIZED_COMPILER"));
assert.ok(!PHASES.includes("COMPILER"));
assert.ok(!PHASES.includes("M10"));
assert.ok(!PHASES.includes("M10_FORENSICS"));
assert.ok(!PHASES.includes("AGENT_4B_EXTENDED_DAP_INDIA_READINESS"));
assert.ok(!PHASES.includes("AGENT_4C_INTEGRATED_DAP_REPORT"));
assert.equal(PHASE_CONTRACTS.M10, undefined);
assert.equal(PHASE_CONTRACTS.M10_FORENSICS, undefined);
assert.equal(PHASE_CONTRACTS.AGENT_4B_EXTENDED_DAP_INDIA_READINESS, undefined);
assert.equal(PHASE_CONTRACTS.AGENT_4C_INTEGRATED_DAP_REPORT, undefined);
assert.equal(PHASE_CONTRACTS.M8_TARGET_FEATURE_PROFILE_FORENSICS.next, "DATA_PROVENANCE_PROFILE_LAYER4");
assert.equal(PHASE_CONTRACTS.DATA_PROVENANCE_PROFILE_LAYER5.next, "M11");
assert.equal(PHASE_WRITE_PERMISSIONS.M10, undefined);
assert.equal(PHASE_WRITE_PERMISSIONS.M10_FORENSICS, undefined);
assert.equal(PHASE_WRITE_PERMISSIONS.AGENT_4B_EXTENDED_DAP_INDIA_READINESS, undefined);
assert.equal(PHASE_WRITE_PERMISSIONS.AGENT_4C_INTEGRATED_DAP_REPORT, undefined);
assert.equal(AGENTS.includes("agent_4b_extended_dap"), false);
assert.equal(AGENTS.includes("agent_4c_integrated_dap_compiler"), false);

assert.equal(PHASE_CONTRACTS.M12.next, "NORMALIZED_COMPILER");
assert.equal(PHASE_CONTRACTS.NORMALIZED_COMPILER.next, "RENDERER");
assert.equal(PHASE_CONTRACTS.RENDERER.next, "COMPLETE");
for (const oldArtifact of [OLD_DATA_PROFILE, OLD_DATA_FORENSICS, OLD_4B, OLD_4C]) assert.equal(PHASE_CONTRACTS.NORMALIZED_COMPILER.reads.includes(oldArtifact), false, `compiler still reads ${oldArtifact}`);
for (const artifactName of [...PHASE7_DAP_BATCH_ARTIFACT_NAMES, ...PHASE7_DAP_LAYER5_ARTIFACT_NAMES]) assert.ok(PHASE_CONTRACTS.NORMALIZED_COMPILER.reads.includes(artifactName), `NORMALIZED_COMPILER_MISSING_PHASE7_DAP_READ:${artifactName}`);
assert.ok(PHASE_CONTRACTS.NORMALIZED_COMPILER.reads.includes(LEGAL_SIGNAL_PROFILE));
assert.deepEqual(PHASE_CONTRACTS.NORMALIZED_COMPILER.writes, COMPILER_ARTIFACT_NAMES);
assert.deepEqual(PHASE_WRITE_PERMISSIONS.NORMALIZED_COMPILER, COMPILER_ARTIFACT_NAMES);

for (const artifactName of NORMALIZED_SECTION_ARTIFACT_NAMES) {
  assert.ok(PHASE_CONTRACTS.NORMALIZED_COMPILER.writes.includes(artifactName));
  assert.ok(PHASE_CONTRACTS.RENDERER.reads.includes(artifactName));
}

assert.ok(PHASE_CONTRACTS.RENDERER.reads.includes("normalized_report_manifest"));
assert.ok(PHASE_CONTRACTS.RENDERER.reads.includes("final_output_handoff"));
assert.deepEqual(PHASE_CONTRACTS.RENDERER.writes, ["renderer_payload"]);
assert.deepEqual(PHASE_WRITE_PERMISSIONS.RENDERER, ["renderer_payload"]);
assert.equal(PHASE_CONTRACTS.RENDERER.reads.includes("qualified_review_handoff"), false);
assert.equal(PHASE_CONTRACTS.RENDERER.reads.includes("qualified_review_renderer_payload"), false);

assert.deepEqual(PHASE_CONTRACTS.M7_TARGET_PROFILE.reads, ["source_discovery_handoff", LEGAL_SIGNAL_PROFILE, ...TARGET_PROFILE_FAMILY_ARTIFACT_NAMES]);
assert.deepEqual(PHASE_CONTRACTS.M7_TARGET_PROFILE_FORENSICS.reads, ["source_discovery_handoff", LEGAL_SIGNAL_PROFILE, "target_profile", ...TARGET_PROFILE_FAMILY_ARTIFACT_NAMES]);
assert.equal(PHASE_CONTRACTS.M7_TARGET_PROFILE.reads.includes("legal_cartography_index"), false);
assert.equal(PHASE_CONTRACTS.M7_TARGET_PROFILE_FORENSICS.reads.includes("legal_cartography_index"), false);
assert.equal(PHASE_CONTRACTS.M7_TARGET_PROFILE.reads.includes(OLD_M7_OVERLAY), false);
assert.equal(PHASE_CONTRACTS.M7_TARGET_PROFILE_FORENSICS.reads.includes(OLD_M7_OVERLAY), false);
assert.equal(PHASE_CONTRACTS.M7_TARGET_PROFILE.reads.some((name) => LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES.includes(name)), false);
assert.equal(PHASE_CONTRACTS.M7_TARGET_PROFILE_FORENSICS.reads.some((name) => LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES.includes(name)), false);
assert.deepEqual(PHASE_CONTRACTS.M7_TARGET_PROFILE.references, ["M7_TARGET_PROFILE_DERIVATION_AUTHORITY.yaml", "FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml"]);
assert.equal(PHASE_CONTRACTS.M7_TARGET_PROFILE.references.includes("FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml"), false);
assert.equal(READ_PERMISSIONS.agent_3_target_feature.includes("legal_cartography_index"), false);
assert.equal(READ_PERMISSIONS.agent_3_target_feature.some((name) => LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES.includes(name)), false);
assert.ok(READ_PERMISSIONS.agent_3_target_feature.includes(LEGAL_SIGNAL_PROFILE));
assert.equal(READ_PERMISSIONS.agent_3_target_feature.includes(OLD_M7_OVERLAY), false);

assert.ok(READ_PERMISSIONS.agent_4_data_privacy.includes(LEGAL_SIGNAL_PROFILE));
assert.equal(READ_PERMISSIONS.agent_4_data_privacy.includes(OLD_M10_SUPPORT), false);
assert.equal(READ_PERMISSIONS.agent_4_data_privacy.includes(OLD_DATA_PROFILE), false);
assert.equal(READ_PERMISSIONS.agent_4_data_privacy.includes(OLD_DATA_FORENSICS), false);
assert.equal(WRITE_PERMISSIONS.agent_4_data_privacy.includes(OLD_DATA_PROFILE), false);
assert.equal(WRITE_PERMISSIONS.agent_4_data_privacy.includes(OLD_DATA_FORENSICS), false);

const m7Prompt = fs.readFileSync(path.join(repoRoot, "agent-packages/agent_3_target_feature/02_M7_TARGET_PROFILE_BACKEND_CURRENT.md"), "utf8");
assert.ok(m7Prompt.includes("M7 must not use any artifact whose name starts with `lossless_family__L`"));
assert.ok(m7Prompt.includes("legal_signal_derivation_profile"));
assert.ok(m7Prompt.includes("legal_cartography_index` is not an active M7 model input"));
assert.equal(m7Prompt.includes("only for the legal-family exception"), false);

for (const [phase, contract] of Object.entries(PHASE_CONTRACTS)) {
  const actor = contract.agent_id || contract.actor_id;
  const allowed = READ_PERMISSIONS[actor] || [];
  for (const artifactName of contract.reads || []) assert.ok(allowed.some((permission) => artifactMatchesPermission(artifactName, permission)), `PHASE_READ_PERMISSION_DRIFT:${phase}:${actor}:${artifactName}`);
  for (const artifactName of contract.writes || []) {
    const allowedWrites = WRITE_PERMISSIONS[actor] || [];
    const phaseWrites = PHASE_WRITE_PERMISSIONS[phase] || [];
    assert.ok(allowedWrites.some((permission) => artifactMatchesPermission(artifactName, permission)), `PHASE_WRITE_PERMISSION_DRIFT:${phase}:${actor}:${artifactName}`);
    assert.ok(phaseWrites.includes(artifactName), `PHASE_WRITE_CONTRACT_DRIFT:${phase}:${artifactName}`);
  }
}

assert.deepEqual(QUALIFIED_REVIEW_ARTIFACT_NAMES, ["qualified_review_handoff", "qr_artifact__entity_commercial", "qr_artifact__technology_infrastructure", "qr_artifact__ai_capability_product_behavior", "qr_artifact__dap_privacy_india_cyber", "qualified_review_renderer_payload", "qualified_review_submission"]);
assert.deepEqual(PHASE_WRITE_PERMISSIONS.QUALIFIED_REVIEW_HANDOFF, ["qualified_review_handoff", "qr_artifact__entity_commercial", "qr_artifact__technology_infrastructure", "qr_artifact__ai_capability_product_behavior", "qr_artifact__dap_privacy_india_cyber"]);
assert.deepEqual(PHASE_WRITE_PERMISSIONS.QUALIFIED_REVIEW_RENDERER, ["qualified_review_renderer_payload"]);
assert.equal(PHASE_CONTRACTS.QUALIFIED_REVIEW_HANDOFF, undefined);
assert.equal(PHASE_CONTRACTS.QUALIFIED_REVIEW_RENDERER, undefined);
assert.ok(AGENTS.includes(QUALIFIED_REVIEW_SYSTEM_AGENT));
assert.deepEqual(WRITE_PERMISSIONS[QUALIFIED_REVIEW_SYSTEM_AGENT], QUALIFIED_REVIEW_ARTIFACT_NAMES);
assert.deepEqual(READ_PERMISSIONS[QUALIFIED_REVIEW_SYSTEM_AGENT], QUALIFIED_REVIEW_READ_ARTIFACT_NAMES);
for (const oldArtifact of [OLD_DATA_PROFILE, OLD_DATA_FORENSICS, OLD_4B, OLD_4C]) assert.equal(READ_PERMISSIONS[QUALIFIED_REVIEW_SYSTEM_AGENT].includes(oldArtifact), false, `QR still reads ${oldArtifact}`);
assert.ok(READ_PERMISSIONS[QUALIFIED_REVIEW_SYSTEM_AGENT].includes("final_output_handoff"));
assert.ok(READ_PERMISSIONS[QUALIFIED_REVIEW_SYSTEM_AGENT].includes("normalized_report_manifest"));
assert.ok(READ_PERMISSIONS[QUALIFIED_REVIEW_SYSTEM_AGENT].includes("target_profile"));
assert.ok(READ_PERMISSIONS[QUALIFIED_REVIEW_SYSTEM_AGENT].includes("target_feature_profile"));
assert.ok(READ_PERMISSIONS[QUALIFIED_REVIEW_SYSTEM_AGENT].includes("data_provenance_profile_semantic_batch_gate"));
assert.ok(READ_PERMISSIONS[QUALIFIED_REVIEW_SYSTEM_AGENT].includes("exposure_registry_triggered_profile"));
assert.ok(READ_PERMISSIONS[QUALIFIED_REVIEW_SYSTEM_AGENT].includes("challenge_gate"));
assert.ok(READ_PERMISSIONS[QUALIFIED_REVIEW_SYSTEM_AGENT].includes(LEGAL_SIGNAL_PROFILE));
assert.equal(READ_PERMISSIONS[QUALIFIED_REVIEW_SYSTEM_AGENT].includes(OLD_M7_OVERLAY), false);
assert.equal(READ_PERMISSIONS[QUALIFIED_REVIEW_SYSTEM_AGENT].includes(OLD_M10_SUPPORT), false);

console.log("normalized pipeline contract: PASS");
