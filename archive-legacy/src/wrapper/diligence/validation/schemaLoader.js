import { CANONICAL_SCHEMA_PATHS, SCHEMA_PATHS } from "../../../lib/schemas.js";

const schemaCache = new Map();

function isNodeRuntime() {
  return typeof process !== "undefined" && Boolean(process.versions?.node);
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeSchemaPath(schemaPath) {
  if (!schemaPath || typeof schemaPath !== "string") {
    throw new Error(`Invalid schema path: ${schemaPath}`);
  }

  return schemaPath;
}

export function getSchemaPath(schemaKey) {
  if (!schemaKey || typeof schemaKey !== "string") {
    throw new Error("schemaKey must be a non-empty string");
  }

  if (schemaKey.startsWith("/data/schemas/")) {
    return normalizeSchemaPath(schemaKey);
  }

  if (SCHEMA_PATHS[schemaKey]) {
    return normalizeSchemaPath(SCHEMA_PATHS[schemaKey]);
  }

  if (CANONICAL_SCHEMA_PATHS[schemaKey]) {
    return normalizeSchemaPath(CANONICAL_SCHEMA_PATHS[schemaKey]);
  }

  const knownKeys = [
    ...Object.keys(SCHEMA_PATHS),
    ...Object.keys(CANONICAL_SCHEMA_PATHS)
  ].sort();

  throw new Error(`Unknown schema key "${schemaKey}". Known keys: ${knownKeys.join(", ")}`);
}

async function loadSchemaFromNode(schemaPath) {
  const { readFile } = await import("node:fs/promises");
  const { resolve } = await import("node:path");

  const filePath = resolve(process.cwd(), schemaPath.replace(/^\//, ""));
  const raw = await readFile(filePath, "utf8");

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Failed to parse schema JSON at ${schemaPath}: ${error.message}`);
  }
}

async function loadSchemaFromFetch(schemaPath, options = {}) {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;

  if (typeof fetchImpl !== "function") {
    throw new Error(`No fetch implementation available to load schema ${schemaPath}`);
  }

  const baseUrl = options.baseUrl ?? globalThis.location?.origin;
  const url = baseUrl ? new URL(schemaPath, baseUrl).toString() : schemaPath;
  const response = await fetchImpl(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch schema ${schemaPath}: ${response.status} ${response.statusText}`);
  }

  try {
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to parse fetched schema JSON at ${schemaPath}: ${error.message}`);
  }
}

export async function loadSchema(schemaKey, options = {}) {
  const schemaPath = getSchemaPath(schemaKey);
  const cacheKey = schemaPath;

  if (!options.bypassCache && schemaCache.has(cacheKey)) {
    return cloneJson(schemaCache.get(cacheKey));
  }

  let schema;

  if (isNodeRuntime()) {
    schema = await loadSchemaFromNode(schemaPath);
  } else {
    schema = await loadSchemaFromFetch(schemaPath, options);
  }

  schemaCache.set(cacheKey, cloneJson(schema));
  return cloneJson(schema);
}

export function clearSchemaCache() {
  schemaCache.clear();
}
