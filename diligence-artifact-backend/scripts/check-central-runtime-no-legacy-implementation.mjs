import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const OBSOLETE_ACTIVE_FILES = Object.freeze([
  "src/reviewer-runner.js",
  "src/reviewer-runner-normalized.js",
  "src/reviewer-async-runner.js",
  "src/reviewer-routes.js",
  "src/public-reviewer-routes.js",
  "src/cloud-tasks-dispatcher.js",
  "src/prompt-loader.js",
  "src/reference-loader.js",
  "src/gemini-client.js",
  "src/firestore.js",
  "src/sheets.js",
  "src/drive.js",
  "src/google.js",
  "src/artifact-service.js",
  "src/config.js",
  "src/run-id.js",
  "src/schemas.js",
  "src/permissions.js",
  "src/phase-contracts.js",
  "src/document-source-ingestor.js",
  "src/qualified-review-system/submission.js",
  "src/m11-orchestrator.js",
  "src/m11-orchestrator-m11v2.js",
  "src/m11-deterministic-system-m11v2.js",
  "src/m11-deterministic-system.js",
  "src/m11-status-finalizer.js",
  "src/m11-deterministic-forensics-m11v2.js",
  "src/m11-deterministic-forensics.js",
  "src/m11-forensic-trace-index.js",
  "src/m11-lep-deterministic.js",
  "src/m11-batch-evidence-resolver.js",
  "src/m12-phase2g.runner.js",
  "src/m12-deterministic-challenge.js",
  "src/compiler-phase2g.runner.js",
  "src/compiler.js",
  "src/compiler-m9-section6-v3.js",
  "src/phase7-dap-report-projection.js",
  "src/exposure-tier-normalizer.js",
  "src/normalized-profiler-m9-section6-v4.js",
  "src/normalized-profiler-section10-v3.js",
  "src/normalized-profiler-section789-v2.js",
  "src/normalized-profiler.js",
  "src/legal-section-normalizer.js",
  "src/report-safe-language.js",
  "src/forensic-annexure-normalizer.js",
  "src/report-normalization-map.js",
  "src/normalized-status.js",
  "src/normalizer-validator.js",
  "src/normalizer-validator-new-field-sync-v5.js",
  "src/normalizer-validator-section10-v4.js",
  "src/report-renderer.js"
]);

for (const file of OBSOLETE_ACTIVE_FILES) assert.equal(existsSync(file), false, `obsolete active file still exists: ${file}`);

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
  "src/runtime/services/qualified-review-submission.service.js",
  "src/phases/09-exposure-profile/exposure-profile.runner.js",
  "src/phases/10-operator-challenge/operator-challenge.runner.js",
  "src/phases/11-normalized-compiler/normalized-compiler.runner.js",
  "src/runtime/services/reporting/report-renderer.service.js"
]);
for (const file of requiredAuthorities) assert.ok(existsSync(file), `central/phase authority missing: ${file}`);

const forbiddenImportSpecifiers = OBSOLETE_ACTIVE_FILES.flatMap((file) => {
  const relative = file.replace(/^src\//, "");
  return [`../src/${relative}`, `../../${relative}`, `../../../${relative}`, `../../../../${relative}`];
});
for (const file of collectFiles(["src/runtime", "src/phases", "src/qualified-review-system", "scripts", "public"])) {
  const source = readFileSync(file, "utf8");
  assert.equal(/(?:from\s+|import\s*\()[^;\n]*["'][^"']*archive-legacy\//.test(source), false, `active file imports archive-legacy: ${file}`);
  for (const specifier of forbiddenImportSpecifiers) assert.equal(source.includes(specifier), false, `active file imports deleted obsolete path ${specifier}: ${file}`);
}

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
assert.equal(packageJson.scripts.start, "node src/runtime/main.js");
const app = readFileSync("src/runtime/app.js", "utf8");
assert.equal(app.includes("reviewer-routes.js"), false);
assert.equal(app.includes("public-reviewer-routes.js"), false);
assert.ok(app.includes('app.use("/public", publicRouter)'));
assert.ok(app.includes('app.use("/v1", operatorRouter)'));

const pipeline = readFileSync("src/runtime/services/pipeline.service.js", "utf8");
for (const required of [
  "../../phases/09-exposure-profile/exposure-profile.runner.js",
  "../../phases/10-operator-challenge/operator-challenge.runner.js",
  "../../phases/11-normalized-compiler/normalized-compiler.runner.js",
  "./reporting/report-renderer.service.js"
]) assert.ok(pipeline.includes(required), `central pipeline missing direct implementation import: ${required}`);
assert.ok(pipeline.includes("root_downstream_compatibility_bridges_not_used: true"));

const prompts = readFileSync("src/runtime/services/prompts.service.js", "utf8");
assert.ok(prompts.includes('from "./reference.service.js"'));
assert.equal(prompts.includes("../../reference-loader.js"), false);

console.log(JSON.stringify({
  check: "central runtime obsolete-file deletion firewall",
  status: "PASS",
  deleted_file_count_enforced: OBSOLETE_ACTIVE_FILES.length,
  enforced_gates: [
    "ONE_PRODUCTION_ENTRYPOINT",
    "ONE_PIPELINE_AND_ASYNC_STACK",
    "ONE_PROMPT_REFERENCE_PROVIDER_STORAGE_STACK",
    "CENTRAL_PIPELINE_USES_PHASE_OWNED_DOWNSTREAM_IMPLEMENTATIONS",
    "OBSOLETE_ACTIVE_FILES_PHYSICALLY_ABSENT",
    "NO_ACTIVE_IMPORT_FROM_ARCHIVE",
    "NO_ACTIVE_IMPORT_OF_DELETED_ROOT_PATHS"
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
