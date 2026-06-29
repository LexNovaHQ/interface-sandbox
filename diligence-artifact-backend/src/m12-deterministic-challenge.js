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

const MATERIAL_FIELDS = Object.freeze([
  "Threat_ID",
  "target_match",
  "evaluation_status",
  "basis_proof",
  "control_exclusion_evaluation",
  "evidence_source_basis",
  "fp_mechanism",
  "Archetype",
  "Subcategory",
  "Surface",
  "authority_anchors",
  "Pain_Tier",
  "Pain_Depth",
  "Pain_Category",
  "Legal_Pain",
  "remediation",
  "review_route",
  "row_limitations"
]);
const CONTROLLED_FINAL_STATUSES = new Set(["CONTROLLED_BY_VISIBLE_CONTROL", "CONTROLLED_BY_EXCLUSION", "CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION"]);
const FINAL_MATERIAL_STATUSES = new Set(["TRIGGERED", ...CONTROLLED_FINAL_STATUSES]);
const ACCEPTED = new Set(["LOCKED", "LOCKED_WITH_LIMITATIONS", "COMPLETE", "PASS", "PASS_WITH_LIMITATION"]);
const ACCEPTED_BATCH_STATUSES = new Set(["PASS", "PASS_WITH_LIMITATION", "LOCKED", "LOCKED_WITH_LIMITATIONS"]);
const BLOCKING_BATCH_STATUSES = new Set(["REPAIR_REQUIRED", "CONTROLLED_FAILURE"]);

export function buildM12DeterministicChallengeGate({ artifacts = {}, run = {} }) {
  const input_artifact_statuses = {};
  const critical_failures = [];
  const warnings = [];

  for (const name of REQUIRED) {
    const value = artifacts[name];
    const status = normalizeStatus(statusOf(value));
    input_artifact_statuses[name] = status;
    if (!value) critical_failures.push(`missing required input: ${name}`);
    else if (!ACCEPTED.has(status)) critical_failures.push(`input not locked: ${name}:${status}`);
    else if (status === "LOCKED_WITH_LIMITATIONS" || status === "PASS_WITH_LIMITATION") warnings.push(`input limitation carried: ${name}`);
  }

  const route = unwrap(artifacts.exposure_registry_route_plan, "exposure_registry_route_plan");
  const workpad = unwrap(artifacts.exposure_registry_workpad_98, "exposure_registry_workpad_98");
  const controlled = unwrap(artifacts.exposure_registry_controlled_profile, "exposure_registry_controlled_profile");
  const triggered = unwrap(artifacts.exposure_registry_triggered_profile, "exposure_registry_triggered_profile");
  const forensics = unwrap(artifacts.exposure_registry_profile_forensics, "exposure_registry_profile_forensics");
  const manifest = artifacts.m12_global_dynamic_artifact_manifest || {};

  const batchCount = arr(route.batch_plan).length;
  const workpadRows = arr(workpad.registry_rows);
  const controlledRows = arr(controlled.controlled_rows);
  const triggeredRows = arr(triggered.triggered_rows);
  const forensicStatus = forensics.registry_lock_gate_result?.status || "UNKNOWN";
  const selfCheckStatus = forensics.registry_self_check_result?.status || "UNKNOWN";
  const materialGate = validateM11MaterialOutputs({ workpadRows, controlledRows, triggeredRows });
  critical_failures.push(...materialGate.failures);
  warnings.push(...materialGate.warnings);

  if (!batchCount) critical_failures.push("route plan batch count is zero");
  if (workpadRows.length !== 98) critical_failures.push(`workpad row count mismatch: ${workpadRows.length}`);
  if (!controlledRows.length && !triggeredRows.length) critical_failures.push("both split exposure profiles are empty");
  if (forensicStatus !== "PASS") warnings.push(`forensic gate carried: ${forensicStatus}`);
  if (selfCheckStatus !== "PASS") warnings.push(`self check carried: ${selfCheckStatus}`);

  for (const artifactName of arr(manifest.missing_batch_artifacts)) critical_failures.push(`missing M11 batch artifact: ${artifactName}`);
  for (const artifactName of arr(manifest.missing_batch_validation_artifacts)) critical_failures.push(`missing M12 batch validation artifact: ${artifactName}`);

  for (const entry of arr(artifacts.m12_batch_validation_artifacts)) {
    const validation = entry.artifact?.exposure_registry_batch_validation || entry.artifact || {};
    const status = normalizeStatus(validation.status || validation.semantic_m12_validation_status);
    const label = entry.batch_id || validation.batch_id || entry.artifact_name || "unknown";
    if (!status) critical_failures.push(`M12 batch validation status missing: ${label}`);
    else if (BLOCKING_BATCH_STATUSES.has(status)) critical_failures.push(`M12 batch validation blocking status: ${label}:${status}`);
    else if (!ACCEPTED_BATCH_STATUSES.has(status)) warnings.push(`M12 batch validation non-standard status carried: ${label}:${status}`);
    for (const limitation of arr(validation.limitations)) warnings.push(`M12 batch validation limitation carried: ${label}:${stringifyLimitation(limitation)}`);
    for (const warning of arr(validation.warnings)) warnings.push(`M12 batch validation warning carried: ${label}:${stringifyLimitation(warning)}`);
  }

  if (Number(manifest.batch_count || 0) !== arr(artifacts.m12_batch_validation_artifacts).length) critical_failures.push("M12 batch validation count does not match route plan batch count");

  const status = critical_failures.length ? "REPAIR_REQUIRED" : warnings.length ? "LOCKED_WITH_LIMITATIONS" : "LOCKED";
  return { challenge_gate: { status, gate: critical_failures.length ? "REPAIR_REQUIRED" : warnings.length ? "PASS_WITH_LIMITATIONS" : "PASS", generated_by: "m12_deterministic_challenge", run_id: run.run_id || "", target: run.target || null, input_artifact_statuses, critical_failures, warnings, dynamic_artifact_manifest: manifest, m11_integrity: { batch_count_expected: batchCount, batch_count_loaded: arr(artifacts.m11_batch_artifacts).length, batch_validation_count_loaded: arr(artifacts.m12_batch_validation_artifacts).length, workpad_rows: workpadRows.length, controlled_rows: controlledRows.length, triggered_rows: triggeredRows.length, forensic_gate_status: forensicStatus, self_check_status: selfCheckStatus, material_contract: "M11_THREE_LAYER_FULL_ROW_V1", material_gate: materialGate }, operator_challenge_gate: { lock_status: status, deterministic: true, challenge_basis: "M11 static artifacts, M11 dynamic batch artifacts, deterministic M12 batch validation artifacts, and four-status material row contract.", challenge_result: critical_failures.length ? "BLOCKED" : "ACCEPTED" }, non_blocking_rule: "Only missing/unusable structural inputs or material-contract failures block. Limitations and warnings carry forward.", model_usage: "NONE_DETERMINISTIC", next_phase: "COMPILER" } };
}

function validateM11MaterialOutputs({ workpadRows, controlledRows, triggeredRows }) {
  const failures = [];
  const warnings = [];
  const controlledIds = new Set();
  const triggeredIds = new Set();

  for (const row of controlledRows) {
    const id = row.Threat_ID || row.threat_id || "";
    if (!id) failures.push("controlled row missing Threat_ID");
    if (controlledIds.has(id)) failures.push(`duplicate controlled Threat_ID: ${id}`);
    controlledIds.add(id);
    const status = String(row.evaluation_status || row.final_material_status || "").toUpperCase();
    if (status === "CONTROLLED") failures.push(`plain CONTROLLED status forbidden in controlled profile: ${id}`);
    if (!CONTROLLED_FINAL_STATUSES.has(status)) failures.push(`controlled row has invalid evaluation_status: ${id}:${status || "blank"}`);
    validateMaterialFields(row, `controlled:${id || "unknown"}`, failures);
  }

  for (const row of triggeredRows) {
    const id = row.Threat_ID || row.threat_id || "";
    if (!id) failures.push("triggered row missing Threat_ID");
    if (triggeredIds.has(id)) failures.push(`duplicate triggered Threat_ID: ${id}`);
    triggeredIds.add(id);
    const status = String(row.evaluation_status || row.final_material_status || "").toUpperCase();
    if (status !== "TRIGGERED") failures.push(`triggered row has invalid evaluation_status: ${id}:${status || "blank"}`);
    validateMaterialFields(row, `triggered:${id || "unknown"}`, failures);
  }

  for (const id of controlledIds) if (triggeredIds.has(id)) failures.push(`Threat_ID appears in both controlled and triggered profiles: ${id}`);

  const workpadControlled = workpadRows.filter((row) => CONTROLLED_FINAL_STATUSES.has(String(row.final_material_status || "").toUpperCase())).map((row) => row.Threat_ID).filter(Boolean);
  const workpadTriggered = workpadRows.filter((row) => String(row.final_material_status || "").toUpperCase() === "TRIGGERED").map((row) => row.Threat_ID).filter(Boolean);
  for (const id of workpadControlled) if (!controlledIds.has(id)) failures.push(`workpad controlled row missing from controlled profile: ${id}`);
  for (const id of workpadTriggered) if (!triggeredIds.has(id)) failures.push(`workpad triggered row missing from triggered profile: ${id}`);
  for (const row of workpadRows) {
    const status = String(row.final_material_status || "").toUpperCase();
    if (status === "CONTROLLED") failures.push(`plain CONTROLLED status forbidden in workpad: ${row.Threat_ID || "unknown"}`);
    if (status && status !== "WORKPAD_ONLY" && status !== "CONTROLLED_FAILURE" && !FINAL_MATERIAL_STATUSES.has(status)) warnings.push(`non-material workpad status carried: ${row.Threat_ID || "unknown"}:${status}`);
  }

  return { status: failures.length ? "REPAIR_REQUIRED" : warnings.length ? "PASS_WITH_LIMITATION" : "PASS", failures, warnings, controlled_statuses: [...CONTROLLED_FINAL_STATUSES], triggered_status: "TRIGGERED" };
}

function validateMaterialFields(row, label, failures) {
  for (const field of MATERIAL_FIELDS) if (!(field in row)) failures.push(`${label} missing material field ${field}`);
}

function statusOf(value) {
  const unwrapped = unwrapKnown(value);
  return String(value?.lock_status || unwrapped?.lock_status || unwrapped?.status || unwrapped?.validation_status || "LOCKED");
}
function normalizeStatus(value) { const status = String(value || "").trim().toUpperCase(); return status === "PASS_WITH_LIMITATIONS" ? "PASS_WITH_LIMITATION" : status; }
function unwrapKnown(value) { if (!value || typeof value !== "object" || Array.isArray(value)) return value; const keys = Object.keys(value); if (keys.length === 1 && value[keys[0]] && typeof value[keys[0]] === "object") return value[keys[0]]; return value; }
function unwrap(value, key) { return value?.[key] || value?.artifact?.[key] || value || {}; }
function stringifyLimitation(value) { if (typeof value === "string") return value; if (!value || typeof value !== "object") return String(value || ""); return value.code || value.message || JSON.stringify(value); }
function arr(value) { return Array.isArray(value) ? value : []; }
