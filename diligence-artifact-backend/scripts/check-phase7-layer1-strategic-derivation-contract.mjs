import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compilePhase7DapRegistryDerivationRules, PHASE7_REGISTRY_SOURCE_PATH } from "../src/phases/07-data-provenance-profile/dap-registry-derivation-rule-compiler.js";
import { buildPhase7StrategicDerivationMatrixArtifact, PHASE7_DAP_SEMANTIC_BATCH_PLAN } from "../src/phases/07-data-provenance-profile/dap-strategic-derivation-matrix.js";
import { PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT } from "../src/phases/07-data-provenance-profile/data-provenance-profile.contract.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const registryText = fs.readFileSync(path.join(root, PHASE7_REGISTRY_SOURCE_PATH), "utf8");
const registryManifest = compilePhase7DapRegistryDerivationRules(registryText);
const strategicMatrix = buildPhase7StrategicDerivationMatrixArtifact(registryManifest.material_rules);

assert.equal(strategicMatrix.artifact_type, "dap_strategic_derivation_matrix");
assert.equal(strategicMatrix.validation_quality_control_result.status, "PASS");
assert.equal(strategicMatrix.rows.length, 150);
assert.equal(strategicMatrix.counts.SEMANTIC_LED, 103);
assert.equal(strategicMatrix.counts.SEMANTIC_LED_WITH_DETERMINISTIC_SUPPORT, 36);
assert.equal(strategicMatrix.counts.DETERMINISTIC_FINAL, 11);
assert.equal(PHASE7_DAP_SEMANTIC_BATCH_PLAN.length, 17);
assert.equal(PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT.semantic_led_architecture, true);
assert.equal(PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT.deterministic_first, false);
assert.equal(PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT.compiler_inside_phase7, false);
assert.equal(PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT.forensics_inside_phase7, false);
assert.equal(PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT.layer_contracts.length, 5);

console.log("Phase 7 Layer 1 strategic derivation and final structure contract: PASS");
