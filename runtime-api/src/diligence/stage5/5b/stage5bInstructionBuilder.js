/* LexNova Runtime — Stage 5B Instruction Builder. No model calls. */

import { asArray } from '../shared/stage5SharedIndex.js';

export function buildStage5BInstructionPacket({ taxonomySlice, investigationPacket } = {}) {
  return {
    stage5b_instruction_packet_version: 'stage5b_instruction_packet_v1',
    substage: '5B',
    task: 'controlled_archetype_surface_tagging',
    controlled_archetypes: asArray(taxonomySlice?.archetype_codes),
    controlled_archetype_labels: taxonomySlice?.archetype_labels || {},
    controlled_surfaces: asArray(taxonomySlice?.surface_tokens),
    feature_count: asArray(investigationPacket?.feature_investigations).length,
    required_outputs: [
      'function_id',
      'primary_archetype_code',
      'secondary_archetype_codes',
      'archetype_codes',
      'archetype_provenance',
      'surface_tokens',
      'surface_provenance',
      'triggering_status',
      'triggering_reason',
      'autonomy_level',
      'human_review_signal',
      'external_action_signal',
      'tagging_confidence'
    ],
    forbidden_outputs: [
      'registry_threat_ids',
      'linked_threat_ids',
      'legal_exposure_findings',
      'final_status',
      'feature_deletion'
    ],
    failure_rule: 'If controlled tagging is not supportable, emit TAGGING_FAILURE for that function.',
    deletion_rule: 'Never delete or omit a Stage 5A admitted product function.',
    primary_secondary_rule: 'Each tagged function must have one primary archetype. Secondary archetypes require separate behavior evidence.',
    taxonomy_rule: 'Use only controlled values from this instruction packet.'
  };
}
