function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function nowIso() {
  return new Date().toISOString();
}

function statusOf(row = {}) {
  return String(row.final_status || row.status || row.finalStatus || "UNKNOWN").trim() || "UNKNOWN";
}

function threatId(row = {}) {
  return row.threat_id || row.Threat_ID || row.registry_id || row.id || null;
}

function countsByStatus(rows = []) {
  return asArray(rows).reduce((acc, row) => {
    const status = statusOf(row);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
}

function exposureSeverity(row = {}) {
  const explicit = row.severity || row.exposure_severity || row.risk_severity || row.priority;
  if (explicit) return explicit;
  const status = statusOf(row);
  if (status === "TRIGGERED") return "requires_review";
  if (status === "INSUFFICIENT_EVIDENCE") return "evidence_gap";
  if (status === "CONTROLLED") return "controlled";
  if (status === "NOT_TRIGGERED") return "not_triggered";
  if (status === "NOT_APPLICABLE") return "not_applicable";
  return "unknown";
}

function buildExposureFindings(rows = []) {
  return asArray(rows)
    .filter((row) => ["TRIGGERED", "INSUFFICIENT_EVIDENCE", "CONTROLLED"].includes(statusOf(row)))
    .map((row) => ({
      threat_id: threatId(row),
      threat_name: row.threat_name || row.Threat_Name || null,
      final_status: statusOf(row),
      exposure_severity: exposureSeverity(row),
      feature_refs: asArray(row.feature_refs),
      evidence_ref: row.evidence_ref || row.primary_evidence_ref || null,
      reasoning_summary: row.reasoning_summary || row.summary || null
    }));
}

function buildRemediationMap(rows = []) {
  return asArray(rows)
    .filter((row) => ["TRIGGERED", "INSUFFICIENT_EVIDENCE"].includes(statusOf(row)))
    .map((row) => ({
      threat_id: threatId(row),
      threat_name: row.threat_name || row.Threat_Name || null,
      final_status: statusOf(row),
      remediation_basis: statusOf(row) === "INSUFFICIENT_EVIDENCE" ? "clarify_or_collect_evidence" : "review_and_remediate_exposure",
      recommended_action: row.recommended_action || row.remediation_action || row.remediation || null,
      evidence_ref: row.evidence_ref || row.primary_evidence_ref || null,
      feature_refs: asArray(row.feature_refs)
    }));
}

function profilePresence({ targetProfile, targetFeatureProfile, legalCartography, dataProvenanceProfile }) {
  return {
    target_profile_present: Boolean(targetProfile),
    target_feature_profile_present: Boolean(targetFeatureProfile),
    legal_cartography_present: Boolean(legalCartography),
    data_provenance_profile_present: Boolean(dataProvenanceProfile)
  };
}

export function buildStage7ExposureProfile({
  stage7Artifact = {},
  registryRows = [],
  targetProfile = null,
  targetFeatureProfile = null,
  legalCartography = null,
  dataProvenanceProfile = null,
  runId = null,
  generatedAt = null
} = {}) {
  const registryLedger = asArray(stage7Artifact.merged_ledger || stage7Artifact.registry_ledger);
  const modelRows = asArray(stage7Artifact.model_rows);
  const deterministicRows = asArray(stage7Artifact.deterministic_rows);
  const summary = stage7Artifact.summary || {};
  const finalStatusCounts = summary.final_status_counts || countsByStatus(registryLedger);

  return {
    profile_version: "exposure_profile_v1",
    artifact_type: "stage7_exposure_profile",
    generated_at: generatedAt || stage7Artifact.generated_at || nowIso(),
    run_id: runId || stage7Artifact.run_id || null,
    registry_ledger: registryLedger,
    ledger_summary: {
      row_count: registryLedger.length,
      source_row_count: Number(stage7Artifact.source_row_count || registryRows.length || registryLedger.length),
      final_status_counts: finalStatusCounts,
      model_row_count: modelRows.length,
      deterministic_row_count: deterministicRows.length,
      validation: summary.validation || null,
      model_coverage: summary.model_coverage || null
    },
    routing_summary: summary.routing_summary || {},
    exposure_findings: buildExposureFindings(registryLedger),
    remediation_map: buildRemediationMap(registryLedger),
    evidence_coverage_manifest: asArray(stage7Artifact.evidence_coverage_manifest),
    forensic_appendix_indexes: {
      active_archetypes: asArray(stage7Artifact.active_archetypes),
      active_surfaces: asArray(stage7Artifact.active_surfaces),
      route_records: asArray(stage7Artifact.route_records),
      batch_summaries: asArray(summary.batch_summaries),
      deterministic_rows: deterministicRows,
      model_rows: modelRows
    },
    source_profile_presence: profilePresence({ targetProfile, targetFeatureProfile, legalCartography, dataProvenanceProfile }),
    limitations: asArray(stage7Artifact.limitations)
  };
}
