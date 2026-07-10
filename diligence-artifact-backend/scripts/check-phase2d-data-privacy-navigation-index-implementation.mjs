import assert from "node:assert/strict";
import { P2D_DATA_PRIVACY_ARTIFACTS, P2D_DATA_PRIVACY_ROOT_INPUTS, P2D_DATA_PRIVACY_FORBIDDEN_INPUTS } from "../src/phases/02-cartography-index/data-privacy-navigation-index.contract.js";
import { buildDataPrivacyNavigationIndexArtifacts } from "../src/phases/02-cartography-index/orchestrators/data-privacy-navigation-index.orchestrator.js";
import { validateDataPrivacyDeterministicMap, validateDataPrivacySemanticProfile, validateDataPrivacyNavigationIndex } from "../src/phases/02-cartography-index/validators/data-privacy-navigation-index.validator.js";
import { buildPhase7DataPrivacyNavigationIndex } from "../src/phases/07-data-provenance-profile/layer2-data-privacy-navigation-index-builder.js";
import { compilePhase7DapRegistryDerivationRules, PHASE7_REGISTRY_SOURCE_PATH } from "../src/phases/07-data-provenance-profile/dap-registry-derivation-rule-compiler.js";
import { buildPhase7StrategicDerivationMatrixArtifact } from "../src/phases/07-data-provenance-profile/dap-strategic-derivation-matrix.js";
import fs from "node:fs";

const artifacts = Object.fromEntries(P2D_DATA_PRIVACY_ROOT_INPUTS.map((name) => [name, rootArtifact(name)]));
artifacts.legal_cartography_index = { artifact_type: "legal_cartography_index", routes: [] };
artifacts.legal_signal_derivation_profile = { artifact_type: "legal_signal_derivation_profile", legal_notice_contact_signal_map: {}, privacy_grievance_contact_signal_map: {}, consent_manager_signal_map: {} };

const output = buildDataPrivacyNavigationIndexArtifacts({ run: { run_id: "LN-TEST-P2D" }, artifacts });
const deterministic = output[P2D_DATA_PRIVACY_ARTIFACTS.deterministicMap];
const semantic = output[P2D_DATA_PRIVACY_ARTIFACTS.semanticProfile];
const finalIndex = output[P2D_DATA_PRIVACY_ARTIFACTS.finalIndex];

assert.equal(validateDataPrivacyDeterministicMap(output).status, "PASS");
assert.equal(validateDataPrivacySemanticProfile(output).status, "PASS");
assert.equal(validateDataPrivacyNavigationIndex(output).status, "PASS");
assert.equal(deterministic.data_source_routes.length, 5);
assert.equal(deterministic.legal_index_routes.length, 2);
assert.equal(finalIndex.artifact_type, "data_privacy_navigation_index");
assert.equal(finalIndex.phase_id, "CARTOGRAPHY_INDEX");
assert.equal(finalIndex.downstream_phase_id, "DATA_PROVENANCE_PROFILE");
assert.equal(finalIndex.deterministic_navigation_spine.data_source_routes.length, 5);
assert.equal(finalIndex.deterministic_navigation_spine.d_family_routes.length, 5);
assert.equal(finalIndex.deterministic_navigation_spine.legal_index_routes.length, 2);
assert.equal(finalIndex.deterministic_navigation_spine.l_family_routes.length, 2);
assert.equal(finalIndex.semantic_navigation_overlay.batch_navigation_pointers.length, 17);
for (const pointer of finalIndex.semantic_navigation_overlay.batch_navigation_pointers) {
  assert.ok(pointer.required_data_source_route_ids.length, `${pointer.batch_id} missing data routes`);
  assert.ok(pointer.required_d_family_route_ids.length, `${pointer.batch_id} missing compatibility D routes`);
  assert.ok(pointer.selective_legal_route_ids.length, `${pointer.batch_id} missing legal routes`);
  assert.ok(pointer.selective_l_family_route_ids.length, `${pointer.batch_id} missing compatibility L routes`);
}

const serialized = JSON.stringify(output);
for (const token of P2D_DATA_PRIVACY_FORBIDDEN_INPUTS) assert.equal(serialized.includes(token), false, `forbidden retired token present: ${token}`);

const registryText = fs.readFileSync(PHASE7_REGISTRY_SOURCE_PATH, "utf8");
const dapRegistryManifest = compilePhase7DapRegistryDerivationRules(registryText);
const strategicMatrix = buildPhase7StrategicDerivationMatrixArtifact(dapRegistryManifest.material_rules);
const phase7Compat = buildPhase7DataPrivacyNavigationIndex({ dapRegistryManifest, strategicDerivationMatrix: strategicMatrix, artifacts });
assert.equal(phase7Compat.artifact_type, "data_privacy_navigation_index");
assert.equal(phase7Compat.semantic_navigation_overlay.batch_navigation_pointers.length, 17);
assert.equal(JSON.stringify(phase7Compat).includes("lossless_family__D1_SECURITY_TRUST"), false);

console.log(JSON.stringify({ check: "phase2d data privacy navigation index implementation", status: "PASS", data_source_route_count: deterministic.data_source_routes.length, legal_index_route_count: deterministic.legal_index_routes.length, batch_pointer_count: finalIndex.semantic_navigation_overlay.batch_navigation_pointers.length }, null, 2));

function rootArtifact(name) {
  const commonRoot = name.replace(/^lossless_root__/, "");
  return {
    artifact_type: name,
    common_root: commonRoot,
    sources: [
      {
        source_id: `${commonRoot}.SRC.001`,
        common_root: commonRoot,
        canonical_url: `https://example.com/${commonRoot}`,
        url: `https://example.com/${commonRoot}`,
        lossless_text: `${commonRoot} privacy security data processing controls vendor transfer retention contact consent API flow AI transparency grievance regulatory.`
      }
    ]
  };
}
