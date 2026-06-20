export const STAGE6_RUNTIME_VERSION = 'stage6_canonical_runtime_v1';

export const STAGE6_VALIDATION_STATUS = Object.freeze({
  PASS: 'PASS',
  REINVESTIGATE_REQUIRED: 'REINVESTIGATE_REQUIRED',
  UNRESOLVED_AFTER_REINVESTIGATION: 'UNRESOLVED_AFTER_REINVESTIGATION',
  CONTRACT_VIOLATION: 'CONTRACT_VIOLATION'
});

export const STAGE6_REINVESTIGATION_ACTION = Object.freeze({
  EXPAND_LEGAL_UNIT_WINDOW: 'EXPAND_LEGAL_UNIT_WINDOW',
  SPLIT_LEGAL_UNIT: 'SPLIT_LEGAL_UNIT',
  RERUN_LEGAL_UNIT_CLASSIFICATION: 'RERUN_LEGAL_UNIT_CLASSIFICATION',
  RERUN_DATA_PROVENANCE_EXTRACTION: 'RERUN_DATA_PROVENANCE_EXTRACTION',
  RERUN_ALIGNMENT_FOR_PAIR: 'RERUN_ALIGNMENT_FOR_PAIR',
  REQUEST_UPSTREAM_SOURCE_REPAIR: 'REQUEST_UPSTREAM_SOURCE_REPAIR'
});

export const STAGE6_CONTRACT_ERROR_CODE = Object.freeze({
  LOSSLESS_PRIMARY_EVIDENCE_VIOLATION: 'LOSSLESS_PRIMARY_EVIDENCE_VIOLATION',
  SOURCE_WINDOW_NOT_VERBATIM: 'SOURCE_WINDOW_NOT_VERBATIM',
  LEGAL_CARTOGRAPHY_HANDOFF_VIOLATION: 'LEGAL_CARTOGRAPHY_HANDOFF_VIOLATION',
  LEGAL_DATA_PROVENANCE_HANDOFF_VIOLATION: 'LEGAL_DATA_PROVENANCE_HANDOFF_VIOLATION',
  DATA_PROVENANCE_INTEGRATION_HANDOFF_VIOLATION: 'DATA_PROVENANCE_INTEGRATION_HANDOFF_VIOLATION',
  STAGE7_HANDOFF_VIOLATION: 'STAGE7_HANDOFF_VIOLATION'
});

export const STAGE6_SOURCE_FAMILY = Object.freeze({
  LEGAL_GOVERNANCE: 'legal_governance',
  PRODUCT_OBSERVED: 'product_observed'
});

export const STAGE6A_DOCUMENT_TYPE = Object.freeze({
  PRIVACY_POLICY: 'privacy_policy',
  TERMS_OF_SERVICE: 'terms_of_service',
  DATA_PROCESSING_ADDENDUM: 'data_processing_addendum',
  SECURITY_PAGE: 'security_page',
  TRUST_CENTER: 'trust_center',
  SUBPROCESSOR_LIST: 'subprocessor_list',
  AI_POLICY: 'ai_policy',
  RESPONSIBLE_AI_POLICY: 'responsible_ai_policy',
  COOKIE_POLICY: 'cookie_policy',
  ACCEPTABLE_USE_POLICY: 'acceptable_use_policy',
  GOVERNANCE_PAGE: 'governance_page',
  OTHER_LEGAL_GOVERNANCE: 'other_legal_governance',
  UNKNOWN: 'UNKNOWN'
});

export const STAGE6A_LEGAL_UNIT_TYPE = Object.freeze({
  DATA_COLLECTION_CLAUSE: 'data_collection_clause',
  DATA_PROCESSING_CLAUSE: 'data_processing_clause',
  AI_MODEL_TREATMENT_CLAUSE: 'ai_model_treatment_clause',
  TRAINING_FINE_TUNING_CLAUSE: 'training_fine_tuning_clause',
  RETENTION_DELETION_CLAUSE: 'retention_deletion_clause',
  SUBPROCESSOR_CLAUSE: 'subprocessor_clause',
  INTERNATIONAL_TRANSFER_CLAUSE: 'international_transfer_clause',
  SECURITY_MEASURES_CLAUSE: 'security_measures_clause',
  BREACH_NOTIFICATION_CLAUSE: 'breach_notification_clause',
  CONTROLLER_PROCESSOR_ROLE_CLAUSE: 'controller_processor_role_clause',
  AUTOMATED_DECISIONING_CLAUSE: 'automated_decisioning_clause',
  SENSITIVE_MINOR_DATA_CLAUSE: 'sensitive_minor_data_clause',
  RIGHTS_NOTICE_CONSENT_CLAUSE: 'rights_notice_consent_clause',
  LIMITATION_DISCLAIMER_CLAUSE: 'limitation_disclaimer_clause',
  GOVERNANCE_CONTROL_CLAUSE: 'governance_control_clause',
  GENERAL_LEGAL_UNIT: 'general_legal_unit',
  UNKNOWN: 'UNKNOWN'
});

export const STAGE6_CONTROL_FAMILY = Object.freeze({
  DATA_COLLECTION: 'DATA_COLLECTION',
  DATA_PROCESSING: 'DATA_PROCESSING',
  PRIVACY_NOTICE: 'PRIVACY_NOTICE',
  AI_MODEL_USAGE: 'AI_MODEL_USAGE',
  TRAINING_FINE_TUNING: 'TRAINING_FINE_TUNING',
  RETENTION_DELETION: 'RETENTION_DELETION',
  SUBPROCESSORS: 'SUBPROCESSORS',
  INTERNATIONAL_TRANSFERS: 'INTERNATIONAL_TRANSFERS',
  SECURITY: 'SECURITY',
  BREACH: 'BREACH',
  CONTROLLER_PROCESSOR_ROLE: 'CONTROLLER_PROCESSOR_ROLE',
  RIGHTS_NOTICE_CONSENT: 'RIGHTS_NOTICE_CONSENT',
  AUTOMATED_DECISIONING: 'AUTOMATED_DECISIONING',
  SENSITIVE_MINOR_DATA: 'SENSITIVE_MINOR_DATA',
  AI_OUTPUT_INPUT_TREATMENT: 'AI_OUTPUT_INPUT_TREATMENT',
  GOVERNANCE_ARCHITECTURE: 'GOVERNANCE_ARCHITECTURE',
  LIMITATION_DISCLAIMER: 'LIMITATION_DISCLAIMER',
  UNKNOWN: 'UNKNOWN'
});

export const STAGE6B_FINDING_TYPE = Object.freeze({
  DATA_COLLECTION_DISCLOSURE: 'DATA_COLLECTION_DISCLOSURE',
  DATA_PROCESSING_DISCLOSURE: 'DATA_PROCESSING_DISCLOSURE',
  AI_MODEL_PROVIDER_TREATMENT: 'AI_MODEL_PROVIDER_TREATMENT',
  PROMPT_INPUT_OUTPUT_TREATMENT: 'PROMPT_INPUT_OUTPUT_TREATMENT',
  EMBEDDING_OR_RAG_DISCLOSURE: 'EMBEDDING_OR_RAG_DISCLOSURE',
  TRAINING_FINE_TUNING_DISCLOSURE: 'TRAINING_FINE_TUNING_DISCLOSURE',
  RETENTION_DELETION_DISCLOSURE: 'RETENTION_DELETION_DISCLOSURE',
  SUBPROCESSOR_DISCLOSURE: 'SUBPROCESSOR_DISCLOSURE',
  INTERNATIONAL_TRANSFER_DISCLOSURE: 'INTERNATIONAL_TRANSFER_DISCLOSURE',
  SECURITY_BREACH_DISCLOSURE: 'SECURITY_BREACH_DISCLOSURE',
  CONTROLLER_PROCESSOR_ROLE_DISCLOSURE: 'CONTROLLER_PROCESSOR_ROLE_DISCLOSURE',
  AUTOMATED_DECISIONING_DISCLOSURE: 'AUTOMATED_DECISIONING_DISCLOSURE',
  SENSITIVE_MINOR_DATA_DISCLOSURE: 'SENSITIVE_MINOR_DATA_DISCLOSURE',
  RIGHTS_NOTICE_CONSENT_DISCLOSURE: 'RIGHTS_NOTICE_CONSENT_DISCLOSURE',
  NOT_EVIDENCED: 'NOT_EVIDENCED',
  UNKNOWN: 'UNKNOWN'
});

export const STAGE6B_SOURCE_BASIS = Object.freeze({
  LEGAL_GOVERNANCE_SOURCE: 'LEGAL_GOVERNANCE_SOURCE',
  LEGAL_UNIT_WINDOW: 'LEGAL_UNIT_WINDOW',
  LEGAL_CARTOGRAPHY_REFERENCE: 'LEGAL_CARTOGRAPHY_REFERENCE'
});

export const STAGE6C_ALIGNMENT_STATUS = Object.freeze({
  MATCHED_PRODUCT_AND_LEGAL_DATA_FLOW: 'MATCHED_PRODUCT_AND_LEGAL_DATA_FLOW',
  PRODUCT_OBSERVED_BUT_LEGAL_SOURCE_SILENT: 'PRODUCT_OBSERVED_BUT_LEGAL_SOURCE_SILENT',
  LEGAL_GOVERNANCE_CONTROL_WITHOUT_PRODUCT_FLOW: 'LEGAL_GOVERNANCE_CONTROL_WITHOUT_PRODUCT_FLOW',
  CONFLICT_PRODUCT_VS_LEGAL_DISCLOSURE: 'CONFLICT_PRODUCT_VS_LEGAL_DISCLOSURE',
  INSUFFICIENT_EVIDENCE_TO_ALIGN: 'INSUFFICIENT_EVIDENCE_TO_ALIGN',
  OUT_OF_SCOPE_FOR_DATA_PROVENANCE: 'OUT_OF_SCOPE_FOR_DATA_PROVENANCE'
});

export const STAGE6_FIELD_DERIVATION_RULES = Object.freeze({
  stage6a: {
    primary_evidence_field: 'clean_text_lossless',
    output_profile: 'legal_cartography',
    legal_unit_source: 'verbatim source window with offsets and source_sha256',
    forbidden_windowing: 'source-level capped first-N-character windows',
    reinvestigation_trigger: 'weak clause classification or suspiciously missing legal unit coverage'
  },
  stage6b: {
    primary_evidence_field: 'legal/governance clean_text_lossless through legal-unit windows',
    output_profile: 'legal_governance_data_provenance_profile',
    row_spine: 'legal/governance source-derived findings only',
    forbidden_row_spine: 'Stage 5 data_provenance rows or target_feature_profile rows',
    reinvestigation_trigger: 'data/privacy/security/AI/provider/retention/transfer legal units with no findings'
  },
  stage6c: {
    primary_inputs: 'Stage 5 product-observed behavior + Stage 6B legal findings + Stage 6A cartography',
    output_profile: 'data_provenance_profile',
    allowed_new_rows: 'integration/alignment rows only',
    forbidden_new_facts: 'new legal findings or new product feature facts',
    reinvestigation_trigger: 'unattempted or weak product/legal alignment'
  },
  stage7_handoff: {
    primary_evidence: 'legal/governance lossless source + legal_cartography',
    secondary_references: 'target_profile + target_feature_profile + data_provenance_profile',
    contract_violation: 'Stage 7 receives only data_provenance_profile without legal/governance primary evidence'
  }
});

export const STAGE6_DATA_LANGUAGE_TERMS = Object.freeze([
  'personal information',
  'personal data',
  'user data',
  'customer data',
  'content',
  'input',
  'prompt',
  'output',
  'audio',
  'voice',
  'document',
  'file',
  'metadata',
  'log',
  'telemetry',
  'cookies',
  'device',
  'location',
  'embedding',
  'vector',
  'retrieval',
  'rag',
  'fine-tune',
  'fine tuning',
  'training',
  'model provider',
  'subprocessor',
  'processor',
  'controller',
  'retention',
  'delete',
  'deletion',
  'transfer',
  'international',
  'security',
  'breach',
  'consent',
  'rights',
  'automated decision',
  'minor',
  'children',
  'sensitive'
]);

export const STAGE6_FORBIDDEN_6B_BASIS_VALUES = Object.freeze([
  'stage5_feature_ref',
  'stage5_data_provenance',
  'stage5_data_provenance_seed',
  'deterministic_seed_from_target_feature_profile',
  'target_feature_profile_row_spine'
]);