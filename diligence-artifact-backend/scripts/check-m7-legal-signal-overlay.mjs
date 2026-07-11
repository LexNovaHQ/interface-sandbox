import assert from "node:assert/strict";
import { buildLegalSignalDerivation } from "../src/phases/02-legal-cartography-index/index.js";
import { PIPELINE_CONTRACTS } from "../src/runtime/contracts/pipeline.contract.js";
import { AGENT_IDS, READ_PERMISSIONS } from "../src/runtime/contracts/artifact-permissions.contract.js";
import { buildPhaseRoutingManifest } from "../src/phases/02-cartography-index/services/phase-routing-manifest.builder.js";
import { buildPhaseRouteRuntimeReadPlan } from "../src/phases/02-cartography-index/services/phase-route-runtime.reader.js";

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

for (const jobId of ["M7_TARGET_PROFILE", "M7_TARGET_PROFILE_FORENSICS"]) {
  const contract = PIPELINE_CONTRACTS[jobId];
  assert.ok(contract.reads.includes("phase_routing_manifest"), `${jobId} must enter through the Phase 2G manifest`);
  assert.equal(contract.reads.includes(LEGAL_SIGNAL_PROFILE), false, `${jobId} must not direct-read the legal signal profile`);
  assert.equal(contract.reads.includes(OLD_OVERLAY), false, `${jobId} must not read the retired overlay`);
}

const targetActivityReads = READ_PERMISSIONS[AGENT_IDS.targetActivity] || [];
assert.ok(targetActivityReads.includes(LEGAL_SIGNAL_PROFILE), "canonical target/activity permissions must allow the routed legal signal profile");
assert.equal(targetActivityReads.includes(OLD_OVERLAY), false, "canonical target/activity permissions must exclude the retired overlay");

const manifest = buildPhaseRoutingManifest({
  runId: "CHECK_M7_DIRECT_SIGNAL",
  artifacts: presentPhase2Artifacts()
}).phase_routing_manifest;

const materialPlan = buildPhaseRouteRuntimeReadPlan({
  internalJobId: "M7_TARGET_PROFILE",
  phaseRoutingManifest: manifest
});
assert.equal(materialPlan.route_id, "ROUTE.PHASE3A.TARGET_PROFILE");
assert.equal(materialPlan.bucket_id, "2A_BUCKET_TARGET_PROFILE");
assert.deepEqual(materialPlan.allowed_legal_artifacts, [LEGAL_SIGNAL_PROFILE]);
assert.ok(materialPlan.router_artifact_reads.includes(LEGAL_SIGNAL_PROFILE));
assert.ok(materialPlan.artifact_reads.includes(LEGAL_SIGNAL_PROFILE));
assert.equal(materialPlan.artifact_reads.includes(OLD_OVERLAY), false);

const forensicsPlan = buildPhaseRouteRuntimeReadPlan({
  internalJobId: "M7_TARGET_PROFILE_FORENSICS",
  phaseRoutingManifest: manifest
});
assert.equal(forensicsPlan.delivery_mode, "DERIVED_ONLY");
assert.deepEqual(forensicsPlan.router_artifact_reads, []);
assert.ok(forensicsPlan.consumer_context_reads.includes(LEGAL_SIGNAL_PROFILE));
assert.ok(forensicsPlan.artifact_reads.includes(LEGAL_SIGNAL_PROFILE));
assert.equal(forensicsPlan.artifact_reads.includes(OLD_OVERLAY), false);

console.log("m7 legal signal Phase 2G route plan: PASS");

function presentPhase2Artifacts() {
  return {
    target_profile_source_index: {},
    domain_derivation_source_index: {},
    activity_profile_source_index: {},
    data_privacy_navigation_index: {},
    domain_control_obligation_navigation_index: {},
    legal_cartography_index: {},
    legal_signal_derivation_profile: {}
  };
}
