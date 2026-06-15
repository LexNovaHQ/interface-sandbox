/*
 * LexNova Runtime — Stage 5 Instruction Plan Builder
 * Instruction seeds only. No prompts. No model calls. No live wiring.
 */

import { summarizeStage5RoutingPlan } from './stage5RoutingPlanBuilder.js';
import { summarizeStage5SourceCandidateManifest } from './stage5SourceManifestBuilder.js';

export const STAGE5_BASELINE_SOURCE_REFS = Object.freeze([
  'docs/contracts/STAGE5_FIELD_DERIVATION_INSTRUCTIONS_v2.md',
  'docs/contracts/01_DILIGENCE_RUNTIME_GPT_v1.md',
  'docs/contracts/PROMPT_ALLOCATION_MATRIX_v1.md',
  'docs/contracts/PROMPT_SOURCE_EXTRACTION_PACKETS_v1.md',
  'REGISTRY_KEY_v3_0.md'
]);

export function buildStage5MasterInstructionPlan(context = {}) {
  const routingPlan = context.routing_plan || {};
  const manifest = context.source_candidate_manifest || {};
  const registryAvailability = context.registry_taxonomy_availability || {};
  return {
    instruction_plan_version: 'stage5_master_instruction_plan_v1',
    target_profile_ref: context.target_profile_ref || context.targetProfileRef || null,
    baseline_sources: [...STAGE5_BASELINE_SOURCE_REFS],
    runtime_mode: context.run_mode || 'LIVE_FULL',
    route_summary: summarizeStage5RoutingPlan(routingPlan),
    source_manifest_summary: summarizeStage5SourceCandidateManifest(manifest),
    registry_taxonomy_availability: registryAvailability,
    phase_instruction_refs: {
      '5A': 'stage5a_instruction_seed',
      '5B': 'stage5b_instruction_seed',
      '5D': 'stage5d_instruction_seed'
    },
    stage5a_instruction_seed: buildStage5AInstructionSeed(context),
    stage5b_instruction_seed: buildStage5BInstructionSeed(context),
    stage5d_instruction_seed: buildStage5DInstructionSeed(context),
    deterministic_phase_rules: {
      '5C': 'Build canonical feature_inventory deterministically from 5A + 5B.',
      '5E': 'Assemble final target_feature_profile deterministically from 5A + 5B + 5C + 5D.'
    },
    negative_controls: [
      'Do not assign registry threat IDs in Stage 5.',
      'Do not make Stage 7 exposure findings in Stage 5.',
      'Do not delete a 5A product function inside 5B.',
      'Do not use legacy Stage 5 fallback by default.',
      'Do not use uncontrolled archetype or surface values.'
    ],
    token_budget_policy_ref: 'stage5TokenBudgetPolicy.js',
    limitations: []
  };
}

export function buildStage5AInstructionSeed(context = {}) {
  return {
    substage: '5A',
    mode: 'product_function_extraction',
    model_allowed: true,
    source_priority: ['product', 'docs_developer', 'commercial', 'legal_governance'],
    extract: ['product_functions', 'primary_or_secondary', 'commercial_function', 'business_label_or_product_area', 'input_signal', 'system_action', 'output_or_result', 'actor_or_user', 'evidence_refs'],
    do_not_extract: ['archetype_codes', 'surface_tokens', 'registry_threat_ids', 'legal_exposure_findings', 'full_data_provenance'],
    promotion_rule: 'Promote only identifiable product functions with evidence-backed input/action/output. Product areas require decomposition before promotion.',
    candidate_manifest_ref: context.source_candidate_manifest?.manifest_version || null
  };
}

export function buildStage5BInstructionSeed(context = {}) {
  return {
    substage: '5B',
    mode: 'controlled_archetype_surface_tagging',
    model_allowed: true,
    controlled_values_required: true,
    taxonomy_source: 'registry_key_runtime_vocabulary',
    tag_every_5a_function: true,
    deletion_rule: 'Never delete a 5A product function.',
    failure_rule: 'If tagging cannot be completed, emit TAGGING_FAILURE with reason and candidate possibilities.',
    output_required_for_each_function: ['function_id', 'archetype_codes', 'surface_tokens', 'triggering_status', 'triggering_reason', 'autonomy_level', 'human_review_signal', 'external_action_signal', 'tagging_confidence', 'tagging_gaps']
  };
}

export function buildStage5DInstructionSeed(context = {}) {
  return {
    substage: '5D',
    mode: 'feature_data_touchpoint_extraction',
    model_allowed: true,
    boundary_rule: 'Extract functional feature-level data touchpoints only. Stage 6B owns legal/governance data provenance.',
    extract_only_evidenced: ['input_data', 'output_data', 'processing_action', 'data_origin', 'data_subject', 'data_category', 'processing_context', 'retention_signal', 'training_or_finetuning_signal', 'sharing_or_subprocessor_signal'],
    unknown_rule: 'If retention/training/sharing is not visible in admitted evidence, mark UNKNOWN_NOT_EVIDENCED. Do not infer.',
    output_required_for_each_feature: ['feature_id', 'input_data', 'output_data', 'processing_action', 'data_category', 'evidence_refs', 'confidence', 'gaps']
  };
}

export function validateStage5InstructionPlan(plan = {}) {
  const errors = [];
  if (plan.instruction_plan_version !== 'stage5_master_instruction_plan_v1') errors.push('invalid instruction_plan_version');
  if (!plan.stage5a_instruction_seed) errors.push('missing 5A instruction seed');
  if (!plan.stage5b_instruction_seed) errors.push('missing 5B instruction seed');
  if (!plan.stage5d_instruction_seed) errors.push('missing 5D instruction seed');
  if (plan.stage5b_instruction_seed && plan.stage5b_instruction_seed.deletion_rule !== 'Never delete a 5A product function.') errors.push('5B deletion rule was altered');
  return { ok: errors.length === 0, errors };
}
