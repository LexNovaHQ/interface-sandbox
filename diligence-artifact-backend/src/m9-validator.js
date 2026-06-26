import { normalizeM9LegalCartographyIndex } from "./m9-normalizer.js";

const REQUIRED_KEYS = Object.freeze([
  "document_coverage_index",
  "document_structure_index",
  "incorporated_linked_document_map",
  "control_language_locator",
  "missing_limited_legal_governance_items",
  "downstream_rules",
  "lock_status"
]);

const LOCK_STATUSES = Object.freeze([
  "LOCKED",
  "LOCKED_WITH_LIMITATIONS",
  "REPAIR_REQUIRED",
  "CONTROLLED_FAILURE"
]);

const SOURCE_CORPUS_STATUSES = Object.freeze([
  "FOUND_AS_PRIMARY_SOURCE",
  "FOUND_EMBEDDED_IN_LEGAL_CORPUS",
  "FOUND_AS_LINKED_REFERENCE",
  "REFERENCED_BUT_NOT_FETCHED",
  "STANDALONE_SOURCE_ABSENT",
  "SOURCE_REJECTED_OR_FAILED",
  "UNKNOWN_NOT_SEARCHED"
]);

const ROW_STATUSES = Object.freeze([
  "FOUND_INDEXED",
  "FOUND_HOSTED_INDEXED",
  "FOUND_EMBEDDED_IN_LEGAL_CORPUS",
  "FOUND_THIN",
  "STANDALONE_SOURCE_ABSENT",
  "ACCESS_FAILED",
  "GATED",
  "DEFERRED",
  "REFERENCED_BUT_NOT_FETCHED",
  "SOURCE_REJECTED_OR_FAILED",
  "UNKNOWN_NOT_SEARCHED",
  "NOT_APPLICABLE_CONTEXTUAL",
  "THIN",
  "INSUFFICIENT_PUBLIC_MATERIAL"
]);

const ARTIFACT_CLASSES = Object.freeze([
  "TERMS_OF_SERVICE",
  "CUSTOMER_TERMS",
  "EULA",
  "ORDER_FORM_TERMS",
  "PRIVACY_POLICY",
  "COOKIE_POLICY",
  "DATA_PROCESSING_AGREEMENT",
  "SUBPROCESSOR_LIST",
  "DATA_REQUEST_PAGE",
  "DATA_RETENTION_POLICY",
  "AI_TERMS_POLICY",
  "AGENTIC_ADDENDUM",
  "HITL_POLICY",
  "AI_IMPACT_ASSESSMENT",
  "ACCEPTABLE_USE_POLICY",
  "CONTENT_POLICY",
  "COMMUNITY_GUIDELINES",
  "IP_POLICY",
  "DMCA_COPYRIGHT_POLICY",
  "OPEN_SOURCE_NOTICES",
  "SECURITY_POLICY",
  "TRUST_CENTER",
  "VULNERABILITY_DISCLOSURE",
  "STATUS_PAGE",
  "SLA_SUPPORT_TERMS",
  "SUPPORT_TERMS",
  "BILLING_CANCELLATION_TERMS",
  "LEGAL_NOTICE_IMPRESSUM",
  "NOTICE_PAGE",
  "TRANSPARENCY_REPORT",
  "HOSTED_LEGAL_ARTIFACT",
  "UNKNOWN_LEGAL_ARTIFACT"
]);

const SOURCE_TYPES = Object.freeze([
  "URL",
  "EMBEDDED_UNIT",
  "INTERNAL_REFERENCE",
  "METADATA_ONLY",
  "REFERENCED_URL",
  "ABSENT_FAMILY"
]);

const FORBIDDEN_KEYS = Object.freeze([
  "source_discovery_handoff",
  "target_profile",
  "target_feature_profile",
  "data_provenance_profile",
  "exposure_registry_profile",
  "challenge_gate",
  "final_output_handoff",
  "renderer_payload",
  "legal_advice",
  "compliance_conclusion",
  "sufficiency_conclusion",
  "enforceability_assessment",
  "risk_conclusion",
  "registry_evaluation",
  "m6_authorization_status",
  "m6_bucket_subcategory"
]);

const FORBIDDEN_STRING_VALUES = Object.freeze([
  "REFERENCED_NOT_AUTHORIZED_BY_M6",
  "M6-authorized",
  "M6 authorized",
  "authorized by M6",
  "not authorized by M6"
]);

const FORBIDDEN_EXACT_STATUS_VALUES = Object.freeze([
  "ACTIVE",
  "ABSENT",
  "REJECTED",
  "NOT_FETCHED"
]);

const FORBIDDEN_ARTIFACT_CLASSES = Object.freeze([
  "LEGAL_HUB",
  "DPA",
  "SLA",
  "ADDITIONAL_TERMS",
  "PRIVACY_ADDENDUM",
  "TERMS_OF_USE",
  "BUSINESS_CONTINUITY_PLAN",
  "INCIDENT_RESPONSE_PLAN"
]);

const SOURCE_FIELD_NAMES = Object.freeze([
  "source",
  "source_or_reference",
  "referring_document",
  "referenced_document_or_policy",
  "located_in_document"
]);

export function validateM9LegalCartographyIndex(output) {
  const normalizedOutput = normalizeM9LegalCartographyIndex(output);
  if (output && typeof output === "object" && normalizedOutput && normalizedOutput !== output) {
    Object.keys(output).forEach((key) => delete output[key]);
    Object.assign(output, normalizedOutput);
  }

  const failures = [];
  const artifact = output?.legal_cartography_index;

  if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) {
    return fail(["missing legal_cartography_index object"]);
  }

  const keys = Object.keys(artifact);
  const missing = REQUIRED_KEYS.filter((key) => !(key in artifact));
  const extra = keys.filter((key) => !REQUIRED_KEYS.includes(key));

  if (missing.length) failures.push(`missing keys: ${missing.join(",")}`);
  if (extra.length) failures.push(`extra keys: ${extra.join(",")}`);

  for (const key of REQUIRED_KEYS.slice(0, 5)) {
    if (!Array.isArray(artifact[key])) failures.push(`${key} must be an array`);
  }

  if (!artifact.downstream_rules || typeof artifact.downstream_rules !== "object" || Array.isArray(artifact.downstream_rules)) {
    failures.push("downstream_rules must be an object");
  }

  if (artifact.downstream_rules?.m6_is_navigation_not_legal_authority !== true) {
    failures.push("downstream_rules.m6_is_navigation_not_legal_authority must be true");
  }

  if (artifact.downstream_rules?.embedded_legal_instruments_are_indexable !== true) {
    failures.push("downstream_rules.embedded_legal_instruments_are_indexable must be true");
  }

  if (!LOCK_STATUSES.includes(artifact.lock_status)) {
    failures.push(`invalid lock_status: ${artifact.lock_status || "missing"}`);
  }

  for (const forbidden of FORBIDDEN_KEYS) {
    if (containsKey(output, forbidden)) failures.push(`forbidden key present: ${forbidden}`);
  }

  for (const forbidden of FORBIDDEN_STRING_VALUES) {
    if (containsStringValue(output, forbidden)) failures.push(`forbidden string value present: ${forbidden}`);
  }

  for (const row of collectRows(artifact)) {
    for (const field of SOURCE_FIELD_NAMES) {
      if (typeof row[field] === "string" && hasBadSourceSyntax(row[field])) {
        failures.push(`bad source syntax in ${field}: ${row[field].slice(0, 80)}`);
      }
    }
  }

  validateCoverageRows(artifact, failures);
  validateLinkedRows(artifact, failures);
  validateMissingRows(artifact, failures);
  validateEmbeddedCoverageCompleteness(artifact, failures);

  return failures.length ? fail(failures) : { status: "PASS", failed_gates: [], repair_instructions: [] };
}

function validateCoverageRows(artifact, failures) {
  for (const row of asArray(artifact.document_coverage_index)) {
    validateCommonNormalizedRow(row, failures, "document_coverage_index");
    if (!row.source_corpus_status) failures.push("document_coverage_index row missing source_corpus_status");
  }
}

function validateLinkedRows(artifact, failures) {
  for (const row of asArray(artifact.incorporated_linked_document_map)) {
    validateStatus(row, failures, "incorporated_linked_document_map");
    validateSourceCorpusStatus(row, failures, "incorporated_linked_document_map");
    if ("artifact_class" in row) validateArtifactClass(row, failures, "incorporated_linked_document_map");
    rejectForbiddenExactStatus(row, failures, "incorporated_linked_document_map");
  }
}

function validateMissingRows(artifact, failures) {
  for (const row of asArray(artifact.missing_limited_legal_governance_items)) {
    validateCommonNormalizedRow(row, failures, "missing_limited_legal_governance_items");
    if (!row.source_corpus_status) failures.push("missing_limited_legal_governance_items row missing source_corpus_status");
    if (row.source_corpus_status === "ABSENT_AFTER_TARGETED_PROBE") {
      failures.push("ABSENT_AFTER_TARGETED_PROBE is not a valid source_corpus_status; use STANDALONE_SOURCE_ABSENT");
    }
  }
}

function validateCommonNormalizedRow(row, failures, location) {
  validateStatus(row, failures, location);
  validateSourceCorpusStatus(row, failures, location);
  validateArtifactClass(row, failures, location);
  validateSourceType(row, failures, location);
  rejectForbiddenExactStatus(row, failures, location);
}

function validateStatus(row, failures, location) {
  if (Object.prototype.hasOwnProperty.call(row, "status") && !ROW_STATUSES.includes(row.status)) {
    failures.push(`${location} invalid status: ${row.status || "missing"}`);
  }
}

function validateSourceCorpusStatus(row, failures, location) {
  if (Object.prototype.hasOwnProperty.call(row, "source_corpus_status") && !SOURCE_CORPUS_STATUSES.includes(row.source_corpus_status)) {
    failures.push(`${location} invalid source_corpus_status: ${row.source_corpus_status || "missing"}`);
  }
}

function validateArtifactClass(row, failures, location) {
  if (!Object.prototype.hasOwnProperty.call(row, "artifact_class")) return;
  if (FORBIDDEN_ARTIFACT_CLASSES.includes(row.artifact_class)) {
    failures.push(`${location} forbidden artifact_class drift: ${row.artifact_class}`);
  }
  if (!ARTIFACT_CLASSES.includes(row.artifact_class)) {
    failures.push(`${location} invalid artifact_class: ${row.artifact_class || "missing"}`);
  }
}

function validateSourceType(row, failures, location) {
  if (Object.prototype.hasOwnProperty.call(row, "source_type") && !SOURCE_TYPES.includes(row.source_type)) {
    failures.push(`${location} invalid source_type: ${row.source_type || "missing"}`);
  }
}

function rejectForbiddenExactStatus(row, failures, location) {
  if (FORBIDDEN_EXACT_STATUS_VALUES.includes(row.status)) {
    failures.push(`${location} forbidden loose status: ${row.status}`);
  }
}

function validateEmbeddedCoverageCompleteness(artifact, failures) {
  const structureNames = asArray(artifact.document_structure_index)
    .map((row) => String(row.section_name || row.internal_unit || row.document_or_artifact || "").toLowerCase());
  const coverageNames = asArray(artifact.document_coverage_index)
    .map((row) => String(row.document_or_artifact || "").toLowerCase());

  const hasSupportAnnexureInStructure = structureNames.some((name) => name.includes("support services") || name.includes("support terms"));
  const hasSupportAnnexureInCoverage = coverageNames.some((name) => name.includes("support services") || name.includes("support terms"));

  if (hasSupportAnnexureInStructure && !hasSupportAnnexureInCoverage) {
    failures.push("Support Services / Support Terms annexure appears in structure but is missing from document_coverage_index");
  }
}

function fail(failures) {
  return {
    status: "REPAIR_REQUIRED",
    failed_gates: failures,
    repair_instructions: ["Return exactly one legal_cartography_index object using normalized artifact classes, normalized row statuses, source_corpus_status on coverage/linked/missing rows, and the loaded legal corpus only."]
  };
}

function collectRows(artifact) {
  return REQUIRED_KEYS.slice(0, 5).flatMap((key) => asArray(artifact[key]));
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function hasBadSourceSyntax(value) {
  return /\[[^\]]+\]\([^)]*\)/.test(value) || value.includes("%22") || value.includes("") || value.startsWith("mailto:");
}

function containsKey(value, key) {
  if (!value || typeof value !== "object") return false;
  if (Object.prototype.hasOwnProperty.call(value, key)) return true;
  return Object.values(value).some((item) => containsKey(item, key));
}

function containsStringValue(value, needle) {
  if (typeof value === "string") return value.includes(needle);
  if (!value || typeof value !== "object") return false;
  return Object.values(value).some((item) => containsStringValue(item, needle));
}
