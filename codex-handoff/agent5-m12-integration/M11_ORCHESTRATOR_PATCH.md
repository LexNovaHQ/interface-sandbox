# M11 ORCHESTRATOR PATCH SPEC

File: `diligence-artifact-backend/src/m11-orchestrator.js`

Goal: replace the bridge validation status with real prompt-backed M12 batch validation.

## Add constant

Near top of file:

```js
const AGENT_5_M12_BATCH_FILES = Object.freeze([
  "agent-packages/00_SYSTEM_BLOCKING_DOCTRINE.md",
  "agent-packages/agent_5_exposure_registry/AGENT5_RUNTIME_BINDING_PACKET_SYNCED_M11.yaml",
  "agent-packages/agent_5_exposure_registry/00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED_AGENT5_SYNCED.md",
  "agent-packages/agent_5_exposure_registry/M12_BATCH_VALIDATION.md",
  "agent-packages/agent_5_exposure_registry/00_VALIDATOR_RULES_INTEGRATED_AGENT5_SYNCED.md",
  "agent-packages/agent_5_exposure_registry/BACKEND_CANONICAL_OUTPUT_ADAPTER.md"
]);
```

## Add helper

```js
async function runM12BatchValidation({ run, phase, batch, batchOutput, structuralValidation, routePlan, artifacts }) {
  const prompt = await buildPhasePrompt({
    prompt_files: AGENT_5_M12_BATCH_FILES,
    phase: `${phase}:M12_BATCH:${batch.batch_id}`,
    run,
    artifacts: {
      ...artifacts,
      exposure_registry_route_plan: routePlan,
      m11_batch_registry_ledger: batchOutput,
      backend_structural_validation: structuralValidation,
      m12_batch_context: {
        batch_id: batch.batch_id,
        batch_group: batch.batch_group,
        expected_threat_ids: batch.expected_threat_ids || []
      }
    },
    writes: [`exposure_registry_batch_validation__${batch.batch_id}`],
    references: []
  });

  const result = await callGeminiJson({ prompt, phase: `${phase}:M12_BATCH:${batch.batch_id}` });
  return normalizeM12BatchValidationResult({ batch, result });
}
```

Add:

```js
function normalizeM12BatchValidationResult({ batch, result }) {
  const root = result.json?.exposure_registry_batch_validation || result.json;
  const status = normalizeBatchValidationStatus(root?.status);
  return {
    exposure_registry_batch_validation: {
      batch_id: root?.batch_id || batch.batch_id,
      batch_group: root?.batch_group || batch.batch_group,
      status,
      validation_owner: root?.validation_owner || "agent_5_exposure_registry:M12_BATCH_VALIDATION",
      semantic_m12_validation_status: normalizeBatchValidationStatus(root?.semantic_m12_validation_status || status),
      expected_threat_ids: root?.expected_threat_ids || batch.expected_threat_ids || [],
      validated_threat_ids: root?.validated_threat_ids || [],
      shape_checks: root?.shape_checks || {},
      challenge_checks: root?.challenge_checks || {},
      findings: Array.isArray(root?.findings) ? root.findings : [],
      repair_directives: Array.isArray(root?.repair_directives) ? root.repair_directives : [],
      limitations: Array.isArray(root?.limitations) ? root.limitations : [],
      model_metadata: result.metadata || {}
    }
  };
}

function normalizeBatchValidationStatus(status) {
  return ["PASS", "PASS_WITH_LIMITATION", "REPAIR_REQUIRED", "CONTROLLED_FAILURE"].includes(status) ? status : "REPAIR_REQUIRED";
}
```

## Replace current batch validation bridge

Current bridge creates a validation artifact directly from backend structural validation and uses `semantic_m12_validation_status: NOT_YET_WIRED`.

Replace it with:

1. Run `validateM11BatchLedger` first.
2. If structural validation fails, save repair validation and stop.
3. If structural validation passes, call `runM12BatchValidation`.
4. Save `exposure_registry_batch_validation__${batch.batch_id}` with M12 status.
5. Save accepted `exposure_registry_batch__${batch.batch_id}` only when M12 status is `PASS` or `PASS_WITH_LIMITATION`.
6. If M12 status is `REPAIR_REQUIRED` or `CONTROLLED_FAILURE`, lock M11 as `REPAIR_REQUIRED` and do not save accepted batch.

## Update event payload

Final event should say:

```js
batch_validation_mode: "m12_batch_prompt"
```

not:

```js
backend_structural_until_m12_semantic_is_wired
```
