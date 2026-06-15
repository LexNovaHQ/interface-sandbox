/* LexNova Runtime — Stage 5B Tag Package Builder for 5C handoff. No model calls. */

import { asArray, asText, uniqueStrings } from '../shared/stage5SharedIndex.js';

export function buildStage5BTagPackage({ tagging, validationResult } = {}) {
  const tags = asArray(tagging?.feature_tags);
  return {
    stage5b_tag_package_version: 'stage5b_tag_package_v1',
    target_profile_ref: tagging?.target_profile_ref || null,
    feature_tags_for_5c: tags.map((tag) => ({
      function_id: asText(tag.function_id),
      core_product_name: asText(tag.core_product_name),
      function_name: asText(tag.function_name),
      tagging_status: asText(tag.tagging_status),
      primary_archetype_code: asText(tag.primary_archetype_code),
      secondary_archetype_codes: uniqueStrings(tag.secondary_archetype_codes),
      archetype_codes: uniqueStrings(tag.archetype_codes),
      archetype_labels: uniqueStrings(tag.archetype_labels),
      archetype_provenance: asArray(tag.archetype_provenance),
      surface_tokens: uniqueStrings(tag.surface_tokens),
      surface_provenance: asArray(tag.surface_provenance),
      behavior_signals: {
        autonomy_level: asText(tag.autonomy_level),
        human_review_signal: asText(tag.human_review_signal),
        external_action_signal: asText(tag.external_action_signal)
      },
      routing_signals: {
        triggering_status: asText(tag.triggering_status),
        triggering_reason: asText(tag.triggering_reason),
        stage7_archetype_scope_seed: uniqueStrings(tag.archetype_codes),
        stage7_surface_scope_seed: uniqueStrings(tag.surface_tokens)
      },
      evidence_refs: uniqueStrings(tag.evidence_refs),
      lossless_source_index_refs: uniqueStrings(tag.lossless_source_index_refs),
      tagging_confidence: asText(tag.tagging_confidence),
      tagging_gaps: uniqueStrings(tag.tagging_gaps)
    })),
    tagging_failures: tags.filter((tag) => tag.tagging_status === 'TAGGING_FAILURE').map((tag) => ({
      function_id: tag.function_id,
      core_product_name: tag.core_product_name,
      function_name: tag.function_name,
      gaps: tag.tagging_gaps
    })),
    handoff_integrity: {
      downstream_stage: '5C',
      feature_tag_count: tags.length,
      validation_ok: Boolean(validationResult?.ok),
      notes: ['5C consumes feature_tags_for_5c and does deterministic feature inventory assembly.']
    }
  };
}
