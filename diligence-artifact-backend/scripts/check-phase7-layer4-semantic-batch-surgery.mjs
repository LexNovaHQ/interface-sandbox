import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compilePhase7DapRegistryDerivationRules, PHASE7_REGISTRY_SOURCE_PATH } from "../src/phases/07-data-provenance-profile/dap-registry-derivation-rule-compiler.js";
import { buildPhase7StrategicDerivationMatrixArtifact } from "../src/phases/07-data-provenance-profile/dap-strategic-derivation-matrix.js";
import { buildPhase7DataPrivacyNavigationIndex } from "../src/phases/07-data-provenance-profile/layer2-data-privacy-navigation-index-builder.js";
import { buildPhase7SemanticBatchRouteManifest } from "../src/phases/07-data-provenance-profile/layer3-semantic-batch-route-manifest-builder.js";
import { validatePhase7Layer4SemanticBatchArtifact } from "../src/phases/07-data-provenance-profile/layer4-semantic-batch-artifact-validator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const requiredPromptFiles = [
  "agent-packages/agent_4_data_privacy/AGENT4_PHASE7_LAYER4_RUNTIME_BINDING_PACKET.yaml",
  "agent-packages/agent_4_data_privacy/PHASE7_LAYER4_DAP_SEMANTIC_BATCH_RUNNER.md",
  "agent-packages/agent_4_data_privacy/PHASE7_LAYER4_DAP_SEMANTIC_BATCH_REPAIR.md"
];
for (const file of requiredPromptFiles) assert.ok(fs.existsSync(path.join(root, file)), `missing prompt file ${file}`);

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
const routePacket = routeManifest.batch_route_packets.find((packet) => packet.batch_id === "DAP-SEM-BATCH-09");
assert.equal(routePacket.expected_artifact_name, "dap_semantic_batch_contact_cm_artifact");

const validBatchRoot = {
  [routePacket.expected_artifact_name]: {
    batch_id: routePacket.batch_id,
    families: routePacket.families,
    returned_field_ids: routePacket.expected_field_ids,
    field_rows: routePacket.field_route_rows.map((row) => ({
      field_id: row.field_id,
      output_field: row.output_field,
      semantic_resolution_status: row.strategic_derivation?.deterministic_final_allowed ? "DETERMINISTIC_SOURCE_FACT_CARRIED" : "SEMANTIC_RESOLVED_WITH_BOUNDED_SUPPORT",
      structured_candidate: "candidate retained for validator fixture",
      basis_route_ids: [routePacket.required_d_family_route_ids[0]],
      basis_summary: "bounded route support fixture",
      reasoning_summary: "semantic batch row fixture",
      limitation: "",
      missing_proof_request: "",
      private_confirmation_required: false,
      forbidden_inference_check: "PASS"
    })),
    batch_limitations: [],
    batch_quality_flags: []
  }
};

const validation = validatePhase7Layer4SemanticBatchArtifact(validBatchRoot, { routePacket });
assert.equal(validation.status, "PASS");
assert.equal(validation.checked_rows, routePacket.expected_field_count);

const invalidBatchRoot = { data_provenance_profile: {}, ...validBatchRoot };
const invalid = validatePhase7Layer4SemanticBatchArtifact(invalidBatchRoot, { routePacket });
assert.equal(invalid.status, "REPAIR_REQUIRED");
assert.ok(invalid.errors.some((error) => error.includes("forbidden_root:data_provenance_profile")));

console.log("Phase 7 Layer 4 semantic batch surgery: PASS");
