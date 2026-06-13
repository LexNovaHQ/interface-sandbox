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

function compact(value = "") { return String(value || "").replace(/\s+/g, " ").trim(); }
function lower(value = "") { return compact(value).toLowerCase(); }
function firstNonEmpty(...values) { for (const value of values) { const text = compact(value); if (text) return text; } return ""; }
function sourceUrl(record = {}) { return firstNonEmpty(record.final_url, record.source_url, record.url, record.href); }
function sourceTitle(record = {}) { return firstNonEmpty(record.title, record.structure?.title, record.meta_title); }
function sourceFamily(record = {}) { return firstNonEmpty(record.source_family, record.profile_family, record.family, record.evidence_family, record.source_type) || "unknown"; }
function sourceRecordRef(record = {}, index = 0) { return firstNonEmpty(record.source_record_ref, record.evidence_source_id, record.source_id, record.id) || `SRC_${String(index + 1).padStart(3, "0")}`; }
function sourceText(record = {}) { return firstNonEmpty(record.clean_text_lossless, record.text?.clean_text_lossless, record.normalized_text, record.text); }
function sourceHeadings(record = {}) { const headings = record.structure?.headings; return Array.isArray(headings) ? headings : []; }

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

function documentStatusFor(record = {}) { const text = sourceText(record); if (text) return "visible"; const url = sourceUrl(record); return url ? "partial" : "unknown"; }
function accessStatusFor(record = {}) { const text = sourceText(record); if (text) return "ingested"; const status = lower(record.coverage_status || record.quality?.coverage_status || record.status || ""); if (status.includes("fail") || status.includes("error")) return "access_failed"; return "insufficient"; }
function docIdFor(docType, ordinal) { const code = DOC_TYPE_CODES[docType] || DOC_TYPE_CODES.unknown; return `DOC_${code}_${String(ordinal).padStart(3, "0")}`; }

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

function legalSourceEntries(input = {}) {
  return normalizeSourceRecords(input)
    .map((record, index) => ({ record, index, docType: classifyDocType(record), source_record_ref: sourceRecordRef(record, index) }))
    .filter(({ record, docType }) => shouldAdmitAsLegalCartographySource(record) && docType !== "unknown");
}

export function buildStage6ALegalSourceInventory(input = {}) {
  const counters = new Map();
  return legalSourceEntries(input).map(({ record, index, docType }) => {
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
}

function inventoryBySourceRef(inventory = []) {
  return new Map(inventory.map((item) => [item.source_record_ref, item]));
}

function sectionPathFor(headings = [], index = 0) {
  const stack = [];
  for (let i = 0; i <= index; i += 1) {
    const heading = headings[i] || {};
    const level = Number(heading.level || 1);
    const text = compact(heading.text || "");
    if (!text) continue;
    while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
    stack.push({ level, text });
  }
  return stack.map((item) => item.text).join(" > ") || compact(headings[index]?.text || "root");
}

function classifyStructuralZone(heading = {}) {
  const text = lower(heading.text || "");
  if (/annexure|annex/.test(text)) return "annexure";
  if (/schedule/.test(text)) return "schedule";
  if (/appendix/.test(text)) return "appendix";
  if (/exhibit/.test(text)) return "exhibit";
  if (/table/.test(text)) return "table";
  if (/faq|questions/.test(text)) return "faq";
  return "main_body";
}

function classifySectionFunction(heading = {}) {
  const text = lower(heading.text || "");
  if (/definition|definitions/.test(text)) return "definitions";
  if (/service|scope|administration|license|eligibility/.test(text)) return "service_description";
  if (/ai|artificial intelligence|model|output|hallucination|generated/.test(text)) return "ai_disclosure";
  if (/privacy|personal data|personal information|data fiduciary/.test(text)) return "privacy_notice";
  if (/data processing|processor|controller|processing instructions|dpa/.test(text)) return "data_processing_terms";
  if (/subprocessor|sub-processor|service provider/.test(text)) return "subprocessor_terms";
  if (/acceptable use|permitted use/.test(text)) return "acceptable_use_rules";
  if (/prohibited|restricted|abuse|misuse/.test(text)) return "prohibited_use_rules";
  if (/security|safeguard|encryption|access control/.test(text)) return "security_terms";
  if (/breach|incident/.test(text)) return "breach_terms";
  if (/retention|delete|deletion|erasure/.test(text)) return "retention_deletion_terms";
  if (/rights|access|correction|withdraw|grievance|nomination/.test(text)) return "rights_request_terms";
  if (/transfer|cross-border|international/.test(text)) return "cross_border_transfer_terms";
  if (/liability|indemnity|cap/.test(text)) return "liability_terms";
  if (/warranty|disclaimer|as is/.test(text)) return "warranty_disclaimer";
  if (/sla|service level|uptime|availability|service credit|support/.test(text)) return "sla_terms";
  if (/agent|autonomous|action log|circuit breaker/.test(text)) return "agentic_controls";
  if (/fees|payment|subscription|commercial|billing/.test(text)) return "commercial_terms";
  if (/dispute|law|jurisdiction|venue|arbitration/.test(text)) return "dispute_terms";
  return "unknown";
}

function controlTopicsForSectionFunction(sectionFunction) {
  const map = {
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
    agentic_controls: ["agentic_controls"]
  };
  return map[sectionFunction] || [];
}

export function buildStage6ALegalDocumentIndex(input = {}, inventory = buildStage6ALegalSourceInventory(input)) {
  const bySource = inventoryBySourceRef(inventory);
  const rows = [];
  for (const { record, index } of legalSourceEntries(input)) {
    const ref = sourceRecordRef(record, index);
    const doc = bySource.get(ref);
    if (!doc) continue;
    const headings = sourceHeadings(record);
    headings.forEach((heading, headingIndex) => {
      const headingText = compact(heading.text || "");
      if (!headingText) return;
      const sectionFunction = classifySectionFunction(heading);
      rows.push({
        index_id: `IDX_${doc.doc_id}_${String(headingIndex + 1).padStart(3, "0")}`,
        doc_id: doc.doc_id,
        section_id: `${doc.doc_id}:S${String(headingIndex + 1).padStart(3, "0")}`,
        section_path: sectionPathFor(headings, headingIndex),
        heading_level: Number.isFinite(Number(heading.level)) ? Number(heading.level) : "unknown",
        heading_text: headingText,
        structural_zone: classifyStructuralZone(heading),
        section_function: sectionFunction,
        control_topics_detected: controlTopicsForSectionFunction(sectionFunction),
        feature_refs: [],
        data_flow_refs: [],
        source_record_ref: ref,
        source_locator: {
          locator_type: "heading_path",
          locator_value: sectionPathFor(headings, headingIndex)
        },
        confidence: "high"
      });
    });
  }
  return rows;
}

export function buildStage6ADocumentSourceLocatorIndex(indexRows = []) {
  return indexRows.map((row) => ({
    doc_id: row.doc_id,
    section_id: row.section_id,
    source_record_ref: row.source_record_ref,
    source_url: "unknown",
    locator_type: row.source_locator?.locator_type || "heading_path",
    locator_value: row.source_locator?.locator_value || row.section_path || row.section_id
  }));
}

export function buildStage6AFallbackSourcePacket(input = {}, inventory = buildStage6ALegalSourceInventory(input), indexRows = []) {
  const indexedDocIds = new Set(indexRows.map((row) => row.doc_id));
  const bySource = inventoryBySourceRef(inventory);
  const packet = [];
  for (const { record, index } of legalSourceEntries(input)) {
    const ref = sourceRecordRef(record, index);
    const doc = bySource.get(ref);
    if (!doc) continue;
    if (indexedDocIds.has(doc.doc_id)) continue;
    packet.push({
      source_record_ref: ref,
      source_url: sourceUrl(record) || doc.source_url || "unknown",
      source_type: doc.doc_type === "privacy_policy" ? "privacy_document" : (doc.doc_type === "trust_center" ? "trust_document" : (doc.doc_type === "status_page" ? "status_document" : "legal_document")),
      reason_for_fallback: "unindexed_admitted_source"
    });
  }
  return packet;
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
  const legalDocumentIndex = buildStage6ALegalDocumentIndex(input, inventory);
  const documentSourceLocatorIndex = buildStage6ADocumentSourceLocatorIndex(legalDocumentIndex);
  const fallbackPacket = buildStage6AFallbackSourcePacket(input, inventory, legalDocumentIndex);
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
      legal_document_index: legalDocumentIndex,
      document_relationship_map: [],
      document_control_signal_map: [],
      document_mismatch_signal_map: [],
      legal_stack_summary_signals: buildStage6ALegalStackSummarySignals(inventory),
      legal_stack_limitations: []
    },
    stage7_navigation_index: {
      feature_to_document_section_index: [],
      control_family_index: [],
      document_source_locator_index: documentSourceLocatorIndex,
      absence_unknown_index: [],
      fallback_source_packet: fallbackPacket
    },
    stage6_limitations: []
  };
}

export const stage6aLegalCartographyBuilderInternals = {
  classifyDocType,
  classifySectionFunction,
  classifyStructuralZone,
  normalizeSourceRecords,
  sourceHeadings,
  shouldAdmitAsLegalCartographySource
};
