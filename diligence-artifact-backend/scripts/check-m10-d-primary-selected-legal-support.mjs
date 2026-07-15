import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PIPELINE_CONTRACTS } from "../src/runtime/contracts/pipeline.contract.js";
import { P2G_RUNTIME_ROUTE_BY_JOB, buildPhaseRouteRuntimeReadPlan } from "../src/phases/02-cartography-index/services/phase-route-runtime.reader.js";
import { buildPhaseRoutingManifest } from "../src/phases/02-cartography-index/services/phase-routing-manifest.builder.js";
import { READ_PERMISSIONS } from "../src/runtime/contracts/artifact-permissions.contract.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const directSignal = "legal_signal_derivation_profile";
const legalIndex = "legal_cartography_index";
const oldPacket = "m10_selected_legal_support_packet";
const oldLeanContract = "M10_LEAN_" + "INPUT_CONTRACT";
const layer4Job = "DATA_PROVENANCE_PROFILE_LAYER4";

const phase7Layer4 = PIPELINE_CONTRACTS[layer4Job];
assert.ok(phase7Layer4, "DATA_PROVENANCE_PROFILE_LAYER4 contract missing");

// Phase 7 must no longer keep a shadow/direct read list in the central contract.
assert.deepEqual(phase7Layer4.reads, ["phase_routing_manifest"], "DAP layer4 must read only phase_routing_manifest from the central contract");
assert.equal(phase7Layer4.reads.includes(directSignal), false, "DAP layer4 must not directly list legal_signal_derivation_profile after Phase2G cutover");
assert.equal(phase7Layer4.reads.includes(legalIndex), false, "DAP layer4 must not directly list legal_cartography_index after Phase2G cutover");
assert.equal(phase7Layer4.reads.includes("target_feature_profile"), false, "DAP layer4 must not directly list target_feature_profile after Phase2G cutover");
assert.equal(phase7Layer4.reads.includes(oldPacket), false, "DAP layer4 must not read retired selected-support packet");

// Effective routed reads must still include the legal support and activity spine through P2G.
assert.equal(P2G_RUNTIME_ROUTE_BY_JOB[layer4Job], "ROUTE.PHASE7.DATA_PROVENANCE_PROFILE", "DAP layer4 must be mapped to the Phase7 data/privacy route");
const manifest = buildPhaseRoutingManifest({ runId: "CHECK-PHASE7-LEGAL-SIGNAL-P2G", artifacts: presentPhase2Artifacts() }).phase_routing_manifest;
const plan = buildPhaseRouteRuntimeReadPlan({ internalJobId: layer4Job, phaseRoutingManifest: manifest });

assert.equal(plan.route_id, "ROUTE.PHASE7.DATA_PROVENANCE_PROFILE");
assert.equal(plan.bucket_id, "2D_BUCKET_DATA_PRIVACY");
assert.equal(plan.delivery_mode, "SOURCE_BUCKET_PROFILE");
assert.ok(plan.artifact_reads.includes(directSignal), "P2G routed packet must include legal_signal_derivation_profile");
assert.ok(plan.artifact_reads.includes(legalIndex), "P2G routed packet must include legal_cartography_index");
assert.ok(plan.artifact_reads.includes("target_feature_profile"), "P2G routed packet must include target_feature_profile activity spine");
assert.equal(plan.artifact_reads.includes(oldPacket), false, "P2G routed packet must not include retired selected-support packet");

assert.ok(PIPELINE_CONTRACTS.DATA_PROVENANCE_PROFILE_LAYER5, "DATA_PROVENANCE_PROFILE_LAYER5 contract missing");
assert.equal(PIPELINE_CONTRACTS.DATA_PROVENANCE_PROFILE_LAYER5.reads.includes("phase_routing_manifest"), false, "Layer5 must remain route-neutral deterministic gate");

assert.ok(READ_PERMISSIONS.agent_4_data_privacy.includes(directSignal), "Agent4 must retain permission to receive legal_signal_derivation_profile through P2G");
assert.ok(READ_PERMISSIONS.agent_4_data_privacy.includes(legalIndex), "Agent4 must retain permission to receive legal_cartography_index through P2G");
assert.equal(READ_PERMISSIONS.agent_4_data_privacy.includes(oldPacket), false, "Agent4 must not retain retired selected-support packet read permission");

const phaseContracts = fs.readFileSync(path.join(repoRoot, "src/runtime/contracts/pipeline.contract.js"), "utf8");
assert.equal(phaseContracts.includes(oldLeanContract), false, "old M10 lean input contract marker must be absent");
assert.equal(phaseContracts.includes(oldPacket), false, "pipeline contract must not mention retired selected-support packet");

const runtimePacket = fs.readFileSync(path.join(repoRoot, "agent-packages/agent_4_data_privacy/AGENT4_PHASE7_LAYER4_RUNTIME_BINDING_PACKET.yaml"), "utf8");
assert.ok(runtimePacket.includes("legal_signal_derivation_profile"), "Phase7 runtime binding must document legal signal use through P2G packet");
assert.ok(runtimePacket.includes("legal_cartography_index"), "Phase7 runtime binding must document legal cartography use through P2G packet");
assert.equal(runtimePacket.includes(oldPacket), false, "Phase7 runtime binding must not mention retired selected-support packet");
assert.equal(runtimePacket.includes(oldLeanContract), false, "Phase7 runtime binding must not mention old M10 lean contract");

console.log("phase7 DAP legal signal P2G check: PASS");

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
