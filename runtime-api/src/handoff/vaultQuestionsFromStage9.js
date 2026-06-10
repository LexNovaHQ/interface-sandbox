import { isAllowedVaultPath, normalizeVaultFieldPath } from "./vaultCanonicalMap.js";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function getStage9ReportData(stage9ReportData) {
  return stage9ReportData?.report?.report_data
    || stage9ReportData?.report_data
    || stage9ReportData;
}

function safeText(value, fallback = "") {
  if (value === undefined || value === null) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function registryRefsFromFinding(finding) {
  const explicitRefs = asArray(finding?.supporting_registry_references).filter(Boolean).map(String);
  if (explicitRefs.length) return explicitRefs;

  return asArray(finding?.supporting_registry_items || finding?.supporting_registry_rows || finding?.supporting_items)
    .map((item) => item.registry_reference || item.threat_id || item.id || item)
    .filter(Boolean)
    .map(String);
}

function createQuestion({ fieldPath, question, whyItMatters, sourceContext, requiredFor }) {
  const normalizedPath = normalizeVaultFieldPath(fieldPath);
  if (!isAllowedVaultPath(normalizedPath)) return null;

  return {
    field_path: normalizedPath,
    question: safeText(question, `Please confirm ${normalizedPath}.`),
    why_it_matters: safeText(whyItMatters, "Required to route the Review-Ready remediation package correctly."),
    source_context: safeText(sourceContext, "Derived from Stage 9 diligence report."),
    required_for: safeText(requiredFor, "Assembly routing and local counsel review")
  };
}

function addQuestion(questions, input) {
  const question = createQuestion(input);
  if (!question) return;

  const key = `${question.field_path}::${question.question}`;
  if (questions.some((existing) => `${existing.field_path}::${existing.question}` === key)) return;
  questions.push(question);
}

function addMissingDocumentQuestions(stage9ReportData, questions) {
  const reportData = getStage9ReportData(stage9ReportData);
  const gaps = reportData?.evidence_gaps_clarification_points || {};
  const missingDocs = asArray(gaps.missing_documents);
  const openItems = asArray(gaps.open_information_request_list || gaps.open_information_requests);
  const stackGaps = asArray(reportData?.legal_stack_control_review?.control_gaps);
  const combinedText = [...missingDocs, ...openItems, ...stackGaps].map((item) => JSON.stringify(item)).join("\n");

  if (/DPA|data processing|subprocessor/i.test(combinedText)) {
    addQuestion(questions, {
      fieldPath: "architecture.sub_processors.url",
      question: "Please provide or confirm the current DPA and subprocessor list URL.",
      whyItMatters: "Assembly needs the DPA/subprocessor position to route privacy, subprocessors, deletion, transfer, and customer-data controls.",
      sourceContext: "Stage 9 legal stack / clarification gap indicates DPA or subprocessor position is unresolved.",
      requiredFor: "DPA, Privacy Policy, and customer contracting remediation route"
    });
  }

  if (/SLA|uptime|availability|support/i.test(combinedText)) {
    addQuestion(questions, {
      fieldPath: "baseline.sla_type",
      question: "Please confirm whether the product has an SLA, service-credit schedule, or support commitment.",
      whyItMatters: "Assembly needs the SLA position to route uptime, service credit, support, and operational-resilience clauses.",
      sourceContext: "Stage 9 legal stack / clarification gap indicates SLA or support position is unresolved.",
      requiredFor: "SLA and service commitment remediation route"
    });
  }

  if (/output ownership|generated output|IP|copyright|content/i.test(combinedText)) {
    addQuestion(questions, {
      fieldPath: "baseline.output_ownership",
      question: "Please confirm who owns or may use AI-generated outputs and user-provided inputs.",
      whyItMatters: "Assembly needs output ownership to route IP, content, generated-output, and training-data clauses.",
      sourceContext: "Stage 9 legal stack / clarification gap indicates output or content ownership is unresolved.",
      requiredFor: "IP / output ownership and AI terms remediation route"
    });
  }
}

function addFindingDrivenQuestions(stage9ReportData, questions) {
  const reportData = getStage9ReportData(stage9ReportData);
  asArray(reportData?.exposure_findings?.consolidated_findings).forEach((finding) => {
    const title = safeText(finding.exposure_title || finding.title || finding.finding_title || finding.exposure_family, "consolidated finding");
    const refs = registryRefsFromFinding(finding);
    const sourceContext = refs.length
      ? `Supporting registry references: ${refs.join(", ")}`
      : `Stage 9 consolidated finding: ${title}`;
    const text = JSON.stringify(finding);

    if (/autonomous|agent|financial|transaction|authority|payment/i.test(text)) {
      addQuestion(questions, {
        fieldPath: "archetypes.agent_limits.session_cap",
        question: "Please confirm the monetary, transactional, or operational authority limits for any agentic workflow.",
        whyItMatters: "Assembly needs authority limits to route agent governance, approval gate, audit log, and customer reliance controls.",
        sourceContext,
        requiredFor: "AI / Agent Governance Terms and human-review protocol"
      });
      addQuestion(questions, {
        fieldPath: "archetypes.agent_limits.period_cap",
        question: "Please confirm whether agentic actions have per-period caps or cumulative limits.",
        whyItMatters: "Assembly needs cap structure to draft safe operational authority limits and escalation triggers.",
        sourceContext,
        requiredFor: "AI / Agent Governance Terms and operational control schedule"
      });
    }

    if (/human review|decision|judge|automated review|appeal|employment|legal/i.test(text)) {
      addQuestion(questions, {
        fieldPath: "archetypes.is_judge",
        question: "Please confirm whether the product makes or materially supports decisions about users, customers, employees, or legal/compliance outcomes.",
        whyItMatters: "Assembly needs decision-support confirmation to route human review, appeal, explanation, and limitation clauses.",
        sourceContext,
        requiredFor: "Human review / handover protocol and AI governance route"
      });
    }

    if (/voice|biometric|speech|audio/i.test(text)) {
      addQuestion(questions, {
        fieldPath: "archetypes.sens_bio",
        question: "Please confirm whether the product processes voice, speech, audio, biometric, or biometric-adjacent identifiers.",
        whyItMatters: "Assembly needs this confirmation to route consent, biometric/sensitive-data, retention, deletion, and privacy disclosures.",
        sourceContext,
        requiredFor: "Privacy Policy, DPA, consent language, and data-retention route"
      });
    }

    if (/personal data|PII|privacy|customer data|retention|deletion/i.test(text)) {
      addQuestion(questions, {
        fieldPath: "compliance.processes_pii",
        question: "Please confirm what categories of personal data or customer data are processed by the product.",
        whyItMatters: "Assembly needs data-category confirmation to route privacy, DPA, deletion, subprocessors, security, and customer-data controls.",
        sourceContext,
        requiredFor: "Privacy Policy, DPA, data processing schedule, and customer terms route"
      });
    }

    if (/training data|model training|fine[- ]?tuning|output|content|copyright|IP/i.test(text)) {
      addQuestion(questions, {
        fieldPath: "architecture.models",
        question: "Please confirm whether customer inputs, outputs, or user content are used for model training, fine-tuning, or product improvement.",
        whyItMatters: "Assembly needs this confirmation to route training-use disclosures, customer data restrictions, IP terms, and opt-out controls.",
        sourceContext,
        requiredFor: "AI terms, DPA, IP terms, and privacy route"
      });
    }
  });
}

function addOpenItemQuestions(stage9ReportData, questions) {
  const reportData = getStage9ReportData(stage9ReportData);
  asArray(reportData?.evidence_gaps_clarification_points?.open_information_request_list || reportData?.evidence_gaps_clarification_points?.open_information_requests).forEach((item) => {
    const text = JSON.stringify(item);
    const sourceContext = safeText(item.source_context || item.evidence_basis || item.why_it_matters, "Stage 9 open information request.");

    if (/jurisdiction|country|state|registered|entity/i.test(text)) {
      addQuestion(questions, {
        fieldPath: "baseline.jurisdiction.country",
        question: safeText(item.question, "Please confirm the company's legal jurisdiction and operating market."),
        whyItMatters: safeText(item.why_it_matters, "Assembly needs jurisdiction to route governing law, privacy, contracting, and local counsel review points."),
        sourceContext,
        requiredFor: "Matter profile and local counsel review"
      });
    }

    if (/revenue|pricing|subscription|enterprise|customer/i.test(text)) {
      addQuestion(questions, {
        fieldPath: "baseline.revenue_model",
        question: safeText(item.question, "Please confirm the product revenue model and customer segment."),
        whyItMatters: safeText(item.why_it_matters, "Assembly needs revenue/customer context to route SaaS terms, enterprise contracting, reliance, and warranty posture."),
        sourceContext,
        requiredFor: "Terms of Service / customer contract route"
      });
    }
  });
}

export function deriveVaultQuestionsFromStage9(stage9ReportData) {
  const reportData = getStage9ReportData(stage9ReportData);
  const questions = [];

  addMissingDocumentQuestions(reportData, questions);
  addFindingDrivenQuestions(reportData, questions);
  addOpenItemQuestions(reportData, questions);

  return questions;
}
