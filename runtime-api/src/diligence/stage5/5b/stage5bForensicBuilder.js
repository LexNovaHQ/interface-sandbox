/* LexNova Runtime — Stage 5B Forensic Builder. No model calls. */

import { asArray, createStage5ForensicArtifact } from '../shared/stage5SharedIndex.js';

export function buildStage5BForensicArtifact({
  runId,
  taxonomySlice,
  investigationPacket,
  signalSeed,
  instructionPacket,
  tagging,
  tagPackage,
  validationResult,
  promptPreview
} = {}) {
  const tags = asArray(tagging?.feature_tags);
  return createStage5ForensicArtifact({
    run_id: runId,
    target_profile_ref: tagging?.target_profile_ref || investigationPacket?.target_profile_ref || null,
    phase_id: 'STAGE5B_ARCHETYPE_SURFACE_TAGGING',
    phase_name: '5B Archetype + Surface Tagging',
    input_summary: {
      feature_count_from_5a: asArray(investigationPacket?.feature_investigations).length,
      taxonomy_archetype_count: asArray(taxonomySlice?.archetype_codes).length,
      taxonomy_surface_count: asArray(taxonomySlice?.surface_tokens).length,
      signal_seed_count: asArray(signalSeed?.feature_signal_seeds).length
    },
    output_summary: {
      feature_tag_count: tags.length,
      tagging_failure_count: tags.filter((tag) => tag.tagging_status === 'TAGGING_FAILURE').length,
      low_confidence_count: tags.filter((tag) => tag.tagging_confidence === 'LOW').length,
      tag_package_count: asArray(tagPackage?.feature_tags_for_5c).length
    },
    validation_result: validationResult,
    token_usage: tagging?.model_metadata || null,
    warnings: validationResult?.warnings || [],
    errors: validationResult?.blocking_errors || [],
    handoff_integrity: tagPackage?.handoff_integrity || null,
    artifact_payload: {
      taxonomy_slice: taxonomySlice,
      investigation_packet: investigationPacket,
      deterministic_signal_seed: signalSeed,
      instruction_packet: instructionPacket,
      prompt_preview: promptPreview,
      stage5b_archetype_surface_tagging: tagging,
      stage5b_tag_package: tagPackage
    }
  });
}
