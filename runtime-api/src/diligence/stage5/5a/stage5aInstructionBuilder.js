/* LexNova Runtime — Stage 5A Instruction Builder. Builds packet only; no model calls. */

import { asArray, asText } from '../shared/stage5SharedIndex.js';
import { getStage5AAllowedCandidateDispositions } from './stage5aDeterministicCandidatePoolBuilder.js';

export function buildStage5AInstructionPacket(context = {}) {
  const instructionSeed = context.stage5_master_instruction_plan?.['5a_instruction_seed'] || context.stage5a_instruction_seed || {};
  return {
    stage5a_instruction_packet_version: 'stage5a_instruction_packet_v1',
    substage: '5A',
    task: 'hybrid_product_function_mapping',
    input_rule: 'target_profile_plus_product_family_source_lossless',
    model_role: [
      'adjudicate deterministic candidates',
      'separate core product names from atomic product functions',
      'map each admitted function to a core_product_name',
      'explain admission and rejection',
      'bind functions to source refs, lossless index refs, evidence refs and candidate ids'
    ],
    deterministic_role: [
      'preserve lossless product-family source package',
      'build lossless source index',
      'build high-recall candidate pool',
      'normalize and validate model output',
      'build feature package for 5B'
    ],
    required_function_fields: [
      'function_id',
      'core_product_id',
      'core_product_name',
      'product_family_label',
      'function_name',
      'function_type',
      'primary_or_secondary',
      'commercial_function',
      'actor_or_user',
      'input_signal',
      'system_action',
      'output_or_result',
      'why_admitted',
      'why_not_product_only',
      'source_refs',
      'lossless_source_index_refs',
      'evidence_refs',
      'candidate_ids_used',
      'admission_confidence'
    ],
    candidate_disposition_values: getStage5AAllowedCandidateDispositions(),
    forbidden_outputs: [
      'archetype_codes',
      'surface_tokens',
      'registry_row_decisions',
      'final_exposure_findings',
      'final_data_provenance_map',
      'legal_governance_conclusions'
    ],
    positive_controls: asArray(instructionSeed.positive_controls),
    negative_controls: buildNegativeControls(instructionSeed),
    promotion_rule: asText(instructionSeed.promotion_rule) || 'Admit only candidates that are usable product functions or capabilities visible in source evidence. Product labels alone are not product functions.',
    product_mapping_rule: 'Every admitted product function must identify the core product name it belongs to. Many functions may share the same core product name.',
    source_index_rule: 'Use lossless_source_index_refs so 5B can inspect the exact source region later.',
    evidence_rule: 'Use provided source_refs, lossless_source_index_refs, evidence_refs and candidate_ids_used. Do not invent refs.',
    output_contract: 'stage5a_product_function_mapping_v1'
  };
}

function buildNegativeControls(seed = {}) {
  return [
    ...asArray(seed.negative_controls),
    'Do not treat a product page title as an admitted function without a discrete input-action-output operation.',
    'Do not treat an API surface as one function when the source presents multiple discrete capabilities.',
    'Do not create archetype or surface classifications in 5A.',
    'Do not make downstream legal or registry findings in 5A.',
    'Do not discard deterministic candidates without a candidate_disposition row.'
  ];
}
