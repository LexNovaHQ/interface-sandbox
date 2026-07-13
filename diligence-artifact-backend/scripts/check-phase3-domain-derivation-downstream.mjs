import assert from "node:assert/strict";
import { PIPELINE_CONTRACTS, PIPELINE_CONTRACT_STATUS } from "../src/runtime/contracts/pipeline.contract.js";
import { ARTIFACTS_SERVICE_STATUS } from "../src/runtime/services/artifacts.service.js";
import { PHASE_3B_DOMAIN_DERIVATION_SELECTION_STAGE, buildPhase3BDomainDerivationManifestUpdate } from "../src/runtime/domain-gate/active-run-package-manifest.schema.js";
import { buildPhaseRoutingManifest } from "../src/phases/02-cartography-index/services/phase-routing-manifest.builder.js";
import { buildPhaseRouteRuntimeReadPlan } from "../src/phases/02-cartography-index/services/phase-route-runtime.reader.js";

const phase2gDomainContextJobs = [
  "M7_TARGET_PROFILE_FORENSICS",
  "M8_FEATURE_CANDIDATE_INVENTORY",
  "M8_TARGET_FEATURE_PROFILE",
  "M8_TARGET_FEATURE_PROFILE_FORENSICS",
  "DATA_PROVENANCE_PROFILE_LAYER4",
  "M11",
  "M12"
];
const routedJobs = [...phase2gDomainContextJobs, "DATA_PROVENANCE_PROFILE_FORENSICS"];
const manifest = buildPhaseRoutingManifest({ runId: "CHECK-DOMAIN-DOWNSTREAM", artifacts: presentPhase2Artifacts() }).phase_routing_manifest;

for (const jobId of routedJobs) assert.deepEqual(PIPELINE_CONTRACTS[jobId]?.reads, ["phase_routing_manifest"], `${jobId} central contract retains shadow reads`);
for (const jobId of phase2gDomainContextJobs) {
  const plan = buildPhaseRouteRuntimeReadPlan({ internalJobId: jobId, phaseRoutingManifest: manifest });
  assert.ok(plan.artifact_reads.includes("domain_derivation_profile"), `${jobId} routed packet must include domain_derivation_profile`);
}

const phase8Plan = buildPhaseRouteRuntimeReadPlan({ internalJobId: "DATA_PROVENANCE_PROFILE_FORENSICS", phaseRoutingManifest: manifest });
assert.equal(phase8Plan.artifact_reads.includes("domain_derivation_profile"), false, "Phase 8 must consume locked Phase 7 artifacts rather than re-read domain profile");
assert.ok(PIPELINE_CONTRACTS.QUALIFIED_REVIEW.reads.includes("domain_derivation_profile"), "Qualified Review must retain domain derivation context");

const compilerReads = PIPELINE_CONTRACTS.NORMALIZED_COMPILER.reads || [];
for (const forbidden of ["phase_routing_manifest", "phase_route_runtime_packet", "phase_route_validation_manifest", "target_profile_forensics", "target_feature_profile_forensics", "dap_forensics_profile", "exposure_registry_profile_forensics", "exposure_registry_route_plan", "exposure_registry_workpad_98"]) {
  assert.equal(compilerReads.includes(forbidden), false, `Phase 12 compiler retains forbidden input ${forbidden}`);
}
for (const required of ["target_profile", "domain_derivation_profile", "target_feature_profile", "domain_control_obligation_profile", "legal_cartography_index", "legal_signal_derivation_profile", "exposure_registry_controlled_profile", "exposure_registry_triggered_profile", "challenge_gate"]) {
  assert.equal(compilerReads.includes(required), true, `Phase 12 compiler missing direct material input ${required}`);
}

assert.deepEqual(PIPELINE_CONTRACTS.P3_DOMAIN_DERIVATION_LAYER.reads, ["phase_routing_manifest"]);
assert.equal(PIPELINE_CONTRACT_STATUS.downstream_reads_domain_derivation_profile_via_phase2g, true);
assert.equal(PIPELINE_CONTRACT_STATUS.phase2b_domain_derivation_source_index_runtime_wired, true);
assert.equal(PIPELINE_CONTRACT_STATUS.phase2g_phase_router_declared, true);
assert.equal(PIPELINE_CONTRACT_STATUS.phase2g_lossless_evidence_primary, true);
assert.equal(PIPELINE_CONTRACT_STATUS.phase2g_no_shadow_downstream_read_arrays, true);
assert.equal(PIPELINE_CONTRACT_STATUS.phase2g_runtime_boundary_ends_before_compiler, true);
assert.equal(PIPELINE_CONTRACT_STATUS.phase12_direct_profile_runtime_wired, true);
assert.equal(ARTIFACTS_SERVICE_STATUS.phase2b_domain_derivation_source_index_save_order_gate_enforced, true);
assert.equal(ARTIFACTS_SERVICE_STATUS.phase2g_phase_router_save_order_gate_enforced, true);
assert.equal(ARTIFACTS_SERVICE_STATUS.phase3_domain_derivation_save_order_gate_enforced, true);
assert.equal(ARTIFACTS_SERVICE_STATUS.phase3_manifest_update_order_gate_enforced, true);
assert.equal(ARTIFACTS_SERVICE_STATUS.profile_forensics_are_side_outputs_not_downstream_prerequisites, true);

const update = buildPhase3BDomainDerivationManifestUpdate({
  run: { run_id: "TEST" },
  before: { runtime_flags: { dynamic_routing_enabled: true, field_registry_compile_enabled: true } },
  domain_derivation_profile: {
    primary_domain_derivation: { selected_package: "fintech", status: "LOCKED", selected_rule_id: "PRIMARY_DOMAIN_FINTECH", evaluated_rules: [] },
    ai_mount_derivation: { ai_package_mount: "AI_NOT_VISIBLE", status: "NOT_VISIBLE", evaluated_rules: [] },
    regulatory_overlay_derivation: { status: "CANDIDATE_ONLY", candidates: [{ overlay_id: "financial-services", evidence_anchors: [{ source_artifact_name: "lossless_root__regulatory_licensing_status" }] }] },
    fusion_candidate_derivation: { candidates: [] }
  },
  validation: { status: "LOCKED", failures: [], warnings: [] }
});
assert.equal(update.active_run_package_manifest.selection_stage, PHASE_3B_DOMAIN_DERIVATION_SELECTION_STAGE);
assert.deepEqual(update.active_run_package_manifest.regulatory_overlays, ["financial-services"]);
assert.equal(update.active_run_package_manifest.regulatory_overlay_status, "CANDIDATE_ONLY");
assert.equal(update.manifest_update.changed_fields.includes("regulatory_overlays"), true);
assert.equal(update.active_run_package_manifest.runtime_flags.dynamic_routing_enabled, false);
assert.equal(update.active_run_package_manifest.runtime_flags.field_registry_compile_enabled, false);
assert.equal(update.manifest_update.dynamic_routing_still_disabled, true);

console.log(JSON.stringify({ check: "phase3 domain derivation downstream", status: "PASS", enforced_gates: ["P2G_DOMAIN_CONTEXT_ROUTING_THROUGH_PHASE11", "PHASE12_DIRECT_MATERIAL_PROFILE_INPUTS", "PHASE12_P2G_DEPENDENCY_FORBIDDEN", "NO_SHADOW_CENTRAL_READ_ARRAYS", "PHASE8_LOCKED_PHASE7_ONLY", "REGULATORY_OVERLAY_MANIFEST_SYNC", "FORENSICS_NOT_DOWNSTREAM_PREREQUISITES", "RUNTIME_FLAGS_STAY_FALSE"] }, null, 2));

function presentPhase2Artifacts() {
  return { target_profile_source_index: {}, domain_derivation_source_index: {}, activity_profile_source_index: {}, data_privacy_navigation_index: {}, domain_control_obligation_navigation_index: {}, legal_cartography_index: {}, legal_signal_derivation_profile: {} };
}
