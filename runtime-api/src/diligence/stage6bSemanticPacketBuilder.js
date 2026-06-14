import {
  buildStage6BDataProvenanceSkeleton,
  normalizeStage5FeatureProfile
} from "./stage6bDataProvenanceBuilder.js";
import {
  STAGE6_COLLECTION_CONTEXTS,
  STAGE6_CONFIDENCE_VALUES,
  STAGE6_DATA_CATEGORY_TYPES,
  STAGE6_DATA_SUBJECT_TYPES,
  STAGE6_LIMITATION_IMPACT_CODES,
  STAGE6_LIMITATION_REASON_CODES,
  STAGE6_OUTPUT_CATEGORIES,
  STAGE6_PROCESSING_ACTIONS,
  STAGE6_PROCESSING_PURPOSES,
  STAGE6_RECIPIENT_CATEGORIES,
  STAGE6_REGIME_BASIS_TAGS,
  STAGE6_REGIONS,
  STAGE6_ROLE_ALLOCATION_VALUES,
  STAGE6_STANDARD_SIGNALS
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

function sourceWindows(input = {}, sourceRefs = [], maxChars = 1200) {
  const wanted = new Set(sourceRefs);
  return normalizeSourceRecords(input).map((record, index) => {
    const ref = sourceRecordRef(record, index);
    if (wanted.size && !wanted.has(ref)) return null;
    return {
      source_record_ref: ref,
      source_url: compact(record.source_url || record.url || record.final_url),
      source_type: compact(record.source_type || record.type || "unknown"),
      nearby_text_window: sourceText(record).slice(0, maxChars)
    };
  }).filter(Boolean);
}

function featureRefs(profile = {}) {
  return asArray(profile.feature_inventory).map((feature, index) => ({
    feature_id: compact(feature.feature_id) || `F${String(index + 1).padStart(3, "0")}`,
    feature_name: compact(feature.feature_name || feature.feature_label || feature.name),
    feature_role: compact(feature.feature_role || "unknown"),
    archetype_codes: asArray(feature.archetype_codes),
    surface_tokens: asArray(feature.surface_tokens),
    confidence: compact(feature.confidence || "unknown")
  }));
}

function provenanceRefs(profile = {}) {
  return asArray(profile.data_provenance_map).map((row, index) => ({
    provenance_id: compact(row.provenance_id) || `DP${String(index + 1).padStart(3, "0")}`,
    feature_id: compact(row.feature_id || "unknown"),
    data_origin: compact(row.data_origin),
    data_subject: compact(row.data_subject),
    data_category: compact(row.data_category),
    processing_context: compact(row.processing_context),
    storage_or_retention_signal: compact(row.storage_or_retention_signal),
    training_or_finetuning_signal: compact(row.training_or_finetuning_signal),
    evidence_refs: asArray(row.evidence_refs),
    source_url: compact(row.source_url),
    confidence: compact(row.confidence || "unknown")
  }));
}

export function buildStage6BSemanticPacket(input = {}, options = {}) {
  const canonical = buildStage6BDataProvenanceSkeleton(input);
  const profile = normalizeStage5FeatureProfile(input);
  const maxDataFlows = Number(options.maxDataFlows || 200);
  const textWindowChars = Number(options.textWindowChars || 1200);
  const dataFlowSeed = asArray(canonical.data_provenance_profile?.data_flow_profile).slice(0, maxDataFlows);
  const sourceRefs = [...new Set(dataFlowSeed.flatMap((row) => asArray(row.source_refs)))];

  return {
    semantic_packet_version: "stage6_semantic_packet_v1",
    stage6_component: "stage6b_data_provenance",
    allowed_vocabulary: {
      standard_signal: STAGE6_STANDARD_SIGNALS,
      confidence: STAGE6_CONFIDENCE_VALUES,
      data_subject_subject_type: STAGE6_DATA_SUBJECT_TYPES,
      data_category_category_types: STAGE6_DATA_CATEGORY_TYPES,
      processing_collection_context: STAGE6_COLLECTION_CONTEXTS,
      processing_processing_actions: STAGE6_PROCESSING_ACTIONS,
      processing_processing_purpose: STAGE6_PROCESSING_PURPOSES,
      processing_output_category: STAGE6_OUTPUT_CATEGORIES,
      role_allocation: STAGE6_ROLE_ALLOCATION_VALUES,
      regime_basis_tags: STAGE6_REGIME_BASIS_TAGS,
      recipient_categories: STAGE6_RECIPIENT_CATEGORIES,
      regions_visible: STAGE6_REGIONS,
      limitation_reason_code: STAGE6_LIMITATION_REASON_CODES,
      limitation_impact_code: STAGE6_LIMITATION_IMPACT_CODES
    },
    data_flow_seed: dataFlowSeed.map((row) => ({
      data_flow_id: row.data_flow_id,
      feature_id: row.feature_id,
      provenance_id: row.provenance_id,
      data_subject: row.data_subject,
      data_category: row.data_category,
      processing: row.processing,
      role_allocation: row.role_allocation,
      regime_relevance: row.regime_relevance,
      notice: row.notice,
      consent_basis: row.consent_basis,
      rights: row.rights,
      processor_chain: row.processor_chain,
      transfer_location: row.transfer_location,
      retention_deletion_ai: row.retention_deletion_ai,
      security_accountability: row.security_accountability,
      confidence: row.confidence
    })),
    deterministic_ref_index: dataFlowSeed.map((row) => ({
      data_flow_id: row.data_flow_id,
      feature_id: row.feature_id,
      provenance_id: row.provenance_id,
      source_refs: row.source_refs,
      document_refs: row.source_trace?.document_refs || [],
      legal_unit_refs: row.source_trace?.legal_unit_refs || [],
      basis_codes: row.basis_codes
    })),
    feature_refs: featureRefs(profile),
    provenance_refs: provenanceRefs(profile),
    regulated_surface_refs: asArray(profile.regulated_surface_map),
    source_refs: sourceWindows(input, sourceRefs, textWindowChars),
    instructions: {
      classification_only: true,
      no_final_schema_wrapper: true,
      no_new_data_flow_rows: true,
      no_ref_mutation: true,
      no_quotes_or_prose: true,
      use_canonical_vocabulary_only: true
    }
  };
}

export const stage6bSemanticPacketBuilderInternals = {
  normalizeSourceRecords,
  sourceRecordRef,
  sourceWindows
};
