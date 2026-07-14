import { createHash } from "node:crypto";
import { saveJsonArtifactToDrive, readJsonArtifactFromDrive } from "./storage/drive.service.js";
import { getArtifactMetadata, getNextArtifactVersion, saveArtifactMetadata, logEvent, updateRunRecord } from "./storage/firestore.service.js";
import { nowIso } from "../utils/run-id.js";

export const QUALIFIED_REVIEW_DRAFT_ARTIFACT = "qualified_review_draft";
export const QUALIFIED_REVIEW_SUBMISSION_REQUEST_ARTIFACT = "qualified_review_submission_request";
export const QUALIFIED_REVIEW_DRAFT_VERSION = "phase13_qualified_review_draft.v1";

export async function readQualifiedReviewDraft(runId) {
  try {
    const meta = await getArtifactMetadata(runId, QUALIFIED_REVIEW_DRAFT_ARTIFACT);
    return await readJsonArtifactFromDrive(meta.drive_file_id);
  } catch (error) {
    if (String(error?.message || error).startsWith(`ARTIFACT_NOT_FOUND:${runId}:${QUALIFIED_REVIEW_DRAFT_ARTIFACT}`)) return emptyDraft(runId);
    throw error;
  }
}

export async function saveQualifiedReviewDraft({ run, handoff, request_body = {} } = {}) {
  const current = await readQualifiedReviewDraft(run.run_id);
  const draft = mergeDraft({ run, handoff, current, request_body });
  return persistArtifact({ run, artifact_name: QUALIFIED_REVIEW_DRAFT_ARTIFACT, artifact: draft, lock_status: "RUNNING", event_type: "QUALIFIED_REVIEW_DRAFT_SAVED" });
}

export async function attestQualifiedReviewSection({ run, handoff, section_id, request_body = {} } = {}) {
  const current = await readQualifiedReviewDraft(run.run_id);
  const section = sectionById(handoff, section_id);
  const attest = request_body.attested !== false;
  const next = structuredClone(current);
  next.field_edits ||= {};
  next.section_attestations ||= {};
  const confirmedProbeIds = [];
  if (!attest) delete next.section_attestations[section_id];
  else {
    for (const probeId of section.activation_probe_field_ids || []) {
      const field = (section.fields || []).find((row) => row.qr_field_id === probeId);
      if (!field || next.field_edits[probeId]) continue;
      next.field_edits[probeId] = {
        atomic_values: structuredClone(field.proposed_value || {}),
        baseline_value: structuredClone(field.proposed_value || {}),
        limitation: "",
        not_applicable: false,
        review_status: "SECTION_ATTESTED_PROBE",
        confirmed_activation_probe: true
      };
      confirmedProbeIds.push(probeId);
    }
    next.section_attestations[section_id] = {
      status: "ATTESTED",
      confirmation_unit: "SECTION",
      field_state_hash: section.attestation?.field_state_hash || "",
      reviewer_identity: clean(request_body.reviewer_identity || request_body.attested_by || "public_qualified_review_ui"),
      attested_at: nowIso(),
      activation_probe_field_ids_confirmed: confirmedProbeIds
    };
  }
  next.revision = Number(current.revision || 0) + 1;
  next.updated_at = nowIso();
  next.validation = validateDraft({ handoff, draft: next });
  return persistArtifact({ run, artifact_name: QUALIFIED_REVIEW_DRAFT_ARTIFACT, artifact: next, lock_status: "RUNNING", event_type: attest ? "QUALIFIED_REVIEW_SECTION_ATTESTED" : "QUALIFIED_REVIEW_SECTION_ATTESTATION_REMOVED" });
}

export async function createQualifiedReviewSubmissionRequest({ run, handoff, draft } = {}) {
  const validation = validateDraft({ handoff, draft, require_complete: true });
  if (validation.blocking_errors.length) throw new Error(`QUALIFIED_REVIEW_SUBMISSION_NOT_READY:${validation.blocking_errors.join("|")}`);
  const request = {
    artifact_type: QUALIFIED_REVIEW_SUBMISSION_REQUEST_ARTIFACT,
    artifact_version: "phase13_qualified_review_submission_request.v1",
    run_id: run.run_id,
    target: run.target || handoff.target || "",
    target_url: run.root_url || handoff.target_url || "",
    status: "READY_FOR_SUBMISSION_COMPILER",
    requested_at: nowIso(),
    requested_by: draft.reviewer?.identity || "public_qualified_review_ui",
    source_handoff_version: handoff.artifact_version,
    source_draft_revision: draft.revision,
    confirmation_unit: "SECTION",
    per_question_confirmation_forbidden: true,
    field_edits: draft.field_edits || {},
    section_attestations: draft.section_attestations || {},
    validation
  };
  const saved = await persistArtifact({ run, artifact_name: QUALIFIED_REVIEW_SUBMISSION_REQUEST_ARTIFACT, artifact: request, lock_status: "LOCKED", event_type: "QUALIFIED_REVIEW_SUBMISSION_REQUESTED", phase: "QUALIFIED_REVIEW_SUBMISSION" });
  await updateRunRecord(run.run_id, {
    current_phase: "QUALIFIED_REVIEW_SUBMISSION",
    status: "SUBMISSION_REQUESTED",
    central_phase: "QUALIFIED_REVIEW_SUBMISSION",
    central_phase_label: "Qualified Review Submission",
    active_internal_job: "QUALIFIED_REVIEW_SUBMISSION",
    runner_state: "IDLE",
    runner_auto_continue: false,
    qualified_review_submission_request_version: saved.version,
    qualified_review_submission_requested_at: request.requested_at
  });
  return saved;
}

export function mergeDraft({ run = {}, handoff = {}, current = {}, request_body = {} } = {}) {
  const allowed = fieldIndex(handoff);
  const incoming = request_body.field_edits || request_body.fields || {};
  const next = structuredClone(current?.artifact_type ? current : emptyDraft(run.run_id));
  next.field_edits ||= {};
  next.section_attestations ||= {};
  const changedSections = new Set();
  for (const [fieldId, raw] of Object.entries(incoming)) {
    const field = allowed.get(fieldId);
    if (!field) throw new Error(`QUALIFIED_REVIEW_DRAFT_UNKNOWN_FIELD:${fieldId}`);
    const existingEdit = next.field_edits[fieldId] || null;
    const normalized = normalizeFieldEdit(raw, field);
    const nextEdit = nextEditRecord({ normalized, field, existingEdit, clearEdit: raw?.clear_edit === true });
    const before = JSON.stringify(existingEdit);
    const after = JSON.stringify(nextEdit);
    if (before !== after) changedSections.add(field.section_id);
    if (nextEdit) next.field_edits[fieldId] = nextEdit;
    else delete next.field_edits[fieldId];
  }
  for (const sectionId of changedSections) delete next.section_attestations[sectionId];
  next.reviewer = {
    identity: clean(request_body.reviewer_identity || next.reviewer?.identity || "public_qualified_review_ui"),
    label: clean(request_body.reviewer_label || next.reviewer?.label || "Qualified Review reviewer")
  };
  next.revision = Number(current.revision || 0) + 1;
  next.updated_at = nowIso();
  next.changed_section_ids = [...changedSections];
  next.validation = validateDraft({ handoff, draft: next });
  return next;
}

export function validateDraft({ handoff = {}, draft = {}, require_complete = false } = {}) {
  const blocking_errors = [];
  const warnings = [];
  const sections = Array.isArray(handoff.sections) ? handoff.sections : [];
  const fieldIds = new Set(sections.flatMap((section) => section.fields || []).map((field) => field.qr_field_id));
  for (const id of Object.keys(draft.field_edits || {})) if (!fieldIds.has(id)) blocking_errors.push(`UNKNOWN_FIELD_EDIT:${id}`);
  for (const section of sections) {
    const attestation = draft.section_attestations?.[section.section_id];
    if (attestation && attestation.field_state_hash !== section.attestation?.field_state_hash) blocking_errors.push(`STALE_SECTION_ATTESTATION:${section.section_id}`);
    if (require_complete && (!attestation || attestation.status !== "ATTESTED")) blocking_errors.push(`SECTION_ATTESTATION_REQUIRED:${section.section_id}`);
  }
  if (require_complete && (handoff.registry_resolution?.unresolved_activation_probe_field_ids || []).length) blocking_errors.push("ACTIVATION_PROBES_UNRESOLVED");
  return {
    status: blocking_errors.length ? "INCOMPLETE" : "PASS",
    blocking_errors,
    warnings,
    active_section_count: sections.length,
    attested_section_count: sections.filter((section) => draft.section_attestations?.[section.section_id]?.status === "ATTESTED").length
  };
}

function normalizeFieldEdit(raw = {}, field = {}) {
  const atomicValues = {};
  const hasScalarValue = Object.prototype.hasOwnProperty.call(raw, "value");
  const incoming = raw.atomic_values && typeof raw.atomic_values === "object" ? raw.atomic_values : hasScalarValue && field.atomic_fields?.length === 1 ? { [field.atomic_fields[0].atomic_key]: raw.value } : raw;
  for (const atomic of field.atomic_fields || []) {
    if (Object.prototype.hasOwnProperty.call(incoming, atomic.atomic_key)) atomicValues[atomic.atomic_key] = incoming[atomic.atomic_key];
  }
  return {
    atomic_values: atomicValues,
    limitation: clean(raw.limitation || raw.reviewer_limitation || ""),
    not_applicable: raw.not_applicable === true,
    review_status: raw.not_applicable === true ? "NOT_APPLICABLE" : Object.keys(atomicValues).length || raw.limitation ? "EDITED" : "UNCHANGED"
  };
}

function nextEditRecord({ normalized, field, existingEdit, clearEdit }) {
  if (clearEdit) return null;
  const baseline = structuredClone(existingEdit?.baseline_value || field.proposed_value || {});
  if (existingEdit?.confirmed_activation_probe === true) {
    return {
      ...normalized,
      baseline_value: baseline,
      confirmed_activation_probe: true,
      review_status: normalized.not_applicable ? "NOT_APPLICABLE" : "SECTION_ATTESTED_PROBE"
    };
  }
  if (matchesBaseline(normalized, baseline)) return null;
  return { ...normalized, baseline_value: baseline };
}
function matchesBaseline(edit, baseline) {
  if (edit.not_applicable || edit.limitation) return false;
  return sameValue(edit.atomic_values || {}, baseline || {});
}
function sameValue(left, right) { return JSON.stringify(left) === JSON.stringify(right); }
function fieldIndex(handoff) {
  const map = new Map();
  for (const section of handoff.sections || []) for (const field of section.fields || []) map.set(field.qr_field_id, field);
  return map;
}
function sectionById(handoff, id) { const section = (handoff.sections || []).find((row) => row.section_id === id); if (!section) throw new Error(`QUALIFIED_REVIEW_SECTION_UNKNOWN:${id}`); return section; }
function emptyDraft(runId) { return { artifact_type: QUALIFIED_REVIEW_DRAFT_ARTIFACT, artifact_version: QUALIFIED_REVIEW_DRAFT_VERSION, run_id: runId, revision: 0, field_edits: {}, section_attestations: {}, reviewer: {}, created_at: nowIso(), updated_at: nowIso(), validation: { status: "INCOMPLETE", blocking_errors: [], warnings: [] } }; }
function clean(value) { return String(value ?? "").trim().slice(0, 20000); }

async function persistArtifact({ run, artifact_name, artifact, lock_status, event_type, phase = "QUALIFIED_REVIEW" }) {
  const version = await getNextArtifactVersion(run.run_id, artifact_name).catch(() => 1);
  const drive = await saveJsonArtifactToDrive({ run_id: run.run_id, artifact_name, version, drive_folder_id: run.drive_folder_id, artifact });
  const meta = await saveArtifactMetadata({ run_id: run.run_id, artifact_name, phase, agent_id: "qualified_review_system", lock_status, version, drive_file_id: drive.drive_file_id, drive_web_view_link: drive.drive_web_view_link, drive_folder_id: run.drive_folder_id, artifact_size_bytes: drive.artifact_size_bytes || 0 });
  await logEvent({ run_id: run.run_id, event_type, actor: "qualified_review_system", payload: { artifact_name, version, status: artifact.status || artifact.validation?.status || "" } });
  return { ok: true, artifact_name, version, drive_file_id: meta.drive_file_id, drive_web_view_link: meta.drive_web_view_link, artifact };
}

export function hashDraftState(value) { return createHash("sha256").update(JSON.stringify(value || {})).digest("hex"); }
