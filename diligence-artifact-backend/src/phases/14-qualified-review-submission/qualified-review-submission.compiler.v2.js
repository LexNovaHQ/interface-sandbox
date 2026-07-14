import { loadQrRegistryAuthority } from "../13-qualified-review/registry/qr-registry-loader.js";
import { freezeImmutableArtifact, hashImmutableArtifact } from "./immutable-artifact-hash.js";

export const QUALIFIED_REVIEW_SUBMISSION_COMPILER_VERSION = "phase14_qualified_review_submission_compiler.v2";

export function compileQualifiedReviewSubmission({
  run = {},
  submission_request = {},
  qualified_review_handoff = {},
  qr_active_field_ledger = {},
  qr_registry_resolution_manifest = {},
  authority = loadQrRegistryAuthority()
} = {}) {
  const validation = validateSubmissionInputs({
    run,
    submission_request,
    qualified_review_handoff,
    qr_active_field_ledger,
    qr_registry_resolution_manifest,
    authority
  });
  if (validation.errors.length) throw new Error(`QUALIFIED_REVIEW_SUBMISSION_INVALID:${validation.errors.join("|")}`);

  const finalFields = buildFinalFields({ ledger: qr_active_field_ledger, request: submission_request });
  const finalFieldById = new Map(finalFields.map((field) => [field.qr_field_id, field]));
  const suppressedActivationDecisions = buildSuppressedActivationDecisions({ request: submission_request, finalFieldById });

  const ledgerBody = {
    artifact_type: "qr_final_value_ledger",
    artifact_version: "phase14_qr_final_value_ledger.v1",
    compiler_version: QUALIFIED_REVIEW_SUBMISSION_COMPILER_VERSION,
    run_id: run.run_id,
    target: run.target || qualified_review_handoff.target || "",
    target_url: run.root_url || qualified_review_handoff.target_url || "",
    status: validation.warnings.length ? "LOCKED_WITH_LIMITATIONS" : "LOCKED",
    immutable: true,
    confirmation_unit: "SECTION",
    per_question_confirmation_forbidden: true,
    source_submission_request_ref: "qualified_review_submission_request",
    source_handoff_ref: "qualified_review_handoff",
    source_active_ledger_ref: "qr_active_field_ledger",
    final_fields: finalFields,
    suppressed_activation_decisions: suppressedActivationDecisions,
    assembly_payload: {
      qr_values: Object.fromEntries(finalFields.map((field) => [field.qr_field_id, field.final_atomic_values]))
    },
    counts: summarizeFinalFields(finalFields, suppressedActivationDecisions),
    warnings: validation.warnings
  };
  const finalLedger = withImmutableHash(ledgerBody);

  const documentManifestBody = buildDocumentActivationManifest({
    run,
    authority,
    registryResolution: qr_registry_resolution_manifest,
    finalFields
  });
  const documentActivationManifest = withImmutableHash(documentManifestBody);

  const submissionBody = {
    artifact_type: "qualified_review_submission",
    artifact_version: "phase14_qualified_review_submission.v1",
    compiler_version: QUALIFIED_REVIEW_SUBMISSION_COMPILER_VERSION,
    run_id: run.run_id,
    target: run.target || qualified_review_handoff.target || "",
    target_url: run.root_url || qualified_review_handoff.target_url || "",
    status: validation.warnings.length ? "LOCKED_WITH_LIMITATIONS" : "LOCKED",
    immutable: true,
    compiled_at: submission_request.requested_at,
    submitted_by: submission_request.requested_by || "qualified_review_reviewer",
    source_request_revision: submission_request.source_draft_revision,
    source_handoff_version: qualified_review_handoff.artifact_version,
    confirmation_unit: "SECTION",
    per_question_confirmation_forbidden: true,
    no_document_assembly: true,
    artifact_hashes: {
      qualified_review_submission_request: hashImmutableArtifact(submission_request),
      qr_final_value_ledger: finalLedger.immutable_hash,
      document_activation_manifest: documentActivationManifest.immutable_hash
    },
    counts: {
      attested_section_count: validation.attested_section_count,
      final_field_count: finalLedger.counts.final_field_count,
      final_atomic_value_count: finalLedger.counts.final_atomic_value_count,
      active_document_count: documentActivationManifest.counts.active_document_count,
      suppressed_document_count: documentActivationManifest.counts.suppressed_document_count
    },
    warnings: validation.warnings,
    next_phase: "DILIGENCE_QA_COMPLETE",
    review_ready_boundary: reviewReadyBoundary()
  };
  const submission = withImmutableHash(submissionBody);

  return freezeImmutableArtifact({
    qualified_review_submission: submission,
    qr_final_value_ledger: finalLedger,
    document_activation_manifest: documentActivationManifest,
    validation: freezeImmutableArtifact({
      status: validation.warnings.length ? "PASS_WITH_WARNINGS" : "PASS",
      errors: [],
      warnings: validation.warnings
    })
  });
}

function validateSubmissionInputs({ run, submission_request, qualified_review_handoff, qr_active_field_ledger, qr_registry_resolution_manifest, authority }) {
  const errors = [];
  const warnings = [];
  if (!run.run_id) errors.push("RUN_ID_MISSING");
  if (submission_request.artifact_type !== "qualified_review_submission_request") errors.push("SUBMISSION_REQUEST_TYPE_INVALID");
  if (submission_request.status !== "READY_FOR_SUBMISSION_COMPILER") errors.push("SUBMISSION_REQUEST_NOT_READY");
  if (!String(submission_request.requested_at || "").trim()) errors.push("SUBMISSION_REQUEST_TIMESTAMP_MISSING");
  if (qualified_review_handoff.artifact_type !== "qualified_review_handoff") errors.push("QUALIFIED_REVIEW_HANDOFF_TYPE_INVALID");
  if (qr_active_field_ledger.artifact_type !== "qr_active_field_ledger") errors.push("ACTIVE_LEDGER_TYPE_INVALID");
  if (qr_registry_resolution_manifest.artifact_type !== "qr_registry_resolution_manifest") errors.push("REGISTRY_RESOLUTION_TYPE_INVALID");
  if (!authority?.template_manifest || !authority?.registries) errors.push("QR_AUTHORITY_INVALID");
  if (submission_request.run_id && submission_request.run_id !== run.run_id) errors.push("SUBMISSION_REQUEST_RUN_ID_MISMATCH");
  if (qualified_review_handoff.run_id && qualified_review_handoff.run_id !== run.run_id) errors.push("HANDOFF_RUN_ID_MISMATCH");
  if (submission_request.source_handoff_version !== qualified_review_handoff.artifact_version) errors.push("SUBMISSION_REQUEST_HANDOFF_VERSION_MISMATCH");
  if (submission_request.confirmation_unit !== "SECTION" || submission_request.per_question_confirmation_forbidden !== true) errors.push("SUBMISSION_CONFIRMATION_CONTRACT_INVALID");
  if ((qr_registry_resolution_manifest.unresolved_activation_probe_field_ids || []).length) errors.push("ACTIVATION_PROBES_UNRESOLVED");
  if ((qr_active_field_ledger.unresolved_activation_probe_field_ids || []).length) errors.push("ACTIVE_LEDGER_PROBES_UNRESOLVED");

  const sections = qualified_review_handoff.sections || [];
  const attestations = submission_request.section_attestations || {};
  for (const section of sections) {
    const attestation = attestations[section.section_id];
    if (!attestation || attestation.status !== "ATTESTED") errors.push(`SECTION_ATTESTATION_REQUIRED:${section.section_id}`);
    else if (attestation.field_state_hash !== section.attestation?.field_state_hash) errors.push(`SECTION_ATTESTATION_STALE:${section.section_id}`);
  }
  const activeFieldIds = new Set((qr_active_field_ledger.active_fields || []).map((field) => field.qr_field_id));
  for (const [fieldId, edit] of Object.entries(submission_request.field_edits || {})) {
    if (activeFieldIds.has(fieldId)) continue;
    if (edit?.confirmed_activation_probe === true) warnings.push(`SUPPRESSED_ACTIVATION_PROBE_RETAINED:${fieldId}`);
    else errors.push(`SUBMISSION_UNKNOWN_FIELD_EDIT:${fieldId}`);
  }
  return {
    errors,
    warnings,
    attested_section_count: sections.filter((section) => attestations[section.section_id]?.status === "ATTESTED").length
  };
}

function buildFinalFields({ ledger, request }) {
  return (ledger.active_fields || []).map((field) => {
    const edit = request.field_edits?.[field.qr_field_id] || null;
    const finalAtomicValues = {};
    const atomicSources = {};
    const atomicProvenance = {};
    for (const [atomicKey, sourceRecord] of Object.entries(field.atomic_values || {})) {
      const reviewerHasValue = Object.prototype.hasOwnProperty.call(edit?.atomic_values || {}, atomicKey);
      const value = reviewerHasValue ? edit.atomic_values[atomicKey] : sourceRecord?.value;
      if (!hasMaterialValue(value) && edit?.not_applicable !== true) throw new Error(`QUALIFIED_REVIEW_FINAL_VALUE_MISSING:${field.qr_field_id}:${atomicKey}`);
      finalAtomicValues[atomicKey] = value;
      atomicSources[atomicKey] = finalSource({ edit, reviewerHasValue, sourceRecord, value });
      atomicProvenance[atomicKey] = {
        proposed_source: sourceRecord?.source || "UNRESOLVED",
        phase12_field_ids: sourceRecord?.phase12_field_ids || [],
        route_ids: sourceRecord?.route_ids || [],
        report_artifacts: sourceRecord?.report_artifacts || [],
        market_based_demo_not_evidence: sourceRecord?.demo_not_evidence === true,
        reviewer_changed_value: reviewerHasValue && !sameValue(value, sourceRecord?.value)
      };
    }
    return freezeImmutableArtifact({
      qr_field_id: field.qr_field_id,
      canonical_key: field.canonical_key,
      label: field.label,
      registry_id: field.registry_id,
      registry_scope: field.registry_scope,
      lane: field.lane,
      section_id: field.section_id,
      shape: field.shape,
      required_for_assembly: field.required_for_assembly === true,
      final_atomic_values: finalAtomicValues,
      atomic_sources: atomicSources,
      atomic_provenance: atomicProvenance,
      not_applicable: edit?.not_applicable === true,
      limitation: String(edit?.limitation || field.limitation || ""),
      review_status: edit?.review_status || "SECTION_ATTESTED_UNCHANGED",
      document_bindings: field.document_bindings || [],
      document_binding_count: field.document_binding_count || (field.document_bindings || []).length
    });
  });
}

function buildSuppressedActivationDecisions({ request, finalFieldById }) {
  return Object.entries(request.field_edits || {})
    .filter(([fieldId, edit]) => !finalFieldById.has(fieldId) && edit?.confirmed_activation_probe === true)
    .map(([fieldId, edit]) => freezeImmutableArtifact({
      qr_field_id: fieldId,
      final_atomic_values: edit.atomic_values || {},
      not_applicable: edit.not_applicable === true,
      limitation: String(edit.limitation || ""),
      review_status: edit.review_status || "SECTION_ATTESTED_PROBE",
      confirmed_activation_probe: true,
      retained_for_audit_only: true
    }));
}

function buildDocumentActivationManifest({ run, authority, registryResolution, finalFields }) {
  const errors = [];
  const templateDocuments = authority.template_manifest?.documents || [];
  const activeRegistryIds = new Set(registryResolution.active_registry_ids || []);
  const documentAuthority = authority.registries.find((loaded) => Array.isArray(loaded.registry.document_activation_rules));
  if (!documentAuthority) throw new Error("DOCUMENT_ACTIVATION_AUTHORITY_MISSING");
  const documentRegistryId = documentAuthority.registry.registry_id;
  const rules = new Map(documentAuthority.registry.document_activation_rules.map((rule) => [rule.document_id, rule]));
  const registryState = (registryResolution.registry_resolutions || []).find((row) => row.registry_id === documentRegistryId);
  const scopeStates = new Map((registryState?.subpackages || []).map((row) => [row.registry_scope, row.state]));
  const context = { fields: Object.fromEntries(finalFields.map((field) => [field.qr_field_id, field])) };
  for (const [scope, state] of scopeStates) context[`${String(scope).toLowerCase()}_active`] = state === "ACTIVE";
  const documentRegistryActive = activeRegistryIds.has(documentRegistryId);

  const documents = templateDocuments.map((template) => {
    const rule = rules.get(template.document_id);
    if (!rule) errors.push(`DOCUMENT_ACTIVATION_RULE_MISSING:${template.document_id}`);
    const evaluation = documentRegistryActive && rule
      ? evaluateActivationRule(rule.activate_when || {}, context)
      : { matched: false, trace: [documentRegistryActive ? "RULE_MISSING" : "DOCUMENT_REGISTRY_INACTIVE"] };
    const active = Boolean(evaluation.matched);
    const bindings = active ? buildDocumentBindings({ documentId: template.document_id, finalFields, errors }) : emptyDocumentBindings();
    return freezeImmutableArtifact({
      document_id: template.document_id,
      lane: template.lane,
      template_version: template.template_version,
      template_path: template.template_path,
      status: active ? "ACTIVE" : "SUPPRESSED",
      activation_rule: rule?.activate_when || null,
      activation_trace: evaluation.trace,
      suppression_reason: active ? "" : evaluation.trace.join(" | "),
      inherit_only: rule?.inherit_only === true,
      blank_operational_instrument_only: rule?.blank_operational_instrument_only === true,
      review_ready_template: template.review_ready_template === true,
      requires_local_counsel_review: template.requires_local_counsel_review === true,
      ...bindings
    });
  });
  if (errors.length) throw new Error(`DOCUMENT_ACTIVATION_MANIFEST_INVALID:${errors.join("|")}`);

  return {
    artifact_type: "document_activation_manifest",
    artifact_version: "phase14_document_activation_manifest.v1",
    compiler_version: QUALIFIED_REVIEW_SUBMISSION_COMPILER_VERSION,
    run_id: run.run_id,
    status: "LOCKED",
    immutable: true,
    no_document_assembly: true,
    document_registry_id: documentRegistryId,
    active_registry_ids: [...activeRegistryIds],
    active_scope_states: Object.fromEntries(scopeStates),
    documents,
    counts: {
      template_document_count: documents.length,
      active_document_count: documents.filter((document) => document.status === "ACTIVE").length,
      suppressed_document_count: documents.filter((document) => document.status === "SUPPRESSED").length,
      active_placeholder_count: documents.reduce((sum, document) => sum + document.placeholder_bindings.length, 0),
      active_clause_action_count: documents.reduce((sum, document) => sum + document.clause_actions.length, 0)
    },
    review_ready_boundary: {
      ...reviewReadyBoundary(),
      qr_control_schedule_must_be_removed_from_final_draft: true
    }
  };
}

function buildDocumentBindings({ documentId, finalFields, errors }) {
  const placeholderByToken = new Map();
  const clauseActions = [];
  const actionTokens = [];
  for (const field of finalFields) {
    if (field.not_applicable) continue;
    for (const binding of field.document_bindings || []) {
      if (binding.document_id !== documentId) continue;
      for (const [atomicKey, token] of Object.entries(binding.value_placeholders || binding.placeholders || {})) {
        const value = field.final_atomic_values[atomicKey];
        if (!hasMaterialValue(value)) errors.push(`ACTIVE_DOCUMENT_PLACEHOLDER_VALUE_MISSING:${documentId}:${field.qr_field_id}:${atomicKey}`);
        if (placeholderByToken.has(token) && !sameValue(placeholderByToken.get(token).value, value)) errors.push(`ACTIVE_DOCUMENT_PLACEHOLDER_VALUE_CONFLICT:${documentId}:${token}`);
        placeholderByToken.set(token, { token, qr_field_id: field.qr_field_id, atomic_key: atomicKey, value, source: field.atomic_sources[atomicKey] });
      }
      if ((binding.actions || []).includes("SELECT_CLAUSE")) clauseActions.push({ qr_field_id: field.qr_field_id, target: binding.document_target || binding.target || "", final_atomic_values: field.final_atomic_values });
      if (binding.action_token) actionTokens.push({ qr_field_id: field.qr_field_id, token: binding.action_token });
    }
  }
  return { placeholder_bindings: [...placeholderByToken.values()], clause_actions: clauseActions, action_tokens: actionTokens, unresolved_qr_placeholder_count: 0 };
}

function evaluateActivationRule(rule, context) {
  const all = Array.isArray(rule.all) ? rule.all.map((condition) => evaluateCondition(condition, context)) : [];
  const any = Array.isArray(rule.any) ? rule.any.map((condition) => evaluateCondition(condition, context)) : [];
  return {
    matched: all.every((row) => row.matched) && (!any.length || any.some((row) => row.matched)),
    trace: [...all.map((row) => `ALL:${row.expression}:${row.matched}`), ...any.map((row) => `ANY:${row.expression}:${row.matched}`)]
  };
}

function evaluateCondition(rawCondition, context) {
  const expression = String(rawCondition || "").trim();
  let match = expression.match(/^([A-Za-z0-9_]+)\s*==\s*(true|false)$/i);
  if (match) return conditionResult(expression, Boolean(resolveVariable(match[1], context)) === (match[2].toLowerCase() === "true"));
  match = expression.match(/^([A-Za-z0-9_]+)\s*>\s*(-?\d+(?:\.\d+)?)$/i);
  if (match) return conditionResult(expression, Number(resolveVariable(match[1], context)) > Number(match[2]));
  match = expression.match(/^([A-Za-z0-9_]+)\s+is\s+not\s+empty$/i);
  if (match) return conditionResult(expression, hasMaterialValue(resolveVariable(match[1], context)));
  match = expression.match(/^([A-Za-z0-9_]+)\s+includes\s+(.+)$/i);
  if (match) {
    const haystack = serializeValue(resolveVariable(match[1], context)).toLowerCase();
    const candidates = match[2].split(/\s+or\s+/i).map((value) => value.trim().toLowerCase()).filter(Boolean);
    return conditionResult(expression, candidates.some((candidate) => haystack.includes(candidate)));
  }
  throw new Error(`DOCUMENT_ACTIVATION_EXPRESSION_UNSUPPORTED:${expression || "missing"}`);
}

function resolveVariable(name, context) {
  if (Object.prototype.hasOwnProperty.call(context, name)) return context[name];
  const field = context.fields[name];
  if (!field || field.not_applicable) return null;
  const values = Object.values(field.final_atomic_values || {});
  return values.length === 1 ? values[0] : field.final_atomic_values;
}

function summarizeFinalFields(finalFields, suppressedActivationDecisions) {
  const sources = finalFields.flatMap((field) => Object.values(field.atomic_sources || {}));
  return {
    final_field_count: finalFields.length,
    final_atomic_value_count: finalFields.reduce((sum, field) => sum + Object.keys(field.final_atomic_values || {}).length, 0),
    not_applicable_field_count: finalFields.filter((field) => field.not_applicable).length,
    reviewer_edited_atomic_count: sources.filter((source) => source === "REVIEWER_EDIT").length,
    reviewer_attested_phase12_atomic_count: sources.filter((source) => source === "REVIEWER_ATTESTED_PHASE_12").length,
    reviewer_attested_market_based_atomic_count: sources.filter((source) => source === "REVIEWER_ATTESTED_MARKET_BASED").length,
    suppressed_activation_decision_count: suppressedActivationDecisions.length
  };
}

function finalSource({ edit, reviewerHasValue, sourceRecord, value }) {
  if (edit?.not_applicable === true) return "REVIEWER_NOT_APPLICABLE";
  if (edit?.confirmed_activation_probe === true) return "REVIEWER_CONFIRMED_ACTIVATION_PROBE";
  if (reviewerHasValue && !sameValue(value, sourceRecord?.value)) return "REVIEWER_EDIT";
  return `REVIEWER_ATTESTED_${sourceRecord?.source || "UNRESOLVED"}`;
}

function reviewReadyBoundary() {
  return { legal_architect_not_law_firm: true, review_ready_draft_only: true, local_counsel_review_required: true, not_legal_advice: true };
}
function withImmutableHash(body) { return freezeImmutableArtifact({ ...body, immutable_hash: hashImmutableArtifact(body) }); }
function emptyDocumentBindings() { return { placeholder_bindings: [], clause_actions: [], action_tokens: [], unresolved_qr_placeholder_count: 0 }; }
function conditionResult(expression, matched) { return { expression, matched: Boolean(matched) }; }
function serializeValue(value) { return typeof value === "string" ? value : JSON.stringify(value ?? ""); }
function sameValue(left, right) { return JSON.stringify(left) === JSON.stringify(right); }
function hasMaterialValue(value) {
  if (value === false || value === 0) return true;
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(hasMaterialValue);
  if (typeof value === "object") return Object.values(value).some(hasMaterialValue);
  return true;
}
