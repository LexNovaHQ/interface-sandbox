import crypto from 'node:crypto';
import assert from 'node:assert/strict';

import { runStage6CDataProvenanceIntegration } from '../src/diligence/stage6/6c/6c.runtime.js';
import { STAGE6C_ALIGNMENT_STATUS } from '../src/diligence/stage6/6c/6c.dictionary.js';
import { STAGE6B_SOURCE_BASIS } from '../src/diligence/stage6/6b/6b.dictionary.js';

function sha256(text) {
  return crypto.createHash('sha256').update(String(text || ''), 'utf8').digest('hex');
}

const legalText = [
  'Privacy Policy',
  'We collect audio_input and user content that customers submit to provide speech-to-text and AI model services.',
  'We process prompts, inputs, outputs and customer content for service delivery.',
  'We retain data only as long as necessary and delete it upon request.'
].join('\n');

const sourceSha = sha256(legalText);
const windowText = legalText.slice(0, legalText.length);
const legalWindow = {
  window_id: 'SRC_LEGAL_001#6A#LUNIT_001',
  source_id: 'SRC_LEGAL_001',
  source_url: 'https://example.com/privacy',
  source_title: 'Privacy Policy',
  char_start: 0,
  char_end: legalText.length,
  verbatim_text: windowText,
  source_sha256: sourceSha,
  created_by_stage: '6A',
  used_for: ['legal_cartography', 'DATA_PROCESSING'],
  selection_reason: 'fixture legal data processing clause'
};

const canonicalStage6Input = {
  stage6_input_version: 'stage6_legal_governance_input_v1',
  target_ref: { domain: 'example.com' },
  primary_evidence: {
    family_id: 'legal_governance',
    sources: [
      {
        source_id: 'SRC_LEGAL_001',
        source_url: 'https://example.com/privacy',
        source_title: 'Privacy Policy',
        source_family: 'legal_governance',
        clean_text_lossless: legalText,
        source_sha256: sourceSha,
        lossless_policy: {
          full_text_lossless: true,
          summarized: false,
          compressed: false,
          truncated: false,
          normalized: false
        }
      }
    ]
  },
  reference: {
    target_profile: { company_name: 'Example AI' },
    metadata_sidecar: [],
    navigation_sidecar: []
  }
};

const stage6aOutput = {
  legal_cartography: {
    legal_document_inventory: [
      {
        legal_document_id: 'LDOC_001',
        source_id: 'SRC_LEGAL_001',
        source_url: 'https://example.com/privacy',
        document_type: 'privacy_policy',
        document_title: 'Privacy Policy',
        source_sha256: sourceSha,
        clean_text_lossless_present: true
      }
    ],
    legal_unit_map: [
      {
        legal_unit_id: 'LUNIT_001',
        legal_document_id: 'LDOC_001',
        source_id: 'SRC_LEGAL_001',
        source_window_ref: legalWindow.window_id,
        unit_type: 'data_processing_clause',
        heading_text: 'Privacy Policy',
        legal_unit_marker_type: 'SECTION',
        legal_unit_level: 1,
        char_start: 0,
        char_end: legalText.length,
        source_sha256: sourceSha,
        control_family_candidates: ['DATA_PROCESSING'],
        matched_terms: ['collect', 'process', 'audio_input']
      }
    ],
    legal_control_map: [],
    legal_source_window_ledger: [legalWindow]
  }
};

const stage6bOutput = {
  stage6b_output_version: 'stage6b_legal_governance_data_provenance_v2',
  legal_governance_data_provenance_profile: {
    profile_version: 'legal_governance_data_provenance_profile_v1',
    legal_data_findings: [
      {
        legal_data_finding_id: 'LGDP_0001',
        finding_type: 'DATA_PROCESSING_DISCLOSURE',
        data_category: 'audio_input',
        data_subject: 'end_user',
        declared_action: 'legal source declares processing of audio_input and user content for speech-to-text service delivery',
        processing_context: 'service_delivery',
        ai_or_model_treatment: 'EVIDENCED_IN_LEGAL_GOVERNANCE_SOURCE',
        retention_or_deletion_signal: 'EVIDENCED_IN_LEGAL_GOVERNANCE_SOURCE',
        subprocessor_or_transfer_signal: 'NOT_EVIDENCED',
        controller_processor_role: 'NOT_EVIDENCED',
        source_basis: STAGE6B_SOURCE_BASIS.LEGAL_GOVERNANCE_SOURCE,
        legal_unit_refs: ['LUNIT_001'],
        source_window_refs: [legalWindow.window_id],
        matched_terms: ['audio_input', 'process', 'speech-to-text']
      }
    ]
  },
  source_window_ledger: [legalWindow],
  legal_unit_packets: [
    {
      legal_unit_id: 'LUNIT_001',
      source_window_ref: legalWindow.window_id,
      verbatim_text: legalWindow.verbatim_text
    }
  ]
};

const targetFeatureProfile = {
  feature_inventory: [
    {
      feature_id: 'FEATURE_001',
      core_product_name: 'Speech API',
      feature_name: 'Speech-to-text processing',
      feature_role: 'speech-to-text',
      actor_or_user: 'end_user',
      input_data: ['audio_input'],
      system_action: 'processes audio_input for speech-to-text output',
      output_or_result: 'text transcript',
      source_window_refs: ['SRC_PRODUCT_001#5A#FEATURE_001']
    }
  ]
};

const result = await runStage6CDataProvenanceIntegration({
  canonicalStage6Input,
  stage6aOutput,
  stage6bOutput,
  targetFeatureProfile,
  maxReinvestigationAttempts: 0
});

assert.equal(result.ok, true, JSON.stringify(result, null, 2));
assert.equal(result.data_provenance_profile.profile_version, 'integrated_data_provenance_profile_v1');
assert.ok(result.data_provenance_profile.integrated_data_flows.length >= 1);

const matched = result.data_provenance_profile.integrated_data_flows.find((row) => row.alignment_status === STAGE6C_ALIGNMENT_STATUS.MATCHED_PRODUCT_AND_LEGAL_DATA_FLOW);
assert.ok(matched, JSON.stringify(result.data_provenance_profile.integrated_data_flows, null, 2));
assert.deepEqual(matched.product_observed_refs, ['FEATURE_001']);
assert.deepEqual(matched.legal_governance_refs, ['LGDP_0001']);
assert.deepEqual(matched.legal_source_window_refs, [legalWindow.window_id]);
assert.equal(result.forensic_log.stage6c_may_create_new_source_facts, false);

console.log(JSON.stringify({ ok: true, phase: 'stage6c_data_provenance_integration_e2e', integrated_rows: result.data_provenance_profile.integrated_data_flows.length }, null, 2));
