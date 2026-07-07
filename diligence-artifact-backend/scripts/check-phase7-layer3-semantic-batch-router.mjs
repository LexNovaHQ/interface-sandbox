import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compilePhase7DapRegistryDerivationRules, PHASE7_REGISTRY_SOURCE_PATH } from "../src/phases/07-data-provenance-profile/dap-registry-derivation-rule-compiler.js";
import { buildPhase7StrategicDerivationMatrixArtifact } from "../src/phases/07-data-provenance-profile/dap-strategic-derivation-matrix.js";
import { buildPhase7DataPrivacyNavigationIndex } from "../src/phases/07-data-provenance-profile/layer2-data-privacy-navigation-index-builder.js";
import { validatePhase7DataPrivacyNavigationIndex } from "../src/phases/07-data-provenance-profile/layer2-data-privacy-navigation-index-validator.js";
import { buildPhase7SemanticBatchRouteManifest } from "../src/phases/07-data-provenance-profile/layer3-semantic-batch-route-manifest-builder.js";
import { validatePhase7SemanticBatchRouteManifest } from "../src/phases/07-data-provenance-profile/layer3-semantic-batch-route-manifest-validator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const registryText = fs.readFileSync(path.join(root, PHASE7_REGISTRY_SOURCE_PATH), "utf8");
const registryManifest = compilePhase7DapRegistryDerivationRules(registryText);
const strategicMatrix = buildPhase7StrategicDerivationMatrixArtifact(registryManifest.material_rules);
assert.equal(strategicMatrix.validation_quality_control_result.status, "PASS");

const artifacts = {
  legal_cartography_index: { artifact_type: "legal_cartography_index" },
  legal_signal_derivation_profile: { artifact_type: "legal_signal_derivation_profile" },
  lossless_family__D1_SECURITY_TRUST: { artifact_type: "lossless_family__D1_SECURITY_TRUST" },
  lossless_family__D2_SUBPROCESSOR_PRIVACY_CENTER: { artifact_type: "lossless_family__D2_SUBPROCESSOR_PRIVACY_CENTER" },
  lossless_family__D3_DATA_GOVERNANCE_CONTROLS: { artifact_type: "lossless_family__D3_DATA_GOVERNANCE_CONTROLS" },
  lossless_family__D4_DOCS_API_DATA_FLOW: { artifact_type: "lossless_family__D4_DOCS_API_DATA_FLOW" },
  lossless_family__D5_AI_SAFETY_TRANSPARENCY: { artifact_type: "lossless_family__D5_AI_SAFETY_TRANSPARENCY" }
};

const navigationIndex = buildPhase7DataPrivacyNavigationIndex({ dapRegistryManifest: registryManifest, strategicDerivationMatrix: strategicMatrix, artifacts });
assert.equal(validatePhase7DataPrivacyNavigationIndex(navigationIndex).status, "PASS");

const routeManifest = buildPhase7SemanticBatchRouteManifest({ dapRegistryManifest: registryManifest, strategicDerivationMatrix: strategicMatrix, dataPrivacyNavigationIndex: navigationIndex });
const validation = validatePhase7SemanticBatchRouteManifest(routeManifest, { dapRegistryManifest: registryManifest, strategicDerivationMatrix: strategicMatrix, dataPrivacyNavigationIndex: navigationIndex });

assert.equal(routeManifest.artifact_type, "dap_semantic_batch_route_manifest");
assert.equal(routeManifest.execution_mode, "DETERMINISTIC_ROUTER_ONLY");
assert.equal(routeManifest.routing_policy.deterministic_only, true);
assert.equal(routeManifest.routing_policy.no_semantic_reasoning, true);
assert.equal(routeManifest.routing_policy.no_dossier_emission, true);
assert.equal(routeManifest.routing_policy.no_source_text, true);
assert.equal(routeManifest.routing_policy.no_excerpts, true);
assert.equal(routeManifest.routing_policy.no_field_derivation, true);
assert.equal(routeManifest.routing_policy.no_compiler_output, true);
assert.equal(routeManifest.routing_policy.no_forensics_output, true);
assert.equal(routeManifest.batch_route_packets.length, 17);
assert.equal(routeManifest.returned_field_ids.length, 150);
assert.equal(new Set(routeManifest.returned_field_ids).size, 150);
assert.equal(validation.status, "PASS");
assert.equal(validation.no_dossier_or_source_text, true);
assert.equal(validation.compiler_and_forensics_excluded, true);

const contactCm = routeManifest.batch_route_packets.find((packet) => packet.batch_id === "DAP-SEM-BATCH-09");
assert.deepEqual(contactCm.families, ["CONTACT", "CM"]);
assert.equal(contactCm.expected_artifact_name, "dap_semantic_batch_contact_cm_artifact");
assert.equal(contactCm.expected_field_count, 12);
assert.equal(contactCm.required_d_family_route_ids.length, 5);
assert.ok(contactCm.selective_l_family_route_ids.length >= 1);

for (const packet of routeManifest.batch_route_packets) {
  assert.equal(packet.schema_requirements.required_root, packet.expected_artifact_name);
  assert.equal(packet.validation_requirements.validate_navigation_index_usage, true);
  assert.equal(packet.validation_requirements.validate_no_legal_or_compliance_conclusion, true);
}

console.log("Phase 7 Layer 3 semantic batch router: PASS");
