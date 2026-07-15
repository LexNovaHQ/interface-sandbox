import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { load as parseYaml } from "js-yaml";

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_PHASE13_BACKEND_ROOT = resolve(MODULE_DIR, "../../../../");
export const DEFAULT_ACTIVE_QR_POINTER_PATH = "references/registry/qr/ACTIVE_QR_REGISTRY.yml";
export const QR_REGISTRY_LOADER_VERSION = "phase13_qr_registry_loader.v1";

export function loadQrRegistryAuthority({
  backendRoot = DEFAULT_PHASE13_BACKEND_ROOT,
  activePointerPath = DEFAULT_ACTIVE_QR_POINTER_PATH
} = {}) {
  const root = resolve(backendRoot);
  const pointerRecord = readYamlRecord({
    backendRoot: root,
    relativePath: activePointerPath,
    rootKey: "active_qr_registry"
  });
  const pointer = pointerRecord.value;

  requireText(pointer.authority_id, "ACTIVE_QR_POINTER_AUTHORITY_ID_MISSING");
  requireText(pointer.active_catalog_path, "ACTIVE_QR_POINTER_CATALOG_PATH_MISSING");
  if (pointer.status !== "ACTIVE") {
    throw new Error(`ACTIVE_QR_POINTER_NOT_ACTIVE:${pointer.status || "missing"}`);
  }

  const catalogRecord = readYamlRecord({
    backendRoot: root,
    relativePath: pointer.active_catalog_path,
    rootKey: "qr_registry_catalog"
  });
  const catalog = catalogRecord.value;

  if (catalog.catalog_id !== pointer.expected_catalog_id) {
    throw new Error(`ACTIVE_QR_CATALOG_ID_MISMATCH:${catalog.catalog_id || "missing"}:${pointer.expected_catalog_id || "missing"}`);
  }
  if (String(catalog.version || "") !== String(pointer.expected_catalog_version || "")) {
    throw new Error(`ACTIVE_QR_CATALOG_VERSION_MISMATCH:${catalog.version || "missing"}:${pointer.expected_catalog_version || "missing"}`);
  }

  const schemaRecord = readYamlRecord({
    backendRoot: root,
    relativePath: catalog.schema_path,
    rootKey: "qr_bridge_registry_schema"
  });

  const registryEntries = asArray(catalog.registries)
    .slice()
    .sort((a, b) => Number(a.load_order || 0) - Number(b.load_order || 0));

  if (!registryEntries.length) {
    throw new Error("ACTIVE_QR_CATALOG_HAS_NO_REGISTRIES");
  }

  const registries = registryEntries.map((entry) => {
    requireText(entry.registry_id, "QR_CATALOG_REGISTRY_ID_MISSING");
    requireText(entry.path, `QR_CATALOG_REGISTRY_PATH_MISSING:${entry.registry_id}`);
    const record = readYamlRecord({
      backendRoot: root,
      relativePath: entry.path,
      rootKey: "registry"
    });
    if (record.value.registry_id !== entry.registry_id) {
      throw new Error(`QR_CATALOG_REGISTRY_ID_MISMATCH:${entry.registry_id}:${record.value.registry_id || "missing"}`);
    }
    return Object.freeze({
      entry: freezeDeep({ ...entry }),
      registry: freezeDeep(record.value),
      relative_path: record.relative_path,
      absolute_path: record.absolute_path
    });
  });

  const documentAssets = catalog.document_assets || {};
  const templateManifestRecord = readYamlRecord({
    backendRoot: root,
    relativePath: documentAssets.template_manifest_path,
    rootKey: "template_manifest"
  });
  const injectionMapRecord = readYamlRecord({
    backendRoot: root,
    relativePath: documentAssets.injection_map_path,
    rootKey: "qr_document_injection_map"
  });
  const ownershipMatrixRecord = readJsonRecord({
    backendRoot: root,
    relativePath: catalog.phase12_authority?.ownership_matrix_path
  });

  const validationReportPaths = [
    documentAssets.registry_validation_report_path,
    documentAssets.injection_validation_report_path
  ].filter(Boolean);

  const validationReports = validationReportPaths.map((relativePath) => {
    const absolutePath = resolveAuthorityPath(root, relativePath);
    if (!existsSync(absolutePath)) {
      throw new Error(`QR_AUTHORITY_REFERENCE_MISSING:${relativePath}`);
    }
    return Object.freeze({
      relative_path: normalizeRelativePath(relative(root, absolutePath)),
      absolute_path: absolutePath
    });
  });

  return freezeDeep({
    loader_version: QR_REGISTRY_LOADER_VERSION,
    backend_root: root,
    active_pointer: pointer,
    active_pointer_path: pointerRecord.relative_path,
    catalog,
    catalog_path: catalogRecord.relative_path,
    schema: schemaRecord.value,
    schema_path: schemaRecord.relative_path,
    registries,
    template_manifest: templateManifestRecord.value,
    template_manifest_path: templateManifestRecord.relative_path,
    injection_map: injectionMapRecord.value,
    injection_map_path: injectionMapRecord.relative_path,
    ownership_matrix: ownershipMatrixRecord.value,
    ownership_matrix_path: ownershipMatrixRecord.relative_path,
    validation_reports: validationReports
  });
}

export function resolveAuthorityPath(backendRoot, requestedPath) {
  requireText(requestedPath, "QR_AUTHORITY_PATH_MISSING");
  if (isAbsolute(requestedPath)) {
    throw new Error(`QR_AUTHORITY_ABSOLUTE_PATH_FORBIDDEN:${requestedPath}`);
  }
  const root = resolve(backendRoot);
  const absolutePath = resolve(root, requestedPath);
  const rel = relative(root, absolutePath);
  if (!rel || rel === ".") {
    throw new Error(`QR_AUTHORITY_FILE_PATH_REQUIRED:${requestedPath}`);
  }
  if (rel.startsWith("..") || isAbsolute(rel)) {
    throw new Error(`QR_AUTHORITY_PATH_ESCAPE_FORBIDDEN:${requestedPath}`);
  }
  return absolutePath;
}

function readYamlRecord({ backendRoot, relativePath, rootKey }) {
  const absolutePath = resolveAuthorityPath(backendRoot, relativePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`QR_AUTHORITY_FILE_MISSING:${relativePath}`);
  }
  let parsed;
  try {
    parsed = parseYaml(readFileSync(absolutePath, "utf8"));
  } catch (error) {
    throw new Error(`QR_AUTHORITY_YAML_INVALID:${relativePath}:${error.message}`);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`QR_AUTHORITY_YAML_ROOT_INVALID:${relativePath}`);
  }
  const value = parsed[rootKey];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`QR_AUTHORITY_YAML_KEY_MISSING:${relativePath}:${rootKey}`);
  }
  return {
    value,
    relative_path: normalizeRelativePath(relative(resolve(backendRoot), absolutePath)),
    absolute_path: absolutePath
  };
}

function readJsonRecord({ backendRoot, relativePath }) {
  const absolutePath = resolveAuthorityPath(backendRoot, relativePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`QR_AUTHORITY_FILE_MISSING:${relativePath}`);
  }
  let value;
  try {
    value = JSON.parse(readFileSync(absolutePath, "utf8"));
  } catch (error) {
    throw new Error(`QR_AUTHORITY_JSON_INVALID:${relativePath}:${error.message}`);
  }
  return {
    value,
    relative_path: normalizeRelativePath(relative(resolve(backendRoot), absolutePath)),
    absolute_path: absolutePath
  };
}

function normalizeRelativePath(value) {
  return String(value || "").replaceAll("\\", "/");
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function requireText(value, code) {
  if (!String(value || "").trim()) throw new Error(code);
}

function freezeDeep(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) freezeDeep(child);
  return value;
}
