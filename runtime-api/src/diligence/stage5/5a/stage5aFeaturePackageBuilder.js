/* LexNova Runtime — Stage 5A Feature Package Builder for 5B handoff. No model calls. */

import { asArray, asText, uniqueStrings } from '../shared/stage5SharedIndex.js';

export function buildStage5AFeaturePackage({ mapping, candidatePool, losslessSourceIndex, validationResult } = {}) {
  const functions = asArray(mapping?.product_function_map);
  const coreProducts = asArray(mapping?.core_products);
  const candidates = asArray(candidatePool?.deterministic_candidate_pool);
  const sourceIndex = asArray(losslessSourceIndex?.lossless_source_index);

  return {
    stage5a_feature_package_version: 'stage5a_feature_package_v1',
    target_profile_ref: mapping?.target_profile_ref || losslessSourceIndex?.target_profile_ref || null,
    features_for_5b: functions.map((fn) => buildFeatureFor5B(fn, candidates, sourceIndex)),
    core_products: coreProducts.length ? coreProducts : buildCoreProductsFromFunctions(functions),
    lossless_source_index: sourceIndex,
    candidate_pool_refs: candidates.map((candidate) => ({
      candidate_id: candidate.candidate_id,
      candidate_text: candidate.candidate_text,
      candidate_kind: candidate.candidate_kind,
      source_refs: candidate.source_refs,
      lossless_index_refs: candidate.lossless_index_refs
    })),
    source_coverage: buildSourceCoverage(sourceIndex, functions),
    candidate_disposition: asArray(mapping?.candidate_disposition),
    handoff_integrity: {
      downstream_stage: '5B',
      feature_count: functions.length,
      core_product_count: coreProducts.length || buildCoreProductsFromFunctions(functions).length,
      source_index_count: sourceIndex.length,
      validation_ok: Boolean(validationResult?.ok),
      notes: ['5B consumes features_for_5b and lossless_source_index. 5B does not redo 5A product-function admission.']
    }
  };
}

function buildFeatureFor5B(fn, candidates, sourceIndex) {
  const relatedCandidateIds = uniqueStrings([
    ...asArray(fn.candidate_ids_used),
    ...candidates.filter((candidate) => sharesSource(candidate, fn)).map((candidate) => candidate.candidate_id)
  ]);
  return {
    function_id: fn.function_id,
    core_product_id: fn.core_product_id,
    core_product_name: fn.core_product_name,
    function_name: fn.function_name,
    function_type: fn.function_type,
    primary_or_secondary: fn.primary_or_secondary,
    commercial_function: fn.commercial_function,
    mechanics: {
      actor_or_user: fn.actor_or_user,
      input_signal: fn.input_signal,
      system_action: fn.system_action,
      output_or_result: fn.output_or_result
    },
    investigation_package: {
      source_refs: fn.source_refs,
      lossless_source_index_refs: fn.lossless_source_index_refs,
      evidence_refs: fn.evidence_refs,
      candidate_ids_used: fn.candidate_ids_used,
      related_candidate_ids: relatedCandidateIds,
      nearby_source_context_refs: buildNearbySourceContextRefs(fn, sourceIndex)
    },
    model_admission_notes: {
      why_admitted: fn.why_admitted,
      why_not_product_only: fn.why_not_product_only,
      admission_confidence: fn.admission_confidence
    }
  };
}

function sharesSource(candidate, fn) {
  const sourceSet = new Set(asArray(fn.source_refs));
  return asArray(candidate.source_refs).some((ref) => sourceSet.has(ref));
}

function buildNearbySourceContextRefs(fn, sourceIndex) {
  const refs = [];
  const sourceSet = new Set(asArray(fn.source_refs));
  for (const source of sourceIndex) {
    if (!sourceSet.has(source.source_id)) continue;
    refs.push(...asArray(source.section_markers).slice(0, 3).map((marker) => marker.marker_id || marker));
    refs.push(...asArray(source.chunk_refs).slice(0, 3).map((chunk) => typeof chunk === 'string' ? chunk : chunk?.chunk_id));
  }
  return uniqueStrings(refs);
}

function buildCoreProductsFromFunctions(functions) {
  const byId = new Map();
  for (const fn of functions) {
    const existing = byId.get(fn.core_product_id) || { core_product_id: fn.core_product_id, core_product_name: fn.core_product_name, source_refs: [], function_ids: [] };
    existing.source_refs = uniqueStrings([...existing.source_refs, ...asArray(fn.source_refs)]);
    existing.function_ids = uniqueStrings([...existing.function_ids, fn.function_id]);
    byId.set(fn.core_product_id, existing);
  }
  return [...byId.values()].filter((row) => asText(row.core_product_id));
}

function buildSourceCoverage(sourceIndex, functions) {
  return sourceIndex.map((source) => {
    const mapped = functions.filter((fn) => asArray(fn.source_refs).includes(source.source_id)).map((fn) => fn.function_id);
    return {
      source_id: source.source_id,
      source_url: source.source_url,
      family: source.source_family,
      mapped_function_ids: uniqueStrings(mapped),
      coverage_status: mapped.length ? 'MAPPED_TO_5A_FUNCTION' : 'NO_ADMITTED_FUNCTION_FROM_SOURCE'
    };
  });
}
