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

function chunkRows(rows, batchSize) {
  const out = [];
  for (let index = 0; index < rows.length; index += batchSize) out.push(rows.slice(index, index + batchSize));
  return out;
}

export function buildPriorityRowPlan({ rows = [], profile = {}, batchSize = 8 } = {}) {
  const sourceRows = asArray(rows);
  const active = activeSignals(profile);
  return {
    plan_version: "priority_row_plan_v1",
    mode: "priority_first",
    batch_size: batchSize,
    active_archetypes: [...active.archetypes].sort(),
    active_surfaces: [...active.surfaces].sort(),
    model_rows: sourceRows,
    model_batches: chunkRows(sourceRows, batchSize),
    deterministic_rows: [],
    route_records: [],
    counts: {
      total_rows: sourceRows.length,
      model_rows: sourceRows.length,
      deterministic_rows: 0,
      model_batch_count: sourceRows.length ? chunkRows(sourceRows, batchSize).length : 0
    },
    routing_summary: {}
  };
}

export function mergePriorityRows({ modelRows = [], deterministicRows = [], sourceRows = [] } = {}) {
  return [...asArray(modelRows), ...asArray(deterministicRows)];
}

export function validatePriorityMerge({ mergedRows = [], sourceRows = [] } = {}) {
  return {
    ok: asArray(mergedRows).length === asArray(sourceRows).length,
    expected_count: asArray(sourceRows).length,
    actual_count: asArray(mergedRows).length,
    missing: [],
    duplicate: []
  };
}
