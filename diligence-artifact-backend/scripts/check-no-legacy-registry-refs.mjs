import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const dead = Object.freeze([
  ["DOMAIN", "DERIVATION", "REGISTRY", "v0"].join("_"),
  ["AI", "REGISTRY", "KEY.md"].join("_"),
  ["FIELD", "DERIVATION", "REGISTRY", "v2", "LOCKED"].join("_"),
  ["REGISTRY", "KEY", "v3", "0"].join("_"),
  ["CLASSIFICATION", "DERIVATION", "MATRIX"].join("_"),
  ["TARGET", "PROFILE", "PUBLIC", "REGULATORY", "GRIEVANCE", "FIELD", "ADDENDUM.yaml"].join("_")
]);
const roots = ["src", "scripts", "agent-packages", "references"];
const files = roots.flatMap(collectFiles);
const bad = [];
for (const file of files) {
  const text = readFileSync(file, "utf8");
  for (const token of dead) if (text.includes(token)) bad.push(`${token}: ${file}`);
}
assert.equal(bad.length, 0, `retired registry tokens still referenced:\n${bad.join("\n")}`);
console.log(JSON.stringify({ check: "no legacy registry refs (repo-wide)", status: "PASS", files_scanned: files.length }, null, 2));

function collectFiles(root) {
  if (!existsSync(root)) return [];
  const out = [];
  walk(root, out);
  return out.filter((file) => /\.(?:js|mjs|cjs|json|md|ya?ml)$/i.test(file));
}
function walk(target, out) {
  const stat = statSync(target);
  if (stat.isFile()) { out.push(target); return; }
  for (const entry of readdirSync(target)) {
    if (["node_modules", ".git", "archive", "archive-legacy"].includes(entry)) continue;
    walk(path.join(target, entry), out);
  }
}
