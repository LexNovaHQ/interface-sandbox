/* LexNova Runtime — Stage 5C Forensic Builder. */

import { asArray, nowIso } from '../shared/stage5SharedIndex.js';

export function buildStage5CForensicArtifact({ runId = null, joinedInput = {}, canonicalDraft = {}, completenessAnalysis = {}, instructionPacket = {}, repairResult = {}, mergedOutput = {}, validationResult = {}, promptPreview = null } = {}) {
  return {
    artifact_version: 'stage5_5c_forensic_v1',
    run_id: runId,
    target_profile_ref: joinedInput?.target_profile_ref || null,
    phase_id: 'STAGE5C_FEATURE_INVENTORY_BUILD',
    phase_name: '5C Canonical Feature Inventory Build',
    completed_at: nowIso(),
    input_summary: {
      joined_count: joinedInput?.metrics?.joined_count || 0,
      missing_tag_count: joinedInput?.metrics?.missing_tag_count || 0
    },
    output_summary: {
      feature_inventory_count: asArray(mergedOutput?.feature_inventory).length,
      repair_count: asArray(mergedOutput?.canonicalization_repairs).length,
      true_unknown_count: asArray(mergedOutput?.true_unknowns).length
    },
    completeness_summary: completenessAnalysis?.metrics || {},
    validation_result: validationResult,
    token_usage: repairResult?.model_metadata?.usage_metadata || null,
    model_metadata: repairResult?.model_metadata || null,
    prompt_preview: promptPreview,
    artifact_payload: {
      canonical_draft: canonicalDraft,
      instruction_packet: instructionPacket,
      repair_result: repairResult?.stage5c_canonicalization_repair || {},
      merged_output: mergedOutput
    }
  };
}
