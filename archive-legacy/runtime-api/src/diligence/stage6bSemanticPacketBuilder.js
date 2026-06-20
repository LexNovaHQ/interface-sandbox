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
import {
  buildStage6BLegalGovernancePrefill,
  normalizeStage6BSourceRef,
  stage6BLegalGovernanceSourceRecords,
  stage6BSourceRecordRef
} from "./stage6bLegalGovernancePrefill.js";

function asArray(value) { return Array.isArray(value) ? value : []; }
function compact(value = "") { return String(value || "").replace(/\s+/g, " ").trim(); }
function sourceText(record = {}) { return compact(record.clean_text_lossless || record.text?.clean_text_lossless || record.normalized_text || record.text || ""); }
function sourceUrl(record = {}) { return compact(record.source_url || record.url || record.final_url); }
function sourceFamily(record = {}) { return compact(record.source_family || record.family || record.source_type || record.type || "unknown"); }

function sourceRecordPacket(record = {}, index = 0) {
  const ref = stage6BSourceRecordRef(record, index);
  return {
    source_record_ref: ref,
    normalized_source_record_ref: normalizeStage6BSourceRef(ref),
    source_url: sourceUrl(record),
    source_family: sourceFamily(record),
    source_type: compact(record.source_type || record.type || "unknown"),
    title: compact(record.structure?.title || record.title || ""),
    clean_text_lossless: sourceText(record),
    source_text_is_lossless: true,
    summarized: false,
    compressed: false,
    snippet_selected: false
  };
}

function legalGovernanceLosslessSources(input = {}) {
  return stage6BLegalGovernanceSourceRecords(input).map(sourceRecordPacket);
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

function legalCartographyRefs(input = {}) {
  const cartography = input.legal_document_cartography || input.stage6a_review?.legal_document_cartography || {};
  const nav = input.stage6a_review?.stage7_navigation_index || {};
  return {
    legal_document_inventory: asArray(cartography.legal_document_inventory).map((row) => ({
      document_id: row.document_id,
      document_type: row.document_type,
      document_title: row.document_title,
      source_record_ref: row.source_record_ref,
      source_url: row.source_url
    })),
    legal_document_index: asArray(cartography.legal_document_index).map((row) => ({
      legal_unit_id: row.legal_unit_id,
      document_id: row.document_id,
      section_function: row.section_function,
      control_families_detected: asArray(row.control_families_detected),
      source_record_ref: row.source_record_ref,
      source_locator: row.source_locator,
      confidence: row.confidence
    })),
    control_signal_map: asArray(cartography.document_control_signal_map).map((row) => ({
      document_id: row.document_id,
      legal_unit_id: row.legal_unit_id,
      control_family: row.control_family,
      control_signal: row.control_signal,
      confidence: row.confidence
    })),
    legal_unit_source_locator_index: asArray(nav.legal_unit_source_locator_index)
  };
}

export function buildStage6BSemanticPacket(input = {}, options = {}) {
  const canonical = buildStage6BDataProvenanceSkeleton(input);
  const profile = normalizeStage5FeatureProfile(input);
  const maxDataFlows = Number(options.maxDataFlows || 200);
  const dataFlowSeed = asArray(canonical.data_provenance_profile?.data_flow_profile).slice(0, maxDataFlows);
  const legalSources = legalGovernanceLosslessSources(input);
  const prefill = buildStage6BLegalGovernancePrefill(input);

  return {
    semantic_packet_version: "stage6b_semantic_packet_v2",
    stage6_component: "stage6b_data_provenance",
    input_firewall: {
      allowed_lossless_source_families: ["legal_profile", "governance_profile"],
      forbidden_lossless_source_families: ["product_profile", "company_profile", "commercial_profile", "docs_developer_profile"],
      stage5_role: "feature_data_behavior_map_only",
      stage6a_role: "legal_unit_navigation_only",
      product_lossless_sources_excluded: true
    },
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
    target_feature_profile_refs: {
      feature_inventory: featureRefs(profile),
      stage5_product_observed_data_provenance: provenanceRefs(profile),
      regulated_surface_refs: asArray(profile.regulated_surface_map)
    },
    stage6a_legal_cartography_refs: legalCartographyRefs(input),
    legal_governance_lossless_sources: legalSources,
    source_refs: legalSources,
    deterministic_policy_prefill: prefill,
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
    target_data_provenance_merge_policy: {
      integrated_profile_is_runtime_merged: true,
      model_must_not_emit_integrated_profile: true,
      merge_key_primary: "feature_id + provenance_id",
      merge_key_fallback: "feature_id + normalised data_category + normalised processing_context"
    },
    instructions: {
      classification_only: true,
      no_final_schema_wrapper: true,
      no_new_data_flow_rows: true,
      no_ref_mutation: true,
      no_quotes_or_prose: true,
      use_canonical_vocabulary_only: true,
      unknown_is_exception_not_norm: true
    }
  };
}

export const stage6bSemanticPacketBuilderInternals = {
  legalGovernanceLosslessSources,
  sourceRecordPacket,
  legalCartographyRefs
};
