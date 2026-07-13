import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const phaseRoot = "src/phases/12-normalized-compiler";
const required = [
  "phase12-compiler.runner.js",
  "compiler.js",
  "phase12-projection-adapter.js",
  "phase12-compiler-validator.js",
  "phase12-profile-normalizer.js",
  "phase12-taxonomy-normalizer.js",
  "phase12-artifact-family.contract.js"
];
for (const file of required) assert.equal(existsSync(`${phaseRoot}/${file}`), true, `missing production Phase 12 file ${file}`);

const retired = [
  "normalized-compiler.runner.js",
  "compiler-m9-section6-v3.js",
  "phase7-dap-report-projection.js",
  "exposure-tier-normalizer.js",
  "normalized-profiler-m9-section6-v4.js",
  "normalized-profiler-section10-v3.js",
  "normalized-profiler-section789-v2.js",
  "normalized-profiler.js",
  "legal-section-normalizer.js",
  "report-safe-language.js",
  "forensic-annexure-normalizer.js",
  "report-normalization-map.js",
  "normalized-status.js",
  "normalizer-validator.js",
  "normalizer-validator-new-field-sync-v5.js",
  "normalizer-validator-section10-v4.js"
];
for (const file of retired) assert.equal(existsSync(`${phaseRoot}/${file}`), false, `legacy Phase 12 file remains ${file}`);

const runner = readFileSync(`${phaseRoot}/phase12-compiler.runner.js`, "utf8");
assert.ok(runner.includes("DIRECT_MATERIAL_PROFILE_ARTIFACTS"));
assert.ok(runner.includes("phase2g_dependency_forbidden: true"));
assert.equal(runner.includes("phase-route-runtime.reader.js"), false);
const compiler = readFileSync(`${phaseRoot}/compiler.js`, "utf8");
assert.ok(compiler.includes("./phase12-projection-adapter.js"));
assert.equal(compiler.includes("compiler-m9-section6-v3.js"), false);

const pipeline = readFileSync("src/runtime/services/pipeline.service.js", "utf8");
assert.ok(pipeline.includes("../../phases/12-normalized-compiler/phase12-compiler.runner.js"));
assert.equal(pipeline.includes("../../phases/12-normalized-compiler/normalized-compiler.runner.js"), false);
console.log("Phase 12 compiler ownership and legacy retirement: PASS");
