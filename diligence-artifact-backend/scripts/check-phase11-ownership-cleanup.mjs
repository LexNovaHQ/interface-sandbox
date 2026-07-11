import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (file) => readFileSync(file, "utf8");
const phaseRoot = "src/phases/11-normalized-compiler";
const phaseFiles = [
  "normalized-compiler.runner.js",
  "compiler.js",
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
for (const file of phaseFiles) assert.doesNotThrow(() => read(`${phaseRoot}/${file}`), `missing phase-owned compiler file ${file}`);

const runner = read(`${phaseRoot}/normalized-compiler.runner.js`);
assert.ok(runner.includes('phase_owned_path: "src/phases/11-normalized-compiler"'));
assert.ok(runner.includes("../02-cartography-index/services/phase-route-runtime.reader.js"));
assert.ok(runner.includes('delivery_mode: "DERIVED_ONLY"'));
assert.ok(read(`${phaseRoot}/compiler.js`).includes("./compiler-m9-section6-v3.js"));
assert.ok(read(`${phaseRoot}/compiler-m9-section6-v3.js`).includes("./normalized-profiler-m9-section6-v4.js"));
assert.ok(read(`${phaseRoot}/normalizer-validator.js`).includes("./normalizer-validator-new-field-sync-v5.js"));

const rootWrappers = [
  "compiler-phase2g.runner.js",
  "compiler.js",
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
for (const file of rootWrappers) {
  const source = read(`src/${file}`);
  assert.ok(source.includes("Compatibility bridge only"), `${file} is not compatibility-only`);
  assert.ok(source.includes("./phases/11-normalized-compiler/"), `${file} does not target Phase 11`);
  assert.equal(source.includes("function "), false, `${file} retains implementation logic`);
}

console.log(JSON.stringify({ check: "Phase 11 ownership cleanup", status: "PASS", enforced_gates: ["NORMALIZED_COMPILER_IMPLEMENTATION_PHASE_OWNED", "COMPILER_DERIVED_ONLY_ROUTE_PRESERVED", "COMPILER_FORENSICS_INPUTS_FORBIDDEN", "ROOT_COMPILER_FILES_COMPATIBILITY_ONLY"] }, null, 2));
