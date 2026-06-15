/* LexNova Runtime — Stage 5B Output Normalizer. No model calls. */

import { asArray, asText, normalizeConfidence, uniqueStrings } from '../shared/stage5SharedIndex.js';

export function normalizeStage5BOutput(raw = {}, { investigationPacket, taxonomySlice } = {}) {
  const featuresById = new Map(asArray(investigationPacket?.feature_investigations).map((feature) => [feature.function_id, feature]));
  const archetypeAllowed = new Set(asArray(taxonomySlice?.archetype_codes));
  const surfaceAllowed = new Set(asArray(taxonomySlice?.surface_tokens));

  return {
    stage5b_version: raw.stage5b_version || 'stage5b_archetype_surface_tagging_v1',
    target_profile_ref: raw.target_profile_ref || investigationPacket?.target_profile_ref || null,
    feature_tags: asArray(raw.feature_tags).map((tag) => normalizeTag(tag, featuresById.get(tag?.function_id), archetypeAllowed, surfaceAllowed, taxonomySlice)),
    tagging_failures: asArray(raw.tagging_failures),
    limitations: asArray(raw.limitations).map(asText).filter(Boolean),
    model_metadata: raw.model_metadata || {}
  };
}

function normalizeTag(tag, feature = {}, archetypeAllowed, surfaceAllowed, taxonomySlice = {}) {
  const rawArchetypes = uniqueStrings([
    tag.primary_archetype_code,
    ...asArray(tag.secondary_archetype_codes),
    ...asArray(tag.archetype_codes)
  ]);
  const controlledArchetypes = rawArchetypes.filter((code) => archetypeAllowed.has(code));
  const uncontrolledArchetypes = rawArchetypes.filter((code) => code && !archetypeAllowed.has(code));

  const rawSurfaces = uniqueStrings(tag.surface_tokens);
  const controlledSurfaces = rawSurfaces.filter((token) => surfaceAllowed.has(token));
  const uncontrolledSurfaces = rawSurfaces.filter((token) => token && !surfaceAllowed.has(token));

  const primary = archetypeAllowed.has(asText(tag.primary_archetype_code)) ? asText(tag.primary_archetype_code) : controlledArchetypes[0] || '';
  const secondary = controlledArchetypes.filter((code) => code !== primary);

  const gaps = uniqueStrings([
    ...asArray(tag.tagging_gaps),
    ...uncontrolledArchetypes.map((code) => `UNCONTROLLED_ARCHETYPE:${code}`),
    ...uncontrolledSurfaces.map((token) => `UNCONTROLLED_SURFACE:${token}`)
  ]);

  return {
    function_id: asText(tag.function_id || feature.function_id),
    core_product_name: asText(tag.core_product_name || feature.core_product_name),
    function_name: asText(tag.function_name || feature.function_name),
    tagging_status: asText(tag.tagging_status || (primary ? 'TAGGED' : 'TAGGING_FAILURE')),
    primary_archetype_code: primary,
    secondary_archetype_codes: secondary,
    archetype_codes: uniqueStrings([primary, ...secondary]),
    archetype_labels: uniqueStrings([primary, ...secondary].map((code) => taxonomySlice?.archetype_labels?.[code] || code)),
    raw_archetype_codes: rawArchetypes,
    uncontrolled_archetype_codes: uncontrolledArchetypes,
    archetype_provenance: asArray(tag.archetype_provenance),
    surface_tokens: controlledSurfaces,
    raw_surface_tokens: rawSurfaces,
    uncontrolled_surface_tokens: uncontrolledSurfaces,
    surface_provenance: asArray(tag.surface_provenance),
    triggering_status: normalizeTriggeringStatus(tag.triggering_status),
    triggering_reason: asText(tag.triggering_reason),
    autonomy_level: normalizeAutonomy(tag.autonomy_level),
    human_review_signal: normalizeKnownSignal(tag.human_review_signal),
    external_action_signal: normalizeKnownSignal(tag.external_action_signal),
    tagging_confidence: normalizeConfidence(tag.tagging_confidence),
    tagging_gaps: gaps,
    evidence_refs: uniqueStrings(tag.evidence_refs || feature.evidence_refs),
    lossless_source_index_refs: uniqueStrings(tag.lossless_source_index_refs || feature.lossless_source_index_refs)
  };
}

function normalizeTriggeringStatus(value) {
  const text = asText(value).toUpperCase();
  return ['TRIGGERED', 'NOT_TRIGGERED', 'UNKNOWN', 'TAGGING_FAILURE'].includes(text) ? text : 'UNKNOWN';
}

function normalizeAutonomy(value) {
  const text = asText(value).toUpperCase();
  return ['AUTONOMOUS', 'SEMI_AUTONOMOUS', 'ASSISTIVE', 'NONE', 'UNKNOWN'].includes(text) ? text : 'UNKNOWN';
}

function normalizeKnownSignal(value) {
  const text = asText(value).toUpperCase();
  return ['TRUE', 'FALSE', 'UNKNOWN', 'UNKNOWN_NOT_EVIDENCED'].includes(text) ? text : 'UNKNOWN_NOT_EVIDENCED';
}
