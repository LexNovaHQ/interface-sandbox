export const REPORT_TITLE = "Legal Exposure Diligence Report";

export const REPORT_SUBTITLE = "Matter Evidence Review";

export const REVIEW_READY_DISCLAIMER =
  "This report is a legal architecture and diligence-support output. It is not legal advice and must be reviewed by qualified counsel in the relevant jurisdiction before client reliance, filing, negotiation, or implementation.";

export const STATUS_LABELS = Object.freeze({
  TRIGGERED: "Identified Exposure",
  CONTROLLED: "Control Evidenced",
  INSUFFICIENT_EVIDENCE: "Clarification Required",
  NOT_TRIGGERED: "No Finding on Reviewed Evidence",
  NOT_APPLICABLE: "Outside Current Review Scope"
});

export const STATUS_SORT_ORDER = Object.freeze({
  TRIGGERED: 1,
  INSUFFICIENT_EVIDENCE: 2,
  CONTROLLED: 3,
  NOT_TRIGGERED: 4,
  NOT_APPLICABLE: 5
});

export const PAIN_TIER_LABELS = Object.freeze({
  T1: "T1 — Existential",
  T2: "T2 — Uncapped Money",
  T3: "T3 — Deal / Customer Approval Risk",
  T4: "T4 — Regulatory Heat",
  T5: "T5 — Friction"
});

export const VELOCITY_LABELS = Object.freeze({
  ACTIVE_NOW: "Immediate",
  THIS_YEAR: "Near-Term",
  INCOMING: "Upcoming",
  WATCH: "Monitor"
});

export const LANE_LABELS = Object.freeze({
  A: "External Product / Customer-Facing Use",
  B: "Internal Workplace / Operational Use",
  Both: "External and Internal Use Contexts",
  BOTH: "External and Internal Use Contexts"
});

export const COLUMN_LABELS = Object.freeze({
  Threat_ID: "Registry Reference",
  Threat_Name: "Exposure Title",
  Lane: "Use Context",
  Archetype: "Functional Profile",
  Surface: "Legal Risk Surface",
  Authority_IN: "India Jurisdictional Reference",
  Authority_EU: "EU / UK Jurisdictional Reference",
  Authority_US: "US Jurisdictional Reference",
  Velocity: "Timing / Urgency",
  Pain_Tier: "Severity Tier",
  Pain_Category: "Exposure Category",
  Pain_Depth: "Exposure Depth",
  Status: "Registry Status",
  Effective_Date: "Effective / Review Date",
  Legal_Pain: "Legal Significance",
  FP_Mechanism: "Exposure Mechanism",
  FP_Impact: "Commercial / Deal Impact",
  Lex_Nova_Fix: "Suggested Remediation Path",
  Hunter_Trigger: "Applicability Test",
  Provenance: "Registry Basis"
});

export const LOGIC_LABELS = Object.freeze({
  condition: "Applicability Criterion",
  condition_result: "Criterion Outcome",
  condition_basis: "Evidentiary Basis",
  trigger_if: "Finding Threshold",
  exclude_if: "Control / Exclusion Test",
  trigger_if_result: "Finding Threshold Outcome",
  exclude_if_result: "Control Test Outcome",
  final_status: "Assessment Outcome",
  deterministic_formula_verifier: "Rule Consistency Check"
});

export const BANNED_VISIBLE_TERMS = Object.freeze([
  "Threat_ID",
  "Threat_Name",
  "Hunter_Trigger",
  "FP_Mechanism",
  "FP_Impact",
  "Lex_Nova_Fix",
  "TRIGGER_IF",
  "EXCLUDE_IF",
  "trigger_if_result",
  "exclude_if_result",
  "final_status",
  "Operator Challenge",
  "Vault",
  "Node 5B"
]);

export function displayStatus(status) {
  return STATUS_LABELS[status] || "Assessment Not Classified";
}

export function displayPainTier(tier, category) {
  const normalizedTier = String(tier || "").trim();
  if (PAIN_TIER_LABELS[normalizedTier]) return PAIN_TIER_LABELS[normalizedTier];
  const normalizedCategory = String(category || "").trim();
  return [normalizedTier, normalizedCategory].filter(Boolean).join(" — ") || "Severity Not Specified";
}

export function displayVelocity(velocity) {
  const normalized = String(velocity || "").trim();
  return VELOCITY_LABELS[normalized] || normalized || "Timing Not Specified";
}

export function displayLane(lane) {
  const normalized = String(lane || "").trim();
  return LANE_LABELS[normalized] || normalized || "Use Context Not Specified";
}

export function displayBoolean(value) {
  if (value === true) return "Satisfied";
  if (value === false) return "Not Satisfied";
  return "Not Determined";
}

export function displayControlOutcome(value) {
  if (value === true) return "Control Evidenced";
  if (value === false) return "No Sufficient Control Evidenced";
  return "Control Position Not Determined";
}

export function severityRank(tier) {
  const normalized = String(tier || "").trim();
  const match = normalized.match(/^T(\d+)/i);
  return match ? Number(match[1]) : 99;
}

export function urgencyRank(velocity) {
  const normalized = String(velocity || "").trim();
  const order = { ACTIVE_NOW: 1, THIS_YEAR: 2, INCOMING: 3, WATCH: 4 };
  return order[normalized] || 99;
}
