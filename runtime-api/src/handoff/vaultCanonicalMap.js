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
  "baseline.delivery.app",
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
  "baseline.integrations.none",
  "baseline.reliance_threshold",
  "architecture.memory",
  "architecture.models",
  "architecture.sub_processors.openai",
  "architecture.sub_processors.anthropic",
  "architecture.sub_processors.google",
  "architecture.sub_processors.cohere",
  "architecture.sub_processors.mistral",
  "architecture.sub_processors.other",
  "architecture.sub_processors.url",
  "architecture.cloud_host",
  "architecture.vector_db",
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

export function createVaultSuggestion(value, basis, confidence = "medium", sourceFindingIds = []) {
  const normalizedConfidence = ["high", "medium", "low"].includes(String(confidence))
    ? String(confidence)
    : "medium";

  return {
    value,
    basis: String(basis || "Derived from Stage 9 diligence report data."),
    confidence: normalizedConfidence,
    source_finding_ids: Array.isArray(sourceFindingIds) ? sourceFindingIds.map(String).filter(Boolean) : []
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
