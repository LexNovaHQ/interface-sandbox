function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function unique(values = []) {
  return [...new Set(values.map((value) => asText(value)).filter(Boolean))];
}

const FAMILY_DOCUMENT_ROUTES = {
  BIO: ["Privacy Policy", "Data Processing Addendum", "Data Protection Impact Assessment"],
  CNS: ["Privacy Policy", "Terms of Service", "Acceptable Use Policy"],
  DEC: ["AI / Agent Governance Terms", "Human Review / Handover Protocol", "Internal Governance SOP"],
  FIN: ["AI / Agent Governance Terms", "Terms of Service", "Human Review / Handover Protocol"],
  FRD: ["Terms of Service", "Acceptable Use Policy", "AI / Agent Governance Terms"],
  HAL: ["AI / Agent Governance Terms", "Acceptable Use Policy", "Human Review / Handover Protocol"],
  HRM: ["Internal Governance SOP", "Human Review / Handover Protocol", "Privacy Policy"],
  INF: ["IP / Output Ownership Terms", "Terms of Service", "AI / Agent Governance Terms"],
  LIA: ["Terms of Service", "Service Level Agreement", "AI / Agent Governance Terms"],
  PRV: ["Privacy Policy", "Data Processing Addendum", "Data Protection Impact Assessment"],
  SHD: ["Service Level Agreement", "Data Processing Addendum", "Internal Governance SOP"],
  TRD: ["Terms of Service", "Privacy Policy", "AI / Agent Governance Terms"]
};

const FAMILY_CONTROL_ROUTES = {
  BIO: ["capture consent check", "retention/deletion control", "sensitive-data handling review"],
  CNS: ["notice/consent review", "user rights workflow", "consumer-facing disclosure review"],
  DEC: ["human review gate", "appeals/escalation workflow", "decision-support limitation control"],
  FIN: ["transaction authority limit", "approval gate", "audit log and exception review"],
  FRD: ["claim substantiation review", "misrepresentation guardrail", "support/sales statement control"],
  HAL: ["human review protocol", "output limitation disclosure", "high-risk use restriction"],
  HRM: ["workplace use policy", "review/escalation protocol", "employee-data limitation"],
  INF: ["input/output ownership review", "training-data use control", "third-party content review"],
  LIA: ["warranty/disclaimer review", "liability allocation review", "customer reliance control"],
  PRV: ["subprocessor disclosure", "deletion/DSR workflow", "training-use and transfer control"],
  SHD: ["security commitment review", "incident/breach process", "availability/support control"],
  TRD: ["public disclosure review", "traceability/provenance control", "customer notice control"]
};

function severityTier(item = {}) {
  return asText(item.highest_severity?.tier || item.severity?.tier, "T5");
}

function timingRaw(item = {}) {
  return asText(item.highest_timing_urgency?.raw || item.timing_urgency?.raw, "WATCH");
}

function priorityFor(item = {}) {
  const tier = severityTier(item);
  const timing = timingRaw(item);
  if (["T1", "T2"].includes(tier) || timing === "ACTIVE_NOW") return "Priority 1 — Immediate / Pre-Signing / Pre-Launch";
  if (["T3", "T4"].includes(tier) || timing === "THIS_YEAR") return "Priority 2 — Customer / Enterprise Readiness";
  return "Priority 3 — Governance Maturity / Cleanup";
}

function familyCode(item = {}) {
  return asText(item.exposure_family_code, "GEN");
}

function documentRouteFor(item = {}) {
  const fromFamily = FAMILY_DOCUMENT_ROUTES[familyCode(item)] || [];
  const fromText = asText(item.suggested_remediation_path || item.commercial_deal_impact);
  const labels = [
    "Terms of Service",
    "Privacy Policy",
    "Data Processing Addendum",
    "Acceptable Use Policy",
    "Service Level Agreement",
    "AI / Agent Governance Terms",
    "IP / Output Ownership Terms",
    "Internal Governance SOP",
    "Human Review / Handover Protocol",
    "Data Protection Impact Assessment"
  ];
  return unique(fromFamily.concat(labels.filter((label) => fromText.includes(label))));
}

function controlRouteFor(item = {}) {
  return FAMILY_CONTROL_ROUTES[familyCode(item)] || ["policy/control review", "counsel validation", "client factual confirmation"];
}

function ownerFor(route = []) {
  const text = route.join(" ").toLowerCase();
  if (text.includes("data") || text.includes("privacy") || text.includes("subprocessor")) return "Privacy / product counsel";
  if (text.includes("security") || text.includes("incident") || text.includes("availability")) return "Security / operations / counsel";
  if (text.includes("service level") || text.includes("liability") || text.includes("terms")) return "Commercial / product counsel";
  if (text.includes("human review") || text.includes("sop") || text.includes("governance")) return "Product operations / counsel";
  if (text.includes("ip") || text.includes("output")) return "IP / product counsel";
  return "Matter owner with qualified counsel";
}

function actionFor(item = {}) {
  const docs = documentRouteFor(item);
  const controls = controlRouteFor(item);
  return {
    consolidated_finding_id: item.consolidated_finding_id,
    exposure_title: item.exposure_title,
    priority: priorityFor(item),
    supporting_registry_item_count: item.supporting_registry_item_count,
    supporting_registry_references: item.supporting_registry_references,
    document_route: docs,
    control_route: controls,
    specific_action: `Review ${docs.join(", ") || "the relevant legal stack"} and confirm ${controls.join(" / ")} for this exposure family.`,
    owner: ownerFor(docs.concat(controls)),
    counsel_review_point: `Qualified counsel should verify whether the current legal stack and operational controls adequately address ${item.exposure_title}.`,
    timing: priorityFor(item).replace(/^Priority \d+ — /, ""),
    output_document: "Review-Ready Remediation Handoff",
    open_question: `Confirm whether non-public controls or customer contract terms materially change the assessment for ${item.consolidated_finding_id}.`
  };
}

export function buildImplicationsRemediationPath({ consolidatedFindings = [], controlEvidencedItems = [], matterSensitivity = "Product / Policy Review Sensitive" } = {}) {
  const actions = asArray(consolidatedFindings).map(actionFor);
  const buckets = new Map();
  for (const action of actions) {
    if (!buckets.has(action.priority)) buckets.set(action.priority, []);
    buckets.get(action.priority).push(action);
  }

  return {
    matter_sensitivity: matterSensitivity,
    remediation_roadmap: actions,
    remediation_priority_map: [...buckets.entries()].map(([priority, bucketActions]) => ({ priority, actions: bucketActions })),
    document_route: unique(actions.flatMap((action) => action.document_route)),
    control_route: unique(actions.flatMap((action) => action.control_route)),
    review_priority: actions.map((action) => ({
      consolidated_finding_id: action.consolidated_finding_id,
      exposure_title: action.exposure_title,
      priority: action.priority,
      counsel_review_point: action.counsel_review_point
    })),
    review_ready_handoff_bridge: actions.map((action) => ({
      consolidated_finding_id: action.consolidated_finding_id,
      output_document: action.output_document,
      document_route: action.document_route,
      control_route: action.control_route,
      open_question: action.open_question
    })),
    control_follow_up: asArray(controlEvidencedItems).map((item) => ({
      registry_reference: item.registry_reference,
      exposure_title: item.exposure_title,
      residual_watchpoint: item.residual_exposure,
      suggested_remediation_path: item.suggested_remediation_path
    }))
  };
}

export { documentRouteFor, controlRouteFor, priorityFor };
