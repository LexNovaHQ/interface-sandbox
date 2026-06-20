/* LexNova Runtime — Stage 5E Schema Mappers. */

import { asArray, asText, uniqueStrings, normalizeConfidence } from '../shared/stage5SharedIndex.js';

export const toConfidence = (value) => {
  const c = normalizeConfidence(value);
  return c === 'HIGH' ? 'high' : c === 'MEDIUM' ? 'medium' : c === 'LOW' ? 'low' : 'unknown';
};

export function tri(value) {
  const text = asText(value).toLowerCase();
  if (['true','yes','required','execute'].includes(text)) return 'true';
  if (['false','no','none','not_visible','not_evidenced'].includes(text)) return 'false';
  return 'unknown';
}

export function mapAutonomy(value) {
  const text = asText(value).toLowerCase();
  if (['none','no','manual'].includes(text)) return 'none';
  if (['draft','assistive','assisted'].includes(text)) return 'draft';
  if (['recommend','recommendation','score'].includes(text)) return 'recommend';
  if (['execute','autonomous','agentic'].includes(text)) return 'execute';
  return 'unknown';
}

export function mapHumanReview(value) {
  const text = asText(value).toLowerCase();
  if (['required','mandatory'].includes(text)) return 'required';
  if (['optional','available'].includes(text)) return 'optional';
  if (['not_visible','not evidenced','not_evidenced','unknown_not_evidenced'].includes(text)) return 'not_visible';
  return 'unknown';
}

export function deliveryObject(value) {
  const raw = Array.isArray(value) ? value.join(' ').toLowerCase() : String(value || '').toLowerCase();
  return { app: /app|mobile|desktop|agent/.test(raw) ? 'true' : 'unknown', api: /api|sdk|developer|endpoint|model/.test(raw) ? 'true' : 'unknown', web: /web|dashboard|console|portal|studio/.test(raw) ? 'true' : 'unknown' };
}

export function mapDataCategory(value) {
  const text = asText(value).toUpperCase();
  const m = { TEXT:'text', AUDIO:'audio', IMAGE:'image', VIDEO:'video', DOCUMENT:'document', STRUCTURED_DATA:'api_payload', CODE:'code', USER_PROFILE:'account', ACCOUNT_DATA:'account', USAGE_DATA:'usage_log', PAYMENT_OR_FINANCIAL:'payment', CUSTOMER_CONTENT:'uploaded_file', SYSTEM_LOGS:'usage_log', UNKNOWN:'unknown' };
  return m[text] || (['HEALTH_OR_MEDICAL','EMPLOYMENT_OR_HR','BIOMETRIC_OR_SENSITIVE','MINOR_DATA','LOCATION_DATA'].includes(text) ? 'sensitive' : 'unknown');
}

export function mapDataOrigin(value) {
  const text = asText(value).toUpperCase();
  const m = { CUSTOMER_PROVIDED:'customer_provided', USER_PROVIDED:'user_provided', THIRD_PARTY_IMPORTED:'third_party_source', SYSTEM_GENERATED:'system_generated', MODEL_GENERATED:'system_generated', INTEGRATION_IMPORTED:'third_party_source', DERIVED_OR_INFERRED:'system_generated' };
  return m[text] || 'unknown';
}

export function mapDataSubject(value) {
  const text = asText(value).toUpperCase();
  const m = { END_USER:'user', CUSTOMER_ADMIN:'customer', DEVELOPER:'developer', EMPLOYEE:'employee', CANDIDATE:'employee', CONSUMER:'consumer', MINOR:'child', PATIENT:'consumer', SPEAKER:'user', DOCUMENT_SUBJECT:'user' };
  return m[text] || 'unknown';
}

export function refs(...groups) {
  const out = uniqueStrings(groups.flatMap((g) => asArray(g)).filter(Boolean));
  return out.length ? out : ['S5E_SOURCE_REF_NOT_AVAILABLE'];
}

export function sourceUrl(...values) {
  for (const value of values) { const text = asText(value); if (text && /^https?:\/\//.test(text)) return text; }
  return 'https://source-not-available.local/';
}
