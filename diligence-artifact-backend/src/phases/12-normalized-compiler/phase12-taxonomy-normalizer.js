import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const PHASE12_DIR = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(PHASE12_DIR, "../../..");
const KEY_FILES = Object.freeze({
  "ai-governance": path.join(BACKEND_ROOT, "references/registry/AI_Registry_Key.yml"),
  fintech: path.join(BACKEND_ROOT, "references/registry/FinTech_Registry_Key.yml")
});
const KEY_CACHE = new Map();

export function normalizeRegistryCode({ packageId, resolver, value } = {}) {
  if (value === undefined || value === null || value === "") return null;
  if (Array.isArray(value)) return value.map((item) => normalizeRegistryCode({ packageId, resolver, value: item }));
  if (typeof value === "object") return clone(value);
  const code = String(value);
  const key = loadRegistryKey(packageId);
  const normalized = key ? findNormalizedName(key, code, resolver) : null;
  return { code, label: normalized || code, registry_key_normalized: Boolean(normalized) };
}

export function normalizeSectorPackage(packageId) {
  const value = String(packageId || "").trim();
  if (value === "ai-governance") return "AI Products & Services";
  if (value === "fintech") return "Financial Technology & Financial Services";
  return value || "Unspecified Sector";
}

export function loadRegistryKey(packageId) {
  const normalized = String(packageId || "").trim();
  if (!KEY_FILES[normalized]) return null;
  if (KEY_CACHE.has(normalized)) return KEY_CACHE.get(normalized);
  const file = KEY_FILES[normalized];
  if (!fs.existsSync(file)) return null;
  const parsed = yaml.load(fs.readFileSync(file, "utf8")) || {};
  KEY_CACHE.set(normalized, parsed);
  return parsed;
}

function findNormalizedName(root, target, resolver) {
  const targetText = String(target).trim();
  const preferredCodeKeys = preferredKeys(resolver);
  let fallback = null;
  walk(root, (node) => {
    if (fallback) return;
    if (!node || typeof node !== "object" || Array.isArray(node)) return;
    const normalized = text(node.normalized_name) || text(node.public_name) || text(node.display_name) || text(node.name) || text(node.label);
    if (!normalized) return;
    for (const key of preferredCodeKeys) {
      if (String(node[key] ?? "").trim() === targetText) {
        fallback = normalized;
        return;
      }
    }
    for (const [key, value] of Object.entries(node)) {
      if (["normalized_name", "public_name", "display_name", "name", "label"].includes(key)) continue;
      if (typeof value !== "object" && String(value ?? "").trim() === targetText) {
        fallback = normalized;
        return;
      }
    }
  });
  return fallback;
}

function preferredKeys(resolver) {
  const common = ["code", "token", "value", "tier", "id", "key"];
  if (resolver === "pain_tier") return ["tier", "code", "value", ...common];
  if (resolver === "surface" || resolver === "compliance_framework") return ["token", "code", "value", ...common];
  return common;
}

function walk(value, visit) {
  if (!value || typeof value !== "object") return;
  visit(value);
  if (Array.isArray(value)) {
    for (const item of value) walk(item, visit);
    return;
  }
  for (const item of Object.values(value)) walk(item, visit);
}

function text(value) { return typeof value === "string" && value.trim() ? value.trim() : null; }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
