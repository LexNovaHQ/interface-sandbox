/* LexNova Runtime — Stage 5E Final Profile Validator. */

import { asArray } from '../shared/stage5SharedIndex.js';

const TOP_KEYS = ['feature_profile_version','target_profile_ref','feature_inventory','product_feature_map','data_provenance_map','regulated_surface_map','architecture_hints','classification_quality','unresolved_feature_candidates','commercial_scan','vault_feature_candidates','evidence','limitations'];
const REQUIRED_TOP = ['feature_profile_version','target_profile_ref','feature_inventory','product_feature_map','data_provenance_map','regulated_surface_map','architecture_hints','commercial_scan','vault_feature_candidates','evidence','limitations'];
const FEATURE_KEYS = ['feature_id','feature_name','feature_role','commercial_function','business_label_or_product_area','feature_description','actor_or_user','input_data','system_action','output_or_result','autonomy_level','human_review_signal','external_action_signal','delivery_channels','data_provenance','archetype_codes','archetype_labels','archetype_provenance','surface_tokens','surface_provenance','confidence','feature_source_url','evidence_refs','linked_threat_ids'];
const FEATURE_REQUIRED = FEATURE_KEYS;
const CONF = ['high','medium','low','unknown'];
const TRI = ['true','false','unknown'];

function missing(obj, fields) { return fields.filter((field) => !Object.prototype.hasOwnProperty.call(obj || {}, field)); }
function extra(obj, fields) { return Object.keys(obj || {}).filter((field) => !fields.includes(field)); }

export function validateStage5EProfile(profile = {}) {
  const blocking_errors = [];
  const warnings = [];
  for (const field of missing(profile, REQUIRED_TOP)) blocking_errors.push({ code: 'MISSING_TOP_FIELD', field });
  for (const field of extra(profile, TOP_KEYS)) blocking_errors.push({ code: 'EXTRA_TOP_FIELD', field });
  if (profile.feature_profile_version !== 'feature_profile_v2') blocking_errors.push({ code: 'BAD_VERSION' });
  if (!Array.isArray(profile.feature_inventory) || !profile.feature_inventory.length) blocking_errors.push({ code: 'EMPTY_FEATURE_INVENTORY' });
  if (Array.isArray(profile.product_feature_map) && profile.product_feature_map.length) blocking_errors.push({ code: 'PRODUCT_FEATURE_MAP_MUST_BE_EMPTY' });

  for (const feature of asArray(profile.feature_inventory)) {
    for (const field of missing(feature, FEATURE_REQUIRED)) blocking_errors.push({ code: 'MISSING_FEATURE_FIELD', feature_id: feature.feature_id || null, field });
    for (const field of extra(feature, FEATURE_KEYS)) blocking_errors.push({ code: 'EXTRA_FEATURE_FIELD', feature_id: feature.feature_id || null, field });
    if (!['CORE','SECONDARY'].includes(feature.feature_role)) blocking_errors.push({ code: 'BAD_FEATURE_ROLE', feature_id: feature.feature_id, value: feature.feature_role });
    if (!['none','draft','recommend','execute','unknown'].includes(feature.autonomy_level)) blocking_errors.push({ code: 'BAD_AUTONOMY', feature_id: feature.feature_id, value: feature.autonomy_level });
    if (!['required','optional','not_visible','unknown'].includes(feature.human_review_signal)) blocking_errors.push({ code: 'BAD_HUMAN_REVIEW', feature_id: feature.feature_id, value: feature.human_review_signal });
    if (!TRI.includes(feature.external_action_signal)) blocking_errors.push({ code: 'BAD_EXTERNAL_ACTION', feature_id: feature.feature_id, value: feature.external_action_signal });
    if (!feature.delivery_channels || !TRI.includes(feature.delivery_channels.app) || !TRI.includes(feature.delivery_channels.api) || !TRI.includes(feature.delivery_channels.web)) blocking_errors.push({ code: 'BAD_DELIVERY_CHANNELS', feature_id: feature.feature_id });
    if (!Array.isArray(feature.data_provenance) || !feature.data_provenance.length) blocking_errors.push({ code: 'MISSING_FEATURE_DATA_PROVENANCE', feature_id: feature.feature_id });
    if (!Array.isArray(feature.evidence_refs) || !feature.evidence_refs.length) blocking_errors.push({ code: 'MISSING_FEATURE_EVIDENCE_REFS', feature_id: feature.feature_id });
    if (!CONF.includes(feature.confidence)) blocking_errors.push({ code: 'BAD_CONFIDENCE', feature_id: feature.feature_id, value: feature.confidence });
  }

  if (!profile.commercial_scan?.distinct_commercial_outcomes_seen || !profile.commercial_scan?.mapped_core_feature_ids || !profile.commercial_scan?.source_coverage) blocking_errors.push({ code: 'BAD_COMMERCIAL_SCAN' });
  if (!profile.vault_feature_candidates?.baseline || !profile.vault_feature_candidates?.archetypes || !profile.vault_feature_candidates?.compliance) blocking_errors.push({ code: 'BAD_VAULT_CANDIDATES' });
  if (!profile.evidence?.field_evidence_refs || !profile.evidence?.unresolved_questions) blocking_errors.push({ code: 'BAD_EVIDENCE_OBJECT' });

  return {
    ok: blocking_errors.length === 0,
    stage: 'stage5',
    phase: 'STAGE5E_TARGET_FEATURE_PROFILE_ASSEMBLY',
    severity: blocking_errors.length ? 'BLOCKING' : warnings.length ? 'WARNING' : 'PASS',
    blocking_errors,
    repairable_errors: [],
    warnings,
    metrics: {
      feature_inventory_count: asArray(profile.feature_inventory).length,
      data_provenance_map_count: asArray(profile.data_provenance_map).length,
      regulated_surface_map_count: asArray(profile.regulated_surface_map).length,
      architecture_hints_count: asArray(profile.architecture_hints).length,
      unresolved_feature_count: asArray(profile.unresolved_feature_candidates).length
    },
    summary: blocking_errors.length ? '5E final profile validation failed.' : '5E final profile validation passed.',
    next_action: blocking_errors.length ? 'repair_stage5e_profile' : 'handoff_unchanged'
  };
}
