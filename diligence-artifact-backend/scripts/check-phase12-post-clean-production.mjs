import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  assertNoUnreferencedCleaningArtifacts,
  CO_CLEAN_02_ABSENT_FILES
} from "./check-no-unreferenced-cleaning-artifacts.mjs";

const ROOT = process.cwd();

const EXPECTED_PACKAGE_SCRIPTS = Object.freeze([
  "start",
  "check",
  "check:critical",
  "check:phase1-16-production",
  "check:production-gate-severity",
  "check:syntax:active",
  "check:domain-gate-v0",
  "check:phase1-8-runtime",
  "check:phase3a-target-profile",
  "check:phase3-domain-derivation",
  "check:phase3-sync-v0",
  "check:phase4-target-profile-forensics",
  "check:phase5-activity-profile",
  "check:phase6-activity-profile-forensics",
  "check:phase7-data-provenance-profile",
  "check:phase8-domain-control-obligation",
  "check:runtime-yaml-dep",
  "check:phase10-full",
  "check:phase11-critical",
  "check:phase12-production",
  "check:phase12-post-clean",
  "check:phase13-authority",
  "check:phase13-domain-field-resolution",
  "check:phase13-qr-runtime-ui",
  "check:phase13-submission-qa",
  "check:phase13-legacy-retirement",
  "check:phase16-assembly",
  "check:phase13-production-cutover",
  "check:phase13-production",
  "check:interface-ui",
  "check:interface-report-ui-contract",
  "check:interface-report-visual-regression",
  "check:interface-annex-qr",
  "check:interface-assembly-signals",
  "check:interface-sector-state",
  "check:runtime-authority-boundaries",
  "check:domain-registry-assembled",
  "check:repair-required-retirement",
  "smoke:health",
  "smoke:reviewer",
  "check:e2e-authority"
]);

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
assert.deepEqual(Object.keys(pkg.scripts), EXPECTED_PACKAGE_SCRIPTS, "package scripts must stay rationalized and deterministic");
assert.equal(pkg.scripts.check, "npm run check:critical");
assert.equal(pkg.scripts["check:critical"], "node scripts/run-production-gate.mjs");
assert.equal(pkg.scripts["check:phase1-16-production"], "node scripts/run-production-gate.mjs");
assert.equal(pkg.scripts["check:e2e-authority"], "node scripts/check-e2e-outcome-domain-authority.mjs");
assert.equal(pkg.scripts["check:repair-required-retirement"], "node scripts/check-repair-required-retirement.mjs");
assert.equal(pkg.scripts["check:phase12-production"], "node scripts/check-phase12-production.mjs");
assert.equal(pkg.scripts["check:phase12-post-clean"], "node scripts/check-phase12-post-clean-production.mjs");
assert.equal(pkg.scripts["check:phase13-production"], "npm run check:phase13-authority && npm run check:phase13-domain-field-resolution && npm run check:phase13-qr-runtime-ui && npm run check:phase13-submission-qa && npm run check:phase13-legacy-retirement && npm run check:phase16-assembly && npm run check:phase13-production-cutover");
assert.equal(pkg.scripts["check:interface-ui"], "node scripts/check-interface-ui-universal.mjs && node scripts/check-interface-report-ui-contract.mjs && node scripts/check-interface-annex-qr-contract.mjs && node scripts/check-interface-assembly-signals-contract.mjs && node scripts/check-interface-report-visual-regression.mjs");
assert.equal(pkg.dependencies.cors, "^2.8.5", "cors dependency must remain on the real cors package line, not Express version drift");

for (const forbiddenScript of ["check:p12:co1", "check:p12:co2", "check:p12:co3", "check:p12:co4", "check:p12:co5", "check:runtime-cleanup", "audit:migration-receipts"]) {
  assert.equal(Object.prototype.hasOwnProperty.call(pkg.scripts, forbiddenScript), false, `package.json must not expose retired script alias ${forbiddenScript}`);
}

for (const retiredPath of [...ABSENT_RETIRED_FILES, ...CO_CLEAN_02_ABSENT_FILES]) {
  assert.equal(fs.existsSync(path.join(ROOT, retiredPath)), false, `retired file remains active: ${retiredPath}`);
}

assertNoUnreferencedCleaningArtifacts({ root: ROOT });
console.log(JSON.stringify({ check: "phase12 post-clean production hygiene", status: "PASS", package_script_count: EXPECTED_PACKAGE_SCRIPTS.length, retired_files_absent: ABSENT_RETIRED_FILES.length, repair_required_retirement_registered: true }, null, 2));

function read(file) { return fs.readFileSync(path.join(ROOT, file), "utf8"); }
