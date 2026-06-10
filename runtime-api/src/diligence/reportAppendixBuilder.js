function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function statusLabel(status) {
  return String(status || "").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
}

export function buildForensicLedgerAppendix({ hydratedRows = {}, stage7Artifact = {}, stage8Ledger = {} } = {}) {
  const rows = asArray(hydratedRows.rows);
  return {
    registry_count: hydratedRows.registry_count || rows.length,
    ledger_count: rows.length,
    status_counts: Object.fromEntries(Object.entries(hydratedRows.status_counts || {}).map(([status, count]) => [statusLabel(status), count])),
    source_stage7_summary: stage7Artifact?.summary || null,
    source_stage8_operator_gate: stage8Ledger?.operator_challenge_gate || null,
    full_registry_ledger: true,
    row_level_proof: true,
    condition_trigger_basis: true,
    evidence_references: true,
    operator_challenge_trace: stage8Ledger?.operator_challenge_gate || null,
    forensic_ledger: rows.map((item) => ({
      registry_reference: item.registry_reference,
      exposure_title: item.exposure_title,
      assessment_outcome: item.assessment_outcome,
      final_status: item.assessment_status,
      functional_profile: item.functional_profile,
      legal_risk_surfaces: item.legal_risk_surfaces,
      severity: item.severity,
      timing_urgency: item.timing_urgency,
      jurisdictional_references: item.jurisdictional_references,
      finding_threshold_outcome: item.applicability_test?.finding_threshold_outcome,
      control_test_outcome: item.applicability_test?.control_test_outcome,
      condition_trigger_basis: {
        criteria_satisfied: asArray(item.applicability_test?.criteria?.satisfied),
        criteria_not_satisfied: asArray(item.applicability_test?.criteria?.not_satisfied),
        finding_threshold: item.applicability_test?.finding_threshold,
        control_exclusion_test: item.applicability_test?.control_exclusion_test
      },
      evidence_references: {
        evidence_reference: item.reviewed_evidence?.evidence_reference,
        feature_references: item.reviewed_evidence?.feature_references
      },
      status_explanation: item.residual_exposure,
      control_position: item.control_position,
      registry_basis: item.registry_basis,
      operator_challenge_trace: {
        stage8_gate_status: asText(stage8Ledger?.operator_challenge_gate?.gate_status || stage8Ledger?.operator_challenge_gate?.status),
        corrected_by_operator_challenge: false
      },
      applicability_test: item.applicability_test,
      raw_registry_payload: item.raw_registry_payload
    }))
  };
}
