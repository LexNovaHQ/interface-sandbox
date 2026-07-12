import { buildExposureRegistryForensicsFromSavedArtifacts as buildBaseExposureRegistryForensicsFromSavedArtifacts } from "./m11-deterministic-forensics.js";

const VALID_SUBCATS = new Set(["CNS", "LIA", "HAL", "INF", "PRV", "BIO", "DEC", "HRM", "FRD", "TRD"]);
const LEGACY_SUBCAT_NORMALIZATION = Object.freeze({ FIN: "LIA" });

export function buildExposureRegistryForensicsFromSavedArtifacts(args) {
  const output = buildBaseExposureRegistryForensicsFromSavedArtifacts(args);
  const root = output.exposure_registry_profile_forensics;
  const lookup = buildLookup(args);
  const warnings = [];
  const failures = [];

  root.registry_input_manifest = {
    ...root.registry_input_manifest,
    material_row_field_count: 19,
    m11_schema_upgrade: "THREAT_NAME_AND_SUBCATEGORY_NORMALIZATION_V1",
    threat_name_required: true,
    subcategory_code_only: true,
    subcategory_normalization_policy: "FIN_NORMALIZED_TO_LIA_NON_BLOCKING"
  };

  for (const key of ["full_registry_inventory_ledger", "trigger_review_workspace_ledger", "trigger_adjudication_ledger", "semantic_evidence_application_ledger", "status_input_ledger", "final_status_derivation_ledger", "evidence_binding_ledger", "control_exclude_evaluation_ledger", "registry_row_workpad_accountability_ledger"]) {
    if (Array.isArray(root[key])) root[key] = root[key].map((row) => attachIdentity(row, lookup, warnings));
  }

  if (Array.isArray(root.forensic_trace_index)) {
    root.forensic_trace_index = root.forensic_trace_index.map((row) => attachTraceIdentity(row, lookup, warnings));
  }

  if (Array.isArray(root.material_profile_trace_index)) {
    root.material_profile_trace_index = root.material_profile_trace_index.map((row) => attachIdentity(row, lookup, warnings));
  }

  if (Array.isArray(root.workpad_trace_index)) {
    root.workpad_trace_index = root.workpad_trace_index.map((row) => attachIdentity(row, lookup, warnings));
  }

  const emittedRows = [
    ...asArray(args?.controlledProfile?.exposure_registry_controlled_profile?.controlled_rows || args?.controlledProfile?.controlled_rows),
    ...asArray(args?.triggeredProfile?.exposure_registry_triggered_profile?.triggered_rows || args?.triggeredProfile?.triggered_rows)
  ];
  for (const row of emittedRows) {
    if (!String(row.Threat_Name || "").trim()) failures.push(`${row.Threat_ID || "unknown"}:THREAT_NAME_MISSING_IN_MATERIAL_PROFILE`);
    const sub = normalizeSubcategory(row.Subcategory || lookup.get(row.Threat_ID)?.Subcategory);
    if (!VALID_SUBCATS.has(sub.code)) failures.push(`${row.Threat_ID || "unknown"}:INVALID_SUBCATEGORY:${sub.raw || "missing"}`);
  }

  root.registry_lock_gate_result = mergeGate(root.registry_lock_gate_result, failures, warnings);
  root.forensic_lock_gate_result = mergeGate(root.forensic_lock_gate_result, failures, warnings);
  root.runtime_trace_m11_only = {
    ...(root.runtime_trace_m11_only || {}),
    m11_schema_upgrade: "THREAT_NAME_AND_SUBCATEGORY_NORMALIZATION_V1",
    threat_name_required: true,
    subcategory_code_only: true
  };

  return output;
}

function buildLookup(args = {}) {
  const map = new Map();
  const routeRows = asArray(args?.routePlan?.exposure_registry_route_plan?.route_rows || args?.routePlan?.route_rows);
  const workpadRows = asArray(args?.workpad?.exposure_registry_workpad_98?.registry_rows || args?.workpad?.registry_rows);
  const controlledRows = asArray(args?.controlledProfile?.exposure_registry_controlled_profile?.controlled_rows || args?.controlledProfile?.controlled_rows);
  const triggeredRows = asArray(args?.triggeredProfile?.exposure_registry_triggered_profile?.triggered_rows || args?.triggeredProfile?.triggered_rows);
  for (const row of [...routeRows, ...workpadRows, ...controlledRows, ...triggeredRows]) {
    if (!row?.Threat_ID) continue;
    const existing = map.get(row.Threat_ID) || {};
    const registryRow = row.registry_row || {};
    const material = row.material_projection || row;
    const sub = normalizeSubcategory(row.Subcategory || row.subcategory || material.Subcategory || row.FIELD22 || registryRow.FIELD22 || deriveThreatIdPart(row.Threat_ID, 1));
    map.set(row.Threat_ID, {
      ...existing,
      Threat_ID: row.Threat_ID,
      Threat_Name: existing.Threat_Name || row.Threat_Name || material.Threat_Name || registryRow.Threat_Name || "",
      Subcategory: sub.code,
      subcategory_normalization: sub.record
    });
  }
  return map;
}

function attachTraceIdentity(row = {}, lookup, warnings) {
  const identified = attachIdentity(row, lookup, warnings);
  const identity = lookup.get(row.Threat_ID) || {};
  return {
    ...identified,
    registry_spine_trace: {
      ...(row.registry_spine_trace || {}),
      Threat_Name: row.registry_spine_trace?.Threat_Name || identity.Threat_Name || "",
      Subcategory: row.registry_spine_trace?.Subcategory || identity.Subcategory || ""
    }
  };
}

function attachIdentity(row = {}, lookup, warnings) {
  const identity = lookup.get(row.Threat_ID) || {};
  const sub = normalizeSubcategory(row.Subcategory || row.subcategory || identity.Subcategory || deriveThreatIdPart(row.Threat_ID, 1));
  if (sub.changed) warnings.push({ Threat_ID: row.Threat_ID || "", code: "LEGACY_SUBCATEGORY_NORMALIZED", original_subcategory: sub.raw, normalized_subcategory: sub.code, severity: "WARNING_NON_BLOCKING" });
  return {
    ...row,
    Threat_Name: row.Threat_Name || identity.Threat_Name || "",
    Subcategory: sub.code
  };
}

function mergeGate(gate = {}, failures = [], warnings = []) {
  const mergedFailures = [...asArray(gate.failures), ...failures];
  const mergedWarnings = dedupeWarnings([...asArray(gate.warnings), ...warnings]);
  return {
    ...gate,
    status: mergedFailures.length ? "REPAIR_REQUIRED" : mergedWarnings.length ? "PASS_WITH_LIMITATION" : gate.status || "PASS",
    failures: mergedFailures,
    warnings: mergedWarnings
  };
}

function normalizeSubcategory(value) {
  const raw = String(value || "").trim().toUpperCase();
  const code = LEGACY_SUBCAT_NORMALIZATION[raw] || raw;
  return { raw, code, changed: Boolean(raw && raw !== code), record: raw && raw !== code ? { original_subcategory: raw, normalized_subcategory: code, policy: "KNOWN_LEGACY_SUBCAT_NORMALIZATION_NON_BLOCKING" } : null };
}

function dedupeWarnings(warnings) {
  const seen = new Set();
  const result = [];
  for (const warning of warnings) {
    const key = JSON.stringify(warning);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(warning);
  }
  return result;
}

function deriveThreatIdPart(threatId, index) {
  return String(threatId || "").split("_")[index] || "";
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}
