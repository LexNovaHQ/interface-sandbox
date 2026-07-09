import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { PIPELINE_CONTRACTS, INTERNAL_PIPELINE_JOB_IDS, PIPELINE_CONTRACT_STATUS } from "../src/runtime/contracts/pipeline.contract.js";
import { CENTRAL_PHASES } from "../src/runtime/contracts/central-phase.contract.js";
import { ARTIFACT_NAMES, CARTOGRAPHY_LAYER5_ARTIFACT_NAMES, DOMAIN_DERIVATION_ARTIFACT_NAMES, INTERNAL_JOB_WRITE_PERMISSIONS, LEGAL_CARTOGRAPHY_ARTIFACT_NAMES, LEGAL_CARTOGRAPHY_OPTIONAL_ARTIFACT_NAMES, PHASE7_DAP_BATCH_ARTIFACT_NAMES, artifactMatchesPermission } from "../src/runtime/contracts/artifact-permissions.contract.js";
import { TARGET_PROFILE_REVIEW_CONTRACT } from "../src/phases/03-target-profile-review/target-profile-review.contract.js";
import { DOMAIN_DERIVATION_CONTRACT } from "../src/phases/03-domain-derivation/domain-derivation.contract.js";
import { PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT } from "../src/phases/07-data-provenance-profile/data-provenance-profile.contract.js";

const ROOT = process.cwd();
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const phase1To8Jobs = Object.freeze([
  "AGENT_1A_URL_MANIFEST", "AGENT_1B_EXTRACT", "M6_BUCKET_INDEX",
  "P2_SOURCE_INVENTORY_CARTOGRAPHY", "P2_LOCATOR_SPINE", "P2_PROFILE_ROUTE_MATRIX", "P2_SEMANTIC_NAVIGATION_OVERLAY", "M9", "P2_INDEX_COMPILER_VALIDATION",
  "M7_TARGET_PROFILE", "P3_DOMAIN_DERIVATION_LAYER", "M7_TARGET_PROFILE_FORENSICS",
  "M8_FEATURE_CANDIDATE_INVENTORY", "M8_TARGET_FEATURE_PROFILE", "M8_TARGET_FEATURE_PROFILE_FORENSICS",
  "DATA_PROVENANCE_PROFILE_LAYER4", "DATA_PROVENANCE_PROFILE_LAYER5", "DATA_PROVENANCE_PROFILE_FORENSICS"
]);
const expectedJobChain = Object.freeze([...phase1To8Jobs, "M11"]);
const targetProfileRoots = Object.freeze([
  "lossless_root__homepage_landing", "lossless_root__about_company", "lossless_root__legal_identity_notice", "lossless_root__pricing_commercial_availability", "lossless_root__contact_notice", "lossless_root__operator_entity_signals", "lossless_root__supporting_company_signals"
]);
const domainDerivationRoots = Object.freeze([
  "lossless_root__homepage_landing", "lossless_root__about_company", "lossless_root__product_service", "lossless_root__platform_feature_solution", "lossless_root__technical_docs_api_developer", "lossless_root__docs_api_data_flow", "lossless_root__pricing_commercial_availability", "lossless_root__use_case_customer_industry", "lossless_root__integrations_ecosystem"
]);
const retiredActiveArtifacts = Object.freeze(["data_provenance_profile", "data_provenance_profile_forensics", "extended_dap_india_readiness_profile", "integrated_dap_report", "m10_selected_legal_support_packet", "m7_deterministic_legal_signal_overlay", "legal_governance_source_index", "data_provenance_source_index"]);

checkEntrypoint();
checkPhaseChain();
checkPhase2Artifacts();
checkPhase3AInputs();
checkPhase3BInputsAndContract();
checkWritePermissions();
checkNoRetiredArtifacts();
checkPhase7DapBoundary();

console.log(JSON.stringify({
  check: "phase1-8 central runtime",
  status: "PASS",
  enforced_gates: [
    "CENTRAL_RUNTIME_START",
    "PHASE1_8_JOB_CHAIN",
    "PHASE2_CARTOGRAPHY_INDEX_LOCK",
    "PHASE3A_SCOPED_LOSSLESS_TARGET_EVIDENCE",
    "PHASE3B_SCOPED_NON_LEGAL_TARGET_ACTIVITY_EVIDENCE",
    "PHASE3B_AGENT3_PACKAGE_BINDING_PROMPT_PENDING",
    "PHASE7_REUSES_PHASE2_DPNI",
    "NO_RETIRED_ACTIVE_ARTIFACTS"
  ]
}, null, 2));

function checkEntrypoint() {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.scripts?.start, "node src/runtime/main.js");
  const server = read("server.js");
  assert.ok(server.includes("./src/runtime/main.js"));
  assert.ok(server.includes("startRuntimeServer"));
}

function checkPhaseChain() {
  assert.deepEqual(INTERNAL_PIPELINE_JOB_IDS.slice(0, expectedJobChain.length), expectedJobChain);
  for (const jobId of phase1To8Jobs) assert.ok(PIPELINE_CONTRACTS[jobId], `missing pipeline contract for ${jobId}`);
  for (const jobId of phase1To8Jobs.slice(0, -1)) assert.equal(PIPELINE_CONTRACTS[jobId].next, expectedJobChain[expectedJobChain.indexOf(jobId) + 1], `${jobId} next mismatch`);
  assert.equal(PIPELINE_CONTRACTS.DATA_PROVENANCE_PROFILE_FORENSICS.next, "M11");
  assert.deepEqual(CENTRAL_PHASES.filter((phase) => phase.sequence <= 8).flatMap((phase) => [...phase.internal_jobs]), phase1To8Jobs);
}

function checkPhase2Artifacts() {
  assert.deepEqual(CARTOGRAPHY_LAYER5_ARTIFACT_NAMES, ["target_profile_source_index", "activity_profile_source_index", "data_privacy_navigation_index", "cartography_index", "cartography_validation_manifest"]);
  assert.deepEqual(LEGAL_CARTOGRAPHY_ARTIFACT_NAMES, ["legal_cartography_deterministic_map", "legal_cartography_semantic_profile", "legal_cartography_index", "legal_signal_derivation_profile"]);
  assert.deepEqual(LEGAL_CARTOGRAPHY_OPTIONAL_ARTIFACT_NAMES, ["legal_cartography_reinvestigation_workpad"]);
  assert.deepEqual(PIPELINE_CONTRACTS.P2_INDEX_COMPILER_VALIDATION.writes, CARTOGRAPHY_LAYER5_ARTIFACT_NAMES);
}

function checkPhase3AInputs() {
  const reads = PIPELINE_CONTRACTS.M7_TARGET_PROFILE.reads;
  assert.deepEqual(reads, TARGET_PROFILE_REVIEW_CONTRACT.material_job.reads, "3A pipeline reads must match phase-owned contract reads");
  for (const required of ["source_discovery_handoff", "cartography_index", "target_profile_source_index", "legal_signal_derivation_profile", "domain_selection_profile", "active_run_package_manifest", ...targetProfileRoots]) assert.ok(reads.includes(required), `3A missing ${required}`);
  for (const forbidden of ["legal_cartography_index", "legal_doc_inventory", "legal_doc_extraction_index", "legal_doc_{DOC_TYPE}", "activity_profile_source_index", "data_privacy_navigation_index"]) assert.equal(reads.includes(forbidden), false, `3A must not read ${forbidden}`);
  assert.equal(TARGET_PROFILE_REVIEW_CONTRACT.boundary_rules.legal_signal_profile_is_only_legal_input_allowed, true);
}

function checkPhase3BInputsAndContract() {
  const phase3 = CENTRAL_PHASES.find((phase) => phase.central_phase_id === "TARGET_PROFILE_REVIEW");
  const contract = PIPELINE_CONTRACTS.P3_DOMAIN_DERIVATION_LAYER;
  const reads = contract.reads;
  assert.deepEqual([...phase3.internal_jobs], ["M7_TARGET_PROFILE", "P3_DOMAIN_DERIVATION_LAYER"]);
  assert.deepEqual(reads, DOMAIN_DERIVATION_CONTRACT.reads, "3B pipeline reads must match phase-owned contract reads");
  assert.deepEqual(contract.writes, DOMAIN_DERIVATION_ARTIFACT_NAMES);
  assert.equal(contract.agent_id, "agent_3_target_feature");
  assert.equal(contract.prompt_package_status, "PENDING_FINAL_PROMPT_AUTHORING");
  for (const required of ["source_discovery_handoff", "cartography_index", "target_profile_source_index", "activity_profile_source_index", "target_profile", "domain_selection_profile", "active_run_package_manifest", ...domainDerivationRoots]) assert.ok(reads.includes(required), `3B missing ${required}`);
  for (const forbidden of ["legal_cartography_index", "legal_signal_derivation_profile", "legal_doc_inventory", "legal_doc_extraction_index", "legal_doc_{DOC_TYPE}", "data_privacy_navigation_index", "lossless_root__privacy_data_processing", "lossless_root__security_trust", "lossless_root__trust_compliance"]) assert.equal(reads.includes(forbidden), false, `3B must not read ${forbidden}`);
  assert.equal(DOMAIN_DERIVATION_CONTRACT.boundary_rules.semantic_first_deterministic_gated, true);
  assert.equal(DOMAIN_DERIVATION_CONTRACT.boundary_rules.legal_cartography_index_forbidden, true);
  assert.equal(DOMAIN_DERIVATION_CONTRACT.boundary_rules.legal_signal_derivation_profile_forbidden, true);
  assert.equal(DOMAIN_DERIVATION_CONTRACT.boundary_rules.legal_lossless_evidence_forbidden, true);
}

function checkWritePermissions() {
  for (const jobId of phase1To8Jobs) {
    const contract = PIPELINE_CONTRACTS[jobId];
    const allowedWrites = INTERNAL_JOB_WRITE_PERMISSIONS[jobId] || [];
    for (const artifactName of contract.writes || []) assert.ok(allowedWrites.some((permission) => artifactMatchesPermission(artifactName, permission)), `${jobId} write ${artifactName} missing internal permission`);
    for (const artifactName of contract.optional_writes || []) assert.ok(allowedWrites.some((permission) => artifactMatchesPermission(artifactName, permission)), `${jobId} optional write ${artifactName} missing internal permission`);
    for (const artifactName of contract.dynamic_writes || []) assert.ok(allowedWrites.some((permission) => artifactMatchesPermission(artifactName.replace("{BATCH_ID}", "DAP-SEM-BATCH-01"), permission) || artifactMatchesPermission("legal_doc_terms_of_service", permission) || permission === artifactName), `${jobId} dynamic write ${artifactName} missing internal permission`);
  }
}

function checkNoRetiredArtifacts() {
  for (const retired of retiredActiveArtifacts) assert.equal(ARTIFACT_NAMES.includes(retired), false, `${retired} must not be active artifact`);
}

function checkPhase7DapBoundary() {
  assert.equal(PIPELINE_CONTRACT_STATUS.blocking_is_exception_noncritical_limitations_pass, true);
  assert.equal(PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT.navigation_rules.data_privacy_navigation_index_artifact_identity_preserved, true);
  assert.equal(PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT.navigation_rules.data_privacy_navigation_index_runtime_ownership_moved_to_phase2, true);
  assert.equal(PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT.blocking_is_exception_noncritical_limitations_pass, true);
  assert.deepEqual(PIPELINE_CONTRACTS.DATA_PROVENANCE_PROFILE_LAYER5.reads, ["dap_semantic_batch_route_manifest", ...PHASE7_DAP_BATCH_ARTIFACT_NAMES, ...Array.from({ length: 17 }, (_, index) => `dap_semantic_batch_validation__DAP-SEM-BATCH-${String(index + 1).padStart(2, "0")}`)]);
}
