import { DILIGENCE_SCHEMA_BUNDLE } from "../../functions/_generated/diligenceSchemaBundle.js";
import { validateGeneratedSchema } from "../../functions/_generated/diligenceValidatorBundle.js";

const REGISTRY_EVIDENCE_REF_FALLBACK = "EVIDENCE_REF_NOT_EMITTED_BY_MODEL: see condition basis and admitted evidence packet";
const TARGET_PROFILE_V2_PATH = "/data/schemas/companyProfile.schema.json";
const TARGET_PROFILE_V2_TOP_LEVEL_KEYS = [
  "target_profile_version",
  "identity",
  "jurisdiction",
  "business_model",
  "market_context",
  "product_baseline",
  "data_touchpoint_map",
  "vault_baseline_candidates",
  "pipeline_assumptions",
  "evidence",
  "limitations"
];
const CONFIDENCE_VALUES = new Set(["high", "medium", "low", "unknown"]);
const CANDIDATE_STATUSES = new Set(["PREFILL_READY", "CONFIRM", "UNKNOWN"]);
const TRI_STATE_VALUES = new Set(["true", "false", "unknown"]);
const ABSENCE_MARKERS = new Set(["", "unknown", "not_visible", "not published", "not_published", "not found", "not_found", "not stated", "not_stated", "not available", "not_available", "none", "n/a", "na", "unclear"]);

function normalizeRegistryEvidenceRefValue(value) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    const joined = value
      .map((item) => normalizeRegistryEvidenceRefValue(item))
      .filter((item) => item && item !== REGISTRY_EVIDENCE_REF_FALLBACK)
      .join(", ");
    return joined || REGISTRY_EVIDENCE_REF_FALLBACK;
  }
  if (value && typeof value === "object") {
    const readable = [value.evidence_ref, value.source_id, value.source_url, value.url, value.summary, value.basis]
      .filter((item) => typeof item === "string" && item.trim())
      .map((item) => item.trim())
      .join(" — ");
    if (readable) return readable;
    try {
      const serialized = JSON.stringify(value);
      return serialized && serialized !== "{}" ? serialized : REGISTRY_EVIDENCE_REF_FALLBACK;
    } catch {
      return REGISTRY_EVIDENCE_REF_FALLBACK;
    }
  }
  return REGISTRY_EVIDENCE_REF_FALLBACK;
}

function normalizeRegistryLedgerForSchema(schemaKey, data) {
  if (schemaKey !== "registryLedger") return data;
  if (!data || typeof data !== "object" || Array.isArray(data)) return data;
  if (!Array.isArray(data.registry_evaluation_ledger)) return data;

  for (const entry of data.registry_evaluation_ledger) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    entry.evidence_ref = normalizeRegistryEvidenceRefValue(entry.evidence_ref);
  }

  return data;
}

function normalizeValidationError(error) {
  return {
    keyword: error?.keyword || "validation",
    instancePath: error?.instancePath || "",
    schemaPath: error?.schemaPath || "",
    message: error?.message || "schema validation error",
    params: error?.params || {}
  };
}

function error(instancePath, message, keyword = "validation", params = {}) {
  return { keyword, instancePath, schemaPath: "", message, params };
}

function isObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function hasOnlyKeys(value, keys, path, errors) {
  const allowed = new Set(keys);
  for (const key of Object.keys(value || {})) {
    if (!allowed.has(key)) errors.push(error(`${path}/${key}`, "must NOT have additional properties", "additionalProperties", { additionalProperty: key }));
  }
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(value || {}, key)) errors.push(error(path || "/", `must have required property '${key}'`, "required", { missingProperty: key }));
  }
}

function assertString(value, path, errors) {
  if (typeof value !== "string") errors.push(error(path, "must be string", "type"));
}

function assertArray(value, path, errors) {
  if (!Array.isArray(value)) errors.push(error(path, "must be array", "type"));
}

function assertConfidence(value, path, errors) {
  if (!CONFIDENCE_VALUES.has(value)) errors.push(error(path, "must be one of high, medium, low, unknown", "enum"));
}

function normalizeTriStateValue(value) {
  if (value === true) return "true";
  if (value === false) return "false";
  if (value === null || value === undefined) return "unknown";
  if (typeof value === "number") {
    if (value === 1) return "true";
    if (value === 0) return "false";
  }
  if (typeof value !== "string") return value;
  const normalized = value.trim().toLowerCase();
  if (TRI_STATE_VALUES.has(normalized)) return normalized;
  if (["yes", "y", "present", "available", "published", "supported", "has", "included"].includes(normalized)) return "true";
  if (["no", "n", "absent", "unavailable", "unsupported", "does not have", "not included"].includes(normalized)) return "false";
  if (ABSENCE_MARKERS.has(normalized)) return "unknown";
  return value;
}

function normalizeConfidenceValue(value) {
  if (value === null || value === undefined) return "unknown";
  if (typeof value !== "string") return value;
  const normalized = value.trim().toLowerCase();
  if (CONFIDENCE_VALUES.has(normalized)) return normalized;
  if (["not_published", "not published", "not_visible", "not visible", "unclear", "not found", "not_found"].includes(normalized)) return "unknown";
  return value;
}

function normalizeEnumRepresentations(value) {
  if (Array.isArray(value)) {
    value.forEach((item) => normalizeEnumRepresentations(item));
    return value;
  }
  if (!isObject(value)) return value;
  for (const [key, child] of Object.entries(value)) {
    if (["delivery_app_candidate", "delivery_api_candidate", "external_action_signal", "app", "api", "web"].includes(key)) {
      value[key] = normalizeTriStateValue(child);
      continue;
    }
    if (key === "confidence" || key.endsWith("_confidence")) {
      value[key] = normalizeConfidenceValue(child);
      continue;
    }
    normalizeEnumRepresentations(child);
  }
  return value;
}

function normalizeTargetProfileV2ForValidation(data) {
  return normalizeEnumRepresentations(data);
}

function normalizeTargetFeatureProfileForValidation(data) {
  return normalizeEnumRepresentations(data);
}

function normalizeOutputForSchema(schemaKey, data) {
  if (schemaKey === "targetProfileV2") return normalizeTargetProfileV2ForValidation(data);
  if (schemaKey === "targetFeatureProfile") return normalizeTargetFeatureProfileForValidation(data);
  return normalizeRegistryLedgerForSchema(schemaKey, data);
}

function validateCandidate(value, path, errors) {
  if (!isObject(value)) {
    errors.push(error(path, "must be object", "type"));
    return;
  }
  hasOnlyKeys(value, ["value", "status", "basis", "confidence", "evidence_refs"], path, errors);
  if (!CANDIDATE_STATUSES.has(value.status)) errors.push(error(`${path}/status`, "must be PREFILL_READY, CONFIRM, or UNKNOWN", "enum"));
  assertString(value.basis, `${path}/basis`, errors);
  assertConfidence(value.confidence, `${path}/confidence`, errors);
  assertArray(value.evidence_refs, `${path}/evidence_refs`, errors);
}

function validateCandidateTree(value, path, errors) {
  if (!isObject(value)) {
    errors.push(error(path, "must be object", "type"));
    return;
  }
  if (Object.prototype.hasOwnProperty.call(value, "status")) {
    validateCandidate(value, path, errors);
    return;
  }
  for (const [key, child] of Object.entries(value)) validateCandidateTree(child, `${path}/${key}`, errors);
}

function validateTargetProfileV2(data) {
  const errors = [];
  const normalizedData = normalizeTargetProfileV2ForValidation(data);
  if (!isObject(normalizedData)) return { ok: false, errors: [error("/", "must be object", "type")] };

  hasOnlyKeys(normalizedData, TARGET_PROFILE_V2_TOP_LEVEL_KEYS, "", errors);
  if (normalizedData.target_profile_version !== "target_profile_v2") errors.push(error("/target_profile_version", "must be target_profile_v2", "const"));

  for (const legacy of ["company_profile_version", "company_identity", "operating_profile", "downstream_assumptions"]) {
    if (Object.prototype.hasOwnProperty.call(normalizedData, legacy)) errors.push(error(`/${legacy}`, "legacy Stage 4 key is forbidden in target_profile_v2", "forbidden"));
  }

  if (isObject(normalizedData.identity)) {
    hasOnlyKeys(normalizedData.identity, ["brand_name", "legal_name", "trade_names", "website", "domain", "entity_type", "entity_type_family", "corporate_status_signal", "operator_or_controller_signal", "identity_confidence"], "/identity", errors);
    ["brand_name", "legal_name", "website", "domain", "entity_type", "corporate_status_signal", "operator_or_controller_signal"].forEach((key) => assertString(normalizedData.identity[key], `/identity/${key}`, errors));
    assertArray(normalizedData.identity.trade_names, "/identity/trade_names", errors);
    if (!["india", "us", "eu_uk", "other", "unknown"].includes(normalizedData.identity.entity_type_family)) errors.push(error("/identity/entity_type_family", "must be india, us, eu_uk, other, or unknown", "enum"));
    assertConfidence(normalizedData.identity.identity_confidence, "/identity/identity_confidence", errors);
  }

  if (isObject(normalizedData.jurisdiction)) {
    hasOnlyKeys(normalizedData.jurisdiction, ["registered_or_notice_country", "registered_or_notice_state", "city", "full_address", "governing_law_country", "governing_law_state", "courts_or_venue", "source_basis", "confidence"], "/jurisdiction", errors);
    ["registered_or_notice_country", "registered_or_notice_state", "city", "full_address", "governing_law_country", "governing_law_state", "courts_or_venue", "source_basis"].forEach((key) => assertString(normalizedData.jurisdiction[key], `/jurisdiction/${key}`, errors));
    assertConfidence(normalizedData.jurisdiction.confidence, "/jurisdiction/confidence", errors);
  }

  if (isObject(normalizedData.business_model)) {
    hasOnlyKeys(normalizedData.business_model, ["business_category", "primary_customer_type", "market_type_candidate", "sales_motion", "revenue_model_signal", "enterprise_or_self_serve_signal", "public_sector_signal", "business_model_confidence"], "/business_model", errors);
    ["business_category", "primary_customer_type", "sales_motion", "revenue_model_signal", "enterprise_or_self_serve_signal", "public_sector_signal"].forEach((key) => assertString(normalizedData.business_model[key], `/business_model/${key}`, errors));
    if (!["b2b", "b2c", "hybrid", "unknown"].includes(normalizedData.business_model.market_type_candidate)) errors.push(error("/business_model/market_type_candidate", "must be b2b, b2c, hybrid, or unknown", "enum"));
    assertConfidence(normalizedData.business_model.business_model_confidence, "/business_model/business_model_confidence", errors);
  }

  if (isObject(normalizedData.market_context)) {
    hasOnlyKeys(normalizedData.market_context, ["industry", "target_geographies", "target_languages", "regulated_sector_hints", "market_context_confidence"], "/market_context", errors);
    assertString(normalizedData.market_context.industry, "/market_context/industry", errors);
    assertArray(normalizedData.market_context.target_geographies, "/market_context/target_geographies", errors);
    assertArray(normalizedData.market_context.target_languages, "/market_context/target_languages", errors);
    assertArray(normalizedData.market_context.regulated_sector_hints, "/market_context/regulated_sector_hints", errors);
    assertConfidence(normalizedData.market_context.market_context_confidence, "/market_context/market_context_confidence", errors);
  }

  if (isObject(normalizedData.product_baseline)) {
    hasOnlyKeys(normalizedData.product_baseline, ["high_level_offering", "primary_claim", "products", "delivery_app_candidate", "delivery_api_candidate", "beta_or_preview_signal", "integration_candidates"], "/product_baseline", errors);
    ["high_level_offering", "primary_claim", "beta_or_preview_signal"].forEach((key) => assertString(normalizedData.product_baseline[key], `/product_baseline/${key}`, errors));
    assertArray(normalizedData.product_baseline.products, "/product_baseline/products", errors);
    assertArray(normalizedData.product_baseline.integration_candidates, "/product_baseline/integration_candidates", errors);
    if (!TRI_STATE_VALUES.has(normalizedData.product_baseline.delivery_app_candidate)) errors.push(error("/product_baseline/delivery_app_candidate", "must be true, false, or unknown", "enum"));
    if (!TRI_STATE_VALUES.has(normalizedData.product_baseline.delivery_api_candidate)) errors.push(error("/product_baseline/delivery_api_candidate", "must be true, false, or unknown", "enum"));
  }

  assertArray(normalizedData.data_touchpoint_map, "/data_touchpoint_map", errors);
  if (isObject(normalizedData.vault_baseline_candidates)) validateCandidateTree(normalizedData.vault_baseline_candidates, "/vault_baseline_candidates", errors);
  if (isObject(normalizedData.evidence)) {
    hasOnlyKeys(normalizedData.evidence, ["field_evidence_refs", "unresolved_questions"], "/evidence", errors);
    assertArray(normalizedData.evidence.field_evidence_refs, "/evidence/field_evidence_refs", errors);
    assertArray(normalizedData.evidence.unresolved_questions, "/evidence/unresolved_questions", errors);
  }
  assertArray(normalizedData.limitations, "/limitations", errors);

  return { ok: errors.length === 0, errors };
}

export function formatSchemaErrors(errors = []) {
  if (!errors.length) return "No schema errors.";

  return errors
    .map((error) => {
      const location = error.instancePath || "/";
      const message = error.message || "schema validation error";
      return `${location}: ${message}`;
    })
    .join("\n");
}

export function resolveSchemaEntry(schemaKey) {
  if (schemaKey === "targetProfileV2") {
    return {
      schema_id: "targetProfileV2",
      path: TARGET_PROFILE_V2_PATH,
      schema: { title: "Canonical Target Profile", $id: "https://interface-sandbox.local/schemas/companyProfile.schema.json" }
    };
  }

  const direct = DILIGENCE_SCHEMA_BUNDLE.schemas?.[schemaKey];
  if (direct) return direct;

  const canonicalPath = DILIGENCE_SCHEMA_BUNDLE.canonical_schema_paths?.[schemaKey];
  if (!canonicalPath) return null;

  return Object.values(DILIGENCE_SCHEMA_BUNDLE.schemas || {}).find((entry) => entry.path === canonicalPath) || null;
}

export function validateDiligenceStageOutput(schemaKey, data) {
  if (schemaKey === "targetProfileV2") {
    const result = validateTargetProfileV2(data);
    return {
      ok: result.ok,
      schemaKey,
      resolvedKey: "targetProfileV2",
      schema_path: TARGET_PROFILE_V2_PATH,
      validation_mode: "stage4_target_profile_v2_runtime_guardrail",
      errors: (result.errors || []).map(normalizeValidationError)
    };
  }

  const schemaEntry = resolveSchemaEntry(schemaKey);

  if (!schemaEntry?.schema) {
    return {
      ok: false,
      schemaKey,
      resolvedKey: schemaKey,
      validation_mode: "schema_bundle_missing",
      errors: [
        {
          keyword: "schema_missing",
          instancePath: "",
          schemaPath: "",
          message: `Output schema not found for ${schemaKey}`,
          params: { schemaKey }
        }
      ]
    };
  }

  const dataForValidation = normalizeOutputForSchema(schemaKey, data);
  const result = validateGeneratedSchema(schemaKey, dataForValidation);

  return {
    ok: result.ok,
    schemaKey: result.schemaKey || schemaKey,
    resolvedKey: result.resolvedKey || schemaEntry.schema_id || schemaKey,
    schema_path: schemaEntry.path,
    validation_mode: "build_time_ajv_standalone",
    errors: (result.errors || []).map(normalizeValidationError)
  };
}

export function getSchemaBundleStatus() {
  return {
    generated_at: DILIGENCE_SCHEMA_BUNDLE.generated_at,
    schema_count: Object.keys(DILIGENCE_SCHEMA_BUNDLE.schemas || {}).length,
    schema_keys: [...Object.keys(DILIGENCE_SCHEMA_BUNDLE.schemas || {}), "targetProfileV2"]
  };
}
