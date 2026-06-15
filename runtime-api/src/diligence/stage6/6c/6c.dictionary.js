import {
  STAGE6C_ALIGNMENT_STATUS,
  STAGE6_REINVESTIGATION_ACTION,
  STAGE6_VALIDATION_STATUS
} from '../stage6.dictionary.js';

export const STAGE6C_RUNTIME_VERSION = 'stage6c_data_provenance_integration_v1';
export const STAGE6C_PROFILE_VERSION = 'integrated_data_provenance_profile_v1';

export { STAGE6C_ALIGNMENT_STATUS, STAGE6_REINVESTIGATION_ACTION, STAGE6_VALIDATION_STATUS };

export const STAGE6C_ALLOWED_ALIGNMENT_STATUSES = Object.freeze(Object.values(STAGE6C_ALIGNMENT_STATUS));

export const STAGE6C_INTEGRATION_FIELD_RULES = Object.freeze({
  integrated_data_flow_id: {
    source: 'deterministic integration row id',
    may_create_new_source_fact: false,
    required: true
  },
  alignment_status: {
    source: 'controlled deterministic alignment status',
    allowed_values: STAGE6C_ALLOWED_ALIGNMENT_STATUSES,
    required: true
  },
  product_observed_refs: {
    source: 'Stage 5 target_feature_profile / complete feature records only',
    may_create_new_product_fact: false,
    required_for: [
      STAGE6C_ALIGNMENT_STATUS.MATCHED_PRODUCT_AND_LEGAL_DATA_FLOW,
      STAGE6C_ALIGNMENT_STATUS.PRODUCT_OBSERVED_BUT_LEGAL_SOURCE_SILENT,
      STAGE6C_ALIGNMENT_STATUS.CONFLICT_PRODUCT_VS_LEGAL_DISCLOSURE
    ]
  },
  legal_governance_refs: {
    source: 'Stage 6B legal_governance_data_provenance_profile only',
    may_create_new_legal_fact: false,
    required_for: [
      STAGE6C_ALIGNMENT_STATUS.MATCHED_PRODUCT_AND_LEGAL_DATA_FLOW,
      STAGE6C_ALIGNMENT_STATUS.LEGAL_GOVERNANCE_CONTROL_WITHOUT_PRODUCT_FLOW,
      STAGE6C_ALIGNMENT_STATUS.CONFLICT_PRODUCT_VS_LEGAL_DISCLOSURE
    ]
  },
  product_source_window_refs: {
    source: 'Stage 5 product source-window ledger if available',
    may_be_empty_pending_stage5_rebuild: true
  },
  legal_source_window_refs: {
    source: 'Stage 6B / 6A legal source-window ledger',
    required_for_legal_refs: true
  }
});

export const STAGE6C_PRODUCT_FLOW_EXTRACTION_HINTS = Object.freeze({
  feature_record_paths: [
    'complete_feature_records',
    'feature_inventory',
    'features',
    'canonical_output.complete_feature_records',
    'target_feature_profile.feature_inventory'
  ],
  data_touchpoint_paths: [
    'product_data_touchpoints',
    'data_touchpoints',
    'data_provenance_map',
    'data_provenance',
    'canonical_output.data_touchpoints',
    'target_feature_profile.data_provenance_map'
  ],
  product_window_ref_fields: [
    'source_window_refs',
    'evidence_window_refs',
    'product_source_window_refs',
    'evidence_refs',
    'field_evidence_refs'
  ]
});

export const STAGE6C_MATCHING_RULES = Object.freeze([
  {
    rule_id: 'MATCH_EXACT_DATA_CATEGORY',
    weight: 4,
    description: 'Product and legal rows use the same data_category value.'
  },
  {
    rule_id: 'MATCH_TEXTUAL_DATA_TERMS',
    weight: 3,
    description: 'Product and legal rows share material data/action terms.'
  },
  {
    rule_id: 'MATCH_AI_MODEL_TREATMENT',
    weight: 3,
    description: 'Product-observed AI behavior aligns with legal AI/model/prompt/output finding.'
  },
  {
    rule_id: 'MATCH_PROCESSING_CONTEXT',
    weight: 2,
    description: 'Product and legal rows share processing context.'
  },
  {
    rule_id: 'WEAK_LABEL_ONLY_MATCH',
    weight: 1,
    description: 'Only weak label overlap; validator should ask for reinvestigation if used as a matched row.'
  }
]);

export const STAGE6C_FORBIDDEN_CREATION = Object.freeze([
  'new_legal_finding',
  'new_product_feature_fact',
  'new_product_data_touchpoint',
  'metadata_only_alignment',
  'index_only_alignment'
]);

export function textTokens(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9_\s-]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 4 && !['data', 'user', 'with', 'from', 'this', 'that', 'your', 'their', 'information'].includes(token));
}

export function overlapScore(left = '', right = '') {
  const a = new Set(textTokens(left));
  const b = new Set(textTokens(right));
  if (!a.size || !b.size) return 0;
  let overlap = 0;
  for (const token of a) if (b.has(token)) overlap += 1;
  return overlap;
}
