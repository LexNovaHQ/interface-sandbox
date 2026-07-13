import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PIPELINE_CONTRACTS, INTERNAL_PIPELINE_JOB_IDS, PIPELINE_CONTRACT_STATUS } from "../src/runtime/contracts/pipeline.contract.js";
import { CENTRAL_PHASES } from "../src/runtime/contracts/central-phase.contract.js";
import {
  ACTIVITY_PROFILE_SOURCE_INDEX_ARTIFACT_NAMES,
  ARTIFACT_NAMES,
  DATA_PRIVACY_NAVIGATION_INDEX_ARTIFACT_NAMES,
  DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX_ARTIFACT_NAMES,
  DOMAIN_DERIVATION_ARTIFACT_NAMES,
  DOMAIN_DERIVATION_SOURCE_INDEX_ARTIFACT_NAMES,
  INTERNAL_JOB_WRITE_PERMISSIONS,
  PHASE_ROUTING_ARTIFACT_NAMES,
  artifactMatchesPermission
} from "../src/runtime/contracts/artifact-permissions.contract.js";
import { DOMAIN_DERIVATION_CONTRACT } from "../src/phases/03-domain-derivation/domain-derivation.contract.js";
import { P2G_RUNTIME_ROUTE_BY_JOB } from "../src/phases/02-cartography-index/services/phase-route-runtime.reader.js";

const read = (file) => fs.readFileSync(path.join(process.cwd(), file), "utf8");
const chain = ["AGENT_1A_URL_MANIFEST", "AGENT_1B_EXTRACT", "M6_BUCKET_INDEX", "P2_SOURCE_INVENTORY_CARTOGRAPHY", "P2_LOCATOR_SPINE", "P2_PROFILE_ROUTE_MATRIX", "P2_SEMANTIC_NAVIGATION_OVERLAY", "M9", "P2A_TARGET_PROFILE_SOURCE_INDEX", "P2B_DOMAIN_DERIVATION_SOURCE_INDEX", "P2C_ACTIVITY_PROFILE_SOURCE_INDEX", "P2D_DATA_PRIVACY_NAVIGATION_INDEX", "P2E_DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX", "P2G_PHASE_ROUTER", "P2_INDEX_COMPILER_VALIDATION", "M7_TARGET_PROFILE", "P3_DOMAIN_DERIVATION_LAYER", "M7_TARGET_PROFILE_FORENSICS", "M8_FEATURE_CANDIDATE_INVENTORY", "M8_TARGET_FEATURE_PROFILE", "M8_TARGET_FEATURE_PROFILE_FORENSICS", "DATA_PROVENANCE_PROFILE_LAYER4", "DATA_PROVENANCE_PROFILE_LAYER5", "DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY", "DOMAIN_CONTROL_OBLIGATION_PROFILE"];
const routedPhase1To8Jobs = ["M7_TARGET_PROFILE", "P3_DOMAIN_DERIVATION_LAYER", "M7_TARGET_PROFILE_FORENSICS", "M8_FEATURE_CANDIDATE_INVENTORY", "M8_TARGET_FEATURE_PROFILE", "M8_TARGET_FEATURE_PROFILE_FORENSICS", "DATA_PROVENANCE_PROFILE_LAYER4", "DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY", "DOMAIN_CONTROL_OBLIGATION_PROFILE"];
const tRoots = ["lossless_root__homepage_landing", "lossless_root__company_identity", "lossless_root__contact_notice", "lossless_root__pricing_commercial_availability", "lossless_root__regulatory_licensing_status", "lossless_root__grievance_complaints"];
const dRoots = ["lossless_root__homepage_landing", "lossless_root__company_identity", "lossless_root__product_service", "lossless_root__platform_feature_solution", "lossless_root__technical_docs_api", "lossless_root__docs_api_data_flow", "lossless_root__pricing_commercial_availability", "lossless_root__use_case_customer_industry", "lossless_root__integrations_ecosystem", "lossless_root__ai_safety_transparency", "lossless_root__regulatory_licensing_status", "lossless_root__grievance_complaints"];
const aRoots = ["lossless_root__product_service", "lossless_root__platform_feature_solution", "lossless_root__technical_docs_api", "lossless_root__docs_api_data_flow", "lossless_root__integrations_ecosystem", "lossless_root__pricing_commercial_availability", "lossless_root__use_case_customer_industry", "lossless_root__support_help_resources", "lossless_root__ai_safety_transparency"];
const dpRoots = ["lossless_root__privacy_data_processing", "lossless_root__security_trust_compliance", "lossless_root__data_governance_controls", "lossless_root__technical_docs_api", "lossless_root__docs_api_data_flow", "lossless_root__integrations_ecosystem", "lossless_root__ai_safety_transparency", "lossless_root__regulatory_licensing_status", "lossless_root__grievance_complaints"];
const dconiRoots = ["lossless_root__regulatory_licensing_status", "lossless_root__grievance_complaints", "lossless_root__security_trust_compliance", "lossless_root__data_governance_controls", "lossless_root__product_service", "lossless_root__platform_feature_solution", "lossless_root__pricing_commercial_availability", "lossless_root__company_identity", "lossless_root__ai_safety_transparency", "lossless_root__homepage_landing"];

assert.equal(JSON.parse(read("package.json")).scripts.start, "node src/runtime/main.js");
assert.ok(read("server.js").includes("./src/runtime/main.js"));
assert.deepEqual(INTERNAL_PIPELINE_JOB_IDS.slice(0, chain.length), chain);
assert.deepEqual(CENTRAL_PHASES.filter((phase) => phase.sequence <= 8).flatMap((phase) => [...phase.internal_jobs]), chain);
for (const id of chain) {
  assert.ok(PIPELINE_CONTRACTS[id], `missing ${id}`);
  for (const write of PIPELINE_CONTRACTS[id].writes || []) assert.ok((INTERNAL_JOB_WRITE_PERMISSIONS[id] || []).some((permission) => artifactMatchesPermission(write, permission)), `${id} write ${write} not permitted`);
}
for (const id of chain.slice(0, -1)) assert.equal(PIPELINE_CONTRACTS[id].next, chain[chain.indexOf(id) + 1], `${id} next mismatch`);
assert.equal(PIPELINE_CONTRACTS.DOMAIN_CONTROL_OBLIGATION_PROFILE.next, "DATA_PROVENANCE_PROFILE_FORENSICS");

assert.equal(PIPELINE_CONTRACTS.M9.next, "P2A_TARGET_PROFILE_SOURCE_INDEX");
assert.equal(PIPELINE_CONTRACTS.P2A_TARGET_PROFILE_SOURCE_INDEX.next, "P2B_DOMAIN_DERIVATION_SOURCE_INDEX");
assert.equal(PIPELINE_CONTRACTS.P2B_DOMAIN_DERIVATION_SOURCE_INDEX.next, "P2C_ACTIVITY_PROFILE_SOURCE_INDEX");
assert.equal(PIPELINE_CONTRACTS.P2C_ACTIVITY_PROFILE_SOURCE_INDEX.next, "P2D_DATA_PRIVACY_NAVIGATION_INDEX");
assert.equal(PIPELINE_CONTRACTS.P2D_DATA_PRIVACY_NAVIGATION_INDEX.next, "P2E_DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX");
assert.equal(PIPELINE_CONTRACTS.P2E_DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX.next, "P2G_PHASE_ROUTER");
assert.equal(PIPELINE_CONTRACTS.P2G_PHASE_ROUTER.next, "P2_INDEX_COMPILER_VALIDATION");
assert.deepEqual(PIPELINE_CONTRACTS.P2A_TARGET_PROFILE_SOURCE_INDEX.writes, ["target_profile_deterministic_map", "target_profile_semantic_profile", "target_profile_source_index"]);
assert.deepEqual(PIPELINE_CONTRACTS.P2B_DOMAIN_DERIVATION_SOURCE_INDEX.writes, DOMAIN_DERIVATION_SOURCE_INDEX_ARTIFACT_NAMES);
assert.deepEqual(PIPELINE_CONTRACTS.P2C_ACTIVITY_PROFILE_SOURCE_INDEX.writes, ACTIVITY_PROFILE_SOURCE_INDEX_ARTIFACT_NAMES);
assert.deepEqual(PIPELINE_CONTRACTS.P2D_DATA_PRIVACY_NAVIGATION_INDEX.writes, DATA_PRIVACY_NAVIGATION_INDEX_ARTIFACT_NAMES);
assert.deepEqual(PIPELINE_CONTRACTS.P2E_DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX.writes, DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX_ARTIFACT_NAMES);
assert.deepEqual(PIPELINE_CONTRACTS.P2G_PHASE_ROUTER.writes, PHASE_ROUTING_ARTIFACT_NAMES);
assert.deepEqual(PIPELINE_CONTRACTS.P2_INDEX_COMPILER_VALIDATION.writes, ["cartography_index", "cartography_validation_manifest"]);

for (const root of aRoots) assert.ok(PIPELINE_CONTRACTS.P2C_ACTIVITY_PROFILE_SOURCE_INDEX.reads.includes(root), `2C missing ${root}`);
for (const root of dpRoots) assert.ok(PIPELINE_CONTRACTS.P2D_DATA_PRIVACY_NAVIGATION_INDEX.reads.includes(root), `2D missing ${root}`);
for (const root of dconiRoots) assert.ok(PIPELINE_CONTRACTS.P2E_DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX.reads.includes(root), `2E missing ${root}`);
for (const root of [...tRoots, ...dRoots, ...aRoots, ...dpRoots, ...dconiRoots]) assert.ok(PIPELINE_CONTRACTS.P2G_PHASE_ROUTER.reads.includes(root), `2G missing ${root}`);
assert.equal(PIPELINE_CONTRACTS.P2G_PHASE_ROUTER.lossless_evidence_is_primary, true);
assert.equal(PIPELINE_CONTRACTS.P2G_PHASE_ROUTER.index_navigation_mandatory, true);
assert.equal(PIPELINE_CONTRACTS.P2G_PHASE_ROUTER.direct_lossless_fallback_framing_forbidden, true);
assert.equal(PIPELINE_CONTRACTS.P2G_PHASE_ROUTER.runtime_boundary_ends_at_operator_challenge, true);
assert.equal(PIPELINE_CONTRACTS.P2G_PHASE_ROUTER.phase12_compiler_excluded, true);

for (const jobId of routedPhase1To8Jobs) {
  assert.deepEqual(PIPELINE_CONTRACTS[jobId].reads, ["phase_routing_manifest"], `${jobId} central contract retains shadow reads`);
  assert.ok(P2G_RUNTIME_ROUTE_BY_JOB[jobId], `${jobId} missing Phase 2G route mapping`);
}
assert.equal(Object.prototype.hasOwnProperty.call(P2G_RUNTIME_ROUTE_BY_JOB, "DATA_PROVENANCE_PROFILE_LAYER5"), false);
assert.equal(PIPELINE_CONTRACTS.DATA_PROVENANCE_PROFILE_LAYER5.route_neutral_internal_gate, true);
assert.equal(PIPELINE_CONTRACTS.DATA_PROVENANCE_PROFILE_FORENSICS.next, "M11");

assert.deepEqual(PIPELINE_CONTRACTS.P3_DOMAIN_DERIVATION_LAYER.writes, DOMAIN_DERIVATION_ARTIFACT_NAMES);
assert.deepEqual(PIPELINE_CONTRACTS.P3_DOMAIN_DERIVATION_LAYER.prompt_files, DOMAIN_DERIVATION_CONTRACT.agent_package_binding.prompt_files);
assert.equal(PIPELINE_CONTRACTS.P3_DOMAIN_DERIVATION_LAYER.agent_id, "agent_3_target_feature");
assert.equal(PIPELINE_CONTRACTS.P3_DOMAIN_DERIVATION_LAYER.prompt_package_status, "ACTIVE_REGISTRY_LADDER_PROMPT");
assert.equal(PIPELINE_CONTRACTS.P3_DOMAIN_DERIVATION_LAYER.registry_ladder_prompt_active, true);

assert.equal(PIPELINE_CONTRACT_STATUS.phase2g_phase_router_declared, true);
assert.equal(PIPELINE_CONTRACT_STATUS.phase2g_phase_router_runtime_wired, true);
assert.equal(PIPELINE_CONTRACT_STATUS.phase2g_lossless_evidence_primary, true);
assert.equal(PIPELINE_CONTRACT_STATUS.phase2g_index_navigation_mandatory, true);
assert.equal(PIPELINE_CONTRACT_STATUS.phase2g_runtime_boundary_ends_before_compiler, true);
assert.equal(PIPELINE_CONTRACT_STATUS.phase12_direct_profile_runtime_wired, true);
assert.equal(PIPELINE_CONTRACT_STATUS.phase2g_no_shadow_downstream_read_arrays, true);
assert.equal(PIPELINE_CONTRACT_STATUS.phase2g_profile_forensics_inputs_forbidden, true);
for (const retired of ["data_provenance_profile", "data_provenance_profile_forensics", "extended_dap_india_readiness_profile", "integrated_dap_report", "m10_selected_legal_support_packet", "m7_deterministic_legal_signal_overlay"]) assert.equal(ARTIFACT_NAMES.includes(retired), false, `${retired} active`);

console.log(JSON.stringify({ check: "phase1-8 central runtime", status: "PASS", enforced_gates: ["PHASE1_8_JOB_CHAIN", "PHASE8_DCO_INSERTED_BEFORE_PHASE9_FORENSICS", "PHASE2G_SOLE_ROUTING_AUTHORITY", "PHASE2G_RUNTIME_BOUNDARY_ENDS_BEFORE_COMPILER", "NO_SHADOW_DOWNSTREAM_READ_ARRAYS", "PROFILE_FORENSICS_DERIVED_ONLY", "PHASE7_LAYER5_ROUTE_NEUTRAL", "PHASE2A_TO_2F_INDEX_OWNERSHIP"] }, null, 2));
