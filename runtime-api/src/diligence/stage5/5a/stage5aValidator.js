/* LexNova Runtime — Stage 5A Validator. No model calls. */

import { asArray, asText, createValidationFailure, createValidationPass, createValidationWarning } from '../shared/stage5SharedIndex.js';
import { getStage5AAllowedCandidateDispositions } from './stage5aDeterministicCandidatePoolBuilder.js';

const FORBIDDEN_5A_KEYS = Object.freeze([
  'archetype_codes',
  'archetype_labels',
  'surface_tokens',
  'surface_provenance',
  'regulated_surface_map',
  'linked_threat_ids',
  'final_exposure_findings',
  'data_provenance_map'
]);

const REQUIRED_FUNCTION_FIELDS = Object.freeze([
  'function_id',
  'core_product_id',
  'core_product_name',
  'function_name',
  'input_signal',
  'system_action',
  'output_or_result',
  'why_admitted',
  'source_refs',
  'lossless_source_index_refs',
  'candidate_ids_used'
]);

export function validateStage5A(mapping = {}, candidatePool = {}) {
  const blocking = [];
  const warnings = [];
  const functions = asArray(mapping.product_function_map);
  const dispositions = asArray(mapping.candidate_disposition);
  const deterministicCandidates = asArray(candidatePool.deterministic_candidate_pool);

  if (mapping.stage5a_version !== 'stage5a_product_function_mapping_v1') blocking.push('5A mapping has invalid stage5a_version.');
  if (!functions.length) blocking.push('5A produced zero admitted product functions.');

  functions.forEach((fn, index) => {
    for (const field of REQUIRED_FUNCTION_FIELDS) {
      const value = fn[field];
      const empty = Array.isArray(value) ? value.length === 0 : !asText(value);
      if (empty) blocking.push(`5A function ${index + 1} missing ${field}.`);
    }
    for (const key of FORBIDDEN_5A_KEYS) {
      if (Object.prototype.hasOwnProperty.call(fn, key)) blocking.push(`5A function ${fn.function_id || index + 1} emitted forbidden key ${key}.`);
    }
    if (fn.primary_or_secondary === 'UNKNOWN') warnings.push(`5A function ${fn.function_id || index + 1} has UNKNOWN primary_or_secondary.`);
    if (!asText(fn.commercial_function)) warnings.push(`5A function ${fn.function_id || index + 1} lacks commercial_function.`);
  });

  const allowedDispositions = new Set(getStage5AAllowedCandidateDispositions());
  const disposedCandidateIds = new Set(dispositions.map((row) => asText(row.candidate_id)).filter(Boolean));
  deterministicCandidates.forEach((candidate) => {
    const id = asText(candidate.candidate_id);
    if (id && !disposedCandidateIds.has(id)) blocking.push(`Deterministic candidate ${id} has no 5A disposition.`);
  });
  dispositions.forEach((row) => {
    if (!allowedDispositions.has(asText(row.disposition))) blocking.push(`Candidate ${row.candidate_id || row.candidate_text || 'UNKNOWN'} has invalid disposition ${row.disposition}.`);
  });

  const topLevelForbidden = FORBIDDEN_5A_KEYS.filter((key) => Object.prototype.hasOwnProperty.call(mapping, key));
  for (const key of topLevelForbidden) blocking.push(`5A mapping emitted forbidden top-level key ${key}.`);

  const metrics = {
    admitted_function_count: functions.length,
    candidate_count: deterministicCandidates.length,
    disposition_count: dispositions.length,
    warning_count: warnings.length,
    blocking_error_count: blocking.length
  };

  if (blocking.length) {
    return createValidationFailure({
      phase: 'STAGE5A_VALIDATION',
      blocking_errors: blocking,
      warnings,
      metrics,
      summary: 'Stage 5A validation failed.'
    });
  }

  if (warnings.length) {
    return createValidationWarning({
      phase: 'STAGE5A_VALIDATION',
      warnings,
      metrics,
      summary: 'Stage 5A validation passed with warnings.'
    });
  }

  return createValidationPass({ phase: 'STAGE5A_VALIDATION', metrics, summary: 'Stage 5A validation passed.' });
}
