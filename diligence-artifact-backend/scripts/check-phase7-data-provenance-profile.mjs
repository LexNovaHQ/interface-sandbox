import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PIPELINE_CONTRACTS } from "../src/runtime/contracts/pipeline.contract.js";
import { CENTRAL_PHASES } from "../src/runtime/contracts/central-phase.contract.js";
import {
  PHASE7_DAP_LAYER4_ARTIFACT_NAMES,
  PHASE7_DAP_LAYER5_ARTIFACT_NAMES,
  PHASE7_DAP_BATCH_ARTIFACT_PATTERN,
  PHASE7_DAP_BATCH_VALIDATION_ARTIFACT_PATTERN,
  PHASE7_DAP_RUNTIME_ARTIFACT_NAMES,
  DATA_PROVENANCE_SOURCE_ARTIFACT_NAMES,
  ARTIFACT_NAMES
} from "../src/runtime/contracts/artifact-permissions.contract.js";
import { PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT } from "../src/phases/07-data-provenance-profile/data-provenance-profile.contract.js";
import {
  compilePhase7DapRegistryDerivationRules,
  validatePhase7DapRegistryManifest,
  PHASE7_EXPECTED_DAP_FIELD_COUNT,
  PHASE7_REGISTRY_SOURCE_PATH,
  PHASE7_DAP_MATERIAL_SECTION_MATRIX
} from "../src/phases/07-data-provenance-profile/dap-registry-derivation-rule-compiler.js";
import {
  buildPhase7StrategicDerivationMatrixArtifact,
  validatePhase7StrategicDerivationMatrix,
  PHASE7_DAP_STRATEGIC_DERIVATION_COUNTS,
  PHASE7_DAP_SEMANTIC_BATCH_PLAN
} from "../src/phases/07-data-provenance-profile/dap-strategic-derivation-matrix.js";
import { buildPhase7SemanticBatchRouteManifest } from "../src/phases/07-data-provenance-profile/layer3-semantic-batch-route-manifest-builder.js";
import { validatePhase7Layer4SemanticBatchArtifact } from "../src/phases/07-data-provenance-profile/layer4-semantic-batch-artifact-validator.js";
import { buildPhase7SemanticBatchQualityGate, validatePhase7SemanticBatchQualityGate } from "../src/phases/07-data-provenance-profile/layer5-semantic-batch-quality-gate-builder.js";
import { P2G_RUNTIME_ROUTE_BY_JOB, buildPhaseRouteRuntimeReadPlan } from "../src/phases/02-cartography-index/services/phase-route-runtime.reader.js";
import { buildPhaseRoutingManifest } from "../src/phases/02-cartography-index/services/phase-routing-manifest.builder.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const registryText = fs.readFileSync(path.join(repoRoot, PHASE7_REGISTRY_SOURCE_PATH), "utf8");

assertPipelineAndContract();
const registryManifest = compilePhase7DapRegistryDerivationRules(registryText);
assert.equal(validatePhase7DapRegistryManifest(registryManifest).status, "PASS", "Phase7 registry manifest must validate");
assert.equal(registryManifest.actual_dap_field_count, PHASE7_EXPECTED_DAP_FIELD_COUNT, "Phase7 registry must expose 150 DAP fields");
assert.equal(registryManifest.material_section_count, PHASE7_DAP_MATERIAL_SECTION_MATRIX.length, "Phase7 material section matrix mismatch");

const strategicMatrix = buildPhase7StrategicDerivationMatrixArtifact(registryManifest.material_rules);
assert.equal(validatePhase7StrategicDerivationMatrix(strategicMatrix.rows).status, "PASS", "Phase7 strategic matrix must validate");
assert.deepEqual(strategicMatrix.counts, PHASE7_DAP_STRATEGIC_DERIVATION_COUNTS, "Phase7 strategic derivation counts mismatch");
assert.equal(PHASE7_DAP_SEMANTIC_BATCH_PLAN.length, 17, "Phase7 semantic batch plan must contain 17 batches");

const dataPrivacyNavigationIndex = fixtureDataPrivacyNavigationIndex();
const routeManifest = buildPhase7SemanticBatchRouteManifest({
  dapRegistryManifest: registryManifest,
  strategicDerivationMatrix: strategicMatrix,
  dataPrivacyNavigationIndex
});
assert.equal(routeManifest.validation_quality_control_result.status, "PASS", JSON.stringify(routeManifest.validation_quality_control_result.errors));
assert.equal(routeManifest.batch_route_packets.length, 17, "Phase7 route manifest must contain 17 route packets");
assert.equal(routeManifest.returned_field_ids.length, 150, "Phase7 route manifest must route 150 fields");
assert.equal(new Set(routeManifest.returned_field_ids).size, 150, "Phase7 route manifest must not duplicate fields");

for (const packet of routeManifest.batch_route_packets) {
  assert.ok(PHASE7_DAP_BATCH_ARTIFACT_PATTERN.test(packet.expected_artifact_name), `unexpected Phase7 batch artifact name:${packet.expected_artifact_name}`);
  assert.ok(packet.data_privacy_navigation_pointer_present, `${packet.batch_id} missing data privacy navigation pointer`);
  assert.ok(packet.required_d_family_route_ids.length, `${packet.batch_id} missing D-family route IDs`);
  assert.ok(packet.selective_l_family_route_ids.length, `${packet.batch_id} missing L-family legal route IDs`);
}

const batchArtifacts = {};
const batchValidations = {};
for (const packet of routeManifest.batch_route_packets) {
  const artifact = fixtureBatchArtifact(packet);
  const validation = validatePhase7Layer4SemanticBatchArtifact(artifact, { routePacket: packet });
  assert.equal(validation.status, "PASS", `${packet.batch_id} validation failed:${JSON.stringify(validation.errors)}`);
  const validationName = `dap_semantic_batch_validation__${packet.batch_id}`;
  assert.ok(PHASE7_DAP_BATCH_VALIDATION_ARTIFACT_PATTERN.test(validationName), `unexpected validation artifact name:${validationName}`);
  batchArtifacts[packet.expected_artifact_name] = artifact;
  batchValidations[validationName] = { dap_semantic_batch_validation: validation };
}

const gateOutput = buildPhase7SemanticBatchQualityGate({ routeManifest, batchArtifacts, batchValidations });
assert.equal(validatePhase7SemanticBatchQualityGate(gateOutput).status, "PASS", "Phase7 Layer5 gate output must validate");
assert.equal(gateOutput.dap_semantic_batch_validation_manifest.expected_batch_count, 17);
assert.equal(gateOutput.dap_semantic_batch_validation_manifest.expected_field_count, 150);
assert.equal(gateOutput.dap_semantic_batch_validation_manifest.observed_field_count, 150);
assert.equal(gateOutput.data_provenance_profile_semantic_batch_gate.all_fields_covered_once, true);
assert.notEqual(gateOutput.data_provenance_profile_semantic_batch_gate.status, "REPAIR_REQUIRED");

assertNoLegacyArtifactsOrPrompts();

console.log(JSON.stringify({
  check: "phase7 data provenance profile",
  status: "PASS",
  dap_field_count: registryManifest.actual_dap_field_count,
  semantic_batch_count: routeManifest.batch_route_packets.length,
  routed_field_count: routeManifest.returned_field_ids.length,
  layer5_gate_status: gateOutput.data_provenance_profile_semantic_batch_gate.status,
  enforced_gates: [
    "PHASE2G_SOURCE_BUCKET_ROUTING",
    "P2D_NAVIGATION_INDEX_REUSED",
    "DAP_REGISTRY_150_FIELDS",
    "STRATEGIC_MATRIX_COUNTS",
    "17_BATCH_ROUTE_MANIFEST",
    "LAYER4_BATCH_SCHEMA_VALIDATOR",
    "LAYER5_DETERMINISTIC_GATE",
    "NO_OLD_M10_4B_4C_OUTPUTS"
  ]
}, null, 2));

function assertPipelineAndContract() {
  const phase7 = CENTRAL_PHASES.find((phase) => phase.central_phase_id === "DATA_PROVENANCE_PROFILE");
  assert.ok(phase7, "central Phase7 missing");
  assert.deepEqual(phase7.internal_jobs, ["DATA_PROVENANCE_PROFILE_LAYER4", "DATA_PROVENANCE_PROFILE_LAYER5"]);
  assert.deepEqual(phase7.terminal_outputs, [
    "dap_registry_manifest",
    "dap_strategic_derivation_matrix",
    "dap_semantic_batch_route_manifest",
    ...PHASE7_DAP_LAYER4_ARTIFACT_NAMES.filter((name) => name.startsWith("dap_semantic_batch_")),
    "dap_semantic_batch_validation_manifest",
    "data_provenance_profile_semantic_batch_gate"
  ]);

  assert.deepEqual(PIPELINE_CONTRACTS.DATA_PROVENANCE_PROFILE_LAYER4.reads, ["phase_routing_manifest"]);
  assert.equal(PIPELINE_CONTRACTS.DATA_PROVENANCE_PROFILE_LAYER4.next, "DATA_PROVENANCE_PROFILE_LAYER5");
  assert.deepEqual(PIPELINE_CONTRACTS.DATA_PROVENANCE_PROFILE_LAYER4.writes, PHASE7_DAP_LAYER4_ARTIFACT_NAMES);
  assert.equal(P2G_RUNTIME_ROUTE_BY_JOB.DATA_PROVENANCE_PROFILE_LAYER4, "ROUTE.PHASE7.DATA_PROVENANCE_PROFILE");

  assert.equal(Object.prototype.hasOwnProperty.call(P2G_RUNTIME_ROUTE_BY_JOB, "DATA_PROVENANCE_PROFILE_LAYER5"), false, "Layer5 must remain route-neutral");
  assert.deepEqual(PIPELINE_CONTRACTS.DATA_PROVENANCE_PROFILE_LAYER5.reads, ["dap_semantic_batch_route_manifest", ...PHASE7_DAP_BATCH_ARTIFACT_NAMES(), ...phase7ValidationNames()]);
  assert.deepEqual(PIPELINE_CONTRACTS.DATA_PROVENANCE_PROFILE_LAYER5.writes, PHASE7_DAP_LAYER5_ARTIFACT_NAMES);

  assert.equal(PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT.route_contract.route_id, "ROUTE.PHASE7.DATA_PROVENANCE_PROFILE");
  assert.equal(PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT.route_contract.bucket_id, "2D_BUCKET_DATA_PRIVACY");
  assert.equal(PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT.navigation_rules.phase7_must_not_rebuild_data_privacy_navigation_index, true);
  assert.equal(PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT.navigation_rules.no_separate_data_provenance_source_index, true);
  assert.equal(PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT.navigation_rules.profile_forensics_inputs_forbidden, true);

  const manifest = buildPhaseRoutingManifest({ runId: "CHECK-PHASE7-AGGREGATE", artifacts: presentPhase2Artifacts() }).phase_routing_manifest;
  const plan = buildPhaseRouteRuntimeReadPlan({ internalJobId: "DATA_PROVENANCE_PROFILE_LAYER4", phaseRoutingManifest: manifest });
  assert.equal(plan.route_id, "ROUTE.PHASE7.DATA_PROVENANCE_PROFILE");
  assert.equal(plan.bucket_id, "2D_BUCKET_DATA_PRIVACY");
  assert.equal(plan.delivery_mode, "SOURCE_BUCKET_PROFILE");
  assert.deepEqual(plan.required_index_artifacts, ["data_privacy_navigation_index"]);
  assert.deepEqual(plan.primary_lossless_evidence, DATA_PROVENANCE_SOURCE_ARTIFACT_NAMES);
  for (const required of ["target_profile", "domain_derivation_profile", "feature_candidate_inventory", "target_feature_profile", "legal_cartography_index", "legal_signal_derivation_profile", "domain_selection_profile", "active_run_package_manifest"]) {
    assert.ok(plan.artifact_reads.includes(required), `Phase7 P2G plan missing ${required}`);
  }
  for (const forbidden of ["target_profile_forensics", "target_feature_profile_forensics", "dap_forensics_profile", "exposure_registry_route_plan", "data_provenance_profile", "integrated_dap_report", "extended_dap_india_readiness_profile"]) {
    assert.equal(plan.artifact_reads.includes(forbidden), false, `Phase7 P2G plan includes forbidden ${forbidden}`);
  }
}

function fixtureDataPrivacyNavigationIndex() {
  return {
    artifact_type: "data_privacy_navigation_index",
    manifest_version: "test_fixture_phase7_navigation_index",
    validation_quality_control_result: { status: "PASS", errors: [] },
    semantic_navigation_overlay: {
      batch_navigation_pointers: PHASE7_DAP_SEMANTIC_BATCH_PLAN.map((batch) => ({
        batch_id: batch.batch_id,
        required_d_family_route_ids: [`D_ROUTE_${batch.batch_id}`],
        selective_l_family_route_ids: [`L_ROUTE_${batch.batch_id}`],
        reading_priority: [`D_ROUTE_${batch.batch_id}`, `L_ROUTE_${batch.batch_id}`]
      }))
    }
  };
}

function fixtureBatchArtifact(packet) {
  return {
    [packet.expected_artifact_name]: {
      batch_id: packet.batch_id,
      families: [...packet.families],
      returned_field_ids: [...packet.expected_field_ids],
      field_rows: packet.expected_field_ids.map((fieldId, index) => ({
        field_id: fieldId,
        output_field: packet.field_route_rows[index]?.output_field || fieldId,
        semantic_resolution_status: "SEMANTIC_RESOLVED_WITH_BOUNDED_SUPPORT",
        structured_candidate: { field_id: fieldId, public_visibility: "Visible in reviewed material fixture." },
        basis_route_ids: [packet.required_d_family_route_ids[0], packet.selective_l_family_route_ids[0]].filter(Boolean),
        basis_summary: "Reviewed routed data/privacy and legal-signal material supports this field-level candidate.",
        reasoning_summary: "Field resolved within the active Phase 7 batch route without legal or compliance conclusion.",
        limitation: "No additional limitation in fixture.",
        missing_proof_request: "",
        private_confirmation_required: false,
        forbidden_inference_check: "PASS"
      })),
      batch_limitations: [],
      batch_quality_flags: []
    }
  };
}

function assertNoLegacyArtifactsOrPrompts() {
  for (const retired of ["data_provenance_profile", "data_provenance_profile_forensics", "extended_dap_india_readiness_profile", "integrated_dap_report", "m10_selected_legal_support_packet"]) {
    assert.equal(ARTIFACT_NAMES.includes(retired), false, `${retired} must not be active artifact`);
  }
  const activeFiles = collectFiles(["src", "scripts", "agent-packages/agent_4_data_privacy"]);
  for (const file of activeFiles) {
    const text = fs.readFileSync(path.join(repoRoot, file), "utf8");
    if (file === "scripts/check-m10-d-primary-selected-legal-support.mjs") {
      assert.equal(text.includes("M10_LEAN_INPUT_CONTRACT"), false, `${file} still references M10 lean contract`);
      continue;
    }
    for (const forbidden of ["M10_LEAN_INPUT_CONTRACT", "extended_dap_india_readiness_profile", "integrated_dap_report"]) {
      assert.equal(text.includes(forbidden), false, `${file} contains retired Phase7/M10 marker ${forbidden}`);
    }
  }
}

function collectFiles(roots) {
  const output = [];
  for (const root of roots) walk(path.join(repoRoot, root), output, root);
  return output.filter((file) => /\.(js|mjs|md|yaml|yml)$/.test(file));
}

function walk(absolute, output) {
  if (!fs.existsSync(absolute)) return;
  const stat = fs.statSync(absolute);
  if (stat.isFile()) {
    output.push(path.relative(repoRoot, absolute).split(path.sep).join("/"));
    return;
  }
  for (const entry of fs.readdirSync(absolute)) {
    if (["node_modules", ".git", "archive", "archive-legacy"].includes(entry)) continue;
    walk(path.join(absolute, entry), output);
  }
}

function presentPhase2Artifacts() {
  return {
    target_profile_source_index: {},
    domain_derivation_source_index: {},
    activity_profile_source_index: {},
    data_privacy_navigation_index: {},
    domain_control_obligation_navigation_index: {},
    legal_cartography_index: {},
    legal_signal_derivation_profile: {}
  };
}

function PHASE7_DAP_BATCH_ARTIFACT_NAMES() {
  return PHASE7_DAP_LAYER4_ARTIFACT_NAMES.filter((name) => name.startsWith("dap_semantic_batch_") && name.endsWith("_artifact"));
}

function phase7ValidationNames() {
  return Array.from({ length: 17 }, (_, index) => `dap_semantic_batch_validation__DAP-SEM-BATCH-${String(index + 1).padStart(2, "0")}`);
}
