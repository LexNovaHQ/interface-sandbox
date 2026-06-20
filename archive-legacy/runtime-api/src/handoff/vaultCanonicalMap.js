export const VAULT_GROUPS = Object.freeze([
  "baseline",
  "architecture",
  "archetypes",
  "compliance"
]);

export const VAULT_FIELD_PATHS = Object.freeze([
  "baseline.company",
  "baseline.entity_type",
  "baseline.address",
  "baseline.legal_email",
  "baseline.privacy_email",
  "baseline.products",
  "baseline.jurisdiction.country",
  "baseline.jurisdiction.state",
  "baseline.market",
  "baseline.delivery.web",
  "baseline.delivery.app",
  "baseline.delivery.mobile",
  "baseline.delivery.api",
  "baseline.revenue_model",
  "baseline.acv",
  "baseline.has_beta",
  "baseline.output_ownership",
  "baseline.sla_type",
  "baseline.integrations.slack",
  "baseline.integrations.crm",
  "baseline.integrations.stripe",
  "baseline.integrations.github",
  "baseline.integrations.webhooks",
  "baseline.integrations.email",
  "baseline.integrations.calendar",
  "baseline.integrations.ticketing",
  "baseline.integrations.hris",
  "baseline.integrations.payment_billing",
  "baseline.integrations.database",
  "baseline.integrations.custom_api",
  "baseline.integrations.other",
  "baseline.integrations.none",
  "baseline.reliance_threshold",
  "architecture.ai_provider_stack.providers",
  "architecture.ai_provider_stack.other_providers",
  "architecture.ai_provider_stack.hosting_model",
  "architecture.ai_provider_stack.sends_customer_data_to_model_provider",
  "architecture.ai_provider_stack.fallback_provider",
  "architecture.ai_provider_stack.public_provider_disclosure_url",
  "architecture.memory",
  "architecture.models",
  "architecture.sub_processors.openai",
  "architecture.sub_processors.anthropic",
  "architecture.sub_processors.google",
  "architecture.sub_processors.cohere",
  "architecture.sub_processors.mistral",
  "architecture.sub_processors.azure_openai",
  "architecture.sub_processors.aws_bedrock",
  "architecture.sub_processors.meta_llama",
  "architecture.sub_processors.deepseek",
  "architecture.sub_processors.xai",
  "architecture.sub_processors.other",
  "architecture.sub_processors.url",
  "architecture.cloud_host",
  "architecture.vector_db",
  "architecture.hosting_regions",
  "architecture.deployment_model",
  "architecture.model_improvement.customer_inputs_used_for_training",
  "architecture.model_improvement.customer_inputs_used_for_evaluation",
  "architecture.model_improvement.product_improvement_use",
  "architecture.model_improvement.opt_out_available",
  "architecture.storage_logging.stores_prompts",
  "architecture.storage_logging.stores_uploaded_files",
  "architecture.storage_logging.stores_generated_outputs",
  "architecture.storage_logging.conversation_history",
  "architecture.storage_logging.audit_logs",
  "architecture.security_controls.encryption_at_rest",
  "architecture.security_controls.encryption_in_transit",
  "architecture.security_controls.status_or_trust_url",
  "architecture.api_developer_config.api_or_sdk_available",
  "architecture.api_developer_config.rate_limits_or_usage_limits",
  "architecture.api_developer_config.customer_configurable_tools",
  "archetypes.is_doer",
  "archetypes.is_orchestrator",
  "archetypes.agent_limits.session_cap",
  "archetypes.agent_limits.period_cap",
  "archetypes.agent_limits.retry_limit",
  "archetypes.agent_limits.loop_threshold",
  "archetypes.is_creator",
  "archetypes.is_reader",
  "archetypes.conversational_ui",
  "archetypes.sens_bio",
  "archetypes.is_judge",
  "archetypes.is_judge_hr",
  "archetypes.is_judge_legal",
  "archetypes.is_optimizer",
  "archetypes.sens_fin",
  "archetypes.is_shield",
  "archetypes.is_mover",
  "archetypes.is_generalist",
  "compliance.processes_pii",
  "compliance.eu_users",
  "compliance.ca_users",
  "compliance.other_regions",
  "compliance.sens_health",
  "compliance.sens_fin",
  "compliance.sens_employment",
  "compliance.minors",
  "compliance.distress",
  "compliance.standard_adults"
]);

export const VAULT_FIELD_PATH_SET = new Set(VAULT_FIELD_PATHS);

export function createEmptyVaultPrefill() {
  return {
    baseline: {},
    architecture: {},
    archetypes: {},
    compliance: {}
  };
}

export function createEmptyVaultPayload({ status = "needs_confirmation", submittedAt = new Date().toISOString() } = {}) {
  return {
    baseline: {
      company: "",
      products: [],
      jurisdiction: { country: "", state: "" },
      market: "unknown",
      delivery: { web: false, app: false, mobile: false, api: false },
      integrations: {}
    },
    architecture: {
      ai_provider_stack: { providers: ["unknown"] },
      sub_processors: {}
    },
    archetypes: {
      agent_limits: {}
    },
    compliance: {
      processes_pii: "unknown",
      other_regions: []
    },
    status,
    submittedAt
  };
}

export function normalizeVaultFieldPath(fieldPath) {
  const value = String(fieldPath || "").trim();
  if (value.startsWith("architecture.integrations.")) {
    return value.replace("architecture.integrations.", "baseline.integrations.");
  }
  return value;
}

export function getVaultGroup(fieldPath) {
  const group = String(fieldPath || "").split(".")[0];
  return VAULT_GROUPS.includes(group) ? group : null;
}

export function isAllowedVaultPath(fieldPath) {
  return VAULT_FIELD_PATH_SET.has(normalizeVaultFieldPath(fieldPath));
}

export function createVaultSuggestion(value, basis, confidence = "medium", sourceFindingIds = [], extra = {}) {
  const normalizedConfidence = ["high", "medium", "low"].includes(String(confidence))
    ? String(confidence)
    : "medium";

  return {
    value,
    basis: String(basis || "Derived from canonical Diligence Engine output."),
    confidence: normalizedConfidence,
    source_finding_ids: Array.isArray(sourceFindingIds) ? sourceFindingIds.map(String).filter(Boolean) : [],
    ...extra
  };
}

export function setVaultPrefill(prefill, fieldPath, suggestion, warnings = []) {
  const normalizedPath = normalizeVaultFieldPath(fieldPath);
  const group = getVaultGroup(normalizedPath);

  if (!group || !isAllowedVaultPath(normalizedPath)) {
    warnings.push(`W_STAGE10_INVALID_VAULT_PATH | Skipped invalid Vault field path: ${fieldPath}`);
    return false;
  }

  const localPath = normalizedPath.split(".").slice(1).join(".");
  prefill[group][localPath] = suggestion;
  return true;
}
