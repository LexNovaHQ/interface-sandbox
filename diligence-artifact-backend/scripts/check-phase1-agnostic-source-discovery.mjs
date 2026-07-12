import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { buildSourceUrlManifestArtifact } from "../src/phases/01-source-discovery/services/url-manifest.service.js";
import {
  COMMON_ROOTS,
  PRIMARY_FULL_EXTRACT_ROOT_CODES,
  SECONDARY_CONDITIONAL_ROOT_CODES,
  ROOT_TRAVERSAL_POLICY,
  legalDocTypeFromUrlOrRoute
} from "../src/phases/01-source-discovery/services/source-discovery-taxonomy.service.js";

const ROOT = process.cwd();
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

const contract = read("src/phases/01-source-discovery/source-discovery.contract.js");
const runner = read("src/phases/01-source-discovery/source-discovery.runner.js");
const urlService = read("src/phases/01-source-discovery/services/url-manifest.service.js");
const extractionService = read("src/phases/01-source-discovery/services/source-extraction.service.js");
const handoffService = read("src/phases/01-source-discovery/services/source-family-handoff.service.js");
const validator = read("src/phases/01-source-discovery/validators/source-discovery.validator.js");
const taxonomy = read("src/phases/01-source-discovery/services/source-discovery-taxonomy.service.js");
const permissions = read("src/runtime/contracts/artifact-permissions.contract.js");
const pipelineService = read("src/runtime/services/pipeline.service.js");
const pipelineContract = read("src/runtime/contracts/pipeline.contract.js");

const LOCKED_ROOTS = Object.freeze(["homepage_landing", "company_identity", "contact_notice", "product_service", "platform_feature_solution", "technical_docs_api", "docs_api_data_flow", "integrations_ecosystem", "pricing_commercial_availability", "use_case_customer_industry", "privacy_data_processing", "security_trust_compliance", "data_governance_controls", "ai_safety_transparency", "support_help_resources", "regulatory_licensing_status", "grievance_complaints"]);
const PRIMARY_FULL = Object.freeze(["company_identity", "contact_notice", "product_service", "platform_feature_solution", "technical_docs_api", "docs_api_data_flow", "privacy_data_processing", "security_trust_compliance", "data_governance_controls", "ai_safety_transparency", "regulatory_licensing_status", "grievance_complaints"]);
const SECONDARY_CONDITIONAL = Object.freeze(["integrations_ecosystem", "pricing_commercial_availability", "use_case_customer_industry", "support_help_resources"]);
const RETIRED_ROOT_ARTIFACTS = Object.freeze(["lossless_root__about_company", "lossless_root__legal_identity_notice", "lossless_root__operator_entity_signals", "lossless_root__supporting_company_signals", "lossless_root__technical_docs_api_developer", "lossless_root__security_trust", "lossless_root__trust_compliance", "lossless_root__support_help"]);

for (const artifact of ["source_discovery_matrix_manifest", "adapter_expansion_log", "neutral_evidence_bucket_manifest", "legal_doc_inventory", "legal_doc_extraction_index", "legal_doc_lossless_validation_manifest", "post_phase_1_domain_gate_handoff"]) {
  assert.ok(contract.includes(artifact), `contract missing ${artifact}`);
  assert.ok(permissions.includes(artifact), `permissions missing ${artifact}`);
}
for (const file of [contract, urlService, extractionService, handoffService, validator, permissions]) {
  assert.equal(file.includes("lossless_family__"), false, "Phase 1 active runtime must not mention lossless_family__");
  assert.equal(file.includes("ROOT_FAMILY"), false, "Phase 1 active runtime must not mention ROOT_FAMILY");
  assert.equal(file.includes("T0_ROOT"), false, "Phase 1 active runtime must not mention T/P/D/L root codes");
  assert.equal(file.includes("P1_PRODUCT"), false, "Phase 1 active runtime must not mention T/P/D/L root codes");
  assert.equal(file.includes("D1_SECURITY_TRUST"), false, "Phase 1 active runtime must not mention T/P/D/L root codes");
  assert.equal(file.includes("L1_CORE_TERMS_PRIVACY"), false, "Phase 1 active runtime must not mention T/P/D/L root codes");
}

assert.deepEqual(COMMON_ROOTS.map((root) => root.id), LOCKED_ROOTS, "Phase 1 common root matrix must be exactly the locked 17-root order");
assert.deepEqual(PRIMARY_FULL_EXTRACT_ROOT_CODES, PRIMARY_FULL, "PRIMARY_FULL_EXTRACT roots must match locked Phase 1 v5 doctrine");
assert.deepEqual(SECONDARY_CONDITIONAL_ROOT_CODES, SECONDARY_CONDITIONAL, "SECONDARY_CONDITIONAL roots must match locked Phase 1 doctrine");
assert.equal(ROOT_TRAVERSAL_POLICY.homepage_landing, "PRIMARY_SINGLE_EXTRACT", "homepage_landing must be PRIMARY_SINGLE_EXTRACT");
for (const root of PRIMARY_FULL) assert.equal(ROOT_TRAVERSAL_POLICY[root], "PRIMARY_FULL_EXTRACT", `${root} must be PRIMARY_FULL_EXTRACT`);
for (const root of SECONDARY_CONDITIONAL) assert.equal(ROOT_TRAVERSAL_POLICY[root], "SECONDARY_CONDITIONAL", `${root} must be SECONDARY_CONDITIONAL`);

for (const retired of RETIRED_ROOT_ARTIFACTS) {
  assert.equal(containsArtifactIdentity(pipelineContract, retired), false, `pipeline contract must not read retired root artifact ${retired}`);
  assert.equal(containsArtifactIdentity(permissions, retired), false, `permissions must not register retired physical artifact ${retired}`);
}
for (const active of ["lossless_root__company_identity", "lossless_root__technical_docs_api", "lossless_root__regulatory_licensing_status", "lossless_root__grievance_complaints"]) assert.ok(pipelineContract.includes(active) || permissions.includes(active), `active root not present in runtime surfaces: ${active}`);
assert.equal(containsArtifactIdentity(pipelineContract, "lossless_root__technical_docs_api_developer"), false, "technical_docs_api_developer retired root must not remain");

assert.ok(contract.includes("17 locked common agnostic roots"), "contract must lock 17-root classifier matrix");
assert.ok(contract.includes("multi-domain union probe"), "contract must lock multi-domain union probe");
assert.ok(contract.includes("sparse root storage"), "contract must lock sparse root storage");
assert.ok(contract.includes("legal_document_blob_merging"), "contract must forbid legal document blob merging");
assert.ok(contract.includes("primary_root_slug_chain_sampling"), "contract must forbid primary root slug-chain sampling");
assert.ok(runner.includes("implementation_status: SOURCE_DISCOVERY_CONTRACT.implementation_status"), "runner must inherit active Phase 1 contract status");
assert.ok(urlService.includes("scoutLockedRootMatrix"), "URL manifest service must run locked root matrix traversal");
assert.ok(urlService.includes("classifyCompanyIdentity"), "URL manifest service must include dedicated company identity classifier");
assert.ok(urlService.includes("classifyDataGovernanceControls"), "URL manifest service must include dedicated data governance classifier");
assert.ok(urlService.includes("classifyRegulatoryLicensingStatus"), "URL manifest service must include dedicated regulatory/licensing classifier");
assert.ok(urlService.includes("classifyGrievanceComplaints"), "URL manifest service must include dedicated grievance/complaints classifier");
assert.ok(extractionService.includes("buildSparseRootArtifacts") && extractionService.includes("lossless_root__${artifact.common_root}"), "extraction service must persist lossless_root artifacts through sparse root artifacts");
assert.ok(extractionService.includes("source_text_cutting_allowed: false"), "extraction service must explicitly forbid source text cutting");
assert.ok(handoffService.includes("lossless_root__"), "handoff must advertise lossless_root names");
assert.ok(validator.includes("legal_doc_lossless_validation_manifest"), "validator must require legal document validation manifest");
assert.ok(taxonomy.includes("technical_docs_api_developer"), "taxonomy must keep retired developer root only as redirect metadata");
assert.ok(pipelineService.includes("resolveLosslessRootArtifact"), "pipeline service must resolve sparse lossless roots");
assert.ok(pipelineService.includes("readSourceFamilyIndexForRootResolver"), "pipeline service must navigate source_family_index for sparse roots");
assert.ok(pipelineContract.includes("export const PIPELINE_CONTRACTS"), "runtime pipeline contract must remain the Phase 1 contract authority");
assert.ok(pipelineContract.includes("export function getPipelineContract"), "runtime pipeline contract must expose the canonical contract reader");
assert.equal(fs.existsSync(path.join(ROOT, "src/phase-contracts.js")), false, "retired phase-contracts compatibility shim must not return");

const sampleManifest = buildSourceUrlManifestArtifact({ run: { run_id: "PHASE1-CHECK" }, target: { url: "https://example.com" }, discoveredUrls: ["https://example.com/", "https://example.com/privacy", "https://example.com/security", "https://example.com/help", "https://example.com/regulatory", "https://example.com/grievance"] });
assert.ok(sampleManifest.source_discovery_matrix_manifest.root_matrix.length >= 17, "URL manifest must emit the locked root matrix");
assert.ok(sampleManifest.source_discovery_matrix_manifest.root_matrix.some((row) => row.root_code === "privacy_data_processing"));
assert.ok(sampleManifest.source_discovery_matrix_manifest.root_matrix.some((row) => row.root_code === "security_trust_compliance"));
assert.ok(sampleManifest.source_discovery_matrix_manifest.root_matrix.some((row) => row.root_code === "grievance_complaints"));

console.log(JSON.stringify({ check: "phase1 agnostic source discovery", status: "PASS", locked_roots: LOCKED_ROOTS.length, primary_full_roots: PRIMARY_FULL.length, secondary_conditional_roots: SECONDARY_CONDITIONAL.length }, null, 2));

function containsArtifactIdentity(source, artifact) {
  return new RegExp(`(^|[^A-Za-z0-9_])${escapeRegExp(artifact)}([^A-Za-z0-9_]|$)`).test(source);
}
function escapeRegExp(value) { return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
