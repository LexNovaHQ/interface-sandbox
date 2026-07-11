import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { loadPackageCatalogV0, packageIdSet } from "./package-catalog.loader.js";

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
  const fdr = yaml.load(await readFile(FDR_PATH, "utf8")) || {};
  const grammar = fdr.domain_derivation_grammar || {};
  const discovered = await discoverPackageKeys();
  const keysByPackage = Object.fromEntries(Object.entries(discovered).map(([pkg, v]) => [pkg, v.key]));
  const rules = assembleRules({ keysByPackage, grammar });
  const registry = {
    registry_id: DOMAIN_REGISTRY_ID,
    schema_version: String(grammar.schema_version || fdr?.registry?.version || "v1"),
    status: "ASSEMBLED_FROM_KEYS_AND_FDR_GRAMMAR",
    rules,
    grammar,
    keys_by_package: keysByPackage,
    key_files: Object.fromEntries(Object.entries(discovered).map(([pkg, v]) => [pkg, v.file])),
    regulatory_overlays_by_package: collectRegulatoryOverlays(keysByPackage)
  };
  validateAssembledRegistry({ registry, catalog });
  return { registry, catalog, grammar };
}

function assembleRules({ keysByPackage, grammar }) {
  const rules = [];
  for (const [pkg, key] of Object.entries(keysByPackage)) {
    const ddr = key.domain_derivation_rules || {};
    if (ddr.primary_domain_rule) rules.push(normalizeRule(ddr.primary_domain_rule, { rule_type: "PRIMARY_DOMAIN", package_id: pkg }));
    for (const r of ddr.capability_overlay_mount_rules || []) rules.push(normalizeRule(r, { rule_type: r.rule_type || "AI_MOUNT" }));
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
  const excludeIf = r.exclude_if ?? [];
  return {
    rule_id: r.rule_id,
    rule_type: r.rule_type || defaults.rule_type,
    package_id: r.package_id ?? defaults.package_id ?? null,
    normalized_name: r.normalized_name || r.rule_id || "",
    status: "ACTIVE",
    priority: Number.isFinite(r.priority) ? r.priority : 0,
    conditions: r.conditions || {},
    trigger_if: r.trigger_if || "",
    exclude_if: excludeIf,
    exclude_if_present: Array.isArray(excludeIf) ? excludeIf.length > 0 : Boolean(excludeIf),
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

export function validateAssembledRegistry({ registry, catalog } = {}) {
  const errors = [];
  const packages = packageIdSet(catalog || {});
  const ids = new Set();
  for (const rule of registry?.rules || []) {
    if (!rule.rule_id) {
      errors.push("rule_id missing");
      continue;
    }
    if (ids.has(rule.rule_id)) errors.push(`duplicate rule_id: ${rule.rule_id}`);
    ids.add(rule.rule_id);
    if (!rule.rule_type) errors.push(`${rule.rule_id} missing rule_type`);
    if (!rule.trigger_if) errors.push(`${rule.rule_id} trigger_if missing`);
    if (!rule.exclude_if_present) errors.push(`${rule.rule_id} exclude_if missing`);
    if (rule.rule_type !== "FALLBACK" && !Object.keys(rule.conditions).length) errors.push(`${rule.rule_id} conditions empty`);
    if (rule.rule_type === "PRIMARY_DOMAIN" && !packages.has(rule.package_id)) errors.push(`${rule.rule_id} package_id not in catalog: ${rule.package_id || "missing"}`);
    for (const ref of conditionRefs(rule.trigger_if)) if (!(ref in rule.conditions)) errors.push(`${rule.rule_id} trigger_if references undeclared ${ref}`);
  }
  if (!ids.has("PRIMARY_DOMAIN_AI_GOVERNANCE")) errors.push("PRIMARY_DOMAIN_AI_GOVERNANCE rule missing");
  if (!ids.has("PRIMARY_DOMAIN_FINTECH")) errors.push("PRIMARY_DOMAIN_FINTECH rule missing");
  if (!ids.has("AI_OVERLAY_MOUNTED")) errors.push("AI_OVERLAY_MOUNTED rule missing");
  if (errors.length) throw new Error(`INVALID_DOMAIN_REGISTRY:${errors.join("|")}`);
  return { status: "PASS", rule_count: registry.rules.length };
}

function conditionRefs(expr) {
  return [...new Set(String(expr || "").match(/\bC\d+\b/g) || [])];
}
