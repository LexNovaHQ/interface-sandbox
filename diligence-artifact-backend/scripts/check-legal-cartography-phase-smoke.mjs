import assert from "node:assert/strict";
import { runM9HybridOrchestrator, M9_HYBRID_SAVE_ORDER } from "../src/m9-hybrid-orchestrator.js";
import { validateM9LegalCartographyIndex } from "../src/m9-validator.js";
import { validateLegalSignalDerivationProfile } from "../src/phases/02-legal-cartography-index/index.js";

const run = { run_id: "CHECK-LEGAL-CARTOGRAPHY-PHASE", target_url: "https://example.test" };
const artifacts = buildLegalGovernanceFixture();
const saved = [];

const result = await runM9HybridOrchestrator({
  run,
  artifacts,
  runSemanticModel: async ({ artifacts: modelArtifacts }) => buildSemanticProfileFromDeterministicMap(modelArtifacts.legal_cartography_deterministic_map),
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

const savedNames = saved.map((row) => row.artifact_name);
assert.deepEqual(savedNames, [
  "legal_cartography_deterministic_map",
  "legal_cartography_semantic_profile",
  "legal_cartography_index",
  "legal_signal_derivation_profile"
]);

const finalIndex = result.final_output.legal_cartography_index;
const signalProfile = result.final_output.legal_signal_derivation_profile;
assert.ok(finalIndex, "legal_cartography_index missing from final output");
assert.ok(signalProfile, "legal_signal_derivation_profile missing from final output");

const finalValidation = validateM9LegalCartographyIndex({ legal_cartography_index: finalIndex });
assert.equal(finalValidation.status, "PASS", JSON.stringify(finalValidation));

const signalValidation = validateLegalSignalDerivationProfile({ legal_signal_derivation_profile: signalProfile });
assert.equal(signalValidation.ok, true, signalValidation.errors.join("; "));
assert.equal(signalProfile.coverage_summary.emitted_field_count, 21);
assert.equal(signalProfile.validation_manifest.required_field_count, 21);
assert.equal(signalProfile.validation_manifest.emitted_field_count, 21);
assert.equal(signalProfile.validation_manifest.unknown_status_present, false);
assert.equal(signalProfile.validation_manifest.qr_pollution_present, false);

const finalJson = JSON.stringify(result.final_output);
for (const retired of [
  "qualified_review_legal_signals",
  "question_rows",
  "question_index",
  "reviewer_question",
  "QR-004",
  "QR-013",
  "QR-016",
  "m7_deterministic_legal_signal_overlay",
  "m10_selected_legal_support_packet",
  "target_profile",
  "data_provenance_profile",
  "renderer_payload",
  "final_output_handoff"
]) assert.equal(finalJson.includes(retired), false, `retired/downstream key leaked into Legal Cartography final output: ${retired}`);

assert.equal(finalIndex.downstream_rules.legal_signal_derivation_profile_is_separate_job_b_artifact, true);
assert.equal(finalIndex.downstream_rules.qualified_review_legal_signals_retired_from_m9_index, true);
assert.equal(finalIndex.downstream_rules.use_only_loaded_legal_corpus, true);

console.log("Legal Cartography and Index self-contained smoke: PASS");

function validateLegalCartographyIndexForSmoke(output) {
  const validation = validateM9LegalCartographyIndex(output);
  if (validation.status !== "PASS") return { ok: false, status: "REPAIR_REQUIRED", errors: validation.failed_gates || [], warnings: [] };
  return { ok: true, status: "LOCKED", errors: [], warnings: [] };
}

function buildSemanticProfileFromDeterministicMap(wrapper = {}) {
  const map = wrapper.legal_cartography_deterministic_map || wrapper;
  const queue = Array.isArray(map.semantic_label_queue) ? map.semantic_label_queue : [];
  const rows = queue.map((row) => ({
    queue_id: row.queue_id,
    unit_id: row.unit_id,
    subcats: takeAllowed(row.suggested_subcat_candidates, ["CNS"]),
    control_families: takeAllowed(row.suggested_control_family_candidates, ["FORMATION_CONTRACT"]),
    confidence: "CLEAR"
  }));
  const requiredIds = new Set(queue.filter((row) => row.semantic_label_required === true || ["P0", "P1"].includes(row.priority)).map((row) => row.queue_id));
  const attachedRequired = rows.filter((row) => requiredIds.has(row.queue_id)).length;
  const coverage = requiredIds.size ? Number((attachedRequired / requiredIds.size).toFixed(4)) : 1;
  return {
    legal_cartography_semantic_profile: {
      run_id: run.run_id,
      schema_version: "LEGAL_CARTOGRAPHY_SEMANTIC_PROFILE_SMOKE_v1",
      semantic_navigation_index: rows,
      semantic_integrity: {
        required_queue_count: requiredIds.size,
        labeled_queue_count: attachedRequired,
        coverage_ratio: coverage,
        ready_for_compiler: coverage >= 0.8
      },
      lock_status: coverage >= 0.8 ? "LOCKED" : "REPAIR_REQUIRED"
    }
  };
}

function takeAllowed(values, fallback) {
  const allowedSubcats = new Set(["CNS", "LIA", "HAL", "INF", "PRV", "BIO", "DEC", "HRM", "FRD", "TRD"]);
  const allowedFamilies = new Set(["FORMATION_CONTRACT", "ACTIVITY_SPECIFIC_DISCLOSURE", "DATA_PRIVACY", "VENDORS_TRANSFER", "SECURITY", "USE_SAFETY", "AGENT_AUTHORITY", "IP_CONTENT", "COMMERCIAL_LEGAL_ALLOCATION", "CONTACT_ROUTES", "INDEMNITY", "UNKNOWN_CONTROL_LANGUAGE"]);
  const source = Array.isArray(values) && values.length ? values : fallback;
  const allowed = source.filter((value) => allowedSubcats.has(value) || allowedFamilies.has(value));
  return allowed.slice(0, 3).length ? allowed.slice(0, 3) : fallback;
}

function buildLegalGovernanceFixture() {
  return {
    source_discovery_handoff: { run_id: run.run_id, target_url: run.target_url, status: "LOCKED" },
    lossless_family__L1_CORE_TERMS_PRIVACY: family("L1_CORE_TERMS_PRIVACY", [termsSource()]),
    lossless_family__L2_B2B_CONTRACTING: family("L2_B2B_CONTRACTING", []),
    lossless_family__L3_AI_USAGE_GOVERNANCE: family("L3_AI_USAGE_GOVERNANCE", []),
    lossless_family__L4_PRIVACY_ADJACENT_NOTICES: family("L4_PRIVACY_ADJACENT_NOTICES", [privacySource()]),
    lossless_family__L5_LEGAL_HUB_HOSTED: family("L5_LEGAL_HUB_HOSTED", []),
    lossless_family__L6_ENTITY_NOTICE: family("L6_ENTITY_NOTICE", [])
  };
}

function family(rootFamily, sources) {
  return { artifact_name: `lossless_family__${rootFamily}`, root_family: rootFamily, sources, missing_limited_primary_sources: [], rejected_sources: [], manifest_only_sources: [], metadata_only_sources: [], corpus_forensics: { total_sources: sources.length } };
}

function termsSource() {
  return {
    source_id: "L1.TERMS.001",
    final_url: "https://example.test/terms",
    url: "https://example.test/terms",
    title: "Terms of Service",
    root_family: "L1_CORE_TERMS_PRIVACY",
    sha256: "fixture-terms",
    lossless_text: `Terms of Service

Section 1: Eligibility
You may use the service if you accept these terms.

Section 2: Legal Notice and Contact
Legal notices may be sent to legal@example.test. Privacy requests may be sent to privacy@example.test. Grievance requests may be sent to grievance@example.test.

Section 3: Governing Law and Jurisdiction
These terms are governed by the laws of India. Courts in Bengaluru shall have exclusive jurisdiction.

Section 4: Limitation of Liability
Aggregate liability is limited to fees paid in the twelve months before the claim.

Section 5: Support Services
Support services may be provided under an order form. No public uptime commitment is stated.
`
  };
}

function privacySource() {
  return {
    source_id: "L4.PRIVACY.001",
    final_url: "https://example.test/privacy",
    url: "https://example.test/privacy",
    title: "Privacy Policy",
    root_family: "L4_PRIVACY_ADJACENT_NOTICES",
    sha256: "fixture-privacy",
    lossless_text: `Privacy Policy

Section 1: Privacy Contact
You may contact privacy@example.test for privacy rights requests.

Section 2: Consent Management and Withdrawal
Users may withdraw consent by contacting privacy@example.test. Public consent manager flow is not visible in this policy.

Section 3: Data Retention and Deletion
Deletion requests may be submitted through the privacy contact route.
`
  };
}
