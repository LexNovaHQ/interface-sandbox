import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (file) => readFileSync(file, "utf8");
const phaseRoot = "src/phases/09-exposure-profile";
const pipeline = read("src/runtime/services/pipeline.service.js");
const phaseRunner = read(`${phaseRoot}/exposure-profile.runner.js`);
const orchestrator = read(`${phaseRoot}/m11-orchestrator-m11v2.js`);
const resolver = read(`${phaseRoot}/m11-batch-evidence-resolver.js`);

const phaseFiles = [
  "exposure-profile.runner.js",
  "m11-orchestrator-m11v2.js",
  "m11-deterministic-system-m11v2.js",
  "m11-deterministic-system.js",
  "m11-status-finalizer.js",
  "m11-deterministic-forensics-m11v2.js",
  "m11-deterministic-forensics.js",
  "m11-forensic-trace-index.js",
  "m11-lep-deterministic.js",
  "m11-batch-evidence-resolver.js"
];
for (const file of phaseFiles) assert.doesNotThrow(() => read(`${phaseRoot}/${file}`), `missing phase-owned M11 file ${file}`);

assert.ok(phaseRunner.includes("./m11-orchestrator-m11v2.js"));
assert.ok(orchestrator.includes('phase_owned_path: "src/phases/09-exposure-profile"'));
assert.ok(orchestrator.includes("../../runtime/services/artifacts.service.js"));
assert.ok(orchestrator.includes("../02-cartography-index/services/phase-route-runtime.reader.js"));

for (const marker of ["lossless_family__", "fallback_policy", "fallback evidence", "fallback_evidence"]) {
  assert.equal(resolver.toLowerCase().includes(marker.toLowerCase()), false, `Phase 9 resolver retains retired evidence marker: ${marker}`);
}
for (const marker of [
  "lossless_root__company_identity",
  "lossless_root__privacy_data_processing",
  "lossless_root__security_trust_compliance",
  "legal_doc_",
  'evidence_role: "PRIMARY_EVIDENCE"',
  'direct_lossless_fallback_used: false',
  "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY"
]) assert.ok(resolver.includes(marker), `Phase 9 resolver missing current routing marker: ${marker}`);

const rootWrappers = [
  "m11-orchestrator.js",
  "m11-orchestrator-m11v2.js",
  "m11-deterministic-system-m11v2.js",
  "m11-deterministic-system.js",
  "m11-status-finalizer.js",
  "m11-deterministic-forensics-m11v2.js",
  "m11-deterministic-forensics.js",
  "m11-forensic-trace-index.js",
  "m11-lep-deterministic.js",
  "m11-batch-evidence-resolver.js"
];
for (const file of rootWrappers) {
  const source = read(`src/${file}`);
  assert.ok(source.includes("Compatibility bridge only"), `root M11 file is not a compatibility bridge: ${file}`);
  assert.ok(source.includes("./phases/09-exposure-profile/"), `root M11 bridge does not target Phase 9: ${file}`);
  assert.equal(source.includes("function "), false, `root M11 bridge retains implementation logic: ${file}`);
}

assert.ok(pipeline.includes('../../m11-orchestrator.js'), "central pipeline compatibility bridge unexpectedly changed before final root cleanup");

console.log(JSON.stringify({
  check: "Phase 9 ownership cleanup",
  status: "PASS",
  enforced_gates: [
    "M11_IMPLEMENTATION_PHASE_OWNED",
    "ROOT_M11_FILES_COMPATIBILITY_ONLY",
    "NO_RETIRED_LOSSLESS_FAMILY_INPUTS",
    "LOSSLESS_EVIDENCE_PRIMARY_NOT_FALLBACK",
    "P2G_2F_ROUTING_AUTHORITY_PRESERVED"
  ]
}, null, 2));
