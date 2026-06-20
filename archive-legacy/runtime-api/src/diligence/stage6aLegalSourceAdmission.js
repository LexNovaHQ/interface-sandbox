const LEGAL_OR_GOVERNANCE_FAMILIES = new Set(["legal_profile", "governance_profile"]);

const EXPLICIT_NON_FAMILY_DOCUMENT_TYPES = new Set([
  "tos",
  "privacy_policy",
  "eula",
  "pricing_terms",
  "terms_page",
  "status_page",
  "dpa",
  "aup",
  "sla",
  "responsible_ai_page",
  "model_card",
  "trust_center",
  "security_page",
  "subprocessor_page",
  "cookie_policy",
  "data_deletion_page",
  "dsr_page",
  "grievance_page",
  "developer_terms",
  "api_terms",
  "community_guidelines",
  "baa",
  "hipaa_notice",
  "data_transfer_addendum"
]);

function compact(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function lower(value = "") {
  return compact(value).toLowerCase();
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const text = compact(value);
    if (text) return text;
  }
  return "";
}

export function stage6ASourceUrl(record = {}) {
  return firstNonEmpty(record.final_url, record.source_url, record.url, record.href);
}

export function stage6ASourceTitle(record = {}) {
  return firstNonEmpty(record.title, record.structure?.title, record.meta_title);
}

export function stage6ASourceFamily(record = {}) {
  return firstNonEmpty(record.source_family, record.profile_family, record.family, record.evidence_family, record.source_type) || "unknown";
}

export function stage6ASourceRecordRef(record = {}, index = 0) {
  return firstNonEmpty(record.source_record_ref, record.evidence_source_id, record.source_id, record.id) || `SRC_${String(index + 1).padStart(3, "0")}`;
}

export function stage6ASourceText(record = {}) {
  return firstNonEmpty(record.clean_text_lossless, record.text?.clean_text_lossless, record.normalized_text, record.text);
}

export function classifyStage6ADocumentType(record = {}, { includeBody = false } = {}) {
  const locator = `${lower(stage6ASourceUrl(record))} ${lower(stage6ASourceTitle(record))}`;
  const body = includeBody ? ` ${lower(stage6ASourceText(record).slice(0, 2000))}` : "";
  const combined = `${locator}${body}`;
  if (/terms-of-service|terms of service|\btos\b|terms and conditions/.test(combined)) return "tos";
  if (/privacy-policy|privacy policy|privacy notice/.test(combined)) return "privacy_policy";
  if (/\beula\b|end user license/.test(combined)) return "eula";
  if (/pricing terms|fees|billing terms|payment terms/.test(combined)) return "pricing_terms";
  if (/service description|service-specific terms|product terms/.test(combined)) return "service_description_page";
  if (/terms\b|terms page|legal terms/.test(combined)) return "terms_page";
  if (/status\.|system status|status page/.test(combined)) return "status_page";
  if (/data-processing|data processing agreement|data processing addendum|\bdpa\b/.test(combined)) return "dpa";
  if (/acceptable-use|acceptable use|prohibited use|usage restrictions|\baup\b/.test(combined)) return "aup";
  if (/service-level|service level agreement|\bsla\b|uptime/.test(combined)) return "sla";
  if (/responsible ai|ai policy|artificial intelligence policy/.test(combined)) return "responsible_ai_page";
  if (/model card/.test(combined)) return "model_card";
  if (/trust-center|trust center/.test(combined)) return "trust_center";
  if (/security posture|security/.test(combined)) return "security_page";
  if (/subprocessor|sub-processor|service provider list/.test(combined)) return "subprocessor_page";
  if (/cookie policy|cookies/.test(combined)) return "cookie_policy";
  if (/delete your data|data deletion|erasure request/.test(combined)) return "data_deletion_page";
  if (/data subject request|dsr|privacy rights/.test(combined)) return "dsr_page";
  if (/grievance|grievance officer/.test(combined)) return "grievance_page";
  if (/developer terms/.test(combined)) return "developer_terms";
  if (/api terms/.test(combined)) return "api_terms";
  if (/community guidelines/.test(combined)) return "community_guidelines";
  if (/business associate agreement|\bbaa\b/.test(combined)) return "baa";
  if (/hipaa/.test(combined)) return "hipaa_notice";
  if (/data transfer addendum|standard contractual/.test(combined)) return "data_transfer_addendum";
  if (includeBody && /legal|policy|terms|privacy|security|trust|compliance|status/.test(combined)) return "other_valid_control_doc";
  return "unknown";
}

export function stage6AAdmissionDecision(record = {}) {
  const family = stage6ASourceFamily(record);
  const isLegalOrGovernanceFamily = LEGAL_OR_GOVERNANCE_FAMILIES.has(family);
  const locator_document_type = classifyStage6ADocumentType(record, { includeBody: false });

  if (isLegalOrGovernanceFamily) {
    const body_document_type = classifyStage6ADocumentType(record, { includeBody: true });
    return {
      admitted: true,
      document_type: body_document_type === "unknown" ? "other_valid_control_doc" : body_document_type,
      admission_reason: "source_family_legal_or_governance",
      source_family: family,
      locator_document_type,
      body_document_type
    };
  }

  if (EXPLICIT_NON_FAMILY_DOCUMENT_TYPES.has(locator_document_type)) {
    return {
      admitted: true,
      document_type: locator_document_type,
      admission_reason: "explicit_legal_governance_locator_exception",
      source_family: family,
      locator_document_type,
      body_document_type: "not_used_for_non_family_admission"
    };
  }

  return {
    admitted: false,
    document_type: "unknown",
    admission_reason: "rejected_non_legal_family_without_explicit_locator",
    source_family: family,
    locator_document_type,
    body_document_type: "not_used_for_non_family_admission"
  };
}

export function shouldAdmitStage6ALegalSource(record = {}) {
  return stage6AAdmissionDecision(record).admitted === true;
}

export function stage6ALegalSourceAdmissionInternals() {
  return {
    legal_or_governance_families: Array.from(LEGAL_OR_GOVERNANCE_FAMILIES),
    explicit_non_family_document_types: Array.from(EXPLICIT_NON_FAMILY_DOCUMENT_TYPES)
  };
}
