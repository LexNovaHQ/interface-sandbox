import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  CARTOGRAPHY_ARTIFACT_NAMES,
  CARTOGRAPHY_LAYER1_ARTIFACT_NAMES,
  CARTOGRAPHY_LAYER2_ARTIFACT_NAMES,
  CARTOGRAPHY_LAYER3_ARTIFACT_NAMES,
  CARTOGRAPHY_LAYER4_ARTIFACT_NAMES,
  CARTOGRAPHY_LAYER5_ARTIFACT_NAMES,
  CARTOGRAPHY_SOURCE_INPUT_ARTIFACT_NAMES,
  COMMON_ROOT_CODES,
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

const ROOT = process.cwd();
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const runtimeFiles = [
  "src/runtime/contracts/artifact-permissions.contract.js",
  "src/runtime/contracts/pipeline.contract.js",
  "src/runtime/contracts/central-phase.contract.js",
  "src/runtime/contracts/artifacts.contract.js",
  "src/runtime/services/pipeline.service.js",
  "src/runtime/services/artifacts.service.js",
  "src/phase-contracts.js",
  "src/phases/02-cartography-index/cartography-index.contract.js",
  "src/phases/02-cartography-index/cartography-index.runner.js",
  "src/phases/02-cartography-index/target-profile-source-index.contract.js",
  "src/phases/02-cartography-index/services/target-profile-deterministic-map.builder.js",
  "src/phases/02-cartography-index/services/target-profile-source-index.compiler.js",
  "src/phases/02-cartography-index/validators/target-profile-semantic-profile.validator.js",
  "src/phases/02-cartography-index/validators/target-profile-source-index.validator.js",
  "src/phases/02-cartography-index/orchestrators/target-profile-source-index.orchestrator.js",
  "src/phases/02-legal-cartography-index/legal-cartography-index.contract.js",
  "src/phases/02-legal-cartography-index/services/legal-cartography-deterministic-map.builder.js",
  "src/phases/02-legal-cartography-index/services/legal-cartography-hybrid-compiler.js",
  "src/phases/02-legal-cartography-index/validators/legal-cartography-semantic-profile.validator.js",
  "src/phases/02-legal-cartography-index/validators/legal-cartography-index.validator.js",
  "src/phases/02-legal-cartography-index/orchestrators/legal-cartography-hybrid.orchestrator.js",
  "src/phases/07-data-provenance-profile/layer2-data-privacy-navigation-index-builder.js",
  "src/phases/07-data-provenance-profile/data-provenance-profile.runner.js",
  "agent-packages/phase_2a_target_profile_source_index/P2A_TARGET_PROFILE_SOURCE_INDEX_RUNTIME_BINDING_PACKET.yaml",
  "agent-packages/phase_2a_target_profile_source_index/P2A_TARGET_PROFILE_SOURCE_INDEX.md",
  "agent-packages/phase_2a_target_profile_source_index/P2A_TARGET_PROFILE_SOURCE_INDEX_REFERENCE_MAP.yaml",
  "agent-packages/phase_2a_target_profile_source_index/P2A_PACKET_MANIFEST.json",
  "agent-packages/agent_2b_m9/AGENT2B_M9_RUNTIME_BINDING_PACKET.yaml",
  "agent-packages/agent_2b_m9/00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md",
  "agent-packages/agent_2b_m9/04_M9_LEGAL_CARTOGRAPHY_RUNTIME_SYNC_PATCHED.md",
  "agent-packages/agent_2b_m9/M9_FIELD_DERIVATION_REGISTRY.yaml",
  "agent-packages/agent_2b_m9/M9_LEGAL_SIGNAL_DERIVATION_CONTRACT.md",
  "agent-packages/agent_2b_m9/M9_C_REINVESTIGATION.md",
  "agent-packages/agent_2b_m9/M9_HYBRID_COMPILER_CONTRACT.md",
  "agent-packages/agent_2b_m9/00_VALIDATOR_RULES_INTEGRATED.md",
  "agent-packages/agent_2b_m9/AGENT2B_M9_PACKET_MANIFEST.json",
  "agent-packages/agent_2b_m9/AGENT2B_M9_PACKET_VALIDATION.json"
];
const activeText = runtimeFiles.map(read).join("\n");

const LOCKED_ROOTS = Object.freeze(["homepage_landing", "company_identity", "contact_notice", "product_service", "platform_feature_solution", "technical_docs_api", "docs_api_data_flow", "integrations_ecosystem", "pricing_commercial_availability", "use_case_customer_industry", "privacy_data_processing", "security_trust_compliance", "data_governance_controls", "ai_safety_transparency", "support_help_resources", "regulatory_licensing_status", "grievance_complaints"]);
const PRIMARY_FULL = Object.freeze(["company_identity", "contact_notice", "product_service", "platform_feature_solution", "technical_docs_api", "docs_api_data_flow", "privacy_data_processing", "security_trust_compliance", "data_governance_controls", "ai_safety_transparency", "regulatory_licensing_status", "grievance_complaints"]);
const SECONDARY_CONDITIONAL = Object.freeze(["integrations_ecosystem", "pricing_commercial_availability", "use_case_customer_industry", "support_help_resources"]);
const RETIRED_ROOTS = Object.freeze(["about_company", "legal_identity_notice", "operator_entity_signals", "supporting_company_signals", "security_trust", "trust_compliance", "support_help", "blog_resources", "careers_hiring", "public_repository_developer_assets", "third_party_profiles", "technical_docs_api_developer"]);

assert.deepEqual(COMMON_ROOT_CODES, LOCKED_ROOTS, "artifact permissions must accept the Phase 1 v5 17-root source universe");
for (const root of ["lossless_root__regulatory_licensing_status", "lossless_root__grievance_complaints"]) {
  assert.ok(CARTOGRAPHY_SOURCE_INPUT_ARTIFACT_NAMES.includes(root), `Phase 2 source inputs must accept ${root}`);
  assert.ok(READ_PERMISSIONS.agent_2_cartography_index.includes(root), `cartography agent must read ${root}`);
  assert.ok(READ_PERMISSIONS.agent_2b_m9.includes(root), `M9 must read ${root}`);
  assert.ok(M9_PHASE1_V5_READS.includes(root), `M9 contract reads must include ${root}`);
}

assert.equal(CARTOGRAPHY_INDEX_CONTRACT.implementation_status, "INPUT_CONTRACT_SYNCED_TO_PHASE1_V5_17_ROOT_MULTI_DOMAIN_UNION_PROBE");
assert.equal(CARTOGRAPHY_INDEX_CONTRACT.phase1_input_contract.contract_version, "PHASE2_INPUT_CONTRACT_v3_PHASE1_17_ROOT_MULTI_DOMAIN");
assert.equal(CARTOGRAPHY_INDEX_CONTRACT.phase1_input_contract.source_discovery_contract_floor, "PHASE_OWNED_IMPLEMENTATION_AGNOSTIC_V5_MULTI_DOMAIN_UNION_PROBE_17_ROOT");
assert.deepEqual(CARTOGRAPHY_INDEX_CONTRACT.phase1_input_contract.locked_common_roots, LOCKED_ROOTS);
assert.deepEqual(CARTOGRAPHY_INDEX_CONTRACT.phase1_input_contract.primary_full_extract_roots, PRIMARY_FULL);
assert.deepEqual(CARTOGRAPHY_INDEX_CONTRACT.phase1_input_contract.secondary_conditional_roots, SECONDARY_CONDITIONAL);
assert.deepEqual(CARTOGRAPHY_INDEX_CONTRACT.phase1_input_contract.retired_root_inputs_forbidden, RETIRED_ROOTS);
assert.equal(CARTOGRAPHY_INDEX_CONTRACT.phase1_input_contract.multi_domain_union_probe_policy.required, true);
assert.equal(CARTOGRAPHY_INDEX_CONTRACT.phase1_input_contract.classification_boundary.phase_2_may_not_lock_domain, true);
assert.deepEqual(CARTOGRAPHY_INDEX_CONTRACT.phase2_profile_input_routes.target_profile_source_index.roots, ["homepage_landing", "company_identity", "contact_notice", "pricing_commercial_availability", "regulatory_licensing_status", "grievance_complaints"]);
assert.deepEqual(CARTOGRAPHY_INDEX_CONTRACT.phase2_profile_input_routes.data_privacy_navigation_index.roots, ["privacy_data_processing", "security_trust_compliance", "data_governance_controls", "technical_docs_api", "docs_api_data_flow", "integrations_ecosystem", "ai_safety_transparency", "regulatory_licensing_status", "grievance_complaints"]);
assert.deepEqual(CARTOGRAPHY_INDEX_CONTRACT.phase2_profile_input_routes.legal_cartography_index.roots, ["company_identity", "contact_notice", "privacy_data_processing", "security_trust_compliance", "data_governance_controls", "ai_safety_transparency", "regulatory_licensing_status", "grievance_complaints"]);
for (const retired of RETIRED_ROOTS) for (const route of Object.values(CARTOGRAPHY_INDEX_CONTRACT.phase2_profile_input_routes)) assert.ok(!(route.roots || []).includes(retired), `Phase 2 route includes retired root ${retired}`);

assert.equal(LEGAL_CARTOGRAPHY_INDEX_CONTRACT.implementation_status, "M9_MAIN_RESTORED_PHASE1_V5_17_ROOT_REGULATORY_GRIEVANCE_SYNC");
assert.deepEqual(LEGAL_CARTOGRAPHY_INDEX_CONTRACT.restored_main_m9_input_contract, M9_PHASE1_V5_READS);
assert.deepEqual(LEGAL_CARTOGRAPHY_INDEX_CONTRACT.required_save_order, ["legal_cartography_deterministic_map", "legal_cartography_semantic_profile", "legal_cartography_index", "legal_signal_derivation_profile"]);
assert.equal(LEGAL_CARTOGRAPHY_INDEX_CONTRACT.jobs.LEGAL_CARTOGRAPHY_INDEX.boundary_rules.target_profile_legal_signal_locators_owned_by_2a, true);
assert.equal(LEGAL_CARTOGRAPHY_INDEX_CONTRACT.compatibility_boundary.legal_signal_derivation_profile_preserved, true);

assert.deepEqual(LEGAL_CARTOGRAPHY_ARTIFACT_NAMES, ["legal_cartography_deterministic_map", "legal_cartography_semantic_profile", "legal_cartography_index", "legal_signal_derivation_profile"]);
assert.deepEqual(LEGAL_CARTOGRAPHY_OPTIONAL_ARTIFACT_NAMES, ["legal_cartography_reinvestigation_workpad"]);
assert.deepEqual(TARGET_PROFILE_SOURCE_INDEX_ARTIFACT_NAMES, ["target_profile_deterministic_map", "target_profile_semantic_profile", "target_profile_source_index"]);
assert.deepEqual(CARTOGRAPHY_LAYER1_ARTIFACT_NAMES, ["cartography_source_inventory"]);
assert.deepEqual(CARTOGRAPHY_LAYER2_ARTIFACT_NAMES, ["cartography_locator_spine"]);
assert.deepEqual(CARTOGRAPHY_LAYER3_ARTIFACT_NAMES, ["cartography_profile_route_matrix"]);
assert.deepEqual(CARTOGRAPHY_LAYER4_ARTIFACT_NAMES, ["cartography_semantic_navigation_overlay"]);
assert.deepEqual(CARTOGRAPHY_LAYER5_ARTIFACT_NAMES, ["activity_profile_source_index", "data_privacy_navigation_index", "cartography_index", "cartography_validation_manifest"]);
assert.ok(CARTOGRAPHY_ARTIFACT_NAMES.includes("target_profile_source_index"));
assert.equal(CARTOGRAPHY_LAYER5_ARTIFACT_NAMES.includes("target_profile_source_index"), false);

assert.deepEqual(WRITE_PERMISSIONS.agent_2b_m9, [...LEGAL_CARTOGRAPHY_ARTIFACT_NAMES, ...LEGAL_CARTOGRAPHY_OPTIONAL_ARTIFACT_NAMES]);
assert.deepEqual(INTERNAL_JOB_WRITE_PERMISSIONS.P2A_TARGET_PROFILE_SOURCE_INDEX, TARGET_PROFILE_SOURCE_INDEX_ARTIFACT_NAMES);
assert.deepEqual(PIPELINE_CONTRACTS.M9.writes, LEGAL_CARTOGRAPHY_ARTIFACT_NAMES);
assert.deepEqual(PIPELINE_CONTRACTS.M9.optional_writes, LEGAL_CARTOGRAPHY_OPTIONAL_ARTIFACT_NAMES);
assert.equal(PIPELINE_CONTRACTS.M9.next, "P2A_TARGET_PROFILE_SOURCE_INDEX");
assert.deepEqual(PIPELINE_CONTRACTS.P2A_TARGET_PROFILE_SOURCE_INDEX.writes, TARGET_PROFILE_SOURCE_INDEX_ARTIFACT_NAMES);
assert.equal(PIPELINE_CONTRACTS.P2A_TARGET_PROFILE_SOURCE_INDEX.next, "P2_INDEX_COMPILER_VALIDATION");
assert.ok(PIPELINE_CONTRACTS.P2A_TARGET_PROFILE_SOURCE_INDEX.prompt_files.some((file) => file.includes("phase_2a_target_profile_source_index")));
assert.ok(PIPELINE_CONTRACTS.P2_INDEX_COMPILER_VALIDATION.reads.includes("target_profile_source_index"));
assert.equal(PIPELINE_CONTRACTS.P2_INDEX_COMPILER_VALIDATION.writes.includes("target_profile_source_index"), false);

const expectedJobs = ["P2_SOURCE_INVENTORY_CARTOGRAPHY", "P2_LOCATOR_SPINE", "P2_PROFILE_ROUTE_MATRIX", "P2_SEMANTIC_NAVIGATION_OVERLAY", "M9", "P2A_TARGET_PROFILE_SOURCE_INDEX", "P2_INDEX_COMPILER_VALIDATION"];
for (const jobId of expectedJobs) {
  assert.ok(INTERNAL_PIPELINE_JOB_IDS.includes(jobId), `pipeline missing ${jobId}`);
  assert.ok(PIPELINE_CONTRACTS[jobId], `contract missing ${jobId}`);
  assert.ok(INTERNAL_JOB_WRITE_PERMISSIONS[jobId], `write permission missing ${jobId}`);
}
const centralPhase2 = CENTRAL_PHASES.find((phase) => phase.sequence === 2);
assert.equal(centralPhase2.central_phase_id, "CARTOGRAPHY_INDEX");
assert.deepEqual(centralPhase2.internal_jobs, expectedJobs);
for (const artifact of TARGET_PROFILE_SOURCE_INDEX_ARTIFACT_NAMES) assert.ok(centralPhase2.terminal_outputs.includes(artifact), `central phase missing ${artifact}`);

for (const forbidden of ["legal_governance_source_index", "data_provenance_source_index", "lossless_family__", "compatibility.adapter", "CompatibilityArtifacts", "compatibility_adapter"]) assert.equal(activeText.includes(forbidden), false, `forbidden old/input-pollution marker present: ${forbidden}`);
for (const forbidden of ["license_validity", "license_requirement", "applicable_regulator", "regulatory_compliance_status", "grievance_sufficiency", "grievance_compliance_status", "ombudsman_requirement"]) assert.ok(activeText.includes(forbidden), `Phase 2 package must explicitly forbid ${forbidden}`);
for (const required of ["phase1_v5", "P2A_TARGET_PROFILE_SOURCE_INDEX", "target_profile_deterministic_map", "target_profile_semantic_profile", "target_profile_source_index", "lossless_root__regulatory_licensing_status", "lossless_root__grievance_complaints", "regulatory_governance_locator", "grievance_redressal_locator", "target_profile_legal_signal_locators_owned_by_2a", "full_legal_governance_cartography_owned_by_2e", "cartography_validation_manifest", "contains_lossless_text: false", "semantic_guidance_only"]) assert.ok(activeText.includes(required), `active files missing ${required}`);

assert.equal(PIPELINE_CONTRACT_STATUS.phase2a_target_profile_source_index_runtime_wired, true);
assert.equal(PIPELINE_CONTRACT_STATUS.phase2a_target_profile_source_index_owns_target_index, true);
assert.equal(PIPELINE_CONTRACT_STATUS.m9_legal_cartography_index_preserved_in_phase2, true);
assert.equal(PIPELINE_CONTRACT_STATUS.legal_signal_derivation_preserved_in_phase2, true);
assert.equal(PIPELINE_CONTRACT_STATUS.no_legal_governance_source_index, true);
assert.equal(PIPELINE_CONTRACT_STATUS.no_data_provenance_source_index, true);

console.log("Phase 2 cartography + P2A runtime wiring validator: PASS");
