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

const MOUNTABLE = new Set(["ACTIVE_E2E", "ACTIVE_REPORT_ONLY"]);

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
  if (manifest.doctrine?.model_derives_primary_domain_and_overlays !== true) errors.push("model derivation authority must be explicit");
  if (manifest.doctrine?.deterministic_layer_must_not_select_or_replace_model_domain_judgment !== true) errors.push("deterministic support-only boundary must be explicit");
  if (manifest.doctrine?.unresolved_primary_after_reinvestigation_is_non_blocking !== true) errors.push("unresolved-primary non-blocking doctrine must be explicit");
  const packages = manifest.packages || {};
  const catalogIds = Array.isArray(catalog.primary_domain_packages) ? catalog.primary_domain_packages : [];
  const lifecycleIds = Object.keys(packages);
  for (const packageId of catalogIds) if (!packages[packageId]) errors.push(`catalog package missing lifecycle record:${packageId}`);
  for (const packageId of lifecycleIds) if (!catalogIds.includes(packageId)) errors.push(`lifecycle package absent from catalog:${packageId}`);
  for (const [packageId, record] of Object.entries(packages)) {
    if (!PACKAGE_LIFECYCLE_VALUES.includes(record?.lifecycle)) errors.push(`invalid lifecycle:${packageId}:${record?.lifecycle || "missing"}`);
    const expectedDerivable = record?.lifecycle !== "FALLBACK_ONLY";
    if (record?.derivable_in_phase3b !== expectedDerivable) errors.push(`derivable flag mismatch:${packageId}`);
    const expectedMountable = MOUNTABLE.has(record?.lifecycle);
    if (record?.mountable_downstream !== expectedMountable) errors.push(`mountable flag mismatch:${packageId}`);
    if (record?.lifecycle === "ACTIVE_E2E" && (!record.phase10_enabled || !record.phase13_enabled || !record.phase16_enabled)) errors.push(`ACTIVE_E2E package missing downstream enablement:${packageId}`);
    if (record?.lifecycle === "ACTIVE_REPORT_ONLY" && (!record.phase10_enabled || record.phase13_enabled || record.phase16_enabled)) errors.push(`ACTIVE_REPORT_ONLY package has invalid downstream enablement:${packageId}`);
    if (!expectedMountable && [record.phase10_enabled, record.phase13_enabled, record.phase16_enabled].some(Boolean)) errors.push(`non-mountable package enables downstream phases:${packageId}`);
  }
  if (errors.length) throw new Error(`PACKAGE_LIFECYCLE_INVALID:${errors.join("|")}`);
  return { status: "PASS", package_count: lifecycleIds.length };
}

export function lifecycleRecordForPackage(lifecycle, packageId) {
  return lifecycle?.packages?.[String(packageId || "").trim()] || null;
}

export function isMountableLifecycle(value) {
  if (!value) return false;
  if (typeof value === "string") return MOUNTABLE.has(value);
  return value.mountable_downstream === true && MOUNTABLE.has(value.lifecycle);
}

export function isDerivableLifecycle(value) {
  return Boolean(value && typeof value === "object" && value.derivable_in_phase3b === true);
}

export function mountablePackageIds(lifecycle) {
  return Object.values(lifecycle?.packages || {}).filter(isMountableLifecycle).map((record) => record.package_id).sort();
}

export function derivablePackageIds(lifecycle) {
  return Object.values(lifecycle?.packages || {}).filter(isDerivableLifecycle).map((record) => record.package_id).sort();
}

export function assertPackageMountable(lifecycle, packageId) {
  const record = lifecycleRecordForPackage(lifecycle, packageId);
  if (!record || !isMountableLifecycle(record)) throw new Error(`PACKAGE_LIFECYCLE_NOT_MOUNTABLE:${packageId || "missing"}`);
  return record;
}

// Compatibility aliases. These now mean downstream mount eligibility, never semantic derivation authority.
export const isSelectableLifecycle = isMountableLifecycle;
export const selectablePackageIds = mountablePackageIds;
export const assertPackageSelectable = assertPackageMountable;
