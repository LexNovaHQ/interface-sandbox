/* LexNova Runtime — Stage 5B Feature Investigation Packet Builder. No model calls. */

import { asArray, asText, uniqueStrings } from '../shared/stage5SharedIndex.js';

export function buildStage5BFeatureInvestigationPacket({ stage5aFeaturePackage } = {}) {
  const pkg = stage5aFeaturePackage || {};
  const features = asArray(pkg.features_for_5b);
  const candidatePoolRefs = asArray(pkg.candidate_pool_refs);
  return {
    stage5b_investigation_packet_version: 'stage5b_investigation_packet_v1',
    target_profile_ref: pkg.target_profile_ref || null,
    feature_investigations: features.map((feature) => buildFeatureInvestigation(feature, candidatePoolRefs)),
    core_products: asArray(pkg.core_products),
    lossless_source_index: asArray(pkg.lossless_source_index),
    source_coverage: asArray(pkg.source_coverage),
    handoff_integrity: {
      upstream_stage: '5A',
      downstream_stage: '5B',
      received_feature_count: features.length,
      received_source_index_count: asArray(pkg.lossless_source_index).length,
      received_candidate_ref_count: candidatePoolRefs.length
    }
  };
}

function buildFeatureInvestigation(feature, candidatePoolRefs) {
  const investigation = feature.investigation_package || {};
  const candidateIds = uniqueStrings([
    ...asArray(investigation.candidate_ids_used),
    ...asArray(investigation.related_candidate_ids)
  ]);
  return {
    function_id: asText(feature.function_id),
    core_product_id: asText(feature.core_product_id),
    core_product_name: asText(feature.core_product_name),
    function_name: asText(feature.function_name),
    function_type: asText(feature.function_type),
    primary_or_secondary: asText(feature.primary_or_secondary),
    commercial_function: asText(feature.commercial_function),
    mechanics: {
      actor_or_user: asText(feature.mechanics?.actor_or_user),
      input_signal: asText(feature.mechanics?.input_signal),
      system_action: asText(feature.mechanics?.system_action),
      output_or_result: asText(feature.mechanics?.output_or_result)
    },
    evidence_refs: uniqueStrings(investigation.evidence_refs),
    source_refs: uniqueStrings(investigation.source_refs),
    lossless_source_index_refs: uniqueStrings(investigation.lossless_source_index_refs),
    nearby_source_context_refs: uniqueStrings(investigation.nearby_source_context_refs),
    candidate_ids: candidateIds,
    candidate_context: candidatePoolRefs.filter((candidate) => candidateIds.includes(candidate.candidate_id)),
    model_admission_notes: {
      why_admitted: asText(feature.model_admission_notes?.why_admitted),
      why_not_product_only: asText(feature.model_admission_notes?.why_not_product_only),
      admission_confidence: asText(feature.model_admission_notes?.admission_confidence)
    }
  };
}
