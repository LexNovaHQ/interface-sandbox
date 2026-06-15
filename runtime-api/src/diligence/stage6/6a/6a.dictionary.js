import {
  STAGE6A_DOCUMENT_TYPE,
  STAGE6A_LEGAL_UNIT_TYPE,
  STAGE6_CONTROL_FAMILY,
  STAGE6_DATA_LANGUAGE_TERMS,
  STAGE6_REINVESTIGATION_ACTION,
  STAGE6_VALIDATION_STATUS
} from '../stage6.dictionary.js';

export { STAGE6A_LEGAL_UNIT_TYPE };

export const STAGE6A_RUNTIME_VERSION = 'stage6a_legal_cartography_v2';

export const STAGE6A_DOCUMENT_TYPE_KEYWORDS = Object.freeze([
  { type: STAGE6A_DOCUMENT_TYPE.PRIVACY_POLICY, terms: ['privacy policy', 'privacy notice', 'personal information', 'personal data'] },
  { type: STAGE6A_DOCUMENT_TYPE.TERMS_OF_SERVICE, terms: ['terms of service', 'terms and conditions', 'terms of use', 'user agreement'] },
  { type: STAGE6A_DOCUMENT_TYPE.DATA_PROCESSING_ADDENDUM, terms: ['data processing addendum', 'data processing agreement', 'dpa', 'processor'] },
  { type: STAGE6A_DOCUMENT_TYPE.SECURITY_PAGE, terms: ['security', 'encryption', 'incident', 'breach', 'access controls'] },
  { type: STAGE6A_DOCUMENT_TYPE.TRUST_CENTER, terms: ['trust center', 'trust', 'compliance', 'security and privacy'] },
  { type: STAGE6A_DOCUMENT_TYPE.SUBPROCESSOR_LIST, terms: ['subprocessor', 'sub-processor', 'service provider', 'third-party provider'] },
  { type: STAGE6A_DOCUMENT_TYPE.AI_POLICY, terms: ['ai policy', 'artificial intelligence', 'machine learning', 'model'] },
  { type: STAGE6A_DOCUMENT_TYPE.RESPONSIBLE_AI_POLICY, terms: ['responsible ai', 'ai governance', 'model safety', 'ai principles'] },
  { type: STAGE6A_DOCUMENT_TYPE.COOKIE_POLICY, terms: ['cookie policy', 'cookies', 'tracking technologies'] },
  { type: STAGE6A_DOCUMENT_TYPE.ACCEPTABLE_USE_POLICY, terms: ['acceptable use', 'prohibited use', 'aup'] },
  { type: STAGE6A_DOCUMENT_TYPE.GOVERNANCE_PAGE, terms: ['governance', 'policy governance', 'controls'] }
]);

export const STAGE6A_LEGAL_UNIT_CLASSIFIERS = Object.freeze([
  {
    unit_type: STAGE6A_LEGAL_UNIT_TYPE.DATA_COLLECTION_CLAUSE,
    control_family: STAGE6_CONTROL_FAMILY.DATA_COLLECTION,
    terms: ['collect', 'information we collect', 'personal information', 'personal data', 'provide information', 'user data']
  },
  {
    unit_type: STAGE6A_LEGAL_UNIT_TYPE.DATA_PROCESSING_CLAUSE,
    control_family: STAGE6_CONTROL_FAMILY.DATA_PROCESSING,
    terms: ['process', 'processing', 'use your information', 'use personal data', 'service delivery', 'provide the service']
  },
  {
    unit_type: STAGE6A_LEGAL_UNIT_TYPE.AI_MODEL_TREATMENT_CLAUSE,
    control_family: STAGE6_CONTROL_FAMILY.AI_MODEL_USAGE,
    terms: ['artificial intelligence', 'ai', 'model', 'machine learning', 'llm', 'large language model', 'model provider']
  },
  {
    unit_type: STAGE6A_LEGAL_UNIT_TYPE.TRAINING_FINE_TUNING_CLAUSE,
    control_family: STAGE6_CONTROL_FAMILY.TRAINING_FINE_TUNING,
    terms: ['train', 'training', 'fine-tune', 'fine tuning', 'improve our models', 'model improvement']
  },
  {
    unit_type: STAGE6A_LEGAL_UNIT_TYPE.RETENTION_DELETION_CLAUSE,
    control_family: STAGE6_CONTROL_FAMILY.RETENTION_DELETION,
    terms: ['retain', 'retention', 'delete', 'deletion', 'erase', 'storage period']
  },
  {
    unit_type: STAGE6A_LEGAL_UNIT_TYPE.SUBPROCESSOR_CLAUSE,
    control_family: STAGE6_CONTROL_FAMILY.SUBPROCESSORS,
    terms: ['subprocessor', 'sub-processor', 'service provider', 'vendors', 'third party provider']
  },
  {
    unit_type: STAGE6A_LEGAL_UNIT_TYPE.INTERNATIONAL_TRANSFER_CLAUSE,
    control_family: STAGE6_CONTROL_FAMILY.INTERNATIONAL_TRANSFERS,
    terms: ['international transfer', 'transfer', 'outside your country', 'standard contractual clauses', 'scc', 'cross-border']
  },
  {
    unit_type: STAGE6A_LEGAL_UNIT_TYPE.SECURITY_MEASURES_CLAUSE,
    control_family: STAGE6_CONTROL_FAMILY.SECURITY,
    terms: ['security', 'encryption', 'access control', 'technical and organizational measures', 'tom', 'protect']
  },
  {
    unit_type: STAGE6A_LEGAL_UNIT_TYPE.BREACH_NOTIFICATION_CLAUSE,
    control_family: STAGE6_CONTROL_FAMILY.BREACH,
    terms: ['breach', 'security incident', 'incident notification', 'unauthorized access']
  },
  {
    unit_type: STAGE6A_LEGAL_UNIT_TYPE.CONTROLLER_PROCESSOR_ROLE_CLAUSE,
    control_family: STAGE6_CONTROL_FAMILY.CONTROLLER_PROCESSOR_ROLE,
    terms: ['controller', 'processor', 'business associate', 'service provider role']
  },
  {
    unit_type: STAGE6A_LEGAL_UNIT_TYPE.AUTOMATED_DECISIONING_CLAUSE,
    control_family: STAGE6_CONTROL_FAMILY.AUTOMATED_DECISIONING,
    terms: ['automated decision', 'profiling', 'solely automated', 'algorithmic decision']
  },
  {
    unit_type: STAGE6A_LEGAL_UNIT_TYPE.SENSITIVE_MINOR_DATA_CLAUSE,
    control_family: STAGE6_CONTROL_FAMILY.SENSITIVE_MINOR_DATA,
    terms: ['sensitive', 'children', 'minor', 'health', 'biometric', 'special category']
  },
  {
    unit_type: STAGE6A_LEGAL_UNIT_TYPE.RIGHTS_NOTICE_CONSENT_CLAUSE,
    control_family: STAGE6_CONTROL_FAMILY.RIGHTS_NOTICE_CONSENT,
    terms: ['rights', 'consent', 'access', 'rectification', 'opt out', 'withdraw consent', 'delete your data']
  },
  {
    unit_type: STAGE6A_LEGAL_UNIT_TYPE.LIMITATION_DISCLAIMER_CLAUSE,
    control_family: STAGE6_CONTROL_FAMILY.LIMITATION_DISCLAIMER,
    terms: ['disclaimer', 'limitation of liability', 'as is', 'warranty', 'indemnity']
  },
  {
    unit_type: STAGE6A_LEGAL_UNIT_TYPE.GOVERNANCE_CONTROL_CLAUSE,
    control_family: STAGE6_CONTROL_FAMILY.GOVERNANCE_ARCHITECTURE,
    terms: ['policy', 'governance', 'compliance', 'audit', 'risk management', 'oversight']
  }
]);

export const STAGE6A_HEADING_PATTERNS = Object.freeze([
  /^\s{0,4}(#{1,6})\s+(.+)$/gm,
  /^\s{0,4}(\d+(?:\.\d+)*\.?)[\s\t]+([^\n]{3,160})$/gm,
  /^\s{0,4}([A-Z][A-Z0-9 ,/&():'’-]{6,160})\s*$/gm
]);

export const STAGE6A_FIELD_DERIVATION = Object.freeze({
  legal_document_id: 'LDOC index generated from canonical legal/governance source order.',
  legal_unit_id: 'LUNIT index generated from exact heading/section or fallback full-document legal unit.',
  document_type: 'Derived from URL/title/text keyword match. UNKNOWN if not evidenced.',
  unit_type: 'Derived from legal-unit-specific verbatim text using controlled legal unit classifiers.',
  control_family: 'Derived from unit_type through controlled STAGE6_CONTROL_FAMILY values.',
  heading_text: 'Exact heading text if detected. Empty string if fallback full-document legal unit.',
  char_start: 'Exact character start in clean_text_lossless.',
  char_end: 'Exact character end in clean_text_lossless.',
  verbatim_text: 'Exact substring clean_text_lossless.slice(char_start, char_end).',
  source_sha256: 'SHA-256 of full clean_text_lossless, not the window.'
});

export const STAGE6A_REINVESTIGATION_RULES = Object.freeze([
  {
    trigger: 'LEGAL_UNIT_TOO_LONG_WITH_MULTIPLE_DATA_TERMS',
    status: STAGE6_VALIDATION_STATUS.REINVESTIGATE_REQUIRED,
    action: STAGE6_REINVESTIGATION_ACTION.SPLIT_LEGAL_UNIT,
    reason: 'A legal unit is too broad and contains multiple data/legal concepts that should be split.'
  },
  {
    trigger: 'DATA_LANGUAGE_UNCLASSIFIED',
    status: STAGE6_VALIDATION_STATUS.REINVESTIGATE_REQUIRED,
    action: STAGE6_REINVESTIGATION_ACTION.RERUN_LEGAL_UNIT_CLASSIFICATION,
    reason: 'A legal unit contains data/privacy/security/AI language but remains UNKNOWN or generic.'
  },
  {
    trigger: 'WINDOW_TOO_NARROW',
    status: STAGE6_VALIDATION_STATUS.REINVESTIGATE_REQUIRED,
    action: STAGE6_REINVESTIGATION_ACTION.EXPAND_LEGAL_UNIT_WINDOW,
    reason: 'A legal unit may have incomplete context because the detected boundary is too narrow.'
  }
]);

export function termsPresent(text = '', terms = []) {
  const lower = String(text || '').toLowerCase();
  return terms.filter((term) => lower.includes(term.toLowerCase()));
}

export function containsStage6DataLanguage(text = '') {
  return termsPresent(text, STAGE6_DATA_LANGUAGE_TERMS).length > 0;
}
