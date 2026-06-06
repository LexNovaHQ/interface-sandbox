function makeError(instancePath, message, keyword = "validation") {
  return {
    keyword,
    instancePath,
    schemaPath: "",
    message,
    params: {}
  };
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function typeMatches(expectedType, value) {
  if (Array.isArray(expectedType)) {
    return expectedType.some((type) => typeMatches(type, value));
  }

  if (expectedType === "null") return value === null;
  if (expectedType === "array") return Array.isArray(value);
  if (expectedType === "object") return isObject(value);
  if (expectedType === "integer") return Number.isInteger(value);
  if (expectedType === "number") return typeof value === "number" && Number.isFinite(value);
  return typeof value === expectedType;
}

function getTypeName(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function validateEnum(schema, value, instancePath, errors) {
  if (!Array.isArray(schema.enum)) return;
  const ok = schema.enum.some((item) => item === value);
  if (!ok) errors.push(makeError(instancePath, `must be one of: ${schema.enum.join(", ")}`, "enum"));
}

function validateConst(schema, value, instancePath, errors) {
  if (!Object.prototype.hasOwnProperty.call(schema, "const")) return;
  if (schema.const !== value) errors.push(makeError(instancePath, `must equal ${JSON.stringify(schema.const)}`, "const"));
}

function resolveLocalRef(rootSchema, ref) {
  if (!ref || !ref.startsWith("#/$defs/")) return null;
  const key = ref.replace("#/$defs/", "");
  return rootSchema?.$defs?.[key] || null;
}

function validateSchemaNode(schema, value, instancePath, errors, rootSchema, depth = 0) {
  if (!schema || typeof schema !== "object" || depth > 24) return;

  if (schema.$ref) {
    const resolved = resolveLocalRef(rootSchema, schema.$ref);
    if (resolved) validateSchemaNode(resolved, value, instancePath, errors, rootSchema, depth + 1);
    return;
  }

  if (schema.type && !typeMatches(schema.type, value)) {
    errors.push(makeError(instancePath, `must be ${Array.isArray(schema.type) ? schema.type.join(" or ") : schema.type}; received ${getTypeName(value)}`, "type"));
    return;
  }

  validateEnum(schema, value, instancePath, errors);
  validateConst(schema, value, instancePath, errors);

  if (schema.type === "object" || (schema.properties && isObject(value))) {
    if (!isObject(value)) return;

    const required = Array.isArray(schema.required) ? schema.required : [];
    required.forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(value, key)) {
        errors.push(makeError(`${instancePath}/${key}`, "is required", "required"));
      }
    });

    Object.entries(schema.properties || {}).forEach(([key, childSchema]) => {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        validateSchemaNode(childSchema, value[key], `${instancePath}/${key}`, errors, rootSchema, depth + 1);
      }
    });

    if (schema.additionalProperties === false && schema.properties) {
      Object.keys(value).forEach((key) => {
        if (!Object.prototype.hasOwnProperty.call(schema.properties, key)) {
          errors.push(makeError(`${instancePath}/${key}`, "additional property is not allowed", "additionalProperties"));
        }
      });
    }
  }

  if (schema.type === "array" || (schema.items && Array.isArray(value))) {
    if (!Array.isArray(value)) return;

    if (Number.isInteger(schema.minItems) && value.length < schema.minItems) {
      errors.push(makeError(instancePath, `must contain at least ${schema.minItems} item(s)`, "minItems"));
    }

    if (Number.isInteger(schema.maxItems) && value.length > schema.maxItems) {
      errors.push(makeError(instancePath, `must contain at most ${schema.maxItems} item(s)`, "maxItems"));
    }

    if (schema.items) {
      value.forEach((item, index) => {
        validateSchemaNode(schema.items, item, `${instancePath}/${index}`, errors, rootSchema, depth + 1);
      });
    }
  }
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

export function createJsonSchemaValidator() {
  return (schema, data) => validateJsonSchema(schema, data);
}

export function validateJsonSchema(schema, data) {
  const errors = [];
  validateSchemaNode(schema, data, "", errors, schema);

  return {
    ok: errors.length === 0,
    errors,
    validation_mode: "cloudflare_no_eval_structural"
  };
}
