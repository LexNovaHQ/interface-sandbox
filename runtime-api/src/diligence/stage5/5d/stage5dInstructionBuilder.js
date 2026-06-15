/* LexNova Runtime — Stage 5D Instruction Builder. */

import { STAGE5D_CONTROLLED } from './stage5dDeterministicDataSignalBuilder.js';

export function buildStage5DInstructionPacket({ featureContext = {}, dataSignalSeed = {} } = {}) {
  return {
    stage5d_instruction_packet_version: 'stage5d_instruction_packet_v1',
    substage: '5D',
    task: 'feature_level_data_touchpoint_extraction',
    boundary: {
      owns: ['feature_data_touchpoints', 'feature_data_summary', 'data_signal_ledger', 'feature_level_unknowns', 'seeds_for_5e'],
      forbidden: ['new_features', 'feature_deletion', 'taxonomy_mutation', 'threat_ids', 'legal_conclusions', 'final_profile_maps', 'stage6b_review']
    },
    controlled_values: STAGE5D_CONTROLLED,
    source_rule: 'Use only existing evidence_refs and lossless_source_index_refs from the feature context.',
    lifecycle_rule: 'storage, retention, training, sharing, and logging require explicit source support; otherwise use NOT_EVIDENCED.',
    unknown_rule: 'Use UNKNOWN only when the feature mechanics cannot be resolved after reviewing the supplied context.',
    feature_context_count: featureContext?.feature_contexts?.length || 0,
    data_signal_seed_count: dataSignalSeed?.feature_signal_seeds?.length || 0
  };
}
