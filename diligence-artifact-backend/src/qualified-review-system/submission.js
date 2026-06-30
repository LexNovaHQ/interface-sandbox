import { saveJsonArtifactToDrive } from "../drive.js";
import { getNextArtifactVersion, saveArtifactMetadata, logEvent, updateRunRecord } from "../firestore.js";
import { nowIso } from "../run-id.js";

export const QUALIFIED_REVIEW_SUBMISSION_ARTIFACT = "qualified_review_submission";
export const QUALIFIED_REVIEW_SUBMISSION_PHASE = "QUALIFIED_REVIEW_SUBMISSION";
export const QUALIFIED_REVIEW_SUBMISSION_ACTOR = "qualified_review_system";
export const QUALIFIED_REVIEW_SUBMISSION_VERSION = "qualified_review_submission_v1";

const ALLOWED_STATES = Object.freeze(["confirmed", "edited", "not_applicable"]);

export async function saveQualifiedReviewSubmission({ run, handoff = {}, renderer_payload = {}, request_body = {} } = {}) {
  const submission = buildQualifiedReviewSubmission({ run, handoff, renderer_payload, request_body });
  const version = await getNextArtifactVersion(run.run_id, QUALIFIED_REVIEW_SUBMISSION_ARTIFACT).catch(() => 1);
  const drive = await saveJsonArtifactToDrive({
    run_id: run.run_id,
    artifact_name: QUALIFIED_REVIEW_SUBMISSION_ARTIFACT,
    version,
    drive_folder_id: run.drive_folder_id,
    artifact: submission
  });
  const meta = await saveArtifactMetadata({
    run_id: run.run_id,
    artifact_name: QUALIFIED_REVIEW_SUBMISSION_ARTIFACT,
    phase: QUALIFIED_REVIEW_SUBMISSION_PHASE,
    agent_id: QUALIFIED_REVIEW_SUBMISSION_ACTOR,
    lock_status: submission.final_gate.status === "PASS" ? "LOCKED" : "LOCKED_WITH_LIMITATIONS",
    version,
    drive_file_id: drive.drive_file_id,
    drive_web_view_link: drive.drive_web_view_link,
    drive_folder_id: run.drive_folder_id,
    artifact_size_bytes: drive.artifact_size_bytes || 0
  });
  await updateRunRecord(run.run_id, {
    qualified_review_submission_status: submission.final_gate.status,
    qualified_review_submission_version: version,
    qualified_review_submission_saved_at: submission.submitted_at,
    qualified_review_submission_artifact: QUALIFIED_REVIEW_SUBMISSION_ARTIFACT
  });
  await logEvent({
    run_id: run.run_id,
    event_type: "QUALIFIED_REVIEW_SUBMISSION_SAVED",
    actor: QUALIFIED_REVIEW_SUBMISSION_ACTOR,
    payload: {
      artifact_name: QUALIFIED_REVIEW_SUBMISSION_ARTIFACT,
      version,
      final_gate_status: submission.final_gate.status,
      submitted_response_count: submission.submitted_response_count,
      blocking_error_count: submission.validation.blocking_errors.length
    }
  });
  return { ok: true, artifact_name: QUALIFIED_REVIEW_SUBMISSION_ARTIFACT, version, final_gate_status: submission.final_gate.status, validation: submission.validation, drive_file_id: meta.drive_file_id, drive_web_view_link: meta.drive_web_view_link, submission };
}

export function buildQualifiedReviewSubmission({ run = {}, handoff = {}, renderer_payload = {}, request_body = {} } = {}) {
  const questionHandoff = handoff.question_handoff || {};
  const questions = Array.isArray(questionHandoff.questions) ? questionHandoff.questions : [];
  const submittedRows = Array.isArray(request_body.question_responses) ? request_body.question_responses : Array.isArray(request_body.responses) ? request_body.responses : [];
  const receivedAt = nowIso();
  const submittedBy = cleanText(request_body.submitted_by || "public_qualified_review_ui");
  const submittedByLabel = cleanText(request_body.submitted_by_label || "Public Qualified Review UI");
  const responseIndex = indexSubmittedRows(submittedRows);
  const duplicateIds = duplicateQuestionIds(submittedRows);
  const blockingErrors = [];
  const warnings = [];

  if (!questions.length) blockingErrors.push("QUESTION_HANDOFF_MISSING_OR_EMPTY");
  if (questions.length && handoff.question_count !== questions.length) blockingErrors.push(`QUESTION_COUNT_MISMATCH:${handoff.question_count || "missing"}:${questions.length}`);
  duplicateIds.forEach((id) => blockingErrors.push(`DUPLICATE_RESPONSE:${id}`));

  const questionResponses = questions.map((question) => {
    const submitted = responseIndex.get(question.question_id) || null;
    const row = materializeResponseRow({ question, submitted, receivedAt });
    row.validation_errors.forEach((error) => blockingErrors.push(`${question.question_id}:${error}`));
    row.validation_warnings.forEach((warning) => warnings.push(`${question.question_id}:${warning}`));
    return row;
  });

  for (const submitted of submittedRows) {
    const id = cleanText(submitted?.question_id);
    if (id && !questions.some((question) => question.question_id === id)) blockingErrors.push(`UNKNOWN_RESPONSE:${id}`);
  }

  const resolvedCount = questionResponses.filter((row) => row.resolved_for_final_gate).length;
  const finalGateStatus = questions.length === 79 && resolvedCount === questions.length && blockingErrors.length === 0 ? "PASS" : "INCOMPLETE";
  const assemblerInput = buildAssemblerInput({ finalGateStatus, questionResponses });

  return {
    artifact_type: QUALIFIED_REVIEW_SUBMISSION_ARTIFACT,
    artifact_version: QUALIFIED_REVIEW_SUBMISSION_VERSION,
    run_id: run.run_id || handoff.run_id || renderer_payload.run_id || "UNKNOWN_RUN",
    target: run.target || handoff.target || renderer_payload.target || "Target not specified",
    target_url: run.root_url || run.target_url || handoff.target_url || renderer_payload.target_url || "Target URL not specified",
    source_handoff_ref: "qualified_review_handoff",
    source_renderer_ref: "qualified_review_renderer_payload",
    matrix_version: handoff.matrix_version || renderer_payload.matrix_version || questionHandoff.handoff_version || "",
    submitted_at: receivedAt,
    submitted_by: submittedBy,
    submitted_by_label: submittedByLabel,
    submitted_response_count: submittedRows.length,
    emitted_question_response_count: questionResponses.length,
    expected_question_count: 79,
    final_gate: {
      status: finalGateStatus,
      ready_for_assembly: finalGateStatus === "PASS",
      required_question_count: questions.length,
      resolved_question_count: resolvedCount,
      unresolved_question_count: Math.max(0, questions.length - resolvedCount),
      allowed_terminal_states: ALLOWED_STATES
    },
    validation: {
      status: finalGateStatus,
      validator_name: "QUALIFIED_REVIEW_SUBMISSION_VALIDATOR_V1",
      blocking_errors: blockingErrors,
      warnings
    },
    question_responses: questionResponses,
    assembler_input: assemblerInput,
    boundary: {
      all_answers_reviewer_confirmed_or_marked_na_required: true,
      demo_prefill_is_not_evidence: true,
      confirmed_answer_overrides_prefill_for_assembly: true,
      assembler_must_check_final_gate_pass: true
    }
  };
}

function materializeResponseRow({ question, submitted, receivedAt }) {
  const errors = [];
  const warnings = [];
  const answerState = normalizeState(submitted?.answer_state || submitted?.state || "");
  const answerValue = cleanAnswer(submitted?.answer_value ?? submitted?.value ?? submitted?.reviewer_answer ?? "");
  const destinationPath = question.vault_payload_path || question.qualified_review_path || question.canonical_path || "";
  const hasSubmission = Boolean(submitted);

  if (!hasSubmission) errors.push("RESPONSE_MISSING");
  if (hasSubmission && !ALLOWED_STATES.includes(answerState)) errors.push(`INVALID_ANSWER_STATE:${answerState || "missing"}`);
  if (hasSubmission && answerState !== "not_applicable" && !hasMeaningfulAnswer(answerValue)) errors.push("ANSWER_VALUE_REQUIRED");
  if (answerState === "not_applicable" && !cleanText(submitted?.not_applicable_reason || submitted?.reason || "")) warnings.push("NOT_APPLICABLE_REASON_MISSING");
  if (question.prefill_source === "market_norm_demo" && submitted?.demo_disclaimer_accepted !== true) warnings.push("DEMO_DISCLAIMER_NOT_EXPLICITLY_ACCEPTED");
  if (question.section_id === "india_privacy_cyber" && question.writes_to_vault_payload === true) errors.push("INDIA_ROW_CANNOT_WRITE_TO_VAULT_PAYLOAD");

  const resolved = hasSubmission && ALLOWED_STATES.includes(answerState) && (answerState === "not_applicable" || hasMeaningfulAnswer(answerValue));
  return {
    question_id: question.question_id,
    question_number: question.question_number,
    section_id: question.section_id,
    section_title: question.section_title,
    field_key: question.field_key,
    lawyer_question: question.lawyer_question || question.public_question_label || "",
    answer_type: question.answer_type,
    answer_options: Array.isArray(question.answer_options) ? question.answer_options : [],
    answer_state: answerState || "missing",
    answer_value: answerState === "not_applicable" ? null : answerValue,
    not_applicable_reason: cleanText(submitted?.not_applicable_reason || submitted?.reason || ""),
    source_prefill_value: question.suggested_answer || question.initial_answer_value || question.demo_prefill_value || "",
    prefill_source: question.prefill_source,
    evidence_status: question.evidence_status,
    source_artifacts_present: Array.isArray(question.source_artifacts_present) ? question.source_artifacts_present : [],
    source_field_hints: Array.isArray(question.source_field_hints) ? question.source_field_hints : [],
    destination: question.writes_to_vault_payload ? "vault_payload" : "qualified_review",
    destination_path: destinationPath,
    vault_payload_path: question.vault_payload_path || null,
    qualified_review_path: question.qualified_review_path || null,
    document_impact: Array.isArray(question.document_impact) ? question.document_impact : [],
    demo_disclaimer_required: question.demo_disclaimer_required === true,
    demo_disclaimer_accepted: submitted?.demo_disclaimer_accepted === true,
    resolved_for_final_gate: resolved && errors.length === 0,
    submitted_at: cleanText(submitted?.submitted_at || receivedAt),
    validation_errors: errors,
    validation_warnings: warnings
  };
}

function buildAssemblerInput({ finalGateStatus, questionResponses }) {
  const routes = {};
  for (const row of questionResponses) {
    if (!row.destination_path) continue;
    routes[row.destination_path] = {
      question_id: row.question_id,
      field_key: row.field_key,
      answer_state: row.answer_state,
      answer_value: row.answer_value,
      prefill_source: row.prefill_source,
      evidence_status: row.evidence_status,
      document_impact: row.document_impact,
      ready_for_assembly: row.resolved_for_final_gate
    };
  }
  return {
    artifact_name: QUALIFIED_REVIEW_SUBMISSION_ARTIFACT,
    final_gate_status: finalGateStatus,
    ready_for_assembly: finalGateStatus === "PASS",
    routes_by_destination_path: routes,
    question_response_index: Object.fromEntries(questionResponses.map((row) => [row.question_id, { destination_path: row.destination_path, answer_state: row.answer_state, answer_value: row.answer_value, ready_for_assembly: row.resolved_for_final_gate }]))
  };
}

function indexSubmittedRows(rows) {
  const map = new Map();
  for (const row of rows) {
    const id = cleanText(row?.question_id);
    if (!id || map.has(id)) continue;
    map.set(id, row);
  }
  return map;
}

function duplicateQuestionIds(rows) {
  const seen = new Set();
  const dupes = new Set();
  for (const row of rows) {
    const id = cleanText(row?.question_id);
    if (!id) continue;
    if (seen.has(id)) dupes.add(id);
    seen.add(id);
  }
  return [...dupes];
}

function normalizeState(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "_");
}

function cleanAnswer(value) {
  if (Array.isArray(value)) return value.map((item) => cleanText(item)).filter(Boolean);
  if (value && typeof value === "object") return value;
  return cleanText(value);
}

function cleanText(value) {
  return String(value ?? "").trim().slice(0, 20000);
}

function hasMeaningfulAnswer(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return Boolean(String(value ?? "").trim());
}
