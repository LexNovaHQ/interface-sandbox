import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compilePhase7DapRegistryDerivationRules, PHASE7_REGISTRY_SOURCE_PATH } from "../src/phases/07-data-provenance-profile/dap-registry-derivation-rule-compiler.js";
import { buildPhase7SourceNavigationInventory } from "../src/phases/07-data-provenance-profile/layer2-source-navigation-inventory-builder.js";
import { validatePhase7Layer2NavigationGate } from "../src/phases/07-data-provenance-profile/layer2-anti-unknown-navigation-gate.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const registryText = fs.readFileSync(path.join(root, PHASE7_REGISTRY_SOURCE_PATH), "utf8");
const dapRegistryManifest = compilePhase7DapRegistryDerivationRules(registryText);

const artifacts = {
  source_discovery_handoff: {
    routes: [
      { url: "https://example.ai/privacy", title: "Privacy Policy" },
      { url: "https://example.ai/security", title: "Security Trust Center" },
      { url: "https://example.ai/docs/api", title: "API documentation" }
    ]
  },
  legal_cartography_index: {
    pinpoint_refs: [
      { document_url: "https://example.ai/privacy", section_path: "privacy_policy/contact", title: "Privacy contact" },
      { document_url: "https://example.ai/dpa", section_path: "dpa/subprocessors", title: "Data Processing Addendum subprocessors" },
      { document_url: "https://example.ai/cookies", section_path: "cookie_notice/controls", title: "Cookie controls" }
    ]
  },
  legal_signal_derivation_profile: {
    privacy_grievance_contact_signal_map: [{ route: "privacy_policy/contact", title: "Privacy grievance contact signal" }],
    consent_manager_signal_map: [{ route: "cookie_notice/controls", title: "Consent manager signal" }]
  },
  target_profile: { target_profile_route: "target_profile/root", title: "Target Profile" },
  target_profile_forensics: { target_profile_forensics_route: "target_profile_forensics/limitations", title: "Target Profile Forensics" },
  feature_candidate_inventory: { activity_inventory_route: "feature_candidate_inventory/activities", title: "Feature Candidate Inventory" },
  target_feature_profile: { activity_route: "target_feature_profile/activities", title: "Activity mechanics" },
  target_feature_profile_forensics: { activity_forensics_route: "target_feature_profile_forensics/activity_sources", title: "Activity Forensics" },
  lossless_family__D1_SECURITY_TRUST: { source_url: "https://example.ai/security", title: "Security Trust" },
  lossless_family__D2_SUBPROCESSOR_PRIVACY_CENTER: { source_url: "https://example.ai/subprocessors", title: "Subprocessors" },
  lossless_family__D3_DATA_GOVERNANCE_CONTROLS: { source_url: "https://example.ai/privacy", title: "Privacy data governance controls" },
  lossless_family__D4_DOCS_API_DATA_FLOW: { source_url: "https://example.ai/docs/api", title: "API docs data flow" },
  lossless_family__D5_AI_SAFETY_TRANSPARENCY: { source_url: "https://example.ai/ai-policy", title: "AI policy transparency" }
};

const inventory = buildPhase7SourceNavigationInventory({ dapRegistryManifest, artifacts });
const gate = validatePhase7Layer2NavigationGate(inventory);

assert.equal(inventory.artifact_type, "dap_source_navigation_inventory");
assert.equal(inventory.navigation_policy.pinpoint_navigation_only, true);
assert.equal(inventory.navigation_policy.no_excerpts, true);
assert.equal(inventory.navigation_policy.no_full_document_payloads, true);
assert.equal(inventory.registry_family_route_obligation_matrix.length, 18);
assert.ok(inventory.admitted_source_route_inventory.length >= 12);
assert.ok(inventory.document_type_classification_map.some((row) => row.document_type === "privacy_notice"));
assert.ok(inventory.document_type_classification_map.some((row) => row.document_type === "dpa"));
assert.ok(inventory.document_type_classification_map.some((row) => row.document_type === "security_trust"));
assert.ok(inventory.document_type_classification_map.some((row) => row.document_type === "docs_api_data_flow"));
assert.ok(inventory.document_type_classification_map.some((row) => row.document_type === "direct_legal_signal_profile"));
assert.ok(inventory.cross_route_rescue_plan.length === 18);

for (const route of inventory.admitted_source_route_inventory) {
  assert.equal(route.excerpt_allowed, false);
  assert.equal(route.full_document_read_allowed, false);
  assert.ok(route.pinpoint_locator);
  assert.equal(Object.prototype.hasOwnProperty.call(route, "excerpt"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(route, "raw_text"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(route, "clean_text"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(route, "content"), false);
  if (route.source_artifact === "legal_cartography_index") assert.equal(route.pinpoint_locator.via_legal_cartography, true);
}

for (const row of inventory.dap_family_source_coverage_matrix) {
  assert.notEqual(row.family_navigation_status, "UNKNOWN");
  assert.ok(row.anti_unknown_obligation);
}

assert.equal(gate.status, "PASS");
assert.equal(gate.no_excerpts, true);
assert.equal(gate.legal_family_pinpoint_enforced, true);
assert.equal(gate.anti_unknown_controlled, true);

console.log("Phase 7 Layer 2 source navigation inventory: PASS");
