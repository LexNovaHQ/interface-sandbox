const SIGNAL_ROOT = "qualified_review_legal_signals";
const REQUIRED_KEYS = Object.freeze(["document_coverage_index", "document_structure_index", "incorporated_linked_document_map", "control_language_locator", "semantic_navigation_index", "priority_semantic_locator", "qualified_review_locator", SIGNAL_ROOT, "legal_notice_locator", "dispute_resolution_locator", "governing_law_venue_locator", "contact_grievance_locator", "missing_limited_legal_governance_items", "downstream_rules", "lock_status"]);
const ARRAY_KEYS = REQUIRED_KEYS.filter((key) => !["downstream_rules", "lock_status", SIGNAL_ROOT].includes(key));
const LOCK_STATUSES = Object.freeze(["LOCKED", "LOCKED_WITH_LIMITATIONS", "REPAIR_REQUIRED", "CONTROLLED_FAILURE"]);
const SOURCE_CORPUS_STATUSES = Object.freeze(["FOUND_AS_PRIMARY_SOURCE", "FOUND_EMBEDDED_IN_LEGAL_CORPUS", "FOUND_AS_LINKED_REFERENCE", "REFERENCED_BUT_NOT_FETCHED", "STANDALONE_SOURCE_ABSENT", "SOURCE_REJECTED_OR_FAILED", "UNKNOWN_NOT_SEARCHED"]);
const ROW_STATUSES = Object.freeze(["FOUND_INDEXED", "FOUND_HOSTED_INDEXED", "FOUND_EMBEDDED_IN_LEGAL_CORPUS", "FOUND_THIN", "STANDALONE_SOURCE_ABSENT", "ACCESS_FAILED", "GATED", "DEFERRED", "REFERENCED_BUT_NOT_FETCHED", "SOURCE_REJECTED_OR_FAILED", "UNKNOWN_NOT_SEARCHED", "NOT_APPLICABLE_CONTEXTUAL", "THIN", "INSUFFICIENT_PUBLIC_MATERIAL"]);
const ARTIFACT_CLASSES = Object.freeze(["TERMS_OF_SERVICE", "CUSTOMER_TERMS", "EULA", "ORDER_FORM_TERMS", "PRIVACY_POLICY", "COOKIE_POLICY", "DATA_PROCESSING_AGREEMENT", "SUBPROCESSOR_LIST", "DATA_REQUEST_PAGE", "DATA_RETENTION_POLICY", "AI_TERMS_POLICY", "AGENTIC_ADDENDUM", "HITL_POLICY", "AI_IMPACT_ASSESSMENT", "ACCEPTABLE_USE_POLICY", "CONTENT_POLICY", "COMMUNITY_GUIDELINES", "IP_POLICY", "DMCA_COPYRIGHT_POLICY", "OPEN_SOURCE_NOTICES", "SECURITY_POLICY", "TRUST_CENTER", "VULNERABILITY_DISCLOSURE", "STATUS_PAGE", "SLA_SUPPORT_TERMS", "SUPPORT_TERMS", "BILLING_CANCELLATION_TERMS", "LEGAL_NOTICE_IMPRESSUM", "NOTICE_PAGE", "TRANSPARENCY_REPORT", "HOSTED_LEGAL_ARTIFACT", "UNKNOWN_LEGAL_ARTIFACT"]);
const SOURCE_TYPES = Object.freeze(["URL", "LEGAL_DOC_ARTIFACT", "COMMON_ROOT", "EMBEDDED_UNIT", "INTERNAL_REFERENCE", "METADATA_ONLY", "REFERENCED_URL", "ABSENT_FAMILY"]);
const FORBIDDEN_KEYS = Object.freeze(["source_discovery_handoff", "target_profile", "target_feature_profile", "data_provenance_profile", "exposure_registry_profile", "challenge_gate", "final_output_handoff", "renderer_payload", "legal_advice", "compliance_conclusion", "sufficiency_conclusion", "enforceability_assessment", "risk_conclusion", "registry_evaluation", "m6_authorization_status", "m6_bucket_subcategory"]);
const FORBIDDEN_STRING_VALUES = Object.freeze(["REFERENCED_NOT_AUTHORIZED_BY_M6", "M6-authorized", "M6 authorized", "authorized by M6", "not authorized by M6"]);
const FORBIDDEN_EXACT_STATUS_VALUES = Object.freeze(["ACTIVE", "ABSENT", "REJECTED", "NOT_FETCHED"]);
const FORBIDDEN_ARTIFACT_CLASSES = Object.freeze(["LEGAL_HUB", "DPA", "SLA", "ADDITIONAL_TERMS", "PRIVACY_ADDENDUM", "TERMS_OF_USE", "BUSINESS_CONTINUITY_PLAN", "INCIDENT_RESPONSE_PLAN"]);
const SOURCE_FIELD_NAMES = Object.freeze(["source", "source_or_reference", "referring_document", "referenced_document_or_policy", "located_in_document"]);
const SIGNAL_SHAPES = Object.freeze({
  legal_notice_contact: ["signal_key", "question_id", "field_key", "reviewer_question", "signal_status", "legal_notice_email", "legal_notice_contact_route", "legal_notice_contact_source", "legal_notice_contact_limitation", "derived_answer_summary", "evidence_basis", "locator_refs", "registry_basis", "source_path", "primary_locator", "downstream_use_limit"],
  liability_cap_basis: ["signal_key", "question_id", "field_key", "reviewer_question", "signal_status", "clause_location", "cap_formula_reference_basis", "cap_period_lookback_window", "exclusions_carveouts_signal", "fees_pricing_reference_signal", "private_value_required", "limitation", "derived_answer_summary", "evidence_basis", "locator_refs", "registry_basis", "source_path", "primary_locator", "downstream_use_limit"],
  sla_support_posture: ["signal_key", "question_id", "field_key", "reviewer_question", "signal_status", "sla_support_artifact_found", "availability_uptime_commitment_signal", "service_credit_remedy_signal", "support_tier_response_commitment_signal", "standard_vs_custom_sla_posture", "sla_exclusions_dependencies_signal", "private_confirmation_required", "derived_answer_summary", "evidence_basis", "locator_refs", "registry_basis", "source_path", "primary_locator", "downstream_use_limit"]
});
const SIGNAL_ROOT_KEYS = Object.freeze(["signal_object_version", "derivation_mode", "source_boundary", "full_clause_text_copied", "legal_advice_generated", "compliance_conclusion_generated", "enforceability_conclusion_generated", "legal_notice_contact", "liability_cap_basis", "sla_support_posture", "question_rows", "question_index", "coverage_summary", "downstream_rules"]);
const SIGNAL_QUESTION_IDS = Object.freeze(["QR-004", "QR-013", "QR-016"]);
const SIGNAL_ARRAY_FIELDS = new Set(["evidence_basis", "locator_refs", "registry_basis"]);
const SIGNAL_OBJECT_FIELDS = new Set(["primary_locator"]);

export function validateM9LegalCartographyIndex(output) {
  const failures = [];
  const artifact = output?.legal_cartography_index;
  if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) return fail(["missing legal_cartography_index object"]);
  const keys = Object.keys(artifact);
  const missing = REQUIRED_KEYS.filter((key) => !(key in artifact));
  const extra = keys.filter((key) => !REQUIRED_KEYS.includes(key));
  if (missing.length) failures.push(`missing keys: ${missing.join(",")}`);
  if (extra.length) failures.push(`extra keys: ${extra.join(",")}`);
  for (const key of ARRAY_KEYS) if (!Array.isArray(artifact[key])) failures.push(`${key} must be an array`);
  if (!artifact[SIGNAL_ROOT] || typeof artifact[SIGNAL_ROOT] !== "object" || Array.isArray(artifact[SIGNAL_ROOT])) failures.push(`${SIGNAL_ROOT} must be an object`);
  validateSignalShape(artifact, failures);
  if (!artifact.downstream_rules || typeof artifact.downstream_rules !== "object" || Array.isArray(artifact.downstream_rules)) failures.push("downstream_rules must be an object");
  if (artifact.downstream_rules?.m6_is_navigation_not_legal_authority !== true && artifact.downstream_rules?.source_discovery_is_navigation_not_legal_authority !== true) failures.push("downstream_rules.source_discovery_is_navigation_not_legal_authority must be true");
  if (artifact.downstream_rules?.embedded_legal_instruments_are_indexable !== true) failures.push("downstream_rules.embedded_legal_instruments_are_indexable must be true");
  if (artifact.downstream_rules?.semantic_navigation_index_is_downstream_available !== true) failures.push("downstream_rules.semantic_navigation_index_is_downstream_available must be true");
  if (artifact.downstream_rules?.control_language_locator_is_technical_locator_only !== true) failures.push("downstream_rules.control_language_locator_is_technical_locator_only must be true");
  if (artifact.downstream_rules?.qualified_review_legal_signals_true_derived_object !== true) failures.push("downstream_rules.qualified_review_legal_signals_true_derived_object must be true");
  if (!LOCK_STATUSES.includes(artifact.lock_status)) failures.push(`invalid lock_status: ${artifact.lock_status || "missing"}`);
  for (const forbidden of FORBIDDEN_KEYS) if (containsKey(output, forbidden)) failures.push(`forbidden key present: ${forbidden}`);
  for (const forbidden of FORBIDDEN_STRING_VALUES) if (containsStringValue(output, forbidden)) failures.push(`forbidden string value present: ${forbidden}`);
  for (const row of collectRows(artifact)) for (const field of SOURCE_FIELD_NAMES) if (typeof row[field] === "string" && hasBadSourceSyntax(row[field])) failures.push(`bad source syntax in ${field}: ${row[field].slice(0, 80)}`);
  validateCoverageRows(artifact, failures);
  validateLinkedRows(artifact, failures);
  validateMissingRows(artifact, failures);
  validateLocatorRows(artifact, failures);
  validateEmbeddedCoverageCompleteness(artifact, failures);
  return failures.length ? fail(failures) : { status: "PASS", failed_gates: [], repair_instructions: [] };
}

export function assertM9LegalCartographyIndex(output) { return validateM9LegalCartographyIndex(output); }

function validateSignalShape(artifact, failures) {
  const root = artifact[SIGNAL_ROOT];
  if (!root || typeof root !== "object" || Array.isArray(root)) return;
  const rootKeys = Object.keys(root);
  const missingRoot = SIGNAL_ROOT_KEYS.filter((key) => !rootKeys.includes(key));
  const extraRoot = rootKeys.filter((key) => !SIGNAL_ROOT_KEYS.includes(key));
  if (missingRoot.length) failures.push(`${SIGNAL_ROOT} missing root fields: ${missingRoot.join(",")}`);
  if (extraRoot.length) failures.push(`${SIGNAL_ROOT} extra root fields: ${extraRoot.join(",")}`);
  for (const key of ["signal_object_version", "derivation_mode", "source_boundary"]) if (typeof root[key] !== "string") failures.push(`${SIGNAL_ROOT}.${key} must be string`);
  for (const key of ["full_clause_text_copied", "legal_advice_generated", "compliance_conclusion_generated", "enforceability_conclusion_generated"]) if (root[key] !== false) failures.push(`${SIGNAL_ROOT}.${key} must be false`);
  for (const branch of Object.keys(SIGNAL_SHAPES)) {
    const value = root[branch];
    if (!value || typeof value !== "object" || Array.isArray(value)) { failures.push(`${SIGNAL_ROOT}.${branch} must be an object`); continue; }
    const actual = Object.keys(value).sort();
    const expected = [...SIGNAL_SHAPES[branch]].sort();
    const missing = expected.filter((key) => !actual.includes(key));
    const extra = actual.filter((key) => !expected.includes(key));
    if (missing.length) failures.push(`${SIGNAL_ROOT}.${branch} missing fields: ${missing.join(",")}`);
    if (extra.length) failures.push(`${SIGNAL_ROOT}.${branch} extra fields: ${extra.join(",")}`);
    for (const field of SIGNAL_SHAPES[branch]) {
      if (SIGNAL_ARRAY_FIELDS.has(field)) { if (!Array.isArray(value[field])) failures.push(`${SIGNAL_ROOT}.${branch}.${field} must be array`); }
      else if (SIGNAL_OBJECT_FIELDS.has(field)) { if (!value[field] || typeof value[field] !== "object" || Array.isArray(value[field])) failures.push(`${SIGNAL_ROOT}.${branch}.${field} must be object`); }
      else if (typeof value[field] !== "string") failures.push(`${SIGNAL_ROOT}.${branch}.${field} must be string`);
    }
  }
  if (!Array.isArray(root.question_rows) || root.question_rows.length !== 3) failures.push(`${SIGNAL_ROOT}.question_rows must contain exactly 3 rows`);
  for (const questionId of SIGNAL_QUESTION_IDS) {
    if (!asArray(root.question_rows).some((row) => row?.question_id === questionId)) failures.push(`${SIGNAL_ROOT}.question_rows missing ${questionId}`);
    if (!root.question_index || typeof root.question_index !== "object" || Array.isArray(root.question_index) || !root.question_index[questionId]) failures.push(`${SIGNAL_ROOT}.question_index missing ${questionId}`);
  }
  if (!root.coverage_summary || typeof root.coverage_summary !== "object" || Array.isArray(root.coverage_summary)) failures.push(`${SIGNAL_ROOT}.coverage_summary must be object`);
  if (root.coverage_summary?.required_question_count !== 3) failures.push(`${SIGNAL_ROOT}.coverage_summary.required_question_count must be 3`);
  if (typeof root.coverage_summary?.derived_question_count !== "number") failures.push(`${SIGNAL_ROOT}.coverage_summary.derived_question_count must be number`);
  if (!root.downstream_rules || typeof root.downstream_rules !== "object" || Array.isArray(root.downstream_rules)) failures.push(`${SIGNAL_ROOT}.downstream_rules must be object`);
  if (root.downstream_rules?.qualified_review_legal_signals_true_derived_object !== true) failures.push(`${SIGNAL_ROOT}.downstream_rules.qualified_review_legal_signals_true_derived_object must be true`);
  if (root.downstream_rules?.full_clause_text_copied !== false) failures.push(`${SIGNAL_ROOT}.downstream_rules.full_clause_text_copied must be false`);
  if (root.downstream_rules?.legal_advice_generated !== false) failures.push(`${SIGNAL_ROOT}.downstream_rules.legal_advice_generated must be false`);
  if (root.downstream_rules?.compliance_conclusion_generated !== false) failures.push(`${SIGNAL_ROOT}.downstream_rules.compliance_conclusion_generated must be false`);
  if (root.downstream_rules?.enforceability_conclusion_generated !== false) failures.push(`${SIGNAL_ROOT}.downstream_rules.enforceability_conclusion_generated must be false`);
}
function validateCoverageRows(artifact, failures) { for (const row of asArray(artifact.document_coverage_index)) { validateCommonNormalizedRow(row, failures, "document_coverage_index"); if (!row.source_corpus_status) failures.push("document_coverage_index row missing source_corpus_status"); } }
function validateLinkedRows(artifact, failures) { for (const row of asArray(artifact.incorporated_linked_document_map)) { validateStatus(row, failures, "incorporated_linked_document_map"); validateSourceCorpusStatus(row, failures, "incorporated_linked_document_map"); if ("artifact_class" in row) validateArtifactClass(row, failures, "incorporated_linked_document_map"); rejectForbiddenExactStatus(row, failures, "incorporated_linked_document_map"); } }
function validateMissingRows(artifact, failures) { for (const row of asArray(artifact.missing_limited_legal_governance_items)) { validateCommonNormalizedRow(row, failures, "missing_limited_legal_governance_items"); if (!row.source_corpus_status) failures.push("missing_limited_legal_governance_items row missing source_corpus_status"); if (row.source_corpus_status === "ABSENT_AFTER_TARGETED_PROBE") failures.push("ABSENT_AFTER_TARGETED_PROBE is not a valid source_corpus_status; use STANDALONE_SOURCE_ABSENT"); if (row.alias_failed_equivalent_found === true && row.display_in_main_report !== false) failures.push("alias-equivalent missing row must be hidden from main report"); } }
function validateLocatorRows(artifact, failures) { if (asArray(artifact.control_language_locator).some((row) => row.display_in_main_report !== false || row.technical_annexure_only !== true)) failures.push("control_language_locator rows must be technical-annexure-only"); for (const key of ["semantic_navigation_index", "priority_semantic_locator", "qualified_review_locator", "legal_notice_locator", "dispute_resolution_locator", "governing_law_venue_locator", "contact_grievance_locator"]) for (const row of asArray(artifact[key])) if (row.status) validateStatus(row, failures, key); }
function validateCommonNormalizedRow(row, failures, location) { validateStatus(row, failures, location); validateSourceCorpusStatus(row, failures, location); validateArtifactClass(row, failures, location); validateSourceType(row, failures, location); rejectForbiddenExactStatus(row, failures, location); }
function validateStatus(row, failures, location) { if (Object.prototype.hasOwnProperty.call(row, "status") && !ROW_STATUSES.includes(row.status)) failures.push(`${location} invalid status: ${row.status || "missing"}`); }
function validateSourceCorpusStatus(row, failures, location) { if (Object.prototype.hasOwnProperty.call(row, "source_corpus_status") && !SOURCE_CORPUS_STATUSES.includes(row.source_corpus_status)) failures.push(`${location} invalid source_corpus_status: ${row.source_corpus_status || "missing"}`); }
function validateArtifactClass(row, failures, location) { if (!Object.prototype.hasOwnProperty.call(row, "artifact_class")) return; if (FORBIDDEN_ARTIFACT_CLASSES.includes(row.artifact_class)) failures.push(`${location} forbidden artifact_class: ${row.artifact_class}`); else if (!ARTIFACT_CLASSES.includes(row.artifact_class)) failures.push(`${location} invalid artifact_class: ${row.artifact_class || "missing"}`); }
function validateSourceType(row, failures, location) { if (Object.prototype.hasOwnProperty.call(row, "source_type") && !SOURCE_TYPES.includes(row.source_type)) failures.push(`${location} invalid source_type: ${row.source_type || "missing"}`); }
function rejectForbiddenExactStatus(row, failures, location) { for (const key of ["status", "source_corpus_status", "loaded_status"]) if (FORBIDDEN_EXACT_STATUS_VALUES.includes(row?.[key])) failures.push(`${location} forbidden status value ${key}:${row[key]}`); }
function validateEmbeddedCoverageCompleteness(artifact, failures) { const embedded = new Set(asArray(artifact.document_coverage_index).filter((row) => row.source_type === "EMBEDDED_UNIT").map((row) => row.document_id)); for (const row of asArray(artifact.document_structure_index)) if (["ANNEXURE", "SCHEDULE", "APPENDIX", "ADDENDUM", "EXHIBIT"].includes(row.unit_type) && !embedded.has(row.unit_id)) failures.push(`embedded unit missing from document_coverage_index: ${row.unit_id}`); }
function collectRows(value) { const out = []; visit(value); return out; function visit(inner) { if (!inner || typeof inner !== "object") return; if (Array.isArray(inner)) { inner.forEach(visit); return; } out.push(inner); Object.values(inner).forEach(visit); } }
function containsKey(value, key) { if (!value || typeof value !== "object") return false; if (Object.prototype.hasOwnProperty.call(value, key)) return true; if (Array.isArray(value)) return value.some((item) => containsKey(item, key)); return Object.values(value).some((item) => containsKey(item, key)); }
function containsStringValue(value, needle) { if (typeof value === "string") return value.includes(needle); if (!value || typeof value !== "object") return false; if (Array.isArray(value)) return value.some((item) => containsStringValue(item, needle)); return Object.values(value).some((item) => containsStringValue(item, needle)); }
function hasBadSourceSyntax(value) { return /^(M6:|M9:|source_discovery_handoff\.|legal_cartography_index\.)/.test(value); }
function asArray(value) { return Array.isArray(value) ? value : []; }
function fail(failures) { const validation = { status: "REPAIR_REQUIRED", failed_gates: failures, repair_instructions: ["Return exactly one legal_cartography_index object using the restored main M9 contract adapted to Phase 1 v4 inputs. Keep M9 index-only and do not emit legal advice or downstream profile substance."] }; const error = new Error(`LEGAL_CARTOGRAPHY_VALIDATION_FAILED:${JSON.stringify(validation)}`); error.validation = validation; throw error; }
