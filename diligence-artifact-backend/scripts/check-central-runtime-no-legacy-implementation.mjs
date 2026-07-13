import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const retiredPhase12 = [
  "src/phases/12-normalized-compiler/normalized-compiler.runner.js",
  "src/phases/12-normalized-compiler/compiler-m9-section6-v3.js",
  "src/phases/12-normalized-compiler/phase7-dap-report-projection.js",
  "src/phases/12-normalized-compiler/exposure-tier-normalizer.js",
  "src/phases/12-normalized-compiler/normalized-profiler-m9-section6-v4.js",
  "src/phases/12-normalized-compiler/normalized-profiler-section10-v3.js",
  "src/phases/12-normalized-compiler/normalized-profiler-section789-v2.js",
  "src/phases/12-normalized-compiler/normalized-profiler.js",
  "src/phases/12-normalized-compiler/legal-section-normalizer.js",
  "src/phases/12-normalized-compiler/report-safe-language.js",
  "src/phases/12-normalized-compiler/forensic-annexure-normalizer.js",
  "src/phases/12-normalized-compiler/report-normalization-map.js",
  "src/phases/12-normalized-compiler/normalized-status.js",
  "src/phases/12-normalized-compiler/normalizer-validator.js",
  "src/phases/12-normalized-compiler/normalizer-validator-new-field-sync-v5.js",
  "src/phases/12-normalized-compiler/normalizer-validator-section10-v4.js"
];
for (const file of retiredPhase12) assert.equal(existsSync(file), false, `retired Phase 12 file exists: ${file}`);

for (const file of [
  "src/runtime/main.js",
  "src/runtime/services/pipeline.service.js",
  "src/runtime/services/artifacts.service.js",
  "src/phases/10-exposure-profile/exposure-profile.runner.js",
  "src/phases/11-operator-challenge/operator-challenge.runner.js",
  "src/phases/12-normalized-compiler/phase12-compiler.runner.js",
  "src/runtime/services/reporting/report-renderer.service.js"
]) assert.ok(existsSync(file), `production authority missing: ${file}`);

const pipeline = readFileSync("src/runtime/services/pipeline.service.js", "utf8");
assert.ok(pipeline.includes("../../phases/12-normalized-compiler/phase12-compiler.runner.js"));
assert.equal(pipeline.includes("runCompilerPhase2G"), false);
assert.ok(pipeline.includes("root_downstream_compatibility_bridges_not_used: true"));
console.log("Central runtime Phase 12 legacy retirement firewall: PASS");
