import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.cwd();
const THIS_FILE = normalize(path.relative(ROOT, fileURLToPath(import.meta.url)));

export const CO_CLEAN_02_ABSENT_FILES = Object.freeze([
  "scripts/audit-migration-receipts.mjs",
  "scripts/check-legacy-pollution.mjs",
  "scripts/check-dynamic-family-read-firewall.mjs",
  "scripts/check-m11-forensics-nonblocking.mjs",
  "scripts/check-m7-legal-signal-overlay.mjs",
  "receipts/CO_P12_CLOSEOUT_APPLIED.json"
]);

export const CO_CLEAN_02_FORBIDDEN_PACKAGE_SCRIPTS = Object.freeze([
  "audit:migration-receipts",
  "check:p12:co1",
  "check:p12:co2",
  "check:p12:co3",
  "check:p12:co4",
  "check:p12:co5",
  "check:runtime-cleanup"
]);

export function assertNoUnreferencedCleaningArtifacts() {
  const pkg = JSON.parse(read("package.json"));
  const scripts = pkg.scripts || {};
  const failures = [];

  for (const file of CO_CLEAN_02_ABSENT_FILES) {
    if (exists(file)) failures.push(`STALE_CLEANING_ARTIFACT_PRESENT:${file}`);
  }

  for (const scriptName of CO_CLEAN_02_FORBIDDEN_PACKAGE_SCRIPTS) {
    if (Object.prototype.hasOwnProperty.call(scripts, scriptName)) failures.push(`RETIRED_PACKAGE_SCRIPT_PRESENT:${scriptName}`);
  }

  if (scripts["check:phase12-post-clean"] !== "node scripts/check-phase12-post-clean-production.mjs") {
    failures.push("PHASE12_POST_CLEAN_ENTRYPOINT_DRIFT");
  }

  const postClean = read("scripts/check-phase12-post-clean-production.mjs");
  if (!postClean.includes("assertNoUnreferencedCleaningArtifacts")) failures.push("CO_CLEAN_02_GUARD_NOT_WIRED_TO_POST_CLEAN");
  if (!postClean.includes("CO_CLEAN_02_ABSENT_FILES")) failures.push("CO_CLEAN_02_ABSENT_LIST_NOT_REPORTED_BY_POST_CLEAN");

  const manifest = read("scripts/production-gate.manifest.mjs");
  if (!manifest.includes('gate("phase12-post-clean", "Phase 12 post-clean production hygiene", "check:phase12-post-clean"')) {
    failures.push("PHASE12_POST_CLEAN_NOT_IN_PRODUCTION_GATE");
  }

  const remainingScriptNames = listFiles("scripts", ".mjs").map((file) => normalize(file));
  if (!remainingScriptNames.includes(THIS_FILE)) failures.push("CO_CLEAN_02_GUARD_FILE_NOT_DISCOVERABLE");

  assert.deepEqual(failures, [], `CO_CLEAN_02_UNREFERENCED_CLEANING_ARTIFACTS:${failures.join("|")}`);
  return {
    check: "CO-CLEAN-02 unreferenced cleaning artifacts",
    status: "PASS",
    absent_files_asserted: CO_CLEAN_02_ABSENT_FILES.length,
    forbidden_package_scripts_asserted: CO_CLEAN_02_FORBIDDEN_PACKAGE_SCRIPTS.length,
    post_clean_guard_wired: true
  };
}

if (normalize(process.argv[1] || "") === normalize(fileURLToPath(import.meta.url))) {
  console.log(JSON.stringify(assertNoUnreferencedCleaningArtifacts(), null, 2));
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function listFiles(directory, extension) {
  const root = path.join(ROOT, directory);
  if (!fs.existsSync(root)) return [];
  const files = [];
  walk(root, files, extension);
  return files.map((file) => path.relative(ROOT, file)).sort();
}

function walk(target, files, extension) {
  const stat = fs.statSync(target);
  if (stat.isFile()) {
    if (target.endsWith(extension)) files.push(target);
    return;
  }
  for (const entry of fs.readdirSync(target)) walk(path.join(target, entry), files, extension);
}

function normalize(value) {
  return String(value).replaceAll("\\", "/").replace(/^\.\//, "");
}
