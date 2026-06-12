import { validateGeneratedSchema } from "../_generated/diligenceValidatorBundle.js";

const NONBLOCKING_STAGE4_STAGE5_KEYS = new Set([
  "targetProfileV2",
  "companyProfile",
  "targetFeatureProfile"
]);

function normalizeValidationError(error) {
  return {
    keyword: error?.keyword || "validation",
    instancePath: error?.instancePath || "",
    schemaPath: error?.schemaPath || "",
    message: error?.message || "schema validation error",
    params: error?.params || {}
  };
}

function normalizeValidationErrors(errors = []) {
  return errors.map(normalizeValidationError);
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

export function createJsonSchemaValidator(schemaKey) {
  return (data) => validateJsonSchema(schemaKey, data);
}

export function validateJsonSchema(schemaKey, data) {
  const result = validateGeneratedSchema(schemaKey, data);
  const errors = normalizeValidationErrors(result.errors || []);

  if (NONBLOCKING_STAGE4_STAGE5_KEYS.has(schemaKey)) {
    return {
      ok: true,
      schemaKey: result.schemaKey || schemaKey,
      resolvedKey: result.resolvedKey || schemaKey,
      errors: [],
      nonblocking_ajv_errors: errors,
      validation_mode: result.ok ? "stage4_stage5_ajv_passed" : "stage4_stage5_ajv_nonblocking"
    };
  }

  return {
    ok: result.ok,
    schemaKey: result.schemaKey,
    resolvedKey: result.resolvedKey,
    errors,
    validation_mode: "build_time_ajv_standalone"
  };
}
