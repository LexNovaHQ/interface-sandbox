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

const FINAL_TERMINAL_ROOT_KEY = "final_output_handoff";
const M6_URL_FETCH_MANIFEST_ROOT_KEY = "m6_url_fetch_manifest";
const M6_FETCH_FULFILLMENT_ROOT_KEY = "m6_fetch_fulfillment";
const M6_MANIFEST_MODEL_TIERS = Object.freeze(MODEL_TIERS.filter((tier) => tier.search_grounding));
const M6_FETCH_TIMEOUT_MS = Number(process.env.M6_FETCH_TIMEOUT_MS || 30000);
const M6_FETCH_USER_AGENT = String(process.env.M6_FETCH_USER_AGENT || "InterfaceDiligenceMonolith/1.0 (+https://interface-diligence-system)").trim();
const M6_KNOWN_PATH_BANK = Object.freeze({
  TARGET_FAMILY: Object.freeze({
    T0_ROOT: Object.freeze(["/"]),
    T1_IDENTITY: Object.freeze(["/about", "/about-us", "/company", "/our-company", "/who-we-are"]),
    T2_LEGAL_IDENTITY: Object.freeze(["/legal", "/legal-notice", "/imprint", "/contact", "/contact-us"]),
    T3_OPERATOR_ENTITY: Object.freeze(["/privacy", "/terms", "/dpa", "/legal"]),
    T4_SUPPORTING_IDENTITY: Object.freeze(["/team", "/careers", "/newsroom", "/press"])
  }),
  PRODUCT_FAMILY: Object.freeze({
    P0_PRODUCT_ROOT: Object.freeze(["/product", "/products", "/platform"]),
    P1_PRODUCT_SLUG: Object.freeze(["/product/{slug}", "/products/{slug}", "/#/product/{slug}", "/#/products/{slug}"]),
    P2_PLATFORM_FEATURE_SOLUTION: Object.freeze(["/platform", "/platform/{slug}", "/features", "/features/{slug}", "/solutions", "/solutions/{slug}", "/#/platform/{slug}", "/#/features/{slug}", "/#/solutions/{slug}"]),
    P3_AI_CAPABILITY_TECHNICAL: Object.freeze(["/models", "/models/{slug}", "/agents", "/agents/{slug}", "/assistant", "/assistants", "/studio", "/api", "/apis", "/developer", "/developers", "/docs", "/integrations", "/connectors", "/actions", "/workflows", "/automation", "/search", "/knowledge", "/vault"]),
    P4_USE_CASE_INDUSTRY: Object.freeze(["/use-cases", "/use-case/{slug}", "/industries", "/industry/{slug}", "/customers"]),
    P5_ENTERPRISE_PRICING: Object.freeze(["/pricing", "/enterprise", "/contact-sales", "/plans"])
  }),
  LEGAL_FAMILY: Object.freeze({
    L1_CORE_TERMS_PRIVACY: Object.freeze(["/terms", "/terms-of-use", "/terms-of-service", "/terms-and-conditions", "/legal/terms", "/policies/terms-of-use", "/privacy", "/privacy-policy", "/legal/privacy", "/policies/privacy-policy", "/eula"]),
    L2_B2B_CONTRACTING: Object.freeze(["/dpa", "/data-processing-agreement", "/legal/dpa", "/legal/data-processing-agreement", "/policies/data-processing-addendum", "/aup", "/acceptable-use", "/acceptable-use-policy", "/legal/acceptable-use-policy", "/sla", "/service-level-agreement", "/service-credit-terms", "/platform-agreement", "/customer-agreement"]),
    L3_AI_USAGE_GOVERNANCE: Object.freeze(["/usage-policy", "/acceptable-use-policy", "/content-policy", "/ai-policy", "/responsible-ai", "/model-policy", "/safety-policy"]),
    L4_PRIVACY_ADJACENT_NOTICES: Object.freeze(["/cookie-policy", "/cookies", "/privacy-center", "/do-not-sell", "/data-privacy-framework", "/gdpr", "/ccpa"]),
    L5_LEGAL_HUB_HOSTED: Object.freeze(["/legal", "/legal-center", "/legal-hub", "/policies", "/terms-and-policies", "/trust", "/trust-center"]),
    L6_ENTITY_NOTICE: Object.freeze(["/legal-notice", "/imprint", "/contact", "/controller"])
  }),
  DATA_FAMILY: Object.freeze({
    D1_SECURITY_TRUST: Object.freeze(["/security", "/security-center", "/data-security", "/trust", "/trust-center", "/compliance", "/compliance-center", "/soc-2", "/iso-27001"]),
    D2_SUBPROCESSOR_PRIVACY_CENTER: Object.freeze(["/subprocessors", "/subprocessor", "/privacy-center", "/data-protection", "/gdpr", "/dpa", "/data-processing-agreement"]),
    D3_DATA_GOVERNANCE_CONTROLS: Object.freeze(["/enterprise-privacy", "/customer-data", "/data-processing", "/data-residency", "/retention", "/deletion", "/data-export", "/data-deletion"]),
    D4_DOCS_API_DATA_FLOW: Object.freeze(["/docs", "/developer", "/developers", "/api", "/api-reference", "/integrations", "/connectors", "/webhooks", "/actions", "/authentication", "/audit-logs", "/permissions"]),
    D5_AI_SAFETY_TRANSPARENCY: Object.freeze(["/responsible-ai", "/ai-policy", "/ai-transparency", "/transparency", "/safety", "/model-card", "/model-cards", "/model-details", "/usage-policy"])
  })
});
const M6_PRIMARY_KNOWN_PATH_SUBFAMILIES = Object.freeze({
  TARGET_FAMILY: Object.freeze(["T0_ROOT", "T1_IDENTITY", "T2_LEGAL_IDENTITY"]),
  PRODUCT_FAMILY: Object.freeze(["P0_PRODUCT_ROOT", "P2_PLATFORM_FEATURE_SOLUTION", "P3_AI_CAPABILITY_TECHNICAL"]),
  LEGAL_FAMILY: Object.freeze(["L1_CORE_TERMS_PRIVACY", "L2_B2B_CONTRACTING", "L3_AI_USAGE_GOVERNANCE", "L5_LEGAL_HUB_HOSTED"]),
  DATA_FAMILY: Object.freeze(["D1_SECURITY_TRUST", "D2_SUBPROCESSOR_PRIVACY_CENTER", "D3_DATA_GOVERNANCE_CONTROLS", "D4_DOCS_API_DATA_FLOW", "D5_AI_SAFETY_TRANSPARENCY"])
});
const M6_DATA_FLOW_SIGNALS = Object.freeze([
  "data", "file", "upload", "storage", "retention", "delete", "export", "webhook", "connector", "integration", "auth", "permission", "audit", "log", "subprocessor", "model", "training", "customer content"
]);
const M6_LEGAL_HOST_ALLOWLIST = Object.freeze([
  "iubenda.com",
  "termly.io",
  "termsfeed.com",
  "onetrust.com",
  "trustarc.com",
  "ironcladapp.com",
  "docusign.com"
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
      const modelResult = await runModelCallForJob({ job, promptBundle });
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
    m6_bridge_meta: job.artifacts.m6_bridge_meta,
    m6_url_fetch_manifest: job.debug_raw ? job.artifacts.m6_url_fetch_manifest : undefined,
    m6_url_fetch_manifest_meta: job.debug_raw ? job.artifacts.m6_url_fetch_manifest_meta : undefined,
    m6_fetch_fulfillment: job.debug_raw ? job.artifacts.m6_fetch_fulfillment : job.artifacts.m6_fetch_fulfillment_summary,
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

function isUrlSourceMode(payload) {
  return ["url", "url_plus_text"].includes(payload?.source_mode);
}

async function runModelCallForJob({ job, promptBundle }) {
  if (isUrlSourceMode(job.execution_payload)) {
    const manifest = await runM6UrlManifestCall({ job, promptBundle });
    const fulfillment = await fulfillM6UrlFetchManifest({ job, manifest });
    const bridgeUserPrompt = buildUserPromptWithM6Bridge(job.execution_payload, { manifest, fulfillment });

    job.artifacts.m6_bridge_meta = {
      ...(job.artifacts.m6_bridge_meta || {}),
      patch_level: "PATCH_D_M6_BRIDGE_FINAL_INJECTION",
      final_monolith_still_uses_existing_direct_path: false,
      final_monolith_uses_m6_bridge: true,
      final_monolith_grounding: false,
      final_monolith_bridge_input_present: true,
      final_monolith_bridge_contract: "manifest_and_fetch_fulfillment_are_raw_candidate_material_only_module_vi_must_verify"
    };

    appendEvent(job, NODE.MODEL_CALL, "M6 bridge fulfillment will be injected into final monolith call. Final grounding=false.");
    return await runDirectMonolithCall({
      job,
      promptBundle,
      userPromptOverride: bridgeUserPrompt,
      allowGroundingOverride: false
    });
  }

  return await runDirectMonolithCall({ job, promptBundle });
}

async function runM6UrlManifestCall({ job, promptBundle }) {
  const systemPrompt = buildSystemPrompt(promptBundle);
  const userPrompt = buildM6UrlManifestPrompt(job.execution_payload);
  appendEvent(job, NODE.MODEL_CALL, "M6 URL fetch manifest call started. Grounding=true. Models=Gemini 2.5 only.");

  const manifestResult = await callGeminiWithRotation({
    systemPrompt,
    userPrompt,
    allowGrounding: true,
    responseMimeType: null,
    temperature: Number(process.env.GEMINI_M6_MANIFEST_TEMPERATURE || 0),
    modelTiers: M6_MANIFEST_MODEL_TIERS,
    terminalRootKey: M6_URL_FETCH_MANIFEST_ROOT_KEY
  });

  const parseReport = extractJsonObjectByRoot(manifestResult.text, M6_URL_FETCH_MANIFEST_ROOT_KEY);
  if (!parseReport.ok) {
    const err = new Error(parseReport.error || "M6 URL fetch manifest parse failed.");
    err.code = "M6_URL_FETCH_MANIFEST_PARSE_FAILED";
    err.parse_report = parseReport.public;
    err.model_attempts = manifestResult.meta?.model_attempts || undefined;
    err.model_output_char_count = String(manifestResult.text || "").length;
    err.model_output_tail_preview = tailPreview(manifestResult.text);
    err.finish_reason = manifestResult.meta?.finish_reason || undefined;
    err.provider_warnings = manifestResult.meta?.provider_warnings || undefined;
    throw err;
  }

  const manifest = parseReport.value?.m6_url_fetch_manifest;
  job.artifacts.m6_url_fetch_manifest = manifest;
  job.artifacts.m6_url_fetch_manifest_raw = manifestResult.text;
  job.artifacts.m6_url_fetch_manifest_parse_report = parseReport.public;
  job.artifacts.m6_url_fetch_manifest_meta = manifestResult.meta;
  job.artifacts.m6_bridge_meta = {
    enabled: true,
    patch_level: "PATCH_D_M6_BRIDGE_FINAL_INJECTION",
    manifest_present: Boolean(manifest),
    fetch_fulfillment_present: false,
    manifest_request_count: Array.isArray(manifest?.fetch_requests) ? manifest.fetch_requests.length : 0,
    manifest_grounding_requested: manifestResult.meta?.grounding_requested ?? true,
    manifest_model: manifestResult.meta?.model || null,
    manifest_bucket_name: manifestResult.meta?.bucket_name || null,
    final_monolith_still_uses_existing_direct_path: true
  };

  appendEvent(job, NODE.MODEL_CALL, `M6 URL fetch manifest returned. Requests=${job.artifacts.m6_bridge_meta.manifest_request_count}.`);
  return manifest;
}

function buildM6UrlManifestPrompt(payload) {
  return `Execute only the Module VI URL fetch-manifest step for the Interface Diligence monolith.

This is a pre-final mechanical fetch request step. It is NOT the final diligence run.

Hard rules for this request:
- Use Gemini grounding only for public URL discovery.
- Grounding is allowed only because this call is restricted to Gemini 2.5 model tiers by the runtime.
- Do not run Module VII through Module XIV.
- Do not produce target profile, feature profile, legal cartography, data provenance profile, registry ledger, report, Vault handoff, or final_output_handoff.
- Do not admit evidence. Do not decide final source family. Do not create route packages.
- Produce only URLs that Module VI should ask the runtime to fetch for later verification.
- Treat all URLs as FETCH REQUESTS ONLY, not evidence.
- Prefer first-party/company-controlled URLs and Module VI M6.T6 known-path candidates.
- Use only Module VI source-family names: TARGET_FAMILY, PRODUCT_FAMILY, LEGAL_FAMILY, DATA_FAMILY, or UNKNOWN.
- Use only Module VI source-subfamily names from M6.T6 where known. If unsure, use UNKNOWN.
- Do not invent concrete {slug} URLs. Product slugs must come from navigation, sitemap, hash route, root review, or search scout.
- Exclude media, investor databases, aggregators, review sites, and third-party authored sources unless the URL appears to be a company-controlled legal/governance document host linked/controlled by the target.
- Emit exactly one JSON object with exactly one root key: m6_url_fetch_manifest.
- No markdown, no code fences, no prose outside JSON.

Required JSON shape:
{
  "m6_url_fetch_manifest": {
    "status": "FETCH_REQUEST_ONLY_NOT_EVIDENCE",
    "target_url": "string|null",
    "target_name": "string|null",
    "grounding_used": true,
    "grounding_model_policy": "gemini_2_5_only",
    "fetch_requests": [
      {
        "request_id": "REQ_001",
        "url": "string",
        "reason": "root|header|footer|sitemap|hash_route|known_path_probe|search_scout|coverage_challenge|hosted_governance_candidate|other",
        "expected_family": "TARGET_FAMILY|PRODUCT_FAMILY|LEGAL_FAMILY|DATA_FAMILY|UNKNOWN",
        "expected_subfamily": "M6.T6 subfamily code or UNKNOWN",
        "route_source_hint": "HEADER|FOOTER|SITEMAP|ROOT|HASH_ROUTE|KNOWN_PATH_PROBE|SEARCH_SCOUT|COVERAGE_CHALLENGE|UNKNOWN",
        "priority": "P1|P2|P3",
        "must_fetch": true
      }
    ],
    "known_path_bank_ref": "M6.T6",
    "known_path_bank": ${JSON.stringify(M6_KNOWN_PATH_BANK, null, 6)},
    "exclusion_rules": [
      "first_party_boundary_required",
      "third_party_legal_or_governance_hosting_exception_only",
      "no_media",
      "no_aggregators",
      "no_investor_databases",
      "no_review_sites",
      "search_snippets_are_not_evidence"
    ],
    "manifest_warnings": []
  }
}

EXECUTION_PAYLOAD:
${JSON.stringify(payload, null, 2)}`;
}


async function fulfillM6UrlFetchManifest({ job, manifest }) {
  appendEvent(job, NODE.MODEL_CALL, "M6 fetch fulfillment started. Server will fetch raw candidate text only; no evidence admission.");

  const startedAt = Date.now();
  const targetUrl = job.execution_payload?.target_url || manifest?.target_url || null;
  const requestRows = normalizeM6FetchRequests({ manifest, targetUrl });
  const knownPathRows = buildKnownPathSelfCheckRequests({ targetUrl, existingUrls: requestRows.map((row) => row.url) });
  const allRows = [...requestRows, ...knownPathRows];

  const fetchResults = [];
  const fetchFailures = [];
  const knownPathSelfCheck = {
    checked_paths: knownPathRows.map((row) => ({ path: row.path, source_family: row.expected_family, source_subfamily: row.expected_subfamily })),
    additional_candidates_fetched: [],
    not_found: [],
    skipped_outside_boundary: []
  };

  for (const row of allRows) {
    const boundary = evaluateM6FetchBoundary({ candidateUrl: row.url, targetUrl, expectedFamily: row.expected_family });
    if (!boundary.allowed) {
      const skipped = {
        request_id: row.request_id,
        url: row.url,
        path: row.path || null,
        source_family: row.expected_family,
        source_subfamily: row.expected_subfamily,
        reason: boundary.reason,
        discovered_by: row.discovered_by
      };
      if (row.discovered_by === "known_path_self_check") knownPathSelfCheck.skipped_outside_boundary.push(skipped);
      fetchFailures.push({ ...skipped, error: "M6_FETCH_BOUNDARY_REJECTED" });
      continue;
    }

    const fetched = await fetchM6CandidateUrl({ row, targetUrl });
    if (fetched.ok) {
      fetchResults.push(fetched.result);
      if (row.discovered_by === "known_path_self_check") {
        knownPathSelfCheck.additional_candidates_fetched.push({
          request_id: row.request_id,
          path: row.path || null,
          url: row.url,
          source_family: row.expected_family,
          source_subfamily: row.expected_subfamily,
          status: fetched.result.fetch_status,
          candidate_id: fetched.result.candidate_id,
          text_length: fetched.result.text_length
        });
      }
    } else {
      fetchFailures.push(fetched.failure);
      if (row.discovered_by === "known_path_self_check") {
        knownPathSelfCheck.not_found.push({
          request_id: row.request_id,
          path: row.path || null,
          url: row.url,
          source_family: row.expected_family,
          source_subfamily: row.expected_subfamily,
          fetch_status: fetched.failure.fetch_status || null,
          error: fetched.failure.error || null
        });
      }
    }
  }

  const fulfillment = {
    status: "RAW_FETCH_FULFILLMENT_ONLY_NOT_ADMITTED_EVIDENCE",
    target_url: targetUrl,
    fetched_at: new Date().toISOString(),
    fetch_results: fetchResults,
    fetch_failures: fetchFailures,
    known_path_self_check: knownPathSelfCheck,
    bridge_rules: [
      "server_fetch_is_raw_candidate_material_only",
      "server_does_not_admit_evidence",
      "server_family_hint_is_not_final_family",
      "module_vi_must_verify_admit_classify_package_and_route"
    ]
  };

  job.artifacts.m6_fetch_fulfillment = fulfillment;
  job.artifacts.m6_fetch_fulfillment_summary = summarizeM6FetchFulfillment(fulfillment);
  job.artifacts.m6_bridge_meta = {
    ...(job.artifacts.m6_bridge_meta || {}),
    patch_level: "PATCH_D_M6_BRIDGE_FINAL_INJECTION",
    fetch_fulfillment_present: true,
    fetch_result_count: fetchResults.length,
    fetch_failure_count: fetchFailures.length,
    known_path_checked_count: knownPathSelfCheck.checked_paths.length,
    known_path_fetched_count: knownPathSelfCheck.additional_candidates_fetched.length,
    known_path_not_found_count: knownPathSelfCheck.not_found.length,
    fetch_runtime_ms: Date.now() - startedAt,
    final_monolith_still_uses_existing_direct_path: true,
    m6_fetch_fulfillment_root_key: M6_FETCH_FULFILLMENT_ROOT_KEY
  };

  appendEvent(job, NODE.MODEL_CALL, `M6 fetch fulfillment completed. Results=${fetchResults.length}. Failures=${fetchFailures.length}. KnownPathFetched=${knownPathSelfCheck.additional_candidates_fetched.length}.`);
  return fulfillment;
}

function normalizeM6FetchRequests({ manifest, targetUrl }) {
  const rows = [];
  const seen = new Set();

  const addRow = (candidate, fallback = {}) => {
    const rawUrl = nullableString(candidate?.url || fallback.url);
    const absoluteUrl = normalizeCandidateUrl(rawUrl, targetUrl);
    if (!absoluteUrl) return;
    const canonical = canonicalFetchUrl(absoluteUrl);
    if (seen.has(canonical)) return;
    seen.add(canonical);
    rows.push({
      request_id: nullableString(candidate?.request_id || fallback.request_id) || `REQ_${String(rows.length + 1).padStart(3, "0")}`,
      url: absoluteUrl,
      reason: nullableString(candidate?.reason || fallback.reason) || "manifest_candidate",
      expected_family: normalizeM6FamilyHint(candidate?.expected_family || fallback.expected_family),
      expected_subfamily: normalizeM6SubfamilyHint(candidate?.expected_subfamily || fallback.expected_subfamily, candidate?.expected_family || fallback.expected_family),
      route_source_hint: normalizeM6RouteSourceHint(candidate?.route_source_hint || fallback.route_source_hint),
      priority: nullableString(candidate?.priority || fallback.priority) || "P2",
      must_fetch: candidate?.must_fetch === undefined ? Boolean(fallback.must_fetch ?? true) : Boolean(candidate.must_fetch),
      discovered_by: nullableString(fallback.discovered_by) || "m6_manifest"
    });
  };

  if (targetUrl) {
    addRow({
      request_id: "REQ_ROOT",
      url: targetUrl,
      reason: "root",
      expected_family: "TARGET_FAMILY",
      expected_subfamily: "T0_ROOT",
      route_source_hint: "ROOT",
      priority: "P1",
      must_fetch: true
    }, { discovered_by: "runtime_root_seed" });
  }

  for (const request of Array.isArray(manifest?.fetch_requests) ? manifest.fetch_requests : []) {
    addRow(request, { discovered_by: "m6_manifest" });
  }

  return rows;
}

function buildKnownPathSelfCheckRequests({ targetUrl, existingUrls = [] }) {
  if (!targetUrl) return [];
  const origin = originFromUrl(targetUrl);
  if (!origin) return [];
  const seen = new Set(existingUrls.map((url) => canonicalFetchUrl(url)).filter(Boolean));
  const rows = [];

  for (const record of m6KnownPathRecords({ primaryOnly: true })) {
    if (isM6KnownPathTemplate(record.path)) continue;
    if (record.source_subfamily === "D4_DOCS_API_DATA_FLOW" && !hasM6DataFlowSignal(record.path)) continue;

    const url = normalizeCandidateUrl(record.path, origin);
    const canonical = canonicalFetchUrl(url);
    if (!url || seen.has(canonical)) continue;
    seen.add(canonical);
    rows.push({
      request_id: `KP_${String(rows.length + 1).padStart(3, "0")}`,
      url,
      path: record.path,
      reason: "m6_known_path_self_check",
      expected_family: record.source_family,
      expected_subfamily: record.source_subfamily,
      route_source_hint: "KNOWN_PATH_PROBE",
      priority: record.priority,
      must_fetch: false,
      discovered_by: "known_path_self_check",
      known_path_bank_ref: "M6.T6",
      known_path_primary_self_check: true
    });
  }

  return rows;
}

async function fetchM6CandidateUrl({ row, targetUrl }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), M6_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(row.url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": M6_FETCH_USER_AGENT,
        "accept": "text/html,application/xhtml+xml,text/plain,application/json;q=0.8,*/*;q=0.2"
      }
    });

    const contentType = response.headers?.get?.("content-type") || "";
    const finalUrl = response.url || row.url;
    const rawText = await response.text().catch(() => "");
    const { title, cleanText } = extractM6CleanText(rawText, contentType);

    if (!response.ok || !cleanText) {
      return {
        ok: false,
        failure: {
          request_id: row.request_id,
          url: row.url,
          final_url: finalUrl,
          fetch_status: response.status,
          content_type: contentType,
          discovered_by: row.discovered_by,
          expected_family: row.expected_family,
          expected_subfamily: row.expected_subfamily,
          route_source_hint: row.route_source_hint,
          error: !response.ok ? `HTTP_${response.status}` : "EMPTY_CLEAN_TEXT"
        }
      };
    }

    const candidateId = `CAND_${fingerprint(`${row.request_id}:${finalUrl}:${cleanText.length}`)}`;
    return {
      ok: true,
      result: {
        request_id: row.request_id,
        candidate_id: candidateId,
        url: row.url,
        final_url: finalUrl,
        fetch_status: response.status,
        content_type: contentType,
        title,
        clean_text: cleanText,
        clean_text_sha256: crypto.createHash("sha256").update(cleanText).digest("hex"),
        text_length: cleanText.length,
        server_family_hint: classifyM6ServerFamilyHint({ row, finalUrl, contentType, cleanText }),
        server_subfamily_hint: classifyM6ServerSubfamilyHint({ row, finalUrl, cleanText }),
        expected_family_from_manifest: row.expected_family,
        expected_subfamily_from_manifest: row.expected_subfamily,
        route_source_hint: row.route_source_hint,
        discovered_by: row.discovered_by,
        fetched_at: new Date().toISOString(),
        server_notes: [
          "raw_candidate_material_only",
          "not_admitted_evidence_until_module_vi_verification"
        ],
        target_boundary: boundaryDescriptor({ candidateUrl: finalUrl, targetUrl })
      }
    };
  } catch (err) {
    return {
      ok: false,
      failure: {
        request_id: row.request_id,
        url: row.url,
        final_url: null,
        fetch_status: null,
        content_type: null,
        discovered_by: row.discovered_by,
        expected_family: row.expected_family,
        expected_subfamily: row.expected_subfamily,
        route_source_hint: row.route_source_hint,
        error: err?.name === "AbortError" ? "FETCH_TIMEOUT" : (err?.message || String(err))
      }
    };
  } finally {
    clearTimeout(timeout);
  }
}

function extractM6CleanText(rawText, contentType = "") {
  const text = String(rawText || "");
  const titleMatch = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeHtmlEntities(stripTags(titleMatch[1])).trim().slice(0, 240) : null;
  const looksHtml = String(contentType || "").toLowerCase().includes("html") || /<html|<body|<div|<p|<section/i.test(text);
  const withoutNoise = looksHtml
    ? text
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
    : text;
  const cleanText = decodeHtmlEntities(stripTags(withoutNoise))
    .replace(/\u0000/g, " ")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { title, cleanText };
}

function stripTags(value) {
  return String(value || "").replace(/<[^>]+>/g, " ");
}

function decodeHtmlEntities(value) {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_match, code) => {
      const num = Number(code);
      return Number.isFinite(num) ? String.fromCharCode(num) : " ";
    });
}

function normalizeCandidateUrl(value, baseUrl = null) {
  const raw = nullableString(value);
  if (!raw) return null;
  try {
    const url = baseUrl ? new URL(raw, baseUrl) : new URL(raw);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    url.hash = "";
    return url.toString();
  } catch (_err) {
    return null;
  }
}

function canonicalFetchUrl(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/g, "");
    return url.toString().toLowerCase();
  } catch (_err) {
    return null;
  }
}

function originFromUrl(value) {
  try { return new URL(value).origin; } catch (_err) { return null; }
}

function normalizeHostname(value) {
  return String(value || "").toLowerCase().replace(/^www\./, "");
}

function evaluateM6FetchBoundary({ candidateUrl, targetUrl, expectedFamily = "unknown" }) {
  try {
    const candidate = new URL(candidateUrl);
    const target = targetUrl ? new URL(targetUrl) : candidate;
    const candidateHost = normalizeHostname(candidate.hostname);
    const targetHost = normalizeHostname(target.hostname);
    const sameFirstParty = candidateHost === targetHost || candidateHost.endsWith(`.${targetHost}`) || targetHost.endsWith(`.${candidateHost}`);
    if (sameFirstParty) return { allowed: true, reason: "FIRST_PARTY_DOMAIN_MATCH" };

    const legalHostAllowed = ["LEGAL_FAMILY", "DATA_FAMILY"].includes(normalizeM6FamilyHint(expectedFamily)) && M6_LEGAL_HOST_ALLOWLIST.some((host) => candidateHost === host || candidateHost.endsWith(`.${host}`));
    if (legalHostAllowed) return { allowed: true, reason: "POTENTIAL_THIRD_PARTY_LEGAL_HOSTING_EXCEPTION_CANDIDATE" };

    return { allowed: false, reason: "OUTSIDE_FIRST_PARTY_BOUNDARY" };
  } catch (_err) {
    return { allowed: false, reason: "INVALID_URL" };
  }
}

function boundaryDescriptor({ candidateUrl, targetUrl }) {
  const boundary = evaluateM6FetchBoundary({ candidateUrl, targetUrl });
  return boundary.reason;
}

function m6KnownPathRecords({ primaryOnly = false } = {}) {
  const records = [];
  for (const [sourceFamily, subfamilies] of Object.entries(M6_KNOWN_PATH_BANK)) {
    for (const [sourceSubfamily, paths] of Object.entries(subfamilies || {})) {
      if (primaryOnly && !isM6PrimaryKnownPathSubfamily(sourceFamily, sourceSubfamily)) continue;
      for (const knownPath of paths || []) {
        records.push({
          source_family: sourceFamily,
          source_subfamily: sourceSubfamily,
          path: knownPath,
          priority: sourceFamily === "TARGET_FAMILY" && sourceSubfamily === "T0_ROOT" ? "P1" : "P2"
        });
      }
    }
  }
  return records;
}

function isM6PrimaryKnownPathSubfamily(sourceFamily, sourceSubfamily) {
  return Boolean(M6_PRIMARY_KNOWN_PATH_SUBFAMILIES[sourceFamily]?.includes(sourceSubfamily));
}

function isM6KnownPathTemplate(knownPath) {
  const value = String(knownPath || "");
  return value.includes("{slug}") || value.includes("/#/");
}

function hasM6DataFlowSignal(value) {
  const text = String(value || "").toLowerCase();
  return M6_DATA_FLOW_SIGNALS.some((signal) => text.includes(signal));
}

function normalizeM6FamilyHint(value) {
  const raw = String(value || "UNKNOWN").trim();
  const upper = raw.toUpperCase();
  if (["TARGET_FAMILY", "PRODUCT_FAMILY", "LEGAL_FAMILY", "DATA_FAMILY", "UNKNOWN"].includes(upper)) return upper;
  const lower = raw.toLowerCase();
  if (["target", "identity", "homepage", "root"].includes(lower)) return "TARGET_FAMILY";
  if (["product", "commercial", "pricing", "feature", "features", "docs_product"].includes(lower)) return "PRODUCT_FAMILY";
  if (["legal", "terms", "privacy", "policy", "governance"].includes(lower)) return "LEGAL_FAMILY";
  if (["data", "security", "trust", "subprocessor", "docs", "developer", "api"].includes(lower)) return "DATA_FAMILY";
  return "UNKNOWN";
}

function normalizeM6SubfamilyHint(value, sourceFamily = "UNKNOWN") {
  const raw = String(value || "UNKNOWN").trim().toUpperCase();
  if (raw === "UNKNOWN") return "UNKNOWN";
  const family = normalizeM6FamilyHint(sourceFamily);
  if (family !== "UNKNOWN" && Object.prototype.hasOwnProperty.call(M6_KNOWN_PATH_BANK[family] || {}, raw)) return raw;
  for (const subfamilies of Object.values(M6_KNOWN_PATH_BANK)) {
    if (Object.prototype.hasOwnProperty.call(subfamilies || {}, raw)) return raw;
  }
  return "UNKNOWN";
}

function normalizeM6RouteSourceHint(value) {
  const raw = String(value || "UNKNOWN").trim().toUpperCase();
  return ["HEADER", "FOOTER", "SITEMAP", "ROOT", "HASH_ROUTE", "KNOWN_PATH_PROBE", "SEARCH_SCOUT", "COVERAGE_CHALLENGE", "PASTED_TEXT", "SYNTHETIC_DEMO", "UNKNOWN"].includes(raw) ? raw : "UNKNOWN";
}

function classifyM6ServerFamilyHint({ row, finalUrl, contentType, cleanText }) {
  const expected = normalizeM6FamilyHint(row?.expected_family);
  if (expected !== "UNKNOWN") return expected;
  const lowerUrl = String(finalUrl || "").toLowerCase();
  const lowerText = String(cleanText || "").slice(0, 5000).toLowerCase();
  const combined = `${lowerUrl}\n${lowerText}`;
  if (/privacy policy|terms of service|terms and conditions|data processing agreement|subprocessor|acceptable use|cookie policy|legal center|legal notice|eula/.test(combined)) return "LEGAL_FAMILY";
  if (/security|trust center|soc 2|iso 27001|compliance|vulnerability disclosure|data residency|retention|deletion|data export|audit logs|permissions|webhooks/.test(combined)) return "DATA_FAMILY";
  if (/about|company|who we are|contact us|imprint/.test(combined)) return "TARGET_FAMILY";
  if (/product|platform|features|solutions|use cases|pricing|plans|api|developer|documentation|sdk|quickstart/.test(combined)) return "PRODUCT_FAMILY";
  return "UNKNOWN";
}

function classifyM6ServerSubfamilyHint({ row, finalUrl, cleanText }) {
  const expected = normalizeM6SubfamilyHint(row?.expected_subfamily, row?.expected_family);
  if (expected !== "UNKNOWN") return expected;
  const lower = `${String(finalUrl || "").toLowerCase()}\n${String(cleanText || "").slice(0, 3000).toLowerCase()}`;
  for (const record of m6KnownPathRecords({ primaryOnly: false })) {
    if (record.path && !isM6KnownPathTemplate(record.path) && lower.includes(record.path.toLowerCase().replace(/^\//, ""))) return record.source_subfamily;
  }
  return "UNKNOWN";
}

function summarizeM6FetchFulfillment(fulfillment) {
  const results = Array.isArray(fulfillment?.fetch_results) ? fulfillment.fetch_results : [];
  const failures = Array.isArray(fulfillment?.fetch_failures) ? fulfillment.fetch_failures : [];
  return {
    status: fulfillment?.status || null,
    target_url: fulfillment?.target_url || null,
    fetched_at: fulfillment?.fetched_at || null,
    fetch_result_count: results.length,
    fetch_failure_count: failures.length,
    total_text_length: results.reduce((sum, row) => sum + Number(row.text_length || 0), 0),
    fetched_sources: results.map((row) => ({
      request_id: row.request_id,
      candidate_id: row.candidate_id,
      url: row.url,
      final_url: row.final_url,
      fetch_status: row.fetch_status,
      title: row.title,
      text_length: row.text_length,
      server_family_hint: row.server_family_hint,
      server_subfamily_hint: row.server_subfamily_hint,
      discovered_by: row.discovered_by
    })),
    fetch_failures: failures,
    known_path_self_check: fulfillment?.known_path_self_check || null,
    bridge_rules: fulfillment?.bridge_rules || []
  };
}

async function runDirectMonolithCall({ job, promptBundle, userPromptOverride = null, allowGroundingOverride = null }) {
  const allowGrounding = allowGroundingOverride === null ? isUrlSourceMode(job.execution_payload) : Boolean(allowGroundingOverride);
  const systemPrompt = buildSystemPrompt(promptBundle);
  const userPrompt = userPromptOverride || buildUserPrompt(job.execution_payload);
  appendEvent(job, NODE.MODEL_CALL, `Gemini monolith call started. Grounding=${allowGrounding}.`);
  return await callGeminiWithRotation({
    systemPrompt,
    userPrompt,
    allowGrounding,
    responseMimeType: "application/json",
    temperature: Number(process.env.GEMINI_TEMPERATURE || 0),
    terminalRootKey: FINAL_TERMINAL_ROOT_KEY
  });
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
    m6_bridge_patch_level: "PATCH_C2_M6_KNOWN_PATH_BANK_NO_FINAL_INJECTION",
    m6_bridge_manifest_root_key: M6_URL_FETCH_MANIFEST_ROOT_KEY,
    m6_fetch_fulfillment_root_key: M6_FETCH_FULFILLMENT_ROOT_KEY,
    m6_bridge_manifest_models: M6_MANIFEST_MODEL_TIERS,
    m6_fetch_timeout_ms: M6_FETCH_TIMEOUT_MS,
    m6_known_path_bank: M6_KNOWN_PATH_BANK,
    m6_primary_known_path_subfamilies: M6_PRIMARY_KNOWN_PATH_SUBFAMILIES,
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

function buildUserPromptWithM6Bridge(payload, { manifest, fulfillment }) {
  return `Execute one Interface Diligence monolith run using the execution payload and Module VI bridge materials below.

Rules for this request:
- Run the locked monolith internally from Module I through Module XIV.
- Final monolith grounding is disabled because Module VI has already requested candidate URLs and the runtime has mechanically fetched them.
- Treat M6_URL_FETCH_MANIFEST as Module VI's fetch-request plan only. It is not evidence, not a source_discovery_handoff, not a package, not a profile, and not a downstream state object.
- Treat M6_FETCH_FULFILLMENT as raw candidate material only. It is not admitted evidence until Module VI independently applies its source boundary, evidence firewall, family/subfamily taxonomy, route-source priority, artifact classification, dedupe, absence/access handling, lossless evidence construction, ledger duties, and lock gate.
- Module VI must verify, admit, reject, classify, index, package, and route any usable material under M6 rules before Phase 2 begins.
- Server family/subfamily values are hints only. Module VI may confirm, change, reject, defer, or limitation-route them.
- Search snippets, manifest leads, fetch failures, rejected boundary material, and server hints must not support downstream findings unless Module VI admits the underlying fetched material into source_discovery_handoff.
- Do not emit m6_url_fetch_manifest or m6_fetch_fulfillment as terminal roots, report branches, compatibility wrappers, or canonical state objects.
- Emit exactly one terminal JSON object with exactly one root key: final_output_handoff.
- Do not invent source material, evidence refs, registry rows, registry evaluation rules, or Vault fields.
- Treat runtime references as named references only; do not create external dependencies not listed in the payload.

EXECUTION_PAYLOAD:
${JSON.stringify(payload, null, 2)}

M6_URL_FETCH_MANIFEST:
${JSON.stringify({ m6_url_fetch_manifest: manifest || null }, null, 2)}

M6_FETCH_FULFILLMENT:
${JSON.stringify({ m6_fetch_fulfillment: fulfillment || null }, null, 2)}`;
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

async function callGeminiWithRotation({
  systemPrompt,
  userPrompt,
  allowGrounding,
  responseMimeType = "application/json",
  temperature = 0,
  modelTiers = MODEL_TIERS,
  terminalRootKey = FINAL_TERMINAL_ROOT_KEY
}) {
  const bucketChain = resolveMonolithBucketChain({ allowGrounding, modelTiers });
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
          allowGrounding: effectiveGrounding,
          terminalRootKey
        });
        attempts.push(first.attempt);
        if (first.ok) return buildGeminiSuccess(first, attempts, modelTiers, terminalRootKey);

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
            retryOrdinal: 1,
            terminalRootKey
          });
          attempts.push(retry.attempt);
          if (retry.ok) return buildGeminiSuccess(retry, attempts, modelTiers, terminalRootKey);

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
  retryOrdinal = 0,
  terminalRootKey = FINAL_TERMINAL_ROOT_KEY
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

    const validation = VALIDATE_MODEL_TERMINAL_JSON ? extractJsonObjectByRoot(result.text, terminalRootKey) : { ok: true, public: { validation_skipped: true, root_key: terminalRootKey } };
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
    attempt.terminal_json_validation_root_key = terminalRootKey;
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

function resolveMonolithBucketChain({ allowGrounding, modelTiers = MODEL_TIERS }) {
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
      modelTiers,
      grounding: Boolean(allowGrounding)
    };
  });
}

function extractTerminalJson(text) {
  return extractJsonObjectByRoot(text, FINAL_TERMINAL_ROOT_KEY);
}

function extractJsonObjectByRoot(text, rootKey = FINAL_TERMINAL_ROOT_KEY) {
  const original = String(text || "").trim();
  const attempts = [];
  const candidates = [
    { strategy: "raw", text: original },
    { strategy: "strip_markdown_fence", text: stripMarkdownFence(original) },
    { strategy: "balanced_object_extract", text: extractFirstBalancedJsonObject(original) }
  ].filter((candidate) => candidate.text);

  for (const candidate of candidates) {
    const parsed = tryParseJson(candidate.text, rootKey);
    attempts.push({ strategy: candidate.strategy, ok: parsed.ok, error: parsed.error || null, root_key: rootKey });
    if (parsed.ok) return { ok: true, value: parsed.value, public: { strategy: candidate.strategy, repair_applied: candidate.strategy !== "raw", root_key: rootKey, attempts } };

    const repaired = repairJsonShapeOnly(candidate.text);
    if (repaired !== candidate.text) {
      const repairParsed = tryParseJson(repaired, rootKey);
      attempts.push({ strategy: `${candidate.strategy}+shape_repair`, ok: repairParsed.ok, error: repairParsed.error || null, root_key: rootKey });
      if (repairParsed.ok) return { ok: true, value: repairParsed.value, public: { strategy: `${candidate.strategy}+shape_repair`, repair_applied: true, root_key: rootKey, attempts } };
    }
  }

  return { ok: false, error: attempts.at(-1)?.error || `No parseable JSON object found for root ${rootKey}.`, public: { root_key: rootKey, attempts } };
}

function tryParseJson(value, rootKey = FINAL_TERMINAL_ROOT_KEY) {
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { ok: false, error: "JSON output must be one object root." };
    const rootCheck = validateJsonRoot(parsed, rootKey);
    if (!rootCheck.ok) return { ok: false, error: rootCheck.error };
    return { ok: true, value: parsed };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
}

function validateTerminalRoot(parsed) {
  return validateJsonRoot(parsed, FINAL_TERMINAL_ROOT_KEY);
}

function validateJsonRoot(parsed, rootKey = FINAL_TERMINAL_ROOT_KEY) {
  const keys = Object.keys(parsed || {});
  const rootLabel = rootKey === FINAL_TERMINAL_ROOT_KEY ? "TERMINAL_ROOT_INVALID" : "JSON_ROOT_INVALID";
  if (!Object.prototype.hasOwnProperty.call(parsed, rootKey)) {
    return { ok: false, error: `${rootLabel}: ${rootKey} root missing.` };
  }
  if (keys.length !== 1) {
    return { ok: false, error: `${rootLabel}: expected only ${rootKey} root, received ${keys.join(",")}.` };
  }
  if (!parsed[rootKey] || typeof parsed[rootKey] !== "object" || Array.isArray(parsed[rootKey])) {
    return { ok: false, error: `${rootLabel}: ${rootKey} must be an object.` };
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

function buildGeminiSuccess(result, attempts, modelTiers = MODEL_TIERS, terminalRootKey = FINAL_TERMINAL_ROOT_KEY) {
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
      terminal_json_validation_root_key: terminalRootKey,
      model_attempts: attempts,
      model_tiers: modelTiers
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
