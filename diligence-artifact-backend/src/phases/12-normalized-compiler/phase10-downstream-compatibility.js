const CONTROLLED = new Set([
  "CONTROLLED_BY_VISIBLE_CONTROL",
  "CONTROLLED_BY_EXCLUSION",
  "CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION"
]);
const MATERIAL = new Set(["TRIGGERED", ...CONTROLLED]);
const ACCEPTED_CHALLENGE_STATUSES = new Set(["PASS", "PASS_WITH_LIMITATION"]);
const REQUIRED_GATE_SCHEMA = "challenge_gate.v4.operator_challenge";
const REQUIRED_REPORT_ROW_SCHEMA = "phase10_report_row.v1.complete_registry_spine";
const REQUIRED_MATERIAL_FIELDS = Object.freeze([
  "registry_row_key", "package_id", "source_domain", "stream_id", "stream_type",
  "Threat_ID", "Threat_Name", "Lane", "Behavior_Class", "Surface", "Subcategory",
  "Authority_IN", "Authority_EU", "Authority_US", "Velocity", "Pain_Tier",
  "Pain_Category", "Pain_Depth", "Status", "Effective_Date", "Legal_Pain",
  "FP_Mechanism", "FP_Impact", "Lex_Nova_Fix", "Hunter_Trigger", "Provenance",
  "FIELD21", "FIELD22", "FIELD23", "target_match", "evaluation_status",
  "basis_proof", "control_exclusion_evaluation", "evidence_source_basis",
  "applied_fp_mechanism", "row_limitations", "review_route"
]);

export function buildPhase10CompilerCompatibility({ artifacts = {} } = {}) {
  const controlled = unwrap(artifacts.exposure_registry_controlled_profile, "exposure_registry_controlled_profile");
  const triggered = unwrap(artifacts.exposure_registry_triggered_profile, "exposure_registry_triggered_profile");
  const challenge = unwrap(artifacts.challenge_gate, "challenge_gate");
  const failures = [];
  const warnings = [];

  const controlledRows = arr(controlled.controlled_rows);
  const triggeredRows = arr(triggered.triggered_rows);

  if (controlled.report_row_schema_version !== REQUIRED_REPORT_ROW_SCHEMA) {
    failures.push(`PHASE10_CONTROLLED_REPORT_ROW_SCHEMA_INVALID:${controlled.report_row_schema_version || "missing"}`);
  }
  if (triggered.report_row_schema_version !== REQUIRED_REPORT_ROW_SCHEMA) {
    failures.push(`PHASE10_TRIGGERED_REPORT_ROW_SCHEMA_INVALID:${triggered.report_row_schema_version || "missing"}`);
  }

  assertUniqueKeys(controlledRows, "controlled", failures);
  assertUniqueKeys(triggeredRows, "triggered", failures);
  const controlledKeys = new Set(controlledRows.map(rowKey));
  const triggeredKeys = new Set(triggeredRows.map(rowKey));
  for (const key of controlledKeys) if (triggeredKeys.has(key)) failures.push(`PHASE10_PROFILE_OVERLAP:${key}`);

  const materialRows = [];
  for (const row of triggeredRows) {
    validateMaterialRow(row, failures);
    if (String(row.evaluation_status || "").toUpperCase() !== "TRIGGERED") {
      failures.push(`PHASE10_TRIGGERED_PROFILE_STATUS_INVALID:${rowKey(row)}:${row.evaluation_status || "missing"}`);
    }
    materialRows.push(cloneWithoutMutation(row));
  }
  for (const row of controlledRows) {
    validateMaterialRow(row, failures);
    const status = String(row.evaluation_status || "").toUpperCase();
    if (!CONTROLLED.has(status)) failures.push(`PHASE10_CONTROLLED_PROFILE_STATUS_INVALID:${rowKey(row)}:${status || "missing"}`);
    materialRows.push(cloneWithoutMutation(row));
  }

  for (const row of materialRows) {
    const status = String(row.evaluation_status || "").toUpperCase();
    if (!MATERIAL.has(status)) failures.push(`PHASE10_NON_MATERIAL_PROFILE_STATUS:${rowKey(row)}:${status || "missing"}`);
    if (!["PRIMARY", "OVERLAY"].includes(String(row.stream_type || "").toUpperCase())) {
      failures.push(`PHASE10_STREAM_TYPE_INVALID:${rowKey(row)}:${row.stream_type || "missing"}`);
    }
  }

  const challengeStatus = validateChallengeGate(challenge, failures, warnings);
  const warningProjection = projectFinalGateWarnings(challenge);
  if (challengeStatus === "PASS_WITH_LIMITATION" && !warningProjection.length) failures.push("PHASE11_PASS_WITH_LIMITATION_WARNING_PROJECTION_MISSING");
  if (challengeStatus === "PASS" && warningProjection.length) failures.push("PHASE11_PASS_CONTAINS_ADVISORY_WARNING_PROJECTION");

  const mountedPackages = [...new Set(materialRows.map((row) => String(row.package_id || "").trim()).filter(Boolean))].sort();
  const finalStatusCounts = countBy(materialRows, (row) => String(row.evaluation_status || "UNKNOWN").toUpperCase());
  const streamSummary = countBy(materialRows, (row) => String(row.stream_type || "UNKNOWN").toUpperCase());

  return {
    phase10_downstream_compatibility: {
      schema_version: "phase10_downstream_compatibility.v5.direct_material_profiles",
      identity_contract: "PHASE10_EXECUTION_IDENTITY_v2",
      report_row_schema_version: REQUIRED_REPORT_ROW_SCHEMA,
      expected_registry_row_key_count: materialRows.length,
      mounted_packages: mountedPackages,
      route_row_count: 0,
      workpad_row_count: 0,
      controlled_row_count: controlledRows.length,
      triggered_row_count: triggeredRows.length,
      material_rows: materialRows,
      final_status_counts: finalStatusCounts,
      stream_summary: streamSummary,
      challenge_status: challengeStatus,
      challenge_gate_version: challenge.schema_version || "UNKNOWN",
      challenge_final_gate_fingerprint: challenge.final_gate_fingerprint || "",
      compiler_handoff_allowed: challenge.compiler_handoff_allowed === true,
      phase11_warning_projection: {
        schema_version: "phase11_warning_projection.v2.final_gate_only",
        warning_count: warningProjection.length,
        warnings: warningProjection,
        local_counsel_review_required: warningProjection.length > 0
      },
      input_contract: {
        direct_material_profiles_only: true,
        required_artifacts: [
          "exposure_registry_controlled_profile",
          "exposure_registry_triggered_profile",
          "challenge_gate"
        ],
        phase2g_forbidden: true,
        exposure_route_plan_forbidden: true,
        exposure_workpad_forbidden: true,
        forensics_forbidden: true
      },
      validation: {
        status: failures.length ? "CONTROLLED_FAILURE" : warnings.length ? "PASS_WITH_LIMITATION" : "PASS",
        failures,
        warnings,
        compound_identity_reconciled: failures.every((item) => !item.includes("ROW_KEY") && !item.includes("OVERLAP")),
        no_row_re_evaluation: true,
        no_row_mutation: true,
        raw_threat_id_global_deduplication_forbidden: true,
        phase11_exact_gate_enforced: true,
        phase11_internal_ledgers_not_consumed: true,
        direct_profile_input_boundary_enforced: true
      }
    }
  };
}

export function assertPhase10CompilerCompatibility(value) {
  const root = unwrap(value, "phase10_downstream_compatibility");
  if (root.validation?.status === "CONTROLLED_FAILURE") {
    throw new Error(`PHASE10_DOWNSTREAM_COMPATIBILITY_FAILED:${arr(root.validation.failures).join("|")}`);
  }
  return root;
}

function validateChallengeGate(challenge, failures, warnings) {
  if (!challenge || typeof challenge !== "object" || Array.isArray(challenge) || !Object.keys(challenge).length) failures.push("PHASE11_CHALLENGE_GATE_MISSING_OR_EMPTY");
  if (challenge.schema_version !== REQUIRED_GATE_SCHEMA) failures.push(`PHASE11_CHALLENGE_GATE_SCHEMA_INVALID:${challenge.schema_version || "missing"}`);
  const status = String(challenge.status || "").toUpperCase();
  if (!ACCEPTED_CHALLENGE_STATUSES.has(status)) failures.push(`PHASE11_CHALLENGE_GATE_NOT_COMPILER_READY:${status || "missing"}`);
  if (challenge.compiler_handoff_allowed !== true) failures.push("PHASE11_COMPILER_HANDOFF_NOT_AFFIRMATIVE");
  if (!String(challenge.final_gate_fingerprint || "").trim()) failures.push("PHASE11_FINAL_GATE_FINGERPRINT_MISSING");
  if (challenge.layer_status?.layer_3 !== "COMPLETE") failures.push(`PHASE11_LAYER3_NOT_COMPLETE:${challenge.layer_status?.layer_3 || "missing"}`);
  if (challenge.reinvestigation_dispatch_required === true) failures.push("PHASE11_REINVESTIGATION_STILL_PENDING");
  if (status === "PASS_WITH_LIMITATION") warnings.push("PHASE11_LIMITATIONS_CARRIED_FROM_FINAL_GATE");
  return status;
}

function validateMaterialRow(row, failures) {
  const key = rowKey(row);
  for (const field of REQUIRED_MATERIAL_FIELDS) {
    const value = row?.[field];
    if (field === "Compliance_Framework") continue;
    if (value === undefined || value === null || (typeof value === "string" && !value.trim())) {
      failures.push(`PHASE10_MATERIAL_ROW_FIELD_MISSING:${key || "unknown"}:${field}`);
    }
  }
  if (!/^T[1-5]$/.test(String(row.Pain_Tier || ""))) failures.push(`PHASE10_MATERIAL_ROW_PAIN_TIER_INVALID:${key}:${row.Pain_Tier || "missing"}`);
  if (!["Corporate", "Personal", "Criminal"].includes(String(row.Pain_Depth || ""))) failures.push(`PHASE10_MATERIAL_ROW_PAIN_DEPTH_INVALID:${key}:${row.Pain_Depth || "missing"}`);
}

function projectFinalGateWarnings(challenge = {}) {
  return arr(challenge.advisory_warnings).map((issue) => ({
    challenge_candidate_id: issue.challenge_candidate_id || "",
    warning_type: issue.disposition || "ADVISORY_WARNING",
    affected_artifacts: arr(issue.affected_artifacts),
    affected_field_paths: arr(issue.affected_field_paths),
    affected_registry_row_keys: arr(issue.affected_registry_row_keys),
    remaining_uncertainty: issue.limitation_if_unresolved || "Upstream limitation carried from the final Phase 11 gate.",
    possible_report_impact: issue.materiality_analysis || issue.semantic_analysis || "Qualified review required.",
    local_counsel_review_route: "LOCAL_COUNSEL_REVIEW_REQUIRED"
  }));
}

function cloneWithoutMutation(value) { return JSON.parse(JSON.stringify(value)); }
function assertUniqueKeys(rows, label, failures) {
  const seen = new Set();
  for (const row of rows) {
    const key = rowKey(row);
    if (!key) failures.push(`PHASE10_${label.toUpperCase()}_ROW_KEY_MISSING`);
    else if (seen.has(key)) failures.push(`PHASE10_${label.toUpperCase()}_ROW_KEY_DUPLICATE:${key}`);
    seen.add(key);
  }
}
function countBy(rows, pick) {
  const out = {};
  for (const row of rows) {
    const key = pick(row);
    out[key] = (out[key] || 0) + 1;
  }
  return out;
}
function rowKey(row = {}) { return String(row.registry_row_key || "").trim(); }
function unwrap(value, key) { return value?.[key] || value?.artifact?.[key] || value || {}; }
function arr(value) { return Array.isArray(value) ? value : []; }
