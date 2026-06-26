export function normalizeM9LegalCartographyIndex(output) {
  if (!output || typeof output !== "object" || Array.isArray(output)) return output;
  const cloned = JSON.parse(JSON.stringify(output));
  const artifact = cloned.legal_cartography_index;
  if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) return cloned;

  scrubLegacyStrings(cloned);

  for (const key of ["document_coverage_index", "document_structure_index", "incorporated_linked_document_map", "control_language_locator", "missing_limited_legal_governance_items"]) {
    if (!Array.isArray(artifact[key])) artifact[key] = [];
    normalizeRows(artifact[key]);
  }

  ensureDownstreamRules(artifact);
  ensureCoverageDefaults(artifact.document_coverage_index);
  ensureLinkedDefaults(artifact.incorporated_linked_document_map);
  ensureMissingDefaults(artifact.missing_limited_legal_governance_items);
  ensureSupportCoverage(artifact);

  return cloned;
}

function scrubLegacyStrings(value) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) scrubLegacyStrings(item);
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === "string") {
      value[key] = item
        .replaceAll("REFERENCED_NOT_AUTHORIZED_BY_M6", "REFERENCED_BUT_NOT_FETCHED")
        .replaceAll("not authorized by M6", "referenced but not fetched")
        .replaceAll("authorized by M6", "loaded in source corpus")
        .replaceAll("M6-authorized", "source-corpus")
        .replaceAll("M6 authorized", "source-corpus");
    } else {
      scrubLegacyStrings(item);
    }
  }
}

function normalizeRows(rows) {
  for (const row of rows) {
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    if (row.source_type) row.source_type = mapSourceType(row.source_type);
    if (row.source_corpus_status) row.source_corpus_status = mapCorpusStatus(row.source_corpus_status);
    if (row.status) row.status = mapRowStatus(row.status);
    if (row.artifact_class) row.artifact_class = mapArtifactClass(row.artifact_class, row);
    delete row.m6_authorization_status;
    delete row.m6_bucket_subcategory;
  }
}

function ensureDownstreamRules(artifact) {
  if (!artifact.downstream_rules || typeof artifact.downstream_rules !== "object" || Array.isArray(artifact.downstream_rules)) artifact.downstream_rules = {};
  artifact.downstream_rules.m6_is_navigation_not_legal_authority = true;
  artifact.downstream_rules.embedded_legal_instruments_are_indexable = true;
  artifact.downstream_rules.use_only_loaded_legal_corpus = true;
  artifact.downstream_rules.referenced_unloaded_documents_must_not_be_fetched = true;
}

function ensureCoverageDefaults(rows) {
  for (const row of rows) {
    if (!row.source_type) row.source_type = inferSourceType(row);
    row.source_type = mapSourceType(row.source_type);
    if (!row.source_corpus_status) row.source_corpus_status = corpusFromSourceType(row.source_type);
    row.source_corpus_status = mapCorpusStatus(row.source_corpus_status);
    if (!row.status) row.status = statusFromSourceType(row.source_type);
    row.status = mapRowStatus(row.status);
    if (!row.artifact_class) row.artifact_class = inferArtifactClass(row);
    row.artifact_class = mapArtifactClass(row.artifact_class, row);
  }
}

function ensureLinkedDefaults(rows) {
  for (const row of rows) {
    row.source_type = mapSourceType(row.source_type || "REFERENCED_URL");
    row.source_corpus_status = mapCorpusStatus(row.source_corpus_status || "REFERENCED_BUT_NOT_FETCHED");
    row.status = mapRowStatus(row.status || "REFERENCED_BUT_NOT_FETCHED");
    if (row.artifact_class) row.artifact_class = mapArtifactClass(row.artifact_class, row);
  }
}

function ensureMissingDefaults(rows) {
  for (const row of rows) {
    row.source_type = mapSourceType(row.source_type || "ABSENT_FAMILY");
    row.source_corpus_status = mapCorpusStatus(row.source_corpus_status || "STANDALONE_SOURCE_ABSENT");
    row.status = mapRowStatus(row.status || "STANDALONE_SOURCE_ABSENT");
    row.artifact_class = mapArtifactClass(row.artifact_class || inferArtifactClass(row), row);
  }
}

function ensureSupportCoverage(artifact) {
  const structure = artifact.document_structure_index || [];
  const coverage = artifact.document_coverage_index || [];
  const support = structure.find((row) => has(row, ["support services", "support terms"]));
  if (!support) return;
  if (coverage.some((row) => has(row, ["support services", "support terms"]))) return;
  coverage.push({
    document_or_artifact: support.internal_unit || support.section_name || support.host_document || "Support Services / Support Terms annexure",
    artifact_class: "SUPPORT_TERMS",
    source: support.source || support.host_document || "Loaded legal corpus",
    source_type: "EMBEDDED_UNIT",
    source_corpus_status: "FOUND_EMBEDDED_IN_LEGAL_CORPUS",
    status: "FOUND_EMBEDDED_IN_LEGAL_CORPUS",
    document_role: "Support terms indexed from document_structure_index",
    limitation: appendText(support.limitation, "Coverage row normalized from structure index.")
  });
}

function mapSourceType(value) {
  const raw = String(value || "").trim();
  const upper = raw.toUpperCase().replace(/[ -]/g, "_");
  if (["EMBEDDED", "EMBEDDED_TEXT", "EMBEDDED_SECTION", "PASTED_PUBLIC_MATERIAL"].includes(upper)) return "EMBEDDED_UNIT";
  if (["FAMILY_PROBE", "ABSENT_PROBE", "ABSENT_AFTER_M6_TARGETED_PROBE"].includes(upper)) return "ABSENT_FAMILY";
  if (["REFERENCED", "REFERENCED_EXTERNAL", "REFERENCED_NOT_AUTHORIZED_BY_M6"].includes(upper)) return "REFERENCED_URL";
  if (upper === "UPLOADED_PUBLIC_MATERIAL") return "URL";
  if (upper === "SYNTHETIC_DEMO") return "METADATA_ONLY";
  return raw;
}

function mapCorpusStatus(value) {
  const upper = String(value || "").trim().toUpperCase().replace(/[ -]/g, "_");
  if (["ABSENT_AFTER_TARGETED_PROBE", "ABSENT_AFTER_M6_TARGETED_PROBE"].includes(upper)) return "STANDALONE_SOURCE_ABSENT";
  if (["REFERENCED_EXTERNAL", "REFERENCED_NOT_AUTHORIZED_BY_M6"].includes(upper)) return "REFERENCED_BUT_NOT_FETCHED";
  if (["EMBEDDED_TEXT", "PASTED_PUBLIC_MATERIAL"].includes(upper)) return "FOUND_EMBEDDED_IN_LEGAL_CORPUS";
  if (upper === "UPLOADED_PUBLIC_MATERIAL") return "FOUND_AS_PRIMARY_SOURCE";
  return String(value || "").trim();
}

function mapRowStatus(value) {
  const upper = String(value || "").trim().toUpperCase().replace(/[ -]/g, "_");
  if (upper === "ACTIVE") return "FOUND_INDEXED";
  if (upper === "ABSENT" || upper === "ABSENT_AFTER_TARGETED_PROBE" || upper === "ABSENT_AFTER_M6_TARGETED_PROBE") return "STANDALONE_SOURCE_ABSENT";
  if (upper === "REJECTED") return "SOURCE_REJECTED_OR_FAILED";
  if (upper === "NOT_FETCHED" || upper === "REFERENCED_EXTERNAL" || upper === "REFERENCED_NOT_AUTHORIZED_BY_M6") return "REFERENCED_BUT_NOT_FETCHED";
  if (upper === "EMBEDDED_TEXT") return "FOUND_EMBEDDED_IN_LEGAL_CORPUS";
  return String(value || "").trim();
}

function mapArtifactClass(value, row) {
  const upper = String(value || "").trim().toUpperCase().replace(/[ -]/g, "_");
  if (upper === "PRIVACY_ADJACENT_NOTICES") return inferPrivacyNoticeClass(row);
  if (upper === "AI_USAGE_GOVERNANCE") return inferAiClass(row);
  if (upper === "DPA") return "DATA_PROCESSING_AGREEMENT";
  if (upper === "SLA") return "SLA_SUPPORT_TERMS";
  if (upper === "TERMS_OF_USE") return "TERMS_OF_SERVICE";
  if (upper === "LEGAL_HUB" || upper === "ADDITIONAL_TERMS") return "HOSTED_LEGAL_ARTIFACT";
  if (upper === "PRIVACY_ADDENDUM") return "PRIVACY_POLICY";
  if (upper === "BUSINESS_CONTINUITY_PLAN" || upper === "INCIDENT_RESPONSE_PLAN") return "SECURITY_POLICY";
  return String(value || "UNKNOWN_LEGAL_ARTIFACT").trim();
}

function inferPrivacyNoticeClass(row) {
  const text = rowText(row);
  if (text.includes("cookie")) return "COOKIE_POLICY";
  if (text.includes("data request") || text.includes("privacy request") || text.includes("dsar")) return "DATA_REQUEST_PAGE";
  if (text.includes("privacy policy")) return "PRIVACY_POLICY";
  return "NOTICE_PAGE";
}

function inferAiClass(row) {
  const text = rowText(row);
  if (text.includes("content") || text.includes("acceptable use") || text.includes("restriction")) return "CONTENT_POLICY";
  return "AI_TERMS_POLICY";
}

function inferSourceType(row) {
  const text = rowText(row);
  if (text.includes("missing") || text.includes("absent")) return "ABSENT_FAMILY";
  if (text.includes("referenced") || text.includes("linked")) return "REFERENCED_URL";
  if (text.includes("section") || text.includes("annexure") || text.includes("schedule")) return "EMBEDDED_UNIT";
  return "URL";
}

function corpusFromSourceType(type) {
  if (type === "EMBEDDED_UNIT") return "FOUND_EMBEDDED_IN_LEGAL_CORPUS";
  if (type === "REFERENCED_URL") return "REFERENCED_BUT_NOT_FETCHED";
  if (type === "ABSENT_FAMILY") return "STANDALONE_SOURCE_ABSENT";
  if (type === "METADATA_ONLY") return "UNKNOWN_NOT_SEARCHED";
  return "FOUND_AS_PRIMARY_SOURCE";
}

function statusFromSourceType(type) {
  if (type === "EMBEDDED_UNIT") return "FOUND_EMBEDDED_IN_LEGAL_CORPUS";
  if (type === "REFERENCED_URL") return "REFERENCED_BUT_NOT_FETCHED";
  if (type === "ABSENT_FAMILY") return "STANDALONE_SOURCE_ABSENT";
  if (type === "METADATA_ONLY") return "UNKNOWN_NOT_SEARCHED";
  return "FOUND_INDEXED";
}

function inferArtifactClass(row) {
  const text = rowText(row);
  if (text.includes("support services") || text.includes("support terms")) return "SUPPORT_TERMS";
  if (text.includes("cookie")) return "COOKIE_POLICY";
  if (text.includes("subprocessor")) return "SUBPROCESSOR_LIST";
  if (text.includes("data processing") || text.includes("dpa")) return "DATA_PROCESSING_AGREEMENT";
  if (text.includes("privacy")) return "NOTICE_PAGE";
  if (text.includes("terms")) return "TERMS_OF_SERVICE";
  return "UNKNOWN_LEGAL_ARTIFACT";
}

function has(row, needles) {
  const text = rowText(row);
  return needles.some((needle) => text.includes(needle));
}

function rowText(row) {
  if (!row || typeof row !== "object") return "";
  return Object.values(row).filter((value) => typeof value === "string").join(" ").toLowerCase();
}

function appendText(existing, addition) {
  const raw = String(existing || "").trim();
  return raw ? `${raw} ${addition}` : addition;
}
