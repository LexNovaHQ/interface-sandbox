import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const TARGETED_ROOT_BRIDGES = Object.freeze([
  "reviewer-runner.js",
  "reviewer-runner-normalized.js",
  "reviewer-async-runner.js",
  "reviewer-routes.js",
  "public-reviewer-routes.js",
  "cloud-tasks-dispatcher.js",
  "prompt-loader.js",
  "reference-loader.js",
  "gemini-client.js",
  "firestore.js",
  "sheets.js",
  "drive.js",
  "google.js",
  "artifact-service.js",
  "config.js",
  "run-id.js",
  "schemas.js",
  "permissions.js",
  "phase-contracts.js",
  "document-source-ingestor.js",
  "qualified-review-system/submission.js"
]);

const IMPLEMENTATION_MARKERS = Object.freeze([
  "express.Router()",
  "new CloudTasksClient",
  "initializeApp(",
  "getFirestore(",
  "generativelanguage.googleapis.com",
  "google.auth.GoogleAuth",
  "saveJsonArtifactToDrive({",
  "async function runModelPhase",
  "async function runNormalizedCompilerPhase",
  "async function requestReviewerRunAdvance"
]);

for (const relative of TARGETED_ROOT_BRIDGES) {
  const file = path.join("src", relative);
  assert.ok(existsSync(file), `targeted compatibility boundary missing unexpectedly: ${file}`);
  const source = readFileSync(file, "utf8");
  assert.ok(source.includes("Compatibility bridge only") || source.includes("Retired compatibility tombstone"), `legacy root file is not compatibility-only: ${file}`);
  for (const marker of IMPLEMENTATION_MARKERS) assert.equal(source.includes(marker), false, `legacy implementation marker returned in ${file}: ${marker}`);
}

const requiredAuthorities = Object.freeze([
  "src/runtime/main.js",
  "src/runtime/services/pipeline.service.js",
  "src/runtime/services/async.service.js",
  "src/runtime/services/prompts.service.js",
  "src/runtime/services/reference.service.js",
  "src/runtime/services/provider.service.js",
  "src/runtime/services/artifacts.service.js",
  "src/runtime/services/storage/firestore.service.js",
  "src/runtime/services/storage/sheets.service.js",
  "src/runtime/services/storage/drive.service.js",
  "src/runtime/routes/public.routes.js",
  "src/phases/09-exposure-profile/exposure-profile.runner.js",
  "src/phases/10-operator-challenge/operator-challenge.runner.js",
  "src/phases/11-normalized-compiler/normalized-compiler.runner.js",
  "src/runtime/services/reporting/report-renderer.service.js"
]);
for (const file of requiredAuthorities) assert.ok(existsSync(file), `central/phase authority missing: ${file}`);

for (const file of collectFiles(["src/runtime", "src/phases", "scripts", "public"])) {
  const source = readFileSync(file, "utf8");
  assert.equal(/(?:from\s+|import\s*\()?["'][^"']*archive-legacy\//.test(source), false, `active file imports archive-legacy: ${file}`);
}

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
assert.equal(packageJson.scripts.start, "node src/runtime/main.js");
const app = readFileSync("src/runtime/app.js", "utf8");
assert.equal(app.includes("reviewer-routes.js"), false);
assert.equal(app.includes("public-reviewer-routes.js"), false);
assert.ok(app.includes('app.use("/public", publicRouter)'));
assert.ok(app.includes('app.use("/v1", operatorRouter)'));

const prompts = readFileSync("src/runtime/services/prompts.service.js", "utf8");
assert.ok(prompts.includes('from "./reference.service.js"'));
assert.equal(prompts.includes("../../reference-loader.js"), false);
const m11 = readFileSync("src/phases/09-exposure-profile/m11-orchestrator-m11v2.js", "utf8");
for (const retired of ["./prompt-loader.js", "./gemini-client.js", "./firestore.js", "./artifact-service.js"]) assert.equal(m11.includes(retired), false, `Phase 9 imports retired root service: ${retired}`);

console.log(JSON.stringify({
  check: "central runtime legacy implementation firewall",
  status: "PASS",
  targeted_root_compatibility_boundaries: TARGETED_ROOT_BRIDGES.length,
  enforced_gates: [
    "ONE_PRODUCTION_ENTRYPOINT",
    "ONE_PIPELINE_AND_ASYNC_STACK",
    "ONE_PROMPT_REFERENCE_PROVIDER_STORAGE_STACK",
    "TARGETED_ROOT_FILES_COMPATIBILITY_ONLY",
    "PHASE9_10_11_IMPLEMENTATIONS_PHASE_OWNED",
    "RENDERER_IMPLEMENTATION_RUNTIME_OWNED",
    "NO_ACTIVE_IMPORT_FROM_ARCHIVE"
  ]
}, null, 2));

function collectFiles(roots) {
  const files = [];
  for (const root of roots) walk(root, files);
  return files.filter((file) => /\.(js|mjs)$/.test(file));
}
function walk(target, files) {
  if (!existsSync(target)) return;
  const stat = statSync(target);
  if (stat.isFile()) { files.push(target); return; }
  for (const entry of readdirSync(target)) {
    if (["node_modules", ".git", "archive", "archive-legacy"].includes(entry)) continue;
    walk(path.join(target, entry), files);
  }
}
