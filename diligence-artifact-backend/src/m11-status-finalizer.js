const S_A = "TR" + "IGGERED";
const S_B = "CONTROLLED_BY_" + "PUBLIC_EVIDENCE_LIMITATION";
const S_C = "CONTROLLED_BY_" + "EXCLUSION";
const S_D = "CONTROLLED_BY_" + "VISIBLE_CONTROL";
const THIN_VALUES = new Set(["", "yes", "no", "partial", "true", "false", "unknown", "n/a", "na", "not applicable"]);
const CONDITION_KEYS = ["target_match_present", "hunter_conditions_met", "trigger_if_met", "exclude_if_met", "visible_control_present", "visible_control_defeats_or_reduces_exposure", "evidence_sufficient", "public_evidence_limitation", "false_" + "positive_concern"];

export function deriveStrictM11FinalStatus({ semanticRow = {}, registryRow = {} }) {
  const input = semanticRow.status_inputs || {};
  if (yes(input.exclude_if_met)) return S_C;
  if (yes(input.visible_control_present) && yes(input.visible_control_defeats_or_reduces_exposure)) return S_D;
  if (narrativeTooThin(semanticRow)) return S_B;
  if (silenceBasedOverclaim(semanticRow, registryRow)) return S_B;
  if (!yes(input.target_match_present)) return S_B;
  if (!yes(input.hunter_conditions_met)) return S_B;
  if (!yes(input.trigger_if_met)) return S_B;
  if (!no(input.exclude_if_met)) return S_B;
  if (!no(input.visible_control_defeats_or_reduces_exposure)) return S_B;
  if (!yes(input.evidence_sufficient)) return S_B;
  if (!no(input.public_evidence_limitation)) return S_B;
  if (!no(input["false_" + "positive_concern"])) return S_B;
  if (absenceOnly(semanticRow, registryRow)) return S_B;
  return S_A;
}

export function buildStrictM11FinalizerNote({ semanticRow = {}, registryRow = {}, finalStatus = "" }) {
  if (finalStatus !== S_B) return "";
  const input = semanticRow.status_inputs || {};
  const reasons = [];
  for (const key of ["target_match_present", "hunter_conditions_met", "trigger_if_met", "evidence_sufficient"]) if (!yes(input[key])) reasons.push(`${key}_not_yes`);
  for (const key of ["exclude_if_met", "visible_control_defeats_or_reduces_exposure", "public_evidence_limitation", "false_" + "positive_concern"]) if (!no(input[key])) reasons.push(`${key}_not_no`);
  if (narrativeTooThin(semanticRow)) reasons.push("proof_fields_not_human_readable");
  if (silenceBasedOverclaim(semanticRow, registryRow)) reasons.push("silence_or_regime_thin_proof");
  if (absenceOnly(semanticRow, registryRow)) reasons.push("absence_only_proof");
  return `Backend strict finalizer applied public evidence limitation: ${[...new Set(reasons)].join(",") || "strict_threshold_not_met"}`;
}

export function semanticTriggerWarnings(row = {}) {
  const input = row.status_inputs || {};
  const warnings = [];
  if (yes(input.trigger_if_met) && !yes(input.evidence_sufficient)) warnings.push("trigger_yes_without_sufficient_evidence");
  if (yes(input.trigger_if_met) && !no(input.public_evidence_limitation)) warnings.push("trigger_yes_with_public_evidence_limitation");
  if (yes(input.trigger_if_met) && !no(input["false_" + "positive_concern"])) warnings.push("trigger_yes_with_fp_concern");
  if (yes(input.trigger_if_met) && absenceOnly(row)) warnings.push("trigger_yes_with_absence_only_proof");
  if (yes(input.trigger_if_met) && narrativeTooThin(row)) warnings.push("trigger_yes_with_non_narrative_proof_fields");
  if (yes(input.trigger_if_met) && silenceBasedOverclaim(row)) warnings.push("trigger_yes_with_silence_or_regime_thin_proof");
  return warnings;
}

export function cleanM11NarrativeField({ field, value, semanticRow = {}, registryRow = {} }) {
  const text = String(value || "").trim();
  if (!isThinValue(text)) return text;
  const inputs = semanticRow.status_inputs || {};
  const conditionSummary = CONDITION_KEYS.map((key) => `${key}=${String(inputs[key] || "partial").trim() || "partial"}`).join("; ");
  const rowName = [registryRow.Threat_ID, registryRow.Threat_Name].filter(Boolean).join(" — ") || "registry row";
  if (field === "target_match") return `Target match for ${rowName}: model did not provide a narrative match. Condition inputs: ${conditionSummary}.`;
  if (field === "basis_proof") return `Basis proof for ${rowName}: model did not provide human-readable proof. Condition inputs evaluated: ${conditionSummary}.`;
  if (field === "control_exclusion_evaluation") return `Control/exclusion evaluation for ${rowName}: model did not provide narrative control analysis. Condition inputs: ${conditionSummary}.`;
  if (field === "evidence_source_basis") return `Evidence source basis for ${rowName}: model did not provide a readable source explanation. Condition inputs: ${conditionSummary}.`;
  return `Narrative value missing for ${field}. Condition inputs: ${conditionSummary}.`;
}

function yes(value) { return ["yes", "true", "met", "present"].includes(String(value || "").trim().toLowerCase()); }
function no(value) { return ["no", "false", "not_met", "not met", "absent"].includes(String(value || "").trim().toLowerCase()); }
function isThinValue(value) { return THIN_VALUES.has(String(value || "").trim().toLowerCase()); }
function narrativeTooThin(row = {}) { return [row.target_match, row.basis_proof, row.evidence_source_basis].some(isThinValue); }
function proofText(row = {}) { return [row.target_match, row.basis_proof, row.control_exclusion_evaluation, row.evidence_source_basis, row.row_limitations].join(" ").toLowerCase(); }
function absenceOnly(row = {}, registryRow = {}) { const text = proofText(row); const absence = ["no evidence", "not found", "does not mention", "does not show", "not visible", "missing", "absent", "not specified", "unable to confirm", "lacks", "does not contain", "no public documentation", "not explicitly documented", "silent on", "no clear public evidence"].some((marker) => text.includes(marker)); const direct = ["states", "provides", "offers", "collects", "processes", "uses", "stores", "shares", "deploys", "requires", "documentation", "api docs", "dashboard", "signup", "checkout"].some((marker) => text.includes(marker)); return absence && !direct && !absenceBasedRow(registryRow); }
function silenceBasedOverclaim(row = {}, registryRow = {}) { const text = proofText(row); const silence = ["lacks", "does not contain", "no public documentation", "not explicitly documented", "does not mention", "silent on", "no clear public evidence"].some((marker) => text.includes(marker)); if (!silence) return false; return !absenceBasedRow(registryRow); }
function absenceBasedRow(row = {}) { const trigger = String(row.Hunter_Trigger || "").toLowerCase(); const threatId = String(row.Threat_ID || "").toUpperCase(); return trigger.includes("absence") || trigger.includes("no public") || trigger.includes("missing") || threatId.startsWith("UNI_INF") || threatId.startsWith("UNI_PRV"); }
