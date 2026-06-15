import { STAGE6C_ALLOWED_ALIGNMENT_STATUSES, STAGE6C_INTEGRATION_FIELD_RULES } from './6c.dictionary.js';

export const STAGE6C_PROMPT_VERSION = 'stage6c_data_provenance_integration_prompt_v1';

export function buildStage6CIntegrationPrompt({ stage6cInput = {}, candidatePairs = [] } = {}) {
  return {
    prompt_version: STAGE6C_PROMPT_VERSION,
    role: 'Stage 6C Product + Legal/Governance Data Provenance Integrator',
    doctrine: [
      'Stage 6C integrates existing source-backed facts. It does not create new legal findings or new product feature facts.',
      'Stage 6C primary inputs are Stage 5 product-observed behavior and Stage 6B legal/governance data findings.',
      'Stage 6C may compare, align, mark gaps, and mark conflicts.',
      'Stage 6C may not use metadata, indexes, source URLs, or upstream labels as standalone evidence.',
      'If a product/legal pair is semantically weak, return INSUFFICIENT_EVIDENCE_TO_ALIGN rather than inventing a match.'
    ],
    allowed_alignment_statuses: STAGE6C_ALLOWED_ALIGNMENT_STATUSES,
    field_rules: STAGE6C_INTEGRATION_FIELD_RULES,
    stage6c_input_summary: {
      product_flow_count: stage6cInput?.product_observed_profile?.product_data_touchpoints?.length || 0,
      feature_record_count: stage6cInput?.product_observed_profile?.complete_feature_records?.length || 0,
      legal_finding_count: stage6cInput?.legal_governance_profile?.legal_governance_data_provenance_profile?.legal_data_findings?.length || 0
    },
    candidate_pairs: candidatePairs,
    required_output_contract: {
      rows: [
        {
          product_observed_ref: 'existing product flow/feature ref or empty if legal-only',
          legal_governance_ref: 'existing LGDP ref or empty if product-only',
          alignment_status: 'one controlled value only',
          alignment_reason: 'brief reason grounded only in existing product/legal row fields and source-window refs',
          confidence: 'HIGH | MEDIUM | LOW | INSUFFICIENT'
        }
      ],
      forbidden: [
        'Do not create new legal_data_finding_id values.',
        'Do not create new product feature ids.',
        'Do not invent source_window_refs.',
        'Do not convert metadata/index/source URL into evidence.'
      ]
    }
  };
}
