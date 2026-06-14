export const STAGE6_REVIEW_VERSION = "stage6_review_v1";
export const STAGE6_STAGE_ROLE = "stage7_navigation_index";

export const STAGE6_COMPONENTS = Object.freeze([
  "stage6a_legal_document_cartography",
  "stage6b_data_provenance",
  "stage6_integrated_handoff"
]);

export const STAGE6_CONFIDENCE_VALUES = Object.freeze(["high", "medium", "low", "unknown"]);
export const STAGE6_STANDARD_SIGNALS = Object.freeze(["visible", "not_visible", "partial", "conflicting", "not_applicable", "unknown"]);
export const STAGE6_CONTROL_SIGNALS = Object.freeze(["visible", "partial", "absent_after_search", "unclear", "not_applicable", "unknown"]);

export const STAGE6_DOCUMENT_TYPES = Object.freeze([
  "tos",
  "privacy_policy",
  "dpa",
  "aup",
  "sla",
  "eula",
  "cookie_policy",
  "subprocessor_page",
  "security_page",
  "trust_center",
  "status_page",
  "ai_policy",
  "responsible_ai_page",
  "model_card",
  "developer_terms",
  "api_terms",
  "community_guidelines",
  "data_deletion_page",
  "dsr_page",
  "grievance_page",
  "baa",
  "hipaa_notice",
  "data_transfer_addendum",
  "terms_page",
  "pricing_terms",
  "service_description_page",
  "other_valid_control_doc",
  "unknown"
]);

export const STAGE6_CORE_DOCUMENT_TYPES = Object.freeze(["tos", "privacy_policy", "dpa", "aup", "sla"]);

export const STAGE6_DOCUMENT_TYPE_CODES = Object.freeze({
  tos: "TOS",
  privacy_policy: "PRIVACY",
  dpa: "DPA",
  aup: "AUP",
  sla: "SLA",
  eula: "EULA",
  cookie_policy: "COOKIE",
  subprocessor_page: "SUBPROCESSOR",
  security_page: "SECURITY",
  trust_center: "TRUST",
  status_page: "STATUS",
  ai_policy: "AI_POLICY",
  responsible_ai_page: "RAI",
  model_card: "MODEL_CARD",
  developer_terms: "DEVTERMS",
  api_terms: "APITERMS",
  community_guidelines: "COMMUNITY",
  data_deletion_page: "DELETION",
  dsr_page: "DSR",
  grievance_page: "GRIEVANCE",
  baa: "BAA",
  hipaa_notice: "HIPAA",
  data_transfer_addendum: "DTA",
  terms_page: "TERMS",
  pricing_terms: "PRICING",
  service_description_page: "SERVICE",
  other_valid_control_doc: "OTHER",
  unknown: "UNKNOWN"
});

export const STAGE6_DOCUMENT_FAMILIES = Object.freeze(["core", "supplemental", "embedded", "operational", "unknown"]);
export const STAGE6_DOCUMENT_STATUSES = Object.freeze(["visible", "embedded", "linked", "not_visible", "unknown"]);
export const STAGE6_ACCESS_STATUSES = Object.freeze(["ingested", "metadata_only", "fetch_failed", "blocked", "not_attempted", "unknown"]);
export const STAGE6_LEGAL_UNIT_TYPES = Object.freeze(["main_section", "annexure", "schedule", "exhibit", "linked_policy", "material_table", "control_notice", "unknown"]);

export const STAGE6_SECTION_FUNCTIONS = Object.freeze([
  "definitions",
  "service_description",
  "ai_disclosure",
  "privacy_notice",
  "data_processing_terms",
  "subprocessor_terms",
  "acceptable_use_rules",
  "prohibited_use_rules",
  "security_terms",
  "breach_terms",
  "retention_deletion_terms",
  "rights_request_terms",
  "cross_border_transfer_terms",
  "liability_terms",
  "warranty_disclaimer",
  "sla_terms",
  "agentic_controls",
  "commercial_terms",
  "dispute_terms",
  "ip_ownership_terms",
  "minor_access_terms",
  "automated_decision_terms",
  "sensitive_data_terms",
  "other",
  "unknown"
]);

export const STAGE6_CONTROL_FAMILIES = Object.freeze([
  "ai_disclosure",
  "hallucination_disclaimer",
  "hitl_mandate",
  "acceptable_use",
  "prohibited_use",
  "privacy_notice",
  "data_collection",
  "data_use",
  "data_sharing",
  "subprocessor_disclosure",
  "model_provider_disclosure",
  "training_or_finetuning",
  "retention",
  "deletion",
  "data_subject_rights",
  "consent_withdrawal",
  "grievance_channel",
  "security_safeguards",
  "breach_notice",
  "cross_border_transfer",
  "liability_cap",
  "warranty_disclaimer",
  "sla_performance",
  "agentic_controls",
  "commercial_terms",
  "dispute_terms",
  "ip_ownership",
  "minor_access",
  "automated_decision",
  "sensitive_data",
  "unknown"
]);

export const STAGE6_SECTION_FUNCTION_TO_CONTROL_FAMILIES = Object.freeze({
  ai_disclosure: ["ai_disclosure", "hallucination_disclaimer"],
  privacy_notice: ["privacy_notice", "data_collection", "data_use", "data_sharing"],
  data_processing_terms: ["data_collection", "data_use", "data_subject_rights"],
  subprocessor_terms: ["subprocessor_disclosure"],
  acceptable_use_rules: ["acceptable_use"],
  prohibited_use_rules: ["prohibited_use"],
  security_terms: ["security_safeguards"],
  breach_terms: ["breach_notice"],
  retention_deletion_terms: ["retention", "deletion"],
  rights_request_terms: ["data_subject_rights", "consent_withdrawal", "grievance_channel"],
  cross_border_transfer_terms: ["cross_border_transfer"],
  liability_terms: ["liability_cap"],
  warranty_disclaimer: ["warranty_disclaimer"],
  sla_terms: ["sla_performance"],
  agentic_controls: ["agentic_controls"],
  commercial_terms: ["commercial_terms"],
  dispute_terms: ["dispute_terms"],
  ip_ownership_terms: ["ip_ownership"],
  minor_access_terms: ["minor_access"],
  automated_decision_terms: ["automated_decision"],
  sensitive_data_terms: ["sensitive_data"]
});

export const STAGE6_RELATIONSHIP_TYPES = Object.freeze([
  "incorporates_by_reference",
  "supplements",
  "controls_on_conflict",
  "linked_from",
  "defines_terms_for",
  "activates_when",
  "supersedes_for_subject_matter",
  "embedded_within",
  "unknown"
]);

export const STAGE6_MISMATCH_TYPES = Object.freeze([
  "feature_vs_document",
  "data_flow_vs_document",
  "document_vs_document",
  "claim_vs_absence",
  "stack_vs_reality",
  "unknown"
]);

export const STAGE6_MISMATCH_SIGNALS = Object.freeze([
  "expected_signal_absent",
  "expected_signal_partial",
  "conflicting_signal",
  "source_absent",
  "source_unclear",
  "unknown"
]);

export const STAGE6_BASIS_CODES = Object.freeze([
  "source_bundle_record_ref",
  "stage5_feature_ref",
  "stage5_data_provenance",
  "stage5_regulated_surface",
  "stage5_architecture_hint",
  "stage6_legal_unit_ref",
  "stage6_control_signal_ref",
  "stage6_data_flow_ref",
  "direct_policy_signal",
  "indirect_policy_signal",
  "absence_after_search",
  "macro_heading_classification",
  "source_metadata",
  "model_semantic_classification",
  "deterministic_seed",
  "unknown"
]);

export const STAGE6_SOURCE_TYPES = Object.freeze([
  "legal_document",
  "privacy_document",
  "terms_document",
  "security_document",
  "trust_document",
  "status_document",
  "feature_source",
  "public_page",
  "api_doc",
  "help_doc",
  "source_bundle_record",
  "unknown"
]);

export const STAGE6_LOCATOR_TYPES = Object.freeze(["heading_path", "url_fragment", "text_anchor", "source_record", "page_url", "chunk_index", "unknown"]);
export const STAGE6_ABSENCE_BASIS = Object.freeze(["searched_legal_docs", "searched_privacy_docs", "searched_security_docs", "searched_trust_docs", "searched_public_sources", "source_not_available", "access_failed", "not_enough_context", "unknown"]);
export const STAGE6_FALLBACK_REASONS = Object.freeze(["direct_source_verification_required", "stage6_signal_unknown", "stage6_signal_conflicting", "missing_legal_unit_ref", "hunter_trigger_requires_line_read", "source_locator_available", "source_scope_incomplete", "unindexed_admitted_source", "unknown"]);

export const STAGE6_DATA_FLOW_ROLES = Object.freeze(["primary_input", "secondary_input", "system_metadata", "generated_output", "stored_record", "third_party_transfer", "derived_data", "unknown"]);
export const STAGE6_FEATURE_ROLES = Object.freeze(["core", "supporting", "contextual", "unknown"]);
export const STAGE6_DATA_SUBJECT_TYPES = Object.freeze(["customer_user", "end_user", "employee", "contractor", "website_visitor", "developer_user", "child_or_minor", "business_contact", "unknown"]);
export const STAGE6_DATA_CATEGORY_TYPES = Object.freeze(["account_data", "contact_data", "usage_data", "device_data", "network_data", "location_data", "prompt_input", "uploaded_file", "generated_output", "embedding_vector", "action_log", "payment_data", "support_ticket", "employee_hr_data", "creative_work_product", "source_code", "credential_or_secret", "client_confidential_data", "biometric_data", "health_data", "financial_data", "unknown"]);
export const STAGE6_COLLECTION_CONTEXTS = Object.freeze(["user_provided", "customer_provided", "employee_provided", "automatically_collected", "third_party_imported", "system_generated", "derived_or_inferred", "unknown"]);
export const STAGE6_PROCESSING_ACTIONS = Object.freeze(["collect", "store", "retrieve", "generate", "summarize", "classify", "embed", "rank", "route", "transmit", "log", "monitor", "delete", "anonymize", "aggregate", "fine_tune", "unknown"]);
export const STAGE6_PROCESSING_PURPOSES = Object.freeze(["service_delivery", "ai_generation", "personalization", "analytics", "security", "billing", "support", "compliance", "product_improvement", "model_training", "fraud_prevention", "internal_governance", "unknown"]);
export const STAGE6_OUTPUT_CATEGORIES = Object.freeze(["ai_output", "recommendation", "classification", "decision_support", "automated_action", "system_log", "analytics", "none", "unknown"]);
export const STAGE6_ROLE_ALLOCATION_VALUES = Object.freeze(["controller", "processor", "subprocessor", "service_provider", "business", "third_party", "independent_controller", "principal", "agent", "platform_provider", "not_visible", "not_applicable", "unknown"]);
export const STAGE6_REGIME_BASIS_TAGS = Object.freeze(["personal_data", "sensitive_data", "children_data", "employee_data", "automated_decision", "high_risk_ai", "cross_border_transfer", "processor_relationship", "subprocessor_relationship", "consumer_rights", "deletion_rights", "training_or_finetuning", "unknown"]);
export const STAGE6_RECIPIENT_CATEGORIES = Object.freeze(["model_provider", "cloud_provider", "payment_provider", "analytics_provider", "support_provider", "security_provider", "workflow_provider", "storage_provider", "unknown"]);
export const STAGE6_REGIONS = Object.freeze(["us", "eu", "uk", "india", "canada", "australia", "singapore", "global", "not_visible", "unknown"]);
export const STAGE6_EVIDENCE_STRENGTH = Object.freeze(["direct_source", "inferred_from_stage5", "inferred_from_stage4", "model_classified", "unknown"]);
export const STAGE6_AUDIT_SEVERITY = Object.freeze(["PASS", "WARNING", "REPAIR", "CRITICAL"]);
export const STAGE6_LIMITATION_REASON_CODES = Object.freeze(["source_missing", "source_conflicting", "source_access_failed", "stage5_signal_unknown", "legal_unit_ref_missing", "low_confidence_inference", "model_skipped", "unknown"]);
export const STAGE6_LIMITATION_IMPACT_CODES = Object.freeze(["no_stage7_block", "requires_source_line_read", "reduces_confidence", "partial_navigation_only", "unknown"]);

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return [];
  return [value];
}

function compact(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function uniqueStage6Values(values = []) {
  return [...new Set(asArray(values).map(compact).filter(Boolean))];
}

export function normalizeStage6Enum(value, allowedValues, fallback = "unknown") {
  const text = compact(value);
  return allowedValues.includes(text) ? text : fallback;
}

export function normalizeStage6BasisCodes(values = []) {
  const allowed = new Set(STAGE6_BASIS_CODES);
  const normalized = [];
  for (const value of uniqueStage6Values(values)) {
    if (allowed.has(value)) normalized.push(value);
  }
  return uniqueStage6Values(normalized.length ? normalized : ["unknown"]);
}
