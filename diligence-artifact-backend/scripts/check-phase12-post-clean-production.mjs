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
  "check:interface-ui",
  "check:runtime-authority-boundaries",
  "check:domain-registry-assembled",
  "smoke:health",
  "smoke:reviewer"
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
assert.equal(pkg.scripts["check:phase12-production"], "node scripts/check-phase12-production.mjs");
assert.equal(pkg.scripts["check:phase12-post-clean"], "node scripts/check-phase12-post-clean-production.mjs");
assert.equal(pkg.scripts["check:interface-ui"], "node scripts/check-interface-ui-contract.mjs");
assert.equal(pkg.dependencies.cors, "^2.8.5", "cors dependency must remain on the real cors package line, not Express version drift");

for (const forbiddenScript of ["check:p12:co1", "check:p12:co2", "check:p12:co3", "check:p12:co4", "check:p12:co5", "check:runtime-cleanup", "audit:migration-receipts"]) {
  assert.equal(Object.prototype.hasOwnProperty.call(pkg.scripts, forbiddenScript), false, `package.json must not expose retired script alias ${forbiddenScript}`);
}

const gateManifest = read("scripts/production-gate.manifest.mjs");
assert.ok(gateManifest.includes('gate("phase12-production", "Phase 12 production compiler and renderer", "check:phase12-production"'));
assert.ok(gateManifest.includes('gate("phase12-post-clean", "Phase 12 post-clean production hygiene", "check:phase12-post-clean"'));

const coClean02 = assertNoUnreferencedCleaningArtifacts();

const co5 = JSON.parse(read("receipts/CO_P12_05_CERTIFIED.json"));
assert.equal(co5.status, "PASS");
assert.equal(co5.compiler_runtime_cutover_status, "PRODUCTION_DIRECT_PROFILE_COMPILER_ACTIVE");
assert.equal(co5.renderer_cutover_status, "PRODUCTION_CLEAN_PROFILE_RENDERER_ACTIVE");
assert.equal(co5.legacy_recursive_compiler_retired, true);

for (const file of ABSENT_RETIRED_FILES) {
  assert.equal(fs.existsSync(path.join(ROOT, file)), false, `retired/stale file must remain deleted: ${file}`);
}

const compiler = read("src/phases/12-normalized-compiler/compiler.js");
assert.ok(compiler.includes("compilePhase12DirectReportProjection"));
assert.equal(compiler.includes("compiler-m9-section6-v3"), false);

const admission = read("src/phases/12-normalized-compiler/phase12-admission-adapter.js");
assert.ok(admission.includes("PRODUCTION_DIRECT_PROFILE_COMPILER_ACTIVE"));
assert.equal(admission.includes("ADAPTER_READY_NOT_COMPILER_SWAPPED"), false);

const reportContract = read("src/phases/12-normalized-compiler/phase12-report-contract.js");
assert.ok(reportContract.includes("CO_P12_03_ROUTE_CONTRACT_ACTIVE"));
assert.ok(reportContract.includes("phase12_report_contract.v1.co_p12_03_closeout"));

const gapRegister = read("src/phases/12-normalized-compiler/report-contract/UPSTREAM_REPORT_GAP_REGISTER.yml");
assert.ok(gapRegister.includes("P12.RESOLVED.ROUTE_BINDINGS"));
assert.equal(gapRegister.includes("CO_P12_03 must bind each active field"), false);

const projection = read("src/phases/12-normalized-compiler/phase12-projection-adapter.js");
assert.ok(projection.includes("report_manifest"));
assert.ok(projection.includes("report_handoff"));
assert.equal(projection.includes("normalized_report_manifest"), false);
assert.equal(projection.includes("review_ready_section_handoff"), false);

const renderer = read("src/runtime/services/reporting/report-renderer.service.js");
assert.ok(renderer.includes("renderer_payload.v14.co_p12_05"));
assert.ok(renderer.includes("report_manifest"));
assert.ok(renderer.includes("clean_report_profiles_only"));
assert.ok(renderer.includes("interface_report_presentation.v1"));
assert.equal(renderer.includes("normalized_section__"), false);
assert.equal(renderer.includes("normalized_report_manifest"), false);

const permissions = read("src/runtime/contracts/artifact-permissions.contract.js");
assert.ok(permissions.includes("REPORT_FACING_ARTIFACT_NAMES"));
assert.ok(permissions.includes("PHASE12_RENDERER_READ_ARTIFACT_NAMES"));
assert.ok(permissions.includes("export const NORMALIZED_SECTION_ARTIFACT_NAMES = Object.freeze([]);"));
assert.ok(permissions.includes("export const NORMALIZED_COMPILER_ARTIFACT_NAMES = Object.freeze([]);"));

console.log(JSON.stringify({
  check: "CO-P12-06 post-clean production hygiene",
  status: "PASS",
  package_script_count: EXPECTED_PACKAGE_SCRIPTS.length,
  retired_files_asserted_absent: ABSENT_RETIRED_FILES.length,
  co_clean_02_absent_files_asserted: CO_CLEAN_02_ABSENT_FILES.length,
  co_clean_02_guard: coClean02.status,
  phase12_compiler: "DIRECT_PROFILE_COMPILER_ACTIVE",
  phase12_renderer: "CLEAN_PROFILE_RENDERER_ACTIVE",
  route_contract_status: "CO_P12_03_ROUTE_CONTRACT_ACTIVE",
  interface_ui_gate: "ACTIVE",
  closeout_stale_markers: "ABSENT",
  legacy_normalized_aliases: "ABSENT",
  one_time_applicators: "ABSENT",
  unreferenced_cleaning_artifacts: "ABSENT"
}, null, 2));

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}
