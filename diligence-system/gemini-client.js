import crypto from "crypto";

export function buildPool({ keys = "", models = "", defaults = [] } = {}) {
  return {
    keys: uniqueCsv(keys),
    models: uniqueCsv(models).length ? uniqueCsv(models) : defaults
  };
}

export async function callGeminiClient({ key, model, systemPrompt, userPrompt, responseMimeType = "application/json", temperature = 0, maxOutputTokens = 65535, timeoutMs = 240000 } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
    const response = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { temperature, maxOutputTokens, responseMimeType }
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error?.message || `GEMINI_HTTP_${response.status}`);
    return payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
  } finally {
    clearTimeout(timeout);
  }
}

export function fingerprint(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex").slice(0, 12);
}

export function uniqueCsv(value) {
  return Array.from(new Set(String(value || "").split(",").map((x) => x.trim()).filter(Boolean)));
}
