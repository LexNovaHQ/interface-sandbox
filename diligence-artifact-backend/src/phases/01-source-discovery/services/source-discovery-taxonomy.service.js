import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __taxonomy_dirname = path.dirname(fileURLToPath(import.meta.url));
const DOMAIN_SOURCE_HINTS_DIR = path.resolve(__taxonomy_dirname, "../../../../references/domain-packages/phase-1");

export const COMMON_ROOTS = Object.freeze([
  { id: "homepage_landing", priority: "PRIMARY", traversal_policy: "PRIMARY_SINGLE_EXTRACT", buckets: ["company_identity_sources", "commercial_positioning_sources"], paths: ["/"] },
  { id: "company_identity", priority: "PRIMARY", traversal_policy: "PRIMARY_FULL_EXTRACT", buckets: ["company_identity_sources", "jurisdiction_market_signals"], paths: ["/about", "/about-us", "/company", "/our-company", "/who-we-are", "/team", "/careers", "/newsroom", "/press", "/legal-notice", "/imprint", "/controller"] },
  { id: "contact_notice", priority: "PRIMARY", traversal_policy: "PRIMARY_FULL_EXTRACT", buckets: ["contact_notice_sources", "company_identity_sources"], paths: ["/contact", "/contact-us", "/support/contact", "/legal", "/privacy/contact"] },
  { id: "product_service", priority: "PRIMARY", traversal_policy: "PRIMARY_FULL_EXTRACT", buckets: ["product_activity_sources", "commercial_positioning_sources"], paths: ["/product", "/products"] },
  { id: "platform_feature_solution", priority: "PRIMARY", traversal_policy: "PRIMARY_FULL_EXTRACT", buckets: ["product_activity_sources"], paths: ["/platform", "/features", "/solutions"] },
  { id: "technical_docs_api", priority: "PRIMARY", traversal_policy: "PRIMARY_FULL_EXTRACT", buckets: ["technical_docs_sources", "api_integration_sources"], paths: ["/docs", "/developer", "/developers", "/api", "/apis", "/api-reference", "/sdk", "/sdks", "/models"] },
  { id: "docs_api_data_flow", priority: "PRIMARY", traversal_policy: "PRIMARY_FULL_EXTRACT", buckets: ["technical_docs_sources", "api_integration_sources", "data_processing_signals"], paths: ["/webhooks", "/authentication", "/permissions", "/audit-logs", "/data-flow", "/data-flows"] },
  { id: "integrations_ecosystem", priority: "SECONDARY", traversal_policy: "SECONDARY_CONDITIONAL", buckets: ["api_integration_sources", "product_activity_sources"], paths: ["/integrations", "/connectors", "/apps", "/marketplace"] },
  { id: "pricing_commercial_availability", priority: "SECONDARY", traversal_policy: "SECONDARY_CONDITIONAL", buckets: ["pricing_plan_sources", "commercial_positioning_sources"], paths: ["/pricing", "/api-pricing", "/plans", "/enterprise", "/contact-sales"] },
  { id: "use_case_customer_industry", priority: "SECONDARY", traversal_policy: "SECONDARY_CONDITIONAL", buckets: ["customer_segment_signals", "regulated_activity_signals"], paths: ["/use-cases", "/industries", "/customers", "/stories", "/case-studies"] },
  { id: "privacy_data_processing", priority: "PRIMARY", traversal_policy: "PRIMARY_FULL_EXTRACT", buckets: ["privacy_security_sources", "data_processing_signals", "legal_terms_sources"], paths: ["/privacy", "/privacy-policy", "/privacy-center", "/data-protection", "/gdpr", "/data-processing", "/data-processing-agreement", "/data-processing-addendum", "/dpa", "/subprocessors", "/subprocessor", "/cookies", "/cookie-policy"] },
  { id: "security_trust_compliance", priority: "PRIMARY", traversal_policy: "PRIMARY_FULL_EXTRACT", buckets: ["trust_compliance_sources", "privacy_security_sources"], paths: ["/security", "/security-center", "/data-security", "/trust", "/trust-center", "/compliance", "/compliance-center", "/soc-2", "/iso-27001", "/certifications"] },
  { id: "data_governance_controls", priority: "PRIMARY", traversal_policy: "PRIMARY_FULL_EXTRACT", buckets: ["data_processing_signals", "privacy_security_sources"], paths: ["/customer-data", "/enterprise-privacy", "/data-residency", "/retention", "/deletion", "/data-export", "/data-deletion"] },
  { id: "ai_safety_transparency", priority: "PRIMARY", traversal_policy: "PRIMARY_FULL_EXTRACT", buckets: ["ai_mechanism_signals", "trust_compliance_sources", "regulated_activity_signals"], paths: ["/responsible-ai", "/ai-policy", "/ai-transparency", "/transparency", "/safety", "/model-card", "/model-cards", "/model-details", "/usage-policy"] },
  { id: "support_help_resources", priority: "SECONDARY", traversal_policy: "SECONDARY_CONDITIONAL", buckets: ["support_context_sources", "technical_docs_sources", "product_activity_sources"], paths: ["/help", "/support", "/faq", "/knowledge-base"] },
  { id: "regulatory_licensing_status", priority: "PRIMARY", traversal_policy: "PRIMARY_FULL_EXTRACT", buckets: ["regulatory_licensing_sources", "trust_compliance_sources"], paths: ["/licenses", "/licence", "/licences", "/licensing", "/regulatory", "/regulation", "/regulatory-disclosures", "/regulatory-information", "/disclosures", "/registrations", "/authorised", "/authorized", "/bank-partners", "/partner-banks", "/banking-partners", "/sponsor-bank"] },
  { id: "grievance_complaints", priority: "PRIMARY", traversal_policy: "PRIMARY_FULL_EXTRACT", buckets: ["grievance_complaints_sources", "contact_notice_sources"], paths: ["/grievance", "/grievance-redressal", "/grievances", "/complaints", "/complaint", "/ombudsman", "/nodal-officer", "/grievance-officer", "/raise-a-complaint", "/customer-grievance"] }
]);

export const ROOT_TRAVERSAL_POLICY = Object.freeze(Object.fromEntries(COMMON_ROOTS.map((root) => [root.id, root.traversal_policy])));
export const PRIMARY_FULL_EXTRACT_ROOT_CODES = Object.freeze(COMMON_ROOTS.filter((root) => root.traversal_policy === "PRIMARY_FULL_EXTRACT").map((root) => root.id));
export const SECONDARY_CONDITIONAL_ROOT_CODES = Object.freeze(COMMON_ROOTS.filter((root) => root.traversal_policy === "SECONDARY_CONDITIONAL").map((root) => root.id));
export const RETIRED_COMMON_ROOT_CODES = Object.freeze(["about_company", "legal_identity_notice", "operator_entity_signals", "supporting_company_signals", "security_trust", "trust_compliance", "support_help", "blog_resources", "careers_hiring", "public_repository_developer_assets", "third_party_profiles"]);
export const COMMON_ROOT_CODES = Object.freeze(COMMON_ROOTS.map((root) => root.id));
export const COMMON_ROOT_ARTIFACT_NAMES = Object.freeze(COMMON_ROOT_CODES.map((code) => `lossless_root__${code}`));
export const NEUTRAL_BUCKETS = Object.freeze(["company_identity_sources", "commercial_positioning_sources", "product_activity_sources", "technical_docs_sources", "api_integration_sources", "pricing_plan_sources", "legal_terms_sources", "privacy_security_sources", "trust_compliance_sources", "regulated_activity_signals", "ai_mechanism_signals", "data_processing_signals", "contact_notice_sources", "thin_or_missing_source_gaps", "customer_segment_signals", "jurisdiction_market_signals", "support_context_sources", "regulatory_licensing_sources", "consumer_disclosure_sources", "grievance_complaints_sources", "counterparty_institution_signals", "money_movement_signals"]);
export const SOURCE_SIGNAL_ROLES = Object.freeze(["TARGET_IDENTITY_SIGNAL", "CONTACT_NOTICE_SIGNAL", "COMMERCIAL_AVAILABILITY_SIGNAL", "COMMERCIAL_POSITIONING_SIGNAL", "PRODUCT_ACTIVITY_SIGNAL", "TECHNICAL_MECHANICS_SIGNAL", "API_INTEGRATION_SIGNAL", "DATA_FLOW_SIGNAL", "DATA_PROCESSING_SIGNAL", "DATA_GOVERNANCE_SIGNAL", "SECURITY_TRUST_SIGNAL", "AI_MECHANISM_SIGNAL", "AI_SAFETY_TRANSPARENCY_SIGNAL", "REGULATED_ACTIVITY_SIGNAL", "CUSTOMER_SEGMENT_SIGNAL", "LEGAL_DOCUMENT_SIGNAL", "LEGAL_NOTICE_SIGNAL", "VENDOR_PROCESSING_SIGNAL", "SUPPORT_CONTEXT_SIGNAL", "MONEY_MOVEMENT_SIGNAL", "LICENSING_REGULATORY_SIGNAL", "COUNTERPARTY_INSTITUTION_SIGNAL", "CONSUMER_DISCLOSURE_SIGNAL", "GRIEVANCE_REDRESSAL_SIGNAL"]);
export const ADAPTERS = Object.freeze([
  { adapter_id: "ai-native", adapter_type: "capability_overlay", paths: ["/ai", "/models", "/agents", "/llm", "/assistant", "/automation", "/generation", "/prediction", "/ranking", "/classification"] },
  { adapter_id: "ai-governance", adapter_type: "primary_domain_package", paths: ["/governance", "/model-risk", "/ai-compliance", "/responsible-ai", "/safety", "/evals", "/guardrails"] },
  { adapter_id: "fintech", adapter_type: "primary_domain_package", paths: ["/payments", "/pay", "/lending", "/loans", "/loan", "/personal-loan", "/business-loan", "/home-loan", "/credit", "/credit-card", "/cards", "/card", "/underwriting", "/banking", "/bank", "/accounts", "/savings", "/current-account", "/deposits", "/upi", "/wallet", "/wallets", "/remittance", "/transfers", "/transfer", "/payouts", "/collections", "/settlement", "/kyc", "/aml", "/onboarding", "/risk", "/fraud", "/insurance", "/investments", "/investing", "/mutual-funds", "/broking", "/trading", "/securities", "/wealth", "/forex", "/crypto", "/fees", "/rates", "/interest-rates", "/charges", "/schedule-of-charges", "/mitc", "/kfs", "/key-fact-statement", "/fair-practice-code", "/interest-rate-policy", "/deposit-insurance"] },
  { adapter_id: "healthtech", adapter_type: "primary_domain_package", paths: ["/patients", "/clinical", "/diagnosis", "/triage", "/medical", "/health", "/hipaa", "/care"] },
  { adapter_id: "hrtech", adapter_type: "primary_domain_package", paths: ["/hiring", "/recruiting", "/screening", "/assessment", "/performance", "/workforce", "/talent"] },
  { adapter_id: "privacy", adapter_type: "regulatory_overlay", paths: ["/privacy", "/dpa", "/subprocessors", "/cookies", "/gdpr", "/dpdp", "/ccpa", "/data-processing"] }
]);

function loadDomainSourceHintPacks() {
  const packs = [];
  try {
    if (!fs.existsSync(DOMAIN_SOURCE_HINTS_DIR)) return packs;
    for (const file of fs.readdirSync(DOMAIN_SOURCE_HINTS_DIR).sort()) {
      if (!file.endsWith(".source-hints.json")) continue;
      try {
        const parsed = JSON.parse(fs.readFileSync(path.join(DOMAIN_SOURCE_HINTS_DIR, file), "utf8"));
        if (!parsed || parsed.may_narrow_discovery === true || parsed.may_exclude_sources === true) continue;
        packs.push({
          domain_id: String(parsed.domain_id || file.replace(/\.source-hints\.json$/, "")),
          adapter_type: String(parsed.adapter_type || "primary_domain_package"),
          hint_paths: Array.isArray(parsed.hint_paths) ? parsed.hint_paths.filter((item) => typeof item === "string" && item.startsWith("/")) : [],
          data_flow_segments: Array.isArray(parsed.data_flow_segments) ? parsed.data_flow_segments.filter((item) => typeof item === "string" && item.length > 0).map((item) => item.toLowerCase()) : []
        });
      } catch { /* malformed source-hint packs are ignored; Phase 1 must remain available */ }
    }
  } catch { /* unreadable pack directory falls back to ADAPTERS only */ }
  return packs;
}

export const DOMAIN_SOURCE_HINT_PACKS = Object.freeze(loadDomainSourceHintPacks());
const BASE_API_DATA_FLOW_FAMILY_SEGMENTS = Object.freeze(["file", "files", "batch", "upload", "download", "export", "stream", "event", "record", "object", "webhook"]);
export const API_DATA_FLOW_FAMILY_SEGMENTS = Object.freeze([...new Set([...BASE_API_DATA_FLOW_FAMILY_SEGMENTS, ...DOMAIN_SOURCE_HINT_PACKS.flatMap((pack) => pack.data_flow_segments)])]);

export function allDomainHintPaths() {
  return [...new Set([...ADAPTERS.flatMap((adapter) => adapter.paths), ...DOMAIN_SOURCE_HINT_PACKS.flatMap((pack) => pack.hint_paths)])];
}

export function loadedDomainHintPacksSummary() {
  return DOMAIN_SOURCE_HINT_PACKS.map((pack) => ({ domain_id: pack.domain_id, adapter_type: pack.adapter_type, hint_path_count: pack.hint_paths.length, data_flow_segment_count: pack.data_flow_segments.length, mode: "EXPAND_ONLY", may_narrow_discovery: false, may_exclude_sources: false }));
}

export const LEGAL_DOC_RULES = Object.freeze([
  ["terms_of_service", "legal_doc_terms_of_service", ["terms", "terms-of-service", "terms-of-use", "terms-and-conditions", "eula"]], ["privacy_policy", "legal_doc_privacy_policy", ["privacy", "privacy-policy"]], ["acceptable_use_policy", "legal_doc_acceptable_use_policy", ["aup", "acceptable-use", "acceptable-use-policy"]], ["data_processing_agreement", "legal_doc_data_processing_agreement", ["dpa", "data-processing-agreement", "data-processing-addendum"]], ["subprocessor_list", "legal_doc_subprocessor_list", ["subprocessor", "subprocessors"]], ["cookie_policy", "legal_doc_cookie_policy", ["cookie", "cookies", "cookie-policy"]], ["service_level_agreement", "legal_doc_service_level_agreement", ["sla", "service-level", "service-credit"]], ["msa", "legal_doc_msa", ["msa", "master-services", "master-service"]], ["customer_agreement", "legal_doc_customer_agreement", ["customer-agreement", "platform-agreement", "order-terms"]], ["ai_policy", "legal_doc_ai_policy", ["ai-policy", "responsible-ai", "ai-transparency"]], ["usage_policy", "legal_doc_usage_policy", ["usage-policy", "model-policy"]], ["content_policy", "legal_doc_content_policy", ["content-policy"]], ["safety_policy", "legal_doc_safety_policy", ["safety-policy", "safety"]], ["legal_notice", "legal_doc_legal_notice", ["legal-notice", "imprint", "controller"]], ["developer_terms", "legal_doc_developer_terms", ["developer-terms", "api-terms"]], ["marketplace_terms", "legal_doc_marketplace_terms", ["marketplace-terms", "seller-terms"]], ["baa", "legal_doc_baa", ["baa", "business-associate"]],
  ["fair_practice_code", "legal_doc_fair_practice_code", ["fair-practice", "fair-practices", "fair-practice-code", "fpc"]], ["grievance_redressal_policy", "legal_doc_grievance_redressal_policy", ["grievance-redressal", "grievance-policy", "grievance-redressal-policy"]], ["interest_rate_policy", "legal_doc_interest_rate_policy", ["interest-rate-policy", "interest-rates-policy", "rate-policy"]], ["key_fact_statement", "legal_doc_key_fact_statement", ["key-fact-statement", "kfs"]], ["most_important_terms_conditions", "legal_doc_most_important_terms_conditions", ["most-important-terms", "most-important-terms-and-conditions", "mitc"]], ["kyc_aml_policy", "legal_doc_kyc_aml_policy", ["kyc-policy", "aml-policy", "kyc-aml", "anti-money-laundering"]], ["deposit_insurance_disclosure", "legal_doc_deposit_insurance_disclosure", ["deposit-insurance", "dicgc"]], ["complaints_procedure", "legal_doc_complaints_procedure", ["complaints-procedure", "complaints-policy", "complaint-policy"]], ["schedule_of_charges", "legal_doc_schedule_of_charges", ["schedule-of-charges", "fees-and-charges", "tariff"]], ["responsible_lending_policy", "legal_doc_responsible_lending_policy", ["responsible-lending", "vulnerable-customers"]]
]);

export function adapterExpansionPathsFromPreflight(preflightContext = {}) { const profile = preflightContext.domain_selection_profile || preflightContext; const ids = new Set([...(profile.provisional_primary_domain_candidates || []).map((x) => x.package_id), ...(profile.provisional_capability_overlay_candidates || []).map((x) => x.package_id), ...(profile.provisional_regulatory_overlay_candidates || []).map((x) => x.package_id)].filter(Boolean)); return [...new Set(ADAPTERS.filter((adapter) => ids.has(adapter.adapter_id)).flatMap((adapter) => adapter.paths))]; }
export function selectedAdaptersFromPreflight(preflightContext = {}) { const profile = preflightContext.domain_selection_profile || preflightContext; const ids = new Set([...(profile.provisional_primary_domain_candidates || []).map((x) => x.package_id), ...(profile.provisional_capability_overlay_candidates || []).map((x) => x.package_id), ...(profile.provisional_regulatory_overlay_candidates || []).map((x) => x.package_id)].filter(Boolean)); return ADAPTERS.filter((adapter) => ids.has(adapter.adapter_id)); }
export function legalDocTypeFromUrlOrRoute(value) { const normalized = String(value || "").toLowerCase(); for (const [docType, artifactName, terms] of LEGAL_DOC_RULES) if (terms.some((term) => normalized.includes(term))) return { docType, artifactName }; return { docType: "other", artifactName: "legal_doc_other" }; }
export function neutralBucketsForSource(source = {}) {
  const base = COMMON_ROOTS.find((root) => root.id === source.common_root)?.buckets || [];
  const roles = new Set(source.source_signal_roles || []);
  const tokens = tokenSet(`${source.common_root || ""} ${source.route_type || ""} ${source.canonical_url || ""} ${source.fetch_url || ""}`);
  const extra = [];
  if (roles.has("TARGET_IDENTITY_SIGNAL")) extra.push("company_identity_sources");
  if (roles.has("COMMERCIAL_POSITIONING_SIGNAL")) extra.push("commercial_positioning_sources");
  if (roles.has("PRODUCT_ACTIVITY_SIGNAL")) extra.push("product_activity_sources");
  if (roles.has("TECHNICAL_MECHANICS_SIGNAL")) extra.push("technical_docs_sources");
  if (roles.has("API_INTEGRATION_SIGNAL")) extra.push("api_integration_sources");
  if (roles.has("COMMERCIAL_AVAILABILITY_SIGNAL")) extra.push("pricing_plan_sources");
  if (roles.has("LEGAL_DOCUMENT_SIGNAL") || roles.has("LEGAL_NOTICE_SIGNAL")) extra.push("legal_terms_sources");
  if (roles.has("DATA_PROCESSING_SIGNAL")) extra.push("privacy_security_sources", "data_processing_signals");
  if (roles.has("DATA_FLOW_SIGNAL") || roles.has("DATA_GOVERNANCE_SIGNAL") || roles.has("VENDOR_PROCESSING_SIGNAL")) extra.push("data_processing_signals");
  if (roles.has("SECURITY_TRUST_SIGNAL")) extra.push("trust_compliance_sources", "privacy_security_sources");
  if (roles.has("AI_MECHANISM_SIGNAL") || roles.has("AI_SAFETY_TRANSPARENCY_SIGNAL")) extra.push("ai_mechanism_signals");
  if (roles.has("REGULATED_ACTIVITY_SIGNAL")) extra.push("regulated_activity_signals");
  if (roles.has("CUSTOMER_SEGMENT_SIGNAL")) extra.push("customer_segment_signals");
  if (roles.has("CONTACT_NOTICE_SIGNAL")) extra.push("contact_notice_sources");
  if (roles.has("SUPPORT_CONTEXT_SIGNAL")) extra.push("support_context_sources");
  if (roles.has("MONEY_MOVEMENT_SIGNAL")) extra.push("money_movement_signals", "regulated_activity_signals");
  if (roles.has("LICENSING_REGULATORY_SIGNAL")) extra.push("regulatory_licensing_sources", "regulated_activity_signals");
  if (roles.has("COUNTERPARTY_INSTITUTION_SIGNAL")) extra.push("counterparty_institution_signals");
  if (roles.has("CONSUMER_DISCLOSURE_SIGNAL")) extra.push("consumer_disclosure_sources");
  if (roles.has("GRIEVANCE_REDRESSAL_SIGNAL")) extra.push("grievance_complaints_sources");
  if (["ai", "models", "model", "model-card", "model-cards", "agents", "agent", "llm", "assistant", "automation", "generation", "prediction", "classification", "responsible-ai"].some((token) => tokens.has(token))) extra.push("ai_mechanism_signals");
  if (["credit", "loan", "health", "clinical", "hiring", "recruit", "biometric", "kyc", "children", "minor", "student", "payment", "pay", "upi", "wallet", "remittance", "transfer", "payout", "settlement", "deposit", "savings", "card", "debit", "bnpl", "emi", "mortgage", "insurance", "broking", "securities", "trading", "forex", "crypto", "fee", "charge", "interest-rate", "apr", "mitc", "kfs", "grievance", "ombudsman", "license", "licence", "nbfc", "escrow", "nodal", "custody", "banking", "underwriting", "medical", "patient"].some((token) => tokens.has(token))) extra.push("regulated_activity_signals");
  return [...new Set([...base, ...extra].filter((bucket) => NEUTRAL_BUCKETS.includes(bucket)))];
}
export function emptyNeutralBuckets() { return Object.fromEntries(NEUTRAL_BUCKETS.map((bucket) => [bucket, { priority: primaryNeutralBucket(bucket) ? "PRIMARY" : "SECONDARY", sources: [] }])); }
export function primaryNeutralBucket(bucket) { return !["customer_segment_signals", "jurisdiction_market_signals", "support_context_sources", "thin_or_missing_source_gaps"].includes(bucket); }
export function noLockNoNarrow() { return { primary_domain_locked: false, source_discovery_narrowed: false, sources_excluded_by_domain: false, domain_specific_prompt_routing_used: false, dynamic_routing_used: false }; }
export function stableSlug(value) { return String(value || "unknown").toLowerCase().replace(/^https?:\/\//, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 56) || "unknown"; }
function tokenSet(value) { return new Set(String(value || "").toLowerCase().split(/[^a-z0-9-]+/).filter(Boolean)); }
