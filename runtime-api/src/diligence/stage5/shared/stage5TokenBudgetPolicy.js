/*
 * LexNova Runtime — Stage 5 Token Budget Policy
 * Budget policy only. No model calls. No live wiring.
 */

export const STAGE5_TOKEN_BUDGETS = Object.freeze({
  STAGE5A_PRODUCT_FUNCTION_EXTRACTION: Object.freeze({ max_input_tokens: 90000, max_output_tokens: 12000, max_attempts: 1, model_pool: 'REASONING' }),
  STAGE5B_ARCHETYPE_SURFACE_TAGGING: Object.freeze({ max_input_tokens: 45000, max_output_tokens: 10000, max_attempts: 1, model_pool: 'REASONING' }),
  STAGE5D_FEATURE_DATA_TOUCHPOINT_EXTRACTION: Object.freeze({ max_input_tokens: 65000, max_output_tokens: 12000, max_attempts: 1, model_pool: 'REASONING' }),
  DETERMINISTIC_PHASE: Object.freeze({ max_input_tokens: 0, max_output_tokens: 0, max_attempts: 0, model_pool: null })
});

export function getStage5PhaseTokenBudget(phaseId) {
  return STAGE5_TOKEN_BUDGETS[phaseId] || STAGE5_TOKEN_BUDGETS.DETERMINISTIC_PHASE;
}

export function buildStage5TokenLedgerEntry(phaseId, modelMetadata = {}) {
  const usage = modelMetadata.usage_metadata || modelMetadata.usageMetadata || modelMetadata.usage || {};
  return {
    phase_id: phaseId,
    model: modelMetadata.model || modelMetadata.model_name || null,
    input_tokens: Number(usage.input_token_count || usage.prompt_token_count || usage.inputTokens || 0),
    output_tokens: Number(usage.output_token_count || usage.candidates_token_count || usage.outputTokens || 0),
    total_tokens: Number(usage.total_token_count || usage.totalTokens || 0),
    finish_reason: modelMetadata.finish_reason || modelMetadata.finishReason || null,
    raw_usage: usage
  };
}

export function summarizeStage5TokenUsage(entries = []) {
  return entries.reduce((acc, entry) => {
    acc.input_tokens += Number(entry.input_tokens || 0);
    acc.output_tokens += Number(entry.output_tokens || 0);
    acc.total_tokens += Number(entry.total_tokens || 0);
    acc.model_phase_count += entry.phase_id ? 1 : 0;
    acc.entries.push(entry);
    return acc;
  }, { input_tokens: 0, output_tokens: 0, total_tokens: 0, model_phase_count: 0, entries: [] });
}
