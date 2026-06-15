/* LexNova Runtime — Stage 5D Prompt Builder. */

export function buildStage5DModelInput({ featureContext = {}, dataSignalSeed = {}, instructionPacket = {} } = {}) {
  return {
    target_profile_ref: featureContext.target_profile_ref || null,
    instruction_packet: instructionPacket,
    feature_contexts: featureContext.feature_contexts || [],
    deterministic_data_signal_seed: dataSignalSeed.feature_signal_seeds || [],
    controlled_values: instructionPacket.controlled_values || {}
  };
}

export function buildStage5DPrompt(modelInput = {}) {
  return {
    system: [
      'You are Stage 5D. Extract feature-level data touchpoints only.',
      'Do not create or delete features. Do not change archetypes or surfaces.',
      'Do not make privacy/legal conclusions. Do not assign threat IDs.',
      'Use only controlled values and existing refs supplied in the input.',
      'For storage, retention, training, sharing, and logging: use NOT_EVIDENCED unless explicit source text supports the signal.',
      'Return strict JSON only.'
    ].join('\n'),
    expected_json_contract: {
      stage5d_version: 'stage5d_feature_data_touchpoints_v1',
      feature_data_touchpoints: [{
        feature_id: 'F001',
        function_id: 'PF001',
        core_product_name: '',
        feature_name: '',
        touchpoint_type: 'INPUT',
        data_category: 'TEXT',
        data_subject: 'UNKNOWN',
        data_origin: 'CUSTOMER_PROVIDED',
        data_direction: 'INBOUND_TO_SYSTEM',
        processing_action: '',
        input_data: [],
        output_data: [],
        storage_signal: 'NOT_EVIDENCED',
        retention_signal: 'NOT_EVIDENCED',
        training_or_finetuning_signal: 'NOT_EVIDENCED',
        sharing_or_subprocessor_signal: 'NOT_EVIDENCED',
        logging_or_telemetry_signal: 'NOT_EVIDENCED',
        explicitness_level: 'EXPLICIT',
        evidence_refs: [],
        lossless_source_index_refs: [],
        confidence: 'HIGH',
        unknown_reason: null
      }],
      feature_level_unknowns: [],
      limitations: []
    },
    user: modelInput
  };
}
