const asArray = (value) => Array.isArray(value) ? value : [];
const safeObject = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const asText = (value, fallback = "") => String(value ?? "").trim() || fallback;

function rowId(row = {}) {
  return asText(row.threat_id || row.Threat_ID || row.registry_reference || row.registry_row_id || row.appendix_row_reference);
}

function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function correctionRowsFromStage8(stage8QualityControlLedger = {}) {
  const direct = asArray(stage8QualityControlLedger.corrections);
  const accepted = asArray(stage8QualityControlLedger.accepted_corrections);
  return direct.length ? direct : accepted;
}

export function normalizeStage8QualityControlLedger({ stage8Ledger = {}, stage8Export = {} } = {}) {
  const operatorGate = safeObject(stage8Ledger.operator_challenge_gate || stage8Export.operator_challenge?.operator_challenge_gate);
  const correctionMeta = asArray(stage8Ledger.correction_meta || stage8Export.correction_result?.correction_meta);
  const reopenedRows = asArray(operatorGate.reopened_rows || stage8Export.summary?.reopened_rows);
  const notes = asArray(operatorGate.notes).concat(asArray(stage8Export.model_metadata?.model_warnings));
  const corrections = correctionMeta.map((item, index) => ({
    correction_id: asText(item.correction_id || item.id, `QC-CORR-${String(index + 1).padStart(3, "0")}`),
    row_ref: rowId(item),
    correction_status: "accepted",
    correction_source: "stage8_quality_control",
    correction_meta: item
  }));
  const challenges = reopenedRows.map((item, index) => ({
    challenge_id: asText(item.challenge_id || item.id, `QC-CHAL-${String(index + 1).padStart(3, "0")}`),
    row_ref: rowId(item),
    challenge_reason: asText(item.reason || item.required_action, "Stage 8 quality control challenged this row."),
    previous_outcome: asText(item.previous_status),
    proposed_outcome: asText(item.reopened_status),
    raw_challenge: item
  }));
  return {
    qc_ledger_version: "stage8_quality_control_ledger_v1",
    artifact_type: "stage8_quality_control_ledger",
    generated_at: stage8Ledger.generated_at || stage8Export.generated_at || null,
    run_id: stage8Ledger.run_id || stage8Export.run_id || null,
    source_artifact_type: stage8Ledger.artifact_type || stage8Export.artifact_type || null,
    corrected_count: Number(stage8Ledger.corrected_count ?? stage8Export.correction_result?.corrected_count ?? corrections.length ?? 0),
    corrections,
    challenges,
    accepted_corrections: corrections,
    rejected_corrections: [],
    quality_warnings: notes.filter(Boolean),
    unresolved_items: challenges.filter((item) => /unresolved|exhaust|failed/i.test(JSON.stringify(item))),
    operator_challenge_gate: operatorGate,
    correction_meta: correctionMeta,
    source_policy: {
      not_a_registry_ledger: true,
      applies_to: "exposure_profile.registry_ledger",
      stage9_must_consume_effective_registry_ledger_after_qc: true
    }
  };
}

export function applyStage8QualityControlToExposureProfile({ exposureProfile = {}, stage8QualityControlLedger = {}, stage8Ledger = {} } = {}) {
  const base = clone(exposureProfile) || {};
  const originalLedger = asArray(base.registry_ledger);
  const postChallengeLedger = asArray(stage8Ledger.post_challenge_ledger);
  const effectiveLedger = postChallengeLedger.length ? postChallengeLedger : originalLedger;
  const correctionRows = correctionRowsFromStage8(stage8QualityControlLedger);
  const correctedIds = new Set(correctionRows.map((item) => rowId(item) || asText(item.row_ref)).filter(Boolean));
  return {
    ...base,
    profile_version: base.profile_version || "exposure_profile_v1",
    registry_ledger: effectiveLedger,
    effective_registry_ledger: effectiveLedger,
    quality_control_applied: true,
    quality_control_trace: {
      qc_ledger_version: stage8QualityControlLedger.qc_ledger_version || "stage8_quality_control_ledger_v1",
      corrected_count: Number(stage8QualityControlLedger.corrected_count || correctedIds.size || 0),
      corrected_row_refs: [...correctedIds],
      warnings: asArray(stage8QualityControlLedger.quality_warnings),
      unresolved_items: asArray(stage8QualityControlLedger.unresolved_items),
      source_policy: "Stage 8 QC ledger applied as correction overlay to exposure_profile.registry_ledger; Stage 8 is not a competing registry ledger."
    },
    ledger_summary: {
      ...(base.ledger_summary || {}),
      original_registry_ledger_rows: originalLedger.length,
      effective_registry_ledger_rows: effectiveLedger.length,
      stage8_qc_corrected_count: Number(stage8QualityControlLedger.corrected_count || correctedIds.size || 0)
    }
  };
}
