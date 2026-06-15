#!/usr/bin/env node
/* Standalone Stage 5E fixture. Does not deploy. */

import { runStage5E } from '../src/diligence/stage5/5e/stage5eIndex.js';

const companyProfile = { target_profile_version: 'target_profile_v2', identity: { brand_name: 'Fixture AI', legal_name: '', domain: 'fixture.example', website: 'https://fixture.example' } };
const adapterResult = {
  target_feature_profile_input: { target_profile_ref: { target_profile_version: 'target_profile_v2', brand_name: 'Fixture AI', legal_name: '', domain: 'fixture.example' } },
  stage5a_batch2: { stage5a_feature_package: { features_for_5b: [], limitations: [] }, stage5a_product_function_mapping: { commercial_outcome_candidates: [] }, stage5a_validation: { ok: true } },
  stage5b_batch3: { stage5b_tag_package: { feature_tags_for_5c: [], tagging_failures: [], limitations: [] }, stage5b_validation: { ok: true } },
  stage5c_batch4: { stage5c_feature_inventory_package: { target_profile_ref: { brand_name: 'Fixture AI' }, feature_inventory: [{ feature_id: 'F001', function_id: 'PF001', feature_name: 'Speech-to-Text', feature_role: 'CORE', commercial_function: 'Converts speech audio into text transcripts.', business_label_or_product_area: 'Fixture API', feature_description: 'Speech-to-Text converts audio into a text transcript.', actor_or_user: 'developer', input_data: ['audio'], system_action: 'transcribes speech to text', output_or_result: 'text transcript', autonomy_level: 'draft', human_review_signal: 'not_visible', external_action_signal: 'false', delivery_channels: ['API_OR_DEVELOPER_INTERFACE'], archetype_codes: ['TRN'], archetype_labels: ['Translator'], surface_tokens: ['Sensitive/Biometric'], confidence: 'HIGH', feature_source_url: 'https://fixture.example/api', evidence_refs: ['EV001'] }], feature_id_map: [{ function_id: 'PF001', feature_id: 'F001' }], limitations: [] }, stage5c_validation: { ok: true } },
  stage5d_batch5: { stage5d_data_touchpoint_package: { feature_data_touchpoints: [{ feature_id: 'F001', function_id: 'PF001', core_product_name: 'Fixture API', feature_name: 'Speech-to-Text', data_category: 'AUDIO', data_subject: 'SPEAKER', data_origin: 'CUSTOMER_PROVIDED', data_direction: 'INBOUND_TO_SYSTEM', processing_action: 'transcribes speech to text', evidence_refs: ['EV001'], confidence: 'HIGH', storage_signal: 'NOT_EVIDENCED', retention_signal: 'NOT_EVIDENCED', training_or_finetuning_signal: 'NOT_EVIDENCED' }], seeds_for_5e: { data_provenance_map_seed: [{ feature_id: 'F001', data_category: 'AUDIO', data_subject: 'SPEAKER', data_origin: 'CUSTOMER_PROVIDED', processing_action: 'transcribes speech to text', evidence_refs: ['EV001'], confidence: 'HIGH' }], regulated_surface_map_seed: [], architecture_hints_seed: [], vault_feature_candidates_seed: [{ feature_id: 'F001', feature_name: 'Speech-to-Text', questions: ['Do you store audio?'] }] }, limitations: [] }, stage5d_validation: { ok: true } }
};

const result = await runStage5E({ adapterResult, companyProfile, runId: 'stage5e_fixture' });
console.log(JSON.stringify({ ok: result.stage5e_validation.ok, severity: result.stage5e_validation.severity, feature_count: result.target_feature_profile.feature_inventory.length, handoff_keys: Object.keys(result.target_feature_profile) }, null, 2));
if (!result.stage5e_validation.ok) process.exit(1);
