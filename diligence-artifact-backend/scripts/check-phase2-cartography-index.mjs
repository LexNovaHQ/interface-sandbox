import assert from "node:assert/strict";
import {
  ACTIVITY_PROFILE_SOURCE_INDEX_ARTIFACT_NAMES,
  CARTOGRAPHY_ARTIFACT_NAMES,
  CARTOGRAPHY_LAYER1_ARTIFACT_NAMES,
  CARTOGRAPHY_LAYER2_ARTIFACT_NAMES,
  CARTOGRAPHY_LAYER3_ARTIFACT_NAMES,
  CARTOGRAPHY_LAYER4_ARTIFACT_NAMES,
  CARTOGRAPHY_LAYER5_ARTIFACT_NAMES,
  CARTOGRAPHY_SOURCE_INPUT_ARTIFACT_NAMES,
  COMMON_ROOT_CODES,
  DATA_PRIVACY_NAVIGATION_INDEX_ARTIFACT_NAMES,
  DATA_PROVENANCE_SOURCE_ARTIFACT_NAMES,
  DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX_ARTIFACT_NAMES,
  DOMAIN_CONTROL_OBLIGATION_SOURCE_ARTIFACT_NAMES,
  DOMAIN_DERIVATION_SOURCE_INDEX_ARTIFACT_NAMES,
  INTERNAL_JOB_WRITE_PERMISSIONS,
  LEGAL_CARTOGRAPHY_ARTIFACT_NAMES,
  LEGAL_CARTOGRAPHY_OPTIONAL_ARTIFACT_NAMES,
  READ_PERMISSIONS,
  TARGET_PROFILE_SOURCE_INDEX_ARTIFACT_NAMES,
  WRITE_PERMISSIONS
} from "../src/runtime/contracts/artifact-permissions.contract.js";
import { PIPELINE_CONTRACTS, INTERNAL_PIPELINE_JOB_IDS, PIPELINE_CONTRACT_STATUS } from "../src/runtime/contracts/pipeline.contract.js";
import { CENTRAL_PHASES } from "../src/runtime/contracts/central-phase.contract.js";
import { CARTOGRAPHY_INDEX_CONTRACT } from "../src/phases/02-cartography-index/cartography-index.contract.js";
import { LEGAL_CARTOGRAPHY_INDEX_CONTRACT, M9_PHASE1_V5_READS } from "../src/phases/02-legal-cartography-index/legal-cartography-index.contract.js";

const LOCKED_ROOTS = Object.freeze(["homepage_landing", "company_identity", "contact_notice", "product_service", "platform_feature_solution", "technical_docs_api", "docs_api_data_flow", "integrations_ecosystem", "pricing_commercial_availability", "use_case_customer_industry", "privacy_data_processing", "security_trust_compliance", "data_governance_controls", "ai_safety_transparency", "support_help_resources", "regulatory_licensing_status", "grievance_complaints"]);
const DOMAIN_DERIVATION_ROOTS = Object.freeze(["homepage_landing", "company_identity", "product_service", "platform_feature_solution", "technical_docs_api", "docs_api_data_flow", "pricing_commercial_availability", "use_case_customer_industry", "integrations_ecosystem", "ai_safety_transparency", "regulatory_licensing_status", "grievance_complaints"]);
const ACTIVITY_PROFILE_ROOTS = Object.freeze(["product_service", "platform_feature_solution", "technical_docs_api", "docs_api_data_flow", "integrations_ecosystem", "pricing_commercial_availability", "use_case_customer_industry", "support_help_resources", "ai_safety_transparency"]);
const DATA_PRIVACY_ROOTS = Object.freeze(["privacy_data_processing", "security_trust_compliance", "data_governance_controls", "technical_docs_api", "docs_api_data_flow", "integrations_ecosystem", "ai_safety_transparency", "regulatory_licensing_status", "grievance_complaints"]);
const DOMAIN_CONTROL_OBLIGATION_ROOTS = Object.freeze(["regulatory_licensing_status", "grievance_complaints", "security_trust_compliance", "data_governance_controls", "product_service", "platform_feature_solution", "pricing_commercial_availability", "company_identity", "ai_safety_transparency", "homepage_landing"]);

assert.deepEqual(COMMON_ROOT_CODES, LOCKED_ROOTS);
for (const root of ["lossless_root__regulatory_licensing_status", "lossless_root__grievance_complaints"]) {
  assert.ok(CARTOGRAPHY_SOURCE_INPUT_ARTIFACT_NAMES.includes(root), `Phase 2 source inputs must accept ${root}`);
  assert.ok(READ_PERMISSIONS.agent_2_cartography_index.includes(root), `cartography agent must read ${root}`);
  assert.ok(READ_PERMISSIONS.agent_2b_m9.includes(root), `M9 must read ${root}`);
  assert.ok(M9_PHASE1_V5_READS.includes(root), `M9 contract reads must include ${root}`);
}

assert.equal(CARTOGRAPHY_INDEX_CONTRACT.implementation_status, "INPUT_CONTRACT_SYNCED_TO_PHASE1_V5_17_ROOT_MULTI_DOMAIN_UNION_PROBE_P2E_DOMAIN_CONTROL_OBLIGATION_NAV_INDEX");
assert.equal(CARTOGRAPHY_INDEX_CONTRACT.phase1_input_contract.contract_version, "PHASE2_INPUT_CONTRACT_v3_PHASE1_17_ROOT_MULTI_DOMAIN");
assert.equal(CARTOGRAPHY_INDEX_CONTRACT.phase1_input_contract.source_discovery_contract_floor, "PHASE_OWNED_IMPLEMENTATION_AGNOSTIC_V5_MULTI_DOMAIN_UNION_PROBE_17_ROOT");
assert.deepEqual(CARTOGRAPHY_INDEX_CONTRACT.phase1_input_contract.locked_common_roots, LOCKED_ROOTS);
assert.deepEqual(CARTOGRAPHY_INDEX_CONTRACT.phase2_profile_input_routes.domain_derivation_source_index.roots, DOMAIN_DERIVATION_ROOTS);
assert.deepEqual(CARTOGRAPHY_INDEX_CONTRACT.phase2_profile_input_routes.activity_profile_source_index.roots, ACTIVITY_PROFILE_ROOTS);
assert.equal(CARTOGRAPHY_INDEX_CONTRACT.phase2_profile_input_routes.activity_profile_source_index.owned_by, "P2C_ACTIVITY_PROFILE_SOURCE_INDEX");
assert.deepEqual(CARTOGRAPHY_INDEX_CONTRACT.phase2_profile_input_routes.data_privacy_navigation_index.roots, DATA_PRIVACY_ROOTS);
assert.equal(CARTOGRAPHY_INDEX_CONTRACT.phase2_profile_input_routes.data_privacy_navigation_index.owned_by, "P2D_DATA_PRIVACY_NAVIGATION_INDEX");
assert.equal(CARTOGRAPHY_INDEX_CONTRACT.phase2_profile_input_routes.data_privacy_navigation_index.emits_data_profile_values, false);
assert.equal(CARTOGRAPHY_INDEX_CONTRACT.phase2_profile_input_routes.data_privacy_navigation_index.old_d_family_inputs_forbidden, true);
assert.deepEqual(CARTOGRAPHY_INDEX_CONTRACT.phase2_profile_input_routes.domain_control_obligation_navigation_index.roots, DOMAIN_CONTROL_OBLIGATION_ROOTS);
assert.equal(CARTOGRAPHY_INDEX_CONTRACT.phase2_profile_input_routes.domain_control_obligation_navigation_index.owned_by, "P2E_DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX");
assert.equal(CARTOGRAPHY_INDEX_CONTRACT.phase2_profile_input_routes.domain_control_obligation_navigation_index.new_missing_index, true);
assert.equal(CARTOGRAPHY_INDEX_CONTRACT.phase2_profile_input_routes.domain_control_obligation_navigation_index.obligation_catalog_driven, true);
assert.equal(CARTOGRAPHY_INDEX_CONTRACT.phase2_profile_input_routes.domain_control_obligation_navigation_index.domain_blind, true);
assert.equal(CARTOGRAPHY_INDEX_CONTRACT.phase2_profile_input_routes.domain_control_obligation_navigation_index.emits_obligation_posture, false);
assert.equal(CARTOGRAPHY_INDEX_CONTRACT.migration_boundary.data_privacy_navigation_index_owned_by_2d, true);
assert.equal(CARTOGRAPHY_INDEX_CONTRACT.migration_boundary.domain_control_obligation_navigation_index_owned_by_2e, true);
assert.equal(CARTOGRAPHY_INDEX_CONTRACT.doctrine.data_privacy_navigation_index_runtime_ownership_moves_to_phase_2d, true);
assert.equal(CARTOGRAPHY_INDEX_CONTRACT.doctrine.domain_control_obligation_navigation_index_runtime_ownership_moves_to_phase_2e, true);

assert.equal(LEGAL_CARTOGRAPHY_INDEX_CONTRACT.implementation_status, "M9_MAIN_RESTORED_PHASE1_V5_17_ROOT_REGULATORY_GRIEVANCE_SYNC");
assert.deepEqual(LEGAL_CARTOGRAPHY_INDEX_CONTRACT.restored_main_m9_input_contract, M9_PHASE1_V5_READS);
assert.deepEqual(LEGAL_CARTOGRAPHY_INDEX_CONTRACT.required_save_order, ["legal_cartography_deterministic_map", "legal_cartography_semantic_profile", "legal_cartography_index", "legal_signal_derivation_profile"]);

assert.deepEqual(LEGAL_CARTOGRAPHY_ARTIFACT_NAMES, ["legal_cartography_deterministic_map", "legal_cartography_semantic_profile", "legal_cartography_index", "legal_signal_derivation_profile"]);
assert.deepEqual(LEGAL_CARTOGRAPHY_OPTIONAL_ARTIFACT_NAMES, ["legal_cartography_reinvestigation_workpad"]);
assert.deepEqual(TARGET_PROFILE_SOURCE_INDEX_ARTIFACT_NAMES, ["target_profile_deterministic_map", "target_profile_semantic_profile", "target_profile_source_index"]);
assert.deepEqual(DOMAIN_DERIVATION_SOURCE_INDEX_ARTIFACT_NAMES, ["domain_derivation_deterministic_map", "domain_derivation_semantic_profile", "domain_derivation_source_index"]);
assert.deepEqual(ACTIVITY_PROFILE_SOURCE_INDEX_ARTIFACT_NAMES, ["activity_profile_deterministic_map", "activity_profile_semantic_profile", "activity_profile_source_index"]);
assert.deepEqual(DATA_PRIVACY_NAVIGATION_INDEX_ARTIFACT_NAMES, ["data_privacy_deterministic_map", "data_privacy_semantic_profile", "data_privacy_navigation_index"]);
assert.deepEqual(DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX_ARTIFACT_NAMES, ["domain_control_obligation_deterministic_map", "domain_control_obligation_semantic_profile", "domain_control_obligation_navigation_index"]);
assert.deepEqual(DATA_PROVENANCE_SOURCE_ARTIFACT_NAMES, DATA_PRIVACY_ROOTS.map((root) => `lossless_root__${root}`));
assert.deepEqual(DOMAIN_CONTROL_OBLIGATION_SOURCE_ARTIFACT_NAMES, DOMAIN_CONTROL_OBLIGATION_ROOTS.map((root) => `lossless_root__${root}`));
assert.deepEqual(CARTOGRAPHY_LAYER1_ARTIFACT_NAMES, ["cartography_source_inventory"]);
assert.deepEqual(CARTOGRAPHY_LAYER2_ARTIFACT_NAMES, ["cartography_locator_spine"]);
assert.deepEqual(CARTOGRAPHY_LAYER3_ARTIFACT_NAMES, ["cartography_profile_route_matrix"]);
assert.deepEqual(CARTOGRAPHY_LAYER4_ARTIFACT_NAMES, ["cartography_semantic_navigation_overlay"]);
assert.deepEqual(CARTOGRAPHY_LAYER5_ARTIFACT_NAMES, ["cartography_index", "cartography_validation_manifest"]);
for (const artifact of ["target_profile_source_index", "domain_derivation_source_index", "activity_profile_source_index", "data_privacy_navigation_index", "domain_control_obligation_navigation_index"]) assert.ok(CARTOGRAPHY_ARTIFACT_NAMES.includes(artifact));
for (const artifact of ["target_profile_source_index", "domain_derivation_source_index", "activity_profile_source_index", "data_privacy_navigation_index", "domain_control_obligation_navigation_index"]) assert.equal(CARTOGRAPHY_LAYER5_ARTIFACT_NAMES.includes(artifact), false, `Layer5 must not own ${artifact}`);

assert.deepEqual(WRITE_PERMISSIONS.agent_2b_m9, [...LEGAL_CARTOGRAPHY_ARTIFACT_NAMES, ...LEGAL_CARTOGRAPHY_OPTIONAL_ARTIFACT_NAMES]);
assert.deepEqual(INTERNAL_JOB_WRITE_PERMISSIONS.P2A_TARGET_PROFILE_SOURCE_INDEX, TARGET_PROFILE_SOURCE_INDEX_ARTIFACT_NAMES);
assert.deepEqual(INTERNAL_JOB_WRITE_PERMISSIONS.P2B_DOMAIN_DERIVATION_SOURCE_INDEX, DOMAIN_DERIVATION_SOURCE_INDEX_ARTIFACT_NAMES);
assert.deepEqual(INTERNAL_JOB_WRITE_PERMISSIONS.P2C_ACTIVITY_PROFILE_SOURCE_INDEX, ACTIVITY_PROFILE_SOURCE_INDEX_ARTIFACT_NAMES);
assert.deepEqual(INTERNAL_JOB_WRITE_PERMISSIONS.P2D_DATA_PRIVACY_NAVIGATION_INDEX, DATA_PRIVACY_NAVIGATION_INDEX_ARTIFACT_NAMES);
assert.deepEqual(INTERNAL_JOB_WRITE_PERMISSIONS.P2E_DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX, DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX_ARTIFACT_NAMES);
assert.deepEqual(INTERNAL_JOB_WRITE_PERMISSIONS.P2_INDEX_COMPILER_VALIDATION, CARTOGRAPHY_LAYER5_ARTIFACT_NAMES);
assert.deepEqual(PIPELINE_CONTRACTS.M9.writes, LEGAL_CARTOGRAPHY_ARTIFACT_NAMES);
assert.deepEqual(PIPELINE_CONTRACTS.P2A_TARGET_PROFILE_SOURCE_INDEX.writes, TARGET_PROFILE_SOURCE_INDEX_ARTIFACT_NAMES);
assert.deepEqual(PIPELINE_CONTRACTS.P2B_DOMAIN_DERIVATION_SOURCE_INDEX.writes, DOMAIN_DERIVATION_SOURCE_INDEX_ARTIFACT_NAMES);
assert.deepEqual(PIPELINE_CONTRACTS.P2C_ACTIVITY_PROFILE_SOURCE_INDEX.writes, ACTIVITY_PROFILE_SOURCE_INDEX_ARTIFACT_NAMES);
assert.deepEqual(PIPELINE_CONTRACTS.P2D_DATA_PRIVACY_NAVIGATION_INDEX.writes, DATA_PRIVACY_NAVIGATION_INDEX_ARTIFACT_NAMES);
assert.deepEqual(PIPELINE_CONTRACTS.P2E_DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX.writes, DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX_ARTIFACT_NAMES);
assert.deepEqual(PIPELINE_CONTRACTS.P2_INDEX_COMPILER_VALIDATION.writes, CARTOGRAPHY_LAYER5_ARTIFACT_NAMES);
assert.equal(PIPELINE_CONTRACTS.P2C_ACTIVITY_PROFILE_SOURCE_INDEX.next, "P2D_DATA_PRIVACY_NAVIGATION_INDEX");
assert.equal(PIPELINE_CONTRACTS.P2D_DATA_PRIVACY_NAVIGATION_INDEX.next, "P2E_DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX");
assert.equal(PIPELINE_CONTRACTS.P2E_DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX.next, "P2_INDEX_COMPILER_VALIDATION");
assert.ok(PIPELINE_CONTRACTS.P2_INDEX_COMPILER_VALIDATION.reads.includes("data_privacy_navigation_index"));
assert.ok(PIPELINE_CONTRACTS.P2_INDEX_COMPILER_VALIDATION.reads.includes("domain_control_obligation_navigation_index"));
assert.equal(PIPELINE_CONTRACTS.P2_INDEX_COMPILER_VALIDATION.writes.includes("data_privacy_navigation_index"), false);
assert.equal(PIPELINE_CONTRACTS.P2_INDEX_COMPILER_VALIDATION.writes.includes("domain_control_obligation_navigation_index"), false);
assert.ok(PIPELINE_CONTRACTS.DATA_PROVENANCE_PROFILE_LAYER4.reads.includes("data_privacy_navigation_index"));
assert.equal(PIPELINE_CONTRACTS.DATA_PROVENANCE_PROFILE_LAYER4.runtime_wiring_status, "PHASE7_READS_PHASE2D_DPNI");
assert.ok(INTERNAL_PIPELINE_JOB_IDS.includes("P2D_DATA_PRIVACY_NAVIGATION_INDEX"));
assert.ok(INTERNAL_PIPELINE_JOB_IDS.includes("P2E_DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX"));
assert.deepEqual(CENTRAL_PHASES.find((p) => p.sequence === 2).internal_jobs.filter((id) => id.startsWith("P2") || id === "M9"), ["P2_SOURCE_INVENTORY_CARTOGRAPHY", "P2_LOCATOR_SPINE", "P2_PROFILE_ROUTE_MATRIX", "P2_SEMANTIC_NAVIGATION_OVERLAY", "M9", "P2A_TARGET_PROFILE_SOURCE_INDEX", "P2B_DOMAIN_DERIVATION_SOURCE_INDEX", "P2C_ACTIVITY_PROFILE_SOURCE_INDEX", "P2D_DATA_PRIVACY_NAVIGATION_INDEX", "P2E_DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX", "P2_INDEX_COMPILER_VALIDATION"]);
assert.equal(PIPELINE_CONTRACT_STATUS.phase2d_data_privacy_navigation_index_runtime_wired, true);
assert.equal(PIPELINE_CONTRACT_STATUS.phase2d_data_privacy_navigation_index_owns_dpni, true);
assert.equal(PIPELINE_CONTRACT_STATUS.phase2e_domain_control_obligation_navigation_index_declared, true);
assert.equal(PIPELINE_CONTRACT_STATUS.phase2e_domain_control_obligation_navigation_index_owns_obligation_index, true);
assert.equal(PIPELINE_CONTRACT_STATUS.no_data_provenance_source_index, true);
assert.ok(CARTOGRAPHY_INDEX_CONTRACT.downstream_contract.domain_control_obligation_reads.includes("domain_control_obligation_navigation_index"));
assert.equal(CARTOGRAPHY_INDEX_CONTRACT.forbidden_new_artifacts.includes("domain_control_obligation_navigation_index"), false);

console.log(JSON.stringify({ check: "phase2 cartography index", status: "PASS", phase2d_data_privacy_navigation_index_owned_by_2d: true, phase2e_domain_control_obligation_navigation_index_owned_by_2e: true }, null, 2));
