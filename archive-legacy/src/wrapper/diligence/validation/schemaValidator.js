import Ajv2020 from "ajv/dist/2020.js";
import { loadSchema } from "./schemaLoader.js";

const validatorCache = new Map();

function normalizeAjvError(error) {
  return {
    keyword: error.keyword,
    instancePath: error.instancePath || "",
    schemaPath: error.schemaPath || "",
    message: error.message || "schema validation error",
    params: error.params || {}
  };
}

function normalizeAjvErrors(errors = []) {
  return errors.map(normalizeAjvError);
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

export function createValidator(options = {}) {
  return new Ajv2020({
    allErrors: true,
    strict: false,
    validateFormats: false,
    allowUnionTypes: true,
    ...options
  });
}

export function compileSchema(schema, options = {}) {
  const ajv = createValidator(options);
  return ajv.compile(schema);
}

export function validateJsonSchema(schema, data, options = {}) {
  const validate = compileSchema(schema, options);
  const ok = validate(data);
  const errors = normalizeAjvErrors(validate.errors || []);

  return {
    ok,
    errors
  };
}

export async function validateAgainstSchema(schemaKey, data, options = {}) {
  const schema = await loadSchema(schemaKey, options.loaderOptions ?? {});
  const cacheKey = `${schemaKey}:${schema.$id || schema.title || "schema"}`;

  let validate = validatorCache.get(cacheKey);

  if (!validate || options.bypassCache) {
    validate = compileSchema(schema, options.ajvOptions ?? {});
    validatorCache.set(cacheKey, validate);
  }

  const ok = validate(data);
  const errors = normalizeAjvErrors(validate.errors || []);

  return {
    ok,
    schemaKey,
    errors,
    errorSummary: formatSchemaErrors(errors)
  };
}

export async function assertValidAgainstSchema(schemaKey, data, options = {}) {
  const result = await validateAgainstSchema(schemaKey, data, options);

  if (!result.ok) {
    const error = new Error(`Schema validation failed for ${schemaKey}:\n${result.errorSummary}`);
    error.validation = result;
    throw error;
  }

  return result;
}

export function clearValidatorCache() {
  validatorCache.clear();
}
