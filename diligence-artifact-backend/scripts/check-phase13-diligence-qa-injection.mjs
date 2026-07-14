import assert from "node:assert/strict";
import { compileQualifiedReviewSubmission } from "../src/phases/14-qualified-review-submission/qualified-review-submission.compiler.v2.js";
import { hashImmutableArtifact } from "../src/phases/14-qualified-review-submission/immutable-artifact-hash.js";
import { runDiligenceQaComplete } from "../src/phases/15-diligence-qa-complete/diligence-qa-complete.runner.v2.js";

const requestedAt = "2026-07-14T03:30:00.000Z";
const authority = {
  template_manifest: {
    documents: [{
      document_id: "DOC_FIXTURE",
      lane: "FIXTURE",
      template_version: "v1",
      template_path: "fixture/DOC_FIXTURE.docx",
      review_ready_template: true,
      requires_local_counsel_review: true
    }]
  },
  injection_map: {
    documents: [{
      document_id: "DOC_FIXTURE",
      bindings: [{
        field_id: "U01",
        placeholders: { legal_entity_name: "{{QR.U01.LEGAL_ENTITY_NAME}}" },
        action_token: null
      }]
    }]
  },
  registries: [{
    registry: {
      registry_id: "FIXTURE_REGISTRY",
      document_activation_rules: [{
        document_id: "DOC_FIXTURE",
        activate_when: { all: ["fixture_scope_active == true"] }
      }]
    }
  }]
};

const ledger = {
  artifact_type: "qr_active_field_ledger",
  unresolved_activation_probe_field_ids: [],
  active_fields: [{
    qr_field_id: "U01",
    canonical_key: "organization.legal_name",
    label: "Legal entity name",
    registry_id: "UNIVERSAL_FIXTURE",
    registry_scope: "UNIVERSAL",
    lane: "SHARED",
    section_id: "G01",
    shape: "SCALAR",
    required_for_assembly: true,
    atomic_values: {
      legal_entity_name: {
        value: "Fixture AI Ltd.",
        source: "PHASE_12",
        value_state: "RESOLVED",
        demo_not_evidence: false,
        phase12_field_ids: ["TP.ID.002"],
        route_ids: ["P12.ROUTE.TP.ID.002"],
        report_artifacts: ["report_section__03_target_entity_sector_profile"]
      }
    },
    document_bindings: [{
      document_id: "DOC_FIXTURE",
      actions: ["POPULATE", "SELECT_CLAUSE"],
      document_target: "Preamble and operative clause",
      value_placeholders: { legal_entity_name: "{{QR.U01.LEGAL_ENTITY_NAME}}" }
    }],
    document_binding_count: 1
  }]
};

const handoff = {
  artifact_type: "qualified_review_handoff",
  artifact_version: "phase13_qualified_review_handoff.v1",
  run_id: "phase13-injection-fixture",
  sections: [{ section_id: "G01", attestation: { field_state_hash: "hash-g01" } }]
};

const request = {
  artifact_type: "qualified_review_submission_request",
  artifact_version: "phase13_qualified_review_submission_request.v1",
  run_id: "phase13-injection-fixture",
  status: "READY_FOR_SUBMISSION_COMPILER",
  requested_at: requestedAt,
  requested_by: "fixture-reviewer",
  source_handoff_version: handoff.artifact_version,
  source_draft_revision: 2,
  confirmation_unit: "SECTION",
  per_question_confirmation_forbidden: true,
  field_edits: {
    U01: {
      atomic_values: { legal_entity_name: "Fixture AI Ltd." },
      baseline_value: { legal_entity_name: "Fixture AI Ltd." },
      not_applicable: true,
      limitation: "Entity name is not used in this instrument.",
      review_status: "NOT_APPLICABLE"
    }
  },
  section_attestations: { G01: { status: "ATTESTED", field_state_hash: "hash-g01" } }
};

const resolution = {
  artifact_type: "qr_registry_resolution_manifest",
  active_registry_ids: ["FIXTURE_REGISTRY"],
  unresolved_activation_probe_field_ids: [],
  registry_resolutions: [{
    registry_id: "FIXTURE_REGISTRY",
    state: "ACTIVE",
    subpackages: [{ registry_scope: "FIXTURE_SCOPE", state: "ACTIVE" }]
  }]
};

const run = { run_id: "phase13-injection-fixture", target: "Fixture AI" };
const compiled = compileQualifiedReviewSubmission({
  run,
  submission_request: request,
  qualified_review_handoff: handoff,
  qr_active_field_ledger: ledger,
  qr_registry_resolution_manifest: resolution,
  authority
});

const activeDocument = compiled.document_activation_manifest.documents[0];
assert.equal(activeDocument.status, "ACTIVE");
assert.equal(activeDocument.placeholder_bindings[0].value, "Not applicable");
assert.equal(activeDocument.placeholder_bindings[0].source, "REVIEWER_NOT_APPLICABLE");
assert.equal(activeDocument.placeholder_bindings[0].disposition, "RENDER_NOT_APPLICABLE");
assert.equal(activeDocument.clause_actions[0].disposition, "SUPPRESS_OR_MARK_NOT_APPLICABLE");

const receipt = runDiligenceQaComplete({
  run,
  qualified_review_submission: compiled.qualified_review_submission,
  qr_final_value_ledger: compiled.qr_final_value_ledger,
  document_activation_manifest: compiled.document_activation_manifest,
  authority
});
assert.equal(receipt.diligence_qa_complete, true);
assert.equal(receipt.next_phase, "AWAITING_ASSEMBLY");

const missingTokenManifest = rehash({
  ...structuredClone(compiled.document_activation_manifest),
  documents: [{ ...structuredClone(activeDocument), placeholder_bindings: [] }],
  counts: { ...compiled.document_activation_manifest.counts, active_placeholder_count: 0 }
});
const missingTokenSubmission = rehash({
  ...structuredClone(compiled.qualified_review_submission),
  artifact_hashes: {
    ...compiled.qualified_review_submission.artifact_hashes,
    document_activation_manifest: missingTokenManifest.immutable_hash
  }
});
assert.throws(() => runDiligenceQaComplete({
  run,
  qualified_review_submission: missingTokenSubmission,
  qr_final_value_ledger: compiled.qr_final_value_ledger,
  document_activation_manifest: missingTokenManifest,
  authority
}), /ACTIVE_DOCUMENT_REQUIRED_QR_TOKEN_MISSING:DOC_FIXTURE:\{\{QR\.U01\.LEGAL_ENTITY_NAME\}\}/);

const unresolvedLedgerBody = structuredClone(compiled.qr_final_value_ledger);
delete unresolvedLedgerBody.immutable_hash;
unresolvedLedgerBody.final_fields[0].atomic_sources.legal_entity_name = "REVIEWER_ATTESTED_UNRESOLVED";
const unresolvedLedger = rehash(unresolvedLedgerBody);
const unresolvedSubmission = rehash({
  ...structuredClone(compiled.qualified_review_submission),
  artifact_hashes: {
    ...compiled.qualified_review_submission.artifact_hashes,
    qr_final_value_ledger: unresolvedLedger.immutable_hash
  }
});
assert.throws(() => runDiligenceQaComplete({
  run,
  qualified_review_submission: unresolvedSubmission,
  qr_final_value_ledger: unresolvedLedger,
  document_activation_manifest: compiled.document_activation_manifest,
  authority
}), /FINAL_ATOMIC_VALUE_SOURCE_UNRESOLVED:U01:legal_entity_name/);

console.log("Phase 13 Diligence QA injection parity: PASS");
console.log(JSON.stringify({
  not_applicable_placeholder_disposition: true,
  injection_required_token_enforced: true,
  unresolved_final_source_blocked: true,
  next_phase: receipt.next_phase
}, null, 2));

function rehash(value) {
  const body = structuredClone(value);
  delete body.immutable_hash;
  return { ...body, immutable_hash: hashImmutableArtifact(body) };
}
