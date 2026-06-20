/* LexNova Runtime — Stage 5E Feature Inventory Integrator. */

import { asArray, asText, uniqueStrings } from '../shared/stage5SharedIndex.js';
import { deliveryObject, mapAutonomy, mapDataCategory, mapDataOrigin, mapDataSubject, mapHumanReview, refs, sourceUrl, toConfidence, tri } from './stage5eSchemaMappers.js';

function groupedTouchpoints(stage5d = {}) {
  const map = new Map();
  for (const row of asArray(stage5d?.feature_data_touchpoints)) {
    if (!row.feature_id) continue;
    if (!map.has(row.feature_id)) map.set(row.feature_id, []);
    map.get(row.feature_id).push(row);
  }
  return map;
}

function provenanceFromTouchpoint(row = {}, fallbackFeature = {}) {
  return {
    data_origin: mapDataOrigin(row.data_origin),
    data_subject: mapDataSubject(row.data_subject),
    data_category: mapDataCategory(row.data_category),
    processing_context: asText(row.processing_action || fallbackFeature.system_action || 'Data processed for feature operation.'),
    storage_or_retention_signal: asText(row.storage_signal || row.retention_signal || 'NOT_EVIDENCED'),
    training_or_finetuning_signal: asText(row.training_or_finetuning_signal || 'NOT_EVIDENCED'),
    source_url: sourceUrl(row.source_url, fallbackFeature.feature_source_url),
    evidence_refs: refs(row.evidence_refs, fallbackFeature.evidence_refs),
    confidence: toConfidence(row.confidence || fallbackFeature.confidence)
  };
}

function defaultProvenance(feature = {}) {
  return {
    data_origin: 'unknown',
    data_subject: 'unknown',
    data_category: 'unknown',
    processing_context: asText(feature.system_action || 'Feature data processing not fully evidenced.'),
    storage_or_retention_signal: 'NOT_EVIDENCED',
    training_or_finetuning_signal: 'NOT_EVIDENCED',
    source_url: sourceUrl(feature.feature_source_url),
    evidence_refs: refs(feature.evidence_refs),
    confidence: toConfidence(feature.confidence)
  };
}

function archProv(code, feature) {
  return {
    archetype_code: code,
    registry_key_detection_logic: 'Resolved in Stage 5B controlled archetype tagging.',
    matched_feature_behavior: asText(feature.system_action || feature.feature_description || feature.feature_name),
    source_url: sourceUrl(feature.feature_source_url),
    evidence_refs: refs(feature.evidence_refs),
    confidence: toConfidence(feature.confidence)
  };
}

function surfProv(token, feature) {
  return {
    surface_token: token,
    registry_key_surface_meaning: 'Resolved in Stage 5B controlled surface tagging.',
    matched_data_or_context: asText(feature.input_data?.join(', ') || feature.feature_description || feature.feature_name),
    source_url: sourceUrl(feature.feature_source_url),
    evidence_refs: refs(feature.evidence_refs),
    confidence: toConfidence(feature.confidence)
  };
}

export function buildStage5EFeatureInventory(joined = {}) {
  const stage5c = joined.stage5c_feature_inventory_package || {};
  const stage5d = joined.stage5d_data_touchpoint_package || {};
  const touchpointsByFeature = groupedTouchpoints(stage5d);
  return asArray(stage5c.feature_inventory).map((row) => {
    const touchpoints = touchpointsByFeature.get(row.feature_id) || [];
    const evidenceRefs = refs(row.evidence_refs, touchpoints.flatMap((tp) => tp.evidence_refs));
    const baseFeature = {
      feature_id: asText(row.feature_id),
      feature_name: asText(row.feature_name || row.function_name || 'Unnamed feature'),
      feature_role: /primary|core/i.test(asText(row.feature_role)) ? 'CORE' : 'SECONDARY',
      commercial_function: asText(row.commercial_function || row.feature_description || 'Commercial function not fully evidenced.'),
      business_label_or_product_area: asText(row.business_label_or_product_area || row.core_product_name || 'Product area not fully evidenced'),
      feature_description: asText(row.feature_description || row.system_action || row.feature_name || 'Feature description not fully evidenced.'),
      actor_or_user: asText(row.actor_or_user || 'unknown'),
      input_data: uniqueStrings(asArray(row.input_data)),
      system_action: asText(row.system_action || 'unknown'),
      output_or_result: asText(row.output_or_result || 'unknown'),
      autonomy_level: mapAutonomy(row.autonomy_level),
      human_review_signal: mapHumanReview(row.human_review_signal),
      external_action_signal: tri(row.external_action_signal),
      delivery_channels: deliveryObject(row.delivery_channels),
      data_provenance: [],
      archetype_codes: uniqueStrings(asArray(row.archetype_codes)),
      archetype_labels: uniqueStrings(asArray(row.archetype_labels)),
      archetype_provenance: [],
      surface_tokens: uniqueStrings(asArray(row.surface_tokens)),
      surface_provenance: [],
      confidence: toConfidence(row.confidence),
      feature_source_url: sourceUrl(row.feature_source_url),
      evidence_refs: evidenceRefs,
      linked_threat_ids: []
    };
    baseFeature.data_provenance = touchpoints.length ? touchpoints.map((tp) => provenanceFromTouchpoint(tp, baseFeature)) : [defaultProvenance(baseFeature)];
    baseFeature.archetype_provenance = baseFeature.archetype_codes.map((code) => archProv(code, baseFeature));
    baseFeature.surface_provenance = baseFeature.surface_tokens.map((token) => surfProv(token, baseFeature));
    return baseFeature;
  });
}
