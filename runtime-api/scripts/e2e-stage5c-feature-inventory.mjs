#!/usr/bin/env node
/* LexNova Runtime — standalone Stage 5C feature inventory e2e. */

import { runStage5C } from '../src/diligence/stage5/5c/stage5cIndex.js';

const stage5aFeaturePackage = {
  target_profile_ref: 'fixture.example',
  features_for_5b: [
    {
      function_id: 'PF001',
      core_product_id: 'CP001',
      core_product_name: 'Fixture API',
      function_name: 'Speech-to-Text',
      function_type: 'API_CAPABILITY',
      primary_or_secondary: 'PRIMARY',
      commercial_function: 'Converts spoken audio into text transcripts.',
      mechanics: {
        actor_or_user: 'developer or customer application',
        input_signal: 'audio',
        system_action: 'transcribes speech to text',
        output_or_result: 'text transcript'
      },
      investigation_package: {
        source_refs: ['SRC001'],
        evidence_refs: ['EV001'],
        lossless_source_index_refs: ['SRC001#chunk:001'],
        nearby_source_context_refs: ['SRC001#chunk:002']
      },
      model_admission_notes: { admission_confidence: 'HIGH' }
    }
  ],
  core_products: [{ core_product_id: 'CP001', core_product_name: 'Fixture API', function_ids: ['PF001'] }],
  lossless_source_index: [{ source_id: 'SRC001', url: 'https://fixture.example/api', chunk_refs: ['SRC001#chunk:001'] }]
};

const stage5aMapping = {
  product_function_map: [
    {
      function_id: 'PF001',
      core_product_name: 'Fixture API',
      function_name: 'Speech-to-Text',
      commercial_function: 'Converts spoken audio into text transcripts.',
      actor_or_user: 'developer or customer application',
      input_signal: 'audio',
      system_action: 'transcribes speech to text',
      output_or_result: 'text transcript',
      evidence_refs: ['EV001']
    }
  ]
};

const stage5bTagPackage = {
  target_profile_ref: 'fixture.example',
  feature_tags_for_5c: [
    {
      function_id: 'PF001',
      core_product_name: 'Fixture API',
      function_name: 'Speech-to-Text',
      primary_archetype_code: 'TRN',
      secondary_archetype_codes: [],
      archetype_codes: ['TRN'],
      archetype_labels: ['Translator'],
      archetype_provenance: [{ code: 'TRN', evidence_refs: ['EV001'] }],
      surface_tokens: ['Sensitive/Biometric'],
      surface_provenance: [{ token: 'Sensitive/Biometric', evidence_refs: ['EV001'] }],
      behavior_signals: {
        autonomy_level: 'ASSISTIVE',
        human_review_signal: 'UNKNOWN_NOT_EVIDENCED',
        external_action_signal: 'FALSE'
      },
      evidence_refs: ['EV001'],
      lossless_source_index_refs: ['SRC001#chunk:001'],
      tagging_confidence: 'HIGH'
    }
  ],
  tagging_failures: []
};

const stage5bTagging = { feature_tags: stage5bTagPackage.feature_tags_for_5c };

const ports = {
  model: {
    async runJsonStage() {
      return {
        json: {
          stage5c_canonicalization_repair: {
            stage5c_repair_version: 'stage5c_canonicalization_repair_v1',
            repairs: [],
            true_unknowns: [],
            limitations: []
          }
        },
        model_metadata: { fixture: true, skipped: false }
      };
    }
  }
};

const result = await runStage5C({
  stage5aFeaturePackage,
  stage5aMapping,
  stage5bTagPackage,
  stage5bTagging,
  ports,
  runId: 'stage5c_fixture'
});

const ok = result.stage5c_validation?.ok === true;
console.log(JSON.stringify({
  ok,
  phase: 'stage5c_feature_inventory_e2e',
  feature_inventory_count: result.stage5c_feature_inventory_package?.feature_inventory?.length || 0,
  validation: result.stage5c_validation
}, null, 2));
if (!ok) process.exit(1);
