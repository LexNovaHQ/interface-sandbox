/* LexNova Runtime — Stage 5C Output Merger. */

import { asArray, asText, uniqueStrings } from '../shared/stage5SharedIndex.js';
import { STAGE5C_MODEL_REPAIR_FIELDS, STAGE5C_MODEL_FORBIDDEN_FIELDS } from './stage5cCompletenessAnalyzer.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value || null));
}

function normalizeValue(field, value) {
  if (field === 'input_data' || field === 'delivery_channels') return uniqueStrings(asArray(value).flat().map(asText).filter(Boolean));
  return asText(value) || value;
}

export function mergeStage5CRepairs({ canonicalDraft = {}, repairResult = {} } = {}) {
  const rows = clone(canonicalDraft?.feature_inventory_draft) || [];
  const byId = new Map(rows.map((row) => [row.function_id, row]));
  const repairs = [];
  const rejected_repairs = [];
  for (const repair of asArray(repairResult?.repairs)) {
    const functionId = asText(repair?.function_id);
    const field = asText(repair?.field);
    const row = byId.get(functionId);
    if (!row || !field || !STAGE5C_MODEL_REPAIR_FIELDS.includes(field) || STAGE5C_MODEL_FORBIDDEN_FIELDS.includes(field)) {
      rejected_repairs.push({ ...repair, reason: 'field_or_function_not_allowed_for_5c_repair' });
      continue;
    }
    const before = clone(row[field]);
    const after = normalizeValue(field, repair.after);
    row[field] = after;
    row.row_build_source = '5A_5B_WITH_5C_CANONICALIZATION_REPAIR';
    repairs.push({
      function_id: functionId,
      feature_id: row.feature_id,
      field,
      before,
      after,
      basis: repair.basis || null,
      evidence_refs: asArray(repair.evidence_refs),
      lossless_source_index_refs: asArray(repair.lossless_source_index_refs)
    });
  }
  return {
    stage5c_merged_output_version: 'stage5c_merged_output_v1',
    feature_inventory: rows,
    canonicalization_repairs: repairs,
    rejected_repairs,
    true_unknowns: asArray(repairResult?.true_unknowns),
    limitations: asArray(repairResult?.limitations),
    metrics: {
      row_count: rows.length,
      repair_count: repairs.length,
      rejected_repair_count: rejected_repairs.length,
      true_unknown_count: asArray(repairResult?.true_unknowns).length
    }
  };
}
