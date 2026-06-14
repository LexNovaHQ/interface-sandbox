import { buildStage7RouteContract, stage7RowArchetype, stage7RowId, stage7RowName, stage7RowSurfaces } from "./stage7RouteContract.js";

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
const MIN_BATCH = 8;
const MAX_BATCH = 15;
const MAX_ARCHETYPES_PER_BATCH = 3;

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

function hunterTriggerParts(row = {}) {
  const trigger = row?.hunter_trigger && typeof row.hunter_trigger === "object" ? row.hunter_trigger : {};
  const conditions = trigger.conditions && typeof trigger.conditions === "object" ? Object.values(trigger.conditions) : [];
  return [row?.Hunter_Trigger, trigger.raw, ...conditions, trigger.trigger_if, trigger.exclude_if, row?.Trigger, row?.trigger, row?.Trigger_If, row?.trigger_if, row?.Exclude_If, row?.exclude_if, row?.Legal_Pain, row?.legal_pain, row?.Lex_Nova_Fix, row?.fix_route, row?.fp_mechanism, row?.fp_impact];
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
  const featureRouteIndex = [];
  for (const feature of asArray(profile.feature_inventory)) {
    const featureId = asText(feature?.feature_id) || "UNKNOWN";
    const featureArchetypes = asArray(feature?.archetype_codes).map(asUpper).filter(Boolean);
    const featureSurfaces = asArray(feature?.surface_tokens).map(asText).filter(Boolean);
    featureRouteIndex.push({ feature_id: featureId, archetype_codes: featureArchetypes, surface_tokens: featureSurfaces });
    for (const code of featureArchetypes) {
      archetypes.add(code);
      if (!refsByArchetype.has(code)) refsByArchetype.set(code, new Set());
      refsByArchetype.get(code).add(featureId);
    }
    for (const token of featureSurfaces) {
      surfaces.add(token);
      if (!refsBySurface.has(token)) refsBySurface.set(token, new Set());
      refsBySurface.get(token).add(featureId);
    }
  }
  return { archetypes, surfaces, refsByArchetype, refsBySurface, featureRouteIndex };
}

function refsFor(row, active) {
  const refs = new Set();
  const archetype = stage7RowArchetype(row);
  if (active.refsByArchetype.has(archetype)) for (const ref of active.refsByArchetype.get(archetype)) refs.add(ref);
  for (const surface of stage7RowSurfaces(row)) if (active.refsBySurface.has(surface)) for (const ref of active.refsBySurface.get(surface)) refs.add(ref);
  return [...refs];
}

function routeRow(row, active, includeConditional) {
  const archetype = stage7RowArchetype(row);
  const surfaces = stage7RowSurfaces(row);
  const isUni = archetype === "UNI";
  const archetypeMatch = Boolean(archetype && active.archetypes.has(archetype));
  const surfaceMatch = surfaces.some((surface) => active.surfaces.has(surface));
  if (isUni) return "UNI_ALWAYS_RUN";
  if (archetypeMatch || surfaceMatch) return "STAGE5_INT_TRIGGERED";
  if (includeConditional && isConditionalDocRow(row)) return "CONDITIONAL_DOC_REVIEW";
  return "INT_NOT_TRIGGERED";
}

function deterministicEntry(row, index, active, routeContract) {
  const refs = routeContract.feature_refs?.length ? routeContract.feature_refs : refsFor(row, active);
  return {
    entry_number: index + 1,
    [K_ID]: stage7RowId(row, index),
    [K_NAME]: stage7RowName(row),
    archetype_gate: "FAIL",
    surface_gate: "FAIL",
    authority_relevance: "DETERMINISTIC_PRIORITY_GATE",
    conditions: [],
    [K_TRIGGER]: false,
    [K_EXCLUDE]: false,
    [K_FINAL]: "NOT_APPLICABLE",
    feature_refs: refs.length ? refs : ["NO_STAGE5_TRIGGER"],
    evidence_ref: "stage5_priority_gate",
    reasoning_summary: `${routeContract.route_reason}: non-active archetype row skipped by deterministic Stage 5 priority gate and marked NOT_APPLICABLE.`,
    _stage7_route: routeContract
  };
}

function normalizeRow(row, index) {
  return { ...row, Threat_ID: stage7RowId(row, index), Threat_Name: stage7RowName(row), _registry_index: index, _registry_position: index + 1 };
}

function sortModelRows(rows) {
  const familyRank = { UNI_ALWAYS_RUN: 0, STAGE5_INT_TRIGGERED: 1, CONDITIONAL_DOC_REVIEW: 2 };
  return [...rows].sort((a, b) => {
    const ar = a._stage7_route?.route_reason || "";
    const br = b._stage7_route?.route_reason || "";
    const rankDelta = (familyRank[ar] ?? 9) - (familyRank[br] ?? 9);
    if (rankDelta) return rankDelta;
    const archDelta = String(a._stage7_route?.archetype || "").localeCompare(String(b._stage7_route?.archetype || ""));
    if (archDelta) return archDelta;
    return Number(a._registry_position || 0) - Number(b._registry_position || 0);
  });
}

function groupedRunRows(modelRows) {
  const groups = [];
  const uni = modelRows.filter((row) => row._stage7_route?.route_reason === "UNI_ALWAYS_RUN");
  if (uni.length) groups.push({ key: "UNI", archetypes: ["UNI"], rows: uni });
  const activeByArch = new Map();
  for (const row of modelRows.filter((item) => item._stage7_route?.route_reason === "STAGE5_INT_TRIGGERED")) {
    const key = row._stage7_route?.archetype || stage7RowArchetype(row) || "UNKNOWN";
    if (!activeByArch.has(key)) activeByArch.set(key, []);
    activeByArch.get(key).push(row);
  }
  for (const key of [...activeByArch.keys()].sort()) groups.push({ key, archetypes: [key], rows: activeByArch.get(key) });
  const docRows = modelRows.filter((row) => row._stage7_route?.route_reason === "CONDITIONAL_DOC_REVIEW");
  if (docRows.length) groups.push({ key: "CONDITIONAL_DOC_REVIEW", archetypes: ["LEGAL_GOVERNANCE_ARTIFACT"], rows: docRows });
  return groups;
}

function makeBatchFromRows(rows, groups, batchNumber) {
  const archetypes = [...new Set(groups.flatMap((group) => group.archetypes || []))];
  return { batch_number: batchNumber, rows, batch_route_summary: { batch_order_rule: "UNI first; then active archetype groups; then CONDITIONAL_DOC_REVIEW legal/governance artifact rows", archetypes, route_reasons: [...new Set(rows.map((row) => row._stage7_route?.route_reason).filter(Boolean))], row_count: rows.length } };
}

function archetypeWiseBatches(modelRows) {
  const sorted = sortModelRows(modelRows);
  const groups = groupedRunRows(sorted);
  const batches = [];
  let pendingRows = [];
  let pendingGroups = [];
  function flush(force = false) {
    if (!pendingRows.length) return;
    if (!force && pendingRows.length < MIN_BATCH) return;
    batches.push(makeBatchFromRows(pendingRows, pendingGroups, batches.length + 1));
    pendingRows = [];
    pendingGroups = [];
  }
  for (const group of groups) {
    const rows = [...group.rows];
    while (rows.length > 0) {
      if (!pendingRows.length && rows.length >= MIN_BATCH) {
        const slice = rows.splice(0, Math.min(MAX_BATCH, rows.length));
        batches.push(makeBatchFromRows(slice, [group], batches.length + 1));
        continue;
      }
      const wouldExceedRows = pendingRows.length + rows.length > MAX_BATCH;
      const wouldExceedGroups = pendingGroups.length + 1 > MAX_ARCHETYPES_PER_BATCH;
      if (pendingRows.length && (wouldExceedRows || wouldExceedGroups)) flush(true);
      const available = Math.max(0, MAX_BATCH - pendingRows.length);
      const take = Math.min(available || MAX_BATCH, rows.length);
      pendingRows.push(...rows.splice(0, take));
      pendingGroups.push(group);
      if (pendingRows.length >= MIN_BATCH) flush(true);
    }
  }
  flush(true);
  return batches.map((batch, index, all) => ({ ...batch.rows, _batch_route_summary: { ...batch.batch_route_summary, batch_number: index + 1, batch_count: all.length } }));
}

function batchObjects(modelRows) {
  return archetypeWiseBatches(modelRows).map((batchRows) => {
    const summary = batchRows._batch_route_summary;
    delete batchRows._batch_route_summary;
    Object.defineProperty(batchRows, "_batch_route_summary", { value: summary, enumerable: false });
    return batchRows;
  });
}

export function buildPriorityRowPlan({ rows = [], profile = {}, batchSize = 8, includeConditional = true } = {}) {
  const sourceRows = asArray(rows).map(normalizeRow);
  const active = activeSignals(profile);
  const modelRows = [];
  const deterministicRows = [];
  const routeRecords = [];
  sourceRows.forEach((row, index) => {
    const routeReason = routeRow(row, active, includeConditional);
    const featureRefs = refsFor(row, active);
    const routeContract = buildStage7RouteContract({ row, index, routeReason, featureRefs, activeArchetypes: [...active.archetypes], activeSurfaces: [...active.surfaces] });
    const routedRow = { ...row, _stage7_route: routeContract };
    routeRecords.push(routeContract);
    if (routeContract.route === "RUN") modelRows.push(routedRow);
    else deterministicRows.push(deterministicEntry(routedRow, index, active, routeContract));
  });
  const batches = batchObjects(modelRows);
  return {
    plan_version: "priority_row_plan_v2_route_contract",
    mode: "deterministic_route_contract_archetype_batches",
    requested_batch_size_legacy: Math.max(1, Number(batchSize || 8)),
    batch_rules: { minimum_rows: MIN_BATCH, maximum_rows: MAX_BATCH, max_archetypes_per_batch: MAX_ARCHETYPES_PER_BATCH, uni_first: true, conditional_doc_review_route: "legal/governance artifact route, not archetype route" },
    active_archetypes: [...active.archetypes].sort(),
    active_surfaces: [...active.surfaces].sort(),
    feature_route_index: active.featureRouteIndex,
    model_rows: modelRows,
    model_batches: batches,
    deterministic_rows: deterministicRows,
    route_records: routeRecords,
    counts: { total_rows: sourceRows.length, model_rows: modelRows.length, deterministic_rows: deterministicRows.length, model_batch_count: batches.length },
    routing_summary: routeRecords.reduce((acc, item) => { acc[item.route_reason] = (acc[item.route_reason] || 0) + 1; return acc; }, {})
  };
}

export function mergePriorityRows({ modelRows = [], deterministicRows = [], sourceRows = [] } = {}) {
  const byId = new Map();
  for (const entry of asArray(modelRows)) byId.set(asText(entry?.[K_ID]), entry);
  for (const entry of asArray(deterministicRows)) if (!byId.has(asText(entry?.[K_ID]))) byId.set(asText(entry?.[K_ID]), entry);
  return asArray(sourceRows).map((row, index) => ({ ...(byId.get(stage7RowId(row, index)) || deterministicEntry(normalizeRow(row, index), index, activeSignals({}), buildStage7RouteContract({ row, index, routeReason: "INT_NOT_TRIGGERED", featureRefs: ["NO_STAGE5_TRIGGER"] }))), entry_number: index + 1 }));
}

export function validatePriorityMerge({ mergedRows = [], sourceRows = [] } = {}) {
  const expected = asArray(sourceRows).map(stage7RowId);
  const emitted = asArray(mergedRows).map((entry) => asText(entry?.[K_ID]));
  const missing = expected.filter((id) => !emitted.includes(id));
  const duplicate = emitted.filter((id, index) => emitted.indexOf(id) !== index);
  return { ok: mergedRows.length === expected.length && missing.length === 0 && duplicate.length === 0, expected_count: expected.length, actual_count: mergedRows.length, missing, duplicate: [...new Set(duplicate)] };
}
