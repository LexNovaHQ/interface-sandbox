import {
  asArray,
  compactRegistryLogicReference,
  compactSourceBundleForOperatorChallenge,
  threatId
} from "./liveRunShared.js";

export function buildStage8CompactFullLedgerChallengeInput({ runId, registryTotal, mergedLedger, stage7Artifact, registryRows, stage6Cache, scanner }) {
  const suspiciousById = new Map(asArray(scanner.suspicious_rows).map((item) => [item.threat_id, item]));
  const challengeIds = new Set(suspiciousById.keys());
  return {
    run_id: runId,
    operator_challenge_scope: {
      mode: "compact_full_ledger_with_suspicious_index",
      full_ledger_row_count: asArray(mergedLedger).length,
      suspicious_row_count: challengeIds.size,
      rule_text: "Stage 8 receives the full merged ledger for count compatibility, but full upstream evidence is stripped. The deterministic scanner selected suspicious rows. Focus challenge on stage8_deterministic_scan.suspicious_rows and emit corrections only for those rows when safe."
    },
    registry_count_loaded: registryTotal,
    registry_total_count: registryTotal,
    registry_count_evaluated: asArray(mergedLedger).length,
    registry_evaluation_ledger: asArray(mergedLedger).map((entry) => {
      const id = threatId(entry);
      return suspiciousById.has(id) ? { ...entry, stage8_suspicion: suspiciousById.get(id) } : entry;
    }),
    registry_batch_meta: {
      run_id: stage7Artifact.run_id || runId,
      batch_id: "MERGED_COMPACT_STAGE8_CHALLENGE",
      is_merged_ledger: true,
      compact_operator_challenge: true,
      registry_count_loaded: registryTotal,
      registry_total_count: registryTotal,
      registry_count_evaluated: asArray(mergedLedger).length,
      suspicious_row_count: challengeIds.size,
      stage7_artifact_type: stage7Artifact.artifact_type || null
    },
    stage8_deterministic_scan: {
      scan_version: scanner.scan_version,
      scanned_row_count: scanner.scanned_row_count,
      suspicious_row_count: scanner.suspicious_row_count,
      suspicious_rows: scanner.suspicious_rows,
      high_risk_checks: scanner.high_risk_checks,
      warnings: scanner.warnings
    },
    source_bundle: compactSourceBundleForOperatorChallenge(stage6Cache.source_bundle),
    ...scanner.compact_summaries,
    registry_logic_reference: compactRegistryLogicReference(asArray(registryRows)).filter((row) => challengeIds.has(row.threat_id)),
    prior_stage_summaries: {
      stage7_summary: stage7Artifact.summary || null,
      active_archetypes: stage7Artifact.active_archetypes || [],
      active_surfaces: stage7Artifact.active_surfaces || [],
      route_records: asArray(stage7Artifact.route_records).filter((record) => challengeIds.has(record.threat_id)),
      stage8_input_policy: "compact_full_ledger_with_suspicious_index_no_full_upstream_payload"
    },
    test_run: false
  };
}
