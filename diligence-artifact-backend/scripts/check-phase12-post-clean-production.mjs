import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  assertNoUnreferencedCleaningArtifacts,
  CO_CLEAN_02_ABSENT_FILES
} from "./check-no-unreferenced-cleaning-artifacts.mjs";
import { PRODUCTION_GATE_CHECKS } from "./production-gate.manifest.mjs";

const ROOT = process.cwd();

const REQUIRED_SCRIPT_BINDINGS = Object.freeze({
  start: "node src/runtime/main.js",
  check: "npm run check:critical",
  "check:critical": "node scripts/run-production-gate.mjs",
  "check:phase1-16-production": "node scripts/run-production-gate.mjs",
  "check:phase12-production": "node scripts/check-phase12-production.mjs",
  "check:phase12-post-clean": "node scripts/check-phase12-post-clean-production.mjs",
  "check:repair-required-retirement": "node scripts/check-repair-required-retirement.mjs",
  "check:semantic-outcome-integrity": "node scripts/check-semantic-outcome-integrity.mjs",
  "check:e2e-authority": "node scripts/check-e2e-outcome-domain-authority.mjs",
  "check:phase13-production": "npm run check:phase13-authority && npm run check:phase13-domain-field-resolution && npm run check:phase13-qr-runtime-ui && npm run check:phase13-submission-qa && npm run check:phase13-legacy-retirement && npm run check:phase16-assembly && npm run check:phase13-production-cutover",
  "check:interface-ui": "node scripts/check-interface-ui-universal.mjs && node scripts/check-interface-report-ui-contract.mjs && node scripts/check-interface-annex-qr-contract.mjs && node scripts/check-interface-assembly-signals-contract.mjs && node scripts/check-interface-report-visual-regression.mjs"
});

const ABSENT_RETIRED_FILES = Object.freeze([
  "scripts/apply-co-p12-05-cutover.mjs",
  "scripts/apply-phase6-behavior-forensics-sync.mjs",
  "scripts/apply-phase7-p2g-legal-permission-sync.mjs",
  "scripts/apply-phase7-output-check-dedup.mjs",
  "scripts/apply-phase7-registry-metadata-scope-sync.mjs",
  "scripts/apply-phase1-source-discovery-contract-check-sync.mjs",
  "scripts/apply-phase1-8-phase2g-boundary-sync.mjs",
  "scripts/apply-phase1-active-runtime-legacy-token-sanitize.mjs",
  ".github/workflows/co-p12-06-validate.yml",
  ".github/workflows/co-p12-05-atomic-finalize.yml",
  ".github/workflows/co-p12-04-atomic-finalize.yml",
  ".github/workflows/co-p12-03-atomic-finalize.yml",
  ".github/workflows/full-backend-contract-check.yml",
  "co-p12-06-validation-trigger.txt",
  "src/phases/12-normalized-compiler/compiler-m9-section6-v3.js",
  "src/phases/12-normalized-compiler/normalized-profiler-m9-section6-v4.js",
  "src/m9-hybrid-compiler-v2.js",
  "src/phase-contracts.js"
]);

const pkg = JSON.parse(read("package.json"));
const scriptNames = new Set(Object.keys(pkg.scripts || {}));

for (const [scriptName, expectedCommand] of Object.entries(REQUIRED_SCRIPT_BINDINGS)) {
  assert.equal(pkg.scripts?.[scriptName], expectedCommand, `required package script binding drifted: ${scriptName}`);
}

for (const gate of PRODUCTION_GATE_CHECKS) {
  assert.equal(scriptNames.has(gate.script), true, `production gate references missing package script: ${gate.id}:${gate.script}`);
}

assert.equal(new Set(PRODUCTION_GATE_CHECKS.map((gate) => gate.id)).size, PRODUCTION_GATE_CHECKS.length, "production gate ids must be unique");
assert.equal(new Set(PRODUCTION_GATE_CHECKS.map((gate) => gate.script)).size, PRODUCTION_GATE_CHECKS.length, "each production gate script must execute once");
assert.equal(PRODUCTION_GATE_CHECKS.filter((gate) => gate.script === "check:syntax:active").length, 1, "production gate must execute one active syntax pass");
assert.equal(pkg.dependencies.cors, "^2.8.5", "cors dependency must remain on the real cors package line, not Express version drift");

for (const forbiddenScript of ["check:p12:co1", "check:p12:co2", "check:p12:co3", "check:p12:co4", "check:p12:co5", "check:runtime-cleanup", "audit:migration-receipts"]) {
  assert.equal(Object.prototype.hasOwnProperty.call(pkg.scripts, forbiddenScript), false, `package.json must not expose retired script alias ${forbiddenScript}`);
}

for (const retiredPath of [...ABSENT_RETIRED_FILES, ...CO_CLEAN_02_ABSENT_FILES]) {
  assert.equal(fs.existsSync(path.join(ROOT, retiredPath)), false, `retired file remains active: ${retiredPath}`);
}

assertNoUnreferencedCleaningArtifacts({ root: ROOT });
console.log(JSON.stringify({
  check: "phase12 post-clean production hygiene",
  status: "PASS",
  required_script_bindings: Object.keys(REQUIRED_SCRIPT_BINDINGS).length,
  production_gate_checks: PRODUCTION_GATE_CHECKS.length,
  production_gate_scripts_unique: true,
  active_syntax_pass_count: 1,
  retired_files_absent: ABSENT_RETIRED_FILES.length,
  repair_required_retirement_registered: true,
  semantic_outcome_integrity_registered: true
}, null, 2));

function read(file) { return fs.readFileSync(path.join(ROOT, file), "utf8"); }
