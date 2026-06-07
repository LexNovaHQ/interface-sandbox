import { DILIGENCE_SCHEMA_BUNDLE } from "../../../functions/_generated/diligenceSchemaBundle.js";
import { validateGeneratedSchema } from "../../../functions/_generated/diligenceValidatorBundle.js";

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

  const result = validateGeneratedSchema(schemaKey, data);

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
