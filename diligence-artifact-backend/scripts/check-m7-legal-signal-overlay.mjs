import assert from "node:assert/strict";
import { buildLegalSignalDerivation } from "../src/phases/02-legal-cartography-index/index.js";
import { PIPELINE_CONTRACTS as PHASE_CONTRACTS } from "../src/runtime/contracts/pipeline.contract.js";
import { READ_PERMISSIONS } from "../src/constants.js";

const LEGAL_SIGNAL_PROFILE = "legal_signal_derivation_profile";
const OLD_OVERLAY = "m7_deterministic_legal_signal_overlay";

const out = await buildLegalSignalDerivation({
  run: { run_id: "CHECK_M7_DIRECT_SIGNAL" },
  artifacts: {
    legal_cartography_index: {
      legal_notice_locator: [{ text: "Legal notices may be sent to legal@example.test." }],
      governing_law_venue_locator: [{ text: "These terms are governed by the laws of India and courts in Bengaluru shall have jurisdiction." }]
    }
  }
});

const profile = out.legal_signal_derivation_profile;
assert.equal(profile.model_generated, false);
assert.equal(profile.coverage_summary.emitted_field_count, 21);
assert.ok(profile.field_derivations.some((row) => row.field_id === "TP.JUR.003"));
assert.ok(profile.field_derivations.some((row) => row.field_id === "LGC.NOT.010"));

assert.ok(PHASE_CONTRACTS.M7_TARGET_PROFILE.reads.includes(LEGAL_SIGNAL_PROFILE));
assert.ok(PHASE_CONTRACTS.M7_TARGET_PROFILE_FORENSICS.reads.includes(LEGAL_SIGNAL_PROFILE));
assert.equal(PHASE_CONTRACTS.M7_TARGET_PROFILE.reads.includes(OLD_OVERLAY), false);
assert.equal(PHASE_CONTRACTS.M7_TARGET_PROFILE_FORENSICS.reads.includes(OLD_OVERLAY), false);
assert.ok(READ_PERMISSIONS.agent_3_target_feature.includes(LEGAL_SIGNAL_PROFILE));
assert.equal(READ_PERMISSIONS.agent_3_target_feature.includes(OLD_OVERLAY), false);

console.log("m7 direct legal signal profile: PASS");