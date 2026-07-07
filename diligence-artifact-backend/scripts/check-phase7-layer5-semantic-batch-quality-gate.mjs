import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compilePhase7DapRegistryDerivationRules, PHASE7_REGISTRY_SOURCE_PATH } from "../src/phases/07-data-provenance-profile/dap-registry-derivation-rule-compiler.js";
import { buildPhase7StrategicDerivationMatrixArtifact } from "../src/phases/07-data-provenance-profile/dap-strategic-derivation-matrix.js";
import { buildPhase7DataPrivacyNavigationIndex } from "../src/phases/07-data-provenance-profile/layer2-data-privacy-navigation-index-builder.js";
import { buildPhase7SemanticBatchRouteManifest } from "../src/phases/07-data-provenance-profile/layer3-semantic-batch-route-manifest-builder.js";
import { buildPhase7SemanticBatchQualityGate, validatePhase7SemanticBatchQualityGate } from "../src/phases/07-data-provenance-profile/layer5-semantic-batch-quality-gate-builder.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const registryText = fs.readFileSync(path.join(root, PHASE7_REGISTRY_SOURCE_PATH), "utf8");
const registryManifest = compilePhase7DapRegistryDerivationRules(registryText);
const strategicMatrix = buildPhase7StrategicDerivationMatrixArtifact(registryManifest.material_rules);
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
const routeManifest = buildPhase7SemanticBatchRouteManifest({ dapRegistryManifest: registryManifest, strategicDerivationMatrix: strategicMatrix, dataPrivacyNavigationIndex: navigationIndex });
const batchArtifacts = {};
const batchValidations = {};
for (const packet of routeManifest.batch_route_packets) {
  batchArtifacts[packet.expected_artifact_name] = {
    [packet.expected_artifact_name]: {
      batch_id: packet.batch_id,
      families: packet.families,
      returned_field_ids: packet.expected_field_ids,
      field_rows: packet.field_route_rows.map((row) => ({
        field_id: row.field_id,
        output_field: row.output_field,
        semantic_resolution_status: row.strategic_derivation?.deterministic_final_allowed ? "DETERMINISTIC_SOURCE_FACT_CARRIED" : "SEMANTIC_RESOLVED_WITH_BOUNDED_SUPPORT",
        structured_candidate: "candidate fixture",
        basis_route_ids: [packet.required_d_family_route_ids[0]],
        basis_summary: "fixture route basis",
        reasoning_summary: "fixture reasoning",
        limitation: "",
        missing_proof_request: "",
        private_confirmation_required: false,
        forbidden_inference_check: "PASS"
      })),
      batch_limitations: [],
      batch_quality_flags: []
    }
  };
  batchValidations[`dap_semantic_batch_validation__${packet.batch_id}`] = { dap_semantic_batch_validation: { status: "PASS", checked_rows: packet.expected_field_count, errors: [] } };
}

const output = buildPhase7SemanticBatchQualityGate({ routeManifest, batchArtifacts, batchValidations });
const validation = validatePhase7SemanticBatchQualityGate(output);
assert.equal(validation.status, "PASS");
assert.equal(output.dap_semantic_batch_validation_manifest.validation_quality_control_result.status, "PASS");
assert.equal(output.data_provenance_profile_semantic_batch_gate.status, "PASS");
assert.equal(output.data_provenance_profile_semantic_batch_gate.all_batches_present, true);
assert.equal(output.data_provenance_profile_semantic_batch_gate.all_fields_covered_once, true);
assert.equal(output.dap_semantic_batch_validation_manifest.observed_batch_count, 17);
assert.equal(output.dap_semantic_batch_validation_manifest.observed_field_count, 150);
assert.equal(output.dap_semantic_batch_validation_manifest.field_coverage.unique_returned_field_count, 150);

const brokenArtifacts = { ...batchArtifacts };
delete brokenArtifacts.dap_semantic_batch_contact_cm_artifact;
const broken = buildPhase7SemanticBatchQualityGate({ routeManifest, batchArtifacts: brokenArtifacts, batchValidations });
assert.equal(broken.data_provenance_profile_semantic_batch_gate.status, "REPAIR_REQUIRED");
assert.ok(broken.data_provenance_profile_semantic_batch_gate.errors.some((error) => error.includes("missing_batch_artifact:dap_semantic_batch_contact_cm_artifact")));

console.log("Phase 7 Layer 5 semantic batch quality gate: PASS");
