import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AGENTS, PHASES, PHASE7_DAP_BATCH_ARTIFACT_NAMES, PHASE7_DAP_LAYER5_ARTIFACT_NAMES, PHASE_WRITE_PERMISSIONS, READ_PERMISSIONS } from "../src/constants.js";
import { PHASE_CONTRACTS } from "../src/phase-contracts.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const oldArtifacts = ["extended_dap_india_readiness_profile", "integrated_dap_report"];
const oldPhases = ["AGENT_4B_EXTENDED_DAP_INDIA_READINESS", "AGENT_4C_INTEGRATED_DAP_REPORT"];

for (const phase of oldPhases) {
  assert.equal(PHASES.includes(phase), false, `old phase still active:${phase}`);
  assert.equal(PHASE_CONTRACTS[phase], undefined, `old phase contract still active:${phase}`);
  assert.equal(PHASE_WRITE_PERMISSIONS[phase], undefined, `old phase write permission still active:${phase}`);
}
assert.equal(AGENTS.includes("agent_4b_extended_dap"), false);
assert.equal(AGENTS.includes("agent_4c_integrated_dap_compiler"), false);
assert.equal(PHASE_CONTRACTS.DATA_PROVENANCE_PROFILE_LAYER5.next, "M11");
for (const artifactName of oldArtifacts) assert.equal(PHASE_CONTRACTS.NORMALIZED_COMPILER.reads.includes(artifactName), false, `compiler still reads ${artifactName}`);
for (const artifactName of [...PHASE7_DAP_BATCH_ARTIFACT_NAMES, ...PHASE7_DAP_LAYER5_ARTIFACT_NAMES]) assert.ok(PHASE_CONTRACTS.NORMALIZED_COMPILER.reads.includes(artifactName), `compiler missing Phase 7 artifact ${artifactName}`);
assert.equal(READ_PERMISSIONS.compiler.includes("extended_dap_india_readiness_profile"), false);
assert.equal(READ_PERMISSIONS.compiler.includes("integrated_dap_report"), false);
assert.ok(READ_PERMISSIONS.compiler.includes("data_provenance_profile_semantic_batch_gate"));

for (const rel of ["src/compiler-m9-section6-v3.js", "src/normalized-profiler-m9-section6-v4.js", "src/forensic-annexure-normalizer.js", "src/reviewer-runner-normalized.js", "src/phase-contracts.js"]) {
  const text = fs.readFileSync(path.join(root, rel), "utf8");
  for (const artifactName of oldArtifacts) assert.equal(text.includes(artifactName), false, `${rel} still contains ${artifactName}`);
}

console.log("Phase 7 4B/4C runtime retirement: PASS");
