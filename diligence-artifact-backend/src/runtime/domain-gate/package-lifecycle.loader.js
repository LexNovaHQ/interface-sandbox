import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { loadPackageCatalogV0 } from "./package-catalog.loader.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(__dirname, "../../..");
export const PACKAGE_LIFECYCLE_PATH = path.join(BACKEND_ROOT, "references/domain-packages/package-lifecycle.v1.yml");

export const PACKAGE_LIFECYCLE_VALUES = Object.freeze([
  "ACTIVE_E2E",
  "ACTIVE_REPORT_ONLY",
  "DECLARED_NOT_INSTALLED",
  "FALLBACK_ONLY"
]);

const SELECTABLE = new Set(["ACTIVE_E2E", "ACTIVE_REPORT_ONLY"]);

export async function loadPackageLifecycleV1({ catalog } = {}) {
  const parsed = yaml.load(await readFile(PACKAGE_LIFECYCLE_PATH, "utf8")) || {};
  const manifest = parsed.package_lifecycle_manifest || {};
  const packageCatalog = catalog || await loadPackageCatalogV0();
  validatePackageLifecycle({ manifest, catalog: packageCatalog });
  return Object.freeze({
    ...manifest,
    packages: Object.freeze(Object.fromEntries(Object.entries(manifest.packages || {}).map(([id, record]) => [
      id,
      Object.freeze({ package_id: id, ...(record || {}) })
    ])))
  });
}

export function validatePackageLifecycle({ manifest = {}, catalog = {} } = {}) {
  const errors = [];
  if (manifest.schema_version !== "DOMAIN_PACKAGE_LIFECYCLE_v1") errors.push("schema_version must be DOMAIN_PACKAGE_LIFECYCLE_v1");
  if (manifest.status !== "LOCKED") errors.push("status must be LOCKED");
  const packages = manifest.packages || {};
  const catalogIds = Array.isArray(catalog.primary_domain_packages) ? catalog.primary_domain_packages : [];
  const lifecycleIds = Object.keys(packages);
  for (const packageId of catalogIds) if (!packages[packageId]) errors.push(`catalog package missing lifecycle record:${packageId}`);
  for (const packageId of lifecycleIds) if (!catalogIds.includes(packageId)) errors.push(`lifecycle package absent from catalog:${packageId}`);
  for (const [packageId, record] of Object.entries(packages)) {
    if (!PACKAGE_LIFECYCLE_VALUES.includes(record?.lifecycle)) errors.push(`invalid lifecycle:${packageId}:${record?.lifecycle || "missing"}`);
    const expectedSelectable = SELECTABLE.has(record?.lifecycle);
    if (record?.selectable_in_phase3b !== expectedSelectable) errors.push(`selectable flag mismatch:${packageId}`);
    if (record?.lifecycle === "ACTIVE_E2E" && (!record.phase10_enabled || !record.phase13_enabled || !record.phase16_enabled)) errors.push(`ACTIVE_E2E package missing downstream enablement:${packageId}`);
    if (record?.lifecycle === "ACTIVE_REPORT_ONLY" && (!record.phase10_enabled || record.phase13_enabled || record.phase16_enabled)) errors.push(`ACTIVE_REPORT_ONLY package has invalid downstream enablement:${packageId}`);
  }
  if (errors.length) throw new Error(`PACKAGE_LIFECYCLE_INVALID:${errors.join("|")}`);
  return { status: "PASS", package_count: lifecycleIds.length };
}

export function lifecycleRecordForPackage(lifecycle, packageId) {
  return lifecycle?.packages?.[String(packageId || "").trim()] || null;
}

export function isSelectableLifecycle(value) {
  return SELECTABLE.has(typeof value === "string" ? value : value?.lifecycle);
}

export function selectablePackageIds(lifecycle) {
  return Object.values(lifecycle?.packages || {}).filter(isSelectableLifecycle).map((record) => record.package_id).sort();
}

export function assertPackageSelectable(lifecycle, packageId) {
  const record = lifecycleRecordForPackage(lifecycle, packageId);
  if (!record || !isSelectableLifecycle(record)) throw new Error(`PACKAGE_LIFECYCLE_NOT_SELECTABLE:${packageId || "missing"}`);
  return record;
}
