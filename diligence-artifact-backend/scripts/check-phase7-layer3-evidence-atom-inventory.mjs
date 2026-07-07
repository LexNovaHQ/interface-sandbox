import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compilePhase7DapRegistryDerivationRules, PHASE7_REGISTRY_SOURCE_PATH } from "../src/phases/07-data-provenance-profile/dap-registry-derivation-rule-compiler.js";
import { buildPhase7SourceNavigationInventory } from "../src/phases/07-data-provenance-profile/layer2-source-navigation-inventory-builder.js";
import { validatePhase7Layer2NavigationGate } from "../src/phases/07-data-provenance-profile/layer2-anti-unknown-navigation-gate.js";
import { buildPhase7EvidenceAtomInventory } from "../src/phases/07-data-provenance-profile/layer3-pinpoint-evidence-atom-extractor.js";
import { validatePhase7EvidenceAtomInventory } from "../src/phases/07-data-provenance-profile/layer3-evidence-atom-validator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const registryText = fs.readFileSync(path.join(root, PHASE7_REGISTRY_SOURCE_PATH), "utf8");
const dapRegistryManifest = compilePhase7DapRegistryDerivationRules(registryText);

const artifacts = {
  source_discovery_handoff: { routes: [{ url: "https://example.ai/privacy", title: "Privacy Policy" }, { url: "https://example.ai/security", title: "Security Trust Center" }, { url: "https://example.ai/docs/api", title: "API documentation" }] },
  legal_cartography_index: { pinpoint_refs: [{ document_url: "https://example.ai/privacy", section_path: "privacy_policy/contact", title: "Privacy contact" }, { document_url: "https://example.ai/dpa", section_path: "dpa/subprocessors", title: "Data Processing Addendum subprocessors" }] },
  legal_signal_derivation_profile: { privacy_grievance_contact_signal_map: [{ route: "privacy_policy/contact", title: "Privacy grievance contact signal" }], consent_manager_signal_map: [{ route: "cookie_notice/controls", title: "Consent manager signal" }] },
  target_profile: { target_profile_route: "target_profile/root", title: "Target Profile" },
  feature_candidate_inventory: { activity_inventory_route: "feature_candidate_inventory/activities", title: "Feature Candidate Inventory" },
  target_feature_profile: { activity_route: "target_feature_profile/activities", title: "Activity mechanics" },
  lossless_family__D1_SECURITY_TRUST: { source_url: "https://example.ai/security", title: "Security Trust" },
  lossless_family__D2_SUBPROCESSOR_PRIVACY_CENTER: { source_url: "https://example.ai/subprocessors", title: "Subprocessors" },
  lossless_family__D3_DATA_GOVERNANCE_CONTROLS: { source_url: "https://example.ai/privacy", title: "Privacy data governance controls" },
  lossless_family__D4_DOCS_API_DATA_FLOW: { source_url: "https://example.ai/docs/api", title: "API docs data flow" },
  lossless_family__D5_AI_SAFETY_TRANSPARENCY: { source_url: "https://example.ai/ai-policy", title: "AI policy transparency" }
};

const navigationInventory = buildPhase7SourceNavigationInventory({ dapRegistryManifest, artifacts });
assert.equal(validatePhase7Layer2NavigationGate(navigationInventory).status, "PASS");

const atomInventory = buildPhase7EvidenceAtomInventory({ sourceNavigationInventory: navigationInventory });
const validation = validatePhase7EvidenceAtomInventory(atomInventory);

assert.equal(atomInventory.artifact_type, "dap_evidence_atom_inventory");
assert.equal(atomInventory.extraction_policy.full_d_family_access_allowed_for_navigation, true);
assert.equal(atomInventory.extraction_policy.full_l_family_access_allowed_for_navigation, true);
assert.equal(atomInventory.extraction_policy.entrypoint_must_be_layer2_locator, true);
assert.equal(atomInventory.extraction_policy.whole_family_output_allowed, false);
assert.equal(atomInventory.extraction_policy.full_document_output_allowed, false);
assert.equal(atomInventory.extraction_policy.excerpts_allowed, false);
assert.equal(atomInventory.evidence_atoms.length, navigationInventory.admitted_source_route_inventory.length);
assert.equal(validation.status, "PASS");
assert.equal(validation.full_family_access_preserved_for_navigation, true);
assert.equal(validation.output_is_atomized, true);

for (const task of atomInventory.access_plan.read_tasks) {
  assert.equal(task.whole_family_output_allowed, false);
  assert.equal(task.full_document_output_allowed, false);
  assert.equal(task.excerpt_output_allowed, false);
  assert.equal(task.full_family_access_allowed_for_navigation, true);
}

for (const atom of atomInventory.evidence_atoms) {
  assert.ok(atom.pinpoint_locator);
  assert.equal(atom.whole_family_output_allowed, false);
  assert.equal(atom.full_document_output_allowed, false);
  assert.equal(atom.excerpt_output_allowed, false);
  assert.equal(atom.whole_family_access_was_allowed_for_navigation, true);
  assert.equal(Object.prototype.hasOwnProperty.call(atom, "excerpt"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(atom, "raw_text"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(atom, "clean_text"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(atom, "content"), false);
}

console.log("Phase 7 Layer 3 evidence atom inventory: PASS");
