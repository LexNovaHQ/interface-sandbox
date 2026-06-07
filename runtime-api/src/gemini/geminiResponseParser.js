export function extractGeminiText(payload = {}) {
  const candidates = Array.isArray(payload.candidates) ? payload.candidates : [];
  const parts = candidates
    .flatMap((candidate) => candidate?.content?.parts || [])
    .map((part) => part?.text)
    .filter((text) => typeof text === "string" && text.trim());

  return parts.join("\n").trim();
}

function stripJsonFence(text) {
  return String(text || "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function sliceLikelyJson(text) {
  const cleaned = stripJsonFence(text);
  const objectStart = cleaned.indexOf("{");
  const arrayStart = cleaned.indexOf("[");
  const starts = [objectStart, arrayStart].filter((index) => index >= 0);
  if (!starts.length) return cleaned;

  const start = Math.min(...starts);
  const objectEnd = cleaned.lastIndexOf("}");
  const arrayEnd = cleaned.lastIndexOf("]");
  const end = Math.max(objectEnd, arrayEnd);
  if (end <= start) return cleaned;
  return cleaned.slice(start, end + 1).trim();
}

export function parseJsonFromGeminiText(text) {
  const raw_text = String(text || "").trim();
  const likely_json = sliceLikelyJson(raw_text);
  try {
    return {
      ok: true,
      json: JSON.parse(likely_json),
      raw_text,
      repaired: likely_json !== raw_text
    };
  } catch (error) {
    return {
      ok: false,
      json: null,
      raw_text,
      likely_json,
      error: error?.message || String(error)
    };
  }
}

export function parseGeminiJsonPayload(payload = {}) {
  const text = extractGeminiText(payload);
  const parsed = parseJsonFromGeminiText(text);
  return {
    ...parsed,
    usage_metadata: payload.usageMetadata || null,
    finish_reason: payload.candidates?.[0]?.finishReason || null,
    grounding_metadata: payload.candidates?.[0]?.groundingMetadata || null
  };
}
