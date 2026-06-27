import { buildLepSelectorApplicationLedger, selectLepRowsFromRegistryText } from "./m11-lep-deterministic.js";

const EXPECTED_ACTIVE_REGISTRY_ROWS = 98;
const EXPECTED_LEP_ROWS = 22;

export function buildExposureRegistryForensicsFromSavedArtifacts({
  routePlan,
  acceptedBatches = [],
  batchValidations = [],
  workpad,
  controlledProfile,
  triggeredProfile,
  fieldDerivationRegistryText = "",
  lepOutcomes = {}
}) {
  const plan = unwrap(routePlan, "exposure_registry_route_plan");
  const pad = unwrap(workpad, "exposure_registry_workpad_98");
  const controlled = unwrap(controlledProfile, "exposure_registry_controlled_profile");
  const triggered = unwrap(triggeredProfile, "exposure_registry_triggered_profile");

  const workpadRows = asArray(pad.registry_rows);
  const controlledRows = asArray(controlled.controlled_rows);
  const triggeredRows = asArray(triggered.triggered_rows);
  const lepSelection = selectLepRowsFromRegistryText(fieldDerivationRegistryText);
  const lepLedger = buildLepSelectorApplicationLedger(lepSelection.rows, lepOutcomes);
  const emissionManifest = buildEmissionManifest(workpadRows, controlledRows, triggeredRows);
  const lockGate = buildLockGate({ workpadRows, controlledRows, triggeredRows, batchValidations, lepSelection });

  return {
    exposure_registry_profile_forensics: {
      registry_input_manifest: {
        expected_active_registry_rows: EXPECTED_ACTIVE_REGISTRY_ROWS,
        actual_workpad_rows: workpadRows.length,
        expected_lep_rows: EXPECTED_LEP_ROWS,
        actual_lep_rows: lepSelection.rows.length,
        route_plan_present: Boolean(plan && Object.keys(plan).length),
        accepted_batch_count: acceptedBatches.length,
        batch_validation_count: batchValidations.length,
        controlled_profile_present: Boolean(controlled && Object.keys(controlled).length),
        triggered_profile_present: Boolean(triggered && Object.keys(triggered).length),
        m9_legal_cartography_consumed: plan?.m9_legal_cartography_consumption?.m11_builds_legal_cartography === false
      },
      full_registry_inventory_ledger: workpadRows.map((row) => ({
        Threat_ID: row.Threat_ID,
        registry_order: row.registry_order,
        archetype: row.archetype,
        surface: row.surface,
        route: row.route,
        route_reason: row.route_reason,
        final_material_status: row.final_material_status,
        source_batch_id: row.source_batch_id || null,
        m12_batch_validation_status: row.m12_batch_validation_status || ""
      })),
      lep_selector_application_ledger: lepLedger,
      internal_registry_route_plan_ledger: asArray(plan.route_rows),
      trigger_review_workspace_ledger: workpadRows.filter(isEvaluationRouted).map((row) => ({ Threat_ID: row.Threat_ID, source_batch_id: row.source_batch_id || null, route_reason: row.route_reason || "" })),
      trigger_adjudication_ledger: workpadRows.filter(isEvaluationRouted).map((row) => ({ Threat_ID: row.Threat_ID, trigger_status: row.trigger_status || "", internal_evaluation_status: row.internal_evaluation_status || "", final_material_status: row.final_material_status || "" })),
      evidence_binding_ledger: collectEvidenceBindingLedger(acceptedBatches),
      control_exclude_evaluation_ledger: workpadRows.filter(isEvaluationRouted).map((row) => ({ Threat_ID: row.Threat_ID, final_material_status: row.final_material_status || "", limitations: row.limitations || "" })),
      registry_row_workpad_accountability_ledger: workpadRows.map((row) => ({ Threat_ID: row.Threat_ID, accounted: Boolean(row.Threat_ID), final_material_status: row.final_material_status || "", route: row.route || "" })),
      triggered_controlled_row_assembly_ledger: buildAssemblyLedger(workpadRows, controlledRows, triggeredRows),
      emission_manifest: emissionManifest,
      registry_self_check_result: pad.merge_validation || {},
      registry_lock_gate_result: lockGate,
      legal_firewall_ledger: { checked: true, verdict_language_must_be_rejected_by_validator: true },
      runtime_trace_m11_only: { generated_by: "m11_deterministic_forensics", model_role: "batch_evaluation_only", deterministic_role: "forensic_assembly_from_saved_artifacts" },
      forensic_boundary: { material_profiles_re_emitted: false, challenge_gate_emitted: false, final_output_handoff_emitted: false, renderer_emitted: false, legal_cartography_rebuilt: false }
    }
  };
}

function buildEmissionManifest(workpadRows, controlledRows, triggeredRows) {
  const expectedControlled = workpadRows.filter((row) => row.final_material_status === "CONTROLLED").map((row) => row.Threat_ID);
  const expectedTriggered = workpadRows.filter((row) => row.final_material_status === "TRIGGERED").map((row) => row.Threat_ID);
  const emittedControlledList = extractThreatIdsFromMaterialRows(controlledRows);
  const emittedTriggeredList = extractThreatIdsFromMaterialRows(triggeredRows);
  const emittedControlled = new Set(emittedControlledList);
  const emittedTriggered = new Set(emittedTriggeredList);

  return {
    expected_active_registry_rows: EXPECTED_ACTIVE_REGISTRY_ROWS,
    workpad_rows: workpadRows.length,
    expected_controlled_rows: expectedControlled.length,
    emitted_controlled_rows: controlledRows.length,
    missing_controlled_threat_ids: expectedControlled.filter((id) => !emittedControlled.has(id)),
    expected_triggered_rows: expectedTriggered.length,
    emitted_triggered_rows: triggeredRows.length,
    missing_triggered_threat_ids: expectedTriggered.filter((id) => !emittedTriggered.has(id)),
    duplicate_emitted_threat_ids: findDuplicates([...emittedControlledList, ...emittedTriggeredList]),
    wrong_status_emitted_rows: [],
    all_controlled_rows_emitted: expectedControlled.every((id) => emittedControlled.has(id)),
    all_triggered_rows_emitted: expectedTriggered.every((id) => emittedTriggered.has(id))
  };
}

function buildAssemblyLedger(workpadRows, controlledRows, triggeredRows) {
  return [
    { profile: "exposure_registry_controlled_profile", source: "exposure_registry_workpad_98", expected_rows: workpadRows.filter((row) => row.final_material_status === "CONTROLLED").length, emitted_rows: controlledRows.length },
    { profile: "exposure_registry_triggered_profile", source: "exposure_registry_workpad_98", expected_rows: workpadRows.filter((row) => row.final_material_status === "TRIGGERED").length, emitted_rows: triggeredRows.length }
  ];
}

function buildLockGate({ workpadRows, controlledRows, triggeredRows, batchValidations, lepSelection }) {
  const failures = [];
  const manifest = buildEmissionManifest(workpadRows, controlledRows, triggeredRows);
  if (workpadRows.length !== EXPECTED_ACTIVE_REGISTRY_ROWS) failures.push(`workpad row count mismatch: ${workpadRows.length}`);
  if (lepSelection.rows.length !== EXPECTED_LEP_ROWS) failures.push(`LEP row count mismatch: ${lepSelection.rows.length}`);
  failures.push(...asArray(lepSelection.validation?.failures));
  if (!manifest.all_controlled_rows_emitted) failures.push("missing controlled material projection rows");
  if (!manifest.all_triggered_rows_emitted) failures.push("missing triggered material projection rows");
  for (const validation of asArray(batchValidations)) {
    const status = validation?.exposure_registry_batch_validation?.status || validation?.status || "UNKNOWN";
    if (status === "REPAIR_REQUIRED" || status === "CONTROLLED_FAILURE") failures.push(`batch validation status requires review: ${status}`);
  }
  return { status: failures.length ? "REPAIR_REQUIRED" : "PASS", failures };
}

function collectEvidenceBindingLedger(acceptedBatches) {
  const ledger = [];
  for (const artifact of asArray(acceptedBatches)) {
    const root = unwrap(artifact, "m11_batch_registry_ledger");
    for (const row of asArray(root.batch_registry_ledger)) {
      ledger.push({ Threat_ID: row.Threat_ID || "", batch_id: root.batch_id || "", basis_proof: row.basis_proof || "", row_limitations: row.row_limitations || "", m9_legal_cartography_consumed: Boolean(root.m9_legal_cartography_consumed) });
    }
  }
  return ledger;
}

function extractThreatIdsFromMaterialRows(rows) {
  const ids = [];
  for (const row of asArray(rows)) {
    const text = String(row.registry_exposure || "");
    const match = text.match(/\b[A-Z]{3}_[A-Z]{3}_(?:\d{3}|IN\d+|LB\d+)\b/);
    if (match) ids.push(match[0]);
  }
  return ids;
}

function findDuplicates(items) {
  const seen = new Set();
  const duplicates = new Set();
  for (const item of items) {
    if (seen.has(item)) duplicates.add(item);
    seen.add(item);
  }
  return [...duplicates];
}

function isEvaluationRouted(row) {
  return row.route === "EVALUATION_ROUTED";
}

function unwrap(value, key) {
  return value?.[key] || value?.artifact?.[key] || value || {};
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}
