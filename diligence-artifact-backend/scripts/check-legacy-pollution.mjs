import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import path from "node:path";

const ACTIVE_ROOTS = ["src", "public/interface-diligence/diligence-system", "scripts"];
const ALLOWED_ACTIVE_FILES = new Set([
  path.normalize("scripts/check-legacy-pollution.mjs"),
  path.normalize("scripts/check-public-report-ui.mjs")
]);
const retiredPrefix = "va" + "ult";
const retiredTokens = [
  `${retiredPrefix}_section_handoff`,
  `${retiredPrefix}_contract`,
  `${retiredPrefix}_mapping`,
  `eligible_for_${retiredPrefix}`,
  `${retiredPrefix}_category`,
  `${retiredPrefix}_payload`
];
const FORBIDDEN_ACTIVE_PATTERNS = [
  /buildRendererPayloadFromHandoff/,
  /report-section-adapter/,
  /function normalizeSections/,
  /payload\.section_list/,
  /Renderer Payload/,
  /section\.data(?!set)\b/,
  /function renderValue/,
  /function renderObject/,
  /raw_final_output_handoff: handoff/,
  /registry_authority:/,
  ...retiredTokens.map((token) => new RegExp(`(^|[^A-Za-z0-9_])${token}([^A-Za-z0-9_]|$)`))
];

assert.equal(existsSync("src/report-section-adapter.js"), false, "legacy report-section-adapter.js must not exist in active src");
assert.equal(existsSync("public/interface-diligence/diligence-system/qualified-review.js"), false, "old root qualified-review.js placeholder must not exist");

for (const file of collectFiles(ACTIVE_ROOTS)) {
  const normalized = path.normalize(file);
  const text = readFileSync(file, "utf8");
  for (const pattern of FORBIDDEN_ACTIVE_PATTERNS) {
    if (ALLOWED_ACTIVE_FILES.has(normalized)) continue;
    assert.equal(pattern.test(text), false, `legacy pollution found in ${file}: ${pattern}`);
  }
}

console.log("legacy pollution guard: PASS");

function collectFiles(roots) {
  const files = [];
  for (const root of roots) walk(root, files);
  return files.filter((file) => /\.(js|mjs|html|css|md)$/.test(file));
}

function walk(target, files) {
  if (!existsSync(target)) return;
  const stat = statSync(target);
  if (stat.isFile()) {
    files.push(target);
    return;
  }
  for (const entry of readdirSync(target)) {
    if (["node_modules", ".git", "archive", "archive-legacy"].includes(entry)) continue;
    walk(path.join(target, entry), files);
  }
}
