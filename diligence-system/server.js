import express from "express";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import { loadPromptStack, runPhaseStack } from "./phase-runner.js";
import {
  createRun,
  getRun,
  advanceRun,
  getRunResult
} from "./run-manager.js";
import { buildPublicScratchpadView } from "./scratchpad-manager.js";
import {
  listArtifacts,
  readArtifact,
  readRunForensics,
  readRunScratchpad
} from "./run-store.js";
import {
  callGeminiClient,
  classifyGeminiError,
  ERROR_CLASSES,
  fingerprint,
  hasAnyConfiguredBucket,
  isModelSpecificError,
  isTerminalError,
  publicBucketSnapshot,
  resolveRuntimeBucketChain,
  ROTATION_DECISIONS,
  shouldRetrySameKey
} from "./gemini-client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 8080);
const ACTIVE_RUNTIME = "phase_stack_prompt_supremacy";

const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 600000);
const GEMINI_MAX_OUTPUT_TOKENS_CONFIGURED = positiveIntOrNull(process.env.GEMINI_MAX_OUTPUT_TOKENS);

const EXPRESS_JSON_LIMIT = process.env.EXPRESS_JSON_LIMIT || "50mb";

const SOURCE_MAX_CANDIDATES_DEFAULT = Number(process.env.SOURCE_MAX_CANDIDATES || 75);
const SOURCE_FETCH_TIMEOUT_MS_DEFAULT = Number(process.env.SOURCE_FETCH_TIMEOUT_MS || 45000);

const P6_MODEL_BATCH_SIZE = Number(process.env.P6_MODEL_BATCH_SIZE || 15);

const CLOUD_RUN_TIMEOUT_ASSUMPTION_SECONDS = Number(
  process.env.CLOUD_RUN_TIMEOUT_ASSUMPTION_SECONDS || 900
);

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: EXPRESS_JSON_LIMIT }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (_req, res) => res.redirect(302, "/diligence.html"));

app.get("/health", async (_req, res) => {
  const stack = await safePromptStack();
  res.json({
    ok: true,
    service: "interface-diligence-system",
    active_diligence_runtime: ACTIVE_RUNTIME,
    mode: ACTIVE_RUNTIME,
    supported_modes: [ACTIVE_RUNTIME],

    prompt_stack_ready: stack.ok,
    prompt_stack_files: stack.manifest || [],
    prompt_stack_errors: stack.errors || [],

    pools: publicPoolsSnapshot(),

    gemini_timeout_ms: GEMINI_TIMEOUT_MS,
    gemini_max_output_tokens_configured: GEMINI_MAX_OUTPUT_TOKENS_CONFIGURED,
    gemini_output_token_cap_sent: false,
    artificial_model_output_limit_blocking: false,
    express_json_limit: EXPRESS_JSON_LIMIT,

    source_max_candidates_used: SOURCE_MAX_CANDIDATES_DEFAULT,
    source_fetch_timeout_ms_used: SOURCE_FETCH_TIMEOUT_MS_DEFAULT,
    source_candidate_limit_hit: false,

    p6_model_batch_size: P6_MODEL_BATCH_SIZE,
    cloud_run_timeout_assumption: `${CLOUD_RUN_TIMEOUT_ASSUMPTION_SECONDS}s`,

    runtime_limits: buildRuntimeLimitTrace({
      sourceCandidateLimitHit: false
    })
  });
});
app.get("/api/diligence/prompt-stack", async (_req, res) => {
  const stack = await safePromptStack();
  res.status(stack.ok ? 200 : 500).json({ ok: stack.ok, active_diligence_runtime: ACTIVE_RUNTIME, manifest: stack.manifest || [], errors: stack.errors || [] });
});

app.get("/api/diligence/pools", (_req, res) => {
  res.json({ ok: true, active_diligence_runtime: ACTIVE_RUNTIME, pools: publicPoolsSnapshot() });
});

app.post("/api/gemini/ping", async (_req, res) => {
  const startedAt = Date.now();
  try {
    const result = await callModel({
      phaseId: "PING",
      poolName: "repair",
      systemPrompt: "Return JSON.",
      userPrompt: "{\"ok\":true,\"ping\":\"pong\"}",
      responseMimeType: "application/json",
      temperature: 0,
      maxOutputTokens: 128
    });
    res.json({ ok: true, latency_ms: Date.now() - startedAt, ...result.meta, response: result.text });
  } catch (err) {
    res.status(502).json({ ok: false, error: "GEMINI_PING_FAILED", message: err?.message || String(err), latency_ms: Date.now() - startedAt });
  }
});

app.post("/api/diligence/jobs", async (req, res) => {
  try {
    const runInput = buildRunInput(req);
    const job = await createRun({
      input: runInput,
      baseDir: __dirname
    });

    return res.status(202).json(job);
  } catch (err) {
    console.error("[diligence/jobs] create failed", err);

    return res.status(500).json({
      ok: false,
      error: "DILIGENCE_JOB_CREATE_FAILED",
      message: err?.message || String(err)
    });
  }
});

app.get("/api/diligence/jobs/:runId", async (req, res) => {
  try {
    const job = await getRun({
      runId: req.params.runId,
      baseDir: __dirname
    });

    return res.json(job);
  } catch (err) {
    const message = err?.message || String(err);
    const status = message.startsWith("RUN_NOT_FOUND:") ? 404 : 500;

    return res.status(status).json({
      ok: false,
      error: status === 404 ? "DILIGENCE_JOB_NOT_FOUND" : "DILIGENCE_JOB_STATUS_FAILED",
      message
    });
  }
});


app.get("/api/diligence/jobs/:runId/scratchpad", async (req, res) => {
  try {
    const jobState = await getRun({
      runId: req.params.runId,
      baseDir: __dirname
    });

    const scratchpad = await readRunScratchpad({
      runId: req.params.runId,
      baseDir: __dirname
    });

    return res.json(buildPublicScratchpadView({
      scratchpad,
      state: jobState
    }));
  } catch (err) {
    const message = err?.message || String(err);
    const status = message.startsWith("RUN_NOT_FOUND:") ? 404 : 500;

    return res.status(status).json({
      ok: false,
      error: status === 404 ? "DILIGENCE_JOB_NOT_FOUND" : "DILIGENCE_JOB_SCRATCHPAD_FAILED",
      message,
      run_id: req.params.runId
    });
  }
});


app.get("/api/diligence/jobs/:runId/forensics", async (req, res) => {
  try {
    const jobState = await getRun({
      runId: req.params.runId,
      baseDir: __dirname
    });

    const forensics = await readRunForensics({
      runId: req.params.runId,
      baseDir: __dirname
    });

    return res.json({
      ok: true,
      run_id: req.params.runId,
      status: jobState.status,
      failed_node: jobState.failed_node || null,
      forensics: forensics || null
    });
  } catch (err) {
    const message = err?.message || String(err);
    const status = message.startsWith("RUN_NOT_FOUND:") ? 404 : 500;

    return res.status(status).json({
      ok: false,
      error: status === 404 ? "DILIGENCE_JOB_NOT_FOUND" : "DILIGENCE_JOB_FORENSICS_FAILED",
      message,
      run_id: req.params.runId
    });
  }
});


app.get("/api/diligence/jobs/:runId/artifacts", async (req, res) => {
  try {
    const jobState = await getRun({
      runId: req.params.runId,
      baseDir: __dirname
    });

    const artifacts = await listArtifacts({
      runId: req.params.runId,
      baseDir: __dirname
    });

    return res.json({
      ok: true,
      run_id: req.params.runId,
      status: jobState.status,
      artifacts
    });
  } catch (err) {
    const message = err?.message || String(err);
    const status = message.startsWith("RUN_NOT_FOUND:") ? 404 : 500;

    return res.status(status).json({
      ok: false,
      error: status === 404 ? "DILIGENCE_JOB_NOT_FOUND" : "DILIGENCE_JOB_ARTIFACT_LIST_FAILED",
      message,
      run_id: req.params.runId
    });
  }
});


app.get("/api/diligence/jobs/:runId/artifacts/:nodeId", async (req, res) => {
  try {
    await getRun({
      runId: req.params.runId,
      baseDir: __dirname
    });

    const artifact = await readArtifact({
      runId: req.params.runId,
      nodeId: req.params.nodeId,
      baseDir: __dirname
    });

    if (!artifact) {
      return res.status(404).json({
        ok: false,
        error: "DILIGENCE_JOB_ARTIFACT_NOT_FOUND",
        message: `Artifact not found for node ${req.params.nodeId}.`,
        run_id: req.params.runId,
        node_id: req.params.nodeId
      });
    }

    return res.json({
      ok: true,
      run_id: req.params.runId,
      node_id: req.params.nodeId,
      artifact
    });
  } catch (err) {
    const message = err?.message || String(err);
    const status = message.startsWith("RUN_NOT_FOUND:")
      ? 404
      : message.startsWith("INVALID_NODE_ID:")
        ? 400
        : 500;

    return res.status(status).json({
      ok: false,
      error: status === 404
        ? "DILIGENCE_JOB_NOT_FOUND"
        : status === 400
          ? "DILIGENCE_JOB_INVALID_NODE"
          : "DILIGENCE_JOB_ARTIFACT_READ_FAILED",
      message,
      run_id: req.params.runId,
      node_id: req.params.nodeId
    });
  }
});

app.post("/api/diligence/jobs/:runId/advance", async (req, res) => {
  try {
    const jobState = await getRun({
      runId: req.params.runId,
      baseDir: __dirname
    });

    if (!hasAnyGeminiKey() && !canAdvanceWithoutGeminiKey(jobState)) {
      return res.status(500).json({
        ok: false,
        error: "KEY_BUCKET_NOT_CONFIGURED",
        message: "No Gemini key bucket is configured for the diligence runtime.",
        run_id: req.params.runId,
        current_status: jobState.status,
        next_node: jobState.next_node
      });
    }

    const advanced = await advanceRun({
      runId: req.params.runId,
      callModel,
      baseDir: __dirname
    });

    return res.status(advanced.ok ? 200 : 422).json(advanced);
  } catch (err) {
    const message = err?.message || String(err);
    const status = message.startsWith("RUN_NOT_FOUND:") ? 404 : 500;

    return res.status(status).json({
      ok: false,
      error: status === 404 ? "DILIGENCE_JOB_NOT_FOUND" : "DILIGENCE_JOB_ADVANCE_FAILED",
      message,
      run_id: req.params.runId
    });
  }
});

app.get("/api/diligence/jobs/:runId/result", async (req, res) => {
  try {
    const result = await getRunResult({
      runId: req.params.runId,
      baseDir: __dirname
    });

    const statusCode = result.ok ? 200 : result.status === "RESULT_NOT_READY" ? 425 : 422;

    return sendDiligenceResponse(req, res, result, statusCode);
  } catch (err) {
    const message = err?.message || String(err);
    const status = message.startsWith("RUN_NOT_FOUND:") ? 404 : 500;

    return res.status(status).json({
      ok: false,
      error: status === 404 ? "DILIGENCE_JOB_NOT_FOUND" : "DILIGENCE_JOB_RESULT_FAILED",
      message,
      run_id: req.params.runId
    });
  }
});

app.post("/api/diligence/run", async (req, res) => {
  const startedAt = Date.now();

  try {
    if (!hasAnyGeminiKey()) {
      return sendDiligenceResponse(req, res, {
        ok: false,
        error: "KEY_BUCKET_NOT_CONFIGURED",
        message: "No Gemini key bucket is configured for the diligence runtime.",
        runtime_trace: buildServerRuntimeTrace({
          startedAt,
          status: "FAILED_BEFORE_RUN",
          failure_stage: "SERVER_KEY_CHECK",
          sourceCandidateLimitHit: false
        }),
        operational_limits: buildRuntimeLimitTrace({
          sourceCandidateLimitHit: false
        })
      }, 500);
    }

    const runInput = buildRunInput(req);
    const result = await runPhaseStack({
      input: runInput,
      callModel,
      baseDir: __dirname
    });

    const sourceTrace = extractSourceTrace(result);
    const runtimeTrace = buildServerRuntimeTrace({
      startedAt,
      status: result.ok ? "RUN_RETURNED" : "RUN_RETURNED_WITH_ERRORS",
      failure_stage: result.ok ? null : result?.status || result?.error || "UNKNOWN_PHASE_STACK_FAILURE",
      sourceCandidateLimitHit: sourceTrace.source_candidate_limit_hit
    });

    const payload = {
      ...result,
      runtime_trace: mergeRuntimeTrace(result?.runtime_trace, runtimeTrace),
      operational_limits: buildRuntimeLimitTrace({
        sourceMaxCandidatesUsed: sourceTrace.source_max_candidates_used,
        sourceFetchTimeoutMsUsed: sourceTrace.source_fetch_timeout_ms_used,
        sourceCandidateLimitHit: sourceTrace.source_candidate_limit_hit
      })
    };

    const htmlRequested = wantsHtmlReport(req);
    const debugCompact = wantsCompactFailure(req);

    const responsePayload = !payload.ok && debugCompact && !htmlRequested
      ? buildCompactFailure(payload)
      : payload;

    return sendDiligenceResponse(req, res, responsePayload, payload.ok ? 200 : 422);
  } catch (err) {
    console.error("[diligence/run] failed", err);

    return sendDiligenceResponse(req, res, {
      ok: false,
      error: "DILIGENCE_RUN_FAILED",
      message: err?.message || String(err),
      runtime_trace: buildServerRuntimeTrace({
        startedAt,
        status: "SERVER_EXCEPTION",
        failure_stage: "SERVER_CATCH",
        sourceCandidateLimitHit: false,
        exception: err
      }),
      operational_limits: buildRuntimeLimitTrace({
        sourceCandidateLimitHit: false
      })
    }, 500);
  }
});

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  app.listen(PORT, () => {
    console.log(`Interface Diligence System listening on :${PORT}`);
    console.log(`Active runtime: ${ACTIVE_RUNTIME}`);
  });
}

async function safePromptStack() {
  try { return await loadPromptStack(__dirname); }
  catch (err) { return { ok: false, errors: [err?.message || String(err)], manifest: [] }; }
}

async function callModel({
  phaseId,
  poolName = "repair",
  systemPrompt,
  userPrompt,
  responseMimeType = "application/json",
  temperature = 0,
  maxOutputTokens = GEMINI_MAX_OUTPUT_TOKENS_CONFIGURED,
  sendMaxOutputTokens = false,
  allowGrounding = false
}) {
  const bucketChain = resolveRuntimeBucketChain({ phaseId, poolName, allowGrounding });
  let lastError = null;
  const attempts = [];
  let attemptNumber = 0;

  for (let bucketIndex = 0; bucketIndex < bucketChain.length; bucketIndex += 1) {
    const bucket = bucketChain[bucketIndex];
    const hasFallbackBucket = bucketIndex < bucketChain.length - 1;

    if (!bucket.keys.length) {
      const attempt = {
        phaseId,
        phase_id: phaseId,
        requestedPoolName: poolName,
        requested_pool_name: poolName,
        bucketName: bucket.bucketName,
        bucket_name: bucket.bucketName,
        model: null,
        modelIndex: null,
        model_index: null,
        keyIndex: null,
        key_index: null,
        keyAlias: null,
        key_alias: null,
        keyFingerprint: null,
        key_fingerprint: null,
        attemptNumber: ++attemptNumber,
        attempt_number: attemptNumber,
        ok: false,
        fallback: Boolean(bucket.fallback),
        fallback_bucket: Boolean(bucket.fallback),
        grounding: Boolean(bucket.grounding),
        grounding_enabled: Boolean(bucket.grounding),
        error: "KEY_BUCKET_NOT_CONFIGURED",
        errorClass: ERROR_CLASSES.KEY_BUCKET_NOT_CONFIGURED,
        error_class: ERROR_CLASSES.KEY_BUCKET_NOT_CONFIGURED,
        retryAfterSeconds: null,
        retry_after_seconds: null,
        decision: hasFallbackBucket ? ROTATION_DECISIONS.FALLBACK_BUCKET : ROTATION_DECISIONS.TERMINAL_FAIL
      };
      attempts.push(attempt);
      lastError = new Error(`KEY_BUCKET_NOT_CONFIGURED:${bucket.bucketName}`);
      lastError.errorClass = ERROR_CLASSES.KEY_BUCKET_NOT_CONFIGURED;
      continue;
    }

    for (let modelIndex = 0; modelIndex < bucket.models.length; modelIndex += 1) {
      const model = bucket.models[modelIndex];
      let rotateModelImmediately = false;

      for (let keyIndex = 0; keyIndex < bucket.keys.length; keyIndex += 1) {
        const key = bucket.keys[keyIndex];
        const result = await executeGeminiAttempt({
          phaseId,
          poolName,
          bucket,
          model,
          modelIndex,
          key,
          keyIndex,
          attemptNumberRef: () => ++attemptNumber,
          attempts,
          systemPrompt,
          userPrompt,
          responseMimeType,
          temperature,
          maxOutputTokens,
          sendMaxOutputTokens,
          retryOrdinal: 0
        });

        attemptNumber = result.attemptNumber;

        if (result.ok) {
          return buildCallModelSuccess({
            result,
            phaseId,
            poolName,
            bucket,
            model,
            modelIndex,
            key,
            keyIndex,
            attempts
          });
        }

        lastError = result.error;
        const classification = classifyGeminiError(result.error);
        const errorClass = classification.errorClass;
        const canRetrySameKey = shouldRetrySameKey({
          errorClass,
          retryAfterSeconds: classification.retryAfterSeconds,
          retryAlreadyUsed: false,
          keyIndex,
          keyCount: bucket.keys.length
        });

        if (canRetrySameKey) {
          const waitMs = retryDelayMs(classification.retryAfterSeconds);
          result.attempt.decision = ROTATION_DECISIONS.RETRY_SAME_KEY_SAME_MODEL;
          if (waitMs > 0) await sleep(waitMs);

          const retryResult = await executeGeminiAttempt({
            phaseId,
            poolName,
            bucket,
            model,
            modelIndex,
            key,
            keyIndex,
            attemptNumberRef: () => ++attemptNumber,
            attempts,
            systemPrompt,
            userPrompt,
            responseMimeType,
            temperature,
            maxOutputTokens,
            sendMaxOutputTokens,
            retryOrdinal: 1
          });

          attemptNumber = retryResult.attemptNumber;

          if (retryResult.ok) {
            return buildCallModelSuccess({
              result: retryResult,
              phaseId,
              poolName,
              bucket,
              model,
              modelIndex,
              key,
              keyIndex,
              attempts
            });
          }

          lastError = retryResult.error;
          const retryClassification = classifyGeminiError(retryResult.error);
          const retryErrorClass = retryClassification.errorClass;
          retryResult.attempt.decision = decideAfterFailedAttempt({
            errorClass: retryErrorClass,
            keyIndex,
            keyCount: bucket.keys.length,
            hasMoreModels: modelIndex < bucket.models.length - 1,
            hasFallbackBucket
          });

          if (isTerminalError(retryErrorClass)) {
            throw buildFinalModelError({ lastError, attempts, poolName, phaseId });
          }

          if (isModelSpecificError(retryErrorClass)) {
            rotateModelImmediately = true;
            break;
          }
        } else {
          result.attempt.decision = decideAfterFailedAttempt({
            errorClass,
            keyIndex,
            keyCount: bucket.keys.length,
            hasMoreModels: modelIndex < bucket.models.length - 1,
            hasFallbackBucket
          });

          if (isTerminalError(errorClass)) {
            throw buildFinalModelError({ lastError, attempts, poolName, phaseId });
          }

          if (isModelSpecificError(errorClass)) {
            rotateModelImmediately = true;
            break;
          }
        }
      }

      if (rotateModelImmediately) continue;
    }

    if (hasFallbackBucket && attempts.length) {
      const lastAttempt = attempts[attempts.length - 1];
      if (lastAttempt && !lastAttempt.ok && lastAttempt.decision !== ROTATION_DECISIONS.TERMINAL_FAIL) {
        lastAttempt.decision = ROTATION_DECISIONS.FALLBACK_BUCKET;
      }
    }
  }

  throw buildFinalModelError({
    lastError: lastError || new Error(`MODEL_POOL_FAILED:${poolName}`),
    attempts,
    poolName,
    phaseId
  });
}

async function executeGeminiAttempt({
  phaseId,
  poolName,
  bucket,
  model,
  modelIndex,
  key,
  keyIndex,
  attemptNumberRef,
  attempts,
  systemPrompt,
  userPrompt,
  responseMimeType,
  temperature,
  maxOutputTokens,
  sendMaxOutputTokens = false,
  retryOrdinal = 0
}) {
  const startedAt = Date.now();
  const attemptNumber = attemptNumberRef();
  const attempt = {
    phaseId,
    phase_id: phaseId,
    requestedPoolName: poolName,
    requested_pool_name: poolName,
    bucketName: bucket.bucketName,
    bucket_name: bucket.bucketName,
    model,
    modelIndex: modelIndex + 1,
    model_index: modelIndex + 1,
    keyIndex: keyIndex + 1,
    key_index: keyIndex + 1,
    keyAlias: `${bucket.bucketName}_${keyIndex + 1}`,
    key_alias: `${bucket.bucketName}_${keyIndex + 1}`,
    keyFingerprint: fingerprint(key),
    key_fingerprint: fingerprint(key),
    attemptNumber,
    attempt_number: attemptNumber,
    retryOrdinal,
    retry_ordinal: retryOrdinal,
    ok: false,
    error: null,
    errorClass: null,
    error_class: null,
    fallback: Boolean(bucket.fallback),
    fallback_bucket: Boolean(bucket.fallback),
    grounding: Boolean(bucket.grounding),
    grounding_enabled: Boolean(bucket.grounding),
    decision: null
  };
  attempt.gemini_max_output_tokens = null;
  attempt.model_output_token_limit_sent = false;
  attempt.artificial_output_limit_blocking = false;
  attempts.push(attempt);

  try {
    const geminiResult = await callGeminiClient({
      key,
      model,
      systemPrompt,
      userPrompt,
      responseMimeType,
      temperature,
      maxOutputTokens,
      sendMaxOutputTokens,
      timeoutMs: GEMINI_TIMEOUT_MS,
      allowGrounding: bucket.grounding,
      returnMetadata: true
    });

    attempt.ok = true;
    attempt.latencyMs = Date.now() - startedAt;
    attempt.latency_ms = attempt.latencyMs;
    attempt.decision = ROTATION_DECISIONS.SUCCESS;
    attempt.usageMetadata = geminiResult?.usageMetadata || null;
    attempt.usage_metadata = geminiResult?.usageMetadata || null;
    attempt.finishReason = geminiResult?.finishReason || null;
    attempt.finish_reason = geminiResult?.finishReason || null;
    attempt.provider_warnings = geminiResult?.provider_warnings || [];
    attempt.output_limit_non_blocking = Boolean(geminiResult?.output_limit_non_blocking);
    attempt.model_output_token_limit_sent = Boolean(geminiResult?.model_output_token_limit_sent);
    attempt.artificial_output_limit_blocking = false;

    return {
      ok: true,
      text: typeof geminiResult === "string" ? geminiResult : geminiResult?.text || "",
      usageMetadata: geminiResult?.usageMetadata || null,
      finishReason: geminiResult?.finishReason || null,
      providerWarnings: geminiResult?.provider_warnings || [],
      outputLimitNonBlocking: Boolean(geminiResult?.output_limit_non_blocking),
      modelOutputTokenLimitSent: Boolean(geminiResult?.model_output_token_limit_sent),
      artificialOutputLimitBlocking: false,
      attempt,
      attemptNumber
    };
  } catch (err) {
    const classification = classifyGeminiError(err);
    attempt.ok = false;
    attempt.error = err?.message || String(err);
    attempt.errorClass = classification.errorClass;
    attempt.error_class = classification.errorClass;
    attempt.retryAfterSeconds = classification.retryAfterSeconds;
    attempt.retry_after_seconds = classification.retryAfterSeconds;
    attempt.latencyMs = Date.now() - startedAt;
    attempt.latency_ms = attempt.latencyMs;

    return {
      ok: false,
      error: err,
      attempt,
      attemptNumber
    };
  }
}

function buildCallModelSuccess({ result, phaseId, poolName, bucket, model, modelIndex, key, keyIndex, attempts }) {
  const fallbackUsed = attempts.some((attempt) => attempt.fallback || attempt.decision === ROTATION_DECISIONS.FALLBACK_BUCKET) || attempts.length > 1;
  return {
    text: result.text,
    meta: {
      phase_id: phaseId,
      pool_name: poolName,
      bucket_name: bucket.bucketName,
      model,
      model_index: modelIndex + 1,
      key_index: keyIndex + 1,
      key_alias: `${bucket.bucketName}_${keyIndex + 1}`,
      key_fingerprint: fingerprint(key),
      latency_ms: result.attempt?.latencyMs ?? null,
      grounding_requested: bucket.grounding,
      fallback_used: fallbackUsed,
      fallback_reason: fallbackUsed ? "PRIMARY_MODEL_OR_KEY_FAILED" : null,
      gemini_timeout_ms: GEMINI_TIMEOUT_MS,
      gemini_max_output_tokens: null,
      model_output_token_limit_sent: Boolean(result.modelOutputTokenLimitSent),
      artificial_output_limit_blocking: false,
      provider_warnings: result.providerWarnings || [],
      output_limit_non_blocking: Boolean(result.outputLimitNonBlocking),
      usage_metadata: result.usageMetadata || null,
      finish_reason: result.finishReason || null,
      model_attempts: attempts,
      attempts
    }
  };
}

function decideAfterFailedAttempt({ errorClass, keyIndex, keyCount, hasMoreModels, hasFallbackBucket }) {
  if (isTerminalError(errorClass)) return ROTATION_DECISIONS.TERMINAL_FAIL;
  if (isModelSpecificError(errorClass)) return hasMoreModels ? ROTATION_DECISIONS.ROTATE_MODEL_SAME_BUCKET : hasFallbackBucket ? ROTATION_DECISIONS.FALLBACK_BUCKET : ROTATION_DECISIONS.TERMINAL_FAIL;
  if (keyIndex < keyCount - 1) return ROTATION_DECISIONS.ROTATE_KEY_SAME_MODEL;
  if (hasMoreModels) return ROTATION_DECISIONS.ROTATE_MODEL_SAME_BUCKET;
  if (hasFallbackBucket) return ROTATION_DECISIONS.FALLBACK_BUCKET;
  return ROTATION_DECISIONS.TERMINAL_FAIL;
}

function buildFinalModelError({ lastError, attempts, poolName, phaseId }) {
  const finalError = lastError || new Error(`MODEL_POOL_FAILED:${poolName}`);
  finalError.model_attempts = attempts;
  finalError.pool_name = poolName;
  finalError.phase_id = phaseId;
  return finalError;
}

function retryDelayMs(retryAfterSeconds) {
  const seconds = Number(retryAfterSeconds);
  if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 20) return 0;
  return Math.ceil(seconds * 1000) + 250;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hasAnyGeminiKey() {
  return hasAnyConfiguredBucket();
}
function canAdvanceWithoutGeminiKey(jobState) {
  if (jobState?.next_node !== "S0") return false;

  const sourceMode = String(jobState?.input?.source_mode || "").trim().toLowerCase();

  return [
    "synthetic_demo",
    "synthetic",
    "demo",
    "text",
    "pasted_public_material",
    "pasted"
  ].includes(sourceMode);
}
function wantsCompactFailure(req) {
  return Boolean(
    req?.body?.debug_compact === true ||
    String(req?.query?.debug_compact || "").toLowerCase() === "true"
  );
}

function wantsHtmlReport(req) {
  const body = req.body || {};
  const query = req.query || {};
  const requestedFormat = String(
    body.format ||
    body.response_format ||
    query.format ||
    query.response_format ||
    ""
  ).trim().toLowerCase();

  if (["html", "report_html", "rendered_html"].includes(requestedFormat)) return true;

  const accept = String(req.headers.accept || "").toLowerCase();
  return accept.includes("text/html") && !accept.includes("application/json");
}

function sendDiligenceResponse(req, res, payload, statusCode) {
  if (wantsHtmlReport(req)) {
    const html =
      payload?.html_report ||
      payload?.renderer_output?.html_report ||
      payload?.rendered_report?.html ||
      buildFallbackHtmlReport(payload);

    return res
      .status(statusCode)
      .type("html")
      .send(html);
  }

  return res.status(statusCode).json(payload);
}

function buildFallbackHtmlReport(payload = {}) {
  const title = payload?.ok ? "Diligence Report" : "Diligence Run Failed";
  const status = payload?.status || payload?.error || "UNKNOWN_STATUS";
  const message = payload?.message || payload?.error || "No rendered report was available.";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      margin: 0;
      background: #f6f4ef;
      color: #1d1d1f;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.55;
    }
    main {
      width: min(920px, calc(100% - 32px));
      margin: 40px auto;
      background: #fff;
      border: 1px solid #ddd7cc;
      border-radius: 20px;
      padding: 28px;
      box-shadow: 0 18px 45px rgba(31,39,54,.08);
    }
    h1 { margin-top: 0; }
    .badge {
      display: inline-flex;
      padding: 6px 10px;
      border-radius: 999px;
      background: #ffe2e2;
      color: #9f2626;
      font-weight: 800;
      font-size: 12px;
      text-transform: uppercase;
    }
    pre {
      overflow-x: auto;
      padding: 14px;
      border-radius: 14px;
      background: #161a22;
      color: #eef2f7;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <main>
    <span class="badge">${escapeHtml(status)}</span>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
    <p>This is a controlled server fallback page. The deterministic renderer did not provide an HTML report.</p>
    <pre>${escapeHtml(JSON.stringify({
      ok: payload?.ok,
      status: payload?.status,
      error: payload?.error,
      message: payload?.message,
      operational_limits: payload?.operational_limits || null
    }, null, 2))}</pre>
  </main>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildRunInput(req) {
  const body = req.body || {};
  const query = req.query || {};

  return {
    ...body,

    debug_trace: body.debug_trace ?? parseQueryBoolean(query.debug_trace),
    debug_raw: body.debug_raw ?? parseQueryBoolean(query.debug_raw),
    debug_compact: body.debug_compact ?? parseQueryBoolean(query.debug_compact),

    run_until: body.run_until ?? query.run_until, format: body.format ?? body.response_format ?? query.format ?? query.response_format,

    runtime_limits: {
      ...(body.runtime_limits || {}),
      gemini_timeout_ms: GEMINI_TIMEOUT_MS,
      gemini_max_output_tokens_configured: GEMINI_MAX_OUTPUT_TOKENS_CONFIGURED,
      gemini_output_token_cap_sent: false,
      artificial_model_output_limit_blocking: false,
      express_json_limit: EXPRESS_JSON_LIMIT,
      source_max_candidates_used: Number(
        body?.runtime_limits?.source_max_candidates_used ||
        body?.source_max_candidates ||
        SOURCE_MAX_CANDIDATES_DEFAULT
      ),
      source_fetch_timeout_ms_used: Number(
        body?.runtime_limits?.source_fetch_timeout_ms_used ||
        body?.source_fetch_timeout_ms ||
        SOURCE_FETCH_TIMEOUT_MS_DEFAULT
      ),
      p6_model_batch_size: Number(
        body?.runtime_limits?.p6_model_batch_size ||
        body?.p6_model_batch_size ||
        P6_MODEL_BATCH_SIZE
      ),
      cloud_run_timeout_assumption: `${CLOUD_RUN_TIMEOUT_ASSUMPTION_SECONDS}s`
    }
  };
}

function parseQueryBoolean(value) {
  if (value === undefined || value === null || value === "") return undefined;
  return String(value).toLowerCase() === "true";
}

function extractSourceTrace(result) {
  const s0 =
    result?.stage0 ||
    result?.phase_outputs?.S0 ||
    result?.phase_outputs?.s0 ||
    result?.runtime_trace?.source_trace ||
    {};

  const runtimeLimits = result?.operational_limits || result?.runtime_limits || {};

  const sourceMaxCandidatesUsed = Number(
    s0?.source_max_candidates_used ||
    s0?.max_candidates_used ||
    s0?.candidate_limit ||
    runtimeLimits?.source_max_candidates_used ||
    SOURCE_MAX_CANDIDATES_DEFAULT
  );

  const sourceFetchTimeoutMsUsed = Number(
    s0?.source_fetch_timeout_ms_used ||
    s0?.fetch_timeout_ms_used ||
    s0?.fetch_timeout_ms ||
    runtimeLimits?.source_fetch_timeout_ms_used ||
    SOURCE_FETCH_TIMEOUT_MS_DEFAULT
  );

  const candidateCount = Number(
    s0?.source_candidate_count ||
    s0?.candidate_count ||
    s0?.candidates?.length ||
    0
  );

  const explicitLimitHit =
    s0?.source_candidate_limit_hit === true ||
    s0?.candidate_limit_hit === true ||
    runtimeLimits?.source_candidate_limit_hit === true;

  return {
    source_max_candidates_used: sourceMaxCandidatesUsed,
    source_fetch_timeout_ms_used: sourceFetchTimeoutMsUsed,
    source_candidate_limit_hit: explicitLimitHit || (
      sourceMaxCandidatesUsed > 0 &&
      candidateCount >= sourceMaxCandidatesUsed
    )
  };
}

function buildRuntimeLimitTrace({
  sourceMaxCandidatesUsed = SOURCE_MAX_CANDIDATES_DEFAULT,
  sourceFetchTimeoutMsUsed = SOURCE_FETCH_TIMEOUT_MS_DEFAULT,
  sourceCandidateLimitHit = false
} = {}) {
  return {
    gemini_timeout_ms: GEMINI_TIMEOUT_MS,
    gemini_max_output_tokens_configured: GEMINI_MAX_OUTPUT_TOKENS_CONFIGURED,
    gemini_output_token_cap_sent: false,
    artificial_model_output_limit_blocking: false,
    express_json_limit: EXPRESS_JSON_LIMIT,
    source_max_candidates_used: Number(sourceMaxCandidatesUsed),
    source_fetch_timeout_ms_used: Number(sourceFetchTimeoutMsUsed),
    source_candidate_limit_hit: Boolean(sourceCandidateLimitHit),
    p6_model_batch_size: P6_MODEL_BATCH_SIZE,
    cloud_run_timeout_assumption: `${CLOUD_RUN_TIMEOUT_ASSUMPTION_SECONDS}s`
  };
}

function buildServerRuntimeTrace({
  startedAt,
  status,
  failure_stage = null,
  sourceCandidateLimitHit = false,
  exception = null
}) {
  return {
    server_trace_version: "server_runtime_trace_v1",
    active_diligence_runtime: ACTIVE_RUNTIME,
    status,
    failure_stage,
    elapsed_ms: Date.now() - startedAt,
    limits: buildRuntimeLimitTrace({
      sourceCandidateLimitHit
    }),
    exception: exception ? {
      name: exception?.name || null,
      message: exception?.message || String(exception),
      stack_present: Boolean(exception?.stack)
    } : null
  };
}

function mergeRuntimeTrace(existingTrace, serverTrace) {
  if (!existingTrace) return serverTrace;

  if (Array.isArray(existingTrace)) {
    return [...existingTrace, serverTrace];
  }

  return {
    ...existingTrace,
    server_trace: serverTrace
  };
}

function buildCompactFailure(payload) {
  return {
    ok: false,
    status: payload?.status || "FAILED",
    error: payload?.error || "DILIGENCE_RUN_FAILED",
    message: payload?.message || payload?.failure_reason || null,
    compact_failure: payload?.compact_failure || null,
    runtime_trace: payload?.runtime_trace || null,
    operational_limits: payload?.operational_limits || null
  };
}

function publicPoolsSnapshot() {
  return publicBucketSnapshot();
}

function positiveIntOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}
