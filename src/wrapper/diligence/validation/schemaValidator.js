import { loadSchema } from "./schemaLoader.js";

function getJsonType(value) {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  if (Number.isInteger(value)) return "integer";
  return typeof value;
}

function toAllowedTypes(typeRule) {
  if (!typeRule) return [];
  return Array.isArray(typeRule) ? typeRule : [typeRule];
}

function isAllowedType(value, typeRule) {
  const actualType = getJsonType(value);
  const allowedTypes = toAllowedTypes(typeRule);

  return allowedTypes.some((allowedType) => {
    if (allowedType === "number") return actualType === "number" || actualType === "integer";
    if (allowedType === "integer") return actualType === "integer";
    return actualType === allowedType;
  });
}

function makeError(keyword, instancePath, schemaPath, message, params = {}) {
  return {
    keyword,
    instancePath,
    schemaPath,
    message,
    params
  };
}

function escapePointerSegment(segment) {
  return String(segment).replace(/~/g, "~0").replace(/\//g, "~1");
}

function decodePointerSegment(segment) {
  return segment.replace(/~1/g, "/").replace(/~0/g, "~");
}

function resolveJsonPointer(rootSchema, pointer) {
  if (!pointer || pointer === "#") return rootSchema;

  if (!pointer.startsWith("#/")) {
    throw new Error(`Only local JSON pointers are supported. Received: ${pointer}`);
  }

  const parts = pointer.slice(2).split("/").map(decodePointerSegment);
  let current = rootSchema;

  for (const part of parts) {
    current = current?.[part];
    if (current === undefined) {
      throw new Error(`Unresolved schema reference: ${pointer}`);
    }
  }

  return current;
}

function validateFormat(schema, data, instancePath, schemaPath, errors) {
  if (!schema.format || typeof data !== "string") return;

  if (schema.format === "date-time" && Number.isNaN(Date.parse(data))) {
    errors.push(makeError("format", instancePath, `${schemaPath}/format`, "must match date-time format", { format: "date-time" }));
  }
}

function validateSchemaNode(schema, data, rootSchema, instancePath, schemaPath, errors, refStack) {
  if (schema === true || schema === undefined) return;

  if (schema === false) {
    errors.push(makeError("falseSchema", instancePath, schemaPath, "schema does not allow this value"));
    return;
  }

  if (schema.$ref) {
    if (refStack.includes(schema.$ref)) {
      throw new Error(`Circular schema reference detected: ${[...refStack, schema.$ref].join(" -> ")}`);
    }

    const resolved = resolveJsonPointer(rootSchema, schema.$ref);
    validateSchemaNode(resolved, data, rootSchema, instancePath, schema.$ref, errors, [...refStack, schema.$ref]);
    return;
  }

  if (Array.isArray(schema.allOf)) {
    schema.allOf.forEach((childSchema, index) => {
      validateSchemaNode(childSchema, data, rootSchema, instancePath, `${schemaPath}/allOf/${index}`, errors, refStack);
    });
  }

  if (Array.isArray(schema.anyOf)) {
    const childResults = schema.anyOf.map((childSchema, index) => {
      const childErrors = [];
      validateSchemaNode(childSchema, data, rootSchema, instancePath, `${schemaPath}/anyOf/${index}`, childErrors, refStack);
      return childErrors;
    });

    if (!childResults.some((childErrors) => childErrors.length === 0)) {
      errors.push(makeError("anyOf", instancePath, `${schemaPath}/anyOf`, "must match at least one allowed schema"));
    }
  }

  if (Array.isArray(schema.oneOf)) {
    const matchCount = schema.oneOf.reduce((count, childSchema, index) => {
      const childErrors = [];
      validateSchemaNode(childSchema, data, rootSchema, instancePath, `${schemaPath}/oneOf/${index}`, childErrors, refStack);
      return count + (childErrors.length === 0 ? 1 : 0);
    }, 0);

    if (matchCount !== 1) {
      errors.push(makeError("oneOf", instancePath, `${schemaPath}/oneOf`, "must match exactly one allowed schema", { matchCount }));
    }
  }

  if (schema.const !== undefined && data !== schema.const) {
    errors.push(makeError("const", instancePath, `${schemaPath}/const`, `must equal ${JSON.stringify(schema.const)}`, { allowedValue: schema.const }));
  }

  if (Array.isArray(schema.enum) && !schema.enum.includes(data)) {
    errors.push(makeError("enum", instancePath, `${schemaPath}/enum`, `must be one of: ${schema.enum.map((item) => JSON.stringify(item)).join(", ")}`, { allowedValues: schema.enum }));
  }

  if (schema.type && !isAllowedType(data, schema.type)) {
    errors.push(makeError("type", instancePath, `${schemaPath}/type`, `must be ${toAllowedTypes(schema.type).join(" or ")}`, { type: schema.type, actualType: getJsonType(data) }));
    return;
  }

  validateFormat(schema, data, instancePath, schemaPath, errors);

  if (typeof data === "number" && schema.minimum !== undefined && data < schema.minimum) {
    errors.push(makeError("minimum", instancePath, `${schemaPath}/minimum`, `must be >= ${schema.minimum}`, { minimum: schema.minimum }));
  }

  if (typeof data === "string" && schema.minLength !== undefined && data.length < schema.minLength) {
    errors.push(makeError("minLength", instancePath, `${schemaPath}/minLength`, `must NOT have fewer than ${schema.minLength} characters`, { minLength: schema.minLength }));
  }

  if (Array.isArray(data)) {
    if (schema.minItems !== undefined && data.length < schema.minItems) {
      errors.push(makeError("minItems", instancePath, `${schemaPath}/minItems`, `must NOT have fewer than ${schema.minItems} items`, { minItems: schema.minItems }));
    }

    if (schema.maxItems !== undefined && data.length > schema.maxItems) {
      errors.push(makeError("maxItems", instancePath, `${schemaPath}/maxItems`, `must NOT have more than ${schema.maxItems} items`, { maxItems: schema.maxItems }));
    }

    if (schema.items) {
      data.forEach((item, index) => {
        validateSchemaNode(schema.items, item, rootSchema, `${instancePath}/${index}`, `${schemaPath}/items`, errors, refStack);
      });
    }
  }

  if (data && typeof data === "object" && !Array.isArray(data)) {
    const properties = schema.properties ?? {};
    const required = schema.required ?? [];

    required.forEach((propertyName) => {
      if (data[propertyName] === undefined) {
        errors.push(makeError("required", instancePath, `${schemaPath}/required`, `must have required property '${propertyName}'`, { missingProperty: propertyName }));
      }
    });

    Object.entries(properties).forEach(([propertyName, propertySchema]) => {
      if (data[propertyName] !== undefined) {
        validateSchemaNode(
          propertySchema,
          data[propertyName],
          rootSchema,
          `${instancePath}/${escapePointerSegment(propertyName)}`,
          `${schemaPath}/properties/${escapePointerSegment(propertyName)}`,
          errors,
          refStack
        );
      }
    });

    const knownProperties = new Set(Object.keys(properties));
    const unknownProperties = Object.keys(data).filter((propertyName) => !knownProperties.has(propertyName));

    if (schema.additionalProperties === false) {
      unknownProperties.forEach((propertyName) => {
        errors.push(makeError("additionalProperties", instancePath, `${schemaPath}/additionalProperties`, `must NOT have additional property '${propertyName}'`, { additionalProperty: propertyName }));
      });
    } else if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
      unknownProperties.forEach((propertyName) => {
        validateSchemaNode(
          schema.additionalProperties,
          data[propertyName],
          rootSchema,
          `${instancePath}/${escapePointerSegment(propertyName)}`,
          `${schemaPath}/additionalProperties`,
          errors,
          refStack
        );
      });
    }
  }
}

export function validateJsonSchema(schema, data) {
  const errors = [];
  validateSchemaNode(schema, data, schema, "", "#", errors, []);
  return {
    ok: errors.length === 0,
    errors
  };
}

export function formatSchemaErrors(errors = []) {
  if (!errors.length) return "No schema errors.";

  return errors
    .map((error) => {
      const location = error.instancePath || "/";
      return `${location}: ${error.message}`;
    })
    .join("\n");
}

export function createValidator() {
  return {
    validate(schema, data) {
      return validateJsonSchema(schema, data);
    }
  };
}

export async function validateAgainstSchema(schemaKey, data, options = {}) {
  const schema = await loadSchema(schemaKey, options);
  const result = validateJsonSchema(schema, data);

  return {
    ok: result.ok,
    schemaKey,
    errors: result.errors,
    errorSummary: formatSchemaErrors(result.errors)
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
