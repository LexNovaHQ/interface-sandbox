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

const RUNTIME_GENERIC_GRAMMAR = Object.freeze({
  schema_version: "v1",
  grammar_source: "RUNTIME_GENERIC_GRAMMAR_FALLBACK_FDR_BLOCK_ABSENT",
  controlled_vocabularies: Object.freeze({
    rule_type: Object.freeze(["PRIMARY_DOMAIN", "AI_MOUNT", "REGULATORY_OVERLAY", "FUSION_CANDIDATE", "FALLBACK"])
  }),
  fusion_rule: Object.freeze({
    rule_id: "DOMAIN_FUSION_CANDIDATE",
    rule_type: "FUSION_CANDIDATE",
    package_id: "locked_primary_domain_package",
    normalized_name: "Domain-Owned AI Fusion Candidate",
    priority: 60,
    conditions: Object.freeze({
      C1: "A non-AI primary domain is locked or locked-with-limitations.",
      C2: "AI_OVERLAY_MOUNTED fires.",
      C3: "Admitted primary evidence indicates AI is used inside an activity belonging to the locked primary domain.",
      C4: "The candidate issue depends on both the primary-domain activity and AI mechanics.",
      C5: "The later legal or control obligation would be created by the primary domain rather than general AI or product law alone."
    }),
    trigger_if: "C1 AND C2 AND C3 AND C4 AND C5",
    exclude_if: Object.freeze([
      "The issue is fully explainable as pure AI exposure without domain-law dependence.",
      "The issue is fully explainable as pure domain exposure without AI mechanics.",
      "AI package mount is AI_CANDIDATE_ONLY or AI_NOT_VISIBLE."
    ]),
    evidence_policy: Object.freeze({
      must_cite_lossless_evidence: true,
      phase_2_index_as_evidence: "FORBIDDEN"
    }),
    result: Object.freeze({
      fusion_bucket_status: "FUSION_CANDIDATE_ONLY",
      fusion_owner: "locked_primary_domain_package"
    }),
    lock_scope: "CANDIDATE_ONLY"
  }),
  fallback_rule: Object.freeze({
    rule_id: "NO_SUPPORTED_PRIMARY_DOMAIN_LOCK",
    rule_type: "FALLBACK",
    package_id: null,
    normalized_name: "No Supported Primary Domain Lock",
    priority: 0,
    conditions: Object.freeze({
      C1: "No implemented PRIMARY_DOMAIN rule fires.",
      C2: "Evidence is too thin, gated, inaccessible, contradictory, or points to an unsupported domain package."
    }),
    trigger_if: "C1 OR C2",
    exclude_if: Object.freeze([
      "A supported PRIMARY_DOMAIN rule fires."
    ]),
    evidence_policy: Object.freeze({
      must_cite_lossless_evidence: true,
      phase_2_index_as_evidence: "FORBIDDEN"
    }),
    result: Object.freeze({
      primary_domain_status: "REVIEW_REQUIRED",
      active_run_package_manifest_status: "PROVISIONAL_OR_LIMITED"
    }),
    lock_scope: "REVIEW_REQUIRED"
  })
});

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
  return Object.fromEntries(Object.entries(discovered).map(([pkg, value]) => [pkg, value.file]));
}

export async function loadDomainDerivationRegistryV0() {
  const catalog = await loadPackageCatalogV0();
  const fdr = yaml.load(await readFile(FDR_PATH, "utf8")) || {};
  const fdrGrammar = isPlainObject(fdr.domain_derivation_grammar) ? fdr.domain_derivation_grammar : null;
  const grammar = fdrGrammar || RUNTIME_GENERIC_GRAMMAR;
  const grammarSource = fdrGrammar ? "FDR_DOMAIN_DERIVATION_GRAMMAR" : RUNTIME_GENERIC_GRAMMAR.grammar_source;
  const discovered = await discoverPackageKeys();
  const keysByPackage = Object.fromEntries(Object.entries(discovered).map(([pkg, value]) => [pkg, value.key]));
  const rules = assembleRules({ keysByPackage, grammar });
  const registry = {
    registry_id: DOMAIN_REGISTRY_ID,
    schema_version: String(grammar.schema_version || fdr?.registry?.version || "v1"),
    status: fdrGrammar ? "ASSEMBLED_FROM_KEYS_AND_FDR_GRAMMAR" : "ASSEMBLED_FROM_KEYS_WITH_RUNTIME_GENERIC_GRAMMAR_FALLBACK",
    grammar_source: grammarSource,
    rules,
    grammar,
    keys_by_package: keysByPackage,
    key_files: Object.fromEntries(Object.entries(discovered).map(([pkg, value]) => [pkg, value.file])),
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
    for (const rule of ddr.capability_overlay_mount_rules || []) rules.push(normalizeRule(rule, { rule_type: rule.rule_type || "AI_MOUNT" }));
  }
  if (grammar.fallback_rule) rules.push(normalizeRule(grammar.fallback_rule, { rule_type: "FALLBACK" }));
  if (grammar.fusion_rule) rules.push(normalizeRule(grammar.fusion_rule, { rule_type: "FUSION_CANDIDATE" }));
  const seen = new Set();
  const out = [];
  for (const rule of rules) {
    if (!rule.rule_id || seen.has(rule.rule_id)) continue;
    seen.add(rule.rule_id);
    out.push(rule);
  }
  return out;
}

function normalizeRule(rule = {}, defaults = {}) {
  const excludeIf = rule.exclude_if ?? [];
  return {
    rule_id: rule.rule_id,
    rule_type: rule.rule_type || defaults.rule_type,
    package_id: rule.package_id ?? defaults.package_id ?? null,
    normalized_name: rule.normalized_name || rule.rule_id || "",
    status: "ACTIVE",
    priority: Number.isFinite(rule.priority) ? rule.priority : 0,
    conditions: rule.conditions || {},
    trigger_if: rule.trigger_if || "",
    exclude_if: excludeIf,
    exclude_if_present: Array.isArray(excludeIf) ? excludeIf.length > 0 : Boolean(excludeIf),
    evidence_policy: rule.evidence_policy || {},
    evidence_policy_present: true,
    result: rule.result || {},
    result_present: Boolean(rule.result),
    lock_scope: rule.lock_scope || ""
  };
}

function collectRegulatoryOverlays(keysByPackage) {
  const out = {};
  for (const [pkg, key] of Object.entries(keysByPackage)) out[pkg] = (key.regulatory_overlay?.overlays || []).map((overlay) => overlay.overlay_id).filter(Boolean);
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
  for (const requiredId of ["PRIMARY_DOMAIN_AI_GOVERNANCE", "PRIMARY_DOMAIN_FINTECH", "AI_OVERLAY_MOUNTED", "NO_SUPPORTED_PRIMARY_DOMAIN_LOCK", "DOMAIN_FUSION_CANDIDATE"]) {
    if (!ids.has(requiredId)) errors.push(`${requiredId} rule missing`);
  }
  if (errors.length) throw new Error(`INVALID_DOMAIN_REGISTRY:${errors.join("|")}`);
  return { status: "PASS", rule_count: registry.rules.length };
}

function conditionRefs(expression) {
  return [...new Set(String(expression || "").match(/\bC\d+\b/g) || [])];
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
