function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asText(value) {
  return String(value || "").trim();
}

function asUpper(value) {
  return asText(value).toUpperCase();
}

export function buildPriorityRowPlan({ rows = [], profile = {}, batchSize = 8 } = {}) {
  const sourceRows = asArray(rows);
  return {
    plan_version: "priority_row_plan_v1",
    mode: "priority_first",
    batch_size: batchSize,
    active_archetypes: [],
    active_surfaces: [],
    model_rows: sourceRows,
    model_batches: [sourceRows],
    deterministic_rows: [],
    route_records: [],
    counts: {
      total_rows: sourceRows.length,
      model_rows: sourceRows.length,
      deterministic_rows: 0,
      model_batch_count: sourceRows.length ? 1 : 0
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
