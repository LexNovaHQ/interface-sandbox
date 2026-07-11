import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (file) => readFileSync(file, "utf8");
const pipeline = read("src/runtime/services/pipeline.service.js");
const runner = read("src/phases/10-operator-challenge/operator-challenge.runner.js");
const challenge = read("src/phases/10-operator-challenge/m12-deterministic-challenge.js");
const rootRunner = read("src/m12-phase2g.runner.js");
const rootChallenge = read("src/m12-deterministic-challenge.js");

assert.ok(runner.includes('phase_owned_path: "src/phases/10-operator-challenge"'));
assert.ok(runner.includes("../02-cartography-index/services/phase-route-runtime.reader.js"));
assert.ok(runner.includes('delivery_mode: "DERIVED_ONLY"'));
assert.ok(runner.includes("profile_forensics_inputs_allowed !== false"));
assert.ok(challenge.includes("FORBIDDEN_FORENSIC_INPUTS"));
assert.ok(challenge.includes('model_usage: "NONE_DETERMINISTIC"'));

for (const [name, source] of [["m12-phase2g.runner.js", rootRunner], ["m12-deterministic-challenge.js", rootChallenge]]) {
  assert.ok(source.includes("Compatibility bridge only"), `${name} is not compatibility-only`);
  assert.ok(source.includes("./phases/10-operator-challenge/"), `${name} does not target Phase 10`);
  assert.equal(source.includes("function "), false, `${name} retains implementation logic`);
}

assert.ok(pipeline.includes('../../phases/10-operator-challenge/operator-challenge.runner.js'), "central pipeline must import Phase 10 directly");
assert.equal(pipeline.includes('../../m12-phase2g.runner.js'), false, "central pipeline must not use root M12 compatibility bridge");

console.log(JSON.stringify({ check: "Phase 10 ownership cleanup", status: "PASS", enforced_gates: ["M12_IMPLEMENTATION_PHASE_OWNED", "CENTRAL_PIPELINE_IMPORTS_PHASE10_DIRECTLY", "M12_DERIVED_ONLY_ROUTE_PRESERVED", "M12_FORENSICS_INPUTS_FORBIDDEN", "ROOT_M12_FILES_COMPATIBILITY_ONLY"] }, null, 2));
