/* LexNova Runtime — Stage 5D Deterministic Data Signal Builder. */

import { asArray, uniqueStrings } from '../shared/stage5SharedIndex.js';

export const STAGE5D_CONTROLLED = Object.freeze({
  touchpoint_type: ['INPUT','PROCESSING','OUTPUT','STORAGE_SIGNAL','RETENTION_SIGNAL','TRAINING_SIGNAL','SHARING_SIGNAL','LOGGING_OR_TELEMETRY_SIGNAL','INTEGRATION_OR_TRANSFER','USER_CONTROL_SIGNAL','UNKNOWN'],
  data_category: ['TEXT','AUDIO','IMAGE','VIDEO','DOCUMENT','STRUCTURED_DATA','CODE','USER_PROFILE','ACCOUNT_DATA','USAGE_DATA','LOCATION_DATA','PAYMENT_OR_FINANCIAL','HEALTH_OR_MEDICAL','EMPLOYMENT_OR_HR','BIOMETRIC_OR_SENSITIVE','MINOR_DATA','CUSTOMER_CONTENT','SYSTEM_LOGS','UNKNOWN'],
  data_subject: ['END_USER','CUSTOMER_ADMIN','DEVELOPER','EMPLOYEE','CANDIDATE','CONSUMER','MINOR','PATIENT','SPEAKER','DOCUMENT_SUBJECT','UNKNOWN'],
  data_origin: ['CUSTOMER_PROVIDED','USER_PROVIDED','SYSTEM_GENERATED','THIRD_PARTY_IMPORTED','MODEL_GENERATED','INTEGRATION_IMPORTED','DERIVED_OR_INFERRED','UNKNOWN'],
  data_direction: ['INBOUND_TO_SYSTEM','INTERNAL_PROCESSING','OUTBOUND_FROM_SYSTEM','STORED_BY_SYSTEM','SHARED_WITH_THIRD_PARTY','USED_FOR_MODEL_IMPROVEMENT','UNKNOWN'],
  explicitness_level: ['EXPLICIT','IMPLIED_BY_FUNCTION','NOT_EVIDENCED','CONFLICTING']
});

function detectCategory(text) {
  const raw = String(text || '').toLowerCase();
  const out = [];
  if (/audio|speech|voice|speaker|transcri/.test(raw)) out.push('AUDIO');
  if (/image|vision|photo|ocr/.test(raw)) out.push('IMAGE');
  if (/video|dub/.test(raw)) out.push('VIDEO');
  if (/document|pdf|file|extract|digit/.test(raw)) out.push('DOCUMENT');
  if (/text|transcript|translation|translate|language|prompt/.test(raw)) out.push('TEXT');
  if (/code|developer|api|sdk/.test(raw)) out.push('CODE');
  if (/profile|account|user/.test(raw)) out.push('USER_PROFILE');
  if (/usage|log|telemetry|analytics/.test(raw)) out.push('USAGE_DATA');
  if (/payment|financial|invoice|billing/.test(raw)) out.push('PAYMENT_OR_FINANCIAL');
  if (/health|medical|patient/.test(raw)) out.push('HEALTH_OR_MEDICAL');
  if (/employee|candidate|hr|recruit/.test(raw)) out.push('EMPLOYMENT_OR_HR');
  if (/biometric|face|fingerprint|voiceprint/.test(raw)) out.push('BIOMETRIC_OR_SENSITIVE');
  return uniqueStrings(out);
}

export function buildStage5DDeterministicDataSignals(featureContext = {}) {
  const feature_signal_seeds = asArray(featureContext?.feature_contexts).map((ctx) => {
    const raw = JSON.stringify({ name: ctx.feature_name, mechanics: ctx.mechanics, tags: ctx.tags });
    const categories = detectCategory(raw);
    return {
      feature_id: ctx.feature_id,
      function_id: ctx.function_id,
      possible_input_categories: categories.length ? categories : ['UNKNOWN'],
      possible_output_categories: detectCategory(ctx.mechanics?.output_or_result || ctx.feature_description),
      possible_subjects: /developer|api|sdk/i.test(raw) ? ['DEVELOPER'] : /speaker|voice|audio/i.test(raw) ? ['SPEAKER'] : ['UNKNOWN'],
      explicit_lifecycle_signals: {
        storage_signal: /store|stored|storage|save|saved/i.test(raw) ? 'POSSIBLE_EXPLICIT_SIGNAL' : 'NOT_EVIDENCED',
        retention_signal: /retain|retention|delete|deletion/i.test(raw) ? 'POSSIBLE_EXPLICIT_SIGNAL' : 'NOT_EVIDENCED',
        training_signal: /train|fine.?tun|model improvement/i.test(raw) ? 'POSSIBLE_EXPLICIT_SIGNAL' : 'NOT_EVIDENCED',
        sharing_signal: /share|subprocessor|third.?party|integration/i.test(raw) ? 'POSSIBLE_EXPLICIT_SIGNAL' : 'NOT_EVIDENCED',
        logging_signal: /log|telemetry|analytics/i.test(raw) ? 'POSSIBLE_EXPLICIT_SIGNAL' : 'NOT_EVIDENCED'
      },
      evidence_refs: asArray(ctx.evidence_refs),
      lossless_source_index_refs: asArray(ctx.lossless_source_index_refs)
    };
  });
  return {
    stage5d_data_signal_seed_version: 'stage5d_data_signal_seed_v1',
    feature_signal_seeds,
    controlled_values: STAGE5D_CONTROLLED,
    metrics: { feature_signal_seed_count: feature_signal_seeds.length }
  };
}
