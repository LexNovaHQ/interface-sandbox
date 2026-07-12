const CONTROLLED = new Set([
  "CONTROLLED_BY_VISIBLE_CONTROL",
  "CONTROLLED_BY_EXCLUSION",
  "CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION"
]);
const MATERIAL = new Set(["TRIGGERED", ...CONTROLLED]);
const ACCEPTED_CHALLENGE_STATUSES = new Set(["PASS", "PASS_WITH_LIMITATION", "LOCKED", "LOCKED_WITH_LIMITATIONS"]);

export function buildPhase10CompilerCompatibility({ artifacts = {} } = {}) {
  const manifest = unwrap(artifacts.active_threat_registry_manifest, "active_threat_registry_manifest");
  const route = unwrap(artifacts.exposure_registry_route_plan, "exposure_registry_route_plan");
  const workpad = unwrap(artifacts.exposure_registry_workpad_98, "exposure_registry_workpad_98");
  const controlled = unwrap(artifacts.exposure_registry_controlled_profile, "exposure_registry_controlled_profile");
  const triggered = unwrap(artifacts.exposure_registry_triggered_profile, "exposure_registry_triggered_profile");
  const challenge = unwrap(artifacts.challenge_gate, "challenge_gate");
  const failures = [];
  const warnings = [];
  const expected = Number(manifest.expected_registry_row_key_count || manifest.expected_row_count || 0);
  const routeRows = arr(route.route_rows);
  const workpadRows = arr(workpad.registry_rows);
  const controlledRows = arr(controlled.controlled_rows);
  const triggeredRows = arr(triggered.triggered_rows);
  if (!expected) failures.push("PHASE10_MANIFEST_EXPECTED_COUNT_MISSING");
  if (routeRows.length !== expected) failures.push(`PHASE10_ROUTE_COUNT_MISMATCH:${routeRows.length}:${expected}`);
  if (workpadRows.length !== expected) failures.push(`PHASE10_WORKPAD_COUNT_MISMATCH:${workpadRows.length}:${expected}`);
  assertUniqueKeys(routeRows, "route", failures); assertUniqueKeys(workpadRows, "workpad", failures); assertUniqueKeys(controlledRows, "controlled", failures); assertUniqueKeys(triggeredRows, "triggered", failures);
  const controlledKeys = new Set(controlledRows.map(rowKey));
  const triggeredKeys = new Set(triggeredRows.map(rowKey));
  for (const key of controlledKeys) if (triggeredKeys.has(key)) failures.push(`PHASE10_PROFILE_OVERLAP:${key}`);
  const materialRows = [];
  const workpadOnlyRows = [];
  for (const row of workpadRows) {
    const status = String(row.final_material_status || row.evaluation_status || "").toUpperCase();
    if (MATERIAL.has(status)) {
      const projection = row.material_projection || row;
      materialRows.push(withCustody(row, projection, status));
      if (CONTROLLED.has(status) && !controlledKeys.has(rowKey(row))) failures.push(`PHASE10_CONTROLLED_PROFILE_MISSING:${rowKey(row)}`);
      if (status === "TRIGGERED" && !triggeredKeys.has(rowKey(row))) failures.push(`PHASE10_TRIGGERED_PROFILE_MISSING:${rowKey(row)}`);
    } else if (status === "NOT_TRIGGERED_NOT_APPLICABLE") workpadOnlyRows.push(withCustody(row, null, status));
    else if (status) warnings.push(`PHASE10_NON_STANDARD_WORKPAD_STATUS:${rowKey(row)}:${status}`);
  }
  const challengeStatus = String(challenge.status || challenge.lock_status || challenge.gate || "UNKNOWN").toUpperCase();
  if (!ACCEPTED_CHALLENGE_STATUSES.has(challengeStatus)) failures.push(`PHASE11_CHALLENGE_GATE_NOT_COMPILER_READY:${challengeStatus}`);
  if (challenge.compiler_handoff_allowed === false) failures.push("PHASE11_COMPILER_HANDOFF_FORBIDDEN");
  const phase11Limitations = projectPhase11Limitations(challenge);
  if (challengeStatus === "PASS_WITH_LIMITATION" || challengeStatus === "LOCKED_WITH_LIMITATIONS") {
    warnings.push("PHASE11_LIMITATIONS_CARRIED");
    if (!phase11Limitations.length) failures.push("PHASE11_PASS_WITH_LIMITATION_WARNING_PROJECTION_MISSING");
  }
  return {
    phase10_downstream_compatibility: {
      schema_version: "phase10_downstream_compatibility.v3.phase11_production",
      identity_contract: "PHASE10_EXECUTION_IDENTITY_v2",
      expected_registry_row_key_count: expected,
      mounted_packages: [...arr(manifest.mounted_packages)],
      primary_package: manifest.primary_package || "",
      ai_mount: manifest.ai_mount || "",
      route_row_count: routeRows.length,
      workpad_row_count: workpadRows.length,
      controlled_row_count: controlledRows.length,
      triggered_row_count: triggeredRows.length,
      workpad_only_row_count: workpadOnlyRows.length,
      material_rows: materialRows,
      workpad_only_rows: workpadOnlyRows,
      stream_summary: summarizeByStream(workpadRows),
      package_summary: summarizeByPackage(workpadRows),
      final_status_counts: countBy(workpadRows, (row) => String(row.final_material_status || row.evaluation_status || "UNKNOWN")),
      challenge_status: challengeStatus,
      challenge_gate_version: challenge.schema_version || "UNKNOWN",
      compiler_handoff_allowed: challenge.compiler_handoff_allowed === true,
      phase11_warning_projection: {
        schema_version: "phase11_warning_projection.v1",
        warning_count: phase11Limitations.length,
        warnings: phase11Limitations,
        local_counsel_review_required: phase11Limitations.length > 0
      },
      validation: { status: failures.length ? "CONTROLLED_FAILURE" : warnings.length ? "PASS_WITH_LIMITATION" : "PASS", failures, warnings, compound_identity_reconciled: failures.every((item) => !item.includes("KEY")), no_row_re_evaluation: true, raw_threat_id_global_deduplication_forbidden: true, phase11_layer3_gate_enforced: true, phase11_limitations_visibly_projected: phase11Limitations.length > 0 || challengeStatus === "PASS" }
    }
  };
}

export function assertPhase10CompilerCompatibility(value) { const root = unwrap(value, "phase10_downstream_compatibility"); if (root.validation?.status === "CONTROLLED_FAILURE") throw new Error(`PHASE10_DOWNSTREAM_COMPATIBILITY_FAILED:${arr(root.validation.failures).join("|")}`); return root; }
function projectPhase11Limitations(challenge = {}) {
  const warnings = [];
  for (const issue of arr(challenge.advisory_warnings)) warnings.push(projectWarning(issue, "ADVISORY_WARNING"));
  for (const entry of arr(challenge.operator_challenge_reinvestigation_ledger?.entries)) {
    if (entry.final_disposition !== "UNRESOLVED_AFTER_REINVESTIGATION") continue;
    warnings.push({ challenge_candidate_id: entry.challenge_candidate_id || "", warning_type: "UNRESOLVED_AFTER_REINVESTIGATION", owning_phase: entry.owning_phase || "", affected_artifacts: arr(entry.artifact_names), affected_field_paths: arr(entry.field_paths), affected_registry_row_keys: arr(entry.affected_registry_row_keys), attempts_used: Number(entry.attempts_used || arr(entry.attempts).length), remaining_uncertainty: entry.warning_if_unresolved || "Material field remained unresolved after two targeted reinvestigation attempts.", possible_report_impact: entry.problem || "The affected conclusion carries unresolved uncertainty.", local_counsel_review_route: "LOCAL_COUNSEL_REVIEW_REQUIRED" });
  }
  return dedupeWarnings(warnings);
}
function projectWarning(issue = {}, type) { return { challenge_candidate_id: issue.challenge_candidate_id || "", warning_type: issue.disposition || type, owning_phase: issue.reinvestigation?.owning_phase || "", affected_artifacts: arr(issue.affected_artifacts), affected_field_paths: arr(issue.affected_field_paths), affected_registry_row_keys: arr(issue.affected_registry_row_keys), attempts_used: Number(issue.reinvestigation?.attempts_used || 0), remaining_uncertainty: issue.limitation_if_unresolved || "Advisory limitation carried from Phase 11.", possible_report_impact: issue.materiality_analysis || issue.semantic_analysis || "The report should state this limitation explicitly.", local_counsel_review_route: "LOCAL_COUNSEL_REVIEW_REQUIRED" }; }
function dedupeWarnings(rows) { const seen = new Set(); return rows.filter((row) => { const key = `${row.challenge_candidate_id}:${row.warning_type}`; if (seen.has(key)) return false; seen.add(key); return true; }); }
function withCustody(row, projection, status) { return { registry_row_key: rowKey(row), package_id: row.package_id || "", source_domain: row.source_domain || "", stream_id: row.stream_id || "", stream_type: row.stream_type || "", batch_id: row.batch_id || "", Threat_ID: row.Threat_ID || projection?.Threat_ID || "", final_material_status: status, material_projection: projection }; }
function assertUniqueKeys(rows, label, failures) { const seen = new Set(); for (const row of rows) { const key = rowKey(row); if (!key) failures.push(`PHASE10_${label.toUpperCase()}_ROW_KEY_MISSING`); else if (seen.has(key)) failures.push(`PHASE10_${label.toUpperCase()}_ROW_KEY_DUPLICATE:${key}`); seen.add(key); } }
function summarizeByStream(rows) { const map = new Map(); for (const row of rows) { const key = row.stream_id || `${row.stream_type || "UNKNOWN"}::${row.package_id || "UNKNOWN"}`; const current = map.get(key) || { stream_id: key, stream_type: row.stream_type || "", package_id: row.package_id || "", row_count: 0, final_status_counts: {} }; current.row_count += 1; const status = String(row.final_material_status || "UNKNOWN"); current.final_status_counts[status] = (current.final_status_counts[status] || 0) + 1; map.set(key, current); } return [...map.values()]; }
function summarizeByPackage(rows) { const map = new Map(); for (const row of rows) map.set(row.package_id || "UNKNOWN", (map.get(row.package_id || "UNKNOWN") || 0) + 1); return [...map.entries()].map(([package_id, row_count]) => ({ package_id, row_count })); }
function countBy(rows, pick) { const out = {}; for (const row of rows) { const key = pick(row); out[key] = (out[key] || 0) + 1; } return out; }
function rowKey(row = {}) { return String(row.registry_row_key || `${row.package_id || ""}::${row.Threat_ID || row.threat_id || ""}`).trim(); }
function unwrap(value, key) { return value?.[key] || value?.artifact?.[key] || value || {}; }
function arr(value) { return Array.isArray(value) ? value : []; }
