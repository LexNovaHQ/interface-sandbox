import { maskConfigured } from "../_shared/aiProviderConfig.js";
import { jsonResponse, methodNotAllowed } from "../_shared/response.js";

const GEMINI_OK_PROMPT = "Reply with exactly: GEMINI_OK";

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
            parts: [{ text: GEMINI_OK_PROMPT }]
          }
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 16
        }
      })
    });

    if (!response.ok) {
      return jsonResponse(
        {
          ok: false,
          provider: "gemini",
          model,
          configured: true,
          error: "Gemini request failed"
        },
        { status: 502 }
      );
    }

    const payload = await response.json();
    const responsePreview = extractGeminiText(payload);
    const testPassed = responsePreview.includes("GEMINI_OK");

    return jsonResponse({
      ok: true,
      provider: "gemini",
      model,
      configured: true,
      test_passed: testPassed,
      response_preview: responsePreview.slice(0, 80)
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
