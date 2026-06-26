const REQUIRED_TOP_LEVEL_KEYS = Object.freeze(["target_profile", "target_profile_forensics"]);

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

const FORBIDDEN_PROFILE_KEYS = Object.freeze([
  "validation_status",
  "lock_status",
  "status",
  "source_ledger",
  "field_derivation_ledger",
  "runtime_trace",
  "source_custody",
  "evidence_map",
  "extraction_capsule",
  "target_profile_forensics",
  "identity_confidence",
  "jurisdiction_confidence",
  "business_context_confidence",
  "wrapper_confidence",
  "identity_evidence_basis",
  "jurisdiction_evidence_basis",
  "business_context_evidence_basis",
  "wrapper_evidence_basis",
  "website",
  "domain",
  "industry",
  "product_service_wrapper_name",
  "product_service_wrapper_description",
  "registered_notice_country",
  "registered_notice_state",
  "governing_law_country",
  "governing_law_state",
  "app_platform_delivery_signal",
  "api_programmatic_delivery_signal",
  "offline_service_advisory_delivery_signal"
]);

const FORBIDDEN_FORENSIC_KEYS = Object.freeze([
  "source_custody",
  "target_route_family_coverage",
  "field_derivation_decisions",
  "validation_qc_status",
  "runtime_trace_boundaries",
  "extraction_capsule_summary",
  "route_coverage",
  "evidence_summary_only",
  "generic_derivation_summary",
  "profile_forensics",
  "target_forensics",
  "qc_status"
]);

const FORBIDDEN_STALE_STRINGS = Object.freeze([
  "<phase_output",
  "</phase_output>",
  "agent_2_target_feature",
  "AGENT2_RUNTIME_BINDING_PACKET",
  "bucket_handoff",
  "discovered_route_inventory",
  "route_execution_ledger",
  "source_coverage_gates",
  "missing_limited_primary_sources",
  "target_feature_profile",
  "target_feature_profile_forensics"
]);

export function validateM7TargetProfileOutput(output) {
  const failures = [];
  validateExactTopLevelKeys(output, REQUIRED_TOP_LEVEL_KEYS, failures, "M7_TARGET_PROFILE");
  if (!failures.length) {
    validateProfile(output.target_profile, failures);
    validateForensics(output.target_profile_forensics, failures);
    validateNoStaleStrings(output, failures);
  }
  if (failures.length) throw new Error(`M7_TARGET_PROFILE_VALIDATION_FAILED:${JSON.stringify({ failures })}`);
}

function validateProfile(profile, failures) {
  if (!isPlainObject(profile)) {
    failures.push("target_profile must be object");
    return;
  }
  const expectedParents = [...Object.keys(REQUIRED_PROFILE_SHAPE), "target_profile_limitations"].sort();
  const actualParents = Object.keys(profile).sort();
  const missingParents = expectedParents.filter((key) => !actualParents.includes(key));
  const extraParents = actualParents.filter((key) => !expectedParents.includes(key));
  if (missingParents.length) failures.push(`target_profile missing parents: ${missingParents.join(",")}`);
  if (extraParents.length) failures.push(`target_profile extra parents: ${extraParents.join(",")}`);

  for (const [parent, fields] of Object.entries(REQUIRED_PROFILE_SHAPE)) {
    const branch = profile[parent];
    if (!isPlainObject(branch)) {
      failures.push(`target_profile.${parent} must be object`);
      continue;
    }
    const actual = Object.keys(branch).sort();
    const missing = fields.filter((key) => !actual.includes(key));
    const extra = actual.filter((key) => !fields.includes(key));
    if (missing.length) failures.push(`target_profile.${parent} missing fields: ${missing.join(",")}`);
    if (extra.length) failures.push(`target_profile.${parent} extra fields: ${extra.join(",")}`);
  }

  if (!Array.isArray(profile.target_profile_limitations)) failures.push("target_profile.target_profile_limitations must be an array");

  for (const field of SELECTED_M7_FIELDS) {
    const value = valueAt(profile, field);
    if (ARRAY_FIELDS.includes(field)) {
      if (!Array.isArray(value)) failures.push(`target_profile.${field} must be array`);
    } else if (!(typeof value === "string" && value.trim())) {
      failures.push(`target_profile.${field} must be string`);
    }
  }

  for (const key of FORBIDDEN_PROFILE_KEYS) {
    if (containsKey(profile, key)) failures.push(`target_profile contains forbidden key or alias: ${key}`);
  }
}

function validateForensics(forensics, failures) {
  if (!isPlainObject(forensics)) {
    failures.push("target_profile_forensics must be object");
    return;
  }
  const actual = Object.keys(forensics).sort();
  const expected = [...REQUIRED_FORENSIC_BRANCHES].sort();
  const missing = expected.filter((key) => !actual.includes(key));
  const extra = actual.filter((key) => !expected.includes(key));
  if (missing.length) failures.push(`target_profile_forensics missing branches: ${missing.join(",")}`);
  if (extra.length) failures.push(`target_profile_forensics extra branches: ${extra.join(",")}`);

  for (const key of FORBIDDEN_FORENSIC_KEYS) {
    if (containsKey(forensics, key)) failures.push(`target_profile_forensics contains forbidden alias: ${key}`);
  }

  for (const branch of ["source_ledger_used_for_m7", "target_source_extraction_capsule_summary", "target_source_route_coverage_ledger", "field_derivation_ledger", "targeted_re_extraction_ledger", "limitation_ledger", "cross_route_use_ledger"]) {
    if (!Array.isArray(forensics[branch])) failures.push(`target_profile_forensics.${branch} must be array`);
  }

  const ledger = Array.isArray(forensics.field_derivation_ledger) ? forensics.field_derivation_ledger : [];
  if (ledger.length !== SELECTED_M7_FIELDS.length) failures.push(`field_derivation_ledger must contain exactly ${SELECTED_M7_FIELDS.length} rows`);
  const ledgerFields = new Set(ledger.map((row) => outputPathFromLedgerRow(row)).filter(Boolean));
  for (const field of SELECTED_M7_FIELDS) {
    if (!ledgerFields.has(field)) failures.push(`field_derivation_ledger missing selected M7 field: ${field}`);
  }
}

function validateNoStaleStrings(value, failures) {
  for (const stale of FORBIDDEN_STALE_STRINGS) {
    if (containsStringValue(value, stale)) failures.push(`stale or forbidden string present: ${stale}`);
  }
}

function validateExactTopLevelKeys(output, expected, failures, phase) {
  if (!isPlainObject(output)) {
    failures.push(`${phase}_OUTPUT_INVALID:not_object`);
    return;
  }
  const keys = Object.keys(output).sort();
  const wanted = [...expected].sort();
  const missing = wanted.filter((key) => !keys.includes(key));
  const extra = keys.filter((key) => !wanted.includes(key));
  if (missing.length) failures.push(`${phase} missing top-level keys: ${missing.join(",")}`);
  if (extra.length) failures.push(`${phase} extra top-level keys: ${extra.join(",")}`);
}

function outputPathFromLedgerRow(row) {
  if (!isPlainObject(row)) return "";
  if (typeof row.output_path === "string") return stripPrefix(row.output_path);
  if (typeof row.output_field === "string") return stripPrefix(row.output_field);
  if (typeof row.output_parent === "string" && typeof row.output_field === "string") return `${row.output_parent}.${row.output_field}`;
  return "";
}

function stripPrefix(value) {
  return String(value || "").replace(/^target_profile\./, "");
}

function valueAt(root, fieldPath) {
  return String(fieldPath).split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), root);
}

function isPlainObject(value) { return !!value && typeof value === "object" && !Array.isArray(value); }
function containsKey(value, key) { if (!value || typeof value !== "object") return false; if (Object.prototype.hasOwnProperty.call(value, key)) return true; return Object.values(value).some((item) => containsKey(item, key)); }
function containsStringValue(value, needle) { if (typeof value === "string") return value.includes(needle); if (!value || typeof value !== "object") return false; return Object.values(value).some((item) => containsStringValue(item, needle)); }
