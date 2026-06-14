import Ajv2020 from "ajv/dist/2020.js";

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

export function createJsonSchemaValidator(options = {}) {
  return new Ajv2020({
    allErrors: true,
    strict: false,
    validateFormats: false,
    allowUnionTypes: true,
    ...options
  });
}

export function validateJsonSchema(schema, data, options = {}) {
  const ajv = createJsonSchemaValidator(options);
  const validate = ajv.compile(schema);
  const ok = validate(data);

  return {
    ok,
    errors: normalizeAjvErrors(validate.errors || [])
  };
}
