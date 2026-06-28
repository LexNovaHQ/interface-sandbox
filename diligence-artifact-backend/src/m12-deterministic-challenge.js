const REQUIRED = Object.freeze([
  "source_discovery_handoff",
  "legal_cartography_index",
  "target_profile",
  "target_profile_forensics",
  "target_feature_profile",
  "target_feature_profile_forensics",
  "data_provenance_profile",
  "data_provenance_profile_forensics",
  "exposure_registry_route_plan",
  "exposure_registry_workpad_98",
  "exposure_registry_controlled_profile",
  "exposure_registry_triggered_profile",
  "exposure_registry_profile_forensics"
]);

const ACCEPTED = new Set(["LOCKED", "LOCKED_WITH_LIMITATIONS", "COMPLETE"]);

export function buildM12DeterministicChallengeGate({ artifacts = {}, run = {} }) {
  const input_artifact_statuses = {};
  const critical_failures = [];
  const warnings = [];

  for (const name of REQUIRED) {
    const value = artifacts[name];
    const status = statusOf(value);
    input_artifact_statuses[name] = status;
    if (!value) critical_failures.push(`missing required input: ${name}`);
    else if (!ACCEPTED.has(status)) critical_failures.push(`input not locked: ${name}:${status}`);
    else if (status === "LOCKED_WITH_LIMITATIONS") warnings.push(`input limitation carried: ${name}`);
  }

  const route = unwrap(artifacts.exposure_registry_route_plan, "exposure_registry_route_plan");
  const workpad = unwrap(artifacts.exposure_registry_workpad_98, "exposure_registry_workpad_98");
  const controlled = unwrap(artifacts.exposure_registry_controlled_profile, "exposure_registry_controlled_profile");
  const triggered = unwrap(artifacts.exposure_registry_triggered_profile, "exposure_registry_triggered_profile");
  const forensics = unwrap(artifacts.exposure_registry_profile_forensics, "exposure_registry_profile_forensics");

  const batchCount = arr(route.batch_plan).length;
  const workpadRows = arr(workpad.registry_rows).length;
  const controlledRows = arr(controlled.controlled_rows).length;
  const triggeredRows = arr(triggered.triggered_rows).length;
  const forensicStatus = forensics.registry_lock_gate_result?.status || "UNKNOWN";
  const selfCheckStatus = forensics.registry_self_check_result?.status || "UNKNOWN";

  if (!batchCount) critical_failures.push("route plan batch count is zero");
  if (workpadRows !== 98) critical_failures.push(`workpad row count mismatch: ${workpadRows}`);
  if (!controlledRows && !triggeredRows) critical_failures.push("both split exposure profiles are empty");
  if (forensicStatus !== "PASS") warnings.push(`forensic gate carried: ${forensicStatus}`);
  if (selfCheckStatus !== "PASS") warnings.push(`self check carried: ${selfCheckStatus}`);

  const status = critical_failures.length ? "REPAIR_REQUIRED" : warnings.length ? "LOCKED_WITH_LIMITATIONS" : "LOCKED";

  return {
    challenge_gate: {
      status,
      gate: critical_failures.length ? "REPAIR_REQUIRED" : warnings.length ? "PASS_WITH_LIMITATIONS" : "PASS",
      generated_by: "m12_deterministic_challenge",
      run_id: run.run_id || "",
      input_artifact_statuses,
      critical_failures,
      warnings,
      m11_integrity: {
        batch_count_expected: batchCount,
        workpad_rows: workpadRows,
        controlled_rows: controlledRows,
        triggered_rows: triggeredRows,
        forensic_gate_status: forensicStatus,
        self_check_status: selfCheckStatus
      },
      non_blocking_rule: "Only missing or unusable structural inputs block. Everything else is warning/limitation.",
      model_usage: "NONE_DETERMINISTIC",
      next_phase: "COMPILER"
    }
  };
}

function statusOf(value) {
  const unwrapped = unwrapKnown(value);
  return String(value?.lock_status || unwrapped?.lock_status || unwrapped?.status || unwrapped?.validation_status || "LOCKED");
}

function unwrapKnown(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const keys = Object.keys(value);
  if (keys.length === 1 && value[keys[0]] && typeof value[keys[0]] === "object") return value[keys[0]];
  return value;
}

function unwrap(value, key) {
  return value?.[key] || value?.artifact?.[key] || value || {};
}

function arr(value) {
  return Array.isArray(value) ? value : [];
}
