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
const phaseContracts = read("src/phase-contracts.js");

const LOCKED_ROOTS = Object.freeze([
  "homepage_landing",
  "company_identity",
  "contact_notice",
  "product_service",
  "platform_feature_solution",
  "technical_docs_api",
  "docs_api_data_flow",
  "integrations_ecosystem",
  "pricing_commercial_availability",
  "use_case_customer_industry",
  "privacy_data_processing",
  "security_trust_compliance",
  "data_governance_controls",
  "ai_safety_transparency",
  "support_help_resources",
  "regulatory_licensing_status",
  "grievance_complaints"
]);
const PRIMARY_FULL = Object.freeze([
  "company_identity",
  "contact_notice",
  "product_service",
  "platform_feature_solution",
  "technical_docs_api",
  "docs_api_data_flow",
  "privacy_data_processing",
  "security_trust_compliance",
  "data_governance_controls",
  "ai_safety_transparency",
  "regulatory_licensing_status",
  "grievance_complaints"
]);
const SECONDARY_CONDITIONAL = Object.freeze(["integrations_ecosystem", "pricing_commercial_availability", "use_case_customer_industry", "support_help_resources"]);
const RETIRED_ROOT_ARTIFACTS = Object.freeze(["lossless_root__about_company", "lossless_root__legal_identity_notice", "lossless_root__operator_entity_signals", "lossless_root__supporting_company_signals", "lossless_root__technical_docs_api_developer", "lossless_root__security_trust", "lossless_root__trust_compliance", "lossless_root__support_help"]);

for (const artifact of ["source_discovery_matrix_manifest", "adapter_expansion_log", "neutral_evidence_bucket_manifest", "legal_doc_inventory", "legal_doc_extraction_index", "legal_doc_lossless_validation_manifest", "post_phase_1_domain_gate_handoff"]) {
  assert.ok(contract.includes(artifact), `contract missing ${artifact}`);
  assert.ok(permissions.includes(artifact), `permissions missing ${artifact}`);
}
for (const file of [contract, urlService, extractionService, handoffService, validator, permissions, phaseContracts]) {
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
  assert.equal(pipelineContract.includes(retired), false, `pipeline contract must not read retired root artifact ${retired}`);
  assert.equal(permissions.includes(retired), false, `permissions must not register retired physical artifact ${retired}`);
}
for (const active of ["lossless_root__company_identity", "lossless_root__technical_docs_api", "lossless_root__regulatory_licensing_status", "lossless_root__grievance_complaints"]) assert.ok(pipelineContract.includes(active) || permissions.includes(active), `active root not present in runtime surfaces: ${active}`);
assert.equal(pipelineContract.includes("lossless_root__technical_docs_api_developer"), false, "technical_docs_api_developer retired root must not remain");

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
assert.ok(urlService.includes("SOURCE_ROUTING_ONLY_NOT_JOB_ROUTING"), "URL rows must preserve Phase 1 source-routing-only classification effect");
assert.ok(extractionService.includes("buildSparseRootArtifacts"), "extraction service must save only sparse material root artifacts");
assert.ok(extractionService.includes("root_artifact_manifest"), "source_family_index must advertise virtual root manifest");
assert.ok(extractionService.includes("legal_documents_stored_separately"), "root artifact manifest must flag independent legal document storage");
assert.ok(validator.includes("SOURCE_DISCOVERY_EMPTY_ROOT_PHYSICALLY_SAVED"), "validator must reject empty physical root artifacts");
assert.ok(validator.includes("SOURCE_DISCOVERY_ROOT_SOURCE_ID_NOT_EXACTLY_ONCE"), "validator must enforce source IDs exactly once across shards");
assert.ok(validator.includes("SOURCE_DISCOVERY_LEGAL_DOC_TEXT_LEAKED_INTO_ROOT"), "validator must prevent legal doc text leaking into root blobs");
assert.equal(validator.includes("SOURCE_DISCOVERY_OUTPUT_MISSING:lossless_root__COMMON_ROOT"), false, "validator must not require physical empty root artifacts");
assert.ok(handoffService.includes("full_matrix_source_index"), "handoff must expose full matrix source index");
assert.ok(taxonomy.includes("SOURCE_SIGNAL_ROLES"), "taxonomy must define source signal roles");
assert.ok(taxonomy.includes("LICENSING_REGULATORY_SIGNAL"), "taxonomy must define regulatory signal role");
assert.ok(taxonomy.includes("GRIEVANCE_REDRESSAL_SIGNAL"), "taxonomy must define grievance signal role");
assert.ok(taxonomy.includes("LEGAL_DOC_RULES"), "taxonomy must define legal doc rules");
assert.ok(permissions.includes("LOSSLESS_COMMON_ROOT_ARTIFACT_PATTERN"), "permissions must allow lossless_root artifacts");
assert.ok(permissions.includes("LEGAL_DOC_ARTIFACT_PATTERN"), "permissions must allow legal_doc artifacts");
assert.ok(pipelineService.includes("sparse_lossless_root_resolution_enabled: true"), "pipeline must advertise sparse lossless root resolution");
assert.ok(pipelineService.includes("resolveLosslessRootArtifact"), "pipeline must resolve virtual lossless roots through source_family_index");
assert.ok(pipelineService.includes("root_artifact_manifest"), "pipeline root resolver must use source_family_index.root_artifact_manifest");
assert.ok(pipelineService.includes("UNSAVED_EMPTY"), "pipeline root resolver must return controlled empty roots for unsaved sparse roots");
assert.ok(phaseContracts.includes("runtime/contracts/pipeline.contract.js"), "legacy phase-contracts shim must delegate to runtime pipeline contract");
assert.ok(phaseContracts.includes("old_phase_contract_table_removed: true"), "legacy phase-contracts table must be retired");
assert.ok(pipelineContract.includes("dynamic_writes: [\"legal_doc_{DOC_TYPE}\"]"), "runtime pipeline contract must allow dynamic legal doc writes");
assert.ok(!contract.includes("domain_locking_allowed"), "Phase 1 must not allow domain locking");

assert.deepEqual(legalDocTypeFromUrlOrRoute("/privacy-policy"), { docType: "privacy_policy", artifactName: "legal_doc_privacy_policy" });
assert.deepEqual(legalDocTypeFromUrlOrRoute("/dpa"), { docType: "data_processing_agreement", artifactName: "legal_doc_data_processing_agreement" });
assert.deepEqual(legalDocTypeFromUrlOrRoute("/subprocessors"), { docType: "subprocessor_list", artifactName: "legal_doc_subprocessor_list" });
assert.deepEqual(legalDocTypeFromUrlOrRoute("/cookie-policy"), { docType: "cookie_policy", artifactName: "legal_doc_cookie_policy" });
assert.deepEqual(legalDocTypeFromUrlOrRoute("/legal-notice"), { docType: "legal_notice", artifactName: "legal_doc_legal_notice" });
assert.deepEqual(legalDocTypeFromUrlOrRoute("/usage-policy"), { docType: "usage_policy", artifactName: "legal_doc_usage_policy" });
assert.deepEqual(legalDocTypeFromUrlOrRoute("/model-policy"), { docType: "usage_policy", artifactName: "legal_doc_usage_policy" });
assert.deepEqual(legalDocTypeFromUrlOrRoute("/safety-policy"), { docType: "safety_policy", artifactName: "legal_doc_safety_policy" });
assert.deepEqual(legalDocTypeFromUrlOrRoute("/fair-practice-code"), { docType: "fair_practice_code", artifactName: "legal_doc_fair_practice_code" });
assert.deepEqual(legalDocTypeFromUrlOrRoute("/grievance-redressal-policy"), { docType: "grievance_redressal_policy", artifactName: "legal_doc_grievance_redressal_policy" });
assert.deepEqual(legalDocTypeFromUrlOrRoute("/complaints-procedure"), { docType: "complaints_procedure", artifactName: "legal_doc_complaints_procedure" });
assert.deepEqual(legalDocTypeFromUrlOrRoute("/schedule-of-charges"), { docType: "schedule_of_charges", artifactName: "legal_doc_schedule_of_charges" });

const manifest = await buildFixtureManifest();
assert.equal(manifest.taxonomy_version, "PHASE1_AGNOSTIC_URL_MANIFEST_v3_MULTI_DOMAIN_UNION_PROBE", "fixture manifest must use Phase 1 v5 schema");
assert.equal(manifest.source_search_rule_applied.forbidden_actions_confirmed.primary_domain_locked, false, "Phase 1 fixture must not lock domain");
assert.equal(manifest.source_search_rule_applied.forbidden_actions_confirmed.source_discovery_narrowed, false, "Phase 1 fixture must not narrow source discovery");

assertFixtureRow(manifest, "/", "homepage_landing", { routeType: "primary_homepage", tier: "PRIMARY", role: "TARGET_IDENTITY_SIGNAL" });
assertFixtureRow(manifest, "/about", "company_identity", { routeType: "company_identity", tier: "PRIMARY", role: "TARGET_IDENTITY_SIGNAL" });
assertFixtureRow(manifest, "/legal-notice", "company_identity", { routeType: "legal_identity_notice", tier: "PRIMARY", role: "LEGAL_NOTICE_SIGNAL", legalDocType: "legal_notice" });
assertFixtureRow(manifest, "/contact", "contact_notice", { routeType: "general_contact", tier: "PRIMARY", role: "CONTACT_NOTICE_SIGNAL" });
assertFixtureRow(manifest, "/product/speech-to-text", "product_service", { routeType: "product_slug", tier: "PRIMARY", role: "PRODUCT_ACTIVITY_SIGNAL" });
assertFixtureRow(manifest, "/features/voice-ai", "platform_feature_solution", { routeType: "feature_child", tier: "PRIMARY", role: "PRODUCT_ACTIVITY_SIGNAL" });
assertFixtureRow(manifest, "/docs/api/authentication", "technical_docs_api", { tier: "PRIMARY", role: "TECHNICAL_MECHANICS_SIGNAL", technicalRouteShape: "TECHNICAL_CHILD_PAGE" });
assertFixtureRow(manifest, "/docs/api/authentication", "docs_api_data_flow", { routeType: "auth_permissions_data_flow", tier: "PRIMARY", role: "DATA_FLOW_SIGNAL", apiDataFlow: true });
assertFixtureRow(manifest, "/apis/speech-to-text", "technical_docs_api", { tier: "PRIMARY", role: "API_INTEGRATION_SIGNAL", technicalRouteShape: "API_FAMILY_ROOT" });
assertFixtureRow(manifest, "/apis/speech-to-text", "docs_api_data_flow", { routeType: "central_api_family_data_flow", tier: "PRIMARY", role: "DATA_FLOW_SIGNAL", apiDataFlow: true });
assertFixtureRow(manifest, "/integrations/slack", "integrations_ecosystem", { routeType: "integration_child", tier: "SECONDARY", role: "API_INTEGRATION_SIGNAL" });
assertFixtureRow(manifest, "/pricing", "pricing_commercial_availability", { routeType: "pricing_page", tier: "SECONDARY", role: "COMMERCIAL_AVAILABILITY_SIGNAL" });
assertFixtureRow(manifest, "/use-cases/healthcare", "use_case_customer_industry", { routeType: "use_case_child", tier: "SECONDARY", role: "CUSTOMER_SEGMENT_SIGNAL" });
assertFixtureRow(manifest, "/privacy", "privacy_data_processing", { routeType: "privacy_policy", tier: "PRIMARY", role: "DATA_PROCESSING_SIGNAL", legalDocType: "privacy_policy" });
assertFixtureRow(manifest, "/dpa", "privacy_data_processing", { routeType: "dpa_or_data_processing_addendum", tier: "PRIMARY", role: "LEGAL_DOCUMENT_SIGNAL", legalDocType: "data_processing_agreement" });
assertFixtureRow(manifest, "/subprocessors", "privacy_data_processing", { routeType: "subprocessor_list", tier: "PRIMARY", role: "VENDOR_PROCESSING_SIGNAL", legalDocType: "subprocessor_list" });
assertFixtureRow(manifest, "/cookie-policy", "privacy_data_processing", { routeType: "cookie_policy", tier: "PRIMARY", role: "LEGAL_DOCUMENT_SIGNAL", legalDocType: "cookie_policy" });
assertFixtureRow(manifest, "/security", "security_trust_compliance", { routeType: "security_overview", tier: "PRIMARY", role: "SECURITY_TRUST_SIGNAL" });
assertFixtureRow(manifest, "/data-residency", "data_governance_controls", { routeType: "data_residency", tier: "PRIMARY", role: "DATA_GOVERNANCE_SIGNAL" });
assertFixtureRow(manifest, "/model-cards/foo", "ai_safety_transparency", { routeType: "model_card_child", tier: "PRIMARY", role: "AI_SAFETY_TRANSPARENCY_SIGNAL" });
assertFixtureRow(manifest, "/usage-policy", "ai_safety_transparency", { routeType: "usage_policy", tier: "PRIMARY", role: "LEGAL_DOCUMENT_SIGNAL", legalDocType: "usage_policy" });
assertFixtureRow(manifest, "/help/article", "support_help_resources", { routeType: "support_article", tier: "SECONDARY", role: "SUPPORT_CONTEXT_SIGNAL" });
assertFixtureRow(manifest, "/licenses", "regulatory_licensing_status", { routeType: "licensing_status", tier: "PRIMARY", role: "LICENSING_REGULATORY_SIGNAL" });
assertFixtureRow(manifest, "/regulatory-disclosures", "regulatory_licensing_status", { routeType: "regulatory_disclosure", tier: "PRIMARY", role: "LICENSING_REGULATORY_SIGNAL" });
assertFixtureRow(manifest, "/bank-partners", "regulatory_licensing_status", { routeType: "bank_partner_sponsor_bank", tier: "PRIMARY", role: "COUNTERPARTY_INSTITUTION_SIGNAL" });
assertFixtureRow(manifest, "/grievance", "grievance_complaints", { routeType: "grievance_redressal", tier: "PRIMARY", role: "GRIEVANCE_REDRESSAL_SIGNAL" });
assertFixtureRow(manifest, "/complaints", "grievance_complaints", { routeType: "complaints_route", tier: "PRIMARY", role: "GRIEVANCE_REDRESSAL_SIGNAL" });
assertFixtureRow(manifest, "/ombudsman", "grievance_complaints", { routeType: "ombudsman_escalation", tier: "PRIMARY", role: "GRIEVANCE_REDRESSAL_SIGNAL" });
assertFixtureRow(manifest, "/nodal-officer", "grievance_complaints", { routeType: "nodal_officer", tier: "PRIMARY", role: "GRIEVANCE_REDRESSAL_SIGNAL" });

for (const falsePositivePath of ["/chair", "/claims", "/email", "/availability"]) {
  const rows = rowsForPath(manifest, falsePositivePath);
  assert.equal(rows.some((row) => row.common_root === "ai_safety_transparency"), false, `${falsePositivePath} must not classify as ai_safety_transparency`);
  assert.equal(rows.some((row) => (row.source_signal_roles || []).includes("AI_MECHANISM_SIGNAL")), false, `${falsePositivePath} must not emit AI_MECHANISM_SIGNAL`);
  assert.equal(rows.some((row) => (row.neutral_buckets || []).includes("ai_mechanism_signals")), false, `${falsePositivePath} must not emit ai_mechanism_signals`);
}
assert.ok((manifest.source_discovery_matrix_manifest?.adapter_expansion_roots || []).every((row) => row.may_expand_discovery === true && row.may_narrow_discovery === false && row.may_exclude_sources === false), "adapter expansion roots must stay expand-only");

console.log(JSON.stringify({
  check: "phase1 agnostic source discovery",
  status: "PASS",
  enforced_gates: [
    "PHASE1_V5_17_ROOT_ORDER",
    "REGULATORY_LICENSING_CLASSIFIER",
    "GRIEVANCE_COMPLAINTS_CLASSIFIER",
    "MULTI_DOMAIN_UNION_PROBE_EXPAND_ONLY",
    "SPARSE_ROOT_STORAGE",
    "LEGAL_DOC_GRANULARITY"
  ]
}, null, 2));

async function buildFixtureManifest() {
  const oldFetch = globalThis.fetch;
  globalThis.fetch = async (input) => mockFetch(input);
  try {
    const artifacts = await buildSourceUrlManifestArtifact({ run: { run_id: "CHECK-PHASE1", target: "fixture.example", root_url: "https://fixture.example/", source_mode: "url" }, preflightContext: {} });
    return { ...artifacts.deduped_url_manifest, source_discovery_matrix_manifest: artifacts.source_discovery_matrix_manifest };
  } finally {
    globalThis.fetch = oldFetch;
  }
}
function mockFetch(input) {
  const url = new URL(String(input));
  const pathname = normalizePath(url.pathname);
  const body = FIXTURE_PAGES[pathname];
  const ok = body !== undefined;
  return Promise.resolve({
    ok,
    status: ok ? 200 : 404,
    url: url.toString(),
    headers: { get: () => pathname.includes("sitemap") ? "application/xml" : "text/html" },
    text: async () => ok ? body : "not found"
  });
}
function assertFixtureRow(manifest, urlPath, commonRoot, expectations = {}) {
  const row = rowsForPath(manifest, urlPath).find((item) => item.common_root === commonRoot);
  assert.ok(row, `missing row for ${urlPath} -> ${commonRoot}`);
  assert.equal(row.root_traversal_policy, ROOT_TRAVERSAL_POLICY[commonRoot], `${urlPath} must carry root_traversal_policy`);
  assert.equal(row.phase_1_classification_effect, "SOURCE_ROUTING_ONLY_NOT_JOB_ROUTING", `${urlPath} must remain source-routing only`);
  assert.ok(Array.isArray(row.source_signal_roles), `${urlPath} must carry source_signal_roles[]`);
  if (expectations.routeType) assert.equal(row.route_type, expectations.routeType, `${urlPath} route_type mismatch`);
  if (expectations.tier) assert.equal(row.admission_tier, expectations.tier, `${urlPath} admission_tier mismatch`);
  if (expectations.role) assert.ok(row.source_signal_roles.includes(expectations.role), `${urlPath} missing role ${expectations.role}`);
  if (expectations.technicalRouteShape) assert.equal(row.technical_route_shape, expectations.technicalRouteShape, `${urlPath} technical_route_shape mismatch`);
  if (expectations.apiDataFlow) assert.equal(row.api_data_flow_signal?.present, true, `${urlPath} must carry api_data_flow_signal.present`);
  if (expectations.legalDocType) {
    assert.equal(row.legal_doc_candidate, true, `${urlPath} must be legal_doc_candidate`);
    assert.equal(row.legal_doc_type, expectations.legalDocType, `${urlPath} legal_doc_type mismatch`);
  }
}
function rowsForPath(manifest, urlPath) {
  return (manifest.manifest_sources || []).filter((row) => normalizePath(new URL(row.canonical_url).pathname) === normalizePath(urlPath));
}
function normalizePath(value) { return String(value || "/").replace(/\/+$/g, "") || "/"; }

const ROOT_LINKS = ["/about", "/legal-notice", "/contact", "/product", "/product/speech-to-text", "/features", "/features/voice-ai", "/docs", "/docs/api/authentication", "/apis/speech-to-text", "/integrations/slack", "/pricing", "/use-cases/healthcare", "/privacy", "/dpa", "/subprocessors", "/cookie-policy", "/security", "/data-residency", "/model-cards/foo", "/usage-policy", "/help/article", "/licenses", "/regulatory-disclosures", "/bank-partners", "/grievance", "/complaints", "/ombudsman", "/nodal-officer", "/fair-practice-code", "/grievance-redressal-policy", "/schedule-of-charges", "/chair", "/claims", "/email", "/availability"];
const anchorHtml = (links) => links.map((href) => `<a href="${href}">${href}</a>`).join("\n");
const FIXTURE_PAGES = Object.freeze({
  "/": `<html><head><title>Fixture</title></head><body><header>${anchorHtml(ROOT_LINKS)}</header><main>Fixture public home with product, privacy, docs, security, model, regulatory and grievance links.</main></body></html>`,
  "/sitemap.xml": `<?xml version="1.0"?><urlset>${ROOT_LINKS.map((href) => `<url><loc>https://fixture.example${href}</loc></url>`).join("")}</urlset>`,
  "/about": `<main>Company identity page. <a href="/about/team">team</a></main>`,
  "/about/team": `<main>Team identity page.</main>`,
  "/legal-notice": `<main>Legal notice and controller identity.</main>`,
  "/contact": `<main>General contact route.</main>`,
  "/product": `<main>Products root. <a href="/product/speech-to-text">speech</a></main>`,
  "/product/speech-to-text": `<main>Speech to text product. <a href="/product/translation">translation</a></main>`,
  "/product/translation": `<main>Translation product.</main>`,
  "/features": `<main>Features root. <a href="/features/voice-ai">voice ai</a></main>`,
  "/features/voice-ai": `<main>Voice AI feature.</main>`,
  "/docs": `<main>Docs root. <a href="/docs/api/authentication">auth docs</a><a href="/docs/api/webhooks">webhooks</a></main>`,
  "/docs/api/authentication": `<main>Authentication, permissions, API keys and customer data controls.</main>`,
  "/docs/api/webhooks": `<main>Webhook payload data flow and event logs.</main>`,
  "/apis": `<main>APIs root. <a href="/apis/speech-to-text">speech API</a></main>`,
  "/apis/speech-to-text": `<main>Speech to text API family uploads audio files and returns transcription.</main>`,
  "/integrations": `<main>Integrations root. <a href="/integrations/slack">Slack connector</a></main>`,
  "/integrations/slack": `<main>Slack integration connector.</main>`,
  "/pricing": `<main>Pricing and plans.</main>`,
  "/use-cases": `<main>Use cases. <a href="/use-cases/healthcare">healthcare</a></main>`,
  "/use-cases/healthcare": `<main>Healthcare use case.</main>`,
  "/privacy": `<main>Privacy policy and user rights. <a href="/privacy/data-deletion">deletion</a></main>`,
  "/privacy/data-deletion": `<main>Privacy deletion controls.</main>`,
  "/dpa": `<main>Data processing agreement.</main>`,
  "/subprocessors": `<main>Subprocessor list.</main>`,
  "/cookie-policy": `<main>Cookie policy.</main>`,
  "/security": `<main>Security overview.</main>`,
  "/data-residency": `<main>Data residency controls.</main>`,
  "/model-cards": `<main>Model cards. <a href="/model-cards/foo">Foo model</a></main>`,
  "/model-cards/foo": `<main>Foo model card and safety transparency.</main>`,
  "/usage-policy": `<main>Usage policy.</main>`,
  "/help": `<main>Help center. <a href="/help/article">article</a></main>`,
  "/help/article": `<main>Support article.</main>`,
  "/licenses": `<main>Licensing status and registration public disclosure.</main>`,
  "/regulatory-disclosures": `<main>Regulatory disclosures and consumer disclosure.</main>`,
  "/bank-partners": `<main>Bank partners and sponsor bank information.</main>`,
  "/grievance": `<main>Grievance redressal route.</main>`,
  "/complaints": `<main>Complaints route and complaint email.</main>`,
  "/ombudsman": `<main>Ombudsman escalation route.</main>`,
  "/nodal-officer": `<main>Nodal officer details.</main>`,
  "/fair-practice-code": `<main>Fair practice code.</main>`,
  "/grievance-redressal-policy": `<main>Grievance redressal policy.</main>`,
  "/schedule-of-charges": `<main>Schedule of charges.</main>`,
  "/chair": `<main>Chair page. The word contains ai but is not AI.</main>`,
  "/claims": `<main>Claims page. The word contains ai but is not AI.</main>`,
  "/email": `<main>Email page. The word contains ai but is not AI.</main>`,
  "/availability": `<main>Availability page. The word contains ai but is not AI.</main>`
});
