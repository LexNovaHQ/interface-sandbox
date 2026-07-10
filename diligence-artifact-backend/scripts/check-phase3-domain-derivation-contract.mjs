import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PIPELINE_CONTRACTS } from "../src/runtime/contracts/pipeline.contract.js";
import { DOMAIN_DERIVATION_ARTIFACT_NAMES } from "../src/runtime/contracts/artifact-permissions.contract.js";
import { DOMAIN_DERIVATION_CONTRACT } from "../src/phases/03-domain-derivation/domain-derivation.contract.js";
import { DOMAIN_DERIVATION_RUNNER_STATUS } from "../src/phases/03-domain-derivation/domain-derivation.runner.js";

const ROOT = process.cwd();
const promptPath = "agent-packages/agent_3_target_feature/02B_P3_DOMAIN_DERIVATION_LAYER_BACKEND.md";
const prompt = fs.readFileSync(path.join(ROOT, promptPath), "utf8");
const contract = PIPELINE_CONTRACTS.P3_DOMAIN_DERIVATION_LAYER;
const requiredRoots = [
  "lossless_root__homepage_landing",
  "lossless_root__company_identity",
  "lossless_root__product_service",
  "lossless_root__platform_feature_solution",
  "lossless_root__technical_docs_api",
  "lossless_root__docs_api_data_flow",
  "lossless_root__pricing_commercial_availability",
  "lossless_root__use_case_customer_industry",
  "lossless_root__integrations_ecosystem",
  "lossless_root__ai_safety_transparency",
  "lossless_root__regulatory_licensing_status",
  "lossless_root__grievance_complaints"
];
assert.ok(contract, "P3_DOMAIN_DERIVATION_LAYER contract missing");
assert.equal(contract.agent_id, "agent_3_target_feature");
assert.equal(contract.actor_id, "agent_3_target_feature");
assert.equal(contract.type, "semantic_registry_derivation");
assert.equal(contract.prompt_package_status, "ACTIVE_REGISTRY_LADDER_PROMPT");
assert.equal(contract.registry_ladder_prompt_active, true);
assert.equal(contract.new_domains_added_by_registry_not_prompt, true);
assert.ok(contract.prompt_files.includes(promptPath), "3B registry ladder prompt missing from pipeline contract");
assert.deepEqual(contract.prompt_files, DOMAIN_DERIVATION_CONTRACT.agent_package_binding.prompt_files);
for (const readName of DOMAIN_DERIVATION_CONTRACT.reads) assert.ok(contract.reads.includes(readName), `3B pipeline missing phase-owned read ${readName}`);
assert.ok(contract.reads.includes("phase_routing_manifest"), "3B pipeline must include 2G route manifest during compatibility cutover");
assert.deepEqual(contract.writes, DOMAIN_DERIVATION_ARTIFACT_NAMES);
assert.equal(DOMAIN_DERIVATION_RUNNER_STATUS.agent_id, "agent_3_target_feature");
assert.equal(DOMAIN_DERIVATION_RUNNER_STATUS.prompt_package_status, "ACTIVE_REGISTRY_LADDER_PROMPT");
assert.equal(DOMAIN_DERIVATION_RUNNER_STATUS.registry_ladder_prompt_active, true);
for (const required of ["source_discovery_handoff", "cartography_index", "phase_routing_manifest", "target_profile_source_index", "domain_derivation_source_index", "target_profile", "domain_selection_profile", "active_run_package_manifest"]) assert.ok(contract.reads.includes(required), `3B missing ${required}`);
for (const root of requiredRoots) assert.ok(contract.reads.includes(root), `3B missing scoped lossless root ${root}`);
assert.deepEqual(DOMAIN_DERIVATION_CONTRACT.scoped_lossless_evidence_reads, requiredRoots);
for (const forbidden of ["activity_profile_source_index", "legal_cartography_index", "legal_signal_derivation_profile", "legal_doc_inventory", "legal_doc_extraction_index", "legal_doc_{DOC_TYPE}", "data_privacy_navigation_index", "lossless_root__privacy_data_processing", "lossless_root__security_trust", "lossless_root__trust_compliance", "lossless_root__about_company", "lossless_root__technical_docs_api_developer"]) assert.equal(contract.reads.includes(forbidden), false, `3B forbidden input present: ${forbidden}`);
for (const flag of ["semantic_first_deterministic_gated", "registry_driven_derivation", "registry_ladder_prompt_active", "hardcoded_domain_logic_forbidden", "new_domains_added_by_registry_not_prompt", "domain_derivation_source_index_required", "activity_profile_source_index_forbidden_until_2c_phase5", "regulatory_overlay_catalog_gated", "regulatory_overlay_candidate_only", "regulatory_overlay_compliance_conclusion_forbidden", "legal_cartography_index_forbidden", "legal_signal_derivation_profile_forbidden", "legal_lossless_evidence_forbidden", "target_profile_is_context_not_proof"]) assert.equal(DOMAIN_DERIVATION_CONTRACT.boundary_rules[flag], true, `3B boundary flag missing: ${flag}`);
for (const branch of ["primary_domain_derivation", "ai_mount_derivation", "regulatory_overlay_derivation", "fusion_candidate_derivation"]) assert.ok(DOMAIN_DERIVATION_CONTRACT.output_contract.required_top_level_branches.includes(branch), `3B output branch missing: ${branch}`);
for (const requiredText of ["DOMAIN_DERIVATION_REGISTRY_v0.yaml", "package-catalog.v0.json", "condition-level", "evidence anchors", "domain_derivation_source_index", "activity_profile_source_index is reserved", "regulatory_overlay_derivation", "catalog-gated regulatory overlay candidates", "new supported domain", "Phase 3B must not emit Lane"]) assert.ok(prompt.includes(requiredText), `3B prompt missing structural marker: ${requiredText}`);
for (const forbiddenPromptInput of ["lossless_root__about_company", "lossless_root__technical_docs_api_developer"]) assert.equal(prompt.includes(`- \`${forbiddenPromptInput}\``), false, `3B prompt must not list retired input ${forbiddenPromptInput}`);
for (const forbiddenDomainExample of ["HealthTech", "SaaS", "Banking", "EdTech", "Insurance", "Crypto", "AdTech", "HRTech"]) assert.equal(prompt.includes(forbiddenDomainExample), false, `3B prompt must not contain domain example ${forbiddenDomainExample}`);
console.log(JSON.stringify({ check: "phase3 domain derivation contract", status: "PASS", enforced_gates: ["AGENT3_BOUND", "P2B_DOMAIN_DERIVATION_SOURCE_INDEX_REQUIRED", "P2G_ROUTE_MANIFEST_COMPAT_READ", "ACTIVITY_PROFILE_INDEX_FORBIDDEN_IN_3B", "REGULATORY_OVERLAY_CANDIDATE_ONLY", "ACTIVE_REGISTRY_LADDER_PROMPT", "NO_DOMAIN_EXAMPLES_IN_PROMPT", "NEW_DOMAINS_BY_REGISTRY_NOT_PROMPT", "SCOPED_NON_LEGAL_LOSSLESS_READS", "LEGAL_INPUTS_FORBIDDEN", "REGISTRY_SEMANTIC_DERIVATION"] }, null, 2));