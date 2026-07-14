import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { EXECUTION_OUTCOMES, classifyPipelineError, shouldBlockRun } from "../src/runtime/contracts/execution-outcome.contract.js";
import { DOMAIN_DERIVATION_CONTRACT } from "../src/phases/03-domain-derivation/domain-derivation.contract.js";
import { compileDomainDerivationArtifacts } from "../src/phases/03-domain-derivation/validators/domain-derivation.validator.js";
import { DOMAIN_DERIVATION_RUNNER_STATUS } from "../src/phases/03-domain-derivation/domain-derivation.runner.js";
import { loadDomainDerivationRegistryV0 } from "../src/runtime/domain-gate/domain-derivation-registry.loader.js";
import { derivablePackageIds, loadPackageLifecycleV1, mountablePackageIds } from "../src/runtime/domain-gate/package-lifecycle.loader.js";
import { resolvePostReviewPackageDisposition } from "../src/runtime/services/qualified-review-workspace.service.js";

const lifecycle = await loadPackageLifecycleV1();
assert.equal(lifecycle.doctrine.model_derives_primary_domain_and_overlays, true);
assert.equal(lifecycle.doctrine.deterministic_layer_must_not_select_or_replace_model_domain_judgment, true);
assert.equal(lifecycle.doctrine.unresolved_primary_after_reinvestigation_is_non_blocking, true);
assert.equal(lifecycle.packages["ai-governance"].lifecycle, "ACTIVE_E2E");
assert.equal(lifecycle.packages.fintech.lifecycle, "ACTIVE_REPORT_ONLY");
assert.equal(lifecycle.packages.saas.lifecycle, "DECLARED_NOT_INSTALLED");
assert.deepEqual(mountablePackageIds(lifecycle), ["ai-governance", "fintech"]);
assert.equal(derivablePackageIds(lifecycle).includes("saas"), true);
assert.equal(derivablePackageIds(lifecycle).includes("unknown"), false);

const packet = await loadDomainDerivationRegistryV0();
assert.equal(packet.registry.derivation_authority, "MODEL_SEMANTIC_JUDGMENT");
assert.equal(packet.registry.deterministic_role, "STRUCTURE_EVIDENCE_CONSISTENCY_AND_MOUNT_VALIDATION_ONLY");
assert.deepEqual(packet.registry.mountable_primary_packages, ["ai-governance", "fintech"]);
assert.equal(packet.registry.rules.filter((rule) => rule.rule_type === "PRIMARY_DOMAIN").length, 2);
assert.equal(DOMAIN_DERIVATION_RUNNER_STATUS.model_semantic_derivation_authority_active, true);
assert.equal(DOMAIN_DERIVATION_RUNNER_STATUS.deterministic_validation_support_only, true);
assert.equal(DOMAIN_DERIVATION_RUNNER_STATUS.deterministic_domain_selection_forbidden, true);

assert.equal(classifyPipelineError(new Error("MODEL_OUTPUT_VALIDATION_FAILED")), EXECUTION_OUTCOMES.REINVESTIGATION_REQUIRED);
assert.equal(shouldBlockRun(EXECUTION_OUTCOMES.REINVESTIGATION_REQUIRED), false);
assert.equal(classifyPipelineError(new Error("provider timeout")), EXECUTION_OUTCOMES.TECHNICAL_RETRY_REQUIRED);
assert.equal(shouldBlockRun(EXECUTION_OUTCOMES.TECHNICAL_RETRY_REQUIRED), false);
assert.equal(classifyPipelineError(new Error("PRIMARY_DOMAIN_UNRESOLVED_AFTER_REINVESTIGATION")), EXECUTION_OUTCOMES.REINVESTIGATION_REQUIRED);
assert.equal(classifyPipelineError(new Error("P3_DOMAIN_DERIVATION_FORBIDDEN_INPUT_PRESENT:x")), EXECUTION_OUTCOMES.CRITICAL_FAILURE);
assert.equal(shouldBlockRun(EXECUTION_OUTCOMES.CRITICAL_FAILURE), true);

const artifacts = baseArtifacts();

const ai = await compileDomainDerivationArtifacts({
  run: { run_id: "ai-primary" }, artifacts, registryPacket: packet,
  modelOutput: profile({
    primary: primary("ai-governance", "PRIMARY_DOMAIN_AI_GOVERNANCE", row("PRIMARY_DOMAIN_AI_GOVERNANCE", aiPrimaryConditions())),
    ai: { ai_package_mount: "AI_PRIMARY", selected_rule_id: "PRIMARY_DOMAIN_AI_GOVERNANCE", evaluated_rules: [] }
  })
});
assert.equal(ai.phase_lock_status, "LOCKED");
assert.equal(ai.output.domain_derivation_profile.primary_domain_derivation.selected_package, "ai-governance");
assert.equal(ai.output.active_run_package_manifest.primary_domain_package, "ai-governance");
assert.equal(ai.output.active_run_package_manifest.post_review_delivery_mode, "FULL_REVIEW_READY");

const fintech = await compileDomainDerivationArtifacts({
  run: { run_id: "fintech" }, artifacts, registryPacket: packet,
  modelOutput: profile({
    primary: primary("fintech", "PRIMARY_DOMAIN_FINTECH", row("PRIMARY_DOMAIN_FINTECH", fintechConditions())),
    ai: { ai_package_mount: "AI_NOT_VISIBLE", evaluated_rules: [] }
  })
});
assert.equal(fintech.phase_lock_status, "LOCKED");
assert.equal(fintech.output.active_run_package_manifest.primary_domain_package, "fintech");
assert.equal(fintech.output.active_run_package_manifest.post_review_delivery_mode, "REPORT_ONLY");

const uninstalled = await compileDomainDerivationArtifacts({
  run: { run_id: "saas-derived" }, artifacts, registryPacket: packet,
  modelOutput: profile({
    primary: {
      selected_package: "saas",
      status: "LOCKED_WITH_LIMITATIONS",
      evidence_anchors: anchors(),
      evaluated_rules: [],
      final_basis: "Model derived SaaS from the routed public evidence."
    },
    ai: { ai_package_mount: "AI_NOT_VISIBLE", evaluated_rules: [] }
  })
});
assert.equal(uninstalled.phase_lock_status, "LOCKED_WITH_LIMITATIONS");
assert.equal(uninstalled.output.active_run_package_manifest.derived_primary_domain, "saas");
assert.equal(uninstalled.output.active_run_package_manifest.primary_domain_package, null);
assert.equal(uninstalled.output.active_run_package_manifest.post_review_delivery_mode, "UNIVERSAL_REPORT_ONLY");

const unresolvedAiOverlay = await compileDomainDerivationArtifacts({
  run: { run_id: "unresolved-with-ai" }, artifacts, registryPacket: packet,
  reinvestigationExhausted: true,
  modelOutput: profile({
    primary: { selected_package: null, status: "REVIEW_REQUIRED", evaluated_rules: [] },
    ai: {
      ai_package_mount: "AI_OVERLAY_MOUNTED",
      selected_rule_id: "AI_OVERLAY_MOUNTED",
      evidence_anchors: anchors(),
      evaluated_rules: [row("AI_OVERLAY_MOUNTED", aiOverlayConditions())]
    }
  })
});
assert.equal(unresolvedAiOverlay.phase_lock_status, "LOCKED_WITH_LIMITATIONS");
assert.equal(unresolvedAiOverlay.output.active_run_package_manifest.primary_domain_package, null);
assert.equal(unresolvedAiOverlay.output.active_run_package_manifest.ai_package_mount, "AI_OVERLAY_MOUNTED");
assert.equal(unresolvedAiOverlay.output.active_run_package_manifest.post_review_delivery_mode, "AI_OVERLAY_FULL_REVIEW_READY");
assert.equal(unresolvedAiOverlay.validation.ai_overlay_continuation_active, true);
assert.equal(unresolvedAiOverlay.validation.run_blocked, false);

const unresolvedUniversal = await compileDomainDerivationArtifacts({
  run: { run_id: "unresolved-universal" }, artifacts, registryPacket: packet,
  reinvestigationExhausted: true,
  modelOutput: profile({
    primary: { selected_package: null, status: "REVIEW_REQUIRED", evaluated_rules: [] },
    ai: { ai_package_mount: "AI_NOT_VISIBLE", evaluated_rules: [] }
  })
});
assert.equal(unresolvedUniversal.phase_lock_status, "LOCKED_WITH_LIMITATIONS");
assert.equal(unresolvedUniversal.output.active_run_package_manifest.primary_domain_package, null);
assert.equal(unresolvedUniversal.output.active_run_package_manifest.post_review_delivery_mode, "UNIVERSAL_REPORT_ONLY");
assert.equal(unresolvedUniversal.validation.universal_report_only_continuation_active, true);
assert.equal(unresolvedUniversal.validation.run_blocked, false);

assert.deepEqual(resolvePostReviewPackageDisposition({ primary_domain_package: "ai-governance", derived_primary_domain: "ai-governance", primary_domain_lifecycle: "ACTIVE_E2E", primary_domain_delivery_mode: "FULL_REVIEW_READY", post_review_delivery_mode: "FULL_REVIEW_READY" }), { package_id: "ai-governance", derived_primary_domain: "ai-governance", lifecycle: "ACTIVE_E2E", delivery_mode: "FULL_REVIEW_READY", mode: "FULL_REVIEW_READY", ai_overlay: false, unresolved_primary: false });
assert.equal(resolvePostReviewPackageDisposition(unresolvedAiOverlay.output.active_run_package_manifest).mode, "FULL_REVIEW_READY");
assert.equal(resolvePostReviewPackageDisposition(unresolvedAiOverlay.output.active_run_package_manifest).ai_overlay, true);
assert.equal(resolvePostReviewPackageDisposition(unresolvedUniversal.output.active_run_package_manifest).mode, "REPORT_ONLY");
assert.equal(resolvePostReviewPackageDisposition(fintech.output.active_run_package_manifest).mode, "REPORT_ONLY");

const pipeline = await readFile(new URL("../src/runtime/services/pipeline.service.js", import.meta.url), "utf8");
assert.ok(pipeline.includes("outcomeRecord(error)"));
assert.ok(!pipeline.includes('await updateRunRecord(run_id, { status: "CONTROLLED_FAILURE" });'));

console.log(JSON.stringify({
  check: "CO-E2E-01-03-CORRECTED",
  status: "PASS",
  model_derivation_authority: true,
  deterministic_support_only: true,
  mountable_packages: packet.registry.mountable_primary_packages,
  unresolved_primary_blocks: false,
  ai_overlay_without_primary_continues: true,
  universal_report_only_fallback: true,
  only_critical_failure_blocks: true
}, null, 2));

function profile({ primary, ai, regulatory = {}, fusion = {} }) {
  return { domain_derivation_profile: { primary_domain_derivation: primary, ai_mount_derivation: ai, regulatory_overlay_derivation: regulatory, fusion_candidate_derivation: fusion } };
}
function primary(selected_package, selected_rule_id, evaluatedRow) {
  return { selected_package, selected_rule_id, status: "LOCKED", evidence_anchors: anchors(), evaluated_rules: [evaluatedRow], final_basis: "Model semantic derivation from routed public evidence." };
}
function row(rule_id, condition_results, exclude_result = false) {
  return { rule_id, trigger_result: true, exclude_result, condition_results, evidence_anchors: anchors(), reasoning_basis: "Model evaluated the registry-supported conditions." };
}
function anchors() { return [{ source_artifact_name: "lossless_root__product_service" }]; }
function aiPrimaryConditions() { return { C1: true, C2: true, C3: false, C4: false, C5: false, C6: false, C7: true, C8: true }; }
function fintechConditions() { return { C1: true, C2: true, C3: false, C4: false, C5: false, C6: false, C7: false, C8: false, C9: true, C10: true }; }
function aiOverlayConditions() { return { C1: true, C2: true, C3: false, C4: false, C5: false, C6: false, C7: true, C8: true }; }
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
