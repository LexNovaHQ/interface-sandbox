import { buildStage6ACartography } from "./stage6aLegalCartographyMerge.js";

const DEFAULT_TEXT_WINDOW_CHARS = 1200;
const DEFAULT_MAX_SECTIONS = 240;

const ALLOWED_ENUMS = Object.freeze({
  signal: ["visible", "not_visible", "partial", "conflicting", "not_applicable", "unknown"],
  confidence: ["high", "medium", "low", "unknown"],
  section_function: [
    "definitions",
    "service_description",
    "ai_disclosure",
    "privacy_notice",
    "data_processing_terms",
    "subprocessor_terms",
    "acceptable_use_rules",
    "prohibited_use_rules",
    "security_terms",
    "breach_terms",
    "retention_deletion_terms",
    "rights_request_terms",
    "cross_border_transfer_terms",
    "liability_terms",
    "warranty_disclaimer",
    "sla_terms",
    "agentic_controls",
    "commercial_terms",
    "dispute_terms",
    "other",
    "unknown"
  ],
  control_family: [
    "ai_disclosure",
    "hallucination_disclaimer",
    "hitl_mandate",
    "acceptable_use",
    "prohibited_use",
    "privacy_notice",
    "data_collection",
    "data_use",
    "data_sharing",
    "subprocessor_disclosure",
    "model_provider_disclosure",
    "training_or_finetuning",
    "retention",
    "deletion",
    "data_subject_rights",
    "consent_withdrawal",
    "grievance_channel",
    "security_safeguards",
    "breach_notice",
    "cross_border_transfer",
    "liability_cap",
    "warranty_disclaimer",
    "sla_performance",
    "agentic_controls",
    "unknown"
  ],
  relationship_type: [
    "incorporates_by_reference",
    "supplements",
    "controls_on_conflict",
    "linked_from",
    "defines_terms_for",
    "activates_when",
    "supersedes_for_subject_matter",
    "unknown"
  ],
  mismatch_type: [
    "feature_without_control_section",
    "doc_without_required_section",
    "conflicting_document_signal",
    "missing_core_document",
    "missing_supplemental_document",
    "control_signal_unclear",
    "unknown"
  ],
  ref_type: ["feature", "document", "document_section", "control_signal", "source_record", "unknown"],
  basis_code: [
    "heading_classification",
    "source_text_classification",
    "source_bundle_record_ref",
    "stage5_feature_ref",
    "stage6_section_ref",
    "stage6_control_signal_ref",
    "document_relationship_signal",
    "absence_after_search",
    "unknown"
  ]
});

function compact(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const text = compact(value);
    if (text) return text;
  }
  return "";
}

function sourceRecordRef(record = {}, index = 0) {
  return firstNonEmpty(record.source_record_ref, record.evidence_source_id, record.source_id, record.id) || `SRC_${String(index + 1).padStart(3, "0")}`;
}

function sourceUrl(record = {}) {
  return firstNonEmpty(record.final_url, record.source_url, record.url, record.href);
}

function sourceTitle(record = {}) {
  return firstNonEmpty(record.title, record.structure?.title, record.meta_title);
}

function sourceText(record = {}) {
  return firstNonEmpty(record.clean_text_lossless, record.text?.clean_text_lossless, record.normalized_text, record.text);
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

function sourceRecordIndex(input = {}) {
  const records = normalizeSourceRecords(input);
  return new Map(records.map((record, index) => [sourceRecordRef(record, index), { record, index }]));
}

function boundedTextWindow(record = {}, section = {}, maxChars = DEFAULT_TEXT_WINDOW_CHARS) {
  const text = sourceText(record);
  if (!text) return "";
  const cleaned = text.replace(/\s+/g, " ").trim();
  const heading = compact(section.heading_text || "");
  const path = compact(section.section_path || "");
  const needle = heading || path;
  if (!needle) return cleaned.slice(0, maxChars);
  const haystack = cleaned.toLowerCase();
  const pos = haystack.indexOf(needle.toLowerCase());
  if (pos < 0) return cleaned.slice(0, maxChars);
  const half = Math.floor(maxChars / 2);
  const start = Math.max(0, pos - half);
  const end = Math.min(cleaned.length, pos + needle.length + half);
  return cleaned.slice(start, end);
}

function featureRefs(input = {}) {
  const features = input?.target_feature_profile?.feature_inventory;
  if (!Array.isArray(features)) return [];
  return features.map((feature, index) => ({
    feature_id: firstNonEmpty(feature.feature_id, feature.id) || `F${String(index + 1).padStart(3, "0")}`,
    feature_name: compact(feature.feature_name || feature.name || "unknown"),
    feature_role: compact(feature.feature_role || "unknown"),
    archetype_codes: Array.isArray(feature.archetype_codes) ? feature.archetype_codes : [],
    surface_tokens: Array.isArray(feature.surface_tokens) ? feature.surface_tokens : []
  }));
}

function sectionSeedRows(canonical = {}, input = {}, options = {}) {
  const maxSections = Number.isFinite(Number(options.maxSections)) ? Number(options.maxSections) : DEFAULT_MAX_SECTIONS;
  const maxChars = Number.isFinite(Number(options.textWindowChars)) ? Number(options.textWindowChars) : DEFAULT_TEXT_WINDOW_CHARS;
  const records = sourceRecordIndex(input);
  const sections = canonical?.legal_document_cartography?.legal_document_index || [];
  return sections.slice(0, maxSections).map((section) => {
    const recordEntry = records.get(section.source_record_ref);
    return {
      doc_id: section.doc_id,
      section_id: section.section_id,
      section_path: section.section_path,
      heading_level: section.heading_level,
      heading_text: section.heading_text,
      structural_zone_seed: section.structural_zone,
      section_function_seed: section.section_function,
      control_topics_seed: Array.isArray(section.control_topics_detected) ? section.control_topics_detected : [],
      source_record_ref: section.source_record_ref,
      source_url: sourceUrl(recordEntry?.record || {}) || "unknown",
      source_title: sourceTitle(recordEntry?.record || {}) || "unknown",
      source_locator: section.source_locator || { locator_type: "unknown", locator_value: section.section_id },
      nearby_text_window: boundedTextWindow(recordEntry?.record || {}, section, maxChars)
    };
  });
}

function deterministicControlSeed(canonical = {}) {
  const signals = canonical?.legal_document_cartography?.document_control_signal_map;
  if (!Array.isArray(signals)) return [];
  return signals.map((signal) => ({
    control_signal_id: signal.control_signal_id,
    doc_id: signal.doc_id,
    section_id: signal.section_id,
    control_family: signal.control_family,
    coverage_signal: signal.coverage_signal,
    basis_codes: Array.isArray(signal.basis_codes) ? signal.basis_codes : [],
    confidence: signal.confidence || "unknown"
  }));
}

export function buildStage6AModelOverlayPacket(input = {}, options = {}) {
  const canonical = buildStage6ACartography(input);
  return {
    overlay_packet_version: "stage6a_model_overlay_packet_v1",
    stage: "6A_MODEL_OVERLAY",
    instruction_boundary: {
      purpose: "Classify existing deterministic Stage 6A legal cartography rows using controlled values only.",
      may_create_documents: false,
      may_create_sections: false,
      may_create_source_refs: false,
      may_create_locators: false,
      may_emit_quotes: false,
      may_emit_prose_analysis: false
    },
    allowed_enums: ALLOWED_ENUMS,
    input_refs: canonical.input_refs || {},
    document_inventory_seed: canonical.legal_document_cartography?.legal_document_inventory || [],
    section_index_seed: sectionSeedRows(canonical, input, options),
    deterministic_control_seed: deterministicControlSeed(canonical),
    feature_refs: featureRefs(input),
    expected_output_key: "stage6a_model_overlay"
  };
}

export const stage6aModelOverlayPacketBuilderInternals = {
  ALLOWED_ENUMS,
  boundedTextWindow,
  featureRefs,
  normalizeSourceRecords,
  sectionSeedRows
};
