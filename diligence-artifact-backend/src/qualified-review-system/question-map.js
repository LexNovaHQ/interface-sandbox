import { asArray, safeObject, safeText } from "../report-safe-language.js";
import {
  QUALIFIED_REVIEW_MAP_VERSION,
  QUALIFIED_REVIEW_SECTION_MAP,
  QUALIFIED_REVIEW_QUESTIONS as CANONICAL_QUALIFIED_REVIEW_QUESTIONS
} from "./qualified-review-map.js";

export const QUALIFIED_REVIEW_QUESTION_MAP_VERSION = QUALIFIED_REVIEW_MAP_VERSION;

export const QUALIFIED_REVIEW_SECTIONS = Object.freeze(
  QUALIFIED_REVIEW_SECTION_MAP.map((section) => ({
    section_id: section.section_id,
    title: section.section_title,
    count: section.question_count
  }))
);

export const QUALIFIED_REVIEW_QUESTIONS = Object.freeze(
  CANONICAL_QUALIFIED_REVIEW_QUESTIONS.map(normalizeCanonicalQuestionDefinition)
);

export function buildQualifiedReviewQuestionHandoff({ run = {}, artifacts = {} } = {}) {
  const artifactBag = safeObject(artifacts);
  const questions = QUALIFIED_REVIEW_QUESTIONS.map((question) => materializeQuestion({ question, artifacts: artifactBag }));
  const sectionPages = QUALIFIED_REVIEW_SECTIONS.map((section) => {
    const sectionQuestions = questions.filter((question) => question.section_id === section.section_id);
    const prefilled = sectionQuestions.filter((question) => question.prefill_status === "DILIGENCE_PREFILL_CONFIRM" || question.prefill_status === "DEMO_PREFILL_CONFIRM").length;
    return {
      section_id: section.section_id,
      section_title: section.title,
      question_ids: sectionQuestions.map((question) => question.question_id),
      question_count: sectionQuestions.length,
      answered_count: prefilled,
      remaining_count: sectionQuestions.length,
      editable: true
    };
  });

  return {
    handoff_type: "qualified_review_question_handoff",
    handoff_version: QUALIFIED_REVIEW_QUESTION_MAP_VERSION,
    run_id: safeText(run.run_id, "UNKNOWN_RUN"),
    ui_mode: "SECTION_BY_SECTION_WIZARD",
    question_count: questions.length,
    sections: QUALIFIED_REVIEW_SECTIONS.map(({ section_id, title }) => ({ section_id, title })),
    progress_rail: sectionPages.map((page, index) => ({
      step: index + 1,
      section_id: page.section_id,
      label: page.section_title,
      question_count: page.question_count,
      status: "NEEDS_CONFIRMATION"
    })),
    section_pages: sectionPages,
    questions,
    warnings: questions.flatMap((question) => question.warnings)
  };
}

function normalizeCanonicalQuestionDefinition(question) {
  const backendMappings = asArray(question.backend_prefill_mapping);
  const sourceArtifacts = deriveSourceArtifacts(backendMappings);
  const isBackend = question.prefill_source === "backend_artifact";
  return Object.freeze({
    ...question,
    answer_options: normalizeAnswerOptions(question),
    evidence_mode: isBackend ? "backend_artifact" : "market_norm_demo",
    field_type: isBackend ? "diligence_prefilled" : "demo_market_norm_prefilled",
    source_artifacts: sourceArtifacts,
    source_field_hints: backendMappings,
    required_for_assembly: true,
    required_for_draft_preparation: true,
    assembly_blocker: true,
    review_status: "Needs confirmation",
    market_norm_helper: question.prefill_source === "market_norm_demo" ? question.demo_market_suggestion || question.helper_text : null,
    qualified_review_push_policy: {
      push_to_qualified_review_on_click: true,
      public_prefill_is_not_final: true,
      demo_prefill_is_not_evidence: true,
      preserve_original_evidence: true,
      confirmed_answer_overrides_prefill_for_draft_preparation: true
    }
  });
}

function normalizeAnswerOptions(question) {
  if (question.question_id === "QR-034") return Object.freeze(["Yes", "No", "Unclear"]);
  return Object.freeze(asArray(question.answer_options));
}

function deriveSourceArtifacts(mappings) {
  const roots = asArray(mappings).map((mapping) => String(mapping || "").split(".")[0]).filter(Boolean);
  const mapped = roots.map((root) => {
    if (root === "exposure_registry") return "exposure_registry_triggered_profile";
    return root;
  });
  return [...new Set(mapped)].filter(Boolean);
}

function materializeQuestion({ question, artifacts }) {
  const hits = asArray(question.source_artifacts).filter((artifactName) => hasMeaningfulArtifact(artifacts[artifactName]));
  const extracted = sanitizeSuggestedAnswer(extractSuggestedAnswer({ question, artifacts }));
  const isBackend = question.prefill_source === "backend_artifact";
  const suggestedAnswer = isBackend ? extracted : safeText(question.demo_prefill_value, "");
  const prefillStatus = isBackend && !suggestedAnswer ? "DILIGENCE_REVIEW_NEEDED" : isBackend ? "DILIGENCE_PREFILL_CONFIRM" : "DEMO_PREFILL_CONFIRM";
  const warnings = [];
  if (isBackend && !hits.length) warnings.push(`${question.question_id}:BACKEND_EVIDENCE_NOT_PRESENT_NONBLOCKING`);
  if (isBackend && hits.length && !suggestedAnswer) warnings.push(`${question.question_id}:BACKEND_PREFILL_VALUE_NOT_EXTRACTED_REVIEW_REQUIRED`);
  if (!isBackend) warnings.push(`${question.question_id}:NOT_DERIVED_FROM_DILIGENCE`);

  return {
    ...question,
    source_artifacts_present: hits,
    prefill_status: prefillStatus,
    answer_status: "EDITABLE_UNCONFIRMED",
    suggested_answer: suggestedAnswer,
    initial_answer_value: isBackend ? suggestedAnswer || null : question.initial_answer_value,
    reviewer_answer: "",
    confirmed: false,
    warnings
  };
}

function extractSuggestedAnswer({ question, artifacts }) {
  for (const path of asArray(question.backend_prefill_mapping)) {
    const value = getPath(artifacts, path);
    if (hasMeaningfulArtifact(value)) return formatSuggestedValue(value);
  }
  return "";
}

function getPath(object, path) {
  const parts = String(path || "").split(".").filter(Boolean);
  let current = object;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return current;
}

function formatSuggestedValue(value) {
  if (Array.isArray(value)) return value.map(formatSuggestedValue).filter(Boolean).join(", ");
  if (value && typeof value === "object") return "";
  return safeText(value, "");
}

function sanitizeSuggestedAnswer(value) {
  const text = safeText(value, "");
  if (!text) return "";
  if (/^Review source artifacts:/i.test(text)) return "";
  return text;
}

function hasMeaningfulArtifact(value) {
  if (!value) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return Boolean(String(value).trim());
}
