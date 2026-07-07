import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AGENTS, PHASES, PHASE7_DAP_BATCH_ARTIFACT_NAMES, PHASE7_DAP_LAYER5_ARTIFACT_NAMES, PHASE_WRITE_PERMISSIONS, READ_PERMISSIONS, WRITE_PERMISSIONS } from "../src/constants.js";
import { PHASE_CONTRACTS } from "../src/phase-contracts.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const oldPhases = ["M10", "M10_FORENSICS"];
const oldArtifacts = ["data_provenance_profile", "data_provenance_profile_forensics"];

for (const phase of oldPhases) {
  assert.equal(PHASES.includes(phase), false, `old data phase still active:${phase}`);
  assert.equal(PHASE_CONTRACTS[phase], undefined, `old data phase contract still active:${phase}`);
  assert.equal(PHASE_WRITE_PERMISSIONS[phase], undefined, `old data phase write permission still active:${phase}`);
}

assert.equal(PHASE_CONTRACTS.M8_TARGET_FEATURE_PROFILE_FORENSICS.next, "DATA_PROVENANCE_PROFILE_LAYER4");
assert.equal(PHASE_CONTRACTS.DATA_PROVENANCE_PROFILE_LAYER4.next, "DATA_PROVENANCE_PROFILE_LAYER5");
assert.equal(PHASE_CONTRACTS.DATA_PROVENANCE_PROFILE_LAYER5.next, "M11");
assert.ok(AGENTS.includes("agent_4_data_privacy"));

for (const artifactName of oldArtifacts) {
  assert.equal(WRITE_PERMISSIONS.agent_4_data_privacy.includes(artifactName), false, `agent4 still writes ${artifactName}`);
  assert.equal(READ_PERMISSIONS.agent_4_data_privacy.includes(artifactName), false, `agent4 still reads ${artifactName}`);
  assert.equal(READ_PERMISSIONS.agent_5_exposure_registry.includes(artifactName), false, `agent5 still reads ${artifactName}`);
  assert.equal(READ_PERMISSIONS.compiler.includes(artifactName), false, `compiler still reads ${artifactName}`);
  assert.equal(READ_PERMISSIONS.qualified_review_system.includes(artifactName), false, `QR still reads ${artifactName}`);
  assert.equal(PHASE_CONTRACTS.M11.reads.includes(artifactName), false, `M11 still reads ${artifactName}`);
  assert.equal(PHASE_CONTRACTS.M12.reads.includes(artifactName), false, `M12 still reads ${artifactName}`);
  assert.equal(PHASE_CONTRACTS.NORMALIZED_COMPILER.reads.includes(artifactName), false, `compiler contract still reads ${artifactName}`);
}

for (const artifactName of [...PHASE7_DAP_BATCH_ARTIFACT_NAMES, ...PHASE7_DAP_LAYER5_ARTIFACT_NAMES]) {
  assert.ok(PHASE_CONTRACTS.M11.reads.includes(artifactName), `M11 missing Phase 7 artifact ${artifactName}`);
  assert.ok(PHASE_CONTRACTS.M12.reads.includes(artifactName), `M12 missing Phase 7 artifact ${artifactName}`);
  assert.ok(PHASE_CONTRACTS.NORMALIZED_COMPILER.reads.includes(artifactName), `compiler missing Phase 7 artifact ${artifactName}`);
}

for (const rel of ["src/constants.js", "src/phase-contracts.js", "src/normalized-profiler-m9-section6-v4.js", "src/compiler-m9-section6-v3.js"]) {
  const text = fs.readFileSync(path.join(root, rel), "utf8");
  assert.equal(text.includes("M10_FORENSICS"), false, `${rel} still contains M10_FORENSICS`);
  if (rel !== "src/constants.js") assert.equal(text.includes("data_provenance_profile_forensics"), false, `${rel} still contains old forensics artifact`);
}

console.log("Phase 7 M10 runtime retirement: PASS");
