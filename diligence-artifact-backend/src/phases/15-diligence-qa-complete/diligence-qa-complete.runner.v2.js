import { loadQrRegistryAuthority } from "../13-qualified-review/registry/qr-registry-loader.js";
import { freezeImmutableArtifact, hashImmutableArtifact } from "../14-qualified-review-submission/immutable-artifact-hash.js";

export const DILIGENCE_QA_COMPLETE_RUNNER_VERSION = "phase15_diligence_qa_complete_runner.v2";
export const DILIGENCE_QA_PAUSE_PHASE = "AWAITING_ASSEMBLY";

export function runDiligenceQaComplete({
  run = {},
  qualified_review_submission = {},
  qr_final_value_ledger = {},
  document_activation_manifest = {},
  authority = loadQrRegistryAuthority()
} = {}) {
  const errors = [];
  const warnings = [];
  validateTypes({ qualified_review_submission, qr_final_value_ledger, document_activation_manifest, errors });
  validateHashes({ qualified_review_submission, qr_final_value_ledger, document_activation_manifest, errors });
  validateCrossArtifactCounts({ qualified_review_submission, qr_final_value_ledger, document_activation_manifest, errors });
  validateFinalValues({ qr_final_value_ledger, errors, warnings });
  validateDocuments({ authority, document_activation_manifest, errors, warnings });
  validateReviewReadyBoundary({ qualified_review_submission, document_activation_manifest, errors });

  const uniqueWarnings = unique(warnings);
  const status = errors.length ? "CONTROLLED_FAILURE" : uniqueWarnings.length ? "COMPLETE_WITH_WARNINGS" : "COMPLETE";
  const receiptBody = {
    artifact_type: "diligence_qa_completion_receipt",
    artifact_version: "phase15_diligence_qa_completion_receipt.v1",
    runner_version: DILIGENCE_QA_COMPLETE_RUNNER_VERSION,
    run_id: run.run_id,
    target: run.target || qualified_review_submission.target || "",
    target_url: run.root_url || qualified_review_submission.target_url || "",
    status,
    diligence_qa_complete: errors.length === 0,
    completed_at: qualified_review_submission.compiled_at,
    immutable_submission_verified: errors.length === 0,
    no_document_assembly: true,
    document_assembly_performed: false,
    next_phase: errors.length ? "DILIGENCE_QA_COMPLETE" : DILIGENCE_QA_PAUSE_PHASE,
    verified_artifacts: {
      qualified_review_submission: qualified_review_submission.immutable_hash || "",
      qr_final_value_ledger: qr_final_value_ledger.immutable_hash || "",
      document_activation_manifest: document_activation_manifest.immutable_hash || ""
    },
    counts: {
      final_field_count: qr_final_value_ledger.counts?.final_field_count || 0,
      final_atomic_value_count: qr_final_value_ledger.counts?.final_atomic_value_count || 0,
      active_document_count: document_activation_manifest.counts?.active_document_count || 0,
      suppressed_document_count: document_activation_manifest.counts?.suppressed_document_count || 0,
      active_placeholder_count: document_activation_manifest.counts?.active_placeholder_count || 0,
      warning_count: uniqueWarnings.length,
      error_count: errors.length
    },
    errors,
    warnings: uniqueWarnings,
    review_ready_boundary: {
      legal_architect_not_law_firm: true,
      review_ready_draft_only: true,
      local_counsel_review_required: true,
      not_legal_advice: true,
      assembly_control_schedule_removal_required: true
    },
    release_boundary: {
      assembly_not_authorized_by_this_receipt: true,
      explicit_phase16_execution_required: true,
      matter_specific_documents_must_not_be_committed_to_git: true
    }
  };
  const receipt = withImmutableHash(receiptBody);
  if (errors.length) throw new Error(`DILIGENCE_QA_COMPLETE_FAILED:${errors.join("|")}`);
  return receipt;
}

function validateTypes({ qualified_review_submission, qr_final_value_ledger, document_activation_manifest, errors }) {
  if (qualified_review_submission.artifact_type !== "qualified_review_submission") errors.push("QUALIFIED_REVIEW_SUBMISSION_TYPE_INVALID");
  if (qr_final_value_ledger.artifact_type !== "qr_final_value_ledger") errors.push("QR_FINAL_VALUE_LEDGER_TYPE_INVALID");
  if (document_activation_manifest.artifact_type !== "document_activation_manifest") errors.push("DOCUMENT_ACTIVATION_MANIFEST_TYPE_INVALID");
  if (qualified_review_submission.immutable !== true) errors.push("QUALIFIED_REVIEW_SUBMISSION_NOT_IMMUTABLE");
  if (qr_final_value_ledger.immutable !== true) errors.push("QR_FINAL_VALUE_LEDGER_NOT_IMMUTABLE");
  if (document_activation_manifest.immutable !== true) errors.push("DOCUMENT_ACTIVATION_MANIFEST_NOT_IMMUTABLE");
  if (!String(qualified_review_submission.compiled_at || "").trim()) errors.push("QUALIFIED_REVIEW_SUBMISSION_COMPILED_AT_MISSING");
  if (qualified_review_submission.no_document_assembly !== true) errors.push("SUBMISSION_DOCUMENT_ASSEMBLY_BOUNDARY_MISSING");
  if (document_activation_manifest.no_document_assembly !== true) errors.push("MANIFEST_DOCUMENT_ASSEMBLY_BOUNDARY_MISSING");
}

function validateHashes({ qualified_review_submission, qr_final_value_ledger, document_activation_manifest, errors }) {
  const ledgerHash = recomputeHash(qr_final_value_ledger);
  const documentHash = recomputeHash(document_activation_manifest);
  const submissionHash = recomputeHash(qualified_review_submission);
  if (ledgerHash !== qr_final_value_ledger.immutable_hash) errors.push("QR_FINAL_VALUE_LEDGER_HASH_MISMATCH");
  if (documentHash !== document_activation_manifest.immutable_hash) errors.push("DOCUMENT_ACTIVATION_MANIFEST_HASH_MISMATCH");
  if (submissionHash !== qualified_review_submission.immutable_hash) errors.push("QUALIFIED_REVIEW_SUBMISSION_HASH_MISMATCH");
  if (qualified_review_submission.artifact_hashes?.qr_final_value_ledger !== qr_final_value_ledger.immutable_hash) errors.push("SUBMISSION_LEDGER_HASH_REFERENCE_MISMATCH");
  if (qualified_review_submission.artifact_hashes?.document_activation_manifest !== document_activation_manifest.immutable_hash) errors.push("SUBMISSION_DOCUMENT_HASH_REFERENCE_MISMATCH");
}

function validateCrossArtifactCounts({ qualified_review_submission, qr_final_value_ledger, document_activation_manifest, errors }) {
  if (Number(qualified_review_submission.counts?.final_field_count || 0) !== Number(qr_final_value_ledger.counts?.final_field_count || 0)) errors.push("SUBMISSION_FINAL_FIELD_COUNT_REFERENCE_MISMATCH");
  if (Number(qualified_review_submission.counts?.final_atomic_value_count || 0) !== Number(qr_final_value_ledger.counts?.final_atomic_value_count || 0)) errors.push("SUBMISSION_FINAL_ATOMIC_COUNT_REFERENCE_MISMATCH");
  if (Number(qualified_review_submission.counts?.active_document_count || 0) !== Number(document_activation_manifest.counts?.active_document_count || 0)) errors.push("SUBMISSION_ACTIVE_DOCUMENT_COUNT_REFERENCE_MISMATCH");
  if (Number(qualified_review_submission.counts?.suppressed_document_count || 0) !== Number(document_activation_manifest.counts?.suppressed_document_count || 0)) errors.push("SUBMISSION_SUPPRESSED_DOCUMENT_COUNT_REFERENCE_MISMATCH");
}

function validateFinalValues({ qr_final_value_ledger, errors, warnings }) {
  const fields = qr_final_value_ledger.final_fields || [];
  const seen = new Set();
  for (const field of fields) {
    if (!field.qr_field_id) errors.push("FINAL_FIELD_ID_MISSING");
    else if (seen.has(field.qr_field_id)) errors.push(`FINAL_FIELD_DUPLICATE:${field.qr_field_id}`);
    else seen.add(field.qr_field_id);
    if (!field.document_bindings?.length) errors.push(`FINAL_FIELD_DOCUMENT_BINDING_MISSING:${field.qr_field_id || "missing"}`);
    if (field.not_applicable) continue;
    for (const [atomicKey, value] of Object.entries(field.final_atomic_values || {})) {
      if (!hasMaterialValue(value)) errors.push(`FINAL_ATOMIC_VALUE_MISSING:${field.qr_field_id}:${atomicKey}`);
      const source = field.atomic_sources?.[atomicKey] || "";
      if (!source.startsWith("REVIEWER_")) errors.push(`FINAL_ATOMIC_VALUE_NOT_REVIEWER_ATTESTED:${field.qr_field_id}:${atomicKey}`);
      if (source.includes("UNRESOLVED")) errors.push(`FINAL_ATOMIC_VALUE_SOURCE_UNRESOLVED:${field.qr_field_id}:${atomicKey}`);
      if (source === "REVIEWER_ATTESTED_MARKET_BASED") warnings.push(`MARKET_BASED_VALUE_ATTESTED:${field.qr_field_id}:${atomicKey}`);
    }
  }
  if (fields.length !== Number(qr_final_value_ledger.counts?.final_field_count || 0)) errors.push("FINAL_FIELD_COUNT_MISMATCH");
  const atomicCount = fields.reduce((sum, field) => sum + Object.keys(field.final_atomic_values || {}).length, 0);
  if (atomicCount !== Number(qr_final_value_ledger.counts?.final_atomic_value_count || 0)) errors.push("FINAL_ATOMIC_VALUE_COUNT_MISMATCH");
  for (const decision of qr_final_value_ledger.suppressed_activation_decisions || []) {
    if (decision.confirmed_activation_probe !== true || decision.retained_for_audit_only !== true) errors.push(`SUPPRESSED_ACTIVATION_DECISION_INVALID:${decision.qr_field_id || "missing"}`);
    else warnings.push(`SUPPRESSED_ACTIVATION_DECISION_RETAINED:${decision.qr_field_id}`);
  }
}

function validateDocuments({ authority, document_activation_manifest, errors, warnings }) {
  const templates = authority.template_manifest?.documents || [];
  const templateById = new Map(templates.map((document) => [document.document_id, document]));
  const injectionDocuments = authority.injection_map?.documents || [];
  const injectionById = new Map(injectionDocuments.map((document) => [document.document_id, document]));
  const injectionValidationActive = injectionDocuments.length > 0;
  const documents = document_activation_manifest.documents || [];
  if (documents.length !== templates.length) errors.push(`DOCUMENT_MANIFEST_TEMPLATE_COUNT_MISMATCH:${documents.length}:${templates.length}`);
  if (injectionValidationActive && injectionDocuments.length !== templates.length) errors.push(`INJECTION_MAP_TEMPLATE_COUNT_MISMATCH:${injectionDocuments.length}:${templates.length}`);
  const seen = new Set();
  for (const document of documents) {
    if (!document.document_id) errors.push("DOCUMENT_ID_MISSING");
    else if (seen.has(document.document_id)) errors.push(`DOCUMENT_ID_DUPLICATE:${document.document_id}`);
    else seen.add(document.document_id);
    const template = templateById.get(document.document_id);
    const injection = injectionById.get(document.document_id);
    if (!template) errors.push(`DOCUMENT_TEMPLATE_UNKNOWN:${document.document_id || "missing"}`);
    if (template && document.template_path !== template.template_path) errors.push(`DOCUMENT_TEMPLATE_PATH_MISMATCH:${document.document_id}`);
    if (template && String(document.template_version || "") !== String(template.template_version || "")) errors.push(`DOCUMENT_TEMPLATE_VERSION_MISMATCH:${document.document_id}`);
    if (template && String(document.lane || "") !== String(template.lane || "")) errors.push(`DOCUMENT_TEMPLATE_LANE_MISMATCH:${document.document_id}`);
    if (injectionValidationActive && !injection) errors.push(`DOCUMENT_INJECTION_MAP_ENTRY_MISSING:${document.document_id || "missing"}`);
    if (!document.template_path) errors.push(`DOCUMENT_TEMPLATE_PATH_MISSING:${document.document_id || "missing"}`);
    if (document.review_ready_template !== true || document.requires_local_counsel_review !== true) errors.push(`DOCUMENT_REVIEW_READY_BOUNDARY_INVALID:${document.document_id || "missing"}`);
    if (!["ACTIVE", "SUPPRESSED"].includes(document.status)) errors.push(`DOCUMENT_STATUS_INVALID:${document.document_id || "missing"}:${document.status || "missing"}`);
    if (document.status === "ACTIVE") {
      if (Number(document.unresolved_qr_placeholder_count || 0) !== 0) errors.push(`ACTIVE_DOCUMENT_UNRESOLVED_QR_PLACEHOLDER:${document.document_id}`);
      const manifestTokens = new Set([
        ...(document.placeholder_bindings || []).map((binding) => binding.token),
        ...(document.action_tokens || []).map((binding) => binding.token)
      ].filter(Boolean));
      for (const binding of document.placeholder_bindings || []) {
        if (!binding.token || !String(binding.token).startsWith("{{QR.")) errors.push(`ACTIVE_DOCUMENT_QR_TOKEN_INVALID:${document.document_id}`);
        if (!hasMaterialValue(binding.value)) errors.push(`ACTIVE_DOCUMENT_QR_VALUE_MISSING:${document.document_id}:${binding.token || "missing"}`);
      }
      if (injection) {
        for (const requiredToken of requiredQrTokens(injection)) {
          if (!manifestTokens.has(requiredToken)) errors.push(`ACTIVE_DOCUMENT_REQUIRED_QR_TOKEN_MISSING:${document.document_id}:${requiredToken}`);
        }
      }
      if (!(document.placeholder_bindings || []).length && !(document.clause_actions || []).length && document.blank_operational_instrument_only !== true && document.inherit_only !== true) warnings.push(`ACTIVE_DOCUMENT_HAS_NO_DIRECT_QR_BINDINGS:${document.document_id}`);
    }
  }
  if (seen.size !== templates.length) errors.push(`DOCUMENT_MANIFEST_UNIQUE_COUNT_MISMATCH:${seen.size}:${templates.length}`);
  const activeCount = documents.filter((document) => document.status === "ACTIVE").length;
  const suppressedCount = documents.filter((document) => document.status === "SUPPRESSED").length;
  if (activeCount !== Number(document_activation_manifest.counts?.active_document_count || 0)) errors.push("ACTIVE_DOCUMENT_COUNT_MISMATCH");
  if (suppressedCount !== Number(document_activation_manifest.counts?.suppressed_document_count || 0)) errors.push("SUPPRESSED_DOCUMENT_COUNT_MISMATCH");
}

function validateReviewReadyBoundary({ qualified_review_submission, document_activation_manifest, errors }) {
  for (const [name, boundary] of [["submission", qualified_review_submission.review_ready_boundary], ["document_manifest", document_activation_manifest.review_ready_boundary]]) {
    if (boundary?.legal_architect_not_law_firm !== true) errors.push(`LEGAL_ARCHITECT_BOUNDARY_MISSING:${name}`);
    if (boundary?.review_ready_draft_only !== true) errors.push(`REVIEW_READY_DRAFT_BOUNDARY_MISSING:${name}`);
    if (boundary?.local_counsel_review_required !== true) errors.push(`LOCAL_COUNSEL_BOUNDARY_MISSING:${name}`);
    if (boundary?.not_legal_advice !== true) errors.push(`NOT_LEGAL_ADVICE_BOUNDARY_MISSING:${name}`);
  }
}

function requiredQrTokens(injectionDocument) {
  const tokens = [];
  for (const binding of injectionDocument.bindings || []) {
    collectQrTokens(binding.placeholders || {}, tokens);
    collectQrTokens(binding.action_token, tokens);
  }
  return unique(tokens);
}
function collectQrTokens(value, output) {
  if (typeof value === "string") {
    if (value.startsWith("{{QR.")) output.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const child of value) collectQrTokens(child, output);
    return;
  }
  if (value && typeof value === "object") for (const child of Object.values(value)) collectQrTokens(child, output);
}
function recomputeHash(artifact) { const clone = structuredClone(artifact || {}); delete clone.immutable_hash; return hashImmutableArtifact(clone); }
function withImmutableHash(body) { return freezeImmutableArtifact({ ...body, immutable_hash: hashImmutableArtifact(body) }); }
function unique(values) { return [...new Set(values)]; }
function hasMaterialValue(value) {
  if (value === false || value === 0) return true;
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(hasMaterialValue);
  if (typeof value === "object") return Object.values(value).some(hasMaterialValue);
  return true;
}
