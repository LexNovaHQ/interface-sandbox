/* LexNova Runtime — Stage 5C Canonicalization Instruction Builder. */

import { asArray } from '../shared/stage5SharedIndex.js';
import { STAGE5C_MODEL_REPAIR_FIELDS, STAGE5C_MODEL_FORBIDDEN_FIELDS } from './stage5cCompletenessAnalyzer.js';

export function buildStage5CCanonicalizationInstructionPacket({ canonicalDraft = {}, completenessAnalysis = {} } = {}) {
  return {
    stage5c_instruction_packet_version: 'stage5c_canonicalization_instruction_v1',
    substage: '5C',
    task: 'bounded_feature_row_canonicalization_repair',
    allowed_repair_fields: [...STAGE5C_MODEL_REPAIR_FIELDS],
    forbidden_mutation_fields: [...STAGE5C_MODEL_FORBIDDEN_FIELDS],
    rows_needing_model: asArray(completenessAnalysis?.rows_needing_model),
    rules: [
      'Repair only allowed row-level canonical fields.',
      'Use only 5A admitted function evidence, 5B tag package evidence, and lossless source index refs already present in the input.',
      'Do not create features.',
      'Do not delete features.',
      'Do not change archetype or surface tags.',
      'Do not assign threat IDs or legal findings.',
      'Return true_unknowns where evidence does not support repair.'
    ],
    expected_rows: asArray(canonicalDraft?.feature_inventory_draft).length
  };
}
