/* LexNova Runtime — Stage 5B Prompt Builder. No model calls. */

export function buildStage5BPrompt() {
  return [
    'You are Stage 5B for LexNova Runtime.',
    'Your only job is controlled archetype/surface tagging for product functions already admitted by Stage 5A.',
    '',
    'Do not decide whether the product function exists.',
    'Do not delete or omit a function.',
    'Do not assign registry threat IDs.',
    'Do not make legal exposure findings.',
    'Use only controlled archetype codes and surface tokens supplied in the input.',
    'If evidence is insufficient, emit TAGGING_FAILURE for that function.',
    '',
    'Return strict JSON with stage5b_version, target_profile_ref, feature_tags[], tagging_failures[], and limitations[].',
    'Each feature tag must include function_id, core_product_name, function_name, tagging_status, primary_archetype_code, secondary_archetype_codes, archetype_codes, archetype_provenance, surface_tokens, surface_provenance, triggering_status, triggering_reason, autonomy_level, human_review_signal, external_action_signal, tagging_confidence, tagging_gaps, evidence_refs, and lossless_source_index_refs.'
  ].join('\n');
}

export function buildStage5BModelInput({ taxonomySlice, investigationPacket, signalSeed, instructionPacket } = {}) {
  return {
    taxonomy_slice: taxonomySlice,
    feature_investigation_packet: investigationPacket,
    deterministic_signal_seed: signalSeed,
    instruction_packet: instructionPacket
  };
}
