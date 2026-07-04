import { QUALIFIED_REVIEW_QUESTIONS as LEGACY_QR_QUESTIONS } from "./qualified-review-map.js";
import { loadQualifiedReviewMatrix } from "./qualified-review-matrix-loader.js";
import { firstSelectorValue, valueToAnswer } from "./normalized-selector.js";

export const QUALIFIED_REVIEW_MATRIX_COMPILER_VERSION = "qr_matrix_normalized_section_compiler_v1";
const DEMO_TEXT = "Demo assumption only. This is not evidence from the diligence engine and must be confirmed before draft preparation.";
const PRIVATE_IDS = new Set(["QR-026", "QR-027", "QR-028", "QR-029", "QR-047"]);

export function buildQualifiedReviewMatrixArtifacts({ run = {}, normalized_report_manifest = {}, sections = {} } = {}) {
  const matrix = loadQualifiedReviewMatrix();
  const normalized = normalizedObject(sections);
  const legacyById = new Map(LEGACY_QR_QUESTIONS.map((row) => [row.question_id, row]));
  const questions = matrix.questions.map((row) => materializeQuestion({ row, legacy: legacyById.get(row.question_id) || {}, normalized }));
  const artifacts = matrix.sections.map((section) => buildSectionArtifact({ section, questions, run }));
  const section_pages = artifacts.map((artifact) => ({ section_id: artifact.section_id, section_title: artifact.section_title, question_ids: artifact.questions.map((q) => q.question_id), question_count: artifact.questions.length, answered_count: artifact.questions.filter((q) => q.suggested_answer).length, remaining_count: artifact.questions.length, editable: true }));
  return {
    qualified_review_matrix_manifest: {
      artifact_type: "qualified_review_matrix_manifest",
      compiler_version: QUALIFIED_REVIEW_MATRIX_COMPILER_VERSION,
      matrix_version: matrix.matrix.version,
      run_id: run.run_id || normalized_report_manifest.run_id || "UNKNOWN_RUN",
      question_count: questions.length,
      section_artifact_count: artifacts.length,
      section_artifacts: artifacts.map((artifact) => ({ artifact_name: artifact.artifact_name, section_id: artifact.section_id, question_count: artifact.question_count })),
      selector_contract: matrix.matrix.selector_contract,
      demo_fallback_contract: true,
      private_input_rows: questions.filter((q) => q.prefill_source === "private_demo_assumption").length,
      diligence_prefill_rows: questions.filter((q) => q.prefill_source === "diligence_normalized_section").length,
      demo_prefill_rows: questions.filter((q) => q.prefill_source === "market_norm_demo").length
    },
    qr_artifacts: Object.fromEntries(artifacts.map((artifact) => [artifact.artifact_name, artifact])),
    section_pages,
    questions
  };
}

function materializeQuestion({ row, legacy, normalized }) {
  const privateRow = PRIVATE_IDS.has(row.question_id) || String(row.selector || "").startsWith("PRIVATE_INPUT.");
  const hit = privateRow ? { found: false, value: "", selector: "" } : firstSelectorValue(normalized, [row.selector, row.secondary_selector].filter(Boolean));
  const diligenceAnswer = hit.found ? normalizeAnswerForType(valueToAnswer(hit.value), row.answer_type, row.answer_options) : "";
  const finalAnswer = diligenceAnswer || normalizeAnswerForType(row.demo_prefill_value, row.answer_type, row.answer_options) || row.demo_prefill_value;
  const source = diligenceAnswer ? "diligence_normalized_section" : privateRow ? "private_demo_assumption" : "market_norm_demo";
  const status = diligenceAnswer ? "DILIGENCE_PREFILL_CONFIRM" : privateRow ? "PRIVATE_DEMO_ASSUMPTION_CONFIRM" : "DEMO_PREFILL_CONFIRM";
  return {
    ...legacy,
    question_id: row.question_id,
    question_number: row.question_number,
    section_id: row.section_id,
    section_title: row.section_title,
    section_artifact: row.section_artifact,
    field_key: legacy.field_key || row.field_key,
    lawyer_question: row.lawyer_question,
    public_question_label: row.lawyer_question,
    answer_type: row.answer_type,
    answer_options: Array.isArray(row.answer_options) ? row.answer_options : [],
    normalized_section_selector: row.selector,
    normalized_secondary_selector: row.secondary_selector || "",
    normalized_selector_used: hit.selector,
    normalized_section_value_found: Boolean(diligenceAnswer),
    diligence_value: diligenceAnswer,
    demo_prefill_value: row.demo_prefill_value,
    suggested_answer: finalAnswer,
    initial_answer_value: finalAnswer,
    prefill_source: source,
    prefill_status: status,
    evidence_status: diligenceAnswer ? "DILIGENCE_NORMALIZED_SECTION_VALUE" : privateRow ? "PRIVATE_INPUT_DEMO_ASSUMPTION" : "DEMO_FALLBACK_NO_DILIGENCE_VALUE",
    prefill_strength: diligenceAnswer ? row.current_prefill_strength || "FULL" : "DEMO",
    source_table_default_status: diligenceAnswer ? "Prefill / confirm" : "Demo prefill / confirm",
    evidence_mode: diligenceAnswer ? "normalized_section_field" : "demo_not_evidence",
    field_type: diligenceAnswer ? "normalized_section_prefilled" : "demo_prefilled_review_required",
    answer_prefill_mapping: privateRow ? [] : [row.selector, row.secondary_selector].filter(Boolean),
    evidence_source_mapping: hit.selector ? [hit.selector] : [],
    source_artifacts: sourceArtifacts(row, hit.selector),
    source_field_hints: [row.selector, row.secondary_selector].filter(Boolean),
    material_field: row.material_field,
    material_field_key: row.material_field_key,
    registry_basis: row.registry_basis,
    normalized_mapping_status: row.normalized_mapping_status,
    demo_disclaimer_required: !diligenceAnswer,
    demo_disclaimer_text: diligenceAnswer ? null : DEMO_TEXT,
    demo_market_suggestion: row.demo_prefill_value,
    helper_text: row.notes || legacy.helper_text || "Confirm before draft preparation.",
    document_impact: Array.isArray(legacy.document_impact) && legacy.document_impact.length ? legacy.document_impact : defaultImpact(row),
    editable: true,
    required_for_assembly: true,
    required_for_draft_preparation: true,
    final_gate_required: true,
    assembly_blocker: true,
    reviewer_action: !diligenceAnswer ? "Confirm demo assumption before draft preparation" : "Confirm or edit before draft preparation",
    review_status: "Needs confirmation",
    qualified_review_push_policy: { push_to_qualified_review_on_click: true, public_prefill_is_not_final: true, demo_prefill_is_not_evidence: !diligenceAnswer, preserve_original_evidence: true, confirmed_answer_overrides_prefill_for_draft_preparation: true },
    warnings: !diligenceAnswer ? [`${row.question_id}:DEMO_FALLBACK_USED`] : []
  };
}

function buildSectionArtifact({ section, questions, run }) {
  const rows = questions.filter((q) => q.section_id === section.section_id);
  return { artifact_type: "qualified_review_section_artifact", artifact_name: section.section_artifact, section_id: section.section_id, section_title: section.section_title, run_id: run.run_id || "UNKNOWN_RUN", question_count: rows.length, questions: rows, contract: { matrix_sourced: true, normalized_section_selectors: true, demo_fallback_enabled: true, all_answers_prefilled: rows.every((q) => Boolean(q.suggested_answer)), renderer_may_flatten_questions: true } };
}

function normalizedObject(sections) { return Object.fromEntries(Object.entries(sections || {}).map(([id, section]) => [`normalized_section__${id}`, section || {}])); }
function sourceArtifacts(row, selector) { if (String(row.selector || "").startsWith("PRIVATE_INPUT.")) return ["private_input"]; const artifact = String(selector || row.selector || "").split(".")[0]; return artifact ? [artifact] : ["market_norm_demo"]; }
function defaultImpact(row) { if (row.section_id === "dap_privacy_india_cyber") return ["DOC_PP", "DOC_DPA", "DOC_SOP", "DOC_DPIA"]; if (row.section_id === "technology_infrastructure") return ["DOC_DPA", "DOC_SOP"]; if (row.section_id === "ai_capability_product_behavior") return ["DOC_TOS", "DOC_AUP", "DOC_PBK"]; return ["DOC_TOS", "DOC_DPA", "DOC_PP"]; }
function normalizeAnswerForType(value, type, options = []) { const text = String(value || "").trim(); if (!text) return ""; if ((type === "dropdown" || type === "select") && Array.isArray(options) && options.length) { const exact = options.find((option) => String(option).toLowerCase() === text.toLowerCase()); if (exact) return exact; const lowered = text.toLowerCase(); if (options.includes("Yes") || options.includes("No") || options.includes("Unclear")) { if (/\b(no|none|absent|not visible|not found|missing)\b/i.test(lowered)) return options.includes("No") ? "No" : ""; if (/\b(yes|present|visible|available|identified)\b/i.test(lowered)) return options.includes("Yes") ? "Yes" : ""; return options.includes("Unclear") ? "Unclear" : ""; } const hit = options.find((option) => lowered.includes(String(option).toLowerCase())); return hit || ""; } return text; }
