const TP = "target_" + "profile";
const TPF = TP + "_forensics";
const TPL = TP + "_limitations";

const MATERIAL_TOP_KEYS = Object.freeze([TP]);
const FORENSIC_TOP_KEYS = Object.freeze([TPF]);
const PROFILE_BRANCHES = Object.freeze({
  target_identity: ["brand_name", "legal_entity_name", "entity_type", "reviewed_website", "primary_domain"],
  jurisdiction_notice: ["registered_notice_location", "governing_law", "courts_venue"],
  business_context: ["business_category", "primary_customer_type", "market_type_candidate", "industry_sector", "regulated_sector_hints"],
  product_service_wrapper: ["high_level_offering", "primary_public_claim", "product_service_wrapper_names", "delivery_model_signals"]
});
const SELECTED_FIELDS = Object.freeze([...Object.entries(PROFILE_BRANCHES).flatMap(([parent, fields]) => fields.map((field) => `${parent}.${field}`)), TPL]);
const ARRAY_FIELDS = new Set(["business_context.regulated_sector_hints", "product_service_wrapper.product_service_wrapper_names", "product_service_wrapper.delivery_model_signals", TPL]);
const FORENSIC_BRANCHES = Object.freeze(["source_ledger_used_for_m7", "target_source_extraction_capsule_summary", "target_source_route_coverage_ledger", "field_derivation_ledger", "targeted_re_extraction_ledger", "limitation_ledger", "cross_route_use_ledger", "validation_quality_control_result", "runtime_trace_m7_only", "forensic_boundary"]);
const ARRAY_FORENSIC_BRANCHES = Object.freeze(["source_ledger_used_for_m7", "target_source_extraction_capsule_summary", "target_source_route_coverage_ledger", "field_derivation_ledger", "targeted_re_extraction_ledger", "limitation_ledger", "cross_route_use_ledger"]);
const REQUIRED_NON_EMPTY = Object.freeze(["source_ledger_used_for_m7", "target_source_extraction_capsule_summary", "target_source_route_coverage_ledger"]);
const CONTROLLED_VALUES = new Set(["FIELD_LIMITED", "FIELD_NOT_PUBLIC", "FIELD_CONFLICTED", "FIELD_NOT_FOUND"]);
const CONTROLLED_PATTERN = /LIMIT|NOT_PUBLIC|NOT_FOUND|CONFLICT|ABSENT|THIN|WEAK|MISSING|CONTROLLED/i;
const SUPPORTED_PATTERN = /SUPPORTED|FOUND|DERIVED|PRESENT|CONFIRMED|DIRECT/i;

export function validateM7TargetProfileOutput(output, { phase = "M7_TARGET_PROFILE" } = {}) {
  const failures = [];
  if (phase === "M7_TARGET_PROFILE") {
    validateExactTopLevelKeys(output, MATERIAL_TOP_KEYS, failures, phase);
    if (!failures.length) validateProfile(output[TP], failures);
  } else if (phase === "M7_TARGET_PROFILE_FORENSICS") {
    validateExactTopLevelKeys(output, FORENSIC_TOP_KEYS, failures, phase);
    if (!failures.length) validateForensics(output[TPF], failures);
  } else {
    failures.push(`M7_UNKNOWN_PHASE:${phase}`);
  }
  if (failures.length) throw new Error(`M7_TARGET_PROFILE_VALIDATION_FAILED:${JSON.stringify({ phase, failures })}`);
}

function validateProfile(profile, failures) {
  if (!isPlainObject(profile)) return failures.push(`${TP} must be object`);
  rejectKeyDiff(Object.keys(profile).sort(), [...Object.keys(PROFILE_BRANCHES), TPL].sort(), TP, failures);
  for (const [parent, fields] of Object.entries(PROFILE_BRANCHES)) {
    if (!isPlainObject(profile[parent])) {
      failures.push(`${TP}.${parent} must be object`);
      continue;
    }
    rejectKeyDiff(Object.keys(profile[parent]).sort(), [...fields].sort(), `${TP}.${parent}`, failures);
  }
  if (!Array.isArray(profile[TPL])) failures.push(`${TP}.${TPL} must be array`);
  for (const field of SELECTED_FIELDS) {
    const value = valueAt(profile, field);
    if (ARRAY_FIELDS.has(field)) {
      if (!Array.isArray(value)) failures.push(`${TP}.${field} must be array`);
    } else if (!(typeof value === "string" && value.trim())) failures.push(`${TP}.${field} must be string`);
  }
  const controlled = SELECTED_FIELDS.filter((field) => CONTROLLED_VALUES.has(valueAt(profile, field)));
  if (controlled.length && (!Array.isArray(profile[TPL]) || !profile[TPL].length)) failures.push(`controlled M7 fields require ${TPL}[]: ${controlled.join(",")}`);
  if (containsKey(profile, TPF) || containsKey(profile, "field_derivation_ledger") || containsKey(profile, "source_ledger")) failures.push(`${TP} contains forensic/provenance material`);
}

function validateForensics(forensics, failures) {
  if (!isPlainObject(forensics)) return failures.push(`${TPF} must be object`);
  rejectKeyDiff(Object.keys(forensics).sort(), [...FORENSIC_BRANCHES].sort(), TPF, failures);
  if (containsKey(forensics, TP)) failures.push(`${TPF} contains material artifact`);
  for (const branch of ARRAY_FORENSIC_BRANCHES) if (!Array.isArray(forensics[branch])) failures.push(`${TPF}.${branch} must be array`);
  for (const branch of REQUIRED_NON_EMPTY) if (Array.isArray(forensics[branch]) && !forensics[branch].length) failures.push(`${TPF}.${branch} must not be empty`);

  const directRows = Array.isArray(forensics.field_derivation_ledger) ? forensics.field_derivation_ledger : [];
  const reinvestigationRows = Array.isArray(forensics.targeted_re_extraction_ledger) ? forensics.targeted_re_extraction_ledger : [];
  const limitationRows = Array.isArray(forensics.limitation_ledger) ? forensics.limitation_ledger : [];
  const coverage = buildCoverage(directRows, reinvestigationRows, limitationRows);

  for (const field of SELECTED_FIELDS) {
    const state = coverage.get(field) || {};
    if (!state.direct && !(state.reinvestigated && state.limited)) failures.push(`selected M7 field lacks direct support or reinvestigated limitation coverage: ${field}`);
  }
  for (const row of directRows) validateDerivationRow(row, failures);
  validateSourceRefUrlPairing(forensics, failures);
}

function buildCoverage(directRows, reinvestigationRows, limitationRows) {
  const coverage = new Map(SELECTED_FIELDS.map((field) => [field, { direct: false, reinvestigated: false, limited: false }]));
  for (const row of directRows) updateCoverage(coverage, row, { direct: isSupported(row), limited: isControlled(row), reinvestigated: hasReinvestigation(row) });
  for (const row of reinvestigationRows) updateCoverage(coverage, row, { reinvestigated: true });
  for (const row of limitationRows) updateCoverage(coverage, row, { limited: true });
  return coverage;
}

function updateCoverage(coverage, row, patch) {
  const field = outputPath(row);
  if (!field || !coverage.has(field)) return;
  Object.assign(coverage.get(field), patch);
}

function validateDerivationRow(row, failures) {
  if (!isPlainObject(row)) return failures.push("field_derivation_ledger row must be object");
  const field = outputPath(row) || row.output_field || "unknown";
  if (row.fd_field_id && !String(row.fd_field_id).startsWith("TP.")) failures.push(`field_derivation_ledger invalid fd_field_id for ${field}`);
  if (isSupported(row)) {
    if (!hasSourceRef(row)) failures.push(`direct-support row missing source_ref/source_refs for ${field}`);
    if (!hasSourceUrl(row)) failures.push(`direct-support row missing source_url/source_urls for ${field}`);
    if (!hasAny(row, ["evidence_summary", "source_review_summary", "source_basis_reviewed", "reviewed_source_basis"])) failures.push(`direct-support row missing evidence/source summary for ${field}`);
  } else if (isControlled(row)) {
    if (!hasReinvestigation(row)) failures.push(`controlled row missing targeted reinvestigation status for ${field}`);
    if (!hasAny(row, ["reviewed_source_basis", "source_basis_reviewed", "source_review_summary", "evidence_summary"])) failures.push(`controlled row missing reviewed source basis for ${field}`);
    if (!hasAny(row, ["limitation_if_any", "downstream_effect", "limitation_basis"])) failures.push(`controlled row missing limitation/downstream effect for ${field}`);
  } else failures.push(`field_derivation_ledger row must be direct-supported or controlled-after-reinvestigation for ${field}`);
}

function validateSourceRefUrlPairing(value, failures) {
  for (const row of collectRows(value)) if (isPlainObject(row) && hasSourceRef(row) && !hasSourceUrl(row)) failures.push(`source-ref row missing source_url/source_urls: ${JSON.stringify(row).slice(0, 160)}`);
}

function outputPath(row) {
  if (!isPlainObject(row)) return "";
  const raw = typeof row.output_path === "string" ? row.output_path : typeof row.output_parent === "string" && typeof row.output_field === "string" ? `${row.output_parent}.${row.output_field}` : typeof row.output_field === "string" ? row.output_field : typeof row.field === "string" ? row.field : typeof row.field_name === "string" ? row.field_name : "";
  let path = String(raw || "").replace(/^target_profile\./, "").replace(/^target_profile\[\]\./, "").trim();
  if (path === `${TPL}.${TPL}` || path.endsWith(`.${TPL}`)) return TPL;
  return path;
}

function isSupported(row) { return SUPPORTED_PATTERN.test(`${row?.derivation_status || ""} ${row?.controlled_status || ""}`) && !isControlled(row); }
function isControlled(row) { return CONTROLLED_PATTERN.test(`${row?.derivation_status || ""} ${row?.controlled_status || ""} ${row?.limitation_status || ""} ${row?.limitation_if_any || ""}`); }
function hasReinvestigation(row) { return hasAny(row, ["targeted_reinvestigation_status", "targeted_re_extraction_status", "reinvestigation_status"]); }
function hasAny(row, keys) { return keys.some((key) => typeof row?.[key] === "string" && row[key].trim()); }
function validateExactTopLevelKeys(output, expected, failures, phase) { if (!isPlainObject(output)) return failures.push(`${phase}_OUTPUT_INVALID:not_object`); rejectKeyDiff(Object.keys(output).sort(), [...expected].sort(), phase, failures); }
function rejectKeyDiff(actual, expected, label, failures) { const missing = expected.filter((key) => !actual.includes(key)); const extra = actual.filter((key) => !expected.includes(key)); if (missing.length) failures.push(`${label} missing keys: ${missing.join(",")}`); if (extra.length) failures.push(`${label} extra keys: ${extra.join(",")}`); }
function valueAt(root, path) { return String(path).split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), root); }
function hasSourceRef(row) { return typeof row?.source_ref === "string" && row.source_ref.trim() || Array.isArray(row?.source_refs) && row.source_refs.length || isPlainObject(row?.source_refs); }
function hasSourceUrl(row) { return typeof row?.source_url === "string" && row.source_url.trim() || Array.isArray(row?.source_urls) && row.source_urls.length || isPlainObject(row?.source_urls); }
function collectRows(value) { if (!value || typeof value !== "object") return []; if (Array.isArray(value)) return value.flatMap((item) => collectRows(item)); return [value, ...Object.values(value).flatMap((item) => collectRows(item))]; }
function isPlainObject(value) { return !!value && typeof value === "object" && !Array.isArray(value); }
function containsKey(value, key) { if (!value || typeof value !== "object") return false; if (Object.prototype.hasOwnProperty.call(value, key)) return true; return Object.values(value).some((item) => containsKey(item, key)); }
