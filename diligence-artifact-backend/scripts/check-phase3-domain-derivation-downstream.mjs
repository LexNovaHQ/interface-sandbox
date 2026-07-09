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
assert.equal(PIPELINE_CONTRACT_STATUS.downstream_reads_domain_derivation_profile, true);
assert.equal(ARTIFACTS_SERVICE_STATUS.phase3_domain_derivation_save_order_gate_enforced, true);
assert.equal(ARTIFACTS_SERVICE_STATUS.phase3_manifest_update_order_gate_enforced, true);
const update = buildPhase3BDomainDerivationManifestUpdate({
  run: { run_id: "TEST" },
  before: { runtime_flags: { dynamic_routing_enabled: true, field_registry_compile_enabled: true } },
  domain_derivation_profile: { primary_domain_derivation: { selected_package: "fintech", status: "LOCKED", selected_rule_id: "PRIMARY_DOMAIN_FINTECH", evaluated_rules: [] }, ai_mount_derivation: { ai_package_mount: "AI_NOT_VISIBLE", status: "NOT_VISIBLE", evaluated_rules: [] }, fusion_candidate_derivation: { candidates: [] } },
  validation: { status: "LOCKED", failures: [], warnings: [] }
});
assert.equal(update.active_run_package_manifest.selection_stage, PHASE_3B_DOMAIN_DERIVATION_SELECTION_STAGE);
assert.equal(update.active_run_package_manifest.runtime_flags.dynamic_routing_enabled, false);
assert.equal(update.active_run_package_manifest.runtime_flags.field_registry_compile_enabled, false);
assert.equal(update.manifest_update.dynamic_routing_still_disabled, true);
console.log(JSON.stringify({ check: "phase3 domain derivation downstream", status: "PASS", enforced_gates: ["DOWNSTREAM_READS_DOMAIN_DERIVATION_PROFILE", "PHASE3B_MANIFEST_STAGE", "RUNTIME_FLAGS_STAY_FALSE", "ARTIFACT_SAVE_ORDER_GATES_DECLARED"] }, null, 2));
