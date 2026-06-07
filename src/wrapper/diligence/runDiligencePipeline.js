import registryKeyRuntime from "../../../data/runtime/registry_key.runtime.json";
import { collectDiligenceSources } from "./sourceCollector/index.js";
import {
  applyOperatorChallengeCorrections,
  assertCorrectionMergeValid,
  callRegistryEndpoint,
  runRegistryLedgerBatches
} from "./registry/index.js";

const DEFAULT_ENDPOINTS = Object.freeze({
  source_discovery: "/api/source-discovery-scout",
  evidence_refiner: "/api/diligence-evidence-refiner",
  target_feature_profile: "/api/diligence-target-feature-profile",
  legal_stack_review: "/api/diligence-legal-stack-review",
  registry_ledger: "/api/diligence-registry-ledger",
  operator_challenge: "/api/diligence-operator-challenge",
  final_compiler: "/api/diligence-final-compiler"
});

function createRunId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `diligence-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function mergeEndpoints(overrides = {}) {
  return {
    ...DEFAULT_ENDPOINTS,
    ...(overrides || {})
  };
}

function createStageRecord(stage_id, status, extra = {}) {
  return {
    stage_id,
    status,
    timestamp: nowIso(),
    ...extra
  };
}

function mergeStageOptions(options = {}, stageName) {
  return {
    ...(options.stageOptions || {}),
    ...((options.stageOptionOverrides || {})[stageName] || {})
  };
}

async function postJson({ endpointUrl, payload, fetchImpl = fetch }) {
  const response = await fetchImpl(endpointUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const body = await response.json().catch(() => null);

  if (!response.ok || !body?.ok) {
    const error = new Error(body?.error || `Stage endpoint failed with status ${response.status}`);
    error.status = response.status;
    error.payload = body;
    throw error;
  }

  return body;
}

async function callStage({ endpointUrl, input, fetchImpl, outputKey, options = {} }) {
  const payload = await postJson({
    endpointUrl,
    fetchImpl,
    payload: { input, options }
  });

  const output = payload?.[outputKey];

  if (!output) {
    throw new Error(`Stage endpoint ${endpointUrl} did not return ${outputKey}.`);
  }

  return {
    output,
    response: payload
  };
}

function buildEvidenceRefinerInput(sourceCollection) {
  return {
    run_id: sourceCollection.run_id,
    source_mode: sourceCollection.source_mode,
    target_input: sourceCollection.target_input,
    source_discovery: sourceCollection.source_discovery,
    raw_footprint: sourceCollection.raw_footprint,
    scrape_meta: sourceCollection.scrape_meta
  };
}

function buildOperatorChallengeInput({ runId, source_bundle, target_feature_profile, legal_stack_review, merged_registry_result }) {
  return {
    run_id: runId,
    source_bundle,
    target_feature_profile,
    legal_stack_review,
    registry_count_loaded: merged_registry_result.registry_count_loaded,
    registry_count_evaluated: merged_registry_result.registry_count_evaluated,
    registry_evaluation_ledger: merged_registry_result.registry_evaluation_ledger,
    batch_warnings: merged_registry_result.batch_warnings,
    merge_meta: merged_registry_result.merge_meta
  };
}

function buildFinalCompilerInput({
  runId,
  source_bundle,
  target_feature_profile,
  legal_stack_review,
  post_challenge_ledger,
  operator_challenge_gate,
  correction_meta,
  source_collection,
  merged_registry_result
}) {
  return {
    run_id: runId,
    source_mode: source_collection.source_mode,
    target_input: source_collection.target_input,
    source_discovery: source_collection.source_discovery,
    source_bundle,
    target_feature_profile,
    legal_stack_review,
    registry_count_loaded: merged_registry_result.registry_count_loaded,
    registry_count_evaluated: post_challenge_ledger.length,
    registry_evaluation_ledger: post_challenge_ledger,
    operator_challenge_gate,
    correction_meta,
    scrape_meta: source_collection.scrape_meta,
    pipeline_boundary: {
      node_5b_not_run: true,
      compiler_only: true,
      forbidden_outputs: [
        "vault_prefill_suggestions",
        "assembly_handoff",
        "handoff_envelope"
      ]
    }
  };
}

export async function runDiligencePipeline(input = {}, options = {}) {
  const runId = input.run_id || options.runId || createRunId();
  const endpoints = mergeEndpoints(options.endpoints);
  const fetchImpl = options.fetchImpl || fetch;
  const stage_log = [];

  try {
    stage_log.push(createStageRecord("source_collector", "started"));
    const source_collection = await collectDiligenceSources(
      {
        ...input,
        run_id: runId
      },
      {
        fetchImpl,
        timeoutMs: options.sourceTimeoutMs,
        maxCharacters: options.sourceMaxCharacters,
        headers: options.sourceHeaders,
        sourceDiscoveryEndpoint: options.sourceDiscoveryEndpoint || endpoints.source_discovery,
        enableSourceDiscovery: options.enableSourceDiscovery !== false,
        sourceDiscoveryOptions: options.sourceDiscoveryOptions || { maxAttempts: 1 },
        sourceDiscoveryMaxUrls: options.sourceDiscoveryMaxUrls,
        maxCollectedUrls: options.maxCollectedUrls
      }
    );
    stage_log.push(createStageRecord("source_collector", "completed", {
      source_mode: source_collection.source_mode,
      pages_attempted: source_collection.scrape_meta.pages_attempted,
      pages_read: source_collection.scrape_meta.pages_read,
      source_discovery_status: source_collection.source_discovery?.status || "unknown",
      source_discovery_admitted_urls: source_collection.source_discovery?.admitted_url_count ?? 0
    }));

    stage_log.push(createStageRecord("evidence_refiner", "started"));
    const evidence = await callStage({
      endpointUrl: endpoints.evidence_refiner,
      fetchImpl,
      outputKey: "source_bundle",
      input: buildEvidenceRefinerInput(source_collection),
      options: mergeStageOptions(options, "evidence_refiner")
    });
    const source_bundle = evidence.output;
    stage_log.push(createStageRecord("evidence_refiner", "completed"));

    stage_log.push(createStageRecord("target_feature_profile", "started"));
    const targetFeature = await callStage({
      endpointUrl: endpoints.target_feature_profile,
      fetchImpl,
      outputKey: "target_feature_profile",
      input: {
        run_id: runId,
        source_bundle,
        registry_key: options.registry_key || registryKeyRuntime
      },
      options: mergeStageOptions(options, "target_feature_profile")
    });
    const target_feature_profile = targetFeature.output;
    stage_log.push(createStageRecord("target_feature_profile", "completed"));

    stage_log.push(createStageRecord("legal_stack_review", "started"));
    const legalStack = await callStage({
      endpointUrl: endpoints.legal_stack_review,
      fetchImpl,
      outputKey: "legal_stack_review",
      input: {
        run_id: runId,
        source_bundle,
        target_feature_profile
      },
      options: mergeStageOptions(options, "legal_stack_review")
    });
    const legal_stack_review = legalStack.output;
    stage_log.push(createStageRecord("legal_stack_review", "completed"));

    stage_log.push(createStageRecord("registry_ledger", "started"));
    const merged_registry_result = await runRegistryLedgerBatches({
      runId,
      source_bundle,
      target_feature_profile,
      legal_stack_review,
      registry_key: options.registry_key || registryKeyRuntime,
      batchSize: options.registryBatchSize,
      registry: options.registry,
      callRegistryBatch: (batchInput) => callRegistryEndpoint({
        endpointUrl: endpoints.registry_ledger,
        batchInput,
        fetchImpl,
        options: mergeStageOptions(options, "registry_ledger")
      })
    });
    stage_log.push(createStageRecord("registry_ledger", "completed", {
      registry_count_loaded: merged_registry_result.registry_count_loaded,
      registry_count_evaluated: merged_registry_result.registry_count_evaluated,
      batch_count: merged_registry_result.batch_count
    }));

    stage_log.push(createStageRecord("operator_challenge", "started"));
    const operatorChallenge = await callStage({
      endpointUrl: endpoints.operator_challenge,
      fetchImpl,
      outputKey: "operator_challenge_result",
      input: buildOperatorChallengeInput({
        runId,
        source_bundle,
        target_feature_profile,
        legal_stack_review,
        merged_registry_result
      }),
      options: mergeStageOptions(options, "operator_challenge")
    });
    const operator_challenge_result = operatorChallenge.output;
    stage_log.push(createStageRecord("operator_challenge", "completed", {
      result: operator_challenge_result?.operator_challenge_gate?.result || "unknown"
    }));

    stage_log.push(createStageRecord("correction_merge", "started"));
    const correction_result = assertCorrectionMergeValid(
      applyOperatorChallengeCorrections({
        mergedLedger: merged_registry_result.registry_evaluation_ledger,
        operatorChallengeResult: operator_challenge_result,
        registry: options.registry
      })
    );
    stage_log.push(createStageRecord("correction_merge", "completed", {
      corrected_count: correction_result.corrected_count,
      registry_count_evaluated: correction_result.registry_count_evaluated
    }));

    stage_log.push(createStageRecord("final_compiler", "started"));
    const finalCompiler = await callStage({
      endpointUrl: endpoints.final_compiler,
      fetchImpl,
      outputKey: "compiler_output",
      input: buildFinalCompilerInput({
        runId,
        source_bundle,
        target_feature_profile,
        legal_stack_review,
        post_challenge_ledger: correction_result.post_challenge_ledger,
        operator_challenge_gate: correction_result.operator_challenge_gate,
        correction_meta: correction_result.correction_meta,
        source_collection,
        merged_registry_result
      }),
      options: mergeStageOptions(options, "final_compiler")
    });
    const compiler_output = finalCompiler.output;
    stage_log.push(createStageRecord("final_compiler", "completed"));

    return {
      ok: true,
      run_id: runId,
      status: "completed",
      compiler_output,
      pipeline_artifacts: {
        source_collection,
        source_bundle,
        target_feature_profile,
        legal_stack_review,
        merged_registry_result,
        operator_challenge_result,
        correction_result
      },
      stage_log
    };
  } catch (error) {
    stage_log.push(createStageRecord("pipeline", "failed", {
      error: error.message,
      status: error.status || null
    }));

    return {
      ok: false,
      run_id: runId,
      status: "failed",
      error: error.message,
      error_status: error.status || null,
      error_payload: error.payload || null,
      stage_log
    };
  }
}
