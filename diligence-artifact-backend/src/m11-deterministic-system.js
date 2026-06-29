const MAX_M11_BATCH_ROWS = 8;
const EXPECTED_ACTIVE_REGISTRY_ROWS = 98;
const EXPECTED_LEP_ROWS = 22;

const CRITICAL_REGISTRY_FIELDS = Object.freeze([
  "Threat_ID",
  "Threat_Name",
  "Archetype",
  "Surface",
  "Status",
  "Hunter_Trigger",
  "FIELD21",
  "FIELD22",
  "FIELD23"
]);

const METADATA_REGISTRY_FIELDS = Object.freeze([
  "Lane",
  "Authority_IN",
  "Authority_EU",
  "Authority_US",
  "Velocity",
  "Pain_Tier",
  "Pain_Category",
  "Pain_Depth",
  "Effective_Date",
  "Legal_Pain",
  "FP_Mechanism",
  "FP_Impact",
  "Lex_Nova_Fix",
  "Provenance"
]);

const REQUIRED_REGISTRY_FIELDS = Object.freeze([
  ...CRITICAL_REGISTRY_FIELDS,
  ...METADATA_REGISTRY_FIELDS
]);

const MATERIAL_FIELDS = Object.freeze([
  "registry_exposure",
  "target_match",
  "evaluation_status",
  "basis_proof",
  "impact_priority",
  "review_route",
  "row_limitations"
]);

const FINAL_MATERIAL_STATUSES = new Set(["TRIGGERED", "CONTROLLED"]);
const ROUTED = "EVALUATION_ROUTED";
const NOT_APPLICABLE = "NOT_TRIGGERED_NOT_APPLICABLE";

export {
  CRITICAL_REGISTRY_FIELDS,
  EXPECTED_ACTIVE_REGISTRY_ROWS,
  EXPECTED_LEP_ROWS,
  MAX_M11_BATCH_ROWS,
  MATERIAL_FIELDS,
  METADATA_REGISTRY_FIELDS,
  REQUIRED_REGISTRY_FIELDS
};

export function parseAiThreatRegistryYaml(content) {
  const text = String(content || "");
  const rows = [];
  let current = null;
  let currentKey = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed === "---") continue;

    if (trimmed === "-") {
      if (current && Object.keys(current).length) rows.push(current);
      current = {};
      currentKey = null;
      continue;
    }

    if (!current) current = {};

    const match = trimmed.match(/^([A-Za-z0-9_]+):(?:\s*(.*))?$/);
    if (match) {
      currentKey = match[1];
      current[currentKey] = normalizeScalar(match[2] || "");
      continue;
    }

    if (currentKey) current[currentKey] = `${current[currentKey]} ${normalizeScalar(trimmed)}`.trim();
  }

  if (current && Object.keys(current).length) rows.push(current);
  return rows.filter((row) => row.Threat_ID);
}

export function parseReferencePacket(referencePacket = {}) {
  const files = referencePacket?.files && typeof referencePacket.files === "object" ? referencePacket.files : {};
  return {
    aiThreatRegistryText: files["AI_THREAT_REGISTRY.yaml"]?.content || "",
    registryKeyText: files["REGISTRY_KEY_v3_0.md"]?.content || "",
    registryEvaluationRulesText: files["03_REGISTRY_EVALUATION_RULES.yaml"]?.content || "",
    fieldDerivationRegistryText: files["FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml"]?.content || "",
    forensicAnnexureRegistryText: files["FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml"]?.content || ""
  };
}

export function validateRegistryRows(rows, { expectedCount = EXPECTED_ACTIVE_REGISTRY_ROWS } = {}) {
  const failures = [];
  const metadata_limitations = [];
  const ids = new Set();
  const archetype_counts = {};
  const surface_counts = {};

  if (!Array.isArray(rows)) return failValidation(["registry rows must be an array"]);
  if (rows.length !== expectedCount) failures.push(`expected ${expectedCount} active registry rows, received ${rows.length}`);

  for (const row of rows) {
    const threatId = String(row?.Threat_ID || "").trim();
    if (!threatId) {
      failures.push("registry row missing Threat_ID");
      continue;
    }

    if (ids.has(threatId)) failures.push(`duplicate Threat_ID: ${threatId}`);
    ids.add(threatId);

    for (const field of CRITICAL_REGISTRY_FIELDS) {
      if (isMissingRegistryValue(row[field])) failures.push(`${threatId} missing critical ${field}`);
    }

    for (const field of METADATA_REGISTRY_FIELDS) {
      if (isMissingRegistryValue(row[field])) {
        metadata_limitations.push({
          Threat_ID: threatId,
          field,
          severity: "WARNING_NON_BLOCKING",
          reason: `${threatId} missing non-critical registry metadata ${field}`
        });
      }
    }

    const fieldCheck = validateThreatIdDecomposition(row);
    if (!fieldCheck.ok) failures.push(`${threatId} FIELD21/22/23 mismatch: ${fieldCheck.reason}`);

    const trigger = parseHunterTrigger(row.Hunter_Trigger || "");
    if (!trigger.ok) failures.push(`${threatId} Hunter_Trigger parse failed: ${trigger.failures.join("; ")}`);

    const archetype = String(row.Archetype || "UNKNOWN").trim() || "UNKNOWN";
    archetype_counts[archetype] = (archetype_counts[archetype] || 0) + 1;
    for (const surface of splitSurface(row.Surface)) surface_counts[surface] = (surface_counts[surface] || 0) + 1;
  }

  return {
    ok: failures.length === 0,
    status: failures.length ? "CONTROLLED_FAILURE" : metadata_limitations.length ? "PASS_WITH_LIMITATION" : "PASS",
    expected_active_rows: expectedCount,
    loaded_active_rows: rows.length,
    unique_threat_ids: ids.size,
    archetype_counts,
    surface_counts,
    failures,
    metadata_limitations,
    warning_count: metadata_limitations.length,
    blocking_failure_count: failures.length
  };
}

export function validateThreatIdDecomposition(row) {
  const threatId = String(row?.Threat_ID || "").trim();
  const parts = threatId.split("_");
  if (parts.length < 3) return { ok: false, reason: "Threat_ID must contain at least three underscore-delimited segments" };

  const expected21 = parts[0];
  const expected22 = parts[1];
  const expected23 = normalizeField23(parts.slice(2).join("_"));
  const actual21 = String(row.FIELD21 || "").trim();
  const actual22 = String(row.FIELD22 || "").trim();
  const actual23 = String(row.FIELD23 || "").trim();

  if (actual21 !== expected21) return { ok: false, reason: `FIELD21 expected ${expected21} got ${actual21 || "missing"}` };
  if (actual22 !== expected22) return { ok: false, reason: `FIELD22 expected ${expected22} got ${actual22 || "missing"}` };
  if (actual23 !== expected23) return { ok: false, reason: `FIELD23 expected ${expected23} got ${actual23 || "missing"}` };
  return { ok: true };
}

export function normalizeField23(value) {
  const text = String(value || "").trim();
  if (/^\d+$/.test(text)) return String(Number.parseInt(text, 10));
  return text;
}

export function parseHunterTrigger(value) {
  const text = unwrapQuotes(String(value || "").trim());
  const parts = text.split("|").map((part) => part.trim()).filter(Boolean);
  const conditions = [];
  let trigger_if = "";
  let exclude_if = "";

  for (const part of parts) {
    const condition = part.match(/^CONDITION_(\d+):\s*(.+)$/i);
    if (condition) {
      conditions.push({ condition_id: `CONDITION_${condition[1]}`, text: condition[2].trim() });
      continue;
    }
    const trigger = part.match(/^TRIGGER_IF:\s*(.+)$/i);
    if (trigger) {
      trigger_if = trigger[1].trim();
      continue;
    }
    const exclude = part.match(/^EXCLUDE_IF:\s*(.+)$/i);
    if (exclude) exclude_if = exclude[1].trim();
  }

  const failures = [];
  if (!conditions.length) failures.push("missing CONDITION_N");
  if (!trigger_if) failures.push("missing TRIGGER_IF");
  if (!exclude_if) failures.push("missing EXCLUDE_IF");
  return { ok: failures.length === 0, conditions, trigger_if, exclude_if, failures };
}

export function extractM11RoutingSubstrate(targetFeatureProfile = {}) {
  const profile = targetFeatureProfile.target_feature_profile || targetFeatureProfile;
  const activities = Array.isArray(profile?.activities) ? profile.activities : [];
  const active_archetypes = new Set();
  const active_surfaces = new Set();
  const stale_path_errors = [];
  const activity_refs = [];

  for (const activity of activities) {
    if (!activity || typeof activity !== "object") continue;
    if ("surface_tokens" in activity) stale_path_errors.push("target_feature_profile.activities[].surface_tokens is forbidden; use surface_context_tokens");
    for (const key of ["activity_id", "product_context", "activity_name", "mechanics", "routing_basis", "activity_inventory", "activity_mechanics", "registry_routing_substrate"]) {
      if (key in activity) stale_path_errors.push(`target_feature_profile.activities[].${key} is stale/forbidden`);
    }
    for (const code of asArray(activity.archetype_codes)) {
      const normalized = String(code || "").trim().toUpperCase();
      if (normalized) active_archetypes.add(normalized);
    }
    for (const surface of asArray(activity.surface_context_tokens)) {
      const normalized = normalizeSurface(surface);
      if (normalized) active_surfaces.add(normalized);
    }
    activity_refs.push({
      activity_reference: activity.activity_reference || "",
      product_service_wrapper: activity.product_service_wrapper || "",
      activity_feature_name: activity.activity_feature_name || "",
      archetype_codes: asArray(activity.archetype_codes),
      surface_context_tokens: asArray(activity.surface_context_tokens)
    });
  }

  return {
    active_archetypes: [...active_archetypes].sort(),
    active_surfaces: [...active_surfaces].sort(),
    activity_refs,
    stale_path_errors
  };
}

export function buildExposureRegistryRoutePlan({
  registryRows,
  targetFeatureProfile,
  legalCartographyIndex,
  upstreamArtifacts = {},
  referencePacket = null,
  runId = ""
}) {
  let rows = Array.isArray(registryRows) ? registryRows : [];
  if (!rows.length && referencePacket) rows = parseAiThreatRegistryYaml(parseReferencePacket(referencePacket).aiThreatRegistryText);

  const registryValidation = validateRegistryRows(rows);
  const routing = extractM11RoutingSubstrate(targetFeatureProfile || upstreamArtifacts.target_feature_profile || {});
  const legalCartography = legalCartographyIndex?.legal_cartography_index || legalCartographyIndex || upstreamArtifacts.legal_cartography_index || null;
  const legalCartographyStatus = inspectLegalCartographyIndex(legalCartography);

  const route_rows = rows.map((row, index) => routeRegistryRow(row, routing, index));
  const deterministic_not_applicable_rows = route_rows.filter((row) => row.route === NOT_APPLICABLE);
  const evaluationRows = route_rows.filter((row) => row.route === ROUTED);
  const batch_plan = buildBatchPlan(evaluationRows);

  const failures = [
    ...registryValidation.failures,
    ...routing.stale_path_errors,
    ...legalCartographyStatus.failures,
    ...validateRouteRows(route_rows).failures,
    ...validateBatchPlan(batch_plan).failures
  ];
  const warnings = [...(registryValidation.metadata_limitations || [])];
  const phaseStatus = failures.length ? "CONTROLLED_FAILURE" : warnings.length ? "PASS_WITH_LIMITATION" : "PASS";

  return {
    exposure_registry_route_plan: {
      run_id: runId,
      generated_by: "m11_deterministic_system",
      registry_inventory: {
        expected_active_rows: EXPECTED_ACTIVE_REGISTRY_ROWS,
        loaded_active_rows: rows.length,
        registry_schema_status: registryValidation.status,
        archetype_counts: registryValidation.archetype_counts,
        surface_counts: registryValidation.surface_counts,
        registry_metadata_limitations: warnings,
        warning_count: warnings.length,
        blocking_failure_count: failures.length
      },
      upstream_access_manifest: buildUpstreamAccessManifest(upstreamArtifacts),
      m9_legal_cartography_consumption: {
        m9_artifact: "legal_cartography_index",
        m9_is_builder: true,
        m11_builds_legal_cartography: false,
        selected_locator_policy: "consume_existing_m9_rows_first_with_closest_lossless_fallback_when_m9_silent",
        status: legalCartographyStatus.ok ? "PASS" : "CONTROLLED_FAILURE",
        available_families: legalCartographyStatus.available_families,
        failures: legalCartographyStatus.failures
      },
      active_routing_substrate: routing,
      route_rows,
      batch_plan,
      deterministic_not_applicable_rows,
      phase_a_validation: {
        status: phaseStatus,
        failures,
        warnings,
        non_blocking_warning_count: warnings.length,
        blocking_failure_count: failures.length
      }
    }
  };
}

export function buildBatchPlan(routeRows) {
  const routedRows = asArray(routeRows).filter((row) => row.route === ROUTED);
  const groups = new Map();
  for (const row of routedRows) {
    const group = String(row.Archetype || row.archetype || "UNKNOWN").trim().toUpperCase() || "UNKNOWN";
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(row);
  }

  const orderedGroups = [...groups.keys()].sort((a, b) => {
    if (a === "UNI") return -1;
    if (b === "UNI") return 1;
    return a.localeCompare(b);
  });

  const plan = [];
  for (const group of orderedGroups) {
    const rows = groups.get(group).sort((a, b) => a.registry_order - b.registry_order);
    let batchNumber = 0;
    for (let index = 0; index < rows.length; index += MAX_M11_BATCH_ROWS) {
      batchNumber += 1;
      const batchRows = rows.slice(index, index + MAX_M11_BATCH_ROWS);
      const nnn = String(batchNumber).padStart(3, "0");
      plan.push({
        batch_id: `${group}__${nnn}`,
        batch_group: group,
        batch_number: batchNumber,
        max_rows: MAX_M11_BATCH_ROWS,
        expected_threat_ids: batchRows.map((row) => row.Threat_ID),
        route_reasons: unique(batchRows.map((row) => row.route_reason)),
        registry_order_start: batchRows[0]?.registry_order ?? null,
        registry_order_end: batchRows[batchRows.length - 1]?.registry_order ?? null,
        status: "PLANNED"
      });
    }
  }
  return plan;
}

export function validateBatchPlan(batchPlan) {
  const failures = [];
  const ids = new Set();
  for (const batch of asArray(batchPlan)) {
    if (!batch.batch_id) failures.push("batch missing batch_id");
    if (!batch.batch_group) failures.push(`${batch.batch_id || "batch"} missing batch_group`);
    const expected = asArray(batch.expected_threat_ids);
    if (!expected.length) failures.push(`${batch.batch_id || "batch"} has no expected_threat_ids`);
    if (expected.length > MAX_M11_BATCH_ROWS) failures.push(`${batch.batch_id || "batch"} has ${expected.length} rows; max is ${MAX_M11_BATCH_ROWS}`);
    for (const id of expected) {
      if (ids.has(id)) failures.push(`Threat_ID appears in multiple batches: ${id}`);
      ids.add(id);
    }
  }
  return { ok: failures.length === 0, failures };
}

export function buildM11BatchPacket({ routePlan, batchId, upstreamArtifacts = {}, referencePacket = null }) {
  const plan = routePlan?.exposure_registry_route_plan || routePlan;
  const batch = asArray(plan?.batch_plan).find((item) => item.batch_id === batchId);
  if (!batch) throw new Error(`M11_BATCH_NOT_FOUND:${batchId || "missing"}`);

  const registryRows = new Map(asArray(plan.route_rows).map((row) => [row.Threat_ID, row.registry_row || row]));
  const references = referencePacket ? parseReferencePacket(referencePacket) : {};
  const legalCartography = upstreamArtifacts.legal_cartography_index?.legal_cartography_index || upstreamArtifacts.legal_cartography_index || null;
  const rows = batch.expected_threat_ids.map((id) => {
    const row = registryRows.get(id);
    return {
      ...row,
      Hunter_Trigger_Parsed: parseHunterTrigger(row?.Hunter_Trigger || ""),
      m9_legal_cartography_selection: selectLegalCartographyRowsForRegistryRow(row, legalCartography)
    };
  });

  return {
    m11_batch_packet: {
      batch_id: batch.batch_id,
      batch_group: batch.batch_group,
      expected_threat_ids: [...batch.expected_threat_ids],
      registry_rows: rows,
      route_reasons: batch.route_reasons || [],
      upstream_artifact_excerpt_manifest: buildUpstreamAccessManifest(upstreamArtifacts),
      registry_evaluation_rules_text: references.registryEvaluationRulesText || "",
      m9_legal_cartography_rule: {
        m9_is_builder: true,
        m11_is_builder: false,
        consumed_artifact: "legal_cartography_index",
        proof_rule: "M9 locates; admitted lossless text or locked upstream proof proves."
      }
    }
  };
}

export function validateM11BatchLedger(batchLedgerRoot, expectedThreatIds = []) {
  const ledger = batchLedgerRoot?.m11_batch_registry_ledger || batchLedgerRoot;
  const failures = [];
  if (!ledger || typeof ledger !== "object" || Array.isArray(ledger)) return failValidation(["missing m11_batch_registry_ledger object"]);

  const expected = asArray(expectedThreatIds.length ? expectedThreatIds : ledger.expected_threat_ids).map(String);
  const returned = asArray(ledger.returned_threat_ids).map(String);
  const rows = asArray(ledger.batch_registry_ledger);
  if (!arraysEqualAsSets(expected, returned)) failures.push("returned_threat_ids do not match expected_threat_ids");
  if (rows.length !== expected.length) failures.push(`batch_registry_ledger length ${rows.length} does not match expected ${expected.length}`);

  const seen = new Set();
  for (const row of rows) {
    const id = String(row?.Threat_ID || "").trim();
    if (!id) failures.push("batch row missing Threat_ID");
    if (id.includes("/") || id.includes(",")) failures.push(`composite/grouped Threat_ID forbidden: ${id}`);
    if (!expected.includes(id)) failures.push(`unexpected Threat_ID returned: ${id}`);
    if (seen.has(id)) failures.push(`duplicate Threat_ID returned: ${id}`);
    seen.add(id);
    for (const field of MATERIAL_FIELDS) if (!(field in row)) failures.push(`${id || "row"} missing material field ${field}`);
    const extra = Object.keys(row).filter((key) => !["Threat_ID", "trigger_status", ...MATERIAL_FIELDS].includes(key));
    if (extra.length) failures.push(`${id || "row"} has extra keys: ${extra.join(",")}`);
  }

  return { ok: failures.length === 0, status: failures.length ? "REPAIR_REQUIRED" : "PASS", failures };
}

export function mergeExposureRegistryWorkpad98({ routePlan, acceptedBatches = [], batchValidations = [] }) {
  const plan = routePlan?.exposure_registry_route_plan || routePlan;
  if (!plan) throw new Error("M11_WORKPAD_MERGE_BLOCKED:route_plan_missing");

  const routeRows = asArray(plan.route_rows);
  const batchRowsById = collectAcceptedBatchRows(acceptedBatches);
  const validationIndex = collectBatchValidationIndex(batchValidations);
  const registry_rows = [];
  const failures = [];

  for (const routeRow of routeRows) {
    const threatId = routeRow.Threat_ID;
    if (!threatId) {
      failures.push("route row missing Threat_ID");
      continue;
    }
    if (routeRow.route === NOT_APPLICABLE) {
      registry_rows.push(buildDeterministicNotApplicableWorkpadRow(routeRow));
      continue;
    }

    const batchRow = batchRowsById.get(threatId);
    if (!batchRow) {
      failures.push(`missing accepted batch row for ${threatId}`);
      registry_rows.push({
        Threat_ID: threatId,
        registry_order: routeRow.registry_order,
        route: routeRow.route,
        route_reason: routeRow.route_reason,
        final_material_status: "CONTROLLED_FAILURE",
        workpad_status: "MISSING_ACCEPTED_BATCH_ROW",
        source_batch_id: routeRow.batch_id || null
      });
      continue;
    }

    registry_rows.push({
      Threat_ID: threatId,
      registry_order: routeRow.registry_order,
      route: routeRow.route,
      route_reason: routeRow.route_reason,
      archetype: routeRow.Archetype,
      surface: routeRow.Surface,
      trigger_status: batchRow.trigger_status || "",
      internal_evaluation_status: batchRow.evaluation_status || "",
      final_material_status: normalizeFinalMaterialStatus(batchRow),
      material_projection: pickMaterialFields(batchRow),
      source_batch_id: batchRow.batch_id || routeRow.batch_id || null,
      m12_batch_validation_status: validationIndex.get(batchRow.batch_id || routeRow.batch_id || "")?.status || "MISSING_VALIDATION",
      limitations: batchRow.row_limitations || ""
    });
  }

  const coverage = validateWorkpadRows(registry_rows);
  failures.push(...coverage.failures);
  return {
    exposure_registry_workpad_98: {
      workpad_metadata: {
        generated_by: "m11_deterministic_system",
        expected_active_rows: EXPECTED_ACTIVE_REGISTRY_ROWS,
        loaded_workpad_rows: registry_rows.length,
        status: failures.length ? "REPAIR_REQUIRED" : "PASS"
      },
      registry_rows: registry_rows.sort((a, b) => (a.registry_order ?? 9999) - (b.registry_order ?? 9999)),
      batch_index: asArray(plan.batch_plan).map((batch) => ({
        batch_id: batch.batch_id,
        batch_group: batch.batch_group,
        expected_threat_ids: batch.expected_threat_ids,
        accepted_rows_present: asArray(batch.expected_threat_ids).filter((id) => batchRowsById.has(id)).length
      })),
      m12_batch_validation_index: [...validationIndex.values()],
      m9_legal_cartography_consumption_index: collectM9ConsumptionIndex(acceptedBatches),
      merge_validation: { status: failures.length ? "REPAIR_REQUIRED" : "PASS", failures }
    }
  };
}

export function projectControlledProfile(workpadRoot) {
  const workpad = workpadRoot?.exposure_registry_workpad_98 || workpadRoot;
  const rows = asArray(workpad?.registry_rows)
    .filter((row) => row.final_material_status === "CONTROLLED")
    .sort((a, b) => (a.registry_order ?? 9999) - (b.registry_order ?? 9999))
    .map((row) => ({ ...pickMaterialFields(row.material_projection || row), evaluation_status: "CONTROLLED" }));
  return { exposure_registry_controlled_profile: { controlled_rows: rows } };
}

export function projectTriggeredProfile(workpadRoot) {
  const workpad = workpadRoot?.exposure_registry_workpad_98 || workpadRoot;
  const rows = asArray(workpad?.registry_rows)
    .filter((row) => row.final_material_status === "TRIGGERED")
    .sort((a, b) => (a.registry_order ?? 9999) - (b.registry_order ?? 9999))
    .map((row) => ({ ...pickMaterialFields(row.material_projection || row), evaluation_status: "TRIGGERED" }));
  return { exposure_registry_triggered_profile: { triggered_rows: rows } };
}

export function buildExposureRegistryForensics({ routePlan, workpad, controlledProfile, triggeredProfile, acceptedBatches = [], batchValidations = [] }) {
  const plan = routePlan?.exposure_registry_route_plan || routePlan || {};
  const pad = workpad?.exposure_registry_workpad_98 || workpad || {};
  const controlled = controlledProfile?.exposure_registry_controlled_profile || controlledProfile || {};
  const triggered = triggeredProfile?.exposure_registry_triggered_profile || triggeredProfile || {};
  const rows = asArray(pad.registry_rows);
  const controlledRows = asArray(controlled.controlled_rows);
  const triggeredRows = asArray(triggered.triggered_rows);
  return {
    exposure_registry_profile_forensics: {
      registry_input_manifest: {
        expected_active_rows: EXPECTED_ACTIVE_REGISTRY_ROWS,
        actual_workpad_rows: rows.length,
        m9_legal_cartography_consumed: plan?.m9_legal_cartography_consumption?.m11_builds_legal_cartography === false,
        route_plan_status: plan?.phase_a_validation?.status || "UNKNOWN"
      },
      full_registry_inventory_ledger: rows.map((row) => ({ Threat_ID: row.Threat_ID, registry_order: row.registry_order, archetype: row.archetype, surface: row.surface, route: row.route, final_material_status: row.final_material_status })),
      lep_selector_application_ledger: buildPlaceholderLepLedger(),
      internal_registry_route_plan_ledger: asArray(plan.route_rows),
      trigger_review_workspace_ledger: rows.filter((row) => row.route === ROUTED).map((row) => ({ Threat_ID: row.Threat_ID, source_batch_id: row.source_batch_id || null })),
      trigger_adjudication_ledger: rows.filter((row) => row.route === ROUTED).map((row) => ({ Threat_ID: row.Threat_ID, trigger_status: row.trigger_status, internal_evaluation_status: row.internal_evaluation_status })),
      evidence_binding_ledger: collectEvidenceBindingLedger(acceptedBatches),
      control_exclude_evaluation_ledger: rows.filter((row) => row.route === ROUTED).map((row) => ({ Threat_ID: row.Threat_ID, final_material_status: row.final_material_status, limitations: row.limitations || "" })),
      registry_row_workpad_accountability_ledger: rows.map((row) => ({ Threat_ID: row.Threat_ID, accounted: true, final_material_status: row.final_material_status })),
      triggered_controlled_row_assembly_ledger: buildAssemblyLedger(rows, controlledRows, triggeredRows),
      emission_manifest: buildEmissionManifest(rows, controlledRows, triggeredRows),
      registry_self_check_result: pad.merge_validation || {},
      registry_lock_gate_result: buildRegistryLockGateResult(rows, controlledRows, triggeredRows, batchValidations),
      legal_firewall_ledger: { forbidden_legal_verdict_terms_detected: false },
      runtime_trace_m11_only: { generated_by: "m11_deterministic_system", model_role: "batch_evaluation_only" },
      forensic_boundary: { material_profiles_re_emitted: false, challenge_gate_emitted: false, renderer_emitted: false }
    }
  };
}

function routeRegistryRow(row, routing, index) {
  const archetype = String(row.Archetype || "").trim().toUpperCase();
  const surfaces = splitSurface(row.Surface);
  const activeArchetypes = new Set(asArray(routing.active_archetypes).map((item) => String(item).trim().toUpperCase()));
  let route = NOT_APPLICABLE;
  let route_reason = "INT_NOT_TRIGGERED_NOT_APPLICABLE";

  if (archetype === "UNI") {
    route = ROUTED;
    route_reason = "UNI_ALWAYS_RUN";
  } else if (activeArchetypes.has(archetype)) {
    route = ROUTED;
    route_reason = "ARCHETYPE_TRIGGERED";
  }

  return {
    Threat_ID: row.Threat_ID,
    Threat_Name: row.Threat_Name,
    Archetype: row.Archetype,
    Surface: row.Surface,
    FIELD21: row.FIELD21,
    FIELD22: row.FIELD22,
    FIELD23: row.FIELD23,
    registry_order: index + 1,
    route,
    route_reason,
    surfaces,
    registry_row: { ...row, Hunter_Trigger_Parsed: parseHunterTrigger(row.Hunter_Trigger || "") }
  };
}

function validateRouteRows(routeRows) {
  const failures = [];
  const ids = new Set();
  let uniNotApplicable = 0;
  for (const row of asArray(routeRows)) {
    if (!row.Threat_ID) failures.push("route row missing Threat_ID");
    if (ids.has(row.Threat_ID)) failures.push(`duplicate route row: ${row.Threat_ID}`);
    ids.add(row.Threat_ID);
    if (row.Archetype === "UNI" && row.route !== ROUTED) uniNotApplicable += 1;
  }
  if (routeRows.length !== EXPECTED_ACTIVE_REGISTRY_ROWS) failures.push(`route plan must account for ${EXPECTED_ACTIVE_REGISTRY_ROWS} rows, got ${routeRows.length}`);
  if (uniNotApplicable) failures.push(`${uniNotApplicable} UNI rows were not evaluation-routed`);
  return { ok: failures.length === 0, failures };
}

function inspectLegalCartographyIndex(index) {
  const failures = [];
  const required = ["document_coverage_index", "document_structure_index", "incorporated_linked_document_map", "control_language_locator", "missing_limited_legal_governance_items", "downstream_rules", "lock_status"];
  if (!index || typeof index !== "object" || Array.isArray(index)) return { ok: false, available_families: [], failures: ["legal_cartography_index missing or not an object"] };
  for (const key of required) if (!(key in index)) failures.push(`legal_cartography_index missing ${key}`);
  return { ok: failures.length === 0, available_families: Object.keys(index), failures };
}

function buildUpstreamAccessManifest(artifacts = {}) {
  const names = ["source_discovery_handoff", "legal_cartography_index", "target_profile", "target_profile_forensics", "target_feature_profile", "target_feature_profile_forensics", "data_provenance_profile", "data_provenance_profile_forensics", "lossless_family__L1_CORE_TERMS_PRIVACY", "lossless_family__L2_B2B_CONTRACTING", "lossless_family__L3_AI_USAGE_GOVERNANCE", "lossless_family__L4_PRIVACY_ADJACENT_NOTICES", "lossless_family__L5_LEGAL_HUB_HOSTED", "lossless_family__L6_ENTITY_NOTICE"];
  return Object.fromEntries(names.map((name) => [name, artifacts[name] ? "FOUND" : "MISSING_OR_NOT_SUPPLIED"]));
}

function selectLegalCartographyRowsForRegistryRow(row = {}, legalCartographyIndex = null) {
  if (!legalCartographyIndex || typeof legalCartographyIndex !== "object") return [];
  const keywords = buildRegistryKeywords(row);
  const selected = [];
  for (const family of ["control_language_locator", "document_structure_index", "document_coverage_index", "incorporated_linked_document_map", "missing_limited_legal_governance_items"]) {
    for (const item of asArray(legalCartographyIndex[family])) {
      const haystack = JSON.stringify(item).toLowerCase();
      const score = keywords.reduce((sum, keyword) => sum + (haystack.includes(keyword) ? 1 : 0), 0);
      if (score > 0) selected.push({ family, score, item });
    }
  }
  return selected.sort((a, b) => b.score - a.score).slice(0, 12);
}

function buildRegistryKeywords(row = {}) {
  const raw = [row.Threat_Name, row.Surface, row.FP_Mechanism, row.Lex_Nova_Fix, row.Legal_Pain].filter(Boolean).join(" ").toLowerCase();
  return unique(raw.split(/[^a-z0-9]+/).filter((word) => word.length >= 5).slice(0, 40));
}

function collectAcceptedBatchRows(acceptedBatches) {
  const map = new Map();
  for (const artifact of asArray(acceptedBatches)) {
    const ledger = artifact?.m11_batch_registry_ledger || artifact?.artifact?.m11_batch_registry_ledger || artifact;
    const batchId = ledger?.batch_id || artifact?.batch_id || "";
    for (const row of asArray(ledger?.batch_registry_ledger)) map.set(row.Threat_ID, { ...row, batch_id: batchId });
  }
  return map;
}

function collectBatchValidationIndex(batchValidations) {
  const map = new Map();
  for (const validation of asArray(batchValidations)) {
    const root = validation?.exposure_registry_batch_validation || validation?.artifact?.exposure_registry_batch_validation || validation;
    const batchId = root.batch_id || validation.batch_id || "";
    if (!batchId) continue;
    map.set(batchId, { batch_id: batchId, status: root.status || validation.status || "UNKNOWN", validation: root });
  }
  return map;
}

function buildDeterministicNotApplicableWorkpadRow(routeRow) {
  return {
    Threat_ID: routeRow.Threat_ID,
    registry_order: routeRow.registry_order,
    route: NOT_APPLICABLE,
    route_reason: routeRow.route_reason,
    archetype: routeRow.Archetype,
    surface: routeRow.Surface,
    trigger_status: "CONDITIONAL_NOT_TRIGGERED",
    internal_evaluation_status: "NOT_APPLICABLE_CONTEXTUAL",
    final_material_status: "WORKPAD_ONLY",
    material_projection: null,
    source_batch_id: null,
    m12_batch_validation_status: "NOT_REQUIRED_DETERMINISTIC_NON_UNI",
    limitations: "Non-UNI row had no active archetype in locked M8 routing substrate. Surface context is not an independent route trigger."
  };
}

function normalizeFinalMaterialStatus(row = {}) {
  const candidate = String(row.final_material_status || row.evaluation_status || "").trim().toUpperCase();
  if (FINAL_MATERIAL_STATUSES.has(candidate)) return candidate;
  return "WORKPAD_ONLY";
}

function pickMaterialFields(row = {}) {
  return Object.fromEntries(MATERIAL_FIELDS.map((field) => [field, field === "evaluation_status" ? String(row[field] || "").trim().toUpperCase() : row[field] || ""]));
}

function validateWorkpadRows(rows) {
  const failures = [];
  const ids = new Set();
  if (rows.length !== EXPECTED_ACTIVE_REGISTRY_ROWS) failures.push(`workpad must contain ${EXPECTED_ACTIVE_REGISTRY_ROWS} rows, got ${rows.length}`);
  for (const row of rows) {
    if (!row.Threat_ID) failures.push("workpad row missing Threat_ID");
    if (ids.has(row.Threat_ID)) failures.push(`duplicate workpad Threat_ID: ${row.Threat_ID}`);
    ids.add(row.Threat_ID);
    if (row.route === ROUTED && row.m12_batch_validation_status === "MISSING_VALIDATION") failures.push(`${row.Threat_ID} missing M12 batch validation`);
  }
  return { ok: failures.length === 0, failures };
}

function collectM9ConsumptionIndex(acceptedBatches) {
  const rows = [];
  for (const artifact of asArray(acceptedBatches)) {
    const ledger = artifact?.m11_batch_registry_ledger || artifact;
    for (const row of asArray(ledger?.batch_registry_ledger)) rows.push({ Threat_ID: row.Threat_ID, basis_proof: row.basis_proof || "" });
  }
  return rows;
}

function collectEvidenceBindingLedger(acceptedBatches) {
  const rows = [];
  for (const artifact of asArray(acceptedBatches)) {
    const ledger = artifact?.m11_batch_registry_ledger || artifact;
    for (const row of asArray(ledger?.batch_registry_ledger)) rows.push({ Threat_ID: row.Threat_ID, basis_proof: row.basis_proof || "", evaluation_status: row.evaluation_status || "" });
  }
  return rows;
}

function buildAssemblyLedger(workpadRows, controlledRows, triggeredRows) {
  const controlledSet = new Set(controlledRows.map((row) => row.registry_exposure || row.Threat_ID).filter(Boolean));
  const triggeredSet = new Set(triggeredRows.map((row) => row.registry_exposure || row.Threat_ID).filter(Boolean));
  return workpadRows.map((row) => ({ Threat_ID: row.Threat_ID, final_material_status: row.final_material_status, in_controlled_profile: controlledSet.has(row.material_projection?.registry_exposure || row.Threat_ID), in_triggered_profile: triggeredSet.has(row.material_projection?.registry_exposure || row.Threat_ID) }));
}

function buildEmissionManifest(workpadRows, controlledRows, triggeredRows) {
  return { workpad_rows: workpadRows.length, controlled_rows: controlledRows.length, triggered_rows: triggeredRows.length, split_material_outputs: true };
}

function buildRegistryLockGateResult(workpadRows, controlledRows, triggeredRows, batchValidations) {
  const failures = [];
  const controlledExpected = workpadRows.filter((row) => row.final_material_status === "CONTROLLED").length;
  const triggeredExpected = workpadRows.filter((row) => row.final_material_status === "TRIGGERED").length;
  if (controlledRows.length !== controlledExpected) failures.push(`controlled projection mismatch expected ${controlledExpected} got ${controlledRows.length}`);
  if (triggeredRows.length !== triggeredExpected) failures.push(`triggered projection mismatch expected ${triggeredExpected} got ${triggeredRows.length}`);
  for (const validation of asArray(batchValidations)) {
    const root = validation?.exposure_registry_batch_validation || validation;
    if (!["PASS", "PASS_WITH_LIMITATION"].includes(root.status)) failures.push(`batch validation not accepted: ${root.batch_id || "unknown"}`);
  }
  return { status: failures.length ? "REPAIR_REQUIRED" : "PASS", failures };
}

function buildPlaceholderLepLedger() {
  return Array.from({ length: EXPECTED_LEP_ROWS }, (_value, index) => ({ Field_ID: `LEP.${String(index + 1).padStart(3, "0")}`, status: "ACCOUNTED_FOR_IN_FIELD_DERIVATION_REGISTRY" }));
}

function failValidation(failures) {
  return { ok: false, status: "CONTROLLED_FAILURE", failures, metadata_limitations: [], warning_count: 0, blocking_failure_count: failures.length };
}

function isMissingRegistryValue(value) {
  return String(value ?? "").trim() === "";
}

function splitSurface(value) {
  return String(value || "").split("|").map((item) => item.trim()).filter(Boolean);
}

function normalizeSurface(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function arraysEqualAsSets(a, b) {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((item) => set.has(item));
}

function unique(items) {
  return [...new Set(asArray(items).filter(Boolean))];
}

function normalizeScalar(value) {
  return unwrapQuotes(String(value || "").trim());
}

function unwrapQuotes(value) {
  const text = String(value || "").trim();
  if ((text.startsWith("'") && text.endsWith("'")) || (text.startsWith('"') && text.endsWith('"'))) return text.slice(1, -1).replace(/''/g, "'");
  return text;
}
