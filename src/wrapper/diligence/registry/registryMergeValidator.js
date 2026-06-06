import registryRuntime from "../../../../data/runtime/registry.runtime.json";
import { getRegistryThreatIds } from "./registryBatcher.js";

function threatIdFromEntry(entry) {
  return String(entry?.threat_id || entry?.Threat_ID || "").trim();
}

function getLedgerEntries(result) {
  if (Array.isArray(result?.registry_evaluation_ledger)) return result.registry_evaluation_ledger;
  if (Array.isArray(result?.registry_batch_evaluation)) return result.registry_batch_evaluation;
  if (Array.isArray(result?.registry_ledger_result?.registry_evaluation_ledger)) {
    return result.registry_ledger_result.registry_evaluation_ledger;
  }
  if (Array.isArray(result?.registry_ledger_result?.registry_batch_evaluation)) {
    return result.registry_ledger_result.registry_batch_evaluation;
  }

  return [];
}

function getBatchWarnings(result) {
  if (Array.isArray(result?.batch_warnings)) return result.batch_warnings;
  if (Array.isArray(result?.registry_ledger_result?.batch_warnings)) return result.registry_ledger_result.batch_warnings;
  return [];
}

function getDuplicateValues(values) {
  const seen = new Set();
  const duplicates = new Set();

  values.forEach((value) => {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  });

  return [...duplicates];
}

function compareThreatIds(expectedIds, actualIds) {
  const expected = new Set(expectedIds);
  const actual = new Set(actualIds);

  return {
    missing: expectedIds.filter((id) => !actual.has(id)),
    unexpected: actualIds.filter((id) => !expected.has(id)),
    duplicates: getDuplicateValues(actualIds)
  };
}

export function validateRegistryBatchResult(batch, result) {
  const expectedIds = batch?.expected_threat_ids || [];
  const entries = getLedgerEntries(result);
  const actualIds = entries.map(threatIdFromEntry).filter(Boolean);
  const comparison = compareThreatIds(expectedIds, actualIds);
  const errors = [];

  if (!expectedIds.length) errors.push("Batch has no expected_threat_ids.");
  if (!entries.length) errors.push("Batch result has no registry_evaluation_ledger entries.");
  if (entries.length !== expectedIds.length) {
    errors.push(`Batch entry count mismatch: expected ${expectedIds.length}, received ${entries.length}.`);
  }
  if (comparison.missing.length) errors.push(`Batch missing threat_id(s): ${comparison.missing.join(", ")}.`);
  if (comparison.unexpected.length) errors.push(`Batch returned unexpected threat_id(s): ${comparison.unexpected.join(", ")}.`);
  if (comparison.duplicates.length) errors.push(`Batch returned duplicate threat_id(s): ${comparison.duplicates.join(", ")}.`);

  return {
    ok: errors.length === 0,
    batch_id: batch?.batch_id || "unknown-batch",
    expected_count: expectedIds.length,
    received_count: entries.length,
    expected_threat_ids: expectedIds,
    received_threat_ids: actualIds,
    errors,
    entries,
    batch_warnings: getBatchWarnings(result)
  };
}

export function mergeRegistryBatchResults({ runId, batches, batchResults, registry = registryRuntime }) {
  if (!Array.isArray(batches) || !batches.length) {
    throw new Error("mergeRegistryBatchResults requires non-empty batches[].");
  }

  if (!Array.isArray(batchResults) || batchResults.length !== batches.length) {
    throw new Error("batchResults length must equal batches length.");
  }

  const batchValidations = batches.map((batch, index) => validateRegistryBatchResult(batch, batchResults[index]));
  const batchErrors = batchValidations.flatMap((validation) => validation.errors.map((error) => `${validation.batch_id}: ${error}`));
  const mergedLedger = batchValidations.flatMap((validation) => validation.entries);
  const allWarnings = batchValidations.flatMap((validation) => validation.batch_warnings.map((warning) => `${validation.batch_id}: ${warning}`));
  const expectedFullIds = getRegistryThreatIds(registry);
  const actualFullIds = mergedLedger.map(threatIdFromEntry).filter(Boolean);
  const fullComparison = compareThreatIds(expectedFullIds, actualFullIds);
  const mergeErrors = [...batchErrors];

  if (mergedLedger.length !== expectedFullIds.length) {
    mergeErrors.push(`Merged ledger count mismatch: expected ${expectedFullIds.length}, received ${mergedLedger.length}.`);
  }
  if (fullComparison.missing.length) {
    mergeErrors.push(`Merged ledger missing threat_id(s): ${fullComparison.missing.join(", ")}.`);
  }
  if (fullComparison.unexpected.length) {
    mergeErrors.push(`Merged ledger contains unexpected threat_id(s): ${fullComparison.unexpected.join(", ")}.`);
  }
  if (fullComparison.duplicates.length) {
    mergeErrors.push(`Merged ledger contains duplicate threat_id(s): ${fullComparison.duplicates.join(", ")}.`);
  }

  return {
    ok: mergeErrors.length === 0,
    run_id: runId || batches[0]?.run_id || "unknown-run",
    registry_count_loaded: expectedFullIds.length,
    registry_count_evaluated: mergedLedger.length,
    batch_count: batches.length,
    registry_evaluation_ledger: mergedLedger,
    batch_warnings: allWarnings,
    merge_errors: mergeErrors,
    merge_meta: {
      expected_threat_ids: expectedFullIds,
      received_threat_ids: actualFullIds,
      missing_threat_ids: fullComparison.missing,
      unexpected_threat_ids: fullComparison.unexpected,
      duplicate_threat_ids: fullComparison.duplicates,
      batch_validations: batchValidations.map((validation) => ({
        batch_id: validation.batch_id,
        ok: validation.ok,
        expected_count: validation.expected_count,
        received_count: validation.received_count,
        errors: validation.errors
      }))
    }
  };
}

export function assertMergedRegistryLedgerValid(mergeResult) {
  if (!mergeResult?.ok) {
    throw new Error(`Registry merge validation failed: ${(mergeResult?.merge_errors || []).join(" | ")}`);
  }

  return mergeResult;
}
