import express from "express";
import helmet from "helmet";
import path from "path";
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
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_API_KEYS = parseKeyPool();

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);
app.use(express.json({ limit: "5mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "interface-diligence-system",
    mode: DILIGENCE_MODE,
    model: GEMINI_MODEL,
    key_pool_size: GEMINI_API_KEYS.length
  });
});

app.post("/api/diligence/run", async (req, res) => {
  try {
    const targetUrl = String(req.body?.target_url || "").trim();
    const sourceMode = String(req.body?.source_mode || "url").trim();

    if (!targetUrl && sourceMode !== "text") {
      return res.status(400).json({
        ok: false,
        error: "TARGET_URL_REQUIRED"
      });
    }

    const runId = createRunId();
    const runtimePayload = buildDiligenceRuntimePayload({
      run_id: runId,
      source_mode: sourceMode,
      target_url: targetUrl,
      pasted_public_material: req.body?.pasted_public_material || "",
      company_name: req.body?.company_name || ""
    });

    if (DILIGENCE_MODE !== "live") {
      return res.json(buildMockResult(runtimePayload));
    }

    if (!GEMINI_API_KEYS.length) {
      return res.status(500).json({
        ok: false,
        error: "GEMINI_API_KEYS_NOT_CONFIGURED"
      });
    }

    const userPrompt = buildDiligenceUserPrompt({ runtimePayload });
    const rawText = await callGeminiWithFallback({
      systemPrompt: DILIGENCE_SYSTEM_PROMPT,
      userPrompt
    });
    const parsed = parseDiligenceOutput(rawText);

    return res.json({
      ok: true,
      run_id: runId,
      target_url: targetUrl,
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
        has_handoff: Boolean(req.body?.vault_assembly_handoff)
      }
    });
  }

  try {
    const response = await fetch(vaultUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.VAULT_ASSEMBLY_TOKEN
          ? { authorization: `Bearer ${process.env.VAULT_ASSEMBLY_TOKEN}` }
          : {})
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
    return res.status(502).json({
      ok: false,
      error: "VAULT_PUSH_FAILED",
      message: err?.message || String(err)
    });
  }
});

app.listen(PORT, () => {
  console.log(`Interface Diligence System listening on :${PORT}`);
  console.log(`Mode: ${DILIGENCE_MODE}`);
  console.log(`Gemini model: ${GEMINI_MODEL}`);
  console.log(`Gemini key pool size: ${GEMINI_API_KEYS.length}`);
});

function parseKeyPool() {
  const multi = process.env.GEMINI_API_KEYS || "";
  const single = process.env.GEMINI_API_KEY || "";
  const keys = multi.split(",").map((x) => x.trim()).filter(Boolean);
  if (single.trim()) keys.push(single.trim());
  return Array.from(new Set(keys));
}

function createRunId() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 8);
  return `diligence_${stamp}_${rand}`;
}

function buildMockResult(runtimePayload) {
  return {
    ok: true,
    run_id: runtimePayload.run_id,
    target_url: runtimePayload.target_url,
    status: "MOCK_COMPLETED",
    parse_status: "MOCK",
    html_report: `<div class="interface-report"><h1>Diligence System Skeleton Live</h1><p>Target accepted: ${escapeHtml(runtimePayload.target_url)}</p><p>This is Phase 0 mock output. Prompt and reference documents are not wired yet.</p></div>`,
    technical_audit_log: "MOCK_PHASE_0: Diligence System shell received the runtime payload and returned a mock report.",
    operator_challenge_gate: {
      completed: false,
      result: "MOCK_NOT_RUN",
      notes: ["Prompt-layer execution is intentionally not wired in Phase 0."]
    },
    machine_json: {
      target_profile: {
        website: runtimePayload.target_url,
        company_name: runtimePayload.company_name || "N/A"
      },
      source_review: {
        mode: "MOCK"
      }
    },
    vault_assembly_handoff: {
      source: "interface_diligence_system",
      handoff_version: "phase_0_mock",
      run_id: runtimePayload.run_id,
      target_url: runtimePayload.target_url,
      handoff_envelope: {
        status: "MOCK_READY",
        warnings: ["Vault handoff contract placeholder only. Real contract to be wired after shell lock."]
      }
    },
    raw_output: ""
  };
}

async function callGeminiWithFallback({ systemPrompt, userPrompt }) {
  const errors = [];

  for (let i = 0; i < GEMINI_API_KEYS.length; i += 1) {
    try {
      const text = await callGeminiOnce({
        apiKey: GEMINI_API_KEYS[i],
        systemPrompt,
        userPrompt
      });
      if (text && text.trim()) return text;
      errors.push({ key_index: i, error: "EMPTY_RESPONSE" });
    } catch (err) {
      const message = err?.message || String(err);
      errors.push({ key_index: i, error: message });
      console.warn(`[gemini] key ${i + 1} failed: ${message}`);
    }
  }

  throw new Error(`ALL_GEMINI_KEYS_FAILED: ${JSON.stringify(errors).slice(0, 1500)}`);
}

async function callGeminiOnce({ apiKey, systemPrompt, userPrompt }) {
  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.2,
          topP: 0.9,
          maxOutputTokens: 65535,
          responseMimeType: "application/json"
        }
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
    return {
      parse_status: "JSON_OK",
      raw_output: trimmed,
      status: json.status || "COMPLETED",
      technical_audit_log: json.technical_audit_log || "",
      operator_challenge_gate: json.operator_challenge_gate || {},
      machine_json: json.machine_json || {},
      html_report: json.html_report || "",
      vault_assembly_handoff: json.vault_assembly_handoff || {}
    };
  } catch {
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
}

function stripJsonFence(text) {
  return text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
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
