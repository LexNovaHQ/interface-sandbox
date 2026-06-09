function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asText(value) {
  return String(value || "").trim();
}

function asUpper(value) {
  return asText(value).toUpperCase();
}

function splitTokens(value) {
  if (Array.isArray(value)) return value.map(asText).filter(Boolean);
  return asText(value).split(/[|,;]/).map(asText).filter(Boolean);
}

const K_ID = "threat_id";
const K_NAME = "threat_name";
const K_FINAL = "final_status";
const K_TRIGGER = "trigger_if_result";
const K_EXCLUDE = "exclude_if_result";

const STRICT_CONDITIONAL_ARTIFACT_PATTERNS = [
  /\bdpa\b/i,
  /\bdata processing agreement\b/i,
  /\bdata processing addendum\b/i,
  /\bdata protection addendum\b/i,
  /\bprocessor terms\b/i,
  /\bgdpr addendum\b/i,
  /\baup\b/i,
  /\bacceptable use policy\b/i,
  /\bprohibited use policy\b/i,
  /\busage restrictions?\b/i,
  /\bsla\b/i,
  /\bservice level agreement\b/i,
  /\bservice level terms\b/i,
  /\buptime commitment\b/i,
  /\bavailability commitment\b/i,
  /\bservice credits?\b/i,
  /\bsupport response commitment\b/i,
  /\bterms of service\b/i,
  /\bterms of use\b/i,
  /\bcustomer terms\b/i,
  /\bservice terms\b/i,
  /\bprivacy policy\b/i,
  /\bprivacy notice\b/i,
  /\bprivacy statement\b/i,
  /\bsubprocessor(?:s)?(?: list| disclosure| page| terms)?\b/i,
  /\bretention schedule\b/i,
  /\bdata retention policy\b/i,
  /\bdeletion policy\b/i,
  /\bdeletion route\b/i,
  /\bbiometric policy\b/i,
  /\bbiometric retention\b/i,
  /\bbiometric deletion\b/i
];

function rowId(row, index) {
  return asText(row?.Threat_ID || row?.threat_id || `ROW_${index + 1}`);
}

function rowName(row) {
  return asText(row?.Threat_Name || row?.threat_name || "Unnamed row");
}

function rowArchetype(row) {
  return asUpper(row?.Threat_ID || row?.threat_id || "").split("_")[0] || asUpper(row?.Archetype || row?.archetype?.code || row?.archetype || row?.archetype_code || row?.Helper_Archetype || row?.helper_archetype || "");
}

function rowSurfaces(row) {
  return splitTokens(row?.Surface || row?.surface?.tokens || row?.surface?.raw || row?.surface || row?.Surface_Tokens || row?.surface_tokens || row?.Surfaces || row?.surfaces);
}

function hunterTriggerParts(row = {}) {
  const trigger = row?.hunter_trigger && typeof row.hunter_trigger === "object" ? row.hunter_trigger : {};
  const conditions = trigger.conditions && typeof trigger.conditions === "object" ? Object.values(trigger.conditions) : [];
  return [
    row?.Hunter_Trigger,
    trigger.raw,
    ...conditions,
    trigger.trigger_if,
    trigger.exclude_if,
    row?.Trigger,
    row?.trigger,
    row?.Trigger_If,
    row?.trigger_if,
    row?.Exclude_If,
    row?.exclude_if,
    row?.Legal_Pain,
    row?.legal_pain,
    row?.Lex_Nova_Fix,
    row?.fix_route,
    row?.fp_mechanism,
    row?.fp_impact
  ];
}

function rowTriggerText(row) {
  return hunterTriggerParts(row).map(asText).filter(Boolean).join(" | ");
}

function isConditionalDocRow(row) {
  const text = rowTriggerText(row);
  return STRICT_CONDITIONAL_ARTIFACT_PATTERNS.some((pattern) => pattern.test(text));
}

function activeSignals(profile = {}) {
  const archetypes = new Set();
  const surfaces = new Set();
  const refsByArchetype = new Map();
  const refsBySurface = new Map();
  for (const feature of asArray(profile.product_feature_map)) {
    const featureId = asText(feature?.feature_id) || "UNKNOWN";
    for (const code of asArray(feature?.archetype_codes).map(asUpper).filter(Boolean)) {
      archetypes.add(code);
      if (!refsByArchetype.has(code)) refsByArchetype.set(code, new Set());
      refsByArchetype.get(code).add(featureId);
    }
    for (const token of asArray(feature?.surface_tokens).map(asText).filter(Boolean)) {
      surfaces.add(token);
      if (!refsBySurface.has(token)) refsBySurface.set(token, new Set());
      refsBySurface.get(token).add(featureId);
    }
  }
  return { archetypes, surfaces, refsByArchetype, refsBySurface };
}

function refsFor(row, active) {
  const refs = new Set();
  const archetype = rowArchetype(row);
  if (active.refsByArchetype.has(archetype)) for (const ref of active.refsByArchetype.get(archetype)) refs.add(ref);
  for (const surface of rowSurfaces(row)) if (active.refsBySurface.has(surface)) for (const ref of active.refsBySurface.get(surface)) refs.add(ref);
  return [...refs];
}

function deterministicEntry(row, index, active, routeReason) {
  const refs = refsFor(row, active);
  return {
    entry_number: index + 1,
    [K_ID]: rowId(row, index),
    [K_NAME]: rowName(row),
    archetype_gate: "FAIL",
    surface_gate: "FAIL",
    authority_relevance: "DETERMINISTIC_PRIORITY_GATE",
    conditions: [],
    [K_TRIGGER]: false,
    [K_EXCLUDE]: false,
    [K_FINAL]: "NOT_APPLICABLE",
    feature_refs: refs.length ? refs : ["NO_STAGE5_TRIGGER"],
    evidence_ref: "stage5_priority_gate",
    reasoning_summary: `${routeReason}: non-triggered INT row skipped by deterministic Stage 5 priority gate and marked NOT_APPLICABLE.`
  };
}

function chunkRows(rows, batchSize) {
  const size = Math.max(1, Number(batchSize || 8));
  const out = [];
  for (let index = 0; index < rows.length; index += size) out.push(rows.slice(index, index + size));
  return out;
}

function normalizeRow(row, index) {
  return { ...row, Threat_ID: rowId(row, index), Threat_Name: rowName(row), _registry_index: index, _registry_position: index + 1 };
}

function routeRow(row, active, includeConditional) {
  const archetype = rowArchetype(row);
  const surfaces = rowSurfaces(row);
  const isUni = archetype === "UNI";
  const archetypeMatch = Boolean(archetype && active.archetypes.has(archetype));
  const surfaceMatch = surfaces.some((surface) => active.surfaces.has(surface));
  if (isUni) return "UNI_ALWAYS_RUN";
  if (archetypeMatch || surfaceMatch) return "STAGE5_INT_TRIGGERED";
  if (includeConditional && isConditionalDocRow(row)) return "CONDITIONAL_DOC_REVIEW";
  return "INT_NOT_TRIGGERED";
}

export function buildPriorityRowPlan({ rows = [], profile = {}, batchSize = 8, includeConditional = true } = {}) {
  const sourceRows = asArray(rows).map(normalizeRow);
  const active = activeSignals(profile);
  const modelRows = [];
  const deterministicRows = [];
  const routeRecords = [];
  sourceRows.forEach((row, index) => {
    const reason = routeRow(row, active, includeConditional);
    const shouldRun = reason === "UNI_ALWAYS_RUN" || reason === "STAGE5_INT_TRIGGERED" || reason === "CONDITIONAL_DOC_REVIEW";
    const routeRecord = { threat_id: row.Threat_ID, threat_name: row.Threat_Name, archetype: rowArchetype(row), surfaces: rowSurfaces(row), route: shouldRun ? "RUN" : "SKIP", route_reason: reason, feature_refs: refsFor(row, active) };
    routeRecords.push(routeRecord);
    if (shouldRun) modelRows.push(row);
    else deterministicRows.push(deterministicEntry(row, index, active, reason));
  });
  const batches = chunkRows(modelRows, batchSize);
  return { plan_version: "priority_row_plan_v1", mode: "priority_first", batch_size: Math.max(1, Number(batchSize || 8)), active_archetypes: [...active.archetypes].sort(), active_surfaces: [...active.surfaces].sort(), model_rows: modelRows, model_batches: batches, deterministic_rows: deterministicRows, route_records: routeRecords, counts: { total_rows: sourceRows.length, model_rows: modelRows.length, deterministic_rows: deterministicRows.length, model_batch_count: batches.length }, routing_summary: routeRecords.reduce((acc, item) => { acc[item.route_reason] = (acc[item.route_reason] || 0) + 1; return acc; }, {}) };
}

export function mergePriorityRows({ modelRows = [], deterministicRows = [], sourceRows = [] } = {}) {
  const byId = new Map();
  for (const entry of asArray(modelRows)) byId.set(asText(entry?.[K_ID]), entry);
  for (const entry of asArray(deterministicRows)) if (!byId.has(asText(entry?.[K_ID]))) byId.set(asText(entry?.[K_ID]), entry);
  return asArray(sourceRows).map((row, index) => ({ ...(byId.get(rowId(row, index)) || deterministicEntry(normalizeRow(row, index), index, activeSignals({}), "PLAN_FALLBACK")), entry_number: index + 1 }));
}

export function validatePriorityMerge({ mergedRows = [], sourceRows = [] } = {}) {
  const expected = asArray(sourceRows).map(rowId);
  const emitted = asArray(mergedRows).map((entry) => asText(entry?.[K_ID]));
  const missing = expected.filter((id) => !emitted.includes(id));
  const duplicate = emitted.filter((id, index) => emitted.indexOf(id) !== index);
  return { ok: mergedRows.length === expected.length && missing.length === 0 && duplicate.length === 0, expected_count: expected.length, actual_count: mergedRows.length, missing, duplicate: [...new Set(duplicate)] };
}
