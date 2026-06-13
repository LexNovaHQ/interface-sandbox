const LEGAL_OR_GOVERNANCE_FAMILIES = new Set(["legal_profile", "governance_profile"]);

const DOC_TYPE_CODES = {
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
  data_deletion_page: "DELETION",
  dsr_page: "DSR",
  grievance_page: "GRIEVANCE",
  developer_terms: "DEVTERMS",
  api_terms: "APITERMS",
  other_valid_control_doc: "OTHER",
  unknown: "UNKNOWN"
};

const CORE_DOC_TYPES = new Set(["tos", "privacy_policy", "dpa", "aup", "sla"]);

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

function sourceUrl(record = {}) {
  return firstNonEmpty(record.final_url, record.source_url, record.url, record.href);
}

function sourceTitle(record = {}) {
  return firstNonEmpty(record.title, record.structure?.title, record.meta_title);
}

function sourceFamily(record = {}) {
  return firstNonEmpty(record.source_family, record.profile_family, record.family, record.evidence_family, record.source_type) || "unknown";
}

function sourceRecordRef(record = {}, index = 0) {
  return firstNonEmpty(record.source_record_ref, record.evidence_source_id, record.source_id, record.id) || `SRC_${String(index + 1).padStart(3, "0")}`;
}

function sourceText(record = {}) {
  return firstNonEmpty(record.clean_text_lossless, record.text?.clean_text_lossless, record.normalized_text, record.text);
}

function sourceHeadings(record = {}) {
  const headings = record.structure?.headings;
  return Array.isArray(headings) ? headings : [];
}

function classifyDocType(record = {}) {
  const url = lower(sourceUrl(record));
  const title = lower(sourceTitle(record));
  const textHead = lower(sourceText(record).slice(0, 2000));
  const combined = `${url} ${title} ${textHead}`;

  if (/terms-of-service|terms of service|\btos\b|terms and conditions/.test(combined)) return "tos";
  if (/privacy-policy|privacy policy|privacy notice/.test(combined)) return "privacy_policy";
  if (/\beula\b|end user license/.test(combined)) return "eula";
  if (/status\.|system status|status page|status\.sarvam/.test(combined)) return "status_page";
  if (/data-processing|data processing agreement|data processing addendum|\bdpa\b/.test(combined)) return "dpa";
  if (/acceptable-use|acceptable use|prohibited use|usage restrictions|\baup\b/.test(combined)) return "aup";
  if (/service-level|service level agreement|\bsla\b|uptime/.test(combined)) return "sla";
  if (/trust-center|trust center|security posture|security/.test(combined)) return /trust/.test(combined) ? "trust_center" : "security_page";
  if (/subprocessor|sub-processor|service provider list/.test(combined)) return "subprocessor_page";
  if (/cookie policy|cookies/.test(combined)) return "cookie_policy";
  if (/delete your data|data deletion|erasure request/.test(combined)) return "data_deletion_page";
  if (/data subject request|dsr|privacy rights/.test(combined)) return "dsr_page";
  if (/grievance|grievance officer/.test(combined)) return "grievance_page";
  if (/developer terms/.test(combined)) return "developer_terms";
  if (/api terms/.test(combined)) return "api_terms";
  if (/legal|policy|terms|privacy|security|trust|compliance|status/.test(combined)) return "other_valid_control_doc";
  return "unknown";
}

function shouldAdmitAsLegalCartographySource(record = {}) {
  const family = sourceFamily(record);
  if (LEGAL_OR_GOVERNANCE_FAMILIES.has(family)) return true;
  const docType = classifyDocType(record);
  return docType !== "unknown";
}

function documentStatusFor(record = {}) {
  const text = sourceText(record);
  if (text) return "visible";
  const url = sourceUrl(record);
  return url ? "partial" : "unknown";
}

function accessStatusFor(record = {}) {
  const text = sourceText(record);
  if (text) return "ingested";
  const status = lower(record.coverage_status || record.quality?.coverage_status || record.status || "");
  if (status.includes("fail") || status.includes("error")) return "access_failed";
  return "insufficient";
}

function docIdFor(docType, ordinal) {
  const code = DOC_TYPE_CODES[docType] || DOC_TYPE_CODES.unknown;
  return `DOC_${code}_${String(ordinal).padStart(3, "0")}`;
}

function normalizeSourceRecords(input = {}) {
  const rawRecords = input?.source_bundle?.raw_footprint?.source_records;
  if (Array.isArray(rawRecords) && rawRecords.length) return rawRecords;

  const packetRecords = input?.evidence_junction?.downstream_packets?.legal_stack_review?.source_records;
  if (Array.isArray(packetRecords) && packetRecords.length) return packetRecords;

  const evidenceBuffer = input?.source_bundle?.evidence_buffer;
  if (Array.isArray(evidenceBuffer) && evidenceBuffer.length) return evidenceBuffer;

  const artifactInventory = input?.source_bundle?.artifact_inventory;
  if (Array.isArray(artifactInventory) && artifactInventory.length) return artifactInventory;

  return [];
}

export function buildStage6ALegalSourceInventory(input = {}) {
  const sourceRecords = normalizeSourceRecords(input);
  const admitted = sourceRecords
    .map((record, index) => ({ record, index, docType: classifyDocType(record) }))
    .filter(({ record, docType }) => shouldAdmitAsLegalCartographySource(record) && docType !== "unknown");

  const counters = new Map();
  const inventory = admitted.map(({ record, index, docType }) => {
    const next = (counters.get(docType) || 0) + 1;
    counters.set(docType, next);
    const ref = sourceRecordRef(record, index);
    const url = sourceUrl(record) || "unknown";
    const title = sourceTitle(record) || docType;
    return {
      doc_id: docIdFor(docType, next),
      doc_type: docType,
      doc_family: CORE_DOC_TYPES.has(docType) ? "core" : "supplemental",
      doc_title: title,
      document_status: documentStatusFor(record),
      access_status: accessStatusFor(record),
      source_record_ref: ref,
      source_url: url,
      canonical_or_supplemental: CORE_DOC_TYPES.has(docType) ? "canonical" : "supplemental",
      jurisdiction_scope: [],
      language: "unknown",
      confidence: sourceUrl(record) || sourceText(record) ? "high" : "unknown"
    };
  });

  return inventory;
}

export function buildStage6AFallbackSourcePacket(input = {}, inventory = buildStage6ALegalSourceInventory(input)) {
  const inventoryRefs = new Set(inventory.map((item) => item.source_record_ref));
  return normalizeSourceRecords(input)
    .map((record, index) => ({ record, index }))
    .filter(({ record }) => shouldAdmitAsLegalCartographySource(record))
    .filter(({ record, index }) => !inventoryRefs.has(sourceRecordRef(record, index)))
    .map(({ record, index }) => ({
      source_record_ref: sourceRecordRef(record, index),
      source_url: sourceUrl(record) || "unknown",
      source_type: sourceFamily(record) === "governance_profile" ? "trust_document" : "legal_document",
      reason_for_fallback: "unindexed_admitted_source"
    }));
}

export function buildStage6ALegalStackSummarySignals(inventory = []) {
  const hasDocType = (docType) => inventory.some((item) => item.doc_type === docType && ["visible", "partial", "ingested"].includes(item.document_status));
  return {
    core_stack_status: {
      tos: hasDocType("tos") ? "visible" : "not_visible",
      privacy_policy: hasDocType("privacy_policy") ? "visible" : "not_visible",
      dpa: hasDocType("dpa") ? "visible" : "unknown",
      aup: hasDocType("aup") ? "visible" : "unknown",
      sla: hasDocType("sla") ? "visible" : "unknown"
    },
    supplemental_artifact_doc_ids: inventory.filter((item) => item.doc_family === "supplemental").map((item) => item.doc_id),
    document_hierarchy_signal: inventory.length > 1 ? "partial" : (inventory.length === 1 ? "unknown" : "not_visible"),
    legal_stack_coverage_signal: inventory.some((item) => item.doc_family === "core") ? "partial" : "unknown",
    major_unknowns: []
  };
}

export function buildStage6ALegalCartographySkeleton(input = {}) {
  const inventory = buildStage6ALegalSourceInventory(input);
  const fallbackPacket = buildStage6AFallbackSourcePacket(input, inventory);
  return {
    legal_stack_review_version: "legal_stack_review_v2",
    stage_role: "stage7_navigation_index",
    input_refs: {
      target_profile_version: input?.target_profile?.target_profile_version || input?.company_profile?.target_profile_version || "unknown",
      feature_profile_version: input?.target_feature_profile?.feature_profile_version || "unknown",
      source_bundle_version: input?.source_bundle?.source_bundle_version || input?.source_bundle?.source_review?.source_bundle_version || "unknown"
    },
    legal_document_cartography: {
      legal_document_inventory: inventory,
      legal_document_index: [],
      document_relationship_map: [],
      document_control_signal_map: [],
      document_mismatch_signal_map: [],
      legal_stack_summary_signals: buildStage6ALegalStackSummarySignals(inventory),
      legal_stack_limitations: []
    },
    stage7_navigation_index: {
      feature_to_document_section_index: [],
      control_family_index: [],
      document_source_locator_index: [],
      absence_unknown_index: [],
      fallback_source_packet: fallbackPacket
    },
    stage6_limitations: []
  };
}

export const stage6aLegalCartographyBuilderInternals = {
  classifyDocType,
  normalizeSourceRecords,
  sourceHeadings,
  shouldAdmitAsLegalCartographySource
};
