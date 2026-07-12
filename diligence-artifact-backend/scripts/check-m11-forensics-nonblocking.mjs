import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const orchestrator = fs.readFileSync(path.join(root, "src/phases/10-exposure-profile/m11-orchestrator-m11v2.js"), "utf8");
const artifactService = fs.readFileSync(path.join(root, "src/runtime/services/artifacts.service.js"), "utf8");

assert.match(orchestrator, /const diagnostic_status = artifact\.forensic_lock_gate_result\?\.status \|\| artifact\.registry_lock_gate_result\?\.status \|\| "REPAIR_REQUIRED";/);
assert.match(orchestrator, /const lock_status = diagnostic_status === "PASS" \? "LOCKED" : "LOCKED_WITH_LIMITATIONS";/);
assert.match(orchestrator, /artifact\.non_blocking_forensic_repair = \{/);
assert.doesNotMatch(orchestrator, /if \(!isAccepted\(forensicStatus\)\) return forensicStatus/);
assert.match(orchestrator, /forensicStatus === "LOCKED_WITH_LIMITATIONS" \|\| !isAccepted\(forensicStatus\)/);
assert.match(orchestrator, /FORENSICS_DIAGNOSTIC_ONLY_DOES_NOT_BLOCK_M11_TO_M12/);

assert.match(artifactService, /function normalizeArtifactLockStatus\(parsed\)/);
assert.match(artifactService, /parsed\.artifact_name === ART\.exposureForensics && parsed\.lock_status === "REPAIR_REQUIRED"/);
assert.match(artifactService, /return "LOCKED_WITH_LIMITATIONS";/);
assert.match(artifactService, /profile_forensics_are_side_outputs_not_downstream_prerequisites: true/);
assert.match(artifactService, /exposure_forensics_not_required_by_m12_or_compiler: true/);

console.log("m11 forensics nonblocking gate: PASS");