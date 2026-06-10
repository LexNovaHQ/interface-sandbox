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

const CONTROL_THEME_RULES = [
  { label: "consent and notice", pattern: /consent|notice|permission|opt[- ]?in|opt[- ]?out|withdraw/i },
  { label: "retention and deletion", pattern: /retention|delete|deletion|erase|erasure|return|destroy|DSR|data subject/i },
  { label: "subprocessor and downstream-provider transparency", pattern: /subprocessor|sub-processor|downstream|provider|model provider|third[- ]party|vendor/i },
  { label: "model training and fine-tuning restrictions", pattern: /train|training|fine[- ]?tuning|fine tune|model improvement|learning/i },
  { label: "human review and escalation", pattern: /human review|human[- ]in[- ]the[- ]loop|appeal|escalation|override|handover/i },
  { label: "output reliance and accuracy controls", pattern: /hallucination|accuracy|output|reliance|professional advice|warranty/i },
  { label: "IP and output ownership", pattern: /copyright|IP|intellectual property|ownership|license|output ownership|infring/i },
  { label: "acceptable-use and misuse controls", pattern: /acceptable use|AUP|misuse|abuse|prohibited|impersonation|voice cloning|deepfake|harmful/i },
  { label: "security, breach, and confidentiality controls", pattern: /security|breach|confidential|encryption|incident|vulnerability|access control/i },
  { label: "service-level and operational commitments", pattern: /SLA|service level|availability|uptime|support|maintenance|credits/i },
  { label: "privacy and data-processing controls", pattern: /privacy|personal data|PII|processor|controller|DPA|data processing|cross[- ]border|transfer/i },
  { label: "biometric, voice, or sensitive-data safeguards", pattern: /biometric|voice|audio|speaker|diarization|voiceprint|sensitive/i },
  { label: "automated decisioning and decision-support controls", pattern: /decision|score|rank|recommend|eligibility|approval|automated/i },
  { label: "financial, payment, or transaction controls", pattern: /payment|financial|spend|invoice|credit|loan|purchase|transaction/i }
];

const COMMERCIAL_IMPACT_RULES = [
  { label: "customer diligence and enterprise approval", pattern: /enterprise|customer|security review|approval|vendor review|procurement/i },
  { label: "transaction review and contractual risk allocation", pattern: /deal|diligence|transaction|buyer|acquirer|indemnity|escrow|disclosure schedule|closing/i },
  { label: "regulatory scrutiny or enforcement risk", pattern: /regulator|enforcement|fine|penalty|FTC|DPA|authority|complaint|investigation/i },
  { label: "financial exposure or claims risk", pattern: /damages|liability|class action|claim|settlement|statutory|per violation|uncapped/i },
  { label: "launch readiness or product-governance timing", pattern: /launch|rollout|deployment|release|go-live|roadmap/i },
  { label: "contracting friction or negotiation delay", pattern: /contract|terms|MSA|DPA|negotiation|delay|stall|friction/i }
];

const SALES_LANGUAGE_REPLACEMENTS = [
  [/\byou['’]re\b/gi, "the company may be"],
  [/\byou['’]ve\b/gi, "the company has"],
  [/\byou['’]ll\b/gi, "the company may"],
  [/\byou['’]d\b/gi, "the company would"],
  [/\byour product\b/gi, "the product"],
  [/\byour platform\b/gi, "the platform"],
  [/\byour company\b/gi, "the company"],
  [/\byour customers\b/gi, "customers"],
  [/\byour\b/gi, "the company's"],
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
  [/\bon the hook\b/gi, "potentially responsible"],
  [/\bthe fix\b/gi, "the remediation route"],
  [/\bdisaster\b/gi, "material exposure"],
  [/\bnightmare\b/gi, "material issue"],
  [/\bcompany're\b/gi, "company may be"]
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

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function rawRegistryText(rowOrText) {
  if (typeof rowOrText === "object" && rowOrText !== null) {
    return [
      rowOrText.legal_pain,
      rowOrText.Legal_Pain,
      rowOrText.fp_mechanism,
      rowOrText.FP_Mechanism,
      rowOrText.fp_impact,
      rowOrText.FP_Impact,
      rowOrText.fix_route,
      rowOrText.Lex_Nova_Fix,
      rowOrText.hunter_trigger?.exclude_if,
      rowOrText.Hunter_Trigger?.exclude_if,
      rowOrText.Hunter_Trigger,
      rowOrText.Authority_IN,
      rowOrText.Authority_EU,
      rowOrText.Authority_US
    ].map(asText).filter(Boolean).join(" ");
  }
  return asText(rowOrText);
}

function authorityText(rowOrText) {
  if (typeof rowOrText !== "object" || rowOrText === null) return "the jurisdictional references listed for this item";
  const refs = [
    rowOrText.Authority_IN || rowOrText.authority?.IN,
    rowOrText.Authority_EU || rowOrText.authority?.EU,
    rowOrText.Authority_US || rowOrText.authority?.US
  ].map((item) => sanitizeVisibleText(item)).filter(Boolean);
  return refs.length ? refs.join("; ") : "the jurisdictional references listed for this item";
}

function unique(values = []) {
  return [...new Set(values.map((value) => stripExcessWhitespace(value)).filter(Boolean))];
}

function detectLabels(text, rules, fallback) {
  const raw = rawRegistryText(text);
  const labels = unique(rules.filter(({ pattern }) => pattern.test(raw)).map(({ label }) => label));
  return labels.length ? labels : [fallback];
}

function detectDocumentRoutes(rowOrText) {
  const raw = rawRegistryText(rowOrText);
  const routes = [];
  for (const [code, label] of Object.entries(DOCUMENT_ROUTE_LABELS)) {
    if (new RegExp(`\\b${code}\\b`, "i").test(raw)) routes.push(label);
  }
  const plainRules = [
    { label: "Terms of Service", pattern: /terms of service|\bToS\b/i },
    { label: "Privacy Policy", pattern: /privacy policy/i },
    { label: "Data Processing Addendum", pattern: /data processing addendum|\bDPA\b/i },
    { label: "Acceptable Use Policy", pattern: /acceptable use policy|\bAUP\b/i },
    { label: "Service Level Agreement", pattern: /service level agreement|\bSLA\b/i },
    { label: "AI / Agent Governance Terms", pattern: /agent governance|AI governance|AI terms/i },
    { label: "IP / Output Ownership Terms", pattern: /IP|output ownership|intellectual property/i },
    { label: "Internal Governance SOP", pattern: /SOP|internal governance|workflow/i },
    { label: "Human Review / Handover Protocol", pattern: /human review|handover|appeal|escalation/i }
  ];
  for (const { label, pattern } of plainRules) {
    if (pattern.test(raw)) routes.push(label);
  }
  return unique(routes).slice(0, 5);
}

function phraseList(items = [], fallback = "relevant legal and operational controls") {
  const clean = unique(items);
  if (!clean.length) return fallback;
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`;
  return `${clean.slice(0, -1).join(", ")}, and ${clean.at(-1)}`;
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
    text = text.replace(new RegExp(`\\b${escapeRegExp(pattern)}\\b`, "g"), replacement);
  }
  text = toDocumentRouteLabel(text);
  for (const [pattern, replacement] of SALES_LANGUAGE_REPLACEMENTS) text = text.replace(pattern, replacement);
  for (const [pattern, replacement] of RAW_LOGIC_REPLACEMENTS) text = text.replace(pattern, replacement);
  return stripExcessWhitespace(text);
}

export function legalSignificanceText(rowOrText) {
  const themes = detectLabels(rowOrText, CONTROL_THEME_RULES, "matter-specific legal and operational controls");
  const authority = authorityText(rowOrText);
  return `Legal significance: The Legal Exposure Registry flags this item for counsel review because the reviewed matter may implicate ${phraseList(themes)}. Counsel should assess the item against ${authority} and the specific evidence set before any client reliance.`;
}

export function exposureMechanismText(rowOrText) {
  const themes = detectLabels(rowOrText, CONTROL_THEME_RULES, "the relevant product, data, contract, or governance control position");
  return `Exposure mechanism: This item may arise where the product, workflow, or legal stack involves ${phraseList(themes)} and the reviewed evidence does not establish the control position required for this registry item.`;
}

export function commercialImpactText(rowOrText) {
  const impacts = detectLabels(rowOrText, COMMERCIAL_IMPACT_RULES, "customer diligence, contractual risk allocation, remediation timing, or transaction review");
  return `Commercial / deal impact: This item may affect ${phraseList(impacts)} depending on the matter context, customer profile, jurisdictional treatment, and any non-public controls verified by counsel.`;
}

export function remediationPathText(rowOrText) {
  const documents = detectDocumentRoutes(rowOrText);
  const themes = detectLabels(rowOrText, CONTROL_THEME_RULES, "the relevant policy, contract, governance, or operational control route");
  const documentPhrase = phraseList(documents, "the relevant policy, contract, governance, or operational documents");
  return `Suggested remediation path: Review ${documentPhrase} for ${phraseList(themes)}. Qualified counsel should confirm whether the reviewed evidence establishes an adequate control position for the relevant jurisdiction and matter context.`;
}

export function clarificationQuestionText({ criterionText, registryReference, controlTest } = {}) {
  const themes = detectLabels([criterionText, controlTest].filter(Boolean).join(" "), CONTROL_THEME_RULES, "the relevant applicability criterion or control position");
  const reference = sanitizeVisibleText(registryReference || "this registry item");
  return `Please provide the internal documents, customer terms, workflow evidence, or operational records needed to confirm ${phraseList(themes)} for ${reference}.`;
}

export function rawRegistryPayload(row = {}) {
  return {
    legal_pain: asText(row.legal_pain || row.Legal_Pain),
    exposure_mechanism: asText(row.fp_mechanism || row.FP_Mechanism),
    commercial_impact: asText(row.fp_impact || row.FP_Impact),
    remediation_route: asText(row.fix_route || row.Lex_Nova_Fix)
  };
}

export function visibleLanguageViolations(reportData) {
  const visible = JSON.stringify(reportData || {});
  const checks = [
    { code: "malformed_company_contraction", pattern: /\bcompany['’]re\b/i },
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
    { code: "sales_on_the_hook", pattern: /\bon the hook\b/i },
    { code: "sales_the_fix", pattern: /\bthe fix\b/i },
    { code: "raw_module_language", pattern: /\bmodule\b/i },
    { code: "internal_circuit_breaker", pattern: /\bCircuit Breaker\b/i },
    { code: "internal_bartz_aware", pattern: /\bBartz-aware\b/i },
    { code: "internal_pld_ready", pattern: /\bPLD-ready\b/i },
    { code: "internal_nate_aware", pattern: /\bNate-aware\b/i },
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
