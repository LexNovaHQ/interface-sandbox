import crypto from 'node:crypto';
import assert from 'node:assert/strict';

import { validate6cTo7Handoff } from '../src/diligence/stage6/validators/validate6cTo7Handoff.js';
import { STAGE6B_SOURCE_BASIS } from '../src/diligence/stage6/6b/6b.dictionary.js';
import { STAGE6C_ALIGNMENT_STATUS } from '../src/diligence/stage6/6c/6c.dictionary.js';
import { STAGE6_VALIDATION_STATUS } from '../src/diligence/stage6/stage6.dictionary.js';

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
const legalWindow = {
  window_id: 'SRC_LEGAL_001#6A#LUNIT_001',
  source_id: 'SRC_LEGAL_001',
  source_url: 'https://example.com/privacy',
  source_title: 'Privacy Policy',
  char_start: 0,
  char_end: legalText.length,
  verbatim_text: legalText.slice(0, legalText.length),
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
    target_feature_profile: {
      feature_inventory: [
        {
          feature_id: 'FEATURE_001',
          feature_name: 'Speech-to-text processing',
          input_data: ['audio_input'],
          system_action: 'processes audio_input for speech-to-text output',
          source_window_refs: ['SRC_PRODUCT_001#5A#FEATURE_001']
        }
      ]
    }
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
        source_basis: STAGE6B_SOURCE_BASIS.LEGAL_GOVERNANCE_SOURCE,
        legal_unit_refs: ['LUNIT_001'],
        source_window_refs: [legalWindow.window_id]
      }
    ]
  },
  source_window_ledger: [legalWindow]
};

const stage6cOutput = {
  data_provenance_profile: {
    profile_version: 'integrated_data_provenance_profile_v1',
    integrated_data_flows: [
      {
        integrated_data_flow_id: 'DPF_0001',
        alignment_status: STAGE6C_ALIGNMENT_STATUS.MATCHED_PRODUCT_AND_LEGAL_DATA_FLOW,
        product_observed_refs: ['FEATURE_001'],
        legal_governance_refs: ['LGDP_0001'],
        data_category: 'audio_input',
        product_observed_action: 'speech-to-text processing',
        legal_declared_action: 'processing user-provided content for service delivery',
        product_source_window_refs: ['SRC_PRODUCT_001#5A#FEATURE_001'],
        legal_source_window_refs: [legalWindow.window_id]
      }
    ],
    unmatched_product_observed_flows: [],
    unmatched_legal_governance_controls: [],
    conflicts: [],
    limitations: []
  }
};

const productWindow = {
  window_id: 'SRC_PRODUCT_001#5A#FEATURE_001',
  source_id: 'SRC_PRODUCT_001',
  source_url: 'https://example.com/speech-api',
  char_start: 0,
  char_end: 24,
  verbatim_text: 'speech-to-text capability',
  source_sha256: 'not-validated-by-stage7-handoff-fixture'
};

const result = validate6cTo7Handoff({
  canonicalStage6Input,
  stage6aOutput,
  stage6bOutput,
  stage6cOutput,
  productSourceWindowLedger: [productWindow]
});

assert.equal(result.ok, true, JSON.stringify(result, null, 2));
assert.equal(result.status, STAGE6_VALIDATION_STATUS.PASS);
assert.equal(result.stage7_input.stage7_input_version, 'stage7_registry_evaluation_input_v1');
assert.ok(result.stage7_input.primary_evidence.legal_governance_lossless_sources.length === 1);
assert.ok(result.stage7_input.primary_cartography.legal_cartography.legal_unit_map.length === 1);
assert.equal(result.stage7_input.reference_profiles.data_provenance_profile.profile_version, 'integrated_data_provenance_profile_v1');
assert.equal(result.stage7_input.handoff_policy.data_provenance_profile_is_reference, true);
assert.equal(result.next_action, 'RUN_STAGE7_REGISTRY_EVALUATION_WITH_LEGAL_PRIMARY_EVIDENCE');

const bad = validate6cTo7Handoff({
  canonicalStage6Input,
  stage6aOutput,
  stage6bOutput,
  stage6cOutput,
  proposedStage7Input: {
    stage7_input_version: 'stage7_registry_evaluation_input_v1',
    reference_profiles: {
      data_provenance_profile: stage6cOutput.data_provenance_profile
    }
  }
});
assert.equal(bad.ok, false, JSON.stringify(bad, null, 2));
assert.equal(bad.status, STAGE6_VALIDATION_STATUS.CONTRACT_VIOLATION);

console.log(JSON.stringify({
  ok: true,
  phase: 'stage6c_to_stage7_handoff_e2e',
  legal_source_count: result.legal_source_count,
  integrated_rows: result.integrated_data_flow_count
}, null, 2));
