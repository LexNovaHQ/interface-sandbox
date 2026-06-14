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

function appendixRef(index) {
  return `APP-${String(index + 1).padStart(3, "0")}`;
}

function humanCategoryFromThreatId(reference = "") {
  const code = asText(reference).split("_")[1]?.toUpperCase() || "GEN";
  const labels = {
    PRV: "Privacy, Data Protection & User Rights",
    BIO: "Biometric, Voice & Sensitive Data",
    DEC: "Automated Decisioning, Human Review & Reliance",
    INF: "IP, Content, Training Data & Infrastructure",
    LIA: "Liability, Warranty & Allocation of Risk",
    CNS: "Consent, Consumer Terms & User Notice",
    HAL: "Output Reliability, Hallucination & False Claims",
    FRD: "Misrepresentation, Fraud & AI-Washing",
    HRM: "User Harm, Safety & Vulnerable Users",
    TRD: "Trading, Pricing & Market Conduct",
    SHD: "Security & Operational Controls",
    FIN: "Financial, Billing & Commercial Terms Risk"
  };
  return labels[code] || "Platform Legal Control Exposure";
}

export function buildForensicLedgerAppendix({ hydratedRows = {}, stage7Artifact = {}, stage8Ledger = {} } = {}) {
  const rows = asArray(hydratedRows.rows);
  const fullRegistryLedger = rows.map((item, index) => ({
    appendix_ref: appendixRef(index),
    entry_number: item.entry_number ?? index + 1,
    threat_id: item.registry_reference,
    threat_name: item.exposure_title,
    human_category: humanCategoryFromThreatId(item.registry_reference),
    archetype: item.functional_profile,
    surface: item.legal_risk_surfaces,
    authority_relevance: item.jurisdictional_references,
    final_status: item.assessment_status,
    assessment_outcome: item.assessment_outcome,
    conditions: item.applicability_test?.criteria?.all || [],
    trigger_if_result: item.applicability_test?.finding_threshold_outcome,
    exclude_if_result: item.applicability_test?.control_test_outcome,
    feature_refs: item.reviewed_evidence?.feature_references || [],
    evidence_ref: item.reviewed_evidence?.evidence_reference,
    reasoning_summary: item.residual_exposure,
    registry_pain: item.severity,
    timing_urgency: item.timing_urgency,
    legal_significance: item.legal_significance,
    exposure_mechanism: item.exposure_mechanism,
    commercial_deal_impact: item.commercial_deal_impact,
    suggested_remediation_path: item.suggested_remediation_path,
    registry_basis: item.registry_basis,
    raw_registry_payload: item.raw_registry_payload
  }));

  return {
    appendix_notice:
      "This appendix preserves row-level forensic support for counsel and operator review. Registry-level mechanics are intentionally kept out of the main report body.",
    full_ledger_summary: {
      registry_count: hydratedRows.registry_count || rows.length,
      rows_evaluated: rows.length,
      status_counts: Object.fromEntries(Object.entries(hydratedRows.status_counts || {}).map(([status, count]) => [statusLabel(status), count])),
      operator_challenge_result: asText(stage8Ledger?.operator_challenge_gate?.gate_status || stage8Ledger?.operator_challenge_gate?.status || stage8Ledger?.operator_challenge_gate?.result)
    },
    full_registry_ledger: fullRegistryLedger,
    row_level_proof: fullRegistryLedger.map((row) => ({
      appendix_ref: row.appendix_ref,
      threat_id: row.threat_id,
      reasoning_summary: row.reasoning_summary,
      evidence_ref: row.evidence_ref
    })),
    condition_trigger_basis: fullRegistryLedger.map((row) => ({
      appendix_ref: row.appendix_ref,
      threat_id: row.threat_id,
      conditions: row.conditions,
      trigger_if_result: row.trigger_if_result,
      exclude_if_result: row.exclude_if_result
    })),
    evidence_references: fullRegistryLedger.map((row) => ({
      appendix_ref: row.appendix_ref,
      threat_id: row.threat_id,
      evidence_ref: row.evidence_ref,
      feature_refs: row.feature_refs
    })),
    operator_challenge_trace: stage8Ledger?.operator_challenge_gate || null,
    batch_warnings: asArray(stage7Artifact?.batch_warnings || stage7Artifact?.warnings),
    appendix_limitations: asArray(stage7Artifact?.limitations || stage8Ledger?.limitations).concat([
      "The appendix is audit support. The main report converts registry outcomes into lawyer-readable findings and review paths."
    ]),
    forensic_ledger: fullRegistryLedger
  };
}
