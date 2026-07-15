import { createHash } from "node:crypto";

export const QUALIFIED_REVIEW_PRESENTATION_VERSION = "phase13_qualified_review_presentation.v1";

export function buildQualifiedReviewPresentation({ run = {}, phase13 = {} } = {}) {
  const ledger = phase13.qr_active_field_ledger || {};
  const resolution = phase13.qr_registry_resolution_manifest || {};
  const fields = Array.isArray(ledger.active_fields) ? ledger.active_fields : [];
  const fieldById = new Map(fields.map((field) => [field.qr_field_id, field]));
  const sections = (Array.isArray(ledger.sections) ? ledger.sections : []).map((section, index) => {
    const sectionFields = (section.field_ids || []).map((id) => fieldById.get(id)).filter(Boolean).map(presentationField);
    return {
      section_id: section.section_id,
      section_number: index + 1,
      section_title: section.section_title,
      registry_scope: section.registry_scope,
      lane: section.lane,
      operator_task: section.operator_task,
      field_count: sectionFields.length,
      atomic_value_count: section.atomic_value_count || sectionFields.reduce((sum, field) => sum + field.atomic_fields.length, 0),
      activation_probe_field_ids: section.activation_probe_field_ids || [],
      attestation_required: true,
      attestation: {
        status: "PENDING",
        confirmation_unit: "SECTION",
        per_question_confirmation_forbidden: true,
        field_state_hash: sectionStateHash(sectionFields),
        reviewer_identity: null,
        attested_at: null
      },
      fields: sectionFields
    };
  });

  const validation = validatePresentation({ ledger, resolution, fields, sections });
  const status = validation.errors.length ? "CONTROLLED_FAILURE" : validation.warnings.length ? "LOCKED_WITH_LIMITATIONS" : "LOCKED";
  const handoff = {
    artifact_type: "qualified_review_handoff",
    artifact_version: "phase13_qualified_review_handoff.v1",
    presentation_version: QUALIFIED_REVIEW_PRESENTATION_VERSION,
    run_id: run.run_id || "UNKNOWN_RUN",
    target: run.target || "Target not specified",
    target_url: run.root_url || run.target_url || "",
    status,
    public_label: "Qualified Review",
    qualified_review_is_separate_system: true,
    shares_pipeline_run_id: true,
    no_document_assembly: true,
    confirmation_unit: "SECTION",
    per_question_confirmation_forbidden: true,
    source_ledger_ref: "qr_active_field_ledger",
    source_registry_resolution_ref: "qr_registry_resolution_manifest",
    registry_resolution: {
      active_registry_ids: resolution.active_registry_ids || [],
      unresolved_activation_probe_field_ids: resolution.unresolved_activation_probe_field_ids || []
    },
    counts: {
      active_section_count: sections.length,
      active_field_count: fields.length,
      active_atomic_value_count: ledger.counts?.active_atomic_value_count || 0,
      unresolved_activation_probe_count: resolution.counts?.unresolved_activation_probe_count || 0
    },
    sections,
    submission_policy: {
      all_active_sections_must_be_attested: true,
      field_edit_resets_section_attestation: true,
      activation_probes_must_be_resolved: true,
      immutable_submission_compiled_in_phase13_submission_job: true
    },
    review_ready_boundary: {
      legal_architect_not_law_firm: true,
      review_ready_draft_only: true,
      local_counsel_review_required: true,
      not_legal_advice: true
    }
  };

  const renderer = {
    artifact_type: "qualified_review_renderer_payload",
    artifact_version: "phase13_qualified_review_renderer_payload.v1",
    renderer_type: "qualified_review_renderer_payload",
    renderer_version: "phase13_section_attestation_renderer.v1",
    run_id: handoff.run_id,
    target: handoff.target,
    target_url: handoff.target_url,
    public_label: handoff.public_label,
    ui_route: "qualified-review.html?run_id={run_id}",
    qualified_review_is_separate_system: true,
    shares_pipeline_run_id: true,
    no_document_assembly: true,
    confirmation_unit: "SECTION",
    per_question_confirmation_forbidden: true,
    sections,
    fields,
    render_contract: {
      read_artifact: "qualified_review_renderer_payload",
      handoff_artifact: "qualified_review_handoff",
      active_ledger_artifact: "qr_active_field_ledger",
      section_wizard: true,
      editable_atomic_values: true,
      limitation_notes: true,
      not_applicable_control: true,
      section_attestation: true,
      field_edit_resets_section_attestation: true,
      save_draft_state: true,
      final_submission_request: true,
      no_document_assembly: true,
      market_based_badge: "{MARKET BASED}",
      diligence_badge: "DILIGENCE DERIVED"
    },
    summary_counts: handoff.counts,
    unresolved_activation_probe_field_ids: resolution.unresolved_activation_probe_field_ids || [],
    submission_policy: handoff.submission_policy,
    review_ready_boundary: handoff.review_ready_boundary
  };

  return {
    qualified_review_handoff: Object.freeze(handoff),
    qualified_review_renderer_payload: Object.freeze(renderer),
    qualified_review_validation_manifest: Object.freeze({
      artifact_type: "qualified_review_validation_manifest",
      artifact_version: "phase13_qualified_review_validation_manifest.v1",
      validator_version: QUALIFIED_REVIEW_PRESENTATION_VERSION,
      status: validation.errors.length ? "FAIL" : validation.warnings.length ? "PASS_WITH_WARNINGS" : "PASS",
      phase_lock_status: status,
      errors: validation.errors,
      warnings: validation.warnings,
      counts: handoff.counts,
      confirmation_unit: "SECTION",
      per_question_confirmation_forbidden: true
    })
  };
}

function presentationField(field = {}) {
  const atomic = Object.entries(field.atomic_values || {}).map(([key, record]) => ({
    atomic_key: key,
    value: record?.value,
    source: record?.source || "UNRESOLVED",
    value_state: record?.value_state || "UNRESOLVED",
    demo_not_evidence: record?.demo_not_evidence === true,
    phase12_field_ids: record?.phase12_field_ids || [],
    route_ids: record?.route_ids || [],
    report_artifacts: record?.report_artifacts || []
  }));
  const sources = [...new Set(atomic.map((row) => row.source))];
  return {
    qr_field_id: field.qr_field_id,
    canonical_key: field.canonical_key,
    label: field.label,
    registry_id: field.registry_id,
    registry_scope: field.registry_scope,
    lane: field.lane,
    section_id: field.section_id,
    shape: field.shape,
    fillability: field.fillability,
    required_for_assembly: field.required_for_assembly === true,
    activation_probe: field.activation_probe === true,
    atomic_fields: atomic,
    proposed_value: Object.fromEntries(atomic.map((row) => [row.atomic_key, row.value])),
    source_badge: sources.includes("MARKET_BASED") ? sources.length > 1 ? "MIXED — INCLUDES {MARKET BASED}" : "{MARKET BASED}" : sources.includes("PHASE_12") ? "DILIGENCE DERIVED" : sources.includes("REVIEWER") ? "REVIEWER EDITED" : "UNRESOLVED",
    review_state: field.review_state || "UNCHANGED",
    limitation: field.limitation || "",
    not_applicable: field.not_applicable === true,
    document_impacts: (field.document_bindings || []).map((binding) => ({ document_id: binding.document_id, actions: binding.actions || [], target: binding.document_target || binding.target || "" })),
    ui: { ...(field.ui || {}), per_question_confirmation_required: false, section_attestation_controls_finality: true }
  };
}

export function sectionStateHash(fields = []) {
  const state = fields.map((field) => ({ qr_field_id: field.qr_field_id, proposed_value: field.proposed_value, limitation: field.limitation || "", not_applicable: field.not_applicable === true }));
  return createHash("sha256").update(JSON.stringify(state)).digest("hex");
}

function validatePresentation({ ledger, resolution, fields, sections }) {
  const errors = [];
  const warnings = [];
  const seen = new Set();
  for (const section of sections) {
    if (!section.section_id) errors.push("SECTION_ID_MISSING");
    if (section.attestation_required !== true || section.attestation?.confirmation_unit !== "SECTION") errors.push(`SECTION_ATTESTATION_INVALID:${section.section_id || "missing"}`);
    for (const field of section.fields) {
      if (seen.has(field.qr_field_id)) errors.push(`ACTIVE_FIELD_DUPLICATE:${field.qr_field_id}`);
      seen.add(field.qr_field_id);
      if (field.ui?.per_question_confirmation_required === true) errors.push(`PER_QUESTION_CONFIRMATION_FORBIDDEN:${field.qr_field_id}`);
      if (!field.document_impacts.length) errors.push(`ACTIVE_FIELD_DOCUMENT_IMPACT_MISSING:${field.qr_field_id}`);
    }
  }
  if (seen.size !== fields.length) errors.push(`ACTIVE_FIELD_COUNT_MISMATCH:${seen.size}:${fields.length}`);
  const suppressed = new Set(ledger.suppressed_field_ids || []);
  for (const id of seen) if (suppressed.has(id)) errors.push(`SUPPRESSED_FIELD_LEAK:${id}`);
  for (const id of resolution.unresolved_activation_probe_field_ids || []) if (!seen.has(id)) errors.push(`ACTIVATION_PROBE_NOT_RENDERED:${id}`);
  if ((resolution.unresolved_activation_probe_field_ids || []).length) warnings.push("ACTIVATION_PROBES_REQUIRE_REVIEW");
  return { errors, warnings };
}
