/* LexNova Runtime — Stage 5D Feature Context Builder. */

import { asArray, asText, uniqueStrings } from '../shared/stage5SharedIndex.js';

function refsFrom(feature5a = {}, feature5c = {}, tag5b = {}) {
  return uniqueStrings([
    ...asArray(feature5c?.lossless_source_index_refs),
    ...asArray(feature5a?.investigation_package?.lossless_source_index_refs),
    ...asArray(feature5a?.investigation_package?.nearby_source_context_refs),
    ...asArray(tag5b?.lossless_source_index_refs)
  ]);
}

export function buildStage5DFeatureContexts(joinedInput = {}) {
  const contexts = asArray(joinedInput?.joined_features).map((joined) => {
    const feature5c = joined.feature_5c || {};
    const feature5a = joined.feature_5a || {};
    const tag5b = joined.tag_5b || {};
    const mechanics = feature5a.mechanics || {};
    return {
      feature_id: joined.feature_id,
      function_id: joined.function_id,
      core_product_name: joined.core_product_name,
      feature_name: joined.feature_name,
      feature_role: feature5c.feature_role || null,
      feature_description: feature5c.feature_description || null,
      mechanics: {
        actor_or_user: asText(feature5c.actor_or_user || mechanics.actor_or_user),
        input_data: asArray(feature5c.input_data || mechanics.input_signal),
        system_action: asText(feature5c.system_action || mechanics.system_action),
        output_or_result: asText(feature5c.output_or_result || mechanics.output_or_result)
      },
      tags: {
        archetype_codes: asArray(feature5c.archetype_codes || tag5b.archetype_codes),
        surface_tokens: asArray(feature5c.surface_tokens || tag5b.surface_tokens),
        autonomy_level: feature5c.autonomy_level || tag5b?.behavior_signals?.autonomy_level || null,
        human_review_signal: feature5c.human_review_signal || tag5b?.behavior_signals?.human_review_signal || null,
        external_action_signal: feature5c.external_action_signal || tag5b?.behavior_signals?.external_action_signal || null
      },
      evidence_refs: uniqueStrings([
        ...asArray(feature5c.evidence_refs),
        ...asArray(feature5a?.investigation_package?.evidence_refs),
        ...asArray(tag5b.evidence_refs)
      ]),
      lossless_source_index_refs: refsFrom(feature5a, feature5c, tag5b),
      source_refs: uniqueStrings([
        ...asArray(feature5a?.investigation_package?.source_refs),
        feature5c.feature_source_url
      ].filter(Boolean))
    };
  });
  return {
    stage5d_feature_context_version: 'stage5d_feature_context_v1',
    target_profile_ref: joinedInput?.target_profile_ref || null,
    feature_contexts: contexts,
    lossless_source_index: asArray(joinedInput?.lossless_source_index),
    metrics: { feature_context_count: contexts.length }
  };
}
