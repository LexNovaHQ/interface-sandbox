import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const pipeline = readFileSync("src/runtime/services/pipeline.service.js", "utf8");
const runner = readFileSync("src/phases/10-operator-challenge/operator-challenge.runner.js", "utf8");
const challenge = readFileSync("src/phases/10-operator-challenge/m12-deterministic-challenge.js", "utf8");

assert.ok(runner.includes('phase_owned_path: "src/phases/10-operator-challenge"'));
assert.ok(runner.includes("../02-cartography-index/services/phase-route-runtime.reader.js"));
assert.ok(runner.includes('delivery_mode: "DERIVED_ONLY"'));
assert.ok(runner.includes("profile_forensics_inputs_allowed !== false"));
assert.ok(challenge.includes("FORBIDDEN_FORENSIC_INPUTS"));
assert.ok(challenge.includes('model_usage: "NONE_DETERMINISTIC"'));

for (const file of ["src/m12-phase2g.runner.js", "src/m12-deterministic-challenge.js"]) assert.equal(existsSync(file), false, `obsolete root M12 file still exists: ${file}`);
assert.ok(pipeline.includes('../../phases/10-operator-challenge/operator-challenge.runner.js'), "central pipeline must import Phase 10 directly");
assert.equal(pipeline.includes('../../m12-phase2g.runner.js'), false, "central pipeline must not use root M12 path");

console.log(JSON.stringify({ check: "Phase 10 ownership cleanup", status: "PASS", enforced_gates: ["M12_IMPLEMENTATION_PHASE_OWNED", "CENTRAL_PIPELINE_IMPORTS_PHASE10_DIRECTLY", "M12_DERIVED_ONLY_ROUTE_PRESERVED", "M12_FORENSICS_INPUTS_FORBIDDEN", "OBSOLETE_ROOT_M12_FILES_DELETED"] }, null, 2));