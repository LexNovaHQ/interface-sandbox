import express from "express";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { renderDiligenceReport } from "./renderer.js";
import { buildVaultHandoff } from "./vault-bridge.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVICE_NAME = "interface-diligence-hunter";
const MODE = "hunter_monolith_single_run";
const FINAL_ROOT_KEY = "final_output_handoff";
const DEFAULT_MODELS = Object.freeze(["gemini-2.5-flash", "gemini-2.5-flash-lite"]);
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 840000);
const GEMINI_MAX_OUTPUT_TOKENS = Number(process.env.GEMINI_MAX_OUTPUT_TOKENS || 65535);
const GEMINI_TEMPERATURE = Number(process.env.GEMINI_TEMPERATURE || 0);
const GOOGLE_SEARCH_TOOL_FIELD = String(process.env.GEMINI_GOOGLE_SEARCH_TOOL_FIELD || "googleSearch").trim();
const EXPRESS_JSON_LIMIT = String(process.env.EXPRESS_JSON_LIMIT || "25mb");
const RAW_MODEL_PREVIEW_CHARS = Number(process.env.RAW_MODEL_PREVIEW_CHARS || 12000);

const PATHS = Object.freeze({
  prompt: path.join(__dirname, "prompts", "diligence_runtime_MONOLITH_FINAL.md"),
  registryKey: path.join(__dirname, "reference", "REGISTRY_KEY_v3_0.md"),
  registryCsv: path.join(__dirname, "reference", "AI_THREAT_REGISTRY.csv"),
  registryYaml: path.join(__dirname, "reference", "AI_THREAT_REGISTRY.yaml"),
  registryRules: path.join(__dirname, "reference", "REGISTRY_EVALUATION_RULES.csv"),
  vaultMap: path.join(__dirname, "reference", "VAULT_JS_CANONICAL_MAP_v1.md")
});

const app = express();
app.use(express.json({ limit: EXPRESS_JSON_LIMIT }));
app.use(express.static(path.join(__dirname, "public")));

const loaded = loadRuntimeFiles();

app.get("/api/health", (_req, res) => {
  const keys = parseGeminiKeys();
  const models = parseModels();
  res.json({
    ok: true,
    service: SERVICE_NAME,
    mode: MODE,
    architecture: "single_grounded_monolith_call_no_jobs_no_m6_server_fetch",
    prompt_loaded: Boolean(loaded.prompt),
    prompt_sha256: sha256(loaded.prompt || ""),
    registry_key_loaded: Boolean(loaded.registryKey),
    registry_csv_loaded: Boolean(loaded.registryCsv),
    registry_yaml_loaded: Boolean(loaded.registryYaml),
    registry_evaluation_rules_loaded: Boolean(loaded.registryRules),
    vault_map_loaded: Boolean(loaded.vaultMap),
    renderer_loaded: typeof renderDiligenceReport === "function",
    vault_bridge_loaded: typeof buildVaultHandoff === "function",
    runtime_policy: "single_grounded_monolith_call_no_external_source_bridge",
    model_policy: "gemini_2_5_flash_then_gemini_2_5_flash_lite_only",
    models,
    key_count: keys.length,
    key_fingerprints: keys.map((key, index) => ({ key_index: index + 1, key_fingerprint: fingerprint(key) })),
    key_env: "GEMINI_API_KEYS",
    gemini_timeout_ms: GEMINI_TIMEOUT_MS,
    gemini_max_output_tokens: GEMINI_MAX_OUTPUT_TOKENS,
    response_mime_policy: "omitted_when_grounding_tools_enabled",
    express_json_limit: EXPRESS_JSON_LIMIT
  });
});

app.post("/api/diligence/run", async (req, res) => {
  const startedAt = Date.now();
  const runId = makeRunId();
  const executionPayload = normalizeExecutionPayload(req.body || {}, runId);
  const debugRaw = Boolean(req.body?.debug_raw);

  try {
    validateExecutionPayload(executionPayload);

    const systemPrompt = buildSystemPrompt(loaded);
    const userPrompt = buildUserPrompt(executionPayload);
    const modelResult = await callGeminiWithSimpleRotation({
      systemPrompt,
      userPrompt,
      allowGrounding: shouldUseGrounding(executionPayload),
      terminalRootKey: FINAL_ROOT_KEY
    });

    let terminalJson = await extractTerminalJsonWithRepair({ text: modelResult.text, rootKey: FINAL_ROOT_KEY, modelResult });
    let finalOutputHandoff = terminalJson?.[FINAL_ROOT_KEY];
    if (isPlainObject(finalOutputHandoff) && handoffNeedsCompletion(finalOutputHandoff)) {
      terminalJson = completeFinalOutputHandoffDeterministically({
        terminalJson,
        executionPayload,
        modelResult
      });
      finalOutputHandoff = terminalJson?.[FINAL_ROOT_KEY];
    }
    if (!isPlainObject(finalOutputHandoff)) {
      throw createPublicError("FINAL_OUTPUT_HANDOFF_MISSING", "Model returned JSON but final_output_handoff root was missing or invalid.", {
        stage: "JSON_PARSE",
        model_attempts: modelResult.attempts,
        raw_model_excerpt: preview(modelResult.text)
      });
    }

    const rendererOutput = safeRender({
      run: executionPayload,
      terminalJson,
      modelResult
    });
    const htmlReport = rendererOutput?.renderer_output?.html_report || fallbackHtml(finalOutputHandoff);
    const vaultHandoff = safeVault({
      terminalJson,
      runId,
      executionPayload,
      htmlReport,
      events: modelResult.attempts
    });

    res.json({
      ok: true,
      service: SERVICE_NAME,
      mode: MODE,
      run_id: runId,
      elapsed_ms: Date.now() - startedAt,
      model_used: modelResult.model_used,
      key_index_used: modelResult.key_index_used,
      key_fingerprint_used: modelResult.key_fingerprint_used,
      sent_key_matches_attempt: modelResult.sent_key_matches_attempt,
      usage_metadata: modelResult.usageMetadata || null,
      finish_reason: modelResult.finishReason || null,
      provider_warnings: modelResult.providerWarnings || [],
      final_output_handoff: finalOutputHandoff,
      html_report: htmlReport,
      renderer_output: rendererOutput?.renderer_output || null,
      vault_payload: vaultHandoff,
      model_attempts: modelResult.attempts,
      ...(debugRaw ? { raw_model_text: modelResult.text } : {})
    });
  } catch (err) {
    const status = Number(err?.httpStatus || 500);
    res.status(status).json({
      ok: false,
      service: SERVICE_NAME,
      mode: MODE,
      run_id: runId,
      elapsed_ms: Date.now() - startedAt,
      error: err?.publicCode || err?.code || "HUNTER_MONOLITH_RUN_FAILED",
      stage: err?.stage || "UNKNOWN",
      message: err?.publicMessage || err?.message || String(err),
      model_attempts: err?.model_attempts || err?.attempts || [],
      provider_warnings: err?.providerWarnings || [],
      raw_model_excerpt: err?.raw_model_excerpt || undefined,
      details: err?.details || undefined
    });
  }
});

app.get("/api/diligence/ping", (_req, res) => {
  res.json({ ok: true, service: SERVICE_NAME, mode: MODE, at: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ ok: false, error: "NOT_FOUND", path: req.path });
});

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
  console.log(`${SERVICE_NAME} listening on :${port}`);
  console.log(`Mode: ${MODE}`);
  console.log(`Loaded keys: ${parseGeminiKeys().length}`);
});

function loadRuntimeFiles() {
  return {
    prompt: readOptional(PATHS.prompt),
    registryKey: readOptional(PATHS.registryKey),
    registryCsv: readOptional(PATHS.registryCsv),
    registryYaml: readOptional(PATHS.registryYaml),
    registryRules: readOptional(PATHS.registryRules),
    vaultMap: readOptional(PATHS.vaultMap)
  };
}

function readOptional(filePath) {
  try { return fs.readFileSync(filePath, "utf8"); } catch { return ""; }
}

function buildSystemPrompt(files) {
  const referenceBlocks = [
    ["REGISTRY_KEY_v3_0.md", files.registryKey],
    ["AI_THREAT_REGISTRY.csv", files.registryCsv],
    ["AI_THREAT_REGISTRY.yaml", files.registryYaml],
    ["REGISTRY_EVALUATION_RULES.csv", files.registryRules],
    ["VAULT_JS_CANONICAL_MAP_v1.md", files.vaultMap]
  ].filter(([, value]) => String(value || "").trim());

  return [
    files.prompt,
    "\n\n# HUNTER SIMPLE MODE OVERRIDE — SERVER RUNTIME WRAPPER\n",
    "You are running the Interface Diligence Monolith in Hunter Simple Mode.",
    "Execute this as one Gemini-grounded monolith run.",
    "Module VI must operate as GEMINI_GROUNDED_MONOLITH. Use Gemini grounding in URL and url_plus_text modes.",
    "Do not request, emit, or expect external fetch fulfillment, server-generated evidence, legacy bridge artifacts, job-stage evidence packets, server-side route packages, or server-side source admission.",
    "Do not attempt to fill source caps. Caps are upper bounds only. Prefer a compact, high-value public-footprint evidence set sufficient to support target profile, feature profile, legal cartography, data provenance, registry evaluation, final report, and vault handoff.",
    "If full source text is not available through grounding, preserve exact observed excerpts or source-level observations with explicit limitations. Do not invent page text.",
    "Keep terminal output compact. Do not duplicate full source text across display/report branches.",
    "TERMINAL JSON COMPACTNESS RULE: Do not emit full source-discovery bulk in terminal output. Do not dump full clean_text, full lossless_evidence_payload bodies, full page text, full source archive, raw extracted pages, or repeated evidence payloads.",
    "TERMINAL JSON SOURCE RULE: Emit compact evidence refs, source URLs, source families, and short exact excerpts only where needed for auditability. Use limitations for omitted source text. Source custody may be summarized in terminal output; do not attempt archival preservation in the response body.",
    "TERMINAL JSON REGISTRY RULE: The exposure/registry ledger must remain complete. Do not replace registry rows with promises, examples, placeholders, or summaries. Every evaluated registry row must carry a final status.",
    "TERMINAL JSON SHAPE RULE: Return one JSON object only. Do not emit markdown fences. Do not emit ```json. Do not restart the JSON. Do not emit a second final_output_handoff root. Do not add commentary before or after the JSON.",
    "Return exactly one machine-valid JSON object rooted at {\"final_output_handoff\":{...}}. No markdown. No commentary. No extra root.",
    "\n\n# ACTIVE REFERENCES\n",
    ...referenceBlocks.map(([name, value]) => `\n\n## ${name}\n\n${value}`)
  ].join("\n");
}

function buildUserPrompt(executionPayload) {
  return [
    "Execute the full Interface Diligence Monolith for the following execution payload.",
    "Run Modules II through XIV internally.",
    "Use Gemini grounding for Module VI source discovery if source_mode is url or url_plus_text.",
    "Emit exactly one JSON object rooted at final_output_handoff and nothing else.",
    "Do not use markdown fences. Do not restart JSON. Do not emit duplicate roots.",
    "Keep terminal JSON compact: no full raw source text, no full clean_text archive, no repeated evidence payload dumps.",
    "Preserve full registry/exposure ledger status coverage; compact source custody only.",
    "",
    JSON.stringify(executionPayload, null, 2)
  ].join("\n");
}

function normalizeExecutionPayload(body, runId) {
  const sourceMode = String(body.source_mode || (body.target_url ? "url" : "text")).trim();
  return {
    run_id: String(body.run_id || runId),
    submitted_at: new Date().toISOString(),
    source_mode: sourceMode,
    target_url: nullableString(body.target_url),
    target_name: nullableString(body.target_name || body.company_name || body.company_name_candidate),
    company_name_candidate: nullableString(body.company_name_candidate || body.target_name || body.company_name),
    pasted_public_material: nullableString(body.pasted_public_material || body.text || body.public_material),
    synthetic_demo_payload: body.synthetic_demo_payload || null,
    output_mode: String(body.output_mode || "html_and_vault"),
    live_hunter_mode: true,
    runtime_policy: "single_grounded_monolith_call_no_external_fetch_fulfillment",
    registry_reference: {
      registry_key: "REGISTRY_KEY_v3_0.md",
      ai_threat_registry: "AI_THREAT_REGISTRY.csv / AI_THREAT_REGISTRY.yaml",
      registry_evaluation_rules: "REGISTRY_EVALUATION_RULES.csv"
    }
  };
}

function validateExecutionPayload(payload) {
  const mode = payload.source_mode;
  if (!["url", "text", "url_plus_text", "synthetic_demo"].includes(mode)) {
    throw createPublicError("INVALID_SOURCE_MODE", `source_mode must be url, text, url_plus_text, or synthetic_demo. Received: ${mode}`, { stage: "INPUT" , httpStatus: 400});
  }
  if (mode === "url" && !payload.target_url) {
    throw createPublicError("TARGET_URL_REQUIRED", "target_url is required when source_mode=url.", { stage: "INPUT", httpStatus: 400 });
  }
  if (mode === "url_plus_text" && !payload.target_url && !payload.pasted_public_material) {
    throw createPublicError("URL_OR_TEXT_REQUIRED", "target_url or pasted_public_material is required when source_mode=url_plus_text.", { stage: "INPUT", httpStatus: 400 });
  }
  if (mode === "text" && !payload.pasted_public_material) {
    throw createPublicError("PASTED_PUBLIC_MATERIAL_REQUIRED", "pasted_public_material is required when source_mode=text.", { stage: "INPUT", httpStatus: 400 });
  }
  if (mode === "synthetic_demo" && !payload.synthetic_demo_payload) {
    throw createPublicError("SYNTHETIC_DEMO_PAYLOAD_REQUIRED", "synthetic_demo_payload is required when source_mode=synthetic_demo.", { stage: "INPUT", httpStatus: 400 });
  }
}

function shouldUseGrounding(payload) {
  return payload.source_mode === "url" || payload.source_mode === "url_plus_text";
}

function parseGeminiKeys() {
  return unique(String(process.env.GEMINI_API_KEYS || "").split(",").map((v) => v.trim()).filter(Boolean));
}

function parseModels() {
  const raw = String(process.env.GEMINI_MODELS || "").trim();
  const models = raw ? raw.split(",").map((v) => v.trim()).filter(Boolean) : DEFAULT_MODELS;
  return models.filter((model) => ["gemini-2.5-flash", "gemini-2.5-flash-lite"].includes(model));
}

async function callGeminiWithSimpleRotation({ systemPrompt, userPrompt, allowGrounding, terminalRootKey }) {
  const keys = parseGeminiKeys();
  const models = parseModels();
  const attempts = [];
  if (!keys.length) {
    throw createPublicError("GEMINI_API_KEYS_NOT_CONFIGURED", "GEMINI_API_KEYS is empty. Set one comma-separated flat key pool for this Hunter runner.", { stage: "CONFIG", httpStatus: 500 });
  }
  if (!models.length) {
    throw createPublicError("GEMINI_MODELS_NOT_CONFIGURED", "No allowed Gemini 2.5 model is configured.", { stage: "CONFIG", httpStatus: 500 });
  }

  let lastError = null;
  let attemptNumber = 0;
  for (const model of models) {
    for (let keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
      const key = keys[keyIndex];
      const attempt = {
        attempt_number: ++attemptNumber,
        rotation_policy: "MODEL_FIRST_KEY_SECOND_FLAT_POOL",
        model,
        key_index: keyIndex + 1,
        key_alias: `GEMINI_API_KEYS_${keyIndex + 1}`,
        key_fingerprint: fingerprint(key),
        expected_sent_key_fingerprint: fingerprint(key),
        key_fingerprint_verified_before_call: true,
        grounding_requested: Boolean(allowGrounding),
        ok: false,
        started_at: new Date().toISOString()
      };
      attempts.push(attempt);
      const started = Date.now();
      try {
        const result = await callGeminiRest({ key, model, systemPrompt, userPrompt, allowGrounding });
        attempt.ok = true;
        attempt.latency_ms = Date.now() - started;
        attempt.actual_sent_key_fingerprint = result.actualSentKeyFingerprint;
        attempt.sent_key_matches_attempt = attempt.actual_sent_key_fingerprint === attempt.key_fingerprint;
        attempt.finish_reason = result.finishReason || null;
        attempt.usage_metadata = result.usageMetadata || null;
        attempt.provider_warnings = result.providerWarnings || [];
        if (!attempt.sent_key_matches_attempt) {
          throw createPublicError("KEY_ALIAS_SENT_KEY_MISMATCH", "Actual sent key fingerprint did not match attempted key fingerprint.", { stage: "GEMINI_CALL", model_attempts: attempts });
        }
        return {
          text: result.text,
          attempts,
          model_used: model,
          key_index_used: keyIndex + 1,
          key_fingerprint_used: attempt.key_fingerprint,
          sent_key_matches_attempt: true,
          usageMetadata: result.usageMetadata || null,
          finishReason: result.finishReason || null,
          providerWarnings: result.providerWarnings || []
        };
      } catch (err) {
        const classified = classifyGeminiError(err);
        attempt.ok = false;
        attempt.latency_ms = Date.now() - started;
        attempt.error = err?.message || String(err);
        attempt.error_class = classified.errorClass;
        attempt.retry_after_seconds = classified.retryAfterSeconds;
        attempt.actual_sent_key_fingerprint = err?.actualSentKeyFingerprint || attempt.expected_sent_key_fingerprint;
        attempt.sent_key_matches_attempt = attempt.actual_sent_key_fingerprint === attempt.key_fingerprint;
        attempt.finish_reason = err?.finishReason || null;
        attempt.usage_metadata = err?.usageMetadata || null;
        attempt.provider_warnings = err?.providerWarnings || [];
        attempt.decision = decideRotation({ model, models, keyIndex, keyCount: keys.length, errorClass: classified.errorClass });
        lastError = err;
        if (classified.terminal) {
          throw createPublicError("GEMINI_TERMINAL_ERROR", attempt.error, { stage: "GEMINI_CALL", model_attempts: attempts, providerWarnings: attempt.provider_warnings });
        }
      }
    }
  }

  throw createPublicError("GEMINI_ALL_KEYS_EXHAUSTED", lastError?.message || "All Gemini 2.5 keys/models failed.", {
    stage: "GEMINI_CALL",
    model_attempts: attempts,
    providerWarnings: lastError?.providerWarnings || []
  });
}

async function callGeminiRest({ key, model, systemPrompt, userPrompt, allowGrounding }) {
  const actualSentKeyFingerprint = fingerprint(key);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
    const generationConfig = {
      temperature: GEMINI_TEMPERATURE,
      maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS
    };
    const body = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig
    };
    if (allowGrounding) body.tools = [googleSearchToolPayload()];

    let response = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    let payload = await response.json().catch(() => ({}));

    if (!response.ok && shouldRetryWithoutMaxOutputTokens(response, payload)) {
      const fallback = JSON.parse(JSON.stringify(body));
      delete fallback.generationConfig.maxOutputTokens;
      response = await fetch(endpoint, {
        method: "POST",
        signal: controller.signal,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(fallback)
      });
      payload = await response.json().catch(() => ({}));
    }

    if (!response.ok) {
      const err = new Error(payload?.error?.message || `Gemini HTTP ${response.status}`);
      err.httpStatus = response.status;
      err.payload = payload;
      err.actualSentKeyFingerprint = actualSentKeyFingerprint;
      throw err;
    }

    const candidate = payload?.candidates?.[0] || {};
    const finishReason = candidate?.finishReason || null;
    const text = candidate?.content?.parts?.map((part) => part.text || "").join("") || "";
    const normalizedFinishReason = String(finishReason || "").toUpperCase();
    if (["SAFETY", "RECITATION", "BLOCKLIST", "PROHIBITED_CONTENT", "SPII"].includes(normalizedFinishReason)) {
      const err = new Error(`Gemini response blocked: ${finishReason}`);
      err.finishReason = finishReason;
      err.payload = payload;
      err.actualSentKeyFingerprint = actualSentKeyFingerprint;
      throw err;
    }
    if (!text.trim()) {
      const err = new Error("Gemini returned empty text.");
      err.finishReason = finishReason;
      err.payload = payload;
      err.actualSentKeyFingerprint = actualSentKeyFingerprint;
      throw err;
    }

    return {
      text,
      usageMetadata: payload?.usageMetadata || null,
      finishReason,
      providerWarnings: [],
      actualSentKeyFingerprint
    };
  } catch (err) {
    if (err?.name === "AbortError") {
      const timeoutErr = new Error("GEMINI_TIMEOUT_ABORTED");
      timeoutErr.actualSentKeyFingerprint = actualSentKeyFingerprint;
      timeoutErr.errorClass = "TIMEOUT";
      throw timeoutErr;
    }
    err.actualSentKeyFingerprint = err.actualSentKeyFingerprint || actualSentKeyFingerprint;
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

function googleSearchToolPayload() {
  return GOOGLE_SEARCH_TOOL_FIELD === "google_search" ? { google_search: {} } : { googleSearch: {} };
}

function shouldRetryWithoutMaxOutputTokens(response, payload) {
  if (Number(response?.status || 0) !== 400) return false;
  const message = String(payload?.error?.message || "").toLowerCase();
  return message.includes("maxoutputtokens") || message.includes("max output token") || message.includes("maximum output token") || message.includes("output tokens");
}



function handoffNeedsCompletion(finalOutputHandoff) {
  if (!isPlainObject(finalOutputHandoff)) return true;
  return (
    !isPlainObject(finalOutputHandoff.screen_report_payload) ||
    !isPlainObject(finalOutputHandoff.vault_assembler_handoff) ||
    !isPlainObject(finalOutputHandoff.final_quality_control) ||
    !isPlainObject(finalOutputHandoff.handoff_lock)
  );
}

function completeFinalOutputHandoffDeterministically({ terminalJson, executionPayload, modelResult }) {
  const existing = isPlainObject(terminalJson?.[FINAL_ROOT_KEY])
    ? terminalJson[FINAL_ROOT_KEY]
    : {};

  const completed = deepClonePlain(existing);
  const report = asPlain(completed.integrated_json_report);
  const prepared = asPlain(report.prepared_final_profiles);
  const runMeta = asPlain(completed.run_meta);

  if (!isPlainObject(completed.screen_report_payload)) {
    completed.screen_report_payload = buildServerCompletedScreenReportPayload({
      completed,
      report,
      prepared,
      runMeta,
      executionPayload,
      modelResult
    });
  }

  if (!isPlainObject(completed.vault_assembler_handoff)) {
    completed.vault_assembler_handoff = buildServerCompletedVaultAssemblerHandoff({
      completed,
      report,
      prepared,
      runMeta,
      executionPayload
    });
  }

  if (!isPlainObject(completed.final_quality_control)) {
    completed.final_quality_control = {
      completion_status: "SERVER_COMPLETED_WITH_LIMITATIONS",
      completion_guard_version: "handoff_completion_guard_v1",
      reason: "Model produced integrated_json_report but omitted one or more terminal display/vault branches.",
      substantive_diligence_mutation: false,
      added_branches: [
        "screen_report_payload",
        "vault_assembler_handoff",
        "final_quality_control",
        "handoff_lock"
      ],
      warnings: [
        "Screen report payload was generated deterministically from integrated_json_report.",
        "No new diligence facts were added by the server completion guard.",
        "Review integrated_json_report and forensic appendix before relying on any finding."
      ]
    };
  }

  if (!Array.isArray(completed.limitations)) {
    completed.limitations = [
      "Public-footprint diligence only.",
      "Server completion guard generated missing display/vault branches from existing integrated_json_report.",
      "No legal advice or compliance verdict is provided."
    ];
  }

  if (!isPlainObject(completed.handoff_lock)) {
    completed.handoff_lock = {
      lock_status: "LOCKED_WITH_SERVER_COMPLETION_GUARD",
      lock_version: "handoff_completion_guard_v1",
      terminal_root: FINAL_ROOT_KEY,
      no_new_diligence_facts_added_by_server: true,
      renderer_ready: isPlainObject(completed.screen_report_payload),
      vault_ready: isPlainObject(completed.vault_assembler_handoff)
    };
  }

  modelResult.providerWarnings = [
    ...(modelResult.providerWarnings || []),
    {
      code: "HANDOFF_COMPLETION_GUARD_USED",
      message: "final_output_handoff was missing renderer/vault terminal branches; server generated deterministic branches from integrated_json_report.",
      added_branches: [
        !isPlainObject(existing.screen_report_payload) ? "screen_report_payload" : null,
        !isPlainObject(existing.vault_assembler_handoff) ? "vault_assembler_handoff" : null,
        !isPlainObject(existing.final_quality_control) ? "final_quality_control" : null,
        !isPlainObject(existing.handoff_lock) ? "handoff_lock" : null
      ].filter(Boolean)
    }
  ];

  return { [FINAL_ROOT_KEY]: completed };
}

function buildServerCompletedScreenReportPayload({ completed, report, prepared, runMeta, executionPayload, modelResult }) {
  const targetName = firstNonEmpty(
    runMeta.target_name,
    executionPayload.target_name,
    executionPayload.company_name,
    "Target"
  );

  const targetUrl = firstNonEmpty(
    runMeta.target_url,
    executionPayload.target_url,
    ""
  );

  const runId = firstNonEmpty(
    runMeta.run_id,
    executionPayload.run_id,
    "unknown_run"
  );

  const sourceMode = firstNonEmpty(
    runMeta.source_mode,
    executionPayload.source_mode,
    "url"
  );

  const exposureRows = buildFallbackExposureRows({ report, prepared });

  const sections = {
    matter_overview: {
      matter_identity: { target_name: targetName, target_url: targetUrl, run_id: runId, source_mode: sourceMode },
      review_scope: "Public-footprint diligence generated by the Hunter monolith runtime from grounded model-visible materials.",
      evidence_cutoff: firstNonEmpty(report?.report_meta?.generated_at, runMeta?.submitted_at, new Date().toISOString()),
      reliance_disclaimer: "This is a diligence aid, not legal advice, not a compliance certification, and not a final legal opinion.",
      qualified_review_required: "Qualified legal / compliance review is required before relying on any finding.",
      public_footprint_limitation: "Findings are limited to information visible to the model through public-footprint grounding and user-provided input."
    },

    executive_summary: {
      executive_posture: summarizeLockStatus(report?.profile_manifest),
      target_snapshot: firstUseful(prepared.target_profile, report.report_meta, { target_name: targetName, target_url: targetUrl }),
      product_activity_snapshot: firstUseful(prepared.target_feature_profile, "Product/activity profile was not fully visible in the repaired terminal JSON."),
      data_posture: firstUseful(prepared.target_data_provenance_profile, "Data provenance profile was not fully visible in the repaired terminal JSON."),
      legal_document_posture: firstUseful(prepared.legal_cartography_index, "Legal/governance document posture was not fully visible in the repaired terminal JSON."),
      exposure_posture: firstUseful(prepared.target_exposure_profile, { visible_finding_rows: exposureRows.length }),
      evidence_posture: firstUseful(prepared.source_discovery_handoff?.evidence_box_manifest, "Evidence manifest was partially visible or compacted."),
      qualified_review_priorities: [
        "Confirm the target's current legal document set manually.",
        "Validate data-processing and model-provider claims against current policies.",
        "Review all exposure findings before external use."
      ]
    },

    target_profile: {
      identity: firstUseful(prepared.target_profile?.identity, prepared.target_profile, { target_name: targetName, target_url: targetUrl }),
      jurisdiction: firstUseful(prepared.target_profile?.jurisdiction, "Not conclusively visible in public-footprint materials."),
      business_model: firstUseful(prepared.target_profile?.business_model, "Not conclusively visible in repaired terminal JSON."),
      market_context: firstUseful(prepared.target_profile?.market_context, "AI/product diligence target."),
      product_baseline: firstUseful(prepared.target_profile?.product_baseline, prepared.target_feature_profile, "Product baseline not fully visible."),
      data_touchpoint_summary: firstUseful(prepared.target_profile?.data_touchpoint_summary, prepared.target_data_provenance_profile, "Data touchpoints require review."),
      evidence_basis: firstUseful(prepared.source_discovery_handoff?.evidence_box_manifest, "Evidence compacted during terminal repair."),
      limitations: "Target profile completed from integrated_json_report where visible."
    },

    product_activity_ip_profile: {
      product_activity_thesis: firstUseful(prepared.target_feature_profile?.product_activity_thesis, "Product/activity review generated from available public-footprint material."),
      feature_inventory_summary: firstUseful(prepared.target_feature_profile?.feature_inventory_summary, prepared.target_feature_profile, "Feature inventory not fully visible."),
      feature_table: firstUseful(prepared.target_feature_profile?.feature_table, []),
      functional_profile: firstUseful(prepared.target_feature_profile?.functional_profile, "Not fully visible."),
      risk_surface_profile: firstUseful(prepared.target_feature_profile?.risk_surface_profile, "Not fully visible."),
      ip_content_profile: firstUseful(prepared.target_feature_profile?.ip_content_profile, "AI/IP posture requires qualified review."),
      architecture_profile: firstUseful(prepared.target_feature_profile?.architecture_profile, "Not fully visible."),
      commercial_scan: firstUseful(prepared.target_feature_profile?.commercial_scan, "Not fully visible."),
      evidence_basis: firstUseful(prepared.source_discovery_handoff?.evidence_box_manifest, "Evidence compacted during terminal repair."),
      limitations: "Product/activity profile completed from available integrated_json_report material."
    },

    data_risk_provenance_controls: {
      data_risk_thesis: firstUseful(prepared.target_data_provenance_profile?.data_risk_thesis, "Data posture requires review against public policies and actual processing architecture."),
      data_flow_summary: firstUseful(prepared.target_data_provenance_profile?.data_flow_summary, prepared.target_data_provenance_profile, "Data flow summary not fully visible."),
      data_flow_table: firstUseful(prepared.target_data_provenance_profile?.data_flow_table, []),
      control_review: firstUseful(prepared.target_data_provenance_profile?.control_review, "Control review not fully visible."),
      data_gaps: firstUseful(prepared.target_data_provenance_profile?.data_gaps, ["Confirm retention, training use, subprocessors, deletion, and security controls."]),
      evidence_basis: firstUseful(prepared.source_discovery_handoff?.evidence_box_manifest, "Evidence compacted during terminal repair."),
      limitations: "Data review completed from available integrated_json_report material."
    },

    legal_document_control_review: {
      legal_document_review_thesis: firstUseful(prepared.legal_cartography_index?.legal_document_review_thesis, "Legal/governance posture requires manual document confirmation."),
      document_inventory_summary: firstUseful(prepared.legal_cartography_index?.document_inventory_summary, prepared.legal_cartography_index, "Document inventory not fully visible."),
      document_inventory: firstUseful(prepared.legal_cartography_index?.document_inventory, []),
      legal_unit_index: firstUseful(prepared.legal_cartography_index?.legal_unit_index, []),
      document_relationships: firstUseful(prepared.legal_cartography_index?.document_relationships, "Not fully visible."),
      control_signal_matrix: firstUseful(prepared.legal_cartography_index?.control_signal_matrix, []),
      document_mismatch_signals: firstUseful(prepared.legal_cartography_index?.document_mismatch_signals, []),
      qualified_review_points: ["Verify Terms, Privacy Policy, DPA/subprocessor terms, safety/security pages, and AI disclosures manually."],
      evidence_basis: firstUseful(prepared.source_discovery_handoff?.evidence_box_manifest, "Evidence compacted during terminal repair."),
      limitations: "Legal document review completed from available integrated_json_report material."
    },

    exposure_findings: {
      exposure_category_groups: firstUseful(prepared.target_exposure_profile?.exposure_category_groups, "Exposure rows grouped from visible repaired output where available."),
      finding_rows: exposureRows,
      severity_summary: firstUseful(prepared.target_exposure_profile?.severity_summary, { visible_rows: exposureRows.length }),
      control_position_summary: firstUseful(prepared.target_exposure_profile?.control_position_summary, "Control position requires review."),
      evidence_basis_summary: "Evidence basis is limited to public-footprint material visible in the model output.",
      appendix_crosswalk: exposureRows.map((row) => ({ display_exposure_id: row.display_exposure_id, source: "integrated_json_report/server_completion_guard" }))
    },

    implications_remediation_path: {
      remediation_thesis: "Use this report as a review queue, not as a legal verdict.",
      priority_actions: [
        "Confirm source evidence manually.",
        "Review missing legal/data controls.",
        "Validate exposure findings against current documents."
      ],
      document_route: "Route Terms/Privacy/DPA/security materials to qualified reviewer.",
      data_control_route: "Confirm training use, retention, deletion, subprocessors, and sensitive-data handling.",
      operational_control_route: "Confirm human review, safety controls, and incident/escalation workflows.",
      qualified_review_queue: ["Legal counsel review", "Privacy/security review", "Product owner confirmation"],
      quick_wins: ["Publish/verify legal document links", "Clarify AI/data-use disclosures", "Document human-review controls"],
      blocked_until_clarified: ["Any finding whose source evidence was compacted or not fully visible."],
      review_ready_handoff_bridge: "The report identifies review priorities for counsel/operator confirmation."
    },

    evidence_gaps_clarification_points: {
      open_information_requests: ["Provide current Terms, Privacy Policy, DPA/subprocessor list, security page, model/data-use policy."],
      missing_documents: firstUseful(prepared.legal_cartography_index?.missing_documents, []),
      missing_factual_confirmations: ["Actual model providers", "Training/fine-tuning use", "Retention/deletion controls", "Customer data categories"],
      unclear_data_flows: ["Confirm input, storage, model-processing, logging, analytics, and subprocessor flows."],
      unclear_provider_dependencies: ["Confirm all AI model, cloud, analytics, and support vendors."],
      evidence_limitations: "Grounded model output may not include complete page text or hidden documents.",
      consequence_if_unresolved: "Unresolved gaps remain review blockers, not final findings.",
      client_confirmation_questions: [
        "Which model providers are used?",
        "Is customer data used for training or fine-tuning?",
        "What documents govern enterprise customers?",
        "What human review is mandatory before output reliance?"
      ]
    },

    methodology_limitations_review_notes: {
      methodology: "Hunter monolith public-footprint diligence with Gemini grounding and deterministic server completion of missing display branches.",
      stage_roles: firstUseful(completed.input_manifest, "Module outputs were assembled into integrated_json_report."),
      status_definitions: "LOCKED means model completed the profile branch; LOCKED_WITH_LIMITATIONS means material was available but incomplete or constrained.",
      legal_limitations: "Not legal advice. Requires qualified review.",
      evidence_limitations: "Public-footprint and model-visible source limitations apply.",
      registry_use_note: "Registry findings are triage signals requiring review, not legal conclusions.",
      reviewer_notes: modelResult?.providerWarnings || []
    },

    forensic_ledger_appendix: {
      appendix_notice: "Technical appendix generated for traceability.",
      full_ledger_summary: firstUseful(report.profile_manifest, completed.input_manifest, {}),
      full_registry_ledger: firstUseful(prepared.target_exposure_profile?.full_registry_ledger, prepared.target_exposure_profile, "Full registry ledger not fully visible in repaired terminal JSON."),
      row_level_proof: firstUseful(prepared.target_exposure_profile?.row_level_proof, []),
      condition_trigger_basis: firstUseful(prepared.target_exposure_profile?.condition_trigger_basis, []),
      evidence_references: firstUseful(prepared.source_discovery_handoff?.evidence_box_manifest, []),
      operator_challenge_trace: firstUseful(prepared.operator_challenge_gate, {}),
      batch_warnings: modelResult?.providerWarnings || [],
      appendix_limitations: "Appendix reflects available integrated_json_report and server completion warnings."
    }
  };

  return {
    report_shell: {
      report_title: `${targetName} Public-Footprint Diligence Report`,
      report_subtitle: "Hunter monolith diligence report generated from public-footprint materials.",
      report_status: "RENDERED_WITH_SERVER_COMPLETION_GUARD",
      target_name: targetName,
      target_url: targetUrl,
      run_id: runId,
      generated_at: new Date().toISOString()
    },
    sections,
    renderer_contract: {
      renderer_contract_version: "screen_payload_server_completion_v1",
      source: "server_completion_guard",
      deterministic_only: true,
      no_substantive_mutation: true,
      screen_sections_supplied: Object.keys(sections),
      warning: "Display payload was generated from integrated_json_report because model omitted screen_report_payload."
    },
    display_id_index: {
      run_id: runId,
      exposure_ids: exposureRows.map((row) => row.display_exposure_id),
      source: "server_completion_guard"
    },
    platform_diligence_object: {
      target_name: targetName,
      target_url: targetUrl,
      source_mode: sourceMode,
      model_used: modelResult?.model_used || null,
      key_index_used: modelResult?.key_index_used || null,
      completion_mode: "SERVER_COMPLETED_FROM_INTEGRATED_JSON_REPORT",
      profile_manifest: report.profile_manifest || null
    }
  };
}

function buildServerCompletedVaultAssemblerHandoff({ completed, report, prepared, runMeta, executionPayload }) {
  return {
    assembler_status: "SERVER_COMPLETED_FROM_INTEGRATED_JSON_REPORT",
    assembler_version: "vault_assembler_server_completion_v1",
    target: {
      target_name: firstNonEmpty(runMeta.target_name, executionPayload.target_name, "Target"),
      target_url: firstNonEmpty(runMeta.target_url, executionPayload.target_url, "")
    },
    available_profile_keys: Object.keys(prepared || {}),
    report_meta: report.report_meta || null,
    profile_manifest: report.profile_manifest || null,
    limitations: [
      "Vault assembler branch was missing from model terminal JSON.",
      "Server generated this branch from integrated_json_report without adding new diligence facts."
    ],
    recommended_next_action: "Review generated vault_payload and final_output_handoff before client-facing use."
  };
}

function buildFallbackExposureRows({ report, prepared }) {
  const exposureProfile = firstUseful(prepared.target_exposure_profile, report.target_exposure_profile, {});
  const found = findFirstArrayByKeys(exposureProfile, [
    "finding_rows",
    "exposure_findings",
    "registry_rows",
    "evaluated_registry_rows",
    "full_registry_ledger",
    "ledger_rows"
  ]);

  if (Array.isArray(found) && found.length) {
    return found.slice(0, 24).map((item, index) => {
      const row = asPlain(item);
      return {
        display_exposure_id: firstNonEmpty(row.display_exposure_id, row.threat_id, row.THREAT_ID, `EXP-${String(index + 1).padStart(3, "0")}`),
        normalized_threat_name: firstNonEmpty(row.normalized_threat_name, row.threat_name, row.Threat_Name, row.title, "Registry exposure"),
        display_status: firstNonEmpty(row.display_status, row.evaluation_status, row.status, "Review signal"),
        plain_english_summary: firstNonEmpty(row.plain_english_summary, row.summary, row.finding, "Registry row visible in integrated_json_report; qualified review required."),
        related_activity: firstNonEmpty(row.related_activity, row.activity, row.archetype, ""),
        visible_control_position: firstNonEmpty(row.visible_control_position, row.control_position, row.control_status, ""),
        evidence_preview: firstNonEmpty(row.evidence_preview, row.evidence_basis, row.source_url, ""),
        technical_refs: firstUseful(row.technical_refs, row)
      };
    });
  }

  return [
    {
      display_exposure_id: "EXP-001",
      normalized_threat_name: "Public-footprint review limitation",
      display_status: "REVIEW_REQUIRED",
      plain_english_summary: "The repaired terminal JSON did not preserve a complete exposure finding table. Review integrated_json_report and rerun with compact terminal settings if a full registry ledger is required.",
      related_activity: "Hunter monolith output repair",
      visible_control_position: "Not fully visible in repaired terminal JSON",
      evidence_preview: "Generated by server completion guard from missing exposure rows.",
      technical_refs: { source: "handoff_completion_guard_v1" }
    }
  ];
}

function summarizeLockStatus(profileManifest) {
  const manifest = asPlain(profileManifest);
  if (!Object.keys(manifest).length) return "Integrated report available; profile lock manifest not fully visible.";
  return manifest;
}

function firstUseful(...values) {
  for (const value of values) {
    if (Array.isArray(value) && value.length) return value;
    if (isPlainObject(value) && Object.keys(value).length) return value;
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number" || typeof value === "boolean") return value;
  }
  return values[values.length - 1] ?? null;
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return "";
}

function asPlain(value) {
  return isPlainObject(value) ? value : {};
}

function deepClonePlain(value) {
  try {
    return JSON.parse(JSON.stringify(value || {}));
  } catch {
    return {};
  }
}

function findFirstArrayByKeys(value, keys) {
  if (Array.isArray(value)) return value;
  if (!isPlainObject(value)) return null;

  for (const key of keys) {
    if (Array.isArray(value[key])) return value[key];
  }

  for (const child of Object.values(value)) {
    const found = findFirstArrayByKeys(child, keys);
    if (Array.isArray(found)) return found;
  }

  return null;
}

async function extractTerminalJsonWithRepair({ text, rootKey, modelResult }) {
  try {
    return extractTerminalJson(text, rootKey);
  } catch (err) {
    const code = err?.publicCode || err?.code || "TERMINAL_JSON_PARSE_ERROR";
    const repairable = new Set([
      "JSON_OBJECT_NOT_BALANCED",
      "TERMINAL_JSON_PARSE_FAILED",
      "JSON_OBJECT_START_NOT_FOUND",
      "TERMINAL_ROOT_NOT_FOUND"
    ]);

    if (!repairable.has(code)) throw err;

    const repairResult = await callGeminiWithSimpleRotation({
      systemPrompt: buildJsonRepairSystemPrompt(rootKey),
      userPrompt: buildJsonRepairUserPrompt({ rawText: text, rootKey, originalError: code }),
      allowGrounding: false,
      terminalRootKey: rootKey
    });

    modelResult.repair_used = true;
    modelResult.repair_model_used = repairResult.model_used;
    modelResult.repair_key_index_used = repairResult.key_index_used;
    modelResult.repair_key_fingerprint_used = repairResult.key_fingerprint_used;

    modelResult.providerWarnings = [
      ...(modelResult.providerWarnings || []),
      ...(repairResult.providerWarnings || []),
      {
        code: "TERMINAL_JSON_REPAIR_USED",
        message: `Initial terminal JSON parse failed with ${code}; repaired via ${repairResult.model_used} key ${repairResult.key_index_used}.`,
        original_error: code,
        original_raw_excerpt: preview(text)
      }
    ];

    modelResult.attempts = [
      ...(modelResult.attempts || []),
      ...(repairResult.attempts || []).map((attempt) => ({
        ...attempt,
        attempt_phase: "JSON_REPAIR"
      }))
    ];

    modelResult.text = repairResult.text;
    modelResult.finishReason = modelResult.finishReason || repairResult.finishReason;
    modelResult.usageMetadata = modelResult.usageMetadata || repairResult.usageMetadata;

    return extractTerminalJson(repairResult.text, rootKey);
  }
}

function buildJsonRepairSystemPrompt(rootKey) {
  return [
    "You are a terminal JSON repair compiler.",
    "Your only job is to convert malformed, duplicated, fenced, restarted, or truncated model output into one valid JSON object.",
    `The required root is {\"${rootKey}\":{...}}.`,
    "Output JSON only. No markdown. No fenced code block. No commentary. No explanation.",
    "Do not invent new diligence facts. Preserve only information visible in the raw text.",
    "If a branch is incomplete, create a compact limitation/warning inside the output rather than fabricating missing substance.",
    "Keep source custody compact. Do not emit full clean_text, full page text, or repeated evidence payload dumps.",
    "Preserve registry/exposure statuses that are visible in the raw text. If the raw text does not contain the full registry ledger, state that limitation instead of inventing rows."
  ].join("\\n");
}

function buildJsonRepairUserPrompt({ rawText, rootKey, originalError }) {
  return [
    "Repair the raw model output into valid terminal JSON.",
    `Original parser error: ${originalError}`,
    `Required root: ${rootKey}`,
    "Rules:",
    "1. Return exactly one JSON object.",
    "2. Remove markdown fences and duplicate/restarted JSON roots.",
    "3. Do not add facts not present in the raw output.",
    "4. Compact incomplete source evidence instead of dumping raw text.",
    "5. If content is incomplete, include limitations/final_quality_control warnings.",
    "",
    "----- RAW OUTPUT START -----",
    truncateForRepair(rawText),
    "----- RAW OUTPUT END -----"
  ].join("\\n");
}

function truncateForRepair(value) {
  const text = String(value || "");
  const max = Number(process.env.JSON_REPAIR_INPUT_CHARS || 180000);
  if (text.length <= max) return text;
  return text.slice(0, max) + "\\n\\n[TRUNCATED_FOR_JSON_REPAIR_AFTER_" + max + "_CHARS]";
}

function extractTerminalJson(text, rootKey) {
  const cleaned = stripJsonFence(String(text || "").trim());
  const direct = tryParseJson(cleaned);
  if (isPlainObject(direct) && isPlainObject(direct[rootKey])) return direct;

  const rootIndex = cleaned.indexOf(`"${rootKey}"`);
  if (rootIndex === -1) {
    throw createPublicError("TERMINAL_ROOT_NOT_FOUND", `Could not find ${rootKey} in model output.`, { stage: "JSON_PARSE", raw_model_excerpt: preview(text) });
  }

  const start = cleaned.lastIndexOf("{", rootIndex);
  if (start === -1) {
    throw createPublicError("JSON_OBJECT_START_NOT_FOUND", "Could not locate JSON object start before terminal root.", { stage: "JSON_PARSE", raw_model_excerpt: preview(text) });
  }

  const extracted = extractBalancedJsonObject(cleaned, start);
  const parsed = tryParseJson(extracted);
  if (!isPlainObject(parsed) || !isPlainObject(parsed[rootKey])) {
    throw createPublicError("TERMINAL_JSON_PARSE_FAILED", "Model output did not parse into the required terminal JSON root.", { stage: "JSON_PARSE", raw_model_excerpt: preview(text) });
  }
  return parsed;
}

function stripJsonFence(value) {
  return value
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function extractBalancedJsonObject(text, start) {
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  throw createPublicError("JSON_OBJECT_NOT_BALANCED", "Could not extract a balanced JSON object.", { stage: "JSON_PARSE", raw_model_excerpt: preview(text) });
}

function safeRender({ run, terminalJson, modelResult }) {
  try {
    return renderDiligenceReport({
      run,
      response: {
        run_id: run.run_id,
        status: "COMPLETE",
        final_output_handoff: terminalJson?.final_output_handoff,
        model_result_meta: {
          model_used: modelResult.model_used,
          key_index_used: modelResult.key_index_used,
          usage_metadata: modelResult.usageMetadata || null
        }
      },
      phaseOutputs: { P7: terminalJson },
      upstream: {},
      runtimeTrace: { mode: MODE, attempts: modelResult.attempts }
    });
  } catch (err) {
    return { renderer_output: { render_status: "RENDER_FAILED", html_report: fallbackHtml(terminalJson?.final_output_handoff || {}), renderer_error: err?.message || String(err) } };
  }
}

function safeVault({ terminalJson, runId, executionPayload, htmlReport, events }) {
  try {
    return buildVaultHandoff({ terminalJson, runId, executionPayload, htmlReport, events });
  } catch (err) {
    return { ok: false, error: "VAULT_BRIDGE_FAILED", message: err?.message || String(err) };
  }
}

function fallbackHtml(finalOutputHandoff) {
  const title = escapeHtml(firstString(finalOutputHandoff?.screen_report_payload?.report_shell?.title, "Interface Diligence Report"));
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial,sans-serif;margin:32px;line-height:1.5}pre{white-space:pre-wrap;background:#f6f6f6;padding:16px;border-radius:8px}</style></head><body><h1>${title}</h1><p>Renderer fallback. The terminal JSON was produced, but the structured screen report payload was incomplete or renderer-compatible output was unavailable.</p><pre>${escapeHtml(JSON.stringify(finalOutputHandoff, null, 2))}</pre></body></html>`;
}

function classifyGeminiError(err) {
  const message = String(err?.message || "").toLowerCase();
  const code = String(err?.payload?.error?.status || err?.errorClass || "").toUpperCase();
  const retryAfterSeconds = extractRetryAfterSeconds(err?.message || "");
  if (message.includes("quota") || message.includes("rate limit") || code.includes("RESOURCE_EXHAUSTED")) return { errorClass: "PROJECT_BLOCKED", retryAfterSeconds, terminal: false };
  if (message.includes("api key") || message.includes("permission") || code.includes("PERMISSION")) return { errorClass: "KEY_OR_PERMISSION_ERROR", retryAfterSeconds, terminal: false };
  if (message.includes("timeout") || message.includes("aborted")) return { errorClass: "TIMEOUT", retryAfterSeconds, terminal: false };
  if (message.includes("blocked") || message.includes("safety")) return { errorClass: "SAFETY_BLOCKED", retryAfterSeconds, terminal: true };
  if (message.includes("invalid argument") || code.includes("INVALID_ARGUMENT")) return { errorClass: "INPUT_OR_PROMPT_INVALID", retryAfterSeconds, terminal: false };
  return { errorClass: "UNKNOWN_PROVIDER_ERROR", retryAfterSeconds, terminal: false };
}

function decideRotation({ model, models, keyIndex, keyCount, errorClass }) {
  if (keyIndex < keyCount - 1) return "ROTATE_KEY_SAME_MODEL";
  if (models.indexOf(model) < models.length - 1) return "ROTATE_MODEL_AFTER_ALL_KEYS";
  return "TERMINAL_FAIL";
}

function createPublicError(publicCode, publicMessage, extras = {}) {
  const err = new Error(publicMessage);
  err.publicCode = publicCode;
  err.publicMessage = publicMessage;
  Object.assign(err, extras);
  return err;
}

function extractRetryAfterSeconds(value) {
  const m = String(value || "").match(/retry in\s+([0-9.]+)s/i);
  return m ? Number(m[1]) : 0;
}

function tryParseJson(value) {
  try { return JSON.parse(value); } catch { return null; }
}

function makeRunId() {
  return `hunter_${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}_${crypto.randomUUID()}`;
}

function fingerprint(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex").slice(0, 12);
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

function unique(values) {
  return [...new Set(values)];
}

function nullableString(value) {
  const text = String(value ?? "").trim();
  return text || null;
}

function firstString(...values) {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return "";
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function preview(value) {
  const text = String(value || "");
  return text.length > RAW_MODEL_PREVIEW_CHARS ? `${text.slice(0, RAW_MODEL_PREVIEW_CHARS)}\n...[truncated ${text.length - RAW_MODEL_PREVIEW_CHARS} chars]` : text;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
