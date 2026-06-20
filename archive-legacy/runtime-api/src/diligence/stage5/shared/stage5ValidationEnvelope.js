/* LexNova Runtime — Stage 5 Validation Envelope. No model calls. No live wiring. */

export function createValidationPass(meta = {}) {
  return {
    ok: true,
    stage: 'stage5',
    phase: meta.phase || meta.phase_id || null,
    severity: 'PASS',
    blocking_errors: [],
    repairable_errors: [],
    warnings: [],
    metrics: meta.metrics || {},
    summary: meta.summary || 'Validation passed.',
    next_action: meta.next_action || 'CONTINUE'
  };
}

export function createValidationWarning(meta = {}) {
  return {
    ok: true,
    stage: 'stage5',
    phase: meta.phase || meta.phase_id || null,
    severity: 'WARNING',
    blocking_errors: [],
    repairable_errors: meta.repairable_errors || [],
    warnings: meta.warnings || [meta.message || 'Validation warning.'],
    metrics: meta.metrics || {},
    summary: meta.summary || meta.message || 'Validation warning.',
    next_action: meta.next_action || 'CONTINUE_WITH_WARNING'
  };
}

export function createValidationFailure(meta = {}) {
  return {
    ok: false,
    stage: 'stage5',
    phase: meta.phase || meta.phase_id || null,
    severity: meta.severity || 'BLOCKING',
    blocking_errors: meta.blocking_errors || (meta.message ? [meta.message] : []),
    repairable_errors: meta.repairable_errors || [],
    warnings: meta.warnings || [],
    metrics: meta.metrics || {},
    summary: meta.summary || meta.message || 'Validation failed.',
    next_action: meta.next_action || 'HALT'
  };
}

export function mergeValidationResults(results = []) {
  const merged = createValidationPass({ summary: 'Merged Stage 5 validation results.' });
  for (const result of results) {
    if (!result) continue;
    merged.blocking_errors.push(...(result.blocking_errors || []));
    merged.repairable_errors.push(...(result.repairable_errors || []));
    merged.warnings.push(...(result.warnings || []));
    merged.metrics = { ...merged.metrics, ...(result.metrics || {}) };
  }
  merged.ok = merged.blocking_errors.length === 0;
  merged.severity = merged.blocking_errors.length ? 'BLOCKING' : merged.repairable_errors.length ? 'REPAIRABLE' : merged.warnings.length ? 'WARNING' : 'PASS';
  merged.next_action = merged.ok ? 'CONTINUE' : 'HALT';
  return merged;
}

export function validationHasBlockingErrors(result = {}) {
  return !result.ok || (Array.isArray(result.blocking_errors) && result.blocking_errors.length > 0) || result.severity === 'BLOCKING';
}
