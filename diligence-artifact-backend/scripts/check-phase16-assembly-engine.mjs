import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  finalizeDocumentAssembly,
  prepareDocumentAssembly
} from "../src/phases/16-assembly-engine/assembly-engine.runner.js";
import {
  assembleDocxTemplate,
  extractText,
  readZipEntries
} from "../src/phases/16-assembly-engine/docx-package.js";
import { loadQrRegistryAuthority, resolveAuthorityPath } from "../src/phases/13-qualified-review/registry/qr-registry-loader.js";
import { freezeImmutableArtifact, hashImmutableArtifact } from "../src/phases/14-qualified-review-submission/immutable-artifact-hash.js";
import { PHASE16_ASSEMBLY_ENGINE_RUNTIME_CONTRACT } from "../src/runtime/contracts/phase16-assembly-runtime.contract.js";

const authority = loadQrRegistryAuthority();
const injectionById = new Map((authority.injection_map?.documents || []).map((document) => [document.document_id, document]));
let totalTokens = 0;
let totalReplacements = 0;

for (const template of authority.template_manifest.documents || []) {
  const injection = injectionById.get(template.document_id);
  assert.ok(injection, `Injection map missing ${template.document_id}`);
  const bindings = placeholderBindings(injection);
  totalTokens += bindings.length;
  const templatePath = resolveAuthorityPath(
    authority.backend_root,
    join(authority.template_manifest.template_root, template.template_path).replaceAll("\\", "/")
  );
  const assembled = assembleDocxTemplate(readFileSync(templatePath), { placeholder_bindings: bindings });
  assert.equal(assembled.buffer.subarray(0, 2).toString("ascii"), "PK");
  assert.equal(assembled.stats.remaining_qr_token_count, 0);
  assert.equal(assembled.stats.control_schedule_removed, true);
  assert.equal(assembled.stats.package_verification.status, "PASS");
  totalReplacements += assembled.stats.token_replacement_count;
  const entries = readZipEntries(assembled.buffer);
  const documentXml = entries.find((entry) => entry.name === "word/document.xml")?.data.toString("utf8") || "";
  const text = extractText(documentXml);
  assert.doesNotMatch(text, /\{\{QR\./);
  assert.doesNotMatch(text, /QR ASSEMBLY CONTROL SCHEDULE/);
  const headings = [...documentXml.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)].map((match) => extractText(match[0]).replace(/\s+/g, " ").trim().toUpperCase());
  assert.equal(headings.some((heading) => /^(ANNEXURE\s+B\s*[-—:]\s*)?ARCHITECT NOTES$/.test(heading)), false);
  assert.equal(headings.some((heading) => /^(ANNEXURE\s+C\s*[-—:]\s*)?PRODUCTION NOTES$/.test(heading)), false);
  assert.ok(text.includes("COUNSEL NOTES"), `Counsel Notes were not preserved in ${template.document_id}`);
}

const activeTemplate = authority.template_manifest.documents.find((document) => document.document_id === "DOC_AI_A_TOS");
assert.ok(activeTemplate);
const activeInjection = injectionById.get(activeTemplate.document_id);
const activeBindings = placeholderBindings(activeInjection);
const clauseActions = (activeInjection.bindings || [])
  .filter((binding) => (binding.actions || []).includes("SELECT_CLAUSE"))
  .map((binding) => ({
    qr_field_id: binding.field_id,
    target: binding.target || "",
    final_atomic_values: binding.demo_atomic_values || {},
    disposition: "SELECT_FROM_FINAL_VALUE"
  }));
const activationDocuments = authority.template_manifest.documents.map((template) => template.document_id === activeTemplate.document_id
  ? {
      document_id: template.document_id,
      lane: template.lane,
      template_version: template.template_version,
      template_path: template.template_path,
      status: "ACTIVE",
      review_ready_template: true,
      requires_local_counsel_review: true,
      placeholder_bindings: activeBindings,
      clause_actions: clauseActions,
      action_tokens: [],
      unresolved_qr_placeholder_count: 0
    }
  : {
      document_id: template.document_id,
      lane: template.lane,
      template_version: template.template_version,
      template_path: template.template_path,
      status: "SUPPRESSED",
      suppression_reason: "Fixture suppression",
      review_ready_template: true,
      requires_local_counsel_review: true,
      placeholder_bindings: [],
      clause_actions: [],
      action_tokens: [],
      unresolved_qr_placeholder_count: 0
    });

const submission = withHash({
  artifact_type: "qualified_review_submission",
  artifact_version: "fixture.v1",
  run_id: "phase16-fixture",
  immutable: true,
  compiled_at: "2026-07-14T03:00:00.000Z",
  review_ready_boundary: reviewReadyBoundary()
});
const ledger = withHash({
  artifact_type: "qr_final_value_ledger",
  artifact_version: "fixture.v1",
  run_id: "phase16-fixture",
  immutable: true,
  final_fields: [],
  counts: { final_field_count: 0, final_atomic_value_count: 0 }
});
const activation = withHash({
  artifact_type: "document_activation_manifest",
  artifact_version: "fixture.v1",
  run_id: "phase16-fixture",
  immutable: true,
  documents: activationDocuments,
  counts: {
    template_document_count: activationDocuments.length,
    active_document_count: 1,
    suppressed_document_count: activationDocuments.length - 1,
    active_placeholder_count: activeBindings.length,
    active_clause_action_count: clauseActions.length
  },
  review_ready_boundary: reviewReadyBoundary()
});
const receipt = withHash({
  artifact_type: "diligence_qa_completion_receipt",
  artifact_version: "fixture.v1",
  run_id: "phase16-fixture",
  status: "COMPLETE_WITH_WARNINGS",
  diligence_qa_complete: true,
  next_phase: "AWAITING_ASSEMBLY",
  verified_artifacts: {
    qualified_review_submission: submission.immutable_hash,
    qr_final_value_ledger: ledger.immutable_hash,
    document_activation_manifest: activation.immutable_hash
  }
});

const prepared = prepareDocumentAssembly({
  run: { run_id: "phase16-fixture", target: "Fixture AI", root_url: "https://fixture.example" },
  diligence_qa_completion_receipt: receipt,
  qualified_review_submission: submission,
  qr_final_value_ledger: ledger,
  document_activation_manifest: activation,
  authority
});
assert.equal(prepared.prepared_drafts.length, 1);
assert.equal(prepared.document_assembly_payload.counts.active_document_count, 1);
assert.ok(prepared.prepared_drafts[0].local_counsel_actions.length > 0);
assert.equal(prepared.prepared_drafts[0].status, "REVIEW_READY_WITH_COUNSEL_ACTIONS");

const draft = prepared.prepared_drafts[0];
const finalized = finalizeDocumentAssembly({
  run: { run_id: "phase16-fixture", target: "Fixture AI" },
  prepared,
  uploaded_files: [{
    document_id: draft.document_id,
    output_filename: draft.output_filename,
    file_sha256: draft.file_sha256,
    file_size_bytes: draft.file_size_bytes,
    drive_file_id: "fixture-drive-file",
    drive_web_view_link: "https://drive.example/fixture",
    reused: false
  }],
  assembly_folder: { drive_folder_id: "assembly-folder", drive_web_view_link: "https://drive.example/assembly" },
  drafts_folder: { drive_folder_id: "drafts-folder", drive_web_view_link: "https://drive.example/drafts" }
});
assert.equal(finalized.review_ready_draft_manifest.status, "COMPLETE_WITH_COUNSEL_ACTIONS");
assert.equal(finalized.review_ready_draft_manifest.documents.length, 1);
assert.equal(finalized.document_assembly_validation_manifest.status, "PASS_WITH_WARNINGS");
assert.equal(finalized.document_assembly_validation_manifest.next_phase, "COMPLETE");
assert.equal(finalized.document_assembly_validation_manifest.checks.generated_documents_git_forbidden, true);

assert.throws(() => prepareDocumentAssembly({
  run: { run_id: "phase16-fixture" },
  diligence_qa_completion_receipt: { ...receipt, status: "CONTROLLED_FAILURE" },
  qualified_review_submission: submission,
  qr_final_value_ledger: ledger,
  document_activation_manifest: activation,
  authority
}), /ASSEMBLY_ENGINE_INPUT_INVALID/);

assert.equal(PHASE16_ASSEMBLY_ENGINE_RUNTIME_CONTRACT.next, "COMPLETE");
assert.equal(PHASE16_ASSEMBLY_ENGINE_RUNTIME_CONTRACT.explicit_assembly_authorization_required, true);
assert.equal(PHASE16_ASSEMBLY_ENGINE_RUNTIME_CONTRACT.generated_documents_git_forbidden, true);
assert.equal(PHASE16_ASSEMBLY_ENGINE_RUNTIME_CONTRACT.heuristic_clause_deletion_forbidden, true);

console.log("Phase 16 assembly engine: PASS");
console.log(JSON.stringify({
  template_count: authority.template_manifest.documents.length,
  registered_placeholder_bindings_tested: totalTokens,
  token_occurrences_replaced: totalReplacements,
  prepared_document_count: prepared.prepared_drafts.length,
  local_counsel_clause_actions_disclosed: prepared.prepared_drafts[0].local_counsel_actions.length,
  final_phase: finalized.document_assembly_validation_manifest.next_phase,
  generated_documents_git_forbidden: true
}, null, 2));

function placeholderBindings(injectionDocument) {
  const byToken = new Map();
  for (const binding of injectionDocument.bindings || []) {
    for (const [atomicKey, token] of Object.entries(binding.placeholders || {})) {
      const value = Object.prototype.hasOwnProperty.call(binding.demo_atomic_values || {}, atomicKey)
        ? binding.demo_atomic_values[atomicKey]
        : "Not specified";
      if (byToken.has(token)) assert.deepEqual(byToken.get(token).value, value, `Conflicting fixture value for ${token}`);
      byToken.set(token, {
        token,
        qr_field_id: binding.field_id,
        atomic_key: atomicKey,
        value,
        source: "REVIEWER_ATTESTED_MARKET_BASED"
      });
    }
  }
  return [...byToken.values()];
}

function withHash(body) {
  return freezeImmutableArtifact({ ...body, immutable_hash: hashImmutableArtifact(body) });
}

function reviewReadyBoundary() {
  return {
    legal_architect_not_law_firm: true,
    review_ready_draft_only: true,
    local_counsel_review_required: true,
    not_legal_advice: true
  };
}
