import { asArray, safeObject, safeText } from "./report-safe-language.js";

export const QUALIFIED_REVIEW_SECTIONS = Object.freeze([
  { section_id: "entity_commercial", title: "Entity and commercial review", count: 16 },
  { section_id: "technology_infrastructure", title: "Technology and infrastructure review", count: 16 },
  { section_id: "ai_capability", title: "AI capability review", count: 16 },
  { section_id: "privacy_sensitive_use", title: "Privacy and sensitive-use review", count: 15 },
  { section_id: "india_privacy_cyber", title: "India privacy and cyber review", count: 16 }
]);

const SECTION_PROMPTS = Object.freeze({
  entity_commercial: [
    "Confirm the contracting entity, registered jurisdiction, and operating identity used for the reviewed product.",
    "Confirm whether public terms identify the correct customer-facing legal entity.",
    "Confirm the target product or service family that should be covered by the review.",
    "Confirm the primary customer segment and commercial use case.",
    "Confirm whether reseller, marketplace, or channel terms change the contracting path.",
    "Confirm the governing law and dispute forum surfaced in public terms.",
    "Confirm whether public security, privacy, or AI terms are incorporated by reference.",
    "Confirm whether the public product description matches the reviewed technical scope.",
    "Confirm whether pricing, packaging, or enterprise tiering changes data or AI commitments.",
    "Confirm whether customer data commitments vary by plan, geography, or deployment model.",
    "Confirm whether public statements create service-level or support commitments.",
    "Confirm whether procurement documents reference separate data-processing terms.",
    "Confirm whether beta, preview, or experimental feature terms apply.",
    "Confirm whether any customer eligibility, prohibited-use, or regulated-use limits apply.",
    "Confirm whether commercial claims need private customer-document confirmation.",
    "Confirm final entity and commercial facts before document assembly."
  ],
  technology_infrastructure: [
    "Confirm the product architecture and hosted components relevant to customer data flow.",
    "Confirm whether cloud providers, subprocessors, or infrastructure regions are disclosed.",
    "Confirm whether data storage, processing, and backup locations are sufficiently described.",
    "Confirm whether encryption in transit and at rest commitments are public and current.",
    "Confirm whether access controls, audit logging, and administrator permissions are described.",
    "Confirm whether customer tenant isolation or workspace separation is documented.",
    "Confirm whether API, integration, or connector behavior changes the data boundary.",
    "Confirm whether uploaded documents, prompts, or user-generated content are retained.",
    "Confirm whether observability, telemetry, or diagnostic data is collected.",
    "Confirm whether incident response and breach-notification commitments are public.",
    "Confirm whether vulnerability management or penetration-test summaries are available.",
    "Confirm whether deletion, export, and portability workflows are described.",
    "Confirm whether enterprise controls alter default retention or access behavior.",
    "Confirm whether infrastructure claims need private security-document confirmation.",
    "Confirm whether system limitations are sufficiently documented for legal review.",
    "Confirm final technology and infrastructure facts before document assembly."
  ],
  ai_capability: [
    "Confirm whether the reviewed product includes generative AI, predictive AI, or automation features.",
    "Confirm the AI feature names and user workflows in scope.",
    "Confirm whether model providers, model families, or hosted AI services are disclosed.",
    "Confirm whether customer inputs are used for model training, fine-tuning, or improvement.",
    "Confirm whether outputs are generated, ranked, summarized, transformed, or merely retrieved.",
    "Confirm whether human review, override, or approval is available before downstream use.",
    "Confirm whether AI output limitations, accuracy warnings, or no-reliance terms are public.",
    "Confirm whether prohibited AI uses or high-risk restrictions are included.",
    "Confirm whether AI safety, moderation, or abuse-monitoring controls are described.",
    "Confirm whether customer data is shared with AI subprocessors or model providers.",
    "Confirm whether model logs, prompts, embeddings, or derived signals are retained.",
    "Confirm whether AI configuration differs for enterprise, private, or regional deployments.",
    "Confirm whether AI capability claims require private technical confirmation.",
    "Confirm whether generated outputs can affect legal, employment, credit, health, or similar decisions.",
    "Confirm whether AI transparency commitments are sufficient for the intended document.",
    "Confirm final AI capability facts before document assembly."
  ],
  privacy_sensitive_use: [
    "Confirm categories of personal data processed by the reviewed product.",
    "Confirm whether special category, sensitive, child, employee, or biometric data is implicated.",
    "Confirm controller, processor, service-provider, or equivalent role statements.",
    "Confirm whether data-processing terms align with the observed product behavior.",
    "Confirm whether consent, notice, or customer configuration responsibilities are assigned.",
    "Confirm whether cross-border transfer terms and safeguards are disclosed.",
    "Confirm whether retention and deletion commitments cover the reviewed data types.",
    "Confirm whether customer-uploaded files or communications create additional privacy exposure.",
    "Confirm whether analytics, telemetry, cookies, or tracking disclosures cover the product.",
    "Confirm whether sensitive-use restrictions or regulated-industry disclaimers apply.",
    "Confirm whether privacy claims require private DPA or security-questionnaire confirmation.",
    "Confirm whether public notices identify subprocessors that handle personal data.",
    "Confirm whether opt-out, objection, access, correction, or portability workflows are relevant.",
    "Confirm whether privacy limitations should be escalated before legal document assembly.",
    "Confirm final privacy and sensitive-use facts before document assembly."
  ],
  india_privacy_cyber: [
    "Confirm whether the product is offered to India users, customers, employees, or enterprises.",
    "Confirm whether Digital Personal Data Protection Act role analysis is needed.",
    "Confirm whether India notice, consent, grievance, or contact disclosures are public.",
    "Confirm whether personal data processing includes India residents or India customer deployments.",
    "Confirm whether significant data fiduciary, consent manager, or child-data issues may arise.",
    "Confirm whether India cross-border transfer assumptions require private confirmation.",
    "Confirm whether CERT-In incident-reporting expectations are relevant to the reviewed service.",
    "Confirm whether cybersecurity, logging, or retention controls are described for India operations.",
    "Confirm whether sector-specific India rules could apply to the customer use case.",
    "Confirm whether telecom, financial, health, education, or employment context changes the analysis.",
    "Confirm whether India subprocessors, hosting regions, or support access are disclosed.",
    "Confirm whether AI use in India creates additional transparency or fairness questions.",
    "Confirm whether public evidence is sufficient or manual India counsel confirmation is required.",
    "Confirm whether India-specific limitations should block or condition document assembly.",
    "Confirm whether India privacy and cyber facts need customer-document confirmation.",
    "Confirm final India privacy and cyber facts before document assembly."
  ]
});

const SECTION_SOURCE_HINTS = Object.freeze({
  entity_commercial: ["target_profile.entity", "target_profile.commercial_terms", "source_discovery_handoff.legal_terms"],
  technology_infrastructure: ["target_feature_profile.infrastructure", "data_provenance_profile.security_controls", "lossless_family__D1_SECURITY_TRUST"],
  ai_capability: ["target_feature_profile.ai_capability", "integrated_dap_report.ai_data_use", "lossless_family__P3_AI_CAPABILITY_TECHNICAL"],
  privacy_sensitive_use: ["data_provenance_profile.personal_data", "data_provenance_profile_forensics.trace_index", "lossless_family__D3_DATA_GOVERNANCE_CONTROLS"],
  india_privacy_cyber: ["extended_dap_india_readiness_profile.india_readiness", "integrated_dap_report.india_privacy_cyber", "lossless_family__L4_PRIVACY_ADJACENT_NOTICES"]
});

const SECTION_SOURCE_ARTIFACTS = Object.freeze({
  entity_commercial: ["source_discovery_handoff", "target_profile", "legal_cartography_index"],
  technology_infrastructure: ["target_feature_profile", "data_provenance_profile", "data_provenance_profile_forensics"],
  ai_capability: ["target_feature_profile", "extended_dap_india_readiness_profile", "integrated_dap_report"],
  privacy_sensitive_use: ["data_provenance_profile", "data_provenance_profile_forensics", "integrated_dap_report"],
  india_privacy_cyber: ["extended_dap_india_readiness_profile", "integrated_dap_report", "legal_cartography_index"]
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
    handoff_version: "qualified_review_question_handoff_v1",
    run_id: safeText(run.run_id, "UNKNOWN_RUN"),
    ui_mode: "SECTION_BY_SECTION_WIZARD",
    question_count: questions.length,
    sections: QUALIFIED_REVIEW_SECTIONS.map(({ section_id, title }) => ({ section_id, title })),
    progress_rail: sectionPages.map((page, index) => ({
      step: index + 1,
      section_id: page.section_id,
      label: page.section_title,
      question_count: page.question_count,
      status: page.remaining_count === 0 ? "READY_FOR_REVIEW" : "NEEDS_CONFIRMATION"
    })),
    section_pages: sectionPages,
    questions,
    warnings: questions.flatMap((question) => question.warnings)
  };
}

function buildQuestionDefinitions() {
  let index = 1;
  const questions = [];
  for (const section of QUALIFIED_REVIEW_SECTIONS) {
    const prompts = SECTION_PROMPTS[section.section_id];
    for (let i = 0; i < section.count; i += 1) {
      const ordinal = index;
      const evidenceMode = resolveEvidenceMode(section.section_id, i);
      questions.push({
        question_id: `QR-${String(index).padStart(3, "0")}`,
        ordinal,
        section_id: section.section_id,
        section_title: section.title,
        prompt: prompts[i],
        answer_type: "reviewer_confirmation",
        evidence_mode: evidenceMode,
        editable: true,
        required: true,
        document_impact: SECTION_DOCUMENT_IMPACTS[section.section_id],
        source_artifacts: SECTION_SOURCE_ARTIFACTS[section.section_id],
        source_field_hints: SECTION_SOURCE_HINTS[section.section_id],
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
  const warnings = hits.length ? [] : [`${question.question_id}: ${prefillStatus}`];
  return {
    ...question,
    source_artifacts_present: hits,
    prefill_status: prefillStatus,
    answer_status: "EDITABLE",
    reviewer_answer: "",
    warnings
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
