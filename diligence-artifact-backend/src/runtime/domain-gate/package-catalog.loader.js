import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(__dirname, "../../..");
const PACKAGE_CATALOG_PATH = path.join(BACKEND_ROOT, "references/domain-packages/package-catalog.v0.json");
const DOMAIN_PACKAGE_KEY_PATH = path.join(BACKEND_ROOT, "references/domain-packages/DOMAIN_PACKAGE_KEY_v0.md");

export async function loadPackageCatalogV0() {
  const raw = await readFile(PACKAGE_CATALOG_PATH, "utf8");
  const catalog = JSON.parse(raw);
  validatePackageCatalogV0(catalog);
  return catalog;
}

export async function loadDomainPackageKeyV0() {
  return readFile(DOMAIN_PACKAGE_KEY_PATH, "utf8");
}

export function validatePackageCatalogV0(catalog) {
  const errors = [];
  if (!catalog || typeof catalog !== "object" || Array.isArray(catalog)) errors.push("catalog must be object");
  if (catalog?.catalog_id !== "domain_package_catalog_v0") errors.push("catalog_id must be domain_package_catalog_v0");
  if (catalog?.version !== "0.1") errors.push("version must be 0.1");
  if (catalog?.runtime_mode !== "passive_manifest") errors.push("runtime_mode must be passive_manifest");
  for (const key of ["primary_domain_packages", "capability_overlays", "regulatory_overlays", "review_overlays"]) {
    if (!Array.isArray(catalog?.[key]) || catalog[key].length === 0) errors.push(`${key} must be non-empty array`);
    const duplicates = findDuplicates(catalog?.[key] || []);
    if (duplicates.length) errors.push(`${key} contains duplicate package ids: ${duplicates.join(",")}`);
  }
  if (!catalog?.review_overlays?.includes("qualified-review")) errors.push("review_overlays must include qualified-review");
  if (errors.length) throw new Error(`INVALID_PACKAGE_CATALOG_V0:${errors.join("|")}`);
  return { status: "PASS" };
}

export function packageIdSet(catalog) {
  return new Set([
    ...(catalog.primary_domain_packages || []),
    ...(catalog.capability_overlays || []),
    ...(catalog.regulatory_overlays || []),
    ...(catalog.review_overlays || [])
  ]);
}

function findDuplicates(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].sort();
}
