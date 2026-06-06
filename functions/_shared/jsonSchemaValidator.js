import { validateGeneratedSchema } from "../_generated/diligenceValidatorBundle.js";

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

  return {
    ok: result.ok,
    schemaKey: result.schemaKey,
    resolvedKey: result.resolvedKey,
    errors: normalizeValidationErrors(result.errors || []),
    validation_mode: "build_time_ajv_standalone"
  };
}
