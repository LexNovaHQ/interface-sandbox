const TP = "target_" + "profile";
const TPF = TP + "_forensics";
const REQUIRED_MATERIAL_TOP_LEVEL_KEYS = Object.freeze([TP]);
const REQUIRED_FORENSIC_TOP_LEVEL_KEYS = Object.freeze([TPF]);

const REQUIRED_PROFILE_SHAPE = Object.freeze({
  target_identity: ["brand_name", "legal_entity_name", "entity_type", "reviewed_website", "primary_domain"],
  jurisdiction_notice: ["registered_notice_location", "governing_law", "courts_venue"],
  business_context: ["business_category", "primary_customer_type", "market_type_candidate", "industry_sector", "regulated_sector_hints"],
  product_service_wrapper: ["high_level_offering", "primary_public_claim", "product_service_wrapper_names", "delivery_model_signals"]
});

const REQUIRED_FORENSIC_BRANCHES = Object.freeze([
  "source_ledger_used_for_m7",
  "target_source_extraction_capsule_summary",
  "target_source_route_coverage_ledger",
  "field_derivation_ledger",
  "targeted_re_extraction_ledger",
  "limitation_ledger",
  "cross_route_use_ledger",
  "validation_quality_control_result",
  "runtime_trace_m7_only",
  "forensic_boundary"
]);

const SELECTED_M7_FIELDS = Object.freeze([
  "target_identity.brand_name",
  "target_identity.legal_entity_name",
  "target_identity.entity_type",
  "target_identity.reviewed_website",
  "target_identity.primary_domain",
  "jurisdiction_notice.registered_notice_location",
  "jurisdiction_notice.governing_law",
  "jurisdiction_notice.courts_venue",
  "business_context.business_category",
  "business_context.primary_customer_type",
  "business_context.market_type_candidate",
  "business_context.industry_sector",
  "business_context.regulated_sector_hints",
  "product_service_wrapper.high_level_offering",
  "product_service_wrapper.primary_public_claim",
  "product_service_wrapper.product_service_wrapper_names",
  "product_service_wrapper.delivery_model_signals",
  "target_profile_limitations"
]);

const ARRAY_FIELDS = Object.freeze([
  "business_context.regulated_sector_hints",
  "product_service_wrapper.product_service_wrapper_names",
  "product_service_wrapper.delivery_model_signals",
  "target_profile_limitations"
]);

const CONTROLLED_FIELD_STATUSES = Object.freeze(["FIELD_LIMITED", "FIELD_NOT_PUBLIC", "FIELD_CONFLICTED", "FIELD_NOT_FOUND"]);
const LIMITED_PATTERN = /LIMIT|NOT_PUBLIC|NOT_FOUND|CONFLICT/i;

const FORBIDDEN_PROFILE_KEYS = Object.freeze([
  "validation_status", "lock_status", "status", "source_ledger", "field_derivation_ledger", "runtime_trace", "evidence_map", "extraction_capsule", TPF, "identity_confidence", "jurisdiction_confidence", "business_context_confidence", "wrapper_confidence", "identity_evidence_basis", "jurisdiction_evidence_basis", "business_context_evidence_basis", "wrapper_evidence_basis", "website", "domain", "industry", "product_service_wrapper_name", "product_service_wrapper_description", "registered_notice_country", "registered_notice_state", "governing_law_country", "governing_law_state", "app_platform_delivery_signal", "api_programmatic_delivery_signal", "offline_service_advisory_delivery_signal"
]);

const FORBIDDEN_FORENSIC_KEYS = Object.freeze([
  "target_route_family_coverage", "field_derivation_decisions", "validation_qc_status", "runtime_trace_boundaries", "extraction_capsule_summary", "route_coverage", "evidence_summary_only", "generic_derivation_summary", "profile_forensics", "target_forensics", "qc_status", TP
]);

const FORBIDDEN_STALE_STRINGS = Object.freeze([
  "<phase_output", "</phase_output>", "agent_2_target_feature", "AGENT2_RUNTIME_BINDING_PACKET", "bucket_handoff", "discovered_route_inventory", "route_execution_ledger", "source_coverage_gates", "missing_limited_primary_sources", "target_feature_profile", "target_feature_profile_forensics"
]);

export function validateM7TargetProfileOutput(output, { phase = "M7_TARGET_PROFILE" } = {}) {
  const failures = [];
  if (phase === "M7_TARGET_PROFILE") {
    validateExactTopLevelKeys(output, REQUIRED_MATERIAL_TOP_LEVEL_KEYS, failures, phase);
    if (!failures.length) {
      validateProfile(output[TP], failures);
      validateNoStaleStrings(output, failures);
    }
  } else if (phase === "M7_TARGET_PROFILE_FORENSICS") {
    validateExactTopLevelKeys(output, REQUIRED_FORENSIC_TOP_LEVEL_KEYS, failures, phase);
    if (!failures.length) {
      validateForensics(output[TPF], failures);
      validateNoStaleStrings(output, failures);
    }
  } else {
    failures.push(`M7_UNKNOWN_PHASE:${phase}`);
  }
  if (failures.length) throw new Error(`M7_TARGET_PROFILE_VALIDATION_FAILED:${JSON.stringify({ phase, failures })}`);
}

function validateProfile(profile, failures) {
  if (!isPlainObject(profile)) return failures.push(`${TP} must be object`);
  const expectedParents = [...Object.keys(REQUIRED_PROFILE_SHAPE), "target_profile_limitations"].sort();
  const actualParents = Object.keys(profile).sort();
  rejectKeyDiff(actualParents, expectedParents, TP, failures);

  for (const [parent, fields] of Object.entries(REQUIRED_PROFILE_SHAPE)) {
    const branch = profile[parent];
    if (!isPlainObject(branch)) {
      failures.push(`${TP}.${parent} must be object`);
      continue;
    }
    rejectKeyDiff(Object.keys(branch).sort(), [...fields].sort(), `${TP}.${parent}`, failures);
  }

  if (!Array.isArray(profile.target_profile_limitations)) failures.push(`${TP}.target_profile_limitations must be an array`);
  for (const field of SELECTED_M7_FIELDS) {
    const value = valueAt(profile, field);
    if (ARRAY_FIELDS.includes(field)) {
      if (!Array.isArray(value)) failures.push(`${TP}.${field} must be array`);
    } else if (!(typeof value === "string" && value.trim())) {
      failures.push(`${TP}.${field} must be string`);
    }
  }

  const controlledFields = SELECTED_M7_FIELDS.filter((field) => CONTROLLED_FIELD_STATUSES.includes(valueAt(profile, field)));
  if (controlledFields.length && (!Array.isArray(profile.target_profile_limitations) || !profile.target_profile_limitations.length)) {
    failures.push(`controlled M7 fields require target_profile_limitations[]: ${controlledFields.join(",")}`);
  }

  for (const key of FORBIDDEN_PROFILE_KEYS) if (containsKey(profile, key)) failures.push(`${TP} contains forbidden key or alias: ${key}`);
}

function validateForensics(forensics, failures) {
  if (!isPlainObject(forensics)) return failures.push(`${TPF} must be object`);
  rejectKeyDiff(Object.keys(forensics).sort(), [...REQUIRED_FORENSIC_BRANCHES].sort(), TPF, failures);
  for (const key of FORBIDDEN_FORENSIC_KEYS) if (containsKey(forensics, key)) failures.push(`${TPF} contains forbidden alias or material artifact: ${key}`);

  for (const branch of ["source_ledger_used_for_m7", "target_source_extraction_capsule_summary", "target_source_route_coverage_ledger", "field_derivation_ledger", "targeted_re_extraction_ledger", "limitation_ledger", "cross_route_use_ledger"]) {
    if (!Array.isArray(forensics[branch])) failures.push(`${TPF}.${branch} must be array`);
  }
  for (const branch of ["source_ledger_used_for_m7", "target_source_extraction_capsule_summary", "target_source_route_coverage_ledger"]) {
    if (Array.isArray(forensics[branch]) && !forensics[branch].length) failures.push(`${TPF}.${branch} must not be empty`);
  }

  const ledger = Array.isArray(forensics.field_derivation_ledger) ? forensics.field_derivation_ledger : [];
  if (ledger.length !== SELECTED_M7_FIELDS.length) failures.push(`field_derivation_ledger must contain exactly ${SELECTED_M7_FIELDS.length} rows`);
  const ledgerFields = new Set(ledger.map((row) => outputPathFromLedgerRow(row)).filter(Boolean));
  for (const field of SELECTED_M7_FIELDS) if (!ledgerFields.has(field)) failures.push(`field_derivation_ledger missing selected M7 field: ${field}`);
  for (const row of ledger) validateFieldDerivationRow(row, failures);
  validateSourceRefUrlPairing(forensics, failures);
  validateLimitationAndReinvestigationCoverage(forensics, failures);
}

function validateFieldDerivationRow(row, failures) {
  if (!isPlainObject(row)) return failures.push("field_derivation_ledger row must be object");
  const label = outputPathFromLedgerRow(row) || row.output_field || "unknown";
  if (!String(row.fd_field_id || "").startsWith("TP.")) failures.push(`field_derivation_ledger invalid fd_field_id for ${label}`);
  if (!hasSourceRef(row)) failures.push(`field_derivation_ledger missing source_ref/source_refs for ${label}`);
  if (!hasSourceUrl(row)) failures.push(`field_derivation_ledger missing source_url/source_urls for ${label}`);
  for (const field of ["evidence_summary", "forbidden_inference_check", "derivation_status", "targeted_reinvestigation_status"]) {
    if (!(typeof row[field] === "string" && row[field].trim())) failures.push(`field_derivation_ledger missing ${field} for ${label}`);
  }
}

function validateSourceRefUrlPairing(value, failures) {
  for (const row of collectRows(value)) {
    if (!isPlainObject(row)) continue;
    if (hasSourceRef(row) && !hasSourceUrl(row)) failures.push(`source-ref row missing source_url/source_urls: ${JSON.stringify(row).slice(0, 160)}`);
  }
}

function validateLimitationAndReinvestigationCoverage(forensics, failures) {
  const ledger = Array.isArray(forensics.field_derivation_ledger) ? forensics.field_derivation_ledger : [];
  const limited = ledger.some((row) => isPlainObject(row) && LIMITED_PATTERN.test(`${row.derivation_status || ""} ${row.limitation_if_any || ""}`));
  if (limited && (!Array.isArray(forensics.limitation_ledger) || !forensics.limitation_ledger.length)) failures.push("limited M7 fields require limitation_ledger[]");
  if (limited && (!Array.isArray(forensics.targeted_re_extraction_ledger) || !forensics.targeted_re_extraction_ledger.length)) failures.push("limited M7 fields require targeted_re_extraction_ledger[]");
}

function validateNoStaleStrings(value, failures) { for (const stale of FORBIDDEN_STALE_STRINGS) if (containsStringValue(value, stale)) failures.push(`stale or forbidden string present: ${stale}`); }
function validateExactTopLevelKeys(output, expected, failures, phase) { if (!isPlainObject(output)) return failures.push(`${phase}_OUTPUT_INVALID:not_object`); rejectKeyDiff(Object.keys(output).sort(), [...expected].sort(), phase, failures); }
function rejectKeyDiff(actual, expected, label, failures) { const missing = expected.filter((key) => !actual.includes(key)); const extra = actual.filter((key) => !expected.includes(key)); if (missing.length) failures.push(`${label} missing keys: ${missing.join(",")}`); if (extra.length) failures.push(`${label} extra keys: ${extra.join(",")}`); }
function outputPathFromLedgerRow(row) { if (!isPlainObject(row)) return ""; if (typeof row.output_path === "string") return stripPrefix(row.output_path); if (typeof row.output_parent === "string" && typeof row.output_field === "string") return `${row.output_parent}.${row.output_field}`; if (typeof row.output_field === "string") return stripPrefix(row.output_field); return ""; }
function stripPrefix(value) { return String(value || "").replace(/^target_profile\./, ""); }
function valueAt(root, fieldPath) { return String(fieldPath).split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), root); }
function hasSourceRef(row) { return typeof row?.source_ref === "string" && row.source_ref.trim() || Array.isArray(row?.source_refs) && row.source_refs.length || isPlainObject(row?.source_refs); }
function hasSourceUrl(row) { return typeof row?.source_url === "string" && row.source_url.trim() || Array.isArray(row?.source_urls) && row.source_urls.length || isPlainObject(row?.source_urls); }
function collectRows(value) { if (!value || typeof value !== "object") return []; if (Array.isArray(value)) return value.flatMap((item) => collectRows(item)); return [value, ...Object.values(value).flatMap((item) => collectRows(item))]; }
function isPlainObject(value) { return !!value && typeof value === "object" && !Array.isArray(value); }
function containsKey(value, key) { if (!value || typeof value !== "object") return false; if (Object.prototype.hasOwnProperty.call(value, key)) return true; return Object.values(value).some((item) => containsKey(item, key)); }
function containsStringValue(value, needle) { if (typeof value === "string") return value.includes(needle); if (!value || typeof value !== "object") return false; return Object.values(value).some((item) => containsStringValue(item, needle)); }
