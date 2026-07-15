import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = "agent-packages/phase_2d_data_privacy_navigation_index";
const EXPECTED = [
  "P2D_DATA_PRIVACY_NAVIGATION_INDEX_RUNTIME_BINDING_PACKET.yaml",
  "00_RUNTIME_CONTROLLER_PHASE2D_DATA_PRIVACY_NAVIGATION_INDEX.md",
  "P2D_DATA_PRIVACY_NAVIGATION_INDEX.md",
  "P2D_DATA_PRIVACY_NAVIGATION_INDEX_REFERENCE_MAP.yaml",
  "00_VALIDATOR_RULES_PHASE2D_DATA_PRIVACY_NAVIGATION_INDEX.md",
  "00_TERMINAL_RECEIPT_RULES_PHASE2D_DATA_PRIVACY_NAVIGATION_INDEX.md",
  "P2D_PACKET_MANIFEST.json"
];
const REQUIRED_ROOTS = [
  "lossless_root__privacy_data_processing",
  "lossless_root__security_trust_compliance",
  "lossless_root__data_governance_controls",
  "lossless_root__technical_docs_api",
  "lossless_root__docs_api_data_flow",
  "lossless_root__integrations_ecosystem",
  "lossless_root__ai_safety_transparency",
  "lossless_root__regulatory_licensing_status",
  "lossless_root__grievance_complaints"
];
const FORBIDDEN_RUNTIME_CLAIMS = [];
const FORBIDDEN_OUTPUTS = ["data_provenance_source_index", "extended_dap_india_" + "readiness_profile", "integrated_" + "dap_report"];

assert.ok(fs.existsSync(ROOT), `missing package folder: ${ROOT}`);
const actual = fs.readdirSync(ROOT).sort();
assert.deepEqual(actual, [...EXPECTED].sort(), "Phase 2D package must contain exactly the lean 7-file set");
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "P2D_PACKET_MANIFEST.json"), "utf8"));
assert.equal(manifest.phase_id, "P2D_DATA_PRIVACY_NAVIGATION_INDEX");
assert.equal(manifest.final_artifact, "data_privacy_navigation_index");
assert.equal(manifest.package_status, "LEAN_PACKAGE_RUNTIME_WIRED");
assert.equal(manifest.runtime_wiring_changed, true);
assert.deepEqual(manifest.components, EXPECTED);
assert.deepEqual(manifest.writes, ["data_privacy_deterministic_map", "data_privacy_semantic_profile", "data_privacy_navigation_index"]);
for (const root of REQUIRED_ROOTS) assert.ok(manifest.reads.phase1_v5_data_privacy_roots.includes(root), `missing root ${root}`);
assert.equal(manifest.runtime_wiring.artifact_permissions_registered, true);
assert.equal(manifest.runtime_wiring.pipeline_contract_registered, true);
assert.equal(manifest.runtime_wiring.central_phase_registered, true);
assert.equal(manifest.runtime_wiring.pipeline_service_dispatch_registered, true);
assert.equal(manifest.runtime_wiring.save_order_gates_registered, true);
assert.equal(manifest.runtime_wiring.p2_index_compiler_reads_not_writes_dpni, true);
assert.equal(manifest.runtime_wiring.phase7_layer4_reads_phase2d_dpni, true);
assert.equal(manifest.runtime_wiring.p2d_next, "P2E_DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX");
assert.equal(manifest.runtime_wiring.p2e_next, "P2G_PHASE_ROUTER");
assert.equal(manifest.runtime_wiring.p2g_next, "P2_INDEX_COMPILER_VALIDATION");
assert.equal(manifest.runtime_wiring.p2g_phase_router_required_before_p2_index, true);
assert.equal(manifest.boundaries.old_d_family_inputs_forbidden, true);
assert.equal(manifest.boundaries.data_provenance_source_index_forbidden, true);
assert.equal(manifest.boundaries.phase7_layer3_compatibility_keys_preserved, true);
const packageText = EXPECTED.map((file) => fs.readFileSync(path.join(ROOT, file), "utf8")).join("\n");
for (const token of ["lossless_family__D1_SECURITY_TRUST", "lossless_root__security_trust", "lossless_root__trust_compliance", "lossless_root__technical_docs_api_developer"]) {
  assert.ok(packageText.includes(token), `package should document forbidden token: ${token}`);
}
for (const token of FORBIDDEN_OUTPUTS) {
  assert.ok(packageText.includes(token), `package should document forbidden output: ${token}`);
}
for (const claim of FORBIDDEN_RUNTIME_CLAIMS) assert.ok(!packageText.includes(claim), `forbidden runtime claim: ${claim}`);
console.log(JSON.stringify({ check: "phase2d data privacy navigation index package", status: "PASS", files: actual.length }, null, 2));
