import { buildStage6ACartography } from "./stage6aLegalCartographyMerge.js";
import {
  STAGE6_BASIS_CODES,
  STAGE6_CONFIDENCE_VALUES,
  STAGE6_CONTROL_FAMILIES,
  STAGE6_CONTROL_SIGNALS,
  STAGE6_LEGAL_UNIT_TYPES,
  STAGE6_MISMATCH_SIGNALS,
  STAGE6_MISMATCH_TYPES,
  STAGE6_RELATIONSHIP_TYPES,
  STAGE6_SECTION_FUNCTIONS
} from "./stage6CanonicalVocabulary.js";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function compact(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function sourceText(record = {}) {
  return compact(record.clean_text_lossless || record.text?.clean_text_lossless || record.normalized_text || record.text || "");
}

function sourceRecordRef(record = {}, index = 0) {
  return compact(record.source_record_ref || record.evidence_source_id || record.source_id || record.id || `SRC_${String(index + 1).padStart(3, "0")}`);
}

function normalizeSourceRecords(input = {}) {
  const rawRecords = input?.source_bundle?.raw_footprint?.source_records;
  if (Array.isArray(rawRecords) && rawRecords.length) return rawRecords;
  const evidenceBuffer = input?.source_bundle?.evidence_buffer;
  if (Array.isArray(evidenceBuffer) && evidenceBuffer.length) return evidenceBuffer;
  const artifactInventory = input?.source_bundle?.artifact_inventory;
  if (Array.isArray(artifactInventory) && artifactInventory.length) return artifactInventory;
  return [];
}

function textWindowFor(input = {}, sourceRef, maxChars = 1200) {
  const record = normalizeSourceRecords(input).find((item, index) => sourceRecordRef(item, index) === sourceRef);
  return sourceText(record).slice(0, maxChars);
}

function featureRefs(targetFeatureProfile = {}) {
  return asArray(targetFeatureProfile.feature_inventory).map((feature, index) => ({
    feature_id: compact(feature.feature_id) || `F${String(index + 1).padStart(3, "0")}`,
    feature_name: compact(feature.feature_name || feature.feature_label || feature.name),
    archetype_codes: asArray(feature.archetype_codes),
    surface_tokens: asArray(feature.surface_tokens),
    confidence: compact(feature.confidence || "unknown")
  }));
}

export function buildStage6ASemanticClassificationPacket(input = {}, options = {}) {
  const canonical = buildStage6ACartography(input);
  const maxLegalUnits = Number(options.maxSections || options.maxLegalUnits || 160);
  const textWindowChars = Number(options.textWindowChars || 1200);
  const legalUnitSeed = asArray(canonical.legal_document_cartography?.legal_document_index).slice(0, maxLegalUnits).map((row) => ({
    document_id: row.document_id,
    legal_unit_id: row.legal_unit_id,
    legal_unit_type: row.legal_unit_type,
    legal_unit_title: row.legal_unit_title,
    legal_unit_path: row.legal_unit_path,
    section_function: row.section_function,
    control_families_detected: row.control_families_detected,
    source_record_ref: row.source_record_ref,
    nearby_text_window: textWindowFor(input, row.source_record_ref, textWindowChars)
  }));

  return {
    semantic_packet_version: "stage6_semantic_packet_v1",
    stage6_component: "stage6a_legal_document_cartography",
    allowed_vocabulary: {
      section_function: STAGE6_SECTION_FUNCTIONS,
      legal_unit_type: STAGE6_LEGAL_UNIT_TYPES,
      control_family: STAGE6_CONTROL_FAMILIES,
      control_signal: STAGE6_CONTROL_SIGNALS,
      relationship_type: STAGE6_RELATIONSHIP_TYPES,
      mismatch_type: STAGE6_MISMATCH_TYPES,
      mismatch_signal: STAGE6_MISMATCH_SIGNALS,
      basis_code: STAGE6_BASIS_CODES,
      confidence: STAGE6_CONFIDENCE_VALUES
    },
    document_inventory_seed: asArray(canonical.legal_document_cartography?.legal_document_inventory),
    legal_unit_seed: legalUnitSeed,
    deterministic_control_seed: asArray(canonical.legal_document_cartography?.document_control_signal_map),
    feature_refs: featureRefs(input?.target_feature_profile || {}),
    instructions: {
      classification_only: true,
      no_new_documents: true,
      no_new_legal_units: true,
      no_quotes_or_prose: true,
      use_canonical_vocabulary_only: true
    }
  };
}

export const stage6aSemanticClassificationPacketBuilderInternals = {
  STAGE6_BASIS_CODES,
  STAGE6_CONTROL_FAMILIES,
  STAGE6_CONTROL_SIGNALS,
  STAGE6_LEGAL_UNIT_TYPES,
  STAGE6_SECTION_FUNCTIONS,
  normalizeSourceRecords,
  textWindowFor
};
