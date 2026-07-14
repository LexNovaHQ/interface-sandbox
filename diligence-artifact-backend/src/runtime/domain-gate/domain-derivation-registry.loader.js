import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { loadPackageCatalogV0, packageIdSet } from "./package-catalog.loader.js";
import { isSelectableLifecycle, loadPackageLifecycleV1, selectablePackageIds } from "./package-lifecycle.loader.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(__dirname, "../../..");
const REGISTRY_DIR = path.join(BACKEND_ROOT, "references/registry");
const FDR_PATH = path.join(REGISTRY_DIR, "Diligence_Field_Derivation_Registry.yml");
const KEY_FILE_PATTERN = /_Registry_Key\.yml$/i;
export const DOMAIN_REGISTRY_ID = "DILIGENCE_DOMAIN_REGISTRY_v1";

export async function discoverPackageKeys() {
  const files = (await readdir(REGISTRY_DIR)).filter((f) => KEY_FILE_PATTERN.test(f)).sort();
  const keysByPackage = {};
  for (const file of files) {
    const key = yaml.load(await readFile(path.join(REGISTRY_DIR, file), "utf8")) || {};
    const pkg = key?.registry_key?.domain_package;
    if (!pkg) throw new Error(`REGISTRY_KEY_MISSING_DOMAIN_PACKAGE:${file}`);
    if (keysByPackage[pkg]) throw new Error(`DUPLICATE_DOMAIN_PACKAGE_KEY:${pkg}`);
    keysByPackage[pkg] = { file, key };
  }
  if (!Object.keys(keysByPackage).length) throw new Error("NO_REGISTRY_KEYS_DISCOVERED");
  return keysByPackage;
}

export async function listPackageKeyFiles() {
  const discovered = await discoverPackageKeys();
  return Object.fromEntries(Object.entries(discovered).map(([pkg, v]) => [pkg, v.file]));
}

export async function loadDomainDerivationRegistryV0() {
  const catalog = await loadPackageCatalogV0();
  const lifecycle = await loadPackageLifecycleV1({ catalog });
  const fdr = yaml.load(await readFile(FDR_PATH, "utf8")) || {};
  const rawGrammar = fdr.domain_derivation_grammar;
  if (!rawGrammar || !rawGrammar.controlled_vocabularies) {
    throw new Error("FDR_MISSING_DOMAIN_DERIVATION_GRAMMAR: expected a top-level 'domain_derivation_grammar' block in references/registry/Diligence_Field_Derivation_Registry.yml");
  }
  const grammar = { ...rawGrammar };
  delete grammar.retires;
  const discovered = await discoverPackageKeys();
  const keysByPackage = Object.fromEntries(Object.entries(discovered).map(([pkg, v]) => [pkg, v.key]));
  const rules = assembleRules({ keysByPackage, grammar, lifecycle });
  const registry = {
    registry_id: DOMAIN_REGISTRY_ID,
    schema_version: String(grammar.schema_version || fdr?.registry?.version || "v2"),
    status: "ASSEMBLED_FROM_LIFECYCLE_GATED_KEYS_AND_FDR_GRAMMAR",
    rules,
    grammar,
    keys_by_package: keysByPackage,
    key_files: Object.fromEntries(Object.entries(discovered).map(([pkg, v]) => [pkg, v.file])),
    regulatory_overlays_by_package: collectRegulatoryOverlays(keysByPackage),
    package_lifecycle_by_id: lifecycle.packages,
    selectable_primary_packages: selectablePackageIds(lifecycle)
  };
  validateAssembledRegistry({ registry, catalog, lifecycle });
  return { registry, catalog, grammar, lifecycle };
}

function assembleRules({ keysByPackage, grammar, lifecycle }) {
  const rules = [];
  for (const [pkg, key] of Object.entries(keysByPackage)) {
    const ddr = key.domain_derivation_rules || {};
    const lifecycleRecord = lifecycle?.packages?.[pkg];
    if (ddr.primary_domain_rule && isSelectableLifecycle(lifecycleRecord)) {
      rules.push(normalizeRule(ddr.primary_domain_rule, { rule_type: "PRIMARY_DOMAIN", package_id: pkg, package_lifecycle: lifecycleRecord.lifecycle }));
    }
    if (lifecycleRecord?.lifecycle !== "DECLARED_NOT_INSTALLED") {
      for (const r of ddr.capability_overlay_mount_rules || []) rules.push(normalizeRule(r, { rule_type: r.rule_type || "AI_MOUNT", package_lifecycle: lifecycleRecord?.lifecycle || "" }));
    }
  }
  if (grammar.fallback_rule) rules.push(normalizeRule(grammar.fallback_rule, { rule_type: "FALLBACK" }));
  if (grammar.fusion_rule) rules.push(normalizeRule(grammar.fusion_rule, { rule_type: "FUSION_CANDIDATE" }));
  const seen = new Set();
  const out = [];
  for (const r of rules) {
    if (!r.rule_id || seen.has(r.rule_id)) continue;
    seen.add(r.rule_id);
    out.push(r);
  }
  return out;
}

function normalizeRule(r = {}, defaults = {}) {
  const excludeIf = r.exclude_if ?? null;
  return {
    rule_id: r.rule_id,
    rule_type: r.rule_type || defaults.rule_type,
    package_id: r.package_id ?? defaults.package_id ?? null,
    package_lifecycle: defaults.package_lifecycle || "",
    normalized_name: r.normalized_name || r.rule_id || "",
    status: "ACTIVE",
    priority: Number.isFinite(r.priority) ? r.priority : 0,
    conditions: r.conditions || {},
    trigger_if: r.trigger_if || "",
    exclude_if: excludeIf,
    exclude_if_present: excludeIf != null,
    evidence_policy: r.evidence_policy || {},
    evidence_policy_present: true,
    result: r.result || {},
    result_present: Boolean(r.result),
    lock_scope: r.lock_scope || ""
  };
}

function collectRegulatoryOverlays(keysByPackage) {
  const out = {};
  for (const [pkg, key] of Object.entries(keysByPackage)) out[pkg] = (key.regulatory_overlay?.overlays || []).map((o) => o.overlay_id).filter(Boolean);
  return out;
}

export function validateAssembledRegistry({ registry, catalog, lifecycle } = {}) {
  const errors = [];
  const packages = packageIdSet(catalog || {});
  const lifecyclePackages = lifecycle?.packages || registry?.package_lifecycle_by_id || {};
  const ids = new Set();
  const primaryByPackage = new Map();
  for (const rule of registry?.rules || []) {
    if (!rule.rule_id) { errors.push("rule_id missing"); continue; }
    if (ids.has(rule.rule_id)) errors.push(`duplicate rule_id: ${rule.rule_id}`);
    ids.add(rule.rule_id);
    if (!rule.rule_type) errors.push(`${rule.rule_id} missing rule_type`);
    if (!rule.trigger_if) errors.push(`${rule.rule_id} trigger_if missing`);
    if (!rule.exclude_if_present || !isMachineExclusion(rule.exclude_if)) errors.push(`${rule.rule_id} exclude_if must use machine grammar`);
    if (rule.rule_type !== "FALLBACK" && !Object.keys(rule.conditions).length) errors.push(`${rule.rule_id} conditions empty`);
    if (rule.rule_type === "PRIMARY_DOMAIN") {
      if (!packages.has(rule.package_id)) errors.push(`${rule.rule_id} package_id not in catalog: ${rule.package_id || "missing"}`);
      if (!isSelectableLifecycle(lifecyclePackages[rule.package_id])) errors.push(`${rule.rule_id} package is not selectable:${rule.package_id || "missing"}`);
      primaryByPackage.set(rule.package_id, (primaryByPackage.get(rule.package_id) || 0) + 1);
    }
    for (const ref of conditionRefs(rule.trigger_if)) if (!(ref in rule.conditions)) errors.push(`${rule.rule_id} trigger_if references undeclared ${ref}`);
  }
  for (const packageId of Object.values(lifecyclePackages).filter(isSelectableLifecycle).map((record) => record.package_id)) {
    if (!registry?.keys_by_package?.[packageId]) errors.push(`selectable package missing registry key:${packageId}`);
    if (primaryByPackage.get(packageId) !== 1) errors.push(`selectable package must have exactly one primary rule:${packageId}:${primaryByPackage.get(packageId) || 0}`);
  }
  if (!ids.has("NO_SUPPORTED_PRIMARY_DOMAIN_LOCK")) errors.push("fallback rule missing");
  if (!ids.has("DOMAIN_FUSION_CANDIDATE")) errors.push("fusion rule missing");
  if (errors.length) throw new Error(`INVALID_DOMAIN_REGISTRY:${errors.join("|")}`);
  return { status: "PASS", rule_count: registry.rules.length, selectable_package_count: registry.selectable_primary_packages?.length || 0 };
}

function isMachineExclusion(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (Object.prototype.hasOwnProperty.call(value, "condition")) return typeof value.condition === "string";
  if (Object.prototype.hasOwnProperty.call(value, "rule_fired")) return typeof value.rule_fired === "string";
  if (Object.prototype.hasOwnProperty.call(value, "rule_fired_any")) return Array.isArray(value.rule_fired_any);
  if (Object.prototype.hasOwnProperty.call(value, "rule_fired_any_type")) return typeof value.rule_fired_any_type === "string";
  if (Object.prototype.hasOwnProperty.call(value, "literal")) return typeof value.literal === "boolean";
  if (Object.prototype.hasOwnProperty.call(value, "not")) return isMachineExclusion(value.not);
  if (Object.prototype.hasOwnProperty.call(value, "any")) return Array.isArray(value.any) && value.any.length > 0 && value.any.every(isMachineExclusion);
  if (Object.prototype.hasOwnProperty.call(value, "all")) return Array.isArray(value.all) && value.all.length > 0 && value.all.every(isMachineExclusion);
  return false;
}

function conditionRefs(expr) {
  return [...new Set(String(expr || "").match(/\bC\d+\b/g) || [])];
}
