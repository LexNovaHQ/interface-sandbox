#!/usr/bin/env node
/* Standalone Stage 5D fixture. Does not deploy. */

import { runStage5D } from '../src/diligence/stage5/5d/stage5dIndex.js';

const stage5aFeaturePackage = {
  target_profile_ref: { brand_name: 'Fixture AI' },
  lossless_source_index: [{ source_id: 'SRC001', chunk_refs: ['SRC001#chunk:001'] }],
  features_for_5b: [{
    function_id: 'PF001',
    core_product_name: 'Fixture API',
    function_name: 'Speech-to-Text',
    mechanics: { actor_or_user: 'developer', input_signal: 'audio', system_action: 'transcribes speech to text', output_or_result: 'text transcript' },
    investigation_package: { evidence_refs: ['EV001'], lossless_source_index_refs: ['SRC001#chunk:001'], source_refs: ['https://example.com/api'] }
  }]
};

const stage5bTagPackage = {
  target_profile_ref: { brand_name: 'Fixture AI' },
  feature_tags_for_5c: [{ function_id: 'PF001', archetype_codes: ['TRN'], surface_tokens: ['Sensitive/Biometric'], evidence_refs: ['EV001'], lossless_source_index_refs: ['SRC001#chunk:001'] }]
};

const stage5cFeatureInventoryPackage = {
  target_profile_ref: { brand_name: 'Fixture AI' },
  feature_inventory: [{
    feature_id: 'F001',
    function_id: 'PF001',
    core_product_name: 'Fixture API',
    feature_name: 'Speech-to-Text',
    actor_or_user: 'developer',
    input_data: ['audio'],
    system_action: 'transcribes speech to text',
    output_or_result: 'text transcript',
    evidence_refs: ['EV001'],
    lossless_source_index_refs: ['SRC001#chunk:001'],
    surface_tokens: ['Sensitive/Biometric']
  }],
  feature_id_map: [{ function_id: 'PF001', feature_id: 'F001' }]
};

const ports = {
  runner: {
    async runJsonStage() {
      return {
        json: {
          stage5d_version: 'stage5d_feature_data_touchpoints_v1',
          feature_data_touchpoints: [{
            feature_id: 'F001',
            function_id: 'PF001',
            core_product_name: 'Fixture API',
            feature_name: 'Speech-to-Text',
            touchpoint_type: 'INPUT',
            data_category: 'AUDIO',
            data_subject: 'SPEAKER',
            data_origin: 'CUSTOMER_PROVIDED',
            data_direction: 'INBOUND_TO_SYSTEM',
            processing_action: 'transcribes speech to text',
            input_data: ['audio'],
            output_data: ['text transcript'],
            storage_signal: 'NOT_EVIDENCED',
            retention_signal: 'NOT_EVIDENCED',
            training_or_finetuning_signal: 'NOT_EVIDENCED',
            sharing_or_subprocessor_signal: 'NOT_EVIDENCED',
            logging_or_telemetry_signal: 'NOT_EVIDENCED',
            explicitness_level: 'IMPLIED_BY_FUNCTION',
            evidence_refs: ['EV001'],
            lossless_source_index_refs: ['SRC001#chunk:001'],
            confidence: 'HIGH',
            unknown_reason: null
          }],
          feature_level_unknowns: [],
          limitations: []
        },
        run_metadata: { fixture: true }
      };
    }
  }
};

const result = await runStage5D({ stage5aFeaturePackage, stage5bTagPackage, stage5cFeatureInventoryPackage, ports, runId: 'stage5d_fixture' });
console.log(JSON.stringify({
  ok: result.stage5d_validation.ok,
  severity: result.stage5d_validation.severity,
  touchpoint_count: result.stage5d_data_touchpoint_package.feature_data_touchpoints.length,
  data_provenance_seed_count: result.stage5d_data_touchpoint_package.seeds_for_5e.data_provenance_map_seed.length
}, null, 2));
if (!result.stage5d_validation.ok) process.exit(1);
