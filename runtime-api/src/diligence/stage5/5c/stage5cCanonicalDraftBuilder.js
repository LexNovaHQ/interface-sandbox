/* LexNova Runtime — Stage 5C Canonical Draft Builder. */

import { asArray, asText, uniqueStrings, normalizeConfidence } from '../shared/stage5SharedIndex.js';

function firstText(...values) {
  for (const value of values) {
    const text = asText(value);
    if (text) return text;
  }
  return '';
}

function primaryUrl(feature = {}, mapping = {}) {
  const refs = asArray(feature?.investigation_package?.source_refs || mapping?.source_refs);
  const first = refs[0];
  if (typeof first === 'string') return first;
  return first?.url || first?.source_url || first?.final_url || null;
}

function deriveDeliveryChannels(feature = {}, mapping = {}) {
  const raw = [feature?.function_type, feature?.product_family_label, mapping?.function_type, mapping?.product_family_label, ...(asArray(feature?.investigation_package?.source_refs).map((x) => typeof x === 'string' ? x : x?.url || x?.source_url))].join(' ').toLowerCase();
  const out = [];
  if (/api|endpoint|developer|sdk|docs/.test(raw)) out.push('API_OR_DEVELOPER_INTERFACE');
  if (/studio|dashboard|console|portal|web/.test(raw)) out.push('WEB_OR_DASHBOARD');
  if (/model|inference/.test(raw)) out.push('MODEL_OR_INFERENCE_ENDPOINT');
  if (/agent|workflow|automation/.test(raw)) out.push('AGENT_OR_WORKFLOW_INTERFACE');
  return uniqueStrings(out);
}

function confidence(feature = {}, tag = {}) {
  const values = [feature?.model_admission_notes?.admission_confidence, feature?.admission_confidence, tag?.tagging_confidence].map(normalizeConfidence);
  if (values.includes('LOW')) return 'LOW';
  if (values.includes('MEDIUM')) return 'MEDIUM';
  if (values.includes('HIGH')) return 'HIGH';
  return 'LOW';
}

export function buildStage5CCanonicalDraft(joinedInput = {}) {
  const feature_inventory_draft = asArray(joinedInput?.joined_features).map((joined, index) => {
    const feature = joined.feature_5a || {};
    const mapping = joined.mapping_5a || {};
    const tag = joined.tag_5b || {};
    const mechanics = feature.mechanics || {};
    const evidence_refs = uniqueStrings([
      ...asArray(feature?.investigation_package?.evidence_refs),
      ...asArray(mapping?.evidence_refs),
      ...asArray(tag?.evidence_refs)
    ]);
    const lossless_refs = uniqueStrings([
      ...asArray(feature?.investigation_package?.lossless_source_index_refs),
      ...asArray(feature?.investigation_package?.nearby_source_context_refs),
      ...asArray(tag?.lossless_source_index_refs)
    ]);
    return {
      feature_id: `F${String(index + 1).padStart(3, '0')}`,
      function_id: joined.function_id,
      feature_name: firstText(feature.function_name, mapping.function_name),
      core_product_id: firstText(feature.core_product_id, mapping.core_product_id),
      core_product_name: firstText(feature.core_product_name, mapping.core_product_name),
      feature_role: firstText(feature.primary_or_secondary, mapping.primary_or_secondary, 'SECONDARY'),
      commercial_function: firstText(feature.commercial_function, mapping.commercial_function),
      business_label_or_product_area: firstText(feature.core_product_name, mapping.core_product_name, feature.product_family_label, mapping.product_family_label),
      feature_description: firstText(mapping.feature_description, `${firstText(feature.function_name, mapping.function_name)}: ${firstText(mechanics.input_signal, mapping.input_signal)} -> ${firstText(mechanics.system_action, mapping.system_action)} -> ${firstText(mechanics.output_or_result, mapping.output_or_result)}`),
      actor_or_user: firstText(mechanics.actor_or_user, mapping.actor_or_user),
      input_data: uniqueStrings(asArray(mechanics.input_signal || mapping.input_signal || mapping.input_data).flat()),
      system_action: firstText(mechanics.system_action, mapping.system_action),
      output_or_result: firstText(mechanics.output_or_result, mapping.output_or_result),
      autonomy_level: tag?.behavior_signals?.autonomy_level || tag?.autonomy_level || 'UNKNOWN_NOT_EVIDENCED',
      human_review_signal: tag?.behavior_signals?.human_review_signal || tag?.human_review_signal || 'UNKNOWN_NOT_EVIDENCED',
      external_action_signal: tag?.behavior_signals?.external_action_signal || tag?.external_action_signal || 'UNKNOWN_NOT_EVIDENCED',
      delivery_channels: deriveDeliveryChannels(feature, mapping),
      data_provenance: [],
      primary_archetype_code: tag.primary_archetype_code || asArray(tag.archetype_codes)[0] || null,
      secondary_archetype_codes: asArray(tag.secondary_archetype_codes),
      archetype_codes: uniqueStrings([...(tag.primary_archetype_code ? [tag.primary_archetype_code] : []), ...asArray(tag.archetype_codes), ...asArray(tag.secondary_archetype_codes)]),
      archetype_labels: uniqueStrings(asArray(tag.archetype_labels)),
      archetype_provenance: asArray(tag.archetype_provenance),
      surface_tokens: uniqueStrings(asArray(tag.surface_tokens)),
      surface_provenance: asArray(tag.surface_provenance),
      confidence: confidence(feature, tag),
      feature_source_url: primaryUrl(feature, mapping),
      evidence_refs,
      lossless_source_index_refs: lossless_refs,
      linked_threat_ids: [],
      row_build_source: '5A_5B_DETERMINISTIC_DRAFT'
    };
  });
  return {
    stage5c_canonical_draft_version: 'stage5c_canonical_draft_v1',
    target_profile_ref: joinedInput?.target_profile_ref || null,
    feature_inventory_draft,
    feature_id_map: feature_inventory_draft.map((row) => ({ function_id: row.function_id, feature_id: row.feature_id, core_product_name: row.core_product_name })),
    metrics: { draft_count: feature_inventory_draft.length }
  };
}
