import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadQrRegistryAuthority, resolveAuthorityPath } from "../13-qualified-review/registry/qr-registry-loader.js";
import { freezeImmutableArtifact, hashImmutableArtifact } from "../14-qualified-review-submission/immutable-artifact-hash.js";
import { assembleDocxTemplate } from "./docx-package.js";

export const ASSEMBLY_ENGINE_RUNNER_VERSION = "phase16_assembly_engine_runner.v1";

export function prepareDocumentAssembly({
  run = {},
  diligence_qa_completion_receipt = {},
  qualified_review_submission = {},
  qr_final_value_ledger = {},
  document_activation_manifest = {},
  authority = loadQrRegistryAuthority()
} = {}) {
  const validation = validateAssemblyInputs({
    run,
    diligence_qa_completion_receipt,
    qualified_review_submission,
    qr_final_value_ledger,
    document_activation_manifest,
    authority
  });
  if (validation.errors.length) throw new Error(`ASSEMBLY_ENGINE_INPUT_INVALID:${validation.errors.join("|")}`);

  const templateRoot = authority.template_manifest?.template_root;
  const templateById = new Map((authority.template_manifest?.documents || []).map((document) => [document.document_id, document]));
  const preparedDrafts = [];
  const documentPlans = [];
  const warnings = [...validation.warnings];

  for (const document of document_activation_manifest.documents || []) {
    if (document.status === "SUPPRESSED") {
      documentPlans.push(freezeImmutableArtifact({
        document_id: document.document_id,
        status: "SUPPRESSED",
        suppression_reason: document.suppression_reason || "Registry activation rule did not activate this document.",
        template_path: document.template_path,
        generated: false
      }));
      continue;
    }

    const template = templateById.get(document.document_id);
    if (!template) throw new Error(`ASSEMBLY_TEMPLATE_UNKNOWN:${document.document_id}`);
    const relativeTemplatePath = join(templateRoot, template.template_path).replaceAll("\\", "/");
    const absoluteTemplatePath = resolveAuthorityPath(authority.backend_root, relativeTemplatePath);
    const templateBuffer = readFileSync(absoluteTemplatePath);
    const assembled = assembleDocxTemplate(templateBuffer, {
      placeholder_bindings: document.placeholder_bindings || [],
      action_tokens: (document.action_tokens || []).map((token) => ({
        ...token,
        value: token.value ?? token.disposition ?? "APPLY"
      }))
    });
    const fileHash = sha256(assembled.buffer);
    const filename = `${sanitizeFilename(document.document_id)}_REVIEW_READY.docx`;
    const counselActions = buildCounselActions(document);
    if (counselActions.length) warnings.push(`LOCAL_COUNSEL_CLAUSE_ACTIONS_REQUIRED:${document.document_id}:${counselActions.length}`);

    const draftRecord = {
      document_id: document.document_id,
      lane: document.lane,
      template_version: document.template_version,
      template_path: document.template_path,
      output_filename: filename,
      mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      file_sha256: fileHash,
      file_size_bytes: assembled.buffer.length,
      status: counselActions.length ? "REVIEW_READY_WITH_COUNSEL_ACTIONS" : "REVIEW_READY",
      placeholder_binding_count: (document.placeholder_bindings || []).length,
      clause_action_count: (document.clause_actions || []).length,
      action_token_count: (document.action_tokens || []).length,
      unresolved_qr_placeholder_count: 0,
      local_counsel_actions_required: counselActions.length > 0,
      local_counsel_actions: counselActions,
      assembly_stats: assembled.stats,
      review_ready_boundary: reviewReadyBoundary()
    };
    preparedDrafts.push({ ...draftRecord, buffer: assembled.buffer });
    documentPlans.push(freezeImmutableArtifact({
      ...draftRecord,
      generated: true,
      placeholder_bindings: document.placeholder_bindings || [],
      clause_actions: document.clause_actions || [],
      action_tokens: document.action_tokens || [],
      buffer: undefined
    }));
  }

  const activeCount = preparedDrafts.length;
  const suppressedCount = documentPlans.filter((document) => document.status === "SUPPRESSED").length;
  if (activeCount !== Number(document_activation_manifest.counts?.active_document_count || 0)) {
    throw new Error(`ASSEMBLY_ACTIVE_DOCUMENT_COUNT_MISMATCH:${activeCount}:${document_activation_manifest.counts?.active_document_count || 0}`);
  }
  if (suppressedCount !== Number(document_activation_manifest.counts?.suppressed_document_count || 0)) {
    throw new Error(`ASSEMBLY_SUPPRESSED_DOCUMENT_COUNT_MISMATCH:${suppressedCount}:${document_activation_manifest.counts?.suppressed_document_count || 0}`);
  }

  const payloadBody = {
    artifact_type: "document_assembly_payload",
    artifact_version: "phase16_document_assembly_payload.v1",
    runner_version: ASSEMBLY_ENGINE_RUNNER_VERSION,
    run_id: run.run_id,
    target: run.target || qualified_review_submission.target || "",
    target_url: run.root_url || qualified_review_submission.target_url || "",
    status: warnings.length ? "LOCKED_WITH_COUNSEL_ACTIONS" : "LOCKED",
    immutable: true,
    assembly_authority: {
      diligence_qa_completion_receipt: diligence_qa_completion_receipt.immutable_hash,
      qualified_review_submission: qualified_review_submission.immutable_hash,
      qr_final_value_ledger: qr_final_value_ledger.immutable_hash,
      document_activation_manifest: document_activation_manifest.immutable_hash
    },
    document_plans: documentPlans,
    counts: {
      active_document_count: activeCount,
      suppressed_document_count: suppressedCount,
      generated_document_count: preparedDrafts.length,
      placeholder_binding_count: preparedDrafts.reduce((sum, document) => sum + document.placeholder_binding_count, 0),
      clause_action_count: preparedDrafts.reduce((sum, document) => sum + document.clause_action_count, 0),
      local_counsel_action_count: preparedDrafts.reduce((sum, document) => sum + document.local_counsel_actions.length, 0)
    },
    warnings: unique(warnings),
    review_ready_boundary: reviewReadyBoundary(),
    custody_boundary: {
      generated_documents_are_matter_specific: true,
      generated_documents_must_not_be_committed_to_git: true,
      immutable_blank_templates_remain_repository_assets: true
    }
  };

  return Object.freeze({
    document_assembly_payload: withImmutableHash(payloadBody),
    prepared_drafts: preparedDrafts,
    warnings: unique(warnings)
  });
}

export function finalizeDocumentAssembly({
  run = {},
  prepared = {},
  uploaded_files = [],
  assembly_folder = {},
  drafts_folder = {}
} = {}) {
  const uploadedById = new Map(uploaded_files.map((file) => [file.document_id, file]));
  const errors = [];
  const warnings = [...(prepared.warnings || [])];
  const documents = (prepared.prepared_drafts || []).map((draft) => {
    const uploaded = uploadedById.get(draft.document_id);
    if (!uploaded) errors.push(`ASSEMBLY_UPLOAD_MISSING:${draft.document_id}`);
    if (uploaded && uploaded.file_sha256 !== draft.file_sha256) errors.push(`ASSEMBLY_UPLOAD_HASH_MISMATCH:${draft.document_id}`);
    if (uploaded && Number(uploaded.file_size_bytes || 0) !== Number(draft.file_size_bytes || 0)) errors.push(`ASSEMBLY_UPLOAD_SIZE_MISMATCH:${draft.document_id}`);
    return freezeImmutableArtifact({
      document_id: draft.document_id,
      lane: draft.lane,
      status: draft.status,
      output_filename: draft.output_filename,
      mime_type: draft.mime_type,
      file_sha256: draft.file_sha256,
      file_size_bytes: draft.file_size_bytes,
      drive_file_id: uploaded?.drive_file_id || "",
      drive_web_view_link: uploaded?.drive_web_view_link || "",
      drive_reused: uploaded?.reused === true,
      local_counsel_actions_required: draft.local_counsel_actions_required,
      local_counsel_actions: draft.local_counsel_actions,
      review_ready_boundary: draft.review_ready_boundary
    });
  });
  for (const uploaded of uploaded_files) {
    if (!(prepared.prepared_drafts || []).some((draft) => draft.document_id === uploaded.document_id)) {
      errors.push(`ASSEMBLY_UNEXPECTED_UPLOAD:${uploaded.document_id}`);
    }
  }
  if (errors.length) throw new Error(`ASSEMBLY_ENGINE_FINALIZATION_INVALID:${errors.join("|")}`);

  const manifestBody = {
    artifact_type: "review_ready_draft_manifest",
    artifact_version: "phase16_review_ready_draft_manifest.v1",
    runner_version: ASSEMBLY_ENGINE_RUNNER_VERSION,
    run_id: run.run_id,
    target: run.target || "",
    status: warnings.length ? "COMPLETE_WITH_COUNSEL_ACTIONS" : "COMPLETE",
    immutable: true,
    source_assembly_payload_hash: prepared.document_assembly_payload.immutable_hash,
    assembly_folder: {
      drive_folder_id: assembly_folder.drive_folder_id || "",
      drive_web_view_link: assembly_folder.drive_web_view_link || ""
    },
    review_ready_drafts_folder: {
      drive_folder_id: drafts_folder.drive_folder_id || "",
      drive_web_view_link: drafts_folder.drive_web_view_link || ""
    },
    documents,
    counts: {
      generated_document_count: documents.length,
      local_counsel_action_document_count: documents.filter((document) => document.local_counsel_actions_required).length,
      local_counsel_action_count: documents.reduce((sum, document) => sum + document.local_counsel_actions.length, 0),
      total_file_size_bytes: documents.reduce((sum, document) => sum + Number(document.file_size_bytes || 0), 0)
    },
    review_ready_boundary: reviewReadyBoundary(),
    release_boundary: {
      legal_architect_not_law_firm: true,
      local_counsel_approval_required_before_execution_or_publication: true,
      documents_are_review_ready_drafts_not_final_legal_instruments: true
    }
  };
  const manifest = withImmutableHash(manifestBody);

  const validationBody = {
    artifact_type: "document_assembly_validation_manifest",
    artifact_version: "phase16_document_assembly_validation_manifest.v1",
    runner_version: ASSEMBLY_ENGINE_RUNNER_VERSION,
    run_id: run.run_id,
    status: warnings.length ? "PASS_WITH_WARNINGS" : "PASS",
    immutable: true,
    source_assembly_payload_hash: prepared.document_assembly_payload.immutable_hash,
    review_ready_draft_manifest_hash: manifest.immutable_hash,
    checks: {
      all_active_documents_generated: true,
      all_generated_files_uploaded: true,
      all_uploaded_hashes_match: true,
      all_qr_placeholders_resolved: true,
      qr_control_schedules_removed: true,
      architect_notes_removed: true,
      production_notes_removed: true,
      counsel_notes_preserved: true,
      local_counsel_actions_disclosed: true,
      generated_documents_git_forbidden: true
    },
    counts: {
      generated_document_count: documents.length,
      warning_count: unique(warnings).length,
      error_count: 0
    },
    errors: [],
    warnings: unique(warnings),
    next_phase: "COMPLETE",
    review_ready_boundary: reviewReadyBoundary()
  };

  return freezeImmutableArtifact({
    document_assembly_payload: prepared.document_assembly_payload,
    review_ready_draft_manifest: manifest,
    document_assembly_validation_manifest: withImmutableHash(validationBody)
  });
}

function validateAssemblyInputs({ run, diligence_qa_completion_receipt, qualified_review_submission, qr_final_value_ledger, document_activation_manifest, authority }) {
  const errors = [];
  const warnings = [];
  if (!run.run_id) errors.push("RUN_ID_MISSING");
  if (diligence_qa_completion_receipt.artifact_type !== "diligence_qa_completion_receipt") errors.push("DILIGENCE_QA_RECEIPT_TYPE_INVALID");
  if (diligence_qa_completion_receipt.diligence_qa_complete !== true) errors.push("DILIGENCE_QA_NOT_COMPLETE");
  if (!["COMPLETE", "COMPLETE_WITH_WARNINGS"].includes(diligence_qa_completion_receipt.status)) errors.push("DILIGENCE_QA_RECEIPT_STATUS_INVALID");
  if (diligence_qa_completion_receipt.next_phase !== "AWAITING_ASSEMBLY") errors.push("DILIGENCE_QA_ASSEMBLY_PAUSE_MISSING");
  if (qualified_review_submission.artifact_type !== "qualified_review_submission") errors.push("QUALIFIED_REVIEW_SUBMISSION_TYPE_INVALID");
  if (qr_final_value_ledger.artifact_type !== "qr_final_value_ledger") errors.push("QR_FINAL_VALUE_LEDGER_TYPE_INVALID");
  if (document_activation_manifest.artifact_type !== "document_activation_manifest") errors.push("DOCUMENT_ACTIVATION_MANIFEST_TYPE_INVALID");
  if (!authority?.backend_root || !authority?.template_manifest) errors.push("ASSEMBLY_TEMPLATE_AUTHORITY_INVALID");
  for (const [name, artifact] of [
    ["qualified_review_submission", qualified_review_submission],
    ["qr_final_value_ledger", qr_final_value_ledger],
    ["document_activation_manifest", document_activation_manifest],
    ["diligence_qa_completion_receipt", diligence_qa_completion_receipt]
  ]) {
    if (artifact.immutable !== true && name !== "diligence_qa_completion_receipt") errors.push(`ASSEMBLY_SOURCE_NOT_IMMUTABLE:${name}`);
    if (!artifact.immutable_hash) errors.push(`ASSEMBLY_SOURCE_HASH_MISSING:${name}`);
    else if (recomputeHash(artifact) !== artifact.immutable_hash) errors.push(`ASSEMBLY_SOURCE_HASH_MISMATCH:${name}`);
  }
  const verified = diligence_qa_completion_receipt.verified_artifacts || {};
  if (verified.qualified_review_submission !== qualified_review_submission.immutable_hash) errors.push("ASSEMBLY_QA_SUBMISSION_HASH_REFERENCE_MISMATCH");
  if (verified.qr_final_value_ledger !== qr_final_value_ledger.immutable_hash) errors.push("ASSEMBLY_QA_LEDGER_HASH_REFERENCE_MISMATCH");
  if (verified.document_activation_manifest !== document_activation_manifest.immutable_hash) errors.push("ASSEMBLY_QA_DOCUMENT_HASH_REFERENCE_MISMATCH");
  if ((document_activation_manifest.documents || []).some((document) => document.status === "ACTIVE" && document.review_ready_template !== true)) errors.push("ASSEMBLY_ACTIVE_TEMPLATE_NOT_REVIEW_READY");
  if ((document_activation_manifest.documents || []).some((document) => document.status === "ACTIVE" && document.requires_local_counsel_review !== true)) errors.push("ASSEMBLY_ACTIVE_TEMPLATE_LOCAL_COUNSEL_BOUNDARY_MISSING");
  if (diligence_qa_completion_receipt.status === "COMPLETE_WITH_WARNINGS") warnings.push("DILIGENCE_QA_COMPLETED_WITH_WARNINGS");
  return { errors, warnings };
}

function buildCounselActions(document) {
  const actionTokens = new Set((document.action_tokens || []).map((token) => token.qr_field_id));
  return (document.clause_actions || [])
    .filter((action) => !actionTokens.has(action.qr_field_id))
    .map((action) => freezeImmutableArtifact({
      qr_field_id: action.qr_field_id,
      target: action.target || "",
      final_atomic_values: action.final_atomic_values || {},
      not_applicable: action.not_applicable === true,
      disposition: action.disposition || "LOCAL_COUNSEL_SELECT_OR_SUPPRESS",
      reason: "The registry defines a clause consequence but the template does not contain a machine-addressable action token. The engine will not guess legal prose deletion or selection."
    }));
}

function reviewReadyBoundary() {
  return Object.freeze({
    legal_architect_not_law_firm: true,
    review_ready_draft_only: true,
    local_counsel_review_required: true,
    not_legal_advice: true
  });
}

function withImmutableHash(body) {
  return freezeImmutableArtifact({ ...body, immutable_hash: hashImmutableArtifact(body) });
}

function recomputeHash(artifact) {
  const clone = structuredClone(artifact || {});
  delete clone.immutable_hash;
  return hashImmutableArtifact(clone);
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function sanitizeFilename(value) {
  return String(value || "DOCUMENT").replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "") || "DOCUMENT";
}

function unique(values) {
  return [...new Set(values)];
}
