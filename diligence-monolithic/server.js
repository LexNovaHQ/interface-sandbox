import crypto from "crypto";
import express from "express";
import helmet from "helmet";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 8080);
const ACTIVE_RUNTIME = "monolith_job_runtime";
const EXPRESS_JSON_LIMIT = process.env.EXPRESS_JSON_LIMIT || "50mb";
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 600000);
const GEMINI_MAX_OUTPUT_TOKENS = positiveIntOrNull(process.env.GEMINI_MAX_OUTPUT_TOKENS);
const SEND_MAX_OUTPUT_TOKENS = resolveSendMaxOutputTokens(process.env.GEMINI_SEND_MAX_OUTPUT_TOKENS, GEMINI_MAX_OUTPUT_TOKENS);
const VALIDATE_MODEL_TERMINAL_JSON = String(process.env.GEMINI_VALIDATE_TERMINAL_JSON || "true").toLowerCase() !== "false";
const MODEL_OUTPUT_TAIL_PREVIEW_CHARS = Number(process.env.MODEL_OUTPUT_TAIL_PREVIEW_CHARS || 1200);
const DEBUG_RAW_DEFAULT = String(process.env.DEBUG_RAW_MODEL_OUTPUT || "").toLowerCase() === "true";
const AUTO_START_DEFAULT = String(process.env.MONOLITH_AUTO_START || "true").toLowerCase() !== "false";
const RUN_TTL_MS = Number(process.env.MONOLITH_RUN_TTL_MS || 1000 * 60 * 60 * 6);
const VAULT_ENGINE_URL = String(process.env.VAULT_ENGINE_URL || "").trim();
const VAULT_ENGINE_TOKEN = String(process.env.VAULT_ENGINE_TOKEN || "").trim();
const GOOGLE_SEARCH_TOOL_FIELD = String(process.env.GEMINI_GOOGLE_SEARCH_TOOL_FIELD || "googleSearch").trim();
const GROUNDING_RESPONSE_MIME_POLICY = String(process.env.GEMINI_GROUNDING_RESPONSE_MIME_POLICY || "omit_when_tools_enabled").trim().toLowerCase();

const PROMPT_PATH = path.join(__dirname, "prompts", "diligence_runtime_MONOLITH_FINAL.md");
const REGISTRY_KEY_PATH = path.join(__dirname, "references", "REGISTRY_KEY_v3_0.md");
const REGISTRY_YAML_PATH = path.join(__dirname, "references", "AI_THREAT_REGISTRY.yaml");
const REGISTRY_RULES_PATH = path.join(__dirname, "references", "REGISTRY_EVALUATION_RULES.csv");
const VAULT_MAP_PATH = path.join(__dirname, "references", "VAULT_JS_CANONICAL_MAP_v1.md");

const BUCKET_ORDER = [
  "S0_SEARCH_API_KEYS",
  "P7_OPERATION_KEY",
  "P6_REGISTRY_KEYS",
  "P3_PROFILE_KEYS",
  "P1_ROUTING_API_KEYS"
];

const BUCKET_EXPECTED_COUNTS = Object.freeze({
  S0_SEARCH_API_KEYS: 2,
  P7_OPERATION_KEY: 2,
  P6_REGISTRY_KEYS: 4,
  P3_PROFILE_KEYS: 3,
  P1_ROUTING_API_KEYS: 3
});

const MODEL_TIERS = Object.freeze([
  {
    model: "gemini-2.5-flash",
    search_grounding: true,
    role: "primary_grounded_flash"
  },
  {
    model: "gemini-2.5-flash-lite",
    search_grounding: true,
    role: "secondary_grounded_flash_lite"
  },
  {
    model: "gemini-3-flash-preview",
    search_grounding: false,
    role: "fallback_non_grounded_gemini_3_flash"
  },
  {
    model: "gemini-3.1-flash-lite",
    search_grounding: false,
    role: "fallback_non_grounded_gemini_3_1_flash_lite"
  }
]);

const JOB_STATUS = Object.freeze({
  QUEUED: "QUEUED",
  RUNNING: "RUNNING",
  SUCCEEDED: "SUCCEEDED",
  FAILED: "FAILED"
});

const NODE = Object.freeze({
  JOB_CREATED: "JOB_CREATED",
  PROMPT_BUNDLE_LOAD: "PROMPT_BUNDLE_LOAD",
  MODEL_CALL: "MODEL_CALL",
  TERMINAL_JSON_PARSE: "TERMINAL_JSON_PARSE",
  REPORT_RENDER: "REPORT_RENDER",
  VAULT_HANDOFF: "VAULT_HANDOFF",
  COMPLETE: "COMPLETE"
});

const ERROR_CLASSES = Object.freeze({
  KEY_BUCKET_NOT_CONFIGURED: "KEY_BUCKET_NOT_CONFIGURED",
  QUOTA_EXHAUSTED: "QUOTA_EXHAUSTED",
  RATE_LIMITED: "RATE_LIMITED",
  KEY_INVALID: "KEY_INVALID",
  PROJECT_BLOCKED: "PROJECT_BLOCKED",
  MODEL_NOT_FOUND: "MODEL_NOT_FOUND",
  TOOL_UNSUPPORTED: "TOOL_UNSUPPORTED",
  INPUT_OR_PROMPT_INVALID: "INPUT_OR_PROMPT_INVALID",
  PROVIDER_5XX: "PROVIDER_5XX",
  TIMEOUT: "TIMEOUT",
  MODEL_JSON_PARSE_FAILED: "MODEL_JSON_PARSE_FAILED",
  SAFETY_BLOCKED: "SAFETY_BLOCKED",
  UNKNOWN_RETRYABLE: "UNKNOWN_RETRYABLE",
  UNKNOWN_TERMINAL: "UNKNOWN_TERMINAL"
});

const ROTATION_DECISIONS = Object.freeze({
  SUCCESS: "SUCCESS",
  RETRY_SAME_KEY_SAME_MODEL: "RETRY_SAME_KEY_SAME_MODEL",
  ROTATE_KEY_SAME_MODEL: "ROTATE_KEY_SAME_MODEL",
  ROTATE_MODEL_SAME_BUCKET: "ROTATE_MODEL_SAME_BUCKET",
  FALLBACK_BUCKET: "FALLBACK_BUCKET",
  TERMINAL_FAIL: "TERMINAL_FAIL"
});

const jobs = new Map();
const activeJobs = new Set();

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: EXPRESS_JSON_LIMIT }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (_req, res) => res.redirect(302, "/index.html"));
app.get("/health", healthHandler);
app.get("/api/health", healthHandler);

// Backward-compatible public entrypoint. This does NOT run the monolith inside the request.
// It creates one monolith job and returns immediately with polling URLs.
app.post("/api/diligence/run", createMonolithJobHandler);
app.post("/api/diligence/jobs", createMonolithJobHandler);
app.get("/api/diligence/jobs/:runId", getMonolithJobHandler);
app.get("/api/diligence/jobs/:runId/result", getMonolithResultHandler);

// Manual runtime-node advance fallback.
// It advances the single monolith job by one runtime node when background execution is unavailable.
app.post("/api/diligence/jobs/:runId/advance", advanceMonolithJobHandler);

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  app.listen(PORT, () => {
    console.log(`Interface Diligence Monolith listening on :${PORT}`);
    console.log(`Active runtime: ${ACTIVE_RUNTIME}`);
  });
}

async function createMonolithJobHandler(req, res) {
  try {
    cleanupExpiredJobs();
    const executionPayload = buildExecutionPayload(req.body || {});
    const debugRaw = wantsDebugRaw(req);
    const autoStart = req.body?.auto_start === undefined ? AUTO_START_DEFAULT : Boolean(req.body.auto_start);

    // Job creation must not require Gemini keys.
    // Key-pool availability is a MODEL_CALL concern so local/dev smoke tests can
    // create queued jobs with auto_start=false, while production still fails
    // cleanly inside the persisted job record if all configured key buckets are absent.
    const keyPoolConfigured = hasAnyGeminiKey();

    const job = createJobRecord({ executionPayload, debugRaw });
    jobs.set(job.run_id, job);

    if (autoStart) scheduleBackgroundRun(job.run_id);

    return res.status(202).json({
      ok: true,
      mode: ACTIVE_RUNTIME,
      run_id: job.run_id,
      status: job.status,
      current_node: job.current_node,
      next_node: job.next_node,
      auto_start: autoStart,
      key_pool_configured: keyPoolConfigured,
      key_bucket_counts: publicBucketSnapshot(),
      status_url: `/api/diligence/jobs/${encodeURIComponent(job.run_id)}`,
      result_url: `/api/diligence/jobs/${encodeURIComponent(job.run_id)}/result`,
      advance_url: `/api/diligence/jobs/${encodeURIComponent(job.run_id)}/advance`
    });
  } catch (err) {
    return res.status(statusForError(err)).json({
      ok: false,
      error: err?.code || "MONOLITH_JOB_CREATE_FAILED",
      message: err?.message || String(err)
    });
  }
}

function getMonolithJobHandler(req, res) {
  const job = jobs.get(req.params.runId);
  if (!job) return res.status(404).json({ ok: false, error: "RUN_NOT_FOUND" });
  return res.json(publicJobView(job));
}

function getMonolithResultHandler(req, res) {
  const job = jobs.get(req.params.runId);
  if (!job) return res.status(404).json({ ok: false, error: "RUN_NOT_FOUND" });
  if (job.status !== JOB_STATUS.SUCCEEDED) {
    return res.status(job.status === JOB_STATUS.FAILED ? 500 : 202).json({
      ok: false,
      error: job.status === JOB_STATUS.FAILED ? "MONOLITH_RUN_FAILED" : "RESULT_NOT_READY",
      status: job.status,
      current_node: job.current_node,
      next_node: job.next_node,
      error_detail: job.error || undefined,
      events: job.events.slice(-20)
    });
  }
  return res.json(job.result);
}

async function advanceMonolithJobHandler(req, res) {
  const job = jobs.get(req.params.runId);
  if (!job) return res.status(404).json({ ok: false, error: "RUN_NOT_FOUND" });
  if (job.status === JOB_STATUS.SUCCEEDED) return res.json(publicJobView(job));
  if (job.status === JOB_STATUS.FAILED && !req.body?.retry_failed_node) return res.status(409).json(publicJobView(job));
  if (activeJobs.has(job.run_id)) return res.status(202).json(publicJobView(job));

  try {
    activeJobs.add(job.run_id);
    await advanceOneRuntimeNode(job);
    if (req.body?.continue_to_completion === true) {
      while (![JOB_STATUS.SUCCEEDED, JOB_STATUS.FAILED].includes(job.status)) {
        await advanceOneRuntimeNode(job);
      }
    }
    return res.status(job.status === JOB_STATUS.SUCCEEDED ? 200 : 202).json(publicJobView(job));
  } catch (err) {
    markJobFailed(job, err);
    return res.status(500).json(publicJobView(job));
  } finally {
    activeJobs.delete(job.run_id);
  }
}

function scheduleBackgroundRun(runId) {
  setImmediate(async () => {
    const job = jobs.get(runId);
    if (!job || activeJobs.has(runId)) return;
    activeJobs.add(runId);
    try {
      while (![JOB_STATUS.SUCCEEDED, JOB_STATUS.FAILED].includes(job.status)) {
        await advanceOneRuntimeNode(job);
      }
    } catch (err) {
      markJobFailed(job, err);
    } finally {
      activeJobs.delete(runId);
    }
  });
}

async function advanceOneRuntimeNode(job) {
  if (job.status === JOB_STATUS.QUEUED) job.status = JOB_STATUS.RUNNING;
  job.updated_at = new Date().toISOString();

  switch (job.next_node) {
    case NODE.PROMPT_BUNDLE_LOAD: {
      setNode(job, NODE.PROMPT_BUNDLE_LOAD, NODE.MODEL_CALL);
      const promptBundle = await loadPromptBundle();
      job.artifacts.promptBundle = promptBundle;
      job.artifacts.references_loaded = promptBundle.manifest;
      appendEvent(job, NODE.PROMPT_BUNDLE_LOAD, "Prompt and references loaded.");
      return;
    }

    case NODE.MODEL_CALL: {
      setNode(job, NODE.MODEL_CALL, NODE.TERMINAL_JSON_PARSE);
      const promptBundle = job.artifacts.promptBundle || await loadPromptBundle();
      const allowGrounding = ["url", "url_plus_text"].includes(job.execution_payload.source_mode);
      const systemPrompt = buildSystemPrompt(promptBundle);
      const userPrompt = buildUserPrompt(job.execution_payload);
      appendEvent(job, NODE.MODEL_CALL, `Gemini monolith call started. Grounding=${allowGrounding}.`);
      const modelResult = await callGeminiWithRotation({
        systemPrompt,
        userPrompt,
        allowGrounding,
        responseMimeType: "application/json",
        temperature: Number(process.env.GEMINI_TEMPERATURE || 0)
      });
      job.artifacts.raw_model_output = modelResult.text;
      job.artifacts.model_meta = modelResult.meta;
      appendEvent(job, NODE.MODEL_CALL, "Gemini monolith call returned.");
      return;
    }

    case NODE.TERMINAL_JSON_PARSE: {
      setNode(job, NODE.TERMINAL_JSON_PARSE, NODE.REPORT_RENDER);
      const rawOutput = job.artifacts.raw_model_output || "";
      const parseReport = extractTerminalJson(rawOutput);
      job.artifacts.parse_report = parseReport.public;
      if (!parseReport.ok) {
        const err = new Error(parseReport.error || "Terminal JSON parse failed.");
        err.code = "TERMINAL_JSON_PARSE_FAILED";
        err.parse_report = parseReport.public;
        err.model_output_char_count = String(rawOutput).length;
        err.model_output_tail_preview = tailPreview(rawOutput);
        err.finish_reason = job.artifacts.model_meta?.finish_reason || undefined;
        err.provider_warnings = job.artifacts.model_meta?.provider_warnings || undefined;
        throw err;
      }
      job.artifacts.terminal_json = parseReport.value;
      appendEvent(job, NODE.TERMINAL_JSON_PARSE, "Terminal JSON parsed.");
      return;
    }

    case NODE.REPORT_RENDER: {
      setNode(job, NODE.REPORT_RENDER, NODE.VAULT_HANDOFF);
      const rendered = await renderReport({
        terminalJson: job.artifacts.terminal_json,
        runId: job.run_id,
        executionPayload: job.execution_payload,
        events: job.events
      });
      job.artifacts.html_report = rendered.html_report;
      job.artifacts.report_json = rendered.report_json;
      appendEvent(job, NODE.REPORT_RENDER, "Report rendered.");
      return;
    }

    case NODE.VAULT_HANDOFF: {
      setNode(job, NODE.VAULT_HANDOFF, NODE.COMPLETE);
      const vaultResult = await buildAndPushVaultHandoff({
        terminalJson: job.artifacts.terminal_json,
        runId: job.run_id,
        executionPayload: job.execution_payload,
        htmlReport: job.artifacts.html_report,
        events: job.events
      });
      job.artifacts.vault_assembly_handoff = vaultResult.vault_assembly_handoff;
      job.artifacts.vault_push_status = vaultResult.vault_push_status;
      if (vaultResult.vault_push_response) job.artifacts.vault_push_response = vaultResult.vault_push_response;
      if (vaultResult.vault_push_error) job.artifacts.vault_push_error = vaultResult.vault_push_error;
      appendEvent(job, NODE.VAULT_HANDOFF, "Vault handoff built.");
      return;
    }

    case NODE.COMPLETE: {
      completeJob(job);
      appendEvent(job, NODE.COMPLETE, "Monolith job complete.");
      return;
    }

    default: {
      const err = new Error(`Unknown monolith runtime node: ${job.next_node}`);
      err.code = "UNKNOWN_RUNTIME_NODE";
      throw err;
    }
  }
}

function createJobRecord({ executionPayload, debugRaw }) {
  const now = new Date().toISOString();
  const job = {
    run_id: executionPayload.run_id,
    mode: ACTIVE_RUNTIME,
    status: JOB_STATUS.QUEUED,
    created_at: now,
    updated_at: now,
    current_node: NODE.JOB_CREATED,
    next_node: NODE.PROMPT_BUNDLE_LOAD,
    execution_payload: executionPayload,
    debug_raw: debugRaw,
    events: [],
    artifacts: {},
    error: null,
    result: null
  };
  appendEvent(job, NODE.JOB_CREATED, "Monolith job created.");
  return job;
}

function setNode(job, currentNode, nextNode) {
  job.current_node = currentNode;
  job.next_node = nextNode;
  job.updated_at = new Date().toISOString();
}

function appendEvent(job, node, message) {
  job.events.push({ at: new Date().toISOString(), node, message });
  if (job.events.length > 200) job.events = job.events.slice(-200);
}

function markJobFailed(job, err) {
  job.status = JOB_STATUS.FAILED;
  job.updated_at = new Date().toISOString();
  job.error = {
    error: err?.code || err?.errorClass || "MONOLITH_RUN_FAILED",
    message: err?.message || String(err),
    model_attempts: err?.model_attempts || undefined,
    parse_report: err?.parse_report || undefined,
    model_output_char_count: err?.model_output_char_count || undefined,
    model_output_tail_preview: err?.model_output_tail_preview || undefined,
    finish_reason: err?.finish_reason || undefined,
    provider_warnings: err?.provider_warnings || undefined
  };
  appendEvent(job, job.current_node || job.next_node, `FAILED: ${job.error.message}`);
}

function completeJob(job) {
  job.status = JOB_STATUS.SUCCEEDED;
  job.current_node = NODE.COMPLETE;
  job.next_node = null;
  job.updated_at = new Date().toISOString();
  job.result = buildJobResult(job);
}

function buildJobResult(job) {
  return {
    ok: true,
    mode: ACTIVE_RUNTIME,
    run_id: job.run_id,
    source_mode: job.execution_payload.source_mode,
    terminal_json: job.artifacts.terminal_json,
    html_report: job.artifacts.html_report,
    report_json: job.artifacts.report_json,
    vault_assembly_handoff: job.artifacts.vault_assembly_handoff,
    vault_push_status: job.artifacts.vault_push_status,
    vault_push_response: job.artifacts.vault_push_response,
    vault_push_error: job.artifacts.vault_push_error,
    parse_report: job.artifacts.parse_report,
    model_meta: job.artifacts.model_meta,
    references_loaded: job.artifacts.references_loaded,
    raw_model_output: job.debug_raw ? job.artifacts.raw_model_output : undefined,
    events: job.events,
    runtime_ms: Date.now() - Date.parse(job.created_at)
  };
}

function publicJobView(job) {
  return {
    ok: job.status !== JOB_STATUS.FAILED,
    mode: ACTIVE_RUNTIME,
    run_id: job.run_id,
    status: job.status,
    current_node: job.current_node,
    next_node: job.next_node,
    created_at: job.created_at,
    updated_at: job.updated_at,
    source_mode: job.execution_payload?.source_mode,
    target_url: job.execution_payload?.target_url || null,
    error: job.error || undefined,
    events: job.events.slice(-40),
    result_ready: job.status === JOB_STATUS.SUCCEEDED,
    result_url: `/api/diligence/jobs/${encodeURIComponent(job.run_id)}/result`,
    advance_url: `/api/diligence/jobs/${encodeURIComponent(job.run_id)}/advance`
  };
}

function cleanupExpiredJobs() {
  const now = Date.now();
  for (const [runId, job] of jobs.entries()) {
    if (now - Date.parse(job.created_at) > RUN_TTL_MS) jobs.delete(runId);
  }
}

async function healthHandler(_req, res) {
  const promptStatus = await fileStatus(PROMPT_PATH);
  const registryKeyStatus = await fileStatus(REGISTRY_KEY_PATH);
  const registryYamlStatus = await fileStatus(REGISTRY_YAML_PATH);
  const registryRulesStatus = await fileStatus(REGISTRY_RULES_PATH);
  const vaultMapStatus = await fileStatus(VAULT_MAP_PATH);
  const rendererStatus = await fileStatus(path.join(__dirname, "lib", "renderer.js"));
  const vaultBridgeStatus = await fileStatus(path.join(__dirname, "lib", "vault-bridge.js"));

  res.json({
    ok: true,
    service: "interface-diligence-system",
    mode: ACTIVE_RUNTIME,
    active_diligence_runtime: ACTIVE_RUNTIME,
    architecture: "single_monolith_job_runtime_nodes",
    runtime_nodes: Object.values(NODE),
    prompt_loaded: promptStatus.exists,
    registry_key_loaded: registryKeyStatus.exists,
    registry_yaml_loaded: registryYamlStatus.exists,
    registry_evaluation_rules_loaded: registryRulesStatus.exists,
    vault_map_loaded: vaultMapStatus.exists,
    renderer_loaded: rendererStatus.exists,
    vault_bridge_loaded: vaultBridgeStatus.exists,
    active_jobs: activeJobs.size,
    stored_jobs: jobs.size,
    auto_start_default: AUTO_START_DEFAULT,
    key_buckets: publicBucketSnapshot(),
    model_tiers: MODEL_TIERS,
    gemini_timeout_ms: GEMINI_TIMEOUT_MS,
    gemini_max_output_tokens_configured: GEMINI_MAX_OUTPUT_TOKENS,
    gemini_max_output_tokens_sent: SEND_MAX_OUTPUT_TOKENS,
    gemini_max_output_tokens_policy: "sent_when_configured_unless_explicitly_disabled; provider rejection retries without blocking",
    gemini_finish_reason_max_tokens_blocks: false,
    gemini_terminal_json_validation_enabled: VALIDATE_MODEL_TERMINAL_JSON,
    gemini_grounding_response_mime_policy: "responseMimeType omitted when grounding/tools are enabled unless GEMINI_GROUNDING_RESPONSE_MIME_POLICY=send_with_tools",
    gemini_fetch_failed_blocks: false,
    express_json_limit: EXPRESS_JSON_LIMIT,
    vault_engine_configured: Boolean(VAULT_ENGINE_URL)
  });
}

async function loadPromptBundle() {
  const [monolith, registryKey, registryYaml, registryRules, vaultMap] = await Promise.all([
    readRequiredFile(PROMPT_PATH, "MONOLITH_PROMPT_MISSING"),
    readRequiredFile(REGISTRY_KEY_PATH, "REGISTRY_KEY_MISSING"),
    readRequiredFile(REGISTRY_YAML_PATH, "REGISTRY_YAML_MISSING"),
    readRequiredFile(REGISTRY_RULES_PATH, "REGISTRY_EVALUATION_RULES_MISSING"),
    readRequiredFile(VAULT_MAP_PATH, "VAULT_MAP_MISSING")
  ]);

  return {
    monolith,
    registryKey,
    registryYaml,
    registryRules,
    vaultMap,
    manifest: {
      monolith_prompt: relativePath(PROMPT_PATH),
      registry_key: relativePath(REGISTRY_KEY_PATH),
      registry_yaml: relativePath(REGISTRY_YAML_PATH),
      registry_evaluation_rules: relativePath(REGISTRY_RULES_PATH),
      vault_map: relativePath(VAULT_MAP_PATH)
    }
  };
}

function buildSystemPrompt(bundle) {
  return [
    bundle.monolith.trim(),
    "",
    "---",
    "# RUNTIME REFERENCE — REGISTRY_KEY_v3_0",
    bundle.registryKey.trim(),
    "",
    "---",
    "# RUNTIME REFERENCE — AI_THREAT_REGISTRY.yaml",
    bundle.registryYaml.trim(),
    "",
    "---",
    "# RUNTIME REFERENCE — REGISTRY_EVALUATION_RULES.csv",
    bundle.registryRules.trim(),
    "",
    "---",
    "# RUNTIME REFERENCE — VAULT_JS_CANONICAL_MAP_v1.md",
    bundle.vaultMap.trim()
  ].filter(Boolean).join("\n\n");
}

function buildUserPrompt(payload) {
  return `Execute one Interface Diligence monolith run using the execution payload below.\n\nRules for this request:\n- Run the locked monolith internally from Module I through Module XIV.\n- Use Gemini grounding only where the monolith authorizes it under Module VI and the selected source mode.\n- Emit exactly one terminal JSON object and no prose outside JSON.\n- Do not invent source material, evidence refs, registry rows, registry evaluation rules, or Vault fields.\n- Treat runtime references as named references only; do not create external dependencies not listed in the payload.\n\nEXECUTION_PAYLOAD:\n${JSON.stringify(payload, null, 2)}`;
}

function buildExecutionPayload(body) {
  const sourceMode = normalizeSourceMode(body.source_mode, body);
  const targetUrl = nullableString(body.target_url || body.url || body.target);
  const pastedPublicMaterial = nullableString(body.pasted_public_material || body.public_material || body.text);
  const syntheticDemoPayload = body.synthetic_demo_payload ?? null;

  if (sourceMode === "url" && !targetUrl) throw badRequest("target_url is required when source_mode=url.");
  if (sourceMode === "text" && !pastedPublicMaterial) throw badRequest("pasted_public_material is required when source_mode=text.");
  if (sourceMode === "url_plus_text" && !targetUrl && !pastedPublicMaterial) throw badRequest("target_url or pasted_public_material is required when source_mode=url_plus_text.");
  if (sourceMode === "synthetic_demo" && !syntheticDemoPayload && !pastedPublicMaterial) throw badRequest("synthetic_demo_payload or pasted_public_material is required when source_mode=synthetic_demo.");

  return {
    run_id: nullableString(body.run_id) || `run_${new Date().toISOString().replace(/[-:.TZ]/g, "")}_${crypto.randomUUID()}`,
    submitted_at: new Date().toISOString(),
    source_mode: sourceMode,
    target_url: targetUrl,
    pasted_public_material: pastedPublicMaterial,
    synthetic_demo_payload: syntheticDemoPayload,
    target_name: nullableString(body.target_name || body.company_name || body.company_name_candidate),
    registry_reference: {
      registry_key_ref: "REGISTRY_KEY_v3_0.md",
      registry_source_ref: "AI_THREAT_REGISTRY.yaml",
      registry_evaluation_rules_ref: "REGISTRY_EVALUATION_RULES.csv",
      expected_registry_row_count: 98
    },
    vault_reference: {
      vault_map_ref: "VAULT_JS_CANONICAL_MAP_v1.md",
      vault_handoff_expected: true
    },
    output_mode: nullableString(body.output_mode || body.format || body.response_format) || "screen_report_plus_vault"
  };
}

function normalizeSourceMode(raw, body) {
  const value = String(raw || "").trim().toLowerCase();
  if (["url", "text", "url_plus_text", "synthetic_demo"].includes(value)) return value;
  if (["url+text", "url-plus-text", "urlplus_text"].includes(value)) return "url_plus_text";
  if (["synthetic", "demo"].includes(value)) return "synthetic_demo";

  const hasUrl = Boolean(nullableString(body.target_url || body.url || body.target));
  const hasText = Boolean(nullableString(body.pasted_public_material || body.public_material || body.text));
  const hasSynthetic = Boolean(body.synthetic_demo_payload);

  if (hasSynthetic) return "synthetic_demo";
  if (hasUrl && hasText) return "url_plus_text";
  if (hasUrl) return "url";
  if (hasText) return "text";
  throw badRequest("source_mode could not be resolved. Use url, text, url_plus_text, or synthetic_demo.");
}

async function callGeminiWithRotation({ systemPrompt, userPrompt, allowGrounding, responseMimeType = "application/json", temperature = 0 }) {
  const bucketChain = resolveMonolithBucketChain({ allowGrounding });
  const attempts = [];
  let lastError = null;
  let attemptNumber = 0;

  for (let bucketIndex = 0; bucketIndex < bucketChain.length; bucketIndex += 1) {
    const bucket = bucketChain[bucketIndex];
    const hasFallbackBucket = bucketIndex < bucketChain.length - 1;

    if (!bucket.keys.length) {
      attempts.push(buildAttemptRecord({
        bucket,
        model: null,
        modelIndex: null,
        keyIndex: null,
        attemptNumber: ++attemptNumber,
        ok: false,
        error: "KEY_BUCKET_NOT_CONFIGURED",
        errorClass: ERROR_CLASSES.KEY_BUCKET_NOT_CONFIGURED,
        decision: hasFallbackBucket ? ROTATION_DECISIONS.FALLBACK_BUCKET : ROTATION_DECISIONS.TERMINAL_FAIL
      }));
      lastError = Object.assign(new Error(`KEY_BUCKET_NOT_CONFIGURED:${bucket.bucketName}`), { errorClass: ERROR_CLASSES.KEY_BUCKET_NOT_CONFIGURED });
      continue;
    }

    for (let modelIndex = 0; modelIndex < bucket.modelTiers.length; modelIndex += 1) {
      const modelTier = bucket.modelTiers[modelIndex];
      const model = modelTier.model;
      const effectiveGrounding = Boolean(allowGrounding && modelTier.search_grounding);
      let rotateModelImmediately = false;

      for (let keyIndex = 0; keyIndex < bucket.keys.length; keyIndex += 1) {
        const key = bucket.keys[keyIndex];
        const first = await executeGeminiAttempt({
          systemPrompt,
          userPrompt,
          responseMimeType,
          temperature,
          bucket,
          model,
          modelTier,
          modelIndex,
          key,
          keyIndex,
          attemptNumber: ++attemptNumber,
          allowGrounding: effectiveGrounding
        });
        attempts.push(first.attempt);
        if (first.ok) return buildGeminiSuccess(first, attempts);

        lastError = first.error;
        const classification = classifyGeminiError(first.error);
        const errorClass = classification.errorClass;

        if (shouldRetrySameKey({ errorClass, retryAfterSeconds: classification.retryAfterSeconds, keyIndex, keyCount: bucket.keys.length })) {
          first.attempt.decision = ROTATION_DECISIONS.RETRY_SAME_KEY_SAME_MODEL;
          const waitMs = retryDelayMs(classification.retryAfterSeconds);
          if (waitMs > 0) await sleep(waitMs);

          const retry = await executeGeminiAttempt({
            systemPrompt,
            userPrompt,
            responseMimeType,
            temperature,
            bucket,
            model,
            modelTier,
            modelIndex,
            key,
            keyIndex,
            attemptNumber: ++attemptNumber,
            allowGrounding: effectiveGrounding,
            retryOrdinal: 1
          });
          attempts.push(retry.attempt);
          if (retry.ok) return buildGeminiSuccess(retry, attempts);

          lastError = retry.error;
          const retryClass = classifyGeminiError(retry.error).errorClass;
          retry.attempt.decision = decideAfterFailedAttempt({
            errorClass: retryClass,
            keyIndex,
            keyCount: bucket.keys.length,
            hasMoreModels: modelIndex < bucket.modelTiers.length - 1,
            hasFallbackBucket
          });
          if (isTerminalError(retryClass)) throwFinalModelError(lastError, attempts);
          if (isModelSpecificError(retryClass)) {
            rotateModelImmediately = true;
            break;
          }
        } else {
          first.attempt.decision = decideAfterFailedAttempt({
            errorClass,
            keyIndex,
            keyCount: bucket.keys.length,
            hasMoreModels: modelIndex < bucket.modelTiers.length - 1,
            hasFallbackBucket
          });
          if (isTerminalError(errorClass)) throwFinalModelError(lastError, attempts);
          if (isModelSpecificError(errorClass)) {
            rotateModelImmediately = true;
            break;
          }
        }
      }

      if (rotateModelImmediately) continue;
    }

    const lastAttempt = attempts[attempts.length - 1];
    if (hasFallbackBucket && lastAttempt && !lastAttempt.ok && lastAttempt.decision !== ROTATION_DECISIONS.TERMINAL_FAIL) {
      lastAttempt.decision = ROTATION_DECISIONS.FALLBACK_BUCKET;
    }
  }

  throwFinalModelError(lastError || new Error("MODEL_POOL_FAILED:MONOLITH"), attempts);
}

async function executeGeminiAttempt({
  systemPrompt,
  userPrompt,
  responseMimeType,
  temperature,
  bucket,
  model,
  modelTier = null,
  modelIndex,
  key,
  keyIndex,
  attemptNumber,
  allowGrounding,
  retryOrdinal = 0
}) {
  const startedAt = Date.now();
  const attempt = buildAttemptRecord({
    bucket,
    model,
    modelTier,
    modelIndex,
    keyIndex,
    attemptNumber,
    ok: false,
    retryOrdinal,
    grounding: allowGrounding
  });

  try {
    const result = await callGeminiRest({
      key,
      model,
      systemPrompt,
      userPrompt,
      responseMimeType,
      temperature,
      allowGrounding,
      timeoutMs: GEMINI_TIMEOUT_MS
    });

    const validation = VALIDATE_MODEL_TERMINAL_JSON ? extractTerminalJson(result.text) : { ok: true, public: { validation_skipped: true } };
    if (!validation.ok) {
      const warningPrefix = result.providerWarnings?.length ? ` Provider warnings: ${result.providerWarnings.join(", ")}.` : "";
      throw createClassifiedGeminiError(
        `MODEL_JSON_PARSE_FAILED: ${validation.error || "Model returned non-parseable terminal JSON."}${warningPrefix}`,
        ERROR_CLASSES.MODEL_JSON_PARSE_FAILED,
        {
          finishReason: result.finishReason || null,
          providerWarnings: result.providerWarnings || [],
          usageMetadata: result.usageMetadata || null,
          modelOutputTokenLimitSent: result.modelOutputTokenLimitSent,
          responseMimeTypeRequested: result.responseMimeTypeRequested || null,
          responseMimeTypeSent: result.responseMimeTypeSent,
          responseMimeTypeOmittedForGrounding: result.responseMimeTypeOmittedForGrounding,
          modelOutputCharCount: String(result.text || "").length,
          modelOutputTailPreview: tailPreview(result.text),
          parseReport: validation.public || null
        }
      );
    }

    attempt.ok = true;
    attempt.latency_ms = Date.now() - startedAt;
    attempt.decision = ROTATION_DECISIONS.SUCCESS;
    attempt.usage_metadata = result.usageMetadata || null;
    attempt.finish_reason = result.finishReason || null;
    attempt.provider_warnings = result.providerWarnings || [];
    attempt.model_output_token_limit_sent = result.modelOutputTokenLimitSent;
    attempt.response_mime_type_requested = result.responseMimeTypeRequested || null;
    attempt.response_mime_type_sent = Boolean(result.responseMimeTypeSent);
    attempt.response_mime_type_omitted_for_grounding = Boolean(result.responseMimeTypeOmittedForGrounding);
    attempt.terminal_json_validated = Boolean(VALIDATE_MODEL_TERMINAL_JSON);
    attempt.terminal_json_parse_strategy = validation.public?.strategy || null;

    return { ok: true, text: result.text, meta: { ...result, terminalJsonValidation: validation.public || null }, attempt };
  } catch (err) {
    const classification = classifyGeminiError(err);
    attempt.ok = false;
    attempt.latency_ms = Date.now() - startedAt;
    attempt.error = err?.message || String(err);
    attempt.error_class = classification.errorClass;
    attempt.retry_after_seconds = classification.retryAfterSeconds;
    attempt.finish_reason = err?.finishReason || null;
    attempt.provider_warnings = err?.providerWarnings || [];
    attempt.usage_metadata = err?.usageMetadata || null;
    attempt.model_output_token_limit_sent = err?.modelOutputTokenLimitSent;
    attempt.response_mime_type_requested = err?.responseMimeTypeRequested || undefined;
    attempt.response_mime_type_sent = err?.responseMimeTypeSent;
    attempt.response_mime_type_omitted_for_grounding = err?.responseMimeTypeOmittedForGrounding || undefined;
    attempt.model_output_char_count = err?.modelOutputCharCount || undefined;
    attempt.model_output_tail_preview = err?.modelOutputTailPreview || undefined;
    attempt.parse_report = err?.parseReport || undefined;
    return { ok: false, error: err, attempt };
  }
}

function googleSearchToolPayload() {
  return GOOGLE_SEARCH_TOOL_FIELD === "google_search" ? { google_search: {} } : { googleSearch: {} };
}

function shouldRetryWithoutMaxOutputTokens({ response, payload, modelOutputTokenLimitSent }) {
  if (!modelOutputTokenLimitSent) return false;
  if (Number(response?.status || 0) !== 400) return false;
  const message = String(payload?.error?.message || "").toLowerCase();
  return message.includes("maxoutputtokens") || message.includes("max output token") || message.includes("maximum output token") || message.includes("output tokens");
}

async function callGeminiRest({ key, model, systemPrompt, userPrompt, responseMimeType, temperature, allowGrounding, timeoutMs }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
    const requestedResponseMimeType = nullableString(responseMimeType);
    const omitResponseMimeTypeForGrounding = Boolean(
      allowGrounding &&
      requestedResponseMimeType &&
      GROUNDING_RESPONSE_MIME_POLICY !== "send_with_tools"
    );
    const responseMimeTypeToSend = omitResponseMimeTypeForGrounding ? null : requestedResponseMimeType;

    const generationConfig = { temperature };
    if (responseMimeTypeToSend) generationConfig.responseMimeType = responseMimeTypeToSend;

    const maxOutputTokensConfigured = Boolean(GEMINI_MAX_OUTPUT_TOKENS);
    const shouldSendMaxOutputTokens = Boolean(SEND_MAX_OUTPUT_TOKENS && GEMINI_MAX_OUTPUT_TOKENS);
    if (shouldSendMaxOutputTokens) generationConfig.maxOutputTokens = GEMINI_MAX_OUTPUT_TOKENS;

    const baseBody = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig
    };
    if (allowGrounding) baseBody.tools = [googleSearchToolPayload()];

    let providerWarnings = [];
    if (omitResponseMimeTypeForGrounding) {
      providerWarnings.push("GEMINI_RESPONSE_MIME_TYPE_OMITTED_FOR_GROUNDING_TOOL_COMPATIBILITY");
    }

    let modelOutputTokenLimitSent = Boolean(generationConfig.maxOutputTokens);
    let responseMimeTypeSent = Boolean(generationConfig.responseMimeType);
    let payload = null;

    let response = await postGeminiGenerateContent({ endpoint, body: baseBody, signal: controller.signal });
    payload = response.payload;

    if (!response.ok && shouldRetryWithoutResponseMimeType({ payload, allowGrounding, responseMimeTypeSent })) {
      providerWarnings.push("GEMINI_TOOL_RESPONSE_MIME_UNSUPPORTED_RETRIED_WITHOUT_RESPONSE_MIME_TYPE");
      const fallbackBody = JSON.parse(JSON.stringify(baseBody));
      delete fallbackBody.generationConfig.responseMimeType;
      responseMimeTypeSent = false;
      response = await postGeminiGenerateContent({ endpoint, body: fallbackBody, signal: controller.signal });
      payload = response.payload;
    }

    if (!response.ok && shouldRetryWithoutMaxOutputTokens({ response, payload, modelOutputTokenLimitSent })) {
      providerWarnings.push("GEMINI_MAX_OUTPUT_TOKENS_CONFIG_REJECTED_RETRIED_WITHOUT_LIMIT");
      const fallbackBody = JSON.parse(JSON.stringify(baseBody));
      delete fallbackBody.generationConfig.maxOutputTokens;
      if (!responseMimeTypeSent) delete fallbackBody.generationConfig.responseMimeType;
      modelOutputTokenLimitSent = false;
      response = await postGeminiGenerateContent({ endpoint, body: fallbackBody, signal: controller.signal });
      payload = response.payload;
    }

    if (!response.ok) throw createGeminiHttpError({ response, payload });

    const candidate = payload?.candidates?.[0] || {};
    const finishReason = candidate?.finishReason || null;
    const normalizedFinishReason = String(finishReason || "").toUpperCase();
    const text = candidate?.content?.parts?.map((part) => part.text || "").join("") || "";

    if (["SAFETY", "RECITATION", "BLOCKLIST", "PROHIBITED_CONTENT", "SPII"].includes(normalizedFinishReason)) {
      throw createClassifiedGeminiError(`Gemini response blocked: ${finishReason}`, ERROR_CLASSES.SAFETY_BLOCKED, { finishReason, payload });
    }

    if (normalizedFinishReason === "MAX_TOKENS") {
      providerWarnings.push("GEMINI_FINISH_REASON_MAX_TOKENS_NON_BLOCKING");
    }
    if (maxOutputTokensConfigured && !modelOutputTokenLimitSent) {
      providerWarnings.push("GEMINI_MAX_OUTPUT_TOKENS_CONFIGURED_BUT_NOT_SENT_NON_BLOCKING");
    }

    return {
      text,
      usageMetadata: payload?.usageMetadata || null,
      finishReason,
      providerWarnings,
      modelOutputTokenLimitSent,
      maxOutputTokensConfigured: GEMINI_MAX_OUTPUT_TOKENS || null,
      responseMimeTypeRequested: requestedResponseMimeType || null,
      responseMimeTypeSent,
      responseMimeTypeOmittedForGrounding: omitResponseMimeTypeForGrounding
    };
  } catch (err) {
    if (err?.name === "AbortError") throw createClassifiedGeminiError("GEMINI_TIMEOUT_ABORTED", ERROR_CLASSES.TIMEOUT, { cause: err });
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

async function postGeminiGenerateContent({ endpoint, body, signal }) {
  const response = await fetch(endpoint, {
    method: "POST",
    signal,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => ({}));
  response.payload = payload;
  return response;
}

function shouldRetryWithoutResponseMimeType({ payload, allowGrounding, responseMimeTypeSent }) {
  if (!allowGrounding || !responseMimeTypeSent) return false;
  const message = String(payload?.error?.message || "").toLowerCase();
  return message.includes("tool use with a response mime type") ||
    (message.includes("response mime type") && message.includes("tool"));
}

function resolveMonolithBucketChain({ allowGrounding }) {
  const seenKeys = new Set();

  return BUCKET_ORDER.map((bucketName) => {
    const keys = uniqueCsv(process.env[bucketName]).filter((key) => {
      if (seenKeys.has(key)) return false;
      seenKeys.add(key);
      return true;
    });
    return {
      bucketName,
      keys,
      modelTiers: MODEL_TIERS,
      grounding: Boolean(allowGrounding)
    };
  });
}

function extractTerminalJson(text) {
  const original = String(text || "").trim();
  const attempts = [];
  const candidates = [
    { strategy: "raw", text: original },
    { strategy: "strip_markdown_fence", text: stripMarkdownFence(original) },
    { strategy: "balanced_object_extract", text: extractFirstBalancedJsonObject(original) }
  ].filter((candidate) => candidate.text);

  for (const candidate of candidates) {
    const parsed = tryParseJson(candidate.text);
    attempts.push({ strategy: candidate.strategy, ok: parsed.ok, error: parsed.error || null });
    if (parsed.ok) return { ok: true, value: parsed.value, public: { strategy: candidate.strategy, repair_applied: candidate.strategy !== "raw", attempts } };

    const repaired = repairJsonShapeOnly(candidate.text);
    if (repaired !== candidate.text) {
      const repairParsed = tryParseJson(repaired);
      attempts.push({ strategy: `${candidate.strategy}+shape_repair`, ok: repairParsed.ok, error: repairParsed.error || null });
      if (repairParsed.ok) return { ok: true, value: repairParsed.value, public: { strategy: `${candidate.strategy}+shape_repair`, repair_applied: true, attempts } };
    }
  }

  return { ok: false, error: attempts.at(-1)?.error || "No parseable terminal JSON object found.", public: { attempts } };
}

function tryParseJson(value) {
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { ok: false, error: "Terminal JSON must be one object root." };
    const rootCheck = validateTerminalRoot(parsed);
    if (!rootCheck.ok) return { ok: false, error: rootCheck.error };
    return { ok: true, value: parsed };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
}

function validateTerminalRoot(parsed) {
  const keys = Object.keys(parsed || {});
  if (!Object.prototype.hasOwnProperty.call(parsed, "final_output_handoff")) {
    return { ok: false, error: "TERMINAL_ROOT_INVALID: final_output_handoff root missing." };
  }
  if (keys.length !== 1) {
    return { ok: false, error: `TERMINAL_ROOT_INVALID: expected only final_output_handoff root, received ${keys.join(",")}.` };
  }
  if (!parsed.final_output_handoff || typeof parsed.final_output_handoff !== "object" || Array.isArray(parsed.final_output_handoff)) {
    return { ok: false, error: "TERMINAL_ROOT_INVALID: final_output_handoff must be an object." };
  }
  return { ok: true };
}

function stripMarkdownFence(value) {
  return String(value || "").replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
}

function extractFirstBalancedJsonObject(value) {
  const text = String(value || "");
  const start = text.indexOf("{");
  if (start < 0) return "";
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === "{") depth += 1;
    if (ch === "}") depth -= 1;
    if (depth === 0) return text.slice(start, i + 1).trim();
  }
  return "";
}

function repairJsonShapeOnly(value) {
  return String(value || "").replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").replace(/,\s*([}\]])/g, "$1").trim();
}

async function renderReport({ terminalJson, runId, executionPayload = null, events = [] }) {
  const renderer = await optionalModule("lib/renderer.js");
  const renderFn = renderer?.renderDiligenceReport || renderer?.renderReport || renderer?.default;
  if (typeof renderFn === "function") {
    const rendered = await renderFn({ terminalJson, runId, executionPayload, events });
    return { html_report: rendered?.html_report || rendered?.html || fallbackHtmlReport(terminalJson), report_json: rendered?.report_json || rendered?.json || terminalJson };
  }
  return { html_report: fallbackHtmlReport(terminalJson), report_json: terminalJson };
}

async function buildAndPushVaultHandoff({ terminalJson, runId, executionPayload = null, htmlReport = null, events = [] }) {
  const bridge = await optionalModule("lib/vault-bridge.js");
  const buildFn = bridge?.buildVaultHandoff || bridge?.buildVaultAssemblyHandoff || bridge?.default;
  const pushFn = bridge?.pushVaultHandoff;
  const vaultHandoff = typeof buildFn === "function" ? await buildFn({ terminalJson, runId, executionPayload, htmlReport, events }) : fallbackVaultHandoff(terminalJson);

  if (typeof pushFn === "function") return await pushFn({ vault_assembly_handoff: vaultHandoff, vaultEngineUrl: VAULT_ENGINE_URL, vaultEngineToken: VAULT_ENGINE_TOKEN, runId });
  if (VAULT_ENGINE_URL && vaultHandoff) return await pushVaultDirect({ vault_assembly_handoff: vaultHandoff, runId });
  return { vault_assembly_handoff: vaultHandoff, vault_push_status: VAULT_ENGINE_URL ? "VAULT_BRIDGE_NOT_AVAILABLE" : "VAULT_ENGINE_NOT_CONFIGURED" };
}

async function pushVaultDirect({ vault_assembly_handoff, runId }) {
  try {
    const response = await fetch(VAULT_ENGINE_URL, {
      method: "POST",
      headers: { "content-type": "application/json", ...(VAULT_ENGINE_TOKEN ? { authorization: `Bearer ${VAULT_ENGINE_TOKEN}` } : {}) },
      body: JSON.stringify({ run_id: runId, vault_assembly_handoff })
    });
    const body = await response.json().catch(() => ({}));
    return { vault_assembly_handoff, vault_push_status: response.ok ? "PUSHED" : "PUSH_FAILED", vault_push_response: body };
  } catch (err) {
    return { vault_assembly_handoff, vault_push_status: "PUSH_FAILED", vault_push_error: err?.message || String(err) };
  }
}

function fallbackVaultHandoff(terminalJson) {
  const handoff = terminalJson?.final_output_handoff?.vault_assembler_handoff || terminalJson?.vault_assembler_handoff;
  if (handoff) return handoff;
  return {
    status: "VAULT_HANDOFF_NOT_PRESENT",
    boundary: "Fallback wrapper only. No Vault fields were derived by server.",
    source_object: "terminal_json",
    vault_payload: terminalJson?.final_output_handoff?.vault_payload || null,
    vault_prefill_suggestions: terminalJson?.final_output_handoff?.vault_prefill_suggestions || [],
    vault_confirmation_questions: terminalJson?.final_output_handoff?.vault_confirmation_questions || [],
    assembly_handoff_intake: terminalJson?.final_output_handoff?.assembly_handoff_intake || null
  };
}

function fallbackHtmlReport(terminalJson) {
  const handoff = terminalJson?.final_output_handoff || terminalJson;
  const title = handoff?.run_meta?.target_name || handoff?.input_manifest?.target_url || "Interface Diligence Report";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>body{margin:0;background:#f6f4ef;color:#1d1d1f;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.55}main{width:min(1080px,calc(100% - 32px));margin:32px auto;background:#fff;border:1px solid #ddd7cc;border-radius:20px;padding:28px;box-shadow:0 18px 45px rgba(31,39,54,.08)}h1{margin-top:0}pre{white-space:pre-wrap;overflow:auto;padding:16px;border-radius:14px;background:#151923;color:#eef2f7;font-size:12px}.badge{display:inline-block;padding:6px 10px;border-radius:999px;background:#ede7da;font-weight:800;font-size:12px;text-transform:uppercase}</style></head><body><main><span class="badge">monolith fallback renderer</span><h1>${escapeHtml(title)}</h1><p>The dedicated renderer was not available. Showing terminal JSON.</p><pre>${escapeHtml(JSON.stringify(terminalJson, null, 2))}</pre></main></body></html>`;
}

async function optionalModule(relativePath) {
  const fullPath = path.join(__dirname, relativePath);
  try { await fs.access(fullPath); return await import(pathToFileURL(fullPath).href); }
  catch (_err) { return null; }
}

function buildGeminiSuccess(result, attempts) {
  const last = result.attempt;
  return {
    text: result.text,
    meta: {
      bucket_name: last.bucket_name,
      model: last.model,
      key_index: last.key_index,
      key_alias: last.key_alias,
      key_fingerprint: last.key_fingerprint,
      grounding_requested: last.grounding_requested,
      fallback_used: attempts.length > 1,
      gemini_timeout_ms: GEMINI_TIMEOUT_MS,
      gemini_max_output_tokens: SEND_MAX_OUTPUT_TOKENS ? GEMINI_MAX_OUTPUT_TOKENS : null,
      model_output_token_limit_sent: Boolean(last.model_output_token_limit_sent),
      response_mime_type_requested: last.response_mime_type_requested || null,
      response_mime_type_sent: Boolean(last.response_mime_type_sent),
      response_mime_type_omitted_for_grounding: Boolean(last.response_mime_type_omitted_for_grounding),
      usage_metadata: last.usage_metadata || null,
      finish_reason: last.finish_reason || null,
      provider_warnings: last.provider_warnings || [],
      terminal_json_validation: result.meta?.terminalJsonValidation || null,
      model_attempts: attempts,
      model_tiers: MODEL_TIERS
    }
  };
}

function buildAttemptRecord({ bucket, model, modelTier = null, modelIndex, keyIndex, attemptNumber, ok, error = null, errorClass = null, decision = null, retryOrdinal = 0, grounding = bucket?.grounding }) {
  return {
    bucket_name: bucket?.bucketName || null,
    model,
    model_index: Number.isFinite(modelIndex) ? modelIndex + 1 : null,
    model_role: modelTier?.role || null,
    model_search_grounding_policy: Boolean(modelTier?.search_grounding),
    key_index: Number.isFinite(keyIndex) ? keyIndex + 1 : null,
    key_alias: Number.isFinite(keyIndex) && bucket?.bucketName ? `${bucket.bucketName}_${keyIndex + 1}` : null,
    key_fingerprint: Number.isFinite(keyIndex) && bucket?.keys?.[keyIndex] ? fingerprint(bucket.keys[keyIndex]) : null,
    attempt_number: attemptNumber,
    retry_ordinal: retryOrdinal,
    ok,
    error,
    error_class: errorClass,
    grounding_requested: Boolean(grounding),
    decision
  };
}

function publicBucketSnapshot() {
  return Object.fromEntries(BUCKET_ORDER.map((bucketName) => {
    const keys = uniqueCsv(process.env[bucketName]);
    return [bucketName, { configured: keys.length > 0, key_count: keys.length, expected_key_count: BUCKET_EXPECTED_COUNTS[bucketName] || null, key_aliases: keys.map((_key, index) => `${bucketName}_${index + 1}`) }];
  }));
}

function hasAnyGeminiKey() { return BUCKET_ORDER.some((bucketName) => uniqueCsv(process.env[bucketName]).length > 0); }

function classifyGeminiError(err) {
  if (err?.errorClass) return { errorClass: err.errorClass, retryAfterSeconds: err.retryAfterSeconds ?? extractRetryAfterSeconds(err) };
  const message = String(err?.message || err || "");
  const lower = message.toLowerCase();
  const status = Number(err?.status || err?.httpStatus || 0);
  const retryAfterSeconds = extractRetryAfterSeconds(err);
  if (status === 401 || lower.includes("api key not valid") || lower.includes("unauthorized") || lower.includes("invalid api key")) return classified(ERROR_CLASSES.KEY_INVALID, retryAfterSeconds);
  if (status === 403 || lower.includes("billing") || lower.includes("permission") || lower.includes("project blocked") || lower.includes("permission denied")) return classified(ERROR_CLASSES.PROJECT_BLOCKED, retryAfterSeconds);
  if (status === 429 || lower.includes("quota") || lower.includes("rate limit") || lower.includes("resource exhausted")) return classified(ERROR_CLASSES.QUOTA_EXHAUSTED, retryAfterSeconds);
  if (status === 404 || lower.includes("model not found") || lower.includes("not found for api version") || lower.includes("is not found")) return classified(ERROR_CLASSES.MODEL_NOT_FOUND, retryAfterSeconds);
  if (status === 400 && (lower.includes("tool") || lower.includes("google_search") || lower.includes("googlesearch") || lower.includes("grounding"))) return classified(ERROR_CLASSES.TOOL_UNSUPPORTED, retryAfterSeconds);
  if (status === 400 || status === 413 || lower.includes("context") || lower.includes("token limit") || lower.includes("too large") || lower.includes("invalid argument") || lower.includes("malformed")) return classified(ERROR_CLASSES.INPUT_OR_PROMPT_INVALID, retryAfterSeconds);
  if ([408, 499].includes(status) || lower.includes("timeout") || lower.includes("timed out") || lower.includes("aborted")) return classified(ERROR_CLASSES.TIMEOUT, retryAfterSeconds);
  if (lower.includes("fetch failed") || lower.includes("network") || lower.includes("econnreset") || lower.includes("socket") || lower.includes("und_err") || lower.includes("terminated")) return classified(ERROR_CLASSES.UNKNOWN_RETRYABLE, retryAfterSeconds);
  if ([500, 502, 503, 504].includes(status) || lower.includes("unavailable") || lower.includes("internal") || lower.includes("overloaded") || lower.includes("server error")) return classified(ERROR_CLASSES.PROVIDER_5XX, retryAfterSeconds);
  if (lower.includes("json parse")) return classified(ERROR_CLASSES.MODEL_JSON_PARSE_FAILED, retryAfterSeconds);
  if (lower.includes("safety") || lower.includes("blocked") || lower.includes("prohibited")) return classified(ERROR_CLASSES.SAFETY_BLOCKED, retryAfterSeconds);
  if (lower.includes("retry")) return classified(ERROR_CLASSES.UNKNOWN_RETRYABLE, retryAfterSeconds);
  return classified(ERROR_CLASSES.UNKNOWN_TERMINAL, retryAfterSeconds);
}

function shouldRetrySameKey({ errorClass, retryAfterSeconds = null, keyIndex = 0, keyCount = 0 }) {
  if ([ERROR_CLASSES.PROVIDER_5XX, ERROR_CLASSES.TIMEOUT, ERROR_CLASSES.UNKNOWN_RETRYABLE].includes(errorClass)) return true;
  if ([ERROR_CLASSES.QUOTA_EXHAUSTED, ERROR_CLASSES.RATE_LIMITED].includes(errorClass)) return Number.isFinite(Number(retryAfterSeconds)) && Number(retryAfterSeconds) <= 20 && keyIndex >= keyCount - 1;
  return false;
}

function decideAfterFailedAttempt({ errorClass, keyIndex, keyCount, hasMoreModels, hasFallbackBucket }) {
  if (isTerminalError(errorClass)) return ROTATION_DECISIONS.TERMINAL_FAIL;
  if (isModelSpecificError(errorClass)) return hasMoreModels ? ROTATION_DECISIONS.ROTATE_MODEL_SAME_BUCKET : hasFallbackBucket ? ROTATION_DECISIONS.FALLBACK_BUCKET : ROTATION_DECISIONS.TERMINAL_FAIL;
  if (keyIndex < keyCount - 1) return ROTATION_DECISIONS.ROTATE_KEY_SAME_MODEL;
  if (hasMoreModels) return ROTATION_DECISIONS.ROTATE_MODEL_SAME_BUCKET;
  if (hasFallbackBucket) return ROTATION_DECISIONS.FALLBACK_BUCKET;
  return ROTATION_DECISIONS.TERMINAL_FAIL;
}

function isModelSpecificError(errorClass) { return [ERROR_CLASSES.MODEL_NOT_FOUND, ERROR_CLASSES.MODEL_JSON_PARSE_FAILED, ERROR_CLASSES.TOOL_UNSUPPORTED].includes(errorClass); }
function isTerminalError(errorClass) { return [ERROR_CLASSES.SAFETY_BLOCKED, ERROR_CLASSES.INPUT_OR_PROMPT_INVALID, ERROR_CLASSES.UNKNOWN_TERMINAL].includes(errorClass); }
function throwFinalModelError(lastError, attempts) {
  const err = lastError || new Error("MODEL_POOL_FAILED:MONOLITH");
  err.model_attempts = attempts;
  if (attempts?.length) {
    const lastAttempt = attempts[attempts.length - 1];
    err.model_output_char_count = lastAttempt?.model_output_char_count || undefined;
    err.model_output_tail_preview = lastAttempt?.model_output_tail_preview || undefined;
    err.finish_reason = lastAttempt?.finish_reason || undefined;
    err.provider_warnings = lastAttempt?.provider_warnings || undefined;
    err.parse_report = lastAttempt?.parse_report || undefined;
  }
  throw err;
}

function createGeminiHttpError({ response, payload }) {
  const message = payload?.error?.message || `GEMINI_HTTP_${response.status}`;
  const err = new Error(message);
  err.status = response.status;
  err.httpStatus = response.status;
  err.statusText = response.statusText;
  err.payload = payload;
  err.retryAfterHeader = response.headers?.get?.("retry-after") || null;
  const classifiedError = classifyGeminiError(err);
  err.errorClass = classifiedError.errorClass;
  err.retryAfterSeconds = classifiedError.retryAfterSeconds;
  return err;
}

function createClassifiedGeminiError(message, errorClass, extra = {}) { const err = new Error(message); err.errorClass = errorClass; Object.assign(err, extra); return err; }

function extractRetryAfterSeconds(err) {
  if (Number.isFinite(Number(err?.retryAfterSeconds))) return Number(err.retryAfterSeconds);
  const retryAfterHeader = Number(err?.retryAfterHeader);
  if (Number.isFinite(retryAfterHeader) && retryAfterHeader >= 0) return retryAfterHeader;
  const message = String(err?.message || err || "");
  const retryMatch = message.match(/retry\s+in\s+([0-9]+(?:\.[0-9]+)?)\s*s/i);
  if (retryMatch) return Number(retryMatch[1]);
  return null;
}

function retryDelayMs(retryAfterSeconds) {
  const seconds = Number(retryAfterSeconds);
  if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 20) return 0;
  return Math.ceil(seconds * 1000) + 250;
}

function classified(errorClass, retryAfterSeconds = null) { return { errorClass, retryAfterSeconds }; }
function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function readRequiredFile(filePath, code) {
  try { return await fs.readFile(filePath, "utf8"); }
  catch (err) { const error = new Error(`${code}: ${relativePath(filePath)} could not be loaded.`); error.code = code; error.cause = err; throw error; }
}

async function readOptionalFile(filePath) { try { return await fs.readFile(filePath, "utf8"); } catch (_err) { return ""; } }
async function fileStatus(filePath) { try { const stat = await fs.stat(filePath); return { exists: true, bytes: stat.size }; } catch (_err) { return { exists: false, bytes: 0 }; } }
function relativePath(filePath) { return path.relative(__dirname, filePath).replace(/\\/g, "/"); }
function wantsDebugRaw(req) { return DEBUG_RAW_DEFAULT || req?.body?.debug_raw === true || String(req?.query?.debug_raw || "").toLowerCase() === "true"; }
function nullableString(value) { const text = String(value ?? "").trim(); return text ? text : null; }
function uniqueCsv(value) { return Array.from(new Set(String(value || "").split(",").map((x) => x.trim()).filter(Boolean))); }
function resolveSendMaxOutputTokens(raw, configuredValue) {
  const value = String(raw ?? "").trim().toLowerCase();
  if (["false", "0", "no", "off", "disabled"].includes(value)) return false;
  if (["true", "1", "yes", "on", "enabled"].includes(value)) return true;
  return Boolean(configuredValue);
}
function tailPreview(value, maxChars = MODEL_OUTPUT_TAIL_PREVIEW_CHARS) {
  const text = String(value || "");
  const limit = Number.isFinite(Number(maxChars)) && Number(maxChars) > 0 ? Number(maxChars) : 1200;
  return text.length > limit ? text.slice(-limit) : text;
}
function positiveIntOrNull(value) { const num = Number(value); return Number.isFinite(num) && num > 0 ? Math.floor(num) : null; }
function fingerprint(value) { return crypto.createHash("sha256").update(String(value || "")).digest("hex").slice(0, 12); }
function badRequest(message) { const err = new Error(message); err.code = "BAD_REQUEST"; return err; }
function statusForError(err) { if (err?.code === "BAD_REQUEST") return 400; if (["MONOLITH_PROMPT_MISSING", "REGISTRY_KEY_MISSING", "REGISTRY_YAML_MISSING", "REGISTRY_EVALUATION_RULES_MISSING", "VAULT_MAP_MISSING"].includes(err?.code)) return 500; return 500; }
function escapeHtml(value) { return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
