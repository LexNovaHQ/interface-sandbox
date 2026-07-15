import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compilePhase7DapRegistryDerivationRules, PHASE7_REGISTRY_SOURCE_PATH } from "../src/phases/07-data-provenance-profile/dap-registry-derivation-rule-compiler.js";
import { buildPhase7SourceNavigationInventory } from "../src/phases/07-data-provenance-profile/layer2-source-navigation-inventory-builder.js";
import { validatePhase7Layer2NavigationGate } from "../src/phases/07-data-provenance-profile/layer2-anti-unknown-navigation-gate.js";
import { buildPhase7EvidenceAtomInventory } from "../src/phases/07-data-provenance-profile/layer3-pinpoint-evidence-atom-extractor.js";
import { validatePhase7EvidenceAtomInventory } from "../src/phases/07-data-provenance-profile/layer3-evidence-atom-validator.js";
import { buildPhase7ActivityDataFlowCandidateMap } from "../src/phases/07-data-provenance-profile/layer4-activity-dap-obligation-joiner.js";
import { validatePhase7ActivityDataFlowCandidateMap } from "../src/phases/07-data-provenance-profile/layer4-activity-data-joiner-validator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const registryText = fs.readFileSync(path.join(root, PHASE7_REGISTRY_SOURCE_PATH), "utf8");
const dapRegistryManifest = compilePhase7DapRegistryDerivationRules(registryText);

const artifacts = {
  source_discovery_handoff: { routes: [{ url: "https://example.ai/privacy", title: "Privacy Policy" }, { url: "https://example.ai/security", title: "Security Trust Center" }, { url: "https://example.ai/docs/api", title: "API documentation" }] },
  legal_cartography_index: { pinpoint_refs: [{ document_url: "https://example.ai/privacy", section_path: "privacy_policy/contact", title: "Privacy contact" }, { document_url: "https://example.ai/dpa", section_path: "dpa/subprocessors", title: "Data Processing Addendum subprocessors" }] },
  legal_signal_derivation_profile: { privacy_grievance_contact_signal_map: [{ route: "privacy_policy/contact", title: "Privacy grievance contact signal" }], consent_manager_signal_map: [{ route: "cookie_notice/controls", title: "Consent manager signal" }] },
  target_profile: { target_profile_route: "target_profile/root", title: "Target Profile" },
  feature_candidate_inventory: { candidate_activities: [{ activity_reference: "ACT-001", product_service_wrapper: "AI assistant platform", activity_feature_name: "Prompt analysis API", data_content_object_touched: ["prompt", "output"], input_object: "user prompt", output_object: "generated response", archetype_codes: ["AI_ASSISTANT", "API"], surface_context_tokens: ["api", "model", "prompt"] }] },
  target_feature_profile: { activities: [{ activity_reference: "ACT-002", product_service_wrapper: "Account workspace", activity_feature_name: "Export and delete account data", data_content_object_touched: ["account data"], input_object: "account profile", output_object: "export file", archetype_codes: ["ACCOUNT_CONTROL"], surface_context_tokens: ["export", "delete", "retention"] }] },
  target_feature_profile_forensics: { activity_sources: [{ activity_reference: "ACT-003", activity_feature_name: "Cloud integration logging", data_content_object_touched: ["integration logs"], archetype_codes: ["INTEGRATION"], surface_context_tokens: ["vendor", "cloud", "log"] }] },
  lossless_family__D1_SECURITY_TRUST: { source_url: "https://example.ai/security", title: "Security Trust" },
  lossless_family__D2_SUBPROCESSOR_PRIVACY_CENTER: { source_url: "https://example.ai/subprocessors", title: "Subprocessors" },
  lossless_family__D3_DATA_GOVERNANCE_CONTROLS: { source_url: "https://example.ai/privacy", title: "Privacy data governance controls" },
  lossless_family__D4_DOCS_API_DATA_FLOW: { source_url: "https://example.ai/docs/api", title: "API docs data flow" },
  lossless_family__D5_AI_SAFETY_TRANSPARENCY: { source_url: "https://example.ai/ai-policy", title: "AI policy transparency" }
};

const navigationInventory = buildPhase7SourceNavigationInventory({ dapRegistryManifest, artifacts });
assert.equal(validatePhase7Layer2NavigationGate(navigationInventory).status, "PASS");
const atomInventory = buildPhase7EvidenceAtomInventory({ sourceNavigationInventory: navigationInventory });
assert.equal(validatePhase7EvidenceAtomInventory(atomInventory).status, "PASS");

const candidateMap = buildPhase7ActivityDataFlowCandidateMap({ dapRegistryManifest, sourceNavigationInventory: navigationInventory, evidenceAtomInventory: atomInventory, artifacts });
const validation = validatePhase7ActivityDataFlowCandidateMap(candidateMap);

assert.equal(candidateMap.artifact_type, "activity_data_flow_candidate_map");
assert.equal(candidateMap.join_policy.deterministic_only, true);
assert.equal(candidateMap.join_policy.no_model_calls, true);
assert.equal(candidateMap.join_policy.no_final_dap_values, true);
assert.equal(candidateMap.join_policy.no_excerpts, true);
assert.ok(candidateMap.normalized_activities.length >= 3);
assert.equal(candidateMap.normalized_activities.length, candidateMap.activity_data_flow_candidates.length);
assert.ok(candidateMap.dap_family_activity_obligation_index["DAP.PARTY"].length >= 3);
assert.ok(candidateMap.dap_family_activity_obligation_index["DAP.OBJ"].length >= 3);
assert.ok(candidateMap.dap_family_activity_obligation_index["DAP.FLOW"].length >= 3);
assert.equal(validation.status, "PASS");
assert.equal(validation.deterministic_only, true);
assert.equal(validation.no_final_dap_values, true);
assert.equal(validation.no_excerpts, true);

for (const row of candidateMap.activity_data_flow_candidates) {
  assert.ok(row.candidate_dap_families.includes("DAP.PARTY"));
  assert.ok(row.candidate_dap_families.includes("DAP.OBJ"));
  assert.ok(row.candidate_dap_families.includes("DAP.FLOW"));
  assert.ok(row.supporting_route_ids.length > 0);
  assert.ok(row.supporting_atom_ids.length > 0);
}

console.log("Phase 7 Layer 4 activity data joiner: PASS");
