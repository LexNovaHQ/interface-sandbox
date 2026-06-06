import { maskConfigured } from "../_shared/aiProviderConfig.js";
import { jsonResponse, methodNotAllowed } from "../_shared/response.js";

const GEMINI_OK_PROMPT = "Return JSON only with this exact shape: {\"status\":\"GEMINI_OK\"}";

function safeModelName(model) {
  return String(model || "gemini-3.5-flash").replace(/^models\//, "");
}

function safeErrorMessage(error, fallback = "Gemini smoke test failed") {
  if (!error) return fallback;
  if (error.name === "AbortError") return "Gemini smoke test timed out";
  return fallback;
}

function extractGeminiText(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("")
    .trim();
}

function stripJsonFences(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed.startsWith("```")) return trimmed;
  return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function parseSmokeJson(text) {
  const candidate = stripJsonFences(text);
  try {
    return JSON.parse(candidate);
  } catch (error) {
    return null;
  }
}

function safeCandidateDiagnostics(payload) {
  const candidate = payload?.candidates?.[0] || null;
  const parts = candidate?.content?.parts || [];

  return {
    candidate_count: Array.isArray(payload?.candidates) ? payload.candidates.length : 0,
    finish_reason: candidate?.finishReason || "unknown",
    parts_count: Array.isArray(parts) ? parts.length : 0,
    safety_ratings: candidate?.safetyRatings || [],
    usage_metadata: payload?.usageMetadata || null
  };
}

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  const env = context.env || {};
  const configured = maskConfigured(env.GEMINI_API_KEY);
  const model = safeModelName(env.GEMINI_PRIMARY_MODEL);

  if (!configured) {
    return jsonResponse(
      {
        ok: false,
        provider: "gemini",
        configured: false,
        error: "GEMINI_API_KEY missing"
      },
      { status: 503 }
    );
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: GEMINI_OK_PROMPT }]
          }
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 64,
          responseMimeType: "application/json"
        }
      })
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      return jsonResponse(
        {
          ok: false,
          provider: "gemini",
          model,
          configured: true,
          status: response.status,
          error: payload?.error?.message || "Gemini request failed"
        },
        { status: 502 }
      );
    }

    const responsePreview = extractGeminiText(payload);
    const parsed = parseSmokeJson(responsePreview);
    const testPassed = parsed?.status === "GEMINI_OK" || responsePreview.includes("GEMINI_OK");

    return jsonResponse({
      ok: true,
      provider: "gemini",
      model,
      configured: true,
      test_passed: testPassed,
      response_preview: responsePreview.slice(0, 160),
      parsed_status: parsed?.status || null,
      diagnostics: safeCandidateDiagnostics(payload)
    });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        provider: "gemini",
        model,
        configured: true,
        error: safeErrorMessage(error)
      },
      { status: 502 }
    );
  }
}
