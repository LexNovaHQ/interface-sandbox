import {
  buildStage6BDataProvenanceSkeleton,
  buildStage6BDataSignalIndex,
  buildStage6BFeatureToDataFlowIndex,
  buildStage6BDataProfileLimitations,
  deriveStage6BDataProfileSummarySignals,
  normalizeStage5FeatureProfile
} from "./stage6bDataProvenanceBuilder.js";
import { normalizeStage6BasisCodes } from "./stage6CanonicalVocabulary.js";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function mergeSignalBlock(seed = {}, overlay = {}, refKeys = []) {
  const output = { ...seed, ...overlay };
  for (const key of refKeys) output[key] = seed[key] || [];
  return output;
}

function applyClassification(seedRow = {}, classification = null) {
  if (!classification) return seedRow;
  return {
    ...seedRow,
    data_subject: mergeSignalBlock(seedRow.data_subject, classification.data_subject),
    data_category: mergeSignalBlock(seedRow.data_category, classification.data_category),
    processing: mergeSignalBlock(seedRow.processing, classification.processing),
    role_allocation: mergeSignalBlock(seedRow.role_allocation, classification.role_allocation),
    regime_relevance: mergeSignalBlock(seedRow.regime_relevance, classification.regime_relevance),
    notice: mergeSignalBlock(seedRow.notice, classification.notice, ["notice_legal_unit_refs"]),
    consent_basis: mergeSignalBlock(seedRow.consent_basis, classification.consent_basis, ["basis_legal_unit_refs"]),
    rights: mergeSignalBlock(seedRow.rights, classification.rights, ["rights_legal_unit_refs"]),
    processor_chain: mergeSignalBlock(seedRow.processor_chain, classification.processor_chain, ["processor_legal_unit_refs"]),
    transfer_location: mergeSignalBlock(seedRow.transfer_location, classification.transfer_location, ["location_legal_unit_refs"]),
    retention_deletion_ai: mergeSignalBlock(seedRow.retention_deletion_ai, classification.retention_deletion_ai, ["ai_architecture_legal_unit_refs"]),
    security_accountability: mergeSignalBlock(seedRow.security_accountability, classification.security_accountability, ["security_legal_unit_refs"]),
    source_trace: {
      ...seedRow.source_trace,
      basis_codes: normalizeStage6BasisCodes([...(seedRow.source_trace?.basis_codes || []), "model_semantic_classification"]),
      evidence_strength: classification ? "model_classified" : seedRow.source_trace?.evidence_strength || "unknown"
    },
    basis_codes: normalizeStage6BasisCodes([...(seedRow.basis_codes || []), "model_semantic_classification"]),
    source_refs: seedRow.source_refs || [],
    confidence: classification.confidence || seedRow.confidence || "unknown"
  };
}

function modelLimitations(normalizedClassification = {}) {
  return asArray(normalizedClassification.classification_limitations).map((item, index) => ({
    limitation_id: item.limitation_id || `S6B_MODEL_LIM_${String(index + 1).padStart(3, "0")}`,
    scope: item.scope || "semantic_classification",
    reason_code: item.reason_code || "unknown",
    impact_code: item.impact_code || "unknown",
    confidence: item.confidence || "unknown"
  }));
}

export function mergeStage6BDataProvenance(canonical = {}, normalizedClassification = {}, input = {}) {
  const output = structuredClone(canonical);
  const currentRows = output.data_provenance_profile?.data_flow_profile || [];
  const classificationByFlow = new Map(asArray(normalizedClassification.data_flow_classification).map((row) => [row.data_flow_id, row]));
  const finalRows = currentRows.map((row) => applyClassification(row, classificationByFlow.get(row.data_flow_id)));
  const profile = normalizeStage5FeatureProfile(input);

  output.data_provenance_profile.data_flow_profile = finalRows;
  output.data_provenance_profile.data_profile_summary_signals = deriveStage6BDataProfileSummarySignals(finalRows);
  output.data_provenance_profile.data_profile_limitations = [
    ...buildStage6BDataProfileLimitations(input, finalRows),
    ...modelLimitations(normalizedClassification)
  ];
  output.stage7_navigation_index.feature_to_data_flow_index = buildStage6BFeatureToDataFlowIndex(finalRows, profile);
  output.stage7_navigation_index.data_signal_index = buildStage6BDataSignalIndex(finalRows);
  return output;
}

export function buildStage6BDataProvenance(input = {}, options = {}) {
  const output = buildStage6BDataProvenanceSkeleton(input);
  if (options.normalized_semantic_classification) return mergeStage6BDataProvenance(output, options.normalized_semantic_classification, input);
  return output;
}
