import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { EXECUTION_OUTCOMES, classifyPipelineError, shouldBlockRun } from "../src/runtime/contracts/execution-outcome.contract.js";
import { DOMAIN_DERIVATION_CONTRACT } from "../src/phases/03-domain-derivation/domain-derivation.contract.js";
import { compileDomainDerivationArtifacts } from "../src/phases/03-domain-derivation/validators/domain-derivation.validator.js";
import { loadDomainDerivationRegistryV0 } from "../src/runtime/domain-gate/domain-derivation-registry.loader.js";
import { loadPackageLifecycleV1, selectablePackageIds } from "../src/runtime/domain-gate/package-lifecycle.loader.js";
import { resolvePostReviewPackageDisposition } from "../src/runtime/services/qualified-review-workspace.service.js";

const lifecycle = await loadPackageLifecycleV1();
assert.equal(lifecycle.packages["ai-governance"].lifecycle, "ACTIVE_E2E");
assert.equal(lifecycle.packages.fintech.lifecycle, "ACTIVE_REPORT_ONLY");
assert.equal(lifecycle.packages.saas.lifecycle, "DECLARED_NOT_INSTALLED");
assert.deepEqual(selectablePackageIds(lifecycle), ["ai-governance", "fintech"]);

const packet = await loadDomainDerivationRegistryV0();
assert.deepEqual(packet.registry.selectable_primary_packages, ["ai-governance", "fintech"]);
assert.equal(packet.registry.rules.filter((rule) => rule.rule_type === "PRIMARY_DOMAIN").length, 2);
assert.ok(packet.registry.rules.every((rule) => rule.exclude_if && typeof rule.exclude_if === "object" && !Array.isArray(rule.exclude_if)));

assert.equal(classifyPipelineError(new Error("MODEL_OUTPUT_VALIDATION_FAILED")), EXECUTION_OUTCOMES.REINVESTIGATION_REQUIRED);
assert.equal(shouldBlockRun(EXECUTION_OUTCOMES.REINVESTIGATION_REQUIRED), false);
assert.equal(classifyPipelineError(new Error("provider timeout")), EXECUTION_OUTCOMES.TECHNICAL_RETRY_REQUIRED);
assert.equal(shouldBlockRun(EXECUTION_OUTCOMES.TECHNICAL_RETRY_REQUIRED), false);
assert.equal(classifyPipelineError(new Error("P3_DOMAIN_DERIVATION_FORBIDDEN_INPUT_PRESENT:x")), EXECUTION_OUTCOMES.CRITICAL_FAILURE);
assert.equal(shouldBlockRun(EXECUTION_OUTCOMES.CRITICAL_FAILURE), true);
assert.deepEqual(resolvePostReviewPackageDisposition({ primary_domain_package: "ai-governance", primary_domain_lifecycle: "ACTIVE_E2E", primary_domain_delivery_mode: "FULL_REVIEW_READY" }), { package_id: "ai-governance", lifecycle: "ACTIVE_E2E", delivery_mode: "FULL_REVIEW_READY", mode: "FULL_REVIEW_READY" });
assert.deepEqual(resolvePostReviewPackageDisposition({ primary_domain_package: "fintech", primary_domain_lifecycle: "ACTIVE_REPORT_ONLY", primary_domain_delivery_mode: "REPORT_ONLY" }), { package_id: "fintech", lifecycle: "ACTIVE_REPORT_ONLY", delivery_mode: "REPORT_ONLY", mode: "REPORT_ONLY" });
assert.throws(() => resolvePostReviewPackageDisposition({ primary_domain_package: "saas", primary_domain_lifecycle: "DECLARED_NOT_INSTALLED", primary_domain_delivery_mode: "NOT_EXECUTABLE" }), /PACKAGE_LIFECYCLE_NOT_EXECUTABLE_POST_REVIEW/);

const artifacts = baseArtifacts();
const noWinner = await compileDomainDerivationArtifacts({
  run: { run_id: "no-winner" }, artifacts, registryPacket: packet,
  modelOutput: profile([
    row("PRIMARY_DOMAIN_AI_GOVERNANCE", flags(10)),
    row("PRIMARY_DOMAIN_FINTECH", flags(12))
  ], "saas")
});
assert.equal(noWinner.phase_lock_status, "REINVESTIGATION_REQUIRED");
assert.equal(noWinner.output.domain_derivation_profile.primary_domain_derivation.selected_package, null);
assert.equal(noWinner.output.active_run_package_manifest.primary_domain_package, null);
assert.equal(noWinner.output.domain_derivation_profile.primary_domain_derivation.model_selected_package_ignored, true);

const aiConditions = flags(10, { C1: true, C2: true, C7: true, C8: true, C9: true });
const aiExcluded = await compileDomainDerivationArtifacts({
  run: { run_id: "ai-excluded" }, artifacts, registryPacket: packet,
  modelOutput: profile([
    row("PRIMARY_DOMAIN_AI_GOVERNANCE", aiConditions, false),
    row("PRIMARY_DOMAIN_FINTECH", flags(12))
  ])
});
const aiRule = aiExcluded.output.domain_derivation_profile.primary_domain_derivation.evaluated_rules[0];
assert.equal(aiRule.exclude_result_claimed, false);
assert.equal(aiRule.validator_exclude_result, true);
assert.equal(aiRule.model_exclude_claim_ignored, true);
assert.equal(aiExcluded.output.domain_derivation_profile.primary_domain_derivation.selected_package, null);

const finConditions = flags(12, { C1: true, C2: true, C9: true, C10: true });
const fintech = await compileDomainDerivationArtifacts({
  run: { run_id: "fintech" }, artifacts, registryPacket: packet,
  modelOutput: profile([
    row("PRIMARY_DOMAIN_AI_GOVERNANCE", flags(10)),
    row("PRIMARY_DOMAIN_FINTECH", finConditions, true)
  ], "ai-governance")
});
assert.equal(fintech.phase_lock_status, "LOCKED");
assert.equal(fintech.output.domain_derivation_profile.primary_domain_derivation.selected_package, "fintech");
assert.equal(fintech.output.domain_derivation_profile.primary_domain_derivation.package_lifecycle_state, "ACTIVE_REPORT_ONLY");
assert.equal(fintech.output.active_run_package_manifest.primary_domain_delivery_mode, "REPORT_ONLY");

const pipeline = await readFile(new URL("../src/runtime/services/pipeline.service.js", import.meta.url), "utf8");
assert.ok(pipeline.includes("outcomeRecord(error)"));
assert.ok(!pipeline.includes('await updateRunRecord(run_id, { status: "CONTROLLED_FAILURE" });'));

console.log(JSON.stringify({ check: "CO-E2E-01-03", status: "PASS", selectable_packages: packet.registry.selectable_primary_packages, only_critical_failure_blocks: true }, null, 2));

function profile(evaluated_rules, selected_package = null) {
  return { domain_derivation_profile: { primary_domain_derivation: { selected_package, evaluated_rules }, ai_mount_derivation: { evaluated_rules: [] } } };
}
function row(rule_id, condition_results, exclude_result = false) {
  return { rule_id, condition_results, exclude_result, evidence_anchors: [{ source_artifact_name: "lossless_root__product_service" }] };
}
function flags(count, overrides = {}) {
  return { ...Object.fromEntries(Array.from({ length: count }, (_, i) => [`C${i + 1}`, false])), ...overrides };
}
function baseArtifacts() {
  const value = {
    phase_routing_manifest: {},
    phase_route_runtime_packet: { routing_authority: "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY", route_id: DOMAIN_DERIVATION_CONTRACT.route_contract.route_id, bucket_id: DOMAIN_DERIVATION_CONTRACT.route_contract.bucket_id, lossless_evidence_role: "PRIMARY_EVIDENCE", index_role: "MANDATORY_NAVIGATION_MAP_INTO_PRIMARY_EVIDENCE", profile_forensics_inputs_allowed: false },
    domain_derivation_source_index: {}, target_profile: {}, domain_selection_profile: {},
    active_run_package_manifest: { package_catalog: { available_regulatory_overlays: ["privacy", "financial-services", "eu-ai-act"] }, runtime_flags: {} }
  };
  for (const root of DOMAIN_DERIVATION_CONTRACT.scoped_lossless_evidence_reads) value[root] = { sources: [{ source_id: `${root}-1` }] };
  return value;
}
