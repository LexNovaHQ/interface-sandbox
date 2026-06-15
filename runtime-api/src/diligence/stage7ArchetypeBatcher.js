function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asText(value) {
  return String(value || "").trim();
}

function asUpper(value) {
  return asText(value).toUpperCase();
}

function rowId(row, index = 0) {
  return asText(row?.Threat_ID || row?.threat_id || row?._stage7_route?.threat_id || `ROW_${index + 1}`);
}

function routeKey(record = {}) {
  if (record.route_reason === "UNI_ALWAYS_RUN") return "00_UNI";
  if (record.route_reason === "STAGE5_DEGRADED_FALLBACK") return `90_STAGE5_DEGRADED_FALLBACK_${asUpper(record.archetype) || "UNKNOWN"}`;
  if (record.route_reason === "CONDITIONAL_DOC_REVIEW") return "99_CONDITIONAL_DOC_REVIEW";
  return `10_ARCH_${asUpper(record.archetype) || "UNKNOWN"}`;
}

function groupLabelFromKey(key = "") {
  if (key === "00_UNI") return "UNI";
  if (key === "99_CONDITIONAL_DOC_REVIEW") return "CONDITIONAL_DOC_REVIEW";
  if (key.startsWith("90_STAGE5_DEGRADED_FALLBACK_")) return key.replace(/^90_STAGE5_DEGRADED_FALLBACK_/, "STAGE5_DEGRADED_FALLBACK:");
  return key.replace(/^10_ARCH_/, "");
}

function groupKindFromKey(key = "") {
  if (key === "00_UNI") return "UNI_ALWAYS_RUN";
  if (key === "99_CONDITIONAL_DOC_REVIEW") return "CONDITIONAL_DOC_REVIEW";
  if (key.startsWith("90_STAGE5_DEGRADED_FALLBACK_")) return "STAGE5_DEGRADED_FALLBACK";
  return "STAGE5_INT_TRIGGERED";
}

function splitOversizedGroup(group, maxRows) {
  const chunks = [];
  for (let index = 0; index < group.rows.length; index += maxRows) {
    chunks.push({ ...group, rows: group.rows.slice(index, index + maxRows), split_index: chunks.length + 1 });
  }
  return chunks;
}

function makeBatch(groups, batchIndex) {
  const rows = groups.flatMap((group) => group.rows);
  const routeReasons = [...new Set(groups.map((group) => group.route_reason))];
  const archetypes = [...new Set(groups.map((group) => group.label).filter((label) => label && label !== "UNI" && label !== "CONDITIONAL_DOC_REVIEW" && !label.startsWith("STAGE5_DEGRADED_FALLBACK:")))];
  const degradedFallbackGroups = groups.filter((group) => group.route_reason === "STAGE5_DEGRADED_FALLBACK").map((group) => ({ label: group.label, row_count: group.rows.length, split_index: group.split_index || null }));
  return {
    batch_index: batchIndex,
    rows,
    batch_meta: {
      batch_index: batchIndex,
      stage7_batching_strategy: "stage7_archetype_batcher_v2",
      row_count: rows.length,
      group_count: groups.length,
      groups: groups.map((group) => ({ label: group.label, route_reason: group.route_reason, row_count: group.rows.length, split_index: group.split_index || null })),
      route_reasons: routeReasons,
      archetypes,
      degraded_fallback_groups: degradedFallbackGroups,
      rule_text: "Batch order is UNI rows first, then active archetype groups, then STAGE5_DEGRADED_FALLBACK groups, then CONDITIONAL_DOC_REVIEW legal/governance artifact rows. Minimum rows per batch is 8, maximum rows per batch is 15. One archetype or fallback group per batch is the default. If a group has fewer than 8 rows, add the next group without exceeding 15 rows. Do not combine more than 3 active archetype groups in one batch. CONDITIONAL_DOC_REVIEW = legal/governance artifact route, not archetype route. STAGE5_DEGRADED_FALLBACK rows are conservative deterministic routes for unresolved Stage 5 feature candidates."
    }
  };
}

export function buildStage7ArchetypeBatches({ modelRows = [], routeRecords = [], minRows = 8, maxRows = 15 } = {}) {
  const min = Math.max(1, Number(minRows || 8));
  const max = Math.max(min, Number(maxRows || 15));
  const recordById = new Map(asArray(routeRecords).map((record) => [asText(record.threat_id), record]));
  const grouped = new Map();

  for (const [index, row] of asArray(modelRows).entries()) {
    const id = rowId(row, index);
    const record = recordById.get(id) || row?._stage7_route || { threat_id: id, route_reason: "STAGE5_INT_TRIGGERED", archetype: asUpper(id).split("_")[0] };
    const key = routeKey(record);
    if (!grouped.has(key)) grouped.set(key, { key, label: groupLabelFromKey(key), route_reason: groupKindFromKey(key), rows: [] });
    grouped.get(key).rows.push(row);
  }

  const orderedKeys = [...grouped.keys()].sort((a, b) => {
    if (a === "00_UNI") return -1;
    if (b === "00_UNI") return 1;
    if (a === "99_CONDITIONAL_DOC_REVIEW") return 1;
    if (b === "99_CONDITIONAL_DOC_REVIEW") return -1;
    return a.localeCompare(b);
  });

  const splitGroups = orderedKeys.flatMap((key) => splitOversizedGroup(grouped.get(key), max));
  const batches = [];
  let current = [];
  let currentRows = 0;
  let currentArchetypeGroups = 0;

  const flush = () => {
    if (!current.length) return;
    batches.push(makeBatch(current, batches.length + 1));
    current = [];
    currentRows = 0;
    currentArchetypeGroups = 0;
  };

  for (const group of splitGroups) {
    const rowCount = group.rows.length;
    const isArchetype = group.route_reason === "STAGE5_INT_TRIGGERED";
    const nextArchetypeGroups = currentArchetypeGroups + (isArchetype ? 1 : 0);
    const wouldOverflow = currentRows + rowCount > max;
    const wouldExceedArchetypeLimit = nextArchetypeGroups > 3;
    const currentMeetsMin = currentRows >= min;

    if (current.length && (wouldOverflow || wouldExceedArchetypeLimit || currentMeetsMin)) flush();

    current.push(group);
    currentRows += rowCount;
    if (isArchetype) currentArchetypeGroups += 1;

    if (currentRows >= min || currentRows >= max) flush();
  }
  flush();

  return {
    strategy: "stage7_archetype_batcher_v2",
    min_rows: min,
    max_rows: max,
    max_archetype_groups_per_batch: 3,
    batches: batches.map((batch) => batch.rows),
    batch_records: batches.map(({ rows, ...record }) => record),
    warnings: batches.filter((batch) => batch.rows.length < min).map((batch) => `batch_${batch.batch_meta.batch_index}_below_minimum_${batch.rows.length}_rows_after_ordered_packing`)
  };
}
