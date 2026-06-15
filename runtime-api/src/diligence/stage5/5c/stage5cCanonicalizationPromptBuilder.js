/* LexNova Runtime — Stage 5C Canonicalization Prompt Builder. */

import { asArray } from '../shared/stage5SharedIndex.js';

export function buildStage5CCanonicalizationModelInput({ canonicalDraft = {}, completenessAnalysis = {}, instructionPacket = {} } = {}) {
  const needed = new Set(asArray(completenessAnalysis?.rows_needing_model));
  return {
    instruction_packet: instructionPacket,
    rows_for_repair: asArray(canonicalDraft?.feature_inventory_draft).filter((row) => needed.has(row.function_id)),
    row_analyses: asArray(completenessAnalysis?.row_analyses).filter((row) => needed.has(row.function_id))
  };
}

export function buildStage5CCanonicalizationPrompt(input = {}) {
  return {
    system: [
      'You are Stage 5C canonical row repair.',
      'You repair only allowed row-level fields for already admitted product functions.',
      'You must not create, delete, reclassify, assign threat IDs, or make legal findings.',
      'Use only supplied evidence refs and lossless source index refs.',
      'Return strict JSON only.'
    ].join('\n'),
    expected_json_contract: {
      stage5c_canonicalization_repair: {
        stage5c_repair_version: 'stage5c_canonicalization_repair_v1',
        repairs: [
          {
            function_id: 'PF001',
            field: 'actor_or_user',
            before: 'UNKNOWN_NOT_EVIDENCED',
            after: 'developer or customer application',
            basis: 'Resolved from existing 5A mechanics/source refs.',
            evidence_refs: [],
            lossless_source_index_refs: []
          }
        ],
        true_unknowns: [
          {
            function_id: 'PF001',
            field: 'actor_or_user',
            reason: 'Not evidenced in supplied refs.'
          }
        ],
        limitations: []
      }
    },
    user: input
  };
}
