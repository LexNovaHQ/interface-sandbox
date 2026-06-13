const DOCUMENT_ORDER = ["ToS", "Privacy Policy", "DPA", "AUP", "SLA"];
const DOCUMENT_TYPES = new Set(DOCUMENT_ORDER);
const EVIDENCE_STATUSES = new Set(["INGESTED", "ABSENT", "ACCESS_FAILED", "INSUFFICIENT"]);
const REDLINE_TYPES = new Set(["QUOTE_VS_QUOTE", "CLAIM_VS_ABSENCE", "STACK_VS_REALITY"]);
const STAGE6A_REQUIRED_CARTOGRAPHY_ARRAYS = [
  "legal_document_inventory",
  "legal_document_index",
  "document_relationship_map",
  "document_control_signal_map",
  "document_mismatch_signal_map",
  "legal_stack_limitations"
];
const STAGE6A_REQUIRED_NAVIGATION_ARRAYS = [
  "feature_to_data_flow_index",
  "feature_to_document_section_index",
  "control_family_index",
  "data_signal_index",
  "document_source_locator_index",
  "absence_unknown_index",
  "fallback_source_packet"
];
const FORBIDDEN_CANONICAL_CARTOGRAPHY_KEYS = new Set([
  "quote",
  "evidence_quote",
  "excerpt_text",
  "excerpt",
  "contradicts",
  "false_belief_note",
  "coverage_note",
  "narrative",
  "explanation",
  "analysis"
]);
const FORBIDDEN_DATA_PROVENANCE_KEYS = new Set([
  "quote",
  "evidence_quote",
  "excerpt_text",
  "excerpt",
  "contradicts",
  "narrative",
  "explanation",
  "analysis",
  "legal_conclusion",
  "compliance_verdict",
  "recommendation",
  "control_gap",
  "threat_status",
  "triggered_threat_ids",
  "hunter_status",
  "final_status"
]);
const FORBIDDEN_6A_DUPLICATION_KEYS_IN_6B = new Set([
  "heading_text",
  "section_path",
  "section_function",
  "structural_zone",
  "document_status",
  "doc_title",
  "document_relationship_map",
  "legal_document_index",
  "legal_document_inventory",
  "document_control_signal_map"
]);
const FORBIDDEN_KEYS = new Set([
  "registry_ledger",
  "registry_evaluation",
  "final_status",
  "controlled_rows",
  "insufficient_evidence_rows",
  "operator_challenge",
  "report_data",
  "technical_audit_log",
  "assembly_route",
  "vault_confirmation_questions",
  "vault_prefill_suggestions",
  "vault_payload",
  "html"
]);
const FORBIDDEN_STATUSES = new Set(["TRIGGERED", "CONTROLLED", "NOT_TRIGGERED", "NOT_APPLICABLE", "INSUFFICIENT_EVIDENCE"]);
const SIGNALS = new Set(["visible", "not_visible", "partial", "conflicting", "not_applicable", "unknown"]);
const CONFIDENCE = new Set(["high", "medium", "low", "unknown"]);
const FEATURE_ROLES = new Set(["core", "supporting", "contextual", "unknown"]);
const FLOW_ROLES = new Set(["primary_input", "secondary_input", "system_metadata", "generated_output", "stored_record", "third_party_transfer", "derived_data", "unknown"]);
const SUBJECT_TYPES = new Set(["website_visitor", "registered_user", "customer_admin", "customer_end_user", "developer", "employee", "contractor", "candidate", "patient", "child_or_minor", "business_contact", "unknown"]);
const DATA_CATEGORIES = new Set(["account_identity", "contact_data", "authentication_data", "prompt_text", "uploaded_file", "audio", "image_video", "generated_output", "usage_logs", "device_network_data", "payment_billing", "support_communications", "employment_hr", "financial", "health", "biometric_identifier", "child_data", "location", "public_web_data", "third_party_dataset", "unknown"]);
const DATA_ORIGINS = new Set(["data_principal_provided", "customer_provided", "third_party_provided", "public_web", "system_generated", "inferred", "unknown"]);
const COLLECTION_CONTEXTS = new Set(["website", "account_signup", "service_input", "api_input", "uploaded_document", "support", "billing", "telemetry", "third_party_import", "employee_workflow", "unknown"]);
const PROCESSING_ACTIONS = new Set(["collect", "receive", "store", "embed", "retrieve", "infer", "generate", "summarize", "translate", "classify", "score", "rank", "recommend", "route", "share", "transfer", "delete", "log", "monitor", "train_or_finetune", "unknown"]);
const PURPOSE_CATEGORIES = new Set(["service_delivery", "account_management", "security", "billing", "analytics", "support", "model_improvement", "legal_compliance", "marketing", "unknown"]);
const OUTPUT_CATEGORIES = new Set(["generated_output", "classification_score", "summary", "recommendation", "route_decision", "stored_record", "audit_log", "notification", "unknown"]);
const DPDP_ROLES = new Set(["data_fiduciary", "data_processor", "both", "not_applicable", "unknown"]);
const GDPR_ROLES = new Set(["controller", "processor", "joint_controller", "subprocessor", "both", "not_applicable", "unknown"]);
const US_ROLES = new Set(["business", "service_provider", "contractor", "third_party", "not_applicable", "unknown"]);
const CUSTOMER_ROLES = new Set(["controller_or_data_fiduciary", "processor", "business", "service_provider", "not_applicable", "unknown"]);
const THIRD_PARTY_ROLES = new Set(["processor", "subprocessor", "service_provider", "contractor", "third_party", "model_provider", "cloud_provider", "analytics_provider", "payment_provider", "not_applicable", "unknown"]);
const BASIS_TAGS = new Set(["india_entity", "india_users", "eu_users", "uk_users", "california_users", "global_users", "privacy_policy_mentions_regime", "terms_mentions_regime", "no_regime_signal", "unknown"]);
const GDPR_BASIS = new Set(["consent", "contract", "legal_obligation", "vital_interests", "public_task", "legitimate_interests", "not_visible", "not_applicable", "unknown"]);
const DPDP_BASIS = new Set(["consent", "legitimate_use", "not_visible", "not_applicable", "unknown"]);
const RIGHTS_CHANNELS = new Set(["email", "web_form", "dashboard", "mailing_address", "consent_manager", "not_visible", "unknown"]);
const RECIPIENT_CATEGORIES = new Set(["ai_model_provider", "cloud_host", "vector_database", "analytics_provider", "payment_processor", "email_provider", "authentication_provider", "support_tool", "customer_system", "government_or_legal", "unknown"]);
const REGIONS = new Set(["india", "eu_eea", "uk", "us", "canada", "global", "unknown", "not_applicable"]);
const EVIDENCE_STRENGTH = new Set(["direct", "indirect", "inferred_from_feature", "absence_after_search", "conflicting", "unknown"]);
const SIGNAL_TYPES = new Set(["personal_data", "sensitive_data", "children_data", "biometric_data", "financial_data", "health_data", "employment_data", "cross_border_transfer", "processor_chain", "subprocessor", "model_provider", "cloud_provider", "analytics_provider", "payment_provider", "training_or_finetuning", "rag", "embedding", "vector_store", "deletion", "retention", "notice", "consent", "withdrawal", "rights_channel", "security", "breach_notice", "automated_decision", "unknown"]);
const LEGAL_ADVICE_GUIDANCE_PHRASES = [
  /\bcertif(?:y|ies|ied) compliance\b/i,
  /\bconfirmed violation\b/i,
  /\billegal\b/i,
  /\bunenforceable\b/i
];
const UNADMITTED_DOCUMENT_NOTE = "Model referenced a legal document URL that was not part of the admitted evidence buffer; document not treated as reviewed evidence until deterministic reconciliation fetches and extracts it.";

function push(errors, instancePath, message, params = {}) {
  errors.push({ keyword: "legal_stack_review_guardrail", instancePath, schemaPath: "#/legalStackReviewGuardrails", message, params });
}
function warn(warnings, instancePath, message, params = {}) {
  warnings.push({ keyword: "legal_stack_review_guidance", instancePath, schemaPath: "#/legalStackReviewGuidance", message, params });
}
function walk(value, errors, warnings, path = "") {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) { value.forEach((item, index) => walk(item, errors, warnings, `${path}/${index}`)); return; }
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}/${key}`;
    if (FORBIDDEN_KEYS.has(key)) push(errors, childPath, `forbidden key emitted: ${key}`, { key });
    if (typeof child === "string") {
      if (FORBIDDEN_STATUSES.has(child.trim())) push(errors, childPath, `forbidden registry status emitted: ${child}`, { value: child });
      for (const pattern of LEGAL_ADVICE_GUIDANCE_PHRASES) if (pattern.test(child)) warn(warnings, childPath, "legal-advice/compliance conclusion wording detected; treat as guidance, not runtime blocker", { value: child });
    }
    walk(child, errors, warnings, childPath);
  }
}
function nonEmptyString(value) { return typeof value === "string" && value.trim().length > 0; }
function isObject(value) { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function normalizeUrl(value) { try { const url = new URL(value); url.hash = ""; if ((url.pathname || "") !== "/") url.pathname = url.pathname.replace(/\/+$/, "") || "/"; return url.toString(); } catch { return String(value || "").trim(); } }
function evidenceUrls(evidenceBuffer = []) { const urls = new Set(["N/A", "manual_text"]); for (const record of Array.isArray(evidenceBuffer) ? evidenceBuffer : []) { for (const value of [record?.source_url, record?.final_url, record?.url]) { if (typeof value === "string" && value.trim()) { urls.add(value.trim()); urls.add(normalizeUrl(value)); } } } return urls; }
function legalDocumentUrlIsAdmitted(documentUrl, admittedUrls) { return admittedUrls.has(documentUrl) || admittedUrls.has(normalizeUrl(documentUrl)); }
function downgradeUnadmittedLegalDocument(doc, warnings, base) {
  const emittedUrl = String(doc?.document_url || "").trim();
  const existingCandidates = Array.isArray(doc.unadmitted_document_url_candidates) ? doc.unadmitted_document_url_candidates : [];
  doc.unadmitted_document_url = emittedUrl || null;
  doc.unadmitted_document_url_candidates = [...new Set([...existingCandidates, emittedUrl].filter(Boolean))];
  doc.exists = false;
  doc.document_url = "N/A";
  doc.evidence_status = "INSUFFICIENT";
  doc.covers = null;
  doc.misses = [...new Set([...(Array.isArray(doc.misses) ? doc.misses : []), UNADMITTED_DOCUMENT_NOTE, emittedUrl ? `Unadmitted legal document URL candidate: ${emittedUrl}` : ""])].filter(Boolean);
  warn(warnings, `${base}/document_url`, "legal document URL was not admitted as evidence; preserved candidate for deterministic reconciliation and downgraded document pending fetch/extraction", { document_url: emittedUrl });
}
function requireArray(value, errors, instancePath, label) {
  if (!Array.isArray(value)) {
    push(errors, instancePath, `${label} must be an array`);
    return false;
  }
  return true;
}
function requireObject(value, errors, instancePath, label) {
  if (!isObject(value)) {
    push(errors, instancePath, `${label} must be an object`);
    return false;
  }
  return true;
}
function validateEnum(value, allowed, errors, instancePath, label) {
  if (!allowed.has(value)) push(errors, instancePath, `${label} must use a controlled value`, { value });
}
function validateEnumArray(value, allowed, errors, instancePath, label) {
  if (!requireArray(value, errors, instancePath, label)) return;
  value.forEach((item, index) => validateEnum(item, allowed, errors, `${instancePath}/${index}`, label));
}
function walkCartography(value, errors, path = "/legal_document_cartography") {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkCartography(item, errors, `${path}/${index}`));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}/${key}`;
    if (FORBIDDEN_CANONICAL_CARTOGRAPHY_KEYS.has(key)) {
      push(errors, childPath, `forbidden quote/prose key inside legal_document_cartography: ${key}`, { key });
    }
    walkCartography(child, errors, childPath);
  }
}
function walkDataProvenance(value, errors, path = "/data_provenance_profile") {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkDataProvenance(item, errors, `${path}/${index}`));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}/${key}`;
    if (FORBIDDEN_DATA_PROVENANCE_KEYS.has(key)) push(errors, childPath, `forbidden quote/prose/conclusion key inside data_provenance_profile: ${key}`, { key });
    if (FORBIDDEN_6A_DUPLICATION_KEYS_IN_6B.has(key)) push(errors, childPath, `6B must not duplicate 6A cartography field: ${key}`, { key });
    walkDataProvenance(child, errors, childPath);
  }
}
function validateDataFlow(row, errors, base) {
  if (!requireObject(row, errors, base, "data_flow_profile item")) return;
  for (const field of ["flow_id", "feature_id", "provenance_id"]) if (!nonEmptyString(row[field])) push(errors, `${base}/${field}`, `${field} must be a non-empty ref string`);
  validateEnum(row.feature_role, FEATURE_ROLES, errors, `${base}/feature_role`, "feature_role");
  validateEnum(row.flow_role, FLOW_ROLES, errors, `${base}/flow_role`, "flow_role");
  validateEnum(row.confidence, CONFIDENCE, errors, `${base}/confidence`, "confidence");

  const requiredBlocks = ["data_subject", "data_category", "processing", "role_allocation", "regime_relevance", "notice", "consent_basis", "rights", "processor_chain", "transfer_location", "retention_deletion_ai", "security_accountability", "source_trace"];
  for (const block of requiredBlocks) requireObject(row[block], errors, `${base}/${block}`, block);
  if (isObject(row.data_subject)) {
    validateEnum(row.data_subject.subject_type, SUBJECT_TYPES, errors, `${base}/data_subject/subject_type`, "subject_type");
    validateEnum(row.data_subject.dpdp_label, new Set(["data_principal", "not_applicable", "unknown"]), errors, `${base}/data_subject/dpdp_label`, "dpdp_label");
    validateEnum(row.data_subject.gdpr_label, new Set(["data_subject", "not_applicable", "unknown"]), errors, `${base}/data_subject/gdpr_label`, "gdpr_label");
    validateEnum(row.data_subject.us_label, new Set(["consumer", "employee", "business_contact", "not_applicable", "unknown"]), errors, `${base}/data_subject/us_label`, "us_label");
    validateEnum(row.data_subject.minor_signal, SIGNALS, errors, `${base}/data_subject/minor_signal`, "minor_signal");
  }
  if (isObject(row.data_category)) {
    validateEnum(row.data_category.category, DATA_CATEGORIES, errors, `${base}/data_category/category`, "data_category.category");
    for (const key of ["personal_data_signal", "sensitive_signal_gdpr", "sensitive_signal_us", "sensitive_signal_dpdp", "biometric_signal"]) validateEnum(row.data_category[key], SIGNALS, errors, `${base}/data_category/${key}`, key);
  }
  if (isObject(row.processing)) {
    validateEnum(row.processing.data_origin, DATA_ORIGINS, errors, `${base}/processing/data_origin`, "data_origin");
    validateEnum(row.processing.collection_context, COLLECTION_CONTEXTS, errors, `${base}/processing/collection_context`, "collection_context");
    validateEnumArray(row.processing.processing_actions, PROCESSING_ACTIONS, errors, `${base}/processing/processing_actions`, "processing_actions");
    validateEnum(row.processing.purpose_category, PURPOSE_CATEGORIES, errors, `${base}/processing/purpose_category`, "purpose_category");
    validateEnum(row.processing.output_category, OUTPUT_CATEGORIES, errors, `${base}/processing/output_category`, "output_category");
  }
  if (isObject(row.role_allocation)) {
    validateEnum(row.role_allocation.dpdp_company_role, DPDP_ROLES, errors, `${base}/role_allocation/dpdp_company_role`, "dpdp_company_role");
    validateEnum(row.role_allocation.gdpr_company_role, GDPR_ROLES, errors, `${base}/role_allocation/gdpr_company_role`, "gdpr_company_role");
    validateEnum(row.role_allocation.us_company_role, US_ROLES, errors, `${base}/role_allocation/us_company_role`, "us_company_role");
    validateEnum(row.role_allocation.customer_role, CUSTOMER_ROLES, errors, `${base}/role_allocation/customer_role`, "customer_role");
    validateEnum(row.role_allocation.third_party_role, THIRD_PARTY_ROLES, errors, `${base}/role_allocation/third_party_role`, "third_party_role");
    validateEnum(row.role_allocation.role_confidence, CONFIDENCE, errors, `${base}/role_allocation/role_confidence`, "role_confidence");
  }
  if (isObject(row.regime_relevance)) {
    for (const key of ["dpdp", "gdpr", "uk_gdpr", "ccpa_cpra", "us_state_privacy"]) validateEnum(row.regime_relevance[key], SIGNALS, errors, `${base}/regime_relevance/${key}`, key);
    validateEnumArray(row.regime_relevance.basis_tags, BASIS_TAGS, errors, `${base}/regime_relevance/basis_tags`, "basis_tags");
  }
  if (isObject(row.notice)) for (const key of ["notice_signal", "purpose_notice_signal", "data_category_notice_signal", "ai_processing_notice_signal", "model_provider_notice_signal"]) validateEnum(row.notice[key], SIGNALS, errors, `${base}/notice/${key}`, key);
  if (isObject(row.consent_basis)) {
    validateEnum(row.consent_basis.gdpr_lawful_basis_signal, GDPR_BASIS, errors, `${base}/consent_basis/gdpr_lawful_basis_signal`, "gdpr_lawful_basis_signal");
    validateEnum(row.consent_basis.dpdp_basis_signal, DPDP_BASIS, errors, `${base}/consent_basis/dpdp_basis_signal`, "dpdp_basis_signal");
    for (const key of ["consent_collection_signal", "withdrawal_signal", "consent_manager_signal"]) validateEnum(row.consent_basis[key], SIGNALS, errors, `${base}/consent_basis/${key}`, key);
  }
  if (isObject(row.rights)) {
    for (const key of ["access_signal", "correction_signal", "deletion_erasure_signal", "withdrawal_signal", "portability_signal", "objection_optout_signal", "grievance_signal", "nomination_signal_dpdp"]) validateEnum(row.rights[key], SIGNALS, errors, `${base}/rights/${key}`, key);
    validateEnum(row.rights.rights_channel_type, RIGHTS_CHANNELS, errors, `${base}/rights/rights_channel_type`, "rights_channel_type");
  }
  if (isObject(row.processor_chain)) {
    for (const key of ["processor_signal", "subprocessor_signal", "model_provider_signal", "cloud_provider_signal", "analytics_provider_signal", "payment_provider_signal"]) validateEnum(row.processor_chain[key], SIGNALS, errors, `${base}/processor_chain/${key}`, key);
    validateEnumArray(row.processor_chain.recipient_categories, RECIPIENT_CATEGORIES, errors, `${base}/processor_chain/recipient_categories`, "recipient_categories");
  }
  if (isObject(row.transfer_location)) {
    validateEnum(row.transfer_location.origin_region_signal, REGIONS, errors, `${base}/transfer_location/origin_region_signal`, "origin_region_signal");
    validateEnum(row.transfer_location.destination_region_signal, REGIONS, errors, `${base}/transfer_location/destination_region_signal`, "destination_region_signal");
    for (const key of ["cross_border_transfer_signal", "transfer_basis_signal_gdpr", "transfer_restriction_signal_dpdp"]) validateEnum(row.transfer_location[key], SIGNALS, errors, `${base}/transfer_location/${key}`, key);
  }
  if (isObject(row.retention_deletion_ai)) for (const key of ["retention_period_signal", "deletion_mechanism_signal", "embedding_signal", "vector_store_signal", "rag_signal", "fine_tuning_signal", "training_use_signal", "model_weight_risk_signal"]) validateEnum(row.retention_deletion_ai[key], SIGNALS, errors, `${base}/retention_deletion_ai/${key}`, key);
  if (isObject(row.security_accountability)) for (const key of ["security_safeguard_signal", "encryption_signal", "access_control_signal", "audit_log_signal", "breach_notice_signal", "grievance_officer_signal", "dpo_signal"]) validateEnum(row.security_accountability[key], SIGNALS, errors, `${base}/security_accountability/${key}`, key);
  if (isObject(row.source_trace)) validateEnum(row.source_trace.evidence_strength, EVIDENCE_STRENGTH, errors, `${base}/source_trace/evidence_strength`, "evidence_strength");
}
function validateDataProvenanceProfile(review, errors) {
  const profile = review.data_provenance_profile;
  if (!requireObject(profile, errors, "/data_provenance_profile", "data_provenance_profile")) return;
  if (profile.data_provenance_profile_version !== "data_provenance_profile_v1") push(errors, "/data_provenance_profile/data_provenance_profile_version", "data_provenance_profile_version must equal data_provenance_profile_v1", { value: profile.data_provenance_profile_version });
  requireArray(profile.data_flow_profile, errors, "/data_provenance_profile/data_flow_profile", "data_flow_profile");
  requireObject(profile.profile_summary_signals, errors, "/data_provenance_profile/profile_summary_signals", "profile_summary_signals");
  requireArray(profile.data_profile_limitations, errors, "/data_provenance_profile/data_profile_limitations", "data_profile_limitations");
  walkDataProvenance(profile, errors);
  (Array.isArray(profile.data_flow_profile) ? profile.data_flow_profile : []).forEach((row, index) => validateDataFlow(row, errors, `/data_provenance_profile/data_flow_profile/${index}`));
  if (isObject(profile.profile_summary_signals)) for (const key of ["personal_data_visible", "sensitive_data_visible", "children_data_visible", "cross_border_visible", "subprocessor_visible", "training_or_finetuning_visible", "deletion_channel_visible", "automated_decision_visible"]) validateEnum(profile.profile_summary_signals[key], SIGNALS, errors, `/data_provenance_profile/profile_summary_signals/${key}`, key);
}
function validateLegalDocumentCartography(review, errors) {
  if (review.legal_stack_review_version !== "legal_stack_review_v2") {
    push(errors, "/legal_stack_review_version", "legal_stack_review_version must equal legal_stack_review_v2", { value: review.legal_stack_review_version });
  }
  if (review.stage_role !== "stage7_navigation_index") {
    push(errors, "/stage_role", "stage_role must equal stage7_navigation_index", { value: review.stage_role });
  }

  const cartography = review.legal_document_cartography;
  if (!requireObject(cartography, errors, "/legal_document_cartography", "legal_document_cartography")) return;
  for (const key of STAGE6A_REQUIRED_CARTOGRAPHY_ARRAYS) {
    requireArray(cartography[key], errors, `/legal_document_cartography/${key}`, `legal_document_cartography.${key}`);
  }
  requireObject(cartography.legal_stack_summary_signals, errors, "/legal_document_cartography/legal_stack_summary_signals", "legal_stack_summary_signals");
  walkCartography(cartography, errors);

  const mismatches = Array.isArray(cartography.document_mismatch_signal_map) ? cartography.document_mismatch_signal_map : [];
  mismatches.forEach((item, index) => {
    if (!isObject(item)) {
      push(errors, `/legal_document_cartography/document_mismatch_signal_map/${index}`, "document_mismatch_signal_map item must be an object");
      return;
    }
    for (const key of Object.keys(item)) {
      if (FORBIDDEN_CANONICAL_CARTOGRAPHY_KEYS.has(key)) {
        push(errors, `/legal_document_cartography/document_mismatch_signal_map/${index}/${key}`, `forbidden quote/prose key inside document_mismatch_signal_map: ${key}`, { key });
      }
    }
  });

  const nav = review.stage7_navigation_index;
  if (!requireObject(nav, errors, "/stage7_navigation_index", "stage7_navigation_index")) return;
  for (const key of STAGE6A_REQUIRED_NAVIGATION_ARRAYS) {
    requireArray(nav[key], errors, `/stage7_navigation_index/${key}`, `stage7_navigation_index.${key}`);
  }
  (Array.isArray(nav.data_signal_index) ? nav.data_signal_index : []).forEach((item, index) => {
    if (isObject(item)) validateEnum(item.signal_type, SIGNAL_TYPES, errors, `/stage7_navigation_index/data_signal_index/${index}/signal_type`, "signal_type");
  });
}

export function validateLegalStackReviewGuardrails(review, { evidenceBuffer = [], threatMappingSupplied = false } = {}) {
  const errors = [];
  const warnings = [];
  if (!review || typeof review !== "object" || Array.isArray(review)) {
    push(errors, "", "legal_stack_review must be an object");
    return { ok: false, errors, warnings };
  }
  walk(review, errors, warnings, "");
  validateLegalDocumentCartography(review, errors);
  validateDataProvenanceProfile(review, errors);
  const legalStack = Array.isArray(review.legal_stack) ? review.legal_stack : [];
  const admittedUrls = evidenceUrls(evidenceBuffer);

  if (legalStack.length !== 5) push(errors, "/legal_stack", "legal_stack must contain exactly five entries", { count: legalStack.length });
  legalStack.forEach((doc, index) => {
    const base = `/legal_stack/${index}`;
    if (!doc || typeof doc !== "object" || Array.isArray(doc)) { push(errors, base, "legal_stack item must be an object"); return; }
    const expectedType = DOCUMENT_ORDER[index];
    if (doc.document_type !== expectedType) push(errors, `${base}/document_type`, `document_type must be ${expectedType} at index ${index}`, { expected: expectedType, actual: doc.document_type });
    if (!DOCUMENT_TYPES.has(doc.document_type)) push(errors, `${base}/document_type`, `invalid document_type: ${doc.document_type}`, { document_type: doc.document_type });
    if (typeof doc.exists !== "boolean") push(errors, `${base}/exists`, "exists must be boolean");
    if (!EVIDENCE_STATUSES.has(doc.evidence_status)) push(errors, `${base}/evidence_status`, `invalid evidence_status: ${doc.evidence_status}`, { evidence_status: doc.evidence_status });
    if (doc.exists === true) {
      if (!nonEmptyString(doc.document_url)) {
        push(errors, `${base}/document_url`, "existing document_url must be non-empty");
      } else if (!legalDocumentUrlIsAdmitted(doc.document_url, admittedUrls)) {
        downgradeUnadmittedLegalDocument(doc, warnings, base);
      }
      if (doc.exists === true && !Array.isArray(doc.covers)) push(errors, `${base}/covers`, "existing document covers must be an array");
    }
    if (!Array.isArray(doc.misses)) push(errors, `${base}/misses`, "misses must be an array");
    const threats = Array.isArray(doc.linked_threat_ids) ? doc.linked_threat_ids : [];
    if (!threatMappingSupplied && threats.length > 0) push(errors, `${base}/linked_threat_ids`, "linked_threat_ids must be empty unless explicit threat mapping context was supplied", { linked_threat_ids: threats });
  });

  const redlines = Array.isArray(review.document_stack_redline) ? review.document_stack_redline : [];
  redlines.forEach((item, index) => {
    const base = `/document_stack_redline/${index}`;
    if (!item || typeof item !== "object" || Array.isArray(item)) { push(errors, base, "document_stack_redline item must be an object"); return; }
    if (!REDLINE_TYPES.has(item.type)) push(errors, `${base}/type`, `invalid redline type: ${item.type}`, { type: item.type });
    for (const field of ["mismatch_id", "type", "quote", "source", "feature_ref", "claim_type", "contradicts"]) if (!nonEmptyString(item[field])) push(errors, `${base}/${field}`, `${field} must be non-empty`);
  });
  return { ok: errors.length === 0, errors, warnings };
}
