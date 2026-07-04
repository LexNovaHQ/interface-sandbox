import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const orchestrator = fs.readFileSync(path.join(root, "src", "m11-orchestrator-m11v2.js"), "utf8");
const artifactService = fs.readFileSync(path.join(root, "src", "artifact-service.js"), "utf8");

assert.match(orchestrator, /const diagnostic_status = artifact\.forensic_lock_gate_result\?\.status \|\| artifact\.registry_lock_gate_result\?\.status \|\| "REPAIR_REQUIRED";/);
assert.match(orchestrator, /const lock_status = diagnostic_status === "PASS" \? "LOCKED" : "LOCKED_WITH_LIMITATIONS";/);
assert.match(orchestrator, /artifact\.non_blocking_forensic_repair = \{/);
assert.doesNotMatch(orchestrator, /if \(!isAccepted\(forensicStatus\)\) return forensicStatus/);
assert.match(orchestrator, /!isAccepted\(forensicStatus\)\) return "LOCKED_WITH_LIMITATIONS"/);
assert.match(orchestrator, /forensic_lock_status: forensics\.lock_status/);
assert.match(orchestrator, /forensic_diagnostic_status: forensics\.diagnostic_status \|\| "UNKNOWN"/);
assert.match(orchestrator, /phase_status: finalStatus/);

assert.match(artifactService, /function normalizeArtifactLockStatus\(parsed\)/);
assert.match(artifactService, /parsed\.artifact_name === "exposure_registry_profile_forensics" && parsed\.lock_status === "REPAIR_REQUIRED"/);
assert.match(artifactService, /return "LOCKED_WITH_LIMITATIONS";/);
assert.match(artifactService, /async function normalizePhaseLockBody\(body\)/);
assert.match(artifactService, /body\.phase === "M11" && body\.status === "REPAIR_REQUIRED"/);
assert.match(artifactService, /getArtifactMetadata\(body\.run_id, "exposure_registry_profile_forensics"\)/);
assert.match(artifactService, /status: "LOCKED_WITH_LIMITATIONS"/);
assert.match(artifactService, /next_phase: body\.next_phase && body\.next_phase !== body\.phase \? body\.next_phase : "M12"/);

console.log("m11 forensics nonblocking gate: PASS");
