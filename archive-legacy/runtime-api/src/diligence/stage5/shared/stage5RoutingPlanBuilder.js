/* LexNova Runtime — Stage 5 Routing Plan Builder. Batch 1 only. */

import { STAGE5_PHASES, isStage5ModelPhase } from './stage5PhaseRegistry.js';
import { getStage5PhaseTokenBudget } from './stage5TokenBudgetPolicy.js';

export const STAGE5_DEFAULT_FALLBACK_POLICY = Object.freeze({
  legacy_stage5_fallback_allowed: false,
  fallback_may_overwrite_substage_artifacts: false,
  fallback_may_write_canonical_output: false
});

export const STAGE5_DEFAULT_RETRY_POLICY = Object.freeze({
  phase_local_retry_only: true,
  whole_stage_retry_allowed: false,
  max_model_attempts: 1
});

export const STAGE5_DEFAULT_FAILURE_POLICY = Object.freeze({
  block_on_missing_target_profile: true,
  block_on_empty_source_manifest: true,
  block_on_controlled_value_violation: true,
  block_on_feature_preservation_failure: true,
  block_on_final_schema_failure: true
});

const INPUTS = Object.freeze({
  STAGE5_INPUT_MANIFEST: ['target_profile', 'stage5_source_package'],
  STAGE5_SOURCE_CANDIDATE_MANIFEST: ['stage5_input_manifest'],
  STAGE5_MASTER_INSTRUCTION_PLAN: ['stage5_source_candidate_manifest', 'registry_taxonomy_availability'],
  STAGE5A_PRODUCT_FUNCTION_EXTRACTION: ['stage5_source_candidate_manifest', 'stage5_master_instruction_plan'],
  STAGE5A_VALIDATION: ['stage5a_product_function_extraction'],
  STAGE5B_ARCHETYPE_SURFACE_TAGGING: ['stage5a_product_function_extraction', 'registry_taxonomy_slice'],
  STAGE5B_VALIDATION: ['stage5b_archetype_surface_tagging'],
  STAGE5C_FEATURE_INVENTORY_BUILD: ['stage5a_product_function_extraction', 'stage5b_archetype_surface_tagging'],
  STAGE5C_VALIDATION: ['stage5c_feature_inventory'],
  STAGE5D_FEATURE_DATA_TOUCHPOINT_EXTRACTION: ['stage5c_feature_inventory', 'stage5_source_candidate_manifest'],
  STAGE5D_VALIDATION: ['stage5d_feature_data_touchpoints'],
  STAGE5E_TARGET_FEATURE_PROFILE_ASSEMBLY: ['stage5a', 'stage5b', 'stage5c', 'stage5d'],
  STAGE5_FINAL_VALIDATION: ['target_feature_profile'],
  STAGE5_HANDOFF_INTEGRITY: ['target_feature_profile', 'stage5_final_validation']
});

export function buildStage5RoutingPlan(context = {}) {
  const phase_plan = STAGE5_PHASES.map((phase) => ({
    phase_id: phase.id,
    phase_name: phase.name,
    phase_kind: phase.kind,
    status: 'PLANNED',
    required_inputs: INPUTS[phase.id] || [],
    expected_outputs: [phase.id.toLowerCase()],
    blocking: Boolean(phase.blocking),
    retry_allowed: Boolean(phase.retry_allowed),
    max_attempts: phase.max_attempts || 0,
    model_budget_ref: isStage5ModelPhase(phase.id) ? phase.id : 'DETERMINISTIC_PHASE',
    token_budget: getStage5PhaseTokenBudget(phase.id),
    forensic_artifact_name: `${phase.id.toLowerCase().replaceAll('_', '-')}.json`
  }));
  return {
    routing_plan_version: 'stage5_routing_plan_v1',
    target_profile_ref: context.target_profile_ref || context.targetProfileRef || context.target_profile?.target_profile_ref || null,
    run_id: context.run_id || context.runId || null,
    run_mode: context.run_mode || 'LIVE_FULL',
    phase_plan,
    model_phase_plan: phase_plan.filter((phase) => phase.phase_kind === 'MODEL'),
    deterministic_phase_plan: phase_plan.filter((phase) => phase.phase_kind !== 'MODEL'),
    fallback_policy: { ...STAGE5_DEFAULT_FALLBACK_POLICY, ...(context.fallback_policy || {}) },
    retry_policy: { ...STAGE5_DEFAULT_RETRY_POLICY, ...(context.retry_policy || {}) },
    failure_policy: { ...STAGE5_DEFAULT_FAILURE_POLICY, ...(context.failure_policy || {}) },
    artifact_policy: { write_all_completed_artifacts_before_failure: true },
    forensic_policy: { separate_forensics_from_canonical_output: true }
  };
}

export function validateStage5RoutingPlan(plan = {}) {
  const errors = [];
  if (plan.routing_plan_version !== 'stage5_routing_plan_v1') errors.push('invalid routing_plan_version');
  if (!Array.isArray(plan.phase_plan) || plan.phase_plan.length !== STAGE5_PHASES.length) errors.push('phase_plan incomplete');
  if (plan.fallback_policy?.legacy_stage5_fallback_allowed) errors.push('legacy fallback not allowed in Batch 1');
  return { ok: errors.length === 0, errors };
}

export function summarizeStage5RoutingPlan(plan = {}) {
  const phases = Array.isArray(plan.phase_plan) ? plan.phase_plan : [];
  return {
    routing_plan_version: plan.routing_plan_version || null,
    phase_count: phases.length,
    model_phase_count: phases.filter((phase) => phase.phase_kind === 'MODEL').length,
    deterministic_phase_count: phases.filter((phase) => phase.phase_kind !== 'MODEL').length,
    fallback_allowed: Boolean(plan.fallback_policy?.legacy_stage5_fallback_allowed)
  };
}
