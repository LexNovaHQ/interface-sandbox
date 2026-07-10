import assert from "node:assert/strict";
import { PIPELINE_CONTRACTS, PIPELINE_CONTRACT_STATUS } from "../src/runtime/contracts/pipeline.contract.js";
import { ARTIFACTS_SERVICE_STATUS } from "../src/runtime/services/artifacts.service.js";
import { PHASE_3B_DOMAIN_DERIVATION_SELECTION_STAGE, buildPhase3BDomainDerivationManifestUpdate } from "../src/runtime/domain-gate/active-run-package-manifest.schema.js";

const downstreamJobs = [
  "M7_TARGET_PROFILE_FORENSICS",
  "M8_FEATURE_CANDIDATE_INVENTORY",
  "M8_TARGET_FEATURE_PROFILE",
  "M8_TARGET_FEATURE_PROFILE_FORENSICS",
  "DATA_PROVENANCE_PROFILE_LAYER4",
  "DATA_PROVENANCE_PROFILE_FORENSICS",
  "M11",
  "M12",
  "NORMALIZED_COMPILER",
  "QUALIFIED_REVIEW"
];
for (const jobId of downstreamJobs) {
  const reads = PIPELINE_CONTRACTS[jobId]?.reads || [];
  assert.ok(reads.includes("domain_derivation_profile"), `${jobId} must read domain_derivation_profile`);
}
assert.ok(PIPELINE_CONTRACTS.P3_DOMAIN_DERIVATION_LAYER.reads.includes("domain_derivation_source_index"), "3B must read P2B domain_derivation_source_index");
assert.equal(PIPELINE_CONTRACTS.P3_DOMAIN_DERIVATION_LAYER.reads.includes("activity_profile_source_index"), false, "3B must not read activity_profile_source_index");
assert.equal(PIPELINE_CONTRACT_STATUS.downstream_reads_domain_derivation_profile, true);
assert.equal(PIPELINE_CONTRACT_STATUS.phase2b_domain_derivation_source_index_runtime_wired, true);
assert.equal(PIPELINE_CONTRACT_STATUS.activity_profile_source_index_reserved_for_2c_phase5, true);
assert.equal(ARTIFACTS_SERVICE_STATUS.phase2b_domain_derivation_source_index_save_order_gate_enforced, true);
assert.equal(ARTIFACTS_SERVICE_STATUS.phase3_domain_derivation_save_order_gate_enforced, true);
assert.equal(ARTIFACTS_SERVICE_STATUS.phase3_manifest_update_order_gate_enforced, true);
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
assert.deepEqual(update.manifest_update.changed_fields.includes("regulatory_overlays"), true);
assert.equal(update.active_run_package_manifest.runtime_flags.dynamic_routing_enabled, false);
assert.equal(update.active_run_package_manifest.runtime_flags.field_registry_compile_enabled, false);
assert.equal(update.manifest_update.dynamic_routing_still_disabled, true);
console.log(JSON.stringify({ check: "phase3 domain derivation downstream", status: "PASS", enforced_gates: ["P2B_DOMAIN_DERIVATION_SOURCE_INDEX_REQUIRED", "ACTIVITY_PROFILE_INDEX_FORBIDDEN_IN_3B", "REGULATORY_OVERLAY_MANIFEST_SYNC", "DOWNSTREAM_READS_DOMAIN_DERIVATION_PROFILE", "PHASE3B_MANIFEST_STAGE", "RUNTIME_FLAGS_STAY_FALSE", "ARTIFACT_SAVE_ORDER_GATES_DECLARED"] }, null, 2));
