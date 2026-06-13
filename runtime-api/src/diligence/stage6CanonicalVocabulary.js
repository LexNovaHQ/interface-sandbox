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
  "other_valid_control_doc",
  "unknown"
]);

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
export const STAGE6_FALLBACK_REASONS = Object.freeze(["direct_source_verification_required", "stage6_signal_unknown", "stage6_signal_conflicting", "missing_document_section_ref", "hunter_trigger_requires_line_read", "source_locator_available", "source_scope_incomplete", "unindexed_admitted_source", "unknown"]);

export const STAGE6_DATA_FLOW_ROLES = Object.freeze(["primary_input", "secondary_input", "system_metadata", "generated_output", "stored_record", "third_party_transfer", "derived_data", "unknown"]);
export const STAGE6_FEATURE_ROLES = Object.freeze(["core", "supporting", "contextual", "unknown"]);

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
