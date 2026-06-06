import registryRuntime from "../../../../data/runtime/registry.runtime.json";

const DEFAULT_BATCH_SIZE = 12;

function normalizeThreatId(row) {
  return String(row?.threat_id || row?.Threat_ID || "").trim();
}

function normalizeThreatName(row) {
  return String(row?.threat_name || row?.Threat_Name || "").trim();
}

function assertRegistryRuntimeShape(registry = registryRuntime) {
  if (!registry || typeof registry !== "object") {
    throw new Error("Registry runtime must be an object.");
  }

  if (!Array.isArray(registry.threats)) {
    throw new Error("Registry runtime must contain threats[].");
  }

  const declaredCount = Number(registry.registry_count);
  if (!Number.isInteger(declaredCount) || declaredCount < 1) {
    throw new Error("Registry runtime must contain a positive registry_count.");
  }

  if (registry.threats.length !== declaredCount) {
    throw new Error(`Registry runtime count mismatch: registry_count=${declaredCount}, threats.length=${registry.threats.length}`);
  }
}

export function getRegistryRuntime(registry = registryRuntime) {
  assertRegistryRuntimeShape(registry);
  return registry;
}

export function getRegistryRows(registry = registryRuntime) {
  assertRegistryRuntimeShape(registry);
  return registry.threats.map((row, index) => ({
    ...row,
    _registry_index: index,
    _registry_position: index + 1
  }));
}

export function getRegistryThreatIds(registry = registryRuntime) {
  return getRegistryRows(registry).map((row) => normalizeThreatId(row));
}

export function validateRegistryRows(rows) {
  if (!Array.isArray(rows) || !rows.length) {
    throw new Error("Registry rows must be a non-empty array.");
  }

  const seen = new Set();
  const duplicates = [];
  const missing = [];

  rows.forEach((row, index) => {
    const threatId = normalizeThreatId(row);
    const threatName = normalizeThreatName(row);

    if (!threatId) missing.push({ index, field: "threat_id" });
    if (!threatName) missing.push({ index, field: "threat_name" });

    if (threatId) {
      if (seen.has(threatId)) duplicates.push(threatId);
      seen.add(threatId);
    }
  });

  if (missing.length || duplicates.length) {
    throw new Error(`Registry row validation failed. Missing=${JSON.stringify(missing)} Duplicates=${JSON.stringify([...new Set(duplicates)])}`);
  }

  return {
    ok: true,
    row_count: rows.length,
    threat_ids: rows.map((row) => normalizeThreatId(row))
  };
}

export function createRegistryBatches(options = {}) {
  const registry = options.registry || registryRuntime;
  const runId = options.runId || options.run_id || "pending-run-id";
  const batchSize = Number(options.batchSize || options.batch_size || DEFAULT_BATCH_SIZE);

  if (!Number.isInteger(batchSize) || batchSize < 1) {
    throw new Error("batchSize must be a positive integer.");
  }

  const rows = getRegistryRows(registry);
  validateRegistryRows(rows);

  const batchCount = Math.ceil(rows.length / batchSize);

  return Array.from({ length: batchCount }, (_, batchIndex) => {
    const start = batchIndex * batchSize;
    const end = Math.min(start + batchSize, rows.length);
    const registryRows = rows.slice(start, end);

    return {
      batch_id: `${runId}:registry:${batchIndex + 1}-of-${batchCount}`,
      run_id: runId,
      batch_index: batchIndex,
      batch_number: batchIndex + 1,
      batch_count: batchCount,
      batch_size: registryRows.length,
      registry_count_loaded: rows.length,
      registry_range: {
        start_position: start + 1,
        end_position: end
      },
      expected_threat_ids: registryRows.map((row) => normalizeThreatId(row)),
      registry_rows: registryRows
    };
  });
}

export function buildRegistryStageInput({ source_bundle, target_feature_profile, legal_stack_review, batch, registry_key }) {
  if (!batch?.registry_rows?.length) {
    throw new Error("Registry stage input requires a non-empty batch.registry_rows array.");
  }

  return {
    run_id: batch.run_id,
    registry_batch_meta: {
      batch_id: batch.batch_id,
      batch_number: batch.batch_number,
      batch_count: batch.batch_count,
      batch_size: batch.batch_size,
      registry_count_loaded: batch.registry_count_loaded,
      registry_range: batch.registry_range,
      expected_threat_ids: batch.expected_threat_ids
    },
    source_bundle,
    target_feature_profile,
    legal_stack_review,
    registry_rows: batch.registry_rows,
    registry_key
  };
}
