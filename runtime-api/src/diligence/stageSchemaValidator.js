import { DILIGENCE_SCHEMA_BUNDLE } from "../../functions/_generated/diligenceSchemaBundle.js";
import { validateGeneratedSchema } from "../../functions/_generated/diligenceValidatorBundle.js";

const REGISTRY_EVIDENCE_REF_FALLBACK = "EVIDENCE_REF_NOT_EMITTED_BY_MODEL: see condition basis and admitted evidence packet";

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
  const direct = DILIGENCE_SCHEMA_BUNDLE.schemas?.[schemaKey];
  if (direct) return direct;

  const canonicalPath = DILIGENCE_SCHEMA_BUNDLE.canonical_schema_paths?.[schemaKey];
  if (!canonicalPath) return null;

  return Object.values(DILIGENCE_SCHEMA_BUNDLE.schemas || {}).find((entry) => entry.path === canonicalPath) || null;
}

export function validateDiligenceStageOutput(schemaKey, data) {
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

  const dataForValidation = normalizeRegistryLedgerForSchema(schemaKey, data);
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
    schema_keys: Object.keys(DILIGENCE_SCHEMA_BUNDLE.schemas || {})
  };
}
