import express from "express";
import helmet from "helmet";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import {
  DILIGENCE_SYSTEM_PROMPT,
  buildDiligenceRuntimePayload,
  buildDiligenceUserPrompt
} from "./prompts/diligence-prompt.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 8080);
const DILIGENCE_MODE = process.env.DILIGENCE_MODE || "mock";
const DEFAULT_GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
const GEMINI_MODELS = parseModelPool();
const GEMINI_MODEL = GEMINI_MODELS[0] || DEFAULT_GEMINI_MODELS[0];
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 240000);
const GEMINI_PING_TIMEOUT_MS = Number(process.env.GEMINI_PING_TIMEOUT_MS || 30000);
const GEMINI_MAX_OUTPUT_TOKENS = Number(process.env.GEMINI_MAX_OUTPUT_TOKENS || 65535);
const GEMINI_PING_MAX_OUTPUT_TOKENS = Number(process.env.GEMINI_PING_MAX_OUTPUT_TOKENS || 128);
const GEMINI_API_KEYS = parseKeyPool();
const GEMINI_POOL = buildGeminiPool(GEMINI_API_KEYS);
const GEMINI_MODEL_POOL = buildGeminiModelPool(GEMINI_MODELS);

const PROMPT_LIVE_FILES = {
  monolith: "prompts/01_DILIGENCE_RUNTIME_GPT_v1.md",
  registryKey: "reference/REGISTRY_KEY_v3_0.md",
  registryCsv: "reference/AI_THREAT_REGISTRY_REGISTRY.csv",
  hunterEngineRules: "reference/AI_THREAT_REGISTRY_HUNTER_ENGINE_RULES.csv",
  vaultMap: "reference/VAULT_JS_CANONICAL_MAP_v1.md",
  contractSpine: "reference/INTERFACE_DILIGENCE_CONTRACT_SPINE_v1.md"
};

const referenceBundlePromise = loadReferenceBundle();

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (_req, res) => {
  res.redirect(302, "/diligence.html");
});

app.get("/health", async (_req, res) => {
  const referenceBundle = await safeReferenceBundle();
  res.json({
    ok: true,
    service: "interface-diligence-system",
    mode: DILIGENCE_MODE,
    supported_modes: ["mock", "live", "prompt_live"],
    model: GEMINI_MODEL,
    models: GEMINI_MODELS,
    model_pool_size: GEMINI_MODEL_POOL.length,
    gemini_ready: GEMINI_POOL.length > 0 && GEMINI_MODEL_POOL.length > 0,
    key_pool_size: GEMINI_POOL.length,
    key_pool: publicPoolSnapshot(),
    timeouts: {
      gemini_timeout_ms: GEMINI_TIMEOUT_MS,
      gemini_ping_timeout_ms: GEMINI_PING_TIMEOUT_MS
    },
    output_limits: {
      gemini_max_output_tokens: GEMINI_MAX_OUTPUT_TOKENS,
      gemini_ping_max_output_tokens: GEMINI_PING_MAX_OUTPUT_TOKENS
    },
    prompt_live_ready: referenceBundle.ok,
    prompt_live_files: referenceBundle.manifest || [],
    registry_row_count_estimate: referenceBundle.registry_row_count_estimate || 0,
    reference_load_error: referenceBundle.ok ? null : referenceBundle.error
  });
});

app.get("/api/gemini/pool", (_req, res) => {
  res.json({
    ok: true,
    model: GEMINI_MODEL,
    models: GEMINI_MODELS,
    model_pool_size: GEMINI_MODEL_POOL.length,
    configured: GEMINI_POOL.length > 0 && GEMINI_MODEL_POOL.length > 0,
    key_pool_size: GEMINI_POOL.length,
    pool: publicPoolSnapshot(),
    mode: DILIGENCE_MODE,
    note: "Keys are server-side only. Raw key material is never returned."
  });
});

app.post("/api/gemini/ping", async (_req, res) => {
  if (!GEMINI_POOL.length) {
    return res.status(500).json({ ok: false, error: "GEMINI_API_KEYS_NOT_CONFIGURED" });
  }

  const startedAt = Date.now();
  try {
    const result = await callGeminiWithFallback({
      systemPrompt: "You are a server health-check responder. Return only valid JSON.",
      userPrompt: "Return exactly this JSON shape with no markdown: {\"ok\":true,\"ping\":\"pong\"}",
      responseMimeType: "application/json",
      timeoutMs: GEMINI_PING_TIMEOUT_MS,
      maxOutputTokens: GEMINI_PING_MAX_OUTPUT_TOKENS,
      temperature: 0,
      returnMeta: true
    });

    return res.json({
      ok: true,
      model: result.model,
      key_index: result.key_index,
      key_fingerprint: result.fingerprint,
      models: GEMINI_MODELS,
      key_pool_size: GEMINI_POOL.length,
      latency_ms: Date.now() - startedAt,
      response: safeJsonOrText(stripJsonFence(result.text))
    });
  } catch (err) {
    return res.status(502).json({
      ok: false,
      error: "GEMINI_PING_FAILED",
      message: err?.message || String(err),
      latency_ms: Date.now() - startedAt
    });
  }
});

app.post("/api/diligence/run", async (req, res) => {
  try {
    const targetUrl = String(req.body?.target_url || "").trim();
    const sourceMode = String(req.body?.source_mode || "url").trim();

    if (!targetUrl && sourceMode !== "text") {
      return res.status(400).json({ ok: false, error: "TARGET_URL_REQUIRED" });
    }

    const runId = createRunId();
    const runtimePayload = buildDiligenceRuntimePayload({
      run_id: runId,
      source_mode: sourceMode,
      target_url: targetUrl,
      pasted_public_material: req.body?.pasted_public_material || "",
      company_name: req.body?.company_name || ""
    });

    if (DILIGENCE_MODE === "mock") {
      return res.json(buildMockResult(runtimePayload));
    }

    if (!GEMINI_POOL.length) {
      return res.status(500).json({
        ok: false,
        error: "GEMINI_API_KEYS_NOT_CONFIGURED",
        key_pool_size: 0
      });
    }

    if (DILIGENCE_MODE === "prompt_live") {
      const referenceBundle = await referenceBundlePromise;
      const hybridEvidencePacket = buildHybridEvidencePacket(runtimePayload);
      const userPrompt = buildPromptLiveUserPrompt({ runtimePayload, hybridEvidencePacket, referenceBundle });
      const result = await callGeminiWithFallback({
        systemPrompt: referenceBundle.monolith,
        userPrompt,
        responseMimeType: "text/plain",
        timeoutMs: GEMINI_TIMEOUT_MS,
        maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
        temperature: 0.2,
        returnMeta: true
      });
      const parsed = parseDiligenceOutput(result.text);

      return res.json({
        ok: true,
        run_id: runId,
        target_url: targetUrl,
        mode: DILIGENCE_MODE,
        model: result.model,
        key_index: result.key_index,
        key_pool_size: GEMINI_POOL.length,
        model_pool_size: GEMINI_MODEL_POOL.length,
        prompt_bundle: referenceBundle.manifest,
        hybrid_evidence_packet: hybridEvidencePacket,
        parse_status: parsed.parse_status,
        ...parsed
      });
    }

    if (DILIGENCE_MODE !== "live") {
      return res.status(400).json({
        ok: false,
        error: "UNSUPPORTED_DILIGENCE_MODE",
        mode: DILIGENCE_MODE,
        supported_modes: ["mock", "live", "prompt_live"]
      });
    }

    const userPrompt = buildDiligenceUserPrompt({ runtimePayload });
    const result = await callGeminiWithFallback({
      systemPrompt: DILIGENCE_SYSTEM_PROMPT,
      userPrompt,
      responseMimeType: "application/json",
      timeoutMs: GEMINI_TIMEOUT_MS,
      maxOutputTokens: Math.min(GEMINI_MAX_OUTPUT_TOKENS, 8192),
      temperature: 0.2,
      returnMeta: true
    });
    const parsed = parseDiligenceOutput(result.text);

    return res.json({
      ok: true,
      run_id: runId,
      target_url: targetUrl,
      mode: DILIGENCE_MODE,
      model: result.model,
      key_index: result.key_index,
      key_pool_size: GEMINI_POOL.length,
      model_pool_size: GEMINI_MODEL_POOL.length,
      parse_status: parsed.parse_status,
      ...parsed
    });
  } catch (err) {
    console.error("[diligence/run] failed", err);
    return res.status(500).json({
      ok: false,
      error: "DILIGENCE_RUN_FAILED",
      message: err?.message || String(err)
    });
  }
});

app.post("/api/vault/push", async (req, res) => {
  const vaultUrl = process.env.VAULT_ASSEMBLY_ENDPOINT || "";
  if (!vaultUrl) {
    return res.json({
      ok: true,
      mode: "LOCAL_ACK_ONLY",
      message: "Vault Assembly endpoint not configured. Handoff payload accepted locally.",
      received: {
        run_id: req.body?.run_id || "N/A",
        has_handoff: Boolean(req.body?.vault_assembly_handoff),
        has_machine_json: Boolean(req.body?.machine_json),
        has_html_report: Boolean(req.body?.html_report)
      }
    });
  }

  try {
    const response = await fetch(vaultUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.VAULT_ASSEMBLY_TOKEN ? { authorization: `Bearer ${process.env.VAULT_ASSEMBLY_TOKEN}` } : {})
      },
      body: JSON.stringify(req.body)
    });
    const text = await response.text();
    return res.status(response.ok ? 200 : 502).json({
      ok: response.ok,
      status: response.status,
      vault_response: safeJsonOrText(text)
    });
  } catch (err) {
    return res.status(502).json({ ok: false, error: "VAULT_PUSH_FAILED", message: err?.message || String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Interface Diligence System listening on :${PORT}`);
  console.log(`Mode: ${DILIGENCE_MODE}`);
  console.log(`Gemini models: ${GEMINI_MODELS.join(", ")}`);
  console.log(`Gemini key pool size: ${GEMINI_POOL.length}`);
});

function parseKeyPool() {
  const multi = process.env.GEMINI_API_KEYS || "";
  const single = process.env.GEMINI_API_KEY || "";
  const keys = multi.split(",").map((x) => x.trim()).filter(Boolean);
  if (single.trim()) keys.push(single.trim());
  return Array.from(new Set(keys));
}

function parseModelPool() {
  const multi = process.env.GEMINI_MODELS || "";
  const single = process.env.GEMINI_MODEL || "";
  const raw = multi.trim() ? multi : single;
  const models = raw.split(",").map((x) => x.trim()).filter(Boolean);
  return Array.from(new Set(models.length ? models : DEFAULT_GEMINI_MODELS));
}

function buildGeminiPool(keys) {
  return keys.map((key, index) => ({
    index: index + 1,
    key,
    fingerprint: crypto.createHash("sha256").update(key).digest("hex").slice(0, 12)
  }));
}

function buildGeminiModelPool(models) {
  return models.map((model, index) => ({ index: index + 1, model }));
}

function publicPoolSnapshot() {
  return GEMINI_POOL.map((entry) => ({
    index: entry.index,
    configured: true,
    fingerprint: entry.fingerprint
  }));
}

function createRunId() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 8);
  return `diligence_${stamp}_${rand}`;
}

async function safeReferenceBundle() {
  try {
    return await referenceBundlePromise;
  } catch (err) {
    return { ok: false, error: err?.message || String(err), manifest: [] };
  }
}

async function loadReferenceBundle() {
  const entries = await Promise.all(
    Object.entries(PROMPT_LIVE_FILES).map(async ([key, relativePath]) => {
      const absolutePath = path.join(__dirname, relativePath);
      const content = await fs.readFile(absolutePath, "utf8");
      return [key, { relativePath, content, chars: content.length }];
    })
  );

  const bundle = Object.fromEntries(entries);
  const registryRowCount = estimateCsvDataRows(bundle.registryCsv.content);
  return {
    ok: true,
    monolith: bundle.monolith.content,
    registryKey: bundle.registryKey.content,
    registryCsv: bundle.registryCsv.content,
    hunterEngineRules: bundle.hunterEngineRules.content,
    vaultMap: bundle.vaultMap.content,
    contractSpine: bundle.contractSpine.content,
    registry_row_count_estimate: registryRowCount,
    manifest: Object.entries(bundle).map(([key, value]) => ({
      key,
      path: value.relativePath,
      chars: value.chars
    }))
  };
}

function estimateCsvDataRows(csvText) {
  return Math.max(0, String(csvText || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean).length - 1);
}

function buildHybridEvidencePacket(runtimePayload) {
  return {
    mode: "hybrid_v0",
    status: "INITIALIZED_NO_DIRECT_FETCHER_YET",
    target_url: runtimePayload.target_url || "N/A",
    source_mode: runtimePayload.source_mode,
    direct_fetch_attempts: [],
    evidence_buffer: [],
    artifact_inventory: [],
    warnings: [
      "HYBRID_PACKET_INITIALIZED_NO_FETCHER_YET",
      "SERVER_REFERENCE_BUNDLE_LOADED",
      "MODEL_MUST_USE_ONLY_FIRST_PARTY_OR_PASTED_PUBLIC_MATERIAL"
    ]
  };
}

function buildPromptLiveUserPrompt({ runtimePayload, hybridEvidencePacket, referenceBundle }) {
  return [
    "# EXECUTION COMMAND",
    "Run the Diligence Engine against exactly one target using the runtime payload below.",
    "Do not use private documents. Do not use prior memory. Obey the monolithic prompt and reference documents.",
    "",
    "# RUNTIME PAYLOAD",
    fencedJson(runtimePayload),
    "",
    "# HYBRID EVIDENCE PACKET",
    "The server-side hybrid evidence packet is provided for runtime compatibility. In this v0 shell it may be empty until the direct fetcher is added.",
    fencedJson(hybridEvidencePacket),
    "",
    "# REFERENCE DOCUMENTS",
    "These files are authoritative runtime references. Apply them in the priority and boundaries specified by the Diligence Runtime.",
    "",
    "## REGISTRY_KEY_v3_0.md",
    fencedText(referenceBundle.registryKey),
    "",
    "## AI_THREAT_REGISTRY_REGISTRY.csv",
    fencedText(referenceBundle.registryCsv),
    "",
    "## AI_THREAT_REGISTRY_HUNTER_ENGINE_RULES.csv",
    fencedText(referenceBundle.hunterEngineRules),
    "",
    "## VAULT_JS_CANONICAL_MAP_v1.md",
    fencedText(referenceBundle.vaultMap),
    "",
    "## INTERFACE_DILIGENCE_CONTRACT_SPINE_v1.md",
    fencedText(referenceBundle.contractSpine),
    "",
    "# TERMINAL OUTPUT REQUIREMENT",
    "Return the full terminal sequence required by the monolithic Diligence Runtime:",
    "1. <technical_audit_log> ... </technical_audit_log>",
    "2. <operator_challenge_gate> ... </operator_challenge_gate>",
    "3. fenced json Machine JSON Payload including assembly_handoff",
    "4. fenced html final report"
  ].join("\n");
}

function fencedJson(value) {
  return `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``;
}

function fencedText(value) {
  return `\`\`\`text\n${String(value || "")}\n\`\`\``;
}

function buildMockResult(runtimePayload) {
  return {
    ok: true,
    run_id: runtimePayload.run_id,
    target_url: runtimePayload.target_url,
    status: "MOCK_COMPLETED",
    parse_status: "MOCK",
    html_report: `<div class="interface-report"><h1>Diligence System Skeleton Live</h1><p>Target accepted: ${escapeHtml(runtimePayload.target_url)}</p><p>This is mock output. Prompt and reference documents are present. Real execution is available only in live or prompt_live mode.</p></div>`,
    technical_audit_log: "MOCK: Diligence System shell received the runtime payload and returned a mock report.",
    operator_challenge_gate: {
      completed: false,
      result: "MOCK_NOT_RUN",
      notes: ["Prompt-layer execution is intentionally skipped in mock mode."]
    },
    machine_json: {
      target_profile: {
        website: runtimePayload.target_url,
        company_name: runtimePayload.company_name || "N/A"
      },
      source_review: { mode: "MOCK" }
    },
    vault_assembly_handoff: {
      source: "interface_diligence_system",
      handoff_version: "mock_reference_ready",
      run_id: runtimePayload.run_id,
      target_url: runtimePayload.target_url,
      handoff_envelope: {
        status: "MOCK_READY",
        warnings: ["Vault handoff contract placeholder only. Real output available in live/prompt_live mode."]
      }
    },
    raw_output: ""
  };
}

async function callGeminiWithFallback({
  systemPrompt,
  userPrompt,
  responseMimeType,
  timeoutMs = GEMINI_TIMEOUT_MS,
  maxOutputTokens = GEMINI_MAX_OUTPUT_TOKENS,
  temperature = 0.2,
  returnMeta = false
}) {
  const errors = [];

  for (const modelEntry of GEMINI_MODEL_POOL) {
    for (const poolEntry of GEMINI_POOL) {
      try {
        const text = await callGeminiOnce({
          apiKey: poolEntry.key,
          model: modelEntry.model,
          systemPrompt,
          userPrompt,
          responseMimeType,
          timeoutMs,
          maxOutputTokens,
          temperature
        });
        if (text && text.trim()) {
          const result = {
            text,
            model: modelEntry.model,
            key_index: poolEntry.index,
            fingerprint: poolEntry.fingerprint
          };
          return returnMeta ? result : text;
        }
        errors.push({ model: modelEntry.model, key_index: poolEntry.index, fingerprint: poolEntry.fingerprint, error: "EMPTY_RESPONSE" });
      } catch (err) {
        const message = err?.message || String(err);
        errors.push({ model: modelEntry.model, key_index: poolEntry.index, fingerprint: poolEntry.fingerprint, error: message });
        console.warn(`[gemini] model ${modelEntry.model} key ${poolEntry.index} failed: ${message}`);
      }
    }
  }

  throw new Error(`ALL_GEMINI_MODEL_KEY_COMBINATIONS_FAILED: ${JSON.stringify(errors).slice(0, 2500)}`);
}

async function callGeminiOnce({
  apiKey,
  model,
  systemPrompt,
  userPrompt,
  responseMimeType,
  timeoutMs = GEMINI_TIMEOUT_MS,
  maxOutputTokens = GEMINI_MAX_OUTPUT_TOKENS,
  temperature = 0.2
}) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const generationConfig = { temperature, topP: 0.9, maxOutputTokens };
  if (responseMimeType && responseMimeType !== "text/plain") {
    generationConfig.responseMimeType = responseMimeType;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig
      })
    });

    const bodyText = await response.text();
    if (!response.ok) throw new Error(`GEMINI_HTTP_${response.status}: ${bodyText.slice(0, 1000)}`);

    const body = JSON.parse(bodyText);
    const text = body?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n") || "";
    if (!text.trim()) throw new Error(`GEMINI_EMPTY_TEXT: ${bodyText.slice(0, 1000)}`);
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

function parseDiligenceOutput(rawText) {
  const trimmed = String(rawText || "").trim();
  try {
    const json = JSON.parse(stripJsonFence(trimmed));
    return normalizeParsedJson(json, trimmed);
  } catch {
    // Continue to fenced-output parser.
  }

  const technicalAuditLog = extractTaggedBlock(trimmed, "technical_audit_log");
  const operatorChallengeRaw = extractTaggedBlock(trimmed, "operator_challenge_gate");
  const jsonFence = extractFence(trimmed, "json");
  const htmlFence = extractFence(trimmed, "html");

  if (technicalAuditLog || operatorChallengeRaw || jsonFence || htmlFence) {
    const machineJson = safeJsonOrText(jsonFence || "");
    return {
      parse_status: "FENCED_OUTPUT_OK",
      raw_output: trimmed,
      status: "COMPLETED",
      technical_audit_log: technicalAuditLog || "",
      operator_challenge_gate: safeJsonOrText(operatorChallengeRaw || "{}"),
      machine_json: typeof machineJson === "object" ? machineJson : { raw_machine_json: machineJson },
      html_report: htmlFence || `<div class="interface-report"><h2>Diligence Output</h2><pre>${escapeHtml(trimmed)}</pre></div>`,
      vault_assembly_handoff: extractVaultHandoff(machineJson)
    };
  }

  return {
    parse_status: "RAW_FALLBACK",
    raw_output: trimmed,
    status: "PARTIAL",
    technical_audit_log: "",
    operator_challenge_gate: {},
    machine_json: {},
    html_report: `<div class="interface-report"><h2>Raw Diligence Output</h2><pre>${escapeHtml(trimmed)}</pre></div>`,
    vault_assembly_handoff: {}
  };
}

function normalizeParsedJson(json, rawText) {
  const machineJson = json.machine_json || json;
  return {
    parse_status: "JSON_OK",
    raw_output: rawText,
    status: json.status || "COMPLETED",
    technical_audit_log: json.technical_audit_log || "",
    operator_challenge_gate: json.operator_challenge_gate || {},
    machine_json: machineJson || {},
    html_report: json.html_report || json.report_html || "",
    vault_assembly_handoff: json.vault_assembly_handoff || extractVaultHandoff(machineJson)
  };
}

function extractVaultHandoff(machineJson) {
  if (!machineJson || typeof machineJson !== "object") return {};
  return machineJson.vault_assembly_handoff || machineJson.assembly_handoff || machineJson.handoff_envelope || {};
}

function extractTaggedBlock(text, tagName) {
  const pattern = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = String(text || "").match(pattern);
  return match?.[1]?.trim() || "";
}

function extractFence(text, lang) {
  const pattern = new RegExp("```" + lang + "\\s*([\\s\\S]*?)```", "i");
  const match = String(text || "").match(pattern);
  return match?.[1]?.trim() || "";
}

function stripJsonFence(text) {
  return String(text || "").replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeJsonOrText(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
