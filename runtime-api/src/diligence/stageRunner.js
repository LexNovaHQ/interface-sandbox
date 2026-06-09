import { runGeminiPool } from "../gemini/geminiPool.js";
import { getDiligenceStageConfig } from "./stageConfigs.js";
import { loadDiligencePrompt } from "./stagePromptLoader.js";
import { formatSchemaErrors, resolveSchemaEntry, validateDiligenceStageOutput } from "./stageSchemaValidator.js";
import { validateTargetFeatureProfileGuardrails } from "./targetFeatureProfileGuardrails.js";

function unwrapStageOutput(parsedJson, outputKey) {
  if (parsedJson && typeof parsedJson === "object" && !Array.isArray(parsedJson) && Object.prototype.hasOwnProperty.call(parsedJson, outputKey)) {
    return { value: parsedJson[outputKey], unwrapped: true };
  }
  return { value: parsedJson, unwrapped: false };
}

function stringifyLimitation(item) {
  if (typeof item === "string") return item;
  if (item == null) return "";
  if (typeof item !== "object") return String(item);
  const fields = [item.limitation, item.summary, item.reason, item.message, item.description, item.note, item.value].filter((value) => typeof value === "string" && value.trim());
  if (fields.length) return fields.join(" — ");
  try { return JSON.stringify(item); } catch { return String(item); }
}

function asString(value, fallback = "unknown") {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value)) return value.map((item) => asString(item, "")).filter(Boolean).join(", ") || fallback;
  if (value == null) return fallback;
  if (typeof value === "object") {
    const fields = [value.value, value.summary, value.description, value.signal, value.name, value.type].filter((item) => typeof item === "string" && item.trim());
    if (fields.length) return fields.join(" — ");
    try { return JSON.stringify(value); } catch { return fallback; }
  }
  return String(value).trim() || fallback;
}

function asStringArray(value) {
  if (Array.isArray(value)) return value.map((item) => asString(item, "")).map((item) => item.trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function confidence(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return ["high", "medium", "low", "unknown"].includes(normalized) ? normalized : "unknown";
}

function domainFrom(value) {
  try {
    const url = new URL(/^https?:\/\//i.test(String(value || "")) ? value : `https://${value}`);
    return url.hostname.replace(/^www\./i, "") || "unknown";
  } catch {
    return "unknown";
  }
}

function confidenceFromLabels(labels, key) {
  if (!labels || typeof labels !== "object") return "unknown";
  return confidence(labels[key] || labels[`${key}_confidence`] || labels.confidence);
}

function normalizeEvidenceSource(item, index) {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return { evidence_source_id: `company_profile_evidence_${index + 1}`, source_url: "unknown", claim_supported: asString(item, "unknown"), confidence: "unknown" };
  }
  return {
    evidence_source_id: asString(item.evidence_source_id || item.source_id || item.id, `company_profile_evidence_${index + 1}`),
    source_url: asString(item.source_url || item.url || item.final_url, "unknown"),
    claim_supported: asString(item.claim_supported || item.claim || item.supports || item.summary, "unknown"),
    confidence: confidence(item.confidence)
  };
}

function normalizeEvidence(value) {
  if (Array.isArray(value)) {
    return {
      primary_company_sources: value.map(normalizeEvidenceSource).slice(0, 3),
      supporting_company_sources: value.map(normalizeEvidenceSource).slice(3),
      evidence_notes: [],
      unresolved_questions: []
    };
  }
  const evidence = value && typeof value === "object" ? value : {};
  return {
    primary_company_sources: asStringArray(evidence.primary_company_sources).length ? asStringArray(evidence.primary_company_sources).map((item, index) => normalizeEvidenceSource({ claim_supported: item }, index)) : (Array.isArray(evidence.primary_company_sources) ? evidence.primary_company_sources.map(normalizeEvidenceSource) : []),
    supporting_company_sources: asStringArray(evidence.supporting_company_sources).length ? asStringArray(evidence.supporting_company_sources).map((item, index) => normalizeEvidenceSource({ claim_supported: item }, index)) : (Array.isArray(evidence.supporting_company_sources) ? evidence.supporting_company_sources.map(normalizeEvidenceSource) : []),
    evidence_notes: asStringArray(evidence.evidence_notes || evidence.notes),
    unresolved_questions: asStringArray(evidence.unresolved_questions || evidence.open_questions)
  };
}

function normalizeCompanyProfileOutput(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { value, repaired: false, repair_notes: [] };
  const src = { ...value };
  const identitySrc = src.company_identity && typeof src.company_identity === "object" ? src.company_identity : {};
  const businessSrc = src.business_model && typeof src.business_model === "object" ? src.business_model : {};
  const marketSrc = src.market_context && typeof src.market_context === "object" ? src.market_context : {};
  const operatingSrc = src.operating_profile && typeof src.operating_profile === "object" ? src.operating_profile : {};
  const assumptionsSrc = src.downstream_assumptions && typeof src.downstream_assumptions === "object" ? src.downstream_assumptions : {};
  const website = asString(identitySrc.website || src.website, "unknown");
  return {
    value: {
      company_profile_version: "company_profile_v1",
      company_identity: {
        brand_name: asString(identitySrc.brand_name || identitySrc.name || src.brand_name || src.company_name, "unknown"),
        legal_or_corporate_name: asString(identitySrc.legal_or_corporate_name || identitySrc.legal_name || identitySrc.corporate_name, "unknown"),
        website,
        domain: asString(identitySrc.domain, domainFrom(website)),
        headquarters_or_origin_signal: asString(identitySrc.headquarters_or_origin_signal || identitySrc.headquarters || identitySrc.origin, "unknown"),
        corporate_status_signal: asString(identitySrc.corporate_status_signal || identitySrc.funding_status || identitySrc.corporate_status, "unknown"),
        identity_confidence: confidence(identitySrc.identity_confidence || confidenceFromLabels(identitySrc.confidence_labels, "identity"))
      },
      business_model: {
        company_type: asString(businessSrc.company_type || businessSrc.type, "unknown"),
        primary_customer_type: asString(businessSrc.primary_customer_type || businessSrc.customers || businessSrc.customer_type, "unknown"),
        sales_motion: asString(businessSrc.sales_motion, "unknown"),
        revenue_model_signal: asString(businessSrc.revenue_model_signal || businessSrc.revenue_model, "unknown"),
        enterprise_or_self_serve_signal: asString(businessSrc.enterprise_or_self_serve_signal || businessSrc.enterprise_self_serve, "unknown"),
        business_model_confidence: confidence(businessSrc.business_model_confidence || confidenceFromLabels(businessSrc.confidence_labels, "business_model"))
      },
      market_context: {
        industry: asString(marketSrc.industry, "unknown"),
        target_geographies: asStringArray(marketSrc.target_geographies || marketSrc.geographies),
        target_languages: asStringArray(marketSrc.target_languages || marketSrc.languages),
        regulated_sector_exposure: asStringArray(marketSrc.regulated_sector_exposure || marketSrc.regulated_sectors),
        public_sector_or_enterprise_signal: asString(marketSrc.public_sector_or_enterprise_signal || marketSrc.public_sector_enterprise_signal, "unknown"),
        market_context_confidence: confidence(marketSrc.market_context_confidence || confidenceFromLabels(marketSrc.confidence_labels, "market_context"))
      },
      operating_profile: {
        high_level_offering: asString(operatingSrc.high_level_offering || operatingSrc.offering, "unknown"),
        ai_system_type: asString(operatingSrc.ai_system_type || operatingSrc.system_type, "unknown"),
        deployment_model_signal: asString(operatingSrc.deployment_model_signal || operatingSrc.deployment_model, "unknown"),
        user_data_touchpoints: asStringArray(operatingSrc.user_data_touchpoints || operatingSrc.user_customer_data_touchpoints),
        customer_data_touchpoints: asStringArray(operatingSrc.customer_data_touchpoints || operatingSrc.user_customer_data_touchpoints),
        operating_profile_confidence: confidence(operatingSrc.operating_profile_confidence || confidenceFromLabels(operatingSrc.confidence_labels, "operating_profile"))
      },
      downstream_assumptions: {
        for_product_profile: asStringArray(assumptionsSrc.for_product_profile || assumptionsSrc.product_profile),
        for_legal_review: asStringArray(assumptionsSrc.for_legal_review || assumptionsSrc.legal_review || assumptionsSrc.compliance_requirements),
        for_registry_matching: asStringArray(assumptionsSrc.for_registry_matching || assumptionsSrc.registry_matching || assumptionsSrc.regulatory_implications),
        assumption_warnings: asStringArray(assumptionsSrc.assumption_warnings || assumptionsSrc.warnings)
      },
      evidence: normalizeEvidence(src.evidence),
      limitations: asStringArray(src.limitations)
    },
    repaired: true,
    repair_notes: ["normalized_company_profile_aliases_to_schema"]
  };
}

function normalizeStageOutputForSchema(value, schemaKey) {
  if (schemaKey === "companyProfile") return normalizeCompanyProfileOutput(value);
  if (!value || typeof value !== "object" || Array.isArray(value)) return { value, repaired: false, repair_notes: [] };
  const copy = { ...value };
  const repairNotes = [];
  if (Array.isArray(copy.limitations)) {
    const normalized = copy.limitations.map(stringifyLimitation).map((item) => String(item || "").trim()).filter(Boolean);
    const changed = normalized.length !== copy.limitations.length || copy.limitations.some((item, index) => item !== normalized[index]);
    if (changed) {
      copy.limitations = normalized;
      repairNotes.push("normalized_limitations_to_string_array");
    }
  }
  return { value: copy, repaired: repairNotes.length > 0, repair_notes: repairNotes };
}

function buildPromptInput({ stageId, prompt, input }) {
  return [prompt.trim(), "\n\n---\n\nReturn valid JSON only. Do not include Markdown fences or commentary outside JSON.", "\n\n---INPUT_JSON---\n", JSON.stringify({ stage_id: stageId, input }, null, 2)].join("");
}

function publicModelMetadata(result, repair = {}) {
  return {
    pool: result?.model_meta?.pool || null,
    model: result?.model_meta?.selected_model || null,
    selected_model: result?.model_meta?.selected_model || null,
    selected_key_alias: result?.model_meta?.selected_key_alias || null,
    attempted_models: result?.attempts || [],
    fallback_used: result?.fallback_used === true,
    primary_error: result?.primary_error || null,
    usage_metadata: result?.usage_metadata || null,
    grounding_metadata: result?.grounding_metadata || null,
    repaired: result?.repaired === true || repair?.repaired === true,
    repair_notes: repair?.repair_notes || []
  };
}

function providerFailureStatus(result) {
  if (result?.error_type === "POOL_KEYS_NOT_CONFIGURED" || result?.error_type === "POOL_MODELS_NOT_CONFIGURED") return 503;
  if (result?.error_type === "ATTEMPT_BUDGET_EXHAUSTED" || result?.error_type === "POOL_EXHAUSTED") return 502;
  if (result?.error_type === "TIMEOUT") return 504;
  return 502;
}

function guardrailResultFor(config, output, input) {
  if (config.output_schema_key !== "targetFeatureProfile") return { ok: true, errors: [], validation_mode: null };
  const threatMappingSupplied = input?.threat_mapping_supplied === true || input?.source_bundle?.source_review?.threat_mapping_supplied === true;
  const result = validateTargetFeatureProfileGuardrails(output, { threatMappingSupplied });
  return { ...result, validation_mode: "target_feature_profile_runtime_guardrails" };
}

export async function runDiligenceStage({ stageId, input, options = {}, env = process.env }) {
  const config = getDiligenceStageConfig(stageId);
  const schemaEntry = resolveSchemaEntry(config.output_schema_key);
  if (!schemaEntry?.schema) {
    return { ok: false, status: 500, stage_id: config.stage_id, error_type: "SCHEMA_NOT_FOUND", error: `Output schema not found for ${config.output_schema_key}`, output_schema_key: config.output_schema_key };
  }

  const promptBundle = loadDiligencePrompt(config.prompt_stage_id);
  const modelPrompt = buildPromptInput({ stageId: config.stage_id, prompt: promptBundle.combined_prompt, input });

  const runResult = await runGeminiPool({
    poolName: options.pool || config.pool,
    prompt: modelPrompt,
    env,
    options: {
      responseMimeType: "application/json",
      temperature: options.temperature ?? config.temperature,
      maxOutputTokens: options.maxOutputTokens ?? options.max_output_tokens ?? config.max_output_tokens,
      timeoutMs: options.timeoutMs ?? options.timeout_ms ?? config.timeout_ms,
      maxAttempts: options.maxAttempts ?? options.max_attempts
    }
  });

  if (!runResult.ok) {
    return { ok: false, status: providerFailureStatus(runResult), stage_id: config.stage_id, error_type: runResult.error_type || "MODEL_STAGE_ERROR", error: runResult.error || "Diligence stage model run failed", model_metadata: publicModelMetadata(runResult) };
  }

  const normalizedOutput = unwrapStageOutput(runResult.json, config.output_key);
  const schemaNormalizedOutput = normalizeStageOutputForSchema(normalizedOutput.value, config.output_schema_key);
  const validation = validateDiligenceStageOutput(config.output_schema_key, schemaNormalizedOutput.value);

  if (!validation.ok) {
    return {
      ok: false,
      status: 422,
      stage_id: config.stage_id,
      output_schema_key: config.output_schema_key,
      output_schema_path: validation.schema_path || schemaEntry.path,
      validation_schema_key: validation.resolvedKey,
      validation_mode: validation.validation_mode,
      output_unwrapped: normalizedOutput.unwrapped,
      output_repaired: schemaNormalizedOutput.repaired,
      output_repair_notes: schemaNormalizedOutput.repair_notes,
      error_type: "SCHEMA_VALIDATION_ERROR",
      error: "Model output failed schema validation",
      validation_errors: validation.errors,
      error_summary: formatSchemaErrors(validation.errors),
      model_metadata: publicModelMetadata(runResult, schemaNormalizedOutput),
      prompt_metadata: { prompt_root: promptBundle.prompt_root, shared_sha256: promptBundle.shared_prompt.sha256, stage_sha256: promptBundle.stage_prompt.sha256, combined_characters: promptBundle.combined_characters }
    };
  }

  const guardrails = guardrailResultFor(config, schemaNormalizedOutput.value, input);
  if (!guardrails.ok) {
    return {
      ok: false,
      status: 422,
      stage_id: config.stage_id,
      output_schema_key: config.output_schema_key,
      output_schema_path: validation.schema_path || schemaEntry.path,
      validation_schema_key: validation.resolvedKey,
      validation_mode: guardrails.validation_mode,
      output_unwrapped: normalizedOutput.unwrapped,
      output_repaired: schemaNormalizedOutput.repaired,
      output_repair_notes: schemaNormalizedOutput.repair_notes,
      error_type: "GUARDRAIL_VALIDATION_ERROR",
      error: "Model output failed Target Feature Profile guardrails",
      validation_errors: guardrails.errors,
      error_summary: formatSchemaErrors(guardrails.errors),
      model_metadata: publicModelMetadata(runResult, schemaNormalizedOutput),
      prompt_metadata: { prompt_root: promptBundle.prompt_root, shared_sha256: promptBundle.shared_prompt.sha256, stage_sha256: promptBundle.stage_prompt.sha256, combined_characters: promptBundle.combined_characters }
    };
  }

  return {
    ok: true,
    status: 200,
    stage_id: config.stage_id,
    output_schema_key: config.output_schema_key,
    output_schema_path: validation.schema_path || schemaEntry.path,
    validation_schema_key: validation.resolvedKey,
    validation_mode: validation.validation_mode,
    guardrail_validation_mode: guardrails.validation_mode,
    output_unwrapped: normalizedOutput.unwrapped,
    output_repaired: schemaNormalizedOutput.repaired,
    output_repair_notes: schemaNormalizedOutput.repair_notes,
    [config.output_key]: schemaNormalizedOutput.value,
    model_metadata: publicModelMetadata(runResult, schemaNormalizedOutput),
    prompt_metadata: { prompt_root: promptBundle.prompt_root, shared_sha256: promptBundle.shared_prompt.sha256, stage_sha256: promptBundle.stage_prompt.sha256, combined_characters: promptBundle.combined_characters }
  };
}
