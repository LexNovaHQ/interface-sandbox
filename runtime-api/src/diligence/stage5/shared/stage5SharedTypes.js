/*
 * LexNova Runtime — Stage 5 Shared Types
 * Batch 1 shared foundation only. No model calls. No live wiring.
 */

export const STAGE5_UNKNOWN = 'UNKNOWN';
export const STAGE5_CONFIDENCE_VALUES = Object.freeze(['HIGH', 'MEDIUM', 'LOW', 'UNKNOWN']);
export const STAGE5_TRI_STATE_VALUES = Object.freeze(['TRUE', 'FALSE', 'UNKNOWN']);
export const STAGE5_VALIDATION_SEVERITIES = Object.freeze(['PASS', 'WARNING', 'REPAIRABLE', 'BLOCKING']);
export const STAGE5_PHASE_KINDS = Object.freeze(['DETERMINISTIC', 'MODEL', 'VALIDATION', 'ASSEMBLY', 'FORENSIC']);

export function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
}

export function asPlainObject(value) {
  return isPlainObject(value) ? value : {};
}

export function asText(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

export function uniqueStrings(values) {
  const seen = new Set();
  const out = [];
  for (const value of asArray(values)) {
    const text = asText(value);
    if (!text || seen.has(text)) continue;
    seen.add(text);
    out.push(text);
  }
  return out;
}

export function stableStage5Id(prefix, index) {
  const cleanPrefix = asText(prefix).replace(/[^A-Z0-9_]/gi, '_').toUpperCase() || 'S5';
  const number = Math.max(1, Number(index) || 1);
  return `${cleanPrefix}${String(number).padStart(3, '0')}`;
}

export function normalizeConfidence(value) {
  const text = asText(value).toUpperCase();
  return STAGE5_CONFIDENCE_VALUES.includes(text) ? text : STAGE5_UNKNOWN;
}

export function normalizeTriState(value) {
  if (value === true) return 'TRUE';
  if (value === false) return 'FALSE';
  const text = asText(value).toUpperCase();
  return STAGE5_TRI_STATE_VALUES.includes(text) ? text : STAGE5_UNKNOWN;
}

export function normalizeControlledValue(value, allowedValues = [], fallback = STAGE5_UNKNOWN) {
  const allowed = new Set(asArray(allowedValues).map((entry) => asText(entry)).filter(Boolean));
  const text = asText(value);
  return allowed.has(text) ? text : fallback;
}

export function normalizeEvidenceRefs(value) {
  return uniqueStrings(value).filter((ref) => !/^https?:\/\//i.test(ref));
}

export function normalizeSourceRefs(value) {
  return uniqueStrings(value);
}

export function nowIso() {
  return new Date().toISOString();
}

export function stage5Error(code, message, detail = {}) {
  return { code: asText(code) || 'STAGE5_ERROR', message: asText(message) || 'Stage 5 error', detail: asPlainObject(detail) };
}
