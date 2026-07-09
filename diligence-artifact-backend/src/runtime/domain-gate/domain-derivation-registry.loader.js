import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadPackageCatalogV0, packageIdSet } from "./package-catalog.loader.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(__dirname, "../../..");
export const DOMAIN_DERIVATION_REGISTRY_V0_PATH = path.join(BACKEND_ROOT, "references/domain-packages/DOMAIN_DERIVATION_REGISTRY_v0.yaml");
export const DOMAIN_DERIVATION_REGISTRY_V0_ID = "DOMAIN_DERIVATION_REGISTRY_v0";

export async function loadDomainDerivationRegistryV0() {
  const [raw, catalog] = await Promise.all([
    readFile(DOMAIN_DERIVATION_REGISTRY_V0_PATH, "utf8"),
    loadPackageCatalogV0()
  ]);
  const registry = parseDomainDerivationRegistryV0(raw);
  validateDomainDerivationRegistryV0({ registry, raw, catalog });
  return { raw, registry, catalog };
}

export function parseDomainDerivationRegistryV0(raw) {
  const text = String(raw || "");
  const registry_id = valueForTopLevelKey(text, "registry_id");
  const schema_version = valueForTopLevelKey(text, "schema_version");
  const status = valueForTopLevelKey(text, "status");
  const rules = parseRules(text);
  return { registry_id, schema_version, status, rules };
}

export function validateDomainDerivationRegistryV0({ registry, raw, catalog } = {}) {
  const errors = [];
  const text = String(raw || "");
  const packages = packageIdSet(catalog || {});
  if (registry?.registry_id !== DOMAIN_DERIVATION_REGISTRY_V0_ID) errors.push("registry_id must be DOMAIN_DERIVATION_REGISTRY_v0");
  if (!registry?.schema_version) errors.push("schema_version missing");
  if (!Array.isArray(registry?.rules) || registry.rules.length === 0) errors.push("rules must be non-empty");
  const ids = new Set();
  for (const rule of registry?.rules || []) {
    if (!rule.rule_id) errors.push("rule_id missing");
    if (ids.has(rule.rule_id)) errors.push(`duplicate rule_id: ${rule.rule_id}`);
    ids.add(rule.rule_id);
    if (!rule.rule_type) errors.push(`${rule.rule_id || "UNKNOWN"} missing rule_type`);
    if (!rule.normalized_name) errors.push(`${rule.rule_id || "UNKNOWN"} missing normalized_name`);
    if (rule.status !== "ACTIVE") errors.push(`${rule.rule_id || "UNKNOWN"} status must be ACTIVE in v0`);
    if (!Number.isFinite(rule.priority)) errors.push(`${rule.rule_id || "UNKNOWN"} priority must be numeric`);
    if (!Object.keys(rule.conditions || {}).length) errors.push(`${rule.rule_id || "UNKNOWN"} conditions must be non-empty`);
    if (!rule.trigger_if) errors.push(`${rule.rule_id || "UNKNOWN"} trigger_if missing`);
    if (!rule.exclude_if_present) errors.push(`${rule.rule_id || "UNKNOWN"} exclude_if missing`);
    if (!rule.evidence_policy_present) errors.push(`${rule.rule_id || "UNKNOWN"} evidence_policy missing`);
    if (!rule.result_present) errors.push(`${rule.rule_id || "UNKNOWN"} result missing`);
    if (!rule.lock_scope) errors.push(`${rule.rule_id || "UNKNOWN"} lock_scope missing`);
    if (rule.rule_type === "PRIMARY_DOMAIN" && !packages.has(rule.package_id)) errors.push(`${rule.rule_id} package_id not in catalog: ${rule.package_id || "missing"}`);
    if (rule.rule_type === "AI_MOUNT" && rule.package_id && !packages.has(rule.package_id)) errors.push(`${rule.rule_id} AI_MOUNT package_id not in catalog: ${rule.package_id}`);
    for (const conditionRef of conditionRefs(rule.trigger_if)) if (!rule.conditions?.[conditionRef]) errors.push(`${rule.rule_id} trigger_if references undeclared condition ${conditionRef}`);
  }
  if (!ids.has("PRIMARY_DOMAIN_AI_GOVERNANCE")) errors.push("PRIMARY_DOMAIN_AI_GOVERNANCE rule missing");
  if (!ids.has("PRIMARY_DOMAIN_FINTECH")) errors.push("PRIMARY_DOMAIN_FINTECH rule missing");
  if (!ids.has("AI_OVERLAY_MOUNTED")) errors.push("AI_OVERLAY_MOUNTED rule missing");
  if (!text.includes("phase_2_indexes_are_evidence: false")) errors.push("universal evidence rule must forbid Phase 2 indexes as evidence");
  if (!text.includes("phase_2_index_as_evidence: FORBIDDEN")) errors.push("each rule set must preserve phase_2_index_as_evidence: FORBIDDEN policy text");
  if (text.includes("package_id: ai_governance") || text.includes("primary_domain_package: ai_governance")) errors.push("registry must use catalog id ai-governance, not ai_governance");
  if (errors.length) throw new Error(`INVALID_DOMAIN_DERIVATION_REGISTRY_V0:${errors.join("|")}`);
  return { status: "PASS", rule_count: registry.rules.length };
}

function valueForTopLevelKey(text, key) {
  const match = text.match(new RegExp(`^${escapeRegExp(key)}:\\s*([^\\n#]+)`, "m"));
  return match ? match[1].trim().replace(/^[ '\"]|[ '\"]$/g, "") : "";
}

function parseRules(text) {
  const blocks = text.split(/\n\s*-\s+rule_id:\s+/).slice(1);
  return blocks.map((block) => {
    const firstLineEnd = block.indexOf("\n");
    const rule_id = (firstLineEnd === -1 ? block : block.slice(0, firstLineEnd)).trim();
    const body = firstLineEnd === -1 ? "" : block.slice(firstLineEnd + 1);
    const conditionsBlock = between(body, "    conditions:\n", "    trigger_if:");
    return {
      rule_id,
      rule_type: valueForIndentedKey(body, "rule_type"),
      package_id: valueForIndentedKey(body, "package_id"),
      normalized_name: valueForIndentedKey(body, "normalized_name"),
      status: valueForIndentedKey(body, "status"),
      priority: Number(valueForIndentedKey(body, "priority")),
      conditions: parseConditions(conditionsBlock),
      trigger_if: valueForIndentedKey(body, "trigger_if"),
      exclude_if_present: /\n\s{4}exclude_if:\n/.test(body),
      evidence_policy_present: /\n\s{4}evidence_policy:\n/.test(body),
      result_present: /\n\s{4}result:\n/.test(body),
      lock_scope: valueForIndentedKey(body, "lock_scope")
    };
  });
}

function parseConditions(block) {
  const conditions = {};
  for (const match of String(block || "").matchAll(/^\s{6}(C\d+):/gm)) conditions[match[1]] = true;
  return conditions;
}

function conditionRefs(expression) {
  return [...new Set(String(expression || "").match(/\bC\d+\b/g) || [])];
}

function valueForIndentedKey(text, key) {
  const match = String(text || "").match(new RegExp(`^\\s{4}${escapeRegExp(key)}:\\s*([^\\n#]+)`, "m"));
  if (!match) return "";
  const value = match[1].trim();
  return value === "null" ? null : value.replace(/^[ '\"]|[ '\"]$/g, "");
}

function between(text, start, end) {
  const s = text.indexOf(start);
  if (s === -1) return "";
  const from = s + start.length;
  const e = text.indexOf(end, from);
  return e === -1 ? text.slice(from) : text.slice(from, e);
}

function escapeRegExp(value) {
  return String(value).replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
}
