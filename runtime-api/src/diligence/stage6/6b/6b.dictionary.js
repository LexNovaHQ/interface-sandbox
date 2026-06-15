import {
  STAGE6B_FINDING_TYPE,
  STAGE6B_SOURCE_BASIS,
  STAGE6_CONTROL_FAMILY,
  STAGE6_DATA_LANGUAGE_TERMS,
  STAGE6_REINVESTIGATION_ACTION,
  STAGE6_VALIDATION_STATUS
} from '../stage6.dictionary.js';

export const STAGE6B_RUNTIME_VERSION = 'stage6b_legal_governance_data_provenance_v2';

export { STAGE6B_FINDING_TYPE, STAGE6B_SOURCE_BASIS, STAGE6_REINVESTIGATION_ACTION, STAGE6_VALIDATION_STATUS };

export const STAGE6B_EXPLICITNESS = Object.freeze({
  EXPLICIT: 'EXPLICIT',
  IMPLIED_BY_LEGAL_UNIT: 'IMPLIED_BY_LEGAL_UNIT',
  NOT_EVIDENCED: 'NOT_EVIDENCED',
  UNKNOWN: 'UNKNOWN'
});

export const STAGE6B_DATA_CATEGORY = Object.freeze({
  PERSONAL_DATA: 'personal_data',
  CUSTOMER_DATA: 'customer_data',
  USER_INPUT_DATA: 'user_input_data',
  PROMPT_INPUT_DATA: 'prompt_input_data',
  AI_OUTPUT_DATA: 'ai_output_data',
  CONTENT_DATA: 'content_data',
  AUDIO_VOICE_DATA: 'audio_voice_data',
  DOCUMENT_FILE_DATA: 'document_file_data',
  USAGE_TELEMETRY_LOG_DATA: 'usage_telemetry_log_data',
  DEVICE_COOKIE_METADATA: 'device_cookie_metadata',
  LOCATION_DATA: 'location_data',
  SENSITIVE_DATA: 'sensitive_data',
  MINOR_CHILD_DATA: 'minor_child_data',
  SECURITY_BREACH_DATA: 'security_breach_data',
  SUBPROCESSOR_PROCESSING_DATA: 'subprocessor_processing_data',
  INTERNATIONAL_TRANSFER_DATA: 'international_transfer_data',
  UNKNOWN: 'UNKNOWN'
});

export const STAGE6B_DATA_SUBJECT = Object.freeze({
  END_USER: 'end_user',
  CUSTOMER: 'customer',
  WEBSITE_VISITOR: 'website_visitor',
  EMPLOYEE_OR_REPRESENTATIVE: 'employee_or_representative',
  CHILD_OR_MINOR: 'child_or_minor',
  DATA_SUBJECT: 'data_subject',
  UNKNOWN: 'UNKNOWN'
});

export const STAGE6B_PROCESSING_CONTEXT = Object.freeze({
  SERVICE_DELIVERY: 'service_delivery',
  PRODUCT_FUNCTIONALITY: 'product_functionality',
  CUSTOMER_SUPPORT: 'customer_support',
  ANALYTICS_TELEMETRY: 'analytics_telemetry',
  SECURITY_FRAUD_ABUSE_PREVENTION: 'security_fraud_abuse_prevention',
  LEGAL_COMPLIANCE: 'legal_compliance',
  MARKETING_COMMUNICATIONS: 'marketing_communications',
  AI_MODEL_OPERATION: 'ai_model_operation',
  AI_MODEL_TRAINING_OR_IMPROVEMENT: 'ai_model_training_or_improvement',
  SUBPROCESSOR_SERVICE_DELIVERY: 'subprocessor_service_delivery',
  INTERNATIONAL_TRANSFER: 'international_transfer',
  RIGHTS_REQUEST_HANDLING: 'rights_request_handling',
  RETENTION_DELETION: 'retention_deletion',
  UNKNOWN: 'UNKNOWN'
});

export const STAGE6B_LEGAL_DATA_FINDING_RULES = Object.freeze([
  {
    rule_id: 'LGDP_RULE_COLLECTION',
    finding_type: STAGE6B_FINDING_TYPE.DATA_COLLECTION_DISCLOSURE,
    control_family_hints: [STAGE6_CONTROL_FAMILY.DATA_COLLECTION, STAGE6_CONTROL_FAMILY.PRIVACY_NOTICE],
    terms: ['collect', 'collection', 'information we collect', 'data we collect', 'personal information', 'personal data', 'provide information', 'information you provide'],
    data_category: STAGE6B_DATA_CATEGORY.PERSONAL_DATA,
    data_subject: STAGE6B_DATA_SUBJECT.DATA_SUBJECT,
    declared_action: 'collects or receives data described in the legal/governance source',
    processing_context: STAGE6B_PROCESSING_CONTEXT.SERVICE_DELIVERY
  },
  {
    rule_id: 'LGDP_RULE_PROCESSING_USE',
    finding_type: STAGE6B_FINDING_TYPE.DATA_PROCESSING_DISCLOSURE,
    control_family_hints: [STAGE6_CONTROL_FAMILY.DATA_PROCESSING],
    terms: ['use your information', 'use personal data', 'process personal data', 'processing of personal data', 'process your information', 'provide the service', 'operate the service'],
    data_category: STAGE6B_DATA_CATEGORY.PERSONAL_DATA,
    data_subject: STAGE6B_DATA_SUBJECT.DATA_SUBJECT,
    declared_action: 'uses or processes data for declared purposes',
    processing_context: STAGE6B_PROCESSING_CONTEXT.SERVICE_DELIVERY
  },
  {
    rule_id: 'LGDP_RULE_PROMPT_INPUT_OUTPUT',
    finding_type: STAGE6B_FINDING_TYPE.PROMPT_INPUT_OUTPUT_TREATMENT,
    control_family_hints: [STAGE6_CONTROL_FAMILY.AI_OUTPUT_INPUT_TREATMENT, STAGE6_CONTROL_FAMILY.AI_MODEL_USAGE],
    terms: ['prompt', 'input', 'output', 'generated output', 'ai output', 'model output', 'user input', 'customer input', 'content submitted', 'submitted content'],
    data_category: STAGE6B_DATA_CATEGORY.PROMPT_INPUT_DATA,
    data_subject: STAGE6B_DATA_SUBJECT.END_USER,
    declared_action: 'describes treatment of prompts, inputs, submitted content, or AI outputs',
    processing_context: STAGE6B_PROCESSING_CONTEXT.AI_MODEL_OPERATION
  },
  {
    rule_id: 'LGDP_RULE_AI_MODEL_PROVIDER',
    finding_type: STAGE6B_FINDING_TYPE.AI_MODEL_PROVIDER_TREATMENT,
    control_family_hints: [STAGE6_CONTROL_FAMILY.AI_MODEL_USAGE],
    terms: ['ai model', 'model provider', 'large language model', 'llm', 'third-party ai', 'artificial intelligence', 'machine learning', 'automated systems', 'model service'],
    data_category: STAGE6B_DATA_CATEGORY.USER_INPUT_DATA,
    data_subject: STAGE6B_DATA_SUBJECT.END_USER,
    declared_action: 'describes AI/model provider or AI system data treatment',
    processing_context: STAGE6B_PROCESSING_CONTEXT.AI_MODEL_OPERATION
  },
  {
    rule_id: 'LGDP_RULE_EMBEDDING_RAG',
    finding_type: STAGE6B_FINDING_TYPE.EMBEDDING_OR_RAG_DISCLOSURE,
    control_family_hints: [STAGE6_CONTROL_FAMILY.AI_MODEL_USAGE],
    terms: ['embedding', 'embeddings', 'vector', 'vectors', 'retrieval', 'retrieval augmented', 'rag', 'knowledge base', 'semantic search'],
    data_category: STAGE6B_DATA_CATEGORY.CONTENT_DATA,
    data_subject: STAGE6B_DATA_SUBJECT.CUSTOMER,
    declared_action: 'describes embeddings, vector storage, retrieval, or RAG-style processing',
    processing_context: STAGE6B_PROCESSING_CONTEXT.AI_MODEL_OPERATION
  },
  {
    rule_id: 'LGDP_RULE_TRAINING_FINE_TUNING',
    finding_type: STAGE6B_FINDING_TYPE.TRAINING_FINE_TUNING_DISCLOSURE,
    control_family_hints: [STAGE6_CONTROL_FAMILY.TRAINING_FINE_TUNING],
    terms: ['train', 'training', 'fine-tune', 'fine tune', 'fine-tuning', 'improve our models', 'improve the model', 'model improvement', 'not use your data to train'],
    data_category: STAGE6B_DATA_CATEGORY.CUSTOMER_DATA,
    data_subject: STAGE6B_DATA_SUBJECT.CUSTOMER,
    declared_action: 'describes whether data is used for training, fine-tuning, or model improvement',
    processing_context: STAGE6B_PROCESSING_CONTEXT.AI_MODEL_TRAINING_OR_IMPROVEMENT
  },
  {
    rule_id: 'LGDP_RULE_RETENTION_DELETION',
    finding_type: STAGE6B_FINDING_TYPE.RETENTION_DELETION_DISCLOSURE,
    control_family_hints: [STAGE6_CONTROL_FAMILY.RETENTION_DELETION],
    terms: ['retain', 'retention', 'delete', 'deletion', 'erasure', 'remove your data', 'data deletion', 'data retention', 'kept for', 'stored for'],
    data_category: STAGE6B_DATA_CATEGORY.PERSONAL_DATA,
    data_subject: STAGE6B_DATA_SUBJECT.DATA_SUBJECT,
    declared_action: 'describes data retention, deletion, erasure, or storage duration',
    processing_context: STAGE6B_PROCESSING_CONTEXT.RETENTION_DELETION
  },
  {
    rule_id: 'LGDP_RULE_SUBPROCESSOR',
    finding_type: STAGE6B_FINDING_TYPE.SUBPROCESSOR_DISCLOSURE,
    control_family_hints: [STAGE6_CONTROL_FAMILY.SUBPROCESSORS],
    terms: ['subprocessor', 'sub-processors', 'service provider', 'processors', 'vendors', 'third party service providers', 'third-party service providers', 'subcontractor'],
    data_category: STAGE6B_DATA_CATEGORY.SUBPROCESSOR_PROCESSING_DATA,
    data_subject: STAGE6B_DATA_SUBJECT.CUSTOMER,
    declared_action: 'describes subprocessors, vendors, processors, or service providers handling data',
    processing_context: STAGE6B_PROCESSING_CONTEXT.SUBPROCESSOR_SERVICE_DELIVERY
  },
  {
    rule_id: 'LGDP_RULE_TRANSFER',
    finding_type: STAGE6B_FINDING_TYPE.INTERNATIONAL_TRANSFER_DISCLOSURE,
    control_family_hints: [STAGE6_CONTROL_FAMILY.INTERNATIONAL_TRANSFERS],
    terms: ['international transfer', 'transfer your information', 'transferred to', 'outside your country', 'standard contractual clauses', 'scc', 'adequacy', 'data transfer'],
    data_category: STAGE6B_DATA_CATEGORY.INTERNATIONAL_TRANSFER_DATA,
    data_subject: STAGE6B_DATA_SUBJECT.DATA_SUBJECT,
    declared_action: 'describes international transfer, cross-border processing, or transfer safeguards',
    processing_context: STAGE6B_PROCESSING_CONTEXT.INTERNATIONAL_TRANSFER
  },
  {
    rule_id: 'LGDP_RULE_SECURITY_BREACH',
    finding_type: STAGE6B_FINDING_TYPE.SECURITY_BREACH_DISCLOSURE,
    control_family_hints: [STAGE6_CONTROL_FAMILY.SECURITY, STAGE6_CONTROL_FAMILY.BREACH],
    terms: ['security', 'technical and organisational measures', 'technical and organizational measures', 'tom', 'encryption', 'access control', 'breach', 'incident', 'unauthorized access', 'confidentiality'],
    data_category: STAGE6B_DATA_CATEGORY.SECURITY_BREACH_DATA,
    data_subject: STAGE6B_DATA_SUBJECT.DATA_SUBJECT,
    declared_action: 'describes security measures, confidentiality controls, or breach/incident handling',
    processing_context: STAGE6B_PROCESSING_CONTEXT.SECURITY_FRAUD_ABUSE_PREVENTION
  },
  {
    rule_id: 'LGDP_RULE_CONTROLLER_PROCESSOR',
    finding_type: STAGE6B_FINDING_TYPE.CONTROLLER_PROCESSOR_ROLE_DISCLOSURE,
    control_family_hints: [STAGE6_CONTROL_FAMILY.CONTROLLER_PROCESSOR_ROLE],
    terms: ['controller', 'processor', 'business', 'service provider', 'process on behalf', 'data controller', 'data processor'],
    data_category: STAGE6B_DATA_CATEGORY.PERSONAL_DATA,
    data_subject: STAGE6B_DATA_SUBJECT.DATA_SUBJECT,
    declared_action: 'describes controller/processor or equivalent privacy role allocation',
    processing_context: STAGE6B_PROCESSING_CONTEXT.LEGAL_COMPLIANCE
  },
  {
    rule_id: 'LGDP_RULE_AUTOMATED_DECISIONING',
    finding_type: STAGE6B_FINDING_TYPE.AUTOMATED_DECISIONING_DISCLOSURE,
    control_family_hints: [STAGE6_CONTROL_FAMILY.AUTOMATED_DECISIONING],
    terms: ['automated decision', 'automated decision-making', 'profiling', 'solely automated', 'meaningful information about the logic'],
    data_category: STAGE6B_DATA_CATEGORY.PERSONAL_DATA,
    data_subject: STAGE6B_DATA_SUBJECT.DATA_SUBJECT,
    declared_action: 'describes automated decisioning or profiling disclosures',
    processing_context: STAGE6B_PROCESSING_CONTEXT.LEGAL_COMPLIANCE
  },
  {
    rule_id: 'LGDP_RULE_SENSITIVE_MINOR',
    finding_type: STAGE6B_FINDING_TYPE.SENSITIVE_MINOR_DATA_DISCLOSURE,
    control_family_hints: [STAGE6_CONTROL_FAMILY.SENSITIVE_MINOR_DATA],
    terms: ['sensitive personal', 'special category', 'children', 'child', 'minor', 'under 13', 'under 16', 'biometric', 'health data'],
    data_category: STAGE6B_DATA_CATEGORY.SENSITIVE_DATA,
    data_subject: STAGE6B_DATA_SUBJECT.CHILD_OR_MINOR,
    declared_action: 'describes sensitive data or children/minors data handling',
    processing_context: STAGE6B_PROCESSING_CONTEXT.LEGAL_COMPLIANCE
  },
  {
    rule_id: 'LGDP_RULE_RIGHTS_NOTICE_CONSENT',
    finding_type: STAGE6B_FINDING_TYPE.RIGHTS_NOTICE_CONSENT_DISCLOSURE,
    control_family_hints: [STAGE6_CONTROL_FAMILY.RIGHTS_NOTICE_CONSENT],
    terms: ['rights', 'access', 'correct', 'rectify', 'delete', 'object', 'opt out', 'consent', 'withdraw consent', 'data subject request'],
    data_category: STAGE6B_DATA_CATEGORY.PERSONAL_DATA,
    data_subject: STAGE6B_DATA_SUBJECT.DATA_SUBJECT,
    declared_action: 'describes data subject rights, notices, choices, or consent mechanics',
    processing_context: STAGE6B_PROCESSING_CONTEXT.RIGHTS_REQUEST_HANDLING
  }
]);

export const STAGE6B_REQUIRED_COVERAGE_RULES = Object.freeze([
  {
    trigger: 'AI_OR_MODEL_LANGUAGE_PRESENT',
    terms: ['ai model', 'artificial intelligence', 'machine learning', 'llm', 'model provider', 'prompt', 'output', 'training', 'fine-tune', 'embedding', 'rag'],
    expected_finding_types: [
      STAGE6B_FINDING_TYPE.AI_MODEL_PROVIDER_TREATMENT,
      STAGE6B_FINDING_TYPE.PROMPT_INPUT_OUTPUT_TREATMENT,
      STAGE6B_FINDING_TYPE.TRAINING_FINE_TUNING_DISCLOSURE,
      STAGE6B_FINDING_TYPE.EMBEDDING_OR_RAG_DISCLOSURE
    ]
  },
  {
    trigger: 'RETENTION_OR_DELETION_LANGUAGE_PRESENT',
    terms: ['retain', 'retention', 'delete', 'deletion', 'erasure', 'stored for'],
    expected_finding_types: [STAGE6B_FINDING_TYPE.RETENTION_DELETION_DISCLOSURE]
  },
  {
    trigger: 'SUBPROCESSOR_OR_VENDOR_LANGUAGE_PRESENT',
    terms: ['subprocessor', 'service provider', 'vendor', 'processor', 'third-party service provider'],
    expected_finding_types: [STAGE6B_FINDING_TYPE.SUBPROCESSOR_DISCLOSURE]
  },
  {
    trigger: 'TRANSFER_LANGUAGE_PRESENT',
    terms: ['international transfer', 'standard contractual clauses', 'scc', 'outside your country', 'cross-border'],
    expected_finding_types: [STAGE6B_FINDING_TYPE.INTERNATIONAL_TRANSFER_DISCLOSURE]
  },
  {
    trigger: 'SECURITY_OR_BREACH_LANGUAGE_PRESENT',
    terms: ['security', 'encryption', 'access control', 'breach', 'incident', 'unauthorized access'],
    expected_finding_types: [STAGE6B_FINDING_TYPE.SECURITY_BREACH_DISCLOSURE]
  }
]);

export function termsPresent(text = '', terms = []) {
  const haystack = String(text || '').toLowerCase();
  return terms.filter((term) => haystack.includes(String(term).toLowerCase()));
}

export function hasStage6BDataProvenanceLanguage(text = '') {
  return STAGE6_DATA_LANGUAGE_TERMS.some((term) => String(text || '').toLowerCase().includes(term.toLowerCase()));
}
