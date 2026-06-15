import {
  STAGE6_ACCESS_STATUSES,
  STAGE6_BASIS_CODES,
  STAGE6_COMPONENTS,
  STAGE6_CONFIDENCE_VALUES,
  STAGE6_CONTROL_FAMILIES,
  STAGE6_CORE_DOCUMENT_TYPES,
  STAGE6_DOCUMENT_FAMILIES,
  STAGE6_DOCUMENT_STATUSES,
  STAGE6_DOCUMENT_TYPE_CODES,
  STAGE6_DOCUMENT_TYPES,
  STAGE6_FALLBACK_REASONS,
  STAGE6_LEGAL_UNIT_TYPES,
  STAGE6_LOCATOR_TYPES,
  STAGE6_REVIEW_VERSION,
  STAGE6_SECTION_FUNCTIONS,
  STAGE6_SECTION_FUNCTION_TO_CONTROL_FAMILIES,
  STAGE6_STAGE_ROLE,
  normalizeStage6BasisCodes,
  normalizeStage6Enum,
  uniqueStage6Values
} from "./stage6CanonicalVocabulary.js";
import {
  classifyStage6ADocumentType,
  shouldAdmitStage6ALegalSource,
  stage6AAdmissionDecision,
  stage6ASourceRecordRef,
  stage6ASourceText,
  stage6ASourceTitle,
  stage6ASourceUrl
} from "./stage6aLegalSourceAdmission.js";

const MAX_MACRO_LEGAL_UNITS_PER_DOCUMENT = 12;

function compact(value = "") { return String(value || "").replace(/\s+/g, " ").trim(); }
function lower(value = "") { return compact(value).toLowerCase(); }
function sourceUrl(record = {}) { return stage6ASourceUrl(record); }
function sourceTitle(record = {}) { return stage6ASourceTitle(record); }
function sourceRecordRef(record = {}, index = 0) { return stage6ASourceRecordRef(record, index); }
function sourceText(record = {}) { return stage6ASourceText(record); }
function sourceHeadings(record = {}) { const headings = record.structure?.headings; return Array.isArray(headings) ? headings : []; }

function classifyDocumentType(record = {}) { return stage6AAdmissionDecision(record).document_type; }
function shouldAdmitAsLegalSource(record = {}) { return shouldAdmitStage6ALegalSource(record); }

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
    .map((record, index) => {
      const admission_decision = stage6AAdmissionDecision(record);
      return {
        record,
        index,
        document_type: admission_decision.document_type,
        admission_decision,
        source_record_ref: sourceRecordRef(record, index)
      };
    })
    .filter(({ admission_decision, document_type }) => admission_decision.admitted === true && document_type !== "unknown");
}

export function buildStage6ARejectedSourceLedger(input = {}) {
  return normalizeSourceRecords(input)
    .map((record, index) => {
      const decision = stage6AAdmissionDecision(record);
      return {
        source_record_ref: sourceRecordRef(record, index),
        source_url: sourceUrl(record) || "unknown",
        source_title: sourceTitle(record) || "unknown",
        source_family: decision.source_family,
        admitted: decision.admitted,
        document_type: decision.document_type,
        admission_reason: decision.admission_reason,
        locator_document_type: decision.locator_document_type
      };
    })
    .filter((row) => row.admitted !== true);
}

function documentStatusFor(record = {}) { return sourceText(record) ? "visible" : (sourceUrl(record) ? "linked" : "unknown"); }
function accessStatusFor(record = {}) {
  if (sourceText(record)) return "ingested";
  const status = lower(record.coverage_status || record.quality?.coverage_status || record.status || "");
  if (status.includes("fail") || status.includes("error") || status.includes("blocked")) return "fetch_failed";
  return sourceUrl(record) ? "metadata_only" : "unknown";
}
function documentIdFor(documentType, ordinal) {
  const code = STAGE6_DOCUMENT_TYPE_CODES[documentType] || STAGE6_DOCUMENT_TYPE_CODES.unknown;
  return `DOC_${code}_${String(ordinal).padStart(3, "0")}`;
}
function documentFamilyFor(documentType) { return STAGE6_CORE_DOCUMENT_TYPES.includes(documentType) ? "core" : "supplemental"; }

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

const MACRO_LEGAL_UNIT_PATTERN = /^(article|section|chapter|part|clause|schedule|annex|annexure|exhibit)\b|^\d+(?:\.\d+){0,1}[\).:-]?\s+\S+|\b(definitions|service|privacy|data processing|subprocessor|acceptable use|prohibited use|security|breach|incident|retention|deletion|rights|transfer|liability|warranty|sla|service level|agent|autonomous|fees|payment|billing|dispute|law|jurisdiction|arbitration|intellectual property|minor|children|automated decision|sensitive data|ai|artificial intelligence)\b/;

function isMacroHeading(heading = {}) {
  const text = lower(heading.text || "");
  const level = Number(heading.level || 1);
  if (!text) return false;
  if (/^(faq|question|answer|note|example|learn more|read more|contact us|last updated|table of contents)$/i.test(text)) return false;
  if (Number.isFinite(level) && level > 2 && !/schedule|annex|annexure|exhibit/i.test(text)) return false;
  return MACRO_LEGAL_UNIT_PATTERN.test(text) || (Number.isFinite(level) && level <= 1 && text.split(/\s+/).length >= 2);
}

function legalUnitPathFor(heading = {}, fallback = "Document") { return compact(heading.text || fallback) || fallback; }
function classifyLegalUnitType(heading = {}) {
  const text = lower(heading.text || "");
  if (/annexure|annex/.test(text)) return "annexure";
  if (/schedule/.test(text)) return "schedule";
  if (/exhibit/.test(text)) return "exhibit";
  if (/linked policy|incorporated policy/.test(text)) return "linked_policy";
  if (/table|subprocessor list|recipient list/.test(text)) return "material_table";
  if (/notice/.test(text)) return "control_notice";
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
  if (/intellectual property|\bip\b|ownership/.test(text)) return "ip_ownership_terms";
  if (/minor|child|children|under 18/.test(text)) return "minor_access_terms";
  if (/automated decision|profiling/.test(text)) return "automated_decision_terms";
  if (/sensitive data|special category|biometric|health/.test(text)) return "sensitive_data_terms";
  return "unknown";
}
function controlFamiliesForSectionFunction(sectionFunction) {
  return uniqueStage6Values(STAGE6_SECTION_FUNCTION_TO_CONTROL_FAMILIES[sectionFunction] || [])
    .map((value) => normalizeStage6Enum(value, STAGE6_CONTROL_FAMILIES))
    .filter((value) => value !== "unknown");
}
function fallbackRootHeading(record = {}) { return [{ level: 1, text: sourceTitle(record) || "Document" }]; }
function macroHeadingsForRecord(record = {}) {
  const headings = sourceHeadings(record).filter(isMacroHeading).slice(0, MAX_MACRO_LEGAL_UNITS_PER_DOCUMENT);
  return headings.length ? headings : fallbackRootHeading(record);
}

export function buildStage6ALegalDocumentIndex(input = {}, inventory = buildStage6ALegalSourceInventory(input)) {
  const bySource = inventoryBySourceRef(inventory);
  const rows = [];
  for (const { record, index } of legalSourceEntries(input)) {
    const source_record_ref = sourceRecordRef(record, index);
    const document = bySource.get(source_record_ref);
    if (!document) continue;
    const headings = macroHeadingsForRecord(record);
    headings.forEach((heading, headingIndex) => {
      const title = compact(heading.text || "");
      const legalUnitOrder = headingIndex + 1;
      const sectionFunction = normalizeStage6Enum(classifySectionFunction(heading), STAGE6_SECTION_FUNCTIONS);
      const legalUnitType = normalizeStage6Enum(classifyLegalUnitType(heading), STAGE6_LEGAL_UNIT_TYPES);
      const legalUnitPath = legalUnitPathFor(heading, document.document_title);
      rows.push({
        index_id: `IDX_${document.document_id}_${String(legalUnitOrder).padStart(3, "0")}`,
        document_id: document.document_id,
        legal_unit_id: `${document.document_id}:LU${String(legalUnitOrder).padStart(3, "0")}`,
        legal_unit_type: legalUnitType,
        legal_unit_title: title || document.document_title,
        legal_unit_path: legalUnitPath,
        legal_unit_order: legalUnitOrder,
        section_function: sectionFunction,
        control_families_detected: controlFamiliesForSectionFunction(sectionFunction),
        feature_refs: [],
        data_flow_refs: [],
        source_record_ref,
        source_locator: { locator_type: normalizeStage6Enum("heading_path", STAGE6_LOCATOR_TYPES), locator_value: legalUnitPath },
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

export function buildStage6ALegalDocumentSummarySignals(inventory = []) {
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
    legal_document_coverage_signal: inventory.some((item) => item.document_family === "core") ? "partial" : "unknown",
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
      legal_document_summary_signals: buildStage6ALegalDocumentSummarySignals(legalDocumentInventory),
      legal_document_limitations: []
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
  buildStage6ARejectedSourceLedger,
  classifyDocumentType,
  classifyStage6ADocumentType,
  classifySectionFunction,
  classifyLegalUnitType,
  macroHeadingsForRecord,
  normalizeSourceRecords,
  shouldAdmitAsLegalSource,
  sourceHeadings,
  stage6AAdmissionDecision
};
