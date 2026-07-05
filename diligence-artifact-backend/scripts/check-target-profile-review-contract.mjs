import assert from "node:assert/strict";
import { TARGET_PROFILE_REVIEW_CONTRACT, TARGET_PROFILE_REVIEW_PHASE, requiredTargetProfileDirectSignalRows, targetProfileReviewReadArtifacts } from "../src/phases/03-target-profile-review/index.js";

const directRows = requiredTargetProfileDirectSignalRows();
const reads = targetProfileReviewReadArtifacts();

assert.equal(TARGET_PROFILE_REVIEW_PHASE.phase_id, "TARGET_PROFILE_REVIEW");
assert.equal(TARGET_PROFILE_REVIEW_PHASE.public_label, "Target Profile Review");
assert.equal(TARGET_PROFILE_REVIEW_PHASE.implementation_status, "CONTRACT_LOCKED_IMPLEMENTATION_PENDING");
assert.deepEqual(TARGET_PROFILE_REVIEW_PHASE.material_outputs, ["target_profile"]);
assert.equal(TARGET_PROFILE_REVIEW_PHASE.secondary_bounded_read_artifacts.includes("legal_signal_derivation_profile"), true);

assert.deepEqual(reads, [
  "source_discovery_handoff",
  "lossless_family__T0_ROOT",
  "lossless_family__T1_IDENTITY",
  "lossless_family__T2_LEGAL_IDENTITY",
  "lossless_family__T3_OPERATOR_ENTITY",
  "lossless_family__T4_SUPPORTING_IDENTITY",
  "legal_signal_derivation_profile"
]);

for (const forbidden of [
  "legal_cartography_index",
  "m7_deterministic_legal_signal_overlay",
  "lossless_family__L1_CORE_TERMS_PRIVACY",
  "lossless_family__L2_B2B_CONTRACTING",
  "lossless_family__L3_AI_USAGE_GOVERNANCE",
  "lossless_family__L4_PRIVACY_ADJACENT_NOTICES",
  "lossless_family__L5_LEGAL_HUB_HOSTED",
  "lossless_family__L6_ENTITY_NOTICE"
]) assert.equal(TARGET_PROFILE_REVIEW_CONTRACT.material_job.forbidden_reads.includes(forbidden), true, `missing forbidden read ${forbidden}`);

assert.equal(TARGET_PROFILE_REVIEW_CONTRACT.material_job.reads.includes("legal_cartography_index"), false);
assert.equal(TARGET_PROFILE_REVIEW_CONTRACT.material_job.reads.some((artifact) => artifact.startsWith("lossless_family__L")), false);
assert.equal(TARGET_PROFILE_REVIEW_CONTRACT.material_job.writes.length, 1);
assert.equal(TARGET_PROFILE_REVIEW_CONTRACT.material_job.writes[0], "target_profile");

assert.equal(directRows.length, 9);
assert.deepEqual(directRows.map((row) => row.field_id), [
  "LGC.NOT.010",
  "LGC.NOT.011",
  "LGC.NOT.012",
  "LGC.NOT.013",
  "TP.JUR.003",
  "TP.JUR.004",
  "TP.JUR.005",
  "TP.JUR.007",
  "TP.JUR.008"
]);

assert.equal(TARGET_PROFILE_REVIEW_CONTRACT.direct_legal_signal_intake.forbidden_field_families.includes("privacy_grievance_contact_signal_map"), true);
assert.equal(TARGET_PROFILE_REVIEW_CONTRACT.direct_legal_signal_intake.forbidden_field_families.includes("consent_manager_signal_map"), true);
assert.equal(TARGET_PROFILE_REVIEW_CONTRACT.direct_legal_signal_intake.status_translation.SOURCE_CONFLICT, "do_not_choose_winner_record_conflict_limitation");
assert.equal(TARGET_PROFILE_REVIEW_CONTRACT.boundary_rules.no_activity_profile_derivation, true);
assert.equal(TARGET_PROFILE_REVIEW_CONTRACT.boundary_rules.no_data_profile_derivation, true);
assert.equal(TARGET_PROFILE_REVIEW_CONTRACT.boundary_rules.no_qualified_review_question_generation, true);
assert.equal(TARGET_PROFILE_REVIEW_CONTRACT.boundary_rules.no_legal_advice, true);

console.log("Target Profile Review contract: PASS");
