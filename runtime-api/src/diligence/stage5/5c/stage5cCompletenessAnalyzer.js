/* LexNova Runtime — Stage 5C Completeness Analyzer. */

import { asArray, asText } from '../shared/stage5SharedIndex.js';

export const STAGE5C_MODEL_REPAIR_FIELDS = Object.freeze([
  'feature_name',
  'feature_role',
  'commercial_function',
  'business_label_or_product_area',
  'feature_description',
  'actor_or_user',
  'input_data',
  'system_action',
  'output_or_result',
  'delivery_channels',
  'limitations'
]);

export const STAGE5C_MODEL_FORBIDDEN_FIELDS = Object.freeze([
  'feature_id',
  'function_id',
  'autonomy_level',
  'human_review_signal',
  'external_action_signal',
  'archetype_codes',
  'archetype_labels',
  'archetype_provenance',
  'surface_tokens',
  'surface_provenance',
  'data_provenance',
  'feature_source_url',
  'evidence_refs',
  'linked_threat_ids'
]);

const REQUIRED_TEXT_FIELDS = ['feature_name', 'feature_role', 'commercial_function', 'business_label_or_product_area', 'feature_description', 'actor_or_user', 'system_action', 'output_or_result'];
const REQUIRED_ARRAY_FIELDS = ['input_data', 'delivery_channels', 'archetype_codes', 'surface_tokens', 'evidence_refs'];

function missingText(row, field) {
  return !asText(row?.[field]) || asText(row?.[field]) === 'UNKNOWN_NOT_EVIDENCED';
}

function missingArray(row, field) {
  return !asArray(row?.[field]).length;
}

export function analyzeStage5CCompleteness(canonicalDraft = {}) {
  const rows = asArray(canonicalDraft?.feature_inventory_draft);
  const row_analyses = rows.map((row) => {
    const missing_allowed_fields = [];
    const hard_missing_fields = [];
    for (const field of REQUIRED_TEXT_FIELDS) {
      if (missingText(row, field)) {
        if (STAGE5C_MODEL_REPAIR_FIELDS.includes(field)) missing_allowed_fields.push(field);
        else hard_missing_fields.push(field);
      }
    }
    for (const field of REQUIRED_ARRAY_FIELDS) {
      if (missingArray(row, field)) {
        if (STAGE5C_MODEL_REPAIR_FIELDS.includes(field)) missing_allowed_fields.push(field);
        else hard_missing_fields.push(field);
      }
    }
    const repair_needed = missing_allowed_fields.length > 0;
    return {
      feature_id: row.feature_id,
      function_id: row.function_id,
      repair_needed,
      missing_allowed_fields,
      hard_missing_fields,
      status: hard_missing_fields.length ? 'UPSTREAM_BLOCKING_GAP' : repair_needed ? 'NEEDS_CANONICALIZATION_MODEL' : 'RESOLVED_DETERMINISTICALLY'
    };
  });
  return {
    stage5c_completeness_analysis_version: 'stage5c_completeness_analysis_v1',
    row_analyses,
    rows_needing_model: row_analyses.filter((row) => row.repair_needed).map((row) => row.function_id),
    rows_with_blocking_gaps: row_analyses.filter((row) => row.hard_missing_fields.length).map((row) => row.function_id),
    metrics: {
      row_count: rows.length,
      repair_needed_count: row_analyses.filter((row) => row.repair_needed).length,
      blocking_gap_count: row_analyses.filter((row) => row.hard_missing_fields.length).length
    }
  };
}
