import { asArray, safeObject, safeText } from "../report-safe-language.js";

export const QUALIFIED_REVIEW_QUESTION_MAP_VERSION = "qualified_review_question_map_parallel_v1";

export const QUALIFIED_REVIEW_SECTIONS = Object.freeze([
  { section_id: "entity_commercial", title: "Entity and commercial review", count: 16 },
  { section_id: "technology_infrastructure", title: "Technology and infrastructure review", count: 16 },
  { section_id: "ai_capability", title: "AI capability review", count: 16 },
  { section_id: "privacy_sensitive_use", title: "Privacy and sensitive-use review", count: 15 },
  { section_id: "india_privacy_cyber", title: "India privacy and cyber review", count: 16 }
]);

const SECTION_SOURCE_ARTIFACTS = Object.freeze({
  entity_commercial: ["source_discovery_handoff", "target_profile", "legal_cartography_index"],
  technology_infrastructure: ["target_feature_profile", "data_provenance_profile", "data_provenance_profile_forensics"],
  ai_capability: ["target_feature_profile", "extended_dap_india_readiness_profile", "integrated_dap_report"],
  privacy_sensitive_use: ["data_provenance_profile", "data_provenance_profile_forensics", "integrated_dap_report"],
  india_privacy_cyber: ["extended_dap_india_readiness_profile", "integrated_dap_report", "legal_cartography_index"]
});

const SECTION_SOURCE_HINTS = Object.freeze({
  entity_commercial: ["target_profile.entity", "target_profile.commercial_terms", "source_discovery_handoff.legal_terms"],
  technology_infrastructure: ["target_feature_profile.infrastructure", "data_provenance_profile.security_controls", "lossless_family__D1_SECURITY_TRUST"],
  ai_capability: ["target_feature_profile.ai_capability", "integrated_dap_report.ai_data_use", "lossless_family__P3_AI_CAPABILITY_TECHNICAL"],
  privacy_sensitive_use: ["data_provenance_profile.personal_data", "data_provenance_profile_forensics.trace_index", "lossless_family__D3_DATA_GOVERNANCE_CONTROLS"],
  india_privacy_cyber: ["extended_dap_india_readiness_profile.india_readiness", "integrated_dap_report.india_privacy_cyber", "lossless_family__L4_PRIVACY_ADJACENT_NOTICES"]
});

const SECTION_DOCUMENT_IMPACTS = Object.freeze({
  entity_commercial: "Controls party identity, commercial assumptions, and scope statements.",
  technology_infrastructure: "Controls security, hosting, data-flow, and technical-control statements.",
  ai_capability: "Controls AI capability, model-use, output-reliance, and AI-risk statements.",
  privacy_sensitive_use: "Controls privacy, sensitive-data, transfer, retention, and DPA statements.",
  india_privacy_cyber: "Controls India privacy, DPDP, CERT-In, and sector-specific cyber statements."
});

export const QUALIFIED_REVIEW_QUESTIONS = Object.freeze(buildQuestionDefinitions());

export function buildQualifiedReviewQuestionHandoff({ run = {}, artifacts = {} } = {}) {
  const artifactBag = safeObject(artifacts);
  const questions = QUALIFIED_REVIEW_QUESTIONS.map((question) => materializeQuestion({ question, artifacts: artifactBag }));
  const sectionPages = QUALIFIED_REVIEW_SECTIONS.map((section) => {
    const sectionQuestions = questions.filter((question) => question.section_id === section.section_id);
    const answered = sectionQuestions.filter((question) => question.prefill_status === "PREFILLED_FROM_ARTIFACT").length;
    return {
      section_id: section.section_id,
      section_title: section.title,
      question_ids: sectionQuestions.map((question) => question.question_id),
      question_count: sectionQuestions.length,
      answered_count: answered,
      remaining_count: sectionQuestions.length - answered,
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
    progress_rail: sectionPages.map((page, index) => ({ step: index + 1, section_id: page.section_id, label: page.section_title, question_count: page.question_count, status: page.remaining_count === 0 ? "READY_FOR_REVIEW" : "NEEDS_CONFIRMATION" })),
    section_pages: sectionPages,
    questions,
    warnings: questions.flatMap((question) => question.warnings)
  };
}

function buildQuestionDefinitions() {
  let index = 1;
  const questions = [];
  for (const section of QUALIFIED_REVIEW_SECTIONS) {
    for (let i = 0; i < section.count; i += 1) {
      const evidenceMode = resolveEvidenceMode(section.section_id, i);
      questions.push({
        question_id: `QR-${String(index).padStart(3, "0")}`,
        question_number: index,
        section_id: section.section_id,
        section_title: section.title,
        field_key: `${section.section_id}_${String(i + 1).padStart(2, "0")}`,
        public_question_label: `Confirm ${section.title.toLowerCase()} item ${i + 1}.`,
        answer_type: "reviewer_confirmation",
        evidence_mode: evidenceMode,
        field_type: evidenceMode === "public" ? "public_prefilled" : evidenceMode === "hybrid" ? "hybrid" : "manual_private",
        editable: true,
        required_for_assembly: true,
        assembly_blocker: true,
        document_impact: [SECTION_DOCUMENT_IMPACTS[section.section_id]],
        source_artifacts: SECTION_SOURCE_ARTIFACTS[section.section_id],
        source_field_hints: SECTION_SOURCE_HINTS[section.section_id],
        helper_text: `Reviewer must confirm this ${section.title.toLowerCase()} point before any Review-Ready downstream draft uses it.`,
        review_status: "Needs confirmation",
        qualified_review_push_policy: {
          push_to_qualified_review_on_click: true,
          public_prefill_is_not_final: true,
          preserve_original_evidence: true,
          confirmed_answer_overrides_prefill_for_draft_preparation: true
        },
        market_norm_helper: evidenceMode === "manual_private" ? marketNormHelper(section.section_id) : null
      });
      index += 1;
    }
  }
  return questions;
}

function resolveEvidenceMode(sectionId, index) {
  if (sectionId === "india_privacy_cyber" && index >= 12) return "manual_private";
  if (index % 5 === 4) return "manual_private";
  if (index % 3 === 2) return "hybrid";
  return "public";
}

function materializeQuestion({ question, artifacts }) {
  const hits = asArray(question.source_artifacts).filter((artifactName) => hasMeaningfulArtifact(artifacts[artifactName]));
  const prefillStatus = hits.length ? "PREFILLED_FROM_ARTIFACT" : question.evidence_mode === "manual_private" ? "MANUAL_ANSWER_REQUIRED" : "NEEDS_CONFIRMATION";
  return {
    ...question,
    source_artifacts_present: hits,
    prefill_status: prefillStatus,
    answer_status: "EDITABLE",
    suggested_answer: hits.length ? `Review source artifacts: ${hits.join(", ")}` : "",
    reviewer_answer: "",
    warnings: hits.length ? [] : [`${question.question_id}: ${prefillStatus}`]
  };
}

function hasMeaningfulArtifact(value) {
  if (!value) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return Boolean(String(value).trim());
}

function marketNormHelper(sectionId) {
  const helpers = {
    entity_commercial: "Compare against market-standard SaaS contracting, authority, and customer-order confirmation norms.",
    technology_infrastructure: "Compare against market-standard security questionnaire and infrastructure-control confirmation norms.",
    ai_capability: "Compare against market-standard AI governance, model-use, output-reliance, and human-review confirmation norms.",
    privacy_sensitive_use: "Compare against market-standard DPA, privacy notice, data-transfer, and sensitive-data confirmation norms.",
    india_privacy_cyber: "Compare against India DPDP, CERT-In, sectoral cyber, and local counsel confirmation norms."
  };
  return helpers[sectionId] || "Compare against applicable market norm confirmation practice.";
}
