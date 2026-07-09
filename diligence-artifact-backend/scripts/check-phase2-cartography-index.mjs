import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { CARTOGRAPHY_ARTIFACT_NAMES, CARTOGRAPHY_LAYER1_ARTIFACT_NAMES, CARTOGRAPHY_LAYER2_ARTIFACT_NAMES, CARTOGRAPHY_LAYER3_ARTIFACT_NAMES, CARTOGRAPHY_LAYER4_ARTIFACT_NAMES, CARTOGRAPHY_LAYER5_ARTIFACT_NAMES, CARTOGRAPHY_SOURCE_INPUT_ARTIFACT_NAMES, READ_PERMISSIONS, WRITE_PERMISSIONS, INTERNAL_JOB_WRITE_PERMISSIONS } from "../src/runtime/contracts/artifact-permissions.contract.js";
import { PIPELINE_CONTRACTS, INTERNAL_PIPELINE_JOB_IDS, PIPELINE_CONTRACT_STATUS } from "../src/runtime/contracts/pipeline.contract.js";
import { CENTRAL_PHASES } from "../src/runtime/contracts/central-phase.contract.js";
import { CARTOGRAPHY_INDEX_CONTRACT } from "../src/phases/02-cartography-index/cartography-index.contract.js";

const ROOT = process.cwd();
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const runtimeFiles = [
  "src/runtime/contracts/artifact-permissions.contract.js",
  "src/runtime/contracts/pipeline.contract.js",
  "src/runtime/contracts/central-phase.contract.js",
  "src/runtime/contracts/artifacts.contract.js",
  "src/phase-contracts.js",
  "src/phases/02-cartography-index/cartography-index.runner.js",
  "src/runtime/services/pipeline.service.js",
  "src/runtime/services/artifacts.service.js"
];
const activeText = runtimeFiles.map(read).join("\n");
const contractText = read("src/phases/02-cartography-index/cartography-index.contract.js");

assert.equal(CARTOGRAPHY_INDEX_CONTRACT.central_phase_id, "CARTOGRAPHY_INDEX");
assert.equal(CARTOGRAPHY_INDEX_CONTRACT.public_label, "Cartography and Index");
assert.equal(CARTOGRAPHY_INDEX_CONTRACT.doctrine.phase_2_indexes_navigation_only, true);
assert.equal(CARTOGRAPHY_INDEX_CONTRACT.doctrine.lossless_text_copy_allowed, false);
assert.equal(CARTOGRAPHY_INDEX_CONTRACT.doctrine.domain_lock_allowed_in_phase_2, false);
assert.deepEqual(CARTOGRAPHY_INDEX_CONTRACT.final_artifacts, CARTOGRAPHY_ARTIFACT_NAMES);
assert.deepEqual(CARTOGRAPHY_INDEX_CONTRACT.retired_phase_2_artifacts, ["legal_cartography_deterministic_map", "legal_cartography_semantic_profile", "legal_cartography_reinvestigation_workpad", "legal_cartography_index", "legal_signal_derivation_profile"]);
assert.deepEqual(CARTOGRAPHY_INDEX_CONTRACT.retired_phase_7_index_artifacts, ["data_privacy_navigation_index"]);
assert.deepEqual(CARTOGRAPHY_LAYER1_ARTIFACT_NAMES, ["cartography_source_inventory"]);
assert.deepEqual(CARTOGRAPHY_LAYER2_ARTIFACT_NAMES, ["cartography_locator_spine"]);
assert.deepEqual(CARTOGRAPHY_LAYER3_ARTIFACT_NAMES, ["cartography_profile_route_matrix"]);
assert.deepEqual(CARTOGRAPHY_LAYER4_ARTIFACT_NAMES, ["cartography_semantic_navigation_overlay"]);
assert.deepEqual(CARTOGRAPHY_LAYER5_ARTIFACT_NAMES, ["target_profile_source_index", "activity_profile_source_index", "data_provenance_source_index", "legal_governance_source_index", "cartography_index", "cartography_validation_manifest"]);

const expectedJobs = ["P2_SOURCE_INVENTORY_CARTOGRAPHY", "P2_LOCATOR_SPINE", "P2_PROFILE_ROUTE_MATRIX", "P2_SEMANTIC_NAVIGATION_OVERLAY", "P2_INDEX_COMPILER_VALIDATION"];
for (const jobId of expectedJobs) {
  assert.ok(INTERNAL_PIPELINE_JOB_IDS.includes(jobId), `pipeline missing ${jobId}`);
  assert.ok(PIPELINE_CONTRACTS[jobId], `contract missing ${jobId}`);
  assert.ok(CARTOGRAPHY_INDEX_CONTRACT.jobs[jobId], `phase2 contract missing ${jobId}`);
  assert.ok(INTERNAL_JOB_WRITE_PERMISSIONS[jobId], `write permission missing ${jobId}`);
}
assert.equal(PIPELINE_CONTRACTS.M6_BUCKET_INDEX.next, "P2_SOURCE_INVENTORY_CARTOGRAPHY");
assert.equal(PIPELINE_CONTRACTS.P2_INDEX_COMPILER_VALIDATION.next, "M7_TARGET_PROFILE");
assert.deepEqual(PIPELINE_CONTRACTS.P2_SOURCE_INVENTORY_CARTOGRAPHY.writes, CARTOGRAPHY_LAYER1_ARTIFACT_NAMES);
assert.deepEqual(PIPELINE_CONTRACTS.P2_LOCATOR_SPINE.writes, CARTOGRAPHY_LAYER2_ARTIFACT_NAMES);
assert.deepEqual(PIPELINE_CONTRACTS.P2_PROFILE_ROUTE_MATRIX.writes, CARTOGRAPHY_LAYER3_ARTIFACT_NAMES);
assert.deepEqual(PIPELINE_CONTRACTS.P2_SEMANTIC_NAVIGATION_OVERLAY.writes, CARTOGRAPHY_LAYER4_ARTIFACT_NAMES);
assert.deepEqual(PIPELINE_CONTRACTS.P2_INDEX_COMPILER_VALIDATION.writes, CARTOGRAPHY_LAYER5_ARTIFACT_NAMES);
assert.ok(CARTOGRAPHY_SOURCE_INPUT_ARTIFACT_NAMES.includes("source_discovery_handoff"));
assert.ok(CARTOGRAPHY_SOURCE_INPUT_ARTIFACT_NAMES.includes("source_family_index"));
assert.ok(CARTOGRAPHY_SOURCE_INPUT_ARTIFACT_NAMES.includes("legal_doc_inventory"));
assert.ok(CARTOGRAPHY_SOURCE_INPUT_ARTIFACT_NAMES.includes("legal_doc_{DOC_TYPE}"));
assert.ok(CARTOGRAPHY_SOURCE_INPUT_ARTIFACT_NAMES.some((name) => name.startsWith("lossless_root__")));
assert.deepEqual(WRITE_PERMISSIONS.agent_2_cartography_index, CARTOGRAPHY_ARTIFACT_NAMES);
assert.ok(READ_PERMISSIONS.agent_2_cartography_index.includes("source_discovery_handoff"));
assert.ok(READ_PERMISSIONS.agent_2_cartography_index.includes("legal_doc_{DOC_TYPE}"));

const centralPhase2 = CENTRAL_PHASES.find((phase) => phase.sequence === 2);
assert.equal(centralPhase2.central_phase_id, "CARTOGRAPHY_INDEX");
assert.equal(centralPhase2.public_label, "Cartography and Index");
assert.deepEqual(centralPhase2.internal_jobs, expectedJobs);
assert.deepEqual(centralPhase2.terminal_outputs, CARTOGRAPHY_ARTIFACT_NAMES);

for (const forbidden of ["legal_cartography_deterministic_map", "legal_cartography_semantic_profile", "legal_cartography_reinvestigation_workpad", "legal_cartography_index", "legal_signal_derivation_profile", "data_privacy_navigation_index", "lossless_family__"]) {
  assert.equal(activeText.includes(forbidden), false, `active runtime files contain retired marker ${forbidden}`);
}
for (const required of ["runCartographyIndexJob", "P2_SOURCE_INVENTORY_CARTOGRAPHY", "cartography_validation_manifest", "contains_lossless_text: false", "semantic_guidance_only"]) assert.ok(`${activeText}\n${contractText}`.includes(required), `active files missing ${required}`);
assert.equal(PIPELINE_CONTRACT_STATUS.old_legal_cartography_index_removed_from_active_pipeline, true);
assert.equal(PIPELINE_CONTRACT_STATUS.legal_signal_derivation_removed_from_active_pipeline, true);
assert.equal(PIPELINE_CONTRACT_STATUS.phase7_data_navigation_index_removed_from_active_pipeline_contract, true);

console.log("Phase 2 cartography index contract validator: PASS");
