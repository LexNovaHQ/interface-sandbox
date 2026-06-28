const JURISDICTION_FAMILIES = new Set(["BIO", "CNS", "TRD", "HRM", "DEC"]);
const ABSENCE_ALLOWED = new Set(["UNI_LIA_LB1", "UNI_INF_IN1", "UNI_PRV_IN4", "ORC_PRV_002"]);
const SPECULATIVE_PREFIXES = ["TRN_BIO", "UNI_CNS", "CMP_HRM", "RDR_INF", "OPT_TRD", "MOV_LIA", "JDG_DEC"];
const DIRECT_PROOF_MARKERS = ["source:", "http", "terms", "privacy", "dpa", "trust", "policy", "public page", "published", "states", "says", "provides", "last modified"];
const ABSENCE_MARKERS = ["no standalone", "not found", "no evidence", "does not show", "does not explicitly", "missing", "absent", "not publicly", "not visible"];
const SPECULATION_MARKERS = ["may", "could", "potential", "if deployed", "if used", "future", "emerging", "possible", "likely"];
const JURISDICTION_MARKERS = ["illinois", "bipa", "colorado", "california", "cpra", "ccpa", "new york", "ny gbl", "rosca", "sebi", "eu ai act", "european union", "gdpr"];
const GOVERNANCE_GAP_MARKERS = ["aup", "ai use policy", "acceptable use", "subprocessor", "breach", "incident", "cert-in", "dpa", "retention", "deletion"];

export function applyM11FalsePositiveFirewall({ row = {}, routeRow = {} }) {
  const status = String(row.evaluation_status || row.trigger_status || "").trim().toUpperCase();
  if (status !== "TRIGGERED") return row;

  const threatId = String(row.Threat_ID || routeRow.Threat_ID || "").trim();
  const family = threatId.split("_")[1] || "";
  const text = [row.registry_exposure, row.target_match, row.basis_proof, row.review_route, row.row_limitations, routeRow.Threat_Name, routeRow.Surface, routeRow.route_reason].join(" ").toLowerCase();
  const reasons = [];

  const absenceOnly = hasAny(text, ABSENCE_MARKERS) && !hasAny(text, DIRECT_PROOF_MARKERS.filter((marker) => marker !== "policy"));
  const speculative = hasAny(text, SPECULATION_MARKERS);
  const directProof = hasAny(text, DIRECT_PROOF_MARKERS);
  const jurisdictionSpecific = JURISDICTION_FAMILIES.has(family) || hasAny(text, JURISDICTION_MARKERS) || SPECULATIVE_PREFIXES.some((prefix) => threatId.startsWith(prefix));
  const jurisdictionProven = hasAny(text, JURISDICTION_MARKERS);
  const absencePermitted = ABSENCE_ALLOWED.has(threatId) || (threatId.startsWith("UNI_") && hasAny(text, GOVERNANCE_GAP_MARKERS));

  if (!directProof) reasons.push("NO_DIRECT_PUBLIC_PROOF_MARKER");
  if (absenceOnly && !absencePermitted) reasons.push("ABSENCE_ONLY_NOT_TRIGGER_PROOF");
  if (speculative) reasons.push("SPECULATIVE_DEPLOYMENT_LANGUAGE");
  if (jurisdictionSpecific && !jurisdictionProven) reasons.push("JURISDICTION_OR_REGIME_FIT_UNPROVEN");

  if (!reasons.length) return row;

  const limitation = `False-positive firewall demoted prior TRIGGERED status to CONTROLLED: ${reasons.join("; ")}. Treat as watchlist/controlled limitation unless direct public proof later confirms activity, jurisdiction, and mandatory-control gap.`;
  return {
    ...row,
    trigger_status: "CONTROLLED",
    evaluation_status: "CONTROLLED",
    row_limitations: append(row.row_limitations, limitation)
  };
}

function hasAny(text, markers) {
  return markers.some((marker) => text.includes(marker));
}

function append(existing, addition) {
  const current = String(existing || "").trim();
  return current ? `${current} | ${addition}` : addition;
}
