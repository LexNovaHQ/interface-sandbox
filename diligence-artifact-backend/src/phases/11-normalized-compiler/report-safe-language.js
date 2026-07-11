const term = (...parts) => parts.join("");
const word = (value) => new RegExp(`(^|\\W)${value}(?=$|\\W)`, "gi");

const FORBIDDEN_REPORT_TERMS = Object.freeze([
  [word(term("viol", "ation", "(s)?")), "$1review issue$2"],
  [word(term("non[-\\s]?", "compliant")), "$1not confirmed by public materials"],
  [word(term("ill", "egal")), "$1requires qualified review"],
  [word(term("lia", "ble")), "$1responsibility allocation requires qualified review"],
  [word(term("bre", "ach", "(es|ed)?")), "$1contract/legal issue$2 requiring qualified review"],
  [word(term("unen", "forceable")), "$1requires qualified review"],
  [word(term("fix required")), "$1candidate review route"],
  [word(term("clause must be added")), "$1candidate document review route"],
  [word(term("risk score")), "$1review posture"],
  [word(term("counsel review")), "$1qualified review"]
]);

export const REVIEW_READY_BOUNDARY_NOTICE =
  "This is a public-footprint diligence artifact and Review-Ready Draft support material. It is not legal advice, does not decide compliance, liability, enforceability, or legal sufficiency, and requires local counsel / qualified reviewer review before reliance.";

export const PUBLIC_FOOTPRINT_LIMITATION =
  "This report is limited to reviewed public materials, admitted source artifacts, and locked backend diligence outputs. It does not verify private implementation, customer contracts, internal controls, or non-public operating facts.";

export const NOT_VISIBLE = "Not visible in reviewed public materials";
export const NOT_SPECIFIED = "Not specified in locked artifact";

export function safeText(value, fallback = NOT_VISIBLE) {
  if (value === null || value === undefined) return fallback;
  let text = "";
  if (typeof value === "string") text = value;
  else if (typeof value === "number" || typeof value === "boolean") text = String(value);
  else if (Array.isArray(value)) text = value.map((item) => safeText(item, "")).filter(Boolean).join("; ");
  else if (typeof value === "object") text = JSON.stringify(value);
  text = text.replace(/\s+/g, " ").trim();
  if (!text) return fallback;
  return sanitizeReportText(text);
}

export function sanitizeReportText(value) {
  let text = String(value || "");
  for (const [pattern, replacement] of FORBIDDEN_REPORT_TERMS) text = text.replace(pattern, replacement);
  return text.replace(/\s+/g, " ").trim();
}

export function statusLabel(value) {
  const raw = String(value || "").trim().toUpperCase();
  const labels = {
    PASS: "Pass",
    PASS_WITH_LIMITATION: "Pass with limitation",
    LOCKED: "Locked",
    LOCKED_WITH_LIMITATIONS: "Locked with limitations",
    REPAIR_REQUIRED: "Repair required",
    CONTROLLED_FAILURE: "Controlled failure",
    TRIGGERED: "Visible exposure signal",
    CONTROLLED: "Visible control or limitation signal",
    CONTROLLED_BY_VISIBLE_CONTROL: "Visible control reduces exposure",
    CONTROLLED_BY_EXCLUSION: "Registry exclusion applied",
    CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION: "Public evidence limitation",
    SUPPORTED_EXPOSURE_SIGNAL: "Visible exposure signal",
    SUPPORTED_CONTROL_PRESENT: "Visible control language found",
    PARTIAL_OR_WEAK_SIGNAL: "Partial or unclear public signal",
    CONFLICTING_SIGNALS: "Conflicting public signals",
    INSUFFICIENT_EVIDENCE: "Insufficient public evidence",
    NOT_VISIBLE_AFTER_TARGETED_SEARCH: "Not visible in reviewed public materials",
    ACCESS_FAILED: "Source route could not be accessed",
    NOT_TRIGGERED: "Registry condition not triggered",
    NOT_APPLICABLE_CONTEXTUAL: "Not applicable on current public context",
    REQUIRES_QUALIFIED_REVIEW: "Needs qualified review",
    VISIBLE_CONTROL_PRESENT: "Visible control language found",
    VISIBLE_DATA_PROCESSING_NO_CONTROL_FOUND: "Visible data processing signal; no matching public control found",
    VISIBLE_BUT_CONTROL_WEAK_OR_UNCLEAR: "Visible but control language is weak or unclear",
    UNKNOWN_NOT_SEARCHED: "Not searched in public materials",
    NOT_APPLICABLE: "Not applicable on current public context"
  };
  return labels[raw] || safeText(value, "Status not specified");
}

export function reviewRouteLabel(value) {
  const raw = String(value || "").trim();
  const normalized = raw.toUpperCase();
  if (!raw) return "Qualified reviewer should verify";
  if (normalized.includes("PRIVACY")) return "Privacy / data protection review needed";
  if (normalized.includes("SECURITY")) return "Security controls review needed";
  if (normalized.includes("IP") || normalized.includes("CONTENT")) return "IP / content rights review needed";
  if (normalized.includes("VENDOR") || normalized.includes("SUBPROCESSOR")) return "Vendor / subprocessor flow-down review needed";
  if (normalized.includes("AI") || normalized.includes("GOVERNANCE") || normalized.includes("HUMAN")) return "AI governance / human-review route";
  if (normalized.includes("CONTRACT") || normalized.includes("LIABILITY") || normalized.includes("TERMS")) return "Contract and responsibility allocation review needed";
  return safeText(raw, "Qualified reviewer should verify");
}

export function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined || value === "") return [];
  return [value];
}

export function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export function unique(values = []) {
  return [...new Set(asArray(values).flat().map((item) => safeText(item, "")).filter(Boolean))];
}

export function countRows(value) {
  return asArray(value).length;
}

export function getPath(root, path, fallback = undefined) {
  const value = String(path || "").split(".").filter(Boolean).reduce((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) return acc[key];
    return undefined;
  }, root);
  return value === undefined ? fallback : value;
}
