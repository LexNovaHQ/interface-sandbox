/* LexNova Runtime — Stage 5A Prompt Builder. Prompt construction only; no model calls. */

import { asArray } from '../shared/stage5SharedIndex.js';

export function buildStage5APrompt({ stage5aInput = {}, losslessSourceIndex = {}, candidatePool = {}, instructionPacket = {} } = {}) {
  const modelInput = buildStage5AModelInput(stage5aInput, losslessSourceIndex, candidatePool, instructionPacket);
  return {
    prompt_version: 'stage5a_product_function_mapping_prompt_v1',
    system: buildSystemPrompt(),
    user: JSON.stringify(modelInput, null, 2),
    expected_json_contract: buildExpectedContract()
  };
}

export function buildStage5AModelInput(stage5aInput = {}, losslessSourceIndex = {}, candidatePool = {}, instructionPacket = {}) {
  return {
    task: 'Stage 5A hybrid product-function mapping',
    target_profile_ref: stage5aInput.target_profile_ref || null,
    target_profile: stage5aInput.target_profile || {},
    instruction_packet: instructionPacket,
    deterministic_candidate_pool: asArray(candidatePool.deterministic_candidate_pool),
    lossless_source_index: asArray(losslessSourceIndex.lossless_source_index),
    source_access_policy: {
      source_package_is_lossless: true,
      candidate_pool_is_not_truth: true,
      decide_product_vs_function_with_reason: true,
      return_lossless_source_index_refs_for_each_function: true
    }
  };
}

function buildSystemPrompt() {
  return [
    'You are Stage 5A of the LexNova runtime.',
    'Your only job is hybrid product-function mapping.',
    'The runtime gives you a high-recall deterministic candidate pool and a lossless source index.',
    'The candidate pool is not truth. You decide which candidates are admitted product functions.',
    'For every admitted product function, map it to a core_product_name and explain why it is a function rather than a product label.',
    'Every admitted function must include source_refs, lossless_source_index_refs, evidence_refs when available, and candidate_ids_used.',
    'Every deterministic candidate must receive a candidate_disposition row.',
    'Do not assign archetypes, surfaces, registry row decisions, legal findings, or final data provenance.',
    'Return strict JSON only.'
  ].join('\n');
}

function buildExpectedContract() {
  return {
    stage5a_version: 'stage5a_product_function_mapping_v1',
    target_profile_ref: null,
    core_products: [],
    product_function_map: [],
    candidate_disposition: [],
    visible_but_unmapped_candidates: [],
    source_function_bindings: [],
    commercial_outcome_candidates: [],
    limitations: [],
    model_metadata: {}
  };
}
