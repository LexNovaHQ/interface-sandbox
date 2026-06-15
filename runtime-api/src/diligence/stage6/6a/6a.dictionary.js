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

export const STAGE6A_STRUCTURAL_MARKER_TYPE = Object.freeze({
  MARKDOWN_HEADING: 'MARKDOWN_HEADING',
  NUMBERED_HEADING: 'NUMBERED_HEADING',
  ALL_CAPS_HEADING: 'ALL_CAPS_HEADING',
  PART: 'PART',
  CHAPTER: 'CHAPTER',
  ARTICLE: 'ARTICLE',
  SECTION: 'SECTION',
  CLAUSE: 'CLAUSE',
  SCHEDULE: 'SCHEDULE',
  ANNEX: 'ANNEX',
  ANNEXURE: 'ANNEXURE',
  APPENDIX: 'APPENDIX',
  EXHIBIT: 'EXHIBIT',
  ATTACHMENT: 'ATTACHMENT',
  ADDENDUM: 'ADDENDUM',
  RIDER: 'RIDER',
  ORDER_FORM: 'ORDER_FORM',
  STATEMENT_OF_WORK: 'STATEMENT_OF_WORK',
  DATA_PROCESSING_ADDENDUM: 'DATA_PROCESSING_ADDENDUM',
  STANDARD_CONTRACTUAL_CLAUSES: 'STANDARD_CONTRACTUAL_CLAUSES',
  TECHNICAL_ORGANISATIONAL_MEASURES: 'TECHNICAL_ORGANISATIONAL_MEASURES',
  SUBPROCESSOR_TABLE: 'SUBPROCESSOR_TABLE',
  PROCESSING_DETAILS: 'PROCESSING_DETAILS',
  TRANSFER_DETAILS: 'TRANSFER_DETAILS',
  SECURITY_MEASURES: 'SECURITY_MEASURES',
  RETENTION_SCHEDULE: 'RETENTION_SCHEDULE',
  TABLE_OR_LIST: 'TABLE_OR_LIST',
  FULL_DOCUMENT_FALLBACK: 'FULL_DOCUMENT_FALLBACK'
});

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
    terms: ['security', 'encryption', 'access control', 'technical and organizational measures', 'technical and organisational measures', 'tom', 'toms', 'protect']
  },
  {
    unit_type: STAGE6A_LEGAL_UNIT_TYPE.BREACH_NOTIFICATION_CLAUSE,
    control_family: STAGE6_CONTROL_FAMILY.BREACH,
    terms: ['breach', 'security incident', 'incident notification', 'unauthorized access', 'unauthorised access']
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
  { marker_type: STAGE6A_STRUCTURAL_MARKER_TYPE.MARKDOWN_HEADING, expression: /^\s{0,4}(#{1,6})\s+(?<heading>.+)$/gm, priority: 40 },
  { marker_type: STAGE6A_STRUCTURAL_MARKER_TYPE.NUMBERED_HEADING, expression: /^\s{0,4}(?<marker>\d+(?:\.\d+)*\.?)\s+[\t ]+(?<heading>[^\n]{3,180})$/gm, priority: 45 },
  { marker_type: STAGE6A_STRUCTURAL_MARKER_TYPE.ALL_CAPS_HEADING, expression: /^\s{0,4}(?<heading>[A-Z][A-Z0-9 ,/&():'’-]{6,180})\s*$/gm, priority: 20 }
]);

export const STAGE6A_STRUCTURAL_MARKER_PATTERNS = Object.freeze([
  { marker_type: STAGE6A_STRUCTURAL_MARKER_TYPE.PART, expression: /^\s{0,4}(?<marker>PART\s+[A-Z0-9IVXLC]+)\s*[:.\-–—]?\s*(?<heading>[^\n]{0,180})$/gim, priority: 90 },
  { marker_type: STAGE6A_STRUCTURAL_MARKER_TYPE.CHAPTER, expression: /^\s{0,4}(?<marker>CHAPTER\s+[A-Z0-9IVXLC]+)\s*[:.\-–—]?\s*(?<heading>[^\n]{0,180})$/gim, priority: 88 },
  { marker_type: STAGE6A_STRUCTURAL_MARKER_TYPE.ARTICLE, expression: /^\s{0,4}(?<marker>ARTICLE\s+[A-Z0-9IVXLC]+)\s*[:.\-–—]?\s*(?<heading>[^\n]{0,180})$/gim, priority: 86 },
  { marker_type: STAGE6A_STRUCTURAL_MARKER_TYPE.SECTION, expression: /^\s{0,4}(?<marker>SECTION\s+\d+(?:\.\d+)*)\s*[:.\-–—]?\s*(?<heading>[^\n]{0,180})$/gim, priority: 82 },
  { marker_type: STAGE6A_STRUCTURAL_MARKER_TYPE.CLAUSE, expression: /^\s{0,4}(?<marker>CLAUSE\s+\d+(?:\.\d+)*)\s*[:.\-–—]?\s*(?<heading>[^\n]{0,180})$/gim, priority: 80 },
  { marker_type: STAGE6A_STRUCTURAL_MARKER_TYPE.SCHEDULE, expression: /^\s{0,4}(?<marker>SCHEDULE\s+[A-Z0-9IVXLC]+)\s*[:.\-–—]?\s*(?<heading>[^\n]{0,220})$/gim, priority: 100 },
  { marker_type: STAGE6A_STRUCTURAL_MARKER_TYPE.ANNEXURE, expression: /^\s{0,4}(?<marker>ANNEXURE\s+[A-Z0-9IVXLC]+)\s*[:.\-–—]?\s*(?<heading>[^\n]{0,220})$/gim, priority: 100 },
  { marker_type: STAGE6A_STRUCTURAL_MARKER_TYPE.ANNEX, expression: /^\s{0,4}(?<marker>ANNEX\s+[A-Z0-9IVXLC]+)\s*[:.\-–—]?\s*(?<heading>[^\n]{0,220})$/gim, priority: 99 },
  { marker_type: STAGE6A_STRUCTURAL_MARKER_TYPE.APPENDIX, expression: /^\s{0,4}(?<marker>APPENDIX\s+[A-Z0-9IVXLC]+)\s*[:.\-–—]?\s*(?<heading>[^\n]{0,220})$/gim, priority: 98 },
  { marker_type: STAGE6A_STRUCTURAL_MARKER_TYPE.EXHIBIT, expression: /^\s{0,4}(?<marker>EXHIBIT\s+[A-Z0-9IVXLC]+)\s*[:.\-–—]?\s*(?<heading>[^\n]{0,220})$/gim, priority: 98 },
  { marker_type: STAGE6A_STRUCTURAL_MARKER_TYPE.ATTACHMENT, expression: /^\s{0,4}(?<marker>ATTACHMENT\s+[A-Z0-9IVXLC]+)\s*[:.\-–—]?\s*(?<heading>[^\n]{0,220})$/gim, priority: 97 },
  { marker_type: STAGE6A_STRUCTURAL_MARKER_TYPE.ADDENDUM, expression: /^\s{0,4}(?<marker>ADDENDUM\s+[A-Z0-9IVXLC]+|DATA\s+PROCESSING\s+ADDENDUM)\s*[:.\-–—]?\s*(?<heading>[^\n]{0,220})$/gim, priority: 97 },
  { marker_type: STAGE6A_STRUCTURAL_MARKER_TYPE.RIDER, expression: /^\s{0,4}(?<marker>RIDER\s+[A-Z0-9IVXLC]+)\s*[:.\-–—]?\s*(?<heading>[^\n]{0,220})$/gim, priority: 96 },
  { marker_type: STAGE6A_STRUCTURAL_MARKER_TYPE.ORDER_FORM, expression: /^\s{0,4}(?<marker>ORDER\s+FORM)\s*[:.\-–—]?\s*(?<heading>[^\n]{0,220})$/gim, priority: 95 },
  { marker_type: STAGE6A_STRUCTURAL_MARKER_TYPE.STATEMENT_OF_WORK, expression: /^\s{0,4}(?<marker>STATEMENT\s+OF\s+WORK|SOW)\s*[:.\-–—]?\s*(?<heading>[^\n]{0,220})$/gim, priority: 95 },
  { marker_type: STAGE6A_STRUCTURAL_MARKER_TYPE.DATA_PROCESSING_ADDENDUM, expression: /^\s{0,4}(?<marker>DATA\s+PROCESSING\s+(?:ADDENDUM|AGREEMENT)|DPA)\s*[:.\-–—]?\s*(?<heading>[^\n]{0,220})$/gim, priority: 100 },
  { marker_type: STAGE6A_STRUCTURAL_MARKER_TYPE.STANDARD_CONTRACTUAL_CLAUSES, expression: /^\s{0,4}(?<marker>STANDARD\s+CONTRACTUAL\s+CLAUSES|SCC(?:s)?|MODULE\s+[A-Z0-9IVXLC]+)\s*[:.\-–—]?\s*(?<heading>[^\n]{0,220})$/gim, priority: 100 },
  { marker_type: STAGE6A_STRUCTURAL_MARKER_TYPE.TECHNICAL_ORGANISATIONAL_MEASURES, expression: /^\s{0,4}(?<marker>TECHNICAL\s+AND\s+ORGANI[ZS]ATIONAL\s+MEASURES|TOMs?)\s*[:.\-–—]?\s*(?<heading>[^\n]{0,220})$/gim, priority: 100 },
  { marker_type: STAGE6A_STRUCTURAL_MARKER_TYPE.SUBPROCESSOR_TABLE, expression: /^\s{0,4}(?<marker>SUB[-\s]?PROCESSORS?|SERVICE\s+PROVIDERS?)\s*[:.\-–—]?\s*(?<heading>[^\n]{0,220})$/gim, priority: 99 },
  { marker_type: STAGE6A_STRUCTURAL_MARKER_TYPE.PROCESSING_DETAILS, expression: /^\s{0,4}(?<marker>PROCESSING\s+DETAILS|DETAILS\s+OF\s+PROCESSING|PROCESSING\s+ACTIVITIES)\s*[:.\-–—]?\s*(?<heading>[^\n]{0,220})$/gim, priority: 99 },
  { marker_type: STAGE6A_STRUCTURAL_MARKER_TYPE.TRANSFER_DETAILS, expression: /^\s{0,4}(?<marker>TRANSFER\s+DETAILS|INTERNATIONAL\s+TRANSFERS?|DATA\s+TRANSFERS?)\s*[:.\-–—]?\s*(?<heading>[^\n]{0,220})$/gim, priority: 98 },
  { marker_type: STAGE6A_STRUCTURAL_MARKER_TYPE.SECURITY_MEASURES, expression: /^\s{0,4}(?<marker>SECURITY\s+MEASURES|INFORMATION\s+SECURITY|SECURITY\s+CONTROLS?)\s*[:.\-–—]?\s*(?<heading>[^\n]{0,220})$/gim, priority: 98 },
  { marker_type: STAGE6A_STRUCTURAL_MARKER_TYPE.RETENTION_SCHEDULE, expression: /^\s{0,4}(?<marker>RETENTION\s+SCHEDULE|DATA\s+RETENTION)\s*[:.\-–—]?\s*(?<heading>[^\n]{0,220})$/gim, priority: 98 }
]);

export const STAGE6A_TABLE_LIST_MARKERS = Object.freeze([
  { marker_type: STAGE6A_STRUCTURAL_MARKER_TYPE.TABLE_OR_LIST, terms: ['|', '\t', 'subprocessor', 'processor', 'service provider', 'category of data', 'purpose of processing', 'retention period', 'technical measure', 'organisational measure', 'organizational measure'] }
]);

export const STAGE6A_STRUCTURAL_COVERAGE_RULES = Object.freeze([
  { trigger: 'SCHEDULE_MARKER_PRESENT', marker_types: [STAGE6A_STRUCTURAL_MARKER_TYPE.SCHEDULE], terms: ['schedule'] },
  { trigger: 'ANNEX_MARKER_PRESENT', marker_types: [STAGE6A_STRUCTURAL_MARKER_TYPE.ANNEX, STAGE6A_STRUCTURAL_MARKER_TYPE.ANNEXURE], terms: ['annex ', 'annexure'] },
  { trigger: 'APPENDIX_MARKER_PRESENT', marker_types: [STAGE6A_STRUCTURAL_MARKER_TYPE.APPENDIX], terms: ['appendix'] },
  { trigger: 'EXHIBIT_MARKER_PRESENT', marker_types: [STAGE6A_STRUCTURAL_MARKER_TYPE.EXHIBIT], terms: ['exhibit'] },
  { trigger: 'ATTACHMENT_MARKER_PRESENT', marker_types: [STAGE6A_STRUCTURAL_MARKER_TYPE.ATTACHMENT], terms: ['attachment'] },
  { trigger: 'ADDENDUM_MARKER_PRESENT', marker_types: [STAGE6A_STRUCTURAL_MARKER_TYPE.ADDENDUM, STAGE6A_STRUCTURAL_MARKER_TYPE.DATA_PROCESSING_ADDENDUM], terms: ['addendum', 'data processing addendum', 'data processing agreement', 'dpa'] },
  { trigger: 'SCC_MARKER_PRESENT', marker_types: [STAGE6A_STRUCTURAL_MARKER_TYPE.STANDARD_CONTRACTUAL_CLAUSES], terms: ['standard contractual clauses', 'scc', 'module one', 'module two', 'module three'] },
  { trigger: 'TOM_MARKER_PRESENT', marker_types: [STAGE6A_STRUCTURAL_MARKER_TYPE.TECHNICAL_ORGANISATIONAL_MEASURES, STAGE6A_STRUCTURAL_MARKER_TYPE.SECURITY_MEASURES], terms: ['technical and organisational measures', 'technical and organizational measures', 'toms', 'security measures'] },
  { trigger: 'SUBPROCESSOR_TABLE_PRESENT', marker_types: [STAGE6A_STRUCTURAL_MARKER_TYPE.SUBPROCESSOR_TABLE, STAGE6A_STRUCTURAL_MARKER_TYPE.TABLE_OR_LIST], terms: ['subprocessor', 'sub-processor', 'service provider'] },
  { trigger: 'PROCESSING_DETAILS_PRESENT', marker_types: [STAGE6A_STRUCTURAL_MARKER_TYPE.PROCESSING_DETAILS, STAGE6A_STRUCTURAL_MARKER_TYPE.TABLE_OR_LIST], terms: ['processing details', 'details of processing', 'purpose of processing', 'categories of data'] },
  { trigger: 'TRANSFER_DETAILS_PRESENT', marker_types: [STAGE6A_STRUCTURAL_MARKER_TYPE.TRANSFER_DETAILS, STAGE6A_STRUCTURAL_MARKER_TYPE.STANDARD_CONTRACTUAL_CLAUSES], terms: ['transfer details', 'international transfer', 'data transfer'] },
  { trigger: 'RETENTION_SCHEDULE_PRESENT', marker_types: [STAGE6A_STRUCTURAL_MARKER_TYPE.RETENTION_SCHEDULE], terms: ['retention schedule', 'retention period'] }
]);

export const STAGE6A_FIELD_DERIVATION = Object.freeze({
  legal_document_id: 'LDOC index generated from canonical legal/governance source order.',
  legal_unit_id: 'LUNIT index generated from exact structural marker/heading/table/list or fallback full-document legal unit.',
  document_type: 'Derived from URL/title/full text keyword match. UNKNOWN if not evidenced.',
  unit_type: 'Derived from legal-unit-specific verbatim text using controlled legal unit classifiers.',
  legal_unit_marker_type: 'Derived deterministically from structural marker pattern. Used for cartography, not as primary evidence.',
  legal_unit_level: 'Derived from marker type, markdown depth, or numbering depth.',
  parent_legal_unit_id: 'Derived deterministically from previous lower-level structural unit within same document.',
  control_family: 'Derived from unit_type through controlled STAGE6_CONTROL_FAMILY values.',
  heading_text: 'Exact heading/marker text if detected. Empty string if fallback full-document legal unit.',
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
  },
  {
    trigger: 'STRUCTURAL_MARKER_MISSING_UNIT',
    status: STAGE6_VALIDATION_STATUS.REINVESTIGATE_REQUIRED,
    action: STAGE6_REINVESTIGATION_ACTION.SPLIT_LEGAL_UNIT,
    reason: 'The source contains schedule/annexure/appendix/exhibit/table markers but 6A did not produce matching structural legal units.'
  }
]);

export function termsPresent(text = '', terms = []) {
  const lower = String(text || '').toLowerCase();
  return terms.filter((term) => lower.includes(term.toLowerCase()));
}

export function containsStage6DataLanguage(text = '') {
  return termsPresent(text, STAGE6_DATA_LANGUAGE_TERMS).length > 0;
}
