const DOCUMENT_TYPE_RULES = Object.freeze([
  rule("direct_legal_signal_profile", ["legal_signal_derivation_profile", "privacy_grievance_contact_signal_map", "consent_manager_signal_map"]),
  rule("upstream_activity_profile", ["target_feature_profile", "feature_candidate_inventory", "activity", "mechanics"]),
  rule("upstream_target_profile", ["target_profile", "target_profile_forensics", "target identity"]),
  rule("privacy_notice", ["privacy", "privacy-policy", "privacy_notice", "personal data", "data protection"]),
  rule("dpa", ["dpa", "data processing", "data-processing", "data protection addendum", "processor terms"]),
  rule("subprocessor_list", ["subprocessor", "sub-processor", "processors", "vendors"]),
  rule("security_trust", ["security", "trust", "soc", "iso", "encryption", "compliance"]),
  rule("cookie_tracking_notice", ["cookie", "cookies", "tracking", "analytics", "advertising", "do not sell", "sharing"]),
  rule("ai_policy", ["ai policy", "artificial intelligence", "model", "training", "fine-tuning", "safety", "transparency"]),
  rule("docs_api_data_flow", ["docs", "documentation", "api", "developer", "sdk", "webhook", "integration"]),
  rule("help_rights_request", ["help", "support", "rights", "delete", "deletion", "export", "download", "account"]),
  rule("retention_deletion_export", ["retention", "deletion", "delete", "export", "return", "portability", "backup"]),
  rule("incident_breach_security", ["incident", "breach", "security event", "vulnerability", "report"]),
  rule("terms", ["terms", "tos", "terms-of-service", "service terms", "customer terms", "eula"]),
  rule("legal_navigation_ref", ["legal", "legal center", "notice", "governing", "jurisdiction"]),
  rule("product_activity_context", ["product", "feature", "solution", "platform", "workflow"])
]);

export const PHASE7_DOCUMENT_TYPES = Object.freeze(DOCUMENT_TYPE_RULES.map((row) => row.document_type));

export function classifyPhase7SourceDocumentType(input = {}) {
  const haystack = [input.artifact_name, input.source_family, input.source_url_or_route, input.route_label, input.title, input.path, input.locator_kind].map((value) => String(value || "").toLowerCase()).join(" ");
  const match = DOCUMENT_TYPE_RULES.find((row) => row.keywords.some((keyword) => haystack.includes(keyword)));
  return match?.document_type || "unclassified_navigation_ref";
}

export function isPhase7LegalLosslessFamily(sourceFamily = "") {
  return /^lossless_family__L\d_/i.test(String(sourceFamily));
}

export function isPhase7DataLosslessFamily(sourceFamily = "") {
  return /^lossless_family__D\d_/i.test(String(sourceFamily));
}

export function isPhase7NavigationOnlyDocumentType(documentType = "") {
  return ["legal_navigation_ref", "direct_legal_signal_profile", "upstream_activity_profile", "upstream_target_profile", "unclassified_navigation_ref"].includes(documentType);
}

function rule(document_type, keywords) {
  return Object.freeze({ document_type, keywords: Object.freeze(keywords) });
}
