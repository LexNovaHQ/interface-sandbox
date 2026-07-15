import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const exists = (relative) => fs.existsSync(path.join(root, relative));

assert.equal(exists("write_probe.txt"), false, "temporary write_probe.txt must not remain");
assert.equal(exists("probe_cleanup_2.txt"), false, "temporary probe_cleanup_2.txt must not remain");

const phaseRegistry = read("src/phases/phase-registry.js");
assert.ok(phaseRegistry.includes("CENTRAL_RUNTIME_CONTRACTED_ORCHESTRATOR_ACTIVE"), "Phase 2/M9 central runtime status must be explicit");
assert.ok(phaseRegistry.includes("PHASE_RUNNER_CUTOVER_ACTIVE"), "Closed phase runner cutover status must be explicit");
assert.ok(phaseRegistry.includes('phase_id: "ACTIVITY_PROFILE_REVIEW"') && phaseRegistry.includes('phase_id: "ACTIVITY_PROFILE_FORENSICS"'), "Phase 5 and Phase 6 registry entries must both exist");
assert.equal(phaseRegistry.includes("PHASE_RUNNER_CUTOVER_ACTIVE_ACTIVITY_FORENSICS_PENDING"), false, "Phase 5 must not retain pending-forensics status after Phase 6 activation");
assert.equal(phaseRegistry.includes("CONTRACT_LOCKED_IMPLEMENTATION_PENDING"), false, "Phase registry must not retain implementation-pending status for closed phases");
assert.equal(phaseRegistry.includes("ACTIVITY_PROFILE_REVIEW_MATERIAL_RUNNER_CUTOVER_STAGED"), false, "Phase registry must not retain staged Phase 5 language");

const phase2 = read("src/phases/02-legal-cartography-index/legal-cartography-index.phase.js");
assert.ok(phase2.includes("CENTRAL_RUNTIME_CONTRACTED_ORCHESTRATOR_ACTIVE"));
assert.ok(phase2.includes("production_entrypoint_switched: true"));
assert.ok(phase2.includes("active agent_2b_m9 package"));

const phase5 = read("src/phases/05-activity-profile-review/activity-profile-review.phase.js");
assert.ok(phase5.includes("PHASE_RUNNER_CUTOVER_ACTIVE"));
assert.ok(phase5.includes("Activity Profile Forensics is owned by Phase 6"));
assert.equal(phase5.includes("staged for phase-owned runner cutover"), false);
assert.equal(phase5.includes("ACTIVITY_FORENSICS_PENDING"), false);

const m8 = read("agent-packages/agent_3_target_feature/03_M8_FEATURE_PROFILE_BACKEND_CURRENT.md");
assert.ok(m8.includes("target_feature_profile has exactly `activities[]`, `commercial_availability_posture`, and `profile_level_limitations[]`"));
assert.ok(m8.includes('"commercial_availability_posture": {'));
assert.equal(m8.includes("target_feature_profile has exactly activities[] and profile_level_limitations[]"), false);
assert.equal(m8.includes("with activities[] and profile_level_limitations[]"), false);
assert.equal(m8.includes("supersedes that older wording"), false);

const pipeline = read("src/runtime/services/pipeline.service.js");
assert.equal(pipeline.includes("buildActivityCandidateInventoryIndex"), false, "pipeline.service must not import/use direct candidate inventory helper");
assert.equal(pipeline.includes("validateActivityCandidateInventoryIndex"), false, "pipeline.service must not import/use direct candidate inventory validator");
assert.ok(pipeline.includes("runActivityCandidateInventoryPhase"));
assert.ok(pipeline.includes("runActivityProfileReviewPhase"));
assert.ok(pipeline.includes('activityProfileForensics: "M8_TARGET_FEATURE_PROFILE_FORENSICS"'));

console.log("Phase 5 central runtime cleanup: PASS");
