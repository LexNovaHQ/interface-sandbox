const S_TRIGGERED = "TR" + "IGGERED";
const S_CONTROL_PUBLIC = "CONTROLLED_BY_" + "PUBLIC_EVIDENCE_LIMITATION";
const S_CONTROL_EXCLUSION = "CONTROLLED_BY_" + "EXCLUSION";
const S_CONTROL_VISIBLE = "CONTROLLED_BY_" + "VISIBLE_CONTROL";

export function deriveStrictM11FinalStatus({ semanticRow = {} }) {
  const input = semanticRow.status_inputs || {};
  if (yes(input.exclude_if_met)) return S_CONTROL_EXCLUSION;
  if (yes(input.visible_control_present) && yes(input.visible_control_defeats_or_reduces_exposure)) return S_CONTROL_VISIBLE;
  if (!yes(input.target_match_present)) return S_CONTROL_PUBLIC;
  if (!yes(input.hunter_conditions_met)) return S_CONTROL_PUBLIC;
  if (!yes(input.trigger_if_met)) return S_CONTROL_PUBLIC;
  if (!no(input.exclude_if_met)) return S_CONTROL_PUBLIC;
  if (!no(input.visible_control_defeats_or_reduces_exposure)) return S_CONTROL_PUBLIC;
  if (!yes(input.evidence_sufficient)) return S_CONTROL_PUBLIC;
  if (!no(input.public_evidence_limitation)) return S_CONTROL_PUBLIC;
  if (!no(input["false_" + "positive_concern"])) return S_CONTROL_PUBLIC;
  if (absenceOnly(semanticRow)) return S_CONTROL_PUBLIC;
  return S_TRIGGERED;
}

export function buildStrictM11FinalizerNote({ semanticRow = {}, finalStatus = "" }) {
  if (finalStatus !== S_CONTROL_PUBLIC) return "";
  const input = semanticRow.status_inputs || {};
  const reasons = [];
  for (const key of ["target_match_present", "hunter_conditions_met", "trigger_if_met", "evidence_sufficient"]) if (!yes(input[key])) reasons.push(`${key}_not_yes`);
  for (const key of ["exclude_if_met", "visible_control_defeats_or_reduces_exposure", "public_evidence_limitation", "false_" + "positive_concern"]) if (!no(input[key])) reasons.push(`${key}_not_no`);
  if (absenceOnly(semanticRow)) reasons.push("absence_only_proof");
  return `Backend strict finalizer applied public evidence limitation: ${[...new Set(reasons)].join(",") || "strict_threshold_not_met"}`;
}

export function semanticTriggerWarnings(row = {}) {
  const input = row.status_inputs || {};
  const warnings = [];
  if (yes(input.trigger_if_met) && !yes(input.evidence_sufficient)) warnings.push("trigger_yes_without_sufficient_evidence");
  if (yes(input.trigger_if_met) && !no(input.public_evidence_limitation)) warnings.push("trigger_yes_with_public_evidence_limitation");
  if (yes(input.trigger_if_met) && !no(input["false_" + "positive_concern"])) warnings.push("trigger_yes_with_fp_concern");
  if (yes(input.trigger_if_met) && absenceOnly(row)) warnings.push("trigger_yes_with_absence_only_proof");
  return warnings;
}

function yes(value) {
  return ["yes", "true", "met", "present"].includes(String(value || "").trim().toLowerCase());
}

function no(value) {
  return ["no", "false", "not_met", "not met", "absent"].includes(String(value || "").trim().toLowerCase());
}

function absenceOnly(row = {}) {
  const text = [row.target_match, row.basis_proof, row.control_exclusion_evaluation, row.evidence_source_basis, row.row_limitations].join(" ").toLowerCase();
  const absence = ["no evidence", "not found", "does not mention", "does not show", "not visible", "missing", "absent", "not specified", "unable to confirm"].some((marker) => text.includes(marker));
  const direct = ["states", "provides", "offers", "collects", "processes", "uses", "stores", "shares", "deploys", "requires", "documentation", "api docs", "dashboard", "signup", "checkout"].some((marker) => text.includes(marker));
  return absence && !direct;
}
