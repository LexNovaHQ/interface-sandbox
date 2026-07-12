import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const pipeline = readFileSync("src/runtime/services/pipeline.service.js", "utf8");
const phaseRoot = "src/phases/12-normalized-compiler";
const phaseFiles = ["normalized-compiler.runner.js", "compiler.js", "compiler-m9-section6-v3.js", "phase7-dap-report-projection.js", "exposure-tier-normalizer.js", "normalized-profiler-m9-section6-v4.js", "normalized-profiler-section10-v3.js", "normalized-profiler-section789-v2.js", "normalized-profiler.js", "legal-section-normalizer.js", "report-safe-language.js", "forensic-annexure-normalizer.js", "report-normalization-map.js", "normalized-status.js", "normalizer-validator.js", "normalizer-validator-new-field-sync-v5.js", "normalizer-validator-section10-v4.js"];
for (const file of phaseFiles) assert.equal(existsSync(`${phaseRoot}/${file}`), true, `missing phase-owned compiler file ${file}`);

const runner = readFileSync(`${phaseRoot}/normalized-compiler.runner.js`, "utf8");
assert.ok(runner.includes('phase_owned_path: "src/phases/12-normalized-compiler"'));
assert.ok(runner.includes("../02-cartography-index/services/phase-route-runtime.reader.js"));
assert.ok(runner.includes('delivery_mode: "DERIVED_ONLY"'));
assert.ok(readFileSync(`${phaseRoot}/compiler.js`, "utf8").includes("./compiler-m9-section6-v3.js"));
assert.ok(readFileSync(`${phaseRoot}/compiler-m9-section6-v3.js`, "utf8").includes("./normalized-profiler-m9-section6-v4.js"));
assert.ok(readFileSync(`${phaseRoot}/normalizer-validator.js`, "utf8").includes("./normalizer-validator-new-field-sync-v5.js"));

for (const file of ["compiler-phase2g.runner.js", "compiler.js", "compiler-m9-section6-v3.js", "phase7-dap-report-projection.js", "exposure-tier-normalizer.js", "normalized-profiler-m9-section6-v4.js", "normalized-profiler-section10-v3.js", "normalized-profiler-section789-v2.js", "normalized-profiler.js", "legal-section-normalizer.js", "report-safe-language.js", "forensic-annexure-normalizer.js", "report-normalization-map.js", "normalized-status.js", "normalizer-validator.js", "normalizer-validator-new-field-sync-v5.js", "normalizer-validator-section10-v4.js"]) assert.equal(existsSync(`src/${file}`), false, `obsolete root compiler file still exists: ${file}`);

assert.ok(pipeline.includes('../../phases/12-normalized-compiler/normalized-compiler.runner.js'), "central pipeline must import Phase 11 directly");
assert.equal(pipeline.includes('../../compiler-phase2g.runner.js'), false, "central pipeline must not use root compiler path");

console.log(JSON.stringify({ check: "Phase 11 ownership cleanup", status: "PASS", enforced_gates: ["NORMALIZED_COMPILER_IMPLEMENTATION_PHASE_OWNED", "CENTRAL_PIPELINE_IMPORTS_PHASE11_DIRECTLY", "COMPILER_DERIVED_ONLY_ROUTE_PRESERVED", "COMPILER_FORENSICS_INPUTS_FORBIDDEN", "OBSOLETE_ROOT_COMPILER_FILES_DELETED"] }, null, 2));