/* LexNova Runtime — Stage 5B Validator. No model calls. */

import { asArray, asText, uniqueStrings, createValidationFailure, createValidationPass, createValidationWarning } from '../shared/stage5SharedIndex.js';

export function validateStage5B(tagging = {}, { stage5aFeaturePackage, taxonomySlice } = {}) {
  const features = asArray(stage5aFeaturePackage?.features_for_5b);
  const tags = asArray(tagging.feature_tags);
  const featureIds = new Set(features.map((feature) => asText(feature.function_id)).filter(Boolean));
  const tagIds = tags.map((tag) => asText(tag.function_id)).filter(Boolean);
  const tagIdSet = new Set(tagIds);
  const allowedArchetypes = new Set(asArray(taxonomySlice?.archetype_codes));
  const allowedSurfaces = new Set(asArray(taxonomySlice?.surface_tokens));

  const blocking = [];
  const warnings = [];

  if (!features.length) blocking.push('Stage 5B received no Stage 5A features.');
  if (!allowedArchetypes.size) blocking.push('Stage 5B taxonomy has no controlled archetype codes.');
  if (!allowedSurfaces.size) blocking.push('Stage 5B taxonomy has no controlled surface tokens.');

  for (const featureId of featureIds) {
    if (!tagIdSet.has(featureId)) blocking.push(`Missing Stage 5B row for Stage 5A function ${featureId}.`);
  }

  for (const tag of tags) {
    const id = asText(tag.function_id);
    if (!featureIds.has(id)) blocking.push(`Stage 5B row references unknown function ${id || '[empty]'}.`);
    if (asArray(tag.uncontrolled_archetype_codes).length) blocking.push(`Uncontrolled archetype values for ${id}: ${tag.uncontrolled_archetype_codes.join(', ')}`);
    if (asArray(tag.uncontrolled_surface_tokens).length) blocking.push(`Uncontrolled surface values for ${id}: ${tag.uncontrolled_surface_tokens.join(', ')}`);
    if (asArray(tag.registry_threat_ids).length || asArray(tag.linked_threat_ids).length) blocking.push(`Stage 5B must not assign threat IDs for ${id}.`);
    if (tag.legal_exposure_findings) blocking.push(`Stage 5B must not emit legal exposure findings for ${id}.`);

    if (tag.tagging_status === 'TAGGING_FAILURE') warnings.push(`Visible TAGGING_FAILURE for ${id}.`);
    if (tag.tagging_status !== 'TAGGING_FAILURE' && !asText(tag.primary_archetype_code)) blocking.push(`Missing primary_archetype_code for ${id}.`);
    if (tag.tagging_status !== 'TAGGING_FAILURE' && !asArray(tag.surface_tokens).length) warnings.push(`No surface token assigned for ${id}.`);
    if (!asText(tag.triggering_status)) blocking.push(`Missing triggering_status for ${id}.`);
    if (!asText(tag.autonomy_level)) blocking.push(`Missing autonomy_level for ${id}.`);
    if (!asText(tag.human_review_signal)) blocking.push(`Missing human_review_signal for ${id}.`);
    if (!asText(tag.external_action_signal)) blocking.push(`Missing external_action_signal for ${id}.`);
    if (!asArray(tag.evidence_refs).length && !asArray(tag.lossless_source_index_refs).length) warnings.push(`No evidence/index refs on tag row ${id}.`);
  }

  const metrics = {
    feature_count_from_5a: features.length,
    feature_tag_count: tags.length,
    missing_tag_count: [...featureIds].filter((id) => !tagIdSet.has(id)).length,
    tagging_failure_count: tags.filter((tag) => tag.tagging_status === 'TAGGING_FAILURE').length,
    controlled_archetype_count: uniqueStrings(tags.flatMap((tag) => tag.archetype_codes)).length,
    controlled_surface_count: uniqueStrings(tags.flatMap((tag) => tag.surface_tokens)).length,
    uncontrolled_value_count: tags.reduce((sum, tag) => sum + asArray(tag.uncontrolled_archetype_codes).length + asArray(tag.uncontrolled_surface_tokens).length, 0)
  };

  if (blocking.length) {
    return createValidationFailure({
      phase: 'STAGE5B_VALIDATION',
      blocking_errors: blocking,
      warnings,
      metrics,
      summary: 'Stage 5B validation failed.'
    });
  }

  if (warnings.length) {
    return createValidationWarning({
      phase: 'STAGE5B_VALIDATION',
      warnings,
      metrics,
      summary: 'Stage 5B validation passed with warnings.'
    });
  }

  return createValidationPass({
    phase: 'STAGE5B_VALIDATION',
    metrics,
    summary: 'Stage 5B validation passed.'
  });
}
