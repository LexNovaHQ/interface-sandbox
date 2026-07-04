import { callGeminiJson, parseJsonFromText } from "../../gemini-client.js";
import { config, configStatus, requireGeminiConfig } from "../config.js";

export const PROVIDER_SERVICE_STATUS = Object.freeze({
  central_runtime_service: "provider.service",
  provider: "gemini",
  migration_status: "bridge_to_existing_gemini_client",
  secrets_policy: "environment_variables_only_no_keys_in_repo"
});

export function providerConfigStatus() {
  const status = configStatus();
  return {
    provider: "gemini",
    gemini_api_keys_present: status.gemini_api_keys_present,
    gemini_api_key_count: status.gemini_api_key_count,
    gemini_model: status.gemini_model,
    gemini_models: status.gemini_models,
    gemini_retry_rounds: status.gemini_retry_rounds,
    gemini_keys_per_model_per_round: status.gemini_keys_per_model_per_round,
    gemini_max_output_tokens: status.gemini_max_output_tokens,
    gemini_quota_retry_max_delay_ms: status.gemini_quota_retry_max_delay_ms,
    secrets_policy: PROVIDER_SERVICE_STATUS.secrets_policy
  };
}

export function assertProviderReady() {
  requireGeminiConfig();
  return providerConfigStatus();
}

export async function callProviderJson({ prompt, phase, temperature = 0, maxOutputTokens = null, repairOnJsonParse = false } = {}) {
  assertProviderReady();
  return callGeminiJson({ prompt, phase, temperature, maxOutputTokens, repairOnJsonParse });
}

export function parseProviderJsonText(text) {
  return parseJsonFromText(text);
}

export function activeProviderModelConfig() {
  return {
    provider: "gemini",
    primary_model: config.geminiModel,
    fallback_models: config.geminiModels,
    timeout_ms: config.geminiTimeoutMs,
    max_output_tokens: config.geminiMaxOutputTokens || null,
    retry_rounds: config.geminiRetryRounds,
    keys_per_model_per_round: config.geminiKeysPerModelPerRound
  };
}
