import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compilePhase7DapRegistryDerivationRules, PHASE7_REGISTRY_SOURCE_PATH } from "../src/phases/07-data-provenance-profile/dap-registry-derivation-rule-compiler.js";
import { buildPhase7StrategicDerivationMatrixArtifact } from "../src/phases/07-data-provenance-profile/dap-strategic-derivation-matrix.js";
import { buildPhase7DataPrivacyNavigationIndex } from "../src/phases/07-data-provenance-profile/layer2-data-privacy-navigation-index-builder.js";
import { validatePhase7DataPrivacyNavigationIndex } from "../src/phases/07-data-provenance-profile/layer2-data-privacy-navigation-index-validator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const registryText = fs.readFileSync(path.join(root, PHASE7_REGISTRY_SOURCE_PATH), "utf8");
const registryManifest = compilePhase7DapRegistryDerivationRules(registryText);
const strategicMatrix = buildPhase7StrategicDerivationMatrixArtifact(registryManifest.material_rules);
assert.equal(strategicMatrix.validation_quality_control_result.status, "PASS");

const artifacts = {
  legal_cartography_index: { artifact_type: "legal_cartography_index", routes: [{ locator: "privacy.contact" }, { locator: "dpa.transfer" }] },
  legal_signal_derivation_profile: { artifact_type: "legal_signal_derivation_profile", contact_routes: [] },
  lossless_family__D1_SECURITY_TRUST: { artifact_type: "lossless_family__D1_SECURITY_TRUST" },
  lossless_family__D2_SUBPROCESSOR_PRIVACY_CENTER: { artifact_type: "lossless_family__D2_SUBPROCESSOR_PRIVACY_CENTER" },
  lossless_family__D3_DATA_GOVERNANCE_CONTROLS: { artifact_type: "lossless_family__D3_DATA_GOVERNANCE_CONTROLS" },
  lossless_family__D4_DOCS_API_DATA_FLOW: { artifact_type: "lossless_family__D4_DOCS_API_DATA_FLOW" },
  lossless_family__D5_AI_SAFETY_TRANSPARENCY: { artifact_type: "lossless_family__D5_AI_SAFETY_TRANSPARENCY" }
};

const navigationIndex = buildPhase7DataPrivacyNavigationIndex({ dapRegistryManifest: registryManifest, strategicDerivationMatrix: strategicMatrix, artifacts });
const validation = validatePhase7DataPrivacyNavigationIndex(navigationIndex);

assert.equal(navigationIndex.artifact_type, "data_privacy_navigation_index");
assert.equal(navigationIndex.execution_mode, "HYBRID_DETERMINISTIC_LED_SEMANTIC_POINTER_AUGMENTED");
assert.equal(navigationIndex.navigation_policy.deterministic_index_construction_leads, true);
assert.equal(navigationIndex.navigation_policy.semantic_batch_pointer_augmentation_required, true);
assert.equal(navigationIndex.navigation_policy.no_dossier_emission, true);
assert.equal(navigationIndex.navigation_policy.no_compiler_output, true);
assert.equal(navigationIndex.navigation_policy.no_forensics_output, true);
assert.equal(navigationIndex.deterministic_navigation_spine.d_family_routes.length, 5);
assert.equal(navigationIndex.deterministic_navigation_spine.l_family_routes.length, 2);
assert.equal(navigationIndex.semantic_navigation_overlay.batch_navigation_pointers.length, 17);
assert.equal(validation.status, "PASS");
assert.equal(validation.compiler_and_forensics_excluded, true);

const contactCm = navigationIndex.semantic_navigation_overlay.batch_navigation_pointers.find((pointer) => pointer.batch_id === "DAP-SEM-BATCH-09");
assert.deepEqual(contactCm.families, ["CONTACT", "CM"]);
assert.equal(contactCm.expected_artifact_name, "dap_semantic_batch_contact_cm_artifact");

console.log("Phase 7 Layer 2 data privacy navigation index: PASS");
