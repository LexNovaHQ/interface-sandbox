import {
  STAGE6_ACCESS_STATUSES,
  STAGE6_BASIS_CODES,
  STAGE6_COMPONENTS,
  STAGE6_CONFIDENCE_VALUES,
  STAGE6_CONTROL_FAMILIES,
  STAGE6_DOCUMENT_FAMILIES,
  STAGE6_DOCUMENT_STATUSES,
  STAGE6_DOCUMENT_TYPES,
  STAGE6_FALLBACK_REASONS,
  STAGE6_LEGAL_UNIT_TYPES,
  STAGE6_LOCATOR_TYPES,
  STAGE6_REVIEW_VERSION,
  STAGE6_SECTION_FUNCTIONS,
  STAGE6_STAGE_ROLE,
  normalizeStage6BasisCodes,
  normalizeStage6Enum,
  uniqueStage6Values
} from "./stage6CanonicalVocabulary.js";

const LEGAL_OR_GOVERNANCE_FAMILIES = new Set(["legal_profile", "governance_profile"]);
const CORE_DOCUMENT_TYPES = new Set(["tos", "privacy_policy", "dpa", "aup", "sla"]);

const DOCUMENT_TYPE_CODES = Object.freeze({
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
  ai_policy: "AI_POLICY",
  responsible_ai_page: "RAI",
  model_card: "MODEL_CARD",
  developer_terms: "DEVTERMS",
  api_terms: "APITERMS",
  community_guidelines: "COMMUNITY",
  data_deletion_page: "DELETION",
  dsr_page: "DSR",
  grievance_page: "GRIEVANCE",
  baa: "BAA",
  hipaa_notice: "HIPAA",
  data_transfer_addendum: "DTA",
  other_valid_control_doc: "OTHER",
  unknown: "UNKNOWN"
});

function compact(value = "") { return String(value || "").replace(/\s+/g, " ").trim(); }
function lower(value = "") { return compact(value).toLowerCase(); }
function firstNonEmpty(...values) { for (const value of values) { const text = compact(value); if (text) return text; } return ""; }
function sourceUrl(record = {}) { return firstNonEmpty(record.final_url, record.source_url, record.url, record.href); }
function sourceTitle(record = {}) { return firstNonEmpty(record.title, record.structure?.title, record.meta_title); }
function sourceFamily(record = {}) { return firstNonEmpty(record.source_family, record.profile_family, record.family, record.evidence_family, record.source_type) || "unknown"; }
function sourceRecordRef(record = {}, index = 0) { return firstNonEmpty(record.source_record_ref, record.evidence_source_id, record.source_id, record.id) || `SRC_${String(index + 1).padStart(3, "0")}`; }
function sourceText(record = {}) { return firstNonEmpty(record.clean_text_lossless, record.text?.clean_text_lossless, record.normalized_text, record.text); }
function sourceHeadings(record = {}) { const headings = record.structure?.headings; return Array.isArray(headings) ? headings : []; }

function classifyDocumentType(record = {}) {
  const combined = `${lower(sourceUrl(record))} ${lower(sourceTitle(record))} ${lower(sourceText(record).slice(0, 2000))}`;
  if (/terms-of-service|terms of service|\btos\b|terms and conditions/.test(combined)) return "tos";
  if (/privacy-policy|privacy policy|privacy notice/.test(combined)) return "privacy_policy";
  if (/\beula\b|end user license/.test(combined)) return "eula";
  if (/status\.|system status|status page/.test(combined)) return "status_page";
  if (/data-processing|data processing agreement|data processing addendum|\bdpa\b/.test(combined)) return "dpa";
  if (/acceptable-use|acceptable use|prohibited use|usage restrictions|\baup\b/.test(combined)) return "aup";
  if (/service-level|service level agreement|\bsla\b|uptime/.test(combined)) return "sla";
  if (/responsible ai|ai policy|artificial intelligence policy/.test(combined)) return "responsible_ai_page";
  if (/model card/.test(combined)) return "model_card";
  if (/trust-center|trust center/.test(combined)) return "trust_center";
  if (/security posture|security/.test(combined)) return "security_page";
  if (/subprocessor|sub-processor|service provider list/.test(combined)) return "subprocessor_page";
  if (/cookie policy|cookies/.test(combined)) return "cookie_policy";
  if (/delete your data|data deletion|erasure request/.test(combined)) return "data_deletion_page";
  if (/data subject request|dsr|privacy rights/.test(combined)) return "dsr_page";
  if (/grievance|grievance officer/.test(combined)) return "grievance_page";
  if (/developer terms/.test(combined)) return "developer_terms";
  if (/api terms/.test(combined)) return "api_terms";
  if (/community guidelines/.test(combined)) return "community_guidelines";
  if (/business associate agreement|\bbaa\b/.test(combined)) return "baa";
  if (/hipaa/.test(combined)) return "hipaa_notice";
  if (/data transfer addendum|standard contractual/.test(combined)) return "data_transfer_addendum";
  if (/legal|policy|terms|privacy|security|trust|compliance|status/.test(combined)) return "other_valid_control_doc";
  return "unknown";
}

function shouldAdmitAsLegalSource(record = {}) {
  const family = sourceFamily(record);
  if (LEGAL_OR_GOVERNANCE_FAMILIES.has(family)) return true;
  return classifyDocumentType(record) !== "unknown";
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

function legalSourceEntries(input = {}) {
  return normalizeSourceRecords(input)
    .map((record, index) => ({ record, index, document_type: classifyDocumentType(record), source_record_ref: sourceRecordRef(record, index) }))
    .filter(({ record, document_type }) => shouldAdmitAsLegalSource(record) && document_type !== "unknown");
}

function documentStatusFor(record = {}) {
  if (sourceText(record)) return "visible";
  return sourceUrl(record) ? "linked" : "unknown";
}

function accessStatusFor(record = {}) {
  if (sourceText(record)) return "ingested";
  const status = lower(record.coverage_status || record.quality?.coverage_status || record.status || "");
  if (status.includes("fail") || status.includes("error") || status.includes("blocked")) return "fetch_failed";
  return sourceUrl(record) ? "metadata_only" : "unknown";
}

function documentIdFor(documentType, ordinal) {
  const code = DOCUMENT_TYPE_CODES[documentType] || DOCUMENT_TYPE_CODES.unknown;
  return `DOC_${code}_${String(ordinal).padStart(3, "0")}`;
}

function documentFamilyFor(documentType) {
  return CORE_DOCUMENT_TYPES.has(documentType) ? "core" : "supplemental";
}

export function buildStage6ALegalSourceInventory(input = {}) {
  const counters = new Map();
  return legalSourceEntries(input).map(({ record, index, document_type }) => {
    const next = (counters.get(document_type) || 0) + 1;
    counters.set(document_type, next);
    const source_record_ref = sourceRecordRef(record, index);
    const source_url = sourceUrl(record) || "unknown";
    return {
      document_id: documentIdFor(document_type, next),
      document_type: normalizeStage6Enum(document_type, STAGE6_DOCUMENT_TYPES),
      document_family: normalizeStage6Enum(documentFamilyFor(document_type), STAGE6_DOCUMENT_FAMILIES),
      document_title: sourceTitle(record) || document_type,
      document_status: normalizeStage6Enum(documentStatusFor(record), STAGE6_DOCUMENT_STATUSES),
      access_status: normalizeStage6Enum(accessStatusFor(record), STAGE6_ACCESS_STATUSES),
      source_record_ref,
      source_url,
      final_url: source_url,
      parent_document_id: "",
      jurisdiction_scope: [],
      language: "unknown",
      confidence: source_url !== "unknown" || sourceText(record) ? "high" : "unknown"
    };
  });
}

function inventoryBySourceRef(inventory = []) { return new Map(inventory.map((item) => [item.source_record_ref, item])); }
function inventoryByDocumentId(inventory = []) { return new Map(inventory.map((item) => [item.document_id, item])); }

function isMacroHeading(heading = {}) {
  const text = lower(heading.text || "");
  const level = Number(heading.level || 1);
  if (Number.isFinite(level) && level <= 2) return true;
  return /annex|schedule|exhibit|policy|terms|privacy|security|subprocessor|acceptable use|prohibited use|\bdpa\b|\bsla\b|data processing|rights|deletion|retention|liability|warranty|dispute|\bai\b|artificial intelligence|model/.test(text);
}

function legalUnitPathFor(headings = [], index = 0) {
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

function classifyLegalUnitType(heading = {}) {
  const text = lower(heading.text || "");
  if (/annexure|annex/.test(text)) return "annexure";
  if (/schedule/.test(text)) return "schedule";
  if (/exhibit/.test(text)) return "exhibit";
  if (/linked policy|incorporated policy/.test(text)) return "linked_policy";
  if (/table|subprocessor list|recipient list/.test(text)) return "material_table";
  if (/notice|banner|modal|footer/.test(text)) return "control_notice";
  return "main_section";
}

function classifySectionFunction(heading = {}) {
  const text = lower(heading.text || "");
  if (/definition|definitions/.test(text)) return "definitions";
  if (/service|scope|administration|license|eligibility/.test(text)) return "service_description";
  if (/\bai\b|artificial intelligence|model|output|hallucination|generated/.test(text)) return "ai_disclosure";
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

function controlFamiliesForSectionFunction(sectionFunction) {
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
    agentic_controls: ["agentic_controls"],
    commercial_terms: ["commercial_terms"],
    dispute_terms: ["dispute_terms"]
  };
  return uniqueStage6Values(map[sectionFunction] || []).map((value) => normalizeStage6Enum(value, STAGE6_CONTROL_FAMILIES)).filter((value) => value !== "unknown");
}

function fallbackRootHeading(record = {}) {
  const title = sourceTitle(record) || "Document";
  return [{ level: 1, text: title }];
}

export function buildStage6ALegalDocumentIndex(input = {}, inventory = buildStage6ALegalSourceInventory(input)) {
  const bySource = inventoryBySourceRef(inventory);
  const rows = [];
  for (const { record, index } of legalSourceEntries(input)) {
    const source_record_ref = sourceRecordRef(record, index);
    const document = bySource.get(source_record_ref);
    if (!document) continue;
    const sourceHeadingsList = sourceHeadings(record);
    const headings = sourceHeadingsList.length ? sourceHeadingsList : fallbackRootHeading(record);
    let legalUnitOrder = 0;
    headings.forEach((heading, headingIndex) => {
      const title = compact(heading.text || "");
      if (!title || !isMacroHeading(heading)) return;
      legalUnitOrder += 1;
      const sectionFunction = normalizeStage6Enum(classifySectionFunction(heading), STAGE6_SECTION_FUNCTIONS);
      const legalUnitType = normalizeStage6Enum(classifyLegalUnitType(heading), STAGE6_LEGAL_UNIT_TYPES);
      const legalUnitPath = legalUnitPathFor(headings, headingIndex);
      rows.push({
        index_id: `IDX_${document.document_id}_${String(legalUnitOrder).padStart(3, "0")}`,
        document_id: document.document_id,
        legal_unit_id: `${document.document_id}:LU${String(legalUnitOrder).padStart(3, "0")}`,
        legal_unit_type: legalUnitType,
        legal_unit_title: title,
        legal_unit_path: legalUnitPath,
        legal_unit_order: legalUnitOrder,
        section_function: sectionFunction,
        control_families_detected: controlFamiliesForSectionFunction(sectionFunction),
        feature_refs: [],
        data_flow_refs: [],
        source_record_ref,
        source_locator: {
          locator_type: normalizeStage6Enum("heading_path", STAGE6_LOCATOR_TYPES),
          locator_value: legalUnitPath
        },
        basis_codes: normalizeStage6BasisCodes(["macro_heading_classification", "source_bundle_record_ref", "deterministic_seed"]),
        confidence: "high"
      });
    });
  }
  return rows;
}

export function buildStage6ALegalUnitSourceLocatorIndex(indexRows = [], inventory = []) {
  const byDocument = inventoryByDocumentId(inventory);
  return indexRows.map((row) => {
    const document = byDocument.get(row.document_id);
    return {
      document_id: row.document_id,
      legal_unit_id: row.legal_unit_id,
      source_record_ref: row.source_record_ref,
      source_url: document?.source_url || "unknown",
      locator_type: normalizeStage6Enum(row.source_locator?.locator_type || "heading_path", STAGE6_LOCATOR_TYPES),
      locator_value: row.source_locator?.locator_value || row.legal_unit_path || row.legal_unit_id
    };
  });
}

export function buildStage6AFallbackSourcePacket(input = {}, inventory = buildStage6ALegalSourceInventory(input), indexRows = []) {
  const indexedDocumentIds = new Set(indexRows.map((row) => row.document_id));
  const bySource = inventoryBySourceRef(inventory);
  const packet = [];
  for (const { record, index } of legalSourceEntries(input)) {
    const source_record_ref = sourceRecordRef(record, index);
    const document = bySource.get(source_record_ref);
    if (!document || indexedDocumentIds.has(document.document_id)) continue;
    packet.push({
      source_record_ref,
      source_url: sourceUrl(record) || document.source_url || "unknown",
      source_type: document.document_type === "privacy_policy" ? "privacy_document" : "legal_document",
      reason_for_fallback: normalizeStage6Enum("unindexed_admitted_source", STAGE6_FALLBACK_REASONS)
    });
  }
  return packet;
}

export function buildStage6ALegalStackSummarySignals(inventory = []) {
  const hasDocumentType = (documentType) => inventory.some((item) => item.document_type === documentType && ["visible", "embedded", "linked"].includes(item.document_status));
  return {
    core_stack_status: {
      tos: hasDocumentType("tos") ? "visible" : "not_visible",
      privacy_policy: hasDocumentType("privacy_policy") ? "visible" : "not_visible",
      dpa: hasDocumentType("dpa") ? "visible" : "unknown",
      aup: hasDocumentType("aup") ? "visible" : "unknown",
      sla: hasDocumentType("sla") ? "visible" : "unknown"
    },
    supplemental_artifacts_detected: inventory.filter((item) => item.document_family === "supplemental").map((item) => item.document_id),
    document_hierarchy_signal: inventory.length > 1 ? "partial" : (inventory.length === 1 ? "unknown" : "not_visible"),
    legal_stack_coverage_signal: inventory.some((item) => item.document_family === "core") ? "partial" : "unknown",
    major_unknowns: []
  };
}

export function buildStage6ALegalCartographySkeleton(input = {}) {
  const legalDocumentInventory = buildStage6ALegalSourceInventory(input);
  const legalDocumentIndex = buildStage6ALegalDocumentIndex(input, legalDocumentInventory);
  const legalUnitSourceLocatorIndex = buildStage6ALegalUnitSourceLocatorIndex(legalDocumentIndex, legalDocumentInventory);
  const fallbackSourcePacket = buildStage6AFallbackSourcePacket(input, legalDocumentInventory, legalDocumentIndex);
  return {
    stage6_review_version: STAGE6_REVIEW_VERSION,
    stage6_component: STAGE6_COMPONENTS[0],
    stage_role: STAGE6_STAGE_ROLE,
    input_refs: {
      target_profile_version: input?.target_profile?.target_profile_version || input?.company_profile?.target_profile_version || "unknown",
      feature_profile_version: input?.target_feature_profile?.feature_profile_version || "unknown",
      source_bundle_version: input?.source_bundle?.source_bundle_version || input?.source_bundle?.source_review?.source_bundle_version || "unknown"
    },
    legal_document_cartography: {
      legal_document_inventory: legalDocumentInventory,
      legal_document_index: legalDocumentIndex,
      document_relationship_map: [],
      document_control_signal_map: [],
      document_mismatch_signal_map: [],
      legal_stack_summary_signals: buildStage6ALegalStackSummarySignals(legalDocumentInventory),
      legal_stack_limitations: []
    },
    stage7_navigation_index: {
      feature_to_data_flow_index: [],
      feature_to_legal_unit_index: [],
      control_family_index: [],
      data_signal_index: [],
      legal_unit_source_locator_index: legalUnitSourceLocatorIndex,
      absence_unknown_index: [],
      fallback_source_packet: fallbackSourcePacket
    },
    stage6_limitations: []
  };
}

export const stage6aLegalCartographyBuilderInternals = {
  STAGE6_BASIS_CODES,
  STAGE6_CONFIDENCE_VALUES,
  classifyDocumentType,
  classifySectionFunction,
  classifyLegalUnitType,
  normalizeSourceRecords,
  sourceHeadings,
  shouldAdmitAsLegalSource
};
