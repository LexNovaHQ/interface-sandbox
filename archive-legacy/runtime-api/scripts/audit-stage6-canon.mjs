#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(process.cwd(), "..");
const at = (filePath) => path.join(repoRoot, filePath);
const read = (filePath) => fs.readFileSync(at(filePath), "utf8");
const exists = (filePath) => fs.existsSync(at(filePath));

function fail(message, detail = null) {
  console.error(JSON.stringify({ ok: false, phase: "stage6_canon_audit", error: message, detail }, null, 2));
  process.exit(1);
}

function assert(condition, message, detail = null) {
  if (!condition) fail(message, detail);
}

function parseJson(filePath) {
  try {
    return JSON.parse(read(filePath));
  } catch (error) {
    fail(`Could not parse ${filePath}`, { error: error.message });
  }
}

function assertExists(files = []) {
  for (const file of files) assert(exists(file), "Required canonical Stage 6 file is missing.", { file });
}

function assertIncludes(file, needles = []) {
  const text = read(file);
  for (const needle of needles) assert(text.includes(needle), "Canonical Stage 6 file missing required token.", { file, needle });
}

function assertExcludes(file, needles = []) {
  const text = read(file);
  for (const needle of needles) assert(!text.includes(needle), "Old Stage 6 token remains in active canonical path.", { file, needle });
}

const canonicalFiles = [
  "docs/canon/STAGE6_CANONICAL_FLOW.md",
  "runtime-api/src/diligence/stage6/stage6.runtime.js",
  "runtime-api/src/diligence/stage6/stage6.dictionary.js",
  "runtime-api/src/diligence/stage6/stage6.prompt.js",
  "runtime-api/src/diligence/stage6/6a/6a.runtime.js",
  "runtime-api/src/diligence/stage6/6a/6a.dictionary.js",
  "runtime-api/src/diligence/stage6/6a/6a.prompt.js",
  "runtime-api/src/diligence/stage6/6b/6b.runtime.js",
  "runtime-api/src/diligence/stage6/6b/6b.dictionary.js",
  "runtime-api/src/diligence/stage6/6b/6b.prompt.js",
  "runtime-api/src/diligence/stage6/6c/6c.runtime.js",
  "runtime-api/src/diligence/stage6/6c/6c.dictionary.js",
  "runtime-api/src/diligence/stage6/6c/6c.prompt.js",
  "runtime-api/src/diligence/stage6/validators/validate6aTo6bHandoff.js",
  "runtime-api/src/diligence/stage6/validators/validate6bTo6cHandoff.js",
  "runtime-api/src/diligence/stage6/validators/validate6cTo7Handoff.js",
  "runtime-api/src/live/canonicalLiveStage6To8Pipeline.js",
  "runtime-api/src/live/canonicalLiveDiligenceRunOrchestrator.js",
  "runtime-api/scripts/e2e-stage6a-structural-coverage.mjs",
  "runtime-api/scripts/e2e-stage6b-legal-governance-data-provenance.mjs",
  "runtime-api/scripts/e2e-stage6c-data-provenance-integration.mjs",
  "runtime-api/scripts/e2e-stage6c-to-stage7-handoff.mjs"
];

assertExists(canonicalFiles);

assertIncludes("docs/canon/STAGE6_CANONICAL_FLOW.md", [
  "Stage 6A = legal cartography",
  "Stage 6B = legal/governance data provenance extraction",
  "Stage 6C = product/legal data provenance integration",
  "Stage 6B may never require Stage 5 data provenance rows"
]);

assertIncludes("runtime-api/src/live/canonicalLiveStage6To8Pipeline.js", [
  "runStage6ALegalCartography",
  "runStage6BLegalGovernanceDataProvenance",
  "runStage6CDataProvenanceIntegration",
  "validate6cTo7Handoff",
  "6A_6B_6C_TO_7_CANONICAL"
]);

assertExcludes("runtime-api/src/live/canonicalLiveStage6To8Pipeline.js", [
  "runStage6BDataProvenance",
  "stage6bDataProvenanceRunner",
  "stage6a_legal_document_cartography\", \"running\""
]);

const pkg = parseJson("runtime-api/package.json");
for (const script of [
  "audit:stage6:canon",
  "e2e:stage6a:structural-coverage",
  "e2e:stage6b:legal-governance-data-provenance",
  "e2e:stage6c:data-provenance-integration",
  "e2e:stage6c:stage7-handoff"
]) assert(pkg.scripts?.[script], "Stage 6 canonical package script missing.", { script });

assert(!pkg.scripts?.["e2e:stage6b:data-provenance"], "Old Stage 6B data provenance script must not remain active in package.json.");
assert(pkg.dependencies?.cors === "^2.8.5", "runtime-api/package.json dependency drift: cors must match package-lock.");
assert(pkg.dependencies?.helmet === "^8.1.5", "runtime-api/package.json dependency drift: helmet must match package-lock.");

console.log(JSON.stringify({
  ok: true,
  phase: "stage6_canon_audit",
  checks: {
    canonical_files_present: true,
    canonical_live_path_wired: true,
    stage6a_to_6b_to_6c_to_7_declared: true,
    old_stage6b_runner_not_in_canonical_live_path: true,
    canonical_scripts_registered: true,
    old_stage6b_package_script_retired: true,
    runtime_dependencies_match_package: true
  }
}, null, 2));
