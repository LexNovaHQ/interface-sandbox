import { buildRegistryStageInput, createRegistryBatches } from "./registryBatcher.js";
import { assertMergedRegistryLedgerValid, mergeRegistryBatchResults } from "./registryMergeValidator.js";

export async function runRegistryLedgerBatches({
  runId,
  source_bundle,
  target_feature_profile,
  legal_stack_review,
  registry_key,
  batchSize,
  registry,
  callRegistryBatch
}) {
  if (typeof callRegistryBatch !== "function") {
    throw new Error("runRegistryLedgerBatches requires callRegistryBatch(batchInput, batch) function.");
  }

  const batches = createRegistryBatches({ runId, batchSize, registry });
  const batchResults = [];

  for (const batch of batches) {
    const batchInput = buildRegistryStageInput({
      source_bundle,
      target_feature_profile,
      legal_stack_review,
      registry_key,
      batch
    });

    const result = await callRegistryBatch(batchInput, batch);
    batchResults.push(result);
  }

  const mergeResult = mergeRegistryBatchResults({
    runId,
    batches,
    batchResults,
    registry
  });

  return assertMergedRegistryLedgerValid(mergeResult);
}

export async function callRegistryEndpoint({ endpointUrl = "/api/diligence-registry-ledger", batchInput, fetchImpl = fetch, options = {} }) {
  const response = await fetchImpl(endpointUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({ input: batchInput, options })
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.ok) {
    const error = new Error(payload?.error || `Registry endpoint failed with status ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload.registry_ledger_result;
}
