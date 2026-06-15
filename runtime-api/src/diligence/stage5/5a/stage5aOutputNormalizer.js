/* LexNova Runtime — Stage 5A Output Normalizer. No model calls. */

import { asArray, asPlainObject, asText, normalizeConfidence, normalizeEvidenceRefs, normalizeSourceRefs, stableStage5Id, uniqueStrings } from '../shared/stage5SharedIndex.js';

export function normalizeStage5AOutput(mappingResult = {}) {
  const mapping = asPlainObject(mappingResult.stage5a_product_function_mapping || mappingResult);
  const functions = asArray(mapping.product_function_map).map((row, index) => normalizeMappedFunction(row, index));
  const coreProducts = normalizeCoreProducts(mapping.core_products, functions);
  const dispositions = asArray(mapping.candidate_disposition).map((row, index) => normalizeCandidateDisposition(row, index));

  return {
    stage5a_version: 'stage5a_product_function_mapping_v1',
    target_profile_ref: mapping.target_profile_ref || null,
    core_products: coreProducts,
    product_function_map: functions,
    candidate_disposition: dispositions,
    visible_but_unmapped_candidates: asArray(mapping.visible_but_unmapped_candidates),
    source_function_bindings: asArray(mapping.source_function_bindings),
    commercial_outcome_candidates: asArray(mapping.commercial_outcome_candidates),
    limitations: asArray(mapping.limitations).map(asText).filter(Boolean),
    model_metadata: asPlainObject(mapping.model_metadata)
  };
}

export function normalizeMappedFunction(row = {}, index = 0) {
  const obj = asPlainObject(row);
  const functionId = asText(obj.function_id) || stableStage5Id('PF', index + 1);
  const coreProductName = asText(obj.core_product_name || obj.product_name || obj.product_area) || 'UNKNOWN_CORE_PRODUCT';
  const coreProductId = asText(obj.core_product_id) || stableCoreProductId(coreProductName);
  return {
    function_id: functionId,
    core_product_id: coreProductId,
    core_product_name: coreProductName,
    product_family_label: asText(obj.product_family_label || obj.business_label_or_product_area || coreProductName),
    function_name: asText(obj.function_name || obj.feature_name || obj.name),
    function_type: asText(obj.function_type || obj.candidate_kind || 'PRODUCT_FUNCTION'),
    primary_or_secondary: normalizePrimarySecondary(obj.primary_or_secondary || obj.feature_role),
    commercial_function: asText(obj.commercial_function),
    actor_or_user: asText(obj.actor_or_user),
    input_signal: asText(obj.input_signal || obj.input_data),
    system_action: asText(obj.system_action),
    output_or_result: asText(obj.output_or_result),
    why_admitted: asText(obj.why_admitted),
    why_not_product_only: asText(obj.why_not_product_only),
    source_refs: normalizeSourceRefs(obj.source_refs),
    lossless_source_index_refs: uniqueStrings(obj.lossless_source_index_refs || obj.lossless_index_refs),
    evidence_refs: normalizeEvidenceRefs(obj.evidence_refs),
    candidate_ids_used: uniqueStrings(obj.candidate_ids_used || obj.candidate_ids || obj.candidate_refs),
    admission_confidence: normalizeConfidence(obj.admission_confidence || obj.confidence),
    raw: obj
  };
}

export function normalizeCandidateDisposition(row = {}, index = 0) {
  const obj = asPlainObject(row);
  return {
    candidate_id: asText(obj.candidate_id) || stableStage5Id('CAND', index + 1),
    candidate_text: asText(obj.candidate_text || obj.label || obj.name),
    disposition: asText(obj.disposition || obj.candidate_status || 'INSUFFICIENT_FUNCTION_EVIDENCE'),
    reason: asText(obj.reason || obj.rationale),
    mapped_function_ids: uniqueStrings(obj.mapped_function_ids || obj.function_ids || obj.function_id),
    source_refs: normalizeSourceRefs(obj.source_refs),
    evidence_refs: normalizeEvidenceRefs(obj.evidence_refs),
    raw: obj
  };
}

function normalizeCoreProducts(coreProducts = [], functions = []) {
  const byId = new Map();
  for (const row of asArray(coreProducts)) {
    const obj = asPlainObject(row);
    const name = asText(obj.core_product_name || obj.product_name || obj.name);
    const id = asText(obj.core_product_id) || stableCoreProductId(name);
    if (!name) continue;
    byId.set(id, { core_product_id: id, core_product_name: name, source_refs: normalizeSourceRefs(obj.source_refs), function_ids: uniqueStrings(obj.function_ids) });
  }
  for (const fn of functions) {
    const existing = byId.get(fn.core_product_id) || { core_product_id: fn.core_product_id, core_product_name: fn.core_product_name, source_refs: [], function_ids: [] };
    existing.source_refs = uniqueStrings([...existing.source_refs, ...fn.source_refs]);
    existing.function_ids = uniqueStrings([...existing.function_ids, fn.function_id]);
    byId.set(fn.core_product_id, existing);
  }
  return [...byId.values()];
}

function normalizePrimarySecondary(value) {
  const text = asText(value).toUpperCase();
  if (['PRIMARY', 'CORE'].includes(text)) return 'PRIMARY';
  if (['SECONDARY', 'SUPPORTING', 'AUXILIARY'].includes(text)) return 'SECONDARY';
  return 'UNKNOWN';
}

function stableCoreProductId(name) {
  const slug = asText(name).replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').toUpperCase();
  return slug ? `CP_${slug.slice(0, 48)}` : 'CP_UNKNOWN';
}
