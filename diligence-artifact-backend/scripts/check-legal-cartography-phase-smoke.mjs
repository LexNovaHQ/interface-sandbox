import assert from "node:assert/strict";
import { runM9HybridOrchestrator, M9_HYBRID_SAVE_ORDER } from "../src/m9-hybrid-orchestrator.js";
import { validateM9LegalCartographyIndex } from "../src/m9-validator.js";
import { validateLegalSignalDerivationProfile } from "../src/phases/02-legal-cartography-index/index.js";

const run = { run_id: "CHECK-LEGAL-CARTOGRAPHY-PHASE", target_url: "https://example.test" };
const saved = [];
const result = await runM9HybridOrchestrator({
  run,
  artifacts: buildLegalGovernanceFixture(),
  runSemanticModel: async ({ artifacts }) => buildSemanticProfileFromDeterministicMap(artifacts.legal_cartography_deterministic_map),
  saveArtifact: async ({ artifact_name, artifact, optional = false }) => saved.push({ artifact_name, artifact, optional }),
  validateFinalIndex: validateLegalCartographyIndexForSmoke
});

assert.equal(result.ok, true);
assert.deepEqual(result.required_save_order, M9_HYBRID_SAVE_ORDER);
assert.deepEqual(result.artifacts_saved_in_order, M9_HYBRID_SAVE_ORDER);
assert.equal(result.required_save_order_respected, true);
assert.deepEqual(result.optional_artifacts_saved, []);
assert.equal(result.semantic_validation.status, "LOCKED");
assert.equal(result.final_validation.status, "LOCKED");
assert.equal(result.legal_signal_derivation_validated, true);
assert.deepEqual(saved.map((row) => row.artifact_name), ["legal_cartography_deterministic_map", "legal_cartography_semantic_profile", "legal_cartography_index", "legal_signal_derivation_profile"]);

const finalIndex = result.final_output.legal_cartography_index;
const signalProfile = result.final_output.legal_signal_derivation_profile;
assert.ok(finalIndex, "legal_cartography_index missing from final output");
assert.ok(signalProfile, "legal_signal_derivation_profile missing from final output");
assert.equal(validateM9LegalCartographyIndex({ legal_cartography_index: finalIndex }).status, "PASS");
const signalValidation = validateLegalSignalDerivationProfile({ legal_signal_derivation_profile: signalProfile });
assert.equal(signalValidation.ok, true, signalValidation.errors.join("; "));
assert.equal(signalProfile.coverage_summary.emitted_field_count, 21);
assert.equal(signalProfile.validation_manifest.required_field_count, 21);
assert.equal(signalProfile.validation_manifest.emitted_field_count, 21);
assert.equal(signalProfile.validation_manifest.unknown_status_present, false);
assert.equal(signalProfile.validation_manifest.qr_pollution_present, false);

for (const retiredKey of ["qualified_review_legal_signals", "question_rows", "question_index", "reviewer_question", "m7_deterministic_legal_signal_overlay", "m10_selected_legal_support_packet", "target_profile", "data_provenance_profile", "renderer_payload", "final_output_handoff"]) {
  assert.equal(containsExactKey(result.final_output, retiredKey), false, `retired/downstream key leaked into Legal Cartography final output: ${retiredKey}`);
}
for (const retiredValue of ["QR-004", "QR-013", "QR-016"]) {
  assert.equal(containsExactStringValue(result.final_output, retiredValue), false, `retired/downstream value leaked into Legal Cartography final output: ${retiredValue}`);
}

assert.equal(finalIndex.downstream_rules.legal_signal_derivation_profile_is_separate_job_b_artifact, true);
assert.equal(finalIndex.downstream_rules.qualified_review_legal_signals_retired_from_m9_index, true);
assert.equal(finalIndex.downstream_rules.use_only_loaded_legal_corpus, true);
console.log("Legal Cartography and Index self-contained smoke: PASS");

function containsExactKey(value, targetKey) {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((item) => containsExactKey(item, targetKey));
  return Object.entries(value).some(([key, child]) => key === targetKey || containsExactKey(child, targetKey));
}

function containsExactStringValue(value, targetValue) {
  if (typeof value === "string") return value === targetValue;
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((item) => containsExactStringValue(item, targetValue));
  return Object.values(value).some((child) => containsExactStringValue(child, targetValue));
}

function validateLegalCartographyIndexForSmoke(output) {
  const validation = validateM9LegalCartographyIndex(output);
  if (validation.status !== "PASS") return { ok: false, status: "REPAIR_REQUIRED", errors: validation.failed_gates || [], warnings: [] };
  return { ok: true, status: "LOCKED", errors: [], warnings: [] };
}

function buildSemanticProfileFromDeterministicMap(wrapper = {}) {
  const map = wrapper.legal_cartography_deterministic_map || wrapper;
  const queue = Array.isArray(map.semantic_label_queue) ? map.semantic_label_queue : [];
  const rows = queue.map((row) => ({ queue_id: row.queue_id, unit_id: row.unit_id, subcats: ["CNS"], control_families: ["FORMATION_CONTRACT"], confidence: "CLEAR" }));
  const requiredIds = new Set(queue.filter((row) => row.semantic_label_required === true || ["P0", "P1"].includes(row.priority)).map((row) => row.queue_id));
  const attachedRequired = rows.filter((row) => requiredIds.has(row.queue_id)).length;
  const coverage = requiredIds.size ? Number((attachedRequired / requiredIds.size).toFixed(4)) : 1;
  return { legal_cartography_semantic_profile: { run_id: run.run_id, schema_version: "LEGAL_CARTOGRAPHY_SEMANTIC_PROFILE_SMOKE_v1", semantic_navigation_index: rows, semantic_integrity: { required_queue_count: requiredIds.size, labeled_queue_count: attachedRequired, coverage_ratio: coverage, ready_for_compiler: coverage >= 0.8 }, lock_status: coverage >= 0.8 ? "LOCKED" : "REPAIR_REQUIRED" } };
}

function buildLegalGovernanceFixture() {
  const termsText = "Terms accepted. Notice contact legal@example.test. Privacy contact privacy@example.test. Grievance contact grievance@example.test. Governed by India. Bengaluru courts have jurisdiction. Liability is limited to fees paid in the prior twelve months. Support may be provided under an order form.";
  const privacyText = "Privacy requests go to privacy@example.test. Users may withdraw consent through the privacy contact route. A public consent manager flow is not visible. Deletion requests use the privacy contact route.";
  return {
    source_discovery_handoff: { run_id: run.run_id, target_url: run.target_url, status: "LOCKED" },
    lossless_family__L1_CORE_TERMS_PRIVACY: family("L1_CORE_TERMS_PRIVACY", [source("L1.TERMS.001", "Terms of Service", termsText)]),
    lossless_family__L2_B2B_CONTRACTING: family("L2_B2B_CONTRACTING", []),
    lossless_family__L3_AI_USAGE_GOVERNANCE: family("L3_AI_USAGE_GOVERNANCE", []),
    lossless_family__L4_PRIVACY_ADJACENT_NOTICES: family("L4_PRIVACY_ADJACENT_NOTICES", [source("L4.PRIVACY.001", "Privacy Policy", privacyText)]),
    lossless_family__L5_LEGAL_HUB_HOSTED: family("L5_LEGAL_HUB_HOSTED", []),
    lossless_family__L6_ENTITY_NOTICE: family("L6_ENTITY_NOTICE", [])
  };
}

function family(rootFamily, sources) {
  return { artifact_name: `lossless_family__${rootFamily}`, root_family: rootFamily, sources, missing_limited_primary_sources: [], rejected_sources: [], manifest_only_sources: [], metadata_only_sources: [], corpus_forensics: { total_sources: sources.length } };
}

function source(source_id, title, lossless_text) {
  return { source_id, final_url: `https://example.test/${source_id.toLowerCase()}`, url: `https://example.test/${source_id.toLowerCase()}`, title, root_family: source_id.startsWith("L4") ? "L4_PRIVACY_ADJACENT_NOTICES" : "L1_CORE_TERMS_PRIVACY", sha256: `fixture-${source_id}`, lossless_text };
}
