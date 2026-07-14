import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { compileQualifiedReviewSubmission } from "../src/phases/14-qualified-review-submission/qualified-review-submission.compiler.v2.js";
import { runDiligenceQaComplete } from "../src/phases/15-diligence-qa-complete/diligence-qa-complete.runner.v2.js";
import { PHASE14_QUALIFIED_REVIEW_SUBMISSION_RUNTIME_CONTRACT } from "../src/runtime/contracts/phase14-submission-runtime.contract.js";
import { PHASE15_DILIGENCE_QA_COMPLETE_RUNTIME_CONTRACT } from "../src/runtime/contracts/phase15-diligence-qa-runtime.contract.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const requestedAt = "2026-07-14T03:00:00.000Z";
const authority = fixtureAuthority();
const ledger = fixtureLedger();
const handoff = fixtureHandoff();
const request = fixtureRequest();
const resolution = fixtureResolution();

const compiled = compileQualifiedReviewSubmission({
  run: { run_id: "phase13-submit-fixture", target: "Fixture AI", root_url: "https://fixture.example" },
  submission_request: request,
  qualified_review_handoff: handoff,
  qr_active_field_ledger: ledger,
  qr_registry_resolution_manifest: resolution,
  authority
});

assert.equal(compiled.qualified_review_submission.compiled_at, requestedAt);
assert.equal(compiled.qualified_review_submission.immutable, true);
assert.equal(compiled.qualified_review_submission.no_document_assembly, true);
assert.equal(compiled.qr_final_value_ledger.final_fields.length, 3);
assert.equal(compiled.qr_final_value_ledger.assembly_payload.qr_values.U01.legal_entity_name, "Corrected Fixture AI Ltd.");
assert.equal(compiled.qr_final_value_ledger.final_fields.find((field) => field.qr_field_id === "U01").atomic_sources.legal_entity_name, "REVIEWER_EDIT");
assert.equal(compiled.qr_final_value_ledger.final_fields.find((field) => field.qr_field_id === "U19").atomic_sources.sla_enabled, "REVIEWER_ATTESTED_PHASE_12");

const documentById = new Map(compiled.document_activation_manifest.documents.map((document) => [document.document_id, document]));
assert.equal(documentById.get("DOC_A_BASE").status, "ACTIVE");
assert.equal(documentById.get("DOC_A_AGENT").status, "ACTIVE");
assert.equal(documentById.get("DOC_A_SLA").status, "ACTIVE");
assert.equal(documentById.get("DOC_B_HND").status, "SUPPRESSED");
assert.equal(documentById.get("DOC_A_BASE").placeholder_bindings[0].token, "{{QR.U01.LEGAL_ENTITY_NAME}}");
assert.equal(compiled.document_activation_manifest.counts.active_document_count, 3);
assert.equal(compiled.document_activation_manifest.counts.suppressed_document_count, 1);

const compiledAgain = compileQualifiedReviewSubmission({
  run: { run_id: "phase13-submit-fixture", target: "Fixture AI", root_url: "https://fixture.example" },
  submission_request: request,
  qualified_review_handoff: handoff,
  qr_active_field_ledger: ledger,
  qr_registry_resolution_manifest: resolution,
  authority
});
assert.equal(compiledAgain.qualified_review_submission.immutable_hash, compiled.qualified_review_submission.immutable_hash);
assert.equal(compiledAgain.qr_final_value_ledger.immutable_hash, compiled.qr_final_value_ledger.immutable_hash);
assert.equal(compiledAgain.document_activation_manifest.immutable_hash, compiled.document_activation_manifest.immutable_hash);

const receipt = runDiligenceQaComplete({
  run: { run_id: "phase13-submit-fixture", target: "Fixture AI", root_url: "https://fixture.example" },
  qualified_review_submission: compiled.qualified_review_submission,
  qr_final_value_ledger: compiled.qr_final_value_ledger,
  document_activation_manifest: compiled.document_activation_manifest,
  authority
});
assert.equal(receipt.diligence_qa_complete, true);
assert.equal(receipt.completed_at, requestedAt);
assert.equal(receipt.next_phase, "AWAITING_ASSEMBLY");
assert.equal(receipt.document_assembly_performed, false);
assert.equal(receipt.release_boundary.assembly_not_authorized_by_this_receipt, true);

const receiptAgain = runDiligenceQaComplete({
  run: { run_id: "phase13-submit-fixture", target: "Fixture AI", root_url: "https://fixture.example" },
  qualified_review_submission: compiled.qualified_review_submission,
  qr_final_value_ledger: compiled.qr_final_value_ledger,
  document_activation_manifest: compiled.document_activation_manifest,
  authority
});
assert.equal(receiptAgain.immutable_hash, receipt.immutable_hash);

assert.throws(() => runDiligenceQaComplete({
  run: { run_id: "phase13-submit-fixture" },
  qualified_review_submission: compiled.qualified_review_submission,
  qr_final_value_ledger: { ...compiled.qr_final_value_ledger, counts: { ...compiled.qr_final_value_ledger.counts, final_field_count: 99 } },
  document_activation_manifest: compiled.document_activation_manifest,
  authority
}), /DILIGENCE_QA_COMPLETE_FAILED:QR_FINAL_VALUE_LEDGER_HASH_MISMATCH/);

assert.throws(() => compileQualifiedReviewSubmission({
  run: { run_id: "phase13-submit-fixture" },
  submission_request: request,
  qualified_review_handoff: handoff,
  qr_active_field_ledger: { ...ledger, unresolved_activation_probe_field_ids: ["B01"] },
  qr_registry_resolution_manifest: { ...resolution, unresolved_activation_probe_field_ids: ["B01"] },
  authority
}), /ACTIVATION_PROBES_UNRESOLVED/);

assert.equal(PHASE14_QUALIFIED_REVIEW_SUBMISSION_RUNTIME_CONTRACT.next, "DILIGENCE_QA_COMPLETE");
assert.deepEqual(PHASE14_QUALIFIED_REVIEW_SUBMISSION_RUNTIME_CONTRACT.writes, ["qualified_review_submission", "qr_final_value_ledger", "document_activation_manifest"]);
assert.equal(PHASE14_QUALIFIED_REVIEW_SUBMISSION_RUNTIME_CONTRACT.document_assembly_forbidden, true);
assert.equal(PHASE15_DILIGENCE_QA_COMPLETE_RUNTIME_CONTRACT.next, "AWAITING_ASSEMBLY");
assert.equal(PHASE15_DILIGENCE_QA_COMPLETE_RUNTIME_CONTRACT.pauses_before_assembly, true);

const compilerSource = source("src/phases/14-qualified-review-submission/qualified-review-submission.compiler.v2.js");
assert.doesNotMatch(compilerSource, /AI_QR_BRIDGE_REGISTRY/);
assert.doesNotMatch(compilerSource, /LANE_A/);
assert.doesNotMatch(compilerSource, /LANE_B/);
assert.match(compilerSource, /document_activation_rules/);
assert.match(compilerSource, /submission_request\.requested_at/);
const persistenceSource = source("src/runtime/services/immutable-post-review-artifacts.service.js");
assert.match(persistenceSource, /IMMUTABLE_POST_REVIEW_ARTIFACT_REUSED/);
assert.match(persistenceSource, /IMMUTABLE_POST_REVIEW_ARTIFACT_CONFLICT/);
assert.match(persistenceSource, /version !== 1/);
const asyncSource = source("src/runtime/services/async-phase13.service.js");
assert.match(asyncSource, /const SUBMISSION_JOB = "QUALIFIED_REVIEW_SUBMISSION"/);
assert.match(asyncSource, /const QA_JOB = "DILIGENCE_QA_COMPLETE"/);
assert.match(asyncSource, /const ASSEMBLY_PAUSE = "AWAITING_ASSEMBLY"/);
assert.match(asyncSource, /compileQualifiedReviewSubmissionRuntime/);
assert.match(asyncSource, /runDiligenceQaCompleteRuntime/);
const requestSource = source("src/runtime/services/qualified-review-draft.service.js");
assert.match(requestSource, /QUALIFIED_REVIEW_SUBMISSION_COMPILER_DISPATCHED/);
assert.match(requestSource, /assertSubmissionRequestAbsent/);
const internalContractSource = source("src/runtime/contracts/internal-job.contract.js");
assert.match(internalContractSource, /phase14_submission_runtime_override_active: true/);
assert.match(internalContractSource, /phase15_diligence_qa_runtime_override_active: true/);

console.log("Phase 13 submission compiler and Diligence QA: PASS");
console.log(JSON.stringify({
  immutable_submission: true,
  deterministic_retry_hashes: true,
  final_fields: 3,
  active_documents: 3,
  suppressed_documents: 1,
  tamper_detection: true,
  automatic_submission_dispatch: true,
  qa_pause: "AWAITING_ASSEMBLY",
  document_assembly_performed: false
}, null, 2));

function fixtureAuthority() {
  return {
    template_manifest: {
      documents: [
        template("DOC_A_BASE", "A"),
        template("DOC_A_AGENT", "A"),
        template("DOC_A_SLA", "A"),
        template("DOC_B_HND", "B")
      ]
    },
    registries: [{
      registry: {
        registry_id: "DOMAIN_FIXTURE_REGISTRY",
        document_activation_rules: [
          { document_id: "DOC_A_BASE", activate_when: { all: ["lane_a_active == true"] } },
          { document_id: "DOC_A_AGENT", activate_when: { all: ["lane_a_active == true", "A03 == true"] } },
          { document_id: "DOC_A_SLA", activate_when: { all: ["lane_a_active == true", "U19 == true"] } },
          { document_id: "DOC_B_HND", activate_when: { all: ["lane_b_active == true", "B01 == true"] } }
        ]
      }
    }]
  };
}
function template(document_id, lane) { return { document_id, lane, template_version: "v1", template_path: `${lane}/${document_id}.docx`, review_ready_template: true, requires_local_counsel_review: true }; }
function fixtureResolution() {
  return {
    artifact_type: "qr_registry_resolution_manifest",
    active_registry_ids: ["UNIVERSAL_FIXTURE_REGISTRY", "DOMAIN_FIXTURE_REGISTRY"],
    unresolved_activation_probe_field_ids: [],
    registry_resolutions: [{ registry_id: "DOMAIN_FIXTURE_REGISTRY", state: "ACTIVE", subpackages: [{ registry_scope: "LANE_A", state: "ACTIVE" }, { registry_scope: "LANE_B", state: "INACTIVE" }] }]
  };
}
function fixtureLedger() {
  return {
    artifact_type: "qr_active_field_ledger",
    unresolved_activation_probe_field_ids: [],
    active_fields: [
      field("U01", "G01", "legal_entity_name", "Fixture AI Ltd.", "PHASE_12", [{ document_id: "DOC_A_BASE", actions: ["POPULATE"], value_placeholders: { legal_entity_name: "{{QR.U01.LEGAL_ENTITY_NAME}}" } }]),
      field("U19", "G02", "sla_enabled", true, "PHASE_12", [{ document_id: "DOC_A_SLA", actions: ["SELECT_CLAUSE"], document_target: "SLA election" }]),
      field("A03", "G02", "autonomous_agent_enabled", true, "MARKET_BASED", [{ document_id: "DOC_A_AGENT", actions: ["SELECT_CLAUSE", "ACTIVATE_OR_SUPPRESS_DOCUMENT"], document_target: "Agentic addendum" }])
    ]
  };
}
function fixtureHandoff() {
  return {
    artifact_type: "qualified_review_handoff",
    artifact_version: "phase13_qualified_review_handoff.v1",
    run_id: "phase13-submit-fixture",
    target: "Fixture AI",
    sections: [
      { section_id: "G01", attestation: { field_state_hash: "hash-g01" } },
      { section_id: "G02", attestation: { field_state_hash: "hash-g02" } }
    ]
  };
}
function fixtureRequest() {
  return {
    artifact_type: "qualified_review_submission_request",
    artifact_version: "phase13_qualified_review_submission_request.v1",
    run_id: "phase13-submit-fixture",
    target: "Fixture AI",
    status: "READY_FOR_SUBMISSION_COMPILER",
    requested_at: requestedAt,
    requested_by: "fixture-reviewer",
    source_handoff_version: "phase13_qualified_review_handoff.v1",
    source_draft_revision: 4,
    confirmation_unit: "SECTION",
    per_question_confirmation_forbidden: true,
    field_edits: { U01: { atomic_values: { legal_entity_name: "Corrected Fixture AI Ltd." }, baseline_value: { legal_entity_name: "Fixture AI Ltd." }, review_status: "EDITED" } },
    section_attestations: {
      G01: { status: "ATTESTED", field_state_hash: "hash-g01" },
      G02: { status: "ATTESTED", field_state_hash: "hash-g02" }
    }
  };
}
function field(qr_field_id, section_id, atomicKey, value, sourceType, document_bindings) {
  return {
    qr_field_id,
    canonical_key: qr_field_id.toLowerCase(),
    label: qr_field_id,
    registry_id: qr_field_id.startsWith("U") ? "UNIVERSAL_FIXTURE_REGISTRY" : "DOMAIN_FIXTURE_REGISTRY",
    registry_scope: qr_field_id.startsWith("U") ? "UNIVERSAL" : "LANE_A",
    lane: qr_field_id.startsWith("U") ? "SHARED" : "A",
    section_id,
    shape: "SCALAR",
    required_for_assembly: true,
    atomic_values: { [atomicKey]: { value, source: sourceType, value_state: "RESOLVED", demo_not_evidence: sourceType === "MARKET_BASED", phase12_field_ids: sourceType === "PHASE_12" ? ["TP.FIXTURE.001"] : [], route_ids: sourceType === "PHASE_12" ? ["P12.ROUTE.TP.FIXTURE.001"] : [], report_artifacts: sourceType === "PHASE_12" ? ["report_section__03_target_entity_sector_profile"] : [] } },
    document_bindings,
    document_binding_count: document_bindings.length
  };
}
function source(path) { return readFileSync(resolve(root, path), "utf8"); }
