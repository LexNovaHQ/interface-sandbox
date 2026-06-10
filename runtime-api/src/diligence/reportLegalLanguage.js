const FUNCTIONAL_PROFILE_LABELS = Object.freeze({
  UNI: "General Applicability",
  TRN: "Speech / Translation Function",
  DOE: "Autonomous Action Function",
  ORC: "Workflow Orchestration Function",
  CRT: "Content Generation Function",
  RDR: "Document / Data Ingestion Function",
  JDG: "Decision-Support Function",
  CMP: "User Interaction / Companion Function",
  SHD: "Security / Risk-Control Function",
  OPT: "Optimization / Recommendation Function",
  MOV: "Transaction / Transfer Function",
  "The Translator": "Speech / Translation Function",
  "The Doer": "Autonomous Action Function",
  "The Orchestrator": "Workflow Orchestration Function",
  "The Creator": "Content Generation Function",
  "The Reader": "Document / Data Ingestion Function",
  "The Judge": "Decision-Support Function",
  "The Companion": "User Interaction / Companion Function",
  "The Shield": "Security / Risk-Control Function",
  "The Optimizer": "Optimization / Recommendation Function",
  "The Mover": "Transaction / Transfer Function"
});

const DOCUMENT_ROUTE_LABELS = Object.freeze({
  DOC_TOS: "Terms of Service",
  DOC_PP: "Privacy Policy",
  DOC_DPA: "Data Processing Addendum",
  DOC_AUP: "Acceptable Use Policy",
  DOC_SLA: "Service Level Agreement",
  DOC_AGT: "AI / Agent Governance Terms",
  DOC_IP: "IP / Output Ownership Terms",
  DOC_SOP: "Internal Governance SOP",
  DOC_HND: "Human Review / Handover Protocol",
  DOC_DPIA: "Data Protection Impact Assessment",
  DOC_PBK: "Product / Governance Playbook",
  DOC_SCAN: "Evidence Scan / Diligence Record",
  DOC_REFERENCE: "Reference Materials"
});

const EXPOSURE_CATEGORY_LABELS = Object.freeze({
  "Deal Death": "Deal / Customer Approval Risk",
  "Uncapped Money": "Financial Exposure",
  "Regulatory Heat": "Regulatory Scrutiny",
  Friction: "Operational / Contracting Friction",
  Existential: "Material Business Risk"
});

const SALES_LANGUAGE_REPLACEMENTS = [
  [/\byour product\b/gi, "the product"],
  [/\byour platform\b/gi, "the platform"],
  [/\byour company\b/gi, "the company"],
  [/\byour customers\b/gi, "customers"],
  [/\byou are\b/gi, "the company may be"],
  [/\byou have\b/gi, "the company has"],
  [/\byou need\b/gi, "the company should review"],
  [/\byou must\b/gi, "the company should review whether it must"],
  [/\byou\b/gi, "the company"],
  [/\bpre-built\b/gi, "suggested"],
  [/\bkills\b/gi, "may materially affect"],
  [/\bkill\b/gi, "materially affect"],
  [/\btrap\b/gi, "exposure"],
  [/\bnice to have\b/gi, "non-core control"],
  [/\bholds up\b/gi, "may delay"],
  [/\bblows up\b/gi, "may materially affect"],
  [/\bdisaster\b/gi, "material exposure"],
  [/\bnightmare\b/gi, "material issue"]
];

const RAW_LOGIC_REPLACEMENTS = [
  [/\bCONDITION_(\d+)\b/g, "Applicability Criterion $1"],
  [/\bTRIGGER_IF\b/g, "Finding Threshold"],
  [/\bEXCLUDE_IF\b/g, "Control / Exclusion Test"],
  [/\bTRUE_FEATURE_MAP:\s*/g, "Evidentiary basis: "],
  [/\bTRUE_EVIDENCE:\s*/g, "Evidentiary basis: "],
  [/\bTRUE_ABSENCE:\s*/g, "Absence basis: "],
  [/\bTRUE_LEGAL_STACK:\s*/g, "Legal-stack basis: "],
  [/\bTRUE_CONTROL:\s*/g, "Control basis: "],
  [/\bFALSE_NOT_SATISFIED:\s*/g, "Not satisfied: "],
  [/\bFALSE_NOT_APPLICABLE:\s*/g, "Not applicable: "],
  [/\bFALSE_INSUFFICIENT:\s*/g, "Insufficient evidence: "]
];

function asText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function stripExcessWhitespace(text) {
  return asText(text).replace(/\s+/g, " ").trim();
}

export function toFunctionalProfileLabel(value) {
  const raw = typeof value === "object" && value !== null
    ? asText(value.label || value.code || value.from_id)
    : asText(value);
  return FUNCTIONAL_PROFILE_LABELS[raw] || FUNCTIONAL_PROFILE_LABELS[raw.toUpperCase?.()] || raw || "Functional Profile Not Specified";
}

export function toExposureCategoryLabel(category) {
  const raw = asText(category, "Not Specified");
  return EXPOSURE_CATEGORY_LABELS[raw] || raw;
}

export function toSeverityLabel(tier, category) {
  const cleanTier = asText(tier, "Severity Not Specified");
  const cleanCategory = toExposureCategoryLabel(category);
  if (!cleanTier || cleanTier === "Severity Not Specified") return cleanCategory || "Severity Not Specified";
  return `${cleanTier} — ${cleanCategory}`;
}

export function toDocumentRouteLabel(value) {
  let text = asText(value);
  for (const [code, label] of Object.entries(DOCUMENT_ROUTE_LABELS)) {
    const pattern = new RegExp(`\\b${code}\\b`, "g");
    text = text.replace(pattern, label);
  }
  return stripExcessWhitespace(text);
}

export function sanitizeVisibleText(value) {
  let text = asText(value);
  if (!text) return "";
  for (const [pattern, replacement] of Object.entries(FUNCTIONAL_PROFILE_LABELS)) {
    text = text.replace(new RegExp(`\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g"), replacement);
  }
  text = toDocumentRouteLabel(text);
  for (const [pattern, replacement] of SALES_LANGUAGE_REPLACEMENTS) text = text.replace(pattern, replacement);
  for (const [pattern, replacement] of RAW_LOGIC_REPLACEMENTS) text = text.replace(pattern, replacement);
  return stripExcessWhitespace(text);
}

export function legalSignificanceText(value) {
  const clean = sanitizeVisibleText(value);
  if (!clean) return "Legal significance is not specified in the registry row. Qualified counsel should verify the issue against the matter evidence.";
  return `Registry legal basis: ${clean} Qualified counsel should verify application to the specific matter and relevant jurisdiction.`;
}

export function exposureMechanismText(value) {
  const clean = sanitizeVisibleText(value);
  if (!clean) return "The exposure mechanism is not specified in the registry row.";
  return `Exposure mechanism identified by registry: ${clean}`;
}

export function commercialImpactText(value) {
  const clean = sanitizeVisibleText(value);
  if (!clean) return "Commercial or deal impact is not specified in the registry row.";
  return `Commercial / deal impact noted by registry: ${clean}`;
}

export function remediationPathText(value) {
  const clean = sanitizeVisibleText(value);
  if (!clean) return "Suggested remediation path is not specified in the registry row. Counsel should identify the relevant policy, contract, governance, or operational control route.";
  return `Suggested remediation route: ${clean}`;
}

export function clarificationQuestionText({ criterionText, registryReference, controlTest } = {}) {
  const cleanCriterion = sanitizeVisibleText(criterionText);
  const cleanControl = sanitizeVisibleText(controlTest);
  if (cleanCriterion) {
    return `Please confirm whether the matter evidence or internal controls satisfy the following applicability criterion for ${registryReference}: ${cleanCriterion}`;
  }
  if (cleanControl) {
    return `Please provide any policy, clause, workflow, approval record, or operational evidence relevant to the control position for ${registryReference}: ${cleanControl}`;
  }
  return `Please provide the internal documents, customer terms, control evidence, or operational records needed to confirm the assessment for ${registryReference}.`;
}

export function visibleLanguageViolations(reportData) {
  const visible = JSON.stringify(reportData || {});
  const checks = [
    { code: "second_person_your", pattern: /\byour\b/i },
    { code: "second_person_you", pattern: /\byou\b/i },
    { code: "raw_doc_code", pattern: /\bDOC_[A-Z0-9_]+\b/ },
    { code: "raw_condition", pattern: /\bCONDITION_\d+\b/ },
    { code: "raw_true_false_prefix", pattern: /\b(?:TRUE|FALSE)_[A-Z_]+\b/ },
    { code: "raw_trigger_if", pattern: /\bTRIGGER_IF\b/ },
    { code: "raw_exclude_if", pattern: /\bEXCLUDE_IF\b/ },
    { code: "sales_pre_built", pattern: /\bpre-built\b/i },
    { code: "sales_kill", pattern: /\bkills?\b/i },
    { code: "sales_nice_to_have", pattern: /\bnice to have\b/i },
    { code: "raw_archetype_translator", pattern: /\bThe Translator\b/ },
    { code: "raw_archetype_doer", pattern: /\bThe Doer\b/ },
    { code: "raw_archetype_orchestrator", pattern: /\bThe Orchestrator\b/ },
    { code: "raw_archetype_creator", pattern: /\bThe Creator\b/ },
    { code: "raw_archetype_reader", pattern: /\bThe Reader\b/ },
    { code: "raw_archetype_judge", pattern: /\bThe Judge\b/ },
    { code: "raw_archetype_companion", pattern: /\bThe Companion\b/ },
    { code: "raw_archetype_shield", pattern: /\bThe Shield\b/ },
    { code: "raw_archetype_optimizer", pattern: /\bThe Optimizer\b/ },
    { code: "raw_archetype_mover", pattern: /\bThe Mover\b/ }
  ];
  return checks.filter(({ pattern }) => pattern.test(visible)).map(({ code }) => code);
}
